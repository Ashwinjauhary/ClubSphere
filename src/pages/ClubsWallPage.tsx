import { useEffect, useState } from 'react';
import { SkeletonList } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Share2, Users, Plus, X, Image as ImageIcon, Send, Trash2, Shield, Mail, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';

import { toast } from 'sonner';

interface Post {
    id: string;
    title: string;
    content: string;
    image_url: string;
    created_at: string;
    clubs: {
        id: string;
        name: string;
        logo_url: string;
    };
    author: {
        full_name: string;
    };
    likes_count?: number;
    comments_count?: number;
    has_liked?: boolean;
}

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
        full_name: string;
        avatar_url: string | null;
    };
}

interface CreatePostForm {
    title: string;
    content: string;
    image_url: string;
}

interface UserProfileDetails {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    role: string;
    created_at: string;
    memberships: {
        clubs: {
            name: string;
            logo_url: string | null;
        };
    }[];
}

export const ClubsWallPage = () => {
    const { user, role, managedClubId } = useAuthStore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Comment State
    const [activePostId, setActivePostId] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');

    // Profile View State
    const [viewingUser, setViewingUser] = useState<UserProfileDetails | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreatePostForm>();

    useEffect(() => {
        fetchPosts();
    }, [user]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    clubs ( id, name, logo_url ),
                    author:author_id ( full_name )
                `)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const enrichedPosts = await Promise.all(data.map(async (post: any) => {
                const { count: likesCount } = await supabase
                    .from('post_likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                const { count: commentsCount } = await supabase
                    .from('post_comments')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                let hasLiked = false;
                if (user) {
                    const { data: likeData } = await supabase
                        .from('post_likes')
                        .select('user_id')
                        .eq('post_id', post.id)
                        .eq('user_id', user.id)
                        .maybeSingle();
                    hasLiked = !!likeData;
                }

                return {
                    ...post,
                    likes_count: likesCount || 0,
                    comments_count: commentsCount || 0,
                    has_liked: hasLiked
                };
            }));

            setPosts(enrichedPosts);
        } catch (error) {
            console.error('Error fetching wall posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (post: Post) => {
        if (!user) {
            toast.error('Please login to like posts.');
            return;
        }

        const originalPosts = [...posts];
        const isLiking = !post.has_liked;

        setPosts(posts.map(p =>
            p.id === post.id
                ? { ...p, has_liked: isLiking, likes_count: (p.likes_count || 0) + (isLiking ? 1 : -1) }
                : p
        ));

        try {
            if (isLiking) {
                await supabase.from('post_likes').insert([{ user_id: user.id, post_id: post.id }]);
            } else {
                await supabase.from('post_likes').delete().eq('user_id', user.id).eq('post_id', post.id);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            setPosts(originalPosts); // Revert
        }
    };

    const handleShare = async (post: Post) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: post.content,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            toast.success('Link copied to clipboard!');
        }
    };

    const openComments = async (postId: string) => {
        setActivePostId(postId);
        setLoadingComments(true);
        try {
            const { data } = await supabase
                .from('post_comments')
                .select(`
                    *,
                    profiles:user_id ( full_name, avatar_url )
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            // @ts-ignore
            setComments(data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || !activePostId || !user) return;

        try {
            const { error } = await supabase.from('post_comments').insert([{
                post_id: activePostId,
                user_id: user.id,
                content: newComment
            }]);

            if (error) throw error;

            setNewComment('');
            openComments(activePostId);

            setPosts(posts.map(p =>
                p.id === activePostId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
            ));

        } catch (error) {
            console.error('Error posting comment:', error);
            toast.error('Failed to post comment.');
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
            if (error) throw error;

            setComments(comments.filter(c => c.id !== commentId));
            setPosts(posts.map(p =>
                p.id === activePostId
                    ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) }
                    : p
            ));
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment.');
        }
    };

    const canDeleteComment = (commentUserId: string) => {
        if (!user) return false;
        if (user.id === commentUserId) return true;
        if (role === 'admin' || role === 'dean') return true;
        return false;
    };

    // User Profile View Logic
    const handleViewProfile = async (userId: string) => {
        if (role !== 'admin' && role !== 'dean') return;

        try {
            setLoadingProfile(true);

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            const { data: membershipData, error: membError } = await supabase
                .from('club_members')
                .select(`
                    clubs ( name, logo_url )
                `)
                .eq('user_id', userId);

            if (membError) throw membError;

            setViewingUser({
                ...profileData,
                // @ts-ignore
                memberships: membershipData || []
            });

        } catch (error) {
            console.error('Error fetching user details:', error);
            alert('Failed to load user profile.');
        } finally {
            setLoadingProfile(false);
        }
    };

    const isModerator = role === 'admin' || role === 'dean';

    const handleCreatePost = async (data: CreatePostForm) => {
        if (!user || role !== 'admin' || !managedClubId) {
            alert('You must be a club admin to create posts.');
            return;
        }

        try {
            const { error } = await supabase.from('posts').insert([
                {
                    title: data.title,
                    content: data.content,
                    image_url: data.image_url || null,
                    club_id: managedClubId,
                    author_id: user.id,
                    status: 'pending'
                }
            ]);

            if (error) throw error;
            toast.success('Post submitted for approval!');
            setIsCreateModalOpen(false);
            reset();
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to submit post.');
        }
    };

    const canCreatePost = role === 'admin' && managedClubId;

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-10 p-6 sm:p-8">
            <PageHeader
                title="Clubs Wall"
                description="Discover stories, updates, and highlights from across the campus."
                action={canCreatePost && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-5 w-5 mr-2" />
                        Create Post
                    </Button>
                )}
            />

            {loading ? (
                <div className="max-w-4xl mx-auto p-6"><SkeletonList count={3} /></div>
            ) : (
                <div className="space-y-8">
                    {posts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-gray-500">No posts yet. Be the first to share something!</p>
                        </div>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                                {/* Header */}
                                <div className="p-5 flex items-center space-x-3">
                                    {post.clubs.logo_url ? (
                                        <img src={post.clubs.logo_url} alt={post.clubs.name} className="h-10 w-10 rounded-full object-cover border border-gray-100" />
                                    ) : (
                                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Users className="h-5 w-5 text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{post.clubs.name}</p>
                                        <p className="text-xs text-gray-500">
                                            Posted {formatDistanceToNow(new Date(post.created_at))} ago
                                        </p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-5 pb-3">
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                                </div>

                                {/* Image */}
                                {post.image_url && (
                                    <div className="w-full h-80 bg-gray-100 cursor-pointer" onClick={() => setActivePostId(post.id)}>
                                        <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                                    </div>
                                )}

                                {/* Footer Actions */}
                                <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between text-gray-500">
                                    <div className="flex space-x-6">
                                        <button
                                            onClick={() => handleLike(post)}
                                            className={clsx(
                                                "flex items-center space-x-1.5 transition-colors",
                                                post.has_liked ? "text-red-500" : "hover:text-red-500"
                                            )}
                                        >
                                            <Heart className={clsx("h-5 w-5", post.has_liked && "fill-current")} />
                                            <span className="text-sm font-medium">{post.likes_count || 0}</span>
                                        </button>
                                        <button
                                            onClick={() => openComments(post.id)}
                                            className="flex items-center space-x-1.5 hover:text-blue-500 transition-colors"
                                        >
                                            <MessageSquare className="h-5 w-5" />
                                            <span className="text-sm font-medium">{post.comments_count || 0}</span>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleShare(post)}
                                        className="flex items-center space-x-1.5 hover:text-green-500 transition-colors"
                                    >
                                        <Share2 className="h-5 w-5" />
                                        <span className="text-sm font-medium">Share</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Comments Modal */}
            {activePostId && !isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in pt-12">
                    <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Comments</h2>
                            <button onClick={() => setActivePostId(null)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                            {loadingComments ? (
                                <p className="text-center text-gray-400 text-sm">Loading comments...</p>
                            ) : comments.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm py-8">No comments yet. Say something!</p>
                            ) : (
                                comments.map(c => (
                                    <div key={c.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-sm">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div
                                                    onClick={() => handleViewProfile(c.user_id)}
                                                    className={clsx(
                                                        "h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden",
                                                        isModerator && "cursor-pointer ring-2 ring-transparent hover:ring-brand-500 transition-all"
                                                    )}
                                                >
                                                    {c.profiles?.avatar_url ? (
                                                        <img src={c.profiles.avatar_url} alt={c.profiles.full_name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Users className="h-3 w-3 text-gray-400" />
                                                    )}
                                                </div>
                                                <span
                                                    onClick={() => handleViewProfile(c.user_id)}
                                                    className={clsx(
                                                        "font-semibold text-gray-900 text-sm",
                                                        isModerator && "cursor-pointer hover:underline hover:text-brand-600"
                                                    )}
                                                >
                                                    {c.profiles?.full_name || 'Unknown User'}
                                                </span>
                                                <span className="text-xs text-gray-400">• {formatDistanceToNow(new Date(c.created_at))} ago</span>
                                            </div>
                                            {canDeleteComment(c.user_id) && (
                                                <button
                                                    onClick={() => handleDeleteComment(c.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-gray-800 ml-8">{c.content}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-white">
                            <div className="flex gap-2">
                                <input
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="flex-1 rounded-full border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-4 py-2 border"
                                    onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                                />
                                <Button size="sm" onClick={handlePostComment} disabled={!newComment.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Profile View Modal */}
            {(viewingUser || loadingProfile) && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden relative min-h-[300px]">
                        <button
                            onClick={() => setViewingUser(null)}
                            className="absolute top-3 right-3 z-10 text-gray-400 hover:text-gray-500 bg-white/50 rounded-full p-1"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {loadingProfile ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-3 p-8">
                                <SkeletonList count={1} />
                            </div>
                        ) : viewingUser && (
                            <>
                                <div className="h-24 bg-gradient-to-r from-brand-500 to-purple-600"></div>
                                <div className="px-6 pb-6">
                                    <div className="relative -mt-10 mb-4 flex justify-between items-end">
                                        <div className="h-20 w-20 rounded-full ring-4 ring-white bg-white overflow-hidden flex items-center justify-center bg-gray-100">
                                            {viewingUser.avatar_url ? (
                                                <img src={viewingUser.avatar_url} alt={viewingUser.full_name} className="h-full w-full object-cover" />
                                            ) : (
                                                <Users className="h-8 w-8 text-gray-400" />
                                            )}
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 capitalize">
                                            {viewingUser.role}
                                        </span>
                                    </div>

                                    <div className="text-center sm:text-left">
                                        <h3 className="text-xl font-bold text-gray-900">{viewingUser.full_name}</h3>
                                        <div className="flex items-center text-gray-500 text-sm mt-1 gap-2">
                                            <Mail className="h-4 w-4" />
                                            {viewingUser.email}
                                        </div>
                                        <div className="flex items-center text-gray-500 text-sm mt-1 gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Joined {new Date(viewingUser.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="mt-6 border-t border-gray-100 pt-4">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Club Memberships</h4>
                                        {viewingUser.memberships.length > 0 ? (
                                            <div className="space-y-2">
                                                {viewingUser.memberships.map((m, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                                                        {m.clubs.logo_url ? (
                                                            <img src={m.clubs.logo_url} className="h-5 w-5 rounded-full object-cover" />
                                                        ) : <Shield className="h-4 w-4 text-gray-400" />}
                                                        {m.clubs.name}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No memberships.</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Create Post Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in pt-12">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Create Update</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(handleCreatePost)} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    {...register('title', { required: 'Title is required' })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                                    placeholder="Exciting News!"
                                />
                                {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                <textarea
                                    {...register('content', { required: 'Content is required' })}
                                    rows={5}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                                    placeholder="Write something amazing..."
                                />
                                {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <ImageIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        {...register('image_url')}
                                        className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3 justify-end">
                                <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" loading={isSubmitting}>Submit for Approval</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
