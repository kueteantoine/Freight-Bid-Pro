import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdApprovalQueue } from './_components/ad-approval-queue';
import { AdList } from './_components/ad-list';
import { AdRevenueOverview } from './_components/ad-revenue-overview';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateAdDialog } from './_components/create-ad-dialog';

export default function AdvertisementsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Advertisement Management</h1>
                    <p className="text-muted-foreground">
                        Manage advertisements, approve submissions, and track performance
                    </p>
                </div>
                <CreateAdDialog />
            </div>

            <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                <AdRevenueOverview />
            </Suspense>

            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending">Pending Approval</TabsTrigger>
                    <TabsTrigger value="active">Active Ads</TabsTrigger>
                    <TabsTrigger value="all">All Ads</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                        <AdApprovalQueue />
                    </Suspense>
                </TabsContent>

                <TabsContent value="active" className="space-y-4">
                    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                        <AdList status="active" />
                    </Suspense>
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                    <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                        <AdList />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}
