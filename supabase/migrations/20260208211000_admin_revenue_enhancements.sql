-- Migration: Admin Revenue Analytics Enhancements
-- Date: 2026-02-08
-- Purpose: Include subscription revenue (MRR) in the admin revenue dashboard

-- =====================================================
-- ENHANCED REVENUE DASHBOARD RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_enhanced_ad_revenue_dashboard(
    date_from DATE DEFAULT NULL,
    date_to DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_total_ad_revenue DECIMAL(12,2);
    v_total_sub_revenue DECIMAL(12,2);
    v_total_impressions BIGINT;
    v_total_clicks BIGINT;
    v_avg_ctr DECIMAL(5,2);
    v_active_subscriptions INTEGER;
    v_revenue_by_zone JSONB;
BEGIN
    -- Check permission
    IF NOT public.check_admin_permission('can_view_ad_revenue') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient permissions to view ad revenue'
        );
    END IF;
    
    -- Set default date range if not provided (last 30 days)
    date_from := COALESCE(date_from, CURRENT_DATE - INTERVAL '30 days');
    date_to := COALESCE(date_to, CURRENT_DATE);
    
    -- 1. Get performance revenue (CPM/CPC)
    SELECT 
        COALESCE(SUM(revenue_amount), 0),
        COALESCE(SUM(impressions), 0),
        COALESCE(SUM(clicks), 0)
    INTO v_total_ad_revenue, v_total_impressions, v_total_clicks
    FROM public.ad_revenue_records
    WHERE date BETWEEN date_from AND date_to;
    
    -- 2. Get subscription revenue (sum of tier prices for active subs)
    -- Note: This is an estimation of revenue for the period based on active subs
    SELECT 
        COALESCE(SUM(t.monthly_price), 0),
        count(s.id)
    INTO v_total_sub_revenue, v_active_subscriptions
    FROM public.user_ad_subscriptions s
    JOIN public.ad_subscription_tiers t ON s.tier_id = t.id
    WHERE s.subscription_status = 'active'
    AND s.created_at <= date_to;
    
    -- 3. Calculate average CTR
    IF v_total_impressions > 0 THEN
        v_avg_ctr := ROUND((v_total_clicks::DECIMAL / v_total_impressions::DECIMAL) * 100, 2);
    ELSE
        v_avg_ctr := 0;
    END IF;
    
    -- 4. Get revenue by placement zone
    SELECT jsonb_object_agg(placement_zone, revenue)
    INTO v_revenue_by_zone
    FROM (
        SELECT 
            placement_zone,
            SUM(revenue_amount) as revenue
        FROM public.ad_revenue_records
        WHERE date BETWEEN date_from AND date_to
        GROUP BY placement_zone
    ) subquery;
    
    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'total_performance_revenue', v_total_ad_revenue,
            'total_subscription_revenue', v_total_sub_revenue,
            'total_combined_revenue', v_total_ad_revenue + v_total_sub_revenue,
            'total_impressions', v_total_impressions,
            'total_clicks', v_total_clicks,
            'average_ctr', v_avg_ctr,
            'active_subscriptions', v_active_subscriptions,
            'revenue_by_placement', COALESCE(v_revenue_by_zone, '{}'::jsonb),
            'date_from', date_from,
            'date_to', date_to
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_enhanced_ad_revenue_dashboard(DATE, DATE) TO authenticated;

-- Comment
COMMENT ON FUNCTION public.get_enhanced_ad_revenue_dashboard(DATE, DATE) IS 'Get comprehensive ad revenue dashboard including both performance and subscription revenue';
