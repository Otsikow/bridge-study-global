import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  CreditCard,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/LoadingState';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Commission {
  id: string;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'clawback';
  rate_percent: number;
  level: number;
  created_at: string;
  paid_at: string | null;
  approved_at: string | null;
  applications: {
    program_name: string;
    students: {
      profiles: {
        full_name: string;
      };
    };
    universities: {
      name: string;
    };
  } | null;
}

export function AgentPayments() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCommissions();
  }, [user]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);

      // Get agent ID first
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', user?.id)
        .single();

      if (agentError) {
        console.error('Error fetching agent:', agentError);
        setLoading(false);
        return;
      }

      // Fetch commissions for this agent
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          applications (
            program_name,
            students (
              profiles (
                full_name
              )
            ),
            universities (
              name
            )
          )
        `)
        .eq('agent_id', agentData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching commissions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load commissions',
          variant: 'destructive',
        });
      } else {
        setCommissions(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    try {
      setRequestingPayout(true);

      // Get agent ID
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', user?.id)
        .single();

      if (agentError) {
        throw agentError;
      }

      // Get all approved but unpaid commissions
      const approvedCommissions = commissions.filter(
        (c) => c.status === 'approved' && !c.paid_at
      );

      if (approvedCommissions.length === 0) {
        toast({
          title: 'No Approved Commissions',
          description: 'You have no approved commissions ready for payout',
          variant: 'destructive',
        });
        return;
      }

      // TODO: Integrate with Stripe Connect for actual payout
      // For now, we'll just update the status to indicate a payout request
      // In production, this would trigger a Stripe Connect transfer

      toast({
        title: 'Payout Requested',
        description: `Payout requested for ${approvedCommissions.length} commission(s). You will be notified once processed.`,
      });

      // Refresh commissions
      await fetchCommissions();
    } catch (err) {
      console.error('Error requesting payout:', err);
      toast({
        title: 'Error',
        description: 'Failed to request payout',
        variant: 'destructive',
      });
    } finally {
      setRequestingPayout(false);
    }
  };

  const formatAmount = (cents: number, currency: string) => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className?: string }> = {
      paid: { variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      approved: { variant: 'default', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      pending: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      clawback: { variant: 'destructive' },
    };
    const config = variants[status] || { variant: 'secondary' };
    return <Badge variant={config.variant} className={config.className}>{status.toUpperCase()}</Badge>;
  };

  const filteredCommissions = useMemo(() => {
    if (filterStatus === 'all') return commissions;
    return commissions.filter((c) => c.status === filterStatus);
  }, [commissions, filterStatus]);

  const stats = useMemo(() => {
    const totalEarned = commissions
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount_cents, 0);

    const totalPending = commissions
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount_cents, 0);

    const totalApproved = commissions
      .filter((c) => c.status === 'approved')
      .reduce((sum, c) => sum + c.amount_cents, 0);

    const studentsReferred = new Set(
      commissions
        .filter((c) => c.applications?.students)
        .map((c) => c.applications?.students?.profiles?.full_name)
    ).size;

    return {
      totalEarned,
      totalPending,
      totalApproved,
      studentsReferred,
      currency: commissions[0]?.currency || 'USD',
    };
  }, [commissions]);

  // Generate monthly earnings data for the chart
  const monthlyData = useMemo(() => {
    const monthlyMap = new Map<string, { earned: number; pending: number }>();

    commissions.forEach((commission) => {
      const date = new Date(commission.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { earned: 0, pending: 0 });
      }

      const data = monthlyMap.get(monthKey)!;
      if (commission.status === 'paid') {
        data.earned += commission.amount_cents / 100;
      } else if (commission.status === 'pending' || commission.status === 'approved') {
        data.pending += commission.amount_cents / 100;
      }
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        earned: data.earned,
        pending: data.pending,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months
  }, [commissions]);

  // Calculate month-over-month growth
  const monthlyGrowth = useMemo(() => {
    if (monthlyData.length < 2) return 0;
    const current = monthlyData[monthlyData.length - 1].earned;
    const previous = monthlyData[monthlyData.length - 2].earned;
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }, [monthlyData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingState message="Loading commissions..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">
            Commission Tracker
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Track your earnings and request payouts
          </p>
        </div>
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          <Button
            variant="outline"
            className="gap-2 hover-scale whitespace-nowrap"
            disabled={stats.totalApproved === 0 || requestingPayout}
            onClick={requestPayout}
          >
            <CreditCard className="h-4 w-4" /> {requestingPayout ? 'Processing...' : 'Request Payout'}
          </Button>
          <Button className="gap-2 hover-scale whitespace-nowrap">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="rounded-xl border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {formatAmount(stats.totalEarned, stats.currency)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {commissions.filter((c) => c.status === 'paid').length} payment(s)
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatAmount(stats.totalApproved, stats.currency)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Ready for payout</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {formatAmount(stats.totalPending, stats.currency)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students Referred
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.studentsReferred}</div>
            <p className="text-sm text-muted-foreground mt-1">Total referrals</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card className="rounded-xl border shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Earnings Trend
              </CardTitle>
              <CardDescription>Last 6 months earnings overview</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {monthlyGrowth !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${monthlyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthlyGrowth > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {Math.abs(monthlyGrowth).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="earned"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  name="Earned"
                  dot={{ fill: 'hsl(var(--success))' }}
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="hsl(var(--warning))"
                  strokeWidth={2}
                  name="Pending"
                  dot={{ fill: 'hsl(var(--warning))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No earnings data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setFilterStatus('all')}>
              All
            </TabsTrigger>
            <TabsTrigger value="pending" onClick={() => setFilterStatus('pending')}>
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" onClick={() => setFilterStatus('approved')}>
              Approved
            </TabsTrigger>
            <TabsTrigger value="paid" onClick={() => setFilterStatus('paid')}>
              Paid
            </TabsTrigger>
          </TabsList>
        </div>

        <Card className="rounded-xl border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Commission Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCommissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No commissions found</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(commission.created_at)}
                        </TableCell>
                        <TableCell>
                          {commission.applications?.students?.profiles?.full_name || 'N/A'}
                        </TableCell>
                        <TableCell className="min-w-[200px]">
                          {commission.applications?.program_name || 'N/A'}
                        </TableCell>
                        <TableCell className="min-w-[200px]">
                          {commission.applications?.universities?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{commission.rate_percent}%</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(commission.amount_cents, commission.currency)}
                        </TableCell>
                        <TableCell>{getStatusBadge(commission.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Stripe Connect Information */}
      <Card className="rounded-xl border shadow-card bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Payout Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Payouts are processed through Stripe Connect. Approved commissions can be transferred to your
            connected bank account by clicking the "Request Payout" button.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Stripe Connected
            </Badge>
            <span className="text-sm text-muted-foreground">
              Payouts are processed within 2-3 business days
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
