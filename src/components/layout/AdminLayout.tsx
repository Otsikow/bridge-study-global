"use client";

import { type ComponentType, type SVGProps, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useUserRoles } from "@/hooks/useUserRoles";
import { LoadingState } from "@/components/LoadingState";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CreditCard,
  Building,
  Library,
  Wrench,
  Sparkles,
  Brain,
  Settings,
  Bell,
  ShieldCheck,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import gegLogo from "@/assets/geg-logo.png";
import { Badge } from "@/components/ui/badge";

/* -------------------------------------------------------------------------- */
/* ✅ Nav Items with Localization Support                                     */
/* -------------------------------------------------------------------------- */
interface NavItem {
  to: string;
  labelKey: string;
  descriptionKey: string;
  labelDefault: string;
  descriptionDefault: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/admin/overview",
    labelKey: "admin.layout.navigation.overview.label",
    descriptionKey: "admin.layout.navigation.overview.description",
    labelDefault: "Overview",
    descriptionDefault: "Executive summary",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/users",
    labelKey: "admin.layout.navigation.users.label",
    descriptionKey: "admin.layout.navigation.users.description",
    labelDefault: "Users",
    descriptionDefault: "Administrators & roles",
    icon: Users,
  },
  {
    to: "/admin/admissions",
    labelKey: "admin.layout.navigation.admissions.label",
    descriptionKey: "admin.layout.navigation.admissions.description",
    labelDefault: "Admissions Oversight",
    descriptionDefault: "Pipeline ownership",
    icon: GraduationCap,
  },
  {
    to: "/admin/payments",
    labelKey: "admin.layout.navigation.payments.label",
    descriptionKey: "admin.layout.navigation.payments.description",
    labelDefault: "Payments",
    descriptionDefault: "Stripe & payouts",
    icon: CreditCard,
  },
  {
    to: "/admin/partners",
    labelKey: "admin.layout.navigation.partners.label",
    descriptionKey: "admin.layout.navigation.partners.description",
    labelDefault: "Partners",
    descriptionDefault: "Agencies & universities",
    icon: Building,
  },
  {
    to: "/admin/resources",
    labelKey: "admin.layout.navigation.resources.label",
    descriptionKey: "admin.layout.navigation.resources.description",
    labelDefault: "Resources",
    descriptionDefault: "Content & assets",
    icon: Library,
  },
  {
    to: "/admin/tools",
    labelKey: "admin.layout.navigation.tools.label",
    descriptionKey: "admin.layout.navigation.tools.description",
    labelDefault: "Tools",
    descriptionDefault: "Automation & QA",
    icon: Wrench,
  },
  {
    to: "/admin/insights",
    labelKey: "admin.layout.navigation.insights.label",
    descriptionKey: "admin.layout.navigation.insights.description",
    labelDefault: "Insights",
    descriptionDefault: "AI & analytics",
    icon: Brain,
  },
  {
    to: "/admin/intelligence",
    labelKey: "admin.layout.navigation.intelligence.label",
    descriptionKey: "admin.layout.navigation.intelligence.description",
    labelDefault: "Zoe Intelligence",
    descriptionDefault: "AI insights console",
    icon: Sparkles,
  },
  {
    to: "/admin/settings",
    labelKey: "admin.layout.navigation.settings.label",
    descriptionKey: "admin.layout.navigation.settings.description",
    labelDefault: "Settings",
    descriptionDefault: "Tenant configuration",
    icon: Settings,
  },
  {
    to: "/admin/notifications",
    labelKey: "admin.layout.navigation.notifications.label",
    descriptionKey: "admin.layout.navigation.notifications.description",
    labelDefault: "Notifications",
    descriptionDefault: "System alerts",
    icon: Bell,
  },
  {
    to: "/admin/logs",
    labelKey: "admin.layout.navigation.logs.label",
    descriptionKey: "admin.layout.navigation.logs.description",
    labelDefault: "Logs",
    descriptionDefault: "Audit trails",
    icon: ShieldCheck,
  },
  {
    to: "/admin/usage-monitoring",
    labelKey: "admin.layout.navigation.usage.label",
    descriptionKey: "admin.layout.navigation.usage.description",
    labelDefault: "Usage Monitoring",
    descriptionDefault: "Live engagement view",
    icon: Activity,
  },
];

/* -------------------------------------------------------------------------- */
/* ✅ Helpers                                                                 */
/* -------------------------------------------------------------------------- */
const getInitials = (value: string) =>
  value
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* -------------------------------------------------------------------------- */
/* ✅ Main Admin Layout                                                       */
/* -------------------------------------------------------------------------- */
const AdminLayout = () => {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { loading: rolesLoading, hasRole } = useUserRoles();
  const [isCollapsed, setIsCollapsed] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* ✅ Role Validation                                                     */
  /* ---------------------------------------------------------------------- */
  if (rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <LoadingState message="Validating admin permissions" size="md" />
      </div>
    );
  }

  if (!hasRole("admin")) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/20 p-6 text-center">
        <Badge variant="destructive" className="uppercase tracking-wide">
          Access Restricted
        </Badge>
        <h1 className="text-2xl font-semibold">Administrator role required</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Your account does not have the necessary permissions to access the Admin Dashboard. Please contact a system
          administrator if you believe this is an error.
        </p>
        <Button asChild>
          <NavLink to="/dashboard">Return to dashboard</NavLink>
        </Button>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* ✅ Sidebar                                                             */
  /* ---------------------------------------------------------------------- */
  const sidebar = (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-300",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <img
          src={gegLogo}
          alt={t("admin.layout.sidebar.logoAlt", { defaultValue: "GEG" })}
          className="h-9 w-9 rounded-lg bg-white object-contain p-1"
        />
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {t("admin.layout.sidebar.organization", { defaultValue: "Global Education Gateway" })}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {t("admin.layout.sidebar.subtitle", { defaultValue: "Admin Control Centre" })}
            </p>
          </div>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="ml-auto h-9 w-9"
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <nav className="space-y-1 px-2 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "group block rounded-lg p-3 transition",
                  isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}> 
                  <Icon className="h-5 w-5" />
                  {!isCollapsed && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {t(item.labelKey, { defaultValue: item.labelDefault })}
                      </span>
                      <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80">
                        {t(item.descriptionKey, { defaultValue: item.descriptionDefault })}
                      </span>
                    </div>
                  )}
                </div>
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer user profile */}
      <div className="border-t p-4">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}> 
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name ?? "Admin"} />
            <AvatarFallback>{profile?.full_name ? getInitials(profile.full_name) : "AD"}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {profile?.full_name ?? t("admin.layout.profile.defaultName", { defaultValue: "Admin" })}
              </p>
              <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
            </div>
          )}
        </div>
        <Button variant="outline" className="mt-3 w-full" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>{t("common.actions.logout", { defaultValue: "Logout" })}</span>}
        </Button>
      </div>
    </div>
  );

  /* ---------------------------------------------------------------------- */
  /* ✅ Mobile Navigation Sheet                                            */
  /* ---------------------------------------------------------------------- */
  const mobileNavSheet = isMobile ? (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed left-4 top-4 z-50 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        {sidebar}
      </SheetContent>
    </Sheet>
  ) : null;

  /* ---------------------------------------------------------------------- */
  /* ✅ Layout Wrapper                                                       */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="flex min-h-screen bg-muted/20">
      {mobileNavSheet}
      <div className={cn("hidden md:flex", isCollapsed ? "md:w-20" : "md:w-72")}>{sidebar}</div>
      <div className="flex w-full flex-col">
        <main className="flex-1 bg-background">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
