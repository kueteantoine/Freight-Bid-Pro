-- Carrier Performance Analytics Functions (Prompt 27)

-- 1. Get Transporter KPIs
CREATE OR REPLACE FUNCTION get_transporter_kpis(
    transporter_uuid UUID,
    start_date TIMESTAMPTZ DEFAULT (NOW() - INTERVAL '30 days'),
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    total_shipments INTEGER;
    total_revenue DECIMAL(15,2);
    bid_win_rate DECIMAL(5,2);
    on_time_rate DECIMAL(5,2);
    avg_rating DECIMAL(3,2);
BEGIN
    -- Total Shipments Completed (based on awarded bids for delivered shipments)
    SELECT COUNT(*)
    INTO total_shipments
    FROM public.bids b
    JOIN public.shipments s ON b.shipment_id = s.id
    WHERE b.transporter_user_id = transporter_uuid
    AND b.bid_status = 'awarded'
    AND s.status = 'delivered'
    AND s.updated_at BETWEEN start_date AND end_date;

    -- Total Revenue
    SELECT COALESCE(SUM(net_amount), 0)
    INTO total_revenue
    FROM public.transactions
    WHERE payee_user_id = transporter_uuid
    AND payment_status = 'completed'
    AND created_at BETWEEN start_date AND end_date;

    -- Bid Win Rate
    WITH bid_counts AS (
        SELECT 
            COUNT(*) as total_bids,
            COUNT(*) FILTER (WHERE bid_status = 'awarded') as won_bids
        FROM public.bids
        WHERE transporter_user_id = transporter_uuid
        AND bid_submitted_at BETWEEN start_date AND end_date
    )
    SELECT 
        CASE WHEN total_bids > 0 THEN (won_bids::DECIMAL / total_bids::DECIMAL) * 100 ELSE 0 END
    INTO bid_win_rate
    FROM bid_counts;

    -- On-Time Delivery Rate (shipments delivered on or before scheduled date)
    -- Using shipment_tracking for actual delivery time or shipment_assignments
    -- Fallback to shipments updated_at if status is delivered
    WITH delivery_stats AS (
        SELECT 
            COUNT(*) as total_delivered,
            COUNT(*) FILTER (WHERE s.updated_at <= s.scheduled_delivery_date) as on_time
        FROM public.bids b
        JOIN public.shipments s ON b.shipment_id = s.id
        WHERE b.transporter_user_id = transporter_uuid
        AND b.bid_status = 'awarded'
        AND s.status = 'delivered'
        AND s.updated_at BETWEEN start_date AND end_date
    )
    SELECT
        CASE WHEN total_delivered > 0 THEN (on_time::DECIMAL / total_delivered::DECIMAL) * 100 ELSE 0 END
    INTO on_time_rate
    FROM delivery_stats;

    -- Average Rating (Customer Satisfaction)
    SELECT COALESCE(AVG(rating_overall), 0)
    INTO avg_rating
    FROM public.ratings_reviews
    WHERE reviewed_user_id = transporter_uuid
    AND created_at BETWEEN start_date AND end_date;

    RETURN jsonb_build_object(
        'total_shipments', total_shipments,
        'total_revenue', total_revenue,
        'bid_win_rate', bid_win_rate,
        'on_time_rate', on_time_rate,
        'avg_rating', avg_rating
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Revenue Trends
CREATE OR REPLACE FUNCTION get_revenue_trends(
    transporter_uuid UUID,
    period_type TEXT DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly'
    limit_count INTEGER DEFAULT 12
)
RETURNS JSONB AS $$
DECLARE
    trunc_period TEXT;
BEGIN
    trunc_period := CASE 
        WHEN period_type = 'daily' THEN 'day'
        WHEN period_type = 'weekly' THEN 'week'
        ELSE 'month'
    END;

    RETURN (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
            SELECT 
                DATE_TRUNC(trunc_period, created_at) as period,
                SUM(net_amount) as revenue
            FROM public.transactions
            WHERE payee_user_id = transporter_uuid
            AND payment_status = 'completed'
            GROUP BY 1
            ORDER BY 1 DESC
            LIMIT limit_count
        ) t
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get Vehicle Utilization
CREATE OR REPLACE FUNCTION get_vehicle_utilization(transporter_uuid UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
            SELECT 
                v.id,
                v.license_plate,
                v.make,
                v.model,
                v.vehicle_status,
                -- Count completed trips for this vehicle via shipment_assignments
                (
                    SELECT COUNT(*) 
                    FROM public.shipment_assignments sa 
                    WHERE sa.vehicle_id = v.id 
                    AND sa.assignment_status = 'completed'
                ) as trips_completed,
                -- Total earnings (approximate via linked shipments, hard to get exact per vehicle without more elaborate joins)
                0 as revenue_generated -- Placeholder for now
            FROM public.vehicles v
            WHERE v.transporter_user_id = transporter_uuid
        ) t
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get Driver Performance
CREATE OR REPLACE FUNCTION get_driver_performance(transporter_uuid UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
            SELECT 
                u.id as driver_id,
                u.email,
                -- Get driver name from somewhere? Auth users doesn't have name directly usually, 
                -- maybe rely on email or separate profile table if exists. 
                -- Assuming driver_profiles might exist or just use email.
                (
                    SELECT COUNT(*) 
                    FROM public.shipment_assignments sa 
                    WHERE sa.driver_user_id = u.id 
                    AND sa.assignment_status = 'completed'
                ) as trips_completed,
                 (
                    SELECT COALESCE(AVG(rating_overall), 0)
                    FROM public.ratings_reviews rr
                    WHERE rr.reviewed_user_id = u.id
                ) as avg_rating
            FROM public.driver_assignments da
            JOIN auth.users u ON da.driver_user_id = u.id
            WHERE da.transporter_user_id = transporter_uuid
            AND da.is_active = true
        ) t
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Get Route Profitability (Simplified)
CREATE OR REPLACE FUNCTION get_route_profitability(transporter_uuid UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
            SELECT 
                s.pickup_location as origin,
                s.delivery_location as destination,
                COUNT(*) as trip_count,
                AVG(b.bid_amount) as avg_revenue
            FROM public.bids b
            JOIN public.shipments s ON b.shipment_id = s.id
            WHERE b.transporter_user_id = transporter_uuid
            AND b.bid_status = 'awarded'
            GROUP BY 1, 2
            ORDER BY 4 DESC
            LIMIT 10
        ) t
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
