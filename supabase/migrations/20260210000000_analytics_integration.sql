-- Analytics Integration Schema and RPC Functions
-- Prompt 56 Implementation

-- ============================================================================
-- TABLES
-- ============================================================================

-- Core event tracking table
CREATE TABLE IF NOT EXISTS public.platform_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_category TEXT NOT NULL CHECK (event_category IN (
        'navigation', 'engagement', 'conversion', 'error', 'performance'
    )),
    event_data JSONB DEFAULT '{}'::jsonb,
    page_url TEXT,
    referrer_url TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_platform_events_user_created
    ON public.platform_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_events_name_created
    ON public.platform_events(event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_events_category_created
    ON public.platform_events(event_category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_events_session
    ON public.platform_events(session_id);

CREATE INDEX IF NOT EXISTS idx_platform_events_created
    ON public.platform_events(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own events
CREATE POLICY platform_events_insert_own ON public.platform_events
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Admin users can read all events (via RPC with SECURITY DEFINER)
-- Direct table read is restricted to own events only
CREATE POLICY platform_events_select_own ON public.platform_events
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================================
-- RPC: RECORD EVENTS (BULK INSERT)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.record_platform_events(
    p_events JSONB
)
RETURNS INT AS $$
DECLARE
    inserted_count INT := 0;
    event_record JSONB;
BEGIN
    FOR event_record IN SELECT * FROM jsonb_array_elements(p_events)
    LOOP
        INSERT INTO public.platform_events (
            user_id,
            session_id,
            event_name,
            event_category,
            event_data,
            page_url,
            referrer_url,
            user_agent,
            created_at
        ) VALUES (
            (event_record->>'user_id')::UUID,
            event_record->>'session_id',
            event_record->>'event_name',
            event_record->>'event_category',
            COALESCE(event_record->'event_data', '{}'::jsonb),
            event_record->>'page_url',
            event_record->>'referrer_url',
            event_record->>'user_agent',
            COALESCE((event_record->>'created_at')::TIMESTAMPTZ, NOW())
        );
        inserted_count := inserted_count + 1;
    END LOOP;

    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: USER ENGAGEMENT METRICS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_engagement_metrics(
    p_date_range TEXT DEFAULT '30_days'
)
RETURNS JSONB AS $$
DECLARE
    start_date TIMESTAMPTZ;
    prev_start_date TIMESTAMPTZ;
    result JSONB;
BEGIN
    IF p_date_range = '7_days' THEN
        start_date := NOW() - INTERVAL '7 days';
        prev_start_date := NOW() - INTERVAL '14 days';
    ELSIF p_date_range = '90_days' THEN
        start_date := NOW() - INTERVAL '90 days';
        prev_start_date := NOW() - INTERVAL '180 days';
    ELSIF p_date_range = 'ytd' THEN
        start_date := DATE_TRUNC('year', NOW());
        prev_start_date := DATE_TRUNC('year', NOW()) - INTERVAL '1 year';
    ELSE
        start_date := NOW() - INTERVAL '30 days';
        prev_start_date := NOW() - INTERVAL '60 days';
    END IF;

    SELECT jsonb_build_object(
        'daily_active_users', (
            SELECT COUNT(DISTINCT user_id)
            FROM public.platform_events
            WHERE created_at >= CURRENT_DATE
            AND user_id IS NOT NULL
        ),
        'weekly_active_users', (
            SELECT COUNT(DISTINCT user_id)
            FROM public.platform_events
            WHERE created_at >= DATE_TRUNC('week', NOW())
            AND user_id IS NOT NULL
        ),
        'monthly_active_users', (
            SELECT COUNT(DISTINCT user_id)
            FROM public.platform_events
            WHERE created_at >= DATE_TRUNC('month', NOW())
            AND user_id IS NOT NULL
        ),
        'total_events', (
            SELECT COUNT(*)
            FROM public.platform_events
            WHERE created_at >= start_date
        ),
        'unique_sessions', (
            SELECT COUNT(DISTINCT session_id)
            FROM public.platform_events
            WHERE created_at >= start_date
        ),
        'avg_events_per_session', (
            SELECT ROUND(AVG(event_count), 1)
            FROM (
                SELECT session_id, COUNT(*) AS event_count
                FROM public.platform_events
                WHERE created_at >= start_date
                GROUP BY session_id
            ) session_counts
        ),
        'dau_trend', (
            SELECT COALESCE(jsonb_agg(daily_data ORDER BY date), '[]'::jsonb)
            FROM (
                SELECT
                    DATE_TRUNC('day', created_at)::DATE AS date,
                    COUNT(DISTINCT user_id) AS active_users,
                    COUNT(DISTINCT session_id) AS sessions,
                    COUNT(*) AS events
                FROM public.platform_events
                WHERE created_at >= start_date
                AND user_id IS NOT NULL
                GROUP BY DATE_TRUNC('day', created_at)::DATE
            ) daily_data
        ),
        'events_by_category', (
            SELECT COALESCE(jsonb_object_agg(event_category, count), '{}'::jsonb)
            FROM (
                SELECT event_category, COUNT(*) AS count
                FROM public.platform_events
                WHERE created_at >= start_date
                GROUP BY event_category
            ) category_counts
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: CONVERSION FUNNEL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_conversion_funnel(
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
    ELSIF p_date_range = 'ytd' THEN
        start_date := DATE_TRUNC('year', NOW());
    ELSE
        start_date := NOW() - INTERVAL '30 days';
    END IF;

    SELECT jsonb_build_object(
        'steps', jsonb_build_array(
            jsonb_build_object(
                'name', 'Registration Started',
                'event_name', 'registration_started',
                'count', (
                    SELECT COUNT(DISTINCT user_id)
                    FROM public.platform_events
                    WHERE event_name = 'registration_started'
                    AND created_at >= start_date
                )
            ),
            jsonb_build_object(
                'name', 'Registration Completed',
                'event_name', 'registration_completed',
                'count', (
                    SELECT COUNT(DISTINCT user_id)
                    FROM public.platform_events
                    WHERE event_name = 'registration_completed'
                    AND created_at >= start_date
                )
            ),
            jsonb_build_object(
                'name', 'Profile Completed',
                'event_name', 'profile_completed',
                'count', (
                    SELECT COUNT(DISTINCT user_id)
                    FROM public.platform_events
                    WHERE event_name = 'profile_completed'
                    AND created_at >= start_date
                )
            ),
            jsonb_build_object(
                'name', 'First Shipment Created',
                'event_name', 'shipment_created',
                'count', (
                    SELECT COUNT(DISTINCT user_id)
                    FROM public.platform_events
                    WHERE event_name = 'shipment_created'
                    AND created_at >= start_date
                )
            ),
            jsonb_build_object(
                'name', 'First Bid Submitted',
                'event_name', 'bid_submitted',
                'count', (
                    SELECT COUNT(DISTINCT user_id)
                    FROM public.platform_events
                    WHERE event_name = 'bid_submitted'
                    AND created_at >= start_date
                )
            ),
            jsonb_build_object(
                'name', 'Payment Completed',
                'event_name', 'payment_completed',
                'count', (
                    SELECT COUNT(DISTINCT user_id)
                    FROM public.platform_events
                    WHERE event_name = 'payment_completed'
                    AND created_at >= start_date
                )
            )
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: FEATURE USAGE STATS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_feature_usage_stats(
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
    ELSIF p_date_range = 'ytd' THEN
        start_date := DATE_TRUNC('year', NOW());
    ELSE
        start_date := NOW() - INTERVAL '30 days';
    END IF;

    RETURN (
        SELECT COALESCE(jsonb_agg(feature_data), '[]'::jsonb)
        FROM (
            SELECT
                event_name AS feature,
                COUNT(*) AS total_uses,
                COUNT(DISTINCT user_id) AS unique_users,
                COUNT(DISTINCT session_id) AS unique_sessions
            FROM public.platform_events
            WHERE created_at >= start_date
            AND event_category IN ('engagement', 'conversion')
            GROUP BY event_name
            ORDER BY total_uses DESC
            LIMIT 20
        ) feature_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: EVENT TRENDS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_event_trends(
    p_date_range TEXT DEFAULT '30_days',
    p_category TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    start_date TIMESTAMPTZ;
BEGIN
    IF p_date_range = '7_days' THEN
        start_date := NOW() - INTERVAL '7 days';
    ELSIF p_date_range = '90_days' THEN
        start_date := NOW() - INTERVAL '90 days';
    ELSIF p_date_range = 'ytd' THEN
        start_date := DATE_TRUNC('year', NOW());
    ELSE
        start_date := NOW() - INTERVAL '30 days';
    END IF;

    RETURN (
        SELECT COALESCE(jsonb_agg(trend_data ORDER BY date), '[]'::jsonb)
        FROM (
            SELECT
                DATE_TRUNC('day', created_at)::DATE AS date,
                event_category AS category,
                COUNT(*) AS count
            FROM public.platform_events
            WHERE created_at >= start_date
            AND (p_category IS NULL OR event_category = p_category)
            GROUP BY DATE_TRUNC('day', created_at)::DATE, event_category
        ) trend_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: PERFORMANCE METRICS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_performance_metrics(
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
        'avg_page_load_ms', (
            SELECT ROUND(AVG((event_data->>'duration')::NUMERIC), 0)
            FROM public.platform_events
            WHERE event_name = 'page_load'
            AND created_at >= start_date
        ),
        'p95_page_load_ms', (
            SELECT ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (event_data->>'duration')::NUMERIC), 0)
            FROM public.platform_events
            WHERE event_name = 'page_load'
            AND created_at >= start_date
            AND event_data->>'duration' IS NOT NULL
        ),
        'avg_api_response_ms', (
            SELECT ROUND(AVG((event_data->>'duration')::NUMERIC), 0)
            FROM public.platform_events
            WHERE event_name = 'api_response_time'
            AND created_at >= start_date
        ),
        'error_rate', (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE event_category = 'error')::DECIMAL /
                 NULLIF(COUNT(*), 0) * 100), 2
            )
            FROM public.platform_events
            WHERE created_at >= start_date
        ),
        'page_load_trend', (
            SELECT COALESCE(jsonb_agg(trend_data ORDER BY date), '[]'::jsonb)
            FROM (
                SELECT
                    DATE_TRUNC('day', created_at)::DATE AS date,
                    ROUND(AVG((event_data->>'duration')::NUMERIC), 0) AS avg_ms,
                    COUNT(*) AS samples
                FROM public.platform_events
                WHERE event_name = 'page_load'
                AND created_at >= start_date
                AND event_data->>'duration' IS NOT NULL
                GROUP BY DATE_TRUNC('day', created_at)::DATE
            ) trend_data
        ),
        'api_response_trend', (
            SELECT COALESCE(jsonb_agg(trend_data ORDER BY date), '[]'::jsonb)
            FROM (
                SELECT
                    DATE_TRUNC('day', created_at)::DATE AS date,
                    ROUND(AVG((event_data->>'duration')::NUMERIC), 0) AS avg_ms,
                    COUNT(*) AS samples
                FROM public.platform_events
                WHERE event_name = 'api_response_time'
                AND created_at >= start_date
                AND event_data->>'duration' IS NOT NULL
                GROUP BY DATE_TRUNC('day', created_at)::DATE
            ) trend_data
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: ERROR ANALYTICS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_error_analytics(
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
        'total_errors', (
            SELECT COUNT(*)
            FROM public.platform_events
            WHERE event_category = 'error'
            AND created_at >= start_date
        ),
        'errors_today', (
            SELECT COUNT(*)
            FROM public.platform_events
            WHERE event_category = 'error'
            AND created_at >= CURRENT_DATE
        ),
        'top_errors', (
            SELECT COALESCE(jsonb_agg(error_data), '[]'::jsonb)
            FROM (
                SELECT
                    event_name AS error_type,
                    COALESCE(event_data->>'message', 'Unknown') AS message,
                    COUNT(*) AS occurrences,
                    COUNT(DISTINCT user_id) AS affected_users,
                    MAX(created_at) AS last_seen
                FROM public.platform_events
                WHERE event_category = 'error'
                AND created_at >= start_date
                GROUP BY event_name, event_data->>'message'
                ORDER BY occurrences DESC
                LIMIT 10
            ) error_data
        ),
        'error_trend', (
            SELECT COALESCE(jsonb_agg(trend_data ORDER BY date), '[]'::jsonb)
            FROM (
                SELECT
                    DATE_TRUNC('day', created_at)::DATE AS date,
                    COUNT(*) AS count,
                    COUNT(DISTINCT event_name) AS unique_errors
                FROM public.platform_events
                WHERE event_category = 'error'
                AND created_at >= start_date
                GROUP BY DATE_TRUNC('day', created_at)::DATE
            ) trend_data
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.record_platform_events(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_engagement_metrics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversion_funnel(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_feature_usage_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_trends(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_performance_metrics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_error_analytics(TEXT) TO authenticated;
