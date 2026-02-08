-- Migration: Real-Time Tracking Enhancements
-- Description: Adds geofence logs and server-side validation for driver arrival/departure

-- Create geofence_event_type enum
DO $$ BEGIN
    CREATE TYPE geofence_event_type AS ENUM ('enter', 'exit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create geofence_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.geofence_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_type TEXT NOT NULL, -- 'pickup' or 'delivery'
    event_type geofence_event_type NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    distance_from_target DECIMAL(12,2), -- in meters
    is_valid BOOLEAN DEFAULT TRUE,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_geofence_logs_shipment_id ON public.geofence_logs(shipment_id);
CREATE INDEX IF NOT EXISTS idx_geofence_logs_driver_id ON public.geofence_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_geofence_logs_recorded_at ON public.geofence_logs(recorded_at);

-- Enable RLS
ALTER TABLE public.geofence_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all geofence logs"
    ON public.geofence_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_type = 'admin'));

CREATE POLICY "Drivers can view their own geofence logs"
    ON public.geofence_logs FOR SELECT
    USING (driver_id = auth.uid());

CREATE POLICY "Shippers can view logs for their shipments"
    ON public.geofence_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.shipments WHERE shipments.id = geofence_logs.shipment_id AND shipments.shipper_user_id = auth.uid()));

-- RPC: Validate Geofence Event
-- This function is called from the server actions after a client-side geofence trigger.
-- It performs server-side validation of the reported coordinates against the shipment data.
CREATE OR REPLACE FUNCTION public.validate_geofence_event(
    p_shipment_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_location_type TEXT, -- 'pickup' or 'delivery'
    p_event_type geofence_event_type,
    p_radius_meters DECIMAL DEFAULT 200
)
RETURNS JSONB AS $$
DECLARE
    v_target_lat DECIMAL;
    v_target_lng DECIMAL;
    v_distance DECIMAL;
    v_is_valid BOOLEAN;
    v_result JSONB;
BEGIN
    -- 1. Get target coordinates from shipment
    IF p_location_type = 'pickup' THEN
        SELECT pickup_latitude, pickup_longitude INTO v_target_lat, v_target_lng
        FROM public.shipments WHERE id = p_shipment_id;
    ELSE
        SELECT delivery_latitude, delivery_longitude INTO v_target_lat, v_target_lng
        FROM public.shipments WHERE id = p_shipment_id;
    END IF;

    -- 2. Calculate distance using haversine formula (returned in meters)
    -- Haversine formula implementation in SQL
    SELECT (6371000 * acos(cos(radians(v_target_lat)) * cos(radians(p_latitude)) * cos(radians(p_longitude) - radians(v_target_lng)) + sin(radians(v_target_lat)) * sin(radians(p_latitude))))
    INTO v_distance;

    -- 3. Determine if valid
    v_is_valid := v_distance <= p_radius_meters;

    -- 4. Log the event
    INSERT INTO public.geofence_logs (
        shipment_id,
        driver_id,
        location_type,
        event_type,
        latitude,
        longitude,
        distance_from_target,
        is_valid
    ) VALUES (
        p_shipment_id,
        auth.uid(),
        p_location_type,
        p_event_type,
        p_latitude,
        p_longitude,
        v_distance,
        v_is_valid
    );

    -- 5. Return result
    v_result := jsonb_build_object(
        'is_valid', v_is_valid,
        'distance_meters', v_distance,
        'timestamp', NOW()
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
