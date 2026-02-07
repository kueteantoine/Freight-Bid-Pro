-- Admin Roles & Permissions Schema (Prompt 47 - Part 1)
-- This migration creates a role-based permission system for admin users

-- =====================================================
-- ENUMS
-- =====================================================

-- Admin role types
DO $$ BEGIN
    CREATE TYPE admin_role_type AS ENUM (
        'super_admin',      -- Full access to everything
        'financial_admin',  -- View revenue, process refunds, manage commission rates
        'content_admin',    -- Manage FAQ, Help docs, Terms, edit templates
        'ad_manager',       -- Approve/reject ads, manage placements, view ad performance
        'support_admin'     -- Handle disputes, manage user verification, access user profiles
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- =====================================================
-- ADMIN_ROLES TABLE
-- =====================================================
-- Define admin role types with descriptions
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name admin_role_type NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active roles
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON public.admin_roles(is_active);

-- Enable RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Everyone can read role definitions
CREATE POLICY "Everyone can read admin roles"
    ON public.admin_roles FOR SELECT
    USING (true);


-- =====================================================
-- ADMIN_PERMISSIONS TABLE
-- =====================================================
-- Granular permission definitions
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_key TEXT NOT NULL UNIQUE,
    permission_name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'advertisements', 'content', 'financial', 'users', 'system'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for category queries
CREATE INDEX IF NOT EXISTS idx_admin_permissions_category ON public.admin_permissions(category);

-- Enable RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can read permissions
CREATE POLICY "Everyone can read admin permissions"
    ON public.admin_permissions FOR SELECT
    USING (true);


-- =====================================================
-- ADMIN_ROLE_PERMISSIONS TABLE
-- =====================================================
-- Junction table mapping roles to permissions
CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name admin_role_type NOT NULL REFERENCES public.admin_roles(role_name) ON DELETE CASCADE,
    permission_key TEXT NOT NULL REFERENCES public.admin_permissions(permission_key) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_name, permission_key)
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_role ON public.admin_role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_permission ON public.admin_role_permissions(permission_key);

-- Enable RLS
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can read role-permission mappings
CREATE POLICY "Everyone can read admin role permissions"
    ON public.admin_role_permissions FOR SELECT
    USING (true);


-- =====================================================
-- ADMIN_USER_ROLES TABLE
-- =====================================================
-- Assign roles to admin users (users can have multiple roles)
CREATE TABLE IF NOT EXISTS public.admin_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name admin_role_type NOT NULL REFERENCES public.admin_roles(role_name) ON DELETE CASCADE,
    assigned_by_user_id UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_name)
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_user ON public.admin_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_role ON public.admin_user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_active ON public.admin_user_roles(is_active);

-- Enable RLS
ALTER TABLE public.admin_user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own admin roles"
    ON public.admin_user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- Only super admins can manage role assignments
CREATE POLICY "Super admins can manage admin user roles"
    ON public.admin_user_roles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_user_roles aur
            WHERE aur.user_id = auth.uid()
            AND aur.role_name = 'super_admin'
            AND aur.is_active = true
        )
    );


-- =====================================================
-- ADMIN_AUDIT_LOGS TABLE
-- =====================================================
-- Track all admin actions for compliance
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- e.g., 'approve_ad', 'edit_content', 'assign_role', 'process_refund'
    entity_type TEXT NOT NULL, -- e.g., 'advertisement', 'content_page', 'user_role', 'transaction'
    entity_id UUID, -- ID of the affected entity
    action_details JSONB, -- Additional context about the action
    ip_address TEXT,
    user_agent TEXT,
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user ON public.admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_type ON public.admin_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity ON public.admin_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_date ON public.admin_audit_logs(performed_at DESC);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins and financial admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON public.admin_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_user_roles aur
            WHERE aur.user_id = auth.uid()
            AND aur.role_name IN ('super_admin', 'financial_admin')
            AND aur.is_active = true
        )
    );

-- System can insert audit logs (no user can directly insert)
-- This will be done via RPC functions


