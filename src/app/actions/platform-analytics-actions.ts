'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type {
    DateRange,
    EngagementMetrics,
    ConversionFunnel,
    FeatureUsage,
    EventTrend,
    PerformanceMetrics,
    ErrorAnalytics,
} from '@/lib/analytics/types';

export async function getUserEngagementMetrics(
    dateRange: DateRange = '30_days',
): Promise<EngagementMetrics> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_user_engagement_metrics', {
        p_date_range: dateRange,
    });

    if (error) throw new Error(`Failed to fetch engagement metrics: ${error.message}`);
    return data as EngagementMetrics;
}

export async function getConversionFunnel(
    dateRange: DateRange = '30_days',
): Promise<ConversionFunnel> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_conversion_funnel', {
        p_date_range: dateRange,
    });

    if (error) throw new Error(`Failed to fetch conversion funnel: ${error.message}`);
    return data as ConversionFunnel;
}

export async function getFeatureUsageStats(
    dateRange: DateRange = '30_days',
): Promise<FeatureUsage[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_feature_usage_stats', {
        p_date_range: dateRange,
    });

    if (error) throw new Error(`Failed to fetch feature usage: ${error.message}`);
    return (data as FeatureUsage[]) || [];
}

export async function getEventTrends(
    dateRange: DateRange = '30_days',
    category?: string,
): Promise<EventTrend[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_event_trends', {
        p_date_range: dateRange,
        p_category: category || null,
    });

    if (error) throw new Error(`Failed to fetch event trends: ${error.message}`);
    return (data as EventTrend[]) || [];
}

export async function getPerformanceMetrics(
    dateRange: DateRange = '30_days',
): Promise<PerformanceMetrics> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_performance_metrics', {
        p_date_range: dateRange,
    });

    if (error) throw new Error(`Failed to fetch performance metrics: ${error.message}`);
    return data as PerformanceMetrics;
}

export async function getErrorAnalytics(
    dateRange: DateRange = '30_days',
): Promise<ErrorAnalytics> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_error_analytics', {
        p_date_range: dateRange,
    });

    if (error) throw new Error(`Failed to fetch error analytics: ${error.message}`);
    return data as ErrorAnalytics;
}
