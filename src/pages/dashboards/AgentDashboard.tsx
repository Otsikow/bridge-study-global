import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PerformanceMetrics from '@/components/agent/PerformanceMetrics';
import LeadsList from '@/components/agent/LeadsList';
import ResourceHub from '@/components/agent/ResourceHub';
import { LayoutDashboard, Users, FolderOpen } from 'lucide-react';

export default function AgentDashboard() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Partner Agent Dashboard</h1>
          <p className="text-muted-foreground">Manage your students, track performance, and access resources</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Leads
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PerformanceMetrics />
          </TabsContent>

          <TabsContent value="leads">
            <LeadsList />
          </TabsContent>

          <TabsContent value="resources">
            <ResourceHub />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
