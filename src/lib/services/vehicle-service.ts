import { createBrowserClient } from '@supabase/ssr';
import { Vehicle, VehicleStatus } from '@/lib/types/database';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const vehicleService = {
    /**
     * Fetch all vehicles for the current transporter
     */
    async getMyVehicles() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('transporter_user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Vehicle[];
    },

    /**
     * Add a new vehicle
     */
    async addVehicle(vehicle: Omit<Vehicle, 'id' | 'transporter_user_id' | 'created_at' | 'updated_at'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('vehicles')
            .insert([{ ...vehicle, transporter_user_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        return data as Vehicle;
    },

    /**
     * Update vehicle status
     */
    async updateVehicleStatus(id: string, status: VehicleStatus) {
        const { data, error } = await supabase
            .from('vehicles')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Vehicle;
    },

    /**
     * Delete a vehicle
     */
    async deleteVehicle(id: string) {
        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Bulk import vehicles from CSV data
     */
    async bulkImportVehicles(vehicles: Omit<Vehicle, 'id' | 'transporter_user_id' | 'created_at' | 'updated_at'>[]) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('vehicles')
            .insert(
                vehicles.map(v => ({ ...v, transporter_user_id: user.id }))
            )
            .select();

        if (error) throw error;
        return data as Vehicle[];
    }
};
