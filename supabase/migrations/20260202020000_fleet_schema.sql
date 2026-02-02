-- Create VEHICLES table (Prompt 21)
CREATE TYPE vehicle_status AS ENUM ('active', 'maintenance', 'inactive');

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    registration_number TEXT UNIQUE NOT NULL,
    license_plate TEXT UNIQUE NOT NULL,
    capacity_kg DECIMAL(10,2) NOT NULL,
    capacity_cubic_meters DECIMAL(10,2),
    insurance_policy_number TEXT,
    insurance_expiry_date DATE,
    gps_device_id TEXT,
    last_maintenance_date DATE,
    next_maintenance_due_date DATE,
    status vehicle_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for transporter query optimization
CREATE INDEX IF NOT EXISTS idx_vehicles_transporter_user_id ON public.vehicles(transporter_user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);

-- Enable RLS for vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporters can manage their own vehicles"
    ON public.vehicles FOR ALL
    USING (auth.uid() = transporter_user_id);

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create VEHICLE_DOCUMENTS table
CREATE TYPE vehicle_document_type AS ENUM ('registration', 'insurance', 'permit', 'inspection', 'other');

CREATE TABLE IF NOT EXISTS public.vehicle_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    document_type vehicle_document_type NOT NULL,
    document_number TEXT,
    document_url TEXT NOT NULL, -- Supabase storage path
    issue_date DATE,
    expiry_date DATE,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for vehicle document queries
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON public.vehicle_documents(vehicle_id);

-- Enable RLS for vehicle_documents
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporters can manage their own vehicle documents"
    ON public.vehicle_documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.vehicles 
            WHERE vehicles.id = vehicle_documents.vehicle_id 
            AND vehicles.transporter_user_id = auth.uid()
        )
    );

-- Update user_roles to include transporter profile fields if needed
-- (They are already in role_specific_profile JSONB, but we can add specific fields to the TRANSPORTER_PROFILE table if we had one)
-- For Prompt 21, we will stick to the existing profiles table and use role_specific_profile for now, 
-- or ensure it's handled in the UI.

-- Add a comment to the migration
COMMENT ON TABLE public.vehicles IS 'Stores freight vehicle information for carriers/transporters.';
COMMENT ON TABLE public.vehicle_documents IS 'Stores legal and insurance documents for vehicles.';
