import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Calendar, MapPin, Users, User, Hash } from 'lucide-react';
import { format } from 'date-fns';

import { SkeletonList } from '../components/ui/Skeleton';

const registrationSchema = z.object({
    fullName: z.string().min(3, 'Full Name is required'),
    rollNumber: z.string().min(5, 'Roll Number is required'),
    department: z.string().min(2, 'Department is required'),
    section: z.string().min(1, 'Section is required'),
    isTeam: z.boolean(),
    teamName: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export const EventRegistrationPage = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegistrationFormData>({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            isTeam: false
        }
    });

    const isTeamCallback = watch('isTeam');

    useEffect(() => {
        const fetchEvent = async () => {
            if (!eventId) return;
            const { data } = await supabase
                .from('events')
                .select('*, clubs(name)')
                .eq('id', eventId)
                .single();

            if (data) {
                setEvent(data);
                if (user) {
                    // Check if already registered
                    const { data: reg } = await supabase
                        .from('participants')
                        .select('id')
                        .eq('event_id', eventId)
                        .eq('user_id', user.id)
                        .single();
                    if (reg) setAlreadyRegistered(true);
                }
            }
            setLoading(false);
        };
        fetchEvent();
    }, [eventId, user]);

    const onSubmit = async (data: RegistrationFormData) => {
        if (!event || !user) return;

        try {
            const teamCode = data.isTeam
                ? `TEAM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
                : null;

            const { error } = await supabase.from('participants').insert({
                event_id: event.id,
                user_id: user.id,
                full_name: data.fullName,
                roll_number: data.rollNumber,
                department: data.department,
                section: data.section,
                team_code: teamCode,
                role: 'Participant' // Default
            });

            if (error) throw error;

            toast.success('Registration Successful!');
            navigate(`/events/${eventId}`);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Registration failed.');
        }
    };

    if (loading) return <div className="max-w-3xl mx-auto"><SkeletonList count={1} /></div>;
    if (!event) return <div>Event not found</div>;

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="h-48 w-full bg-gray-200 relative">
                    {event.poster_url ? (
                        <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brand-50">
                            <Calendar className="h-16 w-16 text-brand-200" />
                        </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-brand-700">
                        {event.event_type || 'Event'}
                    </div>
                </div>
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1.5" />
                            {format(new Date(event.start_time), 'PPP p')}
                        </div>
                        <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1.5" />
                            {event.location}
                        </div>
                        <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1.5" />
                            {event.clubs?.name}
                        </div>
                    </div>
                </div>
            </div>

            {alreadyRegistered ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <User className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-green-900 mb-2">You are Registered!</h2>
                    <p className="text-green-700">You have successfully registered for this event.</p>
                    <Button className="mt-6" variant="outline" onClick={() => navigate(`/events/${eventId}`)}>Back to Event Details</Button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Event Registration</h2>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input
                            label="Full Name"
                            {...register('fullName')}
                            error={errors.fullName?.message}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Roll Number"
                                placeholder="e.g. 21BCA045"
                                {...register('rollNumber')}
                                error={errors.rollNumber?.message}
                            />
                            <Input
                                label="Department"
                                placeholder="e.g. BCA"
                                {...register('department')}
                                error={errors.department?.message}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Section"
                                placeholder="e.g. A"
                                {...register('section')}
                                error={errors.section?.message}
                            />
                            {/* Team Registration Toggle */}
                            <div className="flex items-center space-x-3 pt-8">
                                <input
                                    type="checkbox"
                                    id="isTeam"
                                    className="h-5 w-5 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                    {...register('isTeam')}
                                />
                                <label htmlFor="isTeam" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                                    Registering as a Team?
                                </label>
                            </div>
                        </div>

                        {isTeamCallback && (
                            <div className="bg-brand-50 p-4 rounded-lg border border-brand-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Hash className="h-5 w-5 text-brand-600" />
                                    <h3 className="font-semibold text-brand-800">Team Details</h3>
                                </div>
                                <p className="text-xs text-brand-600 mb-4">A unique Team Code will be generated for you. Share this with your teammates so they can join.</p>
                                <Input
                                    label="Team Name (Optional)"
                                    placeholder="e.g. The Innovators"
                                    {...register('teamName')}
                                    className="bg-white"
                                />
                            </div>
                        )}

                        <Button type="submit" loading={isSubmitting} className="w-full">
                            Confirm Registration
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
};
