import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, ShieldCheck, Users } from "lucide-react";

const CHANNELS = [
  { name: "Admissions escalations", members: 12, status: "Priority" },
  { name: "Agent onboarding", members: 28, status: "Active" },
  { name: "Compliance alerts", members: 9, status: "Restricted" },
];

const MESSAGES = [
  {
    author: "Taylor (Support Lead)",
    initials: "TS",
    body: "We resolved the outstanding visa document issue; notifying the student now.",
    timestamp: "2:14 PM",
  },
  {
    author: "Morgan (Admissions)",
    initials: "MA",
    body: "Great! Please tag this thread and update the weekly summary dashboard.",
    timestamp: "2:16 PM",
  },
  {
    author: "Jordan (Agent Success)",
    initials: "JA",
    body: "Adding @Region-APAC to ensure they communicate the change to partner agents.",
    timestamp: "2:18 PM",
  },
];

const AdminChatConsole = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Chat Console</h1>
          <p className="text-sm text-muted-foreground">
            Coordinate across teams with governance-ready chat channels and searchable archives.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <ShieldCheck className="h-4 w-4" />
          Audit logging on
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Channels
            </CardTitle>
            <CardDescription>Spin up internal workspaces for focused collaboration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Search channels" />
            <div className="space-y-3">
              {CHANNELS.map((channel) => (
                <div key={channel.name} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{channel.name}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{channel.members} members</span>
                    <Badge variant="secondary">{channel.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full">Create channel</Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Admissions escalations
            </CardTitle>
            <CardDescription>Secure channel with message retention and export controls.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <ScrollArea className="h-64 rounded-md border">
              <div className="space-y-4 p-4">
                {MESSAGES.map((message) => (
                  <div key={message.timestamp} className="flex gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{message.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-sm">{message.author}</span>
                        <span className="text-muted-foreground">{message.timestamp}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{message.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="space-y-2">
              <Label htmlFor="chat-reply" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Draft response
              </Label>
              <Textarea id="chat-reply" rows={4} placeholder="Share updates, attach notes, or hand off the request..." />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm">
                Add attachment
              </Button>
              <Button className="gap-2">
                <Send className="h-4 w-4" />
                Send reply
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retention policy</CardTitle>
          <CardDescription>Transparency for data governance teams.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          {["Message history", "File exports", "Escalation tags"].map((label, index) => (
            <div key={label} className="rounded-lg border p-4">
              <p className="text-sm font-semibold">{label}</p>
              <Separator className="my-3" />
              <p className="text-sm text-muted-foreground">
                {index === 0 && "12 month retention with automated legal hold."}
                {index === 1 && "Exports limited to security administrators."}
                {index === 2 && "Escalations synced to the compliance dashboard."}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChatConsole;
