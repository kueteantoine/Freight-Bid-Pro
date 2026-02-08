-- Update Carrier Service Offerings for Radius-based model
-- This migration updates the service offerings to support a simpler city + radius model

-- 1. Ensure carrier_service_offerings exists (Fixing potential failure of 20260203030000_carrier_settings)
CREATE TABLE IF NOT EXISTS public.carrier_service_offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    freight_types TEXT[] DEFAULT '{}',
    service_regions JSONB DEFAULT '[]', -- Array of regions/coordinates (Legacy)
    max_distance_km INTEGER,
    min_weight_kg DECIMAL,
    max_weight_kg DECIMAL,
    special_capabilities TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(transporter_user_id)
);

-- Ensure RLS is enabled if the table was just created or if it was missing policies
ALTER TABLE public.carrier_service_offerings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'carrier_service_offerings' AND policyname = 'Transporters can manage their own service offerings') THEN
        CREATE POLICY "Transporters can manage their own service offerings"
            ON public.carrier_service_offerings FOR ALL
            USING (auth.uid() = transporter_user_id);
    END IF;
END $$;

-- 2. Repair carrier_pricing_rules if it exists with bad references
-- Check if table exists. if so, we don't recreate but we can't easily change foreign key in a generic way without more logic.
-- For now, let's just ensure it exists for the transporter settings UI to work.
CREATE TABLE IF NOT EXISTS public.carrier_pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    freight_type TEXT,
    base_rate DECIMAL NOT NULL,
    rate_unit TEXT NOT NULL CHECK (rate_unit IN ('per_km', 'per_kg', 'flat', 'per_hour')),
    min_price DECIMAL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.carrier_pricing_rules ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'carrier_pricing_rules' AND policyname = 'Transporters can manage their own pricing rules') THEN
        CREATE POLICY "Transporters can manage their own pricing rules"
            ON public.carrier_pricing_rules FOR ALL
            USING (auth.uid() = transporter_user_id);
    END IF;
END $$;

-- 3. Add new columns for radius-based model
ALTER TABLE public.carrier_service_offerings 
ADD COLUMN IF NOT EXISTS base_city TEXT,
ADD COLUMN IF NOT EXISTS base_latitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS base_longitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS service_radius_km INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS willing_to_backhaul BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cross_border BOOLEAN DEFAULT false;

-- 2. Create preferred routes table
CREATE TABLE IF NOT EXISTS public.carrier_preferred_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_city TEXT NOT NULL,
    from_latitude DECIMAL(9,6),
    from_longitude DECIMAL(9,6),
    to_city TEXT NOT NULL,
    to_latitude DECIMAL(9,6),
    to_longitude DECIMAL(9,6),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(transporter_user_id, from_city, to_city)
);

-- 3. Enable RLS for preferred routes
ALTER TABLE public.carrier_preferred_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporters can manage their own routes"
    ON public.carrier_preferred_routes FOR ALL
    USING (auth.uid() = transporter_user_id);

-- 4. Add trigger for updated_at
CREATE TRIGGER update_carrier_preferred_routes_updated_at
    BEFORE UPDATE ON public.carrier_preferred_routes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 5. Comments
COMMENT ON COLUMN public.carrier_service_offerings.base_city IS 'Main hub of operations for the transporter';
COMMENT ON COLUMN public.carrier_service_offerings.service_radius_km IS 'Radius in kilometers the transporter is willing to travel from their base city';
COMMENT ON TABLE public.carrier_preferred_routes IS 'Fixed routes that a transporter regularly travels and prefers loads for';
