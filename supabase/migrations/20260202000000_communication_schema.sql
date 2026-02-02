-- Create message type enum
CREATE TYPE public.message_type_enum AS ENUM ('text', 'image', 'document');

-- Create conversation type enum
CREATE TYPE public.conversation_type_enum AS ENUM ('shipment_chat', 'bid_negotiation', 'support_ticket');

-- Create notification type enum
CREATE TYPE public.notification_type_enum AS ENUM (
    'bid_received', 
    'bid_outbid', 
    'bid_awarded', 
    'payment_received', 
    'shipment_update', 
    'message_received', 
    'document_expiring'
);

-- Create MESSAGES table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_type public.conversation_type_enum NOT NULL,
    related_shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    related_bid_id UUID REFERENCES public.bids(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null for group/shipment chats
    message_content TEXT NOT NULL,
    message_type public.message_type_enum DEFAULT 'text',
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure either shipment_id or bid_id or both are null depending on type
    CONSTRAINT related_entity_check CHECK (
        (conversation_type = 'shipment_chat' AND related_shipment_id IS NOT NULL) OR
        (conversation_type = 'bid_negotiation' AND related_bid_id IS NOT NULL) OR
        (conversation_type = 'support_ticket')
    )
);

-- Create NOTIFICATIONS table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    for_role_type public.role_type_enum, -- Which role this notification is for
    notification_type public.notification_type_enum NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity_type TEXT, -- e.g., 'shipment', 'bid', 'payment'
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    sent_via_email BOOLEAN DEFAULT false,
    sent_via_sms BOOLEAN DEFAULT false,
    sent_via_push BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
-- Users can see messages where they are sender or receiver
-- OR if it's a shipment chat and they are the shipper/carrier/driver of that shipment
CREATE POLICY "Users can view their own messages"
    ON public.messages FOR SELECT
    USING (
        auth.uid() = sender_user_id OR 
        auth.uid() = receiver_user_id OR
        (
            conversation_type = 'shipment_chat' AND 
            EXISTS (
                SELECT 1 FROM public.shipments s
                WHERE s.id = related_shipment_id AND
                (s.shipper_user_id = auth.uid() OR s.assigned_transporter_user_id = auth.uid() OR s.assigned_driver_user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can insert their own messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_user_id);

CREATE POLICY "Users can update their own received messages as read"
    ON public.messages FOR UPDATE
    USING (auth.uid() = receiver_user_id)
    WITH CHECK (is_read = true);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (is_read = true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_shipment ON public.messages(related_shipment_id);
CREATE INDEX IF NOT EXISTS idx_messages_bid ON public.messages(related_bid_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;
