import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, FileText, GraduationCap, Award, DollarSign, FileCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
}

export default function StudentOnboarding() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Tables<'students'> | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [completeness, setCompleteness] = useState(0);

  const fetchStudentData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get student record (if it exists)
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (studentError) throw studentError;

      let currentStudent = studentData;

      if (!currentStudent) {
        const resolveTenantId = async () => {
          if (profile?.tenant_id) return profile.tenant_id;

          const { data: profileRecord, error: profileError } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .maybeSingle();

          if (profileError) throw profileError;
          return profileRecord?.tenant_id ?? null;
        };

        const tenantId = await resolveTenantId();

        if (!tenantId) {
          throw new Error('Unable to determine tenant for current student profile');
        }

        const { data: createdStudent, error: createStudentError } = await supabase
          .from('students')
          .insert({ profile_id: user.id, tenant_id: tenantId })
          .select()
          .single();

        if (createStudentError) throw createStudentError;

        currentStudent = createdStudent;
      }

      let educationCount = 0;
      let testScoresCount = 0;
      let documentsCount = 0;

      if (currentStudent?.id) {
        const [
          { count: educationCountResult, error: educationError },
          { count: testScoresCountResult, error: testScoresError },
          { count: documentsCountResult, error: documentsError },
        ] = await Promise.all([
          supabase
            .from('education_records')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', currentStudent.id),
          supabase
            .from('test_scores')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', currentStudent.id),
          supabase
            .from('student_documents')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', currentStudent.id),
        ]);

        if (educationError) throw educationError;
        if (testScoresError) throw testScoresError;
        if (documentsError) throw documentsError;

        educationCount = educationCountResult ?? 0;
        testScoresCount = testScoresCountResult ?? 0;
        documentsCount = documentsCountResult ?? 0;
      }

      // Build checklist
      const items: ChecklistItem[] = [
        {
          id: 'personal',
          title: 'Complete Personal Information',
          description: 'Add your legal name, contact details, and passport information',
          completed: !!(
            currentStudent?.legal_name &&
            currentStudent?.contact_email &&
            currentStudent?.passport_number
          ),
          icon: FileText,
          link: '/student/profile',
        },
        {
          id: 'education',
          title: 'Add Education History',
          description: 'Add at least one education record (high school or university)',
          completed: educationCount > 0,
          icon: GraduationCap,
          link: '/student/profile#education',
        },
        {
          id: 'tests',
          title: 'Add English Test Scores',
          description: 'Upload your IELTS, TOEFL, or other English test results',
          completed: testScoresCount > 0,
          icon: Award,
          link: '/student/profile#tests',
        },
        {
          id: 'finances',
          title: 'Complete Financial Information',
          description: 'Provide details about your finances and sponsorship',
          completed: !!(
            currentStudent?.finances_json &&
            typeof currentStudent.finances_json === 'object' &&
            currentStudent.finances_json !== null &&
            Object.keys(currentStudent.finances_json as Record<string, unknown>).length > 0
          ),
          icon: DollarSign,
          link: '/student/profile#finances',
        },
        {
          id: 'documents',
          title: 'Upload Required Documents',
          description: 'Upload passport, transcripts, and other key documents',
          completed: documentsCount >= 2,
          icon: FileCheck,
          link: '/student/documents',
        },
      ];

      setChecklist(items);

      // Calculate completeness
      const completedItems = items.filter((item) => item.completed).length;
      const percentage = Math.round((completedItems / items.length) * 100);
      setCompleteness(percentage);

      // Update profile completeness in database
      if (currentStudent && currentStudent.profile_completeness !== percentage) {
        await supabase
          .from('students')
          .update({ profile_completeness: percentage })
          .eq('id', currentStudent.id);

        currentStudent = { ...currentStudent, profile_completeness: percentage };
      }

      setStudent(currentStudent ?? null);
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load onboarding data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.tenant_id, toast]);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user, fetchStudentData]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-24 bg-muted rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto py-6 md:py-8 px-4 max-w-4xl space-y-6 md:space-y-8">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />

        <div className="space-y-2 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Welcome to Global Education Gateway
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Complete your profile to start applying to universities worldwide
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="hover:shadow-lg transition-shadow animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Profile Completeness</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {completeness}% complete • {checklist.filter((i) => i.completed).length} of{' '}
              {checklist.length} steps completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Progress value={completeness} className="h-4" />
              <span className="absolute right-2 top-0.5 text-xs font-medium">
                {completeness}%
              </span>
            </div>
            {completeness === 100 ? (
              <div className="p-4 bg-success/10 rounded-lg border border-success/20 animate-fade-in">
                <p className="text-success font-medium flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Profile Complete! You're ready to start applying to programs.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <Button asChild className="hover-scale flex-1">
                    <Link to="/search">Browse Programs</Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/student/applications/new">Create Application</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete all steps below to unlock full access to university applications and features.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Onboarding Checklist */}
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold">Getting Started Checklist</h2>
            <Badge variant="outline" className="text-xs sm:text-sm">
              {checklist.filter((i) => i.completed).length}/{checklist.length} Complete
            </Badge>
          </div>
          <div className="space-y-3">
            {checklist.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.id}
                  className={`hover:shadow-lg transition-all ${
                    item.completed ? 'border-success/50 bg-success/5' : 'hover:-translate-y-0.5'
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div
                        className={`rounded-full p-2.5 sm:p-3 flex-shrink-0 transition-colors ${
                          item.completed
                            ? 'bg-success text-success-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {item.completed ? (
                              <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex-shrink-0 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">{index + 1}</span>
                              </div>
                            )}
                            <h3 className="font-semibold text-base sm:text-lg break-words">
                              {item.title}
                            </h3>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          {item.description}
                        </p>
                        {!item.completed ? (
                          <Link to={item.link}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="hover-scale w-full sm:w-auto"
                            >
                              Complete This Step
                            </Button>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2 text-success text-sm">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium">Completed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Additional Resources */}
        <Card className="bg-muted/50 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Our team is here to support you throughout your application journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/faq">View FAQ</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/contact">Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
