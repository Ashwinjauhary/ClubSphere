import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Plus, Edit2, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { SkeletonList } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';

interface Event {
    id: string;
    title: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
    start_time: string;
    location: string;
}

export const ProposalsPage = () => {
    const { user } = useAuthStore();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchProposals();
        }
    }, [user]);

    const fetchProposals = async () => {
        try {
            setLoading(true);
            const { data: club } = await supabase.from('clubs').select('id').eq('admin_id', user?.id).single();

            if (club) {
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('club_id', club.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                // @ts-ignore
                setEvents(data || []);
            }
        } catch (error) {
            console.error('Error fetching proposals:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
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
                title="My Proposals"
                description="Manage your event drafts and tracking."
                action={
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Link
                            to="/events/new"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-[0_4px_0_0_#0369a1] text-white bg-brand-600 hover:bg-brand-700 transition-all hover:-translate-y-1 active:shadow-none active:translate-y-1"
                        >
                            <Plus className="h-5 w-5 mr-2" /> Create New Proposal
                        </Link>
                    </motion.div>
                }
            />

            {loading ? (
                <div className="grid gap-6">
                    <SkeletonList count={3} />
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    {events.length === 0 ? (
                        <div className="col-span-full py-20 text-center glass rounded-3xl">
                            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No proposals found.</p>
                            <p className="text-gray-400">Start by creating your first event proposal!</p>
                        </div>
                    ) : (
                        events.map((event) => (
                            <motion.div
                                key={event.id}
                                variants={item}
                                className="glass-card group relative overflow-hidden rounded-2xl p-6 hover:shadow-xl transition-all hover:-translate-y-1 border-t-4 border-t-transparent hover:border-t-brand-500"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${getStatusColor(event.status)}`}>
                                        {event.status}
                                    </span>
                                    <Link
                                        to={`/proposals/${event.id}/edit`}
                                        className="text-gray-400 hover:text-brand-600 p-2 hover:bg-brand-50 rounded-full transition-colors"
                                        aria-label="Edit proposal"
                                    >
                                        <Edit2 className="h-5 w-5" />
                                    </Link>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-brand-600 transition-colors">
                                    {event.title}
                                </h3>

                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                        {format(new Date(event.start_time), 'MMM d, yyyy • h:mm a')}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                        {event.location || 'Location TBD'}
                                    </div>
                                </div>

                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-brand-400 to-indigo-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                            </motion.div>
                        ))
                    )}
                </motion.div>
            )}
        </div>
    );
};
