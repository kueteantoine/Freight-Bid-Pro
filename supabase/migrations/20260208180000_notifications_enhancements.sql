-- Migration: Real-Time Notifications System Enhancements
-- Prompt 51: Automated Notification Triggers

-- 1. Update Notification Type Enum (using DO block to handle existing types safely)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_type_enum' AND e.enumlabel = 'dispute_created') THEN
        ALTER TYPE public.notification_type_enum ADD VALUE 'dispute_created';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_type_enum' AND e.enumlabel = 'dispute_resolved') THEN
        ALTER TYPE public.notification_type_enum ADD VALUE 'dispute_resolved';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_type_enum' AND e.enumlabel = 'bid_rejected') THEN
        ALTER TYPE public.notification_type_enum ADD VALUE 'bid_rejected';
    END IF;
END $$;

-- 2. Create the centralized create_notification function
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_role_type public.role_type_enum,
    p_notification_type public.notification_type_enum,
    p_title TEXT,
    p_message TEXT,
    p_related_entity_type TEXT DEFAULT NULL,
    p_related_entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_prefs JSONB;
    v_sent_via_email BOOLEAN := false;
    v_sent_via_sms BOOLEAN := false;
    v_sent_via_push BOOLEAN := false;
BEGIN
    -- Get user preferences
    SELECT notification_preferences INTO v_prefs
    FROM public.user_preferences
    WHERE user_id = p_user_id;

    -- Default preferences if not set
    IF v_prefs IS NULL THEN
        v_prefs := '{"email": true, "sms": false, "push": true}'::jsonb;
    END IF;

    -- Check if channel is enabled globally and for this type (simplified logic for now)
    v_sent_via_email := (v_prefs->>'email')::boolean;
    v_sent_via_sms := (v_prefs->>'sms')::boolean;
    v_sent_via_push := (v_prefs->>'push')::boolean;

    -- Insert the notification
    INSERT INTO public.notifications (
        user_id,
        for_role_type,
        notification_type,
        title,
        message,
        related_entity_type,
        related_entity_id,
        sent_via_email,
        sent_via_sms,
        sent_via_push
    ) VALUES (
        p_user_id,
        p_role_type,
        p_notification_type,
        p_title,
        p_message,
        p_related_entity_type,
        p_related_entity_id,
        v_sent_via_email,
        v_sent_via_sms,
        v_sent_via_push
    ) RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger Functions

-- BIDS Trigger Function
CREATE OR REPLACE FUNCTION public.handle_bid_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_shipper_id UUID;
    v_shipment_number TEXT;
