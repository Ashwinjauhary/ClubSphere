import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { FileText, Download, Trash2, Plus, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { generateReportPDF } from '../utils/reportUtils';
import type { GeneratedReport } from '../types';
import { SkeletonList } from '../components/ui/Skeleton';

interface Report {
    id: string;
    title: string;
    status: 'draft' | 'final';
    created_at: string;
    generated_content: GeneratedReport & { introduction?: string };
    submitted_by: string;
}

export const ReportsDashboardPage = () => {
    const { user } = useAuthStore();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchReports();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            if (!user) return;

            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('submitted_by', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports((data as unknown as Report[]) || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (report: Report) => {
        if (!report.generated_content) return;
        generateReportPDF(report.title, report.generated_content);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this report?')) return;
        try {
            const { error } = await supabase.from('reports').delete().eq('id', id);
            if (error) throw error;
            setReports(reports.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Failed to delete report.');
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
                <SkeletonList count={4} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Event Reports</h1>
                    <p className="text-gray-500 mt-1">Manage and organizing your club's documentation.</p>
                </div>
                <Link to="/reports/ai-studio">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Report
                    </Button>
                </Link>
            </div>

            {reports.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-4">
                        <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No reports found</h3>
                    <p className="text-gray-500 mb-6">Start by creating your first AI-powered event report.</p>
                    <Link to="/reports/ai-studio">
                        <Button variant="outline">Open AI Studio</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${report.status === 'final' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {report.status.toUpperCase()}
                                    </div>
                                    <span className="text-xs text-gray-400 flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2" title={report.title}>
                                    {report.title}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                                    {report.generated_content.introduction}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                                    onClick={() => handleDownload(report)}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    PDF
                                </Button>
                                <button
                                    onClick={() => handleDelete(report.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
