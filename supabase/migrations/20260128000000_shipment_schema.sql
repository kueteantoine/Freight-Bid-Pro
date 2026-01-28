-- Create UPDATED_AT trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create SHIPMENTS table if not exists (Prompt 3)
CREATE TYPE shipment_status AS ENUM (
    'draft', 
    'open_for_bidding', 
    'bid_awarded', 
    'in_transit', 
    'delivered', 
    'cancelled'
);

CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipper_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipment_number TEXT UNIQUE NOT NULL,
    pickup_location TEXT NOT NULL,
    pickup_latitude DECIMAL(9,6),
    pickup_longitude DECIMAL(9,6),
    delivery_location TEXT NOT NULL,
    delivery_latitude DECIMAL(9,6),
    delivery_longitude DECIMAL(9,6),
    scheduled_pickup_date TIMESTAMPTZ NOT NULL,
    scheduled_delivery_date TIMESTAMPTZ,
    freight_type TEXT NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL,
    dimensions_json JSONB DEFAULT '{"length": 0, "width": 0, "height": 0}',
    quantity INTEGER DEFAULT 1,
    special_handling_requirements TEXT,
    preferred_vehicle_type TEXT,
    insurance_required BOOLEAN DEFAULT false,
    insurance_value DECIMAL(12,2) DEFAULT 0,
    loading_requirements TEXT,
    unloading_requirements TEXT,
    status shipment_status DEFAULT 'open_for_bidding',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for shipments
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shippers can manage their own shipments"
    ON public.shipments FOR ALL
    USING (auth.uid() = shipper_user_id);

CREATE POLICY "Everyone can view open shipments"
    ON public.shipments FOR SELECT
    USING (status = 'open_for_bidding');

-- Trigger for update_updated_at_column
CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON public.shipments
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create SHIPMENT_TEMPLATES table
CREATE TABLE IF NOT EXISTS public.shipment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    pickup_location TEXT,
    delivery_location TEXT,
    freight_type TEXT,
    weight_kg DECIMAL(10,2),
    dimensions_json JSONB,
    preferred_vehicle_type TEXT,
    special_handling_requirements TEXT,
    insurance_required BOOLEAN DEFAULT false,
    insurance_value DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for shipment_templates
ALTER TABLE public.shipment_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own templates"
    ON public.shipment_templates FOR ALL
    USING (auth.uid() = user_id);

-- Create SHIPMENT_DRAFTS table for auto-save
CREATE TABLE IF NOT EXISTS public.shipment_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    last_saved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS for shipment_drafts
ALTER TABLE public.shipment_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own drafts"
    ON public.shipment_drafts FOR ALL
    USING (auth.uid() = user_id);

-- Function to auto-generate shipment number (e.g., SHP-2024-0001)
CREATE OR REPLACE FUNCTION generate_shipment_number() 
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    next_val TEXT;
BEGIN
    year_prefix := TO_CHAR(NOW(), 'YYYY');
    SELECT LPAD(COUNT(*)::TEXT, 4, '0') INTO next_val 
    FROM public.shipments 
    WHERE TO_CHAR(created_at, 'YYYY') = year_prefix;
    
    NEW.shipment_number := 'SHP-' || year_prefix || '-' || LPAD((next_val::INT + 1)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_shipment_number
    BEFORE INSERT ON public.shipments
    FOR EACH ROW
    WHEN (NEW.shipment_number IS NULL)
    EXECUTE PROCEDURE generate_shipment_number();
