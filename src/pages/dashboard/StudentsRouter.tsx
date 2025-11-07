import { LoadingState } from "@/components/LoadingState";
import AgentStudentsPage from "@/pages/agent/Students";
import StaffStudents from "@/pages/dashboard/StaffStudents";
import { useUserRoles } from "@/hooks/useUserRoles";

const StudentsRouter = () => {
  const { roles, loading } = useUserRoles();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message="Loading dashboard..." size="lg" />
      </div>
    );
  }

  const hasStaffAccess = roles.includes("staff") || roles.includes("admin");
  const hasAgentAccess = roles.includes("agent");

  if (hasAgentAccess && !hasStaffAccess) {
    return <AgentStudentsPage />;
  }

  if (hasStaffAccess && !hasAgentAccess) {
    return <StaffStudents />;
  }

  return hasAgentAccess ? <AgentStudentsPage /> : <StaffStudents />;
};

export default StudentsRouter;
