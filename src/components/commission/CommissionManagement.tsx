import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter,
  Eye,
  CreditCard,
  Wallet,
  Banknote,
  PieChart,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Commission {
  id: string;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'clawback';
  level: number;
  rate_percent: number;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
  application: {
    id: string;
    student: {
      profiles: {
        full_name: string;
      };
    };
    program: {
      name: string;
      university: {
        name: string;
      };
    };
  };
}

interface CommissionStats {
  total_earnings: number;
  pending_amount: number;
  approved_amount: number;
  paid_amount: number;
  this_month: number;
  last_month: number;
  growth_rate: number;
  total_applications: number;
  conversion_rate: number;
}

const STATUS_COLORS = {
  pending: 'bg-warning-light text-warning dark:bg-warning/20',
  approved: 'bg-info-light text-info dark:bg-info/20',
  paid: 'bg-success-light text-success dark:bg-success/20',
  clawback: 'bg-destructive/10 text-destructive'
};

const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle,
  paid: Banknote,
  clawback: AlertCircle
};

export default function CommissionManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchCommissions();
      fetchStats();
    }
  }, [profile?.id]);

  const fetchCommissions = async () => {
    try {
      // Get agent ID
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (agentError) throw agentError;

      const { data, error } = await supabase
        .from('commissions')
        .select(`
          id,
          amount_cents,
          currency,
          status,
          level,
          rate_percent,
          created_at,
          approved_at,
          paid_at,
          application:applications (
            id,
            student:students (
              profiles!inner (
                full_name
              )
            ),
            program:programs (
              name,
              university:universities (
                name
              )
            )
          )
        `)
        .eq('agent_id', agentData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommissions(data || []);
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load commissions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get agent ID
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (agentError) throw agentError;

      // Get all commissions for this agent
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('amount_cents, status, created_at')
        .eq('agent_id', agentData.id);

      if (commissionsError) throw commissionsError;

      // Get applications count
      const { data: applicationsData, error: appsError } = await supabase
        .from('applications')
        .select('id, status, created_at')
        .eq('agent_id', agentData.id);

      if (appsError) throw appsError;

      // Calculate stats
      const totalEarnings = commissionsData
        ?.filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + (c.amount_cents || 0), 0) / 100 || 0;

      const pendingAmount = commissionsData
        ?.filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + (c.amount_cents || 0), 0) / 100 || 0;

      const approvedAmount = commissionsData
        ?.filter(c => c.status === 'approved')
        .reduce((sum, c) => sum + (c.amount_cents || 0), 0) / 100 || 0;

      const paidAmount = commissionsData
        ?.filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + (c.amount_cents || 0), 0) / 100 || 0;

      // This month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthCommissions = commissionsData
        ?.filter(c => new Date(c.created_at) >= thisMonth && c.status === 'paid')
        .reduce((sum, c) => sum + (c.amount_cents || 0), 0) / 100 || 0;

      // Last month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      const lastMonthEnd = new Date();
      lastMonthEnd.setDate(0);
      const lastMonthCommissions = commissionsData
        ?.filter(c => {
          const date = new Date(c.created_at);
          return date >= lastMonth && date <= lastMonthEnd && c.status === 'paid';
        })
        .reduce((sum, c) => sum + (c.amount_cents || 0), 0) / 100 || 0;

      const growthRate = lastMonthCommissions > 0 
        ? ((thisMonthCommissions - lastMonthCommissions) / lastMonthCommissions) * 100 
        : 0;

      // Conversion rate
      const enrolledApplications = applicationsData?.filter(app => app.status === 'enrolled').length || 0;
      const totalApplications = applicationsData?.length || 1;
      const conversionRate = (enrolledApplications / totalApplications) * 100;

      setStats({
        total_earnings: totalEarnings,
        pending_amount: pendingAmount,
        approved_amount: approvedAmount,
        paid_amount: paidAmount,
        this_month: thisMonthCommissions,
        last_month: lastMonthCommissions,
        growth_rate: growthRate,
        total_applications: totalApplications,
        conversion_rate: conversionRate
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFilteredCommissions = () => {
    let filtered = commissions;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.application.student.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.application.program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.application.program.university.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'this_month':
          filterDate.setDate(1);
          break;
        case 'last_month':
          filterDate.setMonth(filterDate.getMonth() - 1);
          filterDate.setDate(1);
          break;
        case 'last_3_months':
          filterDate.setMonth(filterDate.getMonth() - 3);
          break;
        case 'last_6_months':
          filterDate.setMonth(filterDate.getMonth() - 6);
          break;
        case 'this_year':
          filterDate.setMonth(0, 1);
          break;
        default:
          return filtered;
      }

      filtered = filtered.filter(c => new Date(c.created_at) >= filterDate);
    }

    return filtered;
  };

  const exportCommissions = () => {
    const csvData = getFilteredCommissions().map(commission => ({
      'Student Name': commission.application.student.profiles.full_name,
      'Program': commission.application.program.name,
      'University': commission.application.program.university.name,
      'Amount': formatCurrency(commission.amount_cents / 100, commission.currency),
      'Status': commission.status,
      'Level': commission.level,
      'Rate': `${commission.rate_percent}%`,
      'Created Date': formatDate(commission.created_at),
      'Paid Date': commission.paid_at ? formatDate(commission.paid_at) : ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
      </div>
    );
  }

  const filteredCommissions = getFilteredCommissions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Commission Management</h2>
          <p className="text-muted-foreground">Track and manage your commission earnings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCommissions}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
              <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total_earnings)}</p>
                </div>
                      <DollarSign className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.this_month)}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.growth_rate > 0 ? '+' : ''}{stats.growth_rate.toFixed(1)}% vs last month
                  </p>
                </div>
                      <TrendingUp className="h-8 w-8 text-info" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold text-warning">{formatCurrency(stats.pending_amount)}</p>
                </div>
                      <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">{stats.conversion_rate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">{stats.total_applications} applications</p>
                </div>
                      <PieChart className="h-8 w-8 text-accent-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Commission Breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Commission Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(stats.pending_amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
              </div>
              <div className="p-4 border rounded-lg bg-info-light border-border dark:bg-info/10">
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-info">
                  {formatCurrency(stats.approved_amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Ready for payout</p>
              </div>
              <div className="p-4 border rounded-lg bg-success-light border-border dark:bg-success/10">
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(stats.paid_amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Received</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search by student, program, or university..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="clawback">Clawback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Commissions ({filteredCommissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCommissions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No commissions found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or start recruiting students</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCommissions.map((commission) => {
                const StatusIcon = STATUS_ICONS[commission.status];
                return (
                  <Card key={commission.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <StatusIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h3 className="font-semibold text-lg">
                                {commission.application.student.profiles.full_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {commission.application.program.name}
                              </p>
                            </div>
                            <Badge className={STATUS_COLORS[commission.status]}>
                              {commission.status}
                            </Badge>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-sm text-muted-foreground">University</p>
                              <p className="font-medium">
                                {commission.application.program.university.name}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Commission Details</p>
                              <p className="font-medium">
                                Level {commission.level} • {commission.rate_percent}% rate
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Created: {formatDate(commission.created_at)}
                            </div>
                            {commission.paid_at && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Paid: {formatDate(commission.paid_at)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {formatCurrency(commission.amount_cents / 100, commission.currency)}
                          </div>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}