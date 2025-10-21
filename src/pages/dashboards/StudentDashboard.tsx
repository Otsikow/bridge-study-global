import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, AlertCircle, Search, Upload, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const stats = [
    { title: 'Active Applications', value: '3', icon: FileText, description: 'In progress' },
    { title: 'Offers Received', value: '1', icon: CheckCircle, description: '1 conditional' },
    { title: 'Pending Documents', value: '2', icon: Upload, description: 'Action required' },
    { title: 'Messages', value: '5', icon: AlertCircle, description: '2 unread' },
  ];

  const recentApplications = [
    {
      id: '1',
      program: 'MSc Computer Science',
      university: 'University of Manchester',
      status: 'screening',
      intake: 'Sep 2025',
    },
    {
      id: '2',
      program: 'MBA',
      university: 'Imperial College London',
      status: 'conditional_offer',
      intake: 'Jan 2026',
    },
    {
      id: '3',
      program: 'MA International Business',
      university: 'University of Toronto',
      status: 'submitted',
      intake: 'Sep 2025',
    },
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
          <h1 className="text-3xl font-bold">Welcome Back!</h1>
          <p className="text-muted-foreground">Track your applications and continue your journey</p>
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
              <Link to="/dashboard/programs">
                <Search className="mr-2 h-4 w-4" />
                Browse Programs
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/applications">
                <FileText className="mr-2 h-4 w-4" />
                View Applications
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/documents">
                <Upload className="mr-2 h-4 w-4" />
                Upload Documents
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Applications</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/applications">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="space-y-1">
                    <h3 className="font-semibold">{app.program}</h3>
                    <p className="text-sm text-muted-foreground">{app.university}</p>
                    <p className="text-xs text-muted-foreground">Intake: {app.intake}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <h4 className="font-medium">Upload Missing Documents</h4>
                  <p className="text-sm text-muted-foreground">
                    2 applications require additional documents
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-info/10 border border-info/20 rounded-lg">
                <Clock className="h-5 w-5 text-info mt-0.5" />
                <div>
                  <h4 className="font-medium">Review Conditional Offer</h4>
                  <p className="text-sm text-muted-foreground">
                    Imperial College London - Respond by March 15, 2025
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
