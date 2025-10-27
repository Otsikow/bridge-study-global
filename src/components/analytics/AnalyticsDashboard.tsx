import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  DollarSign,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
  Activity,
  Target,
  Award,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalApplications: number;
  activeApplications: number;
  completedApplications: number;
  successRate: number;
  averageProcessingTime: number;
  topCountries: Array<{ name: string; count: number }>;
  topUniversities: Array<{ name: string; count: number }>;
  applicationsByStatus: Array<{ status: string; count: number }>;
  applicationsByMonth: Array<{ month: string; count: number }>;
  conversionFunnel: Array<{ stage: string; count: number; percentage: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function AnalyticsDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Fetch applications data
      let query = supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          submitted_at,
          program:programs (
            name,
            university:universities (
              name,
              country
            )
          )
        `)
        .gte('created_at', startDate.toISOString());

      // Filter by user role
      if (profile?.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('profile_id', user?.id)
          .single();
        
        if (studentData) {
          query = query.eq('student_id', studentData.id);
        }
      } else if (profile?.role === 'agent') {
        const { data: agentData } = await supabase
          .from('agents')
          .select('id')
          .eq('profile_id', user?.id)
          .single();
        
        if (agentData) {
          query = query.eq('agent_id', agentData.id);
        }
      }

      const { data: applications, error } = await query;

      if (error) throw error;

      // Process analytics data
      const totalApplications = applications?.length || 0;
      const activeApplications = applications?.filter(app => 
        ['submitted', 'screening', 'conditional_offer', 'unconditional_offer'].includes(app.status)
      ).length || 0;
      const completedApplications = applications?.filter(app => 
        ['enrolled', 'cas_loa', 'visa'].includes(app.status)
      ).length || 0;
      const successRate = totalApplications > 0 
        ? Math.round((completedApplications / totalApplications) * 100) 
        : 0;

      // Calculate average processing time
      const submittedApps = applications?.filter(app => app.submitted_at) || [];
      const avgTime = submittedApps.length > 0
        ? submittedApps.reduce((sum, app) => {
            const days = Math.floor((new Date().getTime() - new Date(app.submitted_at!).getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / submittedApps.length
        : 0;

      // Top countries
      const countryCount: Record<string, number> = {};
      applications?.forEach(app => {
        const country = app.program?.university?.country || 'Unknown';
        countryCount[country] = (countryCount[country] || 0) + 1;
      });
      const topCountries = Object.entries(countryCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top universities
      const universityCount: Record<string, number> = {};
      applications?.forEach(app => {
        const university = app.program?.university?.name || 'Unknown';
        universityCount[university] = (universityCount[university] || 0) + 1;
      });
      const topUniversities = Object.entries(universityCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Applications by status
      const statusCount: Record<string, number> = {};
      applications?.forEach(app => {
        statusCount[app.status] = (statusCount[app.status] || 0) + 1;
      });
      const applicationsByStatus = Object.entries(statusCount)
        .map(([status, count]) => ({ status, count }));

      // Applications by month
      const monthCount: Record<string, number> = {};
      applications?.forEach(app => {
        const month = new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthCount[month] = (monthCount[month] || 0) + 1;
      });
      const applicationsByMonth = Object.entries(monthCount)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      // Conversion funnel
      const stages = [
        { stage: 'Draft', count: applications?.filter(a => a.status === 'draft').length || 0 },
        { stage: 'Submitted', count: applications?.filter(a => ['submitted', 'screening'].includes(a.status)).length || 0 },
        { stage: 'Offers', count: applications?.filter(a => ['conditional_offer', 'unconditional_offer'].includes(a.status)).length || 0 },
        { stage: 'Accepted', count: applications?.filter(a => ['cas_loa', 'visa', 'enrolled'].includes(a.status)).length || 0 },
      ];
      const maxCount = Math.max(...stages.map(s => s.count));
      const conversionFunnel = stages.map(stage => ({
        ...stage,
        percentage: maxCount > 0 ? Math.round((stage.count / maxCount) * 100) : 0
      }));

      setAnalytics({
        totalApplications,
        activeApplications,
        completedApplications,
        successRate,
        averageProcessingTime: Math.round(avgTime),
        topCountries,
        topUniversities,
        applicationsByStatus,
        applicationsByMonth,
        conversionFunnel,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: 'Total Applications',
      value: analytics.totalApplications,
      icon: FileText,
      change: '+12%',
      trend: 'up' as const,
      color: 'text-blue-500',
    },
    {
      title: 'Active Applications',
      value: analytics.activeApplications,
      icon: Clock,
      change: '+5%',
      trend: 'up' as const,
      color: 'text-orange-500',
    },
    {
      title: 'Success Rate',
      value: `${analytics.successRate}%`,
      icon: CheckCircle,
      change: '+3%',
      trend: 'up' as const,
      color: 'text-green-500',
    },
    {
      title: 'Avg. Processing Time',
      value: `${analytics.averageProcessingTime} days`,
      icon: Target,
      change: '-2 days',
      trend: 'up' as const,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive insights into your application performance</p>
        </div>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
            <TabsTrigger value="1y">1 Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                    {stat.change}
                  </span>
                  <span>from last period</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Applications Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Applications Over Time</CardTitle>
            <CardDescription>Monthly application trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.applicationsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Applications by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Applications by Status</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.applicationsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.applicationsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Destination Countries
            </CardTitle>
            <CardDescription>Most popular study destinations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topCountries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Application Conversion Funnel
            </CardTitle>
            <CardDescription>Journey from draft to enrollment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.conversionFunnel.map((stage, index) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{stage.stage}</span>
                  <span className="text-sm text-muted-foreground">
                    {stage.count} ({stage.percentage}%)
                  </span>
                </div>
                <Progress value={stage.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Universities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Universities
          </CardTitle>
          <CardDescription>Most applied universities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topUniversities.map((university, index) => (
              <div key={university.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{university.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{university.count} applications</span>
                  <Progress 
                    value={(university.count / analytics.topUniversities[0].count) * 100} 
                    className="w-24 h-2" 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
