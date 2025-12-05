import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppFooter } from "@/components/layout/AppFooter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";

const formatRoleLabel = (role?: string | null) =>
  role ? role.replace(/_/g, " ") : "User";

const getInitials = (value?: string | null) =>
  value
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "UD";

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
  const { profile } = useAuth();
  const { primaryRole } = useUserRoles();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const roleLabel = formatRoleLabel(primaryRole);

  return (
    <div className="sticky top-0 z-30 flex flex-col gap-3 border-b bg-background/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <SidebarTrigger
          className="h-8 w-8"
          aria-label={state === "collapsed" ? "Expand navigation" : "Collapse navigation"}
        />
        <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
          {state === "collapsed" ? "Expand navigation" : "Collapse navigation"}
        </span>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-background/90 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(profile?.full_name)}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80">Welcome back</p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold leading-tight">Hi, {firstName}</h2>
              <Badge variant="secondary" className="text-[11px] capitalize">
                {roleLabel}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              Your UniDoxia agent greeting stays visible across the dashboard.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2">
          <div className="space-y-0.5 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Theme & Agent
            </p>
            <p className="text-xs text-muted-foreground">
              Toggle light or dark mode—your assistant stays with you.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
