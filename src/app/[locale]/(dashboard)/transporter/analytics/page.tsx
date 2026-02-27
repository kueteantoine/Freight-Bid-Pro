import { Suspense } from 'react';
import {
    getCarrierKPIs,
    getRevenueTrends,
    getVehicleUtilization,
    getDriverPerformance,
    getRouteProfitability
} from '@/app/actions/analytics-actions';
import { OverviewCards } from '@/components/transporter/analytics/OverviewCards';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const AnalyticsChartsContainer = dynamic(() => import('@/components/transporter/analytics/AnalyticsChartsContainer'), {
    ssr: false,
    loading: () => <div className="space-y-4 pt-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4 h-[400px] bg-slate-50 animate-pulse rounded-xl" />
            <div className="col-span-3 h-[400px] bg-slate-50 animate-pulse rounded-xl" />
        </div>
    </div>
});

export default async function AnalyticsPage() {
    // Fetch data in parallel
    const [
        kpis,
        revenueData,
        vehicleData,
        driverData,
        routeData
    ] = await Promise.all([
        getCarrierKPIs(),
        getRevenueTrends('monthly'),
        getVehicleUtilization(),
        getDriverPerformance(),
        getRouteProfitability()
    ]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Performance Analytics</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <Suspense fallback={<div className="h-[120px] bg-slate-50 animate-pulse rounded-xl" />}>
                    <OverviewCards data={kpis} />
                </Suspense>

                <AnalyticsChartsContainer
                    revenueData={revenueData}
                    driverData={driverData}
                    routeData={routeData}
                    vehicleData={vehicleData}
                />
            </div>
        </div>
    );
}
