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
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const storageKey = `notification_preferences_${profile.id}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
      } catch (error) {
        console.error('Error parsing stored preferences:', error);
      }
    }
  }, [profile.id]);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Save to localStorage
    const storageKey = `notification_preferences_${profile.id}`;
    localStorage.setItem(storageKey, JSON.stringify(preferences));
    
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Success',
        description: 'Notification preferences saved',
      });
    }, 500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how you receive notifications and updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Email Notifications</h3>
            </div>

            <div className="space-y-4 pl-7">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email_notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive general email notifications
                  </p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={preferences.email_notifications}
                  onCheckedChange={() => handleToggle('email_notifications')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="application_updates">Application Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about application status changes
                  </p>
                </div>
                <Switch
                  id="application_updates"
                  checked={preferences.application_updates}
                  onCheckedChange={() => handleToggle('application_updates')}
                  disabled={!preferences.email_notifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="document_reminders">Document Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders about pending documents
                  </p>
                </div>
                <Switch
                  id="document_reminders"
                  checked={preferences.document_reminders}
                  onCheckedChange={() => handleToggle('document_reminders')}
                  disabled={!preferences.email_notifications}
                />
              </div>

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
            </div>
          </div>

          {/* SMS Notifications Section */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">SMS Notifications</h3>
            </div>

            <div className="space-y-4 pl-7">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sms_notifications">SMS Notifications</Label>
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
                    Please add your phone number in the Profile tab to receive SMS
                    notifications.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaving}>
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
        </form>
      </CardContent>
    </Card>
  );
};

export default NotificationsTab;
