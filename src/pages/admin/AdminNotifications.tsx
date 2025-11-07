import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BellRing, Inbox, MailCheck } from "lucide-react";

const openZoe = (prompt: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt } }));
};

const AdminNotifications = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notification center</h1>
          <p className="text-sm text-muted-foreground">
            Configure multi-channel alerts for admissions, finance, and platform operations.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => openZoe("Design a notification campaign for upcoming intake") }>
          <BellRing className="h-4 w-4" />
          Plan campaign
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery overview</CardTitle>
          <CardDescription>Channel performance across the last 7 days.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            { label: "Email", status: "99% delivery" },
            { label: "SMS", status: "96% delivery" },
            { label: "In-app", status: "Realtime" },
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
              <Inbox className="h-5 w-5 text-primary" />
              Templates & automation
            </CardTitle>
            <CardDescription>Centralize notification templates for every audience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Map key lifecycle events to dynamic templates across locales and languages.</p>
            <Separator />
            <Button onClick={() => openZoe("Audit notification templates for compliance") }>
              Run compliance audit
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailCheck className="h-5 w-5 text-primary" />
              Escalations
            </CardTitle>
            <CardDescription>Define fallback channels for critical alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Escalate high-priority items to leadership with automatic context pulled from Zoe.</p>
            <Button variant="ghost" className="justify-start" onClick={() => openZoe("Draft escalation policy updates") }>
              Draft escalation policy
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotifications;
