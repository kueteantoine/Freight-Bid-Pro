-- Custom Type Curation Schema
-- This migration creates tables to track and curate custom freight and vehicle types entered by users

-- 0. Ensure Core Platform Tables exist (Rescue block for potential previous migration failures)
CREATE TABLE IF NOT EXISTS public.freight_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicle_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Custom Freight Types Tracking
CREATE TABLE IF NOT EXISTS public.freight_types_custom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'promoted', 'merged', 'flagged')),
    promoted_to_standard_id UUID REFERENCES public.freight_categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Custom Vehicle Types Tracking
CREATE TABLE IF NOT EXISTS public.vehicle_types_custom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'promoted', 'merged', 'flagged')),
    promoted_to_standard_id UUID REFERENCES public.vehicle_types(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Type Synonyms for normalization/mapping
CREATE TABLE IF NOT EXISTS public.type_synonyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    synonym_name TEXT NOT NULL UNIQUE, -- e.g. "Fridge Truck"
    target_type_id UUID NOT NULL, -- UUID of either standard or promoted custom type
    target_table_name TEXT NOT NULL CHECK (target_table_name IN ('vehicle_types', 'freight_categories')),
    is_auto_suggest BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.freight_types_custom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_types_custom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.type_synonyms ENABLE ROW LEVEL SECURITY;

-- Everyone can read, Admin-only write
CREATE POLICY "Admins can manage custom types"
    ON public.freight_types_custom FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role_type = 'admin' AND is_active = true
        )
    );

CREATE POLICY "Everyone can read custom types"
    ON public.freight_types_custom FOR SELECT
    USING (true);

-- Repeat for vehicle_types_custom
CREATE POLICY "Admins can manage custom vehicle types"
    ON public.vehicle_types_custom FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role_type = 'admin' AND is_active = true
        )
    );

CREATE POLICY "Everyone can read custom vehicle types"
    ON public.vehicle_types_custom FOR SELECT
    USING (true);

-- Repeat for type_synonyms
CREATE POLICY "Admins can manage synonyms"
    ON public.type_synonyms FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role_type = 'admin' AND is_active = true
        )
    );

CREATE POLICY "Everyone can read synonyms"
    ON public.type_synonyms FOR SELECT
    USING (true);

-- 5. Triggers for updated_at
CREATE TRIGGER update_freight_types_custom_updated_at
    BEFORE UPDATE ON public.freight_types_custom
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_vehicle_types_custom_updated_at
    BEFORE UPDATE ON public.vehicle_types_custom
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 6. Indexes for management
CREATE INDEX idx_freight_custom_status ON public.freight_types_custom(status);
CREATE INDEX idx_vehicle_custom_status ON public.vehicle_types_custom(status);
CREATE INDEX idx_synonyms_name ON public.type_synonyms(synonym_name);
