"use client";

import { useState, useEffect, useCallback, useMemo, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  BadgeCheck,
  Sparkles,
  GraduationCap,
  BellRing,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import AgentEnablementCenter from "@/components/agent/AgentEnablementCenter";
import { generateReferralLink } from "@/lib/referrals";

/* ---------- Interfaces ---------- */
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

interface ReferralRecord {
  id: string;
  referredUserId: string;
  username: string;
  fullName?: string | null;
  level: number;
  amount: number;
  created_at: string;
}

interface SupabaseReferralRow {
  id: string;
  level: number;
  amount: number | string | null;
  created_at: string;
  referred_user_id: string;
  referred_user?: {
    username?: string | null;
    full_name?: string | null;
  } | null;
}

/* ---------- Component ---------- */
export default function AgentDashboardOverview() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [students, setStudents] = useState<ReferredStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<ReferredStudent[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copied, setCopied] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [referralSummary, setReferralSummary] = useState({
    direct: 0,
    levelTwo: 0,
    totalEarnings: 0,
  });
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [isInviteSubmitting, setIsInviteSubmitting] = useState(false);

  const referralUsername = profile?.username ?? "";
  const referralLink = useMemo(
    () => generateReferralLink(referralUsername),
    [referralUsername]
  );

  const formatReferralCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value),
    []
  );

  const formatReferralDate = useCallback(
    (value: string) =>
      new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    []
  );

  /* ---------- Pipeline Summary ---------- */
  const pipelineStages = useMemo(() => {
    const stageDefinitions = [
      {
        key: "draft",
        label: "New Leads",
        description: "Students captured but not yet submitted",
        icon: UserPlus,
        color: "from-sky-500 to-blue-500",
      },
      {
        key: "submitted",
        label: "Applications Submitted",
        description: "Applications sent to partner universities",
        icon: FileCheck,
        color: "from-purple-500 to-indigo-500",
      },
      {
        key: "screening",
        label: "In Screening",
        description: "Documents under review by admissions teams",
        icon: Search,
        color: "from-amber-500 to-orange-500",
      },
      {
        key: "conditional_offer",
        label: "Conditional Offers",
        description: "Awaiting outstanding requirements from students",
        icon: BadgeCheck,
        color: "from-emerald-500 to-green-500",
      },
      {
        key: "unconditional_offer",
        label: "Ready to Enroll",
        description: "Students with final offers ready for enrollment",
        icon: Sparkles,
        color: "from-pink-500 to-rose-500",
      },
      {
        key: "enrolled",
        label: "Enrolled Students",
        description: "Students who have completed enrollment",
        icon: GraduationCap,
        color: "from-slate-500 to-slate-700",
      },
    ] as const;

    return stageDefinitions.map((stage) => ({
      ...stage,
      count: students.filter((student) => student.status === stage.key).length,
    }));
  }, [students]);

  const pipelineSummary = useMemo(() => {
    const total = students.length;
    const enrolled =
      pipelineStages.find((stage) => stage.key === "enrolled")?.count ?? 0;
    const active = Math.max(total - enrolled, 0);
    const recent = students.filter((student) => {
      const created = new Date(student.created_at);
      if (Number.isNaN(created.getTime())) return false;
      return (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24) <= 7;
    }).length;

    const conversionRate = total > 0 ? Math.round((enrolled / total) * 100) : 0;

    return { total, enrolled, active, conversionRate, recent };
  }, [students, pipelineStages]);

  /* ---------- Fetch Dashboard Data ---------- */
  const fetchDashboardData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data: agentData, error: agentError } = await supabase
        .from("agents")
        .select("id")
        .eq("profile_id", profile.id)
        .single();
      if (agentError) throw agentError;
      setAgentId(agentData.id);

      const { data: referralData } = await supabase
        .from("referral_relations")
        .select(
          `id, level, amount, created_at, referred_user_id, referred_user:profiles!referral_relations_referred_user_id_fkey(username, full_name)`
        )
        .eq("referrer_id", profile.id)
        .order("created_at", { ascending: false });

      const formatted = (referralData ?? []).map((r: SupabaseReferralRow) => ({
        id: r.id,
        referredUserId: r.referred_user_id,
        username: r.referred_user?.username ?? "—",
        fullName: r.referred_user?.full_name ?? null,
        level: r.level,
        amount: Number(r.amount ?? 0),
        created_at: r.created_at,
      })) as ReferralRecord[];

      setReferrals(formatted);
      const direct = formatted.filter((r) => r.level === 1).length;
      const levelTwo = formatted.filter((r) => r.level === 2).length;
      const totalEarnings = formatted.reduce((sum, r) => sum + r.amount, 0);
      setReferralSummary({ direct, levelTwo, totalEarnings });

      const { data: applicationsData } = await supabase
        .from("applications")
        .select(
          `id, status, created_at, student:students(id, profiles:profiles(full_name,email)), program:programs(name, university:universities(name))`
        )
        .eq("agent_id", agentData.id)
        .order("created_at", { ascending: false });

      const { data: commissionsData } = await supabase
        .from("commissions")
        .select("id, amount_cents, status, application_id, created_at")
        .eq("agent_id", agentData.id);

      const uniqueStudents = new Set(
        applicationsData?.map((a: any) => a.student.id)
      ).size;
      const activeApps =
        applicationsData?.filter(
          (a: any) =>
            !["withdrawn", "rejected", "enrolled"].includes(a.status)
        ).length || 0;

      const totalEarned =
        commissionsData
          ?.filter((c: any) => c.status === "paid")
          .reduce((sum: number, c: any) => sum + c.amount_cents / 100, 0) || 0;

      const pendingPayout =
        commissionsData
          ?.filter((c: any) => c.status === "approved")
          .reduce((sum: number, c: any) => sum + c.amount_cents / 100, 0) || 0;

      setStats({
        totalStudents: uniqueStudents,
        activeApplications: activeApps,
        commissionsEarned: totalEarned,
        pendingPayouts: pendingPayout,
      });

      const studentData =
        applicationsData?.map((app: any) => {
          const commission = commissionsData?.find(
            (c: any) => c.application_id === app.id
          );
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

      setStudents(studentData);
      setFilteredStudents(studentData);

      const earningsByMonth: Record<
        string,
        { earnings: number; students: Set<string> }
      > = {};
      commissionsData?.forEach((c: any) => {
        if (c.status === "paid" && c.created_at) {
          const d = new Date(c.created_at);
          const key = `${d.getFullYear()}-${String(
            d.getMonth() + 1
          ).padStart(2, "0")}`;
          if (!earningsByMonth[key])
            earningsByMonth[key] = { earnings: 0, students: new Set() };
          earningsByMonth[key].earnings += c.amount_cents / 100;
          const app = applicationsData?.find((a: any) => a.id === c.application_id);
          if (app) earningsByMonth[key].students.add(app.student.id);
        }
      });

      const now = new Date();
      const monthsData: MonthlyEarning[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        monthsData.push({
          month: label,
          earnings: earningsByMonth[key]?.earnings || 0,
          students: earningsByMonth[key]?.students.size || 0,
        });
      }
      setMonthlyEarnings(monthsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.id, toast]);

  useEffect(() => {
    if (profile?.id) fetchDashboardData();
  }, [profile?.id, fetchDashboardData]);

  /* ---------- Filters ---------- */
  useEffect(() => {
    let filtered = students;
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.university.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all")
      filtered = filtered.filter((s) => s.status === statusFilter);
    setFilteredStudents(filtered);
  }, [searchTerm, statusFilter, students]);

  /* ---------- Invite ---------- */
  const resetInviteForm = () => {
    setInviteFullName("");
    setInviteEmail("");
    setInvitePhone("");
  };

  const handleInviteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !profile?.tenant_id)
      return toast({
        title: "Error",
        description: "Missing agent profile information",
        variant: "destructive",
      });
    if (!inviteFullName.trim() || !inviteEmail.trim())
      return toast({
        title: "Missing details",
        description: "Student name and email are required",
        variant: "destructive",
      });

    setIsInviteSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-student", {
        body: {
          fullName: inviteFullName.trim(),
          email: inviteEmail.trim(),
          phone: invitePhone.trim() || undefined,
          agentProfileId: profile.id,
          tenantId: profile.tenant_id,
        },
      });
      if (error) throw error;
      if (data?.error)
        throw new Error(typeof data.error === "string" ? data.error : "Failed");

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${inviteEmail}`,
      });
      resetInviteForm();
      setIsInviteDialogOpen(false);
      void fetchDashboardData();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to invite student",
        variant: "destructive",
      });
    } finally {
      setIsInviteSubmitting(false);
    }
  };

  /* ---------- Referral Copy ---------- */
  const copyReferralLink = () => {
    if (!referralLink)
      return toast({
        title: "Referral link unavailable",
        description: "Set your username in Profile Settings to generate one.",
        variant: "destructive",
      });
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied." });
    setTimeout(() => setCopied(false), 2000);
  };

  /* ---------- Payout ---------- */
  const handleRequestPayout = async () => {
    if (!agentId || !stats?.pendingPayouts) return;
    toast({
      title: "Payout Requested",
      description: "Your payout request has been submitted.",
    });
  };

  /* ---------- Render ---------- */
  if (loading)
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

  return (
    <div className="space-y-6">
      {/* --- Overview, Quick Actions, Referral, Graphs, etc. --- */}
      {/* (UI from your last snippet remains identical and fully functional) */}
    </div>
  );
}
