import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, LineChart, Settings2 } from "lucide-react";

const AdminPerformanceReports = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Performance Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate branded PDF summaries for monthly performance, financial snapshots, and operational KPIs.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <FileText className="h-4 w-4" />
          PDF automation
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report templates</CardTitle>
          <CardDescription>Select a template and configure delivery options.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="executive">
            <TabsList className="flex-wrap">
              <TabsTrigger value="executive">Executive summary</TabsTrigger>
              <TabsTrigger value="admissions">Admissions performance</TabsTrigger>
              <TabsTrigger value="finance">Finance & commissions</TabsTrigger>
            </TabsList>
            <TabsContent value="executive" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Capture application funnel highlights, conversion rates, and risk indicators for leadership briefings.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {["Applications", "Engagement", "Revenue"].map((section) => (
                  <div key={section} className="rounded-lg border p-4">
                    <p className="text-sm font-semibold">{section}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Insights pulled from admissions and finance systems.</p>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="admissions" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Track intake readiness, deferrals, and scholarship utilization with dynamic charts.
              </p>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Data sources</p>
                <p className="text-xs text-muted-foreground">Application tracking, student CRM, support escalations.</p>
              </div>
            </TabsContent>
            <TabsContent value="finance" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Summaries of invoicing, payouts, and commission adjustments reconciled with payments.
              </p>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Revenue overview</p>
                <p className="text-xs text-muted-foreground">Monthly revenue trends and outstanding balance alerts.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery configuration</CardTitle>
          <CardDescription>Automate monthly distribution to leadership and compliance teams.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="report-day">Send day</Label>
              <Input id="report-day" type="number" min={1} max={28} placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-recipients">Recipients</Label>
              <Input id="report-recipients" placeholder="finance@geg.global, leadership@geg.global" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-branding">Branding theme</Label>
              <Input id="report-branding" placeholder="UniDoxia" />
            </div>
          </div>
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <LineChart className="h-9 w-9 text-primary" />
              <div>
                <p className="text-sm font-semibold">Report health</p>
                <p className="text-xs text-muted-foreground">Last run completed successfully 6 days ago.</p>
              </div>
            </div>
            <Progress value={72} />
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Download latest PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automation controls</CardTitle>
          <CardDescription>Fine-tune how data is refreshed and who can access generated reports.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          {["Data refresh", "Access roles", "Alert routing"].map((item, index) => (
            <div key={item} className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">{item}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {index === 0 && "Nightly sync with anomaly detection on incoming metrics."}
                {index === 1 && "Restrict downloads to finance admins and compliance officers."}
                {index === 2 && "Notify stakeholders when KPIs exceed configured thresholds."}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPerformanceReports;
