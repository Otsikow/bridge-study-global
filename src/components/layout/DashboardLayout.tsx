import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppFooter } from "@/components/layout/AppFooter";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-y-auto bg-gradient-subtle">
          <div className="md:hidden bg-background/80 backdrop-blur border-b p-2 animate-slide-in-down">
            <SidebarTrigger />
          </div>
          <main className="flex-1 animate-fade-in">{children}</main>
          <AppFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}
