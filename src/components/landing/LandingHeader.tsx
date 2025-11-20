import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogIn, UserPlus } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-end gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auth/login" className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          </Button>

          <Button size="sm" asChild>
            <Link to="/auth/signup" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Sign Up
            </Link>
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
