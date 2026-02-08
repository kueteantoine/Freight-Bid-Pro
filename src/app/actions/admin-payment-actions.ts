"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// =====================================================
// PAYMENT AGGREGATOR CONFIGURATION
// =====================================================

export async function getPaymentAggregatorConfigs() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("payment_aggregator_configs")
        .select("*")
        .order("display_name", { ascending: true });

    if (error) throw error;
    return data;
}

export async function updatePaymentAggregatorConfig(
    aggregatorId: string,
    updates: {
        is_active?: boolean;
        api_base_url?: string;
        default_commission_percentage?: number;
        default_aggregator_fee_percentage?: number;
        default_mobile_money_fee_percentage?: number;
    }
) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("payment_aggregator_configs")
        .update(updates)
        .eq("id", aggregatorId)
        .select()
        .single();

    if (error) throw error;

    revalidatePath("/admin/payments");
    return data;
}

export async function testAggregatorConnection(aggregatorId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Mock connection test - in production, this would call the aggregator API
    const success = Math.random() > 0.2; // 80% success rate for demo

    const { data, error } = await supabase
        .from("payment_aggregator_configs")
        .update({
            connection_status: success ? "connected" : "error",
            last_connection_test: new Date().toISOString(),
            connection_error_message: success ? null : "Connection timeout - please check API credentials"
        })
        .eq("id", aggregatorId)
        .select()
        .single();

    if (error) throw error;

    revalidatePath("/admin/payments");
    return { success, data };
}


// =====================================================
// PAYMENT MONITORING
// =====================================================

export async function getPaymentFlowStats(dateRange?: { start: string; end: string }) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const startDate = dateRange?.start || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const endDate = dateRange?.end || new Date().toISOString();

    const { data, error } = await supabase.rpc("get_payment_flow_stats", {
        start_date: startDate,
        end_date: endDate
    });

    if (error) throw error;
    return data;
}

export async function getRecentTransactions(filters?: {
    limit?: number;
    status?: string;
}) {
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
            ),
            payer:payer_user_id (email),
            payee:payee_user_id (email)
        `)
        .order("created_at", { ascending: false })
        .limit(filters?.limit || 50);

    if (filters?.status && filters.status !== "all") {
        query = query.eq("payment_status", filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

export async function getPaymentSuccessRate(period: "24h" | "7d" | "30d" = "24h") {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const intervals = {
        "24h": 1,
        "7d": 7,
        "30d": 30
    };

    const startDate = new Date(Date.now() - intervals[period] * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase.rpc("get_payment_flow_stats", {
        start_date: startDate,
        end_date: new Date().toISOString()
    });

    if (error) throw error;
    return data;
}


// =====================================================
// TRANSACTION MANAGEMENT
// =====================================================

export async function getTransactionDetailsAdmin(transactionId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase.rpc("get_transaction_details_admin", {
        transaction_id_param: transactionId
    });

    if (error) throw error;
    return data;
}

export async function searchTransactions(criteria: {
    searchTerm?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    minAmount?: number;
    maxAmount?: number;
    page?: number;
    pageSize?: number;
}) {
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
            ),
            payer:payer_user_id (email),
            payee:payee_user_id (email)
        `, { count: 'exact' })
        .order("created_at", { ascending: false });

    if (criteria.status && criteria.status !== "all") {
        query = query.eq("payment_status", criteria.status);
    }

    if (criteria.startDate) {
        query = query.gte("created_at", criteria.startDate);
    }

    if (criteria.endDate) {
        query = query.lte("created_at", criteria.endDate);
    }

    if (criteria.minAmount !== undefined) {
        query = query.gte("gross_amount", criteria.minAmount);
    }

    if (criteria.maxAmount !== undefined) {
        query = query.lte("gross_amount", criteria.maxAmount);
    }

    // Pagination
    const page = criteria.page || 1;
    const pageSize = criteria.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;
    return { data, count };
}


// =====================================================
// RECONCILIATION
// =====================================================

