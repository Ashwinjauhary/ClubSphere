import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Users, Calendar, Building2, TrendingUp, ArrowRight, Activity, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/ui/PageHeader';

interface DashboardStats {
    totalClubs: number;
    totalEvents: number;
    totalMembers: number;
    upcomingEvents: number;
}

export const DashboardPage = () => {
    const { user, role } = useAuthStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        totalClubs: 0,
        totalEvents: 0,
        totalMembers: 0,
        upcomingEvents: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            const [clubsRes, eventsRes, membersRes] = await Promise.all([
                supabase.from('clubs').select('id', { count: 'exact', head: true }),
                supabase.from('events').select('id', { count: 'exact', head: true }),
                supabase.from('profiles').select('id', { count: 'exact', head: true })
            ]);

            const upcomingEventsRes = await supabase
                .from('events')
                .select('id', { count: 'exact', head: true })
                .gte('start_time', new Date().toISOString())
                .eq('status', 'approved');

            setStats({
                totalClubs: clubsRes.count || 0,
                totalEvents: eventsRes.count || 0,
                totalMembers: membersRes.count || 0,
                upcomingEvents: upcomingEventsRes.count || 0
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
        setLoading(false);
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

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-10 w-96 bg-gray-200 rounded-lg mb-2"></div>
                    <div className="h-6 w-64 bg-gray-200 rounded-lg"></div>
                </div>

                {/* Bento Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Large Card Skeleton */}
                    <div className="col-span-1 md:col-span-2 h-48 bg-gray-100 rounded-2xl border border-gray-200"></div>
                    {/* Standard Card Skeletons */}
                    <div className="h-48 bg-gray-100 rounded-2xl border border-gray-200"></div>
                    <div className="h-48 bg-gray-100 rounded-2xl border border-gray-200"></div>
                    {/* Wide Card Skeleton */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-4 h-64 bg-gray-100 rounded-2xl border border-gray-200"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6 sm:p-8">
            <PageHeader
                title={`Welcome back, ${user?.email?.split('@')[0]}`}
                description={
                    role === 'super_admin' ? 'System Overview & Control Center' :
                        role === 'dean' ? 'University Event & Club Oversight' :
                            role === 'admin' ? 'Club Management Dashboard' :
                                'Explore Campus Life'
                }
            />

            {/* Bento Grid Stats */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {/* Large Card - Total Events */}
                <motion.div
                    variants={item}
                    onClick={() => navigate('/events')}
                    className="col-span-1 md:col-span-2 glass-card p-6 flex flex-col justify-between h-48 cursor-pointer group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="h-32 w-32 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-purple-600 font-medium mb-1 flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Total Events
                        </p>
                        <h2 className="text-5xl font-bold text-gray-900">{stats.totalEvents}</h2>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-purple-600 transition-colors">
                        View all events <ArrowRight className="h-4 w-4" />
                    </div>
                </motion.div>

                {/* Standard Card - Clubs */}
                <motion.div
                    variants={item}
                    onClick={() => navigate('/clubs')}
                    className="glass-card p-6 flex flex-col justify-between h-48 cursor-pointer group hover:bg-white/80"
                >
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm mb-1">Registered Clubs</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.totalClubs}</h3>
                    </div>
                </motion.div>

                {/* Standard Card - Members */}
                <motion.div
                    variants={item}
                    className="glass-card p-6 flex flex-col justify-between h-48 group hover:bg-white/80"
                >
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm mb-1">Total Members</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.totalMembers}</h3>
                    </div>
                </motion.div>

                {/* Wide Card - Quick Actions */}
                <motion.div
                    variants={item}
                    className="col-span-1 md:col-span-2 lg:col-span-4 glass-card p-8 mt-4"
                >
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-brand-600" /> Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <button onClick={() => navigate('/clubs')} className="p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-all text-left group">
                            <span className="block p-2 w-fit bg-brand-100 text-brand-600 rounded-lg mb-3 group-hover:scale-110 transition-transform">
                                <Building2 className="h-5 w-5" />
                            </span>
                            <span className="font-semibold text-gray-900">Browse Clubs</span>
                        </button>

                        <button onClick={() => navigate('/events')} className="p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all text-left group">
                            <span className="block p-2 w-fit bg-purple-100 text-purple-600 rounded-lg mb-3 group-hover:scale-110 transition-transform">
                                <Calendar className="h-5 w-5" />
                            </span>
                            <span className="font-semibold text-gray-900">Upcoming Events</span>
                        </button>

                        {(role === 'admin' || role === 'dean' || role === 'super_admin') && (
                            <button onClick={() => navigate('/analytics')} className="p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-left group">
                                <span className="block p-2 w-fit bg-green-100 text-green-600 rounded-lg mb-3 group-hover:scale-110 transition-transform">
                                    <Award className="h-5 w-5" />
                                </span>
                                <span className="font-semibold text-gray-900">Analytics</span>
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};
