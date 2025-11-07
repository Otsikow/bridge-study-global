import { Menu, RefreshCcw, Bell } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface UniversityHeaderProps {
  onRefresh?: () => void;
  refreshing?: boolean;
  onToggleMobileNav?: () => void;
}

const resolveSectionTitle = (pathname: string) => {
  const base = pathname.replace(/^\/+|\/+$/g, "");
  if (!base || base === "university") return "Overview";
  const parts = base.split("/");
  const lastSegment = parts[parts.length - 1];
  return lastSegment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const UniversityHeader = ({
  onRefresh,
  refreshing,
  onToggleMobileNav,
}: UniversityHeaderProps) => {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((namePart) => namePart.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "GE";

  const title = resolveSectionTitle(location.pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800 bg-[#0C1528]/95 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-300 hover:bg-slate-800/70 lg:hidden"
          onClick={onToggleMobileNav}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-xs uppercase tracking-[0.4rem] text-slate-500">
            Global Education Gateway
          </p>
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "text-slate-300 hover:bg-slate-800/60",
            refreshing && "cursor-progress opacity-70",
          )}
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCcw className={cn("h-5 w-5", refreshing && "animate-spin")} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-slate-300 hover:bg-slate-800/60"
        >
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-xl bg-slate-900/60 px-2 py-1 text-sm text-slate-100 hover:bg-slate-800/80"
            >
              <Avatar className="h-8 w-8 border border-blue-500/30 bg-slate-800">
                {profile?.avatar_url ? (
                  <AvatarImage
                    src={profile.avatar_url}
                    alt={profile.full_name}
                  />
                ) : null}
                <AvatarFallback className="bg-blue-600/70 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight md:block">
                <span className="text-sm font-medium">
                  {profile?.full_name || "GEG Partner"}
                </span>
                <p className="text-xs text-slate-400">{profile?.email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="end"
            className="w-56 border-slate-800 bg-slate-900/95 text-slate-200"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">
                  {profile?.full_name || "GEG Partner"}
                </span>
                <span className="text-xs text-slate-400">
                  {profile?.email || "partner@geg.global"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem className="focus:bg-slate-800 focus:text-slate-50">
              View profile
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-slate-800 focus:text-slate-50">
              Account settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem
              className="focus:bg-red-600/70 focus:text-white"
              onClick={() => void signOut()}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
