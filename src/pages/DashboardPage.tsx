import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Users, Calendar, Building2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Welcome Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Welcome back, {user?.email?.split('@')[0] || 'User'}!
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">
                    {role === 'super_admin' && 'Super Admin Dashboard - Complete System Control'}
                    {role === 'dean' && "Dean's Dashboard - Oversee all clubs and events"}
                    {role === 'admin' && 'Club Admin Dashboard - Manage your club'}
                    {role === 'student' && 'Student Dashboard - Explore and join clubs'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                <div
                    onClick={() => navigate('/clubs')}
                    className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
                        <div className="mb-2 sm:mb-0">
                            <p className="text-xs sm:text-sm text-gray-600">Total Clubs</p>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.totalClubs}</p>
                        </div>
                        <Building2 className="h-8 w-8 sm:h-12 sm:w-12 text-brand-600" />
                    </div>
                </div>

                <div
                    onClick={() => navigate('/events')}
                    className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
                        <div className="mb-2 sm:mb-0">
                            <p className="text-xs sm:text-sm text-gray-600">Total Events</p>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.totalEvents}</p>
                        </div>
                        <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-purple-600" />
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
                        <div className="mb-2 sm:mb-0">
                            <p className="text-xs sm:text-sm text-gray-600">Total Members</p>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.totalMembers}</p>
                        </div>
                        <Users className="h-8 w-8 sm:h-12 sm:w-12 text-green-600" />
                    </div>
                </div>

                <div
                    onClick={() => navigate('/events')}
                    className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
                        <div className="mb-2 sm:mb-0">
                            <p className="text-xs sm:text-sm text-gray-600">Upcoming Events</p>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.upcomingEvents}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-orange-600" />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <button
                        onClick={() => navigate('/clubs')}
                        className="p-4 border-2 border-brand-200 rounded-lg hover:bg-brand-50 transition-colors text-left"
                    >
                        <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-brand-600 mb-2" />
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">Browse Clubs</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">Explore all available clubs</p>
                    </button>

                    <button
                        onClick={() => navigate('/events')}
                        className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left"
                    >
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mb-2" />
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">View Events</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">Check upcoming events</p>
                    </button>

                    {(role === 'admin' || role === 'dean' || role === 'super_admin') && (
                        <button
                            onClick={() => navigate('/analytics')}
                            className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left"
                        >
                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mb-2" />
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900">Analytics</h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">View insights and reports</p>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
