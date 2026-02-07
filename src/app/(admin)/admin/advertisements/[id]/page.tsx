import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getAdvertisementById } from '@/lib/services/admin/advertisements';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AdPerformanceChart } from '../_components/ad-performance-chart';
import { ExternalLink } from 'lucide-react';

interface PageProps {
    params: {
        id: string;
    };
}

export default async function AdDetailsPage({ params }: PageProps) {
    const result = await getAdvertisementById(params.id);

    if (!result.success || !result.data) {
        notFound();
    }

    const ad = result.data;

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{ad.ad_title}</h1>
                    <p className="text-muted-foreground">Advertisement Details & Analytics</p>
                </div>
                <Badge>{ad.approval_status?.replace('_', ' ')}</Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Advertisement Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium">Ad Type</p>
                            <p className="text-sm text-muted-foreground">{ad.ad_type}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Placement Zone</p>
                            <p className="text-sm text-muted-foreground">
                                {ad.ad_placement_zone?.replace('_', ' ')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Advertiser Type</p>
                            <p className="text-sm text-muted-foreground">
                                {ad.advertiser_type?.replace('_', ' ')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Pricing Model</p>
                            <p className="text-sm text-muted-foreground">
                                {ad.pricing_model}: {ad.price_amount?.toLocaleString()} XAF
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Duration</p>
                            <p className="text-sm text-muted-foreground">
                                {new Date(ad.start_date).toLocaleDateString()} -{' '}
                                {new Date(ad.end_date).toLocaleDateString()}
                            </p>
                        </div>
                        {ad.target_url && (
                            <div>
                                <p className="text-sm font-medium mb-2">Target URL</p>
                                <a
                                    href={ad.target_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    {ad.target_url}
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium">Impressions</p>
                            <p className="text-2xl font-bold">
                                {ad.impressions_count?.toLocaleString() || 0}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Clicks</p>
                            <p className="text-2xl font-bold">{ad.clicks_count?.toLocaleString() || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Conversions</p>
                            <p className="text-2xl font-bold">
                                {ad.conversions_count?.toLocaleString() || 0}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Click-Through Rate (CTR)</p>
                            <p className="text-2xl font-bold">
                                {ad.impressions_count > 0
                                    ? ((ad.clicks_count / ad.impressions_count) * 100).toFixed(2)
                                    : 0}
                                %
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Total Revenue</p>
                            <p className="text-2xl font-bold">
                                {ad.total_revenue?.toLocaleString() || 0} XAF
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {ad.ad_content && (
                <Card>
                    <CardHeader>
                        <CardTitle>Ad Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border p-4">{ad.ad_content}</div>
                    </CardContent>
                </Card>
            )}

            {ad.ad_image_url && (
                <Card>
                    <CardHeader>
                        <CardTitle>Ad Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <img
                            src={ad.ad_image_url}
                            alt={ad.ad_title}
                            className="rounded-md max-w-full h-auto"
                        />
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Performance Over Time</CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                        <AdPerformanceChart adId={params.id} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
