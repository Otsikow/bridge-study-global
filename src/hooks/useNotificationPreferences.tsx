import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
  application_updates: boolean;
  document_reminders: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  sound_enabled: boolean;
  browser_notifications: boolean;
  message_notifications: boolean;
  commission_notifications: boolean;
  deadline_reminders: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_notifications: true,
  sms_notifications: false,
  marketing_emails: true,
  application_updates: true,
  document_reminders: true,
  push_notifications: true,
  in_app_notifications: true,
  sound_enabled: true,
  browser_notifications: false,
  message_notifications: true,
  commission_notifications: true,
  deadline_reminders: true,
};

const STORAGE_KEY = 'notification_preferences';

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    if (!user?.id) {
      // Load from localStorage as fallback
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
        }
      } catch {
        // Ignore
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (error) {
        // Fall back to localStorage
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
          }
        } catch {
          // Ignore
        }
      } else if (data) {
        const prefs: NotificationPreferences = {
          email_notifications: data.email_notifications ?? DEFAULT_PREFERENCES.email_notifications,
          sms_notifications: data.sms_notifications ?? DEFAULT_PREFERENCES.sms_notifications,
          marketing_emails: data.marketing_emails ?? DEFAULT_PREFERENCES.marketing_emails,
          application_updates: data.application_updates ?? DEFAULT_PREFERENCES.application_updates,
          document_reminders: data.document_reminders ?? DEFAULT_PREFERENCES.document_reminders,
          push_notifications: data.push_notifications ?? DEFAULT_PREFERENCES.push_notifications,
          in_app_notifications: data.in_app_notifications ?? DEFAULT_PREFERENCES.in_app_notifications,
          sound_enabled: data.sound_enabled ?? DEFAULT_PREFERENCES.sound_enabled,
          browser_notifications: data.browser_notifications ?? DEFAULT_PREFERENCES.browser_notifications,
          message_notifications: data.message_notifications ?? DEFAULT_PREFERENCES.message_notifications,
          commission_notifications: data.commission_notifications ?? DEFAULT_PREFERENCES.commission_notifications,
          deadline_reminders: data.deadline_reminders ?? DEFAULT_PREFERENCES.deadline_reminders,
        };
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreference = useCallback(async <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // Save to localStorage as backup
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch {
      // Ignore
    }

    // Save to database if authenticated
    if (user?.id) {
      try {
        await supabase
          .from('notification_preferences')
          .upsert({
            profile_id: user.id,
            [key]: value,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'profile_id',
          });
      } catch (error) {
        console.error('Error saving notification preference:', error);
      }
    }
  }, [preferences, user?.id]);

  const shouldNotify = useCallback((type: 'application_status' | 'message' | 'commission' | 'course_recommendation' | 'deadline' | 'document'): boolean => {
    if (!preferences.in_app_notifications) return false;

    switch (type) {
      case 'application_status':
        return preferences.application_updates;
      case 'message':
        return preferences.message_notifications;
      case 'commission':
        return preferences.commission_notifications;
      case 'deadline':
        return preferences.deadline_reminders;
      case 'document':
        return preferences.document_reminders;
      case 'course_recommendation':
        return true; // Always show course recommendations if in-app is enabled
      default:
        return true;
    }
  }, [preferences]);

  return {
    preferences,
    loading,
    updatePreference,
    shouldNotify,
    refetch: loadPreferences,
  };
}
