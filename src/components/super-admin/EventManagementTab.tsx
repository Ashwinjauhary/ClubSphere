import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Edit, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { SkeletonList } from '../ui/Skeleton';

interface Event {
    id: string;
    title: string;
    description: string;
    start_time: string;
    location: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
    club_id: string;
    created_at: string;
    club_name?: string;
    rejection_reason?: string;
}

export const EventManagementTab = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const navigate = useNavigate();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/immutability
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('events')
            .select(`
                *,
                clubs:club_id (name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching events:', error);
        } else {
            const eventsWithClub = data?.map(event => ({
                ...event,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                club_name: (event.clubs as any)?.name || 'Unknown Club'
            })) || [];
            setEvents(eventsWithClub);
        }
        setLoading(false);
    };

    const updateEventStatus = async (eventId: string, newStatus: string, reason?: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = { status: newStatus };
        if (newStatus === 'rejected' && reason) {
            updateData.rejection_reason = reason;
        }

        const { error } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', eventId);

        if (error) {
            console.error('Error updating event status:', error);
            alert('Failed to update event status');
        } else {
            alert(`Event ${newStatus} successfully`);
            fetchEvents();
        }
    };

    const approveEvent = (eventId: string) => {
        updateEventStatus(eventId, 'approved');
    };

    const rejectEvent = (eventId: string) => {
        const reason = prompt('Enter rejection reason:');
        if (reason) {
            updateEventStatus(eventId, 'rejected', reason);
        }
    };

    const deleteEvent = async (eventId: string, eventTitle: string) => {
        if (!confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
            return;
        }

        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId);

        if (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event');
        } else {
            alert('Event deleted successfully');
            fetchEvents();
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.club_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusStats = {
        total: events.length,
        pending: events.filter(e => e.status === 'pending').length,
        approved: events.filter(e => e.status === 'approved').length,
        rejected: events.filter(e => e.status === 'rejected').length,
        completed: events.filter(e => e.status === 'completed').length,
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            draft: 'bg-gray-100 text-gray-800',
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            completed: 'bg-blue-100 text-blue-800',
        };
        return styles[status as keyof typeof styles] || styles.draft;
    };

    if (loading) {
        return <SkeletonList count={6} />;
    }

    return (
        <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">{statusStats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{statusStats.pending}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{statusStats.approved}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{statusStats.rejected}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-blue-600">{statusStats.completed}</p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search events by title or club..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="completed">Completed</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
            </div>

            {/* Events Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Club</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredEvents.map((event) => (
                                <tr key={event.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                                        <div className="text-sm text-gray-500 line-clamp-1">{event.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {event.club_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(event.start_time).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {event.location}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(event.status)}`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            {event.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => approveEvent(event.id)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => rejectEvent(event.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => navigate(`/events/${event.id}`)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="View"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteEvent(event.id, event.title)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredEvents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No events found matching your criteria
                    </div>
                )}
            </div>
        </div>
    );
};
