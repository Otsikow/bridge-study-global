import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Grid, ListChecks, Wrench, Workflow } from "lucide-react";

const openZoe = (prompt: string) => {
  window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt } }));
};

const adminUtilities = [
  {
    title: "Automation Studio",
    description: "Build, test, and deploy automation recipes for your admissions and finance workflows.",
    icon: Workflow,
    actions: [
      {
        label: "Blueprint library",
        prompt: "Show recommended automation blueprints for admissions triage.",
      },
      {
        label: "Detect blockers",
        prompt: "Audit failed automations blocking student onboarding this week.",
      },
    ],
  },
  {
    title: "Quality Toolkit",
    description: "Standardize QA reviews, audits, and compliance sweeps across the admin workspace.",
    icon: ListChecks,
    actions: [
      {
        label: "Launch QA checklist",
        prompt: "Generate a QA checklist for newly onboarded partners.",
      },
      {
        label: "Escalate with Zoe",
        prompt: "Summarize outstanding compliance items that require executive review.",
      },
    ],
  },
  {
    title: "Workspace Catalog",
    description: "Curate dashboards, partner spaces, and shared resources for privileged staff.",
    icon: Grid,
    actions: [
      {
        label: "Provision space",
        prompt: "Outline the steps to provision a partner success workspace for the APAC region.",
      },
      {
        label: "Content audit",
        prompt: "Evaluate content freshness for the global admissions workspace.",
      },
    ],
  },
];

const AdminTools = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Badge variant="outline" className="gap-1 text-xs uppercase tracking-wide">
          <Wrench className="h-3.5 w-3.5" /> Tools Command Center
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Operations Toolkit</h1>
        <p className="text-muted-foreground max-w-2xl">
          Launch automation blueprints, coordinate audits, and manage curated workspaces for your global admin team.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {adminUtilities.map((utility) => {
          const Icon = utility.icon;
          return (
            <Card key={utility.title} className="flex flex-col">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className="text-xl font-semibold">{utility.title}</CardTitle>
                    <CardDescription>{utility.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <Separator />
                <div className="space-y-2">
                  {utility.actions.map((action) => (
                    <Button
                      key={action.label}
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={() => openZoe(action.prompt)}
                    >
                      <Wrench className="h-4 w-4" />
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-medium">{action.label}</span>
                        <span className="text-xs text-muted-foreground">Tap Zoe to orchestrate this workflow.</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTools;
