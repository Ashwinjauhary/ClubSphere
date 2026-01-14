import { useEffect, useState } from 'react';
import { EventCard } from '../components/EventCard';
import { Button } from '../components/ui/Button';
import { Calendar as CalendarIcon, Filter, X, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonList } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';

interface Event {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location: string;
    poster_url: string;
    description?: string;
    budget?: number;
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
    clubs: {
        name: string;
    };
}

export const EventsPage = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select(`
                    *,
                    clubs ( name )
                `)
                .eq('status', 'approved')
                .order('start_time', { ascending: true });

            if (error) throw error;
            setEvents((data as any) || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6 sm:p-8">
            <PageHeader
                title="Campus Events"
                description="The pulse of the university. Don't miss out."
                action={
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-2"
                    >
                        <Button variant="outline" size="sm" className="glass border-0 hover:bg-white/50 text-gray-700">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                        <div className="bg-gray-100/50 p-1 rounded-lg flex backdrop-blur-sm">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <List className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <CalendarIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                }
            />
            {/* Removed duplicate actions */}
            {/* ... rest of the content */}

            {
                loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <SkeletonList count={6} />
                    </div>
                ) : viewMode === 'list' ? (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
                    >
                        <AnimatePresence>
                            {events.map(event => (
                                <motion.div
                                    key={event.id}
                                    variants={item}
                                    layout
                                    onClick={() => setSelectedEvent(event)}
                                    className="cursor-pointer group break-inside-avoid mb-6"
                                >
                                    <div className="transition-transform duration-300 group-hover:-translate-y-2">
                                        <EventCard
                                            id={event.id}
                                            title={event.title}
                                            clubName={event.clubs?.name || 'Unknown Club'}
                                            date={format(new Date(event.start_time), 'MMMM d, yyyy')}
                                            time={`${format(new Date(event.start_time), 'h:mm a')} - ${format(new Date(event.end_time), 'h:mm a')}`}
                                            location={event.location}
                                            imageUrl={event.poster_url}
                                            status={event.status === 'completed' ? 'past' : 'upcoming'}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {events.length === 0 && (
                            <div className="text-center py-20 glass rounded-3xl text-gray-500 break-inside-avoid w-full">
                                No upcoming events found.
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass rounded-3xl p-6 overflow-hidden min-h-[500px]"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {events.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-gray-500">No events to display on calendar.</div>
                            ) : events.map(event => (
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className="p-4 bg-white/50 border border-white/20 rounded-xl hover:bg-white/80 transition-colors cursor-pointer shadow-sm"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-2 w-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                            {format(new Date(event.start_time), 'EEE, MMM d')}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 truncate">{event.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1 truncate">{event.location}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )
            }

            {/* Event Details Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedEvent(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90dvh] overflow-y-auto z-50 relative overflow-hidden"
                        >
                            {/* Decorative Background Mesh for Modal */}
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-brand-500/10 to-purple-500/10 -z-10" />

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1 mr-4">
                                        <h2 className="text-3xl font-bold text-gray-900">{selectedEvent.title}</h2>
                                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                                            Organized by <span className="font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full text-sm">{selectedEvent.clubs?.name}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedEvent(null)}
                                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {selectedEvent.poster_url && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="rounded-xl overflow-hidden shadow-lg"
                                        >
                                            <img
                                                src={selectedEvent.poster_url}
                                                alt="Event Poster"
                                                className="w-full h-64 object-cover"
                                            />
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Date & Time</p>
                                            <p className="font-semibold text-gray-900">{format(new Date(selectedEvent.start_time), 'PPp')}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Location</p>
                                            <p className="font-semibold text-gray-900">{selectedEvent.location}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">About Event</h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            {selectedEvent.description || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                                    <Button variant="ghost" onClick={() => setSelectedEvent(null)}>Close</Button>
                                    <Button className="bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/20">Register Now</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};
