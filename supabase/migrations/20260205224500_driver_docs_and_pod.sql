-- Migration: Driver Document Management & Proof of Delivery (Prompt 33)
-- Date: 2026-02-05

-- 1. Create SHIPMENT_DOCUMENTS table
CREATE TABLE IF NOT EXISTS public.shipment_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- 'gate_pass', 'pickup_cargo', 'delivery_cargo', 'delivery_location', 'bol', 'other'
    file_url TEXT NOT NULL, -- Supabase storage path
    notes TEXT,
    annotations_json JSONB DEFAULT '[]', -- For photo markups
    uploaded_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for shipment lookup
CREATE INDEX IF NOT EXISTS idx_shipment_documents_shipment_id ON public.shipment_documents(shipment_id);

-- Enable RLS
ALTER TABLE public.shipment_documents ENABLE ROW LEVEL SECURITY;

-- 2. Create PROOF_OF_DELIVERY table
CREATE TABLE IF NOT EXISTS public.proof_of_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL UNIQUE REFERENCES public.shipments(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    signature_url TEXT NOT NULL, -- Supabase storage path
    delivered_at TIMESTAMPTZ DEFAULT NOW(),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.proof_of_delivery ENABLE ROW LEVEL SECURITY;

-- 3. Create DIGITAL_BOL table
CREATE TABLE IF NOT EXISTS public.digital_bol (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL UNIQUE REFERENCES public.shipments(id) ON DELETE CASCADE,
    bol_number TEXT UNIQUE NOT NULL,
    shipper_signature_url TEXT,
    carrier_signature_url TEXT,
    items_json JSONB, -- Snapshotted items at time of BOL creation
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'signed_by_shipper', 'signed_by_carrier', 'fully_signed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.digital_bol ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Shipment Documents Policies
CREATE POLICY "Drivers can manage documents for their assigned shipments"
    ON public.shipment_documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = shipment_documents.shipment_id
            AND shipments.assigned_driver_user_id = auth.uid()
        )
    );

CREATE POLICY "Transporters can view documents for their shipments"
    ON public.shipment_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = shipment_documents.shipment_id
            AND shipments.assigned_carrier_user_id = auth.uid()
        )
    );

CREATE POLICY "Shippers can view documents for their shipments"
    ON public.shipment_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = shipment_documents.shipment_id
            AND shipments.shipper_user_id = auth.uid()
        )
    );

-- POD Policies
CREATE POLICY "Drivers can manage POD for their assigned shipments"
    ON public.proof_of_delivery FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = proof_of_delivery.shipment_id
            AND shipments.assigned_driver_user_id = auth.uid()
        )
    );

CREATE POLICY "Shippers and Transporters can view POD"
    ON public.proof_of_delivery FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = proof_of_delivery.shipment_id
            AND (shipments.shipper_user_id = auth.uid() OR shipments.assigned_carrier_user_id = auth.uid())
        )
    );

-- BOL Policies
CREATE POLICY "Drivers can manage BOL for their assigned shipments"
    ON public.digital_bol FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = digital_bol.shipment_id
            AND shipments.assigned_driver_user_id = auth.uid()
        )
    );

CREATE POLICY "Shippers and Transporters can view BOL"
    ON public.digital_bol FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = digital_bol.shipment_id
            AND (shipments.shipper_user_id = auth.uid() OR shipments.assigned_carrier_user_id = auth.uid())
        )
    );

-- Triggers for updated_at
CREATE TRIGGER update_shipment_documents_updated_at BEFORE UPDATE ON public.shipment_documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_proof_of_delivery_updated_at BEFORE UPDATE ON public.proof_of_delivery FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_digital_bol_updated_at BEFORE UPDATE ON public.digital_bol FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
