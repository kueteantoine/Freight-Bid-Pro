-- Admin Financial Management Schema (Prompt 45)
-- This migration creates tables and functions for payment administration

-- =====================================================
-- PAYMENT_AGGREGATOR_CONFIGS TABLE
-- =====================================================
-- Store payment aggregator connection details and fee configurations
CREATE TABLE IF NOT EXISTS public.payment_aggregator_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregator_name TEXT NOT NULL UNIQUE, -- 'orange_money', 'mtn_momo', etc.
    display_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    api_base_url TEXT,
    api_credentials_encrypted JSONB, -- Store encrypted API keys, secrets
    default_commission_percentage DECIMAL(5,2) DEFAULT 5.0,
    default_aggregator_fee_percentage DECIMAL(5,2) DEFAULT 1.5,
    default_mobile_money_fee_percentage DECIMAL(5,2) DEFAULT 1.0,
    connection_status TEXT DEFAULT 'not_configured' CHECK (connection_status IN ('not_configured', 'connected', 'error')),
    last_connection_test TIMESTAMPTZ,
    connection_error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active aggregators
CREATE INDEX IF NOT EXISTS idx_payment_aggregator_configs_active ON public.payment_aggregator_configs(is_active);

-- Enable RLS
ALTER TABLE public.payment_aggregator_configs ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage payment aggregator configs"
    ON public.payment_aggregator_configs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );


-- =====================================================
-- RECONCILIATION_REPORTS TABLE
-- =====================================================
-- Track reconciliation activities and results
CREATE TABLE IF NOT EXISTS public.reconciliation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name TEXT NOT NULL,
    aggregator_name TEXT NOT NULL,
    report_period_start TIMESTAMPTZ NOT NULL,
    report_period_end TIMESTAMPTZ NOT NULL,
    uploaded_file_url TEXT, -- Path to uploaded CSV/Excel file
    total_aggregator_transactions INTEGER DEFAULT 0,
    total_platform_transactions INTEGER DEFAULT 0,
    matched_transactions INTEGER DEFAULT 0,
    unmatched_aggregator_transactions INTEGER DEFAULT 0,
    unmatched_platform_transactions INTEGER DEFAULT 0,
    total_discrepancies INTEGER DEFAULT 0,
    reconciliation_status TEXT DEFAULT 'pending' CHECK (reconciliation_status IN ('pending', 'in_progress', 'completed', 'failed')),
    processed_by_admin_id UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_status ON public.reconciliation_reports(reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_period ON public.reconciliation_reports(report_period_start, report_period_end);

-- Enable RLS
ALTER TABLE public.reconciliation_reports ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage reconciliation reports"
    ON public.reconciliation_reports FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );


-- =====================================================
-- RECONCILIATION_DISCREPANCIES TABLE
-- =====================================================
-- Log mismatches found during reconciliation
CREATE TABLE IF NOT EXISTS public.reconciliation_discrepancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reconciliation_reports(id) ON DELETE CASCADE,
    discrepancy_type TEXT NOT NULL CHECK (discrepancy_type IN ('missing_platform', 'missing_aggregator', 'amount_mismatch', 'status_mismatch')),
    platform_transaction_id UUID REFERENCES public.transactions(id),
    aggregator_transaction_id TEXT,
    platform_amount DECIMAL(12,2),
    aggregator_amount DECIMAL(12,2),
    amount_difference DECIMAL(12,2),
    platform_status TEXT,
    aggregator_status TEXT,
    discrepancy_details JSONB, -- Additional context
    resolution_status TEXT DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'investigating', 'resolved', 'ignored')),
    resolution_notes TEXT,
    resolved_by_admin_id UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reconciliation_discrepancies_report ON public.reconciliation_discrepancies(report_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_discrepancies_status ON public.reconciliation_discrepancies(resolution_status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_discrepancies_type ON public.reconciliation_discrepancies(discrepancy_type);

-- Enable RLS
ALTER TABLE public.reconciliation_discrepancies ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage reconciliation discrepancies"
    ON public.reconciliation_discrepancies FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
            AND is_active = true
        )
    );


