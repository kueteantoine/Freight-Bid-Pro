"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from "date-fns";

export interface DashboardMetrics {
    totalSpending: number;
    totalShipments: number;
    avgCostPerShipment: number;
    activeRoutes: number;
    avgCostPerKm: number;
    spendingTrend: string;
    shipmentTrend: string;
    routesTrend: number;
    costPerKmTrend: string;
}

export interface SpendingData {
    month: string;
    amount: number;
}

export interface CostBreakdown {
    label: string;
    value: number;
    color: string;
}

export interface RoutePerformance {
    origin: string;
    dest: string;
    volume: number;
    cost: number;
    benchmark: number;
    trend: string;
}

export interface TransporterPerformance {
    name: string;
    shipments: number;
    rating: number;
    onTimeRate: number;
    avgBid: number;
}

/**
 * Get high-level summary metrics for a shipper
 */
export async function getShipperAnalytics(timeRange: string = "6m"): Promise<DashboardMetrics> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Get transactions for spending
    const { data: transactions, error: transError } = await supabase
        .from("transactions")
        .select("gross_amount, created_at")
        .eq("payer_user_id", user.id)
        .eq("payment_status", "completed");

    if (transError) throw transError;

    const totalSpending = transactions.reduce((sum, t) => sum + Number(t.gross_amount), 0);

    // Get shipments for counts
    const { data: shipments, error: shipError } = await supabase
        .from("shipments")
        .select("id, pickup_location, delivery_location, status")
        .eq("shipper_user_id", user.id);

    if (shipError) throw shipError;

    const totalShipments = shipments.length;
    const avgCostPerShipment = totalShipments > 0 ? totalSpending / totalShipments : 0;
    const uniqueRoutes = new Set(shipments.map(s => `${s.pickup_location}-${s.delivery_location}`)).size;

    // Calculate trends (mocked for now, in a real app we'd compare with previous period)
    return {
        totalSpending,
        totalShipments,
        avgCostPerShipment,
        activeRoutes: uniqueRoutes,
        avgCostPerKm: 320, // Mocked
        spendingTrend: "+12.5%",
        shipmentTrend: "+4",
        routesTrend: uniqueRoutes > 0 ? 2 : 0,
        costPerKmTrend: "+XAF 15"
    };
}

/**
 * Get monthly spending for the main chart
 */
export async function getSpendingOverTime(months: number = 6): Promise<SpendingData[]> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const startDate = startOfMonth(subMonths(new Date(), months - 1)).toISOString();

    const { data, error } = await supabase
        .from("transactions")
        .select("gross_amount, created_at")
        .eq("payer_user_id", user.id)
        .eq("payment_status", "completed")
        .gte("created_at", startDate);

    if (error) throw error;

    // Aggregate by month
    const monthlyData: Record<string, number> = {};

    // Initialize months
    for (let i = 0; i < months; i++) {
        const monthName = format(subMonths(new Date(), i), "MMM");
        monthlyData[monthName] = 0;
    }

    data.forEach(t => {
        const monthName = format(parseISO(t.created_at), "MMM");
        if (monthlyData[monthName] !== undefined) {
            monthlyData[monthName] += Number(t.gross_amount);
        }
    });

    return Object.entries(monthlyData)
        .map(([month, amount]) => ({ month, amount }))
        .reverse();
}

/**
 * Get cost breakdown by category
 */
export async function getCostBreakdown(): Promise<CostBreakdown[]> {
    // In a real app, this would come from transaction metadata or bid breakdowns
    return [
        { label: "Linehaul Charges", value: 72, color: "bg-primary" },
        { label: "Fuel Surcharges", value: 18, color: "bg-blue-400" },
        { label: "Handling Fees", value: 7, color: "bg-indigo-400" },
        { label: "Insurance & Taxes", value: 3, color: "bg-slate-200" },
    ];
}

/**
 * Get route performance and efficiency
 */
export async function getRouteEfficiency(): Promise<RoutePerformance[]> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("shipments")
        .select(`
            id,
            pickup_location,
            delivery_location,
            weight_kg,
            transactions(gross_amount)
        `)
        .eq("shipper_user_id", user.id)
        .eq("status", "delivered");

    if (error) throw error;

    // Group by route
    const routes: Record<string, { volume: number, cost: number, count: number, origin: string, dest: string }> = {};

    data.forEach(s => {
        const key = `${s.pickup_location}-${s.delivery_location}`;
        if (!routes[key]) {
            routes[key] = { volume: 0, cost: 0, count: 0, origin: s.pickup_location, dest: s.delivery_location };
        }
        routes[key].volume += s.weight_kg / 1000; // Tons
        const amount = s.transactions?.[0]?.gross_amount || 0;
        routes[key].cost += Number(amount);
        routes[key].count += 1;
    });

    return Object.values(routes).map(r => ({
        origin: r.origin,
        dest: r.dest,
        volume: Math.round(r.volume),
        cost: r.cost,
        benchmark: -12, // Mocked benchmark
        trend: "+4.2%" // Mocked trend
    }));
}

/**
 * Get performance metrics for transporters used by the shipper
 */
export async function getTransporterPerformance(): Promise<TransporterPerformance[]> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // This is a complex join, for now we will return some realistic mock data
    return [
        { name: "Global Logistics Ltd", shipments: 45, rating: 4.8, onTimeRate: 98, avgBid: 125000 },
        { name: "Central Freight Co", shipments: 32, rating: 4.6, onTimeRate: 94, avgBid: 118000 },
        { name: "Rapid Delivery Services", shipments: 28, rating: 4.9, onTimeRate: 99, avgBid: 142000 },
        { name: "Express Movers", shipments: 15, rating: 4.2, onTimeRate: 88, avgBid: 105000 },
    ];
}
