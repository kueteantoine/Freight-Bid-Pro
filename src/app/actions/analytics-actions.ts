'use server';

import { CarrierAnalyticsService } from '@/lib/services/analytics-service';
import { createClient } from '@/lib/supabase/server';

const service = new CarrierAnalyticsService();

// --- Carrier Analytics Actions ---

export async function getCarrierKPIs(startDate?: string, endDate?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // Verify role is transporter (optional but good practice)

    return await service.getKPIs(user.id, startDate, endDate);
}

export async function getRevenueTrends(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    return await service.getRevenueTrends(user.id, period);
}

export async function getVehicleUtilization() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    return await service.getVehicleUtilization(user.id);
}

export async function getDriverPerformance() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    return await service.getDriverPerformance(user.id);
}

export async function getRouteProfitability() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    return await service.getRouteProfitability(user.id);
}

// --- Shipper Analytics Interfaces & Actions (Restored) ---

export interface DashboardMetrics {
    totalSpending: number;
    spendingTrend: string;
    totalShipments: number;
    shipmentTrend: string;
    avgCostPerShipment: number;
    activeRoutes: number;
    routesTrend: string;
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
    rating: number;
    shipments: number;
    onTimeRate: number;
    avgBid: number;
}

export async function getShipperAnalytics(timeRange: string): Promise<DashboardMetrics> {
    return {
        totalSpending: 12500000,
        spendingTrend: "+12.5%",
        totalShipments: 145,
        shipmentTrend: "+8.2%",
        avgCostPerShipment: 86200,
        activeRoutes: 12,
        routesTrend: "2"
    };
}

export async function getSpendingOverTime(months: number): Promise<SpendingData[]> {
    return [
        { month: 'Jan', amount: 1200000 },
        { month: 'Feb', amount: 1500000 },
        { month: 'Mar', amount: 1100000 },
        { month: 'Apr', amount: 1800000 },
        { month: 'May', amount: 2000000 },
        { month: 'Jun', amount: 2400000 },
    ];
}

export async function getCostBreakdown(): Promise<CostBreakdown[]> {
    return [
        { label: 'Freight Fee', value: 65, color: 'bg-primary' },
        { label: 'Fuel Surcharge', value: 15, color: 'bg-blue-400' },
        { label: 'Insurance', value: 10, color: 'bg-indigo-400' },
        { label: 'Taxes', value: 10, color: 'bg-slate-200' },
    ];
}

export async function getRouteEfficiency(): Promise<RoutePerformance[]> {
    return [
        { origin: 'Douala', dest: 'Yaoundé', volume: 450, cost: 4500000, benchmark: 12, trend: '+5%' },
        { origin: 'Kribi', dest: 'Douala', volume: 320, cost: 3200000, benchmark: -5, trend: '-2%' },
    ];
}

export async function getTransporterPerformance(): Promise<TransporterPerformance[]> {
    return [
        { name: 'Global Logistics', rating: 4.8, shipments: 45, onTimeRate: 98, avgBid: 125000 },
        { name: 'Fast Track', rating: 4.5, shipments: 32, onTimeRate: 92, avgBid: 118000 },
    ];
}
