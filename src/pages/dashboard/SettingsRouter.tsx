import StaffSettings from "@/pages/dashboard/StaffSettings";
import AgentSettings from "@/pages/agent/Settings";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsRouter() {
  const { profile } = useAuth();

  if (profile?.role === "staff" || profile?.role === "admin") {
    return <StaffSettings />;
  }

  return <AgentSettings />;
}
