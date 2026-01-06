export interface AIAnalysisResult {
    summary: string;
    impactScore: number;
    strengths: string[];
    improvements: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
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
