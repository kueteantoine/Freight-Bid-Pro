'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// COMMISSION TIERS ACTIONS
// =====================================================

export interface CommissionTier {
    id?: string;
    tier_name: string;
    min_shipments_per_month: number;
    max_shipments_per_month?: number | null;
    commission_percentage: number;
    is_active?: boolean;
}

export async function getCommissionTiers(activeOnly: boolean = false) {
    const supabase = await createClient();

    try {
        let query = supabase
            .from('commission_tiers')
            .select('*')
            .order('min_shipments_per_month');

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching commission tiers:', error);
        return { success: false, error: error.message };
    }
}

export async function createCommissionTier(tier: CommissionTier) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('commission_tiers')
            .insert(tier)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating commission tier:', error);
        return { success: false, error: error.message };
    }
}

export async function updateCommissionTier(id: string, tier: Partial<CommissionTier>) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('commission_tiers')
            .update(tier)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating commission tier:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteCommissionTier(id: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('commission_tiers')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting commission tier:', error);
        return { success: false, error: error.message };
    }
}

export async function toggleTierStatus(id: string, isActive: boolean) {
    return updateCommissionTier(id, { is_active: isActive });
}

export async function getApplicableTier(shipmentCount: number) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_active_commission_tier', {
            shipment_count: shipmentCount
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error getting applicable tier:', error);
        return { success: false, error: error.message };
    }
}
