'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// TRACKING ACTIONS
// =====================================================

/**
 * Record an ad impression
 * Called when the ad enters the viewport
 */
export async function recordAdImpression(adId: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase.rpc('track_ad_event', {
            ad_id_param: adId,
            event_type: 'impression',
        });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error tracking ad impression:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Record an ad click
 * Returns the target URL for redirection
 */
export async function recordAdClick(adId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('track_ad_click', {
            ad_id_param: adId,
        });

        if (error) throw error;
        return { success: true, targetUrl: data as string };
    } catch (error: any) {
        console.error('Error tracking ad click:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// ANALYTICS RETRIEVAL ACTIONS
// =====================================================

/**
 * Get historical performance data for a specific ad
 */
export async function getAdPerformanceData(adId: string, days: number = 30) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_ad_performance_history', {
            ad_id_param: adId,
            days_count: days,
        });

        if (error) throw error;
        return data as { success: boolean; data?: any[]; error?: string };
    } catch (error: any) {
        console.error('Error fetching ad performance history:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get overall ad performance summary for the current user
 */
export async function getUserOverallAdAnalytics(days: number = 30) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_user_overall_ad_analytics', {
            days_count: days,
        });

        if (error) throw error;
        return data as { success: boolean; data?: any; error?: string };
    } catch (error: any) {
        console.error('Error fetching overall ad analytics:', error);
        return { success: false, error: error.message };
    }
}
