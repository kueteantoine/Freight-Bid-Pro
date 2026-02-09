-- Migration: Message Delivery Tracking and Blacklist
-- Created: 2026-02-09
-- Description: Add tables for tracking SMS/Email delivery status and managing blacklisted contacts

-- =====================================================
-- MESSAGE DELIVERY LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.message_delivery_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('email', 'sms')),
    provider TEXT NOT NULL,
    recipient TEXT NOT NULL,
    message_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'complained')),
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_delivery_log_user_id ON public.message_delivery_log(user_id);
CREATE INDEX IF NOT EXISTS idx_message_delivery_log_notification_id ON public.message_delivery_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_message_delivery_log_message_type ON public.message_delivery_log(message_type);
CREATE INDEX IF NOT EXISTS idx_message_delivery_log_status ON public.message_delivery_log(status);
CREATE INDEX IF NOT EXISTS idx_message_delivery_log_message_id ON public.message_delivery_log(message_id);
CREATE INDEX IF NOT EXISTS idx_message_delivery_log_created_at ON public.message_delivery_log(created_at);

-- RLS Policies
ALTER TABLE public.message_delivery_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all delivery logs
CREATE POLICY "Admins can view all message delivery logs"
    ON public.message_delivery_log FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );

-- Users can view their own delivery logs
CREATE POLICY "Users can view their own message delivery logs"
    ON public.message_delivery_log FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Service role can insert/update delivery logs
CREATE POLICY "Service role can manage message delivery logs"
    ON public.message_delivery_log FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- MESSAGE BLACKLIST TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.message_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact TEXT UNIQUE NOT NULL,
    contact_type TEXT NOT NULL CHECK (contact_type IN ('email', 'phone')),
    reason TEXT NOT NULL,
    blacklisted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_message_blacklist_contact ON public.message_blacklist(contact);
CREATE INDEX IF NOT EXISTS idx_message_blacklist_contact_type ON public.message_blacklist(contact_type);

-- RLS Policies
ALTER TABLE public.message_blacklist ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage blacklist
CREATE POLICY "Admins can view message blacklist"
    ON public.message_blacklist FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage message blacklist"
    ON public.message_blacklist FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );

-- Service role can manage blacklist
CREATE POLICY "Service role can manage message blacklist"
    ON public.message_blacklist FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if a contact is blacklisted
CREATE OR REPLACE FUNCTION public.is_contact_blacklisted(
    p_contact TEXT,
    p_contact_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.message_blacklist
        WHERE contact = p_contact
        AND contact_type = p_contact_type
    );
END;
$$;

-- Function to get message delivery statistics
CREATE OR REPLACE FUNCTION public.get_message_delivery_stats(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    message_type TEXT,
    total_sent BIGINT,
    total_delivered BIGINT,
    total_failed BIGINT,
    total_bounced BIGINT,
    delivery_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        mdl.message_type,
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE mdl.status = 'delivered') as total_delivered,
        COUNT(*) FILTER (WHERE mdl.status = 'failed') as total_failed,
        COUNT(*) FILTER (WHERE mdl.status = 'bounced') as total_bounced,
        ROUND(
            (COUNT(*) FILTER (WHERE mdl.status = 'delivered')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
            2
        ) as delivery_rate
    FROM public.message_delivery_log mdl
    WHERE mdl.created_at BETWEEN p_start_date AND p_end_date
    GROUP BY mdl.message_type;
END;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.message_delivery_log IS 'Tracks delivery status of SMS and Email messages';
COMMENT ON TABLE public.message_blacklist IS 'Stores blacklisted email addresses and phone numbers';
COMMENT ON FUNCTION public.is_contact_blacklisted IS 'Check if a contact (email or phone) is blacklisted';
COMMENT ON FUNCTION public.get_message_delivery_stats IS 'Get message delivery statistics for a date range';
