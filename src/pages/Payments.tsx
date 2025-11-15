import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { StudentPayments } from '@/components/payments/StudentPayments';
import { AgentPayments } from '@/components/payments/AgentPayments';
import { LoadingState } from '@/components/LoadingState';

export default function Payments() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <LoadingState message="Loading payments..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        {profile?.role === 'student' ? <StudentPayments /> : <AgentPayments />}
      </div>
    </DashboardLayout>
  );
}
