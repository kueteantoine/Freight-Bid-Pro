'use server';

import { createClient } from '@/lib/supabase/server';

export interface CoverageGap {
    shipment_id: string;
    shipment_number: string;
    weight_kg: number;
    preferred_vehicle_type: string;
    scheduled_pickup_date: string;
    pickup_location: string;
    delivery_location: string;
    gap_reason: 'no_capacity' | 'no_suitable_vehicle' | 'price_mismatch' | 'no_carriers_in_area' | 'other';
    gap_details: string;
    recommendations: string[];
}

export interface GapAnalytics {
    total_unmatched_loads: number;
    total_required_capacity_kg: number;
    total_available_capacity_kg: number;
    capacity_utilization_percentage: number;
    gaps_by_reason: Record<string, number>;
    gaps_by_route: Array<{
        route: string;
        count: number;
        total_weight_kg: number;
    }>;
    gaps_by_vehicle_type: Record<string, number>;
    trend_data: Array<{
        date: string;
        unmatched_count: number;
    }>;
}

/**
 * Identify coverage gaps with detailed reasons
 */
export async function getCoverageGaps(brokerId: string): Promise<{ data: CoverageGap[] | null; error: string | null }> {
    const supabase = await createClient();

    try {
        // Get shipper network
        const { data: shipperNetwork } = await supabase
            .from('broker_shipper_network')
            .select('shipper_user_id')
            .eq('broker_user_id', brokerId)
            .eq('relationship_status', 'active');

        const shipperIds = shipperNetwork?.map(s => s.shipper_user_id) || [];

        if (shipperIds.length === 0) {
            return { data: [], error: null };
        }

        // Get unmatched shipments
        const { data: unmatchedShipments, error: shipmentsError } = await supabase
            .from('shipments')
            .select('*')
            .in('shipper_user_id', shipperIds)
            .in('status', ['open_for_bidding', 'bid_awarded'])
            .not('id', 'in', `(
        SELECT shipment_id FROM broker_load_matches 
        WHERE broker_user_id = '${brokerId}' 
        AND match_status IN ('confirmed', 'completed')
      )`);

        if (shipmentsError) throw shipmentsError;

        // Get all available capacity
        const { data: availableCapacity } = await supabase
            .from('broker_carrier_capacity')
            .select('*')
            .eq('broker_user_id', brokerId)
            .eq('is_available', true);

        const gaps: CoverageGap[] = [];

        for (const shipment of unmatchedShipments || []) {
            let gapReason: CoverageGap['gap_reason'] = 'other';
            let gapDetails = '';
            const recommendations: string[] = [];

            // Check for capacity availability
            const hasCapacity = availableCapacity?.some(
                cap => cap.available_weight_kg >= shipment.weight_kg
            );

            if (!hasCapacity) {
                gapReason = 'no_capacity';
                gapDetails = `No carrier has sufficient capacity (${shipment.weight_kg} kg required)`;
                recommendations.push('Add more carriers to your network');
                recommendations.push('Contact existing carriers to increase capacity');
            } else {
                // Check for vehicle type match
                const hasVehicleType = availableCapacity?.some(
                    cap =>
                        cap.available_weight_kg >= shipment.weight_kg &&
                        cap.vehicle_types?.includes(shipment.preferred_vehicle_type)
                );

                if (!hasVehicleType) {
                    gapReason = 'no_suitable_vehicle';
                    gapDetails = `No carrier with ${shipment.preferred_vehicle_type} available`;
                    recommendations.push(`Find carriers with ${shipment.preferred_vehicle_type} vehicles`);
                    recommendations.push('Consider alternative vehicle types');
                } else {
                    // Check for geographic proximity
                    const nearbyCarriers = availableCapacity?.filter(cap => {
                        if (!cap.current_latitude || !shipment.pickup_latitude) return false;

                        // Simple distance calculation (would use proper geo calculation in production)
                        const distance = Math.sqrt(
                            Math.pow(cap.current_latitude - shipment.pickup_latitude, 2) +
                            Math.pow((cap.current_longitude || 0) - (shipment.pickup_longitude || 0), 2)
                        ) * 111; // Rough km conversion

                        return distance < 200; // Within 200km
                    });

                    if (!nearbyCarriers || nearbyCarriers.length === 0) {
                        gapReason = 'no_carriers_in_area';
                        gapDetails = 'No carriers available in pickup area';
                        recommendations.push('Expand carrier network in this region');
                        recommendations.push('Offer higher rates to attract distant carriers');
                    } else {
                        gapReason = 'price_mismatch';
                        gapDetails = 'Carriers available but may need better pricing';
                        recommendations.push('Review commission rates for this route');
                        recommendations.push('Manually reach out to carriers');
                    }
                }
            }

            gaps.push({
                shipment_id: shipment.id,
                shipment_number: shipment.shipment_number,
                weight_kg: shipment.weight_kg,
                preferred_vehicle_type: shipment.preferred_vehicle_type,
                scheduled_pickup_date: shipment.scheduled_pickup_date,
                pickup_location: shipment.pickup_location,
                delivery_location: shipment.delivery_location,
                gap_reason: gapReason,
                gap_details: gapDetails,
                recommendations,
            });
        }

        return { data: gaps, error: null };
    } catch (error: any) {
        console.error('Error identifying coverage gaps:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get gap recommendations based on analysis
 */
export async function getGapRecommendations(brokerId: string) {
    const supabase = await createClient();

    try {
        const { data: gaps } = await getCoverageGaps(brokerId);

        if (!gaps || gaps.length === 0) {
            return {
                data: {
                    overall_health: 'excellent',
                    recommendations: ['Your load matching is performing well!'],
                },
                error: null,
            };
        }

        // Analyze gaps
        const gapsByReason = gaps.reduce((acc, gap) => {
            acc[gap.gap_reason] = (acc[gap.gap_reason] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const recommendations: string[] = [];

        // Generate recommendations based on most common gap reasons
        const sortedReasons = Object.entries(gapsByReason).sort((a, b) => b[1] - a[1]);

        for (const [reason, count] of sortedReasons) {
            if (reason === 'no_capacity') {
                recommendations.push(
                    `${count} loads lack carrier capacity. Consider adding more carriers to your network.`
                );
            } else if (reason === 'no_suitable_vehicle') {
                recommendations.push(
                    `${count} loads need specific vehicle types. Diversify your carrier fleet types.`
                );
            } else if (reason === 'no_carriers_in_area') {
                recommendations.push(
                    `${count} loads are in underserved areas. Expand your carrier network geographically.`
                );
            } else if (reason === 'price_mismatch') {
                recommendations.push(
                    `${count} loads may have pricing issues. Review your commission rates and carrier compensation.`
                );
            }
        }

        const overallHealth =
            gaps.length < 5 ? 'good' :
                gaps.length < 15 ? 'fair' : 'needs_attention';

        return {
            data: {
                overall_health: overallHealth,
                total_gaps: gaps.length,
                gaps_by_reason: gapsByReason,
                recommendations,
            },
            error: null,
        };
    } catch (error: any) {
        console.error('Error generating gap recommendations:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get comprehensive gap analytics
 */
export async function getGapAnalytics(brokerId: string, days: number = 30): Promise<{ data: GapAnalytics | null; error: string | null }> {
    const supabase = await createClient();

    try {
        const { data: gaps } = await getCoverageGaps(brokerId);

        // Get total capacity
        const { data: capacityData } = await supabase
            .from('broker_carrier_capacity')
            .select('available_weight_kg, total_capacity_kg')
            .eq('broker_user_id', brokerId);

        const totalAvailableCapacity = capacityData?.reduce(
            (sum, cap) => sum + (cap.available_weight_kg || 0),
            0
        ) || 0;

        const totalCapacity = capacityData?.reduce(
            (sum, cap) => sum + (cap.total_capacity_kg || 0),
            0
        ) || 0;

        const totalRequiredCapacity = gaps?.reduce(
            (sum, gap) => sum + gap.weight_kg,
            0
        ) || 0;

        // Group gaps by reason
        const gapsByReason = gaps?.reduce((acc, gap) => {
            acc[gap.gap_reason] = (acc[gap.gap_reason] || 0) + 1;
            return acc;
        }, {} as Record<string, number>) || {};

        // Group gaps by route
        const gapsByRoute = gaps?.reduce((acc, gap) => {
            const route = `${gap.pickup_location} → ${gap.delivery_location}`;
            const existing = acc.find(r => r.route === route);
            if (existing) {
                existing.count++;
                existing.total_weight_kg += gap.weight_kg;
            } else {
                acc.push({
                    route,
                    count: 1,
                    total_weight_kg: gap.weight_kg,
                });
            }
            return acc;
        }, [] as Array<{ route: string; count: number; total_weight_kg: number }>) || [];

        // Group gaps by vehicle type
        const gapsByVehicleType = gaps?.reduce((acc, gap) => {
            acc[gap.preferred_vehicle_type] = (acc[gap.preferred_vehicle_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>) || {};

        // Generate trend data (simplified - would use historical data in production)
        const trendData = Array.from({ length: Math.min(days, 30) }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (days - i - 1));
            return {
                date: date.toISOString().split('T')[0],
                unmatched_count: Math.floor(Math.random() * (gaps?.length || 0)), // Mock data
            };
        });

        const analytics: GapAnalytics = {
            total_unmatched_loads: gaps?.length || 0,
            total_required_capacity_kg: totalRequiredCapacity,
            total_available_capacity_kg: totalAvailableCapacity,
            capacity_utilization_percentage: totalCapacity > 0
                ? Math.round(((totalCapacity - totalAvailableCapacity) / totalCapacity) * 100)
                : 0,
            gaps_by_reason: gapsByReason,
            gaps_by_route: gapsByRoute.sort((a, b) => b.count - a.count).slice(0, 10),
            gaps_by_vehicle_type: gapsByVehicleType,
            trend_data: trendData,
        };

        return { data: analytics, error: null };
    } catch (error: any) {
        console.error('Error generating gap analytics:', error);
        return { data: null, error: error.message };
    }
}
