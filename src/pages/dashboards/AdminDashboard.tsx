import { useEffect, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
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
import { AIPerformanceDashboardSection } from "@/components/landing/AIPerformanceDashboardSection";

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

  const metricCards = [
    {
      key: 'students',
      label: 'Total Students',
      value: metrics.totalStudents,
      icon: Users,
      iconClassName: 'text-blue-500',
      destination: '/admin/users',
    },
    {
      key: 'applications',
      label: 'Total Applications',
      value: metrics.totalApplications,
      icon: FileText,
      iconClassName: 'text-green-500',
      destination: '/admin/admissions',
    },
    {
      key: 'universities',
      label: 'Partner Universities',
      value: metrics.partnerUniversities,
      icon: Building2,
      iconClassName: 'text-purple-500',
      destination: '/admin/universities',
    },
    {
      key: 'agents',
      label: 'Agents',
      value: metrics.agents,
      icon: UserCog,
      iconClassName: 'text-orange-500',
      destination: '/admin/agents',
    },
    {
      key: 'revenue',
      label: 'Revenue',
      value: metrics.revenue,
      icon: Wallet,
      iconClassName: 'text-emerald-500',
      prefix: '$',
      destination: '/admin/payments',
    },
  ];

  const handleMetricNavigation = (path: string) => navigate(path);

  const handleMetricKeyDown = (event: KeyboardEvent<HTMLDivElement>, path: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleMetricNavigation(path);
    }
  };

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
    <div className="space-y-8">
      <BackButton variant="ghost" size="sm" fallback="/admin" />
        
        {/* Header */}
        <div className="space-y-1.5 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Manage the UniDoxia platform
          </p>
        </div>

        {/* Quick Stats - Metrics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {metricCards.map(({ key, label, value, icon: Icon, iconClassName, prefix, destination }) => {
            const displayValue = loading ? '...' : `${prefix ?? ''}${value.toLocaleString()}`;
            return (
              <Card
                key={key}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${label}`}
                onClick={() => handleMetricNavigation(destination)}
                onKeyDown={(event) => handleMetricKeyDown(event, destination)}
                className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{label}</p>
                      <p className="text-2xl font-bold">{displayValue}</p>
                    </div>
                    <Icon className={cn('h-8 w-8', iconClassName)} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <AIPerformanceDashboardSection />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex w-full flex-col gap-2 overflow-x-auto rounded-xl sm:flex-row sm:flex-wrap lg:flex-nowrap">
            <TabsTrigger value="overview" className="flex min-w-[140px] flex-1 items-center justify-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex min-w-[140px] flex-1 items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex min-w-[140px] flex-1 items-center justify-center gap-2">
              <FileText className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex min-w-[140px] flex-1 items-center justify-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex min-w-[140px] flex-1 items-center justify-center gap-2">
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
  );
}
