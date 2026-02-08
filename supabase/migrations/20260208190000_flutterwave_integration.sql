-- Flutterwave Integration & Split Payment Enhancements (Prompt 52)
-- Replaces Zitopay implementation

-- 1. Enhance payment_aggregator_configs table
ALTER TABLE public.payment_aggregator_configs
ADD COLUMN IF NOT EXISTS webhook_secret TEXT,
ADD COLUMN IF NOT EXISTS config_json JSONB DEFAULT '{}';

-- 2. Enhance profiles table to store payment identifiers
-- This will store the Flutterwave Subaccount ID for the transporter
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS payment_subaccount_id TEXT;

-- 3. Seed Flutterwave Configuration
-- If it doesn't exist, insert the initial config for Flutterwave
INSERT INTO public.payment_aggregator_configs (
    aggregator_name, 
    display_name, 
    is_active, 
    default_commission_percentage, 
    default_aggregator_fee_percentage, 
    default_mobile_money_fee_percentage,
    config_json
)
VALUES (
    'flutterwave', 
    'Flutterwave', 
    true, 
    5.0, 
    1.4, -- Typical Flutterwave CM rate (approx)
    0.0, -- Often included in transaction fee, adjusted as needed
    '{"encryption_key_required": true, "environment": "test"}'::jsonb
)
ON CONFLICT (aggregator_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active,
    config_json = EXCLUDED.config_json;

-- Deactivate previous aggregators if any (optional, assuming new setup)
-- UPDATE public.payment_aggregator_configs SET is_active = false WHERE aggregator_name != 'flutterwave';

-- 4. Create an atomic function to award a bid upon payment confirmation
-- This ensures that the bid status, shipment status, and other bids are updated correctly in one go.
CREATE OR REPLACE FUNCTION public.confirm_shipment_payment(
    p_transaction_id UUID,
    p_aggregator_tx_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_shipment_id UUID;
    v_bid_id UUID;
    v_shipper_id UUID;
    v_transporter_id UUID;
BEGIN
    -- 1. Update Transaction
    UPDATE public.transactions
    SET 
        payment_status = 'completed',
        aggregator_transaction_id = p_aggregator_tx_id,
        payment_completed_at = NOW()
    WHERE id = p_transaction_id
    RETURNING shipment_id, payer_user_id, payee_user_id INTO v_shipment_id, v_shipper_id, v_transporter_id;

    IF v_shipment_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
    END IF;

    -- 2. Identify the bid
    -- We assume the awarded bid is the one that triggered the transaction
    SELECT id INTO v_bid_id
    FROM public.bids
    WHERE shipment_id = v_shipment_id
    AND transporter_user_id = v_transporter_id
    AND bid_status = 'active'
    ORDER BY bid_amount ASC, created_at DESC
    LIMIT 1;

    IF v_bid_id IS NULL THEN
        -- Maybe already awarded? Check if there is an awarded bid for this transporter
        SELECT id INTO v_bid_id
        FROM public.bids
        WHERE shipment_id = v_shipment_id
        AND transporter_user_id = v_transporter_id
        AND bid_status = 'awarded'
        LIMIT 1;
        
        IF v_bid_id IS NOT NULL THEN
             RETURN jsonb_build_object('success', true, 'message', 'Payment confirmed, bid already awarded');
        END IF;

        RETURN jsonb_build_object('success', true, 'message', 'Payment confirmed, but active bid not found (manual review needed)');
    END IF;

    -- 3. Award the Bid
    UPDATE public.bids
    SET bid_status = 'awarded'
    WHERE id = v_bid_id;

    -- 4. Update Shipment Status
    UPDATE public.shipments
    SET status = 'bid_awarded'
    WHERE id = v_shipment_id;

    -- 5. Mark other bids as outbid
    UPDATE public.bids
    SET bid_status = 'outbid'
    WHERE shipment_id = v_shipment_id
    AND id != v_bid_id
    AND bid_status = 'active';

    RETURN jsonb_build_object(
        'success', true, 
        'shipment_id', v_shipment_id, 
        'bid_id', v_bid_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.confirm_shipment_payment(UUID, TEXT) TO service_role;
