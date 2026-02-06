'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// FREIGHT CATEGORIES ACTIONS
// =====================================================

export interface FreightCategory {
    id?: string;
    name: string;
    description?: string;
    special_requirements?: string;
    is_restricted?: boolean;
    is_active?: boolean;
}

export async function getFreightCategories(activeOnly: boolean = false) {
    const supabase = await createClient();

    try {
        let query = supabase
            .from('freight_categories')
            .select('*')
            .order('name');

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching freight categories:', error);
        return { success: false, error: error.message };
    }
}

export async function createFreightCategory(category: FreightCategory) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('freight_categories')
            .insert(category)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating freight category:', error);
        return { success: false, error: error.message };
    }
}

export async function updateFreightCategory(id: string, category: Partial<FreightCategory>) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('freight_categories')
            .update(category)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating freight category:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteFreightCategory(id: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('freight_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting freight category:', error);
        return { success: false, error: error.message };
    }
}

export async function toggleCategoryRestriction(id: string, isRestricted: boolean) {
    return updateFreightCategory(id, { is_restricted: isRestricted });
}
