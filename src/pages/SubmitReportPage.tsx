import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AlertCircle, Upload, FileText, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import type { AIAnalysisResult } from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const SubmitReportPage = () => {
    const navigate = useNavigate();
    const { user, managedClubId } = useAuthStore();
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [uploading, setUploading] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const { register, handleSubmit, formState: { isSubmitting } } = useForm();

    useEffect(() => {
        if (!user) return;
        fetchPendingReportEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (!error) setEvents(data || []);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];
        await uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `reports/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('club-media').upload(filePath, file);
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
        const eventDetails = events.find(e => e.id === selectedEvent) as any;
        if (!eventDetails) return alert('Event details not found');

        try {
            const { data: reportData, error } = await supabase.from('reports').insert({
                event_id: selectedEvent,
                club_id: eventDetails.club_id,
                title: `Report: ${eventDetails.title}`,
                submitted_by: user?.id,
                content: data.content || "Report file uploaded.",
                attendee_count: 0,
                highlights: "See attached report",
                challenges: "See attached report",
                generated_content: {
                    summary: data.content || "Report file uploaded.",
                    impactScore: 10,
                    strengths: ["Report Uploaded"],
                    improvements: ["N/A"],
                    sentiment: "positive",
                    introduction: "Attached Report",
                    objectivesContent: "See attachment",
                    impactAnalysis: "See attachment",
                    metricsAnalysis: "See attachment",
                    strategicRoadmap: ["Review Attachment"]
                } as AIAnalysisResult,
                status: 'final'
            }).select().single();

            if (error) throw error;

            if (fileUrl && reportData) {
                await supabase.from('report_images').insert({
                    report_id: reportData.id,
                    image_url: fileUrl,
                    caption: 'Event Evidence'
                });
            }
            toast.success('Report submitted successfully!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error('Failed to submit report.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
            >
                <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
                    Submit Event Report
                </h1>
                <p className="text-gray-500 mt-3 text-lg">Document your success and share the impact.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2"
                >
                    <div className="glass-card p-8 rounded-3xl relative overflow-hidden border-t-4 border-t-brand-500">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <FileText className="h-32 w-32 text-brand-600" />
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 relative z-10">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Select Event</label>
                                <div className="relative">
                                    <select
                                        className="block w-full rounded-xl border-gray-200 bg-white/50 py-3 px-4 text-gray-900 shadow-sm focus:border-brand-500 focus:ring-brand-500 transition-all hover:bg-white"
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
                                </div>
                                {events.length === 0 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center text-amber-600 text-sm mt-2 bg-amber-50 p-2 rounded-lg">
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        <span>No pending events found. Great job!</span>
                                    </motion.div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Upload Report</label>
                                <div
                                    className={`
                                        relative group flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl transition-all duration-300
                                        ${isDragOver ? 'border-brand-500 bg-brand-50 scale-[1.02]' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'}
                                        ${fileUrl ? 'bg-green-50 border-green-500' : ''}
                                    `}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                    onDragLeave={() => setIsDragOver(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragOver(false);
                                        if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
                                    }}
                                >
                                    {uploading ? (
                                        <div className="text-center">
                                            <Loader2 className="h-10 w-10 text-brand-600 animate-spin mx-auto mb-3" />
                                            <p className="text-sm text-gray-500 font-medium">Uploading securely...</p>
                                        </div>
                                    ) : fileUrl ? (
                                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                                            <div className="bg-green-100 p-3 rounded-full inline-flex mb-3">
                                                <CheckCircle className="h-8 w-8 text-green-600" />
                                            </div>
                                            <p className="text-green-700 font-bold">File Uploaded!</p>
                                            <p className="text-xs text-green-600 mt-1">Ready to submit</p>
                                        </motion.div>
                                    ) : (
                                        <>
                                            <div className="bg-brand-50 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                                <Upload className="h-8 w-8 text-brand-600" />
                                            </div>
                                            <div className="text-center space-y-1">
                                                <p className="text-sm font-medium text-gray-700">
                                                    <span className="text-brand-600 hover:underline cursor-pointer">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-xs text-gray-500">PDF, DOCX, or Images up to 10MB</p>
                                            </div>
                                            <input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleFileUpload}
                                                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                disabled={uploading}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Additional Notes</label>
                                <textarea
                                    className="block w-full rounded-xl border-gray-200 bg-white/50 py-3 px-4 text-gray-900 shadow-sm focus:border-brand-500 focus:ring-brand-500 min-h-[100px] transition-all hover:bg-white"
                                    placeholder="Add any specific highlights or context..."
                                    {...register('content')}
                                />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button
                                    type="submit"
                                    loading={isSubmitting || uploading}
                                    disabled={!fileUrl}
                                    className={`
                                        w-full sm:w-auto px-8 py-4 text-lg font-bold shadow-lg transition-all hover:scale-[1.02]
                                        ${!fileUrl ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700'}
                                    `}
                                >
                                    Submit Final Report <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </div>
                        </form>
                    </div>
                </motion.div>

                {/* Right Column: Tips */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass p-6 rounded-2xl"
                    >
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded mr-2">TIP</span>
                            Why Submit Reports?
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span>Track your club's impact over time.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span>Gain eligibility for budget increases.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span>Showcase achievements to the Dean.</span>
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
