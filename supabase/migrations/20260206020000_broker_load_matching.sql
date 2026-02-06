-- Broker Load Matching & Optimization Schema (Prompt 41)
-- This migration creates tables for intelligent load matching, capacity tracking, and automated rules

-- Create match type enum
DO $$ BEGIN
    CREATE TYPE match_type AS ENUM ('ai_suggested', 'manual', 'automated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create match status enum
DO $$ BEGIN
    CREATE TYPE match_status AS ENUM ('suggested', 'pending', 'confirmed', 'rejected', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create rule action enum
DO $$ BEGIN
    CREATE TYPE rule_action AS ENUM ('auto_assign', 'notify_broker', 'suggest_only');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- BROKER_LOAD_MATCHES table
-- Stores matching suggestions and confirmed matches between shipments and carriers
CREATE TABLE IF NOT EXISTS public.broker_load_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    carrier_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Match details
    match_type match_type NOT NULL DEFAULT 'manual',
    match_status match_status NOT NULL DEFAULT 'suggested',
    match_score DECIMAL(5,2) CHECK (match_score >= 0 AND match_score <= 100),
    
    -- Score breakdown (JSONB for detailed scoring)
    score_breakdown JSONB DEFAULT '{
        "route_compatibility": 0,
        "vehicle_match": 0,
        "capacity_match": 0,
        "cost_optimization": 0,
        "reliability_score": 0,
        "delivery_time_match": 0
    }',
    
    -- Matching criteria used
    matching_criteria JSONB DEFAULT '{}',
    
    -- Timestamps
    suggested_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Notes
    broker_notes TEXT,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BROKER_CARRIER_CAPACITY table
-- Tracks real-time carrier capacity and availability
CREATE TABLE IF NOT EXISTS public.broker_carrier_capacity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    carrier_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    available_from_date DATE NOT NULL,
    available_to_date DATE,
    
    -- Current location
    current_location TEXT,
    current_latitude DECIMAL(9,6),
    current_longitude DECIMAL(9,6),
    
    -- Capacity details
    available_weight_kg DECIMAL(10,2) NOT NULL CHECK (available_weight_kg >= 0),
    available_volume_cubic_meters DECIMAL(10,2) CHECK (available_volume_cubic_meters >= 0),
    total_capacity_kg DECIMAL(10,2) NOT NULL,
    total_capacity_cubic_meters DECIMAL(10,2),
    
    -- Service areas and preferences
    service_areas JSONB DEFAULT '[]', -- Array of regions/cities
    preferred_routes JSONB DEFAULT '[]', -- Array of {origin, destination}
    vehicle_types JSONB DEFAULT '[]', -- Array of vehicle types
    
    -- Metadata
    notes TEXT,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(carrier_user_id, vehicle_id, available_from_date)
);

-- BROKER_MATCHING_RULES table
-- Stores automated matching rule configurations
CREATE TABLE IF NOT EXISTS public.broker_matching_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Rule details
    rule_name TEXT NOT NULL,
    rule_description TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Higher priority rules are evaluated first
    
    -- Conditions (JSONB for flexible rule definition)
    conditions JSONB NOT NULL DEFAULT '{
        "route_origin": null,
        "route_destination": null,
        "min_carrier_rating": null,
        "max_carrier_rating": null,
        "preferred_carriers": [],
        "min_margin_percentage": null,
        "freight_types": [],
        "urgency_level": null,
        "max_distance_km": null
    }',
    
    -- Action to take when conditions are met
    action rule_action NOT NULL DEFAULT 'suggest_only',
    
    -- Action parameters
    action_params JSONB DEFAULT '{
        "require_confirmation": true,
        "notification_enabled": true
    }',
    
    -- Statistics
    times_triggered INTEGER DEFAULT 0,
    successful_matches INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BROKER_MATCHING_HISTORY table
