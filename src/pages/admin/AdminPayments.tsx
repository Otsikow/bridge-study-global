import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CreditCard, Shield, Zap } from "lucide-react";

const openZoe = (prompt: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt } }));
};

const AdminPayments = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financial orchestration</h1>
          <p className="text-sm text-muted-foreground">
            Manage Stripe payouts, commission flows, and compliance checks from a single command surface.
          </p>
        </div>
        <Button className="gap-2" onClick={() => openZoe("Provide a finance reconciliation summary") }>
          <CreditCard className="h-4 w-4" />
          Request reconciliation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stripe integration status</CardTitle>
          <CardDescription>Critical integration touchpoints for tuition and commission disbursements.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            { label: "Webhook events", status: "Operational" },
            { label: "Payout schedule", status: "Weekly" },
            { label: "Dispute monitoring", status: "Active" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border p-4">
              <p className="text-sm font-medium">{item.label}</p>
              <Badge variant="outline" className="mt-3 text-xs uppercase tracking-wide">
                {item.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Compliance guardrails
            </CardTitle>
            <CardDescription>KYC, AML, and audit requirements surfaced in a single checklist.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Ensure every payout batch is aligned with regulatory attestations and partner verification.</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Confirm signed partner agreements before activating new payout accounts.</li>
              <li>Automate compliance attestations through Supabase edge functions.</li>
              <li>Track pending finance approvals within the notifications center.</li>
            </ul>
            <Button variant="outline" onClick={() => openZoe("Summarize outstanding finance compliance actions") }>
              Generate compliance brief
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Instant insights
            </CardTitle>
            <CardDescription>Zoe surfaces anomalies across payouts, refunds, and commission tiers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Configure alert thresholds for payout delays, Stripe disputes, or commission variance, then subscribe relevant
              teams.
            </p>
            <Separator />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Automated payout validation enabled
            </div>
            <Button variant="ghost" className="justify-start gap-2" onClick={() => openZoe("Detect anomalies in commission payouts") }>
              Ask Zoe for anomaly detection
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPayments;
