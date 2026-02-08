'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Submits a report for an advertisement
 */
export async function reportAdvertisement(adId: string, reason: string, details?: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('report_advertisement', {
            ad_id_param: adId,
            reason_param: reason,
            details_param: details || null
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error reporting advertisement:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Gets the pendings reports queue for administration
 * Requires Admin role
 */
export async function getAdReportsQueue() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_ad_reports_queue');

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        return { success: true, data: data.data };
    } catch (error: any) {
        console.error('Error fetching ad reports queue:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Resolves an ad report
 * Requires Admin role
 */
export async function resolveAdReport(reportId: string, status: 'reviewed' | 'resolved' | 'ignored', resolution?: string) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        const { error } = await supabase
            .from('ad_reports')
            .update({
                status,
                resolution,
                resolved_by: user.id,
                resolved_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', reportId);

        if (error) throw error;

        revalidatePath('/admin/advertisements/reports');
        return { success: true };
    } catch (error: any) {
        console.error('Error resolving ad report:', error);
        return { success: false, error: error.message };
    }
}
