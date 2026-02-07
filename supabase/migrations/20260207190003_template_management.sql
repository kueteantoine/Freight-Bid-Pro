-- Email/SMS Template Management with Conditional Logic (Prompt 47 - Part 4)
-- This migration creates a template builder for email and SMS with conditional logic
-- based on user role, transaction type, language, and custom variables

-- =====================================================
-- ENUMS
-- =====================================================

-- Template types
DO $$ BEGIN
    CREATE TYPE template_type AS ENUM (
        'email',
        'sms'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Variable types
DO $$ BEGIN
    CREATE TYPE template_variable_type AS ENUM (
        'string',
        'number',
        'date',
        'boolean',
        'currency',
        'url'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- =====================================================
-- EMAIL_TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT NOT NULL UNIQUE, -- e.g., 'payment_confirmation', 'bid_accepted'
    template_name TEXT NOT NULL,
    description TEXT,
    subject_template TEXT NOT NULL, -- Subject line with variables
    body_template TEXT NOT NULL, -- HTML body with variables and conditional logic
    variables_schema JSONB DEFAULT '[]'::jsonb, -- Array of available variables
    conditional_rules JSONB DEFAULT '[]'::jsonb, -- Conditional logic rules
    language TEXT DEFAULT 'en',
    category TEXT, -- e.g., 'transactional', 'marketing', 'notifications'
    is_active BOOLEAN DEFAULT true,
    created_by_admin_id UUID REFERENCES auth.users(id),
    updated_by_admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(template_key, language)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON public.email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_language ON public.email_templates(language);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Content admins can manage templates
CREATE POLICY "Content admins can manage email templates"
    ON public.email_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_user_roles aur
            WHERE aur.user_id = auth.uid()
            AND aur.role_name IN ('super_admin', 'content_admin')
            AND aur.is_active = true
        )
    );


-- =====================================================
-- SMS_TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT NOT NULL UNIQUE, -- e.g., 'payment_confirmation_sms', 'bid_accepted_sms'
    template_name TEXT NOT NULL,
    description TEXT,
    message_template TEXT NOT NULL, -- Plain text with variables
    variables_schema JSONB DEFAULT '[]'::jsonb, -- Array of available variables
    conditional_rules JSONB DEFAULT '[]'::jsonb, -- Conditional logic rules
    language TEXT DEFAULT 'en',
    category TEXT,
    character_count INTEGER, -- Calculated character count
    is_active BOOLEAN DEFAULT true,
    created_by_admin_id UUID REFERENCES auth.users(id),
    updated_by_admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(template_key, language)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sms_templates_key ON public.sms_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_sms_templates_language ON public.sms_templates(language);
CREATE INDEX IF NOT EXISTS idx_sms_templates_active ON public.sms_templates(is_active);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- Content admins can manage templates
CREATE POLICY "Content admins can manage sms templates"
    ON public.sms_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_user_roles aur
            WHERE aur.user_id = auth.uid()
            AND aur.role_name IN ('super_admin', 'content_admin')
            AND aur.is_active = true
        )
    );


-- =====================================================
-- TEMPLATE_VARIABLES TABLE
-- =====================================================
-- Reusable variable definitions
CREATE TABLE IF NOT EXISTS public.template_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variable_name TEXT NOT NULL UNIQUE, -- e.g., 'user_name', 'shipment_id', 'payment_amount'
    variable_type template_variable_type NOT NULL,
    description TEXT NOT NULL,
    example_value TEXT,
    category TEXT, -- e.g., 'user', 'shipment', 'payment', 'system'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_template_variables_category ON public.template_variables(category);

-- Enable RLS
ALTER TABLE public.template_variables ENABLE ROW LEVEL SECURITY;

-- Everyone can read template variables
CREATE POLICY "Anyone can read template variables"
    ON public.template_variables FOR SELECT
    USING (true);


-- =====================================================
-- RPC FUNCTIONS
-- =====================================================

