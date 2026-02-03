-- Migration: Prompt 30 - Driver Job Assignment & Acceptance

-- 1. Create shipment_assignments table
-- Note: This is separate from driver_assignments which tracks vehicle-driver pairings
CREATE TABLE IF NOT EXISTS public.shipment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed', 'expired')),
    rejection_reason TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    response_deadline TIMESTAMPTZ,
    auto_assigned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_shipment_assignments_driver ON public.shipment_assignments(driver_user_id);
CREATE INDEX IF NOT EXISTS idx_shipment_assignments_shipment ON public.shipment_assignments(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_assignments_status ON public.shipment_assignments(status);

-- 3. RLS Policies
ALTER TABLE public.shipment_assignments ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own assignments
CREATE POLICY "Drivers can view their own assignments"
    ON public.shipment_assignments FOR SELECT
    USING (auth.uid() = driver_user_id);

-- Drivers can update their own assignments (accept/reject)
CREATE POLICY "Drivers can update their own assignments"
    ON public.shipment_assignments FOR UPDATE
    USING (auth.uid() = driver_user_id);

-- Transporters (carriers) can view assignments for their drivers
-- Note: This requires a join or check against driver_assignments or organizational hierarchy
-- For simplicity in this prompt, assuming transporters can view assignments for shipments they manage
CREATE POLICY "Transporters can view assignments for their shipments"
    ON public.shipment_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = shipment_assignments.shipment_id
            AND shipments.assigned_carrier_user_id = auth.uid()
        )
    );

-- Transporters can manage assignments (create/update)
CREATE POLICY "Transporters can manage assignments for their shipments"
    ON public.shipment_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = shipment_assignments.shipment_id
            AND shipments.assigned_carrier_user_id = auth.uid()
        )
    );

-- 4. Add auto_accept settings to user preferences (optional, but requested in prompt)
-- We'll add it to a new table or user_preferences if it exists. 
-- Checking schema from previous prompts, user_preferences exists.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'driver_auto_accept_enabled'
    ) THEN
        ALTER TABLE public.user_preferences 
        ADD COLUMN driver_auto_accept_enabled BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 5. Trigger for updated_at
CREATE TRIGGER update_shipment_assignments_updated_at
    BEFORE UPDATE ON public.shipment_assignments
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
