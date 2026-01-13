import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Calendar, Users, Mail, ChevronLeft, Pen, Award, MapPin, Image as ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonList } from '../components/ui/Skeleton';

interface ClubDetail {
    id: string;
    name: string;
    description: string;
    category: string;
    logo_url: string;
    banner_url: string;
    founded_year: number;
    admin_id: string;
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
    const [galleryImages, setGalleryImages] = useState<Array<{ id: string; image_url: string; caption?: string }>>([]);
    const [activeTab, setActiveTab] = useState('overview');



    useEffect(() => {
        if (!id) return;
        fetchClubDetails();
        fetchClubEvents();
        fetchMemberCount();
        fetchGalleryImages();
        if (user) checkApplicationStatus();
    }, [id, user]);

    const fetchGalleryImages = async () => {
        const { data, error } = await supabase
            .from('club_gallery')
            .select('id, image_url, caption')
            .eq('club_id', id)
            .order('created_at', { ascending: false })
            .limit(6);
        if (!error && data) setGalleryImages(data);
    };

    const fetchMemberCount = async () => {
        const { count, error } = await supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', id);
        if (!error && count !== null) setMemberCount(count);
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
            const { error } = await supabase.from('club_applications').insert([{ club_id: id, user_id: user.id }]);
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
                .select(`*, admin:profiles!admin_id ( full_name, email )`)
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
                .in('status', ['approved', 'completed'])
                .order('start_time', { ascending: true });
            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><SkeletonList count={1} /></div>;
    if (!club) return <div className="text-center py-12">Club not found</div>;

    const isAuthorizedToEdit = (user && club && user.id === club.admin_id) || role === 'dean';
    const upcomingEvents = events.filter(e => {
        const endDate = e.end_time ? new Date(e.end_time) : new Date(e.start_time);
        return endDate >= new Date();
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Content Container */}
            <div className="max-w-7xl mx-auto p-6 sm:p-8 relative z-10">
                {/* Back Button */}
                <div className="mb-6">
                    <Link to="/clubs" className="inline-flex items-center text-gray-500 hover:text-brand-600 transition-colors">
                        <ChevronLeft className="h-5 w-5 mr-1" />
                        Back to Clubs
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* Left Sidebar (Profile Info) */}
                    <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 text-center relative overflow-hidden"
                        >
                            {/* Decorative Top Gradient */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-400 to-brand-600" />

                            <div className="relative mx-auto h-32 w-32 rounded-full p-1.5 bg-white shadow-lg mb-4 ring-4 ring-brand-50 mt-4">
                                <div className="h-full w-full rounded-full overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100">
                                    {club.logo_url ? (
                                        <img src={club.logo_url} alt={club.name} className="h-full w-full object-contain p-2" />
                                    ) : (
                                        <div className="h-full w-full bg-brand-100 flex items-center justify-center text-brand-600">
                                            <Users className="h-12 w-12" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Moved Title & Category Here */}
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                                    {club.name}
                                </h1>
                                <span className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider border border-brand-100">
                                    {club.category}
                                </span>
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-2 gap-3 text-center py-4 border-y border-gray-100/50">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{memberCount}</div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Members</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{club.founded_year || new Date().getFullYear()}</div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Founded</div>
                                    </div>
                                </div>

                                {isAuthorizedToEdit ? (
                                    <div className="grid gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate(`/clubs/${club.id}/edit`)}
                                            className="w-full justify-center border-brand-200 text-brand-700 hover:bg-brand-50"
                                        >
                                            <Pen className="h-4 w-4 mr-2" /> Edit Profile
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate(`/clubs/${club.id}/gallery`)}
                                            className="w-full justify-center border-blue-200 text-blue-700 hover:bg-blue-50"
                                        >
                                            <ImageIcon className="h-4 w-4 mr-2" /> Manage Gallery
                                        </Button>
                                    </div>
                                ) : role === 'student' ? (
                                    hasApplied ? (
                                        <Button disabled className="w-full justify-center bg-gray-100 text-gray-500 border-gray-200">
                                            {applicationStatus === 'approved' ? '✓ Member' : 'Application Pending'}
                                        </Button>
                                    ) : (
                                        <Button onClick={handleApply} loading={applying} className="w-full justify-center shadow-lg shadow-brand-500/30">
                                            Apply to Join
                                        </Button>
                                    )
                                ) : null}

                                <div className="pt-2 text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {club.admin?.email}
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Contact/Socials Placeholder */}
                        <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-4 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-red-500" /> Location
                            </h4>
                            <p className="text-sm text-gray-600 pl-6">Main Campus, Student Center</p>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                        {/* Navigation Tabs */}
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-1.5 flex flex-wrap gap-2 shadow-sm border border-white/50 sticky top-24 z-30">
                            {['overview', 'events', 'gallery'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                            flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                                            ${activeTab === tab
                                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30 ring-1 ring-black/5'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                                        `}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'overview' && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <Award className="h-32 w-32" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                            <span className="w-2 h-8 bg-brand-500 rounded-full mr-3"></span>
                                            About Us
                                        </h2>
                                        <div className="prose prose-lg text-gray-600 max-w-none leading-relaxed">
                                            <p>{club.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'events' && (
                                <motion.div
                                    key="events"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-gray-900">Upcoming Events</h3>
                                        {upcomingEvents.length > 0 && <span className="text-sm text-gray-500">{upcomingEvents.length} scheduled</span>}
                                    </div>
                                    {upcomingEvents.length > 0 ? (
                                        <div className="grid gap-6">
                                            {upcomingEvents.map(event => (
                                                <div key={event.id} className="group relative overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-1">
                                                    <div className="aspect-video w-full overflow-hidden bg-gray-100">
                                                        {event.poster_url ? (
                                                            <img src={event.poster_url} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                        ) : (
                                                            <div className="h-full w-full bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
                                                                <Calendar className="h-12 w-12 text-brand-200" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-6">
                                                        <div className="flex gap-2 mb-3">
                                                            <span className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                                {format(new Date(event.start_time), 'MMM d')}
                                                            </span>
                                                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                                {format(new Date(event.start_time), 'h:mm a')}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">{event.title}</h4>
                                                        <div className="flex items-center text-gray-500 text-sm">
                                                            <MapPin className="h-4 w-4 mr-2" />
                                                            {event.location}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                                            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">No upcoming events scheduled.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'gallery' && (
                                <motion.div
                                    key="gallery"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="grid grid-cols-2 md:grid-cols-3 gap-4"
                                >
                                    {galleryImages.length > 0 ? (
                                        galleryImages.map((image) => (
                                            <div key={image.id} className="aspect-square rounded-2xl overflow-hidden relative group break-inside-avoid shadow-sm">
                                                <img src={image.image_url} alt={image.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                                    <p className="text-white text-sm font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                        {image.caption}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-3xl border border-gray-100">
                                            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                            <p>No photos uploaded yet.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};
