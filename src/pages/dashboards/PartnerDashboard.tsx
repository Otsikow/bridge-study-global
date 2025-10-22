import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, Upload, FileCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import BackButton from '@/components/BackButton';

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const stats = [
    { title: 'New Applications', value: '28', icon: FileText, description: 'This month' },
    { title: 'Pending Review', value: '12', icon: Clock, description: 'Awaiting action' },
    { title: 'Offers Sent', value: '45', icon: CheckCircle, trend: { value: 18, isPositive: true } },
    { title: 'Conversion Rate', value: '72%', icon: TrendingUp, trend: { value: 5, isPositive: true } },
  ];

  const pendingApplications = [
    {
      id: '1',
      student: 'John Smith',
      program: 'MSc Computer Science',
      submitted: '2 days ago',
      status: 'screening',
    },
    {
      id: '2',
      student: 'Sarah Johnson',
      program: 'MBA',
      submitted: '5 days ago',
      status: 'submitted',
    },
    {
      id: '3',
      student: 'Michael Chen',
      program: 'MA International Business',
      submitted: '1 week ago',
      status: 'screening',
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Partner Dashboard</h1>
          <p className="text-muted-foreground">University of Manchester</p>
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
              <Link to="/dashboard/offers">
                <FileCheck className="mr-2 h-4 w-4" />
                Manage Offers
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/requests">
                <Upload className="mr-2 h-4 w-4" />
                Document Requests
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pending Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Applications</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/applications">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="space-y-1">
                    <h3 className="font-semibold">{app.student}</h3>
                    <p className="text-sm text-muted-foreground">{app.program}</p>
                    <p className="text-xs text-muted-foreground">Submitted: {app.submitted}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    <Button size="sm">Review</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Application Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Application Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { stage: 'Submitted', count: 12, color: 'bg-info' },
                { stage: 'Under Review', count: 8, color: 'bg-warning' },
                { stage: 'Conditional Offer', count: 15, color: 'bg-warning' },
                { stage: 'Unconditional Offer', count: 10, color: 'bg-success' },
                { stage: 'CAS Issued', count: 8, color: 'bg-primary' },
              ].map((item) => (
                <div key={item.stage} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.stage}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full`}
                        style={{ width: `${(item.count / 53) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: 'Conditional offer sent', student: 'John Smith', time: '1 hour ago' },
                { action: 'Documents verified', student: 'Sarah Johnson', time: '3 hours ago' },
                { action: 'CAS letter issued', student: 'Michael Chen', time: '5 hours ago' },
                { action: 'Additional documents requested', student: 'Emily Davis', time: '1 day ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.student} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
