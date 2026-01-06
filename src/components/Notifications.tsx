import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    created_at: string;
}

export const Notifications = () => {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchNotifications();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('public:notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev]);
                setUnreadCount(prev => prev + 1);
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    const fetchNotifications = async () => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        }
    };

    const markAsRead = async () => {
        if (unreadCount === 0) return;

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user!.id)
            .eq('read', false); // Only update unread ones

        if (!error) {
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        // Optimistic update
        const isUnread = notifications.find(n => n.id === id)?.read === false;
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (isUnread) setUnreadCount(prev => Math.max(0, prev - 1));

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', user!.id); // Add user_id filter for RLS

        if (error) {
            // Revert if error (optional, but good practice)
            console.error('Error deleting notification:', error);
            alert('Failed to delete notification. Please try again.');
            fetchNotifications(); // Refresh
        }
    };

    const clearAll = async () => {
        setNotifications([]);
        setUnreadCount(0);

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user!.id);

        if (error) console.error('Error clearing notifications:', error);
    };

    return (
        <div className="relative">
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) markAsRead();
                }}
                className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-gray-900"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-full top-0 ml-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                        <div className="flex gap-2">
                            {notifications.length > 0 && (
                                <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear All</button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="text-xs text-gray-500 hover:text-gray-700">Close</button>
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                        ) : (
                            <div>
                                {notifications.map(notification => (
                                    <div key={notification.id} className={`group relative p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}>
                                        <div className="pr-6">
                                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                            <p className="text-xs text-gray-600 mt-0.5">{notification.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-2 text-right">
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => deleteNotification(notification.id, e)}
                                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
