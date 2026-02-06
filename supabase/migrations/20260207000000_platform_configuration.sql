-- Platform Configuration Schema (Prompt 44)
-- This migration creates tables for platform-wide settings management

-- =====================================================
-- PLATFORM_SETTINGS TABLE
-- =====================================================
-- Global platform configuration with key-value storage
CREATE TABLE IF NOT EXISTS public.platform_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value JSONB NOT NULL,
    setting_category TEXT NOT NULL CHECK (setting_category IN ('commission', 'fees', 'bidding', 'payments', 'general')),
    description TEXT,
    updated_by_admin_id UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for category queries
CREATE INDEX IF NOT EXISTS idx_platform_settings_category ON public.platform_settings(setting_category);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage platform settings"
    ON public.platform_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );

-- Everyone can read settings
CREATE POLICY "Everyone can read platform settings"
    ON public.platform_settings FOR SELECT
    USING (true);


-- =====================================================
-- VEHICLE_TYPES TABLE
-- =====================================================
-- Available vehicle types for the platform
CREATE TABLE IF NOT EXISTS public.vehicle_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT, -- Icon name or URL
    min_capacity_kg DECIMAL(10,2),
    max_capacity_kg DECIMAL(10,2),
    min_capacity_cubic_meters DECIMAL(10,2),
    max_capacity_cubic_meters DECIMAL(10,2),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active types
CREATE INDEX IF NOT EXISTS idx_vehicle_types_active ON public.vehicle_types(is_active);

-- Enable RLS
ALTER TABLE public.vehicle_types ENABLE ROW LEVEL SECURITY;

-- Admin-only write access
CREATE POLICY "Admins can manage vehicle types"
    ON public.vehicle_types FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );

-- Everyone can read active types
CREATE POLICY "Everyone can read active vehicle types"
    ON public.vehicle_types FOR SELECT
    USING (is_active = true);


-- =====================================================
-- FREIGHT_CATEGORIES TABLE
-- =====================================================
-- Freight classification and categories
CREATE TABLE IF NOT EXISTS public.freight_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    special_requirements TEXT,
    is_restricted BOOLEAN DEFAULT false, -- For hazardous materials
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active categories
CREATE INDEX IF NOT EXISTS idx_freight_categories_active ON public.freight_categories(is_active);

-- Enable RLS
ALTER TABLE public.freight_categories ENABLE ROW LEVEL SECURITY;

-- Admin-only write access
CREATE POLICY "Admins can manage freight categories"
    ON public.freight_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );

-- Everyone can read active categories
CREATE POLICY "Everyone can read active freight categories"
    ON public.freight_categories FOR SELECT
    USING (is_active = true);


-- =====================================================
-- SERVICE_REGIONS TABLE
-- =====================================================
-- Geographic coverage and service areas
CREATE TABLE IF NOT EXISTS public.service_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    country TEXT NOT NULL,
    state_province TEXT,
    boundaries JSONB, -- GeoJSON polygon coordinates
    distance_calculation_method TEXT DEFAULT 'haversine' CHECK (distance_calculation_method IN ('haversine', 'road_distance')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active regions
CREATE INDEX IF NOT EXISTS idx_service_regions_active ON public.service_regions(is_active);
CREATE INDEX IF NOT EXISTS idx_service_regions_country ON public.service_regions(country);

-- Enable RLS
ALTER TABLE public.service_regions ENABLE ROW LEVEL SECURITY;

-- Admin-only write access
CREATE POLICY "Admins can manage service regions"
    ON public.service_regions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );

-- Everyone can read active regions
CREATE POLICY "Everyone can read active service regions"
    ON public.service_regions FOR SELECT
    USING (is_active = true);


-- =====================================================
-- COMMISSION_TIERS TABLE
-- =====================================================
-- Tiered commission structure based on volume
CREATE TABLE IF NOT EXISTS public.commission_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name TEXT NOT NULL,
    min_shipments_per_month INTEGER NOT NULL CHECK (min_shipments_per_month >= 0),
    max_shipments_per_month INTEGER CHECK (max_shipments_per_month IS NULL OR max_shipments_per_month > min_shipments_per_month),
    commission_percentage DECIMAL(5,2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(min_shipments_per_month, max_shipments_per_month)
);

-- Index for active tiers and queries
CREATE INDEX IF NOT EXISTS idx_commission_tiers_active ON public.commission_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_commission_tiers_range ON public.commission_tiers(min_shipments_per_month, max_shipments_per_month);

-- Enable RLS
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;

-- Admin-only write access
CREATE POLICY "Admins can manage commission tiers"
    ON public.commission_tiers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );

-- Everyone can read active tiers
CREATE POLICY "Everyone can read active commission tiers"
    ON public.commission_tiers FOR SELECT
    USING (is_active = true);


