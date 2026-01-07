import { useEffect, useState } from 'react';
import { EventCard } from '../components/EventCard';
import { Button } from '../components/ui/Button';
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

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

import { List } from 'lucide-react';

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
                .eq('status', 'approved') // Only show approved events
                .order('start_time', { ascending: true });

            if (error) throw error;
            setEvents((data as any) || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 px-3 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Campus Events</h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-1">Discover what's happening around you.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-sm">
                        <Filter className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Filter</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                        className="text-sm"
                    >
                        {viewMode === 'list' ? (
                            <>
                                <CalendarIcon className="mr-0 sm:mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Calendar</span>
                            </>
                        ) : (
                            <>
                                <List className="mr-0 sm:mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">List</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-sm sm:text-base">Loading events...</div>
            ) : viewMode === 'list' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {events.map(event => (
                        <div key={event.id} onClick={() => setSelectedEvent(event)} className="cursor-pointer transition-transform hover:scale-[1.02]">
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
                    ))}
                    {events.length === 0 && (
                        <div className="col-span-full text-center py-12 text-sm sm:text-base text-gray-500">
                            No upcoming events found.
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {/* Simple Calendar View Mockup - mapping events to cards but allowing different layout later */}
                        {events.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-sm sm:text-base text-gray-500">No events to display on calendar.</div>
                        ) : events.map(event => (
                            <div key={event.id} onClick={() => setSelectedEvent(event)} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-brand-500"></div>
                                    <span className="text-xs font-medium text-gray-500">
                                        {format(new Date(event.start_time), 'EEE, MMM d')}
                                    </span>
                                </div>
                                <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{event.title}</h4>
                                <p className="text-xs text-gray-500 mt-1 truncate">{event.location}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 mr-4">
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedEvent.title}</h2>
                                    <p className="text-sm sm:text-base text-gray-500 mt-1">Organized by {selectedEvent.clubs?.name}</p>
                                </div>
                                <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-500 flex-shrink-0">
                                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">

                                {selectedEvent.poster_url && (
                                    <div>
                                        <img
                                            src={selectedEvent.poster_url}
                                            alt="Event Poster"
                                            className="w-full h-48 sm:h-64 object-cover rounded-lg border border-gray-200"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Date & Time</p>
                                        <p className="text-sm font-medium mt-1">{format(new Date(selectedEvent.start_time), 'PPp')}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Location</p>
                                        <p className="text-sm font-medium mt-1">{selectedEvent.location}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-1">About Event</h3>
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        {selectedEvent.description || 'No description provided.'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button variant="ghost" onClick={() => setSelectedEvent(null)} className="w-full sm:w-auto">Close</Button>
                                {/* Future: Add 'Register' button here for students */}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
