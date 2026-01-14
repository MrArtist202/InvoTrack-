// Notification Store for InvoTrack
import { User } from './types';
import { notificationsAPI } from './api';

export interface Notification {
    id: string;
    type: 'invoice_created' | 'payment_received' | 'member_added';
    title: string;
    message: string;
    timestamp: string; // created_at from DB
    is_read: boolean;
    read?: boolean; // for compatibility if needed, but we should prefer is_read
    memberId?: string; // mapped from member_id
    invoiceId?: string; // mapped from invoice_id
    amount?: number;
    created_at?: string;
}

// Helper to notify admin when member creates invoice
export const notifyInvoiceCreated = async (member: User, amount: number, invoiceId: string): Promise<void> => {
    if (member.adminId) {
        try {
            await notificationsAPI.create({
                adminId: member.adminId,
                type: 'invoice_created',
                title: 'New Invoice Created',
                message: `${member.name} generated an invoice of $${amount.toLocaleString()}`,
                memberId: member.id,
                invoiceId,
                amount,
            });
        } catch (error) {
            console.error('Failed to create notification:', error);
        }
    }
};

// Deprecated local storage functions - kept empty to prevent import errors during migration if any files still import them
export const getNotifications = (adminId: string): Notification[] => [];
export const addNotification = (adminId: string, notification: any): void => { };
export const markAsRead = (adminId: string, notificationId: string): void => { };
export const markAllAsRead = (adminId: string): void => { };
export const getUnreadCount = (adminId: string): number => 0;
