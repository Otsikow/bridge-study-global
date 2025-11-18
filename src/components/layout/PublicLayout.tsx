import { ReactNode } from "react";
import { AppFooter } from "@/components/layout/AppFooter";
import { cn } from "@/lib/utils";

interface PublicLayoutProps {
  children: ReactNode;
  contentClassName?: string;
}

export const PublicLayout = ({ children, contentClassName }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className={cn("flex-1 w-full", contentClassName)}>{children}</main>
      <AppFooter />
    </div>
  );
};
