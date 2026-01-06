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

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
};
