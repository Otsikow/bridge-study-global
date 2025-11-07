import { SidebarTrigger } from "@/components/ui/sidebar";
import gegLogo from "@/assets/geg-logo.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export function PartnerHeader() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = useMemo(() => {
    if (!profile?.full_name) return "P";
    const [first, second] = profile.full_name.split(" ");
    if (!second) return first.charAt(0).toUpperCase();
    return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
  }, [profile?.full_name]);

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-900/70 bg-slate-950/75 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="rounded-lg border border-slate-800 bg-slate-900/80 text-slate-200 hover:border-slate-700 hover:bg-slate-900" />
        <div className="flex items-center gap-3">
          <img
            src={gegLogo}
            alt="GEG Partner"
            className="hidden h-12 w-12 rounded-xl border border-slate-800 bg-slate-900/70 p-2 md:block dark:brightness-0 dark:invert"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Global Education Gateway</p>
            <h1 className="text-lg font-semibold text-slate-100 md:text-2xl">Partner Dashboard</h1>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full border border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:text-white"
        >
          <Bell className="h-4 w-4" />
          <Badge className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full bg-blue-500 text-[10px] leading-none">
            3
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-left text-sm text-slate-200 hover:border-slate-700 hover:text-white"
            >
              <Avatar className="h-10 w-10 border border-slate-700">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                ) : (
                  <AvatarFallback className="bg-blue-600/20 text-blue-200">{initials}</AvatarFallback>
                )}
              </Avatar>
              <div className="hidden text-left leading-tight md:block">
                <div className="font-semibold text-slate-100">{profile?.full_name ?? "GEG Partner"}</div>
                <div className="text-xs text-slate-400">{profile?.email ?? "partner@gateway.edu"}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60 bg-slate-900 text-slate-100">
            <DropdownMenuLabel>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{profile?.full_name ?? "GEG Partner"}</p>
                <p className="text-xs text-slate-400">{profile?.email ?? "partner@gateway.edu"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem onClick={() => navigate("/profile/settings")} className="gap-2 text-slate-200">
              <Settings className="h-4 w-4" />
              Account settings
            </DropdownMenuItem>
            <DropdownMenuItem
                onClick={() => navigate("/partner/messages")}
              className="gap-2 text-slate-200"
            >
              <Bell className="h-4 w-4" />
              Inbox & updates
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem
              onClick={() => {
                void signOut();
              }}
              className="gap-2 text-red-400 focus:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
