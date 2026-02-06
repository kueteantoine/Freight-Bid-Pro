"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Broker Network Management Server Actions
 * Handles broker network operations, metrics, and relationship management
 */

// Types
export interface ShipperNetworkPartner {
    id: string;
    broker_user_id: string;
    shipper_user_id: string;
    relationship_status: "active" | "inactive" | "suspended";
    commission_rate: number;
    total_shipments_brokered: number;
    total_revenue_generated: number;
    contract_details: Record<string, any>;
    notes: string | null;
    created_at: string;
    updated_at: string;
    shipper_profile?: {
        email: string;
        company_name?: string;
    };
}

export interface CarrierNetworkPartner {
    id: string;
    broker_user_id: string;
    carrier_user_id: string;
    relationship_status: "active" | "inactive" | "suspended";
    reliability_rating: number | null;
    total_shipments_assigned: number;
    performance_metrics: {
        on_time_rate: number;
        completion_rate: number;
        average_rating: number;
    };
    service_areas: string[];
    notes: string | null;
    created_at: string;
    updated_at: string;
    carrier_profile?: {
        email: string;
        company_name?: string;
    };
}

export interface BrokerInteraction {
    id: string;
    broker_user_id: string;
    partner_user_id: string;
    partner_type: "shipper" | "carrier";
    interaction_type: "call" | "meeting" | "email" | "contract_signed" | "issue_resolved" | "other";
    interaction_date: string;
    notes: string | null;
    created_at: string;
}

export interface BrokerDashboardMetrics {
    active_shipments_as_shipper: number;
    active_shipments_as_carrier: number;
    total_commission_earned: number;
    network_size: {
        shipper_count: number;
        carrier_count: number;
        total: number;
    };
    recent_transactions: Array<{
        id: string;
        type: string;
        amount: number;
        date: string;
    }>;
}

/**
 * Get all shipper clients in broker's network
 */
export async function getShipperNetwork(): Promise<{ data: ShipperNetworkPartner[] | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { data: null, error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("broker_shipper_network")
            .select(`
        *,
        shipper_profile:profiles!shipper_user_id(email),
        shipper_role:user_roles!shipper_user_id(role_specific_profile)
      `)
            .eq("broker_user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching shipper network:", error);
            return { data: null, error: error.message };
        }

        // Transform data to include company name from role_specific_profile
        const transformedData = data?.map((partner: any) => ({
            ...partner,
            shipper_profile: {
                email: partner.shipper_profile?.email,
                company_name: partner.shipper_role?.[0]?.role_specific_profile?.company_name,
            },
        }));

        return { data: transformedData || [], error: null };
    } catch (error: any) {
        console.error("Error in getShipperNetwork:", error);
        return { data: null, error: error.message };
    }
}

/**
 * Get all carrier partners in broker's network
 */
export async function getCarrierNetwork(): Promise<{ data: CarrierNetworkPartner[] | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { data: null, error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("broker_carrier_network")
            .select(`
        *,
        carrier_profile:profiles!carrier_user_id(email),
        carrier_role:user_roles!carrier_user_id(role_specific_profile)
      `)
            .eq("broker_user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching carrier network:", error);
            return { data: null, error: error.message };
        }

        // Transform data to include company name from role_specific_profile
        const transformedData = data?.map((partner: any) => ({
            ...partner,
            carrier_profile: {
                email: partner.carrier_profile?.email,
                company_name: partner.carrier_role?.[0]?.role_specific_profile?.company_name,
            },
        }));

        return { data: transformedData || [], error: null };
    } catch (error: any) {
        console.error("Error in getCarrierNetwork:", error);
        return { data: null, error: error.message };
    }
}

/**
 * Add a new shipper to broker's network
 */
