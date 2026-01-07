import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Search } from 'lucide-react';

interface Application {
    id: string;
    club_id: string;
    user_id: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    club_name?: string;
    user_name?: string;
    user_email?: string;
}

export const ApplicationsManagementTab = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('club_applications')
            .select(`
                *,
                clubs:club_id (name),
                profiles:user_id (full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching applications:', error);
        } else {
            const applicationsWithDetails = data?.map(app => ({
                ...app,
                club_name: (app.clubs as any)?.name || 'Unknown Club',
                user_name: (app.profiles as any)?.full_name || 'Unknown',
                user_email: (app.profiles as any)?.email || ''
            })) || [];
            setApplications(applicationsWithDetails);
        }
        setLoading(false);
    };

    const updateApplicationStatus = async (appId: string, newStatus: 'approved' | 'rejected') => {
        const { error } = await supabase
            .from('club_applications')
            .update({ status: newStatus })
            .eq('id', appId);

        if (error) {
            console.error('Error updating application:', error);
            alert('Failed to update application');
        } else {
            alert(`Application ${newStatus} successfully`);
            fetchApplications();
        }
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.club_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusStats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        return styles[status as keyof typeof styles] || styles.pending;
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading applications...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Total Applications</p>
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
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by club or user name..."
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
                    </select>
                </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Club</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied On</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredApplications.map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{app.user_name}</div>
                                        <div className="text-sm text-gray-500">{app.user_email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {app.club_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(app.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {app.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => updateApplicationStatus(app.id, 'approved')}
                                                    className="text-green-600 hover:text-green-900 flex items-center gap-1"
                                                >
                                                    <CheckCircle className="h-5 w-5" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                                    className="text-red-600 hover:text-red-900 flex items-center gap-1"
                                                >
                                                    <XCircle className="h-5 w-5" />
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                        {app.status !== 'pending' && (
                                            <span className="text-gray-400">No actions available</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredApplications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No applications found matching your criteria
                    </div>
                )}
            </div>
        </div>
    );
};
