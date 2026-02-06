-- Broker Network Management Schema (Prompt 39)
-- This migration creates tables for broker network management, relationship tracking, and interaction history

-- Create relationship status enum
DO $$ BEGIN
    CREATE TYPE relationship_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create interaction type enum
DO $$ BEGIN
    CREATE TYPE interaction_type AS ENUM ('call', 'meeting', 'email', 'contract_signed', 'issue_resolved', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create partner type enum
DO $$ BEGIN
    CREATE TYPE partner_type AS ENUM ('shipper', 'carrier');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- BROKER_SHIPPER_NETWORK table
-- Tracks shipper clients connected to brokers
CREATE TABLE IF NOT EXISTS public.broker_shipper_network (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shipper_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    relationship_status relationship_status DEFAULT 'active',
    commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
    total_shipments_brokered INTEGER DEFAULT 0,
    total_revenue_generated DECIMAL(12,2) DEFAULT 0,
    contract_details JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(broker_user_id, shipper_user_id)
);

-- BROKER_CARRIER_NETWORK table
-- Tracks carrier partners connected to brokers
CREATE TABLE IF NOT EXISTS public.broker_carrier_network (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    carrier_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    relationship_status relationship_status DEFAULT 'active',
    reliability_rating DECIMAL(3,2) CHECK (reliability_rating >= 0 AND reliability_rating <= 5),
    total_shipments_assigned INTEGER DEFAULT 0,
    performance_metrics JSONB DEFAULT '{"on_time_rate": 0, "completion_rate": 0, "average_rating": 0}',
    service_areas JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(broker_user_id, carrier_user_id)
);

-- BROKER_INTERACTIONS table
-- Tracks communication and interaction history between brokers and partners
CREATE TABLE IF NOT EXISTS public.broker_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_type partner_type NOT NULL,
    interaction_type interaction_type NOT NULL,
    interaction_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_broker_shipper_network_broker_id ON public.broker_shipper_network(broker_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_shipper_network_shipper_id ON public.broker_shipper_network(shipper_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_shipper_network_status ON public.broker_shipper_network(relationship_status);

CREATE INDEX IF NOT EXISTS idx_broker_carrier_network_broker_id ON public.broker_carrier_network(broker_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_carrier_network_carrier_id ON public.broker_carrier_network(carrier_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_carrier_network_status ON public.broker_carrier_network(relationship_status);

CREATE INDEX IF NOT EXISTS idx_broker_interactions_broker_id ON public.broker_interactions(broker_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_interactions_partner_id ON public.broker_interactions(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_interactions_date ON public.broker_interactions(interaction_date);

-- Enable RLS
ALTER TABLE public.broker_shipper_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_carrier_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for broker_shipper_network
CREATE POLICY "Brokers can view their own shipper network"
    ON public.broker_shipper_network FOR SELECT
    USING (auth.uid() = broker_user_id);

CREATE POLICY "Brokers can manage their own shipper network"
    ON public.broker_shipper_network FOR ALL
    USING (auth.uid() = broker_user_id);

-- RLS Policies for broker_carrier_network
CREATE POLICY "Brokers can view their own carrier network"
    ON public.broker_carrier_network FOR SELECT
    USING (auth.uid() = broker_user_id);

CREATE POLICY "Brokers can manage their own carrier network"
    ON public.broker_carrier_network FOR ALL
    USING (auth.uid() = broker_user_id);

-- RLS Policies for broker_interactions
CREATE POLICY "Brokers can view their own interactions"
    ON public.broker_interactions FOR SELECT
    USING (auth.uid() = broker_user_id);

CREATE POLICY "Brokers can manage their own interactions"
    ON public.broker_interactions FOR ALL
    USING (auth.uid() = broker_user_id);

-- Triggers for updated_at
CREATE TRIGGER update_broker_shipper_network_updated_at
    BEFORE UPDATE ON public.broker_shipper_network
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_broker_carrier_network_updated_at
    BEFORE UPDATE ON public.broker_carrier_network
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Function to update broker network statistics when shipments are completed
CREATE OR REPLACE FUNCTION update_broker_network_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update shipper network stats if broker is involved
    IF EXISTS (
        SELECT 1 FROM public.broker_shipper_network
        WHERE shipper_user_id = NEW.shipper_user_id
    ) THEN
        UPDATE public.broker_shipper_network
        SET 
            total_shipments_brokered = total_shipments_brokered + 1,
            updated_at = NOW()
        WHERE shipper_user_id = NEW.shipper_user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update broker network stats when shipment is delivered
CREATE TRIGGER trigger_update_broker_network_stats
    AFTER UPDATE OF status ON public.shipments
    FOR EACH ROW
    WHEN (NEW.status = 'delivered' AND OLD.status != 'delivered')
    EXECUTE PROCEDURE update_broker_network_stats();
