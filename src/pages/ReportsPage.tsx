// @ts-ignore
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FileText, Download, Calendar, User, Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { GeneratedReport } from '../types';
import { generateReportPDF } from '../utils/reportUtils';

interface Report {
    id: string;
    generated_content: GeneratedReport; // Using the structured JSON
    created_at: string;
    events: {
        title: string;
        date: string; // Assuming event date is start_time
    };
    profiles: {
        full_name: string;
        email: string;
    };
    // Derived fields from JSON for display
    attendee_count?: number;
}

export const ReportsPage = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('reports')
                .select(`
                    id,
                    generated_content,
                    created_at,
                    events ( title, start_time ),
                    profiles ( full_name, email )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            // @ts-ignore
            setReports(data || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (report: Report) => {
        if (!report.generated_content) return;
        const title = report.events?.title || "Report";
        generateReportPDF(title, report.generated_content);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">System Reports</h1>
                    <p className="text-gray-500 mt-1">Review event reports and post-event analysis submitted by clubs.</p>
                </div>
                <Link
                    to="/reports/ai-studio"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Report
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading reports...</div>
            ) : (
                <div className="grid gap-6">
                    {reports.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                            <p className="text-gray-500">No reports submitted yet.</p>
                        </div>
                    ) : (
                        reports.map((report) => (
                            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-brand-600" />
                                            {report.events?.title || 'Unknown Event'}
                                        </h3>
                                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                {report.profiles?.full_name || 'Unknown Author'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Submitted {format(new Date(report.created_at), 'PPP')}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(report)}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border rounded-md hover:bg-gray-50"
                                    >
                                        <Download className="h-4 w-4" /> Download PDF
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 uppercase">Introduction</h4>
                                            <p className="mt-1 text-gray-600 text-sm line-clamp-3">
                                                {report.generated_content.introduction}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 uppercase">Highlights (Objectives)</h4>
                                            <p className="mt-1 text-gray-600 text-sm line-clamp-3">
                                                {report.generated_content.objectivesContent}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 uppercase">Impact Analysis</h4>
                                            <p className="mt-1 text-gray-600 text-sm whitespace-pre-line line-clamp-4">
                                                {report.generated_content.impactAnalysis || "No impact analysis available."}
                                            </p>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mt-2">
                                            <h4 className="text-sm font-bold text-purple-900 mb-1 flex items-center gap-2">
                                                ✨ AI Generated
                                            </h4>
                                            <p className="text-xs text-purple-700">
                                                Full analysis available in PDF.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
