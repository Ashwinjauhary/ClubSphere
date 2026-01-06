import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Calendar, Users, ClipboardCheck, FileText, AlertCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SkeletonCard } from '../components/ui/Skeleton';

export const DashboardPage = () => {
    const { user, role } = useAuthStore();
    const [stats, setStats] = useState({
        totalEvents: 0,
        activeClubs: 0,
        pendingApprovals: 0,
        myApplications: 0,
        pendingReports: 0,
        registeredEvents: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchDashboardStats();
    }, [user, role]);

    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            // General Stats
            const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
            const { count: clubsCount } = await supabase.from('clubs').select('*', { count: 'exact', head: true });

            let pendingApprovals = 0;
            let myApplications = 0;
            let pendingReports = 0;
            let registeredEvents = 0;

            if (role === 'dean') {
                const { count } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'pending');
                pendingApprovals = count || 0;
            }

            if (role === 'student') {
                const { count } = await supabase.from('club_applications').select('*', { count: 'exact', head: true }).eq('user_id', user!.id);
                myApplications = count || 0;

                // Get registered events count
                const { count: regCount } = await supabase
                    .from('event_registrations')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user!.id)
                    .eq('status', 'registered');
                registeredEvents = regCount || 0;
            }

            if (role === 'admin') {
                // Get club ID for this admin
                const { data: club } = await supabase.from('clubs').select('id').eq('admin_id', user!.id).single();
                if (club) {
                    const { count } = await supabase.from('club_applications').select('*', { count: 'exact', head: true }).eq('club_id', club.id).eq('status', 'pending');
                    pendingApprovals = count || 0; // Reusing variable for admin's pending applications

                    // Check for completed events without reports
                    const { count: reportsNeeded } = await supabase.from('events')
                        .select('*', { count: 'exact', head: true })
                        .eq('club_id', club.id)
                        .eq('status', 'approved')
                        .lt('end_time', new Date().toISOString());
                    pendingReports = reportsNeeded || 0;
                }
            }

            setStats({
                totalEvents: eventsCount || 0,
                activeClubs: clubsCount || 0,
                pendingApprovals,
                myApplications,
                pendingReports,
                registeredEvents
            });

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ to, icon: Icon, label, value, colorClass, bgClass }: any) => (
        <Link to={to} className="group block rounded-xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-brand-200 card-hover">
            <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${bgClass} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${colorClass}`} />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-gray-500">{label}</h3>
                    <p className="mt-1 text-3xl font-bold text-gray-900 transition-all duration-300">
                        {loading ? '-' : value}
                    </p>
                </div>
            </div>
        </Link>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">
                    Welcome back, <span className="font-semibold text-brand-600">{user?.user_metadata?.full_name}</span>
                </p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-scale-in">

                    {/* Global Stats */}
                    <StatCard
                        to="/events"
                        icon={Calendar}
                        label="Total Events"
                        value={stats.totalEvents}
                        colorClass="text-blue-600"
                        bgClass="bg-blue-50"
                    />

                    <StatCard
                        to="/clubs"
                        icon={Users}
                        label="Active Clubs"
                        value={stats.activeClubs}
                        colorClass="text-purple-600"
                        bgClass="bg-purple-50"
                    />

                    {/* Role Specific Stats */}
                    {role === 'dean' && (
                        <StatCard
                            to="/approvals"
                            icon={ClipboardCheck}
                            label="Pending Approvals"
                            value={stats.pendingApprovals}
                            colorClass="text-yellow-600"
                            bgClass="bg-yellow-50"
                        />
                    )}

                    {role === 'student' && (
                        <>
                            <StatCard
                                to="/applications"
                                icon={FileText}
                                label="My Applications"
                                value={stats.myApplications}
                                colorClass="text-green-600"
                                bgClass="bg-green-50"
                            />
                            <StatCard
                                to="/events"
                                icon={Calendar}
                                label="Registered Events"
                                value={stats.registeredEvents}
                                colorClass="text-purple-600"
                                bgClass="bg-purple-50"
                            />
                        </>
                    )}

                    {role === 'admin' && (
                        <>
                            <StatCard
                                to="/applications"
                                icon={Users}
                                label="New Applicants"
                                value={stats.pendingApprovals}
                                colorClass="text-orange-600"
                                bgClass="bg-orange-50"
                            />
                            {stats.pendingReports > 0 && (
                                <StatCard
                                    to="/reports/submit"
                                    icon={AlertCircle}
                                    label="Reports Due"
                                    value={stats.pendingReports}
                                    colorClass="text-red-600"
                                    bgClass="bg-red-50"
                                />
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in-up">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Activity Timeline</h3>
                <ActivityTimeline userId={user?.id} userRole={role} />
            </div>
        </div>
    );
};

// Activity Timeline Component
const ActivityTimeline = ({ userId, userRole }: { userId?: string; userRole?: string | null }) => {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        fetchActivities();
    }, [userId, userRole]);

    const fetchActivities = async () => {
        try {
            const activities: any[] = [];

            // For Students - Show their own club applications and events they created
            if (userRole === 'student') {
                // Their club applications
                const { data: applications } = await supabase
                    .from('club_applications')
                    .select('id, status, created_at, clubs(name)')
                    .eq('user_id', userId!)
                    .order('created_at', { ascending: false })
                    .limit(3);

                applications?.forEach(app => {
                    activities.push({
                        type: 'application',
                        title: `You applied to join`,
                        description: `${app.status} - ${(app.clubs as any)?.name || 'Unknown Club'}`,
                        time: app.created_at,
                        icon: Users,
                        color: app.status === 'approved' ? 'text-green-600' : app.status === 'rejected' ? 'text-red-600' : 'text-yellow-600',
                        bgColor: app.status === 'approved' ? 'bg-green-100' : app.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                    });
                });

                // Their registered events
                const { data: registrations } = await supabase
                    .from('event_registrations')
                    .select('id, registered_at, events(title, start_time)')
                    .eq('user_id', userId!)
                    .eq('status', 'registered')
                    .order('registered_at', { ascending: false })
                    .limit(3);

                registrations?.forEach(reg => {
                    activities.push({
                        type: 'registration',
                        title: 'You registered for event',
                        description: (reg.events as any)?.title || 'Event',
                        time: reg.registered_at,
                        icon: Calendar,
                        color: 'text-purple-600',
                        bgColor: 'bg-purple-100'
                    });
                });
            }

            // For Admins - Show events they created for their club
            if (userRole === 'admin') {
                const { data: club } = await supabase.from('clubs').select('id, name').eq('admin_id', userId!).single();

                if (club) {
                    // Events created by this admin's club
                    const { data: events } = await supabase
                        .from('events')
                        .select('id, title, status, created_at')
                        .eq('club_id', club.id)
                        .order('created_at', { ascending: false })
                        .limit(5);

                    events?.forEach(event => {
                        activities.push({
                            type: 'event',
                            title: `You created event`,
                            description: `${event.title} - ${event.status}`,
                            time: event.created_at,
                            icon: Calendar,
                            color: event.status === 'approved' ? 'text-green-600' : event.status === 'rejected' ? 'text-red-600' : 'text-yellow-600',
                            bgColor: event.status === 'approved' ? 'bg-green-100' : event.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                        });
                    });

                    // Reports submitted by this admin
                    const { data: reports } = await supabase
                        .from('event_reports')
                        .select('id, created_at, events(title)')
                        .eq('club_id', club.id)
                        .order('created_at', { ascending: false })
                        .limit(3);

                    reports?.forEach(report => {
                        activities.push({
                            type: 'report',
                            title: 'You submitted report',
                            description: (report.events as any)?.title || 'Event Report',
                            time: report.created_at,
                            icon: FileText,
                            color: 'text-purple-600',
                            bgColor: 'bg-purple-100'
                        });
                    });
                }
            }

            // For Dean - Show events they approved/rejected
            if (userRole === 'dean') {
                const { data: events } = await supabase
                    .from('events')
                    .select('id, title, status, created_at, clubs(name)')
                    .in('status', ['approved', 'rejected'])
                    .order('created_at', { ascending: false })
                    .limit(5);

                events?.forEach(event => {
                    activities.push({
                        type: 'event',
                        title: `Event ${event.status}`,
                        description: `${event.title} - ${(event.clubs as any)?.name || 'Unknown Club'}`,
                        time: event.created_at,
                        icon: event.status === 'approved' ? ClipboardCheck : AlertCircle,
                        color: event.status === 'approved' ? 'text-green-600' : 'text-red-600',
                        bgColor: event.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                    });
                });
            }

            // Sort by time
            activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
            setActivities(activities.slice(0, 8));
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-4 text-gray-500">Loading activities...</div>;
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No recent activities</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {activities.map((activity, index) => (
                <div key={index} className="flex gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${activity.bgColor} flex items-center justify-center`}>
                        <activity.icon className={`h-5 w-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {new Date(activity.time).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};
