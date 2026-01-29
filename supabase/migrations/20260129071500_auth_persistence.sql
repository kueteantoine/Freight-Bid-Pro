-- Add last_active_role to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS last_active_role TEXT CHECK (last_active_role IN ('shipper', 'carrier', 'driver', 'broker', 'admin'));

-- Update handle_new_user to set last_active_role if initial_role is provided
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, phone_number)
    VALUES (
        NEW.id, 
        NEW.email,
        NEW.raw_user_meta_data->>'phone_number'
    );
    
    INSERT INTO public.user_preferences (user_id, last_active_role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'initial_role'
    );

    -- Automatically assign initial role if provided in metadata
    IF NEW.raw_user_meta_data->>'initial_role' IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_type, is_active, verification_status)
        VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'initial_role',
            true,
            'pending'
        )
        ON CONFLICT (user_id, role_type) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
