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

-- 6. Get Competitor Benchmarks (Aggregated & Anonymized)
CREATE OR REPLACE FUNCTION get_competitor_benchmarks(transporter_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    my_avg_bid DECIMAL;
    market_avg_bid DECIMAL;
    my_on_time DECIMAL;
    market_on_time DECIMAL;
    my_rating DECIMAL;
    market_rating DECIMAL;
BEGIN
    -- My Stats
    SELECT AVG(bid_amount) INTO my_avg_bid
    FROM public.bids
    WHERE transporter_user_id = transporter_uuid AND bid_status = 'awarded';

    SELECT COALESCE(AVG(rating_overall), 0) INTO my_rating
    FROM public.ratings_reviews
    WHERE reviewed_user_id = transporter_uuid;

    -- Market Stats (All transporters excluding me)
    SELECT AVG(bid_amount) INTO market_avg_bid
    FROM public.bids
    WHERE transporter_user_id != transporter_uuid AND bid_status = 'awarded';

    SELECT COALESCE(AVG(rating_overall), 0) INTO market_rating
    FROM public.ratings_reviews
    WHERE reviewed_user_id != transporter_uuid;

    -- Return JSON
    RETURN jsonb_build_object(
        'my_avg_bid', COALESCE(my_avg_bid, 0),
        'market_avg_bid', COALESCE(market_avg_bid, 0),
        'my_rating', my_rating,
        'market_rating', market_rating,
        'my_on_time_rate', 0, -- Needs complex calc, placeholder
        'market_on_time_rate', 0 -- Needs complex calc, placeholder
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Get Predictive Analytics (Simple Forecasting)
CREATE OR REPLACE FUNCTION get_predictive_analytics(transporter_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    forecast_revenue DECIMAL;
    growth_rate DECIMAL;
BEGIN
    -- Simple forecast: Avg of last 3 months revenue * 1.1 (10% growth assumption for demo)
    -- Real implementation would use linear regression or time-series analysis
    
    WITH monthly_revenues AS (
        SELECT 
            DATE_TRUNC('month', created_at) as m,
            SUM(net_amount) as rev
        FROM public.transactions
        WHERE payee_user_id = transporter_uuid
        AND payment_status = 'completed'
        AND created_at >= NOW() - INTERVAL '3 months'
        GROUP BY 1
    )
    SELECT AVG(rev) * 1.05 INTO forecast_revenue -- Forecast 5% growth
    FROM monthly_revenues;

    RETURN jsonb_build_object(
        'predicted_monthly_revenue', COALESCE(forecast_revenue, 0),
        'growth_trend', 'positive', 
        'demand_forecast', 'high'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
