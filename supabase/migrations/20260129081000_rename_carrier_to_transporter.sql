-- Migration: Rename carrier role to transporter
-- Date: 2026-01-29

-- 1. Update check constraints on user_roles
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_type_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_type_check 
    CHECK (role_type IN ('shipper', 'transporter', 'driver', 'broker', 'admin'));

-- 2. Update check constraints on user_preferences
ALTER TABLE public.user_preferences DROP CONSTRAINT IF EXISTS last_active_role_check;
ALTER TABLE public.user_preferences ADD CONSTRAINT last_active_role_check 
    CHECK (last_active_role IN ('shipper', 'transporter', 'driver', 'broker', 'admin'));

-- 3. Update existing data in user_roles
UPDATE public.user_roles SET role_type = 'transporter' WHERE role_type = 'carrier';

-- 4. Update existing data in user_preferences
UPDATE public.user_preferences SET last_active_role = 'transporter' WHERE last_active_role = 'carrier';

-- 5. Rename carrier_user_id to transporter_user_id in bids table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bids' AND column_name='carrier_user_id') THEN
        ALTER TABLE public.bids RENAME COLUMN carrier_user_id TO transporter_user_id;
    END IF;
END $$;
