-- Content Management System with Version Control (Prompt 47 - Part 3)
-- This migration creates a CMS for managing legal documents, help docs, and marketing content
-- with full version control for compliance and audit trails

-- =====================================================
-- ENUMS
-- =====================================================

-- Page types
DO $$ BEGIN
    CREATE TYPE content_page_type AS ENUM (
        'legal',      -- Terms of Service, Privacy Policy, etc.
        'help',       -- Help documentation, guides
        'marketing'   -- About Us, landing pages, etc.
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Content format
DO $$ BEGIN
    CREATE TYPE content_format AS ENUM (
        'html',       -- Rich text HTML
        'markdown',   -- Markdown format
        'plain_text'  -- Plain text
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- =====================================================
-- CONTENT_PAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.content_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_slug TEXT NOT NULL, -- URL-friendly identifier (e.g., 'terms-of-service', 'privacy-policy')
    page_type content_page_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Rich text/markdown content
    content_format content_format DEFAULT 'html',
    language TEXT DEFAULT 'en',
    meta_description TEXT, -- For SEO
    meta_keywords TEXT[], -- For SEO
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_by_admin_id UUID REFERENCES auth.users(id),
    updated_by_admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(page_slug, language) -- One page per slug per language
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_pages_slug ON public.content_pages(page_slug);
CREATE INDEX IF NOT EXISTS idx_content_pages_type ON public.content_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_content_pages_language ON public.content_pages(language);
CREATE INDEX IF NOT EXISTS idx_content_pages_published ON public.content_pages(is_published);

-- Enable RLS
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;

-- Everyone can read published content
CREATE POLICY "Anyone can read published content pages"
    ON public.content_pages FOR SELECT
    USING (is_published = true);

-- Content admins can manage content
CREATE POLICY "Content admins can manage content pages"
    ON public.content_pages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_user_roles aur
            WHERE aur.user_id = auth.uid()
            AND aur.role_name IN ('super_admin', 'content_admin')
            AND aur.is_active = true
        )
    );


-- =====================================================
-- CONTENT_VERSIONS TABLE
-- =====================================================
-- Full version history for audit trail and rollback capability
CREATE TABLE IF NOT EXISTS public.content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content_snapshot JSONB NOT NULL, -- Full page data at this version
    change_summary TEXT, -- Description of what changed
    changed_by_admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(page_id, version_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_versions_page ON public.content_versions(page_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_content_versions_date ON public.content_versions(created_at DESC);

-- Enable RLS
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

-- Content admins can view version history
CREATE POLICY "Content admins can view content versions"
    ON public.content_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_user_roles aur
            WHERE aur.user_id = auth.uid()
            AND aur.role_name IN ('super_admin', 'content_admin')
            AND aur.is_active = true
        )
    );


-- =====================================================
-- CONTENT_CATEGORIES TABLE
-- =====================================================
-- Organize help documentation into categories
CREATE TABLE IF NOT EXISTS public.content_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_category_id UUID REFERENCES public.content_categories(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    icon TEXT, -- Icon name or URL
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_categories_slug ON public.content_categories(slug);
CREATE INDEX IF NOT EXISTS idx_content_categories_parent ON public.content_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_content_categories_order ON public.content_categories(display_order);

-- Enable RLS
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read active categories
CREATE POLICY "Anyone can read active content categories"
    ON public.content_categories FOR SELECT
    USING (is_active = true);

-- Content admins can manage categories
CREATE POLICY "Content admins can manage content categories"
    ON public.content_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_user_roles aur
            WHERE aur.user_id = auth.uid()
            AND aur.role_name IN ('super_admin', 'content_admin')
            AND aur.is_active = true
        )
    );


-- Add category reference to content_pages
ALTER TABLE public.content_pages 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.content_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_content_pages_category ON public.content_pages(category_id);


-- =====================================================
-- RPC FUNCTIONS
-- =====================================================

