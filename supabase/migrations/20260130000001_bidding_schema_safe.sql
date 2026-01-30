-- First, let's check what columns exist and fix the bids table structure
-- This migration handles both scenarios: new installation or existing partial installation

-- Create bid status enum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE bid_status AS ENUM (
        'active',
        'withdrawn',
        'outbid',
        'awarded',
        'rejected',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create bid action type enum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE bid_action_type AS ENUM (
        'submitted',
        'modified',
        'withdrawn',
        'outbid',
        'awarded',
        'expired',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Check if bids table exists and has the old column name, then rename it
DO $$
BEGIN
    -- If carrier_user_id exists, rename it to transporter_user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bids' 
        AND column_name = 'carrier_user_id'
    ) THEN
        ALTER TABLE public.bids RENAME COLUMN carrier_user_id TO transporter_user_id;
    END IF;
END $$;

-- Create BIDS table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    transporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bid_amount DECIMAL(12,2) NOT NULL CHECK (bid_amount > 0),
    estimated_delivery_date TIMESTAMPTZ,
    bid_breakdown_json JSONB DEFAULT '{}',
    bid_status bid_status DEFAULT 'active',
    bid_message TEXT,
    bid_submitted_at TIMESTAMPTZ DEFAULT NOW(),
    bid_expires_at TIMESTAMPTZ,
    auto_bid_enabled BOOLEAN DEFAULT false,
    max_auto_bid_amount DECIMAL(12,2),
    bid_ranking INTEGER,
    is_counter_offer BOOLEAN DEFAULT false,
    original_bid_id UUID REFERENCES public.bids(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing bids table if they don't exist
DO $$
BEGIN
    -- Add bid_breakdown_json if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bids' AND column_name = 'bid_breakdown_json') THEN
        ALTER TABLE public.bids ADD COLUMN bid_breakdown_json JSONB DEFAULT '{}';
    END IF;
    
    -- Add auto_bid_enabled if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bids' AND column_name = 'auto_bid_enabled') THEN
        ALTER TABLE public.bids ADD COLUMN auto_bid_enabled BOOLEAN DEFAULT false;
    END IF;
    
    -- Add max_auto_bid_amount if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bids' AND column_name = 'max_auto_bid_amount') THEN
        ALTER TABLE public.bids ADD COLUMN max_auto_bid_amount DECIMAL(12,2);
    END IF;
    
    -- Add bid_ranking if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bids' AND column_name = 'bid_ranking') THEN
        ALTER TABLE public.bids ADD COLUMN bid_ranking INTEGER;
    END IF;
    
    -- Add is_counter_offer if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bids' AND column_name = 'is_counter_offer') THEN
        ALTER TABLE public.bids ADD COLUMN is_counter_offer BOOLEAN DEFAULT false;
    END IF;
    
    -- Add original_bid_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bids' AND column_name = 'original_bid_id') THEN
        ALTER TABLE public.bids ADD COLUMN original_bid_id UUID REFERENCES public.bids(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create BID_HISTORY table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.bid_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
    action_type bid_action_type NOT NULL,
    action_timestamp TIMESTAMPTZ DEFAULT NOW(),
    previous_amount DECIMAL(12,2),
    new_amount DECIMAL(12,2),
    action_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT
);

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_bids_shipment_id ON public.bids(shipment_id);
CREATE INDEX IF NOT EXISTS idx_bids_transporter_user_id ON public.bids(transporter_user_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON public.bids(bid_status);
CREATE INDEX IF NOT EXISTS idx_bids_ranking ON public.bids(bid_ranking);
CREATE INDEX IF NOT EXISTS idx_bid_history_bid_id ON public.bid_history(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_history_action_timestamp ON public.bid_history(action_timestamp);

-- Enable RLS
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_history ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Shippers can view bids on their shipments" ON public.bids;
CREATE POLICY "Shippers can view bids on their shipments"
    ON public.bids FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = bids.shipment_id
            AND shipments.shipper_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Transporters can view their own bids" ON public.bids;
CREATE POLICY "Transporters can view their own bids"
    ON public.bids FOR SELECT
    USING (auth.uid() = transporter_user_id);

DROP POLICY IF EXISTS "Transporters can create bids" ON public.bids;
CREATE POLICY "Transporters can create bids"
    ON public.bids FOR INSERT
    WITH CHECK (auth.uid() = transporter_user_id);

DROP POLICY IF EXISTS "Transporters can update their own active bids" ON public.bids;
CREATE POLICY "Transporters can update their own active bids"
    ON public.bids FOR UPDATE
    USING (auth.uid() = transporter_user_id AND bid_status = 'active')
    WITH CHECK (auth.uid() = transporter_user_id);

DROP POLICY IF EXISTS "Shippers can update bids on their shipments" ON public.bids;
CREATE POLICY "Shippers can update bids on their shipments"
    ON public.bids FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = bids.shipment_id
            AND shipments.shipper_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view bid history for accessible bids" ON public.bid_history;
CREATE POLICY "Users can view bid history for accessible bids"
    ON public.bid_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bids
            WHERE bids.id = bid_history.bid_id
            AND (
                bids.transporter_user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.shipments
                    WHERE shipments.id = bids.shipment_id
                    AND shipments.shipper_user_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "System can insert bid history" ON public.bid_history;
CREATE POLICY "System can insert bid history"
    ON public.bid_history FOR INSERT
    WITH CHECK (true);

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_bids_updated_at ON public.bids;
DROP TRIGGER IF EXISTS trigger_update_bid_rankings ON public.bids;
DROP TRIGGER IF EXISTS trigger_create_bid_history ON public.bids;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_bids_updated_at
    BEFORE UPDATE ON public.bids
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Function to automatically update bid rankings
CREATE OR REPLACE FUNCTION update_bid_rankings()
RETURNS TRIGGER AS $$
BEGIN
    WITH ranked_bids AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY shipment_id 
                ORDER BY bid_amount ASC, bid_submitted_at ASC
            ) as new_rank
        FROM public.bids
        WHERE shipment_id = NEW.shipment_id
        AND bid_status = 'active'
    )
    UPDATE public.bids
    SET bid_ranking = ranked_bids.new_rank
    FROM ranked_bids
    WHERE bids.id = ranked_bids.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bid_rankings
    AFTER INSERT OR UPDATE OF bid_amount, bid_status ON public.bids
    FOR EACH ROW
    EXECUTE PROCEDURE update_bid_rankings();

-- Function to create bid history entry
CREATE OR REPLACE FUNCTION create_bid_history_entry()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.bid_history (
            bid_id,
            action_type,
            new_amount,
            action_by_user_id
        ) VALUES (
            NEW.id,
            'submitted',
            NEW.bid_amount,
            NEW.transporter_user_id
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.bid_status != NEW.bid_status) THEN
            INSERT INTO public.bid_history (
                bid_id,
                action_type,
                previous_amount,
                new_amount,
                action_by_user_id
            ) VALUES (
                NEW.id,
                NEW.bid_status::text::bid_action_type,
                OLD.bid_amount,
                NEW.bid_amount,
                auth.uid()
            );
        END IF;
        
        IF (OLD.bid_amount != NEW.bid_amount) THEN
            INSERT INTO public.bid_history (
                bid_id,
                action_type,
                previous_amount,
                new_amount,
                action_by_user_id
            ) VALUES (
                NEW.id,
                'modified',
                OLD.bid_amount,
                NEW.bid_amount,
                auth.uid()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_bid_history
    AFTER INSERT OR UPDATE ON public.bids
    FOR EACH ROW
    EXECUTE PROCEDURE create_bid_history_entry();

-- Add columns to shipments table
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS auction_type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS bidding_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS bid_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_accept_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_accept_price_threshold DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS auto_accept_min_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS auto_accept_max_delivery_days INTEGER;
