import { useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import PerformanceMetrics from "@/components/agent/PerformanceMetrics";
import LeadsList from "@/components/agent/LeadsList";
import ResourceHub from "@/components/agent/ResourceHub";
import CommissionTracker from "@/components/agent/CommissionTracker";
import TaskManager from "@/components/ai/TaskManager";
import BulkImport from "@/components/agent/BulkImport";
import ApplicationTrackingSystem from "@/components/ats/ApplicationTrackingSystem";
import TaskManagement from "@/components/tasks/TaskManagement";
import PreferenceRanking from "@/components/ranking/PreferenceRanking";
import CommissionManagement from "@/components/commission/CommissionManagement";

import {
  LayoutDashboard,
  Users,
  FolderOpen,
  BarChart3,
  ClipboardList,
  Star,
  DollarSign,
  CheckSquare,
  Upload,
} from "lucide-react";
import BackButton from '@/components/BackButton';

export default function AgentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const validTabs = [
    "overview",
    "applications",
    "leads",
    "tasks",
    "ranking",
    "commissions",
    "import",
    "resources",
  ] as const;

  const pathSegment = location.pathname.split("/")[2] || "overview";
  const currentTab = (validTabs as readonly string[]).includes(pathSegment)
    ? pathSegment
    : "overview";

  const handleTabChange = (value: string) => {
    if (value === "overview") navigate("/dashboard");
    else navigate(`/dashboard/${value}`);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-8">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Partner Agent Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your students, track performance, and access resources.</p>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Leads
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Resources
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <PerformanceMetrics />
          </TabsContent>

          {/* Applications */}
          <TabsContent value="applications">
            <ApplicationTrackingSystem />
          </TabsContent>

          {/* Leads */}
          <TabsContent value="leads">
            <LeadsList />
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
      </div>
    </DashboardLayout>
  );
}
