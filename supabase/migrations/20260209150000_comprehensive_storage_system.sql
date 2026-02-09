-- Migration: Comprehensive File Storage & Document Management System
-- Prompt 55: File Storage & Document Management
-- Date: 2026-02-09

-- ============================================================================
-- PART 1: STORAGE BUCKETS
-- ============================================================================

-- 1. Create user-documents bucket (KYC, licenses, certificates)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Create shipment-documents bucket (BOL, POD, gate passes)
INSERT INTO storage.buckets (id, name, public)
VALUES ('shipment-documents', 'shipment-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Create payment-invoices bucket (PDF invoices, receipts)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-invoices', 'payment-invoices', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Create profile-images bucket (avatars, company logos) - public for easy access
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Create avatars bucket if not exists (for backward compatibility)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Create verification-docs bucket if not exists (for backward compatibility)
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 2: METADATA TRACKING TABLES
-- ============================================================================

-- Document metadata table
CREATE TABLE IF NOT EXISTS public.document_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_size BIGINT NOT NULL, -- in bytes
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    related_entity_type TEXT, -- 'user', 'shipment', 'transaction', 'vehicle', etc.
    related_entity_id UUID,
    tags TEXT[], -- for searchability
    category TEXT, -- 'kyc', 'license', 'bol', 'pod', 'invoice', 'avatar', etc.
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bucket_id, file_path)
);

-- Document version history table
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.document_metadata(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    change_notes TEXT,
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, version_number)
);

-- Storage quotas table
CREATE TABLE IF NOT EXISTS public.storage_quotas (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_type TEXT, -- 'shipper', 'transporter', 'driver', 'broker', 'admin'
    total_quota_bytes BIGINT DEFAULT 104857600, -- 100MB default
    used_storage_bytes BIGINT DEFAULT 0,
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 3: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_document_metadata_uploaded_by ON public.document_metadata(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_document_metadata_bucket_id ON public.document_metadata(bucket_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_related_entity ON public.document_metadata(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_category ON public.document_metadata(category);
CREATE INDEX IF NOT EXISTS idx_document_metadata_is_deleted ON public.document_metadata(is_deleted);
CREATE INDEX IF NOT EXISTS idx_document_metadata_tags ON public.document_metadata USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_storage_quotas_user_id ON public.storage_quotas(user_id);

-- ============================================================================
-- PART 4: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.document_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_quotas ENABLE ROW LEVEL SECURITY;

-- Policies for document_metadata
DO $$ BEGIN
    -- Users can view their own documents
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_metadata' AND policyname = 'Users can view their own documents') THEN
        CREATE POLICY "Users can view their own documents" ON public.document_metadata 
        FOR SELECT USING (auth.uid() = uploaded_by OR is_deleted = false);
    END IF;

    -- Users can insert their own documents
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_metadata' AND policyname = 'Users can insert their own documents') THEN
        CREATE POLICY "Users can insert their own documents" ON public.document_metadata 
        FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
    END IF;

    -- Users can update their own documents
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_metadata' AND policyname = 'Users can update their own documents') THEN
        CREATE POLICY "Users can update their own documents" ON public.document_metadata 
        FOR UPDATE USING (auth.uid() = uploaded_by);
    END IF;

    -- Users can soft delete their own documents
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_metadata' AND policyname = 'Users can delete their own documents') THEN
        CREATE POLICY "Users can delete their own documents" ON public.document_metadata 
        FOR DELETE USING (auth.uid() = uploaded_by);
    END IF;

    -- Admins can view all documents
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_metadata' AND policyname = 'Admins can view all documents') THEN
        CREATE POLICY "Admins can view all documents" ON public.document_metadata 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() AND role_type = 'admin'
            )
        );
    END IF;
END $$;

-- Policies for document_versions
DO $$ BEGIN
    -- Users can view versions of their own documents
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_versions' AND policyname = 'Users can view their document versions') THEN
        CREATE POLICY "Users can view their document versions" ON public.document_versions 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.document_metadata 
                WHERE id = document_id AND uploaded_by = auth.uid()
            )
        );
    END IF;

    -- System can insert versions (via triggers/functions)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_versions' AND policyname = 'Authenticated users can insert versions') THEN
        CREATE POLICY "Authenticated users can insert versions" ON public.document_versions 
        FOR INSERT WITH CHECK (auth.uid() = changed_by);
    END IF;

    -- Admins can view all versions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_versions' AND policyname = 'Admins can view all versions') THEN
        CREATE POLICY "Admins can view all versions" ON public.document_versions 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() AND role_type = 'admin'
            )
        );
    END IF;
