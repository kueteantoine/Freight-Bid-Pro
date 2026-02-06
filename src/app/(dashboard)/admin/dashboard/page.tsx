import { Suspense } from 'react';
import { fetchDashboardStats, fetchPlatformAnalytics, fetchGeographicData, fetchActivityFeed } from '@/actions/admin-dashboard-actions';
import { StatsOverview } from '@/components/admin/dashboard/StatsOverview';
import { AnalyticsCharts } from '@/components/admin/dashboard/AnalyticsCharts';
import { GeographicMap } from '@/components/admin/dashboard/GeographicMap';
import { ActivityFeed } from '@/components/admin/dashboard/ActivityFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export const metadata = {
    title: 'Admin Dashboard | Freight Bid Pro',
    description: 'Platform overview and analytics',
};

export default async function AdminDashboardPage() {
    const [stats, analytics, geoData, activityFeed] = await Promise.all([
        fetchDashboardStats(),
        fetchPlatformAnalytics('30_days'),
        fetchGeographicData(),
        fetchActivityFeed(10)
    ]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    {/* <CalendarDateRangePicker /> */}
                    <Button size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download Reports
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="reports" disabled>Reports</TabsTrigger>
                    <TabsTrigger value="notifications" disabled>Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <StatsOverview stats={stats} />

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <AnalyticsCharts analytics={analytics} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <GeographicMap data={geoData} />
                        <ActivityFeed activities={activityFeed} />
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    {/* Detailed analytics view could go here, reusing components or adding new ones */}
                    <AnalyticsCharts analytics={analytics} />
                    <div className="grid gap-4 md:grid-cols-1">
                        <GeographicMap data={geoData} />
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
}
