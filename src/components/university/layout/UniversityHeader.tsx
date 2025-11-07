import { Menu, RefreshCcw, Bell } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
  const navigate = useNavigate();

  const partnerProfileQuery = useQuery({
    queryKey: ["university-partner-profile", profile?.id, profile?.tenant_id],
    enabled: Boolean(profile?.id),
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      if (!profile?.id) {
        throw new Error("Cannot load partner profile without an authenticated user");
      }

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, tenant_id")
        .eq("id", profile.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      let displayName =
        profileRow?.full_name?.trim() ||
        profile?.full_name?.trim() ||
        "University Partner";
      let avatarUrl = profileRow?.avatar_url ?? profile?.avatar_url ?? null;

      if (profileRow?.tenant_id) {
        const { data: universityRow, error: universityError } = await supabase
          .from("universities")
          .select("name, logo_url")
          .eq("tenant_id", profileRow.tenant_id)
          .eq("active", true)
          .maybeSingle();

        if (!universityError && universityRow) {
          displayName = universityRow.name ?? displayName;
          avatarUrl = universityRow.logo_url ?? avatarUrl;
        } else if (universityError) {
          console.warn(
            "Unable to load university details for header menu",
            universityError,
          );
        }
      }

      return {
        displayName,
        avatarUrl,
        contactEmail: profileRow?.email ?? profile?.email ?? null,
        contactName: profileRow?.full_name ?? profile?.full_name ?? null,
        roleLabel: "University Partner" as const,
      };
    },
  });

  const partnerProfile = partnerProfileQuery.data ?? {
    displayName: profile?.full_name ?? "University Partner",
    avatarUrl: profile?.avatar_url ?? null,
    contactEmail: profile?.email ?? null,
    contactName: profile?.full_name ?? null,
    roleLabel: "University Partner" as const,
  };

  const initials = useMemo(() => {
    const basis =
      partnerProfile.displayName ||
      partnerProfile.contactName ||
      profile?.full_name ||
      "UP";
    const derived = basis
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((namePart) => namePart.charAt(0).toUpperCase())
      .join("");
    return derived || "UP";
  }, [partnerProfile.displayName, partnerProfile.contactName, profile?.full_name]);

  const title = resolveSectionTitle(location.pathname);

  const handleViewProfile = () => {
    navigate("/profile/settings?tab=profile");
  };

  const handleAccountSettings = () => {
    navigate("/profile/settings?tab=account");
  };

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
                  {partnerProfile.avatarUrl ? (
                    <AvatarImage
                      src={partnerProfile.avatarUrl}
                      alt={partnerProfile.displayName ?? "University Partner"}
                    />
                  ) : null}
                  <AvatarFallback className="bg-blue-600/70 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left leading-tight md:block">
                  {partnerProfileQuery.isLoading ? (
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-3 w-24 bg-slate-800/80" />
                      <Skeleton className="h-2.5 w-20 bg-slate-800/70" />
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium">
                        {partnerProfile.displayName}
                      </span>
                      <p className="text-xs text-slate-400">
                        {partnerProfile.roleLabel}
                      </p>
                    </>
                  )}
                </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="end"
            className="w-56 border-slate-800 bg-slate-900/95 text-slate-200"
          >
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-slate-100">
                    {partnerProfile.displayName}
                  </span>
                  <span className="text-xs font-medium text-blue-300">
                    {partnerProfile.roleLabel}
                  </span>
                  {partnerProfile.contactName &&
                    partnerProfile.contactName !== partnerProfile.displayName && (
                      <span className="text-xs text-slate-400">
                        Contact: {partnerProfile.contactName}
                      </span>
                    )}
                  {partnerProfile.contactEmail && (
                    <span className="text-xs text-slate-500">
                      {partnerProfile.contactEmail}
                    </span>
                  )}
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                onSelect={handleViewProfile}
                className="focus:bg-slate-800 focus:text-slate-50"
              >
                View Profile
            </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleAccountSettings}
                className="focus:bg-slate-800 focus:text-slate-50"
              >
                Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem
              className="focus:bg-red-600/70 focus:text-white"
                onSelect={() => {
                  void signOut();
                }}
            >
                Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
