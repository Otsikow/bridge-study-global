import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckCircle, AlertCircle, GraduationCap, User, Bell, Clock, TrendingUp, Globe, Filter, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProactiveAssistant from '@/components/ai/ProactiveAssistant';

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

interface Task {
  id: string;
  title: string;
  description: string;
  due_at: string;
  status: string;
  priority: string;
}

export default function StudentDashboard() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Get student ID
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!studentData) return;

      // Fetch applications
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

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', user.id)
        .in('status', ['open', 'in_progress'])
        .order('due_at', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getIntakeLabel = (month: number, year: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${year}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'screening': return 'bg-yellow-100 text-yellow-800';
      case 'conditional_offer': return 'bg-green-100 text-green-800';
      case 'unconditional_offer': return 'bg-green-100 text-green-800';
      case 'visa': return 'bg-purple-100 text-purple-800';
      case 'enrolled': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const stats = [
    { 
      title: 'Profile Completeness', 
      value: '75%', 
      icon: CheckCircle, 
      description: '4 of 5 steps complete',
      iconColor: 'text-green-600',
      valueColor: 'text-green-600'
    },
    { 
      title: 'Active Applications', 
      value: applications.length.toString(), 
      icon: FileText, 
      description: applications.length > 0 ? 'Applications in progress' : 'Start browsing programs',
      iconColor: applications.length > 0 ? 'text-blue-600' : 'text-muted-foreground',
      valueColor: applications.length > 0 ? 'text-blue-600' : ''
    },
    { 
      title: 'Pending Tasks', 
      value: tasks.length.toString(), 
      icon: Clock, 
      description: tasks.length > 0 ? 'Tasks need attention' : 'All caught up!',
      iconColor: tasks.length > 0 ? 'text-orange-600' : 'text-green-600',
      valueColor: tasks.length > 0 ? 'text-orange-600' : 'text-green-600'
    },
    { 
      title: 'Offers Received', 
      value: applications.filter(a => a.status === 'conditional_offer' || a.status === 'unconditional_offer').length.toString(), 
      icon: TrendingUp, 
      description: 'Congratulations!',
      iconColor: 'text-green-600',
      valueColor: 'text-green-600'
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 space-y-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || 'Student'}!</h1>
            <p className="text-muted-foreground">Track your applications and stay on top of your journey</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button asChild>
              <Link to="/search">
                <Search className="h-4 w-4 mr-2" />
                Find Programs
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.valueColor || ''}`}>
                    {stat.value}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                  {stat.title === 'Profile Completeness' && (
                    <Progress value={75} className="mt-2" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* AI Assistant */}
              <div className="lg:col-span-1">
                <ProactiveAssistant />
              </div>

              {/* Quick Actions and Recent Activity */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link to="/student/onboarding">
                          <CheckCircle className="mr-3 h-5 w-5" />
                          Complete Your Profile
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link to="/student/profile">
                          <User className="mr-3 h-5 w-5" />
                          Edit Profile
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link to="/student/documents">
                          <FileText className="mr-3 h-5 w-5" />
                          My Documents
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link to="/student/applications">
                          <FileText className="mr-3 h-5 w-5" />
                          My Applications
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link to="/search">
                          <GraduationCap className="mr-3 h-5 w-5" />
                          Browse Programs
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {applications.length > 0 ? (
                          applications.slice(0, 3).map((app) => (
                            <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <GraduationCap className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="font-medium text-sm">{app.program.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {app.program.university.name} • {getIntakeLabel(app.intake_month, app.intake_year)}
                                  </p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(app.status)}>
                                {app.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No applications yet</p>
                            <p className="text-xs">Start by browsing programs</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Applications</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button asChild>
                      <Link to="/search">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        New Application
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                    <p className="text-muted-foreground mb-4">Start your journey by browsing programs and submitting your first application</p>
                    <Button asChild>
                      <Link to="/search">
                        <Search className="mr-2 h-4 w-4" />
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
                                <Globe className="h-4 w-4" />
                                {app.program.university.name} • {app.program.university.city}, {app.program.university.country}
                              </div>

                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>Intake: {getIntakeLabel(app.intake_month, app.intake_year)}</span>
                                </div>
                                <div>
                                  Applied: {new Date(app.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                              <Badge className={getStatusColor(app.status)}>
                                {app.status.replace('_', ' ')}
                              </Badge>
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
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">No pending tasks at the moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <Card key={task.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{task.title}</h3>
                                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Due: {new Date(task.due_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {task.status.replace('_', ' ')}
                              </Badge>
                              <Button variant="outline" size="sm">
                                Mark Complete
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
