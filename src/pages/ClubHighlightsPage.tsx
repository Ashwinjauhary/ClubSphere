import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { EventCard } from '../components/EventCard';
import { format } from 'date-fns';
import { Calendar, ChevronLeft, Award } from 'lucide-react';

interface ClubEvent {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location: string;
    poster_url: string;
    status: 'upcoming' | 'past' | 'live';
    club_name?: string; // We might need to join/fetch this
}

export const ClubHighlightsPage = () => {
    const { id } = useParams<{ id: string }>();
    const [events, setEvents] = useState<ClubEvent[]>([]);
    const [clubName, setClubName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        fetchHighlights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchHighlights = async () => {
        try {
            setLoading(true);

            // Fetch club info
            const { data: club } = await supabase.from('clubs').select('name').eq('id', id).single();
            if (club) setClubName(club.name);

            // Fetch past events
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('club_id', id)
                .eq('status', 'completed') // Explicitly looking for completed highlights
                .order('start_time', { ascending: false });

            if (error) throw error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setEvents(data as any);
        } catch (error) {
            console.error('Error fetching highlights:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Back Link */}
            <Link to={`/clubs/${id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-brand-600">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Club Details
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Award className="h-8 w-8 text-yellow-500" />
                        {clubName ? `${clubName} Highlights` : 'Highligts'}
                    </h1>
                    <p className="text-gray-500 mt-1">A showcase of our past successful events and memories.</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading highlights...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.length > 0 ? (
                        events.map(event => (
                            <EventCard
                                key={event.id}
                                id={event.id}
                                title={event.title}
                                clubName={clubName}
                                date={format(new Date(event.start_time), 'MMMM d, yyyy')}
                                time={`${format(new Date(event.start_time), 'h:mm a')} - ${format(new Date(event.end_time), 'h:mm a')}`}
                                location={event.location}
                                imageUrl={event.poster_url}
                                status={'past'} // Force past styling
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                            <p className="text-gray-500 text-lg">No highlights available yet.</p>
                            <p className="text-gray-400 text-sm">Check back after we conclude our next big event!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
