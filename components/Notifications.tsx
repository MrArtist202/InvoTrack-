
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, FileText, CreditCard, UserPlus } from 'lucide-react';
import { notificationsAPI } from '../api';
import { Notification } from '../notificationStore';

interface NotificationsProps {
    adminId: string;
}

const Notifications: React.FC<NotificationsProps> = ({ adminId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every 5 seconds
        const interval = setInterval(loadNotifications, 5000);
        return () => clearInterval(interval);
    }, [adminId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await notificationsAPI.getAll();
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'invoice_created':
                return <FileText size={16} className="text-indigo-600" />;
            case 'payment_received':
                return <CreditCard size={16} className="text-emerald-600" />;
            case 'member_added':
                return <UserPlus size={16} className="text-blue-600" />;
            default:
                return <Bell size={16} className="text-slate-600" />;
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all"
            >
                <Bell size={20} className="text-slate-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                            >
                                <Check size={12} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell size={32} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-slate-400 text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleMarkAsRead(notif.id)}
                                    className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-indigo-50/50' : ''
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`p-2 rounded-xl ${!notif.is_read ? 'bg-white' : 'bg-slate-100'}`}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm ${!notif.is_read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                                                    {notif.title}
                                                </p>
                                                {!notif.is_read && (
                                                    <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 truncate">{notif.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{formatTime(notif.created_at || notif.timestamp)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-slate-100 bg-slate-50">
                            <button className="w-full text-center text-xs text-slate-500 font-medium hover:text-indigo-600 transition-colors">
                                View all activity
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Notifications;
