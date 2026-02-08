'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Get user's active subscription tier for display purposes
 * Returns null if no active subscription
 */
export async function getUserSubscriptionTier(userId: string) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from('user_ad_subscriptions')
        .select(
            `
            id,
            subscription_status,
            tier:ad_subscription_tiers (
                id,
                tier_name,
                tier_slug,
                visibility_multiplier
            )
        `
        )
        .eq('user_id', userId)
        .eq('subscription_status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !data) {
        return null;
    }

    return {
        subscriptionId: data.id,
        status: data.subscription_status,
        tier: data.tier as any,
    };
}

/**
 * Get multiple users' subscription tiers in a single query
 * Useful for search results and lists
 */
export async function getBulkUserSubscriptionTiers(userIds: string[]) {
    if (userIds.length === 0) return {};

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from('user_ad_subscriptions')
        .select(
            `
            user_id,
            tier:ad_subscription_tiers (
                tier_name,
                tier_slug,
                visibility_multiplier
            )
        `
        )
        .in('user_id', userIds)
        .eq('subscription_status', 'active');

    if (error || !data) {
        return {};
    }

    // Convert to map for easy lookup
    const tierMap: Record<string, any> = {};
    data.forEach((item) => {
        tierMap[item.user_id] = item.tier;
    });

    return tierMap;
}

/**
 * Apply visibility boost to search results based on subscription tier
 * This multiplies the base score by the tier's visibility multiplier
 */
export async function applyVisibilityBoost(
    results: Array<{ user_id: string; score?: number;[key: string]: any }>,
    tierMap: Record<string, { visibility_multiplier: number }>
): Promise<Array<{ user_id: string; score?: number; boosted_score?: number;[key: string]: any }>> {
    return results.map((result) => {
        const tier = tierMap[result.user_id];
        const baseScore = result.score || 1;
        const multiplier = tier?.visibility_multiplier || 1;

        return {
            ...result,
            boosted_score: baseScore * multiplier,
        };
    });
}
