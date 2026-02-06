"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Broker Analytics Server Actions
 * Advanced analytics and performance metrics for brokers
 */

export interface RevenueAnalytics {
    monthly_revenue: Array<{
        month: string;
        revenue: number;
        commission: number;
        shipments: number;
    }>;
    total_revenue: number;
    total_commission: number;
    average_commission_rate: number;
    revenue_growth_rate: number;
}

export interface NetworkAnalytics {
    network_growth: Array<{
        month: string;
        shipper_count: number;
        carrier_count: number;
        total: number;
    }>;
    top_shippers: Array<{
        id: string;
        company_name: string;
        total_shipments: number;
        total_revenue: number;
    }>;
    top_carriers: Array<{
        id: string;
        company_name: string;
        total_shipments: number;
        reliability_rating: number;
    }>;
    active_partners: number;
    inactive_partners: number;
}

export interface PerformanceMetrics {
    total_shipments_brokered: number;
    average_shipment_value: number;
    completion_rate: number;
    average_delivery_time_days: number;
    client_satisfaction_score: number;
}

export interface ShipmentAnalytics {
    volume_trends: Array<{
        month: string;
        shipments: number;
        completed: number;
        cancelled: number;
    }>;
    completion_rate_trend: Array<{
        month: string;
        rate: number;
    }>;
    average_value_trend: Array<{
        month: string;
        average_value: number;
    }>;
}

/**
 * Get revenue analytics for broker
 */
export async function getRevenueAnalytics(
    startDate?: string,
    endDate?: string
): Promise<{ data: RevenueAnalytics | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { data: null, error: "Unauthorized" };
        }

        // Get monthly revenue data from shipper network
        const { data: monthlyData, error: monthlyError } = await supabase
            .from("broker_shipper_network")
            .select("total_revenue_generated, total_shipments_brokered, commission_rate, created_at")
            .eq("broker_user_id", user.id)
            .eq("relationship_status", "active");

        if (monthlyError) {
            return { data: null, error: monthlyError.message };
        }

        // Calculate monthly aggregates
        const monthlyRevenue = new Map<string, { revenue: number; commission: number; shipments: number }>();
        let totalRevenue = 0;
        let totalCommission = 0;
        let totalShipments = 0;

        monthlyData?.forEach((partner) => {
            const month = new Date(partner.created_at).toISOString().slice(0, 7); // YYYY-MM
            const revenue = partner.total_revenue_generated || 0;
            const commission = (revenue * (partner.commission_rate / 100)) || 0;
            const shipments = partner.total_shipments_brokered || 0;

            if (!monthlyRevenue.has(month)) {
                monthlyRevenue.set(month, { revenue: 0, commission: 0, shipments: 0 });
            }

            const current = monthlyRevenue.get(month)!;
            current.revenue += revenue;
            current.commission += commission;
            current.shipments += shipments;

            totalRevenue += revenue;
            totalCommission += commission;
            totalShipments += shipments;
        });

        // Convert to array and sort by month
        const monthly_revenue = Array.from(monthlyRevenue.entries())
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12); // Last 12 months

        // Calculate growth rate (compare last month to previous month)
        let revenue_growth_rate = 0;
        if (monthly_revenue.length >= 2) {
            const lastMonth = monthly_revenue[monthly_revenue.length - 1].revenue;
            const previousMonth = monthly_revenue[monthly_revenue.length - 2].revenue;
            if (previousMonth > 0) {
                revenue_growth_rate = ((lastMonth - previousMonth) / previousMonth) * 100;
            }
        }

        const analytics: RevenueAnalytics = {
            monthly_revenue,
            total_revenue: totalRevenue,
            total_commission: totalCommission,
            average_commission_rate: totalShipments > 0 ? (totalCommission / totalRevenue) * 100 : 0,
            revenue_growth_rate,
        };

        return { data: analytics, error: null };
    } catch (error: any) {
        console.error("Error in getRevenueAnalytics:", error);
        return { data: null, error: error.message };
    }
}

/**
 * Get network analytics for broker
 */
