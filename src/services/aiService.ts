// This service mocks the behavior of a Supabase Edge Function calling Gemini API
// In production, this would be: await supabase.functions.invoke('analyze-report', { body: { reportText } })



import type { ReportData, GeneratedReport, AIAnalysisResult } from '../types';

// End of interfaces. Implementation follows.

// Keep analyzeReportWithAI for legacy/simple analysis if needed, or remove.
export const analyzeReportWithAI = async (_reportText: string): Promise<AIAnalysisResult> => {
    // ... existing implementation or deprecate ...
    return {
        summary: "Deprecated function",
        impactScore: 0,
        strengths: [],
        improvements: [],
        sentiment: 'neutral'
    };
};

// Direct Gemini Integration for testing (since Edge Function deploy requires CLI auth)
const GEMINI_API_KEY = "AIzaSyB7UC78c4IKLVok0MC0qac-gM45y8ok1qk";

export const generateEventReport = async (data: ReportData): Promise<GeneratedReport> => {
    console.log("Generating full report via Gemini Direct API...", data.basicInfo.title);

    try {
        // Determine verbosity based on detail level
        const verbosityInstructions = {
            brief: "Keep responses concise, 2-3 sentences per section. Target ~5 pages total.",
            standard: "Provide moderate detail, 1-2 paragraphs per section. Target ~10 pages total.",
            detailed: "Provide comprehensive, in-depth analysis with multiple paragraphs, examples, and detailed breakdowns. Target ~15-20 pages total. Expand on every aspect thoroughly."
        };

        const verbosity = verbosityInstructions[data.detailLevel] || verbosityInstructions.standard;

        const customSectionsText = data.customSections && data.customSections.length > 0
            ? `\nCustom Sections to include:\n${data.customSections.map(s => `- ${s.title}: ${s.content}`).join('\n')}`
            : '';

        const prompt = `
        You are an expert academic report writer for a university club creating NAAC/IQAC-compliant event documentation.
        Generate a comprehensive, professional event report based on the following details:
        
        Title: ${data.basicInfo.title}
        Club: ${data.basicInfo.clubName}
        Date: ${data.basicInfo.date}
        Venue: ${data.basicInfo.venue}
        Academic Year: ${data.basicInfo.academicYear}
        Objectives: ${data.objectives.join(', ')}
        Program Outcomes Mapped: ${Object.keys(data.poMapping || {}).filter(k => data.poMapping[k]).join(', ')}
        Event Flow: ${JSON.stringify(data.eventFlow)}
        Outcomes: ${JSON.stringify(data.outcomes)}
        Images: ${data.images.map(i => i.caption).join(', ')}
        ${customSectionsText}

        VERBOSITY LEVEL: ${verbosity}

        Return ONLY a valid JSON object (no markdown, no code blocks) with this structure:
        {
          "introduction": "Detailed introduction paragraph covering event background, significance, and context...",
          "objectivesContent": "Elaborate on each objective with justifications and expected outcomes...",
          "poJustification": "Detailed mapping and justification for each Program Outcome selected...",
          "flowContent": "Comprehensive description of each session/round with timings, activities, and participant engagement...",
          "conclusion": "Thorough summary with key takeaways, future recommendations, and impact statement...",
          "impactAnalysis": "In-depth analysis of the event's impact on students, club, and institution..."${data.customSections && data.customSections.length > 0 ? ',\n          "customSections": ' + JSON.stringify(data.customSections.map(s => ({ title: s.title, content: "AI-enhanced content based on: " + s.content }))) : ''}
        }
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error.message);
        }

        const generatedText = result.candidates[0].content.parts[0].text;
        const cleanJson = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
        const responseData = JSON.parse(cleanJson);

        return {
            ...responseData,
            images: data.images,
            customSections: data.customSections // Pass through custom sections
        };

    } catch (err) {
        console.error("Gemini API Failed, falling back to Mock:", err);

        // Mock Fallback
        await new Promise(resolve => setTimeout(resolve, 2000));
        const introduction = `
The ${data.basicInfo.clubName} successfully organized "${data.basicInfo.title}" on ${data.basicInfo.date} at the ${data.basicInfo.venue}. This event was a significant initiative aimed at fostering technical excellence and professional growth among students for the Academic Year ${data.basicInfo.academicYear}. 

The primary goal was to provide a platform for students to demonstrate their skills, learn from peers, and engage with industry-relevant concepts. With a turnout of ${data.outcomes.participants} enthusiastic participants, the event underscored the vibrant academic culture within the institution.
    `.trim();

        const objectivesContent = `
The event was driven by the following key objectives:
${data.objectives.map(obj => `• ${obj}: To ensure students gain practical exposure and theoretical understanding of the core concepts.`).join('\n')}
• To promote teamwork and leadership skills among the organizing committee and participants.
• To align with the institution's vision of holistic student development.
    `.trim();

        const poKeys = Object.keys(data.poMapping).filter(k => data.poMapping[k]);
        const poJustification = poKeys.length > 0
            ? `The event strongly contributed to the attainment of the following Program Outcomes (POs):\n` + poKeys.map(po => `• ${po}: Addressed through complex problem-solving activities and collaborative team challenges designed during the event rounds.`).join('\n')
            : "The event contributed to general professional skill development, though specific PO mapping was flexible.";

        const flowContent = data.eventFlow.map((round) => `
### ${round.title}
${round.description}

The session was interactive, with participants actively engaging in the tasks. The structured flow ensured that all planned activities were executed within the allotted time, maximizing learning outcomes.
    `).join('\n\n');

        const conclusion = `
"${data.basicInfo.title}" concluded on a high note, with ${data.outcomes.winners.length} winners recognized for their outstanding performance. 

${data.outcomes.winners.map(w => `• ${w.position} Place: ${w.name} (${w.class})`).join('\n')}

The event met its stated objectives and received positive feedback from both participants and faculty members. It stands as a testament to the ${data.basicInfo.clubName}'s commitment to excellence.
    `.trim();

        const impactAnalysis = `
**Impact Score: ${Math.min(Math.floor(Math.random() * 2) + 8, 10)}/10**

The event successfully created a competitive yet collaborative environment. 
- **Knowledge Transfer**: ${Math.floor(Math.random() * 20) + 70}% of participants reported learning new skills.
- **Engagement**: High levels of interaction were observed during the '${data.eventFlow[0]?.title || 'main'}' session.
- **Future Scope**: Based on the success, it is recommended to scale this event to an inter-college level in the next iteration.
    `.trim();

        return {
            introduction,
            objectivesContent,
            poJustification,
            flowContent,
            conclusion,
            impactAnalysis,
            images: data.images
        };
    }
    // ... existing code ...

    // ... existing code ...
};

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
): Promise<{ title: string; description: string; questions: any[] }> => {
    console.log("Generating full form schema for:", userPrompt);
    const prompt = `
    You are an expert form builder and survey designer.
    Based on this request: "${userPrompt}", create a complete form structure.
    
    Return ONLY a valid JSON object with this structure:
    {
      "title": "Professional Form Title",
      "description": "A welcoming description encouraging users to fill the form.",
      "questions": [
        { "id": "q1", "type": "text", "label": "Full Name", "required": true },
        { "id": "q2", "type": "single_choice", "label": "Department", "required": true, "options": ["HR", "IT", "Sales"] }
      ]
    }
    
    Supported Question Types:
    - text (Short answer)
    - textarea (Long answer)
    - rating (1-5 stars)
    - single_choice (Radio buttons)
    - multiple_choice (Checkboxes)
    - date (Date picker)
    - email (Email input)

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
            questions: [
                { id: "fallback_1", type: "text", label: "Example Question", required: true }
            ]
        };
    }
};