-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_payment_aggregator_configs_updated_at
    BEFORE UPDATE ON public.payment_aggregator_configs
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_reconciliation_reports_updated_at
    BEFORE UPDATE ON public.reconciliation_reports
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_reconciliation_discrepancies_updated_at
    BEFORE UPDATE ON public.reconciliation_discrepancies
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- =====================================================
-- RPC FUNCTIONS
-- =====================================================

-- Get payment flow statistics for monitoring dashboard
CREATE OR REPLACE FUNCTION public.get_payment_flow_stats(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
    total_count INTEGER;
    completed_count INTEGER;
    failed_count INTEGER;
    pending_count INTEGER;
    total_value DECIMAL(15,2);
    success_rate DECIMAL(5,2);
BEGIN
    -- Count transactions by status
    SELECT 
        COUNT(*) FILTER (WHERE payment_status = 'completed'),
        COUNT(*) FILTER (WHERE payment_status = 'failed'),
        COUNT(*) FILTER (WHERE payment_status IN ('pending', 'processing')),
        COUNT(*),
        COALESCE(SUM(gross_amount) FILTER (WHERE payment_status = 'completed'), 0)
    INTO completed_count, failed_count, pending_count, total_count, total_value
    FROM public.transactions
    WHERE created_at BETWEEN start_date AND end_date;

    -- Calculate success rate
    IF total_count > 0 THEN
        success_rate := (completed_count::DECIMAL / total_count::DECIMAL) * 100;
    ELSE
        success_rate := 0;
    END IF;

    stats := jsonb_build_object(
        'total_transactions', total_count,
        'completed_transactions', completed_count,
        'failed_transactions', failed_count,
        'pending_transactions', pending_count,
        'total_transaction_value', total_value,
        'success_rate_percentage', ROUND(success_rate, 2),
        'period_start', start_date,
        'period_end', end_date
    );

    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get detailed transaction information for admin view
CREATE OR REPLACE FUNCTION public.get_transaction_details_admin(
    transaction_id_param UUID
)
RETURNS JSONB AS $$
DECLARE
    transaction_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'transaction', jsonb_build_object(
            'id', t.id,
            'transaction_type', t.transaction_type,
            'gross_amount', t.gross_amount,
            'platform_commission_amount', t.platform_commission_amount,
            'platform_commission_percentage', t.platform_commission_percentage,
            'aggregator_fee_amount', t.aggregator_fee_amount,
            'aggregator_fee_percentage', t.aggregator_fee_percentage,
            'mobile_money_fee_amount', t.mobile_money_fee_amount,
            'mobile_money_fee_percentage', t.mobile_money_fee_percentage,
            'total_deductions', t.total_deductions,
            'net_amount', t.net_amount,
            'currency', t.currency,
            'payment_method', t.payment_method,
            'aggregator_transaction_id', t.aggregator_transaction_id,
            'payment_status', t.payment_status,
            'payment_initiated_at', t.payment_initiated_at,
            'payment_completed_at', t.payment_completed_at,
            'created_at', t.created_at
        ),
        'shipment', jsonb_build_object(
            'id', s.id,
            'shipment_number', s.shipment_number,
            'pickup_location', s.pickup_location,
            'delivery_location', s.delivery_location,
            'status', s.status
        ),
        'payer', jsonb_build_object(
            'id', payer.id,
            'email', payer.email
        ),
        'payee', jsonb_build_object(
            'id', payee.id,
            'email', payee.email
        ),
        'invoices', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', i.id,
                'invoice_number', i.invoice_number,
                'invoice_type', i.invoice_type,
                'issued_at', i.issued_at,
                'pdf_url', i.pdf_url
            ))
            FROM public.invoices i
            WHERE i.transaction_id = t.id),
            '[]'::jsonb
        ),
        'refund_requests', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', rr.id,
                'refund_type', rr.refund_type,
                'refund_status', rr.refund_status,
                'refund_reason', rr.refund_reason,
                'requested_at', rr.requested_at
            ))
            FROM public.refund_requests rr
            WHERE rr.transaction_id = t.id),
            '[]'::jsonb
        )
    ) INTO transaction_data
    FROM public.transactions t
    LEFT JOIN public.shipments s ON s.id = t.shipment_id
    LEFT JOIN auth.users payer ON payer.id = t.payer_user_id
    LEFT JOIN auth.users payee ON payee.id = t.payee_user_id
    WHERE t.id = transaction_id_param;

    RETURN COALESCE(transaction_data, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get platform financial summary for reporting
CREATE OR REPLACE FUNCTION public.get_platform_financial_summary(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    summary JSONB;
    total_commission DECIMAL(15,2);
    total_aggregator_fees DECIMAL(15,2);
    total_mobile_fees DECIMAL(15,2);
    total_revenue DECIMAL(15,2);
    total_transactions INTEGER;
    avg_transaction_value DECIMAL(12,2);
BEGIN
    SELECT 
        COUNT(*),
        COALESCE(SUM(platform_commission_amount), 0),
        COALESCE(SUM(aggregator_fee_amount), 0),
        COALESCE(SUM(mobile_money_fee_amount), 0),
        COALESCE(AVG(gross_amount), 0)
    INTO total_transactions, total_commission, total_aggregator_fees, total_mobile_fees, avg_transaction_value
    FROM public.transactions
    WHERE payment_status = 'completed'
    AND created_at BETWEEN start_date AND end_date;

    total_revenue := total_commission + total_aggregator_fees + total_mobile_fees;

    summary := jsonb_build_object(
        'period_start', start_date,
        'period_end', end_date,
        'total_transactions', total_transactions,
        'total_platform_commission', total_commission,
        'total_aggregator_fees', total_aggregator_fees,
        'total_mobile_money_fees', total_mobile_fees,
        'total_platform_revenue', total_revenue,
        'average_transaction_value', ROUND(avg_transaction_value, 2),
        'commission_breakdown', jsonb_build_object(
            'platform_commission_percentage', ROUND((total_commission / NULLIF(total_revenue, 0)) * 100, 2),
            'aggregator_fees_percentage', ROUND((total_aggregator_fees / NULLIF(total_revenue, 0)) * 100, 2),
            'mobile_money_fees_percentage', ROUND((total_mobile_fees / NULLIF(total_revenue, 0)) * 100, 2)
        )
    );

    RETURN summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get pending refund requests for admin review
CREATE OR REPLACE FUNCTION public.get_refund_requests_pending()
RETURNS TABLE (
    id UUID,
    transaction_id UUID,
    shipment_id UUID,
    requested_by_user_id UUID,
    requester_email TEXT,
    refund_type TEXT,
    refund_percentage DECIMAL(5,2),
    refund_reason TEXT,
    refund_status TEXT,
    evidence_urls_json JSONB,
    requested_at TIMESTAMPTZ,
    transaction_amount DECIMAL(12,2),
    shipment_number TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rr.id,
        rr.transaction_id,
        rr.shipment_id,
        rr.requested_by_user_id,
        u.email AS requester_email,
        rr.refund_type,
        rr.refund_percentage,
        rr.refund_reason,
        rr.refund_status,
        rr.evidence_urls_json,
        rr.requested_at,
        t.gross_amount AS transaction_amount,
        s.shipment_number
    FROM public.refund_requests rr
    JOIN auth.users u ON u.id = rr.requested_by_user_id
    JOIN public.transactions t ON t.id = rr.transaction_id
    JOIN public.shipments s ON s.id = rr.shipment_id
    WHERE rr.refund_status = 'pending'
    ORDER BY rr.requested_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Process refund request (approve or reject)
CREATE OR REPLACE FUNCTION public.process_refund_request(
    refund_id_param UUID,
    action_param TEXT, -- 'approve' or 'reject'
    admin_notes_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    refund_record RECORD;
    new_status TEXT;
BEGIN
    -- Validate action
    IF action_param NOT IN ('approve', 'reject') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid action. Must be approve or reject.');
    END IF;

    -- Get refund request
    SELECT * INTO refund_record
    FROM public.refund_requests
    WHERE id = refund_id_param;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Refund request not found.');
    END IF;

    -- Set new status
    IF action_param = 'approve' THEN
        new_status := 'approved';
    ELSE
        new_status := 'rejected';
    END IF;

    -- Update refund request
    UPDATE public.refund_requests
    SET 
        refund_status = new_status,
        admin_notes = admin_notes_param,
        reviewed_at = NOW()
    WHERE id = refund_id_param;

    -- If approved, update transaction status
    IF action_param = 'approve' THEN
        IF refund_record.refund_type = 'full' THEN
            UPDATE public.transactions
            SET payment_status = 'refunded_full'
            WHERE id = refund_record.transaction_id;
        ELSE
            UPDATE public.transactions
            SET payment_status = 'refunded_partial'
            WHERE id = refund_record.transaction_id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'refund_id', refund_id_param,
        'new_status', new_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create reconciliation report
CREATE OR REPLACE FUNCTION public.create_reconciliation_report(
    report_name_param TEXT,
    aggregator_name_param TEXT,
    period_start_param TIMESTAMPTZ,
    period_end_param TIMESTAMPTZ,
    file_url_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_report_id UUID;
BEGIN
    INSERT INTO public.reconciliation_reports (
        report_name,
        aggregator_name,
        report_period_start,
        report_period_end,
        uploaded_file_url,
        processed_by_admin_id
    ) VALUES (
        report_name_param,
        aggregator_name_param,
        period_start_param,
        period_end_param,
        file_url_param,
        auth.uid()
    )
    RETURNING id INTO new_report_id;

    RETURN new_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get reconciliation discrepancies for a report
CREATE OR REPLACE FUNCTION public.get_reconciliation_discrepancies(
    report_id_param UUID
)
RETURNS TABLE (
    id UUID,
    discrepancy_type TEXT,
    platform_transaction_id UUID,
    aggregator_transaction_id TEXT,
    platform_amount DECIMAL(12,2),
    aggregator_amount DECIMAL(12,2),
    amount_difference DECIMAL(12,2),
    platform_status TEXT,
    aggregator_status TEXT,
    resolution_status TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.discrepancy_type,
        d.platform_transaction_id,
        d.aggregator_transaction_id,
        d.platform_amount,
        d.aggregator_amount,
        d.amount_difference,
        d.platform_status,
        d.aggregator_status,
        d.resolution_status,
        d.resolution_notes,
        d.created_at
    FROM public.reconciliation_discrepancies d
    WHERE d.report_id = report_id_param
    ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant execute permissions to authenticated users (RLS will restrict to admins)
GRANT EXECUTE ON FUNCTION public.get_payment_flow_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_transaction_details_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_financial_summary(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_refund_requests_pending() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_refund_request(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_reconciliation_report(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reconciliation_discrepancies(UUID) TO authenticated;


-- =====================================================
-- SEED DATA
-- =====================================================
-- Insert default payment aggregator configurations
INSERT INTO public.payment_aggregator_configs (aggregator_name, display_name, is_active, default_commission_percentage, default_aggregator_fee_percentage, default_mobile_money_fee_percentage)
VALUES 
    ('orange_money', 'Orange Money', true, 5.0, 1.5, 1.0),
    ('mtn_momo', 'MTN Mobile Money', true, 5.0, 1.5, 1.0)
ON CONFLICT (aggregator_name) DO NOTHING;


-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.payment_aggregator_configs IS 'Payment aggregator connection details and fee configurations for admin management';
COMMENT ON TABLE public.reconciliation_reports IS 'Track reconciliation activities between platform and payment aggregators';
COMMENT ON TABLE public.reconciliation_discrepancies IS 'Log mismatches found during payment reconciliation';

COMMENT ON FUNCTION public.get_payment_flow_stats IS 'Get real-time payment monitoring statistics for admin dashboard';
COMMENT ON FUNCTION public.get_transaction_details_admin IS 'Get comprehensive transaction details for admin review';
COMMENT ON FUNCTION public.get_platform_financial_summary IS 'Get platform revenue and fee analytics for financial reporting';
COMMENT ON FUNCTION public.get_refund_requests_pending IS 'Get all pending refund requests for admin review';
COMMENT ON FUNCTION public.process_refund_request IS 'Approve or reject a refund request';
COMMENT ON FUNCTION public.create_reconciliation_report IS 'Create a new reconciliation report';
COMMENT ON FUNCTION public.get_reconciliation_discrepancies IS 'Get all discrepancies for a reconciliation report';
