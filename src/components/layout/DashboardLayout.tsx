import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppFooter } from "@/components/layout/AppFooter";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="bg-gradient-subtle min-w-0">
          <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
            <SidebarToolbar />
            <main className="flex-1 min-w-0 animate-fade-in overflow-y-auto">
              <div className="page-shell py-4 sm:py-6 lg:py-8">{children}</div>
            </main>
            <AppFooter />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function SidebarToolbar() {
  const { state } = useSidebar();

  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger
        className="h-8 w-8"
        aria-label={state === "collapsed" ? "Expand navigation" : "Collapse navigation"}
      />
    </div>
  );
}
