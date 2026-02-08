import { PaymentProvider, PaymentInitiationParams, InitiationResult } from './payment-provider';
import crypto from 'crypto';

interface FlutterwaveConfig {
    publicKey: string;
    secretKey: string;
    encryptionKey: string;
    isTest: boolean;
    webhookSecret: string;
}

export class FlutterwaveProvider implements PaymentProvider {
    private config: FlutterwaveConfig;
    private baseUrl: string;

    constructor(config: FlutterwaveConfig) {
        this.config = config;
        this.baseUrl = 'https://api.flutterwave.com/v3';
    }

    /**
     * Initiate a Mobile Money payment (Orange/MTN Cameroon)
     */
    async initiatePayment(params: PaymentInitiationParams): Promise<InitiationResult> {
        try {
            const endpoint = `${this.baseUrl}/charges?type=mobile_money_franco`;

            // Map our generic params to Flutterwave's expected payload
            const payload = {
                tx_ref: params.reference || `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Use provided reference (UUID) or fallback
                amount: params.amount,
                currency: params.currency,
                payment_type: 'mobile_money_franco',
                country: 'CM', // Cameroon as default for this provider instance
                email: params.customerEmail,
                phone_number: params.customerPhone,
                fullname: params.metadata?.customerName || 'Customer',
                meta: params.metadata,
                redirect_url: params.successUrl,

                // Split Payments via Subaccounts
                subaccounts: params.splits?.map((split: { accountId: string; percentage: number }) => ({
                    id: split.accountId,
                    transaction_charge_type: 'flat_subaccount', // Platform takes fees from subaccount share? Or 'flat'
                    // For simplicity in this prompt, we assume the platform calculates the net amount 
                    // and tells Flutterwave exactly what to give the subaccount, effectively.
                    // However, Flutterwave split usually works by ratio or specific commission config.
                    // If we want exact control:
                    // transaction_split_ratio: split.percentage,
                    // transaction_charge: ...

                    // REVISIT: Simplest split is ratio based on total amount
                    transaction_split_ratio: Math.round(split.percentage * 100), // percentage is 0-100?
                }))
            };

            // Enhance payload for specific networks if needed
            // Mobile Money Franco usually handles OM and MOMO automatically based on number/prompt
            // But sometimes 'network' field is required: 'MTN' or 'ORANGE'

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.secretKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.status === 'success') {
                return {
                    success: true,
                    aggregatorTransactionId: data.data.id.toString(),
                    instructions: data.meta?.authorization?.mode === 'redirect' ? undefined : data.meta?.authorization?.instruction,
                    redirectUrl: data.meta?.authorization?.redirect,
                };
            } else {
                return {
                    success: false,
                    error: data.message || 'Payment initiation failed'
                };
            }

        } catch (error: any) {
            console.error('Flutterwave initiation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify webhook signature from Flutterwave
     */
    async verifyWebhook(payload: any, signature: string): Promise<boolean> {
        const secretHash = this.config.webhookSecret;
        if (!secretHash || !signature) return false;

        // Flutterwave sends signature in 'verif-hash' header
        return signature === secretHash;
    }
}
