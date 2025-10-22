import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter,
  Search,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Wallet
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Commission {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
  application: {
    id: string;
    status: string;
    student: {
      profiles: {
        full_name: string;
        email: string;
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

interface TierInfo {
  name: string;
  minApplications: number;
  commissionRate: number;
  benefits: string[];
  current: boolean;
  progress: number;
}

export default function CommissionTracker() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchCommissions();
      fetchTierInfo();
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

      // Fetch commissions with related data
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select(`
          id,
          amount_cents,
          currency,
          status,
          created_at,
          approved_at,
          paid_at,
          application:applications (
            id,
            status,
            student:students (
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
          )
        `)
        .eq('agent_id', agentData.id)
        .order('created_at', { ascending: false });

      if (commissionsError) throw commissionsError;
      setCommissions(commissionsData || []);
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load commission data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTierInfo = async () => {
    try {
      // Get agent ID
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (agentError) throw agentError;

      // Get total applications count
      const { data: applicationsData, error: appsError } = await supabase
        .from('applications')
        .select('id')
        .eq('agent_id', agentData.id);

      if (appsError) throw appsError;

      const totalApplications = applicationsData?.length || 0;

      // Define tiers
      const tiers: TierInfo[] = [
        {
          name: 'Bronze',
          minApplications: 0,
          commissionRate: 10,
          benefits: ['Basic support', 'Standard commission rate'],
          current: totalApplications >= 0 && totalApplications < 10,
          progress: Math.min((totalApplications / 10) * 100, 100)
        },
        {
          name: 'Silver',
          minApplications: 10,
          commissionRate: 12,
          benefits: ['Priority support', 'Higher commission rate', 'Monthly bonus'],
          current: totalApplications >= 10 && totalApplications < 25,
          progress: totalApplications < 10 ? 0 : Math.min(((totalApplications - 10) / 15) * 100, 100)
        },
        {
          name: 'Gold',
          minApplications: 25,
          commissionRate: 15,
          benefits: ['Dedicated account manager', 'Premium commission rate', 'Quarterly bonus', 'Marketing support'],
          current: totalApplications >= 25 && totalApplications < 50,
          progress: totalApplications < 25 ? 0 : Math.min(((totalApplications - 25) / 25) * 100, 100)
        },
        {
          name: 'Platinum',
          minApplications: 50,
          commissionRate: 18,
          benefits: ['VIP support', 'Maximum commission rate', 'Annual bonus', 'Exclusive events', 'Custom marketing materials'],
          current: totalApplications >= 50,
          progress: totalApplications < 50 ? 0 : 100
        }
      ];

      const currentTier = tiers.find(tier => tier.current) || tiers[tiers.length - 1];
      setTierInfo(currentTier);
    } catch (error) {
      console.error('Error fetching tier info:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning-light text-warning dark:bg-warning/20';
      case 'approved': return 'bg-info-light text-info dark:bg-info/20';
      case 'paid': return 'bg-success-light text-success dark:bg-success/20';
      case 'clawback': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'paid': return Award;
      case 'clawback': return AlertCircle;
      default: return Clock;
    }
  };

  const filteredCommissions = commissions.filter(commission => {
    const matchesStatus = filterStatus === 'all' || commission.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      commission.application.student.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.application.program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.application.program.university.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalEarnings = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + (c.amount_cents / 100), 0);

  const pendingEarnings = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + (c.amount_cents / 100), 0);

  const approvedEarnings = commissions
    .filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + (c.amount_cents / 100), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">${pendingEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Pay</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">${approvedEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Approved for payout</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Information */}
      {tierInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Agent Tier: {tierInfo.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commission Rate</p>
                <p className="text-2xl font-bold">{tierInfo.commissionRate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress to Next Tier</p>
                <div className="w-32">
                  <Progress value={tierInfo.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{Math.round(tierInfo.progress)}%</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Current Benefits:</p>
              <div className="flex flex-wrap gap-2">
                {tierInfo.benefits.map((benefit, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Commission History</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search commissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCommissions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No commissions found</h3>
              <p className="text-muted-foreground">Commissions will appear here as students enroll</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCommissions.map((commission) => {
                const StatusIcon = getStatusIcon(commission.status);
                return (
                  <Card key={commission.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{commission.application.student.profiles.full_name}</h3>
                            <Badge className={getStatusColor(commission.status)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {commission.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {commission.application.program.name} • {commission.application.program.university.name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Created: {new Date(commission.created_at).toLocaleDateString()}</span>
                            {commission.approved_at && (
                              <span>Approved: {new Date(commission.approved_at).toLocaleDateString()}</span>
                            )}
                            {commission.paid_at && (
                              <span>Paid: {new Date(commission.paid_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            ${(commission.amount_cents / 100).toLocaleString()}
                          </div>
                          <p className="text-sm text-muted-foreground">{commission.currency}</p>
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