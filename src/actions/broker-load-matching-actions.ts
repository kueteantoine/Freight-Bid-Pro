'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Types
export type MatchType = 'ai_suggested' | 'manual' | 'automated';
export type MatchStatus = 'suggested' | 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';

export interface LoadMatch {
    id: string;
    broker_user_id: string;
    shipment_id: string;
    carrier_user_id: string;
    match_type: MatchType;
    match_status: MatchStatus;
    match_score: number;
    score_breakdown: {
        route_compatibility: number;
        vehicle_match: number;
        capacity_match: number;
        cost_optimization: number;
        reliability_score: number;
        delivery_time_match: number;
        distance_km?: number;
    };
    matching_criteria: Record<string, any>;
    suggested_at: string;
    confirmed_at?: string;
    rejected_at?: string;
    broker_notes?: string;
    rejection_reason?: string;
    created_at: string;
    updated_at: string;
}

export interface AvailableLoad {
    id: string;
    shipment_number: string;
    shipper_user_id: string;
    shipper_name: string;
    pickup_location: string;
    delivery_location: string;
    scheduled_pickup_date: string;
    freight_type: string;
    weight_kg: number;
    preferred_vehicle_type: string;
    status: string;
}

export interface AvailableCarrier {
    carrier_user_id: string;
    carrier_name: string;
    reliability_rating: number;
    total_shipments_assigned: number;
    performance_metrics: {
        on_time_rate: number;
        completion_rate: number;
        average_rating: number;
    };
    capacity_id: string;
    available_weight_kg: number;
    current_location: string;
    vehicle_types: string[];
}

export interface MatchingSuggestion {
    carrier_user_id: string;
    carrier_name: string;
    match_score: number;
    score_breakdown: LoadMatch['score_breakdown'];
    capacity_id: string;
    available_weight_kg: number;
    reliability_rating: number;
}

/**
 * Get available loads (unmatched shipments) from shipper network
 */
