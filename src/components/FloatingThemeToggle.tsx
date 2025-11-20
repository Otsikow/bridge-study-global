import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function FloatingThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="fixed top-4 right-4 z-50 group flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/90 to-primary shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/25 active:scale-95"
    >
      {/* Animated gradient overlay on hover */}
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Sun icon for light mode */}
      <Sun className="absolute h-6 w-6 text-primary-foreground rotate-0 scale-100 transition-all duration-500 ease-in-out dark:-rotate-90 dark:scale-0" />

      {/* Moon icon for dark mode */}
      <Moon className="absolute h-6 w-6 text-primary-foreground rotate-90 scale-0 transition-all duration-500 ease-in-out dark:rotate-0 dark:scale-100" />

      {/* Ripple effect on click */}
      <span className="absolute inset-0 rounded-full animate-ping opacity-0 group-active:opacity-75 bg-primary/50" style={{ animationDuration: '600ms' }} />
    </button>
  );
}