-- Get published content by slug and language
CREATE OR REPLACE FUNCTION public.get_published_content(
    slug_param TEXT,
    language_param TEXT DEFAULT 'en'
)
RETURNS JSONB AS $$
DECLARE
    content_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', id,
        'page_slug', page_slug,
        'page_type', page_type,
        'title', title,
        'content', content,
        'content_format', content_format,
        'language', language,
        'meta_description', meta_description,
        'meta_keywords', meta_keywords,
        'published_at', published_at,
        'updated_at', updated_at
    )
    INTO content_data
    FROM public.content_pages
    WHERE page_slug = slug_param
    AND language = language_param
    AND is_published = true;
    
    IF content_data IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Content not found'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'data', content_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create content version (called automatically on update)
CREATE OR REPLACE FUNCTION public.create_content_version(
    page_id_param UUID,
    change_summary_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    next_version INTEGER;
    page_snapshot JSONB;
BEGIN
    -- Check permission
    IF NOT public.check_admin_permission('can_edit_content') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version
    FROM public.content_versions
    WHERE page_id = page_id_param;
    
    -- Get current page data as snapshot
    SELECT to_jsonb(cp.*)
    INTO page_snapshot
    FROM public.content_pages cp
    WHERE cp.id = page_id_param;
    
    IF page_snapshot IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Page not found'
        );
    END IF;
    
    -- Insert version
    INSERT INTO public.content_versions (
        page_id,
        version_number,
        content_snapshot,
        change_summary,
        changed_by_admin_id
    ) VALUES (
        page_id_param,
        next_version,
        page_snapshot,
        change_summary_param,
        auth.uid()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'version_number', next_version
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get content history
CREATE OR REPLACE FUNCTION public.get_content_history(
    page_id_param UUID
)
RETURNS JSONB AS $$
DECLARE
    history_data JSONB;
BEGIN
    -- Check permission
    IF NOT public.check_admin_permission('can_view_content_history') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    SELECT jsonb_agg(jsonb_build_object(
        'id', cv.id,
        'version_number', cv.version_number,
        'change_summary', cv.change_summary,
        'changed_by_admin_id', cv.changed_by_admin_id,
        'created_at', cv.created_at,
        'title', cv.content_snapshot->>'title'
    ) ORDER BY cv.version_number DESC)
    INTO history_data
    FROM public.content_versions cv
    WHERE cv.page_id = page_id_param;
    
    RETURN jsonb_build_object(
        'success', true,
        'data', COALESCE(history_data, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Rollback to previous version
CREATE OR REPLACE FUNCTION public.rollback_content_version(
    page_id_param UUID,
    version_id_param UUID
)
RETURNS JSONB AS $$
DECLARE
    version_snapshot JSONB;
    rollback_summary TEXT;
BEGIN
    -- Check permission
    IF NOT public.check_admin_permission('can_rollback_content') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Get the version snapshot
    SELECT content_snapshot, version_number
    INTO version_snapshot
    FROM public.content_versions
    WHERE id = version_id_param
    AND page_id = page_id_param;
    
    IF version_snapshot IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Version not found'
        );
    END IF;
    
    -- Create a new version before rollback (for audit trail)
    PERFORM public.create_content_version(
        page_id_param,
        'Rollback to version ' || (version_snapshot->>'version_number')
    );
    
    -- Restore the content
    UPDATE public.content_pages
    SET 
        title = version_snapshot->>'title',
        content = version_snapshot->>'content',
        content_format = (version_snapshot->>'content_format')::content_format,
        meta_description = version_snapshot->>'meta_description',
        updated_by_admin_id = auth.uid(),
        updated_at = NOW()
    WHERE id = page_id_param;
    
    -- Log the action
    PERFORM public.log_admin_action(
        'rollback_content',
        'content_page',
        page_id_param,
        jsonb_build_object('version_id', version_id_param)
    );
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Publish content
CREATE OR REPLACE FUNCTION public.publish_content(
    page_id_param UUID
)
RETURNS JSONB AS $$
BEGIN
    -- Check permission
    IF NOT public.check_admin_permission('can_publish_content') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Create version before publishing
    PERFORM public.create_content_version(page_id_param, 'Published content');
    
    -- Publish the content
    UPDATE public.content_pages
    SET 
        is_published = true,
        published_at = NOW(),
        updated_by_admin_id = auth.uid()
    WHERE id = page_id_param;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Page not found'
        );
    END IF;
    
    -- Log the action
    PERFORM public.log_admin_action(
        'publish_content',
        'content_page',
        page_id_param,
        NULL
    );
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get all content pages (admin view)
CREATE OR REPLACE FUNCTION public.get_all_content_pages(
    page_type_filter content_page_type DEFAULT NULL,
    language_filter TEXT DEFAULT NULL,
    published_filter BOOLEAN DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    pages_data JSONB;
BEGIN
    -- Check permission
    IF NOT public.check_admin_permission('can_view_content') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'page_slug', page_slug,
        'page_type', page_type,
        'title', title,
        'language', language,
        'is_published', is_published,
        'published_at', published_at,
        'updated_at', updated_at,
        'created_by_admin_id', created_by_admin_id,
        'updated_by_admin_id', updated_by_admin_id
    ) ORDER BY updated_at DESC)
    INTO pages_data
    FROM public.content_pages
    WHERE (page_type_filter IS NULL OR page_type = page_type_filter)
    AND (language_filter IS NULL OR language = language_filter)
    AND (published_filter IS NULL OR is_published = published_filter);
    
    RETURN jsonb_build_object(
        'success', true,
        'data', COALESCE(pages_data, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-create version on content update
CREATE OR REPLACE FUNCTION auto_version_content()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create version if content actually changed
    IF OLD.content IS DISTINCT FROM NEW.content OR 
       OLD.title IS DISTINCT FROM NEW.title THEN
        PERFORM public.create_content_version(
            NEW.id,
            'Auto-saved version'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_version_content
    AFTER UPDATE ON public.content_pages
    FOR EACH ROW
    EXECUTE FUNCTION auto_version_content();


CREATE TRIGGER update_content_pages_updated_at
    BEFORE UPDATE ON public.content_pages
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_content_categories_updated_at
    BEFORE UPDATE ON public.content_categories
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default content categories
INSERT INTO public.content_categories (name, slug, description, display_order) VALUES
    ('Getting Started', 'getting-started', 'Introduction and basic guides', 1),
    ('Booking & Bidding', 'booking-bidding', 'How to book shipments and manage bids', 2),
    ('Payments', 'payments', 'Payment methods, refunds, and billing', 3),
    ('Tracking', 'tracking', 'Shipment tracking and GPS features', 4),
    ('Support', 'support', 'Help and customer support', 5),
    ('Account Management', 'account-management', 'Managing your account and profile', 6)
ON CONFLICT (slug) DO NOTHING;


-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_published_content(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_content_version(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_content_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_content_version(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_content(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_content_pages(content_page_type, TEXT, BOOLEAN) TO authenticated;


-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.content_pages IS 'Content management system for legal documents, help docs, and marketing pages';
COMMENT ON TABLE public.content_versions IS 'Full version history of content pages for audit trail and rollback';
COMMENT ON TABLE public.content_categories IS 'Categories for organizing help documentation';

COMMENT ON FUNCTION public.get_published_content(TEXT, TEXT) IS 'Get published content page by slug and language';
COMMENT ON FUNCTION public.create_content_version(UUID, TEXT) IS 'Create a new version snapshot of a content page';
COMMENT ON FUNCTION public.get_content_history(UUID) IS 'Get version history for a content page';
COMMENT ON FUNCTION public.rollback_content_version(UUID, UUID) IS 'Rollback content to a previous version';
COMMENT ON FUNCTION public.publish_content(UUID) IS 'Publish a content page';
