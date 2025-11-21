import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Mail, MessageSquare } from 'lucide-react';

interface NotificationsTabProps {
  profile: any;
}

const STORAGE_KEY = 'notification_preferences';

const DEFAULT_PREFERENCES = {
  email_notifications: true,
  sms_notifications: false,
  marketing_emails: true,
  application_updates: true,
  document_reminders: true,
};

const NotificationsTab = ({ profile }: NotificationsTabProps) => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const stored = localStorage.getItem(`${STORAGE_KEY}_${profile.id}`);
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored preferences:', e);
      }
    }
  }, [profile.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(`${STORAGE_KEY}_${profile.id}`, JSON.stringify(preferences));
      
      toast({
        title: 'Preferences saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification preferences.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Manage how you receive email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive important updates via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.email_notifications}
              onCheckedChange={() => handlePreferenceChange('email_notifications')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="application-updates">Application updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about your application status changes
              </p>
            </div>
            <Switch
              id="application-updates"
              checked={preferences.application_updates}
              onCheckedChange={() => handlePreferenceChange('application_updates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="document-reminders">Document reminders</Label>
              <p className="text-sm text-muted-foreground">
                Reminders for pending document submissions
              </p>
            </div>
            <Switch
              id="document-reminders"
              checked={preferences.document_reminders}
              onCheckedChange={() => handlePreferenceChange('document_reminders')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-emails">Marketing emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about new features and offers
              </p>
            </div>
            <Switch
              id="marketing-emails"
              checked={preferences.marketing_emails}
              onCheckedChange={() => handlePreferenceChange('marketing_emails')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Notifications
          </CardTitle>
          <CardDescription>
            Manage SMS notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-notifications">SMS notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive urgent notifications via SMS
              </p>
            </div>
            <Switch
              id="sms-notifications"
              checked={preferences.sms_notifications}
              onCheckedChange={() => handlePreferenceChange('sms_notifications')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default NotificationsTab;
