import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import { IconTooltip } from "@/components/agent/IconTooltip";

export default function AgentDashboardOverview() {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-6">
        <Alert className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <IconTooltip label="Dashboard status alert">
            <AlertCircle className="h-4 w-4" />
          </IconTooltip>
          <div className="space-y-1">
            <AlertTitle>Dashboard Unavailable</AlertTitle>
            <AlertDescription>
              The agent dashboard is temporarily unavailable. Please contact support for assistance.
            </AlertDescription>
          </div>
        </Alert>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Data unavailable</p>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Data unavailable</p>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Data unavailable</p>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Data unavailable</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Keep working while we restore data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                You can continue navigating to specific tools using the tabs above. When the dashboard is back online, your
                workflow will automatically include new insights and refreshed metrics.
              </p>
              <ul className="list-disc space-y-2 pl-4">
                <li>Use the Tasks tab to review assignments and deadlines.</li>
                <li>Open Applications to monitor progress for each student.</li>
                <li>Check Resources for updated playbooks and university assets.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Need help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Our support team can provide status updates and help troubleshoot access issues. Share the steps that led you
                here for a faster resolution.
              </p>
              <p className="text-xs text-muted-foreground/80">support@unidoxia.com · +1 (800) 555-0148</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
