-- Create CARRIER_EXPENSES table (Prompt 26)
CREATE TABLE IF NOT EXISTS public.carrier_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL, -- 'fuel', 'maintenance', 'tolls', 'insurance', 'other'
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying expenses by user and date
CREATE INDEX IF NOT EXISTS idx_carrier_expenses_user_date ON public.carrier_expenses(user_id, expense_date);

-- Enable RLS
ALTER TABLE public.carrier_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can manage their own expenses
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'carrier_expenses' AND policyname = 'Users can manage their own expenses') THEN
        CREATE POLICY "Users can manage their own expenses" ON public.carrier_expenses
            FOR ALL
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Trigger for updated_at
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_carrier_expenses_updated_at') THEN
        CREATE TRIGGER update_carrier_expenses_updated_at 
            BEFORE UPDATE ON public.carrier_expenses 
            FOR EACH ROW 
            EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;
