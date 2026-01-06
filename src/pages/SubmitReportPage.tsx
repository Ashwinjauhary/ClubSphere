import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { FileText, Sparkles, AlertCircle } from 'lucide-react';
import { analyzeReportWithAI } from '../services/aiService';
import type { AIAnalysisResult } from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const SubmitReportPage = () => {
    const navigate = useNavigate();
    const { user, managedClubId } = useAuthStore();
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
    const [uploading, setUploading] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);

    const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm();
    const reportContent = watch('content');

    useEffect(() => {
        if (!user) return;
        fetchPendingReportEvents();
    }, [user, managedClubId]);

    const fetchPendingReportEvents = async () => {
        let query = supabase
            .from('events')
            .select('id, title, start_time, club_id')
            .in('status', ['approved', 'completed'])
            .lt('end_time', new Date().toISOString())
            .order('start_time', { ascending: false });

        if (managedClubId) {
            query = query.eq('club_id', managedClubId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching events:', error);
            return;
        }

        setEvents(data || []);
    };

    const onAnalyze = async () => {
        if (!reportContent || reportContent.length < 50) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzeReportWithAI(reportContent);
            setAnalysis(result);
            if (result) {
                // Auto-fill some fields if empty
                // This is just a UX enhancement
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `reports/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('club-media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('club-media').getPublicUrl(filePath);
            setFileUrl(data.publicUrl);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('File upload failed');
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (data: any) => {
        if (!selectedEvent) return alert('Please select an event');

        try {
            const { error } = await supabase.from('reports').insert({
                event_id: selectedEvent,
                submitted_by: user?.id,
                content: data.content,
                attendee_count: parseInt(data.attendance),
                highlights: data.highlights,
                challenges: data.challenges,
                ai_feedback: analysis,
                // attachment_url: fileUrl // If we added this column to reports table
            });

            if (error) throw error;

            navigate('/dashboard');
        } catch (error) {
            console.error('Submission failed:', error);
            alert('Failed to submit report. Please try again.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Submit Event Report</h1>
                <p className="text-gray-500 mt-1">Document the outcomes of your completed events.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Event</label>
                                <select
                                    className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                                    value={selectedEvent}
                                    onChange={(e) => setSelectedEvent(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose a completed event --</option>
                                    {events.map(evt => (
                                        <option key={evt.id} value={evt.id}>
                                            {evt.title} ({new Date(evt.start_time).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                                {events.length === 0 && (
                                    <p className="mt-1 text-xs text-amber-600 flex items-center">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        No pending events found to report on.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Count</label>
                                    <input
                                        type="number"
                                        className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                                        {...register('attendance', { required: true })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Evidence</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                        />
                                        <div className={`flex items-center justify-center border border-gray-300 rounded-md py-2 px-3 ${fileUrl ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                                            {uploading ? 'Uploading...' : fileUrl ? 'File Uploaded ✓' : 'Click to Upload Photos'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Key Highlights</label>
                                <textarea
                                    className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm h-24"
                                    placeholder="What went well? notable guests, achievements..."
                                    {...register('highlights')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Challenges Faced</label>
                                <textarea
                                    className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm h-24"
                                    placeholder="Any issues or blockers encountered..."
                                    {...register('challenges')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Executive Summary (for AI)</label>
                                <textarea
                                    className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm h-32"
                                    placeholder="Comprehensive overview of the event..."
                                    {...register('content', { required: true })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button type="button" variant="secondary" onClick={onAnalyze} disabled={isAnalyzing || !reportContent}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {isAnalyzing ? 'Analyzing...' : 'Generate AI Report'}
                                </Button>
                                <Button type="submit" loading={isSubmitting || uploading}>Submit Report</Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: AI Insights Preview */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 text-white shadow-lg sticky top-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="h-5 w-5 text-yellow-300" />
                            <h3 className="font-bold text-lg">AI Assistant</h3>
                        </div>

                        {analysis ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold mb-1">Impact Score</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-bold text-white">{analysis.impactScore}</span>
                                        <span className="text-sm text-indigo-200 mb-1">/ 10</span>
                                    </div>
                                </div>

                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold mb-2">Summary</p>
                                    <p className="text-sm leading-relaxed text-indigo-50">{analysis.summary}</p>
                                </div>

                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold mb-2">Suggestions</p>
                                    <ul className="text-sm space-y-2 text-indigo-50 list-disc list-inside">
                                        {analysis.improvements.slice(0, 2).map((imp, i) => (
                                            <li key={i}>{imp}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 opacity-60">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Write your executive summary and click "Generate AI Report" to see real-time insights.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
