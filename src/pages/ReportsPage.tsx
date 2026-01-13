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
                    profiles!fk_reports_submitted_by ( full_name, email ),
                    report_images ( image_url, caption )
                `) // Explicit FK for Reports
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
                            className="group flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all font-medium"
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
                        <div className="text-center py-20 glass rounded-3xl">
                            <FileText className="h-16 w-16 text-brand-200 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No reports submitted yet.</p>
                            <p className="text-gray-400 text-sm mt-2">Submit a report to get started with AI analysis.</p>
                        </div>
                    ) : (
                        reports.map((report) => (
                            <motion.div
                                key={report.id}
                                variants={item}
                                className="glass-card p-6 md:p-8 hover:shadow-xl transition-shadow border-l-4 border-l-brand-500"
                            >
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                            <FileText className="h-6 w-6 text-brand-600" />
                                            {report.events?.title || 'Unknown Event'}
                                        </h3>
                                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                                <User className="h-4 w-4 text-gray-400" />
                                                {report.profiles?.full_name || 'Unknown Author'}
                                            </span>
                                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {format(new Date(report.created_at), 'PPP')}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(report)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-200"
                                    >
                                        <Download className="h-4 w-4" /> Download Professional PDF
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="bg-white/50 p-4 rounded-xl border border-white/20">
                                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 text-brand-600">Introduction</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                                {report.generated_content.introduction}
                                            </p>
                                        </div>
                                        <div className="bg-white/50 p-4 rounded-xl border border-white/20">
                                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 text-brand-600">Key Highlights</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                                {report.generated_content.objectivesContent}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-white/50 p-4 rounded-xl border border-white/20 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-2 opacity-50">
                                                <Sparkles className="h-12 w-12 text-purple-200" />
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 text-purple-600">Impact Analysis</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line line-clamp-4 relative z-10">
                                                {report.generated_content.impactAnalysis || "No impact analysis available."}
                                            </p>
                                        </div>
                                        <div className="bg-gradient-to-r from-purple-50 to-brand-50 p-4 rounded-xl border border-purple-100 mt-2 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-purple-900 mb-1 flex items-center gap-2">
                                                    <Sparkles className="h-4 w-4" /> AI Generated Insights
                                                </h4>
                                                <p className="text-xs text-purple-700">
                                                    Full detailed analysis available in the PDF report.
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
