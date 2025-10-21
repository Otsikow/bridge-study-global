import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Calendar,
  MapPin,
  GraduationCap,
  User,
  FileText,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/StatusBadge';

interface Application {
  id: string;
  status: string;
  intake_year: number;
  intake_month: number;
  created_at: string;
  submitted_at: string | null;
  priority: 'high' | 'medium' | 'low';
  estimated_processing_days: number;
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
  student: {
    id: string;
    profiles: {
      full_name: string;
      email: string;
    };
  };
  agent?: {
    id: string;
    profiles: {
      full_name: string;
    };
  };
}

interface StatusMilestone {
  status: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  estimatedDays: number;
}

const STATUS_MILESTONES: StatusMilestone[] = [
  {
    status: 'draft',
    label: 'Draft',
    description: 'Application being prepared',
    icon: FileText,
    color: 'bg-gray-500',
    estimatedDays: 0
  },
  {
    status: 'submitted',
    label: 'Submitted',
    description: 'Application submitted to institution',
    icon: CheckCircle,
    color: 'bg-blue-500',
    estimatedDays: 1
  },
  {
    status: 'screening',
    label: 'Screening',
    description: 'Under initial review',
    icon: Eye,
    color: 'bg-yellow-500',
    estimatedDays: 7
  },
  {
    status: 'conditional_offer',
    label: 'Conditional Offer',
    description: 'Offer received with conditions',
    icon: AlertCircle,
    color: 'bg-orange-500',
    estimatedDays: 14
  },
  {
    status: 'unconditional_offer',
    label: 'Unconditional Offer',
    description: 'Full offer received',
    icon: CheckCircle,
    color: 'bg-green-500',
    estimatedDays: 21
  },
  {
    status: 'cas_loa',
    label: 'CAS/LOA',
    description: 'Confirmation of Acceptance issued',
    icon: FileText,
    color: 'bg-purple-500',
    estimatedDays: 28
  },
  {
    status: 'visa',
    label: 'Visa Application',
    description: 'Visa application in progress',
    icon: Clock,
    color: 'bg-indigo-500',
    estimatedDays: 35
  },
  {
    status: 'enrolled',
    label: 'Enrolled',
    description: 'Successfully enrolled',
    icon: CheckCircle,
    color: 'bg-green-600',
    estimatedDays: 42
  }
];

export default function ApplicationTrackingSystem() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    if (profile?.id) {
      fetchApplications();
    }
  }, [profile?.id]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, countryFilter, priorityFilter]);

  const fetchApplications = async () => {
    try {
      let query = supabase
        .from('applications')
        .select(`
          id,
          status,
          intake_year,
          intake_month,
          created_at,
          submitted_at,
          priority,
          estimated_processing_days,
          program:programs (
            name,
            level,
            discipline,
            university:universities (
              name,
              city,
              country
            )
          ),
          student:students (
            id,
            profiles!inner (
              full_name,
              email
            )
          ),
          agent:agents (
            id,
            profiles!inner (
              full_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (profile?.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('profile_id', profile.id)
          .single();
        
        if (studentData) {
          query = query.eq('student_id', studentData.id);
        }
      } else if (profile?.role === 'agent') {
        const { data: agentData } = await supabase
          .from('agents')
          .select('id')
          .eq('profile_id', profile.id)
          .single();
        
        if (agentData) {
          query = query.eq('agent_id', agentData.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
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
  };

  const filterApplications = () => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.student.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.program.university.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (countryFilter !== 'all') {
      filtered = filtered.filter(app => app.program.university.country === countryFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(app => app.priority === priorityFilter);
    }

    setFilteredApplications(filtered);
  };

  const getStatusProgress = (status: string) => {
    const currentIndex = STATUS_MILESTONES.findIndex(m => m.status === status);
    return ((currentIndex + 1) / STATUS_MILESTONES.length) * 100;
  };

  const getEstimatedDays = (status: string) => {
    const milestone = STATUS_MILESTONES.find(m => m.status === status);
    return milestone?.estimatedDays || 0;
  };

  const getUniqueCountries = () => {
    const countries = applications.map(app => app.program.university.country);
    return [...new Set(countries)].sort();
  };

  const getStatusCounts = () => {
    const counts = STATUS_MILESTONES.reduce((acc, milestone) => {
      acc[milestone.status] = applications.filter(app => app.status === milestone.status).length;
      return acc;
    }, {} as Record<string, number>);
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Application Tracking System</h2>
          <p className="text-muted-foreground">Monitor and manage all student applications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {STATUS_MILESTONES.slice(0, 4).map((milestone) => {
          const Icon = milestone.icon;
          const count = statusCounts[milestone.status] || 0;
          return (
            <Card key={milestone.status}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{milestone.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${milestone.color.replace('bg-', 'text-')}`} />
                </div>
                <Progress value={getStatusProgress(milestone.status)} className="mt-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_MILESTONES.map((milestone) => (
                  <SelectItem key={milestone.status} value={milestone.status}>
                    {milestone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {getUniqueCountries().map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => {
                const currentMilestone = STATUS_MILESTONES.find(m => m.status === app.status);
                const Icon = currentMilestone?.icon || FileText;
                const progress = getStatusProgress(app.status);
                const estimatedDays = getEstimatedDays(app.status);

                return (
                  <Card key={app.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5 w-5 ${currentMilestone?.color.replace('bg-', 'text-')}`} />
                            <div>
                              <h3 className="font-semibold text-lg">{app.student.profiles.full_name}</h3>
                              <p className="text-sm text-muted-foreground">{app.student.profiles.email}</p>
                            </div>
                            <Badge variant={app.priority === 'high' ? 'destructive' : app.priority === 'medium' ? 'default' : 'secondary'}>
                              {app.priority} priority
                            </Badge>
                          </div>

                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              {app.program.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {app.program.level} • {app.program.discipline}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {app.program.university.name}, {app.program.university.country}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Intake: {new Date(app.intake_year, app.intake_month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Est. {estimatedDays} days
                            </div>
                          </div>

                          {app.agent && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              Agent: {app.agent.profiles.full_name}
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <StatusBadge status={app.status} />
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}