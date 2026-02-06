'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// SURGE PRICING ACTIONS
// =====================================================

export type SurgeTriggerType = 'demand' | 'time_of_day' | 'date_range' | 'holiday';

export interface SurgePricingRule {
    id?: string;
    rule_name: string;
    trigger_type: SurgeTriggerType;
    trigger_conditions: any; // JSONB - flexible conditions
    surge_multiplier: number;
    max_multiplier?: number | null;
    priority?: number;
    is_active?: boolean;
}

export async function getSurgePricingRules(activeOnly: boolean = false) {
    const supabase = await createClient();

    try {
        let query = supabase
            .from('surge_pricing_rules')
            .select('*')
            .order('priority', { ascending: false })
            .order('rule_name');

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching surge pricing rules:', error);
        return { success: false, error: error.message };
    }
}

export async function createSurgePricingRule(rule: SurgePricingRule) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('surge_pricing_rules')
            .insert(rule)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating surge pricing rule:', error);
        return { success: false, error: error.message };
    }
}

export async function updateSurgePricingRule(id: string, rule: Partial<SurgePricingRule>) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('surge_pricing_rules')
            .update(rule)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating surge pricing rule:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteSurgePricingRule(id: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('surge_pricing_rules')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting surge pricing rule:', error);
        return { success: false, error: error.message };
    }
}

export async function toggleRuleStatus(id: string, isActive: boolean) {
    return updateSurgePricingRule(id, { is_active: isActive });
}
