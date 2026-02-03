import { Suspense } from 'react';
import {
    getCarrierKPIs,
    getRevenueTrends,
    getVehicleUtilization,
    getDriverPerformance,
    getRouteProfitability
} from '@/app/actions/analytics-actions';
import { OverviewCards } from '@/components/transporter/analytics/OverviewCards';
import { RevenueChart } from '@/components/transporter/analytics/RevenueChart';
import { VehicleUtilizationTable } from '@/components/transporter/analytics/VehicleUtilizationTable';
import { DriverPerformanceList } from '@/components/transporter/analytics/DriverPerformanceList';
import { RouteProfitabilityList } from '@/components/transporter/analytics/RouteProfitabilityList';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

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
                <Suspense fallback={<div>Loading stats...</div>}>
                    <OverviewCards data={kpis} />
                </Suspense>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Suspense fallback={<div>Loading chart...</div>}>
                        <RevenueChart data={revenueData} />
                    </Suspense>
                    <Suspense fallback={<div>Loading drivers...</div>}>
                        <DriverPerformanceList data={driverData} />
                    </Suspense>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Suspense fallback={<div>Loading routes...</div>}>
                        <RouteProfitabilityList data={routeData} />
                    </Suspense>
                    <Suspense fallback={<div>Loading fleet...</div>}>
                        <VehicleUtilizationTable data={vehicleData} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
