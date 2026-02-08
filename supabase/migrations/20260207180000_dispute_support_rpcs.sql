-- =====================================================
-- Dispute Resolution & Support Management RPC Functions
-- =====================================================

-- Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE public.ticket_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.ticket_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.dispute_status_enum AS ENUM ('open', 'under_review', 'escalated', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.dispute_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- DISPUTE MANAGEMENT RPC FUNCTIONS
-- =====================================================

-- Get all disputes with filters and pagination
CREATE OR REPLACE FUNCTION public.get_all_disputes(
    filter_status TEXT DEFAULT NULL,
    filter_priority TEXT DEFAULT NULL,
    search_query TEXT DEFAULT NULL,
    limit_count INT DEFAULT 50,
    offset_count INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    dispute_number INT,
    shipment_id UUID,
    transaction_id UUID,
    raised_by_user_id UUID,
    raised_by_email TEXT,
    against_user_id UUID,
    against_email TEXT,
    dispute_type TEXT,
    dispute_description TEXT,
    evidence_urls_json JSONB,
    status TEXT,
    priority TEXT,
    assigned_to_admin_id UUID,
    assigned_admin_email TEXT,
    resolution_notes TEXT,
    resolution_action TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    age_hours INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.dispute_number,
        d.shipment_id,
        d.transaction_id,
        d.raised_by_user_id,
        u1.email AS raised_by_email,
        d.against_user_id,
        u2.email AS against_email,
        d.dispute_type,
        d.dispute_description,
        d.evidence_urls_json,
        d.dispute_status AS status,
        d.priority,
        d.assigned_to_admin_id,
        u3.email AS assigned_admin_email,
        d.resolution_notes,
        d.resolution_action,
        d.created_at,
        d.updated_at,
        d.resolved_at,
        EXTRACT(EPOCH FROM (NOW() - d.created_at)) / 3600 AS age_hours
    FROM public.disputes d
    LEFT JOIN auth.users u1 ON d.raised_by_user_id = u1.id
    LEFT JOIN auth.users u2 ON d.against_user_id = u2.id
    LEFT JOIN auth.users u3 ON d.assigned_to_admin_id = u3.id
    WHERE 
        (filter_status IS NULL OR d.dispute_status = filter_status)
        AND (filter_priority IS NULL OR d.priority = filter_priority)
        AND (
            search_query IS NULL 
            OR d.dispute_number::TEXT ILIKE '%' || search_query || '%'
            OR u1.email ILIKE '%' || search_query || '%'
            OR u2.email ILIKE '%' || search_query || '%'
            OR d.dispute_description ILIKE '%' || search_query || '%'
        )
    ORDER BY 
        CASE d.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        d.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get dispute details
CREATE OR REPLACE FUNCTION public.get_dispute_details(dispute_id UUID)
RETURNS TABLE (
    id UUID,
    dispute_number INT,
    shipment_id UUID,
    shipment_number TEXT,
    transaction_id UUID,
    raised_by_user_id UUID,
    raised_by_email TEXT,
    against_user_id UUID,
    against_email TEXT,
    dispute_type TEXT,
    dispute_description TEXT,
    evidence_urls_json JSONB,
    status TEXT,
    priority TEXT,
    assigned_to_admin_id UUID,
    assigned_admin_email TEXT,
    resolution_notes TEXT,
    resolution_action TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.dispute_number,
        d.shipment_id,
        s.shipment_number,
        d.transaction_id,
        d.raised_by_user_id,
        u1.email AS raised_by_email,
        d.against_user_id,
        u2.email AS against_email,
        d.dispute_type,
        d.dispute_description,
        d.evidence_urls_json,
        d.dispute_status AS status,
        d.priority,
        d.assigned_to_admin_id,
        u3.email AS assigned_admin_email,
        d.resolution_notes,
        d.resolution_action,
        d.created_at,
        d.updated_at,
        d.resolved_at
    FROM public.disputes d
    LEFT JOIN public.shipments s ON d.shipment_id = s.id
    LEFT JOIN auth.users u1 ON d.raised_by_user_id = u1.id
    LEFT JOIN auth.users u2 ON d.against_user_id = u2.id
    LEFT JOIN auth.users u3 ON d.assigned_to_admin_id = u3.id
    WHERE d.id = dispute_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update dispute status
CREATE OR REPLACE FUNCTION public.update_dispute_status(
    dispute_id UUID,
    new_status TEXT,
    admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    UPDATE public.disputes
    SET 
        dispute_status = new_status,
        resolution_notes = COALESCE(admin_notes, resolution_notes),
        updated_at = NOW(),
        resolved_at = CASE WHEN new_status IN ('resolved', 'closed') THEN NOW() ELSE resolved_at END
    WHERE id = dispute_id;

    IF FOUND THEN
        result := jsonb_build_object('success', true, 'message', 'Dispute status updated successfully');
    ELSE
        result := jsonb_build_object('success', false, 'message', 'Dispute not found');
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assign dispute to admin
CREATE OR REPLACE FUNCTION public.assign_dispute_to_admin(
    dispute_id UUID,
    admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    UPDATE public.disputes
    SET 
        assigned_to_admin_id = admin_id,
        dispute_status = CASE WHEN dispute_status = 'open' THEN 'under_review' ELSE dispute_status END,
        updated_at = NOW()
    WHERE id = dispute_id;

    IF FOUND THEN
        result := jsonb_build_object('success', true, 'message', 'Dispute assigned successfully');
    ELSE
        result := jsonb_build_object('success', false, 'message', 'Dispute not found');
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Resolve dispute
CREATE OR REPLACE FUNCTION public.resolve_dispute(
    dispute_id UUID,
    resolution_action_text TEXT,
    resolution_notes_text TEXT
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    UPDATE public.disputes
    SET 
        dispute_status = 'resolved',
        resolution_action = resolution_action_text,
        resolution_notes = resolution_notes_text,
        resolved_at = NOW(),
        updated_at = NOW()
    WHERE id = dispute_id;

    IF FOUND THEN
        result := jsonb_build_object('success', true, 'message', 'Dispute resolved successfully');
    ELSE
        result := jsonb_build_object('success', false, 'message', 'Dispute not found');
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUPPORT TICKET MANAGEMENT RPC FUNCTIONS
-- =====================================================

-- Get all support tickets with filters and pagination
CREATE OR REPLACE FUNCTION public.get_all_support_tickets(
    filter_status TEXT DEFAULT NULL,
    filter_priority TEXT DEFAULT NULL,
    filter_category TEXT DEFAULT NULL,
    search_query TEXT DEFAULT NULL,
    limit_count INT DEFAULT 50,
    offset_count INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    ticket_number INT,
    user_id UUID,
    user_email TEXT,
    subject TEXT,
    description TEXT,
    category TEXT,
    priority public.ticket_priority_enum,
    status public.ticket_status_enum,
    assigned_to_admin_id UUID,
    assigned_admin_email TEXT,
    attachments_json JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    age_hours INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        st.id,
        st.ticket_number,
        st.user_id,
        u1.email AS user_email,
        st.subject,
        st.description,
        st.category,
        st.priority,
        st.status,
        st.assigned_to_admin_id,
        u2.email AS assigned_admin_email,
        st.attachments_json,
        st.created_at,
        st.updated_at,
        st.resolved_at,
        EXTRACT(EPOCH FROM (NOW() - st.created_at)) / 3600 AS age_hours
    FROM public.support_tickets st
    LEFT JOIN auth.users u1 ON st.user_id = u1.id
    LEFT JOIN auth.users u2 ON st.assigned_to_admin_id = u2.id
    WHERE 
        (filter_status IS NULL OR st.status::TEXT = filter_status)
        AND (filter_priority IS NULL OR st.priority::TEXT = filter_priority)
        AND (filter_category IS NULL OR st.category = filter_category)
        AND (
            search_query IS NULL 
            OR st.ticket_number::TEXT ILIKE '%' || search_query || '%'
            OR st.subject ILIKE '%' || search_query || '%'
            OR st.description ILIKE '%' || search_query || '%'
            OR u1.email ILIKE '%' || search_query || '%'
        )
    ORDER BY 
        CASE st.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        st.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get ticket details
CREATE OR REPLACE FUNCTION public.get_ticket_details(ticket_id UUID)
RETURNS TABLE (
    id UUID,
    ticket_number INT,
    user_id UUID,
    user_email TEXT,
    subject TEXT,
    description TEXT,
    category TEXT,
    priority public.ticket_priority_enum,
    status public.ticket_status_enum,
    assigned_to_admin_id UUID,
    assigned_admin_email TEXT,
    attachments_json JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        st.id,
        st.ticket_number,
        st.user_id,
        u1.email AS user_email,
        st.subject,
        st.description,
        st.category,
        st.priority,
        st.status,
        st.assigned_to_admin_id,
        u2.email AS assigned_admin_email,
        st.attachments_json,
        st.created_at,
        st.updated_at,
        st.resolved_at
    FROM public.support_tickets st
    LEFT JOIN auth.users u1 ON st.user_id = u1.id
    LEFT JOIN auth.users u2 ON st.assigned_to_admin_id = u2.id
    WHERE st.id = ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update ticket status
CREATE OR REPLACE FUNCTION public.update_ticket_status(
    ticket_id UUID,
    new_status TEXT
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    UPDATE public.support_tickets
    SET 
        status = new_status::public.ticket_status_enum,
        updated_at = NOW(),
        resolved_at = CASE WHEN new_status IN ('resolved', 'closed') THEN NOW() ELSE resolved_at END
    WHERE id = ticket_id;

    IF FOUND THEN
        result := jsonb_build_object('success', true, 'message', 'Ticket status updated successfully');
    ELSE
        result := jsonb_build_object('success', false, 'message', 'Ticket not found');
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assign ticket to admin
CREATE OR REPLACE FUNCTION public.assign_ticket_to_admin(
    ticket_id UUID,
    admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    UPDATE public.support_tickets
    SET 
        assigned_to_admin_id = admin_id,
        status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
        updated_at = NOW()
    WHERE id = ticket_id;

    IF FOUND THEN
        result := jsonb_build_object('success', true, 'message', 'Ticket assigned successfully');
    ELSE
        result := jsonb_build_object('success', false, 'message', 'Ticket not found');
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FAQ MANAGEMENT RPC FUNCTIONS
-- =====================================================

-- Get all FAQs for admin (including unpublished)
CREATE OR REPLACE FUNCTION public.get_all_faqs_admin()
RETURNS TABLE (
    id UUID,
    question TEXT,
    answer TEXT,
    category TEXT,
    language TEXT,
    display_order INT,
    is_published BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.question,
        f.answer,
        f.category,
        f.language,
        f.display_order,
        f.is_published,
        f.created_at,
        f.updated_at
    FROM public.faq_content f
    ORDER BY f.category, f.display_order, f.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create FAQ
CREATE OR REPLACE FUNCTION public.create_faq(
    question_text TEXT,
    answer_text TEXT,
    category_text TEXT,
    language_code TEXT DEFAULT 'en',
    display_order_num INT DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    new_faq_id UUID;
    result JSONB;
BEGIN
    INSERT INTO public.faq_content (question, answer, category, language, display_order)
    VALUES (question_text, answer_text, category_text, language_code, display_order_num)
    RETURNING id INTO new_faq_id;

    result := jsonb_build_object(
        'success', true, 
        'message', 'FAQ created successfully',
        'id', new_faq_id
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update FAQ
CREATE OR REPLACE FUNCTION public.update_faq(
    faq_id UUID,
    question_text TEXT,
    answer_text TEXT,
    category_text TEXT,
    language_code TEXT,
    is_published_flag BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    UPDATE public.faq_content
    SET 
        question = question_text,
        answer = answer_text,
        category = category_text,
        language = language_code,
        is_published = is_published_flag,
        updated_at = NOW()
    WHERE id = faq_id;

    IF FOUND THEN
        result := jsonb_build_object('success', true, 'message', 'FAQ updated successfully');
    ELSE
        result := jsonb_build_object('success', false, 'message', 'FAQ not found');
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete FAQ
CREATE OR REPLACE FUNCTION public.delete_faq(faq_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    DELETE FROM public.faq_content WHERE id = faq_id;

    IF FOUND THEN
        result := jsonb_build_object('success', true, 'message', 'FAQ deleted successfully');
    ELSE
        result := jsonb_build_object('success', false, 'message', 'FAQ not found');
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle FAQ published status
CREATE OR REPLACE FUNCTION public.toggle_faq_published(faq_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    current_status BOOLEAN;
BEGIN
    SELECT is_published INTO current_status FROM public.faq_content WHERE id = faq_id;

    IF current_status IS NULL THEN
        result := jsonb_build_object('success', false, 'message', 'FAQ not found');
    ELSE
        UPDATE public.faq_content
        SET is_published = NOT current_status, updated_at = NOW()
        WHERE id = faq_id;

        result := jsonb_build_object(
            'success', true, 
            'message', 'FAQ published status toggled',
            'is_published', NOT current_status
        );
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reorder FAQs
CREATE OR REPLACE FUNCTION public.reorder_faqs(faq_ids UUID[])
RETURNS JSONB AS $$
DECLARE
    faq_id UUID;
    idx INT := 0;
    result JSONB;
BEGIN
    FOREACH faq_id IN ARRAY faq_ids
    LOOP
        UPDATE public.faq_content
        SET display_order = idx, updated_at = NOW()
        WHERE id = faq_id;
        idx := idx + 1;
    END LOOP;

    result := jsonb_build_object('success', true, 'message', 'FAQs reordered successfully');
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (admin check should be in RLS or app layer)
GRANT EXECUTE ON FUNCTION public.get_all_disputes TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dispute_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_dispute_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_dispute_to_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_dispute TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_support_tickets TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ticket_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_ticket_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_ticket_to_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_faqs_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_faq TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_faq TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_faq TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_faq_published TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_faqs TO authenticated;
