import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LeadsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Leads</CardTitle>
        <CardDescription>Manage your student leads</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Unavailable</AlertTitle>
          <AlertDescription>
            Leads management is temporarily unavailable. Please check back later.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
