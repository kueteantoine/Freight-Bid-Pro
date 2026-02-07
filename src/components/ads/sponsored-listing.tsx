'use client';

import { useEffect, useState } from 'react';
import { getAdsForPlacement, trackAdImpression, trackAdClick } from '@/lib/services/admin/advertisements';
import { Card, CardContent } from '@/components/ui/card';

interface SponsoredListingProps {
    userRole?: 'shipper' | 'carrier' | 'driver' | 'broker';
    language?: 'en' | 'fr';
    maxAds?: number;
}

export function SponsoredListing({ userRole, language = 'en', maxAds = 3 }: SponsoredListingProps) {
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAds() {
            const result = await getAdsForPlacement('sponsored_listing', {
                user_role: userRole,
                language,
            }, maxAds);

            if (result.success && result.data) {
                setAds(result.data);

                // Track impressions for all ads
                for (const ad of result.data) {
                    await trackAdImpression(ad.id);
                }
            }
            setLoading(false);
        }

        fetchAds();
    }, [userRole, language, maxAds]);

    async function handleClick(ad: any) {
        const result = await trackAdClick(ad.id);
        if (result.success && result.data?.target_url) {
            window.open(result.data.target_url, '_blank', 'noopener,noreferrer');
        }
    }

    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(maxAds)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (ads.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Sponsored</h3>
            </div>
            {ads.map((ad) => (
                <Card
                    key={ad.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleClick(ad)}
                >
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            {ad.ad_image_url && (
                                <img
                                    src={ad.ad_image_url}
                                    alt={ad.ad_title}
                                    className="w-16 h-16 object-cover rounded"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm mb-1 truncate">{ad.ad_title}</h4>
                                {ad.ad_content && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {ad.ad_content}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
