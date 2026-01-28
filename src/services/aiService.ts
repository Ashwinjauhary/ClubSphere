// This service now connects to Sambanova AI (OpenAI Compatible)
import type { AIAnalysisResult } from '../types';

const SAMBANOVA_API_KEY = import.meta.env.VITE_SAMBANOVA_API_KEY || "";

if (!SAMBANOVA_API_KEY) {
    console.warn("Missing VITE_SAMBANOVA_API_KEY in .env file");
}

const BASE_URL = "https://api.sambanova.ai/v1/chat/completions";
const MODEL_NAME = "ALLaM-7B-Instruct-preview";

// Generic Helper for Sambanova Calls
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callSambaNovaAPI(systemPrompt: string, userPrompt: string, temperature: number = 0.5, maxRetries: number = 3): Promise<string> {
    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ];

    const requestBody = {
        model: MODEL_NAME,
        messages: messages,
        temperature: temperature, // Use provided temperature (default 0.5)
        top_p: 0.1, // Restrict token reuse
        stop: ["<|eot_id|>", "<|end_of_text|>"], // Ensure it stops
        max_tokens: 1000 // Ensure response is not truncated
    };

    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SAMBANOVA_API_KEY}`
                },
                body: JSON.stringify(requestBody)
            });

            if (response.status === 429) {
                console.warn(`Sambanova rate limit hit (429).`);
                attempt++;
                const waitTime = 2000 * Math.pow(1.5, attempt);
                await sleep(waitTime);
                continue;
            }

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Sambanova API Error: ${response.status} - ${err}`);
            }

            const data = await response.json();

            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content.trim();
            } else {
                throw new Error("Invalid Sambanova Response Structure");
            }

        } catch (error) {
            console.warn("Sambanova Call Failed:", error);
            attempt++;
            if (attempt >= maxRetries) throw error;
            await sleep(1000 * attempt);
        }
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
        // Remove any trailing commas which might break JSON
        clean = clean.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        return JSON.parse(clean);
    } catch (e) {
        console.warn("Initial JSON Parse Failed, retrying sanitizer...", clean.substring(0, 100));
        // Fallback: Try to escape unescaped control characters within strings
        const sanitized = clean.replace(/[\u0000-\u0019]+/g, "");
        try {
            return JSON.parse(sanitized);
        } catch (e2) {
            console.warn("JSON Parse Failed", clean);
            throw e2;
        }
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

    const text = await callSambaNovaAPI(systemPrompt, userPrompt);
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

    return await callSambaNovaAPI(systemPrompt, userPrompt);
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

    return await callSambaNovaAPI(systemPrompt, userPrompt);
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

    const text = await callSambaNovaAPI(systemPrompt, userPrompt);
    return cleanAndParseJSON(text);
};

