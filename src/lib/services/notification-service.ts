import { supabase } from '@/lib/supabase/client';
import { Notification } from '@/lib/types/database';

export const notificationService = {
    /**
     * Fetch notifications for the current user
     */
    async fetchNotifications(limit = 20) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as Notification[];
    },

    /**
     * Mark a notification as read
     */
    async markAsRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
    },

    /**
     * Subscribe to new notifications for the current user
     */
    subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
        return supabase
            .channel(`user-notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    callback(payload.new as Notification);
                }
            )
            .subscribe();
    }
};
