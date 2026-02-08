import { supabase } from '@/lib/supabase/client';
import { NotificationType } from '@/lib/types/database';

export interface NotificationPayload {
    userId: string;
    roleType?: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
}

export const notificationDispatcher = {
    /**
     * Dispatch a notification to multiple channels based on user preferences.
     * Most common notifications are triggered by DB triggers, but this can be used for
     * application-level custom notifications.
     */
    async dispatch(payload: NotificationPayload) {
        try {
            // 1. Call the database function to create the notification and check preferences
            const { data, error } = await supabase.rpc('create_notification', {
                p_user_id: payload.userId,
                p_role_type: payload.roleType,
                p_notification_type: payload.type,
                p_title: payload.title,
                p_message: payload.message,
                p_related_entity_type: payload.relatedEntityType,
                p_related_entity_id: payload.relatedEntityId
            });

            if (error) throw error;

            // 2. The database function returns the notification ID if created.
            // We can now fetch the notification to see which channels were marked as 'true'
            // and trigger external services if necessary.

            const { data: notification, error: fetchError } = await supabase
                .from('notifications')
                .select('*')
                .eq('id', data)
                .single();

            if (fetchError || !notification) return;

            // 3. Trigger External Channels (Placeholders for real implementation)
            if (notification.sent_via_email) {
                await this.sendEmail(payload);
            }

            if (notification.sent_via_sms) {
                await this.sendSMS(payload);
            }

            if (notification.sent_via_push) {
                await this.sendPush(payload);
            }

            return notification;
        } catch (error) {
            console.error('Error dispatching notification:', error);
            throw error;
        }
    },

    /**
     * Placeholder for Email Integration (e.g., SendGrid)
     */
    async sendEmail(payload: NotificationPayload) {
        console.log(`[Email Service] Sending email to user ${payload.userId}: ${payload.title}`);
        // Real implementation would call a Server Action or Edge Function
    },

    /**
     * Placeholder for SMS Integration (e.g., Twilio, Africa's Talking)
     */
    async sendSMS(payload: NotificationPayload) {
        console.log(`[SMS Service] Sending SMS to user ${payload.userId}: ${payload.message}`);
        // Real implementation would call a Server Action or Edge Function
    },

    /**
     * Placeholder for Push Integration (e.g., Web Push)
     */
    async sendPush(payload: NotificationPayload) {
        console.log(`[Push Service] Sending Push Notification to user ${payload.userId}: ${payload.title}`);
        // This usually involves sending to a Push Subscription endpoint stored in DB
    }
};
