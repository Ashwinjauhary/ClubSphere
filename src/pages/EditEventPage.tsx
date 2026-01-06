import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Calendar, MapPin, AlignLeft, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';


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

    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
    });

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
                // If approved/pending, keep as is (user requirement for updating approved events)
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
                    status: newStatus
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
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
            </div>

            {loading ? <div>Loading...</div> : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
                    <form onSubmit={handleSubmit((data) => onSave(data, false))} className="space-y-6">
                        <Input
                            label="Event Title"
                            error={errors.title?.message}
                            {...register('title')}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Poster URL</label>
                            <input
                                type="text"
                                className={`block w-full rounded-md border border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2 ${errors.poster_url ? 'border-red-500' : ''}`}
                                {...register('poster_url')}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Description</label>
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
                            <Input
                                label="Estimated Budget (₹)"
                                type="number"
                                error={errors.budget?.message}
                                {...register('budget')}
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={() => navigate('/proposals')}>Cancel</Button>
                            <Button type="button" variant="outline" onClick={handleSaveDraft} loading={isSubmitting}>Save as Draft</Button>
                            <Button type="submit" loading={isSubmitting}>
                                {currentStatus === 'draft' ? 'Submit Proposal' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
