import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Check, X, User } from 'lucide-react';
// import { useParams, useNavigate } from 'react-router-dom';

interface Application {
    id: string;
    user_id: string;
    club_id: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    profiles: {
        full_name: string;
        email: string;
    };
    clubs: {
        name: string;
    }
}

export const ClubApplicationsPage = () => {
    const { user } = useAuthStore();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchApplications();
    }, [user]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            // Fetch applications for clubs where the current user is admin
            const { data, error } = await supabase
                .from('club_applications')
                .select(`
                    id, 
                    user_id,
                    club_id,
                    status,
                    created_at,
                    profiles:user_id ( full_name, email ),
                    clubs!inner ( name, admin_id )
                `)
                .eq('clubs.admin_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to match interface (handling arrays from joins)
            const formattedData = (data || []).map((app: any) => ({
                ...app,
                profiles: Array.isArray(app.profiles) ? app.profiles[0] : app.profiles,
                clubs: Array.isArray(app.clubs) ? app.clubs[0] : app.clubs
            }));

            setApplications(formattedData);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (appId: string, newStatus: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('club_applications')
                .update({ status: newStatus })
                .eq('id', appId);

            if (error) throw error;

            // Optimistic update
            setApplications(prev => prev.map(app =>
                app.id === appId ? { ...app, status: newStatus } : app
            ));

            // If approved, add to club_members
            if (newStatus === 'approved') {
                const app = applications.find(a => a.id === appId);
                if (app) {
                    await supabase.from('club_members').insert({
                        club_id: app.club_id,
                        user_id: app.user_id,
                        role: 'member'
                    });
                }
            }

        } catch (error) {
            console.error(`Error ${newStatus} application:`, error);
            alert('Action failed');
        }
    };

    if (loading) return <div>Loading applications...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Club Applications</h1>

            {applications.length === 0 ? (
                <div className="text-gray-500">No applications found.</div>
            ) : (
                <div className="bg-white rounded-lg shadow border border-gray-200 divide-y divide-gray-200">
                    {applications.map((app) => (
                        <div key={app.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">{app.profiles.full_name}</h3>
                                    <p className="text-xs text-gray-500">{app.profiles.email}</p>
                                    <p className="text-xs text-brand-600 mt-1">Applied to: {app.clubs.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {app.status === 'pending' ? (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={() => handleAction(app.id, 'approved')}
                                        >
                                            <Check className="h-4 w-4 mr-1" /> Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleAction(app.id, 'rejected')}
                                        >
                                            <X className="h-4 w-4 mr-1" /> Reject
                                        </Button>
                                    </>
                                ) : (
                                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${app.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
