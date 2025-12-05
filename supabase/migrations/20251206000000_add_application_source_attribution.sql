-- ============================================================================
-- Add UniDoxia Application Source Attribution
-- ============================================================================
-- This migration adds an application_source field to track that applications
-- were submitted through the UniDoxia platform.
-- ============================================================================

-- Add application_source column to applications table
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS application_source TEXT DEFAULT 'UniDoxia';

-- Set application_source for all existing applications
UPDATE public.applications 
SET application_source = 'UniDoxia' 
WHERE application_source IS NULL;

-- Add an index for efficient filtering by source
CREATE INDEX IF NOT EXISTS idx_applications_source 
  ON public.applications(application_source) 
  WHERE application_source IS NOT NULL;

-- Add a comment explaining the field
COMMENT ON COLUMN public.applications.application_source IS 
  'Identifies the platform source of the application. Default is UniDoxia for applications submitted through this system.';
