"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DriverPerformanceMetrics = {
    total_trips: number;
    total_distance: number;
    total_earnings: number;
    avg_rating: number;
    on_time_rate: number;
    acceptance_rate: number;
    rank: number;
};

/**
 * Get overall performance metrics for the driver
 */
export async function getDriverPerformanceMetrics() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // 1. Get basic stats from existing tables
    const { count: totalTrips } = await supabase
        .from("shipment_assignments")
        .select("*", { count: "exact", head: true })
        .eq("driver_user_id", user.id)
        .eq("assignment_status", "completed");

    const { data: earningsData } = await supabase
        .from("driver_payments")
        .select("amount")
        .eq("driver_user_id", user.id)
        .eq("payment_status", "completed");

    const totalEarnings = earningsData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

    // 2. Get ratings
    const { data: ratingsData } = await supabase
        .from("ratings_reviews")
        .select("rating_overall")
        .eq("reviewed_user_id", user.id);

    const avgRating = ratingsData && ratingsData.length > 0
        ? ratingsData.reduce((acc, curr) => acc + curr.rating_overall, 0) / ratingsData.length
        : 0;

    // 3. Get acceptance rate
    const { count: totalAssigned } = await supabase
        .from("shipment_assignments")
        .select("*", { count: "exact", head: true })
        .eq("driver_user_id", user.id);

    const { count: totalAccepted } = await supabase
        .from("shipment_assignments")
        .select("*", { count: "exact", head: true })
        .eq("driver_user_id", user.id)
        .not("accepted_at", "is", null);

    const acceptanceRate = (totalAssigned && totalAssigned > 0)
        ? (totalAccepted || 0) / totalAssigned * 100
        : 0;

    // 4. On-time rate (Simplified: delivered_at <= scheduled_delivery_date)
    // This would require better tracking in shipments/assignments
    const onTimeRate = 98; // Mock for now until we have better delivery time tracking

    return {
        total_trips: totalTrips || 0,
        total_distance: 2450, // Mock for now
        total_earnings: totalEarnings,
        avg_rating: Number(avgRating.toFixed(1)),
        on_time_rate: onTimeRate,
        acceptance_rate: Number(acceptanceRate.toFixed(1)),
        rank: 5 // Mock for now
    };
}

/**
 * Get detailed rating breakdown and recent reviews
 */
export async function getDriverRatings() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("ratings_reviews")
        .select(`
            *,
            reviewer:profiles!reviewer_user_id(first_name, last_name, avatar_url)
        `)
        .eq("reviewed_user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) throw error;

    const breakdown = {
        timeliness: data?.reduce((acc, curr) => acc + (curr.rating_timeliness || 0), 0) / (data?.length || 1),
        communication: data?.reduce((acc, curr) => acc + (curr.rating_communication || 0), 0) / (data?.length || 1),
        handling: data?.reduce((acc, curr) => acc + (curr.rating_condition || 0), 0) / (data?.length || 1),
    };

    return {
        reviews: data || [],
        breakdown
    };
}

/**
 * Get driver achievements and badges
 */
export async function getDriverAchievements() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("driver_achievements")
        .select("*")
        .eq("driver_user_id", user.id)
        .order("earned_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get current personal goals and progress
 */
export async function getDriverGoals() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("driver_goals")
        .select("*")
        .eq("driver_user_id", user.id)
        .eq("status", "active")
        .order("end_date", { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Create or update a personal goal
 */
export async function upsertDriverGoal(goal: any) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("driver_goals")
        .upsert({
            ...goal,
            driver_user_id: user.id,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;

    revalidatePath("/driver/performance");
    return data;
}

/**
 * Get extreme statistics (longest trip, highest earning, etc.)
 */
export async function getDriverStatsExtremes() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase.rpc("get_driver_stats_extremes", {
        driver_uuid: user.id
    });

    if (error) throw error;
    return data;
}
