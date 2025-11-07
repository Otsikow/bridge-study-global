import { Suspense, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlarmClock,
  Bot,
  CalendarRange,
  CheckSquare,
  FileText,
  LineChart,
  MessageCircle,
  Settings,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import BackButton from "@/components/BackButton";
import StaffAgentsLeaderboard from "@/components/staff/StaffAgentsLeaderboard";
import StaffMessagesTable from "@/components/staff/StaffMessagesTable";
import StaffPaymentsTable from "@/components/staff/StaffPaymentsTable";
import StaffStudentsTable from "@/components/staff/StaffStudentsTable";
import StaffTasksBoard from "@/components/staff/StaffTasksBoard";
import StaffZoeInsightsTab from "@/components/staff/StaffZoeInsightsTab";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const overviewStats = [
  { title: "Active Students", value: "128", description: "Across all intakes", icon: Users, to: "/dashboard/students" },
  { title: "Applications in Review", value: "46", description: "12 urgent actions", icon: FileText, to: "/dashboard/applications" },
  { title: "Tasks Due Today", value: "9", description: "3 critical items", icon: CheckSquare, to: "/dashboard/tasks" },
  { title: "Avg. SLA", value: "2.8 days", description: "Goal: 3 days", icon: AlarmClock, to: "/dashboard/reports" },
];

const productivityMetrics = [
  { label: "Daily Tasks Closed", value: 14, target: 18 },
  { label: "Weekly Offers Secured", value: 6, target: 8 },
  { label: "Pending Verifications", value: 5, target: 0 },
];

const notifications = [
  { id: "NT-001", title: "Visa stage update", detail: "Emily Davis visa approved.", priority: "high", time: "Just now" },
  { id: "NT-002", title: "New agent lead", detail: "Bridge Lagos submitted 3 new candidates.", priority: "medium", time: "15m ago" },
  { id: "NT-003", title: "Document verification", detail: "Upload proof of funds for John Smith.", priority: "high", time: "45m ago" },
  { id: "NT-004", title: "Finance reminder", detail: "Review commissions pending for LatAm Partners.", priority: "medium", time: "1h ago" },
];

const resourceLinks = [
  {
    name: "Admissions SOP",
    description: "Step-by-step guide for screening and offer issuance.",
    category: "Admissions",
  },
  {
    name: "Visa Document Checklist",
    description: "Country-specific requirements for visa submissions.",
    category: "Student Support",
  },
  {
    name: "Commission Policy 2025",
    description: "Updated payout rules and approval workflow.",
    category: "Finance",
  },
  {
    name: "Zoe Prompt Library",
    description: "Suggested prompts for faster AI-assisted actions.",
    category: "Productivity",
  },
];

export default function StaffDashboard() {
  const productivity = useMemo(() => productivityMetrics, []);

  const { data: overviewNotifications } = useQuery({
    queryKey: ["staff", "dashboard", "notifications"],
    queryFn: async () => notifications,
    initialData: notifications,
    staleTime: 60_000,
  });

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <BackButton to="/dashboard" label="Back to dashboard selector" />
            <h1 className="text-3xl font-bold tracking-tight">Staff Command Center</h1>
            <p className="text-sm text-muted-foreground">
              Operate admissions, tasks, and partner workflows with Zoe’s live insights layered on top of Supabase data.
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link to="/dashboard/ai-insights">
              <Sparkles className="h-5 w-5" /> Open AI Insights
            </Link>
          </Button>
        </div>

        <section aria-label="Staff KPIs" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overviewStats.map((stat) => (
            <Card key={stat.title} className="rounded-2xl border border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <stat.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                </div>
                <Badge variant="outline" className="capitalize text-xs">
                  {stat.description}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
                <Button variant="link" className="px-0 text-sm" asChild>
                  <Link to={stat.to}>Open view</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LineChart className="h-5 w-5 text-primary" /> Staff productivity snapshot
              </CardTitle>
              <CardDescription>Track throughput and SLA performance.</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-4 w-4 text-primary" /> Zoe enabled
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            {productivity.map((metric) => {
              const progress = Math.min(100, Math.round((metric.value / metric.target) * 100));
              return (
                <div key={metric.label} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{metric.label}</p>
                      <p className="text-xs text-muted-foreground">Target {metric.target}</p>
                    </div>
                    <Badge variant={progress >= 100 ? "secondary" : "outline"}>{progress}%</Badge>
                  </div>
                  <Progress value={progress} aria-label={`${metric.label} progress`} />
                  <p className="text-xs text-muted-foreground">Completed {metric.value} of {metric.target} goal.</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto rounded-lg border bg-background p-1">
            <TabsTrigger value="overview" className="px-4">🏠 Overview</TabsTrigger>
            <TabsTrigger value="students" className="px-4">🎓 Students</TabsTrigger>
            <TabsTrigger value="agents" className="px-4">🤝 Agents</TabsTrigger>
            <TabsTrigger value="tasks" className="px-4">📁 Tasks & Workflows</TabsTrigger>
            <TabsTrigger value="messages" className="px-4">💬 Messages</TabsTrigger>
            <TabsTrigger value="payments" className="px-4">💸 Payments</TabsTrigger>
            <TabsTrigger value="resources" className="px-4">📑 Resources</TabsTrigger>
            <TabsTrigger value="ai" className="px-4">🧠 Zoe</TabsTrigger>
            <TabsTrigger value="settings" className="px-4">⚙️ Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="rounded-2xl border border-muted lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" /> Live notifications
                  </CardTitle>
                  <CardDescription>Realtime events sourced from Supabase.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overviewNotifications?.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border bg-background/60 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                        <Badge variant={item.priority === "high" ? "destructive" : "outline"} className="capitalize">
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-muted lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" /> Action queue
                  </CardTitle>
                  <CardDescription>Next best actions suggested by Zoe.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3">
                    <Sparkles className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Prioritize pending document verifications.</p>
                      <p className="text-xs text-muted-foreground">3 students waiting &mdash; due by tomorrow.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3">
                    <MessageCircle className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Follow up with Bridge Lagos about new leads.</p>
                      <p className="text-xs text-muted-foreground">Schedule call or send message from the agent tab.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3">
                    <CalendarRange className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Check payments due in the next 7 days.</p>
                      <p className="text-xs text-muted-foreground">3 commission items still require approval.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
              <StaffStudentsTable />
            </Suspense>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
              <StaffAgentsLeaderboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
              <StaffTasksBoard />
            </Suspense>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
              <StaffMessagesTable />
            </Suspense>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
              <StaffPaymentsTable />
            </Suspense>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <Card className="rounded-2xl border border-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Resources center
                </CardTitle>
                <CardDescription>Access the latest SOPs, forms, and policies.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[360px] pr-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    {resourceLinks.map((resource) => (
                      <div key={resource.name} className="rounded-xl border bg-muted/30 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{resource.name}</p>
                            <p className="text-xs text-muted-foreground">{resource.description}</p>
                          </div>
                          <Badge variant="outline">{resource.category}</Badge>
                        </div>
                        <Button variant="ghost" size="sm" className="mt-3" asChild>
                          <Link to="/resources">Open</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
              <StaffZoeInsightsTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="rounded-2xl border border-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" /> Preferences
                </CardTitle>
                <CardDescription>Adjust personal preferences, localization, and access controls.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Full settings</p>
                    <p className="text-xs text-muted-foreground">Manage notifications, theme, and role visibility.</p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/dashboard/settings">Open settings</Link>
                  </Button>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium">Staff Handbook</p>
                  <p className="text-xs text-muted-foreground">Download the latest guidelines for admissions and compliance.</p>
                  <Button variant="link" className="px-0" asChild>
                    <a href="/resources/staff-handbook.pdf" target="_blank" rel="noreferrer">
                      View Staff Handbook
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
