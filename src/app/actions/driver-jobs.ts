"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DriverJob = {
    id: string; // Assignment ID
    shipment_id: string;
    status: "pending" | "accepted" | "rejected" | "cancelled" | "completed" | "expired";
    assigned_at: string;
    response_deadline: string | null;
    shipment: {
        shipment_number: string;
        pickup_location: string;
        pickup_latitude: number;
        pickup_longitude: number;
        delivery_location: string;
        delivery_latitude: number;
        delivery_longitude: number;
        scheduled_pickup_date: string;
        scheduled_delivery_date: string;
        freight_type: string;
        weight_kg: number;
        dimensions_json: any;
        special_handling_requirements: string | null;
        shipper_id: string;
    };
    shipper?: { // Joined from shipment's shipper_user_id (requires additional join usually, but keeping simple for now)
        company_name?: string;
    };
};

/**
 * Fetch jobs assigned to the current driver
 */
export async function getDriverJobs(statusFilter?: "pending" | "active" | "history"): Promise<{ jobs: DriverJob[], error?: string }> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { jobs: [], error: "Unauthorized" };

    let query = supabase
        .from("shipment_assignments")
        .select(`
            id,
            shipment_id,
            status,
            assigned_at,
            response_deadline,
            shipment:shipments (
                id,
                shipment_number,
                pickup_location,
                pickup_latitude,
                pickup_longitude,
                delivery_location,
                delivery_latitude,
                delivery_longitude,
                scheduled_pickup_date,
                scheduled_delivery_date,
                freight_type,
                weight_kg,
                dimensions_json,
                special_handling_requirements,
                shipper_user_id
            )
        `)
        .eq("driver_user_id", user.id)
        .order("assigned_at", { ascending: false });

    if (statusFilter === "pending") {
        query = query.eq("status", "pending");
    } else if (statusFilter === "active") {
        query = query.in("status", ["accepted", "in_progress"]); // 'in_progress' implies accepted and started
    } else if (statusFilter === "history") {
        query = query.in("status", ["rejected", "cancelled", "completed", "expired"]);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching driver jobs:", error);
        return { jobs: [], error: error.message };
    }

    return { jobs: data as unknown as DriverJob[] };
}

/**
 * Respond to a job assignment (Accept or Reject)
 */
export async function respondToAssignment(assignmentId: string, response: "accept" | "reject", reason?: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const status = response === "accept" ? "accepted" : "rejected";

    // Update assignment status
    const { error: assignmentError } = await supabase
        .from("shipment_assignments")
        .update({
            status,
            rejection_reason: reason || null,
            responded_at: new Date().toISOString()
        })
        .eq("id", assignmentId)
        .eq("driver_user_id", user.id);

    if (assignmentError) throw assignmentError;

    // If accepted, update the shipment status and assigned_driver_id
    if (response === "accept") {
        // Get shipment ID from assignment
        const { data: assignment } = await supabase
            .from("shipment_assignments")
            .select("shipment_id")
            .eq("id", assignmentId)
            .single();

        if (assignment) {
            const { error: shipmentError } = await supabase
                .from("shipments")
                .update({
                    assigned_driver_user_id: user.id,
                    // Optionally update status to something like 'driver_assigned' if that state exists
                    // For now, keeping current status or moving to next logical step
                })
                .eq("id", assignment.shipment_id);

            if (shipmentError) {
                console.error("Error updating shipment with driver:", shipmentError);
                // Note: In a real app, we might want to revert the assignment update if this fails (transaction)
            }
        }
    }

    revalidatePath("/driver/jobs");
    return { success: true };
}

/**
 * Toggle auto-accept preference for the driver
 */
export async function toggleAutoAccept(enabled: boolean) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Check if preference row exists, if not create it (upsert)
    // Assuming user_preferences table has user_id as PK
    const { error } = await supabase
        .from("user_preferences")
        .upsert({
            user_id: user.id,
            driver_auto_accept_enabled: enabled,
            updated_at: new Date().toISOString()
        });

    if (error) throw error;

    revalidatePath("/driver/profile"); // Or wherever settings are
    return { success: true };
}
