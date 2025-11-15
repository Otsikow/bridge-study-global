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
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <LoadingState message="Loading payments..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative isolate flex min-h-[calc(100vh-8rem)] w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(56,189,248,0.14),_transparent_50%)]" />
        <div className="pointer-events-none absolute -top-24 right-10 -z-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-48 w-48 rounded-full bg-success/10 blur-3xl" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-10">
          {profile?.role === 'student' ? <StudentPayments /> : <AgentPayments />}
        </div>
      </div>
    </DashboardLayout>
  );
}
