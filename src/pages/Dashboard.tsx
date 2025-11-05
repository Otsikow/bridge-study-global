import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/LoadingState';
import StudentDashboard from '@/pages/dashboards/StudentDashboard';
import AgentDashboard from '@/pages/dashboards/AgentDashboard';
import PartnerDashboard from '@/pages/dashboards/PartnerDashboard';
import StaffDashboard from '@/pages/dashboards/StaffDashboard';
import { EmptyState } from '@/components/EmptyState';
import { LogIn, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading your dashboard..." size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <EmptyState
          icon={<LogIn className="h-8 w-8" />}
          title="Sign in to view your dashboard"
          description="Access personalized tasks, applications, and recommendations after signing in."
          action={{ label: 'Go to login', onClick: () => navigate('/auth/login') }}
        />
      </div>
    );
  }

  if (profile.role === 'student') return <StudentDashboard />;
  if (profile.role === 'agent') return <AgentDashboard />;
  if (profile.role === 'partner') return <PartnerDashboard />;
  if (profile.role === 'staff' || profile.role === 'admin') return <StaffDashboard />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <EmptyState
        icon={<HelpCircle className="h-8 w-8" />}
        title="Role not supported yet"
        description="We couldn't determine which dashboard to show for your account. Please contact support for assistance."
      />
    </div>
  );
};

export default Dashboard;