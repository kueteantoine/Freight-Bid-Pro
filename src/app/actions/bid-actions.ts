"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { AutoAcceptRules, BidAnalytics, TransporterProfile, BidBreakdown } from "@/lib/types/database";

/**
 * Award a bid to a transporter
 * - Updates bid status to 'awarded'
 * - Updates shipment status to 'bid_awarded'
 * - Marks all other bids as 'outbid'
 * - Creates bid history entry
 */
export async function awardBid(bidId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Get the bid details
    const { data: bid, error: bidError } = await supabase
        .from("bids")
        .select("*, shipments!inner(shipper_user_id)")
        .eq("id", bidId)
        .single();

    if (bidError) throw bidError;
    if (!bid) throw new Error("Bid not found");

    // Verify the user is the shipper
    if (bid.shipments.shipper_user_id !== user.id) {
        throw new Error("Unauthorized: Only the shipper can award bids");
    }

    // Update the awarded bid
    const { error: updateBidError } = await supabase
        .from("bids")
        .update({ bid_status: "awarded" })
        .eq("id", bidId);

    if (updateBidError) throw updateBidError;

    // Update shipment status
    const { error: updateShipmentError } = await supabase
        .from("shipments")
        .update({ status: "bid_awarded" })
        .eq("id", bid.shipment_id);

    if (updateShipmentError) throw updateShipmentError;

    // Mark all other bids as outbid
    const { error: outbidError } = await supabase
        .from("bids")
        .update({ bid_status: "outbid" })
        .eq("shipment_id", bid.shipment_id)
        .neq("id", bidId)
        .eq("bid_status", "active");

    if (outbidError) throw outbidError;

    revalidatePath("/shipper/bidding");
    revalidatePath("/shipper/shipments");

    return { success: true, bid };
}

/**
 * Reject a bid with optional reason/feedback
 */
export async function rejectBid(bidId: string, reason?: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Get the bid details
    const { data: bid, error: bidError } = await supabase
        .from("bids")
        .select("*, shipments!inner(shipper_user_id)")
        .eq("id", bidId)
        .single();

    if (bidError) throw bidError;
    if (!bid) throw new Error("Bid not found");

    // Verify the user is the shipper
    if (bid.shipments.shipper_user_id !== user.id) {
        throw new Error("Unauthorized: Only the shipper can reject bids");
    }

    // Update the bid status
    const { error: updateError } = await supabase
        .from("bids")
        .update({ bid_status: "rejected" })
        .eq("id", bidId);

    if (updateError) throw updateError;

    // Create history entry with reason
    if (reason) {
        await supabase.from("bid_history").insert({
            bid_id: bidId,
            action_type: "rejected",
            action_by_user_id: user.id,
            notes: reason,
        });
    }

    revalidatePath("/shipper/bidding");

    return { success: true };
}

/**
 * Create a counter-offer for a bid
 */
export async function createCounterOffer(
    bidId: string,
    counterAmount: number,
    message?: string
) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Get the original bid
    const { data: originalBid, error: bidError } = await supabase
        .from("bids")
        .select("*, shipments!inner(shipper_user_id)")
        .eq("id", bidId)
        .single();

    if (bidError) throw bidError;
    if (!originalBid) throw new Error("Bid not found");

    // Verify the user is the shipper
    if (originalBid.shipments.shipper_user_id !== user.id) {
        throw new Error("Unauthorized: Only the shipper can create counter-offers");
    }

    // Create counter-offer bid
    const { data: counterOffer, error: insertError } = await supabase
        .from("bids")
        .insert({
            shipment_id: originalBid.shipment_id,
            transporter_user_id: originalBid.transporter_user_id,
            bid_amount: counterAmount,
            estimated_delivery_date: originalBid.estimated_delivery_date,
            bid_breakdown_json: originalBid.bid_breakdown_json,
            bid_message: message || `Counter-offer from shipper: ${counterAmount} XAF`,
            is_counter_offer: true,
            original_bid_id: bidId,
        })
        .select()
        .single();

    if (insertError) throw insertError;

    revalidatePath("/shipper/bidding");

    return { success: true, counterOffer };
}

/**
 * Get bidding analytics for a shipment
 */
