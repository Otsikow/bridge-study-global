import { Outlet } from "react-router-dom";
import { UniversityDashboardLayout } from "@/components/university/layout/UniversityDashboardLayout";

const UniversityDashboard = () => {
  return (
    <UniversityDashboardLayout>
      <Outlet />
    </UniversityDashboardLayout>
  );
};

export default UniversityDashboard;
