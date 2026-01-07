import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Plus, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

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
            // Fetch club managed by user first? Or just search events created by user?
            // Events created by user is safer if they switch clubs, but generally admin_id matches.
            // Let's use created_by for now as it's reliable for the person who made it.
            // OR finding events where club_id is the one managed by user.

            // Better: find club, then find events for that club.
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
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'draft': return 'bg-gray-100 text-gray-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Proposals</h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-1">Manage your event drafts and proposals.</p>
                </div>
                <Link
                    to="/events/new"
                    className="inline-flex items-center justify-center px-4 py-2.5 sm:py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700"
                >
                    <Plus className="h-4 w-4 mr-2" /> New Proposal
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading proposals...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {events.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No proposals found. Start by creating one!
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card Layout */}
                            <div className="md:hidden divide-y divide-gray-200">
                                {events.map((event) => (
                                    <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <h3 className="text-base font-semibold text-gray-900 flex-1">{event.title}</h3>
                                            <Link
                                                to={`/proposals/${event.id}/edit`}
                                                className="text-brand-600 hover:text-brand-900 p-2 hover:bg-brand-50 rounded-md transition-colors"
                                                aria-label="Edit proposal"
                                            >
                                                <Edit2 className="h-5 w-5" />
                                            </Link>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-gray-500 uppercase">Status:</span>
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(event.status)} uppercase`}>
                                                    {event.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <span className="text-xs font-medium text-gray-500 uppercase">Date:</span>
                                                <span>{format(new Date(event.start_time), 'MMM d, yyyy h:mm a')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <span className="text-xs font-medium text-gray-500 uppercase">Location:</span>
                                                <span>{event.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table Layout */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {events.map((event) => (
                                            <tr key={event.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{event.title}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(event.status)} uppercase`}>
                                                        {event.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(new Date(event.start_time), 'MMM d, yyyy h:mm a')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {event.location}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link to={`/proposals/${event.id}/edit`} className="text-brand-600 hover:text-brand-900">
                                                        <Edit2 className="h-4 w-4" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
