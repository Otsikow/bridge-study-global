import { useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AgentDashboardOverview from "@/components/agent/AgentDashboardOverview";
import AgentStudentsManager from "@/components/agent/AgentStudentsManager";
import LeadsList from "@/components/agent/LeadsList";
import ResourceHub from "@/components/agent/ResourceHub";
import CommissionTracker from "@/components/agent/CommissionTracker";
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
} from "lucide-react";
import BackButton from '@/components/BackButton';

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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Partner Agent Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Manage your students, track performance, and access resources.</p>
        </div>

        <TooltipProvider delayDuration={100}>
          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <IconTooltip label="View your dashboard overview">
                  <LayoutDashboard className="h-4 w-4" />
                </IconTooltip>
                Overview
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <IconTooltip label="Review application progress">
                  <BarChart3 className="h-4 w-4" />
                </IconTooltip>
                Applications
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex items-center gap-2">
                <IconTooltip label="Manage your leads list">
                  <Users className="h-4 w-4" />
                </IconTooltip>
                My Leads
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-2">
                <IconTooltip label="See your assigned students">
                  <GraduationCap className="h-4 w-4" />
                </IconTooltip>
                Students
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <IconTooltip label="Check your open tasks">
                  <ClipboardList className="h-4 w-4" />
                </IconTooltip>
                Tasks
              </TabsTrigger>
              <TabsTrigger value="ranking" className="flex items-center gap-2">
                <IconTooltip label="Adjust student ranking preferences">
                  <Star className="h-4 w-4" />
                </IconTooltip>
                Ranking
              </TabsTrigger>
              <TabsTrigger value="commissions" className="flex items-center gap-2">
                <IconTooltip label="Track commission earnings">
                  <DollarSign className="h-4 w-4" />
                </IconTooltip>
                Commissions
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <IconTooltip label="Import student data">
                  <Upload className="h-4 w-4" />
                </IconTooltip>
                Import
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <IconTooltip label="Browse helpful resources">
                  <FolderOpen className="h-4 w-4" />
                </IconTooltip>
                Resources
              </TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-6">
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

          {/* Bulk Import */}
          <TabsContent value="import">
            <BulkImport />
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
