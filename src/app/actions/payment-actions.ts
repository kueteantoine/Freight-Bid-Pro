"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface PaymentDetails {
    bidId: string;
    paymentMethod: string;
    grossAmount: number;
    platformCommission: number;
    aggregatorFee: number;
    mobileMoneyFee: number;
    totalPayable: number;
}

/**
 * Handle payment processing and bid awarding
 */
export async function processPayment(details: PaymentDetails) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // 1. Get bid and shipment details
    const { data: bid, error: bidError } = await supabase
        .from("bids")
        .select("*, shipments!inner(shipper_user_id, shipment_number)")
        .eq("id", details.bidId)
        .single();

    if (bidError || !bid) throw new Error("Bid not found");

    // 2. Create the transaction record
    const netAmount = details.grossAmount - (details.platformCommission + details.aggregatorFee + details.mobileMoneyFee);

    // Note: Net amount to transporter is bid amount minus platform fees 
    // but the shipper pays totalPayable (bid + all fees).
    // Prompt 17 says: "displays after bid award showing total amount breakdown (base bid amount, insurance costs if applicable, platform commission, aggregator fees, mobile money fees, total payable amount)"
    // And "updates shipment status upon successful payment"

    const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert({
            transaction_type: "shipment_payment",
            shipment_id: bid.shipment_id,
            payer_user_id: user.id,
            payee_user_id: bid.transporter_user_id,
            gross_amount: details.grossAmount,
            platform_commission_amount: details.platformCommission,
            platform_commission_percentage: 5.0, // Hardcoded for now
            aggregator_fee_amount: details.aggregatorFee,
            aggregator_fee_percentage: 1.0,
            mobile_money_fee_amount: details.mobileMoneyFee,
            mobile_money_fee_percentage: 1.0,
            total_deductions: details.platformCommission + details.aggregatorFee + details.mobileMoneyFee,
            net_amount: bid.bid_amount, // The amount the transporter expect is the bid_amount
            currency: "XAF",
            payment_method: details.paymentMethod,
            payment_status: "completed", // Mocking immediate completion
            payment_completed_at: new Date().toISOString(),
            aggregator_transaction_id: `MOCK_TX_${Date.now()}`
        })
        .select()
        .single();

    if (txError) throw txError;

    // 3. Generate Invoice
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { error: invError } = await supabase
        .from("invoices")
        .insert({
            transaction_id: transaction.id,
            invoice_number: invoiceNumber,
            invoice_type: "payment",
            issued_to_user_id: user.id,
            invoice_data_json: {
                shipment_number: bid.shipments.shipment_number,
                bid_amount: bid.bid_amount,
                breakdown: {
                    platform_commission: details.platformCommission,
                    aggregator_fee: details.aggregatorFee,
                    mobile_money_fee: details.mobileMoneyFee,
                },
                total_paid: details.totalPayable
            },
            issued_at: new Date().toISOString()
        });

    if (invError) throw invError;

    // 4. Update statuses (Award the bid)
    // Update awarded bid
    await supabase
        .from("bids")
        .update({ bid_status: "awarded" })
        .eq("id", details.bidId);

    // Update shipment status
    await supabase
        .from("shipments")
        .update({ status: "bid_awarded" })
        .eq("id", bid.shipment_id);

    // Mark others as outbid
    await supabase
        .from("bids")
        .update({ bid_status: "outbid" })
        .eq("shipment_id", bid.shipment_id)
        .neq("id", details.bidId)
        .eq("bid_status", "active");

    revalidatePath("/shipper/bidding");
    revalidatePath("/shipper/shipments");
    revalidatePath("/transporter/payments");

    return { success: true, transactionId: transaction.id, invoiceNumber };
}

/**
 * Fetch transaction history for the current user
 */
export async function getTransactionHistory() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("transactions")
        .select("*, shipments(shipment_number, pickup_location, delivery_location)")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Request a refund for a transaction
 */
export async function requestRefund(transactionId: string, reason: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: tx } = await supabase
        .from("transactions")
        .select("shipment_id")
        .eq("id", transactionId)
        .single();

    if (!tx) throw new Error("Transaction not found");

    const { error } = await supabase
        .from("refund_requests")
        .insert({
            transaction_id: transactionId,
            shipment_id: tx.shipment_id,
            requested_by_user_id: user.id,
            refund_type: "full",
            refund_reason: reason,
            refund_status: "pending"
        });

    if (error) throw error;
    return { success: true };
}

/**
 * Fetch detailed information for a specific invoice
 */
export async function getInvoiceDetail(invoiceId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: invoice, error } = await supabase
        .from("invoices")
        .select(`
            *,
            transactions!inner (
                *,
                shipments (
                    shipment_number,
                    pickup_location,
                    delivery_location,
                    scheduled_pickup_date,
                    scheduled_delivery_date,
                    shipment_items_json
                ),
                payer:payer_user_id (
                    first_name,
                    last_name,
                    email,
                    profiles (*)
                ),
                payee:payee_user_id (
                    first_name,
                    last_name,
                    email,
                    profiles (*)
                )
            )
        `)
        .eq("id", invoiceId)
        .single();

    if (error) throw error;

    // Check if the user is authorized to see this invoice
    if (invoice.issued_to_user_id !== user.id && invoice.transactions.payee_user_id !== user.id) {
        throw new Error("Unauthorized access to invoice");
    }

    return invoice;
}
