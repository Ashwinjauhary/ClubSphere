import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, Search, Eye } from 'lucide-react';

interface Report {
    id: string;
    event_id: string;
    submitted_by: string;
    content: string;
    attendee_count: number;
    highlights: string;
    challenges: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ai_feedback: any;
    created_at: string;
    event_title?: string;
    club_name?: string;
    submitter_name?: string;
}

export const ReportsManagementTab = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/immutability
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('reports')
            .select(`
                *,
                events:event_id (title, clubs:club_id (name)),
                profiles:submitted_by (full_name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reports:', error);
        } else {
            const reportsWithDetails = data?.map(report => ({
                ...report,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                event_title: (report.events as any)?.title || 'Unknown Event',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                club_name: (report.events as any)?.clubs?.name || 'Unknown Club',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                submitter_name: (report.profiles as any)?.full_name || 'Unknown'
            })) || [];
            setReports(reportsWithDetails);
        }
        setLoading(false);
    };

    const deleteReport = async (reportId: string) => {
        if (!confirm('Are you sure you want to delete this report?')) {
            return;
        }

        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', reportId);

        if (error) {
            console.error('Error deleting report:', error);
            alert('Failed to delete report');
        } else {
            alert('Report deleted successfully');
            fetchReports();
            setSelectedReport(null);
        }
    };

    const filteredReports = reports.filter(report =>
        report.event_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.club_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading reports...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Reports Management</h2>
                <p className="text-gray-600">Total Reports: {reports.length}</p>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search reports by event or club..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Club</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendees</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredReports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{report.event_title}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {report.club_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {report.submitter_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {report.attendee_count || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedReport(report)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="View Details"
                                            >
                                                <Eye className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteReport(report.id)}
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
                {filteredReports.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No reports found matching your criteria
                    </div>
                )}
            </div>

            {/* Report Details Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{selectedReport.event_title}</h3>
                                    <p className="text-gray-600">{selectedReport.club_name}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Content</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.content}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Highlights</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.highlights || 'N/A'}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Challenges</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.challenges || 'N/A'}</p>
                                </div>

                                {selectedReport.ai_feedback && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">AI Analysis</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                                {JSON.stringify(selectedReport.ai_feedback, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4 border-t">
                                    <button
                                        onClick={() => deleteReport(selectedReport.id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                    >
                                        Delete Report
                                    </button>
                                    <button
                                        onClick={() => setSelectedReport(null)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
