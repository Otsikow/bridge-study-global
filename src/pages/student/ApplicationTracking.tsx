import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage, logError, formatErrorForToast } from '@/lib/errorUtils';
import {
  FileText,
  MessageCircle,
  Calendar,
  GraduationCap,
  MapPin,
  Search,
  Upload,
  Clock,
  Filter,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { ApplicationProgressTimeline } from '@/components/student/ApplicationProgressTimeline';
import { DocumentUploadDialog } from '@/components/student/DocumentUploadDialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Application {
  id: string;
  status: string;
  intake_year: number;
  intake_month: number;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  program: {
    id: string;
    name: string;
    level: string;
    discipline: string;
    university: {
      name: string;
      city: string;
      country: string;
      logo_url: string | null;
    };
  };
  agent_id: string | null;
}

interface MissingDocument {
  type: string;
  label: string;
}

const REQUIRED_DOCUMENTS = [
  { type: 'passport', label: 'Passport' },
  { type: 'transcript', label: 'Academic Transcripts' },
  { type: 'sop', label: 'Statement of Purpose' },
  { type: 'cv', label: 'CV/Resume' },
];

export default function ApplicationTracking() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [missingDocs, setMissingDocs] = useState<Record<string, MissingDocument[]>>({});

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!studentData) {
        setApplications([]);
        return;
      }

      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          intake_year,
          intake_month,
          created_at,
          updated_at,
          submitted_at,
          agent_id,
          program:programs (
            id,
            name,
            level,
            discipline,
            university:universities (
              name,
              city,
              country,
              logo_url
            )
          )
        `)
        .eq('student_id', studentData.id)
        .order('updated_at', { ascending: false });

      if (appsError) throw appsError;

      const list = (appsData ?? []) as Application[];
      setApplications(list);

      // Fetch missing documents for each application
      await fetchMissingDocuments(list);
    } catch (error) {
      logError(error, 'ApplicationTracking.fetchApplications');
      toast(formatErrorForToast(error, 'Failed to load applications'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const fetchMissingDocuments = async (apps: Application[]) => {
    const missingDocsMap: Record<string, MissingDocument[]> = {};

    for (const app of apps) {
      try {
        const { data: existingDocs, error } = await supabase
          .from('application_documents')
          .select('document_type')
          .eq('application_id', app.id);

        if (error) throw error;

        const existingTypes = existingDocs?.map((d) => d.document_type) || [];
        const missing = REQUIRED_DOCUMENTS.filter(
          (doc) => !existingTypes.includes(doc.type as any)
        );

        if (missing.length > 0) {
          missingDocsMap[app.id] = missing;
        }
      } catch (error) {
        logError(error, `ApplicationTracking.fetchMissingDocuments.${app.id}`);
      }
    }

    setMissingDocs(missingDocsMap);
  };

  useEffect(() => {
    if (user) fetchApplications();
  }, [user, fetchApplications]);

  const getIntakeLabel = (month: number, year: number) => {
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  const handleChatWithAgent = (app: Application) => {
    if (!app.agent_id) {
      toast({
        title: 'No Agent Assigned',
        description: 'An agent has not been assigned to this application yet.',
        variant: 'destructive',
      });
      return;
    }
    // Navigate to messages page with application context
    navigate(`/student/messages?application_id=${app.id}`);
  };

  const filtered = applications.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      a.program.name.toLowerCase().includes(term) ||
      a.program.university.name.toLowerCase().includes(term) ||
      a.program.university.country.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const activeApps = applications.filter(
    (a) => !['withdrawn', 'deferred', 'enrolled'].includes(a.status)
  );
  const completedApps = applications.filter((a) => a.status === 'enrolled');
  const withOffers = applications.filter(
    (a) => a.status === 'conditional_offer' || a.status === 'unconditional_offer'
  );

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading your applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <BackButton variant="ghost" size="sm" className="mb-4" fallback="/dashboard" />

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
          Application Tracking
        </h1>
        <p className="text-muted-foreground">
          Track your university applications and manage documents in real-time
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{activeApps.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Offers Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{withOffers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {completedApps.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by program, university, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="screening">Under Review</SelectItem>
                <SelectItem value="conditional_offer">Conditional Offer</SelectItem>
                <SelectItem value="unconditional_offer">Accepted</SelectItem>
                <SelectItem value="visa">Visa Stage</SelectItem>
                <SelectItem value="enrolled">Completed</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchApplications} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {applications.length === 0
                    ? 'No applications yet'
                    : 'No applications found'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {applications.length === 0
                    ? 'Start your journey by browsing programs and submitting your first application'
                    : 'Try adjusting your filters or search term'}
                </p>
              </div>
              {applications.length === 0 && (
                <Button asChild>
                  <Link to="/search">Browse Programs</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filtered.map((app) => (
            <Card key={app.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-6 w-6 text-primary mt-1 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-xl break-words">
                          {app.program.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="break-words">
                            {app.program.university.name} •{' '}
                            {app.program.university.city && `${app.program.university.city}, `}
                            {app.program.university.country}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Intake: {getIntakeLabel(app.intake_month, app.intake_year)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Updated: {new Date(app.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <DocumentUploadDialog
                      applicationId={app.id}
                      onUploadComplete={fetchApplications}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Docs
                        </Button>
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChatWithAgent(app)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat with Agent
                    </Button>
                    <Button variant="default" size="sm" asChild>
                      <Link to={`/student/applications/${app.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Timeline */}
                <div>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Application Progress
                  </h4>
                  <ApplicationProgressTimeline
                    currentStatus={app.status}
                    className="hidden md:block"
                  />
                  <ApplicationProgressTimeline
                    currentStatus={app.status}
                    className="md:hidden"
                  />
                </div>

                {/* Missing Documents Alert */}
                {missingDocs[app.id] && missingDocs[app.id].length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                          Missing Required Documents
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {missingDocs[app.id].map((doc) => (
                            <Badge
                              key={doc.type}
                              variant="outline"
                              className="text-amber-700 dark:text-amber-300"
                            >
                              {doc.label}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                          Please upload these documents to proceed with your application.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Application ID */}
                <div className="text-xs text-muted-foreground">
                  Application ID: {app.id}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
