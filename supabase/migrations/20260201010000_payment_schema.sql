-- Create transaction type enum
CREATE TYPE transaction_type AS ENUM (
    'shipment_payment',
    'refund_full',
    'refund_partial',
    'commission_settlement'
);

-- Create payment method enum
CREATE TYPE payment_method AS ENUM (
    'orange_money',
    'mtn_momo',
    'card',
    'bank_transfer'
);

-- Create payment status enum
CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded_full',
    'refunded_partial'
);

-- Create invoice type enum
CREATE TYPE invoice_type AS ENUM (
    'payment',
    'refund_full',
    'refund_partial'
);

-- Create refund status enum
CREATE TYPE refund_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'processing',
    'completed'
);

-- Create TRANSACTIONS table (Prompt 5)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_type transaction_type NOT NULL,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
    payer_user_id UUID NOT NULL REFERENCES auth.users(id),
    payee_user_id UUID NOT NULL REFERENCES auth.users(id),
    gross_amount DECIMAL(12,2) NOT NULL,
    platform_commission_amount DECIMAL(12,2) DEFAULT 0,
    platform_commission_percentage DECIMAL(5,2) DEFAULT 0,
    aggregator_fee_amount DECIMAL(12,2) DEFAULT 0,
    aggregator_fee_percentage DECIMAL(5,2) DEFAULT 0,
    mobile_money_fee_amount DECIMAL(12,2) DEFAULT 0,
    mobile_money_fee_percentage DECIMAL(5,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'XAF',
    payment_method payment_method,
    aggregator_transaction_id TEXT UNIQUE,
    payment_status payment_status DEFAULT 'pending',
    payment_initiated_at TIMESTAMPTZ DEFAULT NOW(),
    payment_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create INVOICES table (Prompt 5)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    invoice_type invoice_type NOT NULL,
    issued_to_user_id UUID NOT NULL REFERENCES auth.users(id),
    invoice_data_json JSONB DEFAULT '{}',
    pdf_url TEXT,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create TRANSPORTER_WALLETS table (Prompt 5)
-- Using composite primary key (user_id, role_type)
CREATE TABLE IF NOT EXISTS public.transporter_wallets (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_type TEXT NOT NULL, -- e.g., 'transporter', 'driver', 'broker'
    gross_earnings DECIMAL(15,2) DEFAULT 0,
    total_commissions_paid DECIMAL(15,2) DEFAULT 0,
    total_aggregator_fees_paid DECIMAL(15,2) DEFAULT 0,
    total_mobile_money_fees_paid DECIMAL(15,2) DEFAULT 0,
    net_earnings DECIMAL(15,2) DEFAULT 0,
    pending_amount DECIMAL(15,2) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_type)
);

-- Create REFUND_REQUESTS table (Prompt 5)
CREATE TABLE IF NOT EXISTS public.refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id),
    requested_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    refund_type TEXT NOT NULL, -- 'full', 'partial'
    refund_percentage DECIMAL(5,2),
    refund_reason TEXT NOT NULL,
    refund_status refund_status DEFAULT 'pending',
    evidence_urls_json JSONB DEFAULT '[]',
    admin_notes TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_shipment_id ON public.transactions(shipment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payer_id ON public.transactions(payer_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payee_id ON public.transactions(payee_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_transaction_id ON public.invoices(transaction_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_to ON public.invoices(issued_to_user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_transaction_id ON public.refund_requests(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(refund_status);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transporter_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own transactions
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can view their own transactions') THEN
        CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = payer_user_id OR auth.uid() = payee_user_id);
    END IF;
END $$;

-- Users can view their own invoices
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can view their own invoices') THEN
        CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = issued_to_user_id);
    END IF;
END $$;

-- Transporters can view their own wallets
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transporter_wallets' AND policyname = 'Users can view their own wallets') THEN
        CREATE POLICY "Users can view their own wallets" ON public.transporter_wallets FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users involved in a transaction can see refund requests
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'refund_requests' AND policyname = 'Users can view related refund requests') THEN
        CREATE POLICY "Users can view related refund requests" ON public.refund_requests FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.transactions
                WHERE transactions.id = refund_requests.transaction_id
                AND (transactions.payer_user_id = auth.uid() OR transactions.payee_user_id = auth.uid())
            )
        );
    END IF;
END $$;

-- Functions and Triggers
-- Function to automatically update wallet balances when a transaction is completed
CREATE OR REPLACE FUNCTION update_transporter_wallet_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed')) THEN
        -- Upsert transporter wallet entry
        INSERT INTO public.transporter_wallets (
            user_id,
            role_type,
            gross_earnings,
            total_commissions_paid,
            total_aggregator_fees_paid,
            total_mobile_money_fees_paid,
            net_earnings,
            last_updated
        ) VALUES (
            NEW.payee_user_id,
            'transporter',
            NEW.gross_amount,
            NEW.platform_commission_amount,
            NEW.aggregator_fee_amount,
            NEW.mobile_money_fee_amount,
            NEW.net_amount,
            NOW()
        )
        ON CONFLICT (user_id, role_type) DO UPDATE SET
            gross_earnings = transporter_wallets.gross_earnings + EXCLUDED.gross_earnings,
            total_commissions_paid = transporter_wallets.total_commissions_paid + EXCLUDED.total_commissions_paid,
            total_aggregator_fees_paid = transporter_wallets.total_aggregator_fees_paid + EXCLUDED.total_aggregator_fees_paid,
            total_mobile_money_fees_paid = transporter_wallets.total_mobile_money_fees_paid + EXCLUDED.total_mobile_money_fees_paid,
            net_earnings = transporter_wallets.net_earnings + EXCLUDED.net_earnings,
            last_updated = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_wallet_on_payment') THEN
        CREATE TRIGGER trigger_update_wallet_on_payment
            AFTER UPDATE ON public.transactions
            FOR EACH ROW
            EXECUTE PROCEDURE update_transporter_wallet_on_payment();
    END IF;
END $$;

-- Updated at triggers
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_transactions_updated_at') THEN
        CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_refund_requests_updated_at') THEN
        CREATE TRIGGER update_refund_requests_updated_at BEFORE UPDATE ON public.refund_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;
