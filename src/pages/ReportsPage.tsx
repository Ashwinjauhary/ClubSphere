// @ts-ignore
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FileText, Download, Calendar, User, Sparkles, Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { GeneratedReport } from '../types';
import { generateReportPDF } from '../utils/reportUtils';
import { motion } from 'framer-motion';
import { SkeletonList } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';

interface Report {
    id: string;
    generated_content: GeneratedReport;
    created_at: string;
    events: {
        title: string;
        date: string;
    };
    profiles: {
        full_name: string;
        email: string;
    };
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
                    profiles!reports_submitted_by_fkey ( full_name, email ),
                    report_images ( image_url, caption )
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
        // @ts-ignore
        generateReportPDF(title, report.generated_content, report.report_images);
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6 sm:p-8">
            <PageHeader
                title="System Reports"
                description="Comprehensive analysis and event insights."
                action={
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Link
                            to="/reports/submit"
                            className="group flex items-center gap-2 px-6 py-3 bg-white text-black rounded-sm border border-transparent hover:bg-zinc-200 transition-all font-bold tracking-wide uppercase text-sm"
                        >
                            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                            <span className="hidden sm:inline">Create New Report</span>
                            <span className="sm:hidden">New Report</span>
                        </Link>
                    </motion.div>
                }
            />

            {loading ? (
                <div className="grid gap-6">
                    <SkeletonList count={3} />
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid gap-6"
                >
                    {reports.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-900 text-lg font-bold">No reports submitted yet.</p>
                            <p className="text-gray-500 text-sm mt-2">Submit a report to get started with AI analysis.</p>
                        </div>
                    ) : (
                        reports.map((report) => (
                            <motion.div
                                key={report.id}
                                variants={item}
                                className="bg-white p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-3xl relative group overflow-hidden"
                            >
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 relative z-10">
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3 font-display tracking-tight">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            {report.events?.title || 'Unknown Event'}
                                        </h3>
                                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                                            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
                                                <User className="h-3 w-3" />
                                                {report.profiles?.full_name || 'Unknown Author'}
                                            </span>
                                            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(report.created_at), 'PPP')}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(report)}
                                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors shadow-lg shadow-gray-200"
                                    >
                                        <Download className="h-4 w-4" /> Download PDF
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8 relative z-10">
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Introduction</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 font-medium">
                                                {report.generated_content.introduction}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Key Highlights</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 font-medium">
                                                {report.generated_content.objectivesContent}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <Sparkles className="h-12 w-12 text-blue-600" />
                                            </div>
                                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Impact Analysis</h4>
                                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line line-clamp-4 relative z-10 font-medium">
                                                {report.generated_content.impactAnalysis || "No impact analysis available."}
                                            </p>
                                        </div>
                                        <div className="bg-gray-900 p-4 rounded-xl shadow-lg mt-2 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                                                    <Sparkles className="h-4 w-4 text-yellow-400" /> AI Generated Insights
                                                </h4>
                                                <p className="text-xs text-gray-400">
                                                    Detailed analysis included in PDF.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            )}
        </div>
    );
};