END $$;

-- Policies for storage_quotas
DO $$ BEGIN
    -- Users can view their own quota
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'storage_quotas' AND policyname = 'Users can view their own quota') THEN
        CREATE POLICY "Users can view their own quota" ON public.storage_quotas 
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Admins can view all quotas
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'storage_quotas' AND policyname = 'Admins can view all quotas') THEN
        CREATE POLICY "Admins can view all quotas" ON public.storage_quotas 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() AND role_type = 'admin'
            )
        );
    END IF;

    -- Admins can manage quotas
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'storage_quotas' AND policyname = 'Admins can manage quotas') THEN
        CREATE POLICY "Admins can manage quotas" ON public.storage_quotas 
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() AND role_type = 'admin'
            )
        );
    END IF;
END $$;

-- ============================================================================
-- PART 5: STORAGE BUCKET RLS POLICIES
-- ============================================================================

-- Policies for user-documents bucket
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own user documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can upload their own user documents" ON storage.objects 
        FOR INSERT TO authenticated 
        WITH CHECK (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own user documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can view their own user documents" ON storage.objects 
        FOR SELECT TO authenticated 
        USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own user documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can update their own user documents" ON storage.objects 
        FOR UPDATE TO authenticated 
        USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own user documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can delete their own user documents" ON storage.objects 
        FOR DELETE TO authenticated 
        USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all user documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Admins can manage all user documents" ON storage.objects 
        FOR ALL TO authenticated 
        USING (
            bucket_id = 'user-documents' AND 
            EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_type = 'admin')
        );
    END IF;
END $$;

-- Policies for shipment-documents bucket
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload shipment documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated users can upload shipment documents" ON storage.objects 
        FOR INSERT TO authenticated 
        WITH CHECK (bucket_id = 'shipment-documents');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view shipment documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated users can view shipment documents" ON storage.objects 
        FOR SELECT TO authenticated 
        USING (bucket_id = 'shipment-documents');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update shipment documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated users can update shipment documents" ON storage.objects 
        FOR UPDATE TO authenticated 
        USING (bucket_id = 'shipment-documents');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete shipment documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated users can delete shipment documents" ON storage.objects 
        FOR DELETE TO authenticated 
        USING (bucket_id = 'shipment-documents');
    END IF;
END $$;

-- Policies for payment-invoices bucket
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own invoices' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can view their own invoices" ON storage.objects 
        FOR SELECT TO authenticated 
        USING (bucket_id = 'payment-invoices' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can upload invoices' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "System can upload invoices" ON storage.objects 
        FOR INSERT TO authenticated 
        WITH CHECK (bucket_id = 'payment-invoices');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all invoices' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Admins can manage all invoices" ON storage.objects 
        FOR ALL TO authenticated 
        USING (
            bucket_id = 'payment-invoices' AND 
            EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_type = 'admin')
        );
    END IF;
END $$;

-- Policies for profile-images bucket (public read)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view profile images' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Anyone can view profile images" ON storage.objects 
        FOR SELECT USING (bucket_id = 'profile-images');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own profile images' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can upload their own profile images" ON storage.objects 
        FOR INSERT TO authenticated 
        WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile images' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can update their own profile images" ON storage.objects 
        FOR UPDATE TO authenticated 
        USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own profile images' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can delete their own profile images" ON storage.objects 
        FOR DELETE TO authenticated 
        USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
END $$;

-- ============================================================================
-- PART 6: DATABASE FUNCTIONS
-- ============================================================================

