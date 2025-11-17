import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppFooter } from "@/components/layout/AppFooter";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="bg-gradient-subtle">
          <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
              <SidebarTrigger className="shrink-0" />
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <main className="flex-1 animate-fade-in">{children}</main>
            <AppFooter />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
