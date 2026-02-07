-- Platform Reporting & Business Intelligence Schema and RPC Functions
-- Prompt 48 Implementation

-- ============================================================================
-- TABLES
-- ============================================================================

-- Table to store saved custom report configurations
CREATE TABLE IF NOT EXISTS public.saved_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL,
    report_description TEXT,
    metrics JSONB NOT NULL, -- Array of selected metrics
    dimensions JSONB, -- Filters, date ranges, segments
    visualization_type TEXT NOT NULL, -- 'table', 'line', 'bar', 'pie', 'area'
    is_public BOOLEAN DEFAULT false, -- Share with other admins
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store scheduled automated reports
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_config_id UUID REFERENCES public.saved_reports(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL,
    frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    schedule_time TIME, -- Time of day to run
    schedule_day_of_week INT, -- 0-6 for weekly reports
    schedule_day_of_month INT, -- 1-31 for monthly reports
    recipient_emails JSONB, -- Array of email addresses
    export_format TEXT NOT NULL DEFAULT 'pdf', -- 'pdf', 'csv', 'excel'
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to track report export history
CREATE TABLE IF NOT EXISTS public.report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL,
    export_format TEXT NOT NULL,
    file_url TEXT, -- Supabase Storage URL
    file_size_bytes BIGINT,
    export_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days' -- Auto-cleanup after 7 days
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_reports_admin ON public.saved_reports(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_admin ON public.scheduled_reports(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON public.scheduled_reports(next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_report_exports_admin ON public.report_exports(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_created ON public.report_exports(created_at);

-- ============================================================================
-- RPC FUNCTIONS - REPORT BUILDER
-- ============================================================================

-- Function to generate custom report based on selected metrics
CREATE OR REPLACE FUNCTION public.generate_custom_report(
    p_metrics JSONB,
    p_dimensions JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}'::jsonb;
    date_range TEXT;
    start_date TIMESTAMPTZ;
    end_date TIMESTAMPTZ;
BEGIN
    -- Extract date range from dimensions
    date_range := COALESCE(p_dimensions->>'date_range', '30_days');
    
    IF date_range = '7_days' THEN
        start_date := NOW() - INTERVAL '7 days';
    ELSIF date_range = '90_days' THEN
        start_date := NOW() - INTERVAL '90 days';
    ELSIF date_range = 'ytd' THEN
        start_date := DATE_TRUNC('year', NOW());
    ELSE
        start_date := NOW() - INTERVAL '30 days';
    END IF;
    end_date := NOW();

    -- Build result based on selected metrics
    IF p_metrics ? 'total_revenue' THEN
        result := result || jsonb_build_object(
            'total_revenue',
            (SELECT COALESCE(SUM(platform_commission_amount), 0)
             FROM public.transactions
             WHERE created_at >= start_date AND created_at <= end_date
             AND payment_status = 'completed')
        );
    END IF;

    IF p_metrics ? 'total_shipments' THEN
        result := result || jsonb_build_object(
            'total_shipments',
            (SELECT COUNT(*)
             FROM public.shipments
             WHERE created_at >= start_date AND created_at <= end_date)
        );
    END IF;

    IF p_metrics ? 'total_users' THEN
        result := result || jsonb_build_object(
            'total_users',
            (SELECT COUNT(*)
             FROM auth.users
             WHERE created_at >= start_date AND created_at <= end_date)
        );
    END IF;

    IF p_metrics ? 'total_bids' THEN
        result := result || jsonb_build_object(
            'total_bids',
            (SELECT COUNT(*)
             FROM public.bids
             WHERE bid_submitted_at >= start_date AND bid_submitted_at <= end_date)
        );
    END IF;

    IF p_metrics ? 'revenue_trend' THEN
        result := result || jsonb_build_object(
            'revenue_trend',
            (SELECT jsonb_agg(daily_data)
             FROM (
                 SELECT 
                     DATE_TRUNC('day', created_at) AS date,
                     SUM(platform_commission_amount) AS amount
                 FROM public.transactions
                 WHERE created_at >= start_date AND created_at <= end_date
                 AND payment_status = 'completed'
                 GROUP BY DATE_TRUNC('day', created_at)
                 ORDER BY date
             ) daily_data)
        );
    END IF;

    IF p_metrics ? 'user_growth' THEN
        result := result || jsonb_build_object(
            'user_growth',
            (SELECT jsonb_agg(daily_data)
             FROM (
                 SELECT 
                     DATE_TRUNC('day', created_at) AS date,
                     COUNT(*) AS count
                 FROM auth.users
                 WHERE created_at >= start_date AND created_at <= end_date
                 GROUP BY DATE_TRUNC('day', created_at)
                 ORDER BY date
             ) daily_data)
        );
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available report templates
CREATE OR REPLACE FUNCTION public.get_report_templates()
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_array(
        jsonb_build_object(
            'id', 'user_acquisition',
            'name', 'User Acquisition Report',
            'description', 'Registration trends, conversion rates, and activation rates',
            'metrics', jsonb_build_array('total_users', 'user_growth', 'conversion_rate'),
            'icon', 'Users'
        ),
        jsonb_build_object(
            'id', 'shipment_performance',
            'name', 'Shipment Performance Report',
            'description', 'Volume, completion rates, average values, and cancellation rates',
            'metrics', jsonb_build_array('total_shipments', 'completion_rate', 'avg_value'),
            'icon', 'Package'
        ),
        jsonb_build_object(
            'id', 'financial_performance',
            'name', 'Financial Performance Report',
            'description', 'Revenue, commissions, refunds, and growth rates',
            'metrics', jsonb_build_array('total_revenue', 'revenue_trend', 'growth_rate'),
            'icon', 'DollarSign'
        ),
        jsonb_build_object(
            'id', 'carrier_leaderboard',
            'name', 'Carrier Performance Leaderboard',
            'description', 'Top carriers by volume, rating, revenue, and completion rate',
            'metrics', jsonb_build_array('top_carriers', 'carrier_ratings'),
            'icon', 'Award'
        ),
        jsonb_build_object(
            'id', 'bidding_analytics',
            'name', 'Bidding Analytics Report',
            'description', 'Average bid counts, bidding duration, award rates, and price trends',
            'metrics', jsonb_build_array('total_bids', 'avg_bids_per_shipment', 'award_rate'),
            'icon', 'TrendingUp'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save report configuration
CREATE OR REPLACE FUNCTION public.save_report_configuration(
    p_admin_user_id UUID,
    p_report_name TEXT,
    p_report_description TEXT,
    p_metrics JSONB,
    p_dimensions JSONB,
    p_visualization_type TEXT,
    p_is_public BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    new_report_id UUID;
BEGIN
    INSERT INTO public.saved_reports (
        admin_user_id,
        report_name,
        report_description,
        metrics,
        dimensions,
        visualization_type,
        is_public
    ) VALUES (
        p_admin_user_id,
        p_report_name,
        p_report_description,
        p_metrics,
        p_dimensions,
        p_visualization_type,
        p_is_public
    ) RETURNING id INTO new_report_id;

    RETURN new_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get saved reports for a user
CREATE OR REPLACE FUNCTION public.get_saved_reports(p_admin_user_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'report_name', report_name,
                'report_description', report_description,
                'metrics', metrics,
                'dimensions', dimensions,
                'visualization_type', visualization_type,
                'is_public', is_public,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ), '[]'::jsonb)
        FROM public.saved_reports
        WHERE admin_user_id = p_admin_user_id OR is_public = true
        ORDER BY created_at DESC
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC FUNCTIONS - PRE-BUILT REPORTS
-- ============================================================================

-- User Acquisition Report
CREATE OR REPLACE FUNCTION public.get_user_acquisition_report(
    p_date_range TEXT DEFAULT '30_days'
)
RETURNS JSONB AS $$
DECLARE
    start_date TIMESTAMPTZ;
    result JSONB;
BEGIN
    IF p_date_range = '7_days' THEN
        start_date := NOW() - INTERVAL '7 days';
    ELSIF p_date_range = '90_days' THEN
        start_date := NOW() - INTERVAL '90 days';
    ELSE
        start_date := NOW() - INTERVAL '30 days';
    END IF;

    SELECT jsonb_build_object(
        'total_registrations', (
            SELECT COUNT(*) FROM auth.users WHERE created_at >= start_date
        ),
        'registration_trend', (
            SELECT jsonb_agg(daily_stats)
            FROM (
                SELECT 
                    DATE_TRUNC('day', created_at) AS date,
                    COUNT(*) AS count
                FROM auth.users
                WHERE created_at >= start_date
                GROUP BY DATE_TRUNC('day', created_at)
                ORDER BY date
            ) daily_stats
        ),
        'by_role', (
            SELECT jsonb_object_agg(role_type, count)
            FROM (
                SELECT 
                    ur.role_type,
                    COUNT(DISTINCT ur.user_id) AS count
                FROM public.user_roles ur
                JOIN auth.users u ON u.id = ur.user_id
                WHERE u.created_at >= start_date
                GROUP BY ur.role_type
            ) role_stats
        ),
        'activation_rate', (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE ur.is_active = true)::DECIMAL / 
                 NULLIF(COUNT(*), 0) * 100), 2
            )
            FROM auth.users u
            LEFT JOIN public.user_roles ur ON ur.user_id = u.id
            WHERE u.created_at >= start_date
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Shipment Performance Report
CREATE OR REPLACE FUNCTION public.get_shipment_performance_report(
    p_date_range TEXT DEFAULT '30_days'
)
RETURNS JSONB AS $$
DECLARE
    start_date TIMESTAMPTZ;
    result JSONB;
BEGIN
    IF p_date_range = '7_days' THEN
        start_date := NOW() - INTERVAL '7 days';
    ELSIF p_date_range = '90_days' THEN
        start_date := NOW() - INTERVAL '90 days';
    ELSE
        start_date := NOW() - INTERVAL '30 days';
    END IF;

    SELECT jsonb_build_object(
        'total_shipments', (
            SELECT COUNT(*) FROM public.shipments WHERE created_at >= start_date
        ),
        'by_status', (
            SELECT jsonb_object_agg(status, count)
            FROM (
                SELECT status, COUNT(*) AS count
                FROM public.shipments
                WHERE created_at >= start_date
                GROUP BY status
            ) status_stats
        ),
        'completion_rate', (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE status = 'delivered')::DECIMAL / 
                 NULLIF(COUNT(*), 0) * 100), 2
            )
            FROM public.shipments
            WHERE created_at >= start_date
        ),
        'cancellation_rate', (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE status = 'cancelled')::DECIMAL / 
                 NULLIF(COUNT(*), 0) * 100), 2
            )
            FROM public.shipments
            WHERE created_at >= start_date
        ),
        'volume_trend', (
            SELECT jsonb_agg(daily_stats)
            FROM (
                SELECT 
                    DATE_TRUNC('day', created_at) AS date,
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE status = 'delivered') AS completed
                FROM public.shipments
                WHERE created_at >= start_date
                GROUP BY DATE_TRUNC('day', created_at)
                ORDER BY date
            ) daily_stats
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Financial Performance Report
CREATE OR REPLACE FUNCTION public.get_financial_performance_report(
    p_date_range TEXT DEFAULT '30_days'
)
RETURNS JSONB AS $$
DECLARE
    start_date TIMESTAMPTZ;
    result JSONB;
BEGIN
    IF p_date_range = '7_days' THEN
        start_date := NOW() - INTERVAL '7 days';
    ELSIF p_date_range = '90_days' THEN
        start_date := NOW() - INTERVAL '90 days';
    ELSE
        start_date := NOW() - INTERVAL '30 days';
    END IF;

    SELECT jsonb_build_object(
        'total_revenue', (
            SELECT COALESCE(SUM(platform_commission_amount), 0)
            FROM public.transactions
            WHERE created_at >= start_date AND payment_status = 'completed'
        ),
        'total_transactions', (
            SELECT COUNT(*)
            FROM public.transactions
            WHERE created_at >= start_date AND payment_status = 'completed'
        ),
        'revenue_trend', (
            SELECT jsonb_agg(daily_stats)
            FROM (
                SELECT 
                    DATE_TRUNC('day', created_at) AS date,
                    SUM(platform_commission_amount) AS revenue,
                    COUNT(*) AS transaction_count
                FROM public.transactions
                WHERE created_at >= start_date AND payment_status = 'completed'
                GROUP BY DATE_TRUNC('day', created_at)
                ORDER BY date
            ) daily_stats
        ),
        'refunds', (
            SELECT jsonb_build_object(
                'total_count', COUNT(*),
                'total_amount', COALESCE(SUM(
                    CASE 
                        WHEN rr.refund_type = 'full' THEN t.gross_amount
                        ELSE t.gross_amount * (rr.refund_percentage / 100)
                    END
                ), 0)
            )
            FROM public.refund_requests rr
            JOIN public.transactions t ON t.id = rr.transaction_id
            WHERE rr.requested_at >= start_date AND rr.refund_status = 'completed'
        ),
        'avg_transaction_value', (
            SELECT ROUND(AVG(gross_amount), 2)
            FROM public.transactions
            WHERE created_at >= start_date AND payment_status = 'completed'
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Carrier Performance Leaderboard
CREATE OR REPLACE FUNCTION public.get_carrier_performance_leaderboard(
    p_limit INT DEFAULT 10,
    p_date_range TEXT DEFAULT '30_days'
)
RETURNS JSONB AS $$
DECLARE
    start_date TIMESTAMPTZ;
BEGIN
    IF p_date_range = '7_days' THEN
        start_date := NOW() - INTERVAL '7 days';
    ELSIF p_date_range = '90_days' THEN
        start_date := NOW() - INTERVAL '90 days';
    ELSE
        start_date := NOW() - INTERVAL '30 days';
    END IF;

    RETURN (
        SELECT jsonb_agg(carrier_stats)
        FROM (
            SELECT 
                u.id AS carrier_id,
                u.email AS carrier_email,
                COUNT(DISTINCT s.id) AS total_shipments,
                COALESCE(AVG(rr.rating_overall), 0) AS avg_rating,
                SUM(t.net_amount) AS total_revenue,
                ROUND(
                    (COUNT(*) FILTER (WHERE s.status = 'delivered')::DECIMAL / 
                     NULLIF(COUNT(*), 0) * 100), 2
                ) AS completion_rate
            FROM auth.users u
            JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role_type = 'transporter'
            LEFT JOIN public.bids b ON b.carrier_user_id = u.id AND b.bid_status = 'awarded'
            LEFT JOIN public.shipments s ON s.id = b.shipment_id AND s.created_at >= start_date
            LEFT JOIN public.transactions t ON t.shipment_id = s.id AND t.payment_status = 'completed'
            LEFT JOIN public.ratings_reviews rr ON rr.reviewed_user_id = u.id
            GROUP BY u.id, u.email
            ORDER BY total_shipments DESC, avg_rating DESC
            LIMIT p_limit
        ) carrier_stats
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bidding Analytics Report
CREATE OR REPLACE FUNCTION public.get_bidding_analytics_report(
    p_date_range TEXT DEFAULT '30_days'
)
RETURNS JSONB AS $$
DECLARE
    start_date TIMESTAMPTZ;
    result JSONB;
BEGIN
    IF p_date_range = '7_days' THEN
        start_date := NOW() - INTERVAL '7 days';
    ELSIF p_date_range = '90_days' THEN
        start_date := NOW() - INTERVAL '90 days';
    ELSE
        start_date := NOW() - INTERVAL '30 days';
    END IF;

    SELECT jsonb_build_object(
        'total_bids', (
            SELECT COUNT(*) FROM public.bids WHERE bid_submitted_at >= start_date
        ),
        'avg_bids_per_shipment', (
            SELECT ROUND(AVG(bid_count), 2)
            FROM (
                SELECT COUNT(*) AS bid_count
                FROM public.bids
                WHERE bid_submitted_at >= start_date
                GROUP BY shipment_id
            ) shipment_bids
        ),
        'award_rate', (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE bid_status = 'awarded')::DECIMAL / 
                 NULLIF(COUNT(*), 0) * 100), 2
            )
            FROM public.bids
            WHERE bid_submitted_at >= start_date
        ),
        'avg_bid_amount', (
            SELECT ROUND(AVG(bid_amount), 2)
            FROM public.bids
            WHERE bid_submitted_at >= start_date
        ),
        'bid_trend', (
            SELECT jsonb_agg(daily_stats)
            FROM (
                SELECT 
                    DATE_TRUNC('day', bid_submitted_at) AS date,
                    COUNT(*) AS total_bids,
                    COUNT(*) FILTER (WHERE bid_status = 'awarded') AS awarded_bids
                FROM public.bids
                WHERE bid_submitted_at >= start_date
                GROUP BY DATE_TRUNC('day', bid_submitted_at)
                ORDER BY date
            ) daily_stats
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC FUNCTIONS - REAL-TIME ANALYTICS
-- ============================================================================

-- Live Bidding Analytics
CREATE OR REPLACE FUNCTION public.get_live_bidding_analytics()
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'active_auctions', (
            SELECT COUNT(*)
            FROM public.shipments
            WHERE status = 'open_for_bidding'
        ),
        'bids_last_hour', (
            SELECT COUNT(*)
            FROM public.bids
            WHERE bid_submitted_at >= NOW() - INTERVAL '1 hour'
        ),
        'avg_time_to_first_bid', (
            SELECT ROUND(AVG(EXTRACT(EPOCH FROM (first_bid - created_at)) / 60), 2)
            FROM (
                SELECT 
                    s.created_at,
                    MIN(b.bid_submitted_at) AS first_bid
                FROM public.shipments s
                LEFT JOIN public.bids b ON b.shipment_id = s.id
                WHERE s.created_at >= NOW() - INTERVAL '24 hours'
                GROUP BY s.id, s.created_at
                HAVING MIN(b.bid_submitted_at) IS NOT NULL
            ) first_bids
        ),
        'recent_awards', (
            SELECT jsonb_agg(award_data)
            FROM (
                SELECT 
                    s.shipment_number,
                    b.bid_amount,
                    b.bid_submitted_at
                FROM public.bids b
                JOIN public.shipments s ON s.id = b.shipment_id
                WHERE b.bid_status = 'awarded'
                AND b.bid_submitted_at >= NOW() - INTERVAL '1 hour'
                ORDER BY b.bid_submitted_at DESC
                LIMIT 10
            ) award_data
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Platform Utilization Metrics
CREATE OR REPLACE FUNCTION public.get_platform_utilization_metrics()
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'active_users_now', (
            SELECT COUNT(DISTINCT user_id)
            FROM public.user_roles
            WHERE is_active = true
        ),
        'active_shipments', (
            SELECT COUNT(*)
            FROM public.shipments
            WHERE status IN ('open_for_bidding', 'bid_awarded', 'in_transit')
        ),
        'active_bids', (
            SELECT COUNT(*)
            FROM public.bids
            WHERE bid_status = 'active'
        ),
        'transactions_today', (
            SELECT COUNT(*)
            FROM public.transactions
            WHERE created_at >= CURRENT_DATE
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Live Revenue Tracking
CREATE OR REPLACE FUNCTION public.get_live_revenue_tracking()
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'revenue_today', (
            SELECT COALESCE(SUM(platform_commission_amount), 0)
            FROM public.transactions
            WHERE created_at >= CURRENT_DATE AND payment_status = 'completed'
        ),
        'revenue_this_week', (
            SELECT COALESCE(SUM(platform_commission_amount), 0)
            FROM public.transactions
            WHERE created_at >= DATE_TRUNC('week', NOW()) AND payment_status = 'completed'
        ),
        'revenue_this_month', (
            SELECT COALESCE(SUM(platform_commission_amount), 0)
            FROM public.transactions
            WHERE created_at >= DATE_TRUNC('month', NOW()) AND payment_status = 'completed'
        ),
        'hourly_revenue', (
            SELECT jsonb_agg(hourly_data)
            FROM (
                SELECT 
                    EXTRACT(HOUR FROM created_at) AS hour,
                    SUM(platform_commission_amount) AS revenue
                FROM public.transactions
                WHERE created_at >= CURRENT_DATE AND payment_status = 'completed'
                GROUP BY EXTRACT(HOUR FROM created_at)
                ORDER BY hour
            ) hourly_data
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC FUNCTIONS - SCHEDULED REPORTS
-- ============================================================================

-- Schedule Automated Report
CREATE OR REPLACE FUNCTION public.schedule_automated_report(
    p_admin_user_id UUID,
    p_report_config_id UUID,
    p_report_name TEXT,
    p_frequency TEXT,
    p_schedule_time TIME,
    p_recipient_emails JSONB,
    p_export_format TEXT DEFAULT 'pdf',
    p_schedule_day_of_week INT DEFAULT NULL,
    p_schedule_day_of_month INT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_schedule_id UUID;
    next_run TIMESTAMPTZ;
BEGIN
    -- Calculate next run time based on frequency
    IF p_frequency = 'daily' THEN
        next_run := (CURRENT_DATE + p_schedule_time::TIME)::TIMESTAMPTZ;
        IF next_run < NOW() THEN
            next_run := next_run + INTERVAL '1 day';
        END IF;
    ELSIF p_frequency = 'weekly' THEN
        next_run := DATE_TRUNC('week', NOW()) + (p_schedule_day_of_week || ' days')::INTERVAL + p_schedule_time::TIME;
        IF next_run < NOW() THEN
            next_run := next_run + INTERVAL '1 week';
        END IF;
    ELSIF p_frequency = 'monthly' THEN
        next_run := DATE_TRUNC('month', NOW()) + ((p_schedule_day_of_month - 1) || ' days')::INTERVAL + p_schedule_time::TIME;
        IF next_run < NOW() THEN
            next_run := (DATE_TRUNC('month', NOW()) + INTERVAL '1 month') + ((p_schedule_day_of_month - 1) || ' days')::INTERVAL + p_schedule_time::TIME;
        END IF;
    END IF;

    INSERT INTO public.scheduled_reports (
        admin_user_id,
        report_config_id,
        report_name,
        frequency,
        schedule_time,
        schedule_day_of_week,
        schedule_day_of_month,
        recipient_emails,
        export_format,
        next_run_at
    ) VALUES (
        p_admin_user_id,
        p_report_config_id,
        p_report_name,
        p_frequency,
        p_schedule_time,
        p_schedule_day_of_week,
        p_schedule_day_of_month,
        p_recipient_emails,
        p_export_format,
        next_run
    ) RETURNING id INTO new_schedule_id;

    RETURN new_schedule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Scheduled Reports
CREATE OR REPLACE FUNCTION public.get_scheduled_reports(p_admin_user_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'report_name', report_name,
                'frequency', frequency,
                'schedule_time', schedule_time,
                'schedule_day_of_week', schedule_day_of_week,
                'schedule_day_of_month', schedule_day_of_month,
                'recipient_emails', recipient_emails,
                'export_format', export_format,
                'is_active', is_active,
                'last_run_at', last_run_at,
                'next_run_at', next_run_at,
                'created_at', created_at
            )
        ), '[]'::jsonb)
        FROM public.scheduled_reports
        WHERE admin_user_id = p_admin_user_id
        ORDER BY created_at DESC
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.generate_custom_report(JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_report_templates() TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_report_configuration(UUID, TEXT, TEXT, JSONB, JSONB, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_saved_reports(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_acquisition_report(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shipment_performance_report(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_financial_performance_report(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_carrier_performance_leaderboard(INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bidding_analytics_report(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_live_bidding_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_utilization_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_live_revenue_tracking() TO authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_automated_report(UUID, UUID, TEXT, TEXT, TIME, JSONB, TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_scheduled_reports(UUID) TO authenticated;

-- Enable RLS on new tables
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own saved reports"
    ON public.saved_reports FOR SELECT
    USING (admin_user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can insert their own saved reports"
    ON public.saved_reports FOR INSERT
    WITH CHECK (admin_user_id = auth.uid());

CREATE POLICY "Users can update their own saved reports"
    ON public.saved_reports FOR UPDATE
    USING (admin_user_id = auth.uid());

CREATE POLICY "Users can delete their own saved reports"
    ON public.saved_reports FOR DELETE
    USING (admin_user_id = auth.uid());

CREATE POLICY "Users can view their own scheduled reports"
    ON public.scheduled_reports FOR SELECT
    USING (admin_user_id = auth.uid());

CREATE POLICY "Users can insert their own scheduled reports"
    ON public.scheduled_reports FOR INSERT
    WITH CHECK (admin_user_id = auth.uid());

CREATE POLICY "Users can update their own scheduled reports"
    ON public.scheduled_reports FOR UPDATE
    USING (admin_user_id = auth.uid());

CREATE POLICY "Users can delete their own scheduled reports"
    ON public.scheduled_reports FOR DELETE
    USING (admin_user_id = auth.uid());

CREATE POLICY "Users can view their own report exports"
    ON public.report_exports FOR SELECT
    USING (admin_user_id = auth.uid());

CREATE POLICY "Users can insert their own report exports"
    ON public.report_exports FOR INSERT
    WITH CHECK (admin_user_id = auth.uid());
