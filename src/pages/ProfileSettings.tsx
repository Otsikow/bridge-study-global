import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { User, FileText, Bell, Lock, Settings, Award, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import ProfileInfoTab from '@/components/settings/ProfileInfoTab';
import DocumentsTab from '@/components/settings/DocumentsTab';
import NotificationsTab from '@/components/settings/NotificationsTab';
import PasswordSecurityTab from '@/components/settings/PasswordSecurityTab';
import AccountTab from '@/components/settings/AccountTab';
import { calculateProfileCompletion } from '@/lib/profileCompletion';

export default function ProfileSettings() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Fetch additional profile data based on role
  const { data: roleData, isLoading: roleDataLoading } = useQuery({
    queryKey: ['roleData', profile?.id, profile?.role],
    queryFn: async () => {
      if (!profile?.id) return null;

      if (profile.role === 'agent') {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('profile_id', profile.id)
          .single();
        
        if (error) throw error;
        return { type: 'agent', data };
      } else if (profile.role === 'student') {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('profile_id', profile.id)
          .single();
        
        if (error) throw error;
        return { type: 'student', data };
      }

      return null;
    },
    enabled: !!profile?.id,
  });

  // Fetch applications count for students
  const { data: applicationsData } = useQuery({
    queryKey: ['studentApplications', roleData?.data?.id],
    queryFn: async () => {
      if (!roleData?.data?.id || roleData.type !== 'student') return null;

      const { data, error } = await supabase
        .from('applications')
        .select('id, status')
        .eq('student_id', roleData.data.id)
        .in('status', ['submitted', 'screening', 'enrolled']);

      if (error) throw error;
      return data;
    },
    enabled: roleData?.type === 'student' && !!roleData?.data?.id,
  });

  // Fetch referral count for agents
  const { data: referralsData } = useQuery({
    queryKey: ['agentReferrals', roleData?.data?.id],
    queryFn: async () => {
      if (!roleData?.data?.id || roleData.type !== 'agent') return null;

      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('tenant_id', profile?.tenant_id);

      if (error) throw error;
      return data;
    },
    enabled: roleData?.type === 'agent' && !!roleData?.data?.id,
  });

  // Calculate profile completion percentage
  useEffect(() => {
    if (profile && roleData) {
      const percentage = calculateProfileCompletion(profile, roleData as any);
      setCompletionPercentage(percentage);
    }
  }, [profile, roleData]);

  if (!profile || !user) {
    return (
      <div className="mx-auto flex w-full max-w-5xl justify-center px-4 py-16">
        <EmptyState
          icon={<User />}
          title="Not Authenticated"
          description="Please log in to access your profile settings."
        />
      </div>
    );
  }

  if (roleDataLoading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl justify-center px-4 py-16">
        <LoadingState message="Loading profile data..." />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile & Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Completion Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Profile Completion
            </CardTitle>
            <CardDescription>
              Complete your profile to get the most out of your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{completionPercentage}% Complete</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            {/* Role-specific stats */}
            {roleData?.type === 'agent' && roleData.data && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="font-semibold">Agent Info</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Referral Code:</span>
                    <p className="font-mono font-bold">{(roleData.data as any).referral_code || 'Not assigned'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Referrals:</span>
                    <p className="font-bold">{referralsData?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {roleData?.type === 'student' && applicationsData && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold">Application Status</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Active Applications:</span>
                  <p className="font-bold text-lg">{applicationsData.length}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileInfoTab profile={profile} roleData={roleData} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab profile={profile} />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab profile={profile} />
          </TabsContent>

          <TabsContent value="security">
            <PasswordSecurityTab />
          </TabsContent>

          <TabsContent value="account">
            <AccountTab profile={profile} />
          </TabsContent>
        </Tabs>
    </div>
  );
}
