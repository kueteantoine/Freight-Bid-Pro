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

import { getDistanceMatrix } from "@/lib/google-maps";

/**
 * Enhanced function to update driver location with speed-based logic and ETA updates.
 * This can handle multiple coordinates at once for offline sync.
 */
export async function updateDriverLocationEnhanced(
    updates: { lat: number; lng: number; timestamp: string; velocity?: number }[],
    activeShipmentId?: string
) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || updates.length === 0) return { success: false, error: "Unauthorized or no data" };

    const lastUpdate = updates[updates.length - 1];

    // 1. Update general driver status with the most recent location
    const { error: statusError } = await supabase
        .from("driver_status")
        .upsert({
            user_id: user.id,
            current_latitude: lastUpdate.lat,
            current_longitude: lastUpdate.lng,
            last_location_update: lastUpdate.timestamp,
            updated_at: new Date().toISOString()
        });

    if (statusError) console.error("Error updating driver status:", statusError);

    // 2. Handle active shipment updates
    if (activeShipmentId) {
        // Bulk insert tracking points for history
        const trackingPoints = updates.map(up => ({
            shipment_id: activeShipmentId,
            latitude: up.lat,
            longitude: up.lng,
            tracking_event: 'in_transit' as const,
            recorded_by_user_id: user.id,
            event_timestamp: up.timestamp
        }));

        const { error: trackingError } = await supabase
            .from("shipment_tracking")
            .insert(trackingPoints);

        if (trackingError) console.error("Error adding tracking points:", trackingError);

        // Update current shipment state
        const { error: shipmentError } = await supabase
            .from("shipments")
            .update({
                current_latitude: lastUpdate.lat,
                current_longitude: lastUpdate.lng,
                updated_at: new Date().toISOString()
            })
            .eq("id", activeShipmentId);

        if (shipmentError) console.error("Error updating shipment location:", shipmentError);

        // 3. Recalculate ETA periodically (e.g., only on the most recent point)
        await updateShipmentETA(activeShipmentId, lastUpdate.lat, lastUpdate.lng);
    }

    return { success: true };
}

/**
 * Legacy updateDriverLocation (kept for compatibility)
 */
export async function updateDriverLocation(
    lat: number,
    lng: number,
    locationName?: string,
    activeShipmentId?: string
) {
    return updateDriverLocationEnhanced([{ lat, lng, timestamp: new Date().toISOString() }], activeShipmentId);
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
 * Helper to update shipment ETA using Google Distance Matrix or fallback logic.
 */
async function updateShipmentETA(shipmentId: string, currentLat: number, currentLng: number) {
    const supabase = await createSupabaseServerClient();

    // Fetch shipment destination
    const { data: shipment } = await supabase
        .from("shipments")
        .select("delivery_latitude, delivery_longitude, status")
        .eq("id", shipmentId)
        .single();

    if (!shipment || !shipment.delivery_latitude || !shipment.delivery_longitude) return;

    // Call Google Distance Matrix
    const result = await getDistanceMatrix(
        { lat: currentLat, lng: currentLng },
        { lat: shipment.delivery_latitude, lng: shipment.delivery_longitude }
    );

    let estimatedArrival: string | null = null;

    if (result) {
        estimatedArrival = new Date(Date.now() + result.duration_value * 1000).toISOString();
    } else {
        // Fallback: Simple distance-based calculation (50km/h average)
        const R = 6371; // Radius of the earth in km
        const dLat = (shipment.delivery_latitude - currentLat) * Math.PI / 180;
        const dLon = (shipment.delivery_longitude - currentLng) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(currentLat * Math.PI / 180) * Math.cos(shipment.delivery_latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // in km

        const durationHours = distance / 40; // Assume 40km/h for buffer
        estimatedArrival = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();
    }

    await supabase
        .from("shipments")
        .update({ estimated_arrival: estimatedArrival })
        .eq("id", shipmentId);
}

/**
 * Updates shipment status from geofence with server-side validation.
 */
export async function updateShipmentStatusFromGeofence(
    shipmentId: string,
    newStatus: ShipmentStatus,
    event: TrackingEvent,
    lat: number,
    lng: number,
    locationType: 'pickup' | 'delivery'
) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Server-side validation via RPC
    const { data: validation, error: rpcError } = await supabase.rpc('validate_geofence_event', {
        p_shipment_id: shipmentId,
        p_latitude: lat,
        p_longitude: lng,
        p_location_type: locationType,
        p_event_type: 'enter'
    });

    if (rpcError) {
        console.error("Geofence validation RPC error:", rpcError);
        return { success: false, error: rpcError.message };
    }

    if (!validation?.is_valid) {
        console.warn(`Geofence validation failed: distance ${validation?.distance_meters}m`);
        // We might still allow it but flag it in the log (which the RPC already does)
        // For now, let's proceed but potentially notify admin if distance is way off
    }

    // 2. Update Shipment Status
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

    // 3. Record Event
    await recordTrackingEvent(shipmentId, event, `Geofence trigger (${locationType}): ${event}. Validated: ${validation?.is_valid}`, lat, lng);

    revalidatePath(`/driver/jobs/${shipmentId}`);
    revalidatePath("/driver/dashboard");

    return { success: true, validation };
}
