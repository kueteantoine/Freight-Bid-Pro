'use client';

import { useEffect, useState } from 'react';
import { getAdsForPlacement, trackAdImpression, trackAdClick } from '@/lib/services/admin/advertisements';
import { Card, CardContent } from '@/components/ui/card';
import { AdReportDialog } from './ad-report-dialog';

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
            }
            setLoading(false);
        }

        fetchAds();
    }, [userRole, language, maxAds]);

    useEffect(() => {
        if (ads.length === 0) return;

        const observers: IntersectionObserver[] = [];

        ads.forEach((ad) => {
            const observer = new IntersectionObserver(
                async (entries) => {
                    const [entry] = entries;
                    if (entry.isIntersecting) {
                        await trackAdImpression(ad.id);
                        observer.disconnect();
                    }
                },
                { threshold: 0.5 }
            );

            const adElement = document.getElementById(`ad-sponsored-${ad.id}`);
            if (adElement) {
                observer.observe(adElement);
                observers.push(observer);
            }
        });

        return () => observers.forEach((o) => o.disconnect());
    }, [ads]);

    async function handleClick(ad: any, e: React.MouseEvent) {
        // Prevent click when reporting
        if ((e.target as HTMLElement).closest('.report-button')) return;

        const result = await trackAdClick(ad.id);
        if (result.success && result.targetUrl) {
            window.open(result.targetUrl, '_blank', 'noopener,noreferrer');
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
                    id={`ad-sponsored-${ad.id}`}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={(e) => handleClick(ad, e)}
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
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="font-semibold text-sm mb-1 truncate">{ad.ad_title}</h4>
                                    <AdReportDialog
                                        adId={ad.id}
                                        adTitle={ad.ad_title}
                                        trigger={
                                            <button className="text-muted-foreground/40 hover:text-red-500 transition-colors report-button">
                                                <span className="sr-only">Report</span>
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                                </svg>
                                            </button>
                                        }
                                    />
                                </div>
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
