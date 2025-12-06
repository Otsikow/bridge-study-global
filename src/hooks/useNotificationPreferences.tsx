import { useState, useEffect, useCallback } from 'react';
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

  const loadPreferences = useCallback(() => {
    // Load from localStorage (database table not yet created)
    try {
      const storageKey = user?.id ? `${STORAGE_KEY}_${user.id}` : STORAGE_KEY;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
      }
    } catch {
      // Ignore parsing errors
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreference = useCallback(<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // Save to localStorage
    try {
      const storageKey = user?.id ? `${STORAGE_KEY}_${user.id}` : STORAGE_KEY;
      localStorage.setItem(storageKey, JSON.stringify(newPreferences));
    } catch {
      // Ignore storage errors
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
        return true;
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