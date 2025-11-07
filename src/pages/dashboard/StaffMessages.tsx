import StaffMessagesTable from "@/components/staff/StaffMessagesTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import BackButton from "@/components/BackButton";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StaffMessages() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <BackButton to="/dashboard" label="Back" />
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
          <StaffMessagesTable />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
