import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Calendar, MapPin, DollarSign, Type, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { useState } from 'react';
import { ImageUpload } from '../components/ui/ImageUpload';

const eventSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    start_time: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
    end_time: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
    location: z.string().min(3, 'Location is required'),
    budget: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Invalid budget'),
    max_attendees: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Invalid capabilities'),
    image_url: z.string().optional(),
});

type EventForm = z.infer<typeof eventSchema>;

export const CreateEventPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<EventForm>({
        resolver: zodResolver(eventSchema),
    });

    const onSubmit = async (data: EventForm) => {
        setIsSubmitting(true);
        try {
            // Get user's club
            const { data: club } = await supabase.from('clubs').select('id').eq('admin_id', user?.id).single();

            if (!club) {
                toast.error('You must be a club admin to create an event');
                return;
            }

            const { error } = await supabase.from('events').insert({
                title: data.title,
                description: data.description,
                start_time: data.start_time,
                end_time: data.end_time,
                location: data.location,
                budget: Number(data.budget),
                expected_attendees: Number(data.max_attendees),
                club_id: club.id,
                status: 'pending', // Default status
                poster_url: data.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80', // Placeholder or user image
            });

            if (error) throw error;

            toast.success('Event proposal submitted successfully!');
            navigate('/proposals');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create event');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <PageHeader
                title="Create New Event Proposal"
                description="Submit a new event for approval by the Dean."
            />

            <div className="bg-white rounded-3xl p-4 sm:p-8 border-2 border-gray-100 shadow-sm mt-8 pb-10 mb-20">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="col-span-1 lg:col-span-2">
                            <Input
                                label="Event Title"
                                placeholder="eg. Tech Symposium 2026"
                                error={errors.title?.message}
                                icon={<Type className="h-5 w-5" />}
                                {...register('title')}
                            />
                        </div>

                        <div className="col-span-1 lg:col-span-2">
                            <label className="mb-2 block text-sm font-bold text-gray-700">Description</label>
                            <textarea
                                className="block w-full rounded-xl border-2 border-gray-200 p-4 min-h-[120px] focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all"
                                placeholder="Detailed description of the event..."
                                {...register('description')}
                            ></textarea>
                            {errors.description && <p className="mt-1 text-xs text-red-600 font-bold">{errors.description.message}</p>}
                        </div>

                        <Input
                            label="Start Time"
                            type="datetime-local"
                            error={errors.start_time?.message}
                            icon={<Calendar className="h-5 w-5" />}
                            {...register('start_time')}
                        />

                        <Input
                            label="End Time"
                            type="datetime-local"
                            error={errors.end_time?.message}
                            icon={<Calendar className="h-5 w-5" />}
                            {...register('end_time')}
                        />

                        <Input
                            label="Location"
                            placeholder="eg. Main Auditorium"
                            error={errors.location?.message}
                            icon={<MapPin className="h-5 w-5" />}
                            {...register('location')}
                        />

                        <Input
                            label="Estimated Budget (₹)"
                            type="number"
                            placeholder="5000"
                            error={errors.budget?.message}
                            icon={<DollarSign className="h-5 w-5" />}
                            {...register('budget')}
                        />
                        <Input
                            label="Max Attendees"
                            type="number"
                            placeholder="100"
                            error={errors.max_attendees?.message}
                            icon={<Users className="h-5 w-5" />} // Note: Users icon needs import check
                            {...register('max_attendees')}
                        />

                        <div className="col-span-1 lg:col-span-2">
                            <ImageUpload
                                label="Event Poster"
                                value={watch('image_url') || ''}
                                onChange={(url) => setValue('image_url', url)}
                                bucket="events"
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
                        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button type="submit" variant="primary" isLoading={isSubmitting} className="shadow-[0_4px_0_0_#0369a1]">
                            Submit Proposal
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
