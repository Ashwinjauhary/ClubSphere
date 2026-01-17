// This service now connects to SambaNova Cloud (Llama 3.1)
// API Docs: https://cloud.sambanova.ai/apis

import type { AIAnalysisResult } from '../types';

const SAMBANOVA_API_KEY = "33c5af54-da1d-4a56-844a-7d8b8e104e0c";
const BASE_URL = "https://api.sambanova.ai/v1/chat/completions";
const MODEL = "Meta-Llama-3.1-8B-Instruct";

// Helper for caching
// Helper for caching (Removed as SambaNova has no free tier quota issues)

// Generic Helper for SambaNova Calls
async function callSambaNovaAPI(systemPrompt: string, userPrompt: string): Promise<string> {
    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ];

    // Prepare body. Note: response_format for JSON mode isn't standard in all v1 implementations yet,
    // so we rely on the prompt instructions mainly, but we can try adding it if needed.
    // Llama 3.1 is good at following "Return JSON" instructions.

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SAMBANOVA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: messages,
                temperature: 0.7,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`SambaNova API Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error("SambaNova Call Failed:", error);
        throw error;
    }
}

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
        const text = await callSambaNovaAPI(systemPrompt, userPrompt);
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
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
        return await callSambaNovaAPI(systemPrompt, userPrompt);
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
        return await callSambaNovaAPI(systemPrompt, userPrompt);
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
        const text = await callSambaNovaAPI(systemPrompt, userPrompt);
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
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
        const text = await callSambaNovaAPI(systemPrompt, userPromptText);
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.warn("AI Form Generation Quota/Error (Using Fallback):", error);
        return {
            title: "New Form",
            description: "Please fill out this form.",
            theme: "classic-blue",
            settings: { limit_one_response_per_user: false, accepting_responses: true, thank_you_message: "Thank you!" },
            questions: [
                { id: "fallback_1", type: "text", label: "Example Question", required: true }
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
        const text = await callSambaNovaAPI(systemPrompt, userPrompt);
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("AI PO Mapping Failed:", error);
        return {};
    }
};

export const generateEventIdeas = async (
    clubName: string,
    clubCategory: string,
    clubDescription: string,
    customPrompt?: string
): Promise<any[]> => {
    // Cache removed for "Surprise Me" variety
    // const cacheKey = `ideas_${clubName}_${customPrompt || 'auto'}`;
    // const cached = getCached(cacheKey);
    // if (cached) {
    //     console.log("Using cached AI response for:", clubName);
    //     return cached;
    // }

    console.log("Generating event ideas for:", clubName);
    const systemPrompt = "You are a creative director for a university student club.";
    const userPrompt = `
    Club Name: ${clubName}
    Category: ${clubCategory}
    Mission: ${clubDescription}

    ${customPrompt ? `THE USER HAS A SPECIFIC REQUEST: "${customPrompt}".` : ''}
    ${customPrompt ? `Generate 3 event ideas specifically tailored to this request.` : `Suggest 3 unique, high-engagement, and FUN technical/creative event ideas.`}
    
    CRITICAL INSTRUCTIONS:
    1. Focus on "easy to organize" but "interesting" events.
    2. Even "Hard" events should be operationally simple.
    3. Include detailed breakdown: Objectives, Rounds/Structure, and Rules.
    4. EVENT TYPE MUST BE ONE OF: "Technical", "Cultural", "Academic", "Sports", "Other". Do NOT invent new types.
    5. Include 'registration_fields': A list of custom fields needed for registration (e.g., Team Name, GitHub Repo).

    Return ONLY a valid JSON array of objects with this structure:
    [
      {
        "title": "Event Title",
        "description": "Short summary (2 sentences).",
        "objectives": ["Objective 1", "Objective 2"],
        "structure_rounds": [
          { "round_name": "Round 1: Quiz", "description": "Details...", "duration": "30 mins" },
          { "round_name": "Round 2: Build", "description": "Details...", "duration": "1 hour" }
        ],
        "rules": ["Rule 1", "Rule 2", "Rule 3"],
        "registration_fields": [
          { "label": "Team Name", "type": "text", "required": true },
          { "label": "GitHub Repo", "type": "url", "required": false }
        ],
        "event_type": "Technical",
        "target_audience": "Who should attend?",
        "difficulty_level": "Easy" | "Medium" | "Hard",
        "expected_attendees": 50,
        "estimated_budget": 1000,
        "duration_hours": 2
      }
    ]
    Do not include markdown. Pure JSON.
    `;

    try {
        const text = await callSambaNovaAPI(systemPrompt, userPrompt);
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        // setCached(cacheKey, parsed);
        return parsed;

    } catch (error) {
        console.warn("AI Quota Limit/Error (Switching to Offline Template):", error);
        return [
            {
                title: "Networking Mixer",
                description: "A casual evening for members to connect and share ideas.",
                objectives: ["Network with peers", "Share project ideas"],
                structure_rounds: [{ "round_name": "Ice Breaker", "description": "Fun intro game", "duration": "30m" }],
                rules: ["Be respectful", "Have fun"],
                registration_fields: [
                    { "label": "Dietary Preference", "type": "text", "required": false }
                ],
                event_type: "Cultural",
                target_audience: "All Students",
                difficulty_level: "Easy",
                expected_attendees: 30,
                estimated_budget: 500,
                duration_hours: 2
            }
        ];
    }
};
