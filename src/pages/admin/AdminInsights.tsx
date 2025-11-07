import ZoeAdminInsightsPanel from "@/components/admin/ZoeAdminInsightsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Lightbulb } from "lucide-react";

const openZoe = (prompt: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt } }));
};

const AdminInsights = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI insights</h1>
          <p className="text-sm text-muted-foreground">
            Curate Zoe’s strategic insights for finance, admissions, and partner stakeholders.
          </p>
        </div>
        <Button className="gap-2" onClick={() => openZoe("Compile executive summary for daily stand-up") }>
          <Lightbulb className="h-4 w-4" />
          Generate summary
        </Button>
      </div>

      <ZoeAdminInsightsPanel loading />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            Intelligence routing
          </CardTitle>
          <CardDescription>Distribute Zoe’s insights to key stakeholders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Configure audience-specific digests with localized language and timezone-aware delivery.</p>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Common automations</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Daily admissions velocity highlights to regional leadership.</li>
              <li>Finance variance alerts routed to payout approvers.</li>
              <li>Partner risk insights delivered to compliance analysts.</li>
            </ul>
          </div>
          <Button variant="outline" onClick={() => openZoe("Design a new AI insight automation") }>
            Build new automation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInsights;
