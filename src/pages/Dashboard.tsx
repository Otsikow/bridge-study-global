import { useAuth } from '@/hooks/useAuth';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { LoadingState } from '@/components/LoadingState';
import StudentDashboard from '@/pages/dashboards/StudentDashboard';
import AgentDashboard from '@/pages/dashboards/AgentDashboard';
import PartnerDashboard from '@/pages/dashboards/PartnerDashboard';
import StaffDashboard from '@/pages/dashboards/StaffDashboard';
import { EmptyState } from '@/components/EmptyState';
import { LogIn, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROLE_PRIORITY: AppRole[] = ['admin', 'staff', 'partner', 'agent', 'student'];

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading, error: rolesError } = useUserRoles();
  const navigate = useNavigate();

  const loading = authLoading || rolesLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading your dashboard..." size="lg" />
      </div>
    );
  }

  if (!user) {
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

  if (rolesError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <EmptyState
          icon={<HelpCircle className="h-8 w-8" />}
          title="Unable to verify permissions"
          description="We couldn't load your access rights. Please refresh the page or contact support if the issue persists."
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <EmptyState
          icon={<HelpCircle className="h-8 w-8" />}
          title="Profile not found"
          description="We couldn't load your profile information. Try signing in again or contact support for help."
          action={{ label: 'Go to login', onClick: () => navigate('/auth/login') }}
        />
      </div>
    );
  }

  const resolvedRole = ROLE_PRIORITY.find((role) => roles.includes(role));

  if (resolvedRole === 'student') return <StudentDashboard />;
  if (resolvedRole === 'agent') return <AgentDashboard />;
  if (resolvedRole === 'partner') return <PartnerDashboard />;
  if (resolvedRole === 'staff' || resolvedRole === 'admin') return <StaffDashboard />;

  const fallbackDescription = roles.length === 0
    ? "We couldn't find any roles associated with your account. Please contact support for assistance."
    : "We couldn't determine which dashboard to show for your account. Please contact support for assistance.";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <EmptyState
        icon={<HelpCircle className="h-8 w-8" />}
        title="Role not supported yet"
        description={fallbackDescription}
      />
    </div>
  );
};

export default Dashboard;