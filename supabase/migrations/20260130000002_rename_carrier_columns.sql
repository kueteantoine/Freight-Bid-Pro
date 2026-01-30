-- Rename carrier_user_id to transporter_user_id in remaining tables
-- Run this in Supabase SQL Editor

-- 1. Rename in vehicles table
ALTER TABLE public.vehicles 
RENAME COLUMN carrier_user_id TO transporter_user_id;

-- 2. Rename in driver_assignments table
ALTER TABLE public.driver_assignments 
RENAME COLUMN carrier_user_id TO transporter_user_id;

-- 3. Update any indexes that reference the old column name
-- Drop old index if it exists and create new one for vehicles
DROP INDEX IF EXISTS idx_vehicles_carrier_user_id;
CREATE INDEX IF NOT EXISTS idx_vehicles_transporter_user_id ON public.vehicles(transporter_user_id);

-- Drop old index if it exists and create new one for driver_assignments
DROP INDEX IF EXISTS idx_driver_assignments_carrier_user_id;
CREATE INDEX IF NOT EXISTS idx_driver_assignments_transporter_user_id ON public.driver_assignments(transporter_user_id);

-- 4. Verify the changes
SELECT 
    'VERIFICATION' as check_type,
    table_name,
    column_name,
    'RENAMED SUCCESSFULLY' as status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN ('vehicles', 'driver_assignments')
AND column_name = 'transporter_user_id';
