-- Migration: Add last_active_role to user_preferences and update handle_new_user
-- Date: 2026-01-29

-- 1. Add last_active_role column to user_preferences if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_preferences' AND column_name='last_active_role') THEN
        ALTER TABLE public.user_preferences ADD COLUMN last_active_role TEXT;
        -- Add check constraint for valid role types
        ALTER TABLE public.user_preferences ADD CONSTRAINT last_active_role_check 
            CHECK (last_active_role IN ('shipper', 'carrier', 'driver', 'broker', 'admin'));
    END IF;
END $$;

-- 2. Update handle_new_user function to set last_active_role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    initial_role_val TEXT;
BEGIN
    initial_role_val := NEW.raw_user_meta_data->>'initial_role';

    -- Insert profile
    INSERT INTO public.profiles (id, email, phone_number)
    VALUES (
        NEW.id, 
        NEW.email,
        NEW.raw_user_meta_data->>'phone_number'
    );
    
    -- Insert preferences with last_active_role
    INSERT INTO public.user_preferences (user_id, last_active_role)
    VALUES (NEW.id, initial_role_val);

    -- Automatically assign initial role if provided in metadata
    IF initial_role_val IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_type, is_active, verification_status)
        VALUES (
            NEW.id,
            initial_role_val,
            true,
            'pending'
        )
        ON CONFLICT (user_id, role_type) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add a fallback trigger function to handle role invalidation
-- This ensures that if a role is deactivated or removed, last_active_role is updated
CREATE OR REPLACE FUNCTION public.sync_last_active_role()
RETURNS TRIGGER AS $$
BEGIN
    -- If a role is being deactivated or deleted
    IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND NEW.is_active = false AND OLD.is_active = true) THEN
        -- Check if the role being affected is the last_active_role
        IF EXISTS (
            SELECT 1 FROM public.user_preferences 
            WHERE user_id = OLD.user_id AND last_active_role = OLD.role_type
        ) THEN
            -- Update to another active role if available, otherwise NULL
            UPDATE public.user_preferences 
            SET last_active_role = (
                SELECT role_type FROM public.user_roles 
                WHERE user_id = OLD.user_id AND is_active = true AND role_type != OLD.role_type
                LIMIT 1
            )
            WHERE user_id = OLD.user_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger on user_roles
DROP TRIGGER IF EXISTS on_user_role_changed ON public.user_roles;
CREATE TRIGGER on_user_role_changed
    AFTER UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE PROCEDURE public.sync_last_active_role();
