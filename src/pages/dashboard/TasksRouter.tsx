import { LoadingState } from "@/components/LoadingState";
import AgentTasksPage from "@/pages/agent/Tasks";
import StaffTasks from "@/pages/dashboard/StaffTasks";
import { useUserRoles } from "@/hooks/useUserRoles";

const TasksRouter = () => {
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
    return <AgentTasksPage />;
  }

  if (hasStaffAccess && !hasAgentAccess) {
    return <StaffTasks />;
  }

  return hasAgentAccess ? <AgentTasksPage /> : <StaffTasks />;
};

export default TasksRouter;
