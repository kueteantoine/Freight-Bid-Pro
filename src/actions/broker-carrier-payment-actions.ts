'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Types
export type BrokerPaymentStatus = 'pending' | 'scheduled' | 'processing' | 'paid' | 'failed' | 'cancelled';

export interface BrokerCarrierPayment {
    id: string;
    broker_user_id: string;
    carrier_user_id: string;
    shipment_id: string | null;
    transaction_id: string | null;
    commission_id: string | null;
    gross_shipment_amount: number;
    broker_commission_amount: number;
    net_carrier_payment: number;
    payment_status: BrokerPaymentStatus;
    scheduled_payment_date: string | null;
    actual_payment_date: string | null;
    payment_method: string | null;
    payment_reference: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface CarrierPaymentFilters {
    carrier_id?: string;
    status?: BrokerPaymentStatus;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
}

/**
 * Get carrier payments with filtering
 */
export async function getCarrierPayments(filters: CarrierPaymentFilters = {}): Promise<{ data: BrokerCarrierPayment[] | null; error: string | null; count: number }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized', count: 0 };
        }

        const { page = 1, limit = 20, carrier_id, status, start_date, end_date } = filters;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('broker_carrier_payments')
            .select('*', { count: 'exact' })
            .eq('broker_user_id', user.id);

        if (carrier_id) {
            query = query.eq('carrier_user_id', carrier_id);
        }
        if (status) {
            query = query.eq('payment_status', status);
        }
        if (start_date) {
            query = query.gte('created_at', start_date);
        }
        if (end_date) {
            query = query.lte('created_at', end_date);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return { data: data as BrokerCarrierPayment[], error: null, count: count || 0 };
    } catch (error: any) {
        console.error('Error fetching carrier payments:', error);
        return { data: null, error: error.message, count: 0 };
    }
}

/**
 * Schedule carrier payment
 */
export async function scheduleCarrierPayment(
    paymentId: string,
    scheduledDate: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { error } = await supabase
            .from('broker_carrier_payments')
            .update({
                scheduled_payment_date: scheduledDate,
                payment_status: 'scheduled'
            })
            .eq('id', paymentId)
            .eq('broker_user_id', user.id);

        if (error) throw error;

        revalidatePath('/broker/commissions');
        return { success: true, error: null };
    } catch (error: any) {
        console.error('Error scheduling carrier payment:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mark payment as processed
 */
export async function markPaymentAsProcessed(
    paymentId: string,
    paymentReference: string,
    paymentMethod?: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { error } = await supabase
            .from('broker_carrier_payments')
            .update({
                payment_status: 'paid',
                actual_payment_date: new Date().toISOString(),
                payment_reference: paymentReference,
                payment_method: paymentMethod || null
            })
            .eq('id', paymentId)
            .eq('broker_user_id', user.id);

        if (error) throw error;

        revalidatePath('/broker/commissions');
        return { success: true, error: null };
    } catch (error: any) {
        console.error('Error marking payment as processed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get carrier payment history
 */
export async function getCarrierPaymentHistory(carrierId: string): Promise<{ data: BrokerCarrierPayment[] | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('broker_carrier_payments')
            .select('*')
            .eq('broker_user_id', user.id)
            .eq('carrier_user_id', carrierId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { data: data as BrokerCarrierPayment[], error: null };
    } catch (error: any) {
        console.error('Error fetching carrier payment history:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get all pending carrier payments
 */
export async function getPendingCarrierPayments(): Promise<{ data: BrokerCarrierPayment[] | null; error: string | null; total_amount: number }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized', total_amount: 0 };
        }

        const { data, error } = await supabase
            .from('broker_carrier_payments')
            .select('*')
            .eq('broker_user_id', user.id)
            .in('payment_status', ['pending', 'scheduled'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        const total_amount = data?.reduce((sum, payment) => sum + parseFloat(payment.net_carrier_payment.toString()), 0) || 0;

        return { data: data as BrokerCarrierPayment[], error: null, total_amount };
    } catch (error: any) {
        console.error('Error fetching pending carrier payments:', error);
        return { data: null, error: error.message, total_amount: 0 };
    }
}