export async function getBidAnalytics(shipmentId: string): Promise<BidAnalytics> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Get all bids for the shipment
    const { data: bids, error: bidsError } = await supabase
        .from("bids")
        .select("bid_amount, bid_submitted_at")
        .eq("shipment_id", shipmentId)
        .eq("bid_status", "active")
        .order("bid_amount", { ascending: true });

    if (bidsError) throw bidsError;

    if (!bids || bids.length === 0) {
        return {
            shipment_id: shipmentId,
            total_bids: 0,
            average_bid: 0,
            lowest_bid: 0,
            highest_bid: 0,
            bid_spread: 0,
            time_to_first_bid_minutes: null,
        };
    }

    const bidAmounts = bids.map((b) => b.bid_amount);
    const lowestBid = Math.min(...bidAmounts);
    const highestBid = Math.max(...bidAmounts);
    const averageBid = bidAmounts.reduce((a, b) => a + b, 0) / bidAmounts.length;
    const bidSpread = highestBid - lowestBid;

    // Calculate time to first bid
    const { data: shipment } = await supabase
        .from("shipments")
        .select("created_at")
        .eq("id", shipmentId)
        .single();

    let timeToFirstBid = null;
    if (shipment && bids[0]) {
        const shipmentCreated = new Date(shipment.created_at);
        const firstBidSubmitted = new Date(bids[0].bid_submitted_at);
        timeToFirstBid = Math.round(
            (firstBidSubmitted.getTime() - shipmentCreated.getTime()) / (1000 * 60)
        );
    }

    return {
        shipment_id: shipmentId,
        total_bids: bids.length,
        average_bid: Math.round(averageBid),
        lowest_bid: lowestBid,
        highest_bid: highestBid,
        bid_spread: bidSpread,
        time_to_first_bid_minutes: timeToFirstBid,
    };
}

/**
 * Get full transporter profile with ratings and fleet info
 */
export async function getTransporterProfile(userId: string): Promise<TransporterProfile> {
    const supabase = await createSupabaseServerClient();

    // Get basic profile
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (profileError) throw profileError;

    // Get transporter role info
    const { data: transporterRole } = await supabase
        .from("user_roles")
        .select("verification_status, role_specific_profile")
        .eq("user_id", userId)
        .eq("role_type", "transporter")
        .single();

    // Get completed shipments count (mock for now - would need shipment_assignments table)
    const completedShipmentsCount = 120; // TODO: Calculate from actual data
    const successRate = 95.5; // TODO: Calculate from actual data

    // Mock ratings (would come from ratings_reviews table)
    const overallRating = 4.8;
    const ratingTimeliness = 4.9;
    const ratingCommunication = 4.7;
    const ratingCondition = 4.8;
    const totalReviews = 87;

    return {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        company_name: transporterRole?.role_specific_profile?.company_name,
        verification_status: transporterRole?.verification_status || "pending",
        completed_shipments_count: completedShipmentsCount,
        success_rate: successRate,
        overall_rating: overallRating,
        rating_timeliness: ratingTimeliness,
        rating_communication: ratingCommunication,
        rating_condition: ratingCondition,
        total_reviews: totalReviews,
        fleet_info: transporterRole?.role_specific_profile?.fleet_info,
        insurance_info: transporterRole?.role_specific_profile?.insurance_info,
    };
}

/**
 * Configure auto-accept rules for a shipment
 */
export async function configureAutoAcceptRules(
    shipmentId: string,
    rules: AutoAcceptRules
) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Update shipment with auto-accept rules
    const { error } = await supabase
        .from("shipments")
        .update({
            auto_accept_enabled: rules.enabled,
            auto_accept_price_threshold: rules.price_threshold,
            auto_accept_min_rating: rules.min_rating,
            auto_accept_max_delivery_days: rules.max_delivery_days,
        })
        .eq("id", shipmentId)
        .eq("shipper_user_id", user.id);

    if (error) throw error;

    revalidatePath("/shipper/bidding");

    return { success: true };
}

/**
 * Evaluate if a bid meets auto-accept criteria and award automatically
 */
