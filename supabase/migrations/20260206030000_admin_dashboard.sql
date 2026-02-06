-- Admin Dashboard RPC Functions

-- Function to get high-level dashboard stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
    active_users_count INT;
    active_shipments_count INT;
    active_bids_count INT;
    transactions_today_count INT;
    transactions_today_value DECIMAL(12,2);
    pending_verifications_count INT;
    open_disputes_count INT;
BEGIN
    -- Active Users (users with active roles)
    SELECT COUNT(DISTINCT user_id) INTO active_users_count
    FROM public.user_roles
    WHERE is_active = true;

    -- Active Shipments (open for bidding or in transit)
    SELECT COUNT(*) INTO active_shipments_count
    FROM public.shipments
    WHERE status IN ('open_for_bidding', 'bid_awarded', 'in_transit');

    -- Active Bids (active status)
    SELECT COUNT(*) INTO active_bids_count
    FROM public.bids
    WHERE bid_status = 'active';

    -- Today's Transactions
    SELECT COUNT(*), COALESCE(SUM(gross_amount), 0)
    INTO transactions_today_count, transactions_today_value
    FROM public.transactions
    WHERE created_at >= CURRENT_DATE;

    -- Pending Verifications
    SELECT COUNT(*) INTO pending_verifications_count
    FROM public.user_roles
    WHERE verification_status = 'pending';

    -- Open Disputes (using refund_requests for now as per plan)
    SELECT COUNT(*) INTO open_disputes_count
    FROM public.refund_requests
    WHERE refund_status = 'pending';

    RETURN jsonb_build_object(
        'active_users', active_users_count,
        'active_shipments', active_shipments_count,
        'active_bids', active_bids_count,
        'transactions_today_count', transactions_today_count,
        'transactions_today_value', transactions_today_value,
        'pending_verifications', pending_verifications_count,
        'open_disputes', open_disputes_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get platform analytics (user growth, revenue, etc.)
CREATE OR REPLACE FUNCTION public.get_platform_analytics(range TEXT DEFAULT '30_days')
RETURNS JSONB AS $$
DECLARE
    start_date TIMESTAMPTZ;
    user_growth JSONB;
    revenue_trends JSONB;
    shipment_trends JSONB;
BEGIN
    -- Determine date range
    IF range = '7_days' THEN
        start_date := NOW() - INTERVAL '7 days';
    ELSIF range = '90_days' THEN
        start_date := NOW() - INTERVAL '90 days';
    ELSE
        start_date := NOW() - INTERVAL '30 days';
    END IF;

    -- User Growth (by created_at)
    SELECT jsonb_agg(daily_stats) INTO user_growth
    FROM (
        SELECT 
            DATE_TRUNC('day', created_at) AS date,
            COUNT(*) AS count
        FROM auth.users
        WHERE created_at >= start_date
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
    ) daily_stats;

    -- Revenue Trends (from commission)
    SELECT jsonb_agg(daily_revenue) INTO revenue_trends
    FROM (
        SELECT 
            DATE_TRUNC('day', created_at) AS date,
            SUM(platform_commission_amount) AS amount
        FROM public.transactions
        WHERE created_at >= start_date AND payment_status = 'completed'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
    ) daily_revenue;

    -- Shipment Trends (created vs completed)
    SELECT jsonb_agg(daily_shipments) INTO shipment_trends
    FROM (
        SELECT 
            DATE_TRUNC('day', created_at) AS date,
            COUNT(*) FILTER (WHERE status != 'cancelled') AS total_created,
            COUNT(*) FILTER (WHERE status = 'delivered') AS total_completed
        FROM public.shipments
        WHERE created_at >= start_date
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
    ) daily_shipments;

    RETURN jsonb_build_object(
        'user_growth', COALESCE(user_growth, '[]'::jsonb),
        'revenue_trends', COALESCE(revenue_trends, '[]'::jsonb),
        'shipment_trends', COALESCE(shipment_trends, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get geographic analytics for heatmaps
CREATE OR REPLACE FUNCTION public.get_geographic_analytics()
RETURNS JSONB AS $$
DECLARE
    heatmap_data JSONB;
BEGIN
    SELECT jsonb_agg(loc_data) INTO heatmap_data
    FROM (
        SELECT 
            pickup_latitude AS lat,
            pickup_longitude AS lng,
            1 AS weight -- Simple weight, could be value or weight_kg
        FROM public.shipments
        WHERE pickup_latitude IS NOT NULL AND pickup_longitude IS NOT NULL
        LIMIT 1000 -- Limit for performance
    ) loc_data;

    RETURN jsonb_build_object(
        'heatmap_data', COALESCE(heatmap_data, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get recent activity feed
CREATE OR REPLACE FUNCTION public.get_recent_activity(limit_count INT DEFAULT 10)
RETURNS JSONB AS $$
DECLARE
    activity_feed JSONB;
BEGIN
    -- Union of different activity types
    SELECT jsonb_agg(activities) INTO activity_feed
    FROM (
        (
            SELECT 
                created_at AS timestamp,
                'user_registration' AS type,
                jsonb_build_object('user_id', id, 'email', email) AS details
            FROM auth.users
        )
        UNION ALL
        (
            SELECT 
                created_at AS timestamp,
                'new_shipment' AS type,
                jsonb_build_object('shipment_id', id, 'shipment_number', shipment_number) AS details
            FROM public.shipments
        )
        UNION ALL
        (
            SELECT 
                bid_submitted_at AS timestamp,
                'new_bid' AS type,
                jsonb_build_object('bid_id', id, 'amount', bid_amount) AS details
            FROM public.bids
        )
        UNION ALL
        (
            SELECT 
                created_at AS timestamp,
                'payment_completed' AS type,
                jsonb_build_object('transaction_id', id, 'amount', gross_amount) AS details
            FROM public.transactions
            WHERE payment_status = 'completed'
        )
        ORDER BY timestamp DESC
        LIMIT limit_count
    ) activities;

    RETURN COALESCE(activity_feed, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (middleware will handle role checks)
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_analytics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_geographic_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_activity(INT) TO authenticated;