-- Render email template with variables and conditional logic
CREATE OR REPLACE FUNCTION public.render_email_template(
    template_key_param TEXT,
    variables_param JSONB,
    user_role_param TEXT DEFAULT NULL,
    language_param TEXT DEFAULT 'en'
)
RETURNS JSONB AS $$
DECLARE
    template_record RECORD;
    rendered_subject TEXT;
    rendered_body TEXT;
    variable_key TEXT;
    variable_value TEXT;
    conditional_rule JSONB;
    condition_met BOOLEAN;
BEGIN
    -- Get template
    SELECT * INTO template_record
    FROM public.email_templates
    WHERE template_key = template_key_param
    AND language = language_param
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Template not found'
        );
    END IF;
    
    -- Start with template content
    rendered_subject := template_record.subject_template;
    rendered_body := template_record.body_template;
    
    -- Replace variables
    FOR variable_key, variable_value IN SELECT * FROM jsonb_each_text(variables_param)
    LOOP
        rendered_subject := REPLACE(rendered_subject, '{{' || variable_key || '}}', variable_value);
        rendered_body := REPLACE(rendered_body, '{{' || variable_key || '}}', variable_value);
    END LOOP;
    
    -- Process conditional rules
    -- Format: [{"condition": {"user_role": "shipper"}, "content": "Shipper-specific content"}]
    FOR conditional_rule IN SELECT * FROM jsonb_array_elements(template_record.conditional_rules)
    LOOP
        condition_met := true;
        
        -- Check if user_role matches
        IF conditional_rule->'condition'->>'user_role' IS NOT NULL THEN
            IF user_role_param IS NULL OR conditional_rule->'condition'->>'user_role' != user_role_param THEN
                condition_met := false;
            END IF;
        END IF;
        
        -- If condition is met, include the conditional content
        IF condition_met THEN
            -- Replace conditional placeholder with actual content
            rendered_body := REPLACE(
                rendered_body,
                '{{conditional:' || (conditional_rule->>'id') || '}}',
                conditional_rule->>'content'
            );
        ELSE
            -- Remove conditional placeholder if condition not met
            rendered_body := REPLACE(
                rendered_body,
                '{{conditional:' || (conditional_rule->>'id') || '}}',
                ''
            );
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'subject', rendered_subject,
            'body', rendered_body,
            'template_key', template_key_param
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Render SMS template
CREATE OR REPLACE FUNCTION public.render_sms_template(
    template_key_param TEXT,
    variables_param JSONB,
    user_role_param TEXT DEFAULT NULL,
    language_param TEXT DEFAULT 'en'
)
RETURNS JSONB AS $$
DECLARE
    template_record RECORD;
    rendered_message TEXT;
    variable_key TEXT;
    variable_value TEXT;
    conditional_rule JSONB;
    condition_met BOOLEAN;
BEGIN
    -- Get template
    SELECT * INTO template_record
    FROM public.sms_templates
    WHERE template_key = template_key_param
    AND language = language_param
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Template not found'
        );
    END IF;
    
    -- Start with template content
    rendered_message := template_record.message_template;
    
    -- Replace variables
    FOR variable_key, variable_value IN SELECT * FROM jsonb_each_text(variables_param)
    LOOP
        rendered_message := REPLACE(rendered_message, '{{' || variable_key || '}}', variable_value);
    END LOOP;
    
    -- Process conditional rules (similar to email)
    FOR conditional_rule IN SELECT * FROM jsonb_array_elements(template_record.conditional_rules)
    LOOP
        condition_met := true;
        
        IF conditional_rule->'condition'->>'user_role' IS NOT NULL THEN
            IF user_role_param IS NULL OR conditional_rule->'condition'->>'user_role' != user_role_param THEN
                condition_met := false;
            END IF;
        END IF;
        
        IF condition_met THEN
            rendered_message := REPLACE(
                rendered_message,
                '{{conditional:' || (conditional_rule->>'id') || '}}',
                conditional_rule->>'content'
            );
        ELSE
            rendered_message := REPLACE(
                rendered_message,
                '{{conditional:' || (conditional_rule->>'id') || '}}',
                ''
            );
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'message', rendered_message,
            'character_count', LENGTH(rendered_message),
            'template_key', template_key_param
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get template preview with sample data
CREATE OR REPLACE FUNCTION public.get_template_preview(
    template_id_param UUID,
    template_type_param template_type,
    sample_data_param JSONB
)
RETURNS JSONB AS $$
DECLARE
    template_key_val TEXT;
    language_val TEXT;
