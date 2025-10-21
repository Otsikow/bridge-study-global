import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Users, FileCheck, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface CommissionData {
  pending: number;
  approved: number;
  paid: number;
  total_applications: number;
}

interface PerformanceData {
  total_students: number;
  active_applications: number;
  conversion_rate: number;
  commissions: CommissionData;
}

export default function PerformanceMetrics() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchPerformanceData();
    }
  }, [profile?.id, fetchPerformanceData]);

  const fetchPerformanceData = useCallback(async () => {
    try {
      // Get agent ID
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (agentError) throw agentError;

      // Get applications count and status
      const { data: applicationsData, error: appsError } = await supabase
        .from('applications')
        .select('id, status, student_id')
        .eq('agent_id', agentData.id);

      if (appsError) throw appsError;

      // Get unique students count
      const uniqueStudents = new Set(applicationsData?.map(app => app.student_id)).size;

      // Get commissions breakdown
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('amount_cents, status')
        .eq('agent_id', agentData.id);

      if (commissionsError) throw commissionsError;

      // Calculate commission totals
      const pending = commissionsData
        ?.filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + (c.amount_cents || 0), 0) / 100 || 0;

      const approved = commissionsData
        ?.filter(c => c.status === 'approved')
        .reduce((sum, c) => sum + (c.amount_cents || 0), 0) / 100 || 0;

      const paid = commissionsData
        ?.filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + (c.amount_cents || 0), 0) / 100 || 0;

      // Calculate conversion rate (enrolled / total)
      const enrolled = applicationsData?.filter(app => app.status === 'enrolled').length || 0;
      const total = applicationsData?.length || 1;
      const conversionRate = Math.round((enrolled / total) * 100);

      setData({
        total_students: uniqueStudents,
        active_applications: applicationsData?.filter(app => 
          !['withdrawn', 'rejected', 'enrolled'].includes(app.status)
        ).length || 0,
        conversion_rate: conversionRate,
        commissions: {
          pending,
          approved,
          paid,
          total_applications: applicationsData?.length || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: "Error",
        description: "Failed to load performance metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.id, toast]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      title: 'Total Students',
      value: data.total_students.toString(),
      icon: Users,
      description: 'Students recruited',
    },
    {
      title: 'Active Applications',
      value: data.active_applications.toString(),
      icon: FileCheck,
      description: 'In progress',
    },
    {
      title: 'Total Earnings',
      value: `$${(data.commissions.paid + data.commissions.approved).toLocaleString()}`,
      icon: DollarSign,
      description: 'Approved + Paid',
    },
    {
      title: 'Conversion Rate',
      value: `${data.conversion_rate}%`,
      icon: TrendingUp,
      description: 'Success rate',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Commission Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">${data.commissions.pending.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </div>
            <div className="p-4 border rounded-lg bg-primary/10 border-primary/20">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-primary">
                ${data.commissions.approved.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Ready for payout</p>
            </div>
            <div className="p-4 border rounded-lg bg-success/10 border-success/20">
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-success">
                ${data.commissions.paid.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Lifetime earnings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
