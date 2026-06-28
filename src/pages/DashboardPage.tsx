import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Users, Calendar, Building2, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
        // eslint-disable-next-line react-hooks/immutability
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
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-pulse p-6">
                <div className="h-10 w-1/3 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="col-span-1 md:col-span-2 h-48 bg-gray-200 rounded-2xl"></div>
                    <div className="h-48 bg-gray-200 rounded-2xl"></div>
                    <div className="h-48 bg-gray-200 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6 sm:p-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    Welcome back, <span className="text-purple-600">{user?.email?.split('@')[0]}</span> <span className="text-yellow-400">✨</span>
                </h1>
                <p className="text-gray-500 text-lg">System Overview & Control Center</p>
            </div>

            {/* Stats Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {/* Total Events - Large Card */}
                <motion.div
                    variants={item}
                    onClick={() => navigate('/events')}
                    className="col-span-1 md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border-2 border-gray-100 hover:border-purple-100 transition-all cursor-pointer group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 text-purple-600 mb-2 font-bold uppercase tracking-wide text-xs">
                                <TrendingUp className="h-4 w-4" /> Total Events
                            </div>
                            <h2 className="text-6xl font-black text-gray-900 tracking-tight">{stats.totalEvents}</h2>
                        </div>
                        <div className="bg-purple-100 p-4 rounded-2xl text-purple-600">
                            <Calendar className="h-8 w-8" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 group-hover:text-purple-700 transition-colors relative z-10">
                        View Schedule <ArrowRight className="h-4 w-4" />
                    </div>
                </motion.div>

                {/* Registered Clubs */}
                <motion.div
                    variants={item}
                    onClick={() => navigate('/clubs')}
                    className="bg-white rounded-3xl p-6 shadow-sm border-2 border-gray-100 hover:border-blue-100 transition-all cursor-pointer group"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-extrabold rounded-lg uppercase tracking-wide">Active</span>
                    </div>

                    <div className="mb-4">
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Registered Clubs</span>
                        <h3 className="text-4xl font-black text-gray-900 mt-2">{stats.totalClubs}</h3>
                    </div>

                </motion.div>

                {/* Total Users */}
                <motion.div
                    variants={item}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>

                    <div>
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">Total Users</span>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalMembers}</h3>
                    </div>

                </motion.div>

                {/* Quick Actions */}
                <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="text-yellow-500">⚡</span> Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <button onClick={() => navigate('/clubs')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4 group">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Browse Clubs</h4>
                                <span className="text-sm text-gray-500">Explore the registry</span>
                            </div>
                        </button>

                        <button onClick={() => navigate('/events')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4 group">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Upcoming Events</h4>
                                <span className="text-sm text-gray-500">Check the schedule</span>
                            </div>
                        </button>

                        {(role === 'admin' || role === 'dean' || role === 'super_admin') && (
                            <>
                                <button onClick={() => navigate('/analytics')} className="bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-green-200 transition-all text-left flex items-start gap-4 group hover:-translate-y-1">
                                    <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-100 transition-colors">
                                        <TrendingUp className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">Analytics</h4>
                                        <span className="text-sm text-gray-500 font-medium">View performance</span>
                                    </div>
                                </button>

                                <button onClick={() => navigate('/club-admin/ai-events')} className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all text-left flex items-start gap-4 group hover:-translate-y-1 text-white">
                                    <div className="p-3 bg-white/20 rounded-xl text-white group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                                        <Sparkles className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">AI Event Manager</h4>
                                        <span className="text-xs text-indigo-100 font-medium opacity-90">Auto-generate ideas</span>
                                    </div>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
