'use server';

import { Resend } from 'resend';

// =====================================================
// TYPES
// =====================================================

export interface EmailResult {
    success: boolean;
    messageId?: string;
    status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained';
    error?: string;
}

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    replyTo?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
}

export interface EmailProvider {
    send(options: EmailOptions): Promise<EmailResult>;
    getDeliveryStatus(messageId: string): Promise<EmailResult>;
}

// =====================================================
// RESEND PROVIDER
// =====================================================

class ResendProvider implements EmailProvider {
    private client: Resend;
    private defaultFrom: string;

    constructor() {
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not configured');
        }

        this.client = new Resend(apiKey);
        this.defaultFrom = process.env.RESEND_FROM_EMAIL || 'noreply@freightbidpro.com';
    }

    async send(options: EmailOptions): Promise<EmailResult> {
        try {
            const emailPayload: any = {
                from: options.from || this.defaultFrom,
                to: Array.isArray(options.to) ? options.to : [options.to],
                subject: options.subject,
            };

            // Add content (html or text)
            if (options.html) {
                emailPayload.html = options.html;
            }
            if (options.text) {
                emailPayload.text = options.text;
            }

            // Add optional fields
            if (options.replyTo) {
                emailPayload.replyTo = options.replyTo;
            }
            if (options.cc) {
                emailPayload.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
            }
            if (options.bcc) {
                emailPayload.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
            }
            if (options.attachments) {
                emailPayload.attachments = options.attachments.map(att => ({
                    filename: att.filename,
                    content: att.content,
                }));
            }

            const { data, error } = await this.client.emails.send(emailPayload);

            if (error) {
                console.error('Resend email error:', error);
                return {
                    success: false,
                    error: error.message || 'Failed to send email',
                };
            }

            return {
                success: true,
                messageId: data?.id,
                status: 'sent',
            };
        } catch (error: any) {
            console.error('Resend email exception:', error);
            return {
                success: false,
                error: error.message || 'Failed to send email',
            };
        }
    }

    async getDeliveryStatus(messageId: string): Promise<EmailResult> {
        try {
            const { data, error } = await this.client.emails.get(messageId);

            if (error) {
                return {
                    success: false,
                    error: error.message || 'Failed to get delivery status',
                };
            }

            // Map Resend status to our status
            let status: EmailResult['status'] = 'pending';

            if (data) {
                switch (data.last_event) {
                    case 'delivered':
                        status = 'delivered';
                        break;
                    case 'bounced':
                        status = 'bounced';
                        break;
                    case 'complained':
                        status = 'complained';
                        break;
                    case 'sent':
                        status = 'sent';
                        break;
                    default:
                        status = 'pending';
                }
            }

            return {
                success: true,
                messageId,
                status,
            };
        } catch (error: any) {
            console.error('Resend status check error:', error);
            return {
                success: false,
                error: error.message || 'Failed to check delivery status',
            };
        }
    }
}

// =====================================================
// EMAIL SERVICE
// =====================================================

class EmailService {
    private provider: EmailProvider;

    constructor() {
        this.provider = new ResendProvider();
    }

    /**
     * Validate email address format
     */
    validateEmail(email: string): { valid: boolean; error?: string } {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return {
                valid: false,
                error: 'Invalid email format',
            };
        }

        return { valid: true };
    }

    /**
     * Send email with automatic validation and retry logic
     */
    async send(
        options: EmailOptions,
        retryOptions?: {
            retries?: number;
        }
    ): Promise<EmailResult> {
        const { retries = 3 } = retryOptions || {};

        // Validate recipient email(s)
        const recipients = Array.isArray(options.to) ? options.to : [options.to];

        for (const email of recipients) {
            const validation = this.validateEmail(email);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Invalid recipient email: ${email}`,
                };
            }
        }

        // Ensure either HTML or text content is provided
        if (!options.html && !options.text) {
            return {
                success: false,
                error: 'Email must have either HTML or text content',
            };
        }

        // Attempt to send with retry logic
        let lastError: string = '';

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const result = await this.provider.send(options);

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
     * Send bulk emails to multiple recipients
     */
    async sendBulk(
        emails: Array<EmailOptions>
    ): Promise<Array<EmailResult & { recipient: string }>> {
        const results = await Promise.all(
            emails.map(async (emailOptions) => {
                const result = await this.send(emailOptions);
                const recipient = Array.isArray(emailOptions.to)
                    ? emailOptions.to[0]
                    : emailOptions.to;

                return {
                    ...result,
                    recipient,
                };
            })
        );

        return results;
    }

    /**
     * Get delivery status for an email
     */
    async getDeliveryStatus(messageId: string): Promise<EmailResult> {
        return this.provider.getDeliveryStatus(messageId);
    }

    /**
     * Generate HTML email from template
     */
    generateHTML(params: {
        title: string;
        preheader?: string;
        body: string;
        footerText?: string;
    }): string {
        const { title, preheader, body, footerText } = params;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${preheader ? `<meta name="description" content="${preheader}">` : ''}
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .content {
      margin-bottom: 30px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">Freight Bid Pro</div>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      <p>${footerText || '© 2026 Freight Bid Pro. All rights reserved.'}</p>
      <p>
        <a href="{{unsubscribe_url}}" style="color: #666; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
    }

    /**
     * Utility: Delay for retry logic
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const emailService = new EmailService();
