"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ExpenseCategory = 'fuel' | 'tolls' | 'parking' | 'meals' | 'maintenance' | 'per_diem' | 'lodging' | 'other';
export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface DriverExpense {
    id: string;
    driver_id: string;
    claim_id: string | null;
    shipment_id: string | null;
    category: ExpenseCategory;
    amount: number;
    expense_date: string;
    description: string | null;
    receipt_url: string | null;
    status: ExpenseStatus;
    created_at: string;
    shipment?: {
        shipment_number: string;
    };
}

export interface ExpenseClaim {
    id: string;
    driver_id: string;
    transporter_id: string;
    total_amount: number;
    status: ClaimStatus;
    submitted_at: string;
    processed_at: string | null;
    admin_notes: string | null;
    created_at: string;
    expenses?: DriverExpense[];
}

export interface MileageLog {
    id: string;
    driver_id: string;
    shipment_id: string | null;
    start_odometer: number;
    end_odometer: number;
    total_distance: number;
    trip_date: string;
    purpose: string | null;
    created_at: string;
}

/**
 * Fetch expenses for the current driver
 */
export async function getDriverExpenses(status?: ExpenseStatus) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { data: [], error: "Unauthorized" };

    let query = supabase
        .from('driver_expenses')
        .select(`
            *,
            shipment:shipments(shipment_number)
        `)
        .eq('driver_id', user.id)
        .order('expense_date', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: data as DriverExpense[] };
}

/**
 * Log a new expense
 */
export async function logExpense(formData: FormData) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const category = formData.get('category') as ExpenseCategory;
    const amount = parseFloat(formData.get('amount') as string);
    const expenseDate = formData.get('expenseDate') as string;
    const description = formData.get('description') as string;
    const shipmentId = formData.get('shipmentId') as string;
    const file = formData.get('receipt') as File;

    let receiptUrl = null;

    if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('expense-receipts')
            .upload(filePath, file);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return { success: false, error: "Failed to upload receipt" };
        }
        receiptUrl = filePath;
    }

    const { data, error } = await supabase
        .from('driver_expenses')
        .insert({
            driver_id: user.id,
            category,
            amount,
            expense_date: expenseDate,
            description: description || null,
            shipment_id: shipmentId || null,
            receipt_url: receiptUrl,
            status: 'draft'
        })
        .select()
        .single();

    if (error) {
        console.error("DB error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/driver/expenses');
    return { success: true, data };
}

/**
 * Delete a draft expense
 */
export async function deleteExpense(expenseId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from('driver_expenses')
        .delete()
        .eq('id', expenseId)
        .eq('driver_id', user.id)
        .eq('status', 'draft');

    if (error) return { success: false, error: error.message };

    revalidatePath('/driver/expenses');
    return { success: true };
}

/**
 * Submit a claim with multiple expenses
 */
export async function submitExpenseClaim(expenseIds: string[], transporterId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };
    if (expenseIds.length === 0) return { success: false, error: "No expenses selected" };

    // 1. Calculate total amount
    const { data: expenses, error: fetchError } = await supabase
        .from('driver_expenses')
        .select('amount')
        .in('id', expenseIds)
        .eq('driver_id', user.id)
        .eq('status', 'draft');

    if (fetchError || !expenses) return { success: false, error: "Failed to fetch expenses" };

    const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    // 2. Create the claim
    const { data: claim, error: claimError } = await supabase
        .from('driver_expense_claims')
        .insert({
            driver_id: user.id,
            transporter_id: transporterId,
            total_amount: totalAmount,
            status: 'pending'
        })
        .select()
        .single();

    if (claimError) return { success: false, error: claimError.message };

    // 3. Link expenses to the claim and update status
    const { error: updateError } = await supabase
        .from('driver_expenses')
        .update({
            claim_id: claim.id,
            status: 'submitted'
        })
        .in('id', expenseIds)
        .eq('driver_id', user.id);

    if (updateError) {
        // Rollback claim? In simple apps we might just leave it or handle it.
        await supabase.from('driver_expense_claims').delete().eq('id', claim.id);
        return { success: false, error: "Failed to link expenses to claim" };
    }

    revalidatePath('/driver/expenses');
    revalidatePath('/driver/expenses/claims');
    return { success: true, claimId: claim.id };
}

/**
 * Fetch claims for the current driver
 */
export async function getDriverClaims() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { data: [], error: "Unauthorized" };

    const { data, error } = await supabase
        .from('driver_expense_claims')
        .select(`
            *,
            expenses:driver_expenses(*)
        `)
        .eq('driver_id', user.id)
        .order('submitted_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data as ExpenseClaim[] };
}

/**
 * Log mileage
 */
export async function logMileage(data: {
    shipment_id?: string;
    start_odometer: number;
    end_odometer: number;
    trip_date: string;
    purpose?: string;
}) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const totalDistance = Math.max(0, data.end_odometer - data.start_odometer);

    const { error } = await supabase
        .from('driver_mileage_logs')
        .insert({
            driver_id: user.id,
            shipment_id: data.shipment_id || null,
            start_odometer: data.start_odometer,
            end_odometer: data.end_odometer,
            total_distance: totalDistance,
            trip_date: data.trip_date,
            purpose: data.purpose || null
        });

    if (error) return { success: false, error: error.message };

    revalidatePath('/driver/expenses');
    return { success: true };
}

/**
 * Fetch mileage logs
 */
export async function getMileageLogs() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { data: [], error: "Unauthorized" };

    const { data, error } = await supabase
        .from('driver_mileage_logs')
        .select('*')
        .eq('driver_id', user.id)
        .order('trip_date', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data as MileageLog[] };
}

/**
 * Fetch transporters that the driver is associated with
 */
export async function getDriverTransporters() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { data: [], error: "Unauthorized" };

    // 1. Get active assignments to find transporter IDs
    const { data: assignments, error: assignError } = await supabase
        .from('driver_assignments')
        .select('transporter_user_id')
        .eq('driver_user_id', user.id)
        .eq('is_active', true);

    if (assignError) {
        console.error("Error fetching driver assignments:", assignError);
        return { data: [], error: assignError.message };
    }

    if (!assignments || assignments.length === 0) return { data: [] };

    const transporterIds = Array.from(new Set(assignments.map(a => a.transporter_user_id)));

    // 2. Fetch company names from user_roles
    // Note: Checking for both 'transporter' and 'carrier' to be safe, 
    // although the system should be consistent.
    const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role_specific_profile')
        .in('user_id', transporterIds)
        .in('role_type', ['transporter', 'carrier']);

    if (rolesError) {
        console.error("Error fetching transporter roles:", rolesError);
        return { data: [], error: rolesError.message };
    }

    const transporters = roles.map(role => ({
        id: role.user_id,
        company_name: (role.role_specific_profile as any)?.company_name || "Unknown Transporter"
    }));

    return { data: transporters };
}
