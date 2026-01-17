import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Calendar, MapPin, AlignLeft, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateEventDescription } from '../services/aiService';
import { Sparkles } from 'lucide-react';
import { ImageUpload } from '../components/ui/ImageUpload';


import { SkeletonList } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';

const eventSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be detailed (min 20 chars)'),
    date: z.string().refine((val) => new Date(val) > new Date(), 'Date must be in the future'),
    time: z.string(),
    location: z.string().min(3, 'Location is required'),
    budget: z.string().optional(),
    poster_url: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export const EditEventPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [currentStatus, setCurrentStatus] = useState<string>('');

    const [objectives, setObjectives] = useState<string[]>([]);
    const [rules, setRules] = useState<string[]>([]);
    const [rounds, setRounds] = useState<{ round_name: string; description: string; duration: string }[]>([]);
    const [registrationFields, setRegistrationFields] = useState<{ label: string; type: string; required: boolean }[]>([]);
    const [customSections, setCustomSections] = useState<{ title: string; content: string }[]>([]);
    const [generating, setGenerating] = useState(false);

    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
    });

    const handleAutoGenerate = async () => {
        const title = watch('title');
        const date = watch('date');
        const location = watch('location');

        if (!title || !date || !location) {
            alert("Please ensure Title, Date, and Location are filled.");
            return;
        }

        setGenerating(true);
        try {
            const desc = await generateEventDescription(title, date, location, "Club Event");
            setValue('description', desc);
        } catch (e) {
            console.error(e);
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) return;
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (data) {
                    setValue('title', data.title);
                    setValue('description', data.description || '');
                    setValue('location', data.location || '');
                    setValue('budget', data.budget?.toString() || '');
                    setValue('poster_url', data.poster_url || '');
                    setCurrentStatus(data.status);

                    // Load Proposal Data
                    if (data.proposal_data) {
                        setObjectives(data.proposal_data.objectives || []);
                        setRules(data.proposal_data.rules || []);
                        setRounds(data.proposal_data.structure_rounds || []);
                        setRegistrationFields(data.proposal_data.registration_fields || []);
                        setCustomSections(data.proposal_data.custom_sections || []);
                    }

                    const dt = new Date(data.start_time);
                    if (!isNaN(dt.getTime())) {
                        setValue('date', dt.toISOString().split('T')[0]);
                        setValue('time', dt.toTimeString().slice(0, 5));
                    }
                }
            } catch (error) {
                console.error('Error fetching event:', error);
                alert('Could not load event.');
                navigate('/proposals');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id, setValue, navigate]);

    const onSave = async (data: EventFormData, asDraft: boolean = false) => {
        try {
            const startTime = new Date(`${data.date}T${data.time}:00`);
            const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

            let newStatus = currentStatus;
            if (asDraft) {
                newStatus = 'draft';
            } else {
                if (currentStatus === 'draft' || currentStatus === 'rejected') {
                    newStatus = 'pending';
                }
            }

            const { error } = await supabase
                .from('events')
                .update({
                    title: data.title,
                    description: data.description,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    location: data.location,
                    budget: data.budget ? parseFloat(data.budget) : 0,
                    poster_url: data.poster_url || null,
                    status: newStatus,
                    proposal_data: {
                        objectives,
                        rules,
                        structure_rounds: rounds,
                        registration_fields: registrationFields,
                        custom_sections: customSections
                    }
                })
                .eq('id', id);

            if (error) throw error;
            navigate('/proposals');
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Failed to update event.');
        }
    };

    const handleSaveDraft = handleSubmit((data) => onSave(data, true));

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <PageHeader title="Edit Event" />

            {loading ? <div className="max-w-3xl mx-auto"><SkeletonList count={1} /></div> : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
                    <form onSubmit={handleSubmit((data) => onSave(data, false))} className="space-y-6">
                        <Input
                            label="Event Title"
                            error={errors.title?.message}
                            {...register('title')}
                        />

                        <div>
                            <ImageUpload
                                label="Event Poster"
                                value={watch('poster_url') || ''}
                                onChange={(url) => setValue('poster_url', url)}
                                bucket="events"
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <button
                                    type="button"
                                    onClick={handleAutoGenerate}
                                    disabled={generating}
                                    className="text-xs flex items-center text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
                                >
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    {generating ? 'Generating...' : 'Auto-Generate with AI'}
                                </button>
                            </div>
                            <div className="relative">
                                <div className="absolute top-3 left-3 text-gray-400 pointer-events-none">
                                    <AlignLeft className="h-5 w-5" />
                                </div>
                                <textarea
                                    className={`block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm h-32 ${errors.description ? 'border-red-500' : ''}`}
                                    {...register('description')}
                                />
                            </div>
                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                        </div>

                        {/* PROPOSAL BUILDER UI */}
                        <div className="space-y-6 border-t border-gray-100 pt-6">
                            <h3 className="text-lg font-bold text-gray-900">Event Proposal Details</h3>

                            {/* Objectives */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Objectives</label>
                                {objectives.map((obj, i) => (
                                    <div key={i} className="flex gap-2 mb-2">
                                        <input
                                            value={obj}
                                            onChange={(e) => {
                                                const newObj = [...objectives];
                                                newObj[i] = e.target.value;
                                                setObjectives(newObj);
                                            }}
                                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                                            placeholder="Enter objective..."
                                        />
                                        <Button type="button" variant="ghost" size="sm" onClick={() => {
                                            const newObj = [...objectives];
                                            newObj.splice(i, 1);
                                            setObjectives(newObj);
                                        }}>X</Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => setObjectives([...objectives, ''])}>+ Add Objective</Button>
                            </div>

                            {/* Rules */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Rules & Regulations</label>
                                {rules.map((rule, i) => (
                                    <div key={i} className="flex gap-2 mb-2">
                                        <input
                                            value={rule}
                                            onChange={(e) => {
                                                const newRules = [...rules];
                                                newRules[i] = e.target.value;
                                                setRules(newRules);
                                            }}
                                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                                            placeholder="Enter rule..."
                                        />
                                        <Button type="button" variant="ghost" size="sm" onClick={() => {
                                            const newRules = [...rules];
                                            newRules.splice(i, 1);
                                            setRules(newRules);
                                        }}>X</Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => setRules([...rules, ''])}>+ Add Rule</Button>
                            </div>

                            {/* Rounds */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Event Structure / Rounds</label>
                                {rounds.map((round, i) => (
                                    <div key={i} className="bg-white p-3 rounded border border-gray-200 mb-3 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-gray-500">ROUND {i + 1}</span>
                                            <button type="button" onClick={() => {
                                                const newRounds = [...rounds];
                                                newRounds.splice(i, 1);
                                                setRounds(newRounds);
                                            }} className="text-red-500 text-xs hover:underline">Remove</button>
                                        </div>
                                        <input
                                            value={round.round_name}
                                            onChange={(e) => {
                                                const newRounds = [...rounds];
                                                newRounds[i].round_name = e.target.value;
                                                setRounds(newRounds);
                                            }}
                                            placeholder="Round Name (e.g. Round 1: Quiz)"
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                                        />
                                        <textarea
                                            value={round.description}
                                            onChange={(e) => {
                                                const newRounds = [...rounds];
                                                newRounds[i].description = e.target.value;
                                                setRounds(newRounds);
                                            }}
                                            placeholder="Description of this round..."
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                                            rows={2}
                                        />
                                        <input
                                            value={round.duration}
                                            onChange={(e) => {
                                                const newRounds = [...rounds];
                                                newRounds[i].duration = e.target.value;
                                                setRounds(newRounds);
                                            }}
                                            placeholder="Duration (e.g. 30 mins)"
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                                        />
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => setRounds([...rounds, { round_name: '', description: '', duration: '' }])}>+ Add Round</Button>
                            </div>

                            {/* Custom Proposal Sections */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Sections ({customSections.length})</label>
                                <p className="text-xs text-gray-500 mb-3">Add any other relevant details (e.g., Budget Breakdown, Sponsors, Safety Protocols).</p>

                                {customSections.map((section, i) => (
                                    <div key={i} className="bg-white p-3 rounded border border-gray-200 mb-3 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-500">SECTION {i + 1}</span>
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={() => {
                                                    if (i === 0) return;
                                                    const newSections = [...customSections];
                                                    [newSections[i - 1], newSections[i]] = [newSections[i], newSections[i - 1]];
                                                    setCustomSections(newSections);
                                                }} disabled={i === 0} className="text-gray-400 hover:text-brand-600 disabled:opacity-30">
                                                    ↑
                                                </button>
                                                <button type="button" onClick={() => {
                                                    if (i === customSections.length - 1) return;
                                                    const newSections = [...customSections];
                                                    [newSections[i + 1], newSections[i]] = [newSections[i], newSections[i + 1]];
                                                    setCustomSections(newSections);
                                                }} disabled={i === customSections.length - 1} className="text-gray-400 hover:text-brand-600 disabled:opacity-30">
                                                    ↓
                                                </button>
                                                <button type="button" onClick={() => {
                                                    const newSections = [...customSections];
                                                    newSections.splice(i, 1);
                                                    setCustomSections(newSections);
                                                }} className="text-red-500 text-xs hover:underline ml-2">Remove</button>
                                            </div>
                                        </div>
                                        <input
                                            value={section.title}
                                            onChange={(e) => {
                                                const newSections = [...customSections];
                                                newSections[i].title = e.target.value;
                                                setCustomSections(newSections);
                                            }}
                                            placeholder="Section Title (e.g. Sponsors)"
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border font-semibold"
                                        />
                                        <textarea
                                            value={section.content}
                                            onChange={(e) => {
                                                const newSections = [...customSections];
                                                newSections[i].content = e.target.value;
                                                setCustomSections(newSections);
                                            }}
                                            placeholder="Details..."
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                                            rows={2}
                                        />
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => setCustomSections([...customSections, { title: '', content: '' }])}>
                                    + Add Custom Section
                                </Button>
                            </div>
                        </div>


                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input type="date" className="block w-full rounded-md border border-gray-300 pl-10 p-2" {...register('date')} />
                                </div>
                                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Clock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input type="time" className="block w-full rounded-md border border-gray-300 pl-10 p-2" {...register('time')} />
                                </div>
                                {errors.time && <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Input
                                label="Location"
                                icon={<MapPin className="h-5 w-5 text-gray-400" />}
                                error={errors.location?.message}
                                {...register('location')}
                            />
                            {/* Hidden Budget as per user request */}
                            <input type="hidden" {...register('budget')} />
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-white sticky bottom-0 z-10 p-2 -mx-2 sm:static sm:p-0 sm:mx-0">
                            <Button type="button" variant="ghost" className="w-full sm:w-auto text-gray-500" onClick={() => navigate('/proposals')}>Cancel</Button>
                            <Button type="button" variant="outline" className="w-full sm:w-auto whitespace-nowrap" onClick={handleSaveDraft} loading={isSubmitting}>Save as Draft</Button>
                            <Button type="submit" className="w-full sm:w-auto whitespace-nowrap" loading={isSubmitting}>
                                {currentStatus === 'draft' ? 'Submit Proposal' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div >
            )}
        </div >
    );
};
