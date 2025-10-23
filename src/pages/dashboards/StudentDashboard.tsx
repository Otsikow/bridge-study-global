import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  CheckCircle,
  Bell,
  Clock,
  TrendingUp,
  Search,
  BarChart3,
  ClipboardList,
  Star,
  MessageSquare,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage, logError, formatErrorForToast } from '@/lib/errorUtils';
import ProactiveAssistant from '@/components/ai/ProactiveAssistant';
import ApplicationTrackingSystem from '@/components/ats/ApplicationTrackingSystem';
import TaskManagement from '@/components/tasks/TaskManagement';
import PreferenceRanking from '@/components/ranking/PreferenceRanking';
import MessagesWidget from '@/components/student/MessagesWidget';
import MessagesDashboard from '@/components/messages/MessagesDashboard';

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
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!studentData) return;

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

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', user.id)
        .in('status', ['open', 'in_progress'])
        .order('due_at', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id, created_at, sender_id')
        .in('application_id', appsData?.map(app => app.id) || [])
        .order('created_at', { ascending: false });

      if (!messagesError && messagesData) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentMessages = messagesData.filter(
          msg =>
            new Date(msg.created_at || 0) > sevenDaysAgo &&
            msg.sender_id !== user.id
        );
        setUnreadMessages(recentMessages.length);
      }
    } catch (error) {
      logError(error, 'StudentDashboard.fetchDashboardData');
      toast(formatErrorForToast(error, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Profile Completeness',
      value: '75%',
      icon: CheckCircle,
      description: '4 of 5 steps complete',
      iconColor: 'text-success',
      valueColor: 'text-success',
    },
    {
      title: 'Active Applications',
      value: applications.length.toString(),
      icon: FileText,
      description:
        applications.length > 0
          ? 'Applications in progress'
          : 'Start browsing programs',
      iconColor:
        applications.length > 0 ? 'text-info' : 'text-muted-foreground',
      valueColor: applications.length > 0 ? 'text-info' : '',
    },
    {
      title: 'Pending Tasks',
      value: tasks.length.toString(),
      icon: Clock,
      description:
        tasks.length > 0 ? 'Tasks need attention' : 'All caught up!',
      iconColor: tasks.length > 0 ? 'text-warning' : 'text-success',
      valueColor: tasks.length > 0 ? 'text-warning' : 'text-success',
    },
    {
      title: 'Offers Received',
      value: applications
        .filter(
          a =>
            a.status === 'conditional_offer' ||
            a.status === 'unconditional_offer'
        )
        .length.toString(),
      icon: TrendingUp,
      description: 'Congratulations!',
      iconColor: 'text-success',
      valueColor: 'text-success',
    },
    {
      title: 'Unread Messages',
      value: unreadMessages.toString(),
      icon: MessageSquare,
      description:
        unreadMessages > 0 ? 'New messages waiting' : 'All caught up!',
      iconColor: unreadMessages > 0 ? 'text-info' : 'text-success',
      valueColor: unreadMessages > 0 ? 'text-info' : 'text-success',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 text-center">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between animate-fade-in">
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">
              Welcome back, {profile?.full_name || 'Student'}!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Track your applications and stay on top of your journey
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hover-scale whitespace-nowrap"
            >
              <Link to="/student/notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hover-scale whitespace-nowrap"
            >
              <Link to="/student/messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Messages</span>
                {unreadMessages > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button asChild size="sm" className="hover-scale whitespace-nowrap">
              <Link to="/search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>Find Programs</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="rounded-xl border shadow-card hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.valueColor}`}>
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

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Applications
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Messages
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Tasks
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-2">
              <Star className="h-4 w-4" /> Ranking
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3 items-stretch">
              <div className="lg:col-span-1 space-y-6 min-w-0">
                <ProactiveAssistant />
                <MessagesWidget />
              </div>
              <div className="lg:col-span-2 min-w-0">
                <ApplicationTrackingSystem />
              </div>
            </div>
          </TabsContent>

          {/* Applications */}
          <TabsContent value="applications">
            <ApplicationTrackingSystem />
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages">
            <MessagesDashboard />
          </TabsContent>

          {/* Tasks */}
          <TabsContent value="tasks">
            <TaskManagement />
          </TabsContent>

          {/* Ranking */}
          <TabsContent value="ranking">
            <PreferenceRanking />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
