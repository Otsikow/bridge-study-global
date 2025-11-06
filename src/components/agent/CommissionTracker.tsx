import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CommissionTracker() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Tracker</CardTitle>
        <CardDescription>Track your earnings and commissions</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Unavailable</AlertTitle>
          <AlertDescription>
            Commission tracking is temporarily unavailable. Please check back later.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
