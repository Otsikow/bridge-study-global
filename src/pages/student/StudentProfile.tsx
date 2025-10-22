import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PersonalInfoTab } from '@/components/student/profile/PersonalInfoTab';
import { EducationTab } from '@/components/student/profile/EducationTab';
import { TestScoresTab } from '@/components/student/profile/TestScoresTab';
import { FinancesTab } from '@/components/student/profile/FinancesTab';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { Loader2 } from 'lucide-react';
import BackButton from '@/components/BackButton';

export default function StudentProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Tables<'students'> | null>(null);
  const [activeTab, setActiveTab] = useState('personal');

  const fetchStudentData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: 'Profile Setup Required',
          description: 'Please complete your student profile to continue',
          variant: 'default',
        });
        navigate('/student/onboarding');
        return;
      }
      
      setStudent(data);
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast, navigate]);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }

    // Handle hash navigation for direct links to tabs
    const hash = window.location.hash.replace('#', '');
    if (hash && ['personal', 'education', 'tests', 'finances'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [user, fetchStudentData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 animate-fade-in">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Loader2 className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Profile Not Found</h2>
              <p className="text-muted-foreground">
                We couldn't find your student profile. This might be because you haven't completed onboarding yet.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <Button onClick={() => navigate('/student/onboarding')}>
                Complete Onboarding
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto py-6 md:py-8 px-4 space-y-6">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />

        <div className="space-y-2 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Keep your information up to date to ensure smooth application processing
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 h-auto p-1 bg-muted/50">
            <TabsTrigger value="personal" className="data-[state=active]:bg-background">
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="education" className="data-[state=active]:bg-background">
              Education
            </TabsTrigger>
            <TabsTrigger value="tests" className="data-[state=active]:bg-background">
              Test Scores
            </TabsTrigger>
            <TabsTrigger value="finances" className="data-[state=active]:bg-background">
              Finances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 animate-fade-in">
            <PersonalInfoTab student={student} onUpdate={fetchStudentData} />
          </TabsContent>

          <TabsContent value="education" className="space-y-4 animate-fade-in">
            <EducationTab studentId={student.id} />
          </TabsContent>

          <TabsContent value="tests" className="space-y-4 animate-fade-in">
            <TestScoresTab studentId={student.id} />
          </TabsContent>

          <TabsContent value="finances" className="space-y-4 animate-fade-in">
            <FinancesTab student={student} onUpdate={fetchStudentData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
