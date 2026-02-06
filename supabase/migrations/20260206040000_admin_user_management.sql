-- Admin User Management RPC Functions

-- Function to get all users with filters and pagination
CREATE OR REPLACE FUNCTION public.get_all_users(
    search_query TEXT DEFAULT '',
    role_filter TEXT DEFAULT NULL,
    status_filter TEXT DEFAULT NULL,
    verification_filter TEXT DEFAULT NULL,
    limit_count INT DEFAULT 50,
    offset_count INT DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    users_data JSONB;
    total_count INT;
BEGIN
    -- Get filtered users with their roles
    WITH filtered_users AS (
        SELECT DISTINCT
            p.id,
            p.email,
            p.phone_number,
            p.account_status,
            p.created_at,
            p.updated_at
        FROM public.profiles p
        LEFT JOIN public.user_roles ur ON p.id = ur.user_id
        WHERE 
            (search_query = '' OR 
             p.email ILIKE '%' || search_query || '%' OR
             p.phone_number ILIKE '%' || search_query || '%')
            AND (status_filter IS NULL OR p.account_status = status_filter)
            AND (role_filter IS NULL OR ur.role_type = role_filter)
            AND (verification_filter IS NULL OR ur.verification_status = verification_filter)
    )
    SELECT jsonb_agg(user_data) INTO users_data
    FROM (
        SELECT 
            fu.id,
            fu.email,
            fu.phone_number,
            fu.account_status,
            fu.created_at,
            fu.updated_at,
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', ur.id,
                        'role_type', ur.role_type,
                        'is_active', ur.is_active,
                        'verification_status', ur.verification_status,
                        'created_at', ur.created_at
                    )
                )
                FROM public.user_roles ur
                WHERE ur.user_id = fu.id
            ) AS roles
        FROM filtered_users fu
        ORDER BY fu.created_at DESC
        LIMIT limit_count
        OFFSET offset_count
    ) user_data;

    -- Get total count for pagination
    SELECT COUNT(DISTINCT p.id) INTO total_count
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE 
        (search_query = '' OR 
         p.email ILIKE '%' || search_query || '%' OR
         p.phone_number ILIKE '%' || search_query || '%')
        AND (status_filter IS NULL OR p.account_status = status_filter)
        AND (role_filter IS NULL OR ur.role_type = role_filter)
        AND (verification_filter IS NULL OR ur.verification_status = verification_filter);

    RETURN jsonb_build_object(
        'users', COALESCE(users_data, '[]'::jsonb),
        'total_count', total_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get detailed user information
CREATE OR REPLACE FUNCTION public.get_user_details(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_profile JSONB;
    user_roles_data JSONB;
    shipment_stats JSONB;
    payment_stats JSONB;
    rating_stats JSONB;
BEGIN
    -- Get profile
    SELECT jsonb_build_object(
        'id', id,
        'email', email,
        'phone_number', phone_number,
        'account_status', account_status,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO user_profile
    FROM public.profiles
    WHERE id = target_user_id;

    -- Get all roles with details
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'role_type', role_type,
            'is_active', is_active,
            'verification_status', verification_status,
            'verification_documents', verification_documents,
            'role_specific_profile', role_specific_profile,
            'created_at', created_at,
            'activated_at', activated_at
        )
    ) INTO user_roles_data
    FROM public.user_roles
    WHERE user_id = target_user_id;

    -- Get shipment statistics
    SELECT jsonb_build_object(
        'total_as_shipper', COUNT(*) FILTER (WHERE shipper_user_id = target_user_id),
        'completed_as_shipper', COUNT(*) FILTER (WHERE shipper_user_id = target_user_id AND status = 'delivered'),
        'in_progress', COUNT(*) FILTER (WHERE shipper_user_id = target_user_id AND status IN ('open_for_bidding', 'bid_awarded', 'in_transit'))
    ) INTO shipment_stats
    FROM public.shipments;

    -- Get payment statistics
    SELECT jsonb_build_object(
        'total_paid', COALESCE(SUM(gross_amount) FILTER (WHERE payer_user_id = target_user_id), 0),
        'total_received', COALESCE(SUM(net_amount) FILTER (WHERE payee_user_id = target_user_id), 0),
        'transaction_count', COUNT(*) FILTER (WHERE payer_user_id = target_user_id OR payee_user_id = target_user_id)
    ) INTO payment_stats
    FROM public.transactions
    WHERE payment_status = 'completed';

    -- Get rating statistics
    SELECT jsonb_build_object(
        'average_rating', COALESCE(AVG(rating_overall), 0),
        'total_reviews', COUNT(*),
        'five_star', COUNT(*) FILTER (WHERE rating_overall = 5),
        'four_star', COUNT(*) FILTER (WHERE rating_overall = 4),
        'three_star', COUNT(*) FILTER (WHERE rating_overall = 3),
        'two_star', COUNT(*) FILTER (WHERE rating_overall = 2),
        'one_star', COUNT(*) FILTER (WHERE rating_overall = 1)
    ) INTO rating_stats
    FROM public.ratings_reviews
    WHERE reviewed_user_id = target_user_id AND review_status = 'published';

    RETURN jsonb_build_object(
        'profile', user_profile,
        'roles', COALESCE(user_roles_data, '[]'::jsonb),
        'shipment_stats', shipment_stats,
        'payment_stats', payment_stats,
        'rating_stats', rating_stats
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to suspend user account
CREATE OR REPLACE FUNCTION public.suspend_user_account(
    target_user_id UUID,
    suspension_reason TEXT
)
RETURNS JSONB AS $$
BEGIN
    -- Update account status
    UPDATE public.profiles
    SET 
        account_status = 'suspended',
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Deactivate all roles
    UPDATE public.user_roles
    SET is_active = false
    WHERE user_id = target_user_id;

    -- Log the action (if audit_logs table exists)
    -- INSERT INTO public.audit_logs (user_id, action_type, action_description, affected_entity_type, affected_entity_id)
    -- VALUES (auth.uid(), 'account_suspension', suspension_reason, 'user', target_user_id);

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Account suspended successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to reactivate user account
CREATE OR REPLACE FUNCTION public.reactivate_user_account(target_user_id UUID)
RETURNS JSONB AS $$
BEGIN
    -- Update account status
    UPDATE public.profiles
    SET 
        account_status = 'active',
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Reactivate verified roles
    UPDATE public.user_roles
    SET is_active = true
    WHERE user_id = target_user_id AND verification_status = 'verified';

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Account reactivated successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to suspend specific user role
CREATE OR REPLACE FUNCTION public.suspend_user_role(
    role_id UUID,
    suspension_reason TEXT
)
RETURNS JSONB AS $$
BEGIN
    -- Deactivate the specific role
    UPDATE public.user_roles
    SET 
        is_active = false,
        role_specific_profile = role_specific_profile || jsonb_build_object(
            'suspension_reason', suspension_reason,
            'suspended_at', NOW()
        )
    WHERE id = role_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Role suspended successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function for bulk document verification
CREATE OR REPLACE FUNCTION public.bulk_verify_documents(
    role_ids UUID[],
    verification_status TEXT,
    admin_note TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    updated_count INT;
BEGIN
    -- Update all specified roles
    UPDATE public.user_roles
    SET 
        verification_status = bulk_verify_documents.verification_status,
        activated_at = CASE 
            WHEN bulk_verify_documents.verification_status = 'verified' THEN NOW()
            ELSE activated_at
        END,
        role_specific_profile = role_specific_profile || jsonb_build_object(
            'review_note', admin_note,
            'reviewed_at', NOW(),
            'bulk_processed', true
        )
    WHERE id = ANY(role_ids);

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'updated_count', updated_count,
        'message', format('%s roles updated successfully', updated_count)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get user activity summary
CREATE OR REPLACE FUNCTION public.get_user_activity_summary(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    recent_shipments JSONB;
    recent_bids JSONB;
    recent_transactions JSONB;
BEGIN
    -- Get recent shipments
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'shipment_number', shipment_number,
            'status', status,
            'pickup_location', pickup_location,
            'delivery_location', delivery_location,
            'created_at', created_at
        )
    ) INTO recent_shipments
    FROM (
        SELECT * FROM public.shipments
        WHERE shipper_user_id = target_user_id
        ORDER BY created_at DESC
        LIMIT 10
    ) recent;

    -- Get recent bids
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'bid_amount', bid_amount,
            'bid_status', bid_status,
            'bid_submitted_at', bid_submitted_at
        )
    ) INTO recent_bids
    FROM (
        SELECT * FROM public.bids
        WHERE carrier_user_id = target_user_id
        ORDER BY bid_submitted_at DESC
        LIMIT 10
    ) recent;

    -- Get recent transactions
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'transaction_type', transaction_type,
            'gross_amount', gross_amount,
            'payment_status', payment_status,
            'created_at', created_at
        )
    ) INTO recent_transactions
    FROM (
        SELECT * FROM public.transactions
        WHERE payer_user_id = target_user_id OR payee_user_id = target_user_id
        ORDER BY created_at DESC
        LIMIT 10
    ) recent;

    RETURN jsonb_build_object(
        'recent_shipments', COALESCE(recent_shipments, '[]'::jsonb),
        'recent_bids', COALESCE(recent_bids, '[]'::jsonb),
        'recent_transactions', COALESCE(recent_transactions, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant execute permissions to authenticated users (middleware will handle admin role checks)
GRANT EXECUTE ON FUNCTION public.get_all_users(TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.suspend_user_account(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_user_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.suspend_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_verify_documents(UUID[], TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_activity_summary(UUID) TO authenticated;
