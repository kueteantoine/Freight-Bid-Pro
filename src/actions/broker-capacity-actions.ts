'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CarrierCapacity {
    id: string;
    broker_user_id: string;
    carrier_user_id: string;
    vehicle_id?: string;
    is_available: boolean;
    available_from_date: string;
    available_to_date?: string;
    current_location?: string;
    current_latitude?: number;
    current_longitude?: number;
    available_weight_kg: number;
    available_volume_cubic_meters?: number;
    total_capacity_kg: number;
    total_capacity_cubic_meters?: number;
    service_areas: string[];
    preferred_routes: Array<{ origin: string; destination: string }>;
    vehicle_types: string[];
    notes?: string;
    last_updated_at: string;
    created_at: string;
    updated_at: string;
}

export interface CapacityForecast {
    carrier_user_id: string;
    carrier_name: string;
    forecast_date: string;
    predicted_available_weight_kg: number;
    current_assignments: number;
    historical_average_utilization: number;
    confidence_level: 'high' | 'medium' | 'low';
}

/**
 * Get carrier capacity for a specific carrier
 */
export async function getCarrierCapacity(carrierId: string, brokerId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('broker_carrier_capacity')
            .select('*')
            .eq('carrier_user_id', carrierId)
            .eq('broker_user_id', brokerId)
            .order('available_from_date', { ascending: true });

        if (error) throw error;

        return { data: data as CarrierCapacity[], error: null };
    } catch (error: any) {
        console.error('Error fetching carrier capacity:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Update carrier capacity information
 */
export async function updateCarrierCapacity(
    capacityId: string,
    updates: Partial<CarrierCapacity>
) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('broker_carrier_capacity')
            .update({
                ...updates,
                last_updated_at: new Date().toISOString(),
            })
            .eq('id', capacityId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/broker/load-matching');
        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating carrier capacity:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Create new carrier capacity entry
 */
export async function createCarrierCapacity(capacity: Omit<CarrierCapacity, 'id' | 'created_at' | 'updated_at' | 'last_updated_at'>) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('broker_carrier_capacity')
            .insert({
                ...capacity,
                last_updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/broker/load-matching');
        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating carrier capacity:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Forecast carrier capacity based on current assignments and historical patterns
 */
export async function forecastCarrierCapacity(
    brokerId: string,
    forecastDays: number = 30
): Promise<{ data: CapacityForecast[] | null; error: string | null }> {
    const supabase = await createClient();

    try {
        // Get all carriers in broker's network
        const { data: carriers, error: carriersError } = await supabase
            .from('broker_carrier_network')
            .select(`
        carrier_user_id,
        total_shipments_assigned,
        performance_metrics
      `)
            .eq('broker_user_id', brokerId)
            .eq('relationship_status', 'active');

        if (carriersError) throw carriersError;

        const forecasts: CapacityForecast[] = [];

        for (const carrier of carriers || []) {
            // Get carrier name
            const { data: userData } = await supabase
                .from('user_roles')
                .select('role_specific_profile')
                .eq('user_id', carrier.carrier_user_id)
                .eq('role_type', 'carrier')
                .single();

            // Get current capacity
            const { data: capacityData } = await supabase
                .from('broker_carrier_capacity')
                .select('*')
                .eq('carrier_user_id', carrier.carrier_user_id)
                .eq('broker_user_id', brokerId)
                .eq('is_available', true)
                .single();

            if (!capacityData) continue;

            // Get current assignments (confirmed matches not yet completed)
            const { data: currentMatches } = await supabase
                .from('broker_load_matches')
                .select('id')
                .eq('carrier_user_id', carrier.carrier_user_id)
                .eq('broker_user_id', brokerId)
                .in('match_status', ['confirmed', 'pending'])
                .not('match_status', 'eq', 'completed');

            // Calculate historical utilization
            const totalShipments = carrier.total_shipments_assigned || 0;
            const avgUtilization = totalShipments > 0
                ? Math.min(85, 50 + (totalShipments / 10) * 5) // Simplified calculation
                : 50;

            // Generate forecast for next N days
            for (let day = 1; day <= forecastDays; day++) {
                const forecastDate = new Date();
                forecastDate.setDate(forecastDate.getDate() + day);

                // Predict available capacity (simplified - would use ML in production)
                const utilizationFactor = avgUtilization / 100;
                const predictedAvailable = capacityData.total_capacity_kg * (1 - utilizationFactor);

                // Confidence level based on historical data
                const confidenceLevel: 'high' | 'medium' | 'low' =
                    totalShipments > 20 ? 'high' :
                        totalShipments > 5 ? 'medium' : 'low';

                forecasts.push({
                    carrier_user_id: carrier.carrier_user_id,
                    carrier_name: userData?.role_specific_profile?.company_name || 'Unknown Carrier',
                    forecast_date: forecastDate.toISOString().split('T')[0],
                    predicted_available_weight_kg: Math.round(predictedAvailable),
                    current_assignments: currentMatches?.length || 0,
                    historical_average_utilization: avgUtilization,
                    confidence_level: confidenceLevel,
                });
            }
        }

        return { data: forecasts, error: null };
    } catch (error: any) {
        console.error('Error forecasting carrier capacity:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Identify capacity gaps (insufficient capacity for demand)
 */
export async function getCapacityGaps(brokerId: string) {
    const supabase = await createClient();

    try {
        // Get shipper IDs from broker's network
        const { data: shipperNetwork, error: networkError } = await supabase
            .from('broker_shipper_network')
            .select('shipper_user_id')
            .eq('broker_user_id', brokerId)
            .eq('relationship_status', 'active');

        if (networkError) throw networkError;

        const shipperIds = shipperNetwork?.map(s => s.shipper_user_id) || [];

        if (shipperIds.length === 0) {
            return { data: { unmatched_loads_count: 0, total_required_weight_kg: 0, total_available_weight_kg: 0, capacity_deficit_kg: 0, has_capacity_shortage: false, unmatched_loads: [] }, error: null };
        }

        // Get unmatched loads
        const { data: unmatchedLoads, error: loadsError } = await supabase
            .from('shipments')
            .select(`
        id,
        shipment_number,
        weight_kg,
        preferred_vehicle_type,
        scheduled_pickup_date,
        pickup_location,
        delivery_location
      `)
            .in('shipper_user_id', shipperIds)
            .not('id', 'in', `(
        SELECT shipment_id FROM broker_load_matches 
        WHERE broker_user_id = '${brokerId}' 
        AND match_status IN ('confirmed', 'completed')
      )`)
            .in('status', ['open_for_bidding', 'bid_awarded']);

        if (loadsError) throw loadsError;

        // Get total available capacity
        const { data: totalCapacity, error: capacityError } = await supabase
            .from('broker_carrier_capacity')
            .select('available_weight_kg')
            .eq('broker_user_id', brokerId)
            .eq('is_available', true);

        if (capacityError) throw capacityError;

        const totalAvailableWeight = totalCapacity?.reduce(
            (sum, cap) => sum + (cap.available_weight_kg || 0),
            0
        ) || 0;

        const totalRequiredWeight = unmatchedLoads?.reduce(
            (sum, load) => sum + (load.weight_kg || 0),
            0
        ) || 0;

        const gaps = {
            unmatched_loads_count: unmatchedLoads?.length || 0,
            total_required_weight_kg: totalRequiredWeight,
            total_available_weight_kg: totalAvailableWeight,
            capacity_deficit_kg: Math.max(0, totalRequiredWeight - totalAvailableWeight),
            has_capacity_shortage: totalRequiredWeight > totalAvailableWeight,
            unmatched_loads: unmatchedLoads,
        };

        return { data: gaps, error: null };
    } catch (error: any) {
        console.error('Error identifying capacity gaps:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get all capacity entries for a broker
 */
export async function getAllBrokerCapacity(brokerId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('broker_carrier_capacity')
            .select(`
        *,
        vehicles (
          vehicle_type,
          make,
          model,
          license_plate
        )
      `)
            .eq('broker_user_id', brokerId)
            .order('available_from_date', { ascending: true });

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching all broker capacity:', error);
        return { data: null, error: error.message };
    }
}
