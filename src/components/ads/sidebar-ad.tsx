'use client';

import { useEffect, useState } from 'react';
import { getAdsForPlacement, trackAdImpression, trackAdClick } from '@/lib/services/admin/advertisements';

interface SidebarAdProps {
    userRole?: 'shipper' | 'carrier' | 'driver' | 'broker';
    language?: 'en' | 'fr';
    className?: string;
}

export function SidebarAd({ userRole, language = 'en', className = '' }: SidebarAdProps) {
    const [ad, setAd] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAd() {
            const result = await getAdsForPlacement('sidebar_banner', {
                user_role: userRole,
                language,
            }, 1);

            if (result.success && result.data && result.data.length > 0) {
                const selectedAd = result.data[0];
                setAd(selectedAd);

                // Track impression
                await trackAdImpression(selectedAd.id);
            }
            setLoading(false);
        }

        fetchAd();
    }, [userRole, language]);

    async function handleClick() {
        if (!ad) return;

        const result = await trackAdClick(ad.id);
        if (result.success && result.data?.target_url) {
            window.open(result.data.target_url, '_blank', 'noopener,noreferrer');
        }
    }

    if (loading) {
        return (
            <div className={`animate-pulse bg-muted rounded-lg h-64 ${className}`}>
                <div className="h-full w-full bg-muted-foreground/10 rounded-lg" />
            </div>
        );
    }

    if (!ad) {
        return null;
    }

    return (
        <div
            className={`relative overflow-hidden rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer h-64 ${className}`}
            onClick={handleClick}
        >
            {ad.ad_image_url ? (
                <div className="relative w-full h-full">
                    <img
                        src={ad.ad_image_url}
                        alt={ad.ad_title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-semibold mb-1">{ad.ad_title}</h3>
                        {ad.ad_content && (
                            <p className="text-sm opacity-90 line-clamp-3">{ad.ad_content}</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="p-6 flex flex-col justify-center h-full">
                    <h3 className="font-semibold text-lg mb-3">{ad.ad_title}</h3>
                    {ad.ad_content && (
                        <p className="text-sm text-muted-foreground">{ad.ad_content}</p>
                    )}
                </div>
            )}

            {/* Sponsored badge */}
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                Ad
            </div>
        </div>
    );
}
