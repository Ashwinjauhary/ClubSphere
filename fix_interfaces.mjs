import fs from 'fs';

// --- Fix FormViewerPage.tsx ---
let fvp = fs.readFileSync('src/pages/FormViewerPage.tsx', 'utf8');

// Add properties to interfaces
fvp = fvp.replace(
    /export interface FormSchema \{/,
    'export interface FormSchema {\n    header_image_url?: string;'
);
fvp = fvp.replace(
    /export interface FormQuestion \{/,
    'export interface FormQuestion {\n    label?: string;\n    description?: string;'
);

fs.writeFileSync('src/pages/FormViewerPage.tsx', fvp, 'utf8');
console.log('Fixed FormViewerPage.tsx');

// --- Fix AIEventManagerPage.tsx ---
let aip = fs.readFileSync('src/pages/AIEventManagerPage.tsx', 'utf8');

const interfaces = `export interface Club {
    id: string;
    name: string;
    category?: string;
    description?: string;
    admin_id?: string;
}

export interface AIEventRound {
    round_name: string;
    description: string;
    duration: string;
}

export interface AIEventIdea {
    title: string;
    description: string;
    event_type: string;
    difficulty_level?: string;
    target_audience: string;
    estimated_budget: string;
    duration_hours: number;
    objectives?: string[];
    structure_rounds?: AIEventRound[];
    rules?: string[];
}

export const AIEventManagerPage`;

aip = aip.replace(/export const AIEventManagerPage/g, interfaces);
aip = aip.replace(/useState<Record<string, unknown>>\(null\)/g, 'useState<Club | null>(null)');
aip = aip.replace(/useState<Record<string, unknown>\[\]>\(\[\]\)/g, 'useState<AIEventIdea[]>([])');
aip = aip.replace(/setIdeas\(suggestions\)/g, 'setIdeas(suggestions as unknown as AIEventIdea[])');
aip = aip.replace(/idea: Record<string, unknown>/g, 'idea: AIEventIdea');
aip = aip.replace(/r: Record<string, unknown>/g, 'r: AIEventRound');

fs.writeFileSync('src/pages/AIEventManagerPage.tsx', aip, 'utf8');
console.log('Fixed AIEventManagerPage.tsx');