-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert admin role definitions
INSERT INTO public.admin_roles (role_name, display_name, description) VALUES
    ('super_admin', 'Super Admin', 'Full access to all platform features including user management, financial data, system settings, and all admin functions.'),
    ('financial_admin', 'Financial Admin', 'Access to revenue data, refund processing, commission rate management. Cannot suspend users or access system settings.'),
    ('content_admin', 'Content Admin', 'Manage FAQ, Help documentation, Terms of Service, Privacy Policy, and email/SMS templates. Cannot access financial data.'),
    ('ad_manager', 'Advertisement Manager', 'Approve/reject advertisements, manage ad placements, view ad performance metrics. Cannot access user financial data.'),
    ('support_admin', 'Support Admin', 'Handle disputes, manage user verification, access user profiles (read-only on finances). Cannot suspend users.')
ON CONFLICT (role_name) DO NOTHING;


-- Insert permission definitions
INSERT INTO public.admin_permissions (permission_key, permission_name, description, category) VALUES
    -- Advertisement permissions
    ('can_view_ads', 'View Advertisements', 'View all advertisements and their details', 'advertisements'),
    ('can_create_ads', 'Create Advertisements', 'Create new advertisements', 'advertisements'),
    ('can_edit_ads', 'Edit Advertisements', 'Edit existing advertisements', 'advertisements'),
    ('can_approve_ads', 'Approve Advertisements', 'Approve or reject ad submissions', 'advertisements'),
    ('can_delete_ads', 'Delete Advertisements', 'Delete advertisements', 'advertisements'),
    ('can_view_ad_revenue', 'View Ad Revenue', 'View advertisement revenue and billing data', 'advertisements'),
    
    -- Content permissions
    ('can_view_content', 'View Content', 'View all content pages', 'content'),
    ('can_create_content', 'Create Content', 'Create new content pages', 'content'),
    ('can_edit_content', 'Edit Content', 'Edit existing content pages', 'content'),
    ('can_publish_content', 'Publish Content', 'Publish content pages', 'content'),
    ('can_delete_content', 'Delete Content', 'Delete content pages', 'content'),
    ('can_view_content_history', 'View Content History', 'View version history of content pages', 'content'),
    ('can_rollback_content', 'Rollback Content', 'Restore previous versions of content', 'content'),
    
    -- Template permissions
    ('can_view_templates', 'View Templates', 'View email and SMS templates', 'templates'),
    ('can_edit_templates', 'Edit Templates', 'Edit email and SMS templates', 'templates'),
    ('can_test_templates', 'Test Templates', 'Send test emails/SMS', 'templates'),
    
    -- Financial permissions
    ('can_view_revenue', 'View Revenue', 'View platform revenue and financial reports', 'financial'),
    ('can_view_transactions', 'View Transactions', 'View all transaction details', 'financial'),
    ('can_process_refunds', 'Process Refunds', 'Approve and process refund requests', 'financial'),
    ('can_manage_commission_rates', 'Manage Commission Rates', 'Configure commission tiers and rates', 'financial'),
    ('can_view_user_financials', 'View User Financials', 'View user wallet balances and earnings', 'financial'),
    
    -- User management permissions
    ('can_view_users', 'View Users', 'View user profiles and details', 'users'),
    ('can_edit_users', 'Edit Users', 'Edit user profile information', 'users'),
    ('can_suspend_users', 'Suspend Users', 'Suspend or deactivate user accounts', 'users'),
    ('can_verify_users', 'Verify Users', 'Approve or reject user verification documents', 'users'),
    ('can_view_user_activity', 'View User Activity', 'View user activity logs and history', 'users'),
    
    -- Dispute permissions
    ('can_view_disputes', 'View Disputes', 'View all disputes', 'disputes'),
    ('can_manage_disputes', 'Manage Disputes', 'Assign, review, and resolve disputes', 'disputes'),
    
    -- System permissions
    ('can_manage_admin_roles', 'Manage Admin Roles', 'Assign and revoke admin roles', 'system'),
    ('can_view_audit_logs', 'View Audit Logs', 'View admin action audit trail', 'system'),
    ('can_manage_settings', 'Manage Platform Settings', 'Configure platform-wide settings', 'system')
