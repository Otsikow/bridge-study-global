import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, CircleCheck, Users } from "lucide-react";

const openZoe = (prompt: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt } }));
};

const AdminPartners = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Partner governance</h1>
          <p className="text-sm text-muted-foreground">
            Orchestrate strategic partnerships with agencies and universities across every region.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => openZoe("Highlight partner accounts needing executive attention") }>
          <Users className="h-4 w-4" />
          Partner briefing
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partnership tiers</CardTitle>
          <CardDescription>Track value streams and obligations for each partner classification.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            { label: "Strategic", summary: "Co-marketing, dedicated admissions pod" },
            { label: "Growth", summary: "Quarterly planning cadence" },
            { label: "Emerging", summary: "Onboarding and enablement" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{item.label}</span>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Active</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Onboarding readiness
          </CardTitle>
          <CardDescription>Ensure contractual, legal, and training requirements are fulfilled before go-live.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Coordinate with legal and compliance to confirm regulatory alignments prior to activating new partners.</p>
          <Separator />
          <div className="flex items-center gap-2">
            <CircleCheck className="h-4 w-4 text-emerald-500" />
            Standardised enablement templates published to partner portal
          </div>
          <Button onClick={() => openZoe("Summarize pending partner onboarding requirements") }>
            Generate onboarding summary
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPartners;
