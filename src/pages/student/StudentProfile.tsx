import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonalInfoTab } from '@/components/student/profile/PersonalInfoTab';
import { EducationTab } from '@/components/student/profile/EducationTab';
import { TestScoresTab } from '@/components/student/profile/TestScoresTab';
import { FinancesTab } from '@/components/student/profile/FinancesTab';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }

    // Handle hash navigation for direct links to tabs
    const hash = window.location.hash.replace('#', '');
    if (hash && ['personal', 'education', 'tests', 'finances'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [user]);

  const fetchStudentData = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', user?.id)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Student Profile Not Found</h2>
          <p className="text-muted-foreground">Please contact support if this issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">
          Keep your information up to date to ensure smooth application processing
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="tests">Test Scores</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalInfoTab student={student} onUpdate={fetchStudentData} />
        </TabsContent>

        <TabsContent value="education">
          <EducationTab studentId={student.id} />
        </TabsContent>

        <TabsContent value="tests">
          <TestScoresTab studentId={student.id} />
        </TabsContent>

        <TabsContent value="finances">
          <FinancesTab student={student} onUpdate={fetchStudentData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