export async function addShipperToNetwork(
    shipperId: string,
    commissionRate: number,
    contractDetails: Record<string, any> = {}
): Promise<{ data: ShipperNetworkPartner | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { data: null, error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("broker_shipper_network")
            .insert({
                broker_user_id: user.id,
                shipper_user_id: shipperId,
                commission_rate: commissionRate,
                contract_details: contractDetails,
                relationship_status: "active",
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding shipper to network:", error);
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (error: any) {
        console.error("Error in addShipperToNetwork:", error);
        return { data: null, error: error.message };
    }
}

/**
 * Add a new carrier to broker's network
 */
export async function addCarrierToNetwork(
    carrierId: string,
    serviceAreas: string[] = [],
    notes: string = ""
): Promise<{ data: CarrierNetworkPartner | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { data: null, error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("broker_carrier_network")
            .insert({
                broker_user_id: user.id,
                carrier_user_id: carrierId,
                service_areas: serviceAreas,
                notes,
                relationship_status: "active",
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding carrier to network:", error);
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (error: any) {
        console.error("Error in addCarrierToNetwork:", error);
        return { data: null, error: error.message };
    }
}

/**
 * Update partner rating and notes
 */
export async function updatePartnerRating(
    partnerId: string,
    partnerType: "shipper" | "carrier",
    rating?: number,
    notes?: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: "Unauthorized" };
        }

        const table = partnerType === "shipper" ? "broker_shipper_network" : "broker_carrier_network";
        const updateData: any = {};

        if (notes !== undefined) updateData.notes = notes;
        if (rating !== undefined && partnerType === "carrier") {
            updateData.reliability_rating = rating;
        }

        const { error } = await supabase
            .from(table)
            .update(updateData)
            .eq("id", partnerId)
            .eq("broker_user_id", user.id);

        if (error) {
            console.error("Error updating partner:", error);
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (error: any) {
        console.error("Error in updatePartnerRating:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Remove partner from network (set to inactive)
 */
export async function removeFromNetwork(
    partnerId: string,
    partnerType: "shipper" | "carrier"
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: "Unauthorized" };
        }

        const table = partnerType === "shipper" ? "broker_shipper_network" : "broker_carrier_network";

        const { error } = await supabase
            .from(table)
            .update({ relationship_status: "inactive" })
            .eq("id", partnerId)
            .eq("broker_user_id", user.id);

        if (error) {
            console.error("Error removing partner:", error);
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (error: any) {
        console.error("Error in removeFromNetwork:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get broker dashboard metrics
 */
export async function getBrokerDashboardMetrics(): Promise<{ data: BrokerDashboardMetrics | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { data: null, error: "Unauthorized" };
        }

        // Get active shipments as shipper
        const { count: shipperShipments } = await supabase
            .from("shipments")
            .select("*", { count: "exact", head: true })
            .eq("shipper_user_id", user.id)
            .in("status", ["open_for_bidding", "bid_awarded", "in_transit"]);

        // Get network sizes
        const { count: shipperCount } = await supabase
            .from("broker_shipper_network")
            .select("*", { count: "exact", head: true })
            .eq("broker_user_id", user.id)
            .eq("relationship_status", "active");

        const { count: carrierCount } = await supabase
            .from("broker_carrier_network")
            .select("*", { count: "exact", head: true })
            .eq("broker_user_id", user.id)
            .eq("relationship_status", "active");

        // Get total commission earned (from transporter_wallets)
        const { data: walletData } = await supabase
            .from("transporter_wallets")
            .select("net_earnings")
            .eq("user_id", user.id)
            .eq("role_type", "broker")
            .single();

        // Get recent transactions
        const { data: transactions } = await supabase
            .from("transactions")
            .select("id, transaction_type, net_amount, created_at")
            .or(`payer_user_id.eq.${user.id},payee_user_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .limit(5);

        const metrics: BrokerDashboardMetrics = {
            active_shipments_as_shipper: shipperShipments || 0,
            active_shipments_as_carrier: 0, // TODO: Calculate from bids
            total_commission_earned: walletData?.net_earnings || 0,
            network_size: {
                shipper_count: shipperCount || 0,
                carrier_count: carrierCount || 0,
                total: (shipperCount || 0) + (carrierCount || 0),
            },
            recent_transactions: transactions?.map(t => ({
                id: t.id,
                type: t.transaction_type,
                amount: t.net_amount,
                date: t.created_at,
            })) || [],
        };

        return { data: metrics, error: null };
    } catch (error: any) {
        console.error("Error in getBrokerDashboardMetrics:", error);
        return { data: null, error: error.message };
    }
}

/**
 * Log an interaction with a partner
 */
export async function logInteraction(
    partnerId: string,
    partnerType: "shipper" | "carrier",
    interactionType: "call" | "meeting" | "email" | "contract_signed" | "issue_resolved" | "other",
    notes: string = ""
): Promise<{ data: BrokerInteraction | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { data: null, error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("broker_interactions")
            .insert({
                broker_user_id: user.id,
                partner_user_id: partnerId,
                partner_type: partnerType,
                interaction_type: interactionType,
                notes,
            })
            .select()
            .single();

        if (error) {
            console.error("Error logging interaction:", error);
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (error: any) {
        console.error("Error in logInteraction:", error);
        return { data: null, error: error.message };
    }
}

/**
 * Get interaction history for a partner
 */
export async function getInteractionHistory(partnerId: string): Promise<{ data: BrokerInteraction[] | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { data: null, error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("broker_interactions")
            .select("*")
            .eq("broker_user_id", user.id)
            .eq("partner_user_id", partnerId)
            .order("interaction_date", { ascending: false });

        if (error) {
            console.error("Error fetching interaction history:", error);
            return { data: null, error: error.message };
        }

        return { data: data || [], error: null };
    } catch (error: any) {
        console.error("Error in getInteractionHistory:", error);
        return { data: null, error: error.message };
    }
}