export async function getNetworkAnalytics(): Promise<{ data: NetworkAnalytics | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { data: null, error: "Unauthorized" };
        }

        // Get shipper network with growth data
        const { data: shippers, error: shipperError } = await supabase
            .from("broker_shipper_network")
            .select(`
        *,
        shipper_profile:profiles!shipper_user_id(email),
        shipper_role:user_roles!shipper_user_id(role_specific_profile)
      `)
            .eq("broker_user_id", user.id);

        if (shipperError) {
            return { data: null, error: shipperError.message };
        }

        // Get carrier network
        const { data: carriers, error: carrierError } = await supabase
            .from("broker_carrier_network")
            .select(`
        *,
        carrier_profile:profiles!carrier_user_id(email),
        carrier_role:user_roles!carrier_user_id(role_specific_profile)
      `)
            .eq("broker_user_id", user.id);

        if (carrierError) {
            return { data: null, error: carrierError.message };
        }

        // Calculate network growth by month
        const growthMap = new Map<string, { shipper_count: number; carrier_count: number }>();

        shippers?.forEach((s) => {
            const month = new Date(s.created_at).toISOString().slice(0, 7);
            if (!growthMap.has(month)) {
                growthMap.set(month, { shipper_count: 0, carrier_count: 0 });
            }
            growthMap.get(month)!.shipper_count++;
        });

        carriers?.forEach((c) => {
            const month = new Date(c.created_at).toISOString().slice(0, 7);
            if (!growthMap.has(month)) {
                growthMap.set(month, { shipper_count: 0, carrier_count: 0 });
            }
            growthMap.get(month)!.carrier_count++;
        });

        const network_growth = Array.from(growthMap.entries())
            .map(([month, data]) => ({
                month,
                ...data,
                total: data.shipper_count + data.carrier_count,
            }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12);

        // Top shippers by revenue
        const top_shippers = (shippers || [])
            .map((s: any) => ({
                id: s.id,
                company_name: s.shipper_role?.[0]?.role_specific_profile?.company_name || "Unknown",
                total_shipments: s.total_shipments_brokered || 0,
                total_revenue: s.total_revenue_generated || 0,
            }))
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 10);

        // Top carriers by shipments
        const top_carriers = (carriers || [])
            .map((c: any) => ({
                id: c.id,
                company_name: c.carrier_role?.[0]?.role_specific_profile?.company_name || "Unknown",
                total_shipments: c.total_shipments_assigned || 0,
                reliability_rating: c.reliability_rating || 0,
            }))
            .sort((a, b) => b.total_shipments - a.total_shipments)
            .slice(0, 10);

        const active_partners = (shippers?.filter(s => s.relationship_status === "active").length || 0) +
            (carriers?.filter(c => c.relationship_status === "active").length || 0);
        const inactive_partners = (shippers?.filter(s => s.relationship_status !== "active").length || 0) +
            (carriers?.filter(c => c.relationship_status !== "active").length || 0);

        const analytics: NetworkAnalytics = {
            network_growth,
            top_shippers,
            top_carriers,
            active_partners,
            inactive_partners,
        };

        return { data: analytics, error: null };
    } catch (error: any) {
        console.error("Error in getNetworkAnalytics:", error);
        return { data: null, error: error.message };
    }
}

/**
 * Get performance metrics for broker
 */
export async function getPerformanceMetrics(): Promise<{ data: PerformanceMetrics | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { data: null, error: "Unauthorized" };
        }

        // Get total shipments brokered
        const { data: shipperNetwork } = await supabase
            .from("broker_shipper_network")
            .select("total_shipments_brokered, total_revenue_generated")
            .eq("broker_user_id", user.id)
            .eq("relationship_status", "active");

        const total_shipments_brokered = shipperNetwork?.reduce((sum, s) => sum + (s.total_shipments_brokered || 0), 0) || 0;
        const total_revenue = shipperNetwork?.reduce((sum, s) => sum + (s.total_revenue_generated || 0), 0) || 0;
        const average_shipment_value = total_shipments_brokered > 0 ? total_revenue / total_shipments_brokered : 0;

        // Get shipment completion data
        const { data: shipments } = await supabase
            .from("shipments")
            .select("status, created_at, updated_at")
            .eq("shipper_user_id", user.id);

        const completed = shipments?.filter(s => s.status === "delivered").length || 0;
        const total = shipments?.length || 0;
        const completion_rate = total > 0 ? (completed / total) * 100 : 0;

        // Calculate average delivery time
        const deliveredShipments = shipments?.filter(s => s.status === "delivered") || [];
        const totalDays = deliveredShipments.reduce((sum, s) => {
            const created = new Date(s.created_at);
            const delivered = new Date(s.updated_at);
            const days = (delivered.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
        }, 0);
        const average_delivery_time_days = deliveredShipments.length > 0 ? totalDays / deliveredShipments.length : 0;

        const metrics: PerformanceMetrics = {
            total_shipments_brokered,
            average_shipment_value,
            completion_rate,
            average_delivery_time_days,
            client_satisfaction_score: 0, // TODO: Calculate from ratings
        };

        return { data: metrics, error: null };
    } catch (error: any) {
        console.error("Error in getPerformanceMetrics:", error);
        return { data: null, error: error.message };
    }
}

/**
 * Export analytics report as CSV
 */
export async function exportAnalyticsReport(
    reportType: "revenue" | "network" | "performance"
): Promise<{ data: string | null; error: string | null }> {
    try {
        let csvData = "";

        if (reportType === "revenue") {
            const { data } = await getRevenueAnalytics();
            if (data) {
                csvData = "Month,Revenue,Commission,Shipments\n";
                data.monthly_revenue.forEach(row => {
                    csvData += `${row.month},${row.revenue},${row.commission},${row.shipments}\n`;
                });
            }
        } else if (reportType === "network") {
            const { data } = await getNetworkAnalytics();
            if (data) {
                csvData = "Month,Shippers,Carriers,Total\n";
                data.network_growth.forEach(row => {
                    csvData += `${row.month},${row.shipper_count},${row.carrier_count},${row.total}\n`;
                });
            }
        }

        return { data: csvData, error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}
