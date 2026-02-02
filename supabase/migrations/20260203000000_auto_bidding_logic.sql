-- Migration to implement auto-bidding logic
-- This function will be triggered after a new bid is inserted or updated

CREATE OR REPLACE FUNCTION public.process_auto_bids()
RETURNS TRIGGER AS $$
DECLARE
    lowest_bid_amount DECIMAL(12,2);
    competitor_auto_bid RECORD;
    new_auto_bid_amount DECIMAL(12,2);
    bid_increment DECIMAL(12,2) := 1000.00; -- Default increment of 1000 CFA
BEGIN
    -- 1. Find the current lowest active bid for this shipment
    SELECT MIN(bid_amount) INTO lowest_bid_amount
    FROM public.bids
    WHERE shipment_id = NEW.shipment_id
    AND bid_status = 'active';

    -- 2. Find other transporters who have auto-bid enabled and their limit is lower than current lowest
    -- Remember: In reverse auction, "limit" (max_auto_bid_amount) is the MINIMUM they will accept.
    -- We exclude the user who just placed the bid to avoid infinite loops.
    FOR competitor_auto_bid IN 
        SELECT * FROM public.bids
        WHERE shipment_id = NEW.shipment_id
        AND bid_status = 'active'
        AND auto_bid_enabled = true
        AND id != NEW.id
        AND max_auto_bid_amount < lowest_bid_amount -- They are willing to go lower
    LOOP
        -- Calculate new bid: current lowest - increment
        new_auto_bid_amount := lowest_bid_amount - bid_increment;
        
        -- Ensure we don't go below the competitor's floor
        IF new_auto_bid_amount < competitor_auto_bid.max_auto_bid_amount THEN
            new_auto_bid_amount := competitor_auto_bid.max_auto_bid_amount;
        END IF;

        -- Only place the bid if it's actually lower than the current lowest
        IF new_auto_bid_amount < lowest_bid_amount THEN
            -- Update the competitor's bid amount
            -- This will recursively trigger this function for the next competitor if necessary
            UPDATE public.bids
            SET 
                bid_amount = new_auto_bid_amount,
                bid_submitted_at = NOW(),
                updated_at = NOW()
            WHERE id = competitor_auto_bid.id;
            
            -- After updating one, we can return; the recursive call will handle others
            -- This prevents multiple simultaneous updates to the same shipment in one execution
            RETURN NEW;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after a bid is inserted or its amount is updated
DROP TRIGGER IF EXISTS trigger_process_auto_bids ON public.bids;
CREATE TRIGGER trigger_process_auto_bids
    AFTER INSERT OR UPDATE OF bid_amount ON public.bids
    FOR EACH ROW
    WHEN (NEW.bid_status = 'active')
    EXECUTE FUNCTION public.process_auto_bids();

-- Add a comment to clarify the usage of max_auto_bid_amount
COMMENT ON COLUMN public.bids.max_auto_bid_amount IS 'The minimum acceptable amount for the transporter in a reverse auction (auto-bid floor).';