-- Function to calculate user's total storage usage
CREATE OR REPLACE FUNCTION public.calculate_user_storage_usage(p_user_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_bytes BIGINT;
BEGIN
    SELECT COALESCE(SUM(file_size), 0)
    INTO v_total_bytes
    FROM public.document_metadata
    WHERE uploaded_by = p_user_id AND is_deleted = false;
    
    RETURN v_total_bytes;
END;
$$;

-- Function to check if user has enough quota for upload
CREATE OR REPLACE FUNCTION public.check_storage_quota(p_user_id UUID, p_file_size BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_quota RECORD;
    v_used_bytes BIGINT;
BEGIN
    -- Get user's quota
    SELECT * INTO v_quota
    FROM public.storage_quotas
    WHERE user_id = p_user_id;
    
    -- If no quota record exists, create one with default
    IF NOT FOUND THEN
        INSERT INTO public.storage_quotas (user_id, total_quota_bytes, used_storage_bytes)
        VALUES (p_user_id, 104857600, 0) -- 100MB default
        RETURNING * INTO v_quota;
    END IF;
    
    -- Calculate current usage
    v_used_bytes := public.calculate_user_storage_usage(p_user_id);
    
    -- Update quota record
    UPDATE public.storage_quotas
    SET used_storage_bytes = v_used_bytes,
        last_calculated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Check if upload would exceed quota
    RETURN (v_used_bytes + p_file_size) <= v_quota.total_quota_bytes;
END;
$$;

-- Function to create document version when updating
CREATE OR REPLACE FUNCTION public.create_document_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_version_number INTEGER;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM public.document_versions
    WHERE document_id = OLD.id;
    
    -- Create version record of old file
    INSERT INTO public.document_versions (
        document_id,
        version_number,
        file_path,
        file_size,
        mime_type,
        change_notes,
        changed_by
    ) VALUES (
        OLD.id,
        v_version_number,
        OLD.file_path,
        OLD.file_size,
        OLD.mime_type,
        'Automatic version created on update',
        auth.uid()
    );
    
    RETURN NEW;
END;
$$;

-- Function to find orphaned files (files in storage but not in metadata)
CREATE OR REPLACE FUNCTION public.get_orphaned_files(p_bucket_id TEXT)
RETURNS TABLE (
    bucket_id TEXT,
    file_path TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.bucket_id,
        o.name as file_path,
        o.metadata->>'size' as file_size,
        o.created_at
    FROM storage.objects o
    WHERE o.bucket_id = p_bucket_id
    AND NOT EXISTS (
        SELECT 1 FROM public.document_metadata dm
        WHERE dm.bucket_id = o.bucket_id 
        AND dm.file_path = o.name
    );
END;
$$;

-- ============================================================================
-- PART 7: TRIGGERS
-- ============================================================================

-- Trigger to create version when document is updated
DROP TRIGGER IF EXISTS create_version_on_update ON public.document_metadata;
CREATE TRIGGER create_version_on_update
    BEFORE UPDATE ON public.document_metadata
    FOR EACH ROW
    WHEN (OLD.file_path IS DISTINCT FROM NEW.file_path)
    EXECUTE FUNCTION public.create_document_version();

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_document_metadata_updated_at 
    BEFORE UPDATE ON public.document_metadata 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_storage_quotas_updated_at 
    BEFORE UPDATE ON public.storage_quotas 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- PART 8: INITIAL DATA
-- ============================================================================

-- Create default quotas for existing users (optional)
-- This can be run separately if needed
-- INSERT INTO public.storage_quotas (user_id, role_type, total_quota_bytes)
-- SELECT 
--     u.id,
--     ur.role_type,
--     CASE 
--         WHEN ur.role_type = 'admin' THEN 1073741824 -- 1GB for admins
--         WHEN ur.role_type = 'transporter' THEN 524288000 -- 500MB for transporters
--         WHEN ur.role_type = 'broker' THEN 314572800 -- 300MB for brokers
--         ELSE 104857600 -- 100MB for others
--     END as total_quota_bytes
-- FROM auth.users u
-- JOIN public.user_roles ur ON ur.user_id = u.id
-- WHERE NOT EXISTS (
--     SELECT 1 FROM public.storage_quotas sq WHERE sq.user_id = u.id
-- )
-- ON CONFLICT (user_id) DO NOTHING;
