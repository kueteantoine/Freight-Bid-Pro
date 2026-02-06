'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// VEHICLE TYPES ACTIONS
// =====================================================

export interface VehicleType {
    id?: string;
    name: string;
    icon?: string;
    min_capacity_kg?: number;
    max_capacity_kg?: number;
    min_capacity_cubic_meters?: number;
    max_capacity_cubic_meters?: number;
    description?: string;
    is_active?: boolean;
}

export async function getVehicleTypes(activeOnly: boolean = false) {
    const supabase = await createClient();

    try {
        let query = supabase
            .from('vehicle_types')
            .select('*')
            .order('name');

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching vehicle types:', error);
        return { success: false, error: error.message };
    }
}

export async function createVehicleType(vehicleType: VehicleType) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('vehicle_types')
            .insert(vehicleType)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating vehicle type:', error);
        return { success: false, error: error.message };
    }
}

export async function updateVehicleType(id: string, vehicleType: Partial<VehicleType>) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('vehicle_types')
            .update(vehicleType)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating vehicle type:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteVehicleType(id: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('vehicle_types')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting vehicle type:', error);
        return { success: false, error: error.message };
    }
}

export async function toggleVehicleTypeStatus(id: string, isActive: boolean) {
    return updateVehicleType(id, { is_active: isActive });
}
