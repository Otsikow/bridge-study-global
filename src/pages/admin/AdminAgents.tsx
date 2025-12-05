import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, ShieldCheck, Clock3, Mail, MapPin, DollarSign, Filter, Activity } from "lucide-react";

const agentRecords = [
  {
    name: "Atlas Education Partners",
    region: "India & South Asia",
    activeStudents: 128,
    conversionRate: 42,
    status: "verified",
    revenue: "$54,200",
    serviceLevel: "Priority",
    responseTime: "3m avg",
  },
  {
    name: "Northern Bridge Advisors",
    region: "Canada",
    activeStudents: 94,
    conversionRate: 38,
    status: "verified",
    revenue: "$41,600",
    serviceLevel: "Standard",
    responseTime: "7m avg",
  },
  {
    name: "FuturePath Agency",
    region: "Nigeria & Ghana",
    activeStudents: 77,
    conversionRate: 35,
    status: "pending",
    revenue: "$33,480",
    serviceLevel: "Priority",
    responseTime: "5m avg",
  },
  {
    name: "Pacific Scholars",
    region: "Philippines",
    activeStudents: 68,
    conversionRate: 29,
    status: "verified",
    revenue: "$27,900",
    serviceLevel: "Standard",
    responseTime: "9m avg",
  },
  {
    name: "Harborway Recruitment",
    region: "Kenya & Tanzania",
    activeStudents: 52,
    conversionRate: 24,
    status: "watchlist",
    revenue: "$19,750",
    serviceLevel: "Standard",
    responseTime: "11m avg",
  },
];

const agentHealth = [
  {
    title: "Verification",
    value: 86,
    description: "Background checks and identity verification for active agencies",
  },
  {
    title: "Compliance",
    value: 72,
    description: "Document completeness, training acknowledgements, and consent",
  },
  {
    title: "Data Quality",
    value: 64,
    description: "Profile accuracy, student mapping, and payout preferences",
  },
];

const pipelineStats = [
  { label: "Active agencies", value: "42", delta: "+6 this month" },
  { label: "Pending approvals", value: "7", delta: "2 require follow-up" },
  { label: "Avg. response time", value: "05m 12s", delta: "Support queue within SLA" },
  { label: "Onboarding completion", value: "93%", delta: "Shared training deck" },
];

const AdminAgents = () => {
  const averageConversion = useMemo(() => {
    const totalRate = agentRecords.reduce((sum, agent) => sum + agent.conversionRate, 0);
    return Math.round(totalRate / agentRecords.length);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agency Network</h1>
          <p className="text-sm text-muted-foreground">
            Monitor partner agency performance, conversion quality, and operational readiness.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button className="gap-2">
            <Users className="h-4 w-4" />
            Invite Agency
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {pipelineStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 space-y-2">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold">{stat.value}</span>
                <Badge variant="outline" className="text-xs">
                  {stat.delta}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Agency performance</CardTitle>
            <CardDescription>Conversion efficiency, geographic coverage, and revenue contribution.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 text-sm lg:text-right">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">Average conversion</span>
              <Badge variant="secondary">{averageConversion}%</Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Compliance monitoring enabled for all active agencies
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Tabs defaultValue="active" className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="pt-4 text-sm text-muted-foreground">
                Showing all agencies with active student pipelines and cleared compliance reviews.
              </TabsContent>
              <TabsContent value="pending" className="pt-4 text-sm text-muted-foreground">
                Agencies awaiting verification, contract signature, or payout setup.
              </TabsContent>
              <TabsContent value="watchlist" className="pt-4 text-sm text-muted-foreground">
                Agencies under enhanced review due to SLA breaches or data quality concerns.
              </TabsContent>
            </Tabs>
            <div className="flex w-full flex-col gap-2 md:w-80">
              <Input placeholder="Search agencies or regions" className="w-full" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                Updated 4m ago from CRM and admissions pipeline
              </div>
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Active students</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Monthly revenue</TableHead>
                  <TableHead>Service level</TableHead>
                  <TableHead>Response time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentRecords.map((agent) => (
                  <TableRow key={agent.name}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell className="text-muted-foreground">{agent.region}</TableCell>
                    <TableCell className="text-right">{agent.activeStudents}</TableCell>
                    <TableCell className="text-right">{agent.conversionRate}%</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          agent.status === "verified"
                            ? "default"
                            : agent.status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {agent.status === "watchlist" ? "Watchlist" : agent.status === "pending" ? "Pending" : "Verified"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{agent.revenue}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{agent.serviceLevel}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{agent.responseTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Engagement and outreach</CardTitle>
            <CardDescription>Measure responsiveness and keep agencies aligned with admissions timelines.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {["Support SLAs", "Campaigns", "Renewals"].map((item, index) => (
              <div key={item} className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">{item}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {index === 0 && "Live chat, email, and phone queues are within SLA for priority agencies."}
                  {index === 1 && "Nurture sequences running for top-of-funnel applicants in key regions."}
                  {index === 2 && "Renewal pipeline prepped with updated terms and performance guarantees."}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational health</CardTitle>
            <CardDescription>Verification, compliance, and data accuracy metrics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {agentHealth.map((item) => (
              <div key={item.title} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-muted-foreground">{item.value}%</span>
                </div>
                <Progress value={item.value} />
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Top agency opportunities</CardTitle>
            <CardDescription>Track where to focus coaching, campus visits, and joint webinars.</CardDescription>
          </div>
          <Button variant="secondary" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Review incentives
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {agentRecords.slice(0, 4).map((agent) => (
            <div key={agent.name} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold leading-tight">{agent.name}</p>
                <Badge variant="outline" className="capitalize">{agent.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                {agent.region}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Conversion</span>
                <span className="font-medium">{agent.conversionRate}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active students</span>
                <span className="font-medium">{agent.activeStudents}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                Monthly enablement pack sent
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAgents;
