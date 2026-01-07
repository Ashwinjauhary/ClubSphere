import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Calendar, Users, Mail, ChevronLeft, Pen, Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { EventCard } from '../components/EventCard';

interface ClubDetail {
    id: string;
    name: string;
    description: string;
    category: string;
    logo_url: string;
    banner_url: string;
    founded_year: number;
    admin_id: string; // Needed for permissions
    admin: {
        full_name: string;
        email: string;
    } | null;
}

interface ClubEvent {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location: string;
    poster_url: string;
    status: 'upcoming' | 'past' | 'live';
}

export const ClubDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, role } = useAuthStore();
    const [club, setClub] = useState<ClubDetail | null>(null);
    const [events, setEvents] = useState<ClubEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasApplied, setHasApplied] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
    const [applying, setApplying] = useState(false);
    const [memberCount, setMemberCount] = useState<number>(0);

    useEffect(() => {
        if (!id) return;
        fetchClubDetails();
        fetchClubEvents();
        fetchMemberCount();
        if (user) checkApplicationStatus();
    }, [id, user]);

    const fetchMemberCount = async () => {
        const { count, error } = await supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', id);

        if (!error && count !== null) {
            setMemberCount(count);
        }
    };

    const checkApplicationStatus = async () => {
        const { data } = await supabase
            .from('club_applications')
            .select('status')
            .eq('club_id', id)
            .eq('user_id', user!.id)
            .maybeSingle();

        if (data) {
            setHasApplied(true);
            setApplicationStatus(data.status);
        }
    };

    const handleApply = async () => {
        if (!user) {
            alert('Please login to apply');
            return;
        }
        try {
            setApplying(true);
            const { error } = await supabase
                .from('club_applications')
                .insert([{ club_id: id, user_id: user.id }]);

            if (error) throw error;

            setHasApplied(true);
            setApplicationStatus('pending');
            alert('Application submitted successfully!');
        } catch (error) {
            console.error('Error applying:', error);
            alert('Failed to apply.');
        } finally {
            setApplying(false);
        }
    };

    const fetchClubDetails = async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('clubs')
                .select(`
                    *,
                    admin:profiles!admin_id ( full_name, email )
                `)
                .eq('id', id)
                .single();

            setClub(data);
        } catch (error) {
            console.error('Error fetching club:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClubEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('club_id', id)
                .in('status', ['approved', 'completed']) // Show approved and completed (past) events
                .order('start_time', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    if (loading) return <div className="text-center py-12">Loading club details...</div>;
    if (!club) return <div className="text-center py-12">Club not found</div>;

    // Determine if the current user is authorized to edit (Admin of this club OR Dean)
    const isAuthorizedToEdit = (user && club && user.id === club.admin_id) || role === 'dean';

    const upcomingEvents = events.filter(e => new Date(e.end_time) >= new Date());
    const pastEvents = events.filter(e => new Date(e.end_time) < new Date());

    return (
        <div className="space-y-8 animate-in fade-in duration-500 overflow-x-hidden">
            {/* Back Link */}
            <Link to="/clubs" className="inline-flex items-center text-sm text-gray-500 hover:text-brand-600">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Clubs
            </Link>

            {/* Header Section with Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-200">
                <div className="h-48 w-full bg-gray-200 overflow-hidden">
                    {club.banner_url && (
                        <img
                            src={club.banner_url}
                            alt="Banner"
                            className="h-full w-full object-cover"
                        />
                    )}
                </div>
                <div className="px-4 sm:px-8 pb-6 sm:pb-8">
                    <div className="relative -mt-12 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                        <div className="rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden h-24 w-24 sm:h-32 sm:w-32 bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {club.logo_url ? (
                                <img src={club.logo_url} alt="Logo" className="h-full w-full object-cover" />
                            ) : (
                                <Users className="h-12 w-12 text-gray-300" />
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto sm:mb-2">
                            <Button onClick={() => navigate(`/clubs/${id}/highlights`)} variant="outline" className="flex-1 sm:flex-none">
                                <Award className="h-4 w-4 mr-2" />
                                Highlights
                            </Button>
                            {isAuthorizedToEdit ? (
                                <Button onClick={() => navigate(`/clubs/${id}/edit`)} variant="outline" className="flex-1 sm:flex-none">
                                    <Pen className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Button>
                            ) : role === 'student' ? (
                                hasApplied ? (
                                    <Button variant="outline" disabled className="flex-1 sm:flex-none">
                                        {applicationStatus === 'approved' ? 'Member' : 'Application Pending'}
                                    </Button>
                                ) : (
                                    <Button onClick={handleApply} loading={applying} className="flex-1 sm:flex-none">
                                        Apply to Join
                                    </Button>
                                )
                            ) : null}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{club.name}</h1>
                            <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                                {club.category}
                            </span>
                        </div>
                        <p className="text-gray-600 max-w-3xl leading-relaxed text-sm sm:text-base">{club.description}</p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 border-t border-gray-100 pt-6 sm:pt-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{memberCount} {memberCount === 1 ? 'Member' : 'Members'}</p>
                                <p className="text-xs text-gray-500">Total Members</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Founded {club.founded_year}</p>
                                <p className="text-xs text-gray-500">Est. Date</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Contact Admin</p>
                                <p className="text-xs text-gray-500">{club.admin?.email || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Upcoming Events */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">Upcoming Events</h2>
                        {upcomingEvents.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingEvents.map(event => (
                                    <EventCard
                                        key={event.id}
                                        id={event.id}
                                        title={event.title}
                                        clubName={club.name}
                                        date={format(new Date(event.start_time), 'MMMM d, yyyy')}
                                        time={`${format(new Date(event.start_time), 'h:mm a')} - ${format(new Date(event.end_time), 'h:mm a')}`}
                                        location={event.location}
                                        imageUrl={event.poster_url}
                                        status={'upcoming'}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center bg-gray-50">
                                <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-gray-500">No upcoming events scheduled.</p>
                            </div>
                        )}
                    </div>

                    {/* Past Events Section */}
                    {pastEvents.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">Past Events</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {pastEvents.map(event => (
                                    <EventCard
                                        key={event.id}
                                        id={event.id}
                                        title={event.title}
                                        clubName={club.name}
                                        date={format(new Date(event.start_time), 'MMMM d, yyyy')}
                                        time={`${format(new Date(event.start_time), 'h:mm a')} - ${format(new Date(event.end_time), 'h:mm a')}`}
                                        location={event.location}
                                        imageUrl={event.poster_url}
                                        status={'past'}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">Gallery</h2>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="aspect-square bg-gray-200 rounded-lg"></div>
                        <div className="aspect-square bg-gray-200 rounded-lg"></div>
                        <div className="aspect-square bg-gray-200 rounded-lg"></div>
                        <div className="aspect-square bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
