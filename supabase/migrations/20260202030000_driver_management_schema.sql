-- Migration: Driver Management Schema (Prompt 22)

-- 1. Create DRIVER_INVITATIONS table
CREATE TABLE IF NOT EXISTS public.driver_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone_number TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Index for transporter query
CREATE INDEX IF NOT EXISTS idx_driver_invitations_transporter ON public.driver_invitations(transporter_user_id);
CREATE INDEX IF NOT EXISTS idx_driver_invitations_status ON public.driver_invitations(status);

-- Enable RLS
ALTER TABLE public.driver_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporters can manage their driver invitations"
    ON public.driver_invitations FOR ALL
    USING (auth.uid() = transporter_user_id);

-- 2. Create DRIVER_ASSIGNMENTS table
CREATE TABLE IF NOT EXISTS public.driver_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    transporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assignment_start_date TIMESTAMPTZ DEFAULT NOW(),
    assignment_end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver ON public.driver_assignments(driver_user_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_vehicle ON public.driver_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_transporter ON public.driver_assignments(transporter_user_id);

-- Enable RLS
ALTER TABLE public.driver_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporters can manage their driver assignments"
    ON public.driver_assignments FOR ALL
    USING (auth.uid() = transporter_user_id);

CREATE POLICY "Drivers can view their own assignments"
    ON public.driver_assignments FOR SELECT
    USING (auth.uid() = driver_user_id);

-- 3. Create DRIVER_AVAILABILITY table
CREATE TABLE IF NOT EXISTS public.driver_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT true,
    specific_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_driver_availability_driver ON public.driver_availability(driver_user_id);

-- Enable RLS
ALTER TABLE public.driver_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can manage their own availability"
    ON public.driver_availability FOR ALL
    USING (auth.uid() = driver_user_id);

CREATE POLICY "Transporters can view their drivers' availability"
    ON public.driver_availability FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.driver_assignments
            WHERE driver_assignments.driver_user_id = driver_availability.driver_user_id
            AND driver_assignments.transporter_user_id = auth.uid()
            AND driver_assignments.is_active = true
        )
    );

-- 4. Create DRIVER_PAYMENTS table
CREATE TABLE IF NOT EXISTS public.driver_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'XAF',
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed')),
    payment_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_driver_payments_driver ON public.driver_payments(driver_user_id);
CREATE INDEX IF NOT EXISTS idx_driver_payments_transporter ON public.driver_payments(transporter_user_id);

-- Enable RLS
ALTER TABLE public.driver_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporters can manage driver payments"
    ON public.driver_payments FOR ALL
    USING (auth.uid() = transporter_user_id);

CREATE POLICY "Drivers can view their own payments"
    ON public.driver_payments FOR SELECT
    USING (auth.uid() = driver_user_id);

-- Trigger for updated_at on all tables
CREATE TRIGGER update_driver_invitations_updated_at BEFORE UPDATE ON public.driver_invitations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_driver_assignments_updated_at BEFORE UPDATE ON public.driver_assignments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_driver_availability_updated_at BEFORE UPDATE ON public.driver_availability FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_driver_payments_updated_at BEFORE UPDATE ON public.driver_payments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
