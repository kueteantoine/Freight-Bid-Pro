-- Create translations table
CREATE TABLE IF NOT EXISTS public.translations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL,
  namespace text NOT NULL DEFAULT 'common',
  en_value text NOT NULL,
  fr_value text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique keys within a namespace
  CONSTRAINT unique_translation_key_namespace UNIQUE (key, namespace)
);

-- Add comments for documentation
COMMENT ON TABLE public.translations IS 'Application translations for multi-language support';
COMMENT ON COLUMN public.translations.key IS 'Translation key used in the codebase';
COMMENT ON COLUMN public.translations.namespace IS 'Feature or module grouping (e.g., common, admin, auth)';
COMMENT ON COLUMN public.translations.en_value IS 'English translation value';
COMMENT ON COLUMN public.translations.fr_value IS 'French translation value';

-- Create an updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
CREATE TRIGGER handle_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Set up Row Level Security (RLS)
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users (including anonymous)
CREATE POLICY "Translations are viewable by everyone" ON public.translations
  FOR SELECT USING (true);

-- Only allow admins or super_admins to insert/update/delete
-- Note: Assuming you have a way to identify admins (e.g., via user_roles or a specific claim)
-- This is a placeholder policy - adjust based on your actual admin auth setup
CREATE POLICY "Only admins can insert translations" ON public.translations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role_type IN ('admin', 'super_admin') AND is_active = true
    )
  );

CREATE POLICY "Only admins can update translations" ON public.translations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role_type IN ('admin', 'super_admin') AND is_active = true
    )
  );

CREATE POLICY "Only admins can delete translations" ON public.translations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role_type IN ('admin', 'super_admin') AND is_active = true
    )
  );

-- Insert some initial basic translations
INSERT INTO public.translations (key, namespace, en_value, fr_value) VALUES
  ('welcome', 'common', 'Welcome', 'Bienvenue'),
  ('login', 'auth', 'Log In', 'Connexion'),
  ('dashboard', 'common', 'Dashboard', 'Tableau de bord'),
  ('save', 'common', 'Save', 'Enregistrer'),
  ('cancel', 'common', 'Cancel', 'Annuler'),
  ('language', 'settings', 'Language', 'Langue'),
  ('english', 'settings', 'English', 'Anglais'),
  ('french', 'settings', 'French', 'Français')
ON CONFLICT (key, namespace) DO NOTHING;
