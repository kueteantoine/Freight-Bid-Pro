'use server';

import { createClient } from '@/lib/supabase/server';

export async function fetchDashboardStats() {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

    if (error) {
        console.error('Error fetching dashboard stats:', error);
        // Return zeros if error occurs (graceful degradation)
        return {
            active_users: 0,
            active_shipments: 0,
            active_bids: 0,
            transactions_today_count: 0,
            transactions_today_value: 0,
            pending_verifications: 0,
            open_disputes: 0
        };
    }

    return data;
}

export async function fetchPlatformAnalytics(range: '7_days' | '30_days' | '90_days' = '30_days') {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_platform_analytics', { range });

    if (error) {
        console.error('Error fetching platform analytics:', error);
        return {
            user_growth: [],
            revenue_trends: [],
            shipment_trends: []
        };
    }

    return data;
}

export async function fetchGeographicData() {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_geographic_analytics');

    if (error) {
        console.error('Error fetching geographic data:', error);
        return { heatmap_data: [] };
    }

    return data;
}

export async function fetchActivityFeed(limit: number = 10) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_recent_activity', { limit_count: limit });

    if (error) {
        console.error('Error fetching activity feed:', error);
        return [];
    }

    return data;
}
