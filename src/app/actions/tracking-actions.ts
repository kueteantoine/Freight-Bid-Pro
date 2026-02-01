"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ShipmentStatus, ShipmentTracking, ShipmentWithDetails, TrackingEvent } from "@/lib/types/database";

/**
 * Get all tracking events for a shipment
 */
export async function getShipmentTracking(shipmentId: string) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("shipment_tracking")
        .select(`
      *,
      profiles:recorded_by_user_id (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
        .eq("shipment_id", shipmentId)
        .order("event_timestamp", { ascending: false });

    if (error) {
        console.error("Error fetching shipment tracking:", error);
        throw new Error("Failed to fetch tracking events");
    }

    return data;
}

/**
 * Add a new tracking event
 */
export async function addTrackingEvent(
    shipmentId: string,
    event: TrackingEvent,
    notes?: string,
    latitude?: number,
    longitude?: number,
    locationName?: string,
    images?: string[]
) {
    const supabase = await createSupabaseServerClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
        throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
        .from("shipment_tracking")
        .insert({
            shipment_id: shipmentId,
            tracking_event: event,
            notes,
            latitude,
            longitude,
            location_name: locationName,
            images_json: images || [],
            recorded_by_user_id: user.user.id,
        })
        .select()
        .single();

    if (error) {
        console.error("Error adding tracking event:", error);
        throw new Error("Failed to add tracking event");
    }

    return data;
}

/**
 * Update shipment location (for real-time tracking)
 */
export async function updateShipmentLocation(
    shipmentId: string,
    latitude: number,
    longitude: number,
    locationName?: string
) {
    const supabase = await createSupabaseServerClient();

    // Update current location on shipment
    const { error: updateError } = await supabase
        .from("shipments")
        .update({
            current_latitude: latitude,
            current_longitude: longitude,
        })
        .eq("id", shipmentId);

    if (updateError) {
        console.error("Error updating shipment location:", updateError);
        throw new Error("Failed to update location");
    }

    // Create tracking event
    await addTrackingEvent(
        shipmentId,
        "in_transit",
        locationName ? `Location update: ${locationName}` : "Location updated",
        latitude,
        longitude,
        locationName
    );

    return { success: true };
}

/**
 * Get shipments filtered by status
 */
export async function getShipmentsByStatus(status?: ShipmentStatus) {
    const supabase = await createSupabaseServerClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
        throw new Error("User not authenticated");
    }

    let query = supabase
        .from("shipments")
        .select(`
      *,
      bids (
        id,
        bid_amount,
        bid_status,
        transporter_user_id
      )
    `)
        .eq("shipper_user_id", user.user.id)
        .order("created_at", { ascending: false });

    if (status) {
        query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching shipments:", error);
        throw new Error("Failed to fetch shipments");
    }

    return data;
}

/**
 * Get shipment counts by status
 */
export async function getShipmentCounts() {
    const supabase = await createSupabaseServerClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
        throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
        .from("shipments")
        .select("status")
        .eq("shipper_user_id", user.user.id);

    if (error) {
        console.error("Error fetching shipment counts:", error);
        throw new Error("Failed to fetch shipment counts");
    }

    // Count by status
    const counts = {
        all: data.length,
        draft: 0,
        open_for_bidding: 0,
        bid_awarded: 0,
        in_transit: 0,
        delivered: 0,
        cancelled: 0,
    };

    data.forEach((shipment: { status: ShipmentStatus }) => {
        counts[shipment.status as keyof typeof counts]++;
    });

    return counts;
}

/**
 * Get complete shipment details with tracking, carrier, and driver info
 */
export async function getShipmentDetails(shipmentId: string): Promise<ShipmentWithDetails> {
    const supabase = await createSupabaseServerClient();

    // Fetch shipment with all related data
    const { data: shipment, error: shipmentError } = await supabase
        .from("shipments")
        .select(`
      *,
      bids (
        id,
        bid_amount,
        bid_status,
        estimated_delivery_date,
        transporter_user_id,
        profiles:transporter_user_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      )
    `)
        .eq("id", shipmentId)
        .single();

    if (shipmentError) {
        console.error("Error fetching shipment:", shipmentError);
        throw new Error("Failed to fetch shipment details");
    }

    // Fetch tracking events
    const trackingEvents = await getShipmentTracking(shipmentId);

    // Fetch carrier profile if assigned
    let carrierProfile = null;
    if (shipment.assigned_carrier_user_id) {
        const { data: carrier } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", shipment.assigned_carrier_user_id)
            .single();
        carrierProfile = carrier;
    }

    // Fetch driver profile if assigned
    let driverProfile = null;
    if (shipment.assigned_driver_user_id) {
        const { data: driver } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", shipment.assigned_driver_user_id)
            .single();
        driverProfile = driver;
    }

    return {
        ...shipment,
        tracking_events: trackingEvents,
        carrier_profile: carrierProfile,
        driver_profile: driverProfile,
    } as ShipmentWithDetails;
}

/**
 * Get active shipments for map view (in_transit and bid_awarded)
 */
export async function getActiveShipmentsForMap() {
    const supabase = await createSupabaseServerClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
        throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
        .from("shipments")
        .select(`
      id,
      shipment_number,
      pickup_location,
      pickup_latitude,
      pickup_longitude,
      delivery_location,
      delivery_latitude,
      delivery_longitude,
      current_latitude,
      current_longitude,
      status,
      estimated_arrival
    `)
        .eq("shipper_user_id", user.user.id)
        .in("status", ["bid_awarded", "in_transit"])
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching active shipments:", error);
        throw new Error("Failed to fetch active shipments");
    }

    return data;
}
