import { useState } from "react";
import { Link } from "react-router-dom";
import unidoxiaLogo from "@/assets/unidoxia-logo.png";
import {
  Mail,
  Search,
  Calculator,
  MessageSquare,
  LogIn,
  LogOut,
  UserPlus,
  LayoutDashboard,
  Shield,
  FileText,
  Newspaper,
  HelpCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function AppFooter() {
  const year = new Date().getFullYear();
  const { t } = useTranslation();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut({ redirectTo: "/" });
      toast({
        title: t("common.notifications.success"),
        description: t("auth.messages.logoutSuccess", {
          defaultValue: "You have been signed out.",
        }),
      });
    } catch (error) {
      console.error("Failed to sign out:", error);
      const description =
        error instanceof Error
          ? error.message
          : t("auth.messages.logoutError", {
              defaultValue: "Something went wrong while signing you out. Please try again.",
            });
      toast({
        title: t("common.notifications.error"),
        description,
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={unidoxiaLogo}
                alt={t("layout.navbar.brand.full")}
                className="h-9 w-9 rounded-md object-contain dark:brightness-0 dark:invert"
              />
              <span className="font-semibold text-lg">{t("layout.footer.aboutTitle")}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("layout.footer.aboutDescription")}</p>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-primary" />
              <a href="mailto:info@globaltalentgateway.net" className="hover:underline">
                info@globaleducationgateway.com
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("layout.footer.headings.platform")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/courses?view=programs" className="inline-flex items-center gap-2 hover:underline">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  {t("layout.footer.platformLinks.search")}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="inline-flex items-center gap-2 hover:underline">
                  <Newspaper className="h-4 w-4 text-muted-foreground" />
                  {t("layout.footer.platformLinks.blog")}
                </Link>
              </li>
              <li>
                <Link to="/visa-calculator" className="inline-flex items-center gap-2 hover:underline">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  {t("layout.footer.platformLinks.visaCalculator")}
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="inline-flex items-center gap-2 hover:underline">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  {t("layout.footer.platformLinks.feedback")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("layout.footer.headings.support")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/help" className="inline-flex items-center gap-2 hover:underline">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  {t("layout.footer.supportLinks.help")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="inline-flex items-center gap-2 hover:underline">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {t("layout.footer.supportLinks.contact")}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="inline-flex items-center gap-2 hover:underline">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  {t("layout.footer.supportLinks.faq")}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="inline-flex items-center gap-2 hover:underline">
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  {t("layout.footer.supportLinks.dashboard")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("layout.footer.headings.accountLegal")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                {user ? (
                  <Button
                    variant="ghost"
                    className="inline-flex items-center gap-2 px-0 text-muted-foreground hover:text-primary"
                    onClick={handleLogout}
                    disabled={loading || isLoggingOut}
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("common.actions.logout")}
                  </Button>
                ) : (
                  <Link to="/auth/login" className="inline-flex items-center gap-2 hover:underline">
                    <LogIn className="h-4 w-4 text-muted-foreground" />
                    {t("layout.footer.accountLinks.login")}
                  </Link>
                )}
              </li>
              <li>
                <Link to="/auth/signup" className="inline-flex items-center gap-2 hover:underline">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  {t("layout.footer.accountLinks.signup")}
                </Link>
              </li>
              <li>
                <Link to="/legal/privacy" className="inline-flex items-center gap-2 hover:underline">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  {t("layout.footer.accountLinks.privacy")}
                </Link>
              </li>
              <li>
                <Link to="/legal/terms" className="inline-flex items-center gap-2 hover:underline">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {t("layout.footer.accountLinks.terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-muted-foreground">{t("layout.footer.copyright", { year })}</p>
          <div className="text-xs text-muted-foreground">
            <span className="hidden sm:inline">{t("layout.footer.questions")}</span>
            <a className="hover:underline" href="mailto:info@globaltalentgateway.net">
              {t("layout.footer.contactEmailLabel")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;