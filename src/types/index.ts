export interface AIAnalysisResult {
    summary: string;
    impactScore: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    strengths: string[];
    improvements: string[];
    introduction?: string;
    objectivesContent?: string;
    impactAnalysis?: string;
    metricsAnalysis?: string;
    strategicRoadmap?: string[];
}

export interface ReportData {
    basicInfo: {
        title: string;
        date: string;
        venue: string;
        clubName: string;
        academicYear: string;
    };
    objectives: string[];
    poMapping: { [key: string]: boolean };
    eventFlow: { title: string; description: string }[];
    outcomes: {
        participants: number;
        winners: { name: string; position: string; class: string }[];
        highlights: string[];
    };
    images: { url: string; caption: string }[];
    // v2 Additions
    customSections: { title: string; content: string }[];
    detailLevel: 'brief' | 'standard' | 'detailed'; // brief ~5pg, standard ~10pg, detailed ~20pg
    posterUrl?: string;
}

export interface GeneratedReport {
    introduction: string;
    objectivesContent: string;
    poJustification: string;
    flowContent: string;
    conclusion: string;
    impactAnalysis: string;
    images?: { url: string; caption: string }[];
    customSections?: { title: string; content: string }[];
}

export interface DailyQuiz {
    id: string;
    date: string;
    topic: string;
    created_at: string;
}

export interface QuizQuestion {
    id: string;
    quiz_id: string;
    question: string;
    options: string[];
    correct_answer: string;
    // explanation?: string; // Optional if AI provides it
    created_at: string;
}

export interface QuizAttempt {
    id: string;
    quiz_id: string;
    user_id: string;
    score: number;
    xp_earned: number;
    completed_at: string;
}

export interface LeaderboardEntry {
    id: string; // user_id
    full_name: string;
    avatar_url?: string;
    xp: number;
    level: number;
    weekly_xp: number;
}