-- =====================================================
-- SURGE_PRICING_RULES TABLE
-- =====================================================
-- Dynamic pricing based on demand, time, and dates
DO $$ BEGIN
    CREATE TYPE surge_trigger_type AS ENUM ('demand', 'time_of_day', 'date_range', 'holiday');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.surge_pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL,
    trigger_type surge_trigger_type NOT NULL,
    trigger_conditions JSONB NOT NULL, -- Flexible conditions storage
    surge_multiplier DECIMAL(5,2) NOT NULL CHECK (surge_multiplier >= 1.0),
    max_multiplier DECIMAL(5,2) CHECK (max_multiplier IS NULL OR max_multiplier >= surge_multiplier),
    priority INTEGER DEFAULT 0, -- Higher priority rules evaluated first
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_surge_pricing_active ON public.surge_pricing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_surge_pricing_priority ON public.surge_pricing_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_surge_pricing_trigger_type ON public.surge_pricing_rules(trigger_type);

-- Enable RLS
ALTER TABLE public.surge_pricing_rules ENABLE ROW LEVEL SECURITY;

-- Admin-only write access
CREATE POLICY "Admins can manage surge pricing rules"
    ON public.surge_pricing_rules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );

-- Everyone can read active rules
CREATE POLICY "Everyone can read active surge pricing rules"
    ON public.surge_pricing_rules FOR SELECT
    USING (is_active = true);


-- =====================================================
-- PROMOTIONAL_CODES TABLE
-- =====================================================
-- Discount codes and promotions
CREATE TABLE IF NOT EXISTS public.promotional_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_percentage DECIMAL(5,2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    target_user_segments JSONB, -- Array of user segments (roles, locations, etc.)
    max_usage_count INTEGER, -- NULL for unlimited
    current_usage_count INTEGER DEFAULT 0,
    max_usage_per_user INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (valid_until > valid_from)
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_promotional_codes_active ON public.promotional_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promotional_codes_code ON public.promotional_codes(code);
CREATE INDEX IF NOT EXISTS idx_promotional_codes_validity ON public.promotional_codes(valid_from, valid_until);

-- Enable RLS
ALTER TABLE public.promotional_codes ENABLE ROW LEVEL SECURITY;

-- Admin-only write access
CREATE POLICY "Admins can manage promotional codes"
    ON public.promotional_codes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );

-- Everyone can read active codes (for validation)
CREATE POLICY "Everyone can read active promotional codes"
    ON public.promotional_codes FOR SELECT
    USING (is_active = true);


-- =====================================================
-- CODE_REDEMPTIONS TABLE
-- =====================================================
-- Track promotional code usage
CREATE TABLE IF NOT EXISTS public.code_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_id UUID NOT NULL REFERENCES public.promotional_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
    discount_amount DECIMAL(12,2) NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(code_id, user_id, shipment_id)
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_code_redemptions_code_id ON public.code_redemptions(code_id);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_user_id ON public.code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_date ON public.code_redemptions(redeemed_at);

-- Enable RLS
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY "Users can view their own redemptions"
    ON public.code_redemptions FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert redemptions
CREATE POLICY "Authenticated users can redeem codes"
    ON public.code_redemptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- =====================================================
-- TAX_RATES TABLE
-- =====================================================
-- Regional tax configuration
DO $$ BEGIN
    CREATE TYPE tax_calculation_method AS ENUM ('percentage', 'fixed_amount', 'tiered');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_name TEXT NOT NULL,
    country TEXT NOT NULL,
    state_province TEXT,
    tax_name TEXT NOT NULL, -- e.g., "VAT", "Sales Tax", "GST"
    tax_rate DECIMAL(5,2) CHECK (tax_rate >= 0 AND tax_rate <= 100),
    fixed_amount DECIMAL(12,2),
    calculation_method tax_calculation_method NOT NULL DEFAULT 'percentage',
    exemption_rules JSONB, -- Rules for tax exemptions
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_tax_rates_active ON public.tax_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_tax_rates_region ON public.tax_rates(country, state_province);

-- Enable RLS
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

-- Admin-only write access
CREATE POLICY "Admins can manage tax rates"
    ON public.tax_rates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );

-- Everyone can read active tax rates
CREATE POLICY "Everyone can read active tax rates"
    ON public.tax_rates FOR SELECT
    USING (is_active = true);


