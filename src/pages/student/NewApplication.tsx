import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, GraduationCap, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Program {
  id: string;
  name: string;
  level: string;
  discipline: string;
  tuition_amount: number;
  tuition_currency: string;
  duration_months: number;
  university: {
    name: string;
    city: string;
    country: string;
  };
}

interface Intake {
  id: string;
  term: string;
  start_date: string;
  app_deadline: string;
}

export default function NewApplication() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get('program');
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [program, setProgram] = useState<Program | null>(null);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Form state
  const [selectedIntake, setSelectedIntake] = useState<string>('');
  const [intakeYear, setIntakeYear] = useState<number>(new Date().getFullYear());
  const [intakeMonth, setIntakeMonth] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (user && programId) {
      fetchData();
    }
  }, [user, programId, fetchData]);

  const fetchData = useCallback(async () => {
    try {
      // Get student ID
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!studentData) {
        toast({
          title: 'Error',
          description: 'Student profile not found',
          variant: 'destructive'
        });
        navigate('/student/onboarding');
        return;
      }

      setStudentId(studentData.id);

      // Fetch program details
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select(`
          id,
          name,
          level,
          discipline,
          tuition_amount,
          tuition_currency,
          duration_months,
          university:universities (
            name,
            city,
            country
          )
        `)
        .eq('id', programId)
        .maybeSingle();

      if (programError) throw programError;
      if (!programData) {
        toast({
          title: 'Error',
          description: 'Program not found',
          variant: 'destructive'
        });
        navigate('/search');
        return;
      }

      setProgram(programData);

      // Fetch intakes
      const { data: intakesData, error: intakesError } = await supabase
        .from('intakes')
        .select('*')
        .eq('program_id', programId)
        .gte('app_deadline', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      if (intakesError) throw intakesError;
      setIntakes(intakesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load program details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, programId, navigate, toast]);

  const handleSubmit = async () => {
    if (!studentId || !programId) return;

    if (!agreedToTerms) {
      toast({
        title: 'Error',
        description: 'Please agree to the terms and conditions',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert([{
          student_id: studentId,
          program_id: programId,
          intake_year: intakeYear,
          intake_month: intakeMonth,
          status: 'draft',
          notes: notes || null,
          intake_id: selectedIntake || null,
          tenant_id: '00000000-0000-0000-0000-000000000001'
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Application created successfully'
      });

      navigate(`/student/applications/${data.id}`);
    } catch (error) {
      console.error('Error creating application:', error);
      toast({
        title: 'Error',
        description: 'Failed to create application',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Program not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div>
        <h1 className="text-3xl font-bold mb-2">New Application</h1>
        <p className="text-muted-foreground">Submit your application to start your journey</p>
      </div>

      {/* Program Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Program Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">{program.name}</h3>
            <p className="text-muted-foreground">{program.level} • {program.discipline}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{program.university.name}, {program.university.city}, {program.university.country}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>{program.tuition_currency} {program.tuition_amount.toLocaleString()} per year</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Duration: {program.duration_months} months</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Form */}
      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
          <CardDescription>Select your preferred intake and provide additional information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {intakes.length > 0 ? (
            <div className="space-y-2">
              <Label>Select Intake</Label>
              <Select value={selectedIntake} onValueChange={setSelectedIntake}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an intake" />
                </SelectTrigger>
                <SelectContent>
                  {intakes.map((intake) => (
                    <SelectItem key={intake.id} value={intake.id}>
                      {intake.term} - Starts: {new Date(intake.start_date).toLocaleDateString()} (Deadline: {new Date(intake.app_deadline).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Intake Year</Label>
                <Select value={intakeYear.toString()} onValueChange={(v) => setIntakeYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2].map(offset => {
                      const year = new Date().getFullYear() + offset;
                      return <SelectItem key={year} value={year.toString()}>{year}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Intake Month</Label>
                <Select value={intakeMonth.toString()} onValueChange={(v) => setIntakeMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                      <SelectItem key={idx + 1} value={(idx + 1).toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional information or questions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              I agree to the terms and conditions and confirm that all information provided is accurate
            </Label>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={submitting || !agreedToTerms}>
              {submitting ? 'Creating...' : 'Create Application'}
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
