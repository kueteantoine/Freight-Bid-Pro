'use server';

import { smsService, SMSResult } from '@/lib/services/sms-service';
import { createClient } from '@/lib/supabase/server';
import { renderSmsTemplate } from '@/lib/services/admin/templates';

// =====================================================
// SEND SMS
// =====================================================

export async function sendSMS(params: {
    phoneNumber: string;
    message: string;
    userId?: string;
    notificationId?: string;
}): Promise<SMSResult> {
    try {
        const { phoneNumber, message, userId, notificationId } = params;

        // Send SMS
        const result = await smsService.send(phoneNumber, message);

        // Log delivery attempt
        if (userId || notificationId) {
            await logMessageDelivery({
                userId,
                notificationId,
                messageType: 'sms',
                provider: 'africastalking',
                recipient: phoneNumber,
                messageId: result.messageId,
                status: result.success ? 'sent' : 'failed',
                errorMessage: result.error,
            });
        }

        return result;
    } catch (error: any) {
        console.error('Send SMS error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send SMS',
        };
    }
}

// =====================================================
// SEND SMS WITH TEMPLATE
// =====================================================

export async function sendSMSWithTemplate(params: {
    phoneNumber: string;
    templateKey: string;
    variables: Record<string, any>;
    userId?: string;
    userRole?: string;
    language?: string;
    notificationId?: string;
}): Promise<SMSResult> {
    try {
        const { phoneNumber, templateKey, variables, userId, userRole, language, notificationId } = params;

        // Render template
        const templateResult = await renderSmsTemplate(templateKey, variables, userRole, language);

        if (!templateResult.success || !templateResult.data) {
            return {
                success: false,
                error: templateResult.error || 'Failed to render SMS template',
            };
        }

        const message = templateResult.data.message;

        // Send SMS
        return sendSMS({
            phoneNumber,
            message,
            userId,
            notificationId,
        });
    } catch (error: any) {
        console.error('Send SMS with template error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send SMS with template',
        };
    }
}

// =====================================================
// SEND BULK SMS
// =====================================================

export async function sendBulkSMS(params: {
    recipients: Array<{ phoneNumber: string; message: string; userId?: string }>;
}): Promise<Array<SMSResult & { phoneNumber: string }>> {
    try {
        const { recipients } = params;

        const results = await smsService.sendBulk(
            recipients.map(r => ({ phoneNumber: r.phoneNumber, message: r.message }))
        );

        // Log delivery attempts
        await Promise.all(
            results.map((result, index) => {
                const recipient = recipients[index];

                if (recipient.userId) {
                    return logMessageDelivery({
                        userId: recipient.userId,
                        messageType: 'sms',
                        provider: 'africastalking',
                        recipient: recipient.phoneNumber,
                        messageId: result.messageId,
                        status: result.success ? 'sent' : 'failed',
                        errorMessage: result.error,
                    });
                }

                return Promise.resolve();
            })
        );

        return results;
    } catch (error: any) {
        console.error('Send bulk SMS error:', error);
        throw error;
    }
}

// =====================================================
// GET SMS BALANCE
// =====================================================

export async function getSMSBalance(): Promise<{
    success: boolean;
    balance?: number;
    error?: string;
}> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Check if user is admin
        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role_type')
            .eq('user_id', user.id)
            .eq('role_type', 'admin')
            .single();

        if (!userRole) {
            return { success: false, error: 'Unauthorized' };
        }

        return smsService.getBalance();
    } catch (error: any) {
        console.error('Get SMS balance error:', error);
        return {
            success: false,
            error: error.message || 'Failed to get SMS balance',
        };
    }
}

// =====================================================
// GET SMS DELIVERY STATUS
// =====================================================

export async function getSMSDeliveryStatus(messageId: string): Promise<SMSResult> {
    try {
        return smsService.getDeliveryStatus(messageId);
    } catch (error: any) {
        console.error('Get SMS delivery status error:', error);
        return {
            success: false,
            error: error.message || 'Failed to get delivery status',
        };
    }
}

// =====================================================
// HELPER: LOG MESSAGE DELIVERY
// =====================================================

async function logMessageDelivery(params: {
    userId?: string;
    notificationId?: string;
    messageType: 'email' | 'sms';
    provider: string;
    recipient: string;
    messageId?: string;
    status: string;
    errorMessage?: string;
}) {
    try {
        const supabase = await createClient();

        await supabase.from('message_delivery_log').insert({
            user_id: params.userId,
            notification_id: params.notificationId,
            message_type: params.messageType,
            provider: params.provider,
            recipient: params.recipient,
            message_id: params.messageId,
            status: params.status,
            error_message: params.errorMessage,
        });
    } catch (error) {
        console.error('Failed to log message delivery:', error);
        // Don't throw - logging failure shouldn't break the main flow
    }
}
