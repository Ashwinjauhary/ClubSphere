// This service now connects to Google Gemini API (Flash 1.5)
import type { AIAnalysisResult } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
if (!GEMINI_API_KEY) {
    console.warn("Missing VITE_GEMINI_API_KEY in .env file");
}

const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Circuit Breaker Key
const CIRCUIT_BREAKER_KEY = "ai_api_circuit_breaker_until";

// Generic Helper for Gemini Calls (Replaces SambaNova)
async function callGeminiAPI(systemPrompt: string, userPrompt: string, temperature: number = 0.7): Promise<string> {
    // 1. Check Circuit Breaker (Persistent)
    const circuitOpenUntil = parseInt(localStorage.getItem(CIRCUIT_BREAKER_KEY) || "0", 10);
    if (Date.now() < circuitOpenUntil) {
        throw new Error("Local Circuit Breaker: Skipping API call (Rate Limit Cooldown)");
    }

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

    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (response.status === 429) {
                // 2. Trip Circuit Breaker for 60 seconds (Persist to LocalStorage)
                const cooldownUntil = Date.now() + 60000;
                localStorage.setItem(CIRCUIT_BREAKER_KEY, cooldownUntil.toString());
                throw new Error("Rate limit exceeded (Circuit Breaker Tripped for 60s)");
            }

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Gemini API Error: ${response.status} - ${err}`);
            }

            const data = await response.json();

            // Extract text from Gemini response structure
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Invalid Gemini Response Structure");
            }

        } catch (error) {
            // Only retry for network/server errors, not rate limits
            if (i === maxRetries - 1 || (error as Error).message.includes("Rate limit") || (error as Error).message.includes("Circuit")) {
                if ((error as Error).message.includes("Rate limit") || (error as Error).message.includes("Circuit")) {
                    throw error;
                }
                console.warn("Gemini Call Failed:", error);
                throw error;
            }
        }
    }
    throw new Error("Gemini API unreachable");
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

    try {
        const text = await callGeminiAPI(systemPrompt, userPrompt);
        return cleanAndParseJSON(text);
    } catch (error) {
        console.error("AI Analysis Failed:", error);
        return {
            summary: "AI Analysis unavailable. Please review manually.",
            impactScore: 5,
            strengths: ["Could not analyze"],
            improvements: ["Try again later"],
            sentiment: 'neutral'
        } as any;
    }
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

    try {
        return await callGeminiAPI(systemPrompt, userPrompt);
    } catch (error) {
        return `Join us for ${title}, a ${eventType} taking place on ${date} at ${venue}. Don't miss this opportunity to learn, network, and have fun! (Fallback)`;
    }
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

    try {
        return await callGeminiAPI(systemPrompt, userPrompt);
    } catch (error) {
        return `${name} is a premier ${category} club dedicated to ${mission}. Join us to be part of a vibrant community! (Fallback)`;
    }
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

    try {
        const text = await callGeminiAPI(systemPrompt, userPrompt);
        return cleanAndParseJSON(text);
    } catch (error) {
        console.error("AI Form Generation Failed:", error);
        return [
            { id: "f1", type: "rating", "label": "How would you rate the event?", "required": true },
            { id: "f2", type: "text", "label": "Feedback", "required": false }
        ];
    }
};

