import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckCircle, AlertCircle, GraduationCap, User, BarChart3, ClipboardList, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import ApplicationTrackingSystem from '@/components/ats/ApplicationTrackingSystem';
import TaskManagement from '@/components/tasks/TaskManagement';
import PreferenceRanking from '@/components/ranking/PreferenceRanking';

export default function StudentDashboard() {
  const { profile } = useAuth();

  const stats = [
    { 
      title: 'Profile Completeness', 
      value: '60%', 
      icon: CheckCircle, 
      description: '3 of 5 steps complete',
      iconColor: 'text-muted-foreground'
    },
    { 
      title: 'Active Applications', 
      value: '0', 
      icon: FileText, 
      description: 'Start browsing programs',
      iconColor: 'text-muted-foreground'
    },
    { 
      title: 'Documents Uploaded', 
      value: '0', 
      icon: AlertCircle, 
      description: 'Upload key documents',
      iconColor: 'text-warning',
      valueColor: 'text-warning'
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || 'Student'}!</h1>
          <p className="text-muted-foreground">Student Dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
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
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Ranking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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

              {/* Getting Started Guide */}
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                      <p className="text-sm">
                        Complete your profile with personal details, education history, and test scores
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                      <p className="text-sm">
                        Upload required documents like passport and transcripts
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                      <p className="text-sm">
                        Browse and apply to programs that match your goals
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationTrackingSystem />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskManagement />
          </TabsContent>

          <TabsContent value="ranking">
            <PreferenceRanking />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
