import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, ArrowLeft, Building, UserCheck, Users as UsersIcon, ScanLine, Ticket as TicketIcon, BarChart2, MessageSquare, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { TicketCard } from '../components/TicketCard';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonList } from '../components/ui/Skeleton';

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
    const [ticketData, setTicketData] = useState<any>(null);

    useEffect(() => {
        if (id) {
            fetchEventDetails();
            if (user) {
                checkRegistrationAndProfile();
                fetchRegistrationCount();
            }
        }
    }, [id, user]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select(`*, clubs ( name, logo_url )`)
                .eq('id', id)
                .single();
            if (error) throw error;
            // @ts-ignore
            setEvent(data);
        } catch (error) {
            console.error('Error fetching event details:', error);
            navigate('/events');
        } finally {
            setLoading(false);
        }
    };

    const checkRegistrationAndProfile = async () => {
        if (!user || !id) return;
        const { data } = await supabase
            .from('participants')
            .select('*')
            .eq('event_id', id)
            .eq('user_id', user.id)
            .maybeSingle();

        if (data) {
            setIsRegistered(true);
            setTicketData(data);
        } else {
            setIsRegistered(false);
            setTicketData(null);
        }
    };

    const fetchRegistrationCount = async () => {
        if (!id) return;
        const { count } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', id);
        setRegistrationCount(count || 0);
    };

    const handleRegister = () => {
        navigate(`/events/${id}/register`);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><SkeletonList count={1} /></div>;
    if (!event) return null;

    const isPast = new Date(event.end_time) < new Date();
    const isOngoing = new Date(event.start_time) <= new Date() && new Date(event.end_time) >= new Date();

    return (
        <div className="min-h-screen bg-gray-50 pb-20 overflow-x-hidden">
            {/* Back Navigation - Floating */}
            <motion.button
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                onClick={() => navigate(-1)}
                className="fixed top-6 left-6 z-50 p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-black/40 shadow-lg transition-all hover:scale-105"
            >
                <ArrowLeft className="h-6 w-6" />
            </motion.button>

            {/* Hero Section Container */}
            <div className="relative bg-gray-900 min-h-[500px]">
                {/* 1. Atmospheric Blurred Background */}
                <div className="absolute inset-0 overflow-hidden">
                    {event.poster_url ? (
                        <>
                            <img src={event.poster_url} alt="Background" className="w-full h-full object-cover opacity-30 blur-3xl scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-gray-900/80 to-gray-50" />
                        </>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 opacity-50" />
                    )}
                </div>

                {/* 2. Main Content Grid */}
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
                    <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">

                        {/* Left: Original Size Poster */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="w-full max-w-md mx-auto lg:mx-0 lg:w-1/3 flex-shrink-0"
                        >
                            <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 bg-white/5 backdrop-blur-sm relative group">
                                {event.poster_url ? (
                                    <img
                                        src={event.poster_url}
                                        alt={event.title}
                                        className="w-full h-auto object-contain block" // Ensure original aspect ratio
                                    />
                                ) : (
                                    <div className="aspect-[3/4] flex items-center justify-center bg-gray-800 text-gray-500">
                                        <ImageIcon className="h-16 w-16" />
                                    </div>
                                )}

                                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
                            </div>
                        </motion.div>

                        {/* Right: Event Info (Title, Meta, Actions) */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="flex-1 text-white space-y-6 pt-4 text-center lg:text-left"
                        >
                            {/* Tags */}
                            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide backdrop-blur-md border shadow-sm ${isPast ? 'bg-gray-500/20 border-gray-400/30 text-gray-200' : isOngoing ? 'bg-green-500/20 border-green-400/30 text-green-300' : 'bg-brand-500/20 border-brand-400/30 text-brand-200'}`}>
                                    {isPast ? 'Completed' : isOngoing ? 'Live Now' : 'Upcoming'}
                                </span>
                                <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 text-sm font-medium">
                                    <Building className="h-4 w-4" /> {event.clubs.name}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-white drop-shadow-xl tracking-tight">
                                {event.title}
                            </h1>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-lg text-gray-200 max-w-2xl mx-auto lg:mx-0">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <div className="p-2 bg-brand-500/20 rounded-lg">
                                        <Calendar className="h-5 w-5 text-brand-300" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs text-brand-200 uppercase font-bold tracking-wider">Date</p>
                                        <p className="font-medium">{format(new Date(event.start_time), 'EEE, MMM d, yyyy')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Clock className="h-5 w-5 text-blue-300" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Time</p>
                                        <p className="font-medium">{format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}</p>
                                    </div>
                                </div>
                                <div className="col-span-1 sm:col-span-2 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <MapPin className="h-5 w-5 text-purple-300" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs text-purple-200 uppercase font-bold tracking-wider">Location</p>
                                        <p className="font-medium">{event.location}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Primary Action Button (Desktop Only Location) */}
                            {user && role === 'student' && !isPast && (
                                <div className="hidden lg:block pt-4">
                                    <Button
                                        onClick={handleRegister}
                                        className={`w-full max-w-xs py-4 text-lg font-bold shadow-2xl transition-all hover:scale-[1.02] ${isRegistered ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-brand-500/30'}`}
                                    >
                                        {isRegistered ? (
                                            <>
                                                <UserCheck className="h-5 w-5 mr-2" /> Unregister from Event
                                            </>
                                        ) : (
                                            <>
                                                <TicketIcon className="h-5 w-5 mr-2" /> Secure Your Spot
                                            </>
                                        )}
                                    </Button>
                                    <p className="mt-3 text-sm text-gray-400 pl-2">
                                        <UsersIcon className="h-3 w-3 inline mr-1" />
                                        {registrationCount} people attending
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Main Content Area (White Background) */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column: Description */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* About Section */}
                        <div className="prose prose-lg prose-gray max-w-none">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
                                <Sparkles className="h-6 w-6 text-brand-600" />
                                About This Event
                            </h3>
                            <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {event.description || "No description provided."}
                            </div>
                        </div>

                        {/* Ticket Reveal (Mobile/Desktop) */}
                        <AnimatePresence>
                            {isRegistered && ticketData && user && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden pt-8 border-t border-gray-100"
                                >
                                    <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center text-white">
                                        <div className="relative z-10">
                                            <h3 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2">
                                                <TicketIcon className="h-6 w-6 text-brand-400" />
                                                Your Access Pass
                                            </h3>
                                            <div className="flex justify-center">
                                                <TicketCard
                                                    eventName={event.title}
                                                    studentName={user.user_metadata?.full_name || user.email || 'Student'}
                                                    studentId={user.email || ''}
                                                    ticketCode={ticketData.ticket_code || ticketData.team_code || ticketData.section || 'TICKET'}
                                                    qrHash={ticketData.qr_code_hash || ticketData.id || 'VALID'}
                                                    eventDate={event.start_time}
                                                    eventLocation={event.location}
                                                    status={'registered'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Mobile Action & Admin Tools */}
                    <div className="space-y-6">
                        {/* Mobile Action Card (Sticky) */}
                        <div className="lg:hidden bg-white rounded-2xl p-6 shadow-xl border border-gray-100 sticky top-24 z-30">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-3xl font-black text-gray-900">{registrationCount}</div>
                                <p className="text-sm text-gray-500 font-medium uppercase">Total Attending</p>
                            </div>
                            {user && role === 'student' && !isPast && (
                                <Button
                                    onClick={handleRegister}
                                    className={`w-full py-3 text-lg font-bold shadow-lg ${isRegistered ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
                                >
                                    {isRegistered ? 'Unregister' : 'Register Now'}
                                </Button>
                            )}
                        </div>

                        {/* Admin Tools Box */}
                        {user && (role === 'admin' || role === 'super_admin' || role === 'dean') && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <ScanLine className="h-4 w-4" /> Admin Controls
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <Button onClick={() => navigate(`/events/${id}/feedback-stats`)} variant="outline" className="w-full justify-start">
                                        <BarChart2 className="h-4 w-4 mr-2" /> View Feedback Stats
                                    </Button>
                                    <Button onClick={() => navigate(`/events/${id}/scan`)} className="w-full justify-start bg-gray-900 text-white hover:bg-black">
                                        <ScanLine className="h-4 w-4 mr-2" /> Scanner Mode
                                    </Button>
                                    <Button onClick={() => navigate(`/events/${id}/feedback-builder`)} variant="outline" className="w-full justify-start">
                                        <Sparkles className="h-4 w-4 mr-2" /> Edit Feedback Form
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Student Post-Event Actions */}
                        {(!user || role === 'student') && isPast && (
                            <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100">
                                <h4 className="font-bold text-brand-900 mb-4">Event Actions</h4>
                                <div className="space-y-3">
                                    <Button onClick={() => navigate(`/events/${id}/feedback`)} variant="outline" className="w-full border-brand-200 text-brand-700 bg-white hover:bg-brand-50">
                                        <MessageSquare className="h-4 w-4 mr-2" /> Give Feedback
                                    </Button>
                                    <Button onClick={() => navigate(`/events/${id}/media`)} variant="outline" className="w-full border-blue-200 text-blue-700 bg-white hover:bg-blue-50">
                                        <ImageIcon className="h-4 w-4 mr-2" /> View Gallery
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