export async function evaluateAutoAccept(bidId: string) {
    const supabase = await createSupabaseServerClient();

    // Get bid and shipment details
    const { data: bid, error: bidError } = await supabase
        .from("bids")
        .select("*, shipments!inner(*)")
        .eq("id", bidId)
        .single();

    if (bidError || !bid) return { autoAccepted: false };

    const shipment = bid.shipments;

    // Check if auto-accept is enabled
    if (!shipment.auto_accept_enabled) {
        return { autoAccepted: false };
    }

    // Check price threshold
    if (
        shipment.auto_accept_price_threshold &&
        bid.bid_amount > shipment.auto_accept_price_threshold
    ) {
        return { autoAccepted: false, reason: "Price exceeds threshold" };
    }

    // Check minimum rating (would need to fetch actual rating)
    const transporterProfile = await getTransporterProfile(bid.transporter_user_id);
    if (
        shipment.auto_accept_min_rating &&
        transporterProfile.overall_rating < shipment.auto_accept_min_rating
    ) {
        return { autoAccepted: false, reason: "Rating below minimum" };
    }

    // Check delivery time
    if (
        shipment.auto_accept_max_delivery_days &&
        bid.estimated_delivery_date
    ) {
        const deliveryDate = new Date(bid.estimated_delivery_date);
        const pickupDate = new Date(shipment.scheduled_pickup_date);
        const daysDiff = Math.ceil(
            (deliveryDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff > shipment.auto_accept_max_delivery_days) {
            return { autoAccepted: false, reason: "Delivery time too long" };
        }
    }

    // All criteria met - award the bid
    await awardBid(bidId);

    return { autoAccepted: true };
}

/**
 * Submit a bid for a shipment
 */
export async function submitBid(
    shipmentId: string,
    amount: number,
    breakdown: BidBreakdown,
    autoBid: { enabled: boolean; limit: number | null }
) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // 1. Fetch shipment details to validate status and expiry
    const { data: shipment, error: shipmentError } = await supabase
        .from("shipments")
        .select("status, bid_expires_at, shipment_number")
        .eq("id", shipmentId)
        .single();

    if (shipmentError || !shipment) throw new Error("Shipment not found");

    if (shipment.status !== 'open_for_bidding') {
        throw new Error(`Shipment ${shipment.shipment_number || ''} is not open for bidding (Status: ${shipment.status})`);
    }

    if (shipment.bid_expires_at && new Date(shipment.bid_expires_at) < new Date()) {
        throw new Error("This auction has already expired.");
    }

    // 2. Fetch current lowest bid for increment validation
    const { data: lowestBidData } = await supabase
        .from("bids")
        .select("bid_amount")
        .eq("shipment_id", shipmentId)
        .eq("bid_status", "active")
        .order("bid_amount", { ascending: true })
        .limit(1)
        .single();

    const minIncrement = 1000;
    if (lowestBidData && amount > (lowestBidData.bid_amount - minIncrement)) {
        throw new Error(`Bid must be at least ${minIncrement.toLocaleString()} XAF lower than the current lowest bid (${lowestBidData.bid_amount.toLocaleString()} XAF).`);
    }

    // 3. Insert the bid
    const { data: bid, error: insertError } = await supabase
        .from("bids")
        .insert({
            shipment_id: shipmentId,
            transporter_user_id: user.id,
            bid_amount: amount,
            bid_breakdown_json: breakdown,
            auto_bid_enabled: autoBid.enabled,
            max_auto_bid_amount: autoBid.limit,
            bid_status: "active",
        })
        .select()
        .single();

    if (insertError) {
        if (insertError.message.includes('expired')) throw new Error("This auction has already expired.");
        if (insertError.message.includes('increment')) throw new Error(insertError.message);
        throw insertError;
    }

    // 4. Evaluate auto-accept
    await evaluateAutoAccept(bid.id);

    // 5. Revalidate paths
    revalidatePath("/transporter/loads");
    revalidatePath("/shipper/bidding");
    revalidatePath(`/shipper/bidding/${shipmentId}`);
    revalidatePath(`/transporter/loads/${shipmentId}`);

    return { success: true, bid };
}

/**
 * Get active bids for the current transporter
 */
export async function getCarrierActiveBids() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: bids, error } = await supabase
        .from("bids")
        .select(`
            *,
            shipments!inner(
                shipment_number,
                pickup_location,
                delivery_location,
                status,
                bid_expires_at
            )
        `)
        .eq("transporter_user_id", user.id)
        .in("bid_status", ["active", "outbid"])
        .order("created_at", { ascending: false });

    if (error) throw error;

    return bids;
}
