import React from 'react';
import {
    getCarrierKPIs,
    getRevenueTrends
} from "@/app/actions/analytics-actions";
import AnalyticsDashboard from "@/components/carrier/analytics/AnalyticsDashboard";
import AdvancedReports from "@/components/carrier/analytics/AdvancedReports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function CarrierAnalyticsPage() {
    // defaults
    const defaultKPIs = {
        total_shipments: 0,
        total_revenue: 0,
        bid_win_rate: 0,
        on_time_rate: 0,
        avg_rating: 0
    };

    // Fetch initial data
    const kpis = await getCarrierKPIs().catch(err => {
        console.error("Error fetching KPIs:", err);
        return defaultKPIs;
    });

    const revenueTrends = await getRevenueTrends('monthly').catch(err => {
        console.error("Error fetching trends:", err);
        return [];
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
                <p className="text-muted-foreground">
                    Optimize your business with data-driven insights and benchmarks.
                </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <AnalyticsDashboard kpis={kpis} revenueTrends={revenueTrends} />
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                    <AdvancedReports />
                </TabsContent>
            </Tabs>
        </div>
    );
}
