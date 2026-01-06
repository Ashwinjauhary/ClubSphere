import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Calendar, MapPin, AlignLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';

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

export const CreateEventPage = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            time: '09:00' // Default
        }
    });

    const { user } = useAuthStore();
    const [clubId, setClubId] = useState<string | null>(null);

    // Time State
    const [hour, setHour] = useState('09');
    const [minute, setMinute] = useState('00');
    const [period, setPeriod] = useState('AM');

    // Sync Time State to Form
    useEffect(() => {
        let h = parseInt(hour, 10);
        if (period === 'PM' && h < 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;

        const timeStr = `${h.toString().padStart(2, '0')}:${minute}`;
        setValue('time', timeStr);
    }, [hour, minute, period, setValue]);


    // Fetch the club this admin manages
    useEffect(() => {
        if (!user) return;
        const fetchClub = async () => {
            const { data } = await supabase.from('clubs').select('id').eq('admin_id', user.id).single();
            if (data) setClubId(data.id);
        };
        fetchClub();
    }, [user]);

    const saveEvent = async (data: EventFormData, asDraft: boolean) => {
        if (!user || !clubId) {
            alert('You must be a club admin to create events.');
            return;
        }

        try {
            // Combine date and time
            const startTime = new Date(`${data.date}T${data.time}:00`);
            const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours duration for now

            const { error } = await supabase.from('events').insert({
                club_id: clubId,
                title: data.title,
                description: data.description,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                location: data.location,
                budget: data.budget ? parseFloat(data.budget) : 0,
                poster_url: data.poster_url || null,
                created_by: user.id,
                status: asDraft ? 'draft' : 'pending' // Send for approval
            });

            if (error) throw error;

            navigate('/proposals'); // Go to proposals list instead of dashboard usually
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event. Please try again.');
        }
    };

    const handleDraft = handleSubmit((data) => saveEvent(data, true));
    const handlePublish = handleSubmit((data) => saveEvent(data, false));

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Propose New Event</h1>
                <p className="text-gray-500 mt-1">Submit your event details for Dean's approval.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
                <form onSubmit={handlePublish} className="space-y-6">
                    <Input
                        label="Event Title"
                        placeholder="e.g. Annual Tech Symposium"
                        error={errors.title?.message}
                        {...register('title')}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Poster URL (4:5 Ratio Recommended)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <AlignLeft className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className={`block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm ${errors.poster_url ? 'border-red-500' : ''}`}
                                placeholder="https://example.com/poster.jpg"
                                {...register('poster_url')}
                            />
                        </div>
                        {errors.poster_url && <p className="mt-1 text-sm text-red-600">{errors.poster_url.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 text-gray-400 pointer-events-none">
                                <AlignLeft className="h-5 w-5" />
                            </div>
                            <textarea
                                className={`block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm h-32 ${errors.description ? 'border-red-500' : ''}`}
                                placeholder="Describe the event, its objectives, and expected outcomes..."
                                {...register('description')}
                            />
                        </div>
                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    className={`block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm ${errors.date ? 'border-red-500' : ''}`}
                                    {...register('date')}
                                />
                            </div>
                            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <div className="flex gap-2">
                                {/* Hour */}
                                <select
                                    className="block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                                    value={hour}
                                    onChange={(e) => setHour(e.target.value)}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                        <option key={h} value={h.toString().padStart(2, '0')}>{h}</option>
                                    ))}
                                </select>
                                {/* Minute */}
                                <select
                                    className="block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                                    value={minute}
                                    onChange={(e) => setMinute(e.target.value)}
                                >
                                    {['00', '15', '30', '45'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                {/* Period */}
                                <select
                                    className="block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>

                                {/* Hidden Input to satisfy Zod */}
                                <input type="hidden" {...register('time')} />
                            </div>
                            {errors.time && <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Input
                            label="Location"
                            placeholder="e.g. Auditorium"
                            icon={<MapPin className="h-5 w-5 text-gray-400" />}
                            error={errors.location?.message}
                            {...register('location')}
                        />
                        <Input
                            label="Estimated Budget (₹)"
                            type="number"
                            placeholder="5000"
                            error={errors.budget?.message}
                            {...register('budget')}
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button type="button" variant="outline" onClick={handleDraft} loading={isSubmitting}>Save as Draft</Button>
                        <Button type="button" onClick={handlePublish} loading={isSubmitting}>Submit Proposal</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