-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_platform_settings_updated_at
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_vehicle_types_updated_at
    BEFORE UPDATE ON public.vehicle_types
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_freight_categories_updated_at
    BEFORE UPDATE ON public.freight_categories
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_service_regions_updated_at
    BEFORE UPDATE ON public.service_regions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_commission_tiers_updated_at
    BEFORE UPDATE ON public.commission_tiers
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_surge_pricing_rules_updated_at
    BEFORE UPDATE ON public.surge_pricing_rules
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_promotional_codes_updated_at
    BEFORE UPDATE ON public.promotional_codes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tax_rates_updated_at
    BEFORE UPDATE ON public.tax_rates
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- =====================================================
-- RPC FUNCTIONS
-- =====================================================

-- Get platform settings by category
CREATE OR REPLACE FUNCTION public.get_platform_settings(
    category_filter TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    settings_data JSONB;
BEGIN
    SELECT jsonb_object_agg(setting_key, setting_value)
    INTO settings_data
    FROM public.platform_settings
    WHERE category_filter IS NULL OR setting_category = category_filter;
    
    RETURN COALESCE(settings_data, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get applicable commission tier for a shipment count
CREATE OR REPLACE FUNCTION public.get_active_commission_tier(
    shipment_count INTEGER
)
RETURNS JSONB AS $$
DECLARE
    tier_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', id,
        'tier_name', tier_name,
        'commission_percentage', commission_percentage,
        'min_shipments', min_shipments_per_month,
        'max_shipments', max_shipments_per_month
    )
    INTO tier_data
    FROM public.commission_tiers
    WHERE is_active = true
    AND min_shipments_per_month <= shipment_count
    AND (max_shipments_per_month IS NULL OR max_shipments_per_month >= shipment_count)
    ORDER BY commission_percentage ASC
    LIMIT 1;
    
    RETURN COALESCE(tier_data, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Validate promotional code
CREATE OR REPLACE FUNCTION public.validate_promotional_code(
    promo_code TEXT,
    user_id_param UUID
)
RETURNS JSONB AS $$
DECLARE
    code_data RECORD;
    user_redemption_count INTEGER;
    is_valid BOOLEAN := false;
    error_message TEXT := '';
BEGIN
    -- Get code details
    SELECT * INTO code_data
    FROM public.promotional_codes
    WHERE code = promo_code;
    
    -- Check if code exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Invalid promotional code'
        );
    END IF;
    
    -- Check if active
    IF code_data.is_active = false THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'This promotional code is no longer active'
        );
    END IF;
    
    -- Check validity period
    IF NOW() < code_data.valid_from OR NOW() > code_data.valid_until THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'This promotional code has expired or is not yet valid'
        );
    END IF;
    
    -- Check max usage count
    IF code_data.max_usage_count IS NOT NULL AND code_data.current_usage_count >= code_data.max_usage_count THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'This promotional code has reached its usage limit'
        );
    END IF;
    
    -- Check user-specific usage
    SELECT COUNT(*) INTO user_redemption_count
    FROM public.code_redemptions
    WHERE code_id = code_data.id AND user_id = user_id_param;
    
    IF user_redemption_count >= code_data.max_usage_per_user THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'You have already used this promotional code'
        );
    END IF;
    
    -- All checks passed
    RETURN jsonb_build_object(
        'valid', true,
        'code_id', code_data.id,
        'discount_percentage', code_data.discount_percentage
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get applicable tax rate for a region
CREATE OR REPLACE FUNCTION public.get_tax_rate(
    country_param TEXT,
    state_province_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    tax_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', id,
        'tax_name', tax_name,
        'tax_rate', tax_rate,
        'fixed_amount', fixed_amount,
        'calculation_method', calculation_method
    )
    INTO tax_data
    FROM public.tax_rates
    WHERE is_active = true
    AND country = country_param
    AND (state_province IS NULL OR state_province = state_province_param)
    ORDER BY 
        CASE WHEN state_province IS NOT NULL THEN 1 ELSE 2 END, -- Prefer specific state/province
        created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(tax_data, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_platform_settings(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_commission_tier(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_promotional_code(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tax_rate(TEXT, TEXT) TO authenticated;


-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.platform_settings IS 'Global platform configuration with key-value storage';
COMMENT ON TABLE public.vehicle_types IS 'Available vehicle types for shipments and fleet management';
COMMENT ON TABLE public.freight_categories IS 'Freight classification and categories';
COMMENT ON TABLE public.service_regions IS 'Geographic coverage and service areas';
COMMENT ON TABLE public.commission_tiers IS 'Tiered commission structure based on shipment volume';
COMMENT ON TABLE public.surge_pricing_rules IS 'Dynamic pricing rules based on demand, time, and dates';
COMMENT ON TABLE public.promotional_codes IS 'Discount codes and promotional campaigns';
COMMENT ON TABLE public.code_redemptions IS 'Tracking of promotional code usage';
COMMENT ON TABLE public.tax_rates IS 'Regional tax configuration and rates';
