
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useStudent } from "@/hooks/useStudent";
import { useParams } from "react-router-dom";
import ApplicationProgress from "@/components/agent/ApplicationProgress";
import Chat from "@/components/agent/Chat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LeadQualificationDetails from "@/components/agent/LeadQualificationDetails";

export default function StudentDetailsPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { data: student, isLoading, error } = useStudent(studentId || "");

  if (!studentId) {
    return <div>Student not found.</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">Lead file</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {student?.first_name} {student?.last_name}
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Latest profile details synced from the CRM.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Email:</span> {student?.email}
                </p>
                <p>
                  <span className="font-medium">Country:</span> {student?.country}
                </p>
                <p>
                  <span className="font-medium">Status:</span> {student?.status}
                </p>
              </CardContent>
            </Card>
            {student && <LeadQualificationDetails lead={student} />}
          </div>
          <div className="space-y-6">
            {studentId && <ApplicationProgress studentId={studentId} />}
          </div>
        </div>
        <div>{studentId && <Chat studentId={studentId} />}</div>
      </div>
    </DashboardLayout>
  );
}
