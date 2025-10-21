import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  BookOpen,
  Activity,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const stats = [
    { title: 'Total Students', value: '1,245', icon: Users, trend: { value: 12.5, isPositive: true } },
    { title: 'Active Applications', value: '3,892', icon: FileText, trend: { value: 8.2, isPositive: true } },
    { title: 'Universities', value: '156', icon: Building2, description: '12 pending approval' },
    { title: 'Revenue (MTD)', value: '$248K', icon: DollarSign, trend: { value: 15.3, isPositive: true } },
  ];

  const recentActivities = [
    { id: '1', action: 'New university added', user: 'Admin', time: '5 min ago', type: 'success' },
    { id: '2', action: 'Application submitted', user: 'John Smith', time: '12 min ago', type: 'info' },
    { id: '3', action: 'Payment received', user: 'Sarah Johnson', time: '1 hour ago', type: 'success' },
    { id: '4', action: 'Document verification required', user: 'Michael Chen', time: '2 hours ago', type: 'warning' },
  ];

  const systemAlerts = [
    { message: '3 universities pending approval', severity: 'warning' },
    { message: '12 documents awaiting verification', severity: 'info' },
    { message: 'System backup completed successfully', severity: 'success' },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage the entire GEG platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {systemAlerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'warning'
                      ? 'bg-warning/10 border-warning/20'
                      : alert.severity === 'success'
                      ? 'bg-success/10 border-success/20'
                      : 'bg-info/10 border-info/20'
                  }`}
                >
                  {alert.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <Button asChild className="w-full">
              <Link to="/dashboard/users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/dashboard/universities">
                <Building2 className="mr-2 h-4 w-4" />
                Universities
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/dashboard/programs">
                <BookOpen className="mr-2 h-4 w-4" />
                Programs
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/dashboard/analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-accent rounded-lg transition-colors">
                    <div className={`h-2 w-2 rounded-full mt-2 ${
                      activity.type === 'success' ? 'bg-success' :
                      activity.type === 'warning' ? 'bg-warning' :
                      'bg-info'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Active Agents</p>
                  <p className="text-2xl font-bold">324</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Partners</p>
                  <p className="text-2xl font-bold">156</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Programs</p>
                  <p className="text-2xl font-bold">2,456</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">89%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commission Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">$142K</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-success">$89K</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold">$524K</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Clawback</p>
                <p className="text-2xl font-bold text-destructive">$12K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
