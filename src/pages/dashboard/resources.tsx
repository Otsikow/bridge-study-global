import BackButton from "@/components/BackButton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import StaffResourceCenter from "@/components/staff/StaffResourceCenter";

export default function AgentResourcesPage() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Resource Centre</h1>
          <p className="text-sm text-muted-foreground">
            Access categorized staff documents, apply filters, and get AI summaries tailored to your tasks.
          </p>
        </div>

        <StaffResourceCenter />
      </div>
    </DashboardLayout>
  );
}
