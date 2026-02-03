-- Migration: Driver Schedule and Status (Prompt 31)

-- 1. Create DRIVER_STATUS table
-- Tracks real-time status (online/busy/offline) separate from recurring availability
CREATE TABLE IF NOT EXISTS public.driver_status (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'offline')),
    current_latitude DECIMAL,
    current_longitude DECIMAL,
    last_location_update TIMESTAMPTZ,
    current_session_started_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.driver_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can manage their own status"
    ON public.driver_status FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Transporters can view their drivers' status"
    ON public.driver_status FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.driver_assignments
            WHERE driver_assignments.driver_user_id = driver_status.user_id
            AND driver_assignments.transporter_user_id = auth.uid()
            AND driver_assignments.is_active = true
        )
    );

CREATE POLICY "Shippers can view status of assigned drivers"
    ON public.driver_status FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipment_assignments sa
            JOIN public.shipments s ON sa.shipment_id = s.id
            WHERE sa.driver_user_id = driver_status.user_id
            AND s.shipper_user_id = auth.uid()
            AND sa.assignment_status IN ('accepted', 'in_progress')
        )
    );

-- 2. Create TIME_OFF_REQUESTS table
CREATE TABLE IF NOT EXISTS public.time_off_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_time_off_requests_driver ON public.time_off_requests(driver_user_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_transporter ON public.time_off_requests(transporter_user_id);

-- Enable RLS
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view and create their own time off requests"
    ON public.time_off_requests FOR ALL
    USING (auth.uid() = driver_user_id);

CREATE POLICY "Transporters can manage time off requests for their drivers"
    ON public.time_off_requests FOR ALL
    USING (auth.uid() = transporter_user_id);

-- 3. Create VEHICLE_CHECKLISTS table
CREATE TABLE IF NOT EXISTS public.vehicle_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    fuel_level TEXT CHECK (fuel_level IN ('empty', 'low', 'half', 'full')),
    tire_pressure_ok BOOLEAN DEFAULT false,
    cleanliness_ok BOOLEAN DEFAULT false,
    safety_equipment_ok BOOLEAN DEFAULT false,
    gps_functional BOOLEAN DEFAULT false,
    notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_checklists_driver ON public.vehicle_checklists(driver_user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_checklists_vehicle ON public.vehicle_checklists(vehicle_id);

-- Enable RLS
ALTER TABLE public.vehicle_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can create checklists"
    ON public.vehicle_checklists FOR INSERT
    WITH CHECK (auth.uid() = driver_user_id);

CREATE POLICY "Drivers can view their own checklists"
    ON public.vehicle_checklists FOR SELECT
    USING (auth.uid() = driver_user_id);

CREATE POLICY "Transporters can view checklists for their vehicles"
    ON public.vehicle_checklists FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.vehicles
            WHERE vehicles.id = vehicle_checklists.vehicle_id
            AND vehicles.transporter_user_id = auth.uid()
        )
    );

-- 4. Create SHIFT_LOGS table
CREATE TABLE IF NOT EXISTS public.shift_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shift_start TIMESTAMPTZ DEFAULT NOW(),
    shift_end TIMESTAMPTZ,
    jobs_completed INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shift_logs_driver ON public.shift_logs(driver_user_id);

-- Enable RLS
ALTER TABLE public.shift_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their own shift logs"
    ON public.shift_logs FOR SELECT
    USING (auth.uid() = driver_user_id);
    
-- Drivers system insert/update policy via server functions usually, but allowing insert for now if we do client-side
CREATE POLICY "Drivers can insert/update their own shift logs"
    ON public.shift_logs FOR ALL
    USING (auth.uid() = driver_user_id);


-- Trigger for updated_at
CREATE TRIGGER update_driver_status_updated_at BEFORE UPDATE ON public.driver_status FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_time_off_requests_updated_at BEFORE UPDATE ON public.time_off_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_shift_logs_updated_at BEFORE UPDATE ON public.shift_logs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
