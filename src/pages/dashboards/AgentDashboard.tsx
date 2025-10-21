import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, DollarSign, TrendingUp, Share2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';

export default function AgentDashboard() {
  const stats = [
    { title: 'Total Students', value: '24', icon: Users, trend: { value: 12, isPositive: true } },
    { title: 'Active Applications', value: '38', icon: FileText, trend: { value: 8, isPositive: true } },
    { title: 'Total Earnings', value: '$12,450', icon: DollarSign, description: 'This month' },
    { title: 'Conversion Rate', value: '68%', icon: TrendingUp, trend: { value: 5, isPositive: true } },
  ];

  const recentStudents = [
    { id: '1', name: 'John Smith', applications: 3, status: 'screening', joinedDays: 5 },
    { id: '2', name: 'Sarah Johnson', applications: 2, status: 'conditional_offer', joinedDays: 12 },
    { id: '3', name: 'Michael Chen', applications: 4, status: 'submitted', joinedDays: 8 },
  ];

  const pipelineStats = [
    { stage: 'Draft', count: 5 },
    { stage: 'Submitted', count: 12 },
    { stage: 'Screening', count: 8 },
    { stage: 'Offers', count: 7 },
    { stage: 'Enrolled', count: 6 },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Agent Dashboard</h1>
          <p className="text-muted-foreground">Manage your students and track commissions</p>
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
              <Link to="/dashboard/students">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Student
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/referrals">
                <Share2 className="mr-2 h-4 w-4" />
                Generate Referral
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/earnings">
                <DollarSign className="mr-2 h-4 w-4" />
                View Earnings
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Students */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Students</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/students">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {student.applications} applications • Joined {student.joinedDays}d ago
                      </p>
                    </div>
                    <StatusBadge status={student.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Application Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineStats.map((item) => (
                  <div key={item.stage} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.stage}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(item.count / 38) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">$4,200</p>
                <p className="text-xs text-muted-foreground mt-1">8 applications</p>
              </div>
              <div className="p-4 border rounded-lg bg-success/10 border-success/20">
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-success">$8,250</p>
                <p className="text-xs text-muted-foreground mt-1">15 applications</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">$45,600</p>
                <p className="text-xs text-muted-foreground mt-1">Lifetime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
