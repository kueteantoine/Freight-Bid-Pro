-- Migration: Advertisement Storage Bucket
-- Date: 2026-02-08

-- 1. Create the advertisements bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('advertisements', 'advertisements', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS policies for the advertisements bucket
-- Allow public access to read advertisement images
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'advertisements');

-- Allow admins to manage advertisement images
CREATE POLICY "Admin Manage Access"
ON storage.objects FOR ALL
USING (
    bucket_id = 'advertisements' 
    AND (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role_type = 'admin'
        )
    )
)
WITH CHECK (
    bucket_id = 'advertisements' 
    AND (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role_type = 'admin'
        )
    )
);
