import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Users,
  FileText,
  DollarSign,
  Download,
  TrendingUp,
  GraduationCap,
  Building2,
  UserCog,
  Wallet
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import OverviewTab from '@/components/dashboard/OverviewTab';
import UsersTab from '@/components/dashboard/UsersTab';
import ApplicationsTab from '@/components/dashboard/ApplicationsTab';
import PaymentsTab from '@/components/dashboard/PaymentsTab';
import ReportsTab from '@/components/dashboard/ReportsTab';

interface DashboardMetrics {
  totalStudents: number;
  totalApplications: number;
  partnerUniversities: number;
  agents: number;
  revenue: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalStudents: 0,
    totalApplications: 0,
    partnerUniversities: 0,
    agents: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Check if user has admin privileges
  useEffect(() => {
    const checkAccess = async () => {
      if (!profile) return;
      
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id);

      const hasAdminAccess = userRoles?.some(
        (ur) => ur.role === 'admin' || ur.role === 'staff'
      );

      if (!hasAdminAccess) {
        navigate('/dashboard');
      }
    };

    checkAccess();
  }, [profile, navigate]);

  // Fetch dashboard metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);

        // Fetch total students
        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });

        // Fetch total applications
        const { count: applicationsCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true });

        // Fetch partner universities
        const { count: universitiesCount } = await supabase
          .from('universities')
          .select('*', { count: 'exact', head: true })
          .eq('active', true);

        // Fetch agents
        const { count: agentsCount } = await supabase
          .from('agents')
          .select('*', { count: 'exact', head: true })
          .eq('active', true);

        // Fetch revenue from payments
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('amount_cents')
          .eq('status', 'succeeded');

        const totalRevenue = paymentsData?.reduce(
          (sum, payment) => sum + (payment.amount_cents || 0),
          0
        ) || 0;

        setMetrics({
          totalStudents: studentsCount || 0,
          totalApplications: applicationsCount || 0,
          partnerUniversities: universitiesCount || 0,
          agents: agentsCount || 0,
          revenue: totalRevenue / 100, // Convert cents to dollars
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />
        
        {/* Header */}
        <div className="space-y-1.5 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Manage the Global Education Gateway platform
          </p>
        </div>

        {/* Quick Stats - Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : metrics.totalStudents.toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : metrics.totalApplications.toLocaleString()}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Partner Universities</p>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : metrics.partnerUniversities.toLocaleString()}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Agents</p>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : metrics.agents.toLocaleString()}
                  </p>
                </div>
                <UserCog className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">
                    ${loading ? '...' : metrics.revenue.toLocaleString()}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab metrics={metrics} loading={loading} />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsTab />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
