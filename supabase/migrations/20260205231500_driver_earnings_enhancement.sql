-- Migration: Driver Earnings & Payment Tracking Enhancement (Prompt 35)

-- 1. Enhance DRIVER_PAYMENTS table
ALTER TABLE public.driver_payments
ADD COLUMN IF NOT EXISTS base_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS distance_bonus DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_bonus DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quality_bonus DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deductions DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS earnings_type TEXT DEFAULT 'trip' CHECK (earnings_type IN ('trip', 'bonus', 'adjustment', 'per_diem')),
ADD COLUMN IF NOT EXISTS breakdown_json JSONB DEFAULT '{}';

-- 2. Create DRIVER_INCENTIVES table (Prompt 35)
CREATE TABLE IF NOT EXISTS public.driver_incentives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_name TEXT NOT NULL,
    description TEXT,
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    reward_amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'XAF',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'claimed', 'expired')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for driver query
CREATE INDEX IF NOT EXISTS idx_driver_incentives_driver ON public.driver_incentives(driver_user_id);
CREATE INDEX IF NOT EXISTS idx_driver_incentives_transporter ON public.driver_incentives(transporter_user_id);
CREATE INDEX IF NOT EXISTS idx_driver_incentives_status ON public.driver_incentives(status);

-- Enable RLS
ALTER TABLE public.driver_incentives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Drivers can view their own incentives"
    ON public.driver_incentives FOR SELECT
    USING (auth.uid() = driver_user_id);

CREATE POLICY "Transporters can manage incentives for their drivers"
    ON public.driver_incentives FOR ALL
    USING (auth.uid() = transporter_user_id);

-- 3. Update updated_at trigger
CREATE TRIGGER update_driver_incentives_updated_at BEFORE UPDATE ON public.driver_incentives FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. Function to update incentive progress automatically on trip completion
-- This is a trigger function that could be added to shipment_assignments or driver_payments
CREATE OR REPLACE FUNCTION update_driver_incentive_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment current_value for active incentives for this driver
    -- We assume the trigger is on driver_payments for type 'trip'
    IF (NEW.earnings_type = 'trip' AND NEW.payment_status = 'completed') THEN
        UPDATE public.driver_incentives
        SET 
            current_value = current_value + 1,
            status = CASE 
                WHEN current_value + 1 >= target_value THEN 'completed'::text 
                ELSE status 
            END,
            updated_at = NOW()
        WHERE driver_user_id = NEW.driver_user_id
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_incentive_progress') THEN
        CREATE TRIGGER trigger_update_incentive_progress
            AFTER INSERT OR UPDATE ON public.driver_payments
            FOR EACH ROW
            EXECUTE PROCEDURE update_driver_incentive_progress();
    END IF;
END $$;