BEGIN
    -- Check permission
    IF NOT public.check_admin_permission('can_view_templates') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Get template key and language
    IF template_type_param = 'email' THEN
        SELECT template_key, language INTO template_key_val, language_val
        FROM public.email_templates
        WHERE id = template_id_param;
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Template not found');
        END IF;
        
        RETURN public.render_email_template(
            template_key_val,
            sample_data_param->'variables',
            sample_data_param->>'user_role',
            language_val
        );
    ELSE
        SELECT template_key, language INTO template_key_val, language_val
        FROM public.sms_templates
        WHERE id = template_id_param;
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Template not found');
        END IF;
        
        RETURN public.render_sms_template(
            template_key_val,
            sample_data_param->'variables',
            sample_data_param->>'user_role',
            language_val
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Validate template syntax
CREATE OR REPLACE FUNCTION public.validate_template_syntax(
    template_body_param TEXT
)
RETURNS JSONB AS $$
DECLARE
    validation_errors TEXT[] := ARRAY[]::TEXT[];
    variable_pattern TEXT := '\{\{[^}]+\}\}';
    variables TEXT[];
    var TEXT;
BEGIN
    -- Extract all variables
    variables := regexp_matches(template_body_param, variable_pattern, 'g');
    
    -- Check for common syntax errors
    IF template_body_param ~ '\{\{[^}]*\{' THEN
        validation_errors := array_append(validation_errors, 'Nested curly braces detected');
    END IF;
    
    IF template_body_param ~ '\{[^{]' OR template_body_param ~ '[^}]\}' THEN
        validation_errors := array_append(validation_errors, 'Unmatched curly braces');
    END IF;
    
    -- Check for empty variables
    IF template_body_param ~ '\{\{\s*\}\}' THEN
        validation_errors := array_append(validation_errors, 'Empty variable placeholder found');
    END IF;
    
    IF array_length(validation_errors, 1) > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'errors', validation_errors
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Template syntax is valid'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-calculate SMS character count
CREATE OR REPLACE FUNCTION auto_calculate_sms_character_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.character_count := LENGTH(NEW.message_template);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_sms_character_count
    BEFORE INSERT OR UPDATE ON public.sms_templates
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_sms_character_count();


CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sms_templates_updated_at
    BEFORE UPDATE ON public.sms_templates
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert common template variables
INSERT INTO public.template_variables (variable_name, variable_type, description, example_value, category) VALUES
    -- User variables
    ('user_name', 'string', 'Full name of the user', 'John Doe', 'user'),
    ('user_email', 'string', 'Email address of the user', 'john@example.com', 'user'),
    ('user_phone', 'string', 'Phone number of the user', '+237 6XX XX XX XX', 'user'),
    ('user_role', 'string', 'Role of the user (shipper, carrier, driver)', 'shipper', 'user'),
    
    -- Shipment variables
    ('shipment_id', 'string', 'Unique shipment identifier', 'SHP-12345', 'shipment'),
    ('pickup_location', 'string', 'Pickup address', 'Douala, Cameroon', 'shipment'),
    ('delivery_location', 'string', 'Delivery address', 'Yaoundé, Cameroon', 'shipment'),
    ('shipment_status', 'string', 'Current status of shipment', 'In Transit', 'shipment'),
    ('estimated_delivery', 'date', 'Estimated delivery date', '2026-02-10', 'shipment'),
    
    -- Payment variables
    ('payment_amount', 'currency', 'Payment amount', '50,000 XAF', 'payment'),
    ('payment_method', 'string', 'Payment method used', 'Orange Money', 'payment'),
    ('transaction_id', 'string', 'Transaction reference', 'TXN-67890', 'payment'),
    ('payment_status', 'string', 'Payment status', 'Completed', 'payment'),
    
    -- Bid variables
    ('bid_amount', 'currency', 'Bid amount', '45,000 XAF', 'bid'),
    ('carrier_name', 'string', 'Name of the carrier', 'ABC Transport', 'bid'),
    ('bid_deadline', 'date', 'Bidding deadline', '2026-02-08', 'bid'),
    
    -- System variables
    ('platform_name', 'string', 'Platform name', 'Freight Bid Pro', 'system'),
    ('support_email', 'string', 'Support email address', 'support@freightbidpro.com', 'system'),
    ('support_phone', 'string', 'Support phone number', '+237 6XX XX XX XX', 'system'),
    ('dashboard_url', 'url', 'Link to user dashboard', 'https://app.freightbidpro.com/dashboard', 'system')
ON CONFLICT (variable_name) DO NOTHING;


-- Insert sample email templates
INSERT INTO public.email_templates (template_key, template_name, description, subject_template, body_template, variables_schema, language, category) VALUES
    (
        'payment_confirmation',
        'Payment Confirmation',
        'Sent when a payment is successfully processed',
        'Payment Confirmation - {{transaction_id}}',
        '<h1>Payment Confirmed</h1><p>Dear {{user_name}},</p><p>Your payment of {{payment_amount}} has been successfully processed.</p><p>Transaction ID: {{transaction_id}}</p><p>Payment Method: {{payment_method}}</p><p>Thank you for using {{platform_name}}!</p>',
        '["user_name", "payment_amount", "transaction_id", "payment_method", "platform_name"]'::jsonb,
        'en',
        'transactional'
    ),
    (
        'bid_accepted',
        'Bid Accepted',
        'Sent when a carrier''s bid is accepted',
        'Your bid has been accepted - {{shipment_id}}',
        '<h1>Congratulations!</h1><p>Dear {{user_name}},</p><p>Your bid of {{bid_amount}} for shipment {{shipment_id}} has been accepted.</p><p>Pickup: {{pickup_location}}</p><p>Delivery: {{delivery_location}}</p><p>Please log in to your dashboard to view details.</p>',
        '["user_name", "bid_amount", "shipment_id", "pickup_location", "delivery_location"]'::jsonb,
        'en',
        'transactional'
    )
ON CONFLICT (template_key, language) DO NOTHING;


-- Insert sample SMS templates
INSERT INTO public.sms_templates (template_key, template_name, description, message_template, variables_schema, language, category) VALUES
    (
        'payment_confirmation_sms',
        'Payment Confirmation SMS',
        'SMS sent when payment is processed',
        'Payment of {{payment_amount}} confirmed. Ref: {{transaction_id}}. Thank you!',
        '["payment_amount", "transaction_id"]'::jsonb,
        'en',
        'transactional'
    ),
    (
        'bid_accepted_sms',
        'Bid Accepted SMS',
        'SMS sent when bid is accepted',
        'Your bid of {{bid_amount}} for {{shipment_id}} accepted! Check dashboard for details.',
        '["bid_amount", "shipment_id"]'::jsonb,
        'en',
        'transactional'
    )
ON CONFLICT (template_key, language) DO NOTHING;


-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.render_email_template(TEXT, JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.render_sms_template(TEXT, JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_template_preview(UUID, template_type, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_template_syntax(TEXT) TO authenticated;


-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.email_templates IS 'Email templates with variable substitution and conditional logic';
COMMENT ON TABLE public.sms_templates IS 'SMS templates with variable substitution and conditional logic';
COMMENT ON TABLE public.template_variables IS 'Reusable variable definitions for templates';

COMMENT ON FUNCTION public.render_email_template(TEXT, JSONB, TEXT, TEXT) IS 'Render email template with variables and conditional logic';
COMMENT ON FUNCTION public.render_sms_template(TEXT, JSONB, TEXT, TEXT) IS 'Render SMS template with variables and conditional logic';
COMMENT ON FUNCTION public.get_template_preview(UUID, template_type, JSONB) IS 'Preview template with sample data';
COMMENT ON FUNCTION public.validate_template_syntax(TEXT) IS 'Validate template syntax for errors';
