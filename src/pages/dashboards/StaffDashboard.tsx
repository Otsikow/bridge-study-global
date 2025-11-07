"use client";

import { Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlarmClock,
  Bot,
  Building2,
  CalendarRange,
  CheckCircle2,
  CheckSquare,
  FileText,
  Filter,
  LineChart,
  MessageCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import BackButton from "@/components/BackButton";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StaffStudentsTable from "@/components/staff/StaffStudentsTable";
import StaffAgentsLeaderboard from "@/components/staff/StaffAgentsLeaderboard";
import StaffMessagesTable from "@/components/staff/StaffMessagesTable";
import StaffPaymentsTable from "@/components/staff/StaffPaymentsTable";
import StaffTasksBoard from "@/components/staff/StaffTasksBoard";
import StaffZoeInsightsTab from "@/components/staff/StaffZoeInsightsTab";

const personalOverviewKpis = [
  {
    title: "Students Assigned",
    value: "32",
    description: "vs. last week",
    icon: Users,
    trend: { value: 12, isPositive: true },
    to: "/dashboard/students",
  },
  {
    title: "Applications Processed",
    value: "18",
    description: "Completed in the last 7 days",
    icon: FileText,
    trend: { value: 8, isPositive: true },
    to: "/dashboard/applications",
  },
  {
    title: "Tasks Pending",
    value: "7",
    description: "2 flagged as urgent",
    icon: CheckSquare,
    trend: { value: 5, isPositive: false },
    to: "/dashboard/tasks",
  },
  {
    title: "Approvals Today",
    value: "5",
    description: "Across student finances",
    icon: AlarmClock,
    trend: { value: 3, isPositive: true },
    to: "/dashboard/payments",
  },
];

const applicationProgressData = [
  { status: "Submitted", value: 12 },
  { status: "Screening", value: 9 },
  { status: "Documents", value: 7 },
  { status: "Offer", value: 6 },
  { status: "Visa", value: 4 },
  { status: "Enrolled", value: 3 },
];

const dailyActivityTrendData = [
  { day: "Mon", tasks: 9, approvals: 2 },
  { day: "Tue", tasks: 12, approvals: 3 },
  { day: "Wed", tasks: 10, approvals: 3 },
  { day: "Thu", tasks: 14, approvals: 4 },
  { day: "Fri", tasks: 11, approvals: 3 },
  { day: "Sat", tasks: 6, approvals: 1 },
  { day: "Sun", tasks: 5, approvals: 1 },
];

const quickLinks = [
  {
    label: "My Students",
    description: "Review assigned cases and next actions",
    to: "/dashboard/students",
    icon: Users,
  },
  {
    label: "My Tasks",
    description: "Update task progress and workflows",
    to: "/dashboard/tasks",
    icon: CheckSquare,
  },
  {
    label: "My Agents",
    description: "Coordinate with partner agents",
    to: "/dashboard/agents",
    icon: Building2,
  },
];

const zoeSuggestions = [
  {
    id: "tip-1",
    message: "3 students need document verification before Friday.",
  },
  {
    id: "tip-2",
    message:
      "Follow up with Bridge Lagos about two new applicants waiting for screening.",
  },
  {
    id: "tip-3",
    message: "Schedule a payment approval review for commissions logged today.",
  },
];

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: overviewNotifications } = useQuery({
    queryKey: ["staff", "dashboard", "notifications"],
    queryFn: async () => zoeSuggestions,
    initialData: zoeSuggestions,
    staleTime: 60_000,
  });

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <BackButton to="/dashboard" label="Back to dashboard selector" />
            <h1 className="text-3xl font-bold tracking-tight">
              Staff Command Center
            </h1>
            <p className="text-sm text-muted-foreground">
              Operate admissions, tasks, and partner workflows with Zoe’s live
              insights layered on top of Supabase data.
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link to="/dashboard/ai-insights">
              <Sparkles className="h-5 w-5" /> Open AI Insights
            </Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto rounded-lg border bg-background p-1">
            <TabsTrigger value="overview" className="px-4">
              🏠 Overview
            </TabsTrigger>
            <TabsTrigger value="students" className="px-4">
              🎓 Students
            </TabsTrigger>
            <TabsTrigger value="agents" className="px-4">
              🤝 Agents
            </TabsTrigger>
            <TabsTrigger value="tasks" className="px-4">
              📁 Tasks & Workflows
            </TabsTrigger>
            <TabsTrigger value="messages" className="px-4">
              💬 Messages
            </TabsTrigger>
            <TabsTrigger value="payments" className="px-4">
              💸 Payments
            </TabsTrigger>
            <TabsTrigger value="resources" className="px-4">
              📑 Resources
            </TabsTrigger>
            <TabsTrigger value="ai" className="px-4">
              🧠 Zoe
            </TabsTrigger>
            <TabsTrigger value="settings" className="px-4">
              ⚙️ Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {personalOverviewKpis.map((stat) => (
                  <StatsCard key={stat.title} {...stat} />
                ))}
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <LineChart className="h-5 w-5 text-primary" /> Application progress
                    </CardTitle>
                    <CardDescription>
                      Status mix across your assigned students.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={applicationProgressData} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                        <XAxis dataKey="status" tickLine={false} axisLine={false} className="text-xs" />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="text-xs" />
                        <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} />
                        <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Quick links</CardTitle>
                    <CardDescription>
                      Jump straight into your most-used views.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quickLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          to={item.to}
                          className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <div>
                      <CardTitle className="text-lg">Daily activity trend</CardTitle>
                      <CardDescription>Track throughput and approvals over the last 7 days.</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      Last 7 days
                    </Badge>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={dailyActivityTrendData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} className="text-xs" />
                        <RechartsTooltip cursor={{ strokeDasharray: "3 3" }} />
                        <Legend verticalAlign="top" align="left" iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
                        <Line
                          type="monotone"
                          dataKey="tasks"
                          name="Tasks completed"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="approvals"
                          name="Approvals"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="h-5 w-5 text-primary" /> Zoe’s AI tips
                    </CardTitle>
                    <CardDescription>
                      Smart nudges tailored to today’s workload.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {zoeSuggestions.map((tip) => (
                      <div
                        key={tip.id}
                        className="rounded-lg border p-3 text-sm leading-relaxed text-muted-foreground"
                      >
                        {tip.message}
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setActiveTab("ai")}
                    >
                      <Bot className="h-4 w-4" /> Ask Zoe for more
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="students">
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
              <StaffStudentsTable />
            </Suspense>
          </TabsContent>

          <TabsContent value="agents">
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
              <StaffAgentsLeaderboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="tasks">
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
              <StaffTasksBoard />
            </Suspense>
          </TabsContent>

          <TabsContent value="messages">
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
              <StaffMessagesTable />
            </Suspense>
          </TabsContent>

          <TabsContent value="payments">
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
              <StaffPaymentsTable />
            </Suspense>
          </TabsContent>

          <TabsContent value="ai">
            <StaffZoeInsightsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
