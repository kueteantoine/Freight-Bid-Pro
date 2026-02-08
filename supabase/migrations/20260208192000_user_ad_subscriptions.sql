-- Migration: User Advertisement Subscriptions (IDEMPOTENT VERSION)
-- Date: 2026-02-08
-- Purpose: Enable internal users to subscribe to promotional tiers with admin-configurable pricing
-- This version can be safely re-run multiple times

-- =====================================================
-- DROP EXISTING POLICIES (IF ANY)
-- =====================================================

DROP POLICY IF EXISTS "Public View Active Tiers" ON public.ad_subscription_tiers;
DROP POLICY IF EXISTS "Admin Manage Tiers" ON public.ad_subscription_tiers;
DROP POLICY IF EXISTS "Users View Own Subscriptions" ON public.user_ad_subscriptions;
DROP POLICY IF EXISTS "Users Create Own Subscriptions" ON public.user_ad_subscriptions;
DROP POLICY IF EXISTS "Users Update Own Subscriptions" ON public.user_ad_subscriptions;
DROP POLICY IF EXISTS "Admin View All Subscriptions" ON public.user_ad_subscriptions;

-- =====================================================
-- SUBSCRIPTION TIERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ad_subscription_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name TEXT NOT NULL UNIQUE,
    tier_slug TEXT NOT NULL UNIQUE,
    tier_description TEXT,
    monthly_price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XAF',
    visibility_multiplier INTEGER NOT NULL DEFAULT 1,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active tiers ordered by display
CREATE INDEX IF NOT EXISTS idx_active_tiers 
ON public.ad_subscription_tiers(display_order) 
WHERE is_active = true;

