import { createBrowserClient } from '@supabase/ssr';
import {
    DriverInvitation,
    DriverAssignment,
    DriverAvailability,
    DriverPayment,
    Profile,
    DriverStatus,
    DriverStatusRecord,
    VehicleChecklist,
    TimeOffRequest,
    ShiftLog,
    TimeOffStatus
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
    },

    // --- Driver Schedule & Status ---

    /**
     * Get driver status
     */
    async getDriverStatus(userId?: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const targetId = userId || user.id;

        const { data, error } = await supabase
            .from('driver_status')
            .select('*')
            .eq('user_id', targetId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
        return data as DriverStatusRecord | null;
    },

    /**
     * Update driver status
     */
    async updateDriverStatus(status: DriverStatus, location?: { lat: number, lng: number }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const updates: any = {
            user_id: user.id,
            status,
            last_location_update: new Date().toISOString()
        };

        if (location) {
            updates.current_latitude = location.lat;
            updates.current_longitude = location.lng;
        }

        if (status === 'online') {
            updates.current_session_started_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('driver_status')
            .upsert(updates)
            .select()
            .single();

        if (error) throw error;
        return data as DriverStatusRecord;
    },

    /**
     * Submit vehicle checklist
     */
    async submitVehicleChecklist(checklist: Partial<VehicleChecklist>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('vehicle_checklists')
            .insert([{
                ...checklist,
                driver_user_id: user.id,
                submitted_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data as VehicleChecklist;
    },

    /**
     * Request time off
     */
    async requestTimeOff(request: Omit<TimeOffRequest, 'id' | 'driver_user_id' | 'created_at' | 'updated_at' | 'status' | 'admin_notes'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('time_off_requests')
            .insert([{
                ...request,
                driver_user_id: user.id,
                status: 'pending' as TimeOffStatus
            }])
            .select()
            .single();

        if (error) throw error;
        return data as TimeOffRequest;
    },

    /**
     * Get time off requests
     */
    async getTimeOffRequests() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('time_off_requests')
            .select('*')
            .eq('driver_user_id', user.id)
            .order('start_date', { ascending: true });

        if (error) throw error;
        return data as TimeOffRequest[];
    },

    /**
     * Get driver schedule (availability)
     */
    async getDriverSchedule() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('driver_availability')
            .select('*')
            .eq('driver_user_id', user.id);

        if (error) throw error;
        return data as DriverAvailability[];
    },

    /**
     * Update driver schedule
     */
    async updateDriverSchedule(schedules: Partial<DriverAvailability>[]) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Delete existing schedule for simplicity (full replace logic)
        // In a real app we might diff, but full replace is easier for weekly schedule UI
        await supabase
            .from('driver_availability')
            .delete()
            .eq('driver_user_id', user.id);

        const newSchedules = schedules.map(s => ({
            ...s,
            driver_user_id: user.id
        }));

        if (newSchedules.length === 0) return [];

        const { data, error } = await supabase
            .from('driver_availability')
            .insert(newSchedules)
            .select();

        if (error) throw error;
        return data as DriverAvailability[];
    },

    /**
     * Get shift summary
     */
    async getShiftSummary() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Get the latest shift log
        const { data, error } = await supabase
            .from('shift_logs')
            .select('*')
            .eq('driver_user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as ShiftLog | null;
    },

    /**
     * Get my active assignment (for driver)
     */
    async getMyActiveAssignment() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('driver_assignments')
            .select('*, vehicles(*)')
            .eq('driver_user_id', user.id)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as (DriverAssignment & { vehicles: any }) | null;
    }
};
