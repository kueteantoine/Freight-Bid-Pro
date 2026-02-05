"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type EmergencyAlertType = 'sos' | 'panic';
export type IncidentType = 'minor_accident' | 'major_accident' | 'injury' | 'theft' | 'other';
export type DelayReason = 'traffic' | 'vehicle_issue' | 'weather' | 'loading_delay' | 'other';
export type SafetyCheckinStatus = 'pending' | 'completed' | 'failed';

/**
 * Sends an emergency alert (SOS or Panic).
 */
export async function sendEmergencyAlert(params: {
    shipmentId?: string;
    alertType: EmergencyAlertType;
    latitude?: number;
    longitude?: number;
    locationName?: string;
}) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from("emergency_alerts")
        .insert({
            driver_user_id: user.id,
            shipment_id: params.shipmentId,
            alert_type: params.alertType,
            latitude: params.latitude,
            longitude: params.longitude,
            location_name: params.locationName
        });

    if (error) {
        console.error("Error sending emergency alert:", error);
        return { success: false, error: error.message };
    }

    // TODO: Trigger notifications to dispatch and admins via real-time or edge function

    return { success: true };
}

/**
 * Reports an incident/accident.
 */
export async function reportIncident(params: {
    shipmentId: string;
    incidentType: IncidentType;
    description: string;
    latitude?: number;
    longitude?: number;
    locationDescription?: string;
    witnessInfo?: any[];
    policeReportNumber?: string;
    evidenceUrls?: string[];
}) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from("incident_reports")
        .insert({
            shipment_id: params.shipmentId,
            driver_user_id: user.id,
            incident_type: params.incidentType,
            description: params.description,
            latitude: params.latitude,
            longitude: params.longitude,
            location_description: params.locationDescription,
            witness_info: params.witnessInfo || [],
            police_report_number: params.policeReportNumber,
            evidence_urls: params.evidenceUrls || []
        });

    if (error) {
        console.error("Error reporting incident:", error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/driver/jobs/${params.shipmentId}`);
    return { success: true };
}

/**
 * Reports a shipment delay.
 */
export async function reportShipmentDelay(params: {
    shipmentId: string;
    reason: DelayReason;
    explanation: string;
    estimatedDelayMinutes?: number;
    newEta?: string;
    evidenceUrls?: string[];
}) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const { data, error } = await supabase
        .from("shipment_delays")
        .insert({
            shipment_id: params.shipmentId,
            recorded_by_user_id: user.id,
            reason: params.reason,
            explanation: params.explanation,
            estimated_delay_minutes: params.estimatedDelayMinutes,
            new_eta: params.newEta,
            evidence_urls: params.evidenceUrls || []
        })
        .select()
        .single();

    if (error) {
        console.error("Error reporting delay:", error);
        return { success: false, error: error.message };
    }

    // Optionally update the shipment's estimated arrival if a new ETA is provided
    if (params.newEta) {
        await supabase
            .from("shipments")
            .update({ estimated_arrival: params.newEta })
            .eq("id", params.shipmentId);
    }

    revalidatePath(`/driver/jobs/${params.shipmentId}`);
    return { success: true, data };
}

/**
 * Responds to a safety check-in prompt.
 */
export async function respondToSafetyCheckin(params: {
    checkinId: string;
    latitude?: number;
    longitude?: number;
}) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from("safety_checkins")
        .update({
            status: 'completed',
            responded_at: new Date().toISOString(),
            latitude: params.latitude,
            longitude: params.longitude
        })
        .eq("id", params.checkinId)
        .eq("driver_user_id", user.id);

    if (error) {
        console.error("Error responding to check-in:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Reports a vehicle breakdown.
 */
export async function reportVehicleBreakdown(params: {
    vehicleId?: string;
    shipmentId?: string;
    description: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;
    assistanceRequested?: boolean;
}) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from("vehicle_breakdowns")
        .insert({
            vehicle_id: params.vehicleId,
            driver_user_id: user.id,
            shipment_id: params.shipmentId,
            description: params.description,
            latitude: params.latitude,
            longitude: params.longitude,
            location_name: params.locationName,
            assistance_requested: params.assistanceRequested || false
        });

    if (error) {
        console.error("Error reporting breakdown:", error);
        return { success: false, error: error.message };
    }

    if (params.shipmentId) {
        revalidatePath(`/driver/jobs/${params.shipmentId}`);
    }

    return { success: true };
}
