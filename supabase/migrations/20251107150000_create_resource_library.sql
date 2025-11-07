-- Create enums for resource library if they do not already exist
DO $$
BEGIN
  CREATE TYPE public.resource_access_level AS ENUM ('public', 'agents', 'universities', 'staff');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.resource_content_type AS ENUM ('student_guide', 'agent_training', 'university_info');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.resource_file_type AS ENUM ('pdf', 'doc', 'video', 'image', 'spreadsheet', 'presentation', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create resource library table
CREATE TABLE IF NOT EXISTS public.resource_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_type public.resource_file_type NOT NULL DEFAULT 'pdf',
  access_level public.resource_access_level NOT NULL DEFAULT 'public',
  resource_type public.resource_content_type NOT NULL DEFAULT 'student_guide',
  storage_path TEXT NOT NULL,
  file_name TEXT,
  file_extension TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_library_access_level
  ON public.resource_library(access_level);

CREATE INDEX IF NOT EXISTS idx_resource_library_resource_type
  ON public.resource_library(resource_type);

CREATE INDEX IF NOT EXISTS idx_resource_library_created_at
  ON public.resource_library(created_at DESC);

-- Enable row level security and policies
ALTER TABLE public.resource_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can view public resources"
  ON public.resource_library
  FOR SELECT
  USING (access_level = 'public');

CREATE POLICY IF NOT EXISTS "Role based access to resource library"
  ON public.resource_library
  FOR SELECT
  TO authenticated
  USING (
    access_level = 'public'
    OR (
      access_level = 'agents'
      AND (public.has_role(auth.uid(), 'agent'::app_role) OR public.is_admin_or_staff(auth.uid()))
    )
    OR (
      access_level = 'universities'
      AND (public.has_role(auth.uid(), 'partner'::app_role) OR public.is_admin_or_staff(auth.uid()))
    )
    OR (
      access_level = 'staff'
      AND public.is_admin_or_staff(auth.uid())
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can manage resource library"
  ON public.resource_library
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_staff(auth.uid()))
  WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE TRIGGER update_resource_library_updated_at
  BEFORE UPDATE ON public.resource_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure storage bucket exists for resources
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resources',
  'resources',
  TRUE,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
    'video/quicktime',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for resources bucket
CREATE POLICY IF NOT EXISTS "Anyone can view resource files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'resources');

CREATE POLICY IF NOT EXISTS "Admins can upload resource files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resources'
    AND public.is_admin_or_staff(auth.uid())
  );

CREATE POLICY IF NOT EXISTS "Admins can delete resource files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resources'
    AND public.is_admin_or_staff(auth.uid())
  );
