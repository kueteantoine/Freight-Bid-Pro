"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type EarningsSummary = {
    today: number;
    week_to_date: number;
    month_to_date: number;
    pending: number;
    total_lifetime: number;
};

export type PaymentHistoryFilters = {
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    pageSize?: number;
};

/**
 * Get comprehensive earnings summary for the current driver
 */
export async function getDriverEarningsSummary(): Promise<EarningsSummary> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Start of week (Sunday)
    const day = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day).toISOString();

    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch all completed payments for this driver
    const { data: payments, error } = await supabase
        .from("driver_payments")
        .select("amount, payment_status, created_at")
        .eq("driver_user_id", user.id);

    if (error) {
        console.error("Error fetching earnings summary:", error);
        return { today: 0, week_to_date: 0, month_to_date: 0, pending: 0, total_lifetime: 0 };
    }

    const summary = payments.reduce((acc, p) => {
        const amount = Number(p.amount);
        const createdAt = p.created_at;

        if (p.payment_status === 'completed') {
            acc.total_lifetime += amount;
            if (createdAt >= startOfToday) acc.today += amount;
            if (createdAt >= startOfWeek) acc.week_to_date += amount;
            if (createdAt >= startOfMonth) acc.month_to_date += amount;
        } else if (p.payment_status === 'pending' || p.payment_status === 'processing') {
            acc.pending += amount;
        }

        return acc;
    }, { today: 0, week_to_date: 0, month_to_date: 0, pending: 0, total_lifetime: 0 });

    return summary;
}

/**
 * Get paginated payment history for the current driver
 */
export async function getDriverPaymentHistory(filters: PaymentHistoryFilters = {}) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    let query = supabase
        .from("driver_payments")
        .select(`
            *,
            shipments (
                shipment_number,
                pickup_location,
                delivery_location
            )
        `, { count: 'exact' })
        .eq("driver_user_id", user.id)
        .order("created_at", { ascending: false });

    if (filters.status && filters.status !== 'all') {
        query = query.eq("payment_status", filters.status);
    }

    if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
    }

    if (filters.endDate) {
        query = query.lte("created_at", filters.endDate);
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;
    return { data, count };
}

/**
 * Get detailed breakdown for a specific trip payment
 */
export async function getTripEarningsBreakdown(paymentId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("driver_payments")
        .select(`
            *,
            shipments (*)
        `)
        .eq("id", paymentId)
        .eq("driver_user_id", user.id)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get progress for active driver incentives
 */
export async function getIncentiveProgress() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("driver_incentives")
        .select("*")
        .eq("driver_user_id", user.id)
        .eq("status", "active")
        .order("expires_at", { ascending: true });

    if (error) throw error;
    return data;
}

/**
 * Get earnings projections for the current driver
 */
export async function getEarningsProjections() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Get last 30 days of completed earnings
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
        .from("driver_payments")
        .select("amount")
        .eq("driver_user_id", user.id)
        .eq("payment_status", "completed")
        .gte("created_at", thirtyDaysAgo.toISOString());

    if (error) throw error;

    const totalLast30Days = data.reduce((sum, p) => sum + Number(p.amount), 0);
    const dailyAverage = totalLast30Days / 30;

    return {
        estimated_monthly: Math.round(dailyAverage * 30),
        estimated_weekly: Math.round(dailyAverage * 7),
        daily_average: Math.round(dailyAverage)
    };
}
