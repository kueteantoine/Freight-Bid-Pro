-- Advertisement Revenue Tracking (Prompt 47 - Part 5)
-- This migration creates separate revenue tracking for the advertisement business unit
-- Tracks daily revenue aggregation, advertiser billing, and performance analytics

-- =====================================================
-- AD_REVENUE_RECORDS TABLE
-- =====================================================
-- Daily revenue aggregation by ad and placement
CREATE TABLE IF NOT EXISTS public.ad_revenue_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    ad_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
    advertiser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    placement_zone ad_placement_zone NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue_amount DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'XAF',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, ad_id) -- One record per ad per day
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ad_revenue_records_date ON public.ad_revenue_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_ad_revenue_records_ad ON public.ad_revenue_records(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_revenue_records_advertiser ON public.ad_revenue_records(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_ad_revenue_records_placement ON public.ad_revenue_records(placement_zone);

-- Enable RLS
ALTER TABLE public.ad_revenue_records ENABLE ROW LEVEL SECURITY;

-- Admins with revenue permission can view
CREATE POLICY "Admins can view ad revenue records"
    ON public.ad_revenue_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_user_roles aur
            WHERE aur.user_id = auth.uid()
            AND aur.role_name IN ('super_admin', 'financial_admin', 'ad_manager')
            AND aur.is_active = true
        )
    );


-- =====================================================
-- ADVERTISER_BILLING TABLE
-- =====================================================
-- Billing records for advertisers
CREATE TABLE IF NOT EXISTS public.advertiser_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    total_impressions INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'XAF',
    payment_status TEXT DEFAULT 'pending', -- pending, paid, overdue, cancelled
    invoice_url TEXT,
    payment_due_date DATE,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_advertiser_billing_advertiser ON public.advertiser_billing(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_advertiser_billing_period ON public.advertiser_billing(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_advertiser_billing_status ON public.advertiser_billing(payment_status);
CREATE INDEX IF NOT EXISTS idx_advertiser_billing_due_date ON public.advertiser_billing(payment_due_date);

-- Enable RLS
ALTER TABLE public.advertiser_billing ENABLE ROW LEVEL SECURITY;

-- Advertisers can view their own billing
CREATE POLICY "Advertisers can view their own billing"
    ON public.advertiser_billing FOR SELECT
    USING (auth.uid() = advertiser_id);

-- Financial admins can manage billing
CREATE POLICY "Financial admins can manage advertiser billing"
    ON public.advertiser_billing FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_user_roles aur
            WHERE aur.user_id = auth.uid()
            AND aur.role_name IN ('super_admin', 'financial_admin')
            AND aur.is_active = true
        )
    );


-- =====================================================
-- RPC FUNCTIONS
-- =====================================================

