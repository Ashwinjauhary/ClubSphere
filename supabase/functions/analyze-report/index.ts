// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { reportText, reportData } = await req.json();
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set');
        }

        // Construct the prompt
        // We prioritize reportData (structured) if available, falling back to reportText
        const data = reportData || {};

        const prompt = `
    You are an expert academic report writer for a university club.
    Generate a comprehensive, professional event report based on the following details:
    
    Title: ${data.basicInfo?.title || 'Event'}
    Club: ${data.basicInfo?.clubName || 'Tech Club'}
    Date: ${data.basicInfo?.date}
    Venue: ${data.basicInfo?.venue}
    Objectives: ${data.objectives?.join(', ') || 'General skill development'}
    Event Flow/Rounds: ${JSON.stringify(data.eventFlow)}
    Outcomes/Winners: ${JSON.stringify(data.outcomes)}
    Key Highlights/Captions: ${data.images?.join(', ') || 'None'}

    Return ONLY a valid JSON object (no markdown formatting) with this specific structure:
    {
      "introduction": "Detailed paragraph...",
      "objectivesContent": "Detailed bullet points or paragraph...",
      "poJustification": "Mapping of activities to Program Outcomes...",
      "flowContent": "Detailed description of rounds and activities...",
      "conclusion": "Summary of success and feedback...",
      "impactAnalysis": "Quantitative and qualitative impact analysis with a score /10..."
    }
    `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error.message);
        }

        const generatedText = result.candidates[0].content.parts[0].text;

        // Clean up markdown code blocks if Gemini adds them
        const cleanJson = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
        const content = JSON.parse(cleanJson);

        return new Response(JSON.stringify(content), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
