import type { ReportData } from '../types';

export interface ImportedData {
    basicInfo: {
        title: string;
        date: string;
        venue: string;
        clubName?: string;
        academicYear?: string;
    };
    objectives: string[];
    poMapping?: Record<string, boolean>;
    eventFlow: Array<{ title: string; description: string }>;
    outcomes: {
        participants: number;
        winners: Array<{ position: string; name: string; class: string }>;
    };
    customSections?: Array<{ title: string; content: string }>;
    detailLevel?: 'brief' | 'standard' | 'detailed';
    posterUrl?: string;
}

export const parseJSONFile = async (file: File): Promise<ImportedData> => {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate required fields
    if (!data.title || !data.date || !data.venue) {
        throw new Error('Missing required fields: title, date, or venue');
    }

    return {
        basicInfo: {
            title: data.title,
            date: data.date,
            venue: data.venue,
            clubName: data.clubName || 'ClubSphere',
            academicYear: data.academicYear || '2024-2025'
        },
        objectives: data.objectives || [],
        poMapping: data.poMapping || {},
        eventFlow: data.eventFlow || [],
        outcomes: {
            participants: data.outcomes?.participants || 0,
            winners: data.outcomes?.winners || []
        },
        customSections: data.customSections || [],
        detailLevel: data.detailLevel || 'standard',
        posterUrl: data.posterUrl
    };
};

export const parseMarkdownFile = async (file: File): Promise<ImportedData> => {
    const text = await file.text();
    const lines = text.split('\n');

    const data: ImportedData = {
        basicInfo: {
            title: '',
            date: '',
            venue: '',
            clubName: 'ClubSphere',
            academicYear: '2024-2025'
        },
        objectives: [],
        eventFlow: [],
        outcomes: {
            participants: 0,
            winners: []
        },
        customSections: [],
        detailLevel: 'standard'
    };

    let currentSection = '';
    let currentSubsection: any = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Main headers
        if (line.startsWith('# ') && !line.startsWith('## ')) {
            currentSection = line.substring(2).toLowerCase();
            currentSubsection = null;
            continue;
        }

        // Subheaders for event flow
        if (line.startsWith('## ')) {
            if (currentSection === 'event flow' || currentSection === 'sessions') {
                currentSubsection = {
                    title: line.substring(3),
                    description: ''
                };
                data.eventFlow.push(currentSubsection);
            }
            continue;
        }

        // Parse based on current section
        switch (currentSection) {
            case 'title':
            case 'event title':
                if (line && !line.startsWith('#')) {
                    data.basicInfo.title = line;
                }
                break;

            case 'date':
                if (line && !line.startsWith('#')) {
                    data.basicInfo.date = line;
                }
                break;

            case 'venue':
                if (line && !line.startsWith('#')) {
                    data.basicInfo.venue = line;
                }
                break;

            case 'objectives':
                if (line.startsWith('-') || line.startsWith('*')) {
                    data.objectives.push(line.substring(1).trim());
                }
                break;

            case 'participants':
            case 'total participants':
                const participantMatch = line.match(/\d+/);
                if (participantMatch) {
                    data.outcomes.participants = parseInt(participantMatch[0]);
                }
                break;

            case 'event flow':
            case 'sessions':
                if (currentSubsection && line && !line.startsWith('#')) {
                    currentSubsection.description += line + ' ';
                }
                break;
        }
    }

    if (!data.basicInfo.title || !data.basicInfo.date || !data.basicInfo.venue) {
        throw new Error('Missing required fields in markdown file');
    }

    return data;
};

export const parseTextFile = async (file: File): Promise<ImportedData> => {
    // For simple text files, try to parse as markdown
    return parseMarkdownFile(file);
};

export const parseImportFile = async (file: File): Promise<ImportedData> => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'json':
            return parseJSONFile(file);
        case 'md':
        case 'markdown':
            return parseMarkdownFile(file);
        case 'txt':
            return parseTextFile(file);
        default:
            throw new Error('Unsupported file format. Please use .json, .md, or .txt files.');
    }
};
