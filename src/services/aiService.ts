// This service mocks the behavior of a Supabase Edge Function calling Gemini API
// In production, this would be: await supabase.functions.invoke('analyze-report', { body: { reportText } })



import type { AIAnalysisResult } from '../types';

// End of interfaces. Implementation follows.

// Keep analyzeReportWithAI for legacy/simple analysis if needed, or remove.
export const analyzeReportWithAI = async (reportText: string): Promise<AIAnalysisResult> => {
    console.log("Analyzing report with AI...");
    const prompt = `
    You are a senior event analyst for a top-tier consulting firm.
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error.message);

        const text = result.candidates[0].content.parts[0].text;
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
        };
    }
};

// Direct Gemini Integration for testing (since Edge Function deploy requires CLI auth)
const GEMINI_API_KEY = "AIzaSyB7UC78c4IKLVok0MC0qac-gM45y8ok1qk";

// generateEventReport removed

export const generateEventDescription = async (
    title: string,
    date: string,
    venue: string,
    eventType: string
): Promise<string> => {
    console.log("Generating event description...", title);
    const prompt = `
    You are an expert copywriter for student club events.
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error.message);
        return result.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("AI Generation Failed:", error);
        return `Join us for ${title}, a ${eventType} taking place on ${date} at ${venue}. Don't miss this opportunity to learn, network, and have fun! (Auto-generated fallback)`;
    }
};

export const generateClubBio = async (
    name: string,
    category: string,
    mission: string
): Promise<string> => {
    console.log("Generating club bio...", name);
    const prompt = `
    You are a professional profile writer for student organizations.
    Write a compelling and professional "About Us" bio (approx 100 words) for a club named "${name}".
    
    Category: ${category}
    Mission/Goal: ${mission}

    The bio should highlight the club's vision, what members can expect, and why students should join.
    Return ONLY the plain text bio.
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error.message);
        return result.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("AI Generation Failed:", error);
        return `${name} is a premier ${category} club dedicated to ${mission}. Join us to be part of a vibrant community! (Auto-generated fallback)`;
    }
};

export const generateFeedbackForm = async (
    eventTitle: string,
    eventType: string,
    topic: string
): Promise<any[]> => {
    console.log("Generating feedback form questions for:", eventTitle);
    const prompt = `
    You are an expert survey designer for university events.
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
    
    Ensure IDs are unique strings. Do not include markdown code blocks.
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error.message);

        const text = result.candidates[0].content.parts[0].text;
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("AI Form Generation Failed:", error);
        return [
            { id: "f1", type: "rating", "label": `How would you rate the ${eventTitle}?`, "required": true },
            { id: "f2", type: "rating", "label": "Rate the speaker's knowledge.", "required": true },
            { id: "f3", type: "text", "label": "What did you like the most?", "required": false },
            { id: "f4", type: "text", "label": "Any suggestions for improvement?", "required": false },
            { id: "f5", type: "single_choice", "label": "Would you recommend this event to a friend?", "required": true, "options": ["Yes", "No"] }
        ];
    }
};

export const generateFormSchema = async (
    userPrompt: string
): Promise<{ title: string; description: string; theme: string; settings: any; questions: any[] }> => {
    console.log("Generating full form schema for:", userPrompt);
    const prompt = `
    You are an expert form builder and survey designer.
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
    
    Supported Question Types:
    - text (Short answer)
    - textarea (Paragraph)
    - number
    - email
    - date
    - single_choice (Radio)
    - multiple_choice (Checkboxes)
    - dropdown (Select menu)
    - rating (1-5 stars)
    - file_upload (for documents/images)
    - description (Static text block for info)

    Ensure IDs are unique strings. NO markdown code blocks.
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error.message);

        const text = result.candidates[0].content.parts[0].text;
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("AI Form Generation Failed:", error);
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
    const prompt = `
    You are an academic accreditation expert.
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error.message);

        const text = result.candidates[0].content.parts[0].text;
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("AI PO Mapping Failed:", error);
        return {};
    }
};
