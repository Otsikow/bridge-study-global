import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Calendar, Megaphone, Send } from "lucide-react";

const AdminBroadcastCenter = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Broadcast Center</h1>
          <p className="text-sm text-muted-foreground">
            Deliver coordinated announcements to agents, universities, and students from a single command hub.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Megaphone className="h-4 w-4" />
          Global audience
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose announcement</CardTitle>
          <CardDescription>
            Set the target audiences, craft the message, and optionally schedule delivery for a later time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="broadcast-title">Title</Label>
              <Input id="broadcast-title" placeholder="Winter intake onboarding" />
            </div>
            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Agents", tone: "bg-primary/10 text-primary" },
                  { label: "Universities", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100" },
                  { label: "Students", tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100" },
                ].map((chip) => (
                  <Badge key={chip.label} variant="secondary" className={chip.tone}>
                    {chip.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="broadcast-body">Message</Label>
            <Textarea id="broadcast-body" placeholder="Share updates, deadlines, or campaign details..." rows={6} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="broadcast-link">Reference link</Label>
              <Input id="broadcast-link" type="url" placeholder="https://" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Enable scheduling</p>
                <p className="text-xs text-muted-foreground">Queue announcement to deploy later.</p>
              </div>
              <Switch id="broadcast-schedule" />
            </div>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Last scheduled: 3 days ago
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Save draft</Button>
              <Button className="gap-2">
                <Send className="h-4 w-4" />
                Send now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent broadcasts</CardTitle>
          <CardDescription>Track delivery status and engagement performance for the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {["Visa document reminder", "Agent commission updates", "University onboarding checklist"].map((title, index) => (
            <div key={title} className="rounded-lg border p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">Delivered to all channels • {index + 1}w ago</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Separator orientation="vertical" className="hidden h-6 md:block" />
                  <span>Open rate: {index === 0 ? "68%" : index === 1 ? "74%" : "82%"}</span>
                  <span>Clicks: {index === 0 ? "240" : index === 1 ? "312" : "154"}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBroadcastCenter;
