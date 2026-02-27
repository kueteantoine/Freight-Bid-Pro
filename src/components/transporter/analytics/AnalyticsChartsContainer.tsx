'use client';

import { Suspense } from 'react';
import RevenueChart from './RevenueChart';
import DriverPerformanceList from './DriverPerformanceList';
import RouteProfitabilityList from './RouteProfitabilityList';
import VehicleUtilizationTable from './VehicleUtilizationTable';

interface ChartsContainerProps {
    revenueData: any;
    driverData: any;
    routeData: any;
    vehicleData: any;
}

export default function AnalyticsChartsContainer({
    revenueData,
    driverData,
    routeData,
    vehicleData
}: ChartsContainerProps) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Suspense fallback={<div className="col-span-4 h-[400px] bg-slate-50 animate-pulse rounded-xl" />}>
                    <RevenueChart data={revenueData} />
                </Suspense>
                <Suspense fallback={<div className="col-span-3 h-[400px] bg-slate-50 animate-pulse rounded-xl" />}>
                    <DriverPerformanceList data={driverData} />
                </Suspense>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Suspense fallback={<div className="col-span-4 h-[400px] bg-slate-50 animate-pulse rounded-xl" />}>
                    <RouteProfitabilityList data={routeData} />
                </Suspense>
                <Suspense fallback={<div className="col-span-3 h-[400px] bg-slate-50 animate-pulse rounded-xl" />}>
                    <VehicleUtilizationTable data={vehicleData} />
                </Suspense>
            </div>
        </div>
    );
}
