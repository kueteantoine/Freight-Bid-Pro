'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Types
export type InvoiceType = 'commission' | 'service_fee' | 'monthly_statement';
export type BrokerPaymentStatus = 'pending' | 'scheduled' | 'processing' | 'paid' | 'failed' | 'cancelled';

export interface BrokerClientInvoice {
    id: string;
    broker_user_id: string;
    client_user_id: string;
    invoice_number: string;
    invoice_type: InvoiceType;
    billing_period_start: string;
    billing_period_end: string;
    subtotal_amount: number;
    tax_amount: number;
    total_amount: number;
    items_json: any[];
    payment_status: BrokerPaymentStatus;
    due_date: string;
    paid_date: string | null;
    payment_method: string | null;
    payment_reference: string | null;
    invoice_pdf_url: string | null;
    notes: string | null;
    sent_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface InvoiceFilters {
    client_id?: string;
    status?: BrokerPaymentStatus;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
}

/**
 * Get client invoices with filtering
 */
export async function getClientInvoices(filters: InvoiceFilters = {}): Promise<{ data: BrokerClientInvoice[] | null; error: string | null; count: number }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized', count: 0 };
        }

        const { page = 1, limit = 20, client_id, status, start_date, end_date } = filters;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('broker_client_invoices')
            .select('*', { count: 'exact' })
            .eq('broker_user_id', user.id);

        if (client_id) {
            query = query.eq('client_user_id', client_id);
        }
        if (status) {
            query = query.eq('payment_status', status);
        }
        if (start_date) {
            query = query.gte('billing_period_start', start_date);
        }
        if (end_date) {
            query = query.lte('billing_period_end', end_date);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return { data: data as BrokerClientInvoice[], error: null, count: count || 0 };
    } catch (error: any) {
        console.error('Error fetching client invoices:', error);
        return { data: null, error: error.message, count: 0 };
    }
}

/**
 * Generate a new client invoice for a billing period
 */
export async function generateClientInvoice(
    clientId: string,
    periodStart: string,
    periodEnd: string,
    invoiceType: InvoiceType = 'commission'
): Promise<{ data: BrokerClientInvoice | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' };
        }

        // Get all commissions for this client in the billing period
        const { data: commissions, error: commissionsError } = await supabase
            .from('broker_commissions')
            .select('*')
            .eq('broker_user_id', user.id)
            .eq('shipper_user_id', clientId)
            .gte('created_at', periodStart)
            .lte('created_at', periodEnd);

        if (commissionsError) throw commissionsError;

        if (!commissions || commissions.length === 0) {
            return { data: null, error: 'No commissions found for this period' };
        }

        // Calculate totals
        const subtotal = commissions.reduce((sum, c) => sum + parseFloat(c.commission_amount.toString()), 0);
        const tax = subtotal * 0.0; // Adjust tax rate as needed
        const total = subtotal + tax;

        // Build line items
        const items = commissions.map(c => ({
            shipment_id: c.shipment_id,
            transaction_id: c.transaction_id,
            commission_amount: c.commission_amount,
            commission_rate: c.commission_rate,
            gross_amount: c.gross_amount,
            date: c.created_at
        }));

        // Generate invoice number
        const { data: invoiceNumber, error: invoiceNumberError } = await supabase.rpc('generate_invoice_number');
        if (invoiceNumberError) throw invoiceNumberError;

        // Calculate due date (30 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // Create invoice
        const { data, error } = await supabase
            .from('broker_client_invoices')
            .insert({
                broker_user_id: user.id,
                client_user_id: clientId,
                invoice_number: invoiceNumber,
                invoice_type: invoiceType,
                billing_period_start: periodStart,
                billing_period_end: periodEnd,
                subtotal_amount: subtotal,
                tax_amount: tax,
                total_amount: total,
                items_json: items,
                payment_status: 'pending',
                due_date: dueDate.toISOString().split('T')[0]
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/broker/commissions');
        return { data: data as BrokerClientInvoice, error: null };
    } catch (error: any) {
        console.error('Error generating client invoice:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get invoice details
 */
export async function getInvoiceDetails(invoiceId: string): Promise<{ data: BrokerClientInvoice | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('broker_client_invoices')
            .select('*')
            .eq('id', invoiceId)
            .eq('broker_user_id', user.id)
            .single();

        if (error) throw error;

        return { data: data as BrokerClientInvoice, error: null };
    } catch (error: any) {
        console.error('Error fetching invoice details:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Mark invoice as paid
 */
export async function markInvoiceAsPaid(
    invoiceId: string,
    paymentDate: string,
    paymentMethod?: string,
    paymentReference?: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { error } = await supabase
            .from('broker_client_invoices')
            .update({
                payment_status: 'paid',
                paid_date: paymentDate,
                payment_method: paymentMethod || null,
                payment_reference: paymentReference || null
            })
            .eq('id', invoiceId)
            .eq('broker_user_id', user.id);

        if (error) throw error;

        revalidatePath('/broker/commissions');
        return { success: true, error: null };
    } catch (error: any) {
        console.error('Error marking invoice as paid:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send invoice email (placeholder - would integrate with email service)
 */
export async function sendInvoiceEmail(invoiceId: string): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Update sent_at timestamp
        const { error } = await supabase
            .from('broker_client_invoices')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', invoiceId)
            .eq('broker_user_id', user.id);

        if (error) throw error;

        // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
        // For now, just mark as sent

        revalidatePath('/broker/commissions');
        return { success: true, error: null };
    } catch (error: any) {
        console.error('Error sending invoice email:', error);
        return { success: false, error: error.message };
    }
}
