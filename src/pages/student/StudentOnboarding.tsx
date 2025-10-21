import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, FileText, GraduationCap, Award, DollarSign, FileCheck, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
}

export default function StudentOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Record<string, unknown> | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [completeness, setCompleteness] = useState(0);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user, fetchStudentData]);

  const fetchStudentData = useCallback(async () => {
    try {
      // Get student record
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', user?.id)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      // Get education records count
      const { count: educationCount } = await supabase
        .from('education_records')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentData.id);

      // Get test scores count
      const { count: testScoresCount } = await supabase
        .from('test_scores')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentData.id);

      // Get documents count
      const { count: documentsCount } = await supabase
        .from('student_documents')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentData.id);

      // Build checklist
      const items: ChecklistItem[] = [
        {
          id: 'personal',
          title: 'Complete Personal Information',
          description: 'Add your legal name, contact details, and passport information',
          completed: !!(studentData.legal_name && studentData.contact_email && studentData.passport_number),
          icon: FileText,
          link: '/student/profile'
        },
        {
          id: 'education',
          title: 'Add Education History',
          description: 'Add at least one education record (high school or university)',
          completed: (educationCount || 0) > 0,
          icon: GraduationCap,
          link: '/student/profile#education'
        },
        {
          id: 'tests',
          title: 'Add English Test Scores',
          description: 'Upload your IELTS, TOEFL, or other English test results',
          completed: (testScoresCount || 0) > 0,
          icon: Award,
          link: '/student/profile#tests'
        },
        {
          id: 'finances',
          title: 'Complete Financial Information',
          description: 'Provide details about your finances and sponsorship',
          completed: !!(studentData.finances_json && Object.keys(studentData.finances_json).length > 0),
          icon: DollarSign,
          link: '/student/profile#finances'
        },
        {
          id: 'documents',
          title: 'Upload Required Documents',
          description: 'Upload passport, transcripts, and other key documents',
          completed: (documentsCount || 0) >= 2,
          icon: FileCheck,
          link: '/student/documents'
        }
      ];

      setChecklist(items);

      // Calculate completeness
      const completedItems = items.filter(item => item.completed).length;
      const percentage = Math.round((completedItems / items.length) * 100);
      setCompleteness(percentage);

      // Update profile completeness in database
      if (studentData.profile_completeness !== percentage) {
        await supabase
          .from('students')
          .update({ profile_completeness: percentage })
          .eq('id', studentData.id);
      }

    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load onboarding data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-24 bg-muted rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome to Global Education Gateway</h1>
          <p className="text-lg text-muted-foreground">Complete your profile to start applying to universities</p>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Profile Completeness</CardTitle>
            <CardDescription className="text-base">
              {completeness}% complete - {checklist.filter(i => i.completed).length} of {checklist.length} steps done
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={completeness} className="h-3" />
            {completeness === 100 && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-primary font-medium flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Profile Complete! You're ready to start applying to programs.
                </p>
                <Link to="/search">
                  <Button className="mt-3">Browse Programs</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Onboarding Checklist */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Getting Started Checklist</h2>
          <div className="space-y-3">
            {checklist.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.id} className={item.completed ? 'border-primary/50 bg-primary/5' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`rounded-full p-3 flex-shrink-0 ${item.completed ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {item.completed ? (
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          )}
                          <h3 className="font-semibold text-lg">{item.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                        {!item.completed && (
                          <Link to={item.link}>
                            <Button variant="outline" size="sm">
                              Complete This Step
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
