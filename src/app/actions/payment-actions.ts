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
    customerPhone: string; // Added for Mobile Money
    customerEmail: string; // Added for receipt/notification
    currency?: string; // Optional, defaults to XAF
}

import { FlutterwaveProvider } from "@/lib/services/payments/flutterwave-provider";
import crypto from 'crypto';

// Initialize provider (In a real app, strict config loading is needed)
const paymentProvider = new FlutterwaveProvider({
    publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY!,
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY!,
    encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY!,
    isTest: process.env.NODE_ENV !== "production",
    webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET!
});

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

    // 2. Get Transporter's Subaccount ID for Split Payment
    const { data: transporterProfile } = await supabase
        .from("profiles")
        .select("payment_subaccount_id")
        .eq("id", bid.transporter_user_id)
        .single();

    if (!transporterProfile?.payment_subaccount_id) {
        throw new Error("Transporter does not have a linked payment subaccount. Cannot process split payment.");
    }

    // 3. Initiate Payment with Flutterwave
    const netToTransporter = bid.bid_amount; // Transporter gets the bid amount
    // Platform fees = details.platformCommission + details.aggregatorFee + details.mobileMoneyFee
    // Wait, totalPayable = bid_amount + fees.

    // Splits:
    // We want the transporter to receive `netToTransporter`.
    // The rest goes to the main account (Platform).

    // Note: Flutterwave subaccount transaction_charge_type='flat_subaccount' means 
    // the subaccount receives (Amount - Fees). 
    // If we use 'flat', the main account bears fees.

    // Let's assume we want to give the transporter an exact amount.
    // If we can't control it exactly via ratio, we might need a different flow or precise calculation.
    // For this implementation, we use ratio based on total payable.

    const transporterShareRatio = netToTransporter / details.totalPayable;
    const transactionId = crypto.randomUUID();

    const initiationResult = await paymentProvider.initiatePayment({
        reference: transactionId,
        amount: details.totalPayable,
        currency: details.currency || "XAF",
        description: `Shipment Payment: ${bid.shipments.shipment_number}`,
        customerEmail: details.customerEmail,
        customerPhone: details.customerPhone,
        metadata: {
            bid_id: details.bidId,
            shipment_id: bid.shipment_id,
            payer_user_id: user.id
        },
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shipper/payments/callback`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shipper/payments/cancel`,
        splits: [
            {
                accountId: transporterProfile.payment_subaccount_id,
                percentage: transporterShareRatio // Provider handles * 100 logic or uses it as ratio
            }
        ]
    });

    if (!initiationResult.success) {
        throw new Error(initiationResult.error || "Payment initiation failed");
    }

    // 4. Create the transaction record (Pending)
    const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert({
            id: transactionId, // Explicit ID linking to payment reference
            transaction_type: "shipment_payment",
            shipment_id: bid.shipment_id,
            payer_user_id: user.id,
            payee_user_id: bid.transporter_user_id,
            gross_amount: details.grossAmount,
            platform_commission_amount: details.platformCommission,
            platform_commission_percentage: 5.0,
            aggregator_fee_amount: details.aggregatorFee,
            aggregator_fee_percentage: 1.4,
            mobile_money_fee_amount: details.mobileMoneyFee,
            mobile_money_fee_percentage: 0.0,
            total_deductions: details.platformCommission + details.aggregatorFee + details.mobileMoneyFee,
            net_amount: netToTransporter,
            currency: details.currency || "XAF",
            payment_method: details.paymentMethod as any, // Cast to enum
            payment_status: "pending", // Pending until webhook
            aggregator_transaction_id: initiationResult.aggregatorTransactionId || transactionId, // Use remote ID if available, else our reference (as fallback placeholder)
            payment_initiated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (txError) throw txError;

    // 5. Generate Invoice (Pending Payment)
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await supabase
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

    // Remove immediate award logic - wait for webhook

    return {
        success: true,
        transactionId: transaction.id,
        invoiceNumber,
        redirectUrl: initiationResult.redirectUrl,
        instructions: initiationResult.instructions
    };
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
