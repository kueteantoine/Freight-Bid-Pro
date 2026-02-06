'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Types
export type RateType = 'default' | 'client_specific' | 'route_based' | 'volume_tier';

export interface BrokerCommissionRate {
    id: string;
    broker_user_id: string;
    rate_type: RateType;
    rate_name: string;
    commission_percentage: number;
    client_user_id: string | null;
    route_origin: string | null;
    route_destination: string | null;
    freight_type: string | null;
    min_shipments_per_month: number;
    max_shipments_per_month: number | null;
    min_transaction_amount: number | null;
    max_transaction_amount: number | null;
    is_active: boolean;
    priority: number;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateCommissionRateInput {
    rate_type: RateType;
    rate_name: string;
    commission_percentage: number;
    client_user_id?: string;
    route_origin?: string;
    route_destination?: string;
    freight_type?: string;
    min_shipments_per_month?: number;
    max_shipments_per_month?: number;
    min_transaction_amount?: number;
    max_transaction_amount?: number;
    priority?: number;
    description?: string;
}

/**
 * Get all commission rates for the broker
 */
export async function getBrokerCommissionRates(): Promise<{ data: BrokerCommissionRate[] | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('broker_commission_rates')
            .select('*')
            .eq('broker_user_id', user.id)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { data: data as BrokerCommissionRate[], error: null };
    } catch (error: any) {
        console.error('Error fetching broker commission rates:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Create a new commission rate
 */
export async function createCommissionRate(input: CreateCommissionRateInput): Promise<{ data: BrokerCommissionRate | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('broker_commission_rates')
            .insert({
                broker_user_id: user.id,
                rate_type: input.rate_type,
                rate_name: input.rate_name,
                commission_percentage: input.commission_percentage,
                client_user_id: input.client_user_id || null,
                route_origin: input.route_origin || null,
                route_destination: input.route_destination || null,
                freight_type: input.freight_type || null,
                min_shipments_per_month: input.min_shipments_per_month || 0,
                max_shipments_per_month: input.max_shipments_per_month || null,
                min_transaction_amount: input.min_transaction_amount || null,
                max_transaction_amount: input.max_transaction_amount || null,
                priority: input.priority || 0,
                description: input.description || null,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/broker/commissions');
        return { data: data as BrokerCommissionRate, error: null };
    } catch (error: any) {
        console.error('Error creating commission rate:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Update an existing commission rate
 */
export async function updateCommissionRate(
    rateId: string,
    updates: Partial<CreateCommissionRateInput> & { is_active?: boolean }
): Promise<{ data: BrokerCommissionRate | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('broker_commission_rates')
            .update(updates)
            .eq('id', rateId)
            .eq('broker_user_id', user.id)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/broker/commissions');
        return { data: data as BrokerCommissionRate, error: null };
    } catch (error: any) {
        console.error('Error updating commission rate:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Delete a commission rate
 */
export async function deleteCommissionRate(rateId: string): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { error } = await supabase
            .from('broker_commission_rates')
            .delete()
            .eq('id', rateId)
            .eq('broker_user_id', user.id);

        if (error) throw error;

        revalidatePath('/broker/commissions');
        return { success: true, error: null };
    } catch (error: any) {
        console.error('Error deleting commission rate:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Toggle commission rate active status
 */
export async function toggleCommissionRateStatus(rateId: string, isActive: boolean): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { error } = await supabase
            .from('broker_commission_rates')
            .update({ is_active: isActive })
            .eq('id', rateId)
            .eq('broker_user_id', user.id);

        if (error) throw error;

        revalidatePath('/broker/commissions');
        return { success: true, error: null };
    } catch (error: any) {
        console.error('Error toggling commission rate status:', error);
        return { success: false, error: error.message };
    }
}