export const generateFormSchema = async (
    userPrompt: string
): Promise<{ title: string; description: string; theme: string; settings: any; questions: any[] }> => {
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

    try {
        const text = await callGeminiAPI(systemPrompt, userPromptText);
        return cleanAndParseJSON(text);
    } catch (error) {

        // Dynamic Fallback based on prompt
        const fallbackTitle = userPrompt.length < 50 ? userPrompt.charAt(0).toUpperCase() + userPrompt.slice(1) : "Event Registration Form";

        return {
            title: fallbackTitle,
            description: `Registration form for ${fallbackTitle}. Please fill out the details below.`,
            theme: "classic-blue",
            settings: { limit_one_response_per_user: false, accepting_responses: true, thank_you_message: "Thank you for registering!" },
            questions: [
                { id: "f1", type: "text", label: "Full Name", required: true },
                { id: "f2", type: "text", label: "Email Address", required: true },
                { id: "f3", type: "text", label: "Phone Number", required: false },
                { id: "f4", type: "text", label: "Comments / Requirements", required: false }
            ]
        };
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

    try {
        const text = await callGeminiAPI(systemPrompt, userPrompt);
        return cleanAndParseJSON(text);
    } catch (error) {
        console.error("AI PO Mapping Failed:", error);
        return {};
    }
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

// Offline Fallback Event Templates (Expanded for Uniqueness)
const FALLBACK_EVENTS = [
    {
        title: "Tech Trivia Night",
        description: "A competitive evening of geeky trivia spanning coding, sci-fi, and internet culture.",
        objectives: ["Test knowledge", "Team bonding"],
        structure_rounds: [{ "round_name": "Rapid Fire", "description": "20 questions in 10 mins", "duration": "30m" }],
        rules: ["No phones", "Teams of 4"],
        registration_fields: [{ "label": "Team Name", "type": "text", "required": true }],
        event_type: "Technical",
        target_audience: "Tech Enthusiasts",
        difficulty_level: "Easy",
        expected_attendees: 40,
        estimated_budget: 200,
        duration_hours: 2
    },
    {
        title: "Alumni Fireside Chat",
        description: "Invite successful alumni to share their journey and industry insights.",
        objectives: ["Career guidance", "Networking"],
        structure_rounds: [{ "round_name": "Q&A", "description": "Open floor questions", "duration": "45m" }],
        rules: ["Respectful questions only"],
        registration_fields: [{ "label": "Question for Speaker", "type": "text", "required": false }],
        event_type: "Academic",
        target_audience: "All Students",
        difficulty_level: "Easy",
        expected_attendees: 60,
        estimated_budget: 100,
        duration_hours: 1.5
    },
    {
        title: "Speed Networking",
        description: "Fast-paced networking session where members rotate every 5 minutes.",
        objectives: ["Meet everyone", "Break ice"],
        structure_rounds: [{ "round_name": "Rotations", "description": "5 min chats", "duration": "1h" }],
        rules: ["Move when bell rings"],
        registration_fields: [{ "label": "LinkedIn Profile", "type": "url", "required": false }],
        event_type: "Cultural",
        target_audience: "New Members",
        difficulty_level: "Easy",
        expected_attendees: 50,
        estimated_budget: 50,
        duration_hours: 1
    },
    {
        title: "Designathon Sprint",
        description: "A 3-hour intense design challenge to solve a specific UI/UX problem.",
        objectives: ["Skill building", "Portfolio piece"],
        structure_rounds: [{ "round_name": "Design Phase", "description": "Create high-fidelity mockups", "duration": "2.5h" }],
        rules: ["Use Figma", "Submit PDF"],
        registration_fields: [{ "label": "Portfolio Link", "type": "url", "required": false }],
        event_type: "Technical",
        target_audience: "Designers",
        difficulty_level: "Medium",
        expected_attendees: 30,
        estimated_budget: 300,
        duration_hours: 3
    },
    {
        title: "Code & Coffee",
        description: "A relaxed morning session for students to work on personal projects together.",
        objectives: ["Community building", "Peer support"],
        structure_rounds: [{ "round_name": "Open Coding", "description": "Coworking time", "duration": "2h" }],
        rules: ["Bring your own mug"],
        registration_fields: [{ "label": "Project Topic", "type": "text", "required": false }],
        event_type: "Academic",
        target_audience: "Developers",
        difficulty_level: "Easy",
        expected_attendees: 20,
        estimated_budget: 50,
        duration_hours: 2
    },
    {
        title: "Startup Pitch Night",
        description: "Students pitch their startup ideas to a panel of mock investors.",
        objectives: ["Public speaking", "Entrepreneurship"],
        structure_rounds: [{ "round_name": "The Pitch", "description": "3 min pitch + 2 min Q&A", "duration": "1h" }],
        rules: ["No slides allowed"],
        registration_fields: [{ "label": "Startup Name", "type": "text", "required": true }],
        event_type: "Other",
        target_audience: "Entrepreneurs",
        difficulty_level: "Hard",
        expected_attendees: 40,
        estimated_budget: 100,
        duration_hours: 2
    },
    {
        title: "Open Mic Night",
        description: "A cultural evening showcasing music, poetry, and stand-up comedy.",
        objectives: ["Talent showcase", "Stress relief"],
        structure_rounds: [{ "round_name": "Performances", "description": "5 min slots", "duration": "1.5h" }],
        rules: ["Keep it clean"],
        registration_fields: [{ "label": "Performance Type", "type": "text", "required": true }],
        event_type: "Cultural",
        target_audience: "All Students",
        difficulty_level: "Medium",
        expected_attendees: 100,
        estimated_budget: 300,
        duration_hours: 2.5
    },
    {
        title: "Inter-Club Sports Day",
        description: "A friendly sports tournament competing against other university clubs.",
        objectives: ["Physical health", "Inter-club relations"],
        structure_rounds: [{ "round_name": "Matches", "description": "Football & Basketball", "duration": "3h" }],
        rules: ["Fair play"],
        registration_fields: [{ "label": "Sport Preference", "type": "single_choice", "required": true, "options": ["Football", "Basketball"] }],
        event_type: "Sports",
        target_audience: "Athletes",
        difficulty_level: "Medium",
        expected_attendees: 80,
        estimated_budget: 500,
        duration_hours: 4
    },
    {
        title: "Guest Lecture: Industry Trends",
        description: "An expert speaker discusses the latest trends in the industry.",
        objectives: ["Education", "Industry insight"],
        structure_rounds: [{ "round_name": "Keynote", "description": "Presentation", "duration": "1h" }],
        rules: ["Phones on silent"],
        registration_fields: [],
        event_type: "Academic",
        target_audience: "Major Students",
        difficulty_level: "Easy",
        expected_attendees: 100,
        estimated_budget: 200,
        duration_hours: 1.5
    },
    {
        title: "Hack The Campus",
        description: "A hackathon focused on solving problems specifically for the university campus.",
        objectives: ["Innovation", "Campus improvement"],
        structure_rounds: [{ "round_name": "Hacking", "description": "Build solutions", "duration": "6h" }],
        rules: ["Must use open data"],
        registration_fields: [{ "label": "Team Members", "type": "textarea", "required": true }],
        event_type: "Technical",
        target_audience: "All Students",
        difficulty_level: "Hard",
        expected_attendees: 50,
        estimated_budget: 800,
        duration_hours: 8
    }
];

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
        const text = await callGeminiAPI(systemPrompt, userPrompt, 0.9);
        const events = cleanAndParseJSON(text);

        // Save new ideas to history
        if (Array.isArray(events)) {
            saveEventHistory(clubName, events);
        }

        return events;

    } catch (error) {


        // Filter out previously seen fallback events to maintain "Uniqueness" illusion
        const availableFallbacks = FALLBACK_EVENTS.filter(
            e => !existingEvents.includes(e.title)
        );

        // If we ran out of fallbacks, just use all of them (better than nothing)
        const pool = availableFallbacks.length >= 3 ? availableFallbacks : FALLBACK_EVENTS;

        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);

        // Save these to history too so we don't repeat them immediately
        saveEventHistory(clubName, selected);

        return selected;
    }
};
