-- Multi-Currency System Schema (Prompt 58)
-- This migration creates the exchange rates table and seeds platform currency configuration.

-- =====================================================
-- EXCHANGE_RATES TABLE
-- =====================================================
-- Stores real-time exchange rates relative to the base currency (XAF)
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    currency_code TEXT PRIMARY KEY CHECK (LENGTH(currency_code) = 3),
    rate_to_xaf DECIMAL(20,10) NOT NULL, -- How much 1 unit of this currency is worth in XAF
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Everyone can read exchange rates
CREATE POLICY "Everyone can read exchange rates"
    ON public.exchange_rates FOR SELECT
    USING (true);

-- Only admins can update exchange rates (via custom functions or admin dashboard)
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

-- Trigger for update_updated_at_column
CREATE TRIGGER update_exchange_rates_updated_at
    BEFORE UPDATE ON public.exchange_rates
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- INITIAL CONFIGURATION
-- =====================================================
-- Seed currency configuration into platform_settings
INSERT INTO public.platform_settings (setting_key, setting_value, setting_category, description)
VALUES (
    'currency_config',
    '{
        "base_currency": "XAF",
        "supported_currencies": ["XAF", "USD", "EUR", "GHS", "NGN"],
        "api_source": "exchangerate-api",
        "update_frequency": "daily"
    }'::jsonb,
    'general',
    'Platform-wide currency and exchange rate configuration'
)
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- Seed initial exchange rates (estimates, will be updated by service)
INSERT INTO public.exchange_rates (currency_code, rate_to_xaf)
VALUES 
    ('XAF', 1.0),
    ('USD', 610.0),
    ('EUR', 655.957),
    ('GHS', 45.0),
    ('NGN', 0.4)
ON CONFLICT (currency_code) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.exchange_rates IS 'Stores real-time exchange rates relative to XAF';
COMMENT ON COLUMN public.exchange_rates.rate_to_xaf IS 'How much 1 unit of this currency is worth in XAF (e.g., 1 USD = 610 XAF)';
