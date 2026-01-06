import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

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
    const [activeTab, setActiveTab] = useState<'events' | 'posts'>('events');
    const [selectedEvent, setSelectedEvent] = useState<PendingEvent | null>(null);
    const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null);

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

        } catch (error) {
            console.error('Error fetching approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEventAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            const newStatus = action === 'approve' ? 'approved' : 'rejected';
            const { error } = await supabase
                .from('events')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            setEvents(events.filter(e => e.id !== id));
            setSelectedEvent(null);
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Failed to update event status.');
        }
    };

    const handlePostAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            const newStatus = action === 'approve' ? 'approved' : 'rejected';
            const { error } = await supabase
                .from('posts')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            setPosts(posts.filter(p => p.id !== id));
            setSelectedPost(null);
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Failed to update post status.');
        }
    };

    if (loading) return <div className="text-center py-12">Loading approvals...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Approvals & Review</h1>
                    <p className="text-gray-500 mt-1">Authorize content and proposals from clubs.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'events'
                            ? 'border-brand-500 text-brand-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Event Proposals ({events.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'posts'
                            ? 'border-brand-500 text-brand-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Wall Posts ({posts.length})
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                {activeTab === 'events' ? (
                    events.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {events.map((event) => (
                                <div key={event.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                                Event Proposal
                                            </span>
                                            {/* @ts-ignore */}
                                            <span className="text-sm text-gray-500">• {event.clubs?.name || 'Unknown Club'}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" /> {format(new Date(event.start_time), 'MMM d, yyyy')}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold">₹{event.budget?.toLocaleString() || '0'}</span> Budget
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}>Details</Button>
                                        <Button variant="danger" size="sm" onClick={() => handleEventAction(event.id, 'reject')}>Reject</Button>
                                        <Button size="sm" onClick={() => handleEventAction(event.id, 'approve')}>Approve</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-500">No pending event proposals.</div>
                    )
                ) : (
                    posts.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {posts.map((post) => (
                                <div key={post.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 ring-1 ring-inset ring-blue-600/20">
                                                Wall Post
                                            </span>
                                            {/* @ts-ignore */}
                                            <span className="text-sm text-gray-500">• {post.clubs?.name || 'Unknown Club'}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">{post.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{post.content}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedPost(post)}>Preview</Button>
                                        <Button variant="danger" size="sm" onClick={() => handlePostAction(post.id, 'reject')}>Reject</Button>
                                        <Button size="sm" onClick={() => handlePostAction(post.id, 'approve')}>Approve</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-500">No pending wall posts.</div>
                    )
                )}
            </div>

            {/* Event Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                            <button onClick={() => setSelectedEvent(null)}><X className="h-6 w-6" /></button>
                        </div>
                        <div className="space-y-4">
                            <p className="text-gray-600">{selectedEvent.description}</p>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <span className="block text-xs font-bold text-gray-500 uppercase">Date</span>
                                    {format(new Date(selectedEvent.start_time), 'PPp')}
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-gray-500 uppercase">Budget</span>
                                    ₹{selectedEvent.budget}
                                </div>
                            </div>
                            {selectedEvent.poster_url && (
                                <img src={selectedEvent.poster_url} alt="Poster" className="w-full rounded-lg" />
                            )}
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="danger" onClick={() => handleEventAction(selectedEvent.id, 'reject')}>Reject</Button>
                            <Button onClick={() => handleEventAction(selectedEvent.id, 'approve')}>Approve Event</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Post Modal */}
            {selectedPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-2xl font-bold">{selectedPost.title}</h2>
                            <button onClick={() => setSelectedPost(null)}><X className="h-6 w-6" /></button>
                        </div>
                        <div className="space-y-4">
                            {/* @ts-ignore */}
                            <p className="text-sm text-gray-500">By {selectedPost.author?.full_name}</p>
                            <div className="prose max-w-none text-gray-800 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                                {selectedPost.content}
                            </div>
                            {selectedPost.image_url && (
                                <img src={selectedPost.image_url} alt="Post Image" className="w-full rounded-lg" />
                            )}
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="danger" onClick={() => handlePostAction(selectedPost.id, 'reject')}>Reject</Button>
                            <Button onClick={() => handlePostAction(selectedPost.id, 'approve')}>Approve Post</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
