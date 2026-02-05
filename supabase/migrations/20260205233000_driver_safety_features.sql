-- Migration for Driver Safety & Emergency Features (Prompt 36)

-- 1. Emergency Alerts
CREATE TYPE emergency_alert_type AS ENUM ('sos', 'panic');

CREATE TABLE IF NOT EXISTS public.emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
    alert_type emergency_alert_type NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    location_name TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Incident Reports
CREATE TYPE incident_type AS ENUM ('minor_accident', 'major_accident', 'injury', 'theft', 'other');

CREATE TABLE IF NOT EXISTS public.incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    incident_type incident_type NOT NULL,
    description TEXT,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    location_description TEXT,
    witness_info JSONB DEFAULT '[]',
    police_report_number TEXT,
    evidence_urls JSONB DEFAULT '[]', -- Array of image URLs
    incident_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Shipment Delays
CREATE TYPE delay_reason AS ENUM ('traffic', 'vehicle_issue', 'weather', 'loading_delay', 'other');

CREATE TABLE IF NOT EXISTS public.shipment_delays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    recorded_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason delay_reason NOT NULL,
    explanation TEXT,
    estimated_delay_minutes INTEGER,
    new_eta TIMESTAMPTZ,
    evidence_urls JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Safety Check-ins
CREATE TYPE safety_checkin_status AS ENUM ('pending', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS public.safety_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
    status safety_checkin_status DEFAULT 'pending',
    checkin_due_at TIMESTAMPTZ NOT NULL,
    responded_at TIMESTAMPTZ,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Vehicle Breakdowns
CREATE TABLE IF NOT EXISTS public.vehicle_breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
    description TEXT,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    location_name TEXT,
    assistance_requested BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Indexes
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_driver ON public.emergency_alerts(driver_user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created ON public.emergency_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_incident_reports_shipment ON public.incident_reports(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_delays_shipment ON public.shipment_delays(shipment_id);
CREATE INDEX IF NOT EXISTS idx_safety_checkins_driver ON public.safety_checkins(driver_user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_breakdowns_vehicle ON public.vehicle_breakdowns(vehicle_id);

-- RLS Policies

ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_breakdowns ENABLE ROW LEVEL SECURITY;

-- 1. Emergency Alerts RLS
CREATE POLICY "Drivers can insert their own emergency alerts"
    ON public.emergency_alerts FOR INSERT
    WITH CHECK (auth.uid() = driver_user_id);

CREATE POLICY "Drivers can view their own emergency alerts"
    ON public.emergency_alerts FOR SELECT
    USING (auth.uid() = driver_user_id);

-- 2. Incident Reports RLS
CREATE POLICY "Drivers can insert their own incident reports"
    ON public.incident_reports FOR INSERT
    WITH CHECK (auth.uid() = driver_user_id);

CREATE POLICY "Drivers can view their own incident reports"
    ON public.incident_reports FOR SELECT
    USING (auth.uid() = driver_user_id);

-- 3. Shipment Delays RLS
CREATE POLICY "Drivers can insert delays for assigned shipments"
    ON public.shipment_delays FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.shipments
        WHERE id = shipment_delays.shipment_id
        AND assigned_driver_user_id = auth.uid()
    ));

CREATE POLICY "Drivers can view delays for assigned shipments"
    ON public.shipment_delays FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.shipments
        WHERE id = shipment_delays.shipment_id
        AND assigned_driver_user_id = auth.uid()
    ));

-- 4. Safety Check-ins RLS
CREATE POLICY "Drivers can view and update their own check-ins"
    ON public.safety_checkins FOR ALL
    USING (auth.uid() = driver_user_id);

-- 5. Vehicle Breakdowns RLS
CREATE POLICY "Drivers can report breakdowns"
    ON public.vehicle_breakdowns FOR INSERT
    WITH CHECK (auth.uid() = driver_user_id);

CREATE POLICY "Drivers can view their own reported breakdowns"
    ON public.vehicle_breakdowns FOR SELECT
    USING (auth.uid() = driver_user_id);

-- Grant permissions (if needed, usually Supabase handles this based on role)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
