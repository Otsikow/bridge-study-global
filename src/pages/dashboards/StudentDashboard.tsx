import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Search,
  FileText,
  Upload,
  MessageCircle,
  Bell,
  TrendingUp,
  Calendar,
  DollarSign,
  BookOpen,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatErrorForToast } from '@/lib/errorUtils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface ApplicationWithDetails {
  id: string;
  status: string;
  intake_year: number;
  intake_month: number;
  created_at: string;
  updated_at: string | null;
  program: {
    id: string;
    name: string;
    level: string;
    discipline: string;
    tuition_amount: number;
    tuition_currency: string;
    university: {
      name: string;
      city: string;
      country: string;
      logo_url: string | null;
    };
  };
  intake?: {
    app_deadline: string;
  };
}

interface RecommendedProgram {
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
    logo_url: string | null;
  };
}

interface Notification {
  id: string;
  subject: string;
  body: string;
  created_at: string;
  read_at: string | null;
  status: string;
}

interface StudentProfile {
  id: string;
  profile_completeness: number | null;
  education_history: any;
  test_scores: any;
  nationality: string | null;
  date_of_birth: string | null;
  passport_number: string | null;
}

export default function StudentDashboard() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [recommendedPrograms, setRecommendedPrograms] = useState<RecommendedProgram[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get student record
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!studentData) {
        setLoading(false);
        return;
      }

      setStudentProfile(studentData);

      // Fetch applications with program and university details
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          intake_year,
          intake_month,
          created_at,
          updated_at,
          intake_id,
          program:programs (
            id,
            name,
            level,
            discipline,
            tuition_amount,
            tuition_currency,
            university:universities (
              name,
              city,
              country,
              logo_url
            )
          )
        `)
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (appsError) throw appsError;

      // Fetch intake deadlines for applications
      const applicationsWithIntakes = await Promise.all(
        (appsData || []).map(async (app) => {
          if (app.intake_id) {
            const { data: intakeData } = await supabase
              .from('intakes')
              .select('app_deadline')
              .eq('id', app.intake_id)
              .single();
            
            return { ...app, intake: intakeData };
          }
          return app;
        })
      );

      setApplications(applicationsWithIntakes as ApplicationWithDetails[]);

      // Fetch recommended programs based on student's interests
      const educationHistory = studentData.education_history as any;
      const preferredLevel = educationHistory?.highest_level || 'bachelors';
      
      const { data: programsData, error: programsError } = await supabase
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
            country,
            logo_url
          )
        `)
        .eq('active', true)
        .eq('level', preferredLevel)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!programsError && programsData) {
        setRecommendedPrograms(programsData as RecommendedProgram[]);
      }

      // Fetch recent notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!notificationsError && notificationsData) {
        setNotifications(notificationsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast(formatErrorForToast(error, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompleteness = () => {
    if (!studentProfile) return 0;
    
    let completeness = 0;
    const fields = [
      studentProfile.nationality,
      studentProfile.date_of_birth,
      studentProfile.passport_number,
      studentProfile.education_history,
      studentProfile.test_scores,
    ];
    
    fields.forEach(field => {
      if (field) completeness += 20;
    });
    
    return studentProfile.profile_completeness || completeness;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDeadline = (year: number, month: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${year}`;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  const profileCompleteness = calculateProfileCompleteness();
  const unreadNotifications = notifications.filter(n => !n.read_at).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-[1600px] mx-auto">
        {/* Personalized Greeting with Profile Image */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary shadow-lg">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                {profile?.full_name ? getInitials(profile.full_name) : 'ST'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your journey and explore new opportunities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild className="relative">
              <Link to="/student/notifications">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-semibold">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>

        {/* Profile Progress Widget */}
        <Card className="border-l-4 border-l-primary shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Profile Completion</h3>
                  <p className="text-sm text-muted-foreground">
                    Your profile is {profileCompleteness}% complete
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/student/profile">
                  Complete Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Progress value={profileCompleteness} className="h-3" />
            {profileCompleteness < 100 && (
              <p className="text-xs text-muted-foreground mt-2">
                Complete your profile to improve your application success rate
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            asChild
            size="lg"
            className="h-auto py-6 flex-col gap-3 hover:scale-105 transition-transform shadow-lg"
            variant="default"
          >
            <Link to="/search">
              <Search className="h-8 w-8" />
              <span className="font-semibold">Search Courses</span>
            </Link>
          </Button>
          
          <Button
            asChild
            size="lg"
            className="h-auto py-6 flex-col gap-3 hover:scale-105 transition-transform shadow-lg"
            variant="secondary"
          >
            <Link to="/student/applications">
              <FileText className="h-8 w-8" />
              <span className="font-semibold">Track Applications</span>
            </Link>
          </Button>
          
          <Button
            asChild
            size="lg"
            className="h-auto py-6 flex-col gap-3 hover:scale-105 transition-transform shadow-lg"
            variant="secondary"
          >
            <Link to="/student/documents">
              <Upload className="h-8 w-8" />
              <span className="font-semibold">Upload Documents</span>
            </Link>
          </Button>
          
          <Button
            asChild
            size="lg"
            className="h-auto py-6 flex-col gap-3 hover:scale-105 transition-transform shadow-lg"
            variant="secondary"
          >
            <Link to="/student/messages">
              <MessageCircle className="h-8 w-8" />
              <span className="font-semibold">Chat with Agent</span>
            </Link>
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Applications Table */}
          <div className="xl:col-span-2 space-y-6">
            {/* My Applications Table */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">My Applications</CardTitle>
                    <CardDescription className="mt-1">
                      Track all your university applications in one place
                    </CardDescription>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/student/applications">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start your journey by applying to programs
                    </p>
                    <Button asChild>
                      <Link to="/search">
                        <Search className="mr-2 h-4 w-4" />
                        Search Programs
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>University</TableHead>
                          <TableHead className="text-right">Tuition</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Intake</TableHead>
                          <TableHead>Last Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((app) => (
                          <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="font-medium">
                              <Link to={`/student/applications/${app.id}`} className="hover:underline">
                                <div className="max-w-[250px]">
                                  <div className="font-semibold truncate">{app.program.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {app.program.level} • {app.program.discipline}
                                  </div>
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {app.program.university.logo_url && (
                                  <img
                                    src={app.program.university.logo_url}
                                    alt={app.program.university.name}
                                    className="h-8 w-8 rounded object-contain"
                                  />
                                )}
                                <div>
                                  <div className="font-medium text-sm">{app.program.university.name}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {app.program.university.city}, {app.program.university.country}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(
                                app.program.tuition_amount,
                                app.program.tuition_currency
                              )}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={app.status} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {formatDeadline(app.intake_year, app.intake_month)}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {app.updated_at ? getRelativeTime(app.updated_at) : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommended Programs */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-2xl">Recommended Programs</CardTitle>
                </div>
                <CardDescription className="mt-1">
                  Programs that match your interests and qualifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendedPrograms.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Complete your profile to get personalized recommendations
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendedPrograms.map((program) => (
                      <Card key={program.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {program.university.logo_url && (
                              <img
                                src={program.university.logo_url}
                                alt={program.university.name}
                                className="h-12 w-12 rounded object-contain flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-lg mb-1 line-clamp-2">
                                {program.name}
                              </h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                {program.university.name} • {program.university.city}, {program.university.country}
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <Badge variant="secondary">{program.level}</Badge>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {program.duration_months} months
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-primary">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(program.tuition_amount, program.tuition_currency)}
                                </span>
                              </div>
                            </div>
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/programs/${program.id}`}>View Details</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Notifications */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle>Recent Updates</CardTitle>
                </div>
                <CardDescription>Stay informed about your applications</CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <Card
                          key={notification.id}
                          className={`p-4 ${
                            !notification.read_at
                              ? 'border-l-4 border-l-primary bg-primary/5'
                              : 'border-l-4 border-l-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {!notification.read_at ? (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              ) : (
                                <div className="h-2 w-2 rounded-full bg-muted" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                                {notification.subject}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
                                {notification.body}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getRelativeTime(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
