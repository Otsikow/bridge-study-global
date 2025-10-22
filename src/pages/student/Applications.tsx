import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Calendar, GraduationCap, MapPin, Filter, Timer, XCircle } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [allCountries, setAllCountries] = useState<string[]>([]);

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
      const list = appsData || [];
      setApplications(list);
      setAllCountries(Array.from(new Set(list.map((a: any) => a.program.university.country))).sort());
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

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user, fetchApplications]);

  const getIntakeLabel = (month: number, year: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${year}`;
  };

  const filtered = applications.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesCountry = countryFilter === 'all' || a.program.university.country === countryFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || a.program.name.toLowerCase().includes(term) || a.program.university.name.toLowerCase().includes(term);
    return matchesStatus && matchesCountry && matchesSearch;
  });

  const etaFor = (status: string) => {
    const map: Record<string, string> = {
      draft: '1–2w prep',
      submitted: '2–6w decision',
      screening: '1–2w screening',
      conditional_offer: '1–3w conditions',
      unconditional_offer: '2–4w CAS/LOA',
      cas_loa: '2–6w visa',
      visa: '2–6w enroll',
      enrolled: 'Done',
    };
    return map[status] || 'Varies';
  };

  const cancelDraft = async (id: string) => {
    try {
      const { error } = await supabase.from('applications').update({ status: 'withdrawn' }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Cancelled', description: 'Application moved to Withdrawn' });
      fetchApplications();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Could not cancel application', variant: 'destructive' });
    }
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
      <BackButton variant="ghost" size="sm" className="mb-4" fallback="/dashboard" />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-[220px]">
          <h1 className="text-3xl font-bold mb-2">My Applications</h1>
          <p className="text-muted-foreground">Track and manage your university applications</p>
        </div>
        <div className="flex-1 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
            <div className="col-span-1 md:col-span-2">
              <div className="relative">
                <input
                  className="w-full border rounded-md h-9 px-3 text-sm"
                  placeholder="Search program or university..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <select
                className="w-full border rounded-md h-9 text-sm px-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="screening">Screening</option>
                <option value="conditional_offer">Conditional Offer</option>
                <option value="unconditional_offer">Unconditional Offer</option>
                <option value="cas_loa">CAS/LOA</option>
                <option value="visa">Visa</option>
                <option value="enrolled">Enrolled</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
            <div>
              <select
                className="w-full border rounded-md h-9 text-sm px-2"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
              >
                <option value="all">All Countries</option>
                {allCountries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
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
              {filtered.map((app) => (
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
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Timer className="h-4 w-4" /> {etaFor(app.status)}
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
                        {app.status === 'draft' && (
                          <Button variant="ghost" size="sm" onClick={() => cancelDraft(app.id)} className="text-destructive">
                            <XCircle className="h-4 w-4 mr-1" /> Cancel
                          </Button>
                        )}
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
