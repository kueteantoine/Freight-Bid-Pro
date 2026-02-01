-- Create tracking event enum
CREATE TYPE tracking_event AS ENUM (
    'shipment_created',
    'bid_awarded',
    'driver_assigned',
    'pickup_started',
    'loaded',
    'in_transit',
    'delivered',
    'cancelled'
);

-- Create SHIPMENT_TRACKING table (Prompt 6)
CREATE TABLE IF NOT EXISTS public.shipment_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    location_name TEXT,
    tracking_event tracking_event NOT NULL,
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    recorded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    images_json JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add tracking-related columns to shipments table
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS assigned_carrier_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_driver_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_vehicle_id UUID,
ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS estimated_arrival TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracking_shipment_id ON public.shipment_tracking(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_event_timestamp ON public.shipment_tracking(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_tracking_event_type ON public.shipment_tracking(tracking_event);
CREATE INDEX IF NOT EXISTS idx_shipments_assigned_carrier ON public.shipments(assigned_carrier_user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_assigned_driver ON public.shipments(assigned_driver_user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_current_location ON public.shipments(current_latitude, current_longitude);

-- Enable RLS for shipment_tracking
ALTER TABLE public.shipment_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shipment_tracking
-- Shippers can view tracking for their shipments
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'shipment_tracking' 
        AND policyname = 'Shippers can view tracking for their shipments'
    ) THEN
        CREATE POLICY "Shippers can view tracking for their shipments"
            ON public.shipment_tracking FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.shipments
                    WHERE shipments.id = shipment_tracking.shipment_id
                    AND shipments.shipper_user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Assigned carriers can view and insert tracking for their shipments
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'shipment_tracking' 
        AND policyname = 'Carriers can view tracking for assigned shipments'
    ) THEN
        CREATE POLICY "Carriers can view tracking for assigned shipments"
            ON public.shipment_tracking FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.shipments
                    WHERE shipments.id = shipment_tracking.shipment_id
                    AND shipments.assigned_carrier_user_id = auth.uid()
                )
            );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'shipment_tracking' 
        AND policyname = 'Carriers can insert tracking for assigned shipments'
    ) THEN
        CREATE POLICY "Carriers can insert tracking for assigned shipments"
            ON public.shipment_tracking FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.shipments
                    WHERE shipments.id = shipment_tracking.shipment_id
                    AND shipments.assigned_carrier_user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Assigned drivers can view and insert tracking for their shipments
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'shipment_tracking' 
        AND policyname = 'Drivers can view tracking for assigned shipments'
    ) THEN
        CREATE POLICY "Drivers can view tracking for assigned shipments"
            ON public.shipment_tracking FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.shipments
                    WHERE shipments.id = shipment_tracking.shipment_id
                    AND shipments.assigned_driver_user_id = auth.uid()
                )
            );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'shipment_tracking' 
        AND policyname = 'Drivers can insert tracking for assigned shipments'
    ) THEN
        CREATE POLICY "Drivers can insert tracking for assigned shipments"
            ON public.shipment_tracking FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.shipments
                    WHERE shipments.id = shipment_tracking.shipment_id
                    AND shipments.assigned_driver_user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Function to automatically create tracking event when shipment is created
CREATE OR REPLACE FUNCTION create_shipment_tracking_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Create initial tracking event when shipment is created
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.shipment_tracking (
            shipment_id,
            tracking_event,
            recorded_by_user_id,
            notes
        ) VALUES (
            NEW.id,
            'shipment_created',
            NEW.shipper_user_id,
            'Shipment created and posted for bidding'
        );
    END IF;
    
    -- Create tracking event when status changes
    IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
        -- Map status to tracking event
        IF (NEW.status = 'bid_awarded') THEN
            INSERT INTO public.shipment_tracking (
                shipment_id,
                tracking_event,
                recorded_by_user_id,
                notes
            ) VALUES (
                NEW.id,
                'bid_awarded',
                auth.uid(),
                'Bid awarded to carrier'
            );
        ELSIF (NEW.status = 'in_transit') THEN
            INSERT INTO public.shipment_tracking (
                shipment_id,
                tracking_event,
                recorded_by_user_id,
                notes
            ) VALUES (
                NEW.id,
                'in_transit',
                auth.uid(),
                'Shipment is in transit'
            );
        ELSIF (NEW.status = 'delivered') THEN
            INSERT INTO public.shipment_tracking (
                shipment_id,
                tracking_event,
                recorded_by_user_id,
                notes
            ) VALUES (
                NEW.id,
                'delivered',
                auth.uid(),
                'Shipment delivered successfully'
            );
        ELSIF (NEW.status = 'cancelled') THEN
            INSERT INTO public.shipment_tracking (
                shipment_id,
                tracking_event,
                recorded_by_user_id,
                notes
            ) VALUES (
                NEW.id,
                'cancelled',
                auth.uid(),
                'Shipment cancelled'
            );
        END IF;
    END IF;
    
    -- Create tracking event when driver is assigned
    IF (TG_OP = 'UPDATE' AND OLD.assigned_driver_user_id IS NULL AND NEW.assigned_driver_user_id IS NOT NULL) THEN
        INSERT INTO public.shipment_tracking (
            shipment_id,
            tracking_event,
            recorded_by_user_id,
            notes
        ) VALUES (
            NEW.id,
            'driver_assigned',
            auth.uid(),
            'Driver assigned to shipment'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create tracking events
CREATE TRIGGER trigger_create_shipment_tracking
    AFTER INSERT OR UPDATE ON public.shipments
    FOR EACH ROW
    EXECUTE PROCEDURE create_shipment_tracking_event();

-- Function to update shipment current location
CREATE OR REPLACE FUNCTION update_shipment_location(
    p_shipment_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_location_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update shipment current location
    UPDATE public.shipments
    SET 
        current_latitude = p_latitude,
        current_longitude = p_longitude,
        updated_at = NOW()
    WHERE id = p_shipment_id;
    
    -- Create tracking event for location update
    INSERT INTO public.shipment_tracking (
        shipment_id,
        latitude,
        longitude,
        location_name,
        tracking_event,
        recorded_by_user_id
    ) VALUES (
        p_shipment_id,
        p_latitude,
        p_longitude,
        p_location_name,
        'in_transit',
        auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
