import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import gegLogo from "@/assets/geg-logo.png";
import { BarChart3, FileCheck2, FileText, Home, MessageSquare, Upload } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useMemo, type ComponentType, type SVGProps } from "react";
import { cn } from "@/lib/utils";

type PartnerNavItem = {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  view: string | null;
};

const navItems: PartnerNavItem[] = [
  { label: "Dashboard", icon: Home, view: null },
  { label: "Applications", icon: FileText, view: "applications" },
  { label: "Document Requests", icon: Upload, view: "documents" },
  { label: "Offers & CAS", icon: FileCheck2, view: "offers" },
  { label: "Messages", icon: MessageSquare, view: "messages" },
  { label: "Analytics", icon: BarChart3, view: "analytics" },
];

const DEFAULT_VIEW = "overview";

export function PartnerSidebar() {
  const location = useLocation();
  const { state } = useSidebar();

  const currentView = useMemo(() => {
    if (location.pathname !== "/dashboard") {
      return DEFAULT_VIEW;
    }
    const params = new URLSearchParams(location.search);
    const view = params.get("view");
    return view ?? DEFAULT_VIEW;
  }, [location.pathname, location.search]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-900/60 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100 shadow-xl shadow-slate-950/40 data-[state=collapsed]:bg-slate-950"
    >
      <SidebarHeader className="border-b border-slate-900/60 px-4 py-6">
        <div className="flex items-center gap-3">
          <img
            src={gegLogo}
            alt="Global Education Gateway"
            className="h-10 w-10 flex-shrink-0 rounded-lg border border-slate-800/70 bg-slate-900 object-contain p-1"
          />
          {state !== "collapsed" && (
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-slate-400">GEG</div>
              <div className="text-lg font-semibold text-slate-100">Partner</div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const target =
                  item.view === null ? "/dashboard" : `/dashboard?view=${item.view}`;
                const isActive =
                  item.view === null
                    ? currentView === DEFAULT_VIEW
                    : currentView === item.view;

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={state === "collapsed" ? item.label : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg border border-transparent bg-slate-950/60 text-sm text-slate-300 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 hover:text-slate-100",
                        isActive &&
                          "border-slate-700 bg-gradient-to-r from-slate-900 via-blue-900/70 to-slate-900 text-slate-100 shadow-inner"
                      )}
                    >
                      <Link to={target} className="flex flex-1 items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0 text-slate-300 transition-colors duration-200 group-hover:text-blue-300" />
                        {state !== "collapsed" && (
                          <span className="font-medium tracking-wide">{item.label}</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="border-t border-slate-900/60 px-2 py-4">
        <SidebarTrigger className="w-full justify-center rounded-lg border border-slate-800/80 bg-slate-900/80 text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 hover:text-slate-100" />
      </div>
    </Sidebar>
  );
}
