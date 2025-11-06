import BackButton from "@/components/BackButton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import ResourceHub from "@/components/agent/ResourceHub";

export default function AgentResourcesPage() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Resource Hub</h1>
          <p className="text-sm text-muted-foreground">
            Explore curated guides, tools, and learning materials tailored to support your agent workflow.
          </p>
        </div>

        <ResourceHub />
      </div>
    </DashboardLayout>
  );
}
