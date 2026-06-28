// @ts-nocheck

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL_MAPPING = {
    events: "llama-3.1-8b-instant",
    reports: "llama-3.3-70b-versatile",
    forms: "llama-3.3-70b-versatile",
    quiz: "llama-3.3-70b-versatile"
};

// Circuit Breaker State (In-Memory per V8 isolate)
interface AccountHealth {
    isHealthy: boolean;
    unhealthyUntil: number; // Timestamp
}

// Map key -> Health state
const circuitBreaker = new Map<string, AccountHealth>();

const PENALTY_MS = 60000; // 60 seconds penalty for failed keys
const REQUEST_TIMEOUT_MS = 15000; // 15 seconds max per request

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

async function callGroqWithAdvancedFailover(service: string, payload: any, maxRetries = 3) {
    // Keys: [Primary, Secondary 1, Secondary 2]
    const keys = [
        Deno.env.get(`GROQ_${service.toUpperCase()}_KEY_1`),
        Deno.env.get(`GROQ_${service.toUpperCase()}_KEY_2`),
        Deno.env.get(`GROQ_${service.toUpperCase()}_KEY_3`),
    ].filter(Boolean) as string[];

    if (keys.length === 0) {
        throw new Error(`No Groq API keys found for service: ${service}`);
    }

    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
        // Determine which keys are healthy
        const now = Date.now();
        
        // Always try to use Key 1 (Primary) if it's healthy or has recovered
        let selectedKeyIndex = -1;
        
        const primaryHealth = circuitBreaker.get(keys[0]);
        if (!primaryHealth || primaryHealth.isHealthy || now >= primaryHealth.unhealthyUntil) {
            selectedKeyIndex = 0; // Primary is ready
        } else {
            // Primary is dead, pick a random secondary key (B or C) that is healthy
            const availableSecondaries = [];
            for (let i = 1; i < keys.length; i++) {
                const health = circuitBreaker.get(keys[i]);
                if (!health || health.isHealthy || now >= health.unhealthyUntil) {
                    availableSecondaries.push(i);
                }
            }
            
            if (availableSecondaries.length > 0) {
                // Pick randomly between available secondaries (B or C)
                selectedKeyIndex = availableSecondaries[Math.floor(Math.random() * availableSecondaries.length)];
            } else {
                // ALL keys are dead. We are forced to try the primary again or the one closest to recovery.
                // To keep it simple, just default to primary to force a check, or wait.
                selectedKeyIndex = 0;
            }
        }

        const apiKey = keys[selectedKeyIndex];
        
        try {
            console.log(`[Groq Proxy] Service: ${service} | Using Key Index: ${selectedKeyIndex} | Attempt: ${attempt + 1}`);
            
            const response = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload)
            }, REQUEST_TIMEOUT_MS);

            if (response.ok) {
                // Mark key as healthy!
                circuitBreaker.set(apiKey, { isHealthy: true, unhealthyUntil: 0 });
                return await response.json();
            }

            const errorText = await response.text();
            
            // Rate Limited (429) or Server Error (5xx)
            if (response.status === 429 || response.status >= 500) {
                console.warn(`[Groq Proxy] Key ${selectedKeyIndex} failed (${response.status}). Tripping circuit breaker...`);
                lastError = new Error(`HTTP ${response.status}: ${errorText}`);
                
                // Trip circuit breaker
                circuitBreaker.set(apiKey, { isHealthy: false, unhealthyUntil: Date.now() + PENALTY_MS });
                
                attempt++;
                const backoffMs = Math.pow(2, attempt - 1) * 1000;
                await delay(backoffMs);
                continue;
            }

            // Client errors (400, 401) don't trigger failover because the prompt/key is invalid
            throw new Error(`HTTP ${response.status}: ${errorText}`);
            
        } catch (error: any) {
            console.warn(`[Groq Proxy] Key ${selectedKeyIndex} encountered network/timeout error. Tripping circuit breaker...`);
            lastError = error;
            
            // Do not retry bad requests or auth failures
            if (error.message?.includes("HTTP 400") || error.message?.includes("HTTP 401")) {
                throw error;
            }
            
            // Trip circuit breaker for timeout/network error
            circuitBreaker.set(apiKey, { isHealthy: false, unhealthyUntil: Date.now() + PENALTY_MS });
            
            attempt++;
            const backoffMs = Math.pow(2, attempt - 1) * 1000;
            await delay(backoffMs);
        }
    }

    throw new Error(`Failed to generate response after ${maxRetries} attempts. Please try again later.`);
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { service, systemPrompt, userPrompt, temperature, maxTokens, responseFormat } = await req.json();

        if (!service || !systemPrompt || !userPrompt) {
            throw new Error("Missing required fields: service, systemPrompt, userPrompt");
        }

        const model = MODEL_MAPPING[service as keyof typeof MODEL_MAPPING] || "llama-3.1-8b-instant";

        const payload: any = {
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: temperature ?? 0.7,
        };

        if (maxTokens) {
            payload.max_completion_tokens = maxTokens;
        }

        if (responseFormat) {
            payload.response_format = { type: responseFormat };
        }

        const result = await callGroqWithAdvancedFailover(service, payload);
        const text = result.choices[0]?.message?.content || "";

        return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("[Groq Proxy] Error:", error);
        
        // Never leak backend logic/keys to frontend. Return a generic friendly error.
        const userFriendlyError = error.message.includes("Failed to generate response") || error.message.includes("HTTP 400") 
            ? error.message 
            : "The AI service is temporarily unavailable. Please try again in a moment.";

        return new Response(JSON.stringify({ error: userFriendlyError }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
