'use server';

import { emailService, EmailResult, EmailOptions } from '@/lib/services/email-service';
import { createClient } from '@/lib/supabase/server';
import { renderEmailTemplate } from '@/lib/services/admin/templates';

// =====================================================
// SEND EMAIL
// =====================================================

export async function sendEmail(params: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    userId?: string;
    notificationId?: string;
    from?: string;
    replyTo?: string;
}): Promise<EmailResult> {
    try {
        const { to, subject, html, text, userId, notificationId, from, replyTo } = params;

        // Send email
        const result = await emailService.send({
            to,
            subject,
            html,
            text,
            from,
            replyTo,
        });

        // Log delivery attempt
        if (userId || notificationId) {
            const recipient = Array.isArray(to) ? to[0] : to;

            await logMessageDelivery({
                userId,
                notificationId,
                messageType: 'email',
                provider: 'resend',
                recipient,
                messageId: result.messageId,
                status: result.success ? 'sent' : 'failed',
                errorMessage: result.error,
            });
        }

        return result;
    } catch (error: any) {
        console.error('Send email error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send email',
        };
    }
}

// =====================================================
// SEND EMAIL WITH TEMPLATE
// =====================================================

export async function sendEmailWithTemplate(params: {
    to: string | string[];
    templateKey: string;
    variables: Record<string, any>;
    userId?: string;
    userRole?: string;
    language?: string;
    notificationId?: string;
    from?: string;
    replyTo?: string;
}): Promise<EmailResult> {
    try {
        const { to, templateKey, variables, userId, userRole, language, notificationId, from, replyTo } = params;

        // Render template
        const templateResult = await renderEmailTemplate(templateKey, variables, userRole, language);

        if (!templateResult.success || !templateResult.data) {
            return {
                success: false,
                error: templateResult.error || 'Failed to render email template',
            };
        }

        const { subject, body } = templateResult.data;

        // Generate HTML email
        const html = emailService.generateHTML({
            title: subject,
            body,
            footerText: '© 2026 Freight Bid Pro. All rights reserved.',
        });

        // Send email
        return sendEmail({
            to,
            subject,
            html,
            userId,
            notificationId,
            from,
            replyTo,
        });
    } catch (error: any) {
        console.error('Send email with template error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send email with template',
        };
    }
}

// =====================================================
// SEND BULK EMAIL
// =====================================================

export async function sendBulkEmail(params: {
    emails: Array<EmailOptions & { userId?: string }>;
}): Promise<Array<EmailResult & { recipient: string }>> {
    try {
        const { emails } = params;

        const results = await emailService.sendBulk(emails);

        // Log delivery attempts
        await Promise.all(
            results.map((result, index) => {
                const email = emails[index];

                if (email.userId) {
                    return logMessageDelivery({
                        userId: email.userId,
                        messageType: 'email',
                        provider: 'resend',
                        recipient: result.recipient,
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
        console.error('Send bulk email error:', error);
        throw error;
    }
}

// =====================================================
// GET EMAIL DELIVERY STATUS
// =====================================================

export async function getEmailDeliveryStatus(messageId: string): Promise<EmailResult> {
    try {
        return emailService.getDeliveryStatus(messageId);
    } catch (error: any) {
        console.error('Get email delivery status error:', error);
        return {
            success: false,
            error: error.message || 'Failed to get delivery status',
        };
    }
}

// =====================================================
// HANDLE BOUNCE (Webhook)
// =====================================================

export async function handleEmailBounce(params: {
    email: string;
    reason: string;
    messageId?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        // Add to blacklist
        await supabase.from('message_blacklist').insert({
            contact: params.email,
            contact_type: 'email',
            reason: `Bounced: ${params.reason}`,
        });

        // Update delivery log if messageId provided
        if (params.messageId) {
            await supabase
                .from('message_delivery_log')
                .update({ status: 'bounced', error_message: params.reason })
                .eq('message_id', params.messageId);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Handle email bounce error:', error);
        return {
            success: false,
            error: error.message || 'Failed to handle bounce',
        };
    }
}

// =====================================================
// HANDLE COMPLAINT (Webhook)
// =====================================================

export async function handleEmailComplaint(params: {
    email: string;
    reason: string;
    messageId?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        // Add to blacklist
        await supabase.from('message_blacklist').insert({
            contact: params.email,
            contact_type: 'email',
            reason: `Complaint: ${params.reason}`,
        });

        // Update delivery log if messageId provided
        if (params.messageId) {
            await supabase
                .from('message_delivery_log')
                .update({ status: 'complained', error_message: params.reason })
                .eq('message_id', params.messageId);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Handle email complaint error:', error);
        return {
            success: false,
            error: error.message || 'Failed to handle complaint',
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
