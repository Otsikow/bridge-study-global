-- Migration: Enhance notification preferences
-- Description: Add additional columns for in-app notification settings

-- Add new columns to notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS in_app_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS browser_notifications BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS message_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS commission_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS deadline_reminders BOOLEAN DEFAULT TRUE;

-- Add comment to document the columns
COMMENT ON COLUMN public.notification_preferences.push_notifications IS 'Enable push notifications';
COMMENT ON COLUMN public.notification_preferences.in_app_notifications IS 'Enable in-app notifications';
COMMENT ON COLUMN public.notification_preferences.sound_enabled IS 'Play sound for new notifications';
COMMENT ON COLUMN public.notification_preferences.browser_notifications IS 'Enable browser/desktop notifications';
COMMENT ON COLUMN public.notification_preferences.message_notifications IS 'Notify on new messages';
COMMENT ON COLUMN public.notification_preferences.commission_notifications IS 'Notify on commission updates';
COMMENT ON COLUMN public.notification_preferences.deadline_reminders IS 'Notify on approaching deadlines';

-- Function to ensure notification preferences exist for a user
CREATE OR REPLACE FUNCTION public.ensure_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notification_preferences (profile_id)
  VALUES (NEW.id)
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create notification preferences when profile is created
DROP TRIGGER IF EXISTS create_notification_preferences ON public.profiles;
CREATE TRIGGER create_notification_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_notification_preferences();

-- Insert notification preferences for existing profiles that don't have them
INSERT INTO public.notification_preferences (profile_id)
SELECT id FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_preferences np 
  WHERE np.profile_id = p.id
)
ON CONFLICT (profile_id) DO NOTHING;
