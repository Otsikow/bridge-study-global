import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, BarChart3, ClipboardList, Sparkles } from "lucide-react";

const openZoe = (prompt: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt } }));
};

const AdminAdmissions = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admissions control</h1>
          <p className="text-sm text-muted-foreground">
            Monitor the full admissions lifecycle and coordinate escalations with operations, partners, and compliance.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => openZoe("Highlight admissions bottlenecks this week") }>
          <Sparkles className="h-4 w-4" />
          Ask Zoe for blockers
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Process health</CardTitle>
          <CardDescription>Key workflow milestones and their current service-level commitments.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            { label: "Screening queue", sla: "< 48h", status: "On track" },
            { label: "Offer issuance", sla: "5 business days", status: "Monitoring" },
            { label: "CAS/LOA", sla: "7 business days", status: "At risk" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.label}</span>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  SLA {item.sla}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Status: {item.status}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Intake readiness
            </CardTitle>
            <CardDescription>Admissions playbooks for upcoming intakes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Launch pre-intake workshops, confirm documentation windows, and align with finance on deposit timelines.
            </p>
            <Separator />
            <div className="space-y-2 text-sm">
              <p className="font-medium">Operational checklist</p>
              <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                <li>Confirm admissions portal availability and access rights.</li>
                <li>Validate partner escalation matrix for each destination market.</li>
                <li>Synchronise with compliance on high-risk geographies.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Forecasting & capacity
            </CardTitle>
            <CardDescription>Align staffing and automation based on expected submission load.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Zoe can simulate capacity requirements using current conversion rates and historical partner performance.
            </p>
            <Button onClick={() => openZoe("Generate admissions capacity forecast for the next intake")}>Generate forecast</Button>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Data integrations</AlertTitle>
        <AlertDescription>
          Admissions APIs and SIS connectors are synced hourly. Confirm webhook signatures in the settings module if you notice
          stale data.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AdminAdmissions;
