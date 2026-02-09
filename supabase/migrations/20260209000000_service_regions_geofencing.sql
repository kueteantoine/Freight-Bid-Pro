-- Ensure service_regions table exists (from Prompt 44)
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

-- Add radius-based geofencing columns to service_regions
ALTER TABLE public.service_regions 
ADD COLUMN IF NOT EXISTS center_lat DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS center_lng DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS radius_km INTEGER;

COMMENT ON COLUMN public.service_regions.center_lat IS 'Latitude of the center of the service region (for circular geofencing)';
COMMENT ON COLUMN public.service_regions.center_lng IS 'Longitude of the center of the service region (for circular geofencing)';
COMMENT ON COLUMN public.service_regions.radius_km IS 'Radius in kilometers from the center point';
