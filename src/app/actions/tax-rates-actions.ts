'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// TAX RATES ACTIONS
// =====================================================

export type TaxCalculationMethod = 'percentage' | 'fixed_amount' | 'tiered';

export interface TaxRate {
    id?: string;
    region_name: string;
    country: string;
    state_province?: string;
    tax_name: string;
    tax_rate?: number | null;
    fixed_amount?: number | null;
    calculation_method: TaxCalculationMethod;
    exemption_rules?: any; // JSONB
    is_active?: boolean;
}

export async function getTaxRates(activeOnly: boolean = false) {
    const supabase = await createClient();

    try {
        let query = supabase
            .from('tax_rates')
            .select('*')
            .order('country')
            .order('region_name');

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching tax rates:', error);
        return { success: false, error: error.message };
    }
}

export async function createTaxRate(taxRate: TaxRate) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('tax_rates')
            .insert(taxRate)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating tax rate:', error);
        return { success: false, error: error.message };
    }
}

export async function updateTaxRate(id: string, taxRate: Partial<TaxRate>) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('tax_rates')
            .update(taxRate)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating tax rate:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteTaxRate(id: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('tax_rates')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting tax rate:', error);
        return { success: false, error: error.message };
    }
}

export async function getApplicableTaxRate(country: string, stateProvince?: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_tax_rate', {
            country_param: country,
            state_province_param: stateProvince || null
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error getting applicable tax rate:', error);
        return { success: false, error: error.message };
    }
}
