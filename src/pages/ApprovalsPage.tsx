import { useState, useEffect } from 'react';
import { X, Calendar, FileText, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { generateReportPDF } from '../services/pdfService';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonList } from '../components/ui/Skeleton';

interface PendingEvent {
    id: string;
    title: string;
    start_time: string;
    budget: number;
    status: string;
    description?: string;
    poster_url?: string;
    clubs: { name: string } | null;
}

interface PendingPost {
    id: string;
    title: string;
    content: string;
    image_url: string;
    created_at: string;
    status: string;
    clubs: { name: string } | null;
    author: { full_name: string } | null;
}

export const ApprovalsPage = () => {
    const [events, setEvents] = useState<PendingEvent[]>([]);
    const [posts, setPosts] = useState<PendingPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'events' | 'posts' | 'reports'>('events');
    const [selectedEvent, setSelectedEvent] = useState<PendingEvent | null>(null);
    const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);

    useEffect(() => {
        fetchPendingItems();
    }, []);

    const fetchPendingItems = async () => {
        try {
            setLoading(true);

            // Fetch Events
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select(`
                    *,
                    clubs ( name )
                `)
                .eq('status', 'pending');

            if (eventsError) throw eventsError;
            // @ts-ignore
            setEvents(eventsData || []);

            // Fetch Posts
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select(`
                    *,
                    clubs ( name ),
                    author:author_id ( full_name )
                `)
                .eq('status', 'pending');

            if (postsError) throw postsError;
            // @ts-ignore
            setPosts(postsData || []);

            // Fetch Reports
            const { data: reportsData, error: reportsError } = await supabase
                .from('reports')
                .select(`
                    *,
                    events ( title, clubs ( name ) ),
                    submitted_by_user:profiles!reports_submitted_by_fkey ( full_name )
                `) // Explicit FK for Approvals
                .eq('approval_status', 'pending_approval');

            if (reportsError) throw reportsError;
            setReports(reportsData || []);

        } catch (error) {
            console.error('Error fetching approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEventAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            const newStatus = action === 'approve' ? 'approved' : 'rejected';
            const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            setEvents(events.filter(e => e.id !== id));
            setSelectedEvent(null);
            toast.success(`Event ${action}ed`);
        } catch (error) { console.error(error); toast.error('Failed to update event status'); }
    };

    const handlePostAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            const newStatus = action === 'approve' ? 'approved' : 'rejected';
            const { error } = await supabase.from('posts').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            setPosts(posts.filter(p => p.id !== id));
            setSelectedPost(null);
            toast.success(`Post ${action}ed`);
        } catch (error) { console.error(error); toast.error('Failed to update post status'); }
    };

    const handleReportAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            const newStatus = action === 'approve' ? 'approved' : 'rejected';
            const updates: any = {
                approval_status: newStatus,
                approved_at: new Date().toISOString()
            };

            const { error } = await supabase.from('reports').update(updates).eq('id', id);
            if (error) throw error;
            setReports(reports.filter(r => r.id !== id));
            setSelectedReport(null);
            toast.success(`Report ${action}ed`);
        } catch (error) {
            console.error('Error updating report:', error);
            toast.error('Failed to update report status.');
        }
    };

    const tabs = [
        { id: 'events', label: 'Event Proposals', count: events.length, icon: Calendar },
        { id: 'posts', label: 'Wall Posts', count: posts.length, icon: MessageSquare },
        { id: 'reports', label: 'Event Reports', count: reports.length, icon: FileText },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                        Approvals & Review
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">Authorize content and proposals.</p>
                </motion.div>
            </div>

            {/* Animated Tabs */}
            <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl backdrop-blur-sm w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 outline-none flex items-center gap-2
                            ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="active-pill"
                                className="absolute inset-0 bg-white shadow-sm rounded-lg"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-600'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <AnimatePresence mode='wait'>
                {loading ? (
                    <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <SkeletonList count={4} />
                    </motion.div>
                ) : (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                    >
                        {activeTab === 'events' && (
                            events.length > 0 ? (
                                <div className="grid gap-4">
                                    {events.map((event) => (
                                        <div key={event.id} className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-brand-300 transition-all">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 border border-yellow-200">
                                                        Proposal
                                                    </span>
                                                    <span className="text-sm text-gray-500 font-medium">From {event.clubs?.name || 'Unknown Club'}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">{event.title}</h3>
                                                <div className="text-sm text-gray-500 flex items-center gap-4">
                                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(event.start_time), 'MMM d, yyyy')}</span>
                                                    <span className="font-medium text-gray-700">₹{event.budget.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}>Details</Button>
                                                <Button className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200" size="sm" onClick={() => handleEventAction(event.id, 'reject')}>Reject</Button>
                                                <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={() => handleEventAction(event.id, 'approve')}>Approve</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="p-12 text-center text-gray-500 glass rounded-xl">No pending event proposals.</div>
                        )}

                        {activeTab === 'posts' && (
                            posts.length > 0 ? (
                                <div className="grid gap-4">
                                    {posts.map((post) => (
                                        <div key={post.id} className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-blue-300 transition-all">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 border border-blue-200">Post</span>
                                                    <span className="text-sm text-gray-500 font-medium">From {post.clubs?.name}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">{post.title}</h3>
                                                <p className="text-sm text-gray-500 line-clamp-1">{post.content}</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button variant="outline" size="sm" onClick={() => setSelectedPost(post)}>Preview</Button>
                                                <Button className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200" size="sm" onClick={() => handlePostAction(post.id, 'reject')}>Reject</Button>
                                                <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={() => handlePostAction(post.id, 'approve')}>Approve</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="p-12 text-center text-gray-500 glass rounded-xl">No pending wall posts.</div>
                        )}

                        {activeTab === 'reports' && (
                            reports.length > 0 ? (
                                <div className="grid gap-4">
                                    {reports.map((report) => (
                                        <div key={report.id} className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-purple-300 transition-all">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-800 border border-purple-200">Event Report</span>
                                                    <span className="text-sm text-gray-500 font-medium">{report.events?.clubs?.name}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">{report.events?.title}</h3>
                                                <p className="text-sm text-gray-500">Submitted by {report.submitted_by_user?.full_name}</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>Review</Button>
                                                <Button className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200" size="sm" onClick={() => handleReportAction(report.id, 'reject')}>Reject</Button>
                                                <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={() => handleReportAction(report.id, 'approve')}>Approve</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="p-12 text-center text-gray-500 glass rounded-xl">No pending event reports.</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals with AnimatePresence */}
            <AnimatePresence>
                {/* Event Modal */}
                {selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90dvh] overflow-y-auto p-8 relative z-10">
                            <div className="flex justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h2>
                                <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="space-y-6 mb-8">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                                    <p className="text-gray-600 leading-relaxed text-sm">{selectedEvent.description || "No description provided."}</p>
                                </div>

                                {/* Structured Proposal Data */}
                                {(selectedEvent as any).proposal_data && (
                                    <div className="grid grid-cols-1 gap-6">
                                        {(selectedEvent as any).proposal_data.objectives?.length > 0 && (
                                            <div>
                                                <h4 className="font-bold text-sm uppercase text-gray-500 tracking-wider mb-2">Objectives</h4>
                                                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                                                    {(selectedEvent as any).proposal_data.objectives.map((obj: string, i: number) => (
                                                        <li key={i}>{obj}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {(selectedEvent as any).proposal_data.structure_rounds?.length > 0 && (
                                            <div>
                                                <h4 className="font-bold text-sm uppercase text-gray-500 tracking-wider mb-2">Structure & Rounds</h4>
                                                <div className="space-y-3">
                                                    {(selectedEvent as any).proposal_data.structure_rounds.map((round: any, i: number) => (
                                                        <div key={i} className="pl-4 border-l-2 border-brand-200">
                                                            <p className="font-bold text-gray-900 text-sm">{round.round_name}</p>
                                                            <p className="text-gray-600 text-xs mt-1">{round.description}</p>
                                                            <p className="text-gray-400 text-[10px] mt-1 uppercase font-semibold">{round.duration}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(selectedEvent as any).proposal_data.rules?.length > 0 && (
                                            <div>
                                                <h4 className="font-bold text-sm uppercase text-gray-500 tracking-wider mb-2">Rules & Regulations</h4>
                                                <ul className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
                                                    {(selectedEvent as any).proposal_data.rules.map((rule: string, i: number) => (
                                                        <li key={i}>{rule}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {(selectedEvent as any).proposal_data.registration_fields?.length > 0 && (
                                            <div>
                                                <h4 className="font-bold text-sm uppercase text-gray-500 tracking-wider mb-2">Custom Registration Fields</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {(selectedEvent as any).proposal_data.registration_fields.map((field: any, i: number) => (
                                                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-medium">
                                                            {field.label} {field.required ? '*' : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Custom Sections */}
                                        {(selectedEvent as any).proposal_data.custom_sections?.length > 0 && (
                                            <>
                                                <hr className="border-gray-100 my-2" />
                                                {(selectedEvent as any).proposal_data.custom_sections.map((section: any, i: number) => (
                                                    <div key={i}>
                                                        <h4 className="font-bold text-sm uppercase text-gray-500 tracking-wider mb-2">{section.title}</h4>
                                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{section.content}</p>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="ghost" onClick={() => handleEventAction(selectedEvent.id, 'reject')} className="text-red-600 hover:bg-red-50">Reject</Button>
                                <Button onClick={() => handleEventAction(selectedEvent.id, 'approve')}>Approve Proposal</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Post Modal */}
                {selectedPost && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90dvh] overflow-y-auto p-8 relative z-10">
                            <div className="flex justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">{selectedPost.title}</h2>
                                <button onClick={() => setSelectedPost(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="h-5 w-5" /></button>
                            </div>
                            <p className="text-gray-600 mb-8 whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="ghost" onClick={() => handlePostAction(selectedPost.id, 'reject')} className="text-red-600 hover:bg-red-50">Reject</Button>
                                <Button onClick={() => handlePostAction(selectedPost.id, 'approve')}>Approve Post</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Report Modal */}
                {selectedReport && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90dvh] overflow-y-auto p-4 sm:p-8 relative z-10">
                            <div className="flex justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Review Report: {selectedReport.events?.title}</h2>
                                <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                        <h3 className="font-bold text-xs uppercase mb-2 text-purple-700 tracking-wider">Highlights</h3>
                                        <p className="text-sm text-gray-700">{selectedReport.highlights}</p>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                        <h3 className="font-bold text-xs uppercase mb-2 text-orange-700 tracking-wider">Challenges</h3>
                                        <p className="text-sm text-gray-700">{selectedReport.challenges}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h3 className="font-bold text-xs uppercase mb-2 text-gray-500 tracking-wider">Content Summary</h3>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedReport.content}</p>
                                </div>
                                <div className="flex gap-4 text-sm text-gray-500">
                                    <div className="px-3 py-1 bg-gray-100 rounded-lg">Attendees: <span className="font-semibold text-gray-900">{selectedReport.attendee_count}</span></div>
                                    <div className="px-3 py-1 bg-gray-100 rounded-lg">By: <span className="font-semibold text-gray-900">{selectedReport.submitted_by_user?.full_name}</span></div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                                <Button variant="outline" onClick={() => generateReportPDF(selectedReport.events?.title, selectedReport.generated_content, [])}>
                                    Preview PDF
                                </Button>
                                <Button variant="ghost" onClick={() => handleReportAction(selectedReport.id, 'reject')} className="text-red-600 hover:bg-red-50">Reject</Button>
                                <Button onClick={() => handleReportAction(selectedReport.id, 'approve')}>Approve & Publish</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