BEGIN
    -- Get shipment details
    SELECT shipper_user_id, shipment_number INTO v_shipper_id, v_shipment_number
    FROM public.shipments
    WHERE id = NEW.shipment_id;

    -- 1. New Bid Received (to Shipper)
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.create_notification(
            v_shipper_id,
            'shipper',
            'bid_received',
            'New Bid Received',
            'A new bid has been placed on shipment #' || v_shipment_number || '.',
            'bid',
            NEW.id
        );
    END IF;

    -- 2. Bid Awarded (to Winning Carrier)
    IF (TG_OP = 'UPDATE' AND OLD.bid_status != 'awarded' AND NEW.bid_status = 'awarded') THEN
        PERFORM public.create_notification(
            NEW.carrier_user_id,
            'carrier',
            'bid_awarded',
            'Bid Awarded!',
            'Your bid for shipment #' || v_shipment_number || ' has been accepted.',
            'bid',
            NEW.id
        );
    END IF;

    -- 3. Bid Outbid (to other active bidders)
    -- This is slightly complex to do in a trigger without infinite loops or performance hits.
    -- Better handled in a separate function or at the application level if "outbid" logic is triggered frequently.
    -- For now, we'll implement a simple version for changes in status to 'outbid'.
    IF (TG_OP = 'UPDATE' AND OLD.bid_status != 'outbid' AND NEW.bid_status = 'outbid') THEN
        PERFORM public.create_notification(
            NEW.carrier_user_id,
            'carrier',
            'bid_outbid',
            'You have been outbid',
            'Another carrier has placed a lower bid on shipment #' || v_shipment_number || '.',
            'bid',
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SHIPMENTS Trigger Function
CREATE OR REPLACE FUNCTION public.handle_shipment_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_carrier_id UUID;
    v_driver_id UUID;
BEGIN
    -- Notify status changes
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Notify Shipper
        PERFORM public.create_notification(
            NEW.shipper_user_id,
            'shipper',
            'shipment_update',
            'Shipment Status Update',
            'Shipment #' || NEW.shipment_number || ' status changed to ' || NEW.status || '.',
            'shipment',
            NEW.id
        );

        -- Notify Assigned Carrier if exists
        IF NEW.assigned_transporter_user_id IS NOT NULL THEN
            PERFORM public.create_notification(
                NEW.assigned_transporter_user_id,
                'carrier',
                'shipment_update',
                'Shipment Status Update',
                'Shipment #' || NEW.shipment_number || ' status changed to ' || NEW.status || '.',
                'shipment',
                NEW.id
            );
        END IF;

        -- Notify Assigned Driver if exists
        IF NEW.assigned_driver_user_id IS NOT NULL THEN
            PERFORM public.create_notification(
                NEW.assigned_driver_user_id,
                'driver',
                'shipment_update',
                'Shipment Status Update',
                'Shipment #' || NEW.shipment_number || ' status changed to ' || NEW.status || '.',
                'shipment',
                NEW.id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- MESSAGES Trigger Function
CREATE OR REPLACE FUNCTION public.handle_message_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receiver_user_id IS NOT NULL THEN
        -- Get sender name or use generic
        PERFORM public.create_notification(
            NEW.receiver_user_id,
            NULL, -- Multi-role handled by receiver
            'message_received',
            'New Message',
            'You have received a new message.',
            'message',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DISPUTES Trigger Function
CREATE OR REPLACE FUNCTION public.handle_dispute_notification()
RETURNS TRIGGER AS $$
DECLARE
    shipment_num TEXT;
BEGIN
    SELECT shipment_number INTO shipment_num FROM public.shipments WHERE id = NEW.shipment_id;

    -- 1. New Dispute (to the accused and to admins)
    IF (TG_OP = 'INSERT') THEN
        -- To accused
        PERFORM public.create_notification(
            NEW.against_user_id,
            NULL,
            'dispute_created',
            'New Dispute Raised',
            'A dispute has been raised against you for shipment #' || shipment_num || '.',
            'dispute',
            NEW.id
        );
    END IF;

    -- 2. Dispute Resolved
    IF (TG_OP = 'UPDATE' AND OLD.dispute_status != 'resolved' AND NEW.dispute_status = 'resolved') THEN
        -- Notify the person who raised the dispute
        PERFORM public.create_notification(
            NEW.raised_by_user_id,
            NULL, -- role_type
            'dispute_resolved',
            'Dispute Resolved',
            'Your dispute regarding shipment #' || shipment_num || ' has been resolved. Action taken: ' || NEW.resolution_action,
            'dispute',
            NEW.id
        );

        -- Notify the person the dispute was against
        PERFORM public.create_notification(
            NEW.against_user_id,
            NULL, -- role_type
            'dispute_resolved',
            'Dispute Resolved',
            'The dispute raised against you regarding shipment #' || shipment_num || ' has been resolved.',
            'dispute',
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Triggers

-- Bids
DROP TRIGGER IF EXISTS tr_bid_notifications ON public.bids;
CREATE TRIGGER tr_bid_notifications
    AFTER INSERT OR UPDATE OF bid_status ON public.bids
    FOR EACH ROW EXECUTE PROCEDURE public.handle_bid_notification();

-- Shipments
DROP TRIGGER IF EXISTS tr_shipment_notifications ON public.shipments;
CREATE TRIGGER tr_shipment_notifications
    AFTER UPDATE OF status ON public.shipments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_shipment_notification();

-- Messages
DROP TRIGGER IF EXISTS tr_message_notifications ON public.messages;
CREATE TRIGGER tr_message_notifications
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE PROCEDURE public.handle_message_notification();

-- Disputes
DROP TRIGGER IF EXISTS tr_dispute_notifications ON public.disputes;
CREATE TRIGGER tr_dispute_notifications
    AFTER INSERT OR UPDATE OF dispute_status ON public.disputes
    FOR EACH ROW EXECUTE PROCEDURE public.handle_dispute_notification();

-- 5. Add platform_settings for notifications if not exist
INSERT INTO public.platform_settings (setting_key, setting_value, setting_category, description)
VALUES 
('notification_gateways', '{"email": "sendgrid", "sms": "africastalking", "push": "web-push"}', 'general', 'Platform-wide notification gateway configuration')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
