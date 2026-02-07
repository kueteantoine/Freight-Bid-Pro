-- Advertisement Table Enhancements (Prompt 47 - Part 2)
-- This migration enhances the existing advertisements table with new fields
-- for placement zones, targeting, performance tracking, and approval workflow

-- =====================================================
-- ENUMS
-- =====================================================

-- Ad placement zones
DO $$ BEGIN
    CREATE TYPE ad_placement_zone AS ENUM (
        'dashboard_banner',    -- Top banner on user dashboards
        'sidebar',             -- Persistent sidebar placement
        'sponsored_listing',   -- Featured position in search results
        'email_newsletter'     -- Ads in email communications
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Advertiser types
DO $$ BEGIN
    CREATE TYPE advertiser_type AS ENUM (
        'internal_user',      -- Existing platform users (carriers/shippers)
        'external_business'   -- External B2B advertisers
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Approval status (more granular than ad_status)
DO $$ BEGIN
    CREATE TYPE ad_approval_status AS ENUM (
        'draft',              -- Being created
        'pending_approval',   -- Submitted for review
        'approved',           -- Approved but not yet active
        'rejected',           -- Rejected by admin
        'active',             -- Currently running
        'paused',             -- Temporarily paused
        'expired'             -- Past end_date
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- =====================================================
-- ALTER ADVERTISEMENTS TABLE
-- =====================================================
-- Note: The base advertisements table was created in an earlier migration
-- We're adding new columns to support enhanced functionality

-- Add placement zone
ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS ad_placement_zone ad_placement_zone;

-- Add advertiser type
ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS advertiser_type advertiser_type DEFAULT 'external_business';

-- Add approval workflow fields
ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS approval_status ad_approval_status DEFAULT 'draft';

ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS approved_by_admin_id UUID REFERENCES auth.users(id);

ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add targeting criteria (enhanced from existing target_* fields)
ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS targeting_criteria JSONB DEFAULT '{}'::jsonb;
-- Structure: { "user_roles": ["shipper", "carrier"], "regions": ["Douala", "Yaoundé"], "languages": ["fr", "en"] }

-- Add performance metrics (impressions_count and clicks_count already exist)
ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS conversions_count INTEGER DEFAULT 0;

-- Add billing fields
ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS cost_per_impression DECIMAL(10,4);

ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS cost_per_click DECIMAL(10,2);

ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12,2) DEFAULT 0;

ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'XAF';

-- Add display priority for rotation
ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS display_priority INTEGER DEFAULT 0;


-- =====================================================
-- INDEXES
-- =====================================================

-- Index for fetching ads by placement zone and status
CREATE INDEX IF NOT EXISTS idx_advertisements_placement_status 
ON public.advertisements(ad_placement_zone, approval_status) 
WHERE approval_status = 'active';

-- Index for approval queue
CREATE INDEX IF NOT EXISTS idx_advertisements_pending_approval 
ON public.advertisements(approval_status, created_at) 
WHERE approval_status = 'pending_approval';

-- Index for performance queries
CREATE INDEX IF NOT EXISTS idx_advertisements_performance 
ON public.advertisements(impressions_count DESC, clicks_count DESC);

-- Index for advertiser queries
CREATE INDEX IF NOT EXISTS idx_advertisements_advertiser 
ON public.advertisements(advertiser_user_id, approval_status);

-- Index for targeting (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_advertisements_targeting 
ON public.advertisements USING GIN (targeting_criteria);


-- =====================================================
-- RPC FUNCTIONS
-- =====================================================

-- Get ads for specific placement with targeting
CREATE OR REPLACE FUNCTION public.get_ads_for_placement(
    zone ad_placement_zone,
    user_role_param TEXT DEFAULT NULL,
    language_param TEXT DEFAULT 'en',
    limit_param INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
    ads_data JSONB;
BEGIN
    -- Get active ads for the placement zone that match targeting criteria
    SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'ad_title', ad_title,
        'ad_content', ad_content,
        'ad_image_url', ad_image_url,
        'target_url', target_url,
        'ad_type', ad_type,
        'display_priority', display_priority
    ))
    INTO ads_data
    FROM (
        SELECT *
        FROM public.advertisements
        WHERE ad_placement_zone = zone
        AND approval_status = 'active'
        AND start_date <= NOW()
        AND end_date >= NOW()
        AND (
            -- Check if targeting criteria match
            targeting_criteria = '{}'::jsonb OR
            (
                (targeting_criteria->>'user_roles' IS NULL OR 
                 targeting_criteria->'user_roles' @> to_jsonb(ARRAY[user_role_param]))
                AND
                (targeting_criteria->>'languages' IS NULL OR 
                 targeting_criteria->'languages' @> to_jsonb(ARRAY[language_param]))
            )
        )
        ORDER BY display_priority DESC, RANDOM()
        LIMIT limit_param
    ) subquery;
    
    RETURN COALESCE(ads_data, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Track ad impression
CREATE OR REPLACE FUNCTION public.track_ad_impression(
    ad_id_param UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.advertisements
    SET impressions_count = impressions_count + 1
    WHERE id = ad_id_param;
    
    -- Update revenue if cost_per_impression is set
    UPDATE public.advertisements
    SET total_revenue = total_revenue + COALESCE(cost_per_impression, 0)
    WHERE id = ad_id_param
    AND cost_per_impression IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Track ad click
CREATE OR REPLACE FUNCTION public.track_ad_click(
    ad_id_param UUID
)
RETURNS TEXT AS $$
DECLARE
    target_url_result TEXT;
BEGIN
    -- Increment click count
    UPDATE public.advertisements
    SET clicks_count = clicks_count + 1
    WHERE id = ad_id_param
    RETURNING target_url INTO target_url_result;
    
    -- Update revenue if cost_per_click is set
    UPDATE public.advertisements
    SET total_revenue = total_revenue + COALESCE(cost_per_click, 0)
    WHERE id = ad_id_param
    AND cost_per_click IS NOT NULL;
    
    RETURN target_url_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get ad performance metrics
CREATE OR REPLACE FUNCTION public.get_ad_performance_metrics(
    ad_id_param UUID,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    metrics JSONB;
    ctr DECIMAL(5,2);
BEGIN
    -- Check permission
    IF NOT public.check_admin_permission('can_view_ads') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Get ad data
    SELECT 
        impressions_count,
        clicks_count,
        conversions_count,
        total_revenue,
        currency,
        CASE 
            WHEN impressions_count > 0 THEN ROUND((clicks_count::DECIMAL / impressions_count::DECIMAL) * 100, 2)
            ELSE 0
        END as click_through_rate
    INTO metrics
    FROM public.advertisements
    WHERE id = ad_id_param;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Advertisement not found'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'data', metrics
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get pending ad approvals (for admin dashboard)
CREATE OR REPLACE FUNCTION public.get_pending_ad_approvals()
RETURNS JSONB AS $$
DECLARE
    ads_data JSONB;
BEGIN
    -- Check permission
    IF NOT public.check_admin_permission('can_approve_ads') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient permissions to approve ads'
        );
    END IF;
    
    -- Get pending ads
    SELECT jsonb_agg(jsonb_build_object(
        'id', a.id,
        'ad_title', a.ad_title,
        'ad_type', a.ad_type,
        'ad_placement_zone', a.ad_placement_zone,
        'advertiser_type', a.advertiser_type,
        'advertiser_user_id', a.advertiser_user_id,
        'ad_content', a.ad_content,
        'ad_image_url', a.ad_image_url,
        'target_url', a.target_url,
        'targeting_criteria', a.targeting_criteria,
        'pricing_model', a.pricing_model,
        'price_amount', a.price_amount,
        'start_date', a.start_date,
        'end_date', a.end_date,
        'created_at', a.created_at
    ))
    INTO ads_data
    FROM public.advertisements a
    WHERE a.approval_status = 'pending_approval'
    ORDER BY a.created_at ASC;
    
    RETURN jsonb_build_object(
        'success', true,
        'data', COALESCE(ads_data, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Approve advertisement
CREATE OR REPLACE FUNCTION public.approve_advertisement(
    ad_id_param UUID,
    notes_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
    -- Check permission
    IF NOT public.check_admin_permission('can_approve_ads') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient permissions to approve ads'
        );
    END IF;
    
    -- Update ad status
    UPDATE public.advertisements
    SET 
        approval_status = 'active',
        approved_by_admin_id = auth.uid(),
        approved_at = NOW(),
        approval_notes = notes_param
    WHERE id = ad_id_param;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Advertisement not found'
        );
    END IF;
    
    -- Log the action
    PERFORM public.log_admin_action(
        'approve_advertisement',
        'advertisement',
        ad_id_param,
        jsonb_build_object('notes', notes_param)
    );
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Reject advertisement
CREATE OR REPLACE FUNCTION public.reject_advertisement(
    ad_id_param UUID,
    reason_param TEXT
)
RETURNS JSONB AS $$
BEGIN
    -- Check permission
    IF NOT public.check_admin_permission('can_approve_ads') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient permissions to reject ads'
        );
    END IF;
    
    -- Update ad status
    UPDATE public.advertisements
    SET 
        approval_status = 'rejected',
        approved_by_admin_id = auth.uid(),
        approved_at = NOW(),
        rejection_reason = reason_param
    WHERE id = ad_id_param;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Advertisement not found'
        );
    END IF;
    
    -- Log the action
    PERFORM public.log_admin_action(
        'reject_advertisement',
        'advertisement',
        ad_id_param,
        jsonb_build_object('reason', reason_param)
    );
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Auto-expire ads past their end date
CREATE OR REPLACE FUNCTION public.expire_old_advertisements()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE public.advertisements
    SET approval_status = 'expired'
    WHERE approval_status = 'active'
    AND end_date < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_ads_for_placement(ad_placement_zone, TEXT, TEXT, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.track_ad_impression(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.track_ad_click(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_ad_performance_metrics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_ad_approvals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_advertisement(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_advertisement(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_old_advertisements() TO authenticated;


-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN public.advertisements.ad_placement_zone IS 'Where the ad will be displayed on the platform';
COMMENT ON COLUMN public.advertisements.advertiser_type IS 'Whether advertiser is an internal platform user or external business';
COMMENT ON COLUMN public.advertisements.approval_status IS 'Current approval and active status of the advertisement';
COMMENT ON COLUMN public.advertisements.targeting_criteria IS 'JSONB object defining who should see this ad (roles, regions, languages)';
COMMENT ON COLUMN public.advertisements.cost_per_impression IS 'Revenue per impression (CPM model)';
COMMENT ON COLUMN public.advertisements.cost_per_click IS 'Revenue per click (CPC model)';
COMMENT ON COLUMN public.advertisements.total_revenue IS 'Total revenue generated by this ad';

COMMENT ON FUNCTION public.get_ads_for_placement(ad_placement_zone, TEXT, TEXT, INTEGER) IS 'Get active ads for a specific placement zone with targeting';
COMMENT ON FUNCTION public.track_ad_impression(UUID) IS 'Increment impression count and update revenue';
COMMENT ON FUNCTION public.track_ad_click(UUID) IS 'Increment click count, update revenue, and return target URL';
COMMENT ON FUNCTION public.get_ad_performance_metrics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Get performance metrics for an ad (CTR, revenue, etc.)';
COMMENT ON FUNCTION public.approve_advertisement(UUID, TEXT) IS 'Approve a pending advertisement (admin only)';
COMMENT ON FUNCTION public.reject_advertisement(UUID, TEXT) IS 'Reject a pending advertisement with reason (admin only)';
COMMENT ON FUNCTION public.expire_old_advertisements() IS 'Auto-expire advertisements past their end date';
