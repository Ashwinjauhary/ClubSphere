
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Daily Categories for rotation
const DAILY_CATEGORIES = [
    { day: "Sunday", topic: "Mixed Mega Quiz (General Knowledge)", difficulty: "Mixed" },
    { day: "Monday", topic: "Sports (Cricket, Football, Olympics & Traditional Sports)", difficulty: "Easy" },
    { day: "Tuesday", topic: "Politics & Governance (Indian Constitution, World Leaders, Current Affairs)", difficulty: "Medium" },
    { day: "Wednesday", topic: "Computer & Digital World (Tech History, Social Media, AI Trends)", difficulty: "Easy" },
    { day: "Thursday", topic: "Business & Economics (Top Brands, Entrepreneurs, Economy Basics)", difficulty: "Medium" },
    { day: "Friday", topic: "Entertainment & Science (Movies, Music, Basic Science Facts)", difficulty: "Easy" },
    { day: "Saturday", topic: "History & Geography (World Wonders, Indian History, Capitals)", difficulty: "Medium" }
];

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Select Category based on Day of Week
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(now.getTime() + istOffset);

        const dayIndex = istDate.getDay();
        const { topic, difficulty } = DAILY_CATEGORIES[dayIndex];
        const today = istDate.toISOString().split('T')[0];

        console.log(`Generating Quiz for ${today}: ${topic} (${difficulty})`);

        // 3. Check if quiz already exists for today
        const { data: existing } = await supabase
            .from('daily_quizzes')
            .select('id')
            .eq('date', today)
            .maybeSingle();

        if (existing) {
            return new Response(JSON.stringify({ message: 'Quiz already exists for today', quiz_id: existing.id }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // 4. Generate Questions with Sambanova AI
        // We need to pick an API Key. Deno env doesn't support arrays easily, so we'll grab one.
        // Ideally we rotate, but for Cron, one valid key is enough. We'll try to get one.
        const apiKey = Deno.env.get('VITE_SAMBANOVA_QUIZ_KEY_1') || Deno.env.get('SAMBANOVA_API_KEY');

        if (!apiKey) {
            throw new Error("Missing Sambanova API Key in Edge Function Secrets");
        }

        const systemPrompt = "You are an expert General Knowledge quiz master, known for creating engaging and educational trivia for university students.";
        const userPrompt = `
    Generate 10 multiple-choice questions for university students (primarily BBA and BCA).
    
    Category/Topic: ${topic}
    Difficulty: ${difficulty}
    
    Guidelines:
    1. Balance the questions so they are interesting for both technical (BCA) and management (BBA) students.
    2. Focus on conceptual knowledge, famous personalities, major events, and fun facts.
    3. Include "Did you know?" facts in the explanation to make it educational.
    4. Keep the language simple, professional, and engaging.
    
    Return ONLY a JSON array of objects:
    [
      {
        "question": "Which company owns the social media platform Instagram?",
        "options": ["Google", "Meta", "Microsoft", "Twitter"],
        "correct_answer": "Meta",
        "explanation": "Meta (formerly Facebook) acquired Instagram in 2012. Did you know? Instagram was originally called 'Burbn'!"
      }
    ]
    
    Ensure:
    1. "options" has exactly 4 items.
    2. "correct_answer" matches one of the options EXACTLY.
    3. No markdown formatting. Pure JSON output only.
    `;

        const response = await fetch("https://api.sambanova.ai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "Meta-Llama-3.3-70B-Instruct",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                top_p: 0.1,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`AI API Error: ${await response.text()}`);
        }

        const aiData = await response.json();
        const rawText = aiData.choices[0]?.message?.content || "[]";

        // 5. Parse JSON (Robust Cleaner)
        let clean = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBracket = clean.indexOf('[');
        const lastBracket = clean.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            clean = clean.substring(firstBracket, lastBracket + 1);
        }

        let questions;
        try {
            questions = JSON.parse(clean);
        } catch (e) {
            // Fallback: try removing trailing commas
            try {
                questions = JSON.parse(clean.replace(/,\s*]/g, ']'));
            } catch (e2) {
                throw new Error("Failed to parse AI JSON response");
            }
        }

        if (!Array.isArray(questions) || questions.length < 5) {
            throw new Error("AI returned insufficient questions");
        }

        // 6. Save to Database
        // A. Create Quiz
        const { data: quiz, error: quizError } = await supabase
            .from('daily_quizzes')
            .insert({
                date: today,
                topic: `${topic} (${difficulty})`
            })
            .select()
            .single();

        if (quizError) throw quizError;

        // B. Create Questions
        const questionsToInsert = questions.map(q => ({
            quiz_id: quiz.id,
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer
        }));

        const { error: qError } = await supabase
            .from('quiz_questions')
            .insert(questionsToInsert);

        if (qError) throw qError;

        return new Response(JSON.stringify({
            success: true,
            message: `Generated 10 questions for ${topic}`,
            quiz_id: quiz.id
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || String(error) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
