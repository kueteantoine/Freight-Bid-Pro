import { supabase } from '@/lib/supabase/client';
import { NotificationType } from '@/lib/types/database';
import { sendSMSWithTemplate } from '@/app/actions/sms-actions';
import { sendEmailWithTemplate } from '@/app/actions/email-actions';

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

            // 3. Fetch user contact information
            const { data: user, error: userError } = await supabase
                .from('profiles')
                .select('email, phone_number')
                .eq('id', payload.userId)
                .single();

            if (userError || !user) {
                console.error('Failed to fetch user contact info:', userError);
                return notification;
            }

            // 4. Trigger External Channels
            const promises: Promise<any>[] = [];

            if (notification.sent_via_email && user.email) {
                promises.push(this.sendEmail(payload, user.email, notification.id));
            }

            if (notification.sent_via_sms && user.phone_number) {
                promises.push(this.sendSMS(payload, user.phone_number, notification.id));
            }

            if (notification.sent_via_push) {
                promises.push(this.sendPush(payload));
            }

            // Execute all channel sends in parallel
            await Promise.allSettled(promises);

            return notification;
        } catch (error) {
            console.error('Error dispatching notification:', error);
            throw error;
        }
    },

    /**
     * Send Email using Resend
     */
    async sendEmail(payload: NotificationPayload, email: string, notificationId?: string) {
        try {
            // Map notification type to template key
            const templateKey = this.getEmailTemplateKey(payload.type);

            if (!templateKey) {
                console.warn(`No email template for notification type: ${payload.type}`);
                return;
            }

            // Prepare template variables
            const variables = {
                user_name: '{{user_name}}', // Will be replaced by template renderer
                title: payload.title,
                message: payload.message,
                related_entity_type: payload.relatedEntityType,
                related_entity_id: payload.relatedEntityId,
            };

            const result = await sendEmailWithTemplate({
                to: email,
                templateKey,
                variables,
                userId: payload.userId,
                userRole: payload.roleType,
                notificationId,
            });

            if (!result.success) {
                console.error(`Failed to send email: ${result.error}`);
            }
        } catch (error) {
            console.error('Email sending error:', error);
        }
    },

    /**
     * Send SMS using Africa's Talking
     */
    async sendSMS(payload: NotificationPayload, phoneNumber: string, notificationId?: string) {
        try {
            // Map notification type to template key
            const templateKey = this.getSMSTemplateKey(payload.type);

            if (!templateKey) {
                console.warn(`No SMS template for notification type: ${payload.type}`);
                return;
            }

            // Prepare template variables
            const variables = {
                user_name: '{{user_name}}', // Will be replaced by template renderer
                title: payload.title,
                message: payload.message,
                related_entity_type: payload.relatedEntityType,
                related_entity_id: payload.relatedEntityId,
            };

            const result = await sendSMSWithTemplate({
                phoneNumber,
                templateKey,
                variables,
                userId: payload.userId,
                userRole: payload.roleType,
                notificationId,
            });

            if (!result.success) {
                console.error(`Failed to send SMS: ${result.error}`);
            }
        } catch (error) {
            console.error('SMS sending error:', error);
        }
    },

    /**
     * Send Push Notification (Web Push)
     */
    async sendPush(payload: NotificationPayload) {
        console.log(`[Push Service] Sending Push Notification to user ${payload.userId}: ${payload.title}`);
        // This usually involves sending to a Push Subscription endpoint stored in DB
        // Implementation depends on web push setup (e.g., using service workers)
    },

    /**
     * Map notification type to email template key
     */
    getEmailTemplateKey(type: NotificationType): string | null {
        const mapping: Record<string, string> = {
            'bid_received': 'notification_bid_received',
            'bid_outbid': 'notification_bid_outbid',
            'bid_awarded': 'notification_bid_awarded',
            'payment_received': 'notification_payment_received',
            'shipment_update': 'notification_shipment_update',
            'message_received': 'notification_message_received',
            'document_expiring': 'notification_document_expiring',
        };

        return mapping[type] || null;
    },

    /**
     * Map notification type to SMS template key
     */
    getSMSTemplateKey(type: NotificationType): string | null {
        const mapping: Record<string, string> = {
            'bid_received': 'sms_bid_received',
            'bid_outbid': 'sms_bid_outbid',
            'bid_awarded': 'sms_bid_awarded',
            'payment_received': 'sms_payment_received',
            'shipment_update': 'sms_shipment_update',
            'message_received': 'sms_message_received',
            'document_expiring': 'sms_document_expiring',
        };

        return mapping[type] || null;
    }
};
