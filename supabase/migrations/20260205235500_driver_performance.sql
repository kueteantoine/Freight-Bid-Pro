-- Migration: Driver Performance Dashboard & Ratings (Prompt 38)

-- 1. Create RATINGS_REVIEWS table (Core table for feedback)
CREATE TABLE IF NOT EXISTS public.ratings_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewer_role public.role_type_enum NOT NULL,
    rating_overall INTEGER CHECK (rating_overall BETWEEN 1 AND 5),
    rating_timeliness INTEGER CHECK (rating_timeliness BETWEEN 1 AND 5),
    rating_communication INTEGER CHECK (rating_communication BETWEEN 1 AND 5),
    rating_condition INTEGER CHECK (rating_condition BETWEEN 1 AND 5),
    review_text TEXT,
    review_status TEXT DEFAULT 'published' CHECK (review_status IN ('pending', 'published', 'flagged')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching reviews for a user
CREATE INDEX IF NOT EXISTS idx_ratings_reviews_reviewed ON public.ratings_reviews(reviewed_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_reviews_shipment ON public.ratings_reviews(shipment_id);

-- RLS
ALTER TABLE public.ratings_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published reviews"
    ON public.ratings_reviews FOR SELECT
    USING (review_status = 'published');

CREATE POLICY "Users can create reviews for shipments they were involved in"
    ON public.ratings_reviews FOR INSERT
    WITH CHECK (
        auth.uid() = reviewer_user_id AND
        EXISTS (
            SELECT 1 FROM public.shipments s
            WHERE s.id = shipment_id AND
            (s.shipper_user_id = auth.uid() OR s.assigned_transporter_user_id = auth.uid() OR s.assigned_driver_user_id = auth.uid())
        )
    );

-- 2. Create DRIVER_ACHIEVEMENTS table (Milestones & Badges)
CREATE TABLE IF NOT EXISTS public.driver_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL, -- e.g., 'trips_milestone', 'rating_milestone', 'perfect_month'
    achievement_key TEXT NOT NULL, -- e.g., 'trips_100', 'rating_5_star', 'on_time_champion'
    title TEXT NOT NULL,
    description TEXT,
    badge_icon TEXT, -- URL or icon name
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_driver_achievements_driver ON public.driver_achievements(driver_user_id);

-- RLS
ALTER TABLE public.driver_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their own achievements"
    ON public.driver_achievements FOR SELECT
    USING (auth.uid() = driver_user_id);

-- 3. Create DRIVER_GOALS table (Personal targets)
CREATE TABLE IF NOT EXISTS public.driver_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL, -- 'earnings', 'trips', 'rating', 'distance'
    target_value DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_goals_driver ON public.driver_goals(driver_user_id);

-- RLS
ALTER TABLE public.driver_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can manage their own goals"
    ON public.driver_goals FOR ALL
    USING (auth.uid() = driver_user_id);

-- 4. Helper function to get Driver Statistics (Extreme values & metrics)
CREATE OR REPLACE FUNCTION get_driver_stats_extremes(driver_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    longest_trip DECIMAL(10,2);
    highest_earning_trip DECIMAL(15,2);
    most_frequent_route TEXT;
BEGIN
    -- Longest trip (placeholder as we don't have distance storage in shipment yet, using approx based on some metric or just NULL)
    longest_trip := NULL; 

    -- Highest earning trip
    SELECT MAX(amount) INTO highest_earning_trip
    FROM public.driver_payments
    WHERE driver_user_id = driver_uuid AND payment_status = 'completed';

    -- Most frequent route (Simplified)
    SELECT pickup_location || ' to ' || delivery_location INTO most_frequent_route
    FROM public.shipments s
    JOIN public.shipment_assignments sa ON s.id = sa.shipment_id
    WHERE sa.driver_user_id = driver_uuid
    GROUP BY pickup_location, delivery_location
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    RETURN jsonb_build_object(
        'longest_trip', COALESCE(longest_trip, 0),
        'highest_earning_trip', COALESCE(highest_earning_trip, 0),
        'most_frequent_route', COALESCE(most_frequent_route, 'None')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger for updated_at
CREATE TRIGGER update_driver_goals_updated_at BEFORE UPDATE ON public.driver_goals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
