import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PersonalInfoTab } from '@/components/student/profile/PersonalInfoTab';
import { EducationTab } from '@/components/student/profile/EducationTab';
import { TestScoresTab } from '@/components/student/profile/TestScoresTab';
import { FinancesTab } from '@/components/student/profile/FinancesTab';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { Loader2 } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { Link } from 'react-router-dom';
import { useErrorHandler, ErrorDisplay } from '@/hooks/useErrorHandler';
import { handleDbError } from '@/lib/errorHandling';

export default function StudentProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const errorHandler = useErrorHandler({ context: 'Student Profile' });
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Tables<'students'> | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [completeness, setCompleteness] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);

  const recalcCompleteness = useCallback(async (studentRecord: Tables<'students'>) => {
    // Step booleans
    const personalDone = !!(studentRecord.legal_name && studentRecord.contact_email && studentRecord.passport_number);
    const financesDone = !!(studentRecord.finances_json && Object.keys(studentRecord.finances_json as Record<string, unknown>).length > 0);

    // Counts for related tables
    const [{ count: educationCount }, { count: testScoresCount }, { count: documentsCount }] = await Promise.all([
      supabase.from('education_records').select('*', { count: 'exact', head: true }).eq('student_id', studentRecord.id),
      supabase.from('test_scores').select('*', { count: 'exact', head: true }).eq('student_id', studentRecord.id),
      supabase.from('student_documents').select('*', { count: 'exact', head: true }).eq('student_id', studentRecord.id),
    ]);

    const educationDone = (educationCount || 0) > 0;
    const testsDone = (testScoresCount || 0) > 0;
    const documentsDone = (documentsCount || 0) >= 2; // align with onboarding

    const items = [personalDone, educationDone, testsDone, financesDone, documentsDone];
    const done = items.filter(Boolean).length;
    const percent = Math.round((done / items.length) * 100);

    setCompletedSteps(done);
    setCompleteness(percent);

    // Persist if changed
    if (studentRecord.profile_completeness !== percent) {
      await supabase.from('students').update({ profile_completeness: percent }).eq('id', studentRecord.id);
    }
  }, []);

  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true);
      errorHandler.clearError();

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
      await recalcCompleteness(data);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast, navigate, recalcCompleteness, errorHandler]);

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

  // Keep URL hash in sync with active tab for deep links
  useEffect(() => {
    if (['personal', 'education', 'tests', 'finances'].includes(activeTab)) {
      window.location.hash = activeTab;
    }
  }, [activeTab]);

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

  if (errorHandler.hasError) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto py-6 md:py-8 px-4 space-y-6">
          <BackButton variant="ghost" size="sm" fallback="/dashboard" />
          <ErrorDisplay 
            error={errorHandler.error} 
            onRetry={() => errorHandler.retry(fetchStudentData)}
            onClear={errorHandler.clearError}
          />
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

        {/* Progress Overview */}
        <Card className="hover:shadow-lg transition-shadow animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Profile Completeness</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {completeness}% complete • {completedSteps} of 5 steps completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Progress value={completeness} className="h-3" />
              <span className="absolute right-2 -top-1 text-xs font-medium">{completeness}%</span>
            </div>
            {completeness < 100 && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Tip: Upload documents like passport and transcripts in the{' '}
                <Link className="underline" to="/student/documents">Documents</Link> section to improve completeness.
              </p>
            )}
          </CardContent>
        </Card>

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
            <EducationTab studentId={student.id} onUpdate={fetchStudentData} />
          </TabsContent>

          <TabsContent value="tests" className="space-y-4 animate-fade-in">
            <TestScoresTab studentId={student.id} onUpdate={fetchStudentData} />
          </TabsContent>

          <TabsContent value="finances" className="space-y-4 animate-fade-in">
            <FinancesTab student={student} onUpdate={fetchStudentData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
