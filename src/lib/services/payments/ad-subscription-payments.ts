'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { FlutterwaveProvider } from './flutterwave-provider';
import { PaymentInitiationParams } from './payment-provider';

/**
 * Service to handle advertisement subscription payments transition through Flutterwave
 */

const getFlutterwaveProvider = () => {
    return new FlutterwaveProvider({
        publicKey: process.env.FLW_PUBLIC_KEY || '',
        secretKey: process.env.FLW_SECRET_KEY || '',
        encryptionKey: process.env.FLW_ENCRYPTION_KEY || '',
        isTest: process.env.NODE_ENV !== 'production',
        webhookSecret: process.env.FLW_WEBHOOK_SECRET || '',
    });
};

/**
 * Initializes a subscription payment for a specific tier
 */
export async function initializeSubscriptionPayment(tierId: string, userId: string) {
    const supabase = await createSupabaseServerClient();

    // 1. Get tier details
    const { data: tier, error: tierError } = await supabase
        .from('ad_subscription_tiers')
        .select('*')
        .eq('id', tierId)
        .single();

    if (tierError || !tier) {
        return { success: false, error: 'Subscription tier not found' };
    }

    // 2. Get user profile for payment info
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name, phone_number')
        .eq('user_id', userId)
        .single();

    const { data: userAuth, error: authError } = await supabase.auth.admin.getUserById(userId);

    const email = userAuth?.user?.email || '';

    // 3. Create a pending subscription / transaction record
    // In our schema, we have user_ad_subscriptions.
    // We can create it with status 'pending_payment'
    const { data: subscription, error: subError } = await supabase
        .from('user_ad_subscriptions')
        .insert({
            user_id: userId,
            tier_id: tierId,
            subscription_status: 'pending_payment',
            start_date: new Date().toISOString(),
            // Set end_date to 30 days from now (default month)
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            payment_method: 'flutterwave',
            auto_renew: true,
        })
        .select()
        .single();

    if (subError) {
        return { success: false, error: 'Failed to create subscription record' };
    }

    // 4. Initiate Flutterwave payment
    const provider = getFlutterwaveProvider();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const params: PaymentInitiationParams = {
        amount: tier.monthly_price,
        currency: tier.currency || 'XAF',
        description: `Subscription to ${tier.tier_name} Tier`,
        customerEmail: email,
        customerPhone: profile?.phone_number || undefined,
        metadata: {
            subscriptionId: subscription.id,
            tierId: tier.id,
            userId: userId,
            type: 'ad_subscription'
        },
        reference: subscription.id, // Use subscription ID as reference
        successUrl: `${baseUrl}/advertising`,
        cancelUrl: `${baseUrl}/advertising`,
    };

    const result = await provider.initiatePayment(params);

    if (result.success) {
        // Update subscription with aggregator transaction ID if available
        if (result.aggregatorTransactionId) {
            await supabase
                .from('user_ad_subscriptions')
                .update({ payment_reference: result.aggregatorTransactionId })
                .eq('id', subscription.id);
        }

        return {
            success: true,
            redirectUrl: result.redirectUrl,
            instructions: result.instructions,
            subscriptionId: subscription.id
        };
    } else {
        // Rollback subscription if payment initialization fails
        await supabase
            .from('user_ad_subscriptions')
            .delete()
            .eq('id', subscription.id);

        return { success: false, error: result.error };
    }
}

/**
 * Verifies a subscription payment and activates the subscription
 */
export async function verifySubscriptionStatus(subscriptionId: string) {
    const supabase = await createSupabaseServerClient();

    // Here we would typically check with Flutterwave or wait for webhook
    // For now, this is a placeholder that would be called by a redirect or poll

    const { data: sub, error } = await supabase
        .from('user_ad_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

    if (error || !sub) return { success: false, error: 'Subscription not found' };

    // In a real scenario, we'd verify the transaction with FLW API here

    return {
        success: true,
        status: sub.subscription_status
    };
}
