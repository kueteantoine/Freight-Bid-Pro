-- Broker Commission Tracking & Financial Management Schema (Prompt 40)
-- This migration creates tables for commission tracking, rate configuration, client billing, and carrier payments

-- Create commission type enum
DO $$ BEGIN
    CREATE TYPE commission_type AS ENUM ('shipper_side', 'carrier_side', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create rate type enum
DO $$ BEGIN
    CREATE TYPE rate_type AS ENUM ('default', 'client_specific', 'route_based', 'volume_tier');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create invoice type enum
DO $$ BEGIN
    CREATE TYPE invoice_type AS ENUM ('commission', 'service_fee', 'monthly_statement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create payment status enum (if not exists)
DO $$ BEGIN
    CREATE TYPE broker_payment_status AS ENUM ('pending', 'scheduled', 'processing', 'paid', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- BROKER_COMMISSIONS table
-- Tracks all commission earnings from brokered transactions
CREATE TABLE IF NOT EXISTS public.broker_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
    shipper_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    carrier_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Financial details
    gross_amount DECIMAL(12,2) NOT NULL CHECK (gross_amount >= 0),
    commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
    commission_amount DECIMAL(12,2) NOT NULL CHECK (commission_amount >= 0),
    commission_type commission_type NOT NULL DEFAULT 'shipper_side',
    
    -- Payment tracking
    payment_status broker_payment_status DEFAULT 'pending',
    payment_date TIMESTAMPTZ,
    payment_reference TEXT,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BROKER_COMMISSION_RATES table
-- Stores configurable commission rate rules
CREATE TABLE IF NOT EXISTS public.broker_commission_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Rate configuration
    rate_type rate_type NOT NULL DEFAULT 'default',
    rate_name TEXT NOT NULL,
    commission_percentage DECIMAL(5,2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
    
    -- Applicability rules
    client_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- For client-specific rates
    route_origin TEXT, -- For route-based rates
    route_destination TEXT, -- For route-based rates
    freight_type TEXT, -- For freight-type-specific rates
    
    -- Volume tier configuration
    min_shipments_per_month INTEGER DEFAULT 0,
    max_shipments_per_month INTEGER,
    min_transaction_amount DECIMAL(12,2),
    max_transaction_amount DECIMAL(12,2),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Higher priority rates are applied first
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure at least one applicability rule is set for non-default rates
    CHECK (
        rate_type = 'default' OR 
        client_user_id IS NOT NULL OR 
        route_origin IS NOT NULL OR 
        freight_type IS NOT NULL OR
        min_shipments_per_month > 0
    )
);

-- BROKER_CLIENT_INVOICES table
-- Manages invoicing for broker services to shipper clients
CREATE TABLE IF NOT EXISTS public.broker_client_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Invoice details
    invoice_number TEXT UNIQUE NOT NULL,
    invoice_type invoice_type NOT NULL DEFAULT 'commission',
    
    -- Billing period
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    
    -- Financial details
    subtotal_amount DECIMAL(12,2) NOT NULL CHECK (subtotal_amount >= 0),
    tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    
    -- Itemized breakdown (JSON array of line items)
    items_json JSONB DEFAULT '[]',
    
    -- Payment tracking
    payment_status broker_payment_status DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_date TIMESTAMPTZ,
    payment_method TEXT,
    payment_reference TEXT,
    
    -- Document storage
    invoice_pdf_url TEXT,
    
    -- Metadata
    notes TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK (billing_period_end >= billing_period_start)
);

-- BROKER_CARRIER_PAYMENTS table
-- Tracks payments owed to carrier partners for brokered shipments
CREATE TABLE IF NOT EXISTS public.broker_carrier_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    carrier_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    commission_id UUID REFERENCES public.broker_commissions(id) ON DELETE SET NULL,
    
    -- Payment details
    gross_shipment_amount DECIMAL(12,2) NOT NULL CHECK (gross_shipment_amount >= 0),
    broker_commission_amount DECIMAL(12,2) NOT NULL CHECK (broker_commission_amount >= 0),
    net_carrier_payment DECIMAL(12,2) NOT NULL CHECK (net_carrier_payment >= 0),
    
    -- Payment tracking
    payment_status broker_payment_status DEFAULT 'pending',
    scheduled_payment_date DATE,
    actual_payment_date TIMESTAMPTZ,
    payment_method TEXT,
    payment_reference TEXT,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK (gross_shipment_amount = broker_commission_amount + net_carrier_payment)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_broker_commissions_broker_id ON public.broker_commissions(broker_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_commissions_transaction_id ON public.broker_commissions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_broker_commissions_shipment_id ON public.broker_commissions(shipment_id);
CREATE INDEX IF NOT EXISTS idx_broker_commissions_status ON public.broker_commissions(payment_status);
CREATE INDEX IF NOT EXISTS idx_broker_commissions_date ON public.broker_commissions(created_at);

CREATE INDEX IF NOT EXISTS idx_broker_commission_rates_broker_id ON public.broker_commission_rates(broker_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_commission_rates_client_id ON public.broker_commission_rates(client_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_commission_rates_active ON public.broker_commission_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_broker_commission_rates_priority ON public.broker_commission_rates(priority DESC);

CREATE INDEX IF NOT EXISTS idx_broker_client_invoices_broker_id ON public.broker_client_invoices(broker_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_client_invoices_client_id ON public.broker_client_invoices(client_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_client_invoices_status ON public.broker_client_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_broker_client_invoices_due_date ON public.broker_client_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_broker_client_invoices_number ON public.broker_client_invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_broker_carrier_payments_broker_id ON public.broker_carrier_payments(broker_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_carrier_payments_carrier_id ON public.broker_carrier_payments(carrier_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_carrier_payments_shipment_id ON public.broker_carrier_payments(shipment_id);
CREATE INDEX IF NOT EXISTS idx_broker_carrier_payments_status ON public.broker_carrier_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_broker_carrier_payments_scheduled_date ON public.broker_carrier_payments(scheduled_payment_date);

-- Enable RLS
ALTER TABLE public.broker_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_client_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_carrier_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for broker_commissions
CREATE POLICY "Brokers can view their own commissions"
    ON public.broker_commissions FOR SELECT
    USING (auth.uid() = broker_user_id);

CREATE POLICY "Brokers can manage their own commissions"
    ON public.broker_commissions FOR ALL
    USING (auth.uid() = broker_user_id);

-- RLS Policies for broker_commission_rates
CREATE POLICY "Brokers can view their own commission rates"
    ON public.broker_commission_rates FOR SELECT
    USING (auth.uid() = broker_user_id);

CREATE POLICY "Brokers can manage their own commission rates"
    ON public.broker_commission_rates FOR ALL
    USING (auth.uid() = broker_user_id);

-- RLS Policies for broker_client_invoices
CREATE POLICY "Brokers can view their own client invoices"
    ON public.broker_client_invoices FOR SELECT
    USING (auth.uid() = broker_user_id);

CREATE POLICY "Clients can view their own invoices"
    ON public.broker_client_invoices FOR SELECT
    USING (auth.uid() = client_user_id);

CREATE POLICY "Brokers can manage their own client invoices"
    ON public.broker_client_invoices FOR ALL
    USING (auth.uid() = broker_user_id);

-- RLS Policies for broker_carrier_payments
CREATE POLICY "Brokers can view their carrier payments"
    ON public.broker_carrier_payments FOR SELECT
    USING (auth.uid() = broker_user_id);

CREATE POLICY "Carriers can view their own payments"
    ON public.broker_carrier_payments FOR SELECT
    USING (auth.uid() = carrier_user_id);

CREATE POLICY "Brokers can manage their carrier payments"
    ON public.broker_carrier_payments FOR ALL
    USING (auth.uid() = broker_user_id);

-- Triggers for updated_at
CREATE TRIGGER update_broker_commissions_updated_at
    BEFORE UPDATE ON public.broker_commissions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_broker_commission_rates_updated_at
    BEFORE UPDATE ON public.broker_commission_rates
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_broker_client_invoices_updated_at
    BEFORE UPDATE ON public.broker_client_invoices
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_broker_carrier_payments_updated_at
    BEFORE UPDATE ON public.broker_carrier_payments
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Function to generate unique invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Format: INV-YYYYMMDD-XXXX
    counter := (
        SELECT COUNT(*) + 1 
        FROM public.broker_client_invoices 
        WHERE DATE(created_at) = CURRENT_DATE
    );
    
    new_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically calculate commission based on configured rates
CREATE OR REPLACE FUNCTION calculate_broker_commission(
    p_broker_user_id UUID,
    p_client_user_id UUID,
    p_shipment_amount DECIMAL,
    p_route_origin TEXT DEFAULT NULL,
    p_route_destination TEXT DEFAULT NULL,
    p_freight_type TEXT DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
    applicable_rate DECIMAL;
    commission_amount DECIMAL;
BEGIN
    -- Find the most applicable rate (highest priority first)
    SELECT commission_percentage INTO applicable_rate
    FROM public.broker_commission_rates
    WHERE broker_user_id = p_broker_user_id
        AND is_active = true
        AND (
            -- Client-specific rate
            (rate_type = 'client_specific' AND client_user_id = p_client_user_id) OR
            -- Route-based rate
            (rate_type = 'route_based' AND route_origin = p_route_origin AND route_destination = p_route_destination) OR
            -- Freight-type rate
            (freight_type = p_freight_type) OR
            -- Default rate
            (rate_type = 'default')
        )
        AND (min_transaction_amount IS NULL OR p_shipment_amount >= min_transaction_amount)
        AND (max_transaction_amount IS NULL OR p_shipment_amount <= max_transaction_amount)
    ORDER BY priority DESC, rate_type ASC
    LIMIT 1;
    
    -- If no rate found, return 0
    IF applicable_rate IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate commission
    commission_amount := (p_shipment_amount * applicable_rate) / 100;
    
    RETURN commission_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to create commission record when shipment is completed
CREATE OR REPLACE FUNCTION create_broker_commission_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    broker_id UUID;
    commission_rate DECIMAL;
    commission_amt DECIMAL;
BEGIN
    -- Check if this transaction involves a broker
    -- (This assumes there's a way to identify broker transactions - adjust as needed)
    -- For now, we'll check if the shipper is in a broker's network
    
    SELECT bsn.broker_user_id, bsn.commission_rate
    INTO broker_id, commission_rate
    FROM public.broker_shipper_network bsn
    WHERE bsn.shipper_user_id = NEW.payer_user_id
        AND bsn.relationship_status = 'active'
    LIMIT 1;
    
    IF broker_id IS NOT NULL THEN
        -- Calculate commission
        commission_amt := (NEW.gross_amount * commission_rate) / 100;
        
        -- Create commission record
        INSERT INTO public.broker_commissions (
            broker_user_id,
            transaction_id,
            shipment_id,
            shipper_user_id,
            carrier_user_id,
            gross_amount,
            commission_rate,
            commission_amount,
            commission_type,
            payment_status
        ) VALUES (
            broker_id,
            NEW.id,
            NEW.shipment_id,
            NEW.payer_user_id,
            NEW.payee_user_id,
            NEW.gross_amount,
            commission_rate,
            commission_amt,
            'shipper_side',
            'pending'
        );
        
        -- Create carrier payment record
        INSERT INTO public.broker_carrier_payments (
            broker_user_id,
            carrier_user_id,
            shipment_id,
            transaction_id,
            commission_id,
            gross_shipment_amount,
            broker_commission_amount,
            net_carrier_payment,
            payment_status
        ) VALUES (
            broker_id,
            NEW.payee_user_id,
            NEW.shipment_id,
            NEW.id,
            (SELECT id FROM public.broker_commissions WHERE transaction_id = NEW.id ORDER BY created_at DESC LIMIT 1),
            NEW.gross_amount,
            commission_amt,
            NEW.gross_amount - commission_amt,
            'pending'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create commission records on payment completion
CREATE TRIGGER trigger_create_broker_commission
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    WHEN (NEW.payment_status = 'completed' AND NEW.transaction_type = 'shipment_payment')
    EXECUTE PROCEDURE create_broker_commission_on_payment();
