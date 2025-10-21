import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Calendar, GraduationCap, ArrowLeft, MapPin } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

interface Application {
  id: string;
  status: string;
  intake_year: number;
  intake_month: number;
  created_at: string;
  submitted_at: string | null;
  program: {
    name: string;
    level: string;
    discipline: string;
    university: {
      name: string;
      city: string;
      country: string;
    };
  };
}

export default function Applications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user, fetchApplications]);

  const fetchApplications = useCallback(async () => {
    try {
      // Get student ID
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!studentData) return;

      // Fetch applications with program and university details
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          intake_year,
          intake_month,
          created_at,
          submitted_at,
          program:programs (
            name,
            level,
            discipline,
            university:universities (
              name,
              city,
              country
            )
          )
        `)
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;
      setApplications(appsData || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const getIntakeLabel = (month: number, year: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${year}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Applications</h1>
          <p className="text-muted-foreground">Track and manage your university applications</p>
        </div>
        <Button asChild>
          <Link to="/search">
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(a => a.submitted_at).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(a => a.status === 'draft' || a.status === 'screening').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(a => a.status === 'conditional_offer' || a.status === 'unconditional_offer').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-4">Start your journey by browsing programs and submitting your first application</p>
              <Button asChild>
                <Link to="/search">
                  <Plus className="mr-2 h-4 w-4" />
                  Browse Programs
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            {app.program.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {app.program.level} • {app.program.discipline}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {app.program.university.name} • {app.program.university.city}, {app.program.university.country}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Intake: {getIntakeLabel(app.intake_month, app.intake_year)}</span>
                          </div>
                          <div>
                            Applied: {new Date(app.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <StatusBadge status={app.status} />
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/student/applications/${app.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
