import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckSquare, Users, Clock, AlertCircle, TrendingUp, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import BackButton from '@/components/BackButton';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const stats = [
    { title: 'Assigned Tasks', value: '18', icon: CheckSquare, description: '5 due today' },
    { title: 'Applications to Review', value: '42', icon: FileText, description: '12 urgent' },
    { title: 'Active Students', value: '156', icon: Users, trend: { value: 8, isPositive: true } },
    { title: 'Avg. Processing Time', value: '3.2 days', icon: Clock, trend: { value: 10, isPositive: false } },
  ];

  const myTasks = [
    { id: '1', title: 'Verify transcripts for John Smith', priority: 'high', due: 'Today' },
    { id: '2', title: 'Review application - Sarah Johnson', priority: 'medium', due: 'Tomorrow' },
    { id: '3', title: 'Contact university partner about delays', priority: 'high', due: 'Today' },
    { id: '4', title: 'Process payment confirmation', priority: 'low', due: 'Next week' },
  ];

  const urgentApplications = [
    {
      id: '1',
      student: 'John Smith',
      program: 'MSc Computer Science',
      status: 'screening',
      deadline: '2 days',
    },
    {
      id: '2',
      student: 'Emily Davis',
      program: 'MBA',
      status: 'submitted',
      deadline: '5 days',
    },
    {
      id: '3',
      student: 'Michael Chen',
      program: 'MA International Business',
      status: 'screening',
      deadline: '1 week',
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />
        {/* Header */}
        <div className="space-y-1.5 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Staff Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Manage applications and student support</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/dashboard/applications">
                <FileText className="mr-2 h-4 w-4" />
                Review Applications
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/tasks">
                <CheckSquare className="mr-2 h-4 w-4" />
                My Tasks
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/students">
                <Users className="mr-2 h-4 w-4" />
                Student List
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/blog">
                <Newspaper className="mr-2 h-4 w-4" />
                Manage Blog
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* My Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My Tasks</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/tasks">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 border rounded-lg hover:bg-accent transition-colors ${
                      task.priority === 'high' ? 'border-l-4 border-l-destructive' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">Due: {task.due}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === 'high'
                            ? 'bg-destructive/10 text-destructive'
                            : task.priority === 'medium'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Urgent Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Urgent Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {urgentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm">{app.student}</h3>
                      <p className="text-xs text-muted-foreground">{app.program}</p>
                      <p className="text-xs text-destructive">Deadline: {app.deadline}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {[
                { label: 'Submitted', count: 28, color: 'bg-info' },
                { label: 'Screening', count: 42, color: 'bg-warning' },
                { label: 'Offers', count: 35, color: 'bg-success' },
                { label: 'Visa Stage', count: 18, color: 'bg-accent' },
                { label: 'Enrolled', count: 24, color: 'bg-primary' },
              ].map((status) => (
                <div key={status.label} className="p-4 border rounded-lg">
                  <div className={`h-2 ${status.color} rounded-full mb-2`} />
                  <p className="text-sm text-muted-foreground">{status.label}</p>
                  <p className="text-2xl font-bold">{status.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
