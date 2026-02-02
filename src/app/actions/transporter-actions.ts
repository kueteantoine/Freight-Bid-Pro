"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ShipmentStatus, TrackingEvent } from "@/lib/types/database";

/**
 * Fetch shipments awarded to or handled by the transporter.
 */
export async function getTransporterOperations(status?: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    let query = supabase
        .from("shipments")
        .select(`
      *,
      bids (
        id,
        bid_amount,
        bid_status
      )
    `)
        .eq("assigned_transporter_user_id", user.id)
        .order("updated_at", { ascending: false });

    if (status && status !== "all") {
        if (status === "awarded") {
            query = query.eq("status", "bid_awarded");
        } else if (status === "active") {
            query = query.eq("status", "in_transit");
        } else if (status === "completed") {
            query = query.eq("status", "delivered");
        }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/**
 * Assign a driver and vehicle to an awarded shipment.
 */
export async function assignDriverAndVehicle(shipmentId: string, driverId: string, vehicleId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("shipments")
        .update({
            assigned_driver_user_id: driverId,
            assigned_vehicle_id: vehicleId,
            updated_at: new Date().toISOString()
        })
        .eq("id", shipmentId)
        .eq("assigned_transporter_user_id", user.id);

    if (error) throw error;

    revalidatePath("/transporter/operations");
    return { success: true };
}

/**
 * Update shipment status and potentially add a tracking event.
 */
export async function updateShipmentStatus(shipmentId: string, status: ShipmentStatus, event?: TrackingEvent, notes?: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("shipments")
        .update({
            status,
            updated_at: new Date().toISOString()
        })
        .eq("id", shipmentId)
        .eq("assigned_transporter_user_id", user.id);

    if (error) throw error;

    if (event && !["shipment_created", "bid_awarded", "delivered", "cancelled"].includes(event)) {
        await supabase.from("shipment_tracking").insert({
            shipment_id: shipmentId,
            tracking_event: event,
            notes: notes || `Status updated to ${status}`,
            recorded_by_user_id: user.id
        });
    }

    revalidatePath("/transporter/operations");
    return { success: true };
}

/**
 * Complete a shipment with proof of delivery.
 */
export async function completeShipment(shipmentId: string, podData: { notes?: string, images?: string[] }) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error: updateError } = await supabase
        .from("shipments")
        .update({
            status: "delivered",
            updated_at: new Date().toISOString()
        })
        .eq("id", shipmentId)
        .eq("assigned_transporter_user_id", user.id);

    if (updateError) throw updateError;

    // Detailed tracking event with POD
    await supabase.from("shipment_tracking").insert({
        shipment_id: shipmentId,
        tracking_event: "delivered",
        notes: podData.notes || "Shipment completed with proof of delivery.",
        images_json: podData.images || [],
        recorded_by_user_id: user.id
    });

    revalidatePath("/transporter/operations");
    revalidatePath("/shipper/tracking");
    return { success: true };
}

/**
 * Fetch available drivers and vehicles for assignment.
 */
export async function getTransporterResources() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: drivers } = await supabase
        .from("driver_assignments")
        .select(`
            driver_user_id,
            profiles:driver_user_id (
                id,
                first_name,
                last_name
            )
        `)
        .eq("transporter_user_id", user.id)
        .eq("is_active", true);

    const { data: vehicles } = await supabase
        .from("vehicles")
        .select("*")
        .eq("transporter_user_id", user.id)
        .eq("status", "active");

    return {
        drivers: drivers?.map((d: any) => ({
            id: d.driver_user_id,
            name: d.profiles ? `${d.profiles.first_name || ""} ${d.profiles.last_name || ""}`.trim() : "Unknown Driver"
        })) || [],
        vehicles: vehicles || []
    };
}