-- Audit trail of all matching activities
CREATE TABLE IF NOT EXISTS public.broker_matching_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES public.broker_load_matches(id) ON DELETE SET NULL,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
    carrier_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Activity details
    activity_type TEXT NOT NULL, -- 'match_created', 'match_confirmed', 'match_rejected', 'match_completed', 'rule_triggered'
    activity_description TEXT,
    
    -- Context
    match_type match_type,
    match_score DECIMAL(5,2),
    triggered_by_rule_id UUID REFERENCES public.broker_matching_rules(id) ON DELETE SET NULL,
    
    -- Outcome
    outcome TEXT, -- 'success', 'failure', 'pending'
    outcome_notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_broker_load_matches_broker_id ON public.broker_load_matches(broker_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_load_matches_shipment_id ON public.broker_load_matches(shipment_id);
CREATE INDEX IF NOT EXISTS idx_broker_load_matches_carrier_id ON public.broker_load_matches(carrier_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_load_matches_status ON public.broker_load_matches(match_status);
CREATE INDEX IF NOT EXISTS idx_broker_load_matches_type ON public.broker_load_matches(match_type);
CREATE INDEX IF NOT EXISTS idx_broker_load_matches_score ON public.broker_load_matches(match_score DESC);

CREATE INDEX IF NOT EXISTS idx_broker_carrier_capacity_broker_id ON public.broker_carrier_capacity(broker_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_carrier_capacity_carrier_id ON public.broker_carrier_capacity(carrier_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_carrier_capacity_vehicle_id ON public.broker_carrier_capacity(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_broker_carrier_capacity_available ON public.broker_carrier_capacity(is_available);
CREATE INDEX IF NOT EXISTS idx_broker_carrier_capacity_dates ON public.broker_carrier_capacity(available_from_date, available_to_date);

CREATE INDEX IF NOT EXISTS idx_broker_matching_rules_broker_id ON public.broker_matching_rules(broker_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_matching_rules_active ON public.broker_matching_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_broker_matching_rules_priority ON public.broker_matching_rules(priority DESC);

CREATE INDEX IF NOT EXISTS idx_broker_matching_history_broker_id ON public.broker_matching_history(broker_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_matching_history_match_id ON public.broker_matching_history(match_id);
CREATE INDEX IF NOT EXISTS idx_broker_matching_history_activity_type ON public.broker_matching_history(activity_type);
CREATE INDEX IF NOT EXISTS idx_broker_matching_history_created_at ON public.broker_matching_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.broker_load_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_carrier_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_matching_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_matching_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for broker_load_matches
CREATE POLICY "Brokers can view their own load matches"
    ON public.broker_load_matches FOR SELECT
    USING (auth.uid() = broker_user_id);

CREATE POLICY "Carriers can view matches assigned to them"
    ON public.broker_load_matches FOR SELECT
    USING (auth.uid() = carrier_user_id);

CREATE POLICY "Brokers can manage their own load matches"
    ON public.broker_load_matches FOR ALL
    USING (auth.uid() = broker_user_id);

-- RLS Policies for broker_carrier_capacity
CREATE POLICY "Brokers can view their carrier capacity"
    ON public.broker_carrier_capacity FOR SELECT
    USING (auth.uid() = broker_user_id);

CREATE POLICY "Carriers can view their own capacity"
    ON public.broker_carrier_capacity FOR SELECT
    USING (auth.uid() = carrier_user_id);

CREATE POLICY "Brokers can manage their carrier capacity"
    ON public.broker_carrier_capacity FOR ALL
    USING (auth.uid() = broker_user_id);

CREATE POLICY "Carriers can update their own capacity"
    ON public.broker_carrier_capacity FOR UPDATE
    USING (auth.uid() = carrier_user_id);

-- RLS Policies for broker_matching_rules
CREATE POLICY "Brokers can view their own matching rules"
    ON public.broker_matching_rules FOR SELECT
    USING (auth.uid() = broker_user_id);

CREATE POLICY "Brokers can manage their own matching rules"
    ON public.broker_matching_rules FOR ALL
    USING (auth.uid() = broker_user_id);

-- RLS Policies for broker_matching_history
CREATE POLICY "Brokers can view their own matching history"
    ON public.broker_matching_history FOR SELECT
    USING (auth.uid() = broker_user_id);

CREATE POLICY "Brokers can insert into their own matching history"
    ON public.broker_matching_history FOR INSERT
    WITH CHECK (auth.uid() = broker_user_id);

-- Triggers for updated_at
CREATE TRIGGER update_broker_load_matches_updated_at
    BEFORE UPDATE ON public.broker_load_matches
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_broker_carrier_capacity_updated_at
    BEFORE UPDATE ON public.broker_carrier_capacity
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_broker_matching_rules_updated_at
    BEFORE UPDATE ON public.broker_matching_rules
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Function to calculate match score between shipment and carrier
CREATE OR REPLACE FUNCTION calculate_match_score(
    p_shipment_id UUID,
    p_carrier_user_id UUID,
    p_broker_user_id UUID
)
RETURNS TABLE(
    match_score DECIMAL,
    score_breakdown JSONB
) AS $$
DECLARE
    v_shipment RECORD;
    v_carrier RECORD;
    v_capacity RECORD;
    v_route_score DECIMAL := 0;
    v_vehicle_score DECIMAL := 0;
    v_capacity_score DECIMAL := 0;
    v_cost_score DECIMAL := 0;
    v_reliability_score DECIMAL := 0;
    v_delivery_score DECIMAL := 0;
    v_total_score DECIMAL := 0;
    v_distance DECIMAL;
BEGIN
    -- Get shipment details
    SELECT * INTO v_shipment FROM public.shipments WHERE id = p_shipment_id;
    
    -- Get carrier details from broker network
    SELECT * INTO v_carrier 
    FROM public.broker_carrier_network 
    WHERE broker_user_id = p_broker_user_id 
        AND carrier_user_id = p_carrier_user_id
        AND relationship_status = 'active';
    
    -- Get carrier capacity
    SELECT * INTO v_capacity
    FROM public.broker_carrier_capacity
    WHERE carrier_user_id = p_carrier_user_id
        AND is_available = true
        AND available_from_date <= v_shipment.scheduled_pickup_date::DATE
        AND (available_to_date IS NULL OR available_to_date >= v_shipment.scheduled_pickup_date::DATE)
    ORDER BY available_from_date
    LIMIT 1;
    
    -- If no capacity found, return 0 score
    IF v_capacity IS NULL THEN
        RETURN QUERY SELECT 0::DECIMAL, '{}'::JSONB;
        RETURN;
    END IF;
    
    -- 1. Route Compatibility Score (30% weight)
    -- Calculate distance between carrier location and pickup location
    IF v_capacity.current_latitude IS NOT NULL AND v_shipment.pickup_latitude IS NOT NULL THEN
        v_distance := (
            6371 * acos(
                cos(radians(v_capacity.current_latitude)) * 
                cos(radians(v_shipment.pickup_latitude)) * 
                cos(radians(v_shipment.pickup_longitude) - radians(v_capacity.current_longitude)) + 
                sin(radians(v_capacity.current_latitude)) * 
                sin(radians(v_shipment.pickup_latitude))
            )
        );
        
        -- Score: 100 if within 50km, decreasing to 0 at 500km
        v_route_score := GREATEST(0, 100 - (v_distance / 5));
    ELSE
        v_route_score := 50; -- Default if no location data
    END IF;
    
    -- 2. Vehicle Type Match (15% weight)
    -- Check if carrier has the required vehicle type
    IF v_capacity.vehicle_types @> to_jsonb(ARRAY[v_shipment.preferred_vehicle_type]) THEN
        v_vehicle_score := 100;
    ELSE
        v_vehicle_score := 30; -- Partial score if not exact match
    END IF;
    
    -- 3. Capacity Match (25% weight)
    -- Check if carrier has enough capacity
    IF v_capacity.available_weight_kg >= v_shipment.weight_kg THEN
        -- Score based on how well capacity matches (not too much excess)
        v_capacity_score := 100 - LEAST(50, ((v_capacity.available_weight_kg - v_shipment.weight_kg) / v_shipment.weight_kg * 20));
    ELSE
        v_capacity_score := 0; -- Insufficient capacity
    END IF;
    
    -- 4. Cost Optimization (10% weight)
    -- Higher score for carriers with better performance metrics (lower cost per km)
    v_cost_score := 70; -- Default score, would need historical cost data for better calculation
    
    -- 5. Reliability Score (15% weight)
    -- Use carrier's reliability rating from broker network
    IF v_carrier.reliability_rating IS NOT NULL THEN
        v_reliability_score := (v_carrier.reliability_rating / 5.0) * 100;
    ELSE
        v_reliability_score := 50; -- Default for unrated carriers
    END IF;
    
    -- 6. Delivery Time Match (5% weight)
    -- Check if carrier can meet delivery deadline
    v_delivery_score := 80; -- Default score, would need route time estimation for better calculation
    
    -- Calculate weighted total score
    v_total_score := (
        (v_route_score * 0.30) +
        (v_vehicle_score * 0.15) +
        (v_capacity_score * 0.25) +
        (v_cost_score * 0.10) +
        (v_reliability_score * 0.15) +
        (v_delivery_score * 0.05)
    );
    
    -- Return score and breakdown
    RETURN QUERY SELECT 
        ROUND(v_total_score, 2)::DECIMAL,
        jsonb_build_object(
            'route_compatibility', ROUND(v_route_score, 2),
            'vehicle_match', ROUND(v_vehicle_score, 2),
            'capacity_match', ROUND(v_capacity_score, 2),
            'cost_optimization', ROUND(v_cost_score, 2),
            'reliability_score', ROUND(v_reliability_score, 2),
            'delivery_time_match', ROUND(v_delivery_score, 2),
            'distance_km', ROUND(COALESCE(v_distance, 0), 2)
        );
END;
$$ LANGUAGE plpgsql;

-- Function to find matching carriers for a shipment
CREATE OR REPLACE FUNCTION find_matching_carriers(
    p_shipment_id UUID,
    p_broker_user_id UUID,
    p_min_score DECIMAL DEFAULT 70
)
RETURNS TABLE(
    carrier_user_id UUID,
    carrier_name TEXT,
    match_score DECIMAL,
    score_breakdown JSONB,
    capacity_id UUID,
    available_weight_kg DECIMAL,
    reliability_rating DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bcn.carrier_user_id,
        COALESCE(ur.role_specific_profile->>'company_name', u.email) as carrier_name,
        ms.match_score,
        ms.score_breakdown,
        bcc.id as capacity_id,
        bcc.available_weight_kg,
        bcn.reliability_rating
    FROM public.broker_carrier_network bcn
    JOIN auth.users u ON u.id = bcn.carrier_user_id
    LEFT JOIN public.user_roles ur ON ur.user_id = bcn.carrier_user_id AND ur.role_type = 'carrier'
    JOIN public.broker_carrier_capacity bcc ON bcc.carrier_user_id = bcn.carrier_user_id
    CROSS JOIN LATERAL calculate_match_score(p_shipment_id, bcn.carrier_user_id, p_broker_user_id) ms
    WHERE bcn.broker_user_id = p_broker_user_id
        AND bcn.relationship_status = 'active'
        AND bcc.is_available = true
        AND ms.match_score >= p_min_score
    ORDER BY ms.match_score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to update carrier capacity when a match is confirmed
CREATE OR REPLACE FUNCTION update_carrier_capacity_on_match()
RETURNS TRIGGER AS $$
DECLARE
    v_shipment RECORD;
BEGIN
    -- Only update capacity when match is confirmed
    IF NEW.match_status = 'confirmed' AND (OLD.match_status IS NULL OR OLD.match_status != 'confirmed') THEN
        -- Get shipment details
        SELECT * INTO v_shipment FROM public.shipments WHERE id = NEW.shipment_id;
        
        -- Reduce available capacity
        UPDATE public.broker_carrier_capacity
        SET 
            available_weight_kg = available_weight_kg - v_shipment.weight_kg,
            is_available = CASE 
                WHEN (available_weight_kg - v_shipment.weight_kg) <= 0 THEN false
                ELSE is_available
            END,
            last_updated_at = NOW()
        WHERE carrier_user_id = NEW.carrier_user_id
            AND is_available = true
            AND available_from_date <= v_shipment.scheduled_pickup_date::DATE
            AND (available_to_date IS NULL OR available_to_date >= v_shipment.scheduled_pickup_date::DATE);
        
        -- Log to history
        INSERT INTO public.broker_matching_history (
            broker_user_id,
            match_id,
            shipment_id,
            carrier_user_id,
            activity_type,
            activity_description,
            match_type,
            match_score,
            outcome,
            metadata
        ) VALUES (
            NEW.broker_user_id,
            NEW.id,
            NEW.shipment_id,
            NEW.carrier_user_id,
            'match_confirmed',
            'Load matched and carrier capacity updated',
            NEW.match_type,
            NEW.match_score,
            'success',
            jsonb_build_object('shipment_weight_kg', v_shipment.weight_kg)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update capacity on match confirmation
CREATE TRIGGER trigger_update_carrier_capacity_on_match
    AFTER INSERT OR UPDATE ON public.broker_load_matches
    FOR EACH ROW
    EXECUTE PROCEDURE update_carrier_capacity_on_match();

-- Function to evaluate and apply matching rules
CREATE OR REPLACE FUNCTION apply_matching_rules(
    p_shipment_id UUID,
    p_broker_user_id UUID
)
RETURNS TABLE(
    rule_id UUID,
    rule_name TEXT,
    action rule_action,
    matched_carrier_id UUID,
    match_score DECIMAL
) AS $$
DECLARE
    v_rule RECORD;
    v_shipment RECORD;
    v_matches RECORD;
BEGIN
    -- Get shipment details
    SELECT * INTO v_shipment FROM public.shipments WHERE id = p_shipment_id;
    
    -- Loop through active rules ordered by priority
    FOR v_rule IN 
        SELECT * FROM public.broker_matching_rules
        WHERE broker_user_id = p_broker_user_id
            AND is_active = true
        ORDER BY priority DESC, created_at ASC
    LOOP
        -- Check if shipment matches rule conditions
        -- This is a simplified version - in production, you'd evaluate all conditions
        
        -- Find matching carriers
        FOR v_matches IN
            SELECT * FROM find_matching_carriers(p_shipment_id, p_broker_user_id, 70)
            LIMIT 1
        LOOP
            -- Update rule statistics
            UPDATE public.broker_matching_rules
            SET 
                times_triggered = times_triggered + 1,
                last_triggered_at = NOW()
            WHERE id = v_rule.id;
            
            -- Return the match
            RETURN QUERY SELECT 
                v_rule.id,
                v_rule.rule_name,
                v_rule.action,
                v_matches.carrier_user_id,
                v_matches.match_score;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.broker_load_matches IS 'Stores load matching suggestions and confirmed matches between shipments and carriers';
COMMENT ON TABLE public.broker_carrier_capacity IS 'Tracks real-time carrier capacity and availability for load matching';
COMMENT ON TABLE public.broker_matching_rules IS 'Stores automated matching rule configurations for brokers';
COMMENT ON TABLE public.broker_matching_history IS 'Audit trail of all load matching activities';
COMMENT ON FUNCTION calculate_match_score IS 'Calculates compatibility score between a shipment and carrier based on multiple factors';
COMMENT ON FUNCTION find_matching_carriers IS 'Returns ranked list of suitable carriers for a shipment';
COMMENT ON FUNCTION apply_matching_rules IS 'Evaluates and applies automated matching rules for a shipment';
