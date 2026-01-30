-- Create bid status enum
CREATE TYPE bid_status AS ENUM (
    'active',
    'withdrawn',
    'outbid',
    'awarded',
    'rejected',
    'expired'
);

-- Create bid action type enum for history tracking
CREATE TYPE bid_action_type AS ENUM (
    'submitted',
    'modified',
    'withdrawn',
    'outbid',
    'awarded',
    'expired',
    'rejected'
);

-- Create BIDS table (Prompt 3)
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

-- Create BID_HISTORY table for tracking all bid activities
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

-- Create indexes for performance
CREATE INDEX idx_bids_shipment_id ON public.bids(shipment_id);
CREATE INDEX idx_bids_transporter_user_id ON public.bids(transporter_user_id);
CREATE INDEX idx_bids_status ON public.bids(bid_status);
CREATE INDEX idx_bids_ranking ON public.bids(bid_ranking);
CREATE INDEX idx_bid_history_bid_id ON public.bid_history(bid_id);
CREATE INDEX idx_bid_history_action_timestamp ON public.bid_history(action_timestamp);

-- Enable RLS for bids
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bids
-- Shippers can view all bids on their shipments
CREATE POLICY "Shippers can view bids on their shipments"
    ON public.bids FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = bids.shipment_id
            AND shipments.shipper_user_id = auth.uid()
        )
    );

-- Transporters can view their own bids
CREATE POLICY "Transporters can view their own bids"
    ON public.bids FOR SELECT
    USING (auth.uid() = transporter_user_id);

-- Transporters can insert their own bids
CREATE POLICY "Transporters can create bids"
    ON public.bids FOR INSERT
    WITH CHECK (auth.uid() = transporter_user_id);

-- Transporters can update their own bids (only if status is active)
CREATE POLICY "Transporters can update their own active bids"
    ON public.bids FOR UPDATE
    USING (auth.uid() = transporter_user_id AND bid_status = 'active')
    WITH CHECK (auth.uid() = transporter_user_id);

-- Shippers can update bids on their shipments (for awarding/rejecting)
CREATE POLICY "Shippers can update bids on their shipments"
    ON public.bids FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments
            WHERE shipments.id = bids.shipment_id
            AND shipments.shipper_user_id = auth.uid()
        )
    );

-- Enable RLS for bid_history
ALTER TABLE public.bid_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bid_history
-- Users can view history of bids they can see
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

-- System can insert bid history (no user policy needed, done via service role)
CREATE POLICY "System can insert bid history"
    ON public.bid_history FOR INSERT
    WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_bids_updated_at
    BEFORE UPDATE ON public.bids
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Function to automatically update bid rankings when new bids are submitted
CREATE OR REPLACE FUNCTION update_bid_rankings()
RETURNS TRIGGER AS $$
BEGIN
    -- Update rankings for all bids on this shipment
    -- Lower bid amount = better ranking (rank 1 is best)
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

-- Trigger to update rankings on insert or update
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
        -- Track status changes
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
        
        -- Track amount changes
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

-- Trigger to automatically create bid history entries
CREATE TRIGGER trigger_create_bid_history
    AFTER INSERT OR UPDATE ON public.bids
    FOR EACH ROW
    EXECUTE PROCEDURE create_bid_history_entry();

-- Add bidding configuration columns to shipments table
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS auction_type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS bidding_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS bid_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_accept_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_accept_price_threshold DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS auto_accept_min_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS auto_accept_max_delivery_days INTEGER;
