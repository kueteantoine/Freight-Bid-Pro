-- Migration: Fix transporter role activation and naming inconsistencies
-- Date: 2026-02-01

-- 1. Safely add 'transporter' to role_type_enum
-- Note: ALTER TYPE ... ADD VALUE cannot be executed in a transaction block in standard Postgres.
-- However, we'll use this approach which is common in Supabase/Postgres migrations.
-- If it fails, the user may need to run it manually.
COMMIT; -- Break out of transaction if possible (Postgres 11+)
ALTER TYPE public.role_type_enum ADD VALUE 'transporter';

-- 2. Rename assigned_carrier_user_id to assigned_transporter_user_id in shipments table
ALTER TABLE public.shipments RENAME COLUMN assigned_carrier_user_id TO assigned_transporter_user_id;

-- 3. Update indexes for shipments table
DROP INDEX IF EXISTS idx_shipments_assigned_carrier;
CREATE INDEX IF NOT EXISTS idx_shipments_assigned_transporter ON public.shipments(assigned_transporter_user_id);

-- 4. Update check constraints on user_preferences
ALTER TABLE public.user_preferences DROP CONSTRAINT IF EXISTS last_active_role_check;
ALTER TABLE public.user_preferences ADD CONSTRAINT last_active_role_check 
    CHECK (last_active_role IN ('shipper', 'transporter', 'driver', 'broker', 'admin'));

-- 5. Update user_roles check constraint (if it exists as a fallback)
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_type_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_type_check 
    CHECK (role_type::text IN ('shipper', 'transporter', 'driver', 'broker', 'admin'));

-- 6. Update RLS policies in tracking schema that used the old column name
DROP POLICY IF EXISTS "Carriers can view tracking for assigned shipments" ON public.shipment_tracking;
CREATE POLICY "Carriers can view tracking for assigned shipments"
    ON public.shipment_tracking FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = shipment_tracking.shipment_id
            AND shipments.assigned_transporter_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Carriers can insert tracking for assigned shipments" ON public.shipment_tracking;
CREATE POLICY "Carriers can insert tracking for assigned shipments"
    ON public.shipment_tracking FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = shipment_tracking.shipment_id
            AND shipments.assigned_transporter_user_id = auth.uid()
        )
    );