ON CONFLICT (permission_key) DO NOTHING;


-- Map permissions to roles
INSERT INTO public.admin_role_permissions (role_name, permission_key) VALUES
    -- Super Admin: All permissions
    ('super_admin', 'can_view_ads'),
    ('super_admin', 'can_create_ads'),
    ('super_admin', 'can_edit_ads'),
    ('super_admin', 'can_approve_ads'),
    ('super_admin', 'can_delete_ads'),
    ('super_admin', 'can_view_ad_revenue'),
    ('super_admin', 'can_view_content'),
    ('super_admin', 'can_create_content'),
    ('super_admin', 'can_edit_content'),
    ('super_admin', 'can_publish_content'),
    ('super_admin', 'can_delete_content'),
    ('super_admin', 'can_view_content_history'),
    ('super_admin', 'can_rollback_content'),
    ('super_admin', 'can_view_templates'),
    ('super_admin', 'can_edit_templates'),
    ('super_admin', 'can_test_templates'),
    ('super_admin', 'can_view_revenue'),
    ('super_admin', 'can_view_transactions'),
    ('super_admin', 'can_process_refunds'),
    ('super_admin', 'can_manage_commission_rates'),
    ('super_admin', 'can_view_user_financials'),
    ('super_admin', 'can_view_users'),
    ('super_admin', 'can_edit_users'),
    ('super_admin', 'can_suspend_users'),
    ('super_admin', 'can_verify_users'),
    ('super_admin', 'can_view_user_activity'),
    ('super_admin', 'can_view_disputes'),
    ('super_admin', 'can_manage_disputes'),
    ('super_admin', 'can_manage_admin_roles'),
    ('super_admin', 'can_view_audit_logs'),
    ('super_admin', 'can_manage_settings'),
    
    -- Financial Admin
    ('financial_admin', 'can_view_revenue'),
    ('financial_admin', 'can_view_transactions'),
    ('financial_admin', 'can_process_refunds'),
    ('financial_admin', 'can_manage_commission_rates'),
    ('financial_admin', 'can_view_user_financials'),
    ('financial_admin', 'can_view_audit_logs'),
    
    -- Content Admin
    ('content_admin', 'can_view_content'),
    ('content_admin', 'can_create_content'),
    ('content_admin', 'can_edit_content'),
    ('content_admin', 'can_publish_content'),
    ('content_admin', 'can_delete_content'),
    ('content_admin', 'can_view_content_history'),
    ('content_admin', 'can_rollback_content'),
    ('content_admin', 'can_view_templates'),
    ('content_admin', 'can_edit_templates'),
    ('content_admin', 'can_test_templates'),
    
    -- Ad Manager
    ('ad_manager', 'can_view_ads'),
    ('ad_manager', 'can_create_ads'),
    ('ad_manager', 'can_edit_ads'),
    ('ad_manager', 'can_approve_ads'),
    ('ad_manager', 'can_delete_ads'),
    ('ad_manager', 'can_view_ad_revenue'),
    
    -- Support Admin
    ('support_admin', 'can_view_users'),
    ('support_admin', 'can_verify_users'),
    ('support_admin', 'can_view_user_activity'),
    ('support_admin', 'can_view_disputes'),
    ('support_admin', 'can_manage_disputes')
ON CONFLICT (role_name, permission_key) DO NOTHING;


