import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CreditCard,
  Building,
  Library,
  Brain,
  Settings,
  Bell,
  ShieldCheck,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import gegLogo from "@/assets/geg-logo.png";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  to: string;
  labelKey: string;
  descriptionKey: string;
  labelDefault: string;
  descriptionDefault: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
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
];

const getInitials = (value: string) =>
  value
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const AdminLayout = () => {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const isMobile = useIsMobile();

  const sidebar = (
    <div className="flex h-full w-72 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <img
          src={gegLogo}
          alt={t("admin.layout.sidebar.logoAlt", { defaultValue: "GEG" })}
          className="h-9 w-9 rounded-lg bg-white object-contain p-1"
        />
        <div>
          <p className="text-sm font-semibold">
            {t("admin.layout.sidebar.organization", { defaultValue: "Global Education Gateway" })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("admin.layout.sidebar.subtitle", { defaultValue: "Admin Control Center" })}
          </p>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <nav className="space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={cn("group block rounded-lg p-3 transition", isActive ? "bg-primary/10 text-primary" : "hover:bg-muted")}>
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {t(item.labelKey, { defaultValue: item.labelDefault })}
                    </span>
                    <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80">
                      {t(item.descriptionKey, { defaultValue: item.descriptionDefault })}
                    </span>
                  </div>
                </div>
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={profile?.avatar_url ?? undefined}
              alt={profile?.full_name ?? t("admin.layout.profile.defaultName", { defaultValue: "Admin" })}
            />
            <AvatarFallback>{profile?.full_name ? getInitials(profile.full_name) : "AD"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {profile?.full_name ?? t("admin.layout.profile.defaultName", { defaultValue: "Admin" })}
            </p>
            <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
        <Button variant="outline" className="mt-3 w-full" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4" />
          {t("common.actions.logout")}
        </Button>
      </div>
    </div>
  );

  const header = (
    <header className="flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-8">
      <div className="flex items-center gap-3">
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">
                  {t("admin.layout.header.openNavigation", { defaultValue: "Open navigation" })}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              {sidebar}
            </SheetContent>
          </Sheet>
        ) : null}
        <div className="hidden md:flex flex-col">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("admin.layout.header.organization", { defaultValue: "Global Education Gateway" })}
          </span>
          <span className="text-lg font-semibold">
            {t("admin.layout.header.workspace", { defaultValue: "Administrator Workspace" })}
          </span>
        </div>
        <Badge variant="outline" className="md:ml-3">
          {t("admin.layout.header.privilegedAccess", { defaultValue: "Privileged access" })}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher size="sm" />
        <ThemeToggle />
        <Button
          variant="outline"
          className="gap-2"
          size="sm"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("zoe:open-chat", {
                detail: {
                  prompt: t("admin.layout.header.askZoePrompt", {
                    defaultValue: "Provide a governance summary for today",
                  }),
                },
              }),
            )
          }
        >
          <Sparkles className="h-4 w-4" />
          {t("admin.layout.header.askZoe", { defaultValue: "Ask Zoe" })}
        </Button>
      </div>
    </header>
  );

  return (
    <div className="flex min-h-screen bg-muted/20">
      <div className="hidden md:flex md:w-72">{sidebar}</div>
      <div className="flex w-full flex-col">
        {header}
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
