import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { LoadingState } from "@/components/LoadingState";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <LanguageProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <LoadingState message="Loading interface..." size="lg" />
          </div>
        }
      >
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </Suspense>
    </LanguageProvider>
  </ThemeProvider>,
);
