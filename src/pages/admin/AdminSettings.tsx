import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings2, ShieldCheck } from "lucide-react";
import { useState } from "react";

const openZoe = (prompt: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt } }));
};

const AdminSettings = () => {
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [auditAlerts, setAuditAlerts] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure tenant-wide policies, integrations, and automation defaults.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => openZoe("Review security posture for settings changes") }>
          <ShieldCheck className="h-4 w-4" />
          Security review
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Access control
          </CardTitle>
          <CardDescription>Govern authentication requirements and privileged role assignments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="mfa">Enforce multi-factor authentication</Label>
              <p className="text-sm text-muted-foreground">Mandate MFA for every admin and finance user.</p>
            </div>
            <Switch id="mfa" checked={mfaEnforced} onCheckedChange={setMfaEnforced} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="audit-alerts">Real-time audit alerts</Label>
              <p className="text-sm text-muted-foreground">Send alerts when privileged settings change.</p>
            </div>
            <Switch id="audit-alerts" checked={auditAlerts} onCheckedChange={setAuditAlerts} />
          </div>
          <Button onClick={() => openZoe("Summarize recent configuration changes") }>Summarize changes</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
