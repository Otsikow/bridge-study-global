import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { useUserRoles } from '@/hooks/useUserRoles';
import PartnerApplications from '@/pages/dashboard/PartnerApplications';
import StaffApplications from '@/pages/dashboard/StaffApplications';

const ApplicationsRouter = () => {
  const { primaryRole, loading, error } = useUserRoles();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <LoadingState message="Loading applications workspace..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <EmptyState
            title="Unable to load applications"
            description="We couldn't confirm your access level. Please refresh or contact support if the issue persists."
          />
        </div>
      </DashboardLayout>
    );
  }

  if (primaryRole === 'partner') {
    return <PartnerApplications />;
  }

  return <StaffApplications />;
};

export default ApplicationsRouter;
