import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PerformanceMetrics from '@/components/agent/PerformanceMetrics';
import LeadsList from '@/components/agent/LeadsList';
import ResourceHub from '@/components/agent/ResourceHub';
import CommissionTracker from '@/components/agent/CommissionTracker';
import TaskManager from '@/components/ai/TaskManager';
import BulkImport from '@/components/agent/BulkImport';
import { LayoutDashboard, Users, FolderOpen, ArrowLeft, DollarSign, CheckSquare, Bell, Upload } from 'lucide-react';

export default function AgentDashboard() {
  const navigate = useNavigate();
  
  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Partner Agent Dashboard</h1>
          <p className="text-muted-foreground">Manage your students, track performance, and access resources</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Leads
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tasks
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

          <TabsContent value="overview" className="space-y-6">
            <PerformanceMetrics />
          </TabsContent>

          <TabsContent value="leads">
            <LeadsList />
          </TabsContent>

          <TabsContent value="commissions">
            <CommissionTracker />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskManager />
          </TabsContent>

          <TabsContent value="import">
            <BulkImport />
          </TabsContent>

          <TabsContent value="resources">
            <ResourceHub />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
