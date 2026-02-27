-- Security Hardening Audit Fixes (Prompt 62)
-- This migration addresses security gaps identified during the audit.

-- 1. Ensure RLS is enabled on ALL public tables
DO $$
DECLARE
    row record;
BEGIN
    FOR row IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', row.tablename);
    END LOOP;
END $$;

-- 2. Audit and Fix "admin_audit_logs"
-- Ensure it is strictly append-only for admins and system
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.admin_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_user_roles aur
            WHERE aur.user_id = auth.uid()
            AND aur.role_name IN ('super_admin', 'financial_admin', 'support_admin')
            AND aur.is_active = true
        )
    );

-- System only insert (via Security Definer function)
DROP POLICY IF EXISTS "No direct inserts to audit logs" ON public.admin_audit_logs;
CREATE POLICY "No direct inserts to audit logs"
    ON public.admin_audit_logs FOR INSERT
    WITH CHECK (false);

-- 3. Enhance Security Logging Function
CREATE OR REPLACE FUNCTION public.log_security_event(
    event_type TEXT,
    event_severity TEXT DEFAULT 'info',
    details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.admin_audit_logs (
        user_id,
        action_type,
        entity_type,
        action_details,
        ip_address
    ) VALUES (
        auth.uid(),
        event_type,
        'security_event',
        jsonb_build_object('severity', event_severity, 'details', details),
        -- We can't easily get IP in PL/pgSQL directly without extensions, but we can log user agent if passed
        NULL 
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add Constraints for sensitive data
-- Ensure bid amounts are positive (already exists in some versions, but double-checking)
DO $$
BEGIN
    ALTER TABLE public.bids ADD CONSTRAINT bids_bid_amount_check CHECK (bid_amount > 0);
EXCEPTION
    WHEN duplicate_object OR duplicate_table THEN null;
    WHEN OTHERS THEN null;
END $$;

-- 5. Restrict sensitive system actions
-- Example: Only super admins can modify platform configuration
DROP POLICY IF EXISTS "Only super admins can manage platform configurations" ON public.platform_configurations;
CREATE POLICY "Only super admins can manage platform configurations"
    ON public.platform_configurations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_user_roles aur
            WHERE aur.user_id = auth.uid()
            AND aur.role_name = 'super_admin'
            AND aur.is_active = true
        )
    );

-- 6. Add trigger to log sensitive changes (e.g., user role changes)
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.role_type != NEW.role_type OR OLD.is_active != NEW.is_active) THEN
            PERFORM public.log_security_event(
                'user_role_updated',
                'warning',
                jsonb_build_object(
                    'target_user_id', NEW.user_id,
                    'old_role', OLD.role_type,
                    'new_role', NEW.role_type,
                    'old_active', OLD.is_active,
                    'new_active', NEW.is_active
                )
            );
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
         PERFORM public.log_security_event(
                'user_role_created',
                'info',
                jsonb_build_object(
                    'target_user_id', NEW.user_id,
                    'role', NEW.role_type
                )
            );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_role_change ON public.user_roles;
CREATE TRIGGER trigger_log_role_change
    AFTER INSERT OR UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE PROCEDURE log_role_change();

-- 7. Log account suspensions
CREATE OR REPLACE FUNCTION log_account_suspension()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.account_status != NEW.account_status AND NEW.account_status = 'suspended') THEN
        PERFORM public.log_security_event(
            'account_suspended',
            'critical',
            jsonb_build_object(
                'target_user_id', NEW.id,
                'email', NEW.email
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_account_suspension ON public.profiles;
CREATE TRIGGER trigger_log_account_suspension
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE log_account_suspension();

COMMENT ON FUNCTION public.log_security_event(TEXT, TEXT, JSONB) IS 'Log a security event to the admin audit trail (Security Definer)';
