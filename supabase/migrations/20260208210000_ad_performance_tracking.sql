-- Migration: Advertisement Performance Tracking Enhancements
-- Date: 2026-02-08
-- Purpose: Enable real-time time-series analytics for advertisements and user-facing dashboards

-- =====================================================
-- IMPROVED TRACKING FUNCTIONS
-- =====================================================

-- Track ad event (impression or click) with real-time daily aggregation
CREATE OR REPLACE FUNCTION public.track_ad_event(
    ad_id_param UUID,
    event_type TEXT -- 'impression' or 'click'
)
RETURNS VOID AS $$
DECLARE
    v_advertiser_id UUID;
    v_placement ad_placement_zone;
    v_cost_per_imp DECIMAL(10,4);
    v_cost_per_click DECIMAL(10,2);
    v_revenue DECIMAL(12,2) := 0;
BEGIN
    -- 1. Get ad details
    SELECT advertiser_user_id, ad_placement_zone, cost_per_impression, cost_per_click
    INTO v_advertiser_id, v_placement, v_cost_per_imp, v_cost_per_click
    FROM public.advertisements
    WHERE id = ad_id_param;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- 2. Update total counts on advertisements table
    IF event_type = 'impression' THEN
        UPDATE public.advertisements
        SET impressions_count = impressions_count + 1
        WHERE id = ad_id_param;
        v_revenue := COALESCE(v_cost_per_imp, 0);
    ELSIF event_type = 'click' THEN
        UPDATE public.advertisements
        SET clicks_count = clicks_count + 1
        WHERE id = ad_id_param;
        v_revenue := COALESCE(v_cost_per_click, 0);
    END IF;

    -- 3. Update total revenue on advertisements table
    IF v_revenue > 0 THEN
        UPDATE public.advertisements
        SET total_revenue = total_revenue + v_revenue
        WHERE id = ad_id_param;
    END IF;

    -- 4. Update real-time daily aggregation
    INSERT INTO public.ad_revenue_records (
        date,
        ad_id,
        advertiser_id,
        placement_zone,
        impressions,
        clicks,
        revenue_amount
    )
    VALUES (
        CURRENT_DATE,
        ad_id_param,
        v_advertiser_id,
        v_placement,
        CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END,
        CASE WHEN event_type = 'click' THEN 1 ELSE 0 END,
        v_revenue
    )
    ON CONFLICT (date, ad_id) DO UPDATE SET
        impressions = ad_revenue_records.impressions + (CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END),
        clicks = ad_revenue_records.clicks + (CASE WHEN event_type = 'click' THEN 1 ELSE 0 END),
        revenue_amount = ad_revenue_records.revenue_amount + v_revenue,
        updated_at = NOW();

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Override old simplistic tracking functions to use the new unified tracker
CREATE OR REPLACE FUNCTION public.track_ad_impression(ad_id_param UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM public.track_ad_event(ad_id_param, 'impression');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.track_ad_click(ad_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    v_target_url TEXT;
BEGIN
    PERFORM public.track_ad_event(ad_id_param, 'click');
    
    SELECT target_url INTO v_target_url
    FROM public.advertisements
    WHERE id = ad_id_param;
    
    RETURN v_target_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USER ANALYTICS FUNCTIONS
-- =====================================================

-- Get performance history for an ad (user-facing)
CREATE OR REPLACE FUNCTION public.get_ad_performance_history(
    ad_id_param UUID,
    days_count INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
    v_advertiser_id UUID;
    v_history JSONB;
BEGIN
    -- Check if current user is the owner of the ad
    SELECT advertiser_user_id INTO v_advertiser_id
    FROM public.advertisements
    WHERE id = ad_id_param;

    IF v_advertiser_id IS NULL OR v_advertiser_id != auth.uid() THEN
        -- Allow admins to see it too
        IF NOT EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role_type = 'admin'
        ) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Unauthorized access to ad analytics');
        END IF;
    END IF;

    -- Fetch daily metrics for the requested range
    SELECT jsonb_agg(jsonb_build_object(
        'date', d.date,
        'impressions', COALESCE(arr.impressions, 0),
        'clicks', COALESCE(arr.clicks, 0),
        'ctr', CASE 
            WHEN COALESCE(arr.impressions, 0) > 0 THEN ROUND((COALESCE(arr.clicks, 0)::DECIMAL / arr.impressions::DECIMAL) * 100, 2)
            ELSE 0 
        END,
        'revenue', COALESCE(arr.revenue_amount, 0)
    ) ORDER BY d.date ASC)
    INTO v_history
    FROM (
        SELECT CURRENT_DATE - (i || ' days')::INTERVAL as date
        FROM generate_series(0, days_count - 1) i
    ) d
    LEFT JOIN public.ad_revenue_records arr ON arr.date = d.date::DATE AND arr.ad_id = ad_id_param;

    RETURN jsonb_build_object(
        'success', true,
        'data', COALESCE(v_history, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get aggregate analytics for all user's ads
CREATE OR REPLACE FUNCTION public.get_user_overall_ad_analytics(
    days_count INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
    v_metrics JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_impressions', COALESCE(SUM(impressions), 0),
        'total_clicks', COALESCE(SUM(clicks), 0),
        'total_revenue', COALESCE(SUM(revenue_amount), 0),
        'active_ads_count', (
            SELECT COUNT(*) FROM public.advertisements 
            WHERE advertiser_user_id = auth.uid() AND approval_status = 'active'
        ),
        'avg_ctr', CASE 
            WHEN SUM(impressions) > 0 THEN ROUND((SUM(clicks)::DECIMAL / SUM(impressions)::DECIMAL) * 100, 2)
            ELSE 0 
        END
    )
    INTO v_metrics
    FROM public.ad_revenue_records
    WHERE advertiser_id = auth.uid()
    AND date >= (CURRENT_DATE - (days_count || ' days')::INTERVAL);

    RETURN jsonb_build_object(
        'success', true,
        'data', v_metrics
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_ad_performance_history(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_overall_ad_analytics(INTEGER) TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION public.track_ad_event(UUID, TEXT) IS 'Unified real-time tracking for ad impressions and clicks';
COMMENT ON FUNCTION public.get_ad_performance_history(UUID, INTEGER) IS 'Returns time-series performance data for a specific ad';
COMMENT ON FUNCTION public.get_user_overall_ad_analytics(INTEGER) IS 'Returns aggregate performance metrics for all of a user''s ads';
