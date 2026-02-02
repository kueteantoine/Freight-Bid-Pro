-- Create ticket status enum
CREATE TYPE public.ticket_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Create ticket priority enum
CREATE TYPE public.ticket_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create FAQ_CONTENT table
CREATE TABLE IF NOT EXISTS public.faq_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create SUPPORT_TICKETS table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number SERIAL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority public.ticket_priority_enum DEFAULT 'medium',
    status public.ticket_status_enum DEFAULT 'open',
    assigned_to_admin_id UUID REFERENCES auth.users(id),
    attachments_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Create DISPUTES table
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_number SERIAL UNIQUE,
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id),
    raised_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    against_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dispute_type TEXT NOT NULL,
    dispute_description TEXT NOT NULL,
    evidence_urls_json JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'open', -- open, under_review, resolved, escalated, closed
    priority TEXT DEFAULT 'medium',
    assigned_to_admin_id UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    resolution_action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.faq_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- FAQ Policies: Everyone can view published FAQs
CREATE POLICY "Anyone can view published FAQs"
    ON public.faq_content FOR SELECT
    USING (is_published = true);

-- Support Ticket Policies
CREATE POLICY "Users can view their own tickets"
    ON public.support_tickets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tickets"
    ON public.support_tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Dispute Policies
CREATE POLICY "Users can view their own disputes"
    ON public.disputes FOR SELECT
    USING (auth.uid() = raised_by_user_id OR auth.uid() = against_user_id);

CREATE POLICY "Users can insert their own disputes"
    ON public.disputes FOR INSERT
    WITH CHECK (auth.uid() = raised_by_user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_faq_category ON public.faq_content(category);
CREATE INDEX IF NOT EXISTS idx_faq_published ON public.faq_content(is_published);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_disputes_shipment ON public.disputes(shipment_id);
CREATE INDEX IF NOT EXISTS idx_disputes_raised_by ON public.disputes(raised_by_user_id);

-- Seed some FAQS
INSERT INTO public.faq_content (question, answer, category, display_order) VALUES
('How do I book a shipment?', 'To book a shipment, navigate to the "New Booking" page, fill in the pickup, delivery, and freight details, and click "Post to Marketplace".', 'Booking', 1),
('How does the bidding process work?', 'Once your shipment is posted, carriers will submit bids. You can view these bids in real-time on your dashboard and award the shipment to the carrier that best meets your needs.', 'Bidding', 2),
('What payment methods are supported?', 'We support Orange Money, MTN MoMo, credit/debit cards, and bank transfers.', 'Payments', 3),
('How can I track my shipment?', 'You can track your shipment in real-time on the "Tracking" page, which shows the driver''s GPS location and estimated time of arrival.', 'Tracking', 4),
('What should I do if there is an issue with my delivery?', 'If you encounter any issues, you can raise a dispute through the "Support" section or contact our customer support via live chat.', 'Support', 5);
