'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// TYPES
// =====================================================

export interface CreateTierInput {
    tier_name: string;
    tier_slug: string;
    tier_description?: string;
    monthly_price: number;
    currency?: string;
    visibility_multiplier: number;
    features: {
        analytics_level: 'basic' | 'detailed' | 'advanced';
        placement_priority: 'profile' | 'top_3' | 'homepage';
        support_tier: 'email' | 'priority' | 'dedicated';
        max_active_ads: number;
        api_access: boolean;
    };
    is_active?: boolean;
    display_order?: number;
}

// =====================================================
// GET ALL TIERS (ADMIN)
// =====================================================

export async function getAllTiers() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('ad_subscription_tiers')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching all tiers:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// CREATE TIER
// =====================================================

export async function createTier(input: CreateTierInput) {
    const supabase = await createClient();

    try {
        // Check admin permission
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role_type')
            .eq('user_id', user.id)
            .eq('role_type', 'admin')
            .single();

        if (!userRole) {
            return { success: false, error: 'Insufficient permissions' };
        }

        // Create tier
        const { data, error } = await supabase
            .from('ad_subscription_tiers')
            .insert({
                tier_name: input.tier_name,
                tier_slug: input.tier_slug,
                tier_description: input.tier_description,
                monthly_price: input.monthly_price,
                currency: input.currency || 'XAF',
                visibility_multiplier: input.visibility_multiplier,
                features: input.features,
                is_active: input.is_active ?? true,
                display_order: input.display_order ?? 999,
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/advertising/tiers');
        revalidatePath('/');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating tier:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// UPDATE TIER
// =====================================================

export async function updateTier(tierId: string, updates: Partial<CreateTierInput>) {
    const supabase = await createClient();

    try {
        // Check admin permission
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role_type')
            .eq('user_id', user.id)
            .eq('role_type', 'admin')
            .single();

        if (!userRole) {
            return { success: false, error: 'Insufficient permissions' };
        }

        // Update tier
        const { data, error } = await supabase
            .from('ad_subscription_tiers')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', tierId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/advertising/tiers');
        revalidatePath('/');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating tier:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// DELETE TIER
// =====================================================

export async function deleteTier(tierId: string) {
    const supabase = await createClient();

    try {
        // Check admin permission
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role_type')
            .eq('user_id', user.id)
            .eq('role_type', 'admin')
            .single();

        if (!userRole) {
            return { success: false, error: 'Insufficient permissions' };
        }

        // Check if tier has active subscriptions
        const { data: activeSubscriptions } = await supabase
            .from('user_ad_subscriptions')
            .select('id')
            .eq('tier_id', tierId)
            .eq('subscription_status', 'active');

        if (activeSubscriptions && activeSubscriptions.length > 0) {
            return {
                success: false,
                error: `Cannot delete tier with ${activeSubscriptions.length} active subscriptions. Please deactivate the tier instead.`,
            };
        }

        // Delete tier
        const { error } = await supabase.from('ad_subscription_tiers').delete().eq('id', tierId);

        if (error) throw error;

        revalidatePath('/admin/advertising/tiers');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting tier:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// TOGGLE TIER STATUS
// =====================================================

export async function toggleTierStatus(tierId: string, isActive: boolean) {
    const supabase = await createClient();

    try {
        // Check admin permission
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role_type')
            .eq('user_id', user.id)
            .eq('role_type', 'admin')
            .single();

        if (!userRole) {
            return { success: false, error: 'Insufficient permissions' };
        }

        // Update tier status
        const { data, error } = await supabase
            .from('ad_subscription_tiers')
            .update({ is_active: isActive })
            .eq('id', tierId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/advertising/tiers');
        revalidatePath('/');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error toggling tier status:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// REORDER TIERS
// =====================================================

export async function reorderTiers(tierIds: string[]) {
    const supabase = await createClient();

    try {
        // Check admin permission
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role_type')
            .eq('user_id', user.id)
            .eq('role_type', 'admin')
            .single();

        if (!userRole) {
            return { success: false, error: 'Insufficient permissions' };
        }

        // Update display_order for each tier
        const updates = tierIds.map((tierId, index) =>
            supabase
                .from('ad_subscription_tiers')
                .update({ display_order: index + 1 })
                .eq('id', tierId)
        );

        await Promise.all(updates);

        revalidatePath('/admin/advertising/tiers');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('Error reordering tiers:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// GET SUBSCRIPTION ANALYTICS
// =====================================================

export async function getSubscriptionAnalytics() {
    const supabase = await createClient();

    try {
        // Check admin permission
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role_type')
            .eq('user_id', user.id)
            .eq('role_type', 'admin')
            .single();

        if (!userRole) {
            return { success: false, error: 'Insufficient permissions' };
        }

        // Get subscription counts by tier
        const { data: subscriptions, error: subsError } = await supabase
            .from('user_ad_subscriptions')
            .select('tier_id, subscription_status')
            .eq('subscription_status', 'active');

        if (subsError) throw subsError;

        // Get tier details
        const { data: tiers, error: tiersError } = await supabase
            .from('ad_subscription_tiers')
            .select('*');

        if (tiersError) throw tiersError;

        // Calculate analytics
        const analytics = tiers?.map((tier) => {
            const tierSubscriptions = subscriptions?.filter((sub) => sub.tier_id === tier.id) || [];
            const subscriberCount = tierSubscriptions.length;
            const monthlyRevenue = subscriberCount * tier.monthly_price;

            return {
                tier_id: tier.id,
                tier_name: tier.tier_name,
                tier_slug: tier.tier_slug,
                monthly_price: tier.monthly_price,
                currency: tier.currency,
                subscriber_count: subscriberCount,
                monthly_revenue: monthlyRevenue,
            };
        });

        const totalMRR = analytics?.reduce((sum, tier) => sum + tier.monthly_revenue, 0) || 0;
        const totalSubscribers = analytics?.reduce((sum, tier) => sum + tier.subscriber_count, 0) || 0;

        return {
            success: true,
            data: {
                tiers: analytics,
                total_mrr: totalMRR,
                total_subscribers: totalSubscribers,
            },
        };
    } catch (error: any) {
        console.error('Error fetching subscription analytics:', error);
        return { success: false, error: error.message };
    }
}
