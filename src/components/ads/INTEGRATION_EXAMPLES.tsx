import { FeaturedBadge } from '@/components/ads/featured-badge';
import { getUserSubscriptionTier } from '@/lib/subscription-helpers';

/**
 * EXAMPLE: How to integrate featured badges into user profiles
 * 
 * This file demonstrates the pattern for displaying subscription tier badges
 * on user profiles, search results, and other user-facing components.
 */

// ============================================
// EXAMPLE 1: User Profile Header
// ============================================

export async function UserProfileHeader({ userId }: { userId: string }) {
    const subscription = await getUserSubscriptionTier(userId);

    return (
        <div className="flex items-center gap-4">
            <div className="flex-1">
                <h1 className="text-2xl font-bold">User Profile</h1>
                {subscription && (
                    <div className="mt-2">
                        <FeaturedBadge tierSlug={subscription.tier.tier_slug} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// EXAMPLE 2: Search Results Card
// ============================================

export async function SearchResultCard({
    user,
    tierSlug,
}: {
    user: any;
    tierSlug?: string;
}) {
    return (
        <div className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.role}</p>
                </div>
                {tierSlug && <FeaturedBadge tierSlug={tierSlug as any} size="sm" />}
            </div>
        </div>
    );
}

// ============================================
// EXAMPLE 3: Bulk Search Results with Boost
// ============================================

import { getBulkUserSubscriptionTiers, applyVisibilityBoost } from '@/lib/subscription-helpers';

export async function SearchResultsList({ results }: { results: any[] }) {
    // Get all user IDs
    const userIds = results.map((r) => r.user_id);

    // Fetch tiers in bulk
    const tierMap = await getBulkUserSubscriptionTiers(userIds);

    // Apply visibility boost to scores
    const boostedResults = await applyVisibilityBoost(results, tierMap);

    // Sort by boosted score (highest first)
    const sortedResults = boostedResults.sort((a, b) => {
        const scoreA = a.boosted_score || a.score || 0;
        const scoreB = b.boosted_score || b.score || 0;
        return scoreB - scoreA;
    });

    return (
        <div className="space-y-4">
            {sortedResults.map((result) => {
                const tier = tierMap[result.user_id];
                return (
                    <SearchResultCard
                        key={result.user_id}
                        user={result}
                        tierSlug={tier?.tier_slug}
                    />
                );
            })}
        </div>
    );
}

// ============================================
// EXAMPLE 4: Transporter Fleet Card
// ============================================

export async function TransporterFleetCard({
    transporterId,
    fleetData,
}: {
    transporterId: string;
    fleetData: any;
}) {
    const subscription = await getUserSubscriptionTier(transporterId);

    return (
        <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{fleetData.company_name}</h3>
                {subscription && (
                    <FeaturedBadge tierSlug={subscription.tier.tier_slug} size="sm" />
                )}
            </div>

            {subscription && subscription.tier.visibility_multiplier > 1 && (
                <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-md">
                    <p className="text-sm text-primary font-medium">
                        🚀 {subscription.tier.visibility_multiplier}x Visibility Boost
                    </p>
                </div>
            )}

            <div className="space-y-2">
                <p className="text-sm">
                    <span className="font-medium">Fleet Size:</span> {fleetData.vehicle_count}
                </p>
                <p className="text-sm">
                    <span className="font-medium">Rating:</span> {fleetData.rating} ⭐
                </p>
            </div>
        </div>
    );
}

// ============================================
// INTEGRATION NOTES
// ============================================

/**
 * To integrate featured badges into your components:
 * 
 * 1. Import the helper functions:
 *    - getUserSubscriptionTier() for single users
 *    - getBulkUserSubscriptionTiers() for lists
 * 
 * 2. Import the FeaturedBadge component:
 *    - <FeaturedBadge tierSlug="bronze" />
 *    - <FeaturedBadge tierSlug="silver" size="sm" />
 * 
 * 3. For search/list views:
 *    - Fetch tiers in bulk
 *    - Apply visibility boost to scores
 *    - Sort by boosted_score
 *    - Display badges on cards
 * 
 * 4. For profile views:
 *    - Fetch single user tier
 *    - Display badge in header
 *    - Show subscription benefits
 */
