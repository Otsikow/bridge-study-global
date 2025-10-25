import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import StudentDashboard from '@/pages/dashboards/StudentDashboard';
import AgentDashboard from '@/pages/dashboards/AgentDashboard';
import PartnerDashboard from '@/pages/dashboards/PartnerDashboard';
import StaffDashboard from '@/pages/dashboards/StaffDashboard';

const Dashboard = () => {
  const { profile, loading } = useAuth();

  // Show loading state while profile is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading your dashboard..." size="lg" />
      </div>
    );
  }

  // Route to the full-featured dashboards per role
  if (profile?.role === 'student') return <StudentDashboard />;
  if (profile?.role === 'agent') return <AgentDashboard />;
  if (profile?.role === 'partner') return <PartnerDashboard />;
  if (profile?.role === 'staff' || profile?.role === 'admin') return <StaffDashboard />;

  return <DefaultDashboard />;
};

const DefaultDashboard = () => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <p className="text-center text-muted-foreground">Loading dashboard...</p>
      </CardContent>
    </Card>
  </div>
);

export default Dashboard;