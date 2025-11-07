import { NavLink } from "react-router-dom";
import {
  BarChart3,
  FileSpreadsheet,
  FileStack,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Stamp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UniversitySidebarProps {
  onNavigate?: () => void;
  className?: string;
}

const navItems = [
  {
    label: "Overview",
    to: "/university",
    icon: LayoutDashboard,
  },
  {
    label: "Applications",
    to: "/university/applications",
    icon: FileStack,
  },
  {
    label: "Documents",
    to: "/university/documents",
    icon: FileSpreadsheet,
  },
  {
    label: "Messages",
    to: "/university/messages",
    icon: MessageSquare,
  },
  {
    label: "Offers & CAS",
    to: "/university/offers-cas",
    icon: Stamp,
  },
  {
    label: "Analytics",
    to: "/university/analytics",
    icon: BarChart3,
  },
  {
    label: "Programs",
    to: "/university/programs",
    icon: GraduationCap,
  },
];

export const UniversitySidebar = ({
  onNavigate,
  className,
}: UniversitySidebarProps) => {
  return (
    <aside
      className={cn(
        "hidden w-72 shrink-0 flex-col border-r border-slate-800 bg-[#0A1120] px-4 py-6 text-slate-200 shadow-xl shadow-slate-950/40 lg:flex",
        className,
      )}
    >
      <div className="flex items-center gap-3 px-4">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-sky-500 to-indigo-500 text-lg font-semibold text-white shadow-lg shadow-blue-900/40">
          G
        </span>
        <div>
          <p className="text-sm uppercase tracking-[0.3rem] text-slate-400">
            GEG
          </p>
          <h1 className="text-base font-semibold leading-tight text-slate-100">
            University Portal
          </h1>
        </div>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/university"}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  "hover:bg-slate-800/80 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
                  isActive
                    ? "bg-gradient-to-r from-blue-600/80 via-indigo-600/80 to-slate-900 text-white shadow-lg shadow-blue-900/30"
                    : "text-slate-400",
                )
              }
              onClick={onNavigate}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isActive ? "scale-110 text-white" : "text-slate-500",
                    )}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-xs text-slate-400">
        <p className="font-medium text-slate-200">Need assistance?</p>
        <p className="mt-1">
          Visit the partner help center or contact your GEG partnership manager.
        </p>
      </div>
    </aside>
  );
};
