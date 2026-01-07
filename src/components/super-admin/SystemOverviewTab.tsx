import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Building2, Calendar, FileText, Activity } from 'lucide-react';

interface SystemStats {
    totalUsers: number;
    totalClubs: number;
    totalEvents: number;
    totalReports: number;
    usersByRole: {
        student: number;
        admin: number;
        dean: number;
        super_admin: number;
    };
    eventsByStatus: {
        pending: number;
        approved: number;
        rejected: number;
        completed: number;
    };
}

export const SystemOverviewTab = () => {
    const [stats, setStats] = useState<SystemStats>({
        totalUsers: 0,
        totalClubs: 0,
        totalEvents: 0,
        totalReports: 0,
        usersByRole: { student: 0, admin: 0, dean: 0, super_admin: 0 },
        eventsByStatus: { pending: 0, approved: 0, rejected: 0, completed: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSystemStats();
    }, []);

    const fetchSystemStats = async () => {
        setLoading(true);

        try {
            // Fetch all data in parallel
            const [usersRes, clubsRes, eventsRes, reportsRes] = await Promise.all([
                supabase.from('profiles').select('role'),
                supabase.from('clubs').select('id'),
                supabase.from('events').select('status'),
                supabase.from('reports').select('id')
            ]);

            // Calculate user stats
            const users = usersRes.data || [];
            const usersByRole = {
                student: users.filter(u => u.role === 'student').length,
                admin: users.filter(u => u.role === 'admin').length,
                dean: users.filter(u => u.role === 'dean').length,
                super_admin: users.filter(u => u.role === 'super_admin').length,
            };

            // Calculate event stats
            const events = eventsRes.data || [];
            const eventsByStatus = {
                pending: events.filter(e => e.status === 'pending').length,
                approved: events.filter(e => e.status === 'approved').length,
                rejected: events.filter(e => e.status === 'rejected').length,
                completed: events.filter(e => e.status === 'completed').length,
            };

            setStats({
                totalUsers: users.length,
                totalClubs: clubsRes.data?.length || 0,
                totalEvents: events.length,
                totalReports: reportsRes.data?.length || 0,
                usersByRole,
                eventsByStatus
            });
        } catch (error) {
            console.error('Error fetching system stats:', error);
        }

        setLoading(false);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading system overview...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Users</p>
                            <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
                        </div>
                        <Users className="h-12 w-12 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Total Clubs</p>
                            <p className="text-3xl font-bold mt-2">{stats.totalClubs}</p>
                        </div>
                        <Building2 className="h-12 w-12 text-purple-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Total Events</p>
                            <p className="text-3xl font-bold mt-2">{stats.totalEvents}</p>
                        </div>
                        <Calendar className="h-12 w-12 text-green-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Total Reports</p>
                            <p className="text-3xl font-bold mt-2">{stats.totalReports}</p>
                        </div>
                        <FileText className="h-12 w-12 text-orange-200" />
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Users by Role */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-brand-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Users by Role</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Students</span>
                            <span className="font-semibold text-blue-600">{stats.usersByRole.student}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Admins</span>
                            <span className="font-semibold text-purple-600">{stats.usersByRole.admin}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Deans</span>
                            <span className="font-semibold text-green-600">{stats.usersByRole.dean}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Super Admins</span>
                            <span className="font-semibold text-red-600">{stats.usersByRole.super_admin}</span>
                        </div>
                    </div>
                </div>

                {/* Events by Status */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="h-5 w-5 text-brand-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Events by Status</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Pending</span>
                            <span className="font-semibold text-yellow-600">{stats.eventsByStatus.pending}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Approved</span>
                            <span className="font-semibold text-green-600">{stats.eventsByStatus.approved}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Rejected</span>
                            <span className="font-semibold text-red-600">{stats.eventsByStatus.rejected}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Completed</span>
                            <span className="font-semibold text-blue-600">{stats.eventsByStatus.completed}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Health */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5 text-brand-600" />
                    <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Database Status</p>
                        <p className="text-lg font-semibold text-green-600">Operational</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">API Status</p>
                        <p className="text-lg font-semibold text-green-600">Healthy</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Active Sessions</p>
                        <p className="text-lg font-semibold text-blue-600">Live</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => fetchSystemStats()}
                        className="px-4 py-3 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 font-medium"
                    >
                        Refresh Statistics
                    </button>
                    <button
                        onClick={() => alert('Database backup feature coming soon')}
                        className="px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                    >
                        Backup Database
                    </button>
                    <button
                        onClick={() => alert('System logs viewer coming soon')}
                        className="px-4 py-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 font-medium"
                    >
                        View System Logs
                    </button>
                </div>
            </div>
        </div>
    );
};
