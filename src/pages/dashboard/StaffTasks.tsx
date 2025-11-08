"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import BackButton from "@/components/BackButton";
import StaffTasksBoard from "@/components/staff/StaffTasksBoard";
import StaffTaskOverview from "@/components/staff/StaffTaskOverview";
import StaffTaskAutomationPanel from "@/components/staff/StaffTaskAutomationPanel";
import { Skeleton } from "@/components/ui/skeleton";

export default function StaffTasks() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <BackButton to="/dashboard" label="Back" />
        <div className="grid gap-6">
          <StaffTaskOverview />
          <StaffTaskAutomationPanel />
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
            <StaffTasksBoard />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}

