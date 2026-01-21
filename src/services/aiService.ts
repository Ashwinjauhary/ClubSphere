// This service now connects to Google Gemini API (Flash 2.0 Lite Preview)
import type { AIAnalysisResult } from '../types';

const GEMINI_API_KEYS = (import.meta.env.VITE_GEMINI_API_KEY || "").split(',').map((k: string) => k.trim()).filter((k: string) => k);

if (GEMINI_API_KEYS.length === 0) {
    console.warn("Missing VITE_GEMINI_API_KEY in .env file");
}

const BASE_URL_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-preview-02-05:generateContent?key=";

// Generic Helper for Gemini Calls (Replaces SambaNova)
// Generic Helper for Gemini Calls (Replaces SambaNova)
// Generic Helper for Gemini Calls (Replaces SambaNova)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generic Helper for Gemini Calls (Replaces SambaNova)
async function callGeminiAPI(systemPrompt: string, userPrompt: string, temperature: number = 0.7, maxRetries: number = 5): Promise<string> {
    // Combine System & User Prompt for Gemini (Simple Text Mode)
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const requestBody = {
        contents: [{
            parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
            temperature: temperature,
            topP: 0.9,
            maxOutputTokens: 2048,
        }
    };

    let attempt = 0;

    while (attempt < maxRetries) {
        // Try each key in rotation
        for (const apiKey of GEMINI_API_KEYS) {
            try {
                const response = await fetch(`${BASE_URL_TEMPLATE}${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (response.status === 429) {
                    console.warn(`Key ${apiKey.substring(0, 5)}... hit rate limit (429).`);
                    continue; // Try next key
                }

                if (!response.ok) {
                    const err = await response.text();
                    throw new Error(`Gemini API Error: ${response.status} - ${err}`);
                }

                const data = await response.json();

                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    return data.candidates[0].content.parts[0].text;
                } else {
                    throw new Error("Invalid Gemini Response Structure");
                }

            } catch (error) {
                // For any error (network, 500, etc.), we continue to the next key just in case
                console.warn("Gemini Call Failed:", error);
                continue;
            }
        }

        // If we finished a full pass of ALL keys and still no result:
        attempt++;
        // Use exponential backoff
        const waitTime = 2000 * Math.pow(1.5, attempt);
        console.warn(`All keys exhausted/busy. Waiting ${Math.round(waitTime / 1000)}s before retry cycle ${attempt}/${maxRetries} to clear rate limits...`);
        await sleep(waitTime);
    }

    throw new Error("Unable to connect to AI after multiple attempts. Please try again later.");
}

// Helper to clean and parse AI JSON response
const cleanAndParseJSON = (text: string): any => {
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Find the first outer bracket/brace
    const firstChar = clean.match(/^[\s\n]*([{\[])/);
    if (firstChar) {
        const start = clean.indexOf(firstChar[1]);
        const endChar = firstChar[1] === '{' ? '}' : ']';
        const end = clean.lastIndexOf(endChar);
        if (end > start) {
            clean = clean.substring(start, end + 1);
        }
    }

    try {
        return JSON.parse(clean);
    } catch (e) {
        // Fallback: Try to escape unescaped control characters within strings
        // console.warn("JSON Parse failed, attempting to sanitize...", e);
        const sanitized = clean.replace(/[\u0000-\u0019]+/g, "");
        return JSON.parse(sanitized);
    }
};

// --- Exported Functions ---

export const analyzeReportWithAI = async (reportText: string): Promise<AIAnalysisResult> => {
    console.log("Analyzing report with AI...");
    const systemPrompt = "You are a senior event analyst for a top-tier consulting firm.";
    const userPrompt = `
    Your task is to generate a comprehensive, 12-page level "Enterprise Performance Report" based on the raw event summary below.
    The content MUST be verbose, professional, and detailed. Do not summarize; expand.
    
    Raw Event Summary: "${reportText}"

    Return ONLY a valid JSON object with the following detailed structure:
    {
      "summary": "A detailed 2-paragraph executive summary highlighting key outcomes and business value.",
      "impactScore": 8, // Integer 1-10
      "sentiment": "positive", // 'positive', 'neutral', 'negative'
      "introduction": "A 150-word introduction setting the context, club mission alignment, and event significance.",
      "objectivesContent": "A detailed breakdown of 3-4 key objectives and how they were met. Use professional language.",
      "impactAnalysis": "A 200-word deep dive into the impact. Discuss qualitative and quantitative metrics, community engagement, and brand value.",
      "strengths": ["Strength 1 (Detailed sentence)", "Strength 2 (Detailed sentence)", "Strength 3 (Detailed sentence)"],
      "improvements": ["Challenge 1 with mitigation strategy", "Challenge 2 with mitigation strategy", "Challenge 3 with mitigation strategy"],
      "strategicRoadmap": [
         "Immediate: [Actionable item for next week]",
         "Short-term: [Actionable item for next month]",
         "Long-term: [Strategic goal for next year]"
      ],
      "metricsAnalysis": "A paragraph analyzing the attendance and budget efficiency."
    }
    No markdown formatting. Pure JSON.
    `;

    // No try-catch -> Let it fail if AI is down (User requested "No Demo")
    const text = await callGeminiAPI(systemPrompt, userPrompt);
    return cleanAndParseJSON(text);
};

export const generateEventDescription = async (
    title: string,
    date: string,
    venue: string,
    eventType: string
): Promise<string> => {
    console.log("Generating event description...", title);
    const systemPrompt = "You are an expert copywriter for student club events.";
    const userPrompt = `
    Write an engaging, exciting, and professional event description (approx 100-150 words) for:
    
    Event Title: ${title}
    Date: ${date}
    Venue: ${venue}
    Type: ${eventType}

    The tone should be energetic, inviting, and emphasize the value of attending. 
    Use bullet points for key highlights if appropriate.
    Return ONLY the plain text description. Do not include a title or markdown wrapper like "Here is the description".
    `;

    // No fallback
    return await callGeminiAPI(systemPrompt, userPrompt);
};

export const generateClubBio = async (
    name: string,
    category: string,
    mission: string
): Promise<string> => {
    console.log("Generating club bio...", name);
    const systemPrompt = "You are a professional profile writer for student organizations.";
    const userPrompt = `
    Write a compelling and professional "About Us" bio (approx 100 words) for a club named "${name}".
    
    Category: ${category}
    Mission/Goal: ${mission}

    The bio should highlight the club's vision, what members can expect, and why students should join.
    Return ONLY the plain text bio.
    `;

    // No fallback
    return await callGeminiAPI(systemPrompt, userPrompt);
};

export const generateFeedbackForm = async (
    eventTitle: string,
    eventType: string,
    topic: string
): Promise<any[]> => {
    console.log("Generating feedback form questions for:", eventTitle);
    const systemPrompt = "You are an expert survey designer for university events.";
    const userPrompt = `
    Create a JSON array of 5 feedback questions for an event titled "${eventTitle}" (${eventType}) about "${topic}".
    
    The questions should be a mix of:
    - Rating (1-5 stars)
    - Text (Open-ended)
    - Single Choice (Yes/No or specific options)
    
    Return ONLY a valid JSON array of objects with this structure:
    [
      { "id": "q1", "type": "rating", "label": "How clearly were the concepts explained?", "required": true },
      { "id": "q2", "type": "text", "label": "What was your key takeaway?", "required": false },
      { "id": "q3", "type": "single_choice", "label": "Would you attend a follow-up?", "required": true, "options": ["Yes", "Maybe", "No"] }
    ]
    
    Ensure IDs are unique strings. No markdown code blocks. Pure JSON.
    `;

    // No fallback
    const text = await callGeminiAPI(systemPrompt, userPrompt);
    return cleanAndParseJSON(text);
};

export const generateFormSchema = async (
    userPrompt: string
): Promise<{ title: string; description: string; theme: string; settings: any; questions: any[]; isFallback?: boolean }> => {
    console.log("Generating full form schema for:", userPrompt);
    const systemPrompt = "You are an expert form builder and survey designer.";
    const userPromptText = `
    Based on this request: "${userPrompt}", create a complete form structure.
    
    Return ONLY a valid JSON object with this structure:
    {
      "title": "Professional Form Title",
      "description": "A welcoming description encouraging users to fill the form.",
      "theme": "classic-blue", 
      "settings": {
        "limit_one_response_per_user": false,
        "accepting_responses": true,
        "thank_you_message": "Thank you for your submission!"
      },
      "questions": [
        { "id": "q1", "type": "text", "label": "Full Name", "required": true },
        { "id": "q2", "type": "single_choice", "label": "Department", "required": true, "options": ["HR", "IT", "Sales"] },
        { "id": "q3", "type": "file_upload", "label": "Upload Resume", "required": true, "accept_file_types": [".pdf", ".docx"] }
      ]
    }
    
    Supported Themes: 'classic-blue', 'modern-purple', 'fresh-green', 'warm-orange', 'professional-gray', 'elegant-pink'.
    Supported Question Types: text, textarea, number, email, date, single_choice, multiple_choice, dropdown, rating, file_upload, description.

    Ensure IDs are unique strings. NO markdown code blocks. Pure JSON.
    `;

    // Fast fail with Smart Fallback
    try {
        const text = await callGeminiAPI(systemPrompt, userPromptText, 0.7, 5);
        return { ...cleanAndParseJSON(text), isFallback: false };
    } catch (e) {
        console.warn("AI Form Gen failed, using Smart Fallback");

        const p = userPrompt.toLowerCase();
        let schema = {
            title: "New Form",
            description: "Please fill out this form.",
            theme: "classic-blue",
            isFallback: false,
            settings: { limit_one_response_per_user: false, accepting_responses: true, thank_you_message: "Thank you!" },
            questions: [] as any[]
        };

        if (p.includes("feedback") || p.includes("survey") || p.includes("review")) {
            schema.title = "Event Feedback Survey";
            schema.description = "We value your feedback! Please help us improve.";
            schema.questions = [
                { id: "f1", type: "rating", label: "How would you rate the event?", required: true },
                { id: "f2", type: "text", label: "What did you like most?", required: true },
                { id: "f3", type: "text", label: "Any suggestions for improvement?", required: false }
            ];
        } else if (p.includes("quiz") || p.includes("test") || p.includes("exam")) {
            schema.title = "Knowledge Quiz";
            schema.description = "Test your knowledge!";
            schema.questions = [
                { id: "q1", type: "single_choice", label: "Question 1", options: ["Option A", "Option B"], required: true },
                { id: "q2", type: "single_choice", label: "Question 2", options: ["True", "False"], required: true },
                { id: "q3", type: "text", label: "Explain your answer", required: true }
            ];
        } else if (p.includes("contact") || p.includes("support")) {
            schema.title = "Contact Us";
            schema.description = "Get in touch with our team.";
            schema.questions = [
                { id: "c1", type: "text", label: "Full Name", required: true },
                { id: "c2", type: "email", label: "Email Address", required: true },
                { id: "c3", type: "textarea", label: "Message", required: true }
            ];
        } else {
            // DYNAMIC FALLBACK: Try to extract fields from prompt
            // 1. Try splitting by consistent delimiters first (Newlines, Double Spaces, Bullets, Tabs)
            let chunks = userPrompt.split(/[\n]|\s{2,}|\t|•/).map(l => l.trim()).filter(l => l.length > 2);

            // 2. If that gave us nothing (e.g. user typed a comma separated list), then try comma/semicolon
            if (chunks.length < 3) {
                chunks = userPrompt.split(/[\n,;]|\s{2,}|\t|•/).map(l => l.trim()).filter(l => l.length > 2);
            }
            const extractedQuestions: any[] = [];

            chunks.forEach((line, idx) => {
                // Relaxed length limit to 140 to catch fields like "Area of Interest (Design, Tech...)"
                if (line.length > 140) return;

                // Stop phrases often found in prompts
                if (line.includes("Create") || line.startsWith("Tone") || line.startsWith("CTA") || line.startsWith("Note") || line.startsWith("The design") || line.startsWith("The overall")) return;

                const lower = line.toLowerCase();
                let type = "text";
                let options: string[] | undefined = undefined;

                if (lower.includes("email")) type = "email";
                else if (lower.includes("date") || lower.includes("dob")) type = "date";
                else if (lower.includes("number") || lower.includes("phone")) type = "number";
                else if (lower.includes("availability")) {
                    type = "single_choice";
                    options = ["Full-time", "Part-time", "Weekends Only"];
                }
                else if (lower.includes("interest") || lower.includes("branch") || lower.includes("year") || lower.includes("department")) {
                    type = "single_choice";
                    options = ["Option 1", "Option 2", "Option 3", "Option 4"];

                    // Smart Options for Branch/Year
                    if (lower.includes("year")) options = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
                    if (lower.includes("branch")) options = ["CSE", "ECE", "ME", "Civil", "Other"];
                    if (lower.includes("interest")) options = ["Technical", "Management", "Design", "Content"];
                }
                else if (lower.includes("experience") || lower.includes("why") || lower.includes("message") || lower.includes("short answer")) type = "textarea";

                // If line looks like a field name (short, no punctuation at end usually)
                if (!line.includes("?")) {
                    let label = line.replace(/[:*•-]/g, "").trim();
                    if (label.toLowerCase().startsWith("include")) return; // Skip "Include the following"

                    extractedQuestions.push({
                        id: `auto_${idx}`,
                        type,
                        label: label,
                        required: true,
                        options
                    });
                }
            });

            if (extractedQuestions.length > 0) {
                schema.title = "Custom Form";
                schema.description = "Generated based on your requirements.";
                schema.questions = extractedQuestions;
            } else {
                // Absolute Fallback / Registration
                schema.title = "Registration Form";
                schema.description = "Register for our upcoming event.";
                schema.questions = [
                    { id: "r1", type: "text", label: "Full Name", required: true },
                    { id: "r2", type: "email", label: "Email Address", required: true },
                    { id: "r3", type: "single_choice", label: "Year of Study", options: ["1st Year", "2nd Year", "3rd Year", "4th Year"], required: true }
                ];
            }
        }

        return { ...schema, isFallback: true };
    }
};

export const suggestPOMapping = async (
    title: string,
    description: string
): Promise<Record<string, boolean>> => {
    console.log("Analyzing PO Mapping for:", title);
    const systemPrompt = "You are an academic accreditation expert.";
    const userPrompt = `
    Analyze the following event and identify which Program Outcomes (POs) it maps to.
    
    Event: ${title}
    Description: ${description}

    Program Outcomes (IDs):
    - PO1: Engineering Knowledge
    - PO2: Problem Analysis
    - PO3: Design/Development of Solutions
    - PO4: Conduct Investigations of Complex Problems
    - PO5: Modern Tool Usage
    - PO6: The Engineer and Society
    - PO7: Environment and Sustainability
    - PO8: Ethics
    - PO9: Individual and Team Work
    - PO10: Communication
    - PO11: Project Management and Finance
    - PO12: Life-long Learning

    Return ONLY a JSON object where keys are "PO1" to "PO12" and values are booleans (true if relevant, false otherwise).
    Example: { "PO1": true, "PO2": false ... }
    Do not include markdown.
    `;

    const text = await callGeminiAPI(systemPrompt, userPrompt);
    return cleanAndParseJSON(text);
};



// Helper to manage event history
const getEventHistory = (clubName: string): string[] => {
    try {
        const history = localStorage.getItem(`ai_event_history_${clubName}`);
        return history ? JSON.parse(history) : [];
    } catch (e) { return []; }
};

const saveEventHistory = (clubName: string, newEvents: any[]) => {
    try {
        const history = getEventHistory(clubName);
        const newTitles = newEvents.map((e: any) => e.title);
        // Keep last 50 events to avoid unlimited growth
        const updated = [...new Set([...history, ...newTitles])].slice(-50);
        localStorage.setItem(`ai_event_history_${clubName}`, JSON.stringify(updated));
    } catch (e) { console.warn("Failed to save event history", e); }
};

// Fallback templates removed in favor of Procedural Generator

export const generateEventIdeas = async (
    clubName: string,
    clubCategory: string,
    clubDescription: string,
    customPrompt?: string
): Promise<any[]> => {
    // Random seed to ensure uniqueness every single time
    const randomSeed = Math.floor(Math.random() * 1000000);
    const existingEvents = getEventHistory(clubName);

    console.log("Generating event ideas for:", clubName, "Seed:", randomSeed, "Ignoring:", existingEvents.length);

    const systemPrompt = "You are a creative director. Brainstorm UNIQUE event ideas. OUTPUT VALID JSON ONLY. Escape all special characters.";
    const userPrompt = `
    Request ID: ${randomSeed}
    
    Club Name: ${clubName}
    Category: ${clubCategory}
    Mission: ${clubDescription}
    
    PREVIOUSLY GENERATED IDEAS (DO NOT REPEAT THESE):
    ${existingEvents.join(", ")}

    ${customPrompt ? `THE USER HAS A SPECIFIC REQUEST: "${customPrompt}".` : ''}
    ${customPrompt ? `Generate 3 tailored event ideas.` : `Suggest 3 unique, high-engagement event ideas. AVOID GENERIC IDEAS.`}
    
    CRITICAL INSTRUCTIONS:
    1. Output strictly valid JSON.
    2. No unescaped newlines inside strings. Use \\n.
    3. Detailed breakdown: Objectives, Rounds, Rules.
    4. EVENT TYPE MUST BE ONE OF: "Technical", "Cultural", "Academic", "Sports", "Other".
    5. Include 'registration_fields'.

    Return ONLY JSON (No markdown):
    [
      {
        "title": "Unique Title",
        "description": "Summary.",
        "objectives": ["Obj 1"],
        "structure_rounds": [{ "round_name": "R1", "description": "Desc", "duration": "30m" }],
        "rules": ["Rule 1"],
        "registration_fields": [{ "label": "Name", "type": "text", "required": true }],
        "event_type": "Technical",
        "target_audience": "All",
        "difficulty_level": "Medium",
        "expected_attendees": 50,
        "estimated_budget": 1000,
        "duration_hours": 2
      }
    ]
    `;

    try {
        // Lowered temp slightly to 0.9 for better JSON stability while keeping creativity
        // Limit retries to 5 to give backoff a chance
        const text = await callGeminiAPI(systemPrompt, userPrompt, 0.9, 5);
        const events = cleanAndParseJSON(text);

        // Save new ideas to history
        if (Array.isArray(events)) {
            saveEventHistory(clubName, events);
        }

        return events;
    } catch (error) {
        console.warn("AI failed, switching to Procedural Generator", error);

        // Procedural Fallback: Generate unique events locally
        const adjectives = ["Advanced", "Creative", "Intensive", "Global", "Future", "Smart", "Eco", "Tech", "Innovate", "Code"];
        const nouns = ["Hackathon", "Summit", "Workshop", "Challenge", "Symposium", "Sprint", "Expo", "Marathon", "Bootcamp", "Quest"];
        const themes = ["AI", "Blockchain", "Sustainability", "Cybersecurity", "IoT", "Robotics", "Design", "Fintech", "HealthTech", "EdTech"];

        const generateIdea = () => {
            const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const noun = nouns[Math.floor(Math.random() * nouns.length)];
            const theme = themes[Math.floor(Math.random() * themes.length)];
            return {
                title: `${adj} ${theme} ${noun}`,
                description: `An immersive event focusing on ${theme} technologies. Participants will engage in hands-on activities to master ${adj.toLowerCase()} concepts.`,
                objectives: [`Learn core ${theme} principles`, `Build a ${adj} project`, "Network with peers"],
                structure_rounds: [
                    { round_name: "Round 1: Ideation", description: "Brainstorming session", duration: "1h" },
                    { round_name: "Round 2: Prototype", description: "Building the solution", duration: "3h" }
                ],
                rules: ["Teams of 2-4", "Original work only", "Bring your own laptop"],
                registration_fields: [{ label: "Team Name", type: "text", required: true }],
                event_type: ["Technical", "Academic", "Other"][Math.floor(Math.random() * 3)],
                target_audience: "Students",
                difficulty_level: ["Easy", "Medium", "Hard"][Math.floor(Math.random() * 3)],
                expected_attendees: 50 + Math.floor(Math.random() * 100),
                estimated_budget: 500 + Math.floor(Math.random() * 1000),
                duration_hours: 4 + Math.floor(Math.random() * 4)
            };
        };

        const fallbackEvents = [generateIdea(), generateIdea(), generateIdea()];
        saveEventHistory(clubName, fallbackEvents);
        return fallbackEvents;
    }
};