-- =====================================================
-- RPC FUNCTIONS
-- =====================================================

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION public.check_admin_permission(
    permission_key_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN;
BEGIN
    -- Check if user has any active role with this permission
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_user_roles aur
        JOIN public.admin_role_permissions arp ON aur.role_name = arp.role_name
        WHERE aur.user_id = auth.uid()
        AND aur.is_active = true
        AND arp.permission_key = permission_key_param
    ) INTO has_permission;
    
    RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_admin_permissions(
    user_id_param UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    target_user_id UUID;
    permissions_data JSONB;
BEGIN
    -- Use provided user_id or current user
    target_user_id := COALESCE(user_id_param, auth.uid());
    
    -- Get all unique permissions for the user
    SELECT jsonb_agg(DISTINCT ap.permission_key)
    INTO permissions_data
    FROM public.admin_user_roles aur
    JOIN public.admin_role_permissions arp ON aur.role_name = arp.role_name
    JOIN public.admin_permissions ap ON arp.permission_key = ap.permission_key
    WHERE aur.user_id = target_user_id
    AND aur.is_active = true;
    
    RETURN COALESCE(permissions_data, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get all roles for a user
CREATE OR REPLACE FUNCTION public.get_admin_roles(
    user_id_param UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    target_user_id UUID;
    roles_data JSONB;
BEGIN
    -- Use provided user_id or current user
    target_user_id := COALESCE(user_id_param, auth.uid());
    
    -- Get all active roles for the user
    SELECT jsonb_agg(jsonb_build_object(
        'role_name', aur.role_name,
        'display_name', ar.display_name,
        'description', ar.description,
        'assigned_at', aur.assigned_at
    ))
    INTO roles_data
    FROM public.admin_user_roles aur
    JOIN public.admin_roles ar ON aur.role_name = ar.role_name
    WHERE aur.user_id = target_user_id
    AND aur.is_active = true;
    
    RETURN COALESCE(roles_data, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Assign admin role to user (only super admins can do this)
CREATE OR REPLACE FUNCTION public.assign_admin_role(
    target_user_id UUID,
    role_name_param admin_role_type
)
RETURNS JSONB AS $$
DECLARE
    is_super_admin BOOLEAN;
    result JSONB;
BEGIN
    -- Check if current user is super admin
    SELECT EXISTS (
        SELECT 1 FROM public.admin_user_roles
        WHERE user_id = auth.uid()
        AND role_name = 'super_admin'
        AND is_active = true
    ) INTO is_super_admin;
    
    IF NOT is_super_admin THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only super admins can assign roles'
        );
    END IF;
    
    -- Insert or update role assignment
    INSERT INTO public.admin_user_roles (user_id, role_name, assigned_by_user_id, is_active)
    VALUES (target_user_id, role_name_param, auth.uid(), true)
    ON CONFLICT (user_id, role_name) 
    DO UPDATE SET is_active = true, assigned_by_user_id = auth.uid(), assigned_at = NOW();
    
    -- Log the action
    INSERT INTO public.admin_audit_logs (user_id, action_type, entity_type, entity_id, action_details)
    VALUES (
        auth.uid(),
        'assign_admin_role',
        'admin_user_role',
        target_user_id,
        jsonb_build_object('role_name', role_name_param, 'target_user_id', target_user_id)
    );
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Revoke admin role from user (only super admins can do this)
CREATE OR REPLACE FUNCTION public.revoke_admin_role(
    target_user_id UUID,
    role_name_param admin_role_type
)
RETURNS JSONB AS $$
DECLARE
    is_super_admin BOOLEAN;
BEGIN
    -- Check if current user is super admin
    SELECT EXISTS (
        SELECT 1 FROM public.admin_user_roles
        WHERE user_id = auth.uid()
        AND role_name = 'super_admin'
        AND is_active = true
    ) INTO is_super_admin;
    
    IF NOT is_super_admin THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only super admins can revoke roles'
        );
    END IF;
    
    -- Deactivate role assignment
    UPDATE public.admin_user_roles
    SET is_active = false
    WHERE user_id = target_user_id
    AND role_name = role_name_param;
    
    -- Log the action
    INSERT INTO public.admin_audit_logs (user_id, action_type, entity_type, entity_id, action_details)
    VALUES (
        auth.uid(),
        'revoke_admin_role',
        'admin_user_role',
        target_user_id,
        jsonb_build_object('role_name', role_name_param, 'target_user_id', target_user_id)
    );
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Log admin action
CREATE OR REPLACE FUNCTION public.log_admin_action(
    action_type_param TEXT,
    entity_type_param TEXT,
    entity_id_param UUID,
    action_details_param JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.admin_audit_logs (
        user_id,
        action_type,
        entity_type,
        entity_id,
        action_details
    ) VALUES (
        auth.uid(),
        action_type_param,
        entity_type_param,
        entity_id_param,
        action_details_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get audit log with filters
CREATE OR REPLACE FUNCTION public.get_admin_audit_log(
    user_id_filter UUID DEFAULT NULL,
    action_type_filter TEXT DEFAULT NULL,
    entity_type_filter TEXT DEFAULT NULL,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL,
    limit_param INTEGER DEFAULT 100,
    offset_param INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    logs_data JSONB;
    total_count INTEGER;
BEGIN
    -- Check if user has permission to view audit logs
    IF NOT public.check_admin_permission('can_view_audit_logs') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient permissions to view audit logs'
        );
    END IF;
    
    -- Get total count
    SELECT COUNT(*)
    INTO total_count
    FROM public.admin_audit_logs
    WHERE (user_id_filter IS NULL OR user_id = user_id_filter)
    AND (action_type_filter IS NULL OR action_type = action_type_filter)
    AND (entity_type_filter IS NULL OR entity_type = entity_type_filter)
    AND (date_from IS NULL OR performed_at >= date_from)
    AND (date_to IS NULL OR performed_at <= date_to);
    
    -- Get logs
    SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'action_type', action_type,
        'entity_type', entity_type,
        'entity_id', entity_id,
        'action_details', action_details,
        'performed_at', performed_at
    ))
    INTO logs_data
    FROM (
        SELECT *
        FROM public.admin_audit_logs
        WHERE (user_id_filter IS NULL OR user_id = user_id_filter)
        AND (action_type_filter IS NULL OR action_type = action_type_filter)
        AND (entity_type_filter IS NULL OR entity_type = entity_type_filter)
        AND (date_from IS NULL OR performed_at >= date_from)
        AND (date_to IS NULL OR performed_at <= date_to)
        ORDER BY performed_at DESC
        LIMIT limit_param
        OFFSET offset_param
    ) subquery;
    
    RETURN jsonb_build_object(
        'success', true,
        'data', COALESCE(logs_data, '[]'::jsonb),
        'total_count', total_count,
        'limit', limit_param,
        'offset', offset_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_admin_roles_updated_at
    BEFORE UPDATE ON public.admin_roles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.check_admin_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_admin_role(UUID, admin_role_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin_role(UUID, admin_role_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_audit_log(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER) TO authenticated;


-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.admin_roles IS 'Admin role definitions with descriptions';
COMMENT ON TABLE public.admin_permissions IS 'Granular permission definitions for admin actions';
COMMENT ON TABLE public.admin_role_permissions IS 'Mapping of roles to permissions';
COMMENT ON TABLE public.admin_user_roles IS 'Admin role assignments to users';
COMMENT ON TABLE public.admin_audit_logs IS 'Audit trail of all admin actions for compliance';

COMMENT ON FUNCTION public.check_admin_permission(TEXT) IS 'Check if current user has a specific admin permission';
COMMENT ON FUNCTION public.get_admin_permissions(UUID) IS 'Get all permissions for an admin user';
COMMENT ON FUNCTION public.get_admin_roles(UUID) IS 'Get all roles assigned to an admin user';
COMMENT ON FUNCTION public.assign_admin_role(UUID, admin_role_type) IS 'Assign an admin role to a user (super admin only)';
COMMENT ON FUNCTION public.revoke_admin_role(UUID, admin_role_type) IS 'Revoke an admin role from a user (super admin only)';
COMMENT ON FUNCTION public.log_admin_action(TEXT, TEXT, UUID, JSONB) IS 'Log an admin action to the audit trail';
COMMENT ON FUNCTION public.get_admin_audit_log(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER) IS 'Get admin audit log with filters';
