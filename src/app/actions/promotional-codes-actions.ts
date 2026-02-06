'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// PROMOTIONAL CODES ACTIONS
// =====================================================

export interface PromotionalCode {
    id?: string;
    code: string;
    discount_percentage: number;
    valid_from: string;
    valid_until: string;
    target_user_segments?: any; // JSONB
    max_usage_count?: number | null;
    current_usage_count?: number;
    max_usage_per_user?: number;
    is_active?: boolean;
}

export async function getPromotionalCodes(activeOnly: boolean = false) {
    const supabase = await createClient();

    try {
        let query = supabase
            .from('promotional_codes')
            .select('*')
            .order('created_at', { ascending: false });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching promotional codes:', error);
        return { success: false, error: error.message };
    }
}

export async function createPromotionalCode(code: PromotionalCode) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('promotional_codes')
            .insert(code)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating promotional code:', error);
        return { success: false, error: error.message };
    }
}

export async function updatePromotionalCode(id: string, code: Partial<PromotionalCode>) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('promotional_codes')
            .update(code)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating promotional code:', error);
        return { success: false, error: error.message };
    }
}

export async function deletePromotionalCode(id: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('promotional_codes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting promotional code:', error);
        return { success: false, error: error.message };
    }
}

export async function getCodeRedemptionStats(codeId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('code_redemptions')
            .select('*')
            .eq('code_id', codeId);

        if (error) throw error;

        return {
            success: true,
            data: {
                redemptions: data,
                total_redemptions: data.length,
                total_discount_amount: data.reduce((sum, r) => sum + Number(r.discount_amount), 0)
            }
        };
    } catch (error: any) {
        console.error('Error fetching code redemption stats:', error);
        return { success: false, error: error.message };
    }
}

export async function validatePromotionalCode(code: string, userId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('validate_promotional_code', {
            promo_code: code,
            user_id_param: userId
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error validating promotional code:', error);
        return { success: false, error: error.message };
    }
}

export async function redeemPromotionalCode(codeId: string, userId: string, shipmentId: string, discountAmount: number) {
    const supabase = await createClient();

    try {
        // Insert redemption record
        const { error: redemptionError } = await supabase
            .from('code_redemptions')
            .insert({
                code_id: codeId,
                user_id: userId,
                shipment_id: shipmentId,
                discount_amount: discountAmount
            });

        if (redemptionError) throw redemptionError;

        // Increment usage count
        const { error: updateError } = await supabase.rpc('increment', {
            table_name: 'promotional_codes',
            row_id: codeId,
            column_name: 'current_usage_count'
        });

        if (updateError) {
            // Fallback: manual increment
            const { data: codeData } = await supabase
                .from('promotional_codes')
                .select('current_usage_count')
                .eq('id', codeId)
                .single();

            if (codeData) {
                await supabase
                    .from('promotional_codes')
                    .update({ current_usage_count: (codeData.current_usage_count || 0) + 1 })
                    .eq('id', codeId);
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error redeeming promotional code:', error);
        return { success: false, error: error.message };
    }
}