export async function uploadReconciliationReport(formData: FormData) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const file = formData.get("file") as File;
    const reportName = formData.get("reportName") as string;
    const aggregatorName = formData.get("aggregatorName") as string;
    const periodStart = formData.get("periodStart") as string;
    const periodEnd = formData.get("periodEnd") as string;

    if (!file) throw new Error("No file provided");

    // Upload file to Supabase Storage
    const fileName = `reconciliation/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

    // Create reconciliation report
    const { data: reportId, error: reportError } = await supabase.rpc("create_reconciliation_report", {
        report_name_param: reportName,
        aggregator_name_param: aggregatorName,
        period_start_param: periodStart,
        period_end_param: periodEnd,
        file_url_param: publicUrl
    });

    if (reportError) throw reportError;

    revalidatePath("/admin/payments/reconciliation");
    return { reportId, fileUrl: publicUrl };
}

export async function runReconciliation(reportId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Mock reconciliation process - in production, this would parse the uploaded file
    // and compare with platform transactions

    // Update report status to in_progress
    await supabase
        .from("reconciliation_reports")
        .update({ reconciliation_status: "in_progress" })
        .eq("id", reportId);

    // Simulate finding some discrepancies
    const mockDiscrepancies = [
        {
            report_id: reportId,
            discrepancy_type: "amount_mismatch",
            aggregator_transaction_id: `AGG_${Date.now()}`,
            platform_amount: 10000,
            aggregator_amount: 9500,
            amount_difference: 500,
            platform_status: "completed",
            aggregator_status: "completed",
            discrepancy_details: { note: "Fee calculation mismatch" }
        }
    ];

    // Insert discrepancies
    const { error: discError } = await supabase
        .from("reconciliation_discrepancies")
        .insert(mockDiscrepancies);

    if (discError) throw discError;

    // Update report with results
    const { error: updateError } = await supabase
        .from("reconciliation_reports")
        .update({
            reconciliation_status: "completed",
            total_discrepancies: mockDiscrepancies.length,
            processed_at: new Date().toISOString()
        })
        .eq("id", reportId);

    if (updateError) throw updateError;

    revalidatePath("/admin/payments/reconciliation");
    return { success: true, discrepanciesFound: mockDiscrepancies.length };
}

export async function getReconciliationReports() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("reconciliation_reports")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function getReconciliationDiscrepancies(reportId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase.rpc("get_reconciliation_discrepancies", {
        report_id_param: reportId
    });

    if (error) throw error;
    return data;
}

export async function resolveDiscrepancy(
    discrepancyId: string,
    resolution: { status: string; notes: string }
) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("reconciliation_discrepancies")
        .update({
            resolution_status: resolution.status,
            resolution_notes: resolution.notes,
            resolved_by_admin_id: user.id,
            resolved_at: new Date().toISOString()
        })
        .eq("id", discrepancyId)
        .select()
        .single();

    if (error) throw error;

    revalidatePath("/admin/payments/reconciliation");
    return data;
}


// =====================================================
// FINANCIAL REPORTING
// =====================================================

export async function getPlatformRevenueSummary(dateRange?: { start: string; end: string }) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = dateRange?.end || new Date().toISOString();

    const { data, error } = await supabase.rpc("get_platform_financial_summary", {
        start_date: startDate,
        end_date: endDate
    });

    if (error) throw error;
    return data;
}

export async function getRevenueByRoute(dateRange?: { start: string; end: string }) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = dateRange?.end || new Date().toISOString();

    const { data, error } = await supabase
        .from("transactions")
        .select(`
            platform_commission_amount,
            aggregator_fee_amount,
            mobile_money_fee_amount,
            shipments (
                pickup_location,
                delivery_location
            )
        `)
        .eq("payment_status", "completed")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

    if (error) throw error;

    // Group by route
    const routeRevenue = data.reduce((acc: Record<string, any>, tx: any) => {
        if (!tx.shipments) return acc;

        const route = `${tx.shipments.pickup_location} → ${tx.shipments.delivery_location}`;
        if (!acc[route]) {
            acc[route] = {
                route,
                commission: 0,
                aggregatorFees: 0,
                mobileMoneyFees: 0,
                totalRevenue: 0,
                transactionCount: 0
            };
        }

        acc[route].commission += Number(tx.platform_commission_amount || 0);
        acc[route].aggregatorFees += Number(tx.aggregator_fee_amount || 0);
        acc[route].mobileMoneyFees += Number(tx.mobile_money_fee_amount || 0);
        acc[route].totalRevenue += Number(tx.platform_commission_amount || 0) +
            Number(tx.aggregator_fee_amount || 0) +
            Number(tx.mobile_money_fee_amount || 0);
        acc[route].transactionCount += 1;

        return acc;
    }, {});

    return Object.values(routeRevenue) as {
        route: string;
        commission: number;
        aggregatorFees: number;
        mobileMoneyFees: number;
        totalRevenue: number;
        transactionCount: number;
    }[];
}

export async function getFeeCollectionBreakdown(dateRange?: { start: string; end: string }) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = dateRange?.end || new Date().toISOString();

    const { data, error } = await supabase
        .from("transactions")
        .select("platform_commission_amount, aggregator_fee_amount, mobile_money_fee_amount, payment_method")
        .eq("payment_status", "completed")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

    if (error) throw error;

    // Calculate totals
    const totals = data.reduce((acc: any, tx: any) => {
        acc.totalCommission += Number(tx.platform_commission_amount || 0);
        acc.totalAggregatorFees += Number(tx.aggregator_fee_amount || 0);
        acc.totalMobileMoneyFees += Number(tx.mobile_money_fee_amount || 0);
        return acc;
    }, { totalCommission: 0, totalAggregatorFees: 0, totalMobileMoneyFees: 0 });

    // Group by payment method
    const byPaymentMethod = data.reduce((acc: any, tx: any) => {
        const method = tx.payment_method || "unknown";
        if (!acc[method]) {
            acc[method] = { commission: 0, aggregatorFees: 0, mobileMoneyFees: 0, count: 0 };
        }
        acc[method].commission += Number(tx.platform_commission_amount || 0);
        acc[method].aggregatorFees += Number(tx.aggregator_fee_amount || 0);
        acc[method].mobileMoneyFees += Number(tx.mobile_money_fee_amount || 0);
        acc[method].count += 1;
        return acc;
    }, {});

    return {
        totals,
        byPaymentMethod
    };
}

export async function exportFinancialReport(
    reportType: "revenue" | "fees" | "transactions",
    dateRange: { start: string; end: string }
) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // This would generate a CSV or PDF in production
    // For now, return the data that would be exported

    if (reportType === "revenue") {
        return await getPlatformRevenueSummary(dateRange);
    } else if (reportType === "fees") {
        return await getFeeCollectionBreakdown(dateRange);
    } else {
        const { data } = await searchTransactions({
            startDate: dateRange.start,
            endDate: dateRange.end,
            pageSize: 1000
        });
        return data;
    }
}


// =====================================================
// REFUND PROCESSING
// =====================================================

export async function getPendingRefundRequests() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase.rpc("get_refund_requests_pending");

    if (error) throw error;
    return data as any[];
}

export async function getRefundRequestDetails(refundId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("refund_requests")
        .select(`
            *,
            transactions (
                *,
                shipments (
                    shipment_number,
                    pickup_location,
                    delivery_location
                )
            ),
            requester:requested_by_user_id (email)
        `)
        .eq("id", refundId)
        .single();

    if (error) throw error;
    return data;
}

export async function approveRefundRequest(refundId: string, notes?: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase.rpc("process_refund_request", {
        refund_id_param: refundId,
        action_param: "approve",
        admin_notes_param: notes
    });

    if (error) throw error;

    revalidatePath("/admin/payments/refunds");
    return data;
}

export async function rejectRefundRequest(refundId: string, reason: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase.rpc("process_refund_request", {
        refund_id_param: refundId,
        action_param: "reject",
        admin_notes_param: reason
    });

    if (error) throw error;

    revalidatePath("/admin/payments/refunds");
    return data;
}

export async function getAllRefundRequests(filters?: { status?: string }) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    let query = supabase
        .from("refund_requests")
        .select(`
            *,
            transactions (
                gross_amount,
                shipments (shipment_number)
            ),
            requester:requested_by_user_id (email)
        `)
        .order("requested_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
        query = query.eq("refund_status", filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}
