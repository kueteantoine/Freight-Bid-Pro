'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// SERVICE REGIONS ACTIONS
// =====================================================

export interface ServiceRegion {
    id?: string;
    name: string;
    country: string;
    state_province?: string;
    boundaries?: any; // GeoJSON polygon
    distance_calculation_method?: 'haversine' | 'road_distance';
    is_active?: boolean;
}

export async function getServiceRegions(activeOnly: boolean = false) {
    const supabase = await createClient();

    try {
        let query = supabase
            .from('service_regions')
            .select('*')
            .order('country', { ascending: true })
            .order('name', { ascending: true });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching service regions:', error);
        return { success: false, error: error.message };
    }
}

export async function createServiceRegion(region: ServiceRegion) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('service_regions')
            .insert(region)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating service region:', error);
        return { success: false, error: error.message };
    }
}

export async function updateServiceRegion(id: string, region: Partial<ServiceRegion>) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('service_regions')
            .update(region)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating service region:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteServiceRegion(id: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('service_regions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting service region:', error);
        return { success: false, error: error.message };
    }
}
