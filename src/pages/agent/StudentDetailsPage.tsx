
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useStudent } from "@/hooks/useStudent";
import { useParams } from "react-router-dom";
import ApplicationProgress from "@/components/agent/ApplicationProgress";
import Chat from "@/components/agent/Chat";

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
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {student?.first_name} {student?.last_name}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold">Contact Information</h2>
            <div className="space-y-2 mt-2">
              <p>
                <strong>Email:</strong> {student?.email}
              </p>
              <p>
                <strong>Country:</strong> {student?.country}
              </p>
              <p>
                <strong>Status:</strong> {student?.status}
              </p>
            </div>
          </div>
          <div>
            {studentId && <ApplicationProgress studentId={studentId} />}
          </div>
        </div>
        <div>
          {studentId && <Chat studentId={studentId} />}
        </div>
      </div>
    </DashboardLayout>
  );
}
