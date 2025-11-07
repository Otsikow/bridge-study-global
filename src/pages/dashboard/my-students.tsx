import { DashboardLayout } from "@/components/layout/DashboardLayout";
import BackButton from "@/components/BackButton";
import AgentStudentsManager from "@/components/agent/AgentStudentsManager";

export default function AgentStudentsPage() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />
        <AgentStudentsManager />
      </div>
    </DashboardLayout>
  );
}
