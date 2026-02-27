'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

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

const AnalyticsRangeSchema = z.enum(['7_days', '30_days', '90_days']);

export async function fetchPlatformAnalytics(range: '7_days' | '30_days' | '90_days' = '30_days') {
    // Validate input
    const validatedRange = AnalyticsRangeSchema.safeParse(range);
    if (!validatedRange.success) {
        throw new Error('Invalid analytics range');
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_platform_analytics', { range: validatedRange.data });

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

const ActivityLimitSchema = z.number().int().min(1).max(100).default(10);

export async function fetchActivityFeed(limit: number = 10) {
    // Validate input
    const validatedLimit = ActivityLimitSchema.safeParse(limit);
    if (!validatedLimit.success) {
        throw new Error('Invalid activity feed limit');
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_recent_activity', { limit_count: validatedLimit.data });

    if (error) {
        console.error('Error fetching activity feed:', error);
        return [];
    }

    return data;
}
