-- Migrate notifications table to match expected schema
-- First, backup existing data if any exists
CREATE TABLE IF NOT EXISTS public.notifications_backup AS 
SELECT * FROM public.notifications;

-- Drop and recreate notifications table with correct schema
DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications (mark read)"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Create index for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Update resource_library table to match expected schema
ALTER TABLE public.resource_library
ADD COLUMN IF NOT EXISTS resource_type TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_extension TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Update analytics_events to include event_name (alias for event_type)
ALTER TABLE public.analytics_events
ADD COLUMN IF NOT EXISTS event_name TEXT;

-- Create trigger to sync event_name with event_type
CREATE OR REPLACE FUNCTION sync_event_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type IS NOT NULL THEN
    NEW.event_name := NEW.event_type;
  END IF;
  IF NEW.event_name IS NOT NULL AND NEW.event_type IS NULL THEN
    NEW.event_type := NEW.event_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_analytics_event_name
BEFORE INSERT OR UPDATE ON public.analytics_events
FOR EACH ROW
EXECUTE FUNCTION sync_event_name();