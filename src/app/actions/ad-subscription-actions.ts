'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { initializeSubscriptionPayment } from '@/lib/services/payments/ad-subscription-payments';

// =====================================================
// TYPES
// =====================================================

export interface SubscriptionTier {
    id: string;
    tier_name: string;
    tier_slug: string;
    tier_description?: string;
    monthly_price: number;
    currency: string;
    visibility_multiplier: number;
    features: {
        analytics_level: 'basic' | 'detailed' | 'advanced';
        placement_priority: 'profile' | 'top_3' | 'homepage';
        support_tier: 'email' | 'priority' | 'dedicated';
        max_active_ads: number;
        api_access: boolean;
    };
    is_active: boolean;
    display_order: number;
}

export interface UserSubscription {
    id: string;
    user_id: string;
    tier_id: string;
    subscription_status: 'pending_payment' | 'active' | 'cancelled' | 'expired' | 'payment_failed';
    start_date: string;
    end_date?: string;
    next_billing_date?: string;
    payment_method?: string;
    payment_reference?: string;
    auto_renew: boolean;
    cancellation_reason?: string;
    cancelled_at?: string;
}

// =====================================================
// GET SUBSCRIPTION TIERS
// =====================================================

export async function getSubscriptionTiers() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('ad_subscription_tiers')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;

        return { success: true, data: data as SubscriptionTier[] };
    } catch (error: any) {
        console.error('Error fetching subscription tiers:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// GET ACTIVE SUBSCRIPTION
// =====================================================

export async function getActiveSubscription() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_user_active_subscription');

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching active subscription:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// CREATE SUBSCRIPTION (INITS PAYMENT)
// =====================================================

export async function createSubscription(
    tierId: string,
    paymentMethod: string
) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Check if user already has an active subscription
        const { data: existingSubscription } = await supabase
            .from('user_ad_subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('subscription_status', 'active')
            .single();

        if (existingSubscription) {
            return {
                success: false,
                error: 'You already have an active subscription. Please cancel it before subscribing to a new tier.',
            };
        }

        // Initialize Flutterwave payment
        const result = await initializeSubscriptionPayment(tierId, user.id);

        if (result.success) {
            revalidatePath('/advertising');
            return {
                success: true,
                data: {
                    subscriptionId: result.subscriptionId,
                    redirectUrl: result.redirectUrl,
                    instructions: result.instructions
                }
            };
        } else {
            return { success: false, error: result.error };
        }
    } catch (error: any) {
        console.error('Error initiating subscription:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// CANCEL SUBSCRIPTION
// =====================================================

export async function cancelSubscription(subscriptionId: string, reason?: string) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Update subscription to cancelled (maintains access until end of billing period)
        const { data, error } = await supabase
            .from('user_ad_subscriptions')
            .update({
                subscription_status: 'cancelled',
                auto_renew: false,
                cancellation_reason: reason,
                cancelled_at: new Date().toISOString(),
            })
            .eq('id', subscriptionId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error cancelling subscription:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// UPGRADE/DOWNGRADE SUBSCRIPTION
// =====================================================

export async function changeSubscriptionTier(newTierId: string) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get current active subscription
        const { data: currentSubscription, error: fetchError } = await supabase
            .from('user_ad_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('subscription_status', 'active')
            .single();

        if (fetchError || !currentSubscription) {
            return { success: false, error: 'No active subscription found' };
        }

        // Cancel current subscription
        await supabase
            .from('user_ad_subscriptions')
            .update({
                subscription_status: 'cancelled',
                auto_renew: false,
                cancellation_reason: 'Tier change',
                cancelled_at: new Date().toISOString(),
            })
            .eq('id', currentSubscription.id);

        // Create new subscription
        const startDate = new Date();
        const nextBillingDate = new Date();
        nextBillingDate.setDate(nextBillingDate.getDate() + 30);

        const { data, error } = await supabase
            .from('user_ad_subscriptions')
            .insert({
                user_id: user.id,
                tier_id: newTierId,
                subscription_status: 'active',
                start_date: startDate.toISOString(),
                next_billing_date: nextBillingDate.toISOString(),
                payment_method: currentSubscription.payment_method,
                auto_renew: true,
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error changing subscription tier:', error);
        return { success: false, error: error.message };
    }
}
