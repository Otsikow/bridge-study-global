import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import { IconTooltip } from "@/components/agent/IconTooltip";

export default function AgentDashboardOverview() {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-6">
        <Alert>
          <IconTooltip label="Dashboard status alert">
            <AlertCircle className="h-4 w-4" />
          </IconTooltip>
          <AlertTitle>Dashboard Unavailable</AlertTitle>
          <AlertDescription>
            The agent dashboard is temporarily unavailable. Please contact support for assistance.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Data unavailable</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Data unavailable</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Data unavailable</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Data unavailable</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