-- =====================================================
-- USER SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_ad_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES public.ad_subscription_tiers(id) ON DELETE RESTRICT,
    subscription_status TEXT NOT NULL DEFAULT 'active',
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    payment_method TEXT,
    payment_reference TEXT,
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user 
ON public.user_ad_subscriptions(user_id, subscription_status);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier 
ON public.user_ad_subscriptions(tier_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_billing 
ON public.user_ad_subscriptions(next_billing_date) 
WHERE subscription_status = 'active' AND auto_renew = true;

-- =====================================================
-- USER AD ELIGIBILITY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_user_ad_eligibility(
    user_id_param UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    target_user_id UUID;
    user_rating DECIMAL;
    completed_shipments INTEGER;
    account_age_days INTEGER;
    active_disputes INTEGER;
    is_eligible BOOLEAN := true;
    reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
    target_user_id := COALESCE(user_id_param, auth.uid());
    
    IF target_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'eligible', false,
            'reasons', ARRAY['Not authenticated']
        );
    END IF;
    
    SELECT COALESCE(average_rating, 0) INTO user_rating
    FROM public.user_profiles
    WHERE user_id = target_user_id;
    
    IF user_rating < 4.0 THEN
        is_eligible := false;
        reasons := array_append(reasons, 'Minimum 4.0 star rating required (current: ' || ROUND(user_rating, 1) || ')');
    END IF;
    
    SELECT COUNT(*) INTO completed_shipments
    FROM public.shipments
    WHERE (shipper_id = target_user_id OR transporter_id = target_user_id)
    AND status = 'delivered';
    
    IF completed_shipments < 20 THEN
        is_eligible := false;
        reasons := array_append(reasons, 'Minimum 20 completed shipments required (current: ' || completed_shipments || ')');
    END IF;
    
    SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER INTO account_age_days
    FROM public.user_profiles
    WHERE user_id = target_user_id;
    
    IF account_age_days < 30 THEN
        is_eligible := false;
        reasons := array_append(reasons, 'Account must be at least 30 days old (current: ' || account_age_days || ' days)');
    END IF;
    
    SELECT COUNT(*) INTO active_disputes
    FROM public.disputes
    WHERE (complainant_id = target_user_id OR respondent_id = target_user_id)
    AND status IN ('open', 'under_review');
    
    IF active_disputes > 0 THEN
        is_eligible := false;
        reasons := array_append(reasons, 'No active disputes allowed (current: ' || active_disputes || ')');
    END IF;
    
    RETURN jsonb_build_object(
        'eligible', is_eligible,
        'reasons', reasons,
        'metrics', jsonb_build_object(
            'rating', user_rating,
            'completed_shipments', completed_shipments,
            'account_age_days', account_age_days,
            'active_disputes', active_disputes
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GET ACTIVE SUBSCRIPTION FOR USER
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_active_subscription(
    user_id_param UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    target_user_id UUID;
    subscription_data JSONB;
BEGIN
    target_user_id := COALESCE(user_id_param, auth.uid());
    
    SELECT jsonb_build_object(
        'subscription_id', s.id,
        'tier_id', s.tier_id,
        'tier_name', t.tier_name,
        'tier_slug', t.tier_slug,
        'visibility_multiplier', t.visibility_multiplier,
        'features', t.features,
        'subscription_status', s.subscription_status,
        'start_date', s.start_date,
        'end_date', s.end_date,
        'next_billing_date', s.next_billing_date,
        'auto_renew', s.auto_renew
    )
    INTO subscription_data
    FROM public.user_ad_subscriptions s
    JOIN public.ad_subscription_tiers t ON s.tier_id = t.id
    WHERE s.user_id = target_user_id
    AND s.subscription_status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(subscription_data, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CONFIRM AD SUBSCRIPTION PAYMENT
-- =====================================================

CREATE OR REPLACE FUNCTION public.confirm_ad_subscription_payment(
    p_subscription_id UUID,
    p_aggregator_tx_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_subscription RECORD;
    v_tier RECORD;
BEGIN
    -- 1. Get subscription and tier info
    SELECT s.*, t.monthly_price INTO v_subscription
    FROM public.user_ad_subscriptions s
    JOIN public.ad_subscription_tiers t ON s.tier_id = t.id
    WHERE s.id = p_subscription_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Subscription not found');
    END IF;

    IF v_subscription.subscription_status = 'active' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Subscription already active');
    END IF;

    -- 2. Update subscription status
    UPDATE public.user_ad_subscriptions
    SET 
        subscription_status = 'active',
        payment_reference = p_aggregator_tx_id,
        start_date = NOW(),
        end_date = NOW() + INTERVAL '30 days',
        next_billing_date = NOW() + INTERVAL '30 days',
        updated_at = NOW()
    WHERE id = p_subscription_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.ad_subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ad_subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscription Tiers Policies
CREATE POLICY "Public View Active Tiers"
ON public.ad_subscription_tiers
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin Manage Tiers"
ON public.ad_subscription_tiers
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_type = 'admin'
    )
);

-- User Subscriptions Policies
CREATE POLICY "Users View Own Subscriptions"
ON public.user_ad_subscriptions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users Create Own Subscriptions"
ON public.user_ad_subscriptions
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users Update Own Subscriptions"
ON public.user_ad_subscriptions
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admin View All Subscriptions"
ON public.user_ad_subscriptions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_type = 'admin'
    )
);

-- =====================================================
-- SEED DEFAULT TIERS (IDEMPOTENT)
-- =====================================================

INSERT INTO public.ad_subscription_tiers (tier_name, tier_slug, tier_description, monthly_price, visibility_multiplier, features, display_order)
VALUES
(
    'Bronze',
    'bronze',
    'Featured profile badge with 2x visibility boost',
    25000,
    2,
    '{
        "analytics_level": "basic",
        "placement_priority": "profile",
        "support_tier": "email",
        "max_active_ads": 3,
        "api_access": false
    }'::jsonb,
    1
),
(
    'Silver',
    'silver',
    'Top 3 placement with priority notifications and detailed analytics',
    75000,
    5,
    '{
        "analytics_level": "detailed",
        "placement_priority": "top_3",
        "support_tier": "priority",
        "max_active_ads": 10,
        "api_access": false
    }'::jsonb,
    2
),
(
    'Gold',
    'gold',
    'Homepage feature with dedicated support and API access',
    200000,
    10,
    '{
        "analytics_level": "advanced",
        "placement_priority": "homepage",
        "support_tier": "dedicated",
        "max_active_ads": 50,
        "api_access": true
    }'::jsonb,
    3
)
ON CONFLICT (tier_slug) DO UPDATE SET
    tier_name = EXCLUDED.tier_name,
    tier_description = EXCLUDED.tier_description,
    monthly_price = EXCLUDED.monthly_price,
    visibility_multiplier = EXCLUDED.visibility_multiplier,
    features = EXCLUDED.features,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.check_user_ad_eligibility(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_active_subscription(UUID) TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.ad_subscription_tiers IS 'Admin-configurable subscription tiers for user advertisements';
COMMENT ON TABLE public.user_ad_subscriptions IS 'Tracks user subscriptions to advertisement tiers';
COMMENT ON FUNCTION public.check_user_ad_eligibility(UUID) IS 'Checks if user meets requirements to advertise (rating, shipments, account age, disputes)';
COMMENT ON FUNCTION public.get_user_active_subscription(UUID) IS 'Returns user''s active subscription with tier details';