export async function getAvailableLoads(brokerId: string) {
    const supabase = await createClient();

    try {
        // Get all shippers in broker's network
        const { data: shipperNetwork, error: networkError } = await supabase
            .from('broker_shipper_network')
            .select('shipper_user_id')
            .eq('broker_user_id', brokerId)
            .eq('relationship_status', 'active');

        if (networkError) throw networkError;

        const shipperIds = shipperNetwork?.map(s => s.shipper_user_id) || [];

        if (shipperIds.length === 0) {
            return { data: [], error: null };
        }

        // Get unmatched shipments from these shippers
        const { data: shipments, error: shipmentsError } = await supabase
            .from('shipments')
            .select(`
        id,
        shipment_number,
        shipper_user_id,
        pickup_location,
        delivery_location,
        scheduled_pickup_date,
        freight_type,
        weight_kg,
        preferred_vehicle_type,
        status
      `)
            .in('shipper_user_id', shipperIds)
            .in('status', ['open_for_bidding', 'bid_awarded'])
            .not('id', 'in', `(
        SELECT shipment_id FROM broker_load_matches 
        WHERE broker_user_id = '${brokerId}' 
        AND match_status IN ('confirmed', 'completed')
      )`)
            .order('scheduled_pickup_date', { ascending: true });

        if (shipmentsError) throw shipmentsError;

        // Enrich with shipper names
        const enrichedShipments: AvailableLoad[] = await Promise.all(
            (shipments || []).map(async (shipment) => {
                const { data: userData } = await supabase
                    .from('user_roles')
                    .select('role_specific_profile')
                    .eq('user_id', shipment.shipper_user_id)
                    .eq('role_type', 'shipper')
                    .single();

                return {
                    ...shipment,
                    shipper_name: userData?.role_specific_profile?.company_name || 'Unknown Shipper',
                };
            })
        );

        return { data: enrichedShipments, error: null };
    } catch (error: any) {
        console.error('Error fetching available loads:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get available carriers with capacity from broker's network
 */
export async function getAvailableCarriers(brokerId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('broker_carrier_network')
            .select(`
        carrier_user_id,
        reliability_rating,
        total_shipments_assigned,
        performance_metrics,
        broker_carrier_capacity (
          id,
          available_weight_kg,
          current_location,
          vehicle_types,
          is_available
        )
      `)
            .eq('broker_user_id', brokerId)
            .eq('relationship_status', 'active');

        if (error) throw error;

        // Filter carriers with available capacity and enrich with names
        const enrichedCarriers: AvailableCarrier[] = await Promise.all(
            (data || [])
                .filter(carrier =>
                    carrier.broker_carrier_capacity &&
                    carrier.broker_carrier_capacity.length > 0 &&
                    carrier.broker_carrier_capacity.some((cap: any) => cap.is_available)
                )
                .map(async (carrier) => {
                    const { data: userData } = await supabase
                        .from('user_roles')
                        .select('role_specific_profile')
                        .eq('user_id', carrier.carrier_user_id)
                        .eq('role_type', 'carrier')
                        .single();

                    const availableCapacity = carrier.broker_carrier_capacity.find((cap: any) => cap.is_available);

                    return {
                        carrier_user_id: carrier.carrier_user_id,
                        carrier_name: userData?.role_specific_profile?.company_name || 'Unknown Carrier',
                        reliability_rating: carrier.reliability_rating || 0,
                        total_shipments_assigned: carrier.total_shipments_assigned || 0,
                        performance_metrics: carrier.performance_metrics || {
                            on_time_rate: 0,
                            completion_rate: 0,
                            average_rating: 0,
                        },
                        capacity_id: availableCapacity.id,
                        available_weight_kg: availableCapacity.available_weight_kg,
                        current_location: availableCapacity.current_location || 'Unknown',
                        vehicle_types: availableCapacity.vehicle_types || [],
                    };
                })
        );

        return { data: enrichedCarriers, error: null };
    } catch (error: any) {
        console.error('Error fetching available carriers:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get AI-powered matching suggestions for a shipment
 */
export async function getMatchingSuggestions(
    shipmentId: string,
    brokerId: string,
    minScore: number = 70
) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('find_matching_carriers', {
            p_shipment_id: shipmentId,
            p_broker_user_id: brokerId,
            p_min_score: minScore,
        });

        if (error) throw error;

        return { data: data as MatchingSuggestion[], error: null };
    } catch (error: any) {
        console.error('Error fetching matching suggestions:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Create a manual match between a load and carrier
 */
export async function createManualMatch(
    brokerId: string,
    shipmentId: string,
    carrierId: string,
    notes?: string
) {
    const supabase = await createClient();

    try {
        // Calculate match score
        const { data: scoreData, error: scoreError } = await supabase.rpc('calculate_match_score', {
            p_shipment_id: shipmentId,
            p_carrier_user_id: carrierId,
            p_broker_user_id: brokerId,
        });

        if (scoreError) throw scoreError;

        const matchScore = scoreData?.[0]?.match_score || 0;
        const scoreBreakdown = scoreData?.[0]?.score_breakdown || {};

        // Create the match
        const { data, error } = await supabase
            .from('broker_load_matches')
            .insert({
                broker_user_id: brokerId,
                shipment_id: shipmentId,
                carrier_user_id: carrierId,
                match_type: 'manual',
                match_status: 'confirmed',
                match_score: matchScore,
                score_breakdown: scoreBreakdown,
                broker_notes: notes,
                confirmed_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/broker/load-matching');
        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating manual match:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Accept an AI suggestion and create a match
 */
export async function acceptMatchSuggestion(
    brokerId: string,
    shipmentId: string,
    carrierId: string,
    matchScore: number,
    scoreBreakdown: LoadMatch['score_breakdown']
) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('broker_load_matches')
            .insert({
                broker_user_id: brokerId,
                shipment_id: shipmentId,
                carrier_user_id: carrierId,
                match_type: 'ai_suggested',
                match_status: 'confirmed',
                match_score: matchScore,
                score_breakdown: scoreBreakdown,
                confirmed_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/broker/load-matching');
        return { data, error: null };
    } catch (error: any) {
        console.error('Error accepting match suggestion:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Unmatch a load (cancel or reject a match)
 */
export async function unmatchLoad(matchId: string, reason?: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('broker_load_matches')
            .update({
                match_status: 'cancelled',
                rejection_reason: reason,
                rejected_at: new Date().toISOString(),
            })
            .eq('id', matchId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/broker/load-matching');
        return { data, error: null };
    } catch (error: any) {
        console.error('Error unmatching load:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Batch match multiple loads
 */
export async function batchMatchLoads(
    brokerId: string,
    matches: Array<{
        shipmentId: string;
        carrierId: string;
        matchScore: number;
        scoreBreakdown: LoadMatch['score_breakdown'];
    }>
) {
    const supabase = await createClient();

    try {
        const matchRecords = matches.map(match => ({
            broker_user_id: brokerId,
            shipment_id: match.shipmentId,
            carrier_user_id: match.carrierId,
            match_type: 'automated' as MatchType,
            match_status: 'confirmed' as MatchStatus,
            match_score: match.matchScore,
            score_breakdown: match.scoreBreakdown,
            confirmed_at: new Date().toISOString(),
        }));

        const { data, error } = await supabase
            .from('broker_load_matches')
            .insert(matchRecords)
            .select();

        if (error) throw error;

        revalidatePath('/broker/load-matching');
        return { data, error: null };
    } catch (error: any) {
        console.error('Error batch matching loads:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get all matches for a broker
 */
export async function getBrokerMatches(brokerId: string, status?: MatchStatus) {
    const supabase = await createClient();

    try {
        let query = supabase
            .from('broker_load_matches')
            .select(`
        *,
        shipments (
          shipment_number,
          pickup_location,
          delivery_location,
          scheduled_pickup_date,
          freight_type,
          weight_kg
        )
      `)
            .eq('broker_user_id', brokerId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('match_status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching broker matches:', error);
        return { data: null, error: error.message };
    }
}
