'use server';

import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import AfricasTalking from 'africastalking';

// =====================================================
// TYPES
// =====================================================

export interface SMSResult {
    success: boolean;
    messageId?: string;
    status?: 'pending' | 'sent' | 'delivered' | 'failed';
    error?: string;
    cost?: number;
    recipient?: string;
}

export interface SMSProvider {
    send(to: string, message: string): Promise<SMSResult>;
    getBalance(): Promise<{ success: boolean; balance?: number; error?: string }>;
    getDeliveryStatus(messageId: string): Promise<SMSResult>;
}

// =====================================================
// AFRICA'S TALKING PROVIDER
// =====================================================

class AfricasTalkingProvider implements SMSProvider {
    private client: any;
    private sms: any;

    constructor() {
        const apiKey = process.env.AFRICAS_TALKING_API_KEY;
        const username = process.env.AFRICAS_TALKING_USERNAME || 'sandbox';

        if (!apiKey) {
            throw new Error('AFRICAS_TALKING_API_KEY is not configured');
        }

        this.client = AfricasTalking({
            apiKey,
            username,
        });

        this.sms = this.client.SMS;
    }

    async send(to: string, message: string): Promise<SMSResult> {
        try {
            const options = {
                to: [to],
                message,
                from: process.env.AFRICAS_TALKING_SENDER_ID,
            };

            const response = await this.sms.send(options);

            if (response.SMSMessageData.Recipients.length > 0) {
                const recipient = response.SMSMessageData.Recipients[0];

                if (recipient.status === 'Success') {
                    return {
                        success: true,
                        messageId: recipient.messageId,
                        status: 'sent',
                        cost: parseFloat(recipient.cost.replace('XAF ', '')),
                        recipient: recipient.number,
                    };
                } else {
                    return {
                        success: false,
                        error: recipient.status,
                        recipient: recipient.number,
                    };
                }
            }

            return {
                success: false,
                error: 'No recipients in response',
            };
        } catch (error: any) {
            console.error('Africa\'s Talking SMS error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send SMS',
            };
        }
    }

    async getBalance(): Promise<{ success: boolean; balance?: number; error?: string }> {
        try {
            const response = await this.client.APPLICATION.fetchApplicationData();

            return {
                success: true,
                balance: parseFloat(response.UserData.balance.replace('XAF ', '')),
            };
        } catch (error: any) {
            console.error('Africa\'s Talking balance error:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch balance',
            };
        }
    }

    async getDeliveryStatus(messageId: string): Promise<SMSResult> {
        // Africa's Talking doesn't provide a direct API for checking delivery status
        // Status updates are typically received via webhooks
        return {
            success: false,
            error: 'Delivery status check not supported. Use webhooks for delivery reports.',
        };
    }
}

// =====================================================
// SMS SERVICE
// =====================================================

class SMSService {
    private provider: SMSProvider;

    constructor() {
        // Initialize Africa's Talking as the primary provider
        this.provider = new AfricasTalkingProvider();
    }

    /**
     * Validate and format phone number to international format
     */
    validateAndFormatPhone(phoneNumber: string, defaultCountry: string = 'CM'): {
        valid: boolean;
        formatted?: string;
        error?: string;
    } {
        try {
            // Check if it's a valid phone number
            if (!isValidPhoneNumber(phoneNumber, defaultCountry as any)) {
                return {
                    valid: false,
                    error: 'Invalid phone number format',
                };
            }

            // Parse and format to E.164 international format
            const parsed = parsePhoneNumber(phoneNumber, defaultCountry as any);

            return {
                valid: true,
                formatted: parsed.format('E.164'), // e.g., +237123456789
            };
        } catch (error: any) {
            return {
                valid: false,
                error: error.message || 'Phone number validation failed',
            };
        }
    }

    /**
     * Send SMS with automatic phone number validation and formatting
     */
    async send(
        phoneNumber: string,
        message: string,
        options?: {
            defaultCountry?: string;
            retries?: number;
        }
    ): Promise<SMSResult> {
        const { defaultCountry = 'CM', retries = 3 } = options || {};

        // Validate and format phone number
        const validation = this.validateAndFormatPhone(phoneNumber, defaultCountry);

        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
            };
        }

        // Attempt to send with retry logic
        let lastError: string = '';

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const result = await this.provider.send(validation.formatted!, message);

                if (result.success) {
                    return result;
                }

                lastError = result.error || 'Unknown error';

                // Wait before retry (exponential backoff)
                if (attempt < retries) {
                    await this.delay(Math.pow(2, attempt) * 1000);
                }
            } catch (error: any) {
                lastError = error.message;

                if (attempt < retries) {
                    await this.delay(Math.pow(2, attempt) * 1000);
                }
            }
        }

        return {
            success: false,
            error: `Failed after ${retries} attempts: ${lastError}`,
        };
    }

    /**
     * Send bulk SMS to multiple recipients
     */
    async sendBulk(
        recipients: Array<{ phoneNumber: string; message: string }>,
        options?: {
            defaultCountry?: string;
        }
    ): Promise<Array<SMSResult & { phoneNumber: string }>> {
        const results = await Promise.all(
            recipients.map(async ({ phoneNumber, message }) => {
                const result = await this.send(phoneNumber, message, options);
                return {
                    ...result,
                    phoneNumber,
                };
            })
        );

        return results;
    }

    /**
     * Get SMS provider balance
     */
    async getBalance(): Promise<{ success: boolean; balance?: number; error?: string }> {
        return this.provider.getBalance();
    }

    /**
     * Get delivery status for a message
     */
    async getDeliveryStatus(messageId: string): Promise<SMSResult> {
        return this.provider.getDeliveryStatus(messageId);
    }

    /**
     * Utility: Delay for retry logic
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const smsService = new SMSService();
