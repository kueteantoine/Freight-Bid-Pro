import { createBrowserClient } from '@supabase/ssr';
import {
    DriverInvitation,
    DriverAssignment,
    DriverAvailability,
    DriverPayment,
    Profile
} from '@/lib/types/database';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const driverService = {
    /**
     * Invite a driver
     */
    async inviteDriver(email?: string, phone?: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('driver_invitations')
            .insert([{
                transporter_user_id: user.id,
                email,
                phone_number: phone,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        return data as DriverInvitation;
    },

    /**
     * Get invitations for the current transporter
     */
    async getMyInvitations() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('driver_invitations')
            .select('*')
            .eq('transporter_user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as DriverInvitation[];
    },

    /**
     * Get active drivers for the current transporter
     */
    async getMyDrivers() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // We fetch profiles joined through assignments
        const { data, error } = await supabase
            .from('driver_assignments')
            .select(`
                driver_user_id,
                profiles:driver_user_id (
                    id,
                    first_name,
                    last_name,
                    avatar_url
                )
            `)
            .eq('transporter_user_id', user.id)
            .eq('is_active', true);

        if (error) throw error;

        // Map to profile structure and filter out potential nulls/arrays
        const drivers = (data || []).map(d => {
            const profile = d.profiles;
            if (Array.isArray(profile)) return profile[0];
            return profile;
        }).filter(Boolean) as Profile[];

        // Filter out duplicates if a driver has multiple assignments
        const uniqueDrivers = Array.from(new Map(drivers.map(d => [d.id, d])).values());

        return uniqueDrivers;
    },

    /**
     * Assign a driver to a vehicle
     */
    async assignDriver(driverUserId: string, vehicleId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Deactivate previous active assignment for this vehicle if any
        await supabase
            .from('driver_assignments')
            .update({ is_active: false, assignment_end_date: new Date().toISOString() })
            .eq('vehicle_id', vehicleId)
            .eq('is_active', true);

        const { data, error } = await supabase
            .from('driver_assignments')
            .insert([{
                driver_user_id: driverUserId,
                vehicle_id: vehicleId,
                transporter_user_id: user.id,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;
        return data as DriverAssignment;
    },

    /**
     * Get driver performance 
     */
    async getDriverPerformance(driverUserId: string) {
        const { count, error } = await supabase
            .from('shipments')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_driver_user_id', driverUserId)
            .eq('status', 'delivered');

        if (error) throw error;
        return { completedTrips: count || 0 };
    },

    /**
     * Get driver payments
     */
    async getMyDriverPayments() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('driver_payments')
            .select('*, profiles:driver_user_id(first_name, last_name)')
            .eq('transporter_user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as (DriverPayment & { profiles: Profile | null })[];
    }
};
