import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Menu, LogOut, Settings, Home } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import gegLogo from "@/assets/geg-logo.png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

const navLinks = [
  { id: "home", to: "/" },
  { id: "search", to: "/search" },
  { id: "courses", to: "/courses" },
  { id: "blog", to: "/blog" },
  { id: "contact", to: "/contact" },
] as const;

const AppNavbar = () => {
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const dashboardPath = profile?.role === "partner" ? "/university" : "/dashboard";

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-slide-in-down">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 w-10 rounded-full p-0 md:hidden"
                  aria-label={t("common.labels.toggleNavigation")}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:max-w-sm p-0">
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
                    <Link
                      to="/"
                      className="flex items-center gap-2"
                      onClick={() => setMobileOpen(false)}
                    >
                      <img
                        src={gegLogo}
                        alt={t("layout.navbar.brand.short")}
                        className="h-8 w-8 object-contain dark:brightness-0 dark:invert"
                      />
                      <span className="text-base font-semibold">{t("layout.navbar.brand.short")}</span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <LanguageSwitcher size="sm" />
                      <ThemeToggle />
                    </div>
                  </div>
                  <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                    {navLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
                        onClick={() => setMobileOpen(false)}
                      >
                        {t(`layout.navbar.links.${link.id}`)}
                      </Link>
                    ))}
                  </nav>
                  <Separator />
                  <div className="px-6 py-4 space-y-3">
                    {profile ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} />
                            <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{profile.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button asChild variant="outline" size="sm" onClick={() => setMobileOpen(false)}>
                            <Link to={dashboardPath}>{t("common.navigation.dashboard")}</Link>
                          </Button>
                          <Button asChild size="sm" onClick={() => setMobileOpen(false)}>
                            <Link to="/settings">{t("common.navigation.settings")}</Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="col-span-2"
                            onClick={() => {
                              setMobileOpen(false);
                              void signOut();
                            }}
                          >
                            {t("common.actions.logout")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button asChild variant="outline" className="w-full" onClick={() => setMobileOpen(false)}>
                          <Link to="/auth/login">{t("common.actions.login")}</Link>
                        </Button>
                        <Button asChild className="w-full" onClick={() => setMobileOpen(false)}>
                          <Link to="/auth/signup">{t("common.actions.signup")}</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link
              to="/"
              className="flex items-center gap-2 transition-transform duration-300 hover:scale-105"
            >
              <img
                src={gegLogo}
                alt={t("layout.navbar.brand.short")}
                className="h-8 w-8 object-contain dark:brightness-0 dark:invert"
              />
              <span className="text-base font-semibold hidden sm:inline">{t("layout.navbar.brand.full")}</span>
            </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium transition-all duration-300 hover:text-primary hover:-translate-y-0.5"
            >
                {t(`layout.navbar.links.${link.id}`)}
            </Link>
          ))}
        </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            {profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} />
                      <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">{t("common.labels.openUserMenu")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={dashboardPath} className="cursor-pointer">
                      <Home className="mr-2 h-4 w-4" />
                      {t("common.navigation.dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      {t("common.navigation.settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("common.actions.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                  <Link to="/auth/login">{t("common.actions.login")}</Link>
                </Button>
                <Button size="sm" asChild className="hidden md:inline-flex">
                  <Link to="/auth/signup">{t("common.actions.signup")}</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="md:hidden">
                  <Link to="/auth/login" className="px-2" aria-label={t("common.actions.login")}>
                    {t("common.actions.login")}
                  </Link>
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2 md:hidden">
              <LanguageSwitcher size="sm" />
              <ThemeToggle />
            </div>
          </div>
      </div>
    </header>
  );
};

export default AppNavbar;
