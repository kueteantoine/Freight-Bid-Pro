-- Migration: Load Marketplace Schema (Prompt 23)

-- 1. Create SAVED_SEARCHES table
CREATE TABLE IF NOT EXISTS public.saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    search_name TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user query optimization
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches(user_id);

-- Enable RLS for saved_searches
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved searches"
    ON public.saved_searches FOR ALL
    USING (auth.uid() = user_id);

-- 2. Create AVAILABLE_TRUCKS table (Carrier capacity)
CREATE TABLE IF NOT EXISTS public.available_trucks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    origin_location TEXT NOT NULL,
    origin_latitude DECIMAL(9,6),
    origin_longitude DECIMAL(9,6),
    destination_location TEXT,
    destination_latitude DECIMAL(9,6),
    destination_longitude DECIMAL(9,6),
    available_from TIMESTAMPTZ NOT NULL,
    available_until TIMESTAMPTZ,
    vehicle_type TEXT NOT NULL,
    capacity_kg DECIMAL(10,2),
    contact_phone TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'expired', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for transporter query
CREATE INDEX IF NOT EXISTS idx_available_trucks_transporter ON public.available_trucks(transporter_user_id);
CREATE INDEX IF NOT EXISTS idx_available_trucks_status ON public.available_trucks(status);

-- Enable RLS for available_trucks
ALTER TABLE public.available_trucks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporters can manage their own available trucks"
    ON public.available_trucks FOR ALL
    USING (auth.uid() = transporter_user_id);

CREATE POLICY "Everyone can view active available trucks"
    ON public.available_trucks FOR SELECT
    USING (status = 'active');

-- Triggers for updated_at
CREATE TRIGGER update_saved_searches_updated_at
    BEFORE UPDATE ON public.saved_searches
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_available_trucks_updated_at
    BEFORE UPDATE ON public.available_trucks
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.saved_searches IS 'Stores search filter combinations for users to reuse and get notified.';
COMMENT ON TABLE public.available_trucks IS 'Stores carrier capacity availability on specific routes.';
