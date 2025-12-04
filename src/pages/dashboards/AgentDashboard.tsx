import { useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AgentDashboardOverview from "@/components/agent/AgentDashboardOverview";
import AgentStudentsManager from "@/components/agent/AgentStudentsManager";
import LeadsList from "@/components/agent/LeadsList";
import ResourceHub from "@/components/agent/ResourceHub";
import CommissionTracker from "@/components/agent/CommissionTracker";
import { AgentPartnerDiscovery } from "@/components/agent/AgentPartnerDiscovery";
import TaskManager from "@/components/ai/TaskManager";
import BulkImport from "@/components/agent/BulkImport";
import ApplicationTrackingSystem from "@/components/ats/ApplicationTrackingSystem";
import TaskManagement from "@/components/tasks/TaskManagement";
import PreferenceRanking from "@/components/ranking/PreferenceRanking";
import CommissionManagement from "@/components/commission/CommissionManagement";
import { IconTooltip } from "@/components/agent/IconTooltip";
import { TooltipProvider } from "@/components/ui/tooltip";

import {
  LayoutDashboard,
  Users,
  FolderOpen,
  BarChart3,
  ClipboardList,
  Star,
  DollarSign,
  Upload,
  GraduationCap,
  Handshake,
} from "lucide-react";

import BackButton from "@/components/BackButton";
import { cn } from "@/lib/utils";

const tabItems = [
  {
    value: "overview" as const,
    label: "Overview",
    description: "Snapshot of performance",
    icon: LayoutDashboard,
    tooltip: "View your dashboard overview",
  },
  {
    value: "applications" as const,
    label: "Applications",
    description: "Monitor student progress",
    icon: BarChart3,
    tooltip: "Review application progress",
  },
  {
    value: "leads" as const,
    label: "My Leads",
    description: "Convert prospects faster",
    icon: Users,
    tooltip: "Manage your leads",
  },
  {
    value: "students" as const,
    label: "Students",
    description: "Stay close to advisees",
    icon: GraduationCap,
    tooltip: "View your student list",
  },
  {
    value: "tasks" as const,
    label: "Tasks",
    description: "Prioritized action items",
    icon: ClipboardList,
    tooltip: "View your assigned tasks",
  },
  {
    value: "ranking" as const,
    label: "Ranking",
    description: "Preference management",
    icon: Star,
    tooltip: "Manage preference rankings",
  },
  {
    value: "commissions" as const,
    label: "Commissions",
    description: "Track earnings",
    icon: DollarSign,
    tooltip: "Track commission earnings",
  },
  {
    value: "import" as const,
    label: "Import",
    description: "Bulk upload pipelines",
    icon: Upload,
    tooltip: "Bulk import students",
  },
  {
    value: "partners" as const,
    label: "Partners",
    description: "Discover new schools",
    icon: Handshake,
    tooltip: "Discover universities to partner with",
  },
  {
    value: "resources" as const,
    label: "Resources",
    description: "Guides and templates",
    icon: FolderOpen,
    tooltip: "Browse helpful resources",
  },
];

export default function AgentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const validTabs = [
    "overview",
    "applications",
    "leads",
    "students",
    "tasks",
    "ranking",
    "commissions",
    "import",
    "partners",
    "resources",
  ] as const;

  const tabToPath: Record<(typeof validTabs)[number], string> = {
    overview: "/dashboard",
    applications: "/dashboard/applications",
    leads: "/dashboard/leads",
    students: "/dashboard/students",
    tasks: "/dashboard/tasks",
    ranking: "/dashboard/ranking",
    commissions: "/dashboard/commissions",
    import: "/dashboard/import",
    partners: "/dashboard/partners",
    resources: "/dashboard/resources",
  };

  const pathToTab: Record<string, (typeof validTabs)[number]> = {
    overview: "overview",
    applications: "applications",
    leads: "leads",
    "my-leads": "leads",
    students: "students",
    "my-students": "students",
    tasks: "tasks",
    ranking: "ranking",
    "my-ranking": "ranking",
    commissions: "commissions",
    import: "import",
    partners: "partners",
    resources: "resources",
  };

  const pathSegment = location.pathname.split("/")[2] || "overview";
  const currentTab = pathToTab[pathSegment] ?? "overview";

  const handleTabChange = (value: (typeof validTabs)[number]) => {
    const targetPath = tabToPath[value] ?? `/dashboard/${value}`;
    navigate(targetPath);
  };

  const tabButtonClassName = cn(
    "group flex h-full items-start gap-3 rounded-lg border border-border bg-background/60 px-3 py-3 text-left",
    "shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md",
    "data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
    "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
  );

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BackButton variant="ghost" size="sm" fallback="/dashboard" />
            <div className="text-xs text-muted-foreground sm:text-sm">
              Quick navigation is available via the tabs below.
            </div>
          </div>

          {/* Header */}
          <div className="space-y-1.5 animate-fade-in">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Partner Agent Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Manage your students, track performance, and access resources.
            </p>
          </div>

          <TooltipProvider delayDuration={100}>
            <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {tabItems.map(({ value, label, icon: Icon, description, tooltip }) => (
                  <TabsTrigger key={value} value={value} className={tabButtonClassName}>
                    <IconTooltip label={tooltip}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-data-[state=active]:bg-primary/20">
                        <Icon className="h-5 w-5" />
                      </div>
                    </IconTooltip>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-sm font-semibold leading-tight md:text-base">{label}</span>
                      <span className="text-xs text-muted-foreground">{description}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview">
                <AgentDashboardOverview />
              </TabsContent>

              {/* Applications */}
              <TabsContent value="applications">
                <ApplicationTrackingSystem />
              </TabsContent>

              {/* Leads */}
              <TabsContent value="leads">
                <LeadsList />
              </TabsContent>

              {/* Students */}
              <TabsContent value="students">
                <AgentStudentsManager />
              </TabsContent>

              {/* Tasks */}
              <TabsContent value="tasks">
                <TaskManager />
                <TaskManagement />
              </TabsContent>

              {/* Ranking */}
              <TabsContent value="ranking">
                <PreferenceRanking />
              </TabsContent>

              {/* Commissions */}
              <TabsContent value="commissions">
                <CommissionTracker />
                <CommissionManagement />
              </TabsContent>

              {/* Import */}
              <TabsContent value="import">
                <BulkImport />
              </TabsContent>

              {/* Partners */}
              <TabsContent value="partners">
                <AgentPartnerDiscovery />
              </TabsContent>

              {/* Resources */}
              <TabsContent value="resources">
                <ResourceHub />
              </TabsContent>
            </Tabs>
          </TooltipProvider>
        </div>
      </div>
    </DashboardLayout>
  );
}
