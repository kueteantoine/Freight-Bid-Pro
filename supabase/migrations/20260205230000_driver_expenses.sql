-- Migration for Prompt 34: Driver Expense Tracking & Claims

-- 1. driver_expense_claims table
CREATE TABLE IF NOT EXISTS public.driver_expense_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount DECIMAL(15,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. driver_expenses table
CREATE TABLE IF NOT EXISTS public.driver_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES public.driver_expense_claims(id) ON DELETE SET NULL,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('fuel', 'tolls', 'parking', 'meals', 'maintenance', 'per_diem', 'lodging', 'other')),
    amount DECIMAL(15,2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    receipt_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. driver_mileage_logs table
CREATE TABLE IF NOT EXISTS public.driver_mileage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    start_odometer DECIMAL(10,2) NOT NULL,
    end_odometer DECIMAL(10,2) NOT NULL,
    total_distance DECIMAL(10,2) NOT NULL,
    trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
    purpose TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. transporter_expense_settings table (Per-diem and mileage rates)
CREATE TABLE IF NOT EXISTS public.transporter_expense_settings (
    transporter_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    per_diem_rate DECIMAL(15,2) DEFAULT 0,
    mileage_rate DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'XAF',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_driver_expenses_driver_id ON public.driver_expenses(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_expenses_claim_id ON public.driver_expenses(claim_id);
CREATE INDEX IF NOT EXISTS idx_driver_expenses_shipment_id ON public.driver_expenses(shipment_id);
CREATE INDEX IF NOT EXISTS idx_driver_expense_claims_driver_id ON public.driver_expense_claims(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_expense_claims_transporter_id ON public.driver_expense_claims(transporter_id);
CREATE INDEX IF NOT EXISTS idx_driver_mileage_logs_driver_id ON public.driver_mileage_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_mileage_logs_shipment_id ON public.driver_mileage_logs(shipment_id);

-- RLS
ALTER TABLE public.driver_expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_mileage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transporter_expense_settings ENABLE ROW LEVEL SECURITY;

-- Policy for driver_expense_claims
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'driver_expense_claims' AND policyname = 'Drivers can view their own claims') THEN
        CREATE POLICY "Drivers can view their own claims" ON public.driver_expense_claims FOR SELECT USING (auth.uid() = driver_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'driver_expense_claims' AND policyname = 'Drivers can insert their own claims') THEN
        CREATE POLICY "Drivers can insert their own claims" ON public.driver_expense_claims FOR INSERT WITH CHECK (auth.uid() = driver_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'driver_expense_claims' AND policyname = 'Transporters can view claims submitted to them') THEN
        CREATE POLICY "Transporters can view claims submitted to them" ON public.driver_expense_claims FOR SELECT USING (auth.uid() = transporter_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'driver_expense_claims' AND policyname = 'Transporters can update claims submitted to them') THEN
        CREATE POLICY "Transporters can update claims submitted to them" ON public.driver_expense_claims FOR UPDATE USING (auth.uid() = transporter_id);
    END IF;
END $$;

-- Policy for driver_expenses
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'driver_expenses' AND policyname = 'Drivers can manage their own expenses') THEN
        CREATE POLICY "Drivers can manage their own expenses" ON public.driver_expenses FOR ALL USING (auth.uid() = driver_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'driver_expenses' AND policyname = 'Transporters can view expenses of their drivers via claims') THEN
        CREATE POLICY "Transporters can view expenses of their drivers via claims" ON public.driver_expenses FOR SELECT 
        USING (EXISTS (SELECT 1 FROM public.driver_expense_claims c WHERE c.id = claim_id AND c.transporter_id = auth.uid()));
    END IF;
END $$;

-- Policy for driver_mileage_logs
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'driver_mileage_logs' AND policyname = 'Drivers can manage their own mileage logs') THEN
        CREATE POLICY "Drivers can manage their own mileage logs" ON public.driver_mileage_logs FOR ALL USING (auth.uid() = driver_id);
    END IF;
END $$;

-- Policy for transporter_expense_settings
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transporter_expense_settings' AND policyname = 'Transporters can manage their own settings') THEN
        CREATE POLICY "Transporters can manage their own settings" ON public.transporter_expense_settings FOR ALL USING (auth.uid() = transporter_user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transporter_expense_settings' AND policyname = 'Drivers can view their transporter settings') THEN
        CREATE POLICY "Drivers can view their transporter settings" ON public.transporter_expense_settings FOR SELECT 
        USING (EXISTS (SELECT 1 FROM public.driver_assignments a WHERE a.driver_user_id = auth.uid() AND a.transporter_user_id = transporter_user_id AND a.is_active = true));
    END IF;
END $$;

-- Triggers
CREATE TRIGGER update_driver_expense_claims_updated_at BEFORE UPDATE ON public.driver_expense_claims FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_driver_expenses_updated_at BEFORE UPDATE ON public.driver_expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_driver_mileage_logs_updated_at BEFORE UPDATE ON public.driver_mileage_logs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_transporter_expense_settings_updated_at BEFORE UPDATE ON public.transporter_expense_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Note: These might fail if already exist, so using DO blocks for safety
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Drivers can upload their own receipts' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Drivers can upload their own receipts" ON storage.objects FOR INSERT TO authenticated 
        WITH CHECK (bucket_id = 'expense-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Drivers can view their own receipts' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Drivers can view their own receipts" ON storage.objects FOR SELECT TO authenticated 
        USING (bucket_id = 'expense-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Transporters can view receipts' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Transporters can view receipts" ON storage.objects FOR SELECT TO authenticated 
        USING (bucket_id = 'expense-receipts');
    END IF;
END $$;
