"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// --- Carrier Types ---
export type CarrierKPIs = {
    total_shipments: number;
    total_revenue: number;
    bid_win_rate: number;
    on_time_rate: number;
    avg_rating: number;
};

export type RevenueTrend = {
    period: string;
    revenue: number;
};

export type VehicleUtil = {
    id: string;
    license_plate: string;
    make: string;
    model: string;
    vehicle_status: string;
    trips_completed: number;
    revenue_generated: number;
};

export type DriverPerf = {
    driver_id: string;
    email: string;
    trips_completed: number;
    avg_rating: number;
};

export type RouteProfit = {
    origin: string;
    destination: string;
    trip_count: number;
    avg_revenue: number;
};

export type Benchmarks = {
    my_avg_bid: number;
    market_avg_bid: number;
    my_rating: number;
    market_rating: number;
    my_on_time_rate: number;
    market_on_time_rate: number;
};

// --- Shipper Types ---
export type DashboardMetrics = {
    totalSpending: number;
    spendingTrend: string;
    totalShipments: number;
    shipmentTrend: string;
    avgCostPerShipment: number;
    activeRoutes: number;
    routesTrend: string;
};

export type SpendingData = {
    month: string;
    amount: number;
};

export type CostBreakdown = {
    label: string;
    value: number;
    color: string;
};

export type RoutePerformance = {
    origin: string;
    dest: string;
    volume: number;
    cost: number;
    benchmark: number;
    trend: string;
};

export type TransporterPerformance = {
    id: string;
    name: string;
    rating: number;
    shipments: number;
    onTimeRate: number;
    avgBid: number;
};

// --- Carrier Actions ---

export async function getCarrierKPIs(): Promise<CarrierKPIs> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .rpc('get_transporter_kpis', { transporter_uuid: user.id });

    if (error) throw error;
    return data as CarrierKPIs;
}

export async function getRevenueTrends(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<RevenueTrend[]> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .rpc('get_revenue_trends', {
            transporter_uuid: user.id,
            period_type: period
        });

    if (error) throw error;
    return data || [];
}

export async function getVehicleUtilization(): Promise<VehicleUtil[]> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .rpc('get_vehicle_utilization', { transporter_uuid: user.id });

    if (error) throw error;
    return data || [];
}

export async function getDriverPerformance(): Promise<DriverPerf[]> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .rpc('get_driver_performance', { transporter_uuid: user.id });

    if (error) throw error;
    return data || [];
}

export async function getRouteProfitability(): Promise<RouteProfit[]> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .rpc('get_route_profitability', { transporter_uuid: user.id });

    if (error) throw error;
    return data || [];
}

export async function getCompetitorBenchmarks(): Promise<Benchmarks> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .rpc('get_competitor_benchmarks', { transporter_uuid: user.id });

    if (error) throw error;
    return data as Benchmarks;
}

export async function getPredictiveAnalytics() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .rpc('get_predictive_analytics', { transporter_uuid: user.id });

    if (error) throw error;
    return data;
}

// --- Shipper Actions (Restored & Mocked for Stability) ---

export async function getShipperAnalytics(timeRange: string): Promise<DashboardMetrics> {
    // Mock implementation to satisfy the interface until SQL is verified
    return {
        totalSpending: 41250000,
        spendingTrend: "+12.5%",
        totalShipments: 142,
        shipmentTrend: "+8.2%",
        avgCostPerShipment: 290500,
        activeRoutes: 18,
        routesTrend: "+2"
    };
}

export async function getSpendingOverTime(months: number): Promise<SpendingData[]> {
    return [
        { month: 'Aug', amount: 2400000 },
        { month: 'Sep', amount: 3100000 },
        { month: 'Oct', amount: 2800000 },
        { month: 'Nov', amount: 4500000 },
        { month: 'Dec', amount: 5200000 },
        { month: 'Jan', amount: 4800000 },
    ];
}

export async function getCostBreakdown(): Promise<CostBreakdown[]> {
    return [
        { label: 'Linehaul', value: 65, color: 'bg-primary' },
        { label: 'Fuel Surcharge', value: 15, color: 'bg-blue-400' },
        { label: 'Accessorials', value: 12, color: 'bg-indigo-400' },
        { label: 'Fees', value: 8, color: 'bg-slate-200' },
    ];
}

export async function getRouteEfficiency(): Promise<RoutePerformance[]> {
    return [
        { origin: 'Douala', dest: 'Yaoundé', volume: 1250, cost: 4500000, benchmark: -5, trend: '-2.1%' },
        { origin: 'Douala', dest: 'Bafoussam', volume: 850, cost: 3200000, benchmark: 2, trend: '+1.4%' },
        { origin: 'Kribi', dest: 'Douala', volume: 2100, cost: 6800000, benchmark: -8, trend: '-4.5%' },
    ];
}

export async function getTransporterPerformance(): Promise<TransporterPerformance[]> {
    return [
        { id: '1', name: 'Global Logistics', rating: 4.8, shipments: 154, onTimeRate: 98, avgBid: 245000 },
        { id: '2', name: 'FastTrack Freight', rating: 4.5, shipments: 89, onTimeRate: 94, avgBid: 230000 },
        { id: '3', name: 'SecureTrans', rating: 4.9, shipments: 42, onTimeRate: 99, avgBid: 260000 },
    ];
}
