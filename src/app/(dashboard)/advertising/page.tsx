import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionTiersCard } from '@/components/ads/subscription-tiers-card';
import { MyAdsCard } from '@/components/ads/my-ads-card';
import { Megaphone } from 'lucide-react';

export const metadata = {
    title: 'Advertising | Freight Bid Pro',
    description: 'Promote your services with targeted advertisements',
};

export default function AdvertisingPage() {
    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                    <Megaphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Advertising</h1>
                    <p className="text-muted-foreground">
                        Boost your visibility and attract more clients
                    </p>
                </div>
            </div>

            <Suspense fallback={<SubscriptionSkeleton />}>
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Tiers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SubscriptionTiersCard />
                    </CardContent>
                </Card>
            </Suspense>

            <Suspense fallback={<AdsSkeleton />}>
                <MyAdsCard />
            </Suspense>
        </div>
    );
}

function SubscriptionSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-[400px]" />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function AdsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[300px]" />
            </CardContent>
        </Card>
    );
}
