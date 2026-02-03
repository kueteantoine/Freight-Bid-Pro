"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TransactionFilters = {
    startDate?: string;
    endDate?: string;
    status?: string | null;
    searchTerm?: string;
    page?: number;
    pageSize?: number;
};

export type ExpenseData = {
    expense_date: string;
    category: string;
    amount: number;
    description?: string;
    receipt_url?: string;
};

export type ExpenseFilters = {
    startDate?: string;
    endDate?: string;
    category?: string | null;
};

// --- Financial Stats ---

export async function getCarrierFinancialStats() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Fetch wallet data
    const { data: walletData, error: walletError } = await supabase
        .from("transporter_wallets")
        .select("*")
        .eq("user_id", user.id)
        .eq("role_type", "transporter")
        .single();

    if (walletError && walletError.code !== 'PGRST116') { // Ignore not found error
        console.error("Error fetching wallet:", walletError);
    }

    const { data: pendingTx, error: pendingError } = await supabase
        .from("transactions")
        .select("net_amount", { count: 'exact' })
        .eq("payee_user_id", user.id)
        .eq("payment_status", "pending");

    const pendingAmount = pendingTx?.reduce((sum, tx) => sum + Number(tx.net_amount), 0) || 0;

    return {
        gross_earnings: Number(walletData?.gross_earnings || 0),
        net_earnings: Number(walletData?.net_earnings || 0),
        pending_payments: pendingAmount, // Calculated from pending transactions or wallet pending_amount if available
        total_commissions: Number(walletData?.total_commissions_paid || 0),
        total_aggregator_fees: Number(walletData?.total_aggregator_fees_paid || 0),
        total_mobile_fees: Number(walletData?.total_mobile_money_fees_paid || 0),
        balance: Number(walletData?.net_earnings || 0) // Simplified for now
    };
}

// --- Transactions ---

export async function getTransactions(filters: TransactionFilters = {}) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    let query = supabase
        .from("transactions")
        .select(`
            *,
            shipments (
                shipment_number,
                pickup_location,
                delivery_location
            )
        `, { count: 'exact' })
        .eq("payee_user_id", user.id) // As a carrier receiving payment
        .order("created_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
        query = query.eq("payment_status", filters.status);
    }

    if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
    }

    if (filters.endDate) {
        query = query.lte("created_at", filters.endDate);
    }

    // Simple pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    return { data, count };
}

export async function getTransactionDetails(transactionId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("transactions")
        .select(`
            *,
            shipments (
                *
            ),
            invoices (*)
        `)
        .eq("id", transactionId)
        .eq("payee_user_id", user.id)
        .single();

    if (error) throw error;
    return data;
}

// --- Expenses ---

export async function logExpense(expenseData: ExpenseData) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase.from("carrier_expenses").insert({
        user_id: user.id,
        ...expenseData
    }).select().single();

    if (error) throw error;

    revalidatePath("/carrier/finance");
    return data;
}

export async function getExpenses(filters: ExpenseFilters = {}) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    let query = supabase
        .from("carrier_expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("expense_date", { ascending: false });

    if (filters.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
    }

    if (filters.startDate) {
        query = query.gte("expense_date", filters.startDate);
    }

    if (filters.endDate) {
        query = query.lte("expense_date", filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function deleteExpense(expenseId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("carrier_expenses")
        .delete()
        .eq("id", expenseId)
        .eq("user_id", user.id);

    if (error) throw error;
    revalidatePath("/carrier/finance");
}

// --- Utilities ---

export async function calculateFees(bidAmount: number) {
    // These should ideally come from platform_settings table
    const PLATFORM_COMMISSION_PCT = 5.0;
    const AGGREGATOR_FEE_PCT = 1.5;
    const MOBILE_MONEY_FEE_PCT = 1.0;

    const commission = (bidAmount * PLATFORM_COMMISSION_PCT) / 100;
    const aggFee = (bidAmount * AGGREGATOR_FEE_PCT) / 100;
    const momoFee = (bidAmount * MOBILE_MONEY_FEE_PCT) / 100;

    const totalDeductions = commission + aggFee + momoFee;
    const netEarnings = bidAmount - totalDeductions;

    return {
        bidAmount,
        commission,
        aggFee,
        momoFee,
        totalDeductions,
        netEarnings,
        breakdown: {
            commissionPct: PLATFORM_COMMISSION_PCT,
            aggFeePct: AGGREGATOR_FEE_PCT,
            momoFeePct: MOBILE_MONEY_FEE_PCT
        }
    };
}
