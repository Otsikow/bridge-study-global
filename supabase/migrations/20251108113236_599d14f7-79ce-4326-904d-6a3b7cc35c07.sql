-- Fix security linter warnings (correctly handle dependencies)

-- 1. Enable RLS on notifications_backup table
ALTER TABLE IF EXISTS public.notifications_backup ENABLE ROW LEVEL SECURITY;

-- 2. Fix Function Search Path for sync_event_name (drop trigger first)
DROP TRIGGER IF EXISTS sync_analytics_event_name ON public.analytics_events;
DROP FUNCTION IF EXISTS sync_event_name() CASCADE;

CREATE OR REPLACE FUNCTION sync_event_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type IS NOT NULL THEN
    NEW.event_name := NEW.event_type;
  END IF;
  IF NEW.event_name IS NOT NULL AND NEW.event_type IS NULL THEN
    NEW.event_type := NEW.event_name;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER sync_analytics_event_name
BEFORE INSERT OR UPDATE ON public.analytics_events
FOR EACH ROW
EXECUTE FUNCTION sync_event_name();