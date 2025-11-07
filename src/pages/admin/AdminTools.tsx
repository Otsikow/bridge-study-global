import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Megaphone, MessageSquare, BarChart3 } from "lucide-react";

const tools = [
  {
    title: "Broadcast Center",
    description: "Send urgent or scheduled announcements to every audience in a single workflow.",
    to: "/admin/tools/broadcast-center",
    icon: Megaphone,
    badge: "Global",
    badgeTone: "bg-primary/10 text-primary",
  },
  {
    title: "Admin Chat Console",
    description: "Coordinate with staff and agents through internal, auditable chat rooms.",
    to: "/admin/tools/chat-console",
    icon: MessageSquare,
    badge: "Internal",
    badgeTone: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
  },
  {
    title: "Performance Reports",
    description: "Generate polished PDF summaries of monthly activity for leadership reviews.",
    to: "/admin/tools/performance-reports",
    icon: BarChart3,
    badge: "Automated",
    badgeTone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  },
];

const AdminTools = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Optional admin tools</h1>
          <p className="text-sm text-muted-foreground">
            Extend the control center with broadcast messaging, internal collaboration, and executive-ready reporting.
          </p>
        </div>
        <Button asChild className="gap-2" variant="outline">
          <Link to="/admin/insights">
            View automation insights
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Workspace integrations</CardTitle>
          <CardDescription>
            Launch dedicated consoles tailored for communication, coordination, and performance reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.to}
                  to={tool.to}
                  className="group block h-full rounded-lg border p-5 transition hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className={tool.badgeTone}>
                      {tool.badge}
                    </Badge>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">{tool.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                    Open console
                  </span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How teams are using these add-ons</CardTitle>
          <CardDescription>
            Activate only the tools your organization needs while keeping a consistent governance model.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold">University relations</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Share accreditation updates and recruiting pushes with one-click broadcast templates.
            </p>
          </div>
          <Separator className="md:hidden" />
          <div>
            <p className="text-sm font-semibold">Global support</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Resolve escalations faster with dedicated internal chat channels and saved responses.
            </p>
          </div>
          <Separator className="md:hidden" />
          <div>
            <p className="text-sm font-semibold">Executive leadership</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Deliver board-ready PDF summaries highlighting application pipelines and financial performance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTools;
