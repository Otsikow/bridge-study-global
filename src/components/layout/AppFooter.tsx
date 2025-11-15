import { useState } from "react";
import { Link } from "react-router-dom";
import gegLogo from "@/assets/geg-logo.png";
import { Mail, Search, Calculator, MessageSquare, LogIn, LogOut, UserPlus, LayoutDashboard, Shield, FileText, Newspaper, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
export function AppFooter() {
  const year = new Date().getFullYear();
  const {
    t
  } = useTranslation();
  const {
    user,
    loading,
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut({
        redirectTo: "/"
      });
      toast({
        title: t("common.notifications.success"),
        description: t("auth.messages.logoutSuccess", {
          defaultValue: "You have been signed out."
        })
      });
    } catch (error) {
      console.error("Failed to sign out:", error);
      const description = error instanceof Error ? error.message : t("auth.messages.logoutError", {
        defaultValue: "Something went wrong while signing you out. Please try again."
      });
      toast({
        title: t("common.notifications.error"),
        description
      });
    } finally {
      setIsLoggingOut(false);
    }
  };
  return <footer className="border-t bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-muted-foreground">{t("layout.footer.copyright", {
            year
          })}</p>
          <div className="text-xs text-muted-foreground">
            <span className="hidden sm:inline">{t("layout.footer.questions")}</span>
            <a className="hover:underline" href="mailto:info@globaltalentgateway.net">
              {t("layout.footer.contactEmailLabel")}
            </a>
          </div>
        </div>
      </div>
    </footer>;
}
export default AppFooter;