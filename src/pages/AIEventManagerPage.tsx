import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateEventIdeas } from '../services/aiService';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { Sparkles, ArrowRight, Users, DollarSign, Clock, Loader2, ArrowLeft } from 'lucide-react';

export interface Club {
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
    expected_attendees?: string | number;
    objectives?: string[];
    structure_rounds?: AIEventRound[];
    rules?: string[];
    registration_fields?: unknown[];
}

export const AIEventManagerPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [club, setClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [ideas, setIdeas] = useState<AIEventIdea[]>([]);
    const [customPrompt, setCustomPrompt] = useState('');

    useEffect(() => {
        if (user) fetchUserClub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchUserClub = async () => {
        try {
            // Find club where user is admin
            const { data } = await supabase
                .from('clubs')
                .select('*')
                .eq('admin_id', user?.id)
                .single();

            if (data) {
                setClub(data);
            }
        } catch {
            console.error('Error fetching club');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoGenerate = async () => {
        if (!club) return;
        setGenerating(true);
        try {
            const suggestions = await generateEventIdeas(club.name, club.category || '', club.description || '', '');
            setIdeas(suggestions as AIEventIdea[]);
            toast.success("Fresh event ideas generated successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate ideas.");
        } finally {
            setGenerating(false);
        }
    };

    const handleCustomGenerate = async () => {
        if (!club) return;
        if (!customPrompt.trim()) {
            toast.error("Please enter a prompt first!");
            return;
        }
        setGenerating(true);
        try {
            const suggestions = await generateEventIdeas(club.name, club.category || '', club.description || '', customPrompt);
            setIdeas(suggestions as AIEventIdea[]);
            toast.success("Generated ideas based on your prompt!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate ideas.");
        } finally {
            setGenerating(false);
        }
    };

    const createDraft = async (idea: AIEventIdea) => {
        if (!club) return;
        try {
            const startTime = new Date();
            startTime.setDate(startTime.getDate() + 14); // Default to 2 weeks from now
            startTime.setHours(14, 0, 0, 0);

            const endTime = new Date(startTime);
            endTime.setHours(startTime.getHours() + (idea.duration_hours || 2));

            // Sanitize Event Type to match Database Constraints (1000% fix)
            const validTypes = ['Technical', 'Cultural', 'Academic', 'Sports', 'Other'];
            const safeEventType = validTypes.includes(idea.event_type) ? idea.event_type : 'Other';

            const { data, error } = await supabase
                .from('events')
                .insert({
                    club_id: club.id,
                    title: idea.title,
                    description: idea.description,
                    event_type: safeEventType,
                    target_audience: idea.target_audience,
                    expected_attendees: typeof idea.expected_attendees === 'string' ? parseInt(idea.expected_attendees) || 0 : idea.expected_attendees,
                    budget: 0,
                    proposal_data: {
                        objectives: idea.objectives || [],
                        structure_rounds: idea.structure_rounds || [],
                        rules: idea.rules || [],
                        registration_fields: idea.registration_fields || []
                    },
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    status: 'draft',
                    created_by: user?.id,
                    location: 'TBD'
                })
                .select()
                .single();

            if (error) throw error;

            toast.success("Draft created! Redirecting to edit...");
            navigate(`/proposals/${data.id}/edit`);

        } catch (error) {
            console.error('Error creating draft:', error);
            toast.error('Failed to create event draft.');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-brand-600" /></div>;

    if (!club) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
                    <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500 mb-6">You need to be an administrator of a club to use the AI Event Manager.</p>
                    <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-100 to-indigo-100 rounded-full blur-3xl opacity-50 -mr-16 -mt-16"></div>

                    <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4 pl-0 hover:bg-transparent text-gray-500">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>

                    <div className="relative z-10">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-medium mb-4">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Personalized for {club.name}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Event Architect</h1>
                        <p className="text-lg text-gray-600 max-w-2xl mb-8">
                            Stuck on ideas? Let our AI analyze your club's mission
                            and suggest high-impact events guaranteed to engage your members.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                            {/* Option 1: Auto Pilot */}
                            <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 hover:border-indigo-300 transition-colors flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                            <Sparkles className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-bold text-gray-900">Auto-Pilot Mode</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                        Let the AI analyze your club's description, category, and historical trends to impress you with 3 curated ideas suited for your goals.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleAutoGenerate}
                                    disabled={generating}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md py-6 text-lg"
                                >
                                    {generating && !customPrompt ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                                    {generating && !customPrompt ? "Optimizing Connection..." : "Surprise Me"}
                                </Button>
                            </div>

                            {/* Option 2: Custom Prompt */}
                            <div className="bg-white p-6 rounded-xl border-2 border-brand-100 shadow-sm hover:border-brand-300 transition-colors flex flex-col">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                                        <Loader2 className={`h-6 w-6 ${generating && customPrompt ? 'animate-spin' : ''}`} />
                                    </div>
                                    <h3 className="font-bold text-gray-900">Custom Studio</h3>
                                </div>
                                <div className="space-y-4 flex-1 flex flex-col">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Concept</label>
                                    <textarea
                                        value={customPrompt}
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                        placeholder="Describe your dream event... e.g., 'A space-themed hackathon for beginners with a quiz round'"
                                        className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-base p-4 min-h-[120px] resize-none bg-gray-50 focus:bg-white transition-colors"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleCustomGenerate();
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={handleCustomGenerate}
                                        disabled={generating}
                                        variant="outline"
                                        className="w-full border-brand-200 text-brand-700 hover:bg-brand-50 py-6 text-lg mt-auto"
                                    >
                                        Generate from Prompt
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ideas Grid */}
                {ideas.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {ideas.map((idea, index) => (
                            <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
                                <div className={`h-2 w-full rounded-t-xl ${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-purple-500' : 'bg-pink-500'}`}></div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wide">
                                                {idea.event_type}
                                            </span>
                                            {idea.difficulty_level && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${idea.difficulty_level === 'Easy' ? 'bg-green-100 text-green-700' :
                                                    idea.difficulty_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {idea.difficulty_level}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-brand-600 transition-colors">
                                        {idea.title}
                                    </h3>

                                    <p className="text-gray-600 text-sm mb-4 flex-1 leading-relaxed">
                                        {idea.description}
                                    </p>

                                    {/* Proposal Details Expander */}
                                    <details className="mb-4 text-xs text-gray-500 bg-gray-50 rounded-lg group/details">
                                        <summary className="p-2 cursor-pointer font-medium hover:text-brand-600 select-none">View Full Proposal</summary>
                                        <div className="p-3 border-t border-gray-100 space-y-3">
                                            {idea.objectives && (
                                                <div>
                                                    <strong className="block text-gray-700 mb-1">Objectives:</strong>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        {idea.objectives.map((o: string, i: number) => <li key={i}>{o}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {idea.structure_rounds && (
                                                <div>
                                                    <strong className="block text-gray-700 mb-1">Structure:</strong>
                                                    <div className="space-y-2">
                                                        {idea.structure_rounds.map((r: AIEventRound, i: number) => (
                                                            <div key={i} className="pl-2 border-l-2 border-brand-200">
                                                                <p className="font-semibold text-gray-800">{r.round_name}</p>
                                                                <p>{r.description}</p>
                                                                <p className="text-gray-400 text-[10px]">{r.duration}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {idea.rules && (
                                                <div>
                                                    <strong className="block text-gray-700 mb-1">Rules:</strong>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        {idea.rules.map((r: string, i: number) => <li key={i}>{r}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </details>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Users className="h-4 w-4 mr-3 text-gray-400" />
                                            <span>Target: {idea.target_audience}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <DollarSign className="h-4 w-4 mr-3 text-gray-400" />
                                            <span>Est. Budget: ${idea.estimated_budget}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Clock className="h-4 w-4 mr-3 text-gray-400" />
                                            <span>Duration: {idea.duration_hours}h</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => createDraft(idea)}
                                        variant="outline"
                                        className="w-full justify-between hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 group-hover:shadow-md"
                                    >
                                        Create Draft Event
                                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
