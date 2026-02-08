-- Migration: Ad Reporting & Compliance System
-- Description: Adds reporting mechanism for advertisements to ensure platform quality.

-- Create Ad Reports table
CREATE TABLE IF NOT EXISTS ad_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
    reporting_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'ignored')),
    resolution TEXT,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ad_reports_ad_id ON ad_reports(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_reports_status ON ad_reports(status);

-- Enable RLS
ALTER TABLE ad_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create reports"
    ON ad_reports FOR INSERT
    WITH CHECK (auth.uid() = reporting_user_id);

CREATE POLICY "Users can view their own reports"
    ON ad_reports FOR SELECT
    USING (auth.uid() = reporting_user_id);

CREATE POLICY "Admins can view and manage all reports"
    ON ad_reports FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role_type = 'admin'
        )
    );

-- RPC to report an advertisement
CREATE OR REPLACE FUNCTION report_advertisement(
    ad_id_param UUID,
    reason_param TEXT,
    details_param TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    INSERT INTO ad_reports (ad_id, reporting_user_id, reason, details)
    VALUES (ad_id_param, v_user_id, reason_param, details_param);

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to get reports queue for admin
CREATE OR REPLACE FUNCTION get_ad_reports_queue()
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role_type = 'admin'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    SELECT jsonb_agg(r) INTO v_result
    FROM (
        SELECT 
            rep.*,
            ad.ad_title,
            ad.advertiser_user_id,
            p.first_name || ' ' || p.last_name as reporter_name
        FROM ad_reports rep
        JOIN advertisements ad ON rep.ad_id = ad.id
        JOIN profiles p ON rep.reporting_user_id = p.id
        WHERE rep.status = 'pending'
        ORDER BY rep.created_at DESC
    ) r;

    RETURN jsonb_build_object('success', true, 'data', COALESCE(v_result, '[]'::jsonb));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
