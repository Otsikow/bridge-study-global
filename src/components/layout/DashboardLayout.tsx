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
        <SidebarInset className="bg-gradient-subtle">
          <div className="flex flex-1 flex-col overflow-hidden">
            <SidebarToolbar />
            <main className="flex-1 animate-fade-in overflow-y-auto">
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
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger
        className="h-10 w-10"
        aria-label={state === "collapsed" ? "Expand navigation" : "Collapse navigation"}
      />
      <div className="flex-1 text-xs text-muted-foreground sm:text-sm">
        {state === "collapsed"
          ? "Expand the navigation to view full menu labels."
          : "Collapse the navigation to maximize your workspace."}
      </div>
    </div>
  );
}
