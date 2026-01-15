import { useParams, useNavigate } from 'react-router-dom';

import { Calendar, Users, Mail, Pen, Award, MapPin, Image as ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
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

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><SkeletonList count={1} /></div>;
    if (!club) return <div className="text-center py-12 bg-gray-50 text-gray-900">Club not found</div>;

    const isAuthorizedToEdit = (user && club && user.id === club.admin_id) || role === 'dean';
    const upcomingEvents = events.filter(e => {
        const endDate = e.end_time ? new Date(e.end_time) : new Date(e.start_time);
        return endDate >= new Date();
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Sidebar - Profile Information */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-6">

                    {/* Main Profile Card */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                        {/* Ringed Logo Container */}
                        <div className="relative mb-4">
                            <div className="absolute -inset-1 rounded-full bg-blue-50"></div>
                            <div className="relative h-28 w-28 rounded-full bg-white border-4 border-white shadow-md overflow-hidden">
                                {club.logo_url ? (
                                    <img src={club.logo_url} alt={club.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-400">
                                        <Users className="h-10 w-10" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <h1 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                            {club.name}
                        </h1>

                        <span className="inline-block px-4 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">
                            {club.category}
                        </span>

                        {/* Stats Grid */}
                        <div className="w-full grid grid-cols-2 gap-4 mb-8">
                            <div>
                                <div className="text-xl font-bold text-gray-900">{memberCount}</div>
                                <div className="text-xs text-gray-500 uppercase font-semibold">Members</div>
                            </div>
                            <div>
                                <div className="text-xl font-bold text-gray-900">{club.founded_year}</div>
                                <div className="text-xs text-gray-500 uppercase font-semibold">Founded</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="w-full space-y-3 mb-6">
                            {isAuthorizedToEdit ? (
                                <>
                                    <button
                                        onClick={() => navigate(`/clubs/${club.id}/edit`)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-500 text-blue-600 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-blue-50 transition-colors"
                                    >
                                        <Pen className="h-3.5 w-3.5" /> Edit Profile
                                    </button>
                                    <button
                                        onClick={() => navigate(`/clubs/${club.id}/gallery`)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-500 text-blue-600 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-blue-50 transition-colors"
                                    >
                                        <ImageIcon className="h-3.5 w-3.5" /> Manage Gallery
                                    </button>
                                </>
                            ) : role === 'student' ? (
                                hasApplied ? (
                                    <button disabled className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg text-sm font-bold uppercase">
                                        {applicationStatus === 'approved' ? 'Active Member' : 'Pending'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleApply}
                                        disabled={applying}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold uppercase hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                                    >
                                        {applying ? 'Applying...' : 'Join Club'}
                                    </button>
                                )
                            ) : null}
                        </div>

                        <div className="text-xs text-gray-400 flex items-center gap-1.5 break-all justify-center w-full">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            {club.admin?.email}
                        </div>
                    </div>

                    {/* Location Card */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                            <MapPin className="h-4 w-4 text-red-500" /> Location
                        </h3>
                        <p className="text-gray-600 text-sm pl-6 leading-relaxed">
                            Main Campus, Student Center<br />
                            Room 304, Tech Wing
                        </p>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="lg:col-span-8 xl:col-span-9">
                    {/* Tabs */}
                    <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 mb-6 flex items-center justify-around sm:justify-start gap-4 sm:gap-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-brand-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'events' ? 'bg-brand-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Events
                        </button>
                        <button
                            onClick={() => setActiveTab('gallery')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'gallery' ? 'bg-brand-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Gallery
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[400px] relative overflow-hidden">
                        {/* Faded Watermark */}
                        <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none">
                            <Award className="h-64 w-64 text-gray-900" />
                        </div>

                        {activeTab === 'overview' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="relative z-10"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-8 w-1.5 bg-brand-500 rounded-full"></div>
                                    <h2 className="text-2xl font-bold text-gray-900">About Us</h2>
                                </div>

                                <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
                                    {club.description}
                                </p>
                            </motion.div>
                        )}

                        {activeTab === 'events' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="relative z-10"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-8 w-1.5 bg-brand-500 rounded-full"></div>
                                    <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {upcomingEvents.map(event => (
                                        <div key={event.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                                            <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                                                {event.poster_url ? (
                                                    <img src={event.poster_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <Calendar className="h-8 w-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-gray-900">{event.title}</h4>
                                            <p className="text-sm text-gray-500">{format(new Date(event.start_time), 'PPp')}</p>
                                        </div>
                                    ))}
                                    {upcomingEvents.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-gray-500">
                                            No upcoming events.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'gallery' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="relative z-10"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-8 w-1.5 bg-brand-500 rounded-full"></div>
                                    <h2 className="text-2xl font-bold text-gray-900">Gallery</h2>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {galleryImages.map(img => (
                                        <div key={img.id} className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                            <img src={img.image_url} alt={img.caption || 'Gallery'} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    {galleryImages.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-gray-500">
                                            No images uploaded yet.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