-- Get ad revenue dashboard
CREATE OR REPLACE FUNCTION public.get_ad_revenue_dashboard(
    date_from DATE DEFAULT NULL,
    date_to DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    revenue_data JSONB;
    total_revenue DECIMAL(12,2);
    total_impressions BIGINT;
    total_clicks BIGINT;
    avg_ctr DECIMAL(5,2);
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
    
    -- Get total metrics
    SELECT 
        COALESCE(SUM(revenue_amount), 0),
        COALESCE(SUM(impressions), 0),
        COALESCE(SUM(clicks), 0)
    INTO total_revenue, total_impressions, total_clicks
    FROM public.ad_revenue_records
    WHERE date BETWEEN date_from AND date_to;
    
    -- Calculate average CTR
    IF total_impressions > 0 THEN
        avg_ctr := ROUND((total_clicks::DECIMAL / total_impressions::DECIMAL) * 100, 2);
    ELSE
        avg_ctr := 0;
    END IF;
    
    -- Get revenue by placement zone
    SELECT jsonb_object_agg(placement_zone, revenue)
    INTO revenue_data
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
            'total_revenue', total_revenue,
            'total_impressions', total_impressions,
            'total_clicks', total_clicks,
            'average_ctr', avg_ctr,
            'revenue_by_placement', COALESCE(revenue_data, '{}'::jsonb),
            'date_from', date_from,
            'date_to', date_to
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Calculate advertiser bill
CREATE OR REPLACE FUNCTION public.calculate_advertiser_bill(
    advertiser_id_param UUID,
    period_start DATE,
    period_end DATE
)
RETURNS JSONB AS $$
DECLARE
    bill_data RECORD;
    total_amount DECIMAL(12,2);
BEGIN
    -- Check permission
    IF NOT public.check_admin_permission('can_view_revenue') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Calculate totals from revenue records
    SELECT 
        COALESCE(SUM(impressions), 0) as total_impressions,
        COALESCE(SUM(clicks), 0) as total_clicks,
        COALESCE(SUM(conversions), 0) as total_conversions,
        COALESCE(SUM(revenue_amount), 0) as total_amount
    INTO bill_data
    FROM public.ad_revenue_records
    WHERE advertiser_id = advertiser_id_param
    AND date BETWEEN period_start AND period_end;
    
    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'advertiser_id', advertiser_id_param,
            'period_start', period_start,
            'period_end', period_end,
            'total_impressions', bill_data.total_impressions,
            'total_clicks', bill_data.total_clicks,
            'total_conversions', bill_data.total_conversions,
            'total_amount', bill_data.total_amount,
            'currency', 'XAF'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get top performing ads
CREATE OR REPLACE FUNCTION public.get_top_performing_ads(
    metric_param TEXT DEFAULT 'revenue', -- 'revenue', 'ctr', 'impressions', 'clicks'
    limit_param INTEGER DEFAULT 10,
    date_from DATE DEFAULT NULL,
    date_to DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    ads_data JSONB;
BEGIN
    -- Check permission
    IF NOT public.check_admin_permission('can_view_ads') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Set default date range
    date_from := COALESCE(date_from, CURRENT_DATE - INTERVAL '30 days');
    date_to := COALESCE(date_to, CURRENT_DATE);
    
    -- Get top ads based on metric
    IF metric_param = 'revenue' THEN
        SELECT jsonb_agg(row_to_json(t))
        INTO ads_data
        FROM (
            SELECT 
                a.id,
                a.ad_title,
                a.ad_placement_zone,
                SUM(arr.revenue_amount) as total_revenue,
                SUM(arr.impressions) as total_impressions,
                SUM(arr.clicks) as total_clicks
            FROM public.advertisements a
            JOIN public.ad_revenue_records arr ON a.id = arr.ad_id
            WHERE arr.date BETWEEN date_from AND date_to
            GROUP BY a.id, a.ad_title, a.ad_placement_zone
            ORDER BY total_revenue DESC
            LIMIT limit_param
        ) t;
    ELSIF metric_param = 'ctr' THEN
        SELECT jsonb_agg(row_to_json(t))
        INTO ads_data
        FROM (
            SELECT 
                a.id,
                a.ad_title,
                a.ad_placement_zone,
                SUM(arr.impressions) as total_impressions,
                SUM(arr.clicks) as total_clicks,
                CASE 
                    WHEN SUM(arr.impressions) > 0 THEN 
                        ROUND((SUM(arr.clicks)::DECIMAL / SUM(arr.impressions)::DECIMAL) * 100, 2)
                    ELSE 0
                END as ctr
            FROM public.advertisements a
            JOIN public.ad_revenue_records arr ON a.id = arr.ad_id
            WHERE arr.date BETWEEN date_from AND date_to
            GROUP BY a.id, a.ad_title, a.ad_placement_zone
            HAVING SUM(arr.impressions) > 100 -- Minimum impressions for meaningful CTR
            ORDER BY ctr DESC
            LIMIT limit_param
        ) t;
    ELSIF metric_param = 'impressions' THEN
        SELECT jsonb_agg(row_to_json(t))
        INTO ads_data
        FROM (
            SELECT 
                a.id,
                a.ad_title,
                a.ad_placement_zone,
                SUM(arr.impressions) as total_impressions
            FROM public.advertisements a
            JOIN public.ad_revenue_records arr ON a.id = arr.ad_id
            WHERE arr.date BETWEEN date_from AND date_to
            GROUP BY a.id, a.ad_title, a.ad_placement_zone
            ORDER BY total_impressions DESC
            LIMIT limit_param
        ) t;
    ELSE -- clicks
        SELECT jsonb_agg(row_to_json(t))
        INTO ads_data
        FROM (
            SELECT 
                a.id,
                a.ad_title,
                a.ad_placement_zone,
                SUM(arr.clicks) as total_clicks
            FROM public.advertisements a
            JOIN public.ad_revenue_records arr ON a.id = arr.ad_id
            WHERE arr.date BETWEEN date_from AND date_to
            GROUP BY a.id, a.ad_title, a.ad_placement_zone
            ORDER BY total_clicks DESC
            LIMIT limit_param
        ) t;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'data', COALESCE(ads_data, '[]'::jsonb),
        'metric', metric_param,
        'date_from', date_from,
        'date_to', date_to
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Aggregate daily ad revenue (run daily via cron)
CREATE OR REPLACE FUNCTION public.aggregate_daily_ad_revenue(
    target_date DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    aggregated_count INTEGER;
BEGIN
    -- Use yesterday if no date provided
    target_date := COALESCE(target_date, CURRENT_DATE - INTERVAL '1 day');
    
    -- Insert or update daily revenue records
    INSERT INTO public.ad_revenue_records (
        date,
        ad_id,
        advertiser_id,
        placement_zone,
        impressions,
        clicks,
        conversions,
        revenue_amount
    )
    SELECT 
        target_date,
        id as ad_id,
        advertiser_user_id as advertiser_id,
        ad_placement_zone as placement_zone,
        impressions_count as impressions,
        clicks_count as clicks,
        conversions_count as conversions,
        total_revenue as revenue_amount
    FROM public.advertisements
    WHERE approval_status = 'active'
    AND start_date <= target_date
    AND end_date >= target_date
    ON CONFLICT (date, ad_id) DO UPDATE SET
        impressions = EXCLUDED.impressions,
        clicks = EXCLUDED.clicks,
        conversions = EXCLUDED.conversions,
        revenue_amount = EXCLUDED.revenue_amount,
        updated_at = NOW();
    
    GET DIAGNOSTICS aggregated_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'aggregated_count', aggregated_count,
        'date', target_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_ad_revenue_records_updated_at
    BEFORE UPDATE ON public.ad_revenue_records
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_advertiser_billing_updated_at
    BEFORE UPDATE ON public.advertiser_billing
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_ad_revenue_dashboard(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_advertiser_bill(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_performing_ads(TEXT, INTEGER, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aggregate_daily_ad_revenue(DATE) TO authenticated;


-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.ad_revenue_records IS 'Daily revenue aggregation by ad and placement zone';
COMMENT ON TABLE public.advertiser_billing IS 'Billing records for advertisers with payment tracking';

COMMENT ON FUNCTION public.get_ad_revenue_dashboard(DATE, DATE) IS 'Get comprehensive ad revenue dashboard with metrics';
COMMENT ON FUNCTION public.calculate_advertiser_bill(UUID, DATE, DATE) IS 'Calculate billing amount for an advertiser for a period';
COMMENT ON FUNCTION public.get_top_performing_ads(TEXT, INTEGER, DATE, DATE) IS 'Get top performing ads by revenue, CTR, impressions, or clicks';
COMMENT ON FUNCTION public.aggregate_daily_ad_revenue(DATE) IS 'Aggregate daily ad revenue (run via cron)';
