import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  Save, 
  Mail, 
  MessageSquare, 
  Bell, 
  Volume2, 
  Globe, 
  Smartphone,
  FileText,
  DollarSign,
  Calendar,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

interface NotificationsTabProps {
  profile: {
    id: string;
    phone?: string;
    [key: string]: unknown;
  };
}

interface NotificationPreferences {
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

const NotificationsTab = ({ profile }: NotificationsTabProps) => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [browserNotificationStatus, setBrowserNotificationStatus] = useState<NotificationPermission | 'unsupported'>('default');

  // Check browser notification support
  useEffect(() => {
    if (!('Notification' in window)) {
      setBrowserNotificationStatus('unsupported');
    } else {
      setBrowserNotificationStatus(Notification.permission);
    }
  }, []);

  // Load preferences from database
  const loadPreferences = useCallback(async () => {
    if (!profile?.id) return;

    const loadFromStorage = () => {
      const storageKey = `notification_preferences_${profile.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const merged = { ...DEFAULT_PREFERENCES, ...parsed };
          setPreferences(merged);
          setOriginalPreferences(merged);
        } catch (error) {
          console.error('Error parsing stored preferences:', error);
        }
      }
    };

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, create default ones
          const { data: newData, error: insertError } = await supabase
            .from('notification_preferences')
            .insert({ profile_id: profile.id })
            .select()
            .single();

          if (!insertError && newData) {
            const prefs = mapDbToPreferences(newData);
            setPreferences(prefs);
            setOriginalPreferences(prefs);
          }
        } else {
          console.error('Error loading notification preferences:', error);
          // Fall back to localStorage
          loadFromStorage();
        }
      } else if (data) {
        const prefs = mapDbToPreferences(data);
        setPreferences(prefs);
        setOriginalPreferences(prefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      loadFromStorage();
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  const mapDbToPreferences = (data: Record<string, unknown>): NotificationPreferences => ({
    email_notifications: data.email_notifications as boolean ?? DEFAULT_PREFERENCES.email_notifications,
    sms_notifications: data.sms_notifications as boolean ?? DEFAULT_PREFERENCES.sms_notifications,
    marketing_emails: data.marketing_emails as boolean ?? DEFAULT_PREFERENCES.marketing_emails,
    application_updates: data.application_updates as boolean ?? DEFAULT_PREFERENCES.application_updates,
    document_reminders: data.document_reminders as boolean ?? DEFAULT_PREFERENCES.document_reminders,
    push_notifications: data.push_notifications as boolean ?? DEFAULT_PREFERENCES.push_notifications,
    in_app_notifications: data.in_app_notifications as boolean ?? DEFAULT_PREFERENCES.in_app_notifications,
    sound_enabled: data.sound_enabled as boolean ?? DEFAULT_PREFERENCES.sound_enabled,
    browser_notifications: data.browser_notifications as boolean ?? DEFAULT_PREFERENCES.browser_notifications,
    message_notifications: data.message_notifications as boolean ?? DEFAULT_PREFERENCES.message_notifications,
    commission_notifications: data.commission_notifications as boolean ?? DEFAULT_PREFERENCES.commission_notifications,
    deadline_reminders: data.deadline_reminders as boolean ?? DEFAULT_PREFERENCES.deadline_reminders,
  });

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
    setHasChanges(changed);
  }, [preferences, originalPreferences]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Browser notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserNotificationStatus(permission);
      
      if (permission === 'granted') {
        setPreferences((prev) => ({ ...prev, browser_notifications: true }));
        new Notification('Notifications Enabled', {
          body: 'You will now receive browser notifications.',
          icon: '/favicon.ico',
        });
        toast({
          title: 'Success',
          description: 'Browser notifications enabled.',
        });
      } else if (permission === 'denied') {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to request notification permission.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          profile_id: profile.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id',
        });

      if (error) {
        console.error('Error saving to database:', error);
        // Fall back to localStorage
        const storageKey = `notification_preferences_${profile.id}`;
        localStorage.setItem(storageKey, JSON.stringify(preferences));
      }

      setOriginalPreferences(preferences);
      toast({
        title: 'Success',
        description: 'Notification preferences saved successfully.',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Fall back to localStorage
      const storageKey = `notification_preferences_${profile.id}`;
      localStorage.setItem(storageKey, JSON.stringify(preferences));
      
      toast({
        title: 'Success',
        description: 'Notification preferences saved.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences(originalPreferences);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading preferences...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* In-App Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>In-App Notifications</CardTitle>
            </div>
            <CardDescription>
              Control how you receive notifications within the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="in_app_notifications">Enable In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications in the notification center
                </p>
              </div>
              <Switch
                id="in_app_notifications"
                checked={preferences.in_app_notifications}
                onCheckedChange={() => handleToggle('in_app_notifications')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-start gap-3">
                <Volume2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <Label htmlFor="sound_enabled">Sound Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Play a sound when new notifications arrive
                  </p>
                </div>
              </div>
              <Switch
                id="sound_enabled"
                checked={preferences.sound_enabled}
                onCheckedChange={() => handleToggle('sound_enabled')}
                disabled={!preferences.in_app_notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-start gap-3">
                <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <Label htmlFor="browser_notifications">Browser Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show desktop notifications in your browser
                  </p>
                  {browserNotificationStatus === 'denied' && (
                    <Badge variant="destructive" className="mt-1">Permission denied</Badge>
                  )}
                  {browserNotificationStatus === 'unsupported' && (
                    <Badge variant="secondary" className="mt-1">Not supported</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {browserNotificationStatus === 'default' && preferences.browser_notifications && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={requestBrowserPermission}
                  >
                    Enable
                  </Button>
                )}
                <Switch
                  id="browser_notifications"
                  checked={preferences.browser_notifications}
                  onCheckedChange={() => {
                    if (!preferences.browser_notifications && browserNotificationStatus !== 'granted') {
                      requestBrowserPermission();
                    } else {
                      handleToggle('browser_notifications');
                    }
                  }}
                  disabled={!preferences.in_app_notifications || browserNotificationStatus === 'unsupported'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              Choose which types of notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-start gap-3">
                <FileText className="h-4 w-4 mt-0.5 text-blue-500" />
                <div>
                  <Label htmlFor="application_updates">Application Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your application status changes
                  </p>
                </div>
              </div>
              <Switch
                id="application_updates"
                checked={preferences.application_updates}
                onCheckedChange={() => handleToggle('application_updates')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-start gap-3">
                <MessageSquare className="h-4 w-4 mt-0.5 text-purple-500" />
                <div>
                  <Label htmlFor="message_notifications">Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for new messages
                  </p>
                </div>
              </div>
              <Switch
                id="message_notifications"
                checked={preferences.message_notifications}
                onCheckedChange={() => handleToggle('message_notifications')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-start gap-3">
                <DollarSign className="h-4 w-4 mt-0.5 text-green-500" />
                <div>
                  <Label htmlFor="commission_notifications">Commissions</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about commission updates
                  </p>
                </div>
              </div>
              <Switch
                id="commission_notifications"
                checked={preferences.commission_notifications}
                onCheckedChange={() => handleToggle('commission_notifications')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-orange-500" />
                <div>
                  <Label htmlFor="deadline_reminders">Deadline Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders about approaching deadlines
                  </p>
                </div>
              </div>
              <Switch
                id="deadline_reminders"
                checked={preferences.deadline_reminders}
                onCheckedChange={() => handleToggle('deadline_reminders')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-start gap-3">
                <FileText className="h-4 w-4 mt-0.5 text-amber-500" />
                <div>
                  <Label htmlFor="document_reminders">Document Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders about pending document uploads
                  </p>
                </div>
              </div>
              <Switch
                id="document_reminders"
                checked={preferences.document_reminders}
                onCheckedChange={() => handleToggle('document_reminders')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Email Notifications</CardTitle>
            </div>
            <CardDescription>
              Manage email notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_notifications">Enable Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email_notifications"
                checked={preferences.email_notifications}
                onCheckedChange={() => handleToggle('email_notifications')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing_emails">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new features and promotions
                </p>
              </div>
              <Switch
                id="marketing_emails"
                checked={preferences.marketing_emails}
                onCheckedChange={() => handleToggle('marketing_emails')}
                disabled={!preferences.email_notifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <CardTitle>SMS Notifications</CardTitle>
            </div>
            <CardDescription>
              Manage SMS notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms_notifications">Enable SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive important updates via SMS
                </p>
              </div>
              <Switch
                id="sms_notifications"
                checked={preferences.sms_notifications}
                onCheckedChange={() => handleToggle('sms_notifications')}
              />
            </div>

            {!profile.phone && preferences.sms_notifications && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Please add your phone number in the Profile tab to receive SMS notifications.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {hasChanges ? (
              <>
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                Unsaved changes
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                All changes saved
              </>
            )}
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button type="button" variant="outline" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
            <Button type="submit" disabled={isSaving || !hasChanges}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default NotificationsTab;
