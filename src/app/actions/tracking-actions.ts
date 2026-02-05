"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { TrackingEvent, ShipmentStatus, Shipment, ShipmentWithDetails } from "@/lib/types/database";

/**
 * Fetch shipments for the current shipper, optionally filtered by status.
 */
export async function getShipmentsByStatus(status?: ShipmentStatus) {
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
        .eq("shipper_user_id", user.id)
        .order("created_at", { ascending: false });

    if (status) {
        query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Shipment[];
}

/**
 * Get counts of shipments by status for the current shipper.
 */
export async function getShipmentCounts() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("shipments")
        .select("status")
        .eq("shipper_user_id", user.id);

    if (error) throw error;

    const counts = {
        all: data.length,
        draft: 0,
        open_for_bidding: 0,
        bid_awarded: 0,
        in_transit: 0,
        delivered: 0,
        cancelled: 0,
    };

    data.forEach((s) => {
        if (s.status in counts) {
            counts[s.status as keyof typeof counts]++;
        }
    });

    return counts;
}

/**
 * Fetch full shipment details including tracking events and profiles.
 */
export async function getShipmentDetails(id: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("shipments")
        .select(`
            *,
            tracking_events:shipment_tracking (
                *,
                profiles:recorded_by_user_id (
                    id,
                    first_name,
                    last_name,
                    avatar_url
                )
            ),
            transporter_profile:assigned_transporter_user_id (
                id,
                first_name,
                last_name,
                avatar_url
            ),
            driver_profile:assigned_driver_user_id (
                id,
                first_name,
                last_name,
                avatar_url
            )
        `)
        .eq("id", id)
        .single();

    if (error) throw error;
    return data as unknown as ShipmentWithDetails;
}

/**
 * Updates the driver's current location in driver_status and 
 * optionally in any active shipment they are currently handling.
 */
export async function updateDriverLocation(
    lat: number,
    lng: number,
    locationName?: string,
    activeShipmentId?: string
) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Update general driver status
    const { error: statusError } = await supabase
        .from("driver_status")
        .upsert({
            user_id: user.id,
            current_latitude: lat,
            current_longitude: lng,
            last_location_update: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

    if (statusError) {
        console.error("Error updating driver status:", statusError);
    }

    // 2. If on a job, update the shipment record for real-time customer view
    if (activeShipmentId) {
        const { error: shipmentError } = await supabase
            .from("shipments")
            .update({
                current_latitude: lat,
                current_longitude: lng,
                updated_at: new Date().toISOString()
            })
            .eq("id", activeShipmentId)
            .eq("assigned_driver_user_id", user.id);

        if (shipmentError) {
            console.error("Error updating shipment location:", shipmentError);
        }

        // 3. Log to tracking history (optional frequency control could be added here)
        // We log 'in_transit' points periodically
        const { error: trackingError } = await supabase
            .from("shipment_tracking")
            .insert({
                shipment_id: activeShipmentId,
                latitude: lat,
                longitude: lng,
                location_name: locationName || null,
                tracking_event: 'in_transit',
                recorded_by_user_id: user.id
            });

        if (trackingError) {
            console.error("Error adding tracking point:", trackingError);
        }
    }

    return { success: true };
}

/**
 * Records a specific tracking event (e.g., arrived_at_pickup, loaded, etc.)
 */
export async function recordTrackingEvent(
    shipmentId: string,
    event: TrackingEvent,
    notes?: string,
    lat?: number,
    lng?: number
) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from("shipment_tracking")
        .insert({
            shipment_id: shipmentId,
            tracking_event: event,
            notes: notes || `Event: ${event}`,
            latitude: lat,
            longitude: lng,
            recorded_by_user_id: user.id
        });

    if (error) {
        console.error("Error recording tracking event:", error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/driver/jobs/${shipmentId}`);
    return { success: true };
}

/**
 * Updates shipment status based on geofence trigger
 */
export async function updateShipmentStatusFromGeofence(
    shipmentId: string,
    newStatus: ShipmentStatus,
    event: TrackingEvent,
    lat: number,
    lng: number
) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Update Shipment Status
    const { error: shipmentError } = await supabase
        .from("shipments")
        .update({
            status: newStatus,
            current_latitude: lat,
            current_longitude: lng,
            updated_at: new Date().toISOString()
        })
        .eq("id", shipmentId)
        .eq("assigned_driver_user_id", user.id);

    if (shipmentError) {
        console.error("Error updating shipment status via geofence:", shipmentError);
        return { success: false, error: shipmentError.message };
    }

    // 2. Record Event
    await recordTrackingEvent(shipmentId, event, `Geofence trigger: ${event}`, lat, lng);

    revalidatePath(`/driver/jobs/${shipmentId}`);
    revalidatePath("/driver/dashboard");

    return { success: true };
}
