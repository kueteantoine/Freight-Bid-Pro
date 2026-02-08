-- Migration for Bidding Enhancements (Prompt 49)
-- 1. Snipe Protection: Extend auction when bids are placed in the final minutes

CREATE OR REPLACE FUNCTION public.extend_auction_if_needed()
RETURNS TRIGGER AS $$
DECLARE
    min_extension_interval INTERVAL := INTERVAL '2 minutes';
    v_bid_expires_at TIMESTAMPTZ;
BEGIN
    -- Get the current expiry time
    SELECT bid_expires_at INTO v_bid_expires_at
    FROM public.shipments
    WHERE id = NEW.shipment_id;

    -- If no expiry or not open for bidding, do nothing
    IF v_bid_expires_at IS NULL THEN
        RETURN NEW;
    END IF;

    -- If bid is within the final 2 minutes of the auction
    IF (v_bid_expires_at - NOW()) < min_extension_interval THEN
        -- Extend the auction by 2 minutes from the current time to ensure enough time remains
        -- OR extend by 2 minutes from the current expiry if we want to be more generous
        -- Let's do: new expiry = NOW() + 2 minutes
        UPDATE public.shipments
        SET bid_expires_at = NOW() + min_extension_interval,
            updated_at = NOW()
        WHERE id = NEW.shipment_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for snipe protection
DROP TRIGGER IF EXISTS trigger_extend_auction ON public.bids;
CREATE TRIGGER trigger_extend_auction
    AFTER INSERT ON public.bids
    FOR EACH ROW
    WHEN (NEW.bid_status = 'active')
    EXECUTE FUNCTION public.extend_auction_if_needed();

-- 2. Auction Closure: Function to mark expired auctions as closed
-- This can be called by a cron job or checked by the application periodically

CREATE OR REPLACE FUNCTION public.check_and_close_expired_auctions()
RETURNS void AS $$
BEGIN
    -- Update shipments that have reached their expiry and are still open
    UPDATE public.shipments
    SET status = CASE 
                    WHEN (SELECT COUNT(*) FROM public.bids WHERE shipment_id = shipments.id AND bid_status = 'active') > 0 
                    THEN 'bid_awarded' -- Or 'closed_evaluating' if we want a transition state
                    ELSE 'cancelled' -- If no bids
                 END,
        updated_at = NOW()
    WHERE status = 'open_for_bidding'
    AND bid_expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Validation: Ensure bids are not placed on expired auctions
CREATE OR REPLACE FUNCTION public.validate_bid_submission()
RETURNS TRIGGER AS $$
DECLARE
    v_shipment_status TEXT;
    v_bid_expires_at TIMESTAMPTZ;
BEGIN
    SELECT status, bid_expires_at INTO v_shipment_status, v_bid_expires_at
    FROM public.shipments
    WHERE id = NEW.shipment_id;

    IF v_shipment_status != 'open_for_bidding' THEN
        RAISE EXCEPTION 'Shipment is not open for bidding.';
    END IF;

    IF v_bid_expires_at IS NOT NULL AND v_bid_expires_at < NOW() THEN
        RAISE EXCEPTION 'This auction has already expired.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_validate_bid_submission ON public.bids;
CREATE TRIGGER trigger_validate_bid_submission
    BEFORE INSERT ON public.bids
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_bid_submission();

-- 4. Minimum Increment Enforcement
-- We can add a check for the minimum increment logic.
-- However, since increments might vary or depend on the current lowest bid,
-- it's often better handled in server actions or a more complex trigger.
-- Let's add a basic check: new bid must be lower than existing lowest (Reverse Auction)

CREATE OR REPLACE FUNCTION public.validate_bid_increment()
RETURNS TRIGGER AS $$
DECLARE
    v_lowest_bid DECIMAL;
BEGIN
    SELECT MIN(bid_amount) INTO v_lowest_bid
    FROM public.bids
    WHERE shipment_id = NEW.shipment_id
    AND bid_status = 'active';

    -- Default increment: 1000 XAF
    IF v_lowest_bid IS NOT NULL AND NEW.bid_amount > (v_lowest_bid - 1000) THEN
        RAISE EXCEPTION 'Bid must be at least 1,000 XAF lower than the current lowest bid.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_validate_bid_increment ON public.bids;
CREATE TRIGGER trigger_validate_bid_increment
    BEFORE INSERT ON public.bids
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_bid_increment();