export const generateFormSchema = async (
    userPrompt: string
): Promise<{ title: string; description: string; theme: string; settings: any; questions: any[]; isFallback?: boolean }> => {
    console.log("Generating full form schema for:", userPrompt);
    const systemPrompt = "You are an expert form builder. You must output ONLY valid JSON. Do not deviate. Do not loop.";
    const userPromptText = `
    Create a form schema for: "${userPrompt}".
    
    Strictly follow this JSON structure. Do not add extra fields. 
    If the user specifies a number of questions, respect it (max 15). Otherwise generate 5-7 questions.
    
    {
      "title": "Title",
      "description": "Description",
      "theme": "classic-blue", 
      "settings": {
        "limit_one_response_per_user": false,
        "accepting_responses": true,
        "thank_you_message": "Thank you!"
      },
      "questions": [
        { "id": "q1", "type": "text", "label": "Name", "required": true }
      ]
    }
    
    Supported Question Types: text, textarea, number, email, date, single_choice, multiple_choice, dropdown, rating, file_upload.
    
    CRITICAL: 
    1. Output strictly valid JSON. 
    2. No markdown. No code blocks.
    3. NO infinite loops.
    `;

    try {
        const text = await callSambaNovaAPI(systemPrompt, userPromptText, 0.7, 3);
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
            let chunks = userPrompt.split(/[\n]|\s{2,}|\t|•/).map(l => l.trim()).filter(l => l.length > 2);
            if (chunks.length < 3) {
                chunks = userPrompt.split(/[\n,;]|\s{2,}|\t|•/).map(l => l.trim()).filter(l => l.length > 2);
            }
            const extractedQuestions: any[] = [];

            chunks.forEach((line, idx) => {
                if (line.length > 140) return;
                if (line.includes("Create") || line.startsWith("Tone") || line.startsWith("CTA") || line.startsWith("Note")) return;

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
                    if (lower.includes("year")) options = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
                    if (lower.includes("branch")) options = ["CSE", "ECE", "ME", "Civil", "Other"];
                    if (lower.includes("interest")) options = ["Technical", "Management", "Design", "Content"];
                }
                else if (lower.includes("experience") || lower.includes("why") || lower.includes("message") || lower.includes("short answer")) type = "textarea";

                if (!line.includes("?")) {
                    let label = line.replace(/[:*•-]/g, "").trim();
                    if (label.toLowerCase().startsWith("include")) return;
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

    const text = await callSambaNovaAPI(systemPrompt, userPrompt);
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

export const generateEventIdeas = async (
    clubName: string,
    clubCategory: string,
    clubDescription: string,
    customPrompt?: string
): Promise<any[]> => {
    const randomSeed = Math.floor(Math.random() * 1000000);
    const existingEvents = getEventHistory(clubName);

    const creativeDirections = [
        "Focus on futuristic and cutting-edge technology.",
        "Focus on community building and social impact.",
        "Focus on hands-on practical skills and workshops.",
        "Focus on fun, relaxation, and team bonding.",
        "Focus on career development and industry networking.",
        "Focus on interdisciplinary collaboration.",
        "Focus on competitive challenges and hackathons.",
        "Focus on sustainability and eco-friendly initiatives."
    ];
    const randomDirection = creativeDirections[Math.floor(Math.random() * creativeDirections.length)];
    const uniqueSeed = `${Date.now()}-${randomSeed}`;

    console.log("Generating event ideas for:", clubName, "Seed:", uniqueSeed, "Direction:", randomDirection);

    const bannedTerms = ["CodeCraft", "Tech Trek", "TechTrek", "Code Quest", "Coding Olympics", "Hackathon", "Marathon", "Symposium"];
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const forbiddenLetter = letters[Math.floor(Math.random() * letters.length)];

    // Updated prompt for conciseness
    const systemPrompt = `You are a creative director. Brainstorm UNIQUE and UNCONVENTIONAL event ideas. 
    You are FORBIDDEN from using these overused words/titles: ${bannedTerms.join(", ")}.
    Be unpredictable but CONCISE. Output must be valid, complete JSON. Do not cut off.`;

    const userPrompt = `
    Request ID: ${uniqueSeed}
    
    Club Name: ${clubName}
    Category: ${clubCategory}
    Mission: ${clubDescription}
    
    CREATIVE DIRECTION: ${randomDirection}
    CHAOS CONSTRAINT: Do not start any event title with the letter '${forbiddenLetter}'.
    
    PREVIOUSLY GENERATED IDEAS (ABSOLUTELY DO NOT REPEAT):
    ${existingEvents.join(", ")}

    ${customPrompt ? `THE USER HAS A SPECIFIC REQUEST: "${customPrompt}".` : ''}
    ${customPrompt ? `Generate 3 tailored event ideas.` : `Suggest 3 unique, high-engagement event ideas. Make them distinct from each other. Do NOT use generic names.`}
    
    CRITICAL INSTRUCTIONS:
    1. Output strictly valid, COMPLETE JSON.
    2. Keep descriptions under 30 words to save tokens.
    3. Detailed breakdown: Objectives, Rounds, Rules (Keep brief).
    4. EVENT TYPE MUST BE ONE OF: "Technical", "Cultural", "Academic", "Sports", "Other".
    5. Include 'registration_fields'.
    6. Ensure the ideas are DIVERSE.

    Return ONLY JSON (No markdown):
    [
      {
        "title": "Unique Title",
        "description": "Short summary.",
        "objectives": ["Obj 1"],
        "structure_rounds": [{ "round_name": "R1", "description": "Brief desc", "duration": "30m" }],
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
        // Increased max_tokens to ensuring completion
        const text = await callSambaNovaAPI(systemPrompt, userPrompt, 1.0, 3);
        const events = cleanAndParseJSON(text);

        if (Array.isArray(events)) {
            saveEventHistory(clubName, events);
            return events;
        }
        throw new Error("Invalid response format");
    } catch (error) {
        console.error("AI Generation Failed:", error);
        throw error; // Re-throw to let the UI handle it (show error toast instead of fake data)
    }
};
