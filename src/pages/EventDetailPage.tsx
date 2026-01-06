import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, ArrowLeft, Building, UserCheck, Users as UsersIcon } from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';

interface EventDetails {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    poster_url: string;
    club_id: string;
    clubs: {
        name: string;
        logo_url: string;
    };
}

export const EventDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, role } = useAuthStore();
    const [event, setEvent] = useState<EventDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [registrationCount, setRegistrationCount] = useState(0);
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        if (id) {
            fetchEventDetails();
            if (user) {
                checkRegistration();
                fetchRegistrationCount();
            }
        }
    }, [id, user]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select(`
                    *,
                    clubs ( name, logo_url )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            // @ts-ignore
            setEvent(data);
        } catch (error) {
            console.error('Error fetching event details:', error);
            navigate('/events'); // Redirect if not found
        } finally {
            setLoading(false);
        }
    };

    const checkRegistration = async () => {
        if (!user || !id) return;
        const { data } = await supabase
            .from('event_registrations')
            .select('id')
            .eq('event_id', id)
            .eq('user_id', user.id)
            .eq('status', 'registered')
            .single();
        setIsRegistered(!!data);
    };

    const fetchRegistrationCount = async () => {
        if (!id) return;
        const { count } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', id)
            .eq('status', 'registered');
        setRegistrationCount(count || 0);
    };

    const handleRegister = async () => {
        if (!user || !id) return;
        setRegistering(true);
        try {
            if (isRegistered) {
                // Unregister
                const { error } = await supabase
                    .from('event_registrations')
                    .delete()
                    .eq('event_id', id)
                    .eq('user_id', user.id);
                if (error) throw error;
                setIsRegistered(false);
                setRegistrationCount(prev => Math.max(0, prev - 1));
                alert('✅ Unregistered successfully!');
            } else {
                // Register
                const { error } = await supabase
                    .from('event_registrations')
                    .insert({ event_id: id, user_id: user.id });
                if (error) throw error;
                setIsRegistered(true);
                setRegistrationCount(prev => prev + 1);
                alert('✅ Registered successfully!');
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            alert('❌ ' + (error.message || 'Failed to register'));
        } finally {
            setRegistering(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Hero Image */}
                <div className="relative h-64 md:h-96 w-full bg-gray-100">
                    {event.poster_url ? (
                        <img
                            src={event.poster_url}
                            alt={event.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-brand-50">
                            <Calendar className="h-20 w-20 text-brand-200" />
                        </div>
                    )}
                    <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-700 backdrop-blur-sm shadow-sm uppercase tracking-wider">
                            {new Date(event.end_time) < new Date() ? 'Completed' : 'Upcoming'}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 space-y-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            {event.clubs.logo_url ? (
                                <img src={event.clubs.logo_url} className="h-10 w-10 rounded-full border border-gray-200" />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                                    <Building className="h-5 w-5" />
                                </div>
                            )}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">{event.clubs.name}</h3>
                                <p className="text-xs text-gray-500">Organizer</p>
                            </div>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            {event.title}
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 border-y border-gray-100">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Date</p>
                                <p className="text-sm text-gray-600">{format(new Date(event.start_time), 'EEEE, MMMM d, yyyy')}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Time</p>
                                <p className="text-sm text-gray-600">
                                    {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Location</p>
                                <p className="text-sm text-gray-600">{event.location}</p>
                            </div>
                        </div>

                        {/* Registration Info */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <UsersIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Registrations</p>
                                <p className="text-sm text-gray-600">{registrationCount} {registrationCount === 1 ? 'person' : 'people'} registered</p>
                            </div>
                        </div>
                    </div>

                    {/* Register Button - Only for Students */}
                    {user && role === 'student' && new Date(event.start_time) > new Date() && (
                        <div className="pb-6 border-b border-gray-100">
                            <Button
                                onClick={handleRegister}
                                disabled={registering}
                                className={`w-full ${isRegistered ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}
                            >
                                <UserCheck className="h-5 w-5 mr-2" />
                                {registering ? 'Processing...' : isRegistered ? 'Unregister from Event' : 'Register for Event'}
                            </Button>
                        </div>
                    )}

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">About this Event</h3>
                        <div className="prose prose-blue max-w-none text-gray-600">
                            <p className="whitespace-pre-wrap">{event.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
