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

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-8">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />

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
            <TabsList
              className="flex w-full items-center gap-2 overflow-x-auto rounded-xl border bg-muted/40 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-muted/60"
            >

              <TabsTrigger value="overview" className="flex items-center gap-2 whitespace-nowrap">
                <IconTooltip label="View your dashboard overview">
                  <LayoutDashboard className="h-4 w-4" />
                </IconTooltip>
                Overview
              </TabsTrigger>

              <TabsTrigger value="applications" className="flex items-center gap-2 whitespace-nowrap">
                <IconTooltip label="Review application progress">
                  <BarChart3 className="h-4 w-4" />
                </IconTooltip>
                Applications
              </TabsTrigger>

              <TabsTrigger value="leads" className="flex items-center gap-2 whitespace-nowrap">
                <IconTooltip label="Manage your leads">
                  <Users className="h-4 w-4" />
                </IconTooltip>
                My Leads
              </TabsTrigger>

              <TabsTrigger value="students" className="flex items-center gap-2 whitespace-nowrap">
                <IconTooltip label="View your student list">
                  <GraduationCap className="h-4 w-4" />
                </IconTooltip>
                Students
              </TabsTrigger>

              <TabsTrigger value="tasks" className="flex items-center gap-2 whitespace-nowrap">
                <IconTooltip label="View your assigned tasks">
                  <ClipboardList className="h-4 w-4" />
                </IconTooltip>
                Tasks
              </TabsTrigger>

              <TabsTrigger value="ranking" className="flex items-center gap-2 whitespace-nowrap">
                <IconTooltip label="Manage preference rankings">
                  <Star className="h-4 w-4" />
                </IconTooltip>
                Ranking
              </TabsTrigger>

              <TabsTrigger value="commissions" className="flex items-center gap-2 whitespace-nowrap">
                <IconTooltip label="Track commission earnings">
                  <DollarSign className="h-4 w-4" />
                </IconTooltip>
                Commissions
              </TabsTrigger>

              <TabsTrigger value="import" className="flex items-center gap-2 whitespace-nowrap">
                <IconTooltip label="Bulk import students">
                  <Upload className="h-4 w-4" />
                </IconTooltip>
                Import
              </TabsTrigger>

              <TabsTrigger value="partners" className="flex items-center gap-2 whitespace-nowrap">
                <IconTooltip label="Discover universities to partner with">
                  <Handshake className="h-4 w-4" />
                </IconTooltip>
                Partners
              </TabsTrigger>

              <TabsTrigger value="resources" className="flex items-center gap-2 whitespace-nowrap">
                <IconTooltip label="Browse helpful resources">
                  <FolderOpen className="h-4 w-4" />
                </IconTooltip>
                Resources
              </TabsTrigger>
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
    </DashboardLayout>
  );
}
