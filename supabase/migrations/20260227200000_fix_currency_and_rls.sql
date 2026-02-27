-- Fix Currency and RLS Errors
-- 1. Helper function to check for super_admin role safely without recursion
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.admin_user_roles
        WHERE user_id = auth.uid()
        AND role_name = 'super_admin'
        AND is_active = true
    ) INTO is_admin;
    
    RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update admin_user_roles policies to use the new function
DROP POLICY IF EXISTS "Super admins can manage admin user roles" ON public.admin_user_roles;
CREATE POLICY "Super admins can manage admin user roles"
    ON public.admin_user_roles FOR ALL
    USING (public.is_super_admin());

-- 3. Update platform_settings policy to use the new function
DROP POLICY IF EXISTS "Only super admins can manage platform configurations" ON public.platform_settings;
CREATE POLICY "Only super admins can manage platform configurations"
    ON public.platform_settings FOR ALL
    USING (public.is_super_admin());

-- 4. Re-run exchange_rates DDL (safely)
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    currency_code TEXT PRIMARY KEY CHECK (LENGTH(currency_code) = 3),
    rate_to_xaf DECIMAL(20,10) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read exchange rates" ON public.exchange_rates;
CREATE POLICY "Everyone can read exchange rates"
    ON public.exchange_rates FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage exchange rates" ON public.exchange_rates;
CREATE POLICY "Admins can manage exchange rates"
    ON public.exchange_rates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_exchange_rates_updated_at') THEN
        CREATE TRIGGER update_exchange_rates_updated_at
            BEFORE UPDATE ON public.exchange_rates
            FOR EACH ROW
            EXECUTE PROCEDURE public.update_updated_at_column();
    END IF;
END $$;

INSERT INTO public.exchange_rates (currency_code, rate_to_xaf)
VALUES 
    ('XAF', 1.0),
    ('USD', 610.0),
    ('EUR', 655.957),
    ('GHS', 45.0),
    ('NGN', 0.4)
ON CONFLICT (currency_code) DO NOTHING;
