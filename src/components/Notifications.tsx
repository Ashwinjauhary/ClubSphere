import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, X, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

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
            .eq('read', false);

        if (!error) {
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const isUnread = notifications.find(n => n.id === id)?.read === false;
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (isUnread) setUnreadCount(prev => Math.max(0, prev - 1));

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', user!.id);

        if (error) {
            console.error('Error deleting notification:', error);
            fetchNotifications();
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
                className={`relative p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 ${isOpen ? 'text-gray-600 bg-gray-100' : ''}`}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden z-50 text-left"
                    >
                        <div className="p-3 border-b border-gray-50 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-700 text-sm">Notifications</h3>
                            <div className="flex gap-2">
                                {notifications.length > 0 && (
                                    <button onClick={clearAll} className="text-xs text-gray-500 hover:text-red-600 transition-colors">Clear All</button>
                                )}
                                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                            </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto scrollbar-thin">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">No new notifications</div>
                            ) : (
                                <div>
                                    {notifications.map(notification => (
                                        <div key={notification.id} className={`group relative p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}>
                                            <div className="pr-6">
                                                <p className={`text-sm font-medium ${!notification.read ? 'text-blue-600' : 'text-gray-900'}`}>{notification.title}</p>
                                                <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                                                <p className="text-[10px] text-gray-400 mt-2">
                                                    {new Date(notification.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => deleteNotification(notification.id, e)}
                                                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
