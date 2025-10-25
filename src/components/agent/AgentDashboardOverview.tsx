import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  Users,
  FileCheck,
  Wallet,
  UserPlus,
  FilePlus,
  BarChart3,
  Copy,
  Check,
  Search,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/StatusBadge';

interface DashboardStats {
  totalStudents: number;
  activeApplications: number;
  commissionsEarned: number;
  pendingPayouts: number;
}

interface ReferredStudent {
  id: string;
  name: string;
  email: string;
  program: string;
  university: string;
  status: string;
  commission: number;
  created_at: string;
}

interface MonthlyEarning {
  month: string;
  earnings: number;
  students: number;
}

export default function AgentDashboardOverview() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [students, setStudents] = useState<ReferredStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<ReferredStudent[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Get agent ID
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (agentError) throw agentError;
      setAgentId(agentData.id);

      // Fetch referral code
      const { data: referralData } = await supabase
        .from('referrals')
        .select('code')
        .eq('agent_id', agentData.id)
        .eq('active', true)
        .single();

      if (referralData) {
        setReferralCode(referralData.code);
      } else {
        // Generate a new referral code if none exists
        const newCode = `AG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const { data: newReferral } = await supabase
          .from('referrals')
          .insert({
            code: newCode,
            agent_id: agentData.id,
            active: true,
          })
          .select('code')
          .single();
        
        if (newReferral) {
          setReferralCode(newReferral.code);
        }
      }

      // Fetch applications with students and commissions
      const { data: applicationsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          student:students (
            id,
            profiles:profiles (
              full_name,
              email
            )
          ),
          program:programs (
            name,
            university:universities (
              name
            )
          )
        `)
        .eq('agent_id', agentData.id)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // Fetch all commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('id, amount_cents, status, application_id, created_at')
        .eq('agent_id', agentData.id);

      if (commissionsError) throw commissionsError;

      // Calculate stats
      const uniqueStudents = new Set(applicationsData?.map(app => app.student.id)).size;
      const activeApps = applicationsData?.filter(app => 
        !['withdrawn', 'rejected', 'enrolled'].includes(app.status)
      ).length || 0;

      const totalEarned = commissionsData
        ?.filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + (c.amount_cents / 100), 0) || 0;

      const pendingPayout = commissionsData
        ?.filter(c => c.status === 'approved')
        .reduce((sum, c) => sum + (c.amount_cents / 100), 0) || 0;

      setStats({
        totalStudents: uniqueStudents,
        activeApplications: activeApps,
        commissionsEarned: totalEarned,
        pendingPayouts: pendingPayout,
      });

      // Build referred students list
      const studentsWithCommissions = applicationsData?.map(app => {
        const commission = commissionsData?.find(c => c.application_id === app.id);
        return {
          id: app.id,
          name: app.student.profiles.full_name,
          email: app.student.profiles.email,
          program: app.program.name,
          university: app.program.university.name,
          status: app.status,
          commission: commission ? commission.amount_cents / 100 : 0,
          created_at: app.created_at,
        };
      }) || [];

      setStudents(studentsWithCommissions);
      setFilteredStudents(studentsWithCommissions);

      // Calculate monthly earnings
      const earningsByMonth: { [key: string]: { earnings: number; students: Set<string> } } = {};
      
      commissionsData?.forEach(commission => {
        if (commission.status === 'paid' && commission.created_at) {
          const date = new Date(commission.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!earningsByMonth[monthKey]) {
            earningsByMonth[monthKey] = { earnings: 0, students: new Set() };
          }
          
          earningsByMonth[monthKey].earnings += commission.amount_cents / 100;
          
          const app = applicationsData?.find(a => a.id === commission.application_id);
          if (app) {
            earningsByMonth[monthKey].students.add(app.student.id);
          }
        }
      });

      // Get last 6 months
      const monthsData: MonthlyEarning[] = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        monthsData.push({
          month: monthName,
          earnings: earningsByMonth[monthKey]?.earnings || 0,
          students: earningsByMonth[monthKey]?.students.size || 0,
        });
      }

      setMonthlyEarnings(monthsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.id, toast]);

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData();
    }
  }, [profile?.id, fetchDashboardData]);

  // Filter students based on search and status
  useEffect(() => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.university.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    setFilteredStudents(filtered);
  }, [searchTerm, statusFilter, students]);

  const copyReferralLink = () => {
    const link = `${window.location.origin}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestPayout = async () => {
    if (!agentId || !stats?.pendingPayouts) return;

    try {
      // This would typically create a payout request in your system
      toast({
        title: 'Payout Requested',
        description: 'Your payout request has been submitted for processing',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to request payout',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Students recruited</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeApplications || 0}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.commissionsEarned.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Total paid out</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${stats?.pendingPayouts.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Ready to withdraw</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Perform common tasks quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Student
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FilePlus className="h-4 w-4" />
              Add Application
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              View Commission Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral Link Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>Share this unique link to track your referrals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}/signup?ref=${referralCode}`}
              readOnly
              className="font-mono text-sm"
            />
            <Button onClick={copyReferralLink} variant="outline" className="flex-shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Tracking ID: <span className="font-mono font-semibold">{referralCode}</span>
          </p>
        </CardContent>
      </Card>

      {/* Monthly Earnings Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Earnings Trend
          </CardTitle>
          <CardDescription>Track your commission earnings over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyEarnings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Earnings']}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="earnings" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="Earnings ($)"
                dot={{ fill: '#2563eb', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Commission Summary Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Commission Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Unpaid Earnings</p>
                <p className="text-3xl font-bold text-primary">
                  ${stats?.pendingPayouts.toLocaleString() || 0}
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={handleRequestPayout}
                disabled={!stats?.pendingPayouts}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Request Payout
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Payouts are processed within 5-7 business days
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Referred Students Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Referred Students</CardTitle>
              <CardDescription>Manage your student referrals and track commissions</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="conditional_offer">Conditional Offer</SelectItem>
                  <SelectItem value="unconditional_offer">Unconditional Offer</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No students found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start recruiting students to see them here'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-muted-foreground">{student.email}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium truncate">{student.program}</p>
                          <p className="text-xs text-muted-foreground truncate">{student.university}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={student.status} />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${student.commission.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
