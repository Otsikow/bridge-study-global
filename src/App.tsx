import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppFooter from "@/components/layout/AppFooter";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingState } from "@/components/LoadingState";
import { lazy, Suspense, ComponentType } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ✅ Lazy loading wrapper with error handling
const lazyWithErrorHandling = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.error("Error loading component:", error);
      return {
        default: ((() => (
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="h-6 w-6" />
                  <h3 className="font-semibold text-lg">Failed to Load Page</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error
                    ? error.message
                    : "The page could not be loaded. This might be due to a network issue or the page being temporarily unavailable."}
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => window.location.reload()} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reload Page
                  </Button>
                  <Button variant="outline" onClick={() => window.history.back()}>
                    Go Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )) as unknown) as T,
      };
    }
  });
};

// ✅ React Query setup with smart retry logic
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error && typeof error === "object" && "status" in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) return false; // no retry on client errors
        }
        return failureCount < 3; // retry up to 3 times
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// ✅ Lazy-loaded pages
const Index = lazyWithErrorHandling(() => import("./pages/Index"));
const Contact = lazyWithErrorHandling(() => import("./pages/Contact"));
const FAQ = lazyWithErrorHandling(() => import("./pages/FAQ"));
const LegalPrivacy = lazyWithErrorHandling(() => import("./pages/LegalPrivacy"));
const LegalTerms = lazyWithErrorHandling(() => import("./pages/LegalTerms"));
const Login = lazyWithErrorHandling(() => import("./pages/auth/Login"));
const Signup = lazyWithErrorHandling(() => import("./pages/auth/Signup"));
const ForgotPassword = lazyWithErrorHandling(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazyWithErrorHandling(() => import("./pages/auth/ResetPassword"));
const Dashboard = lazyWithErrorHandling(() => import("./pages/Dashboard"));
const UniversitySearch = lazyWithErrorHandling(() => import("./pages/UniversitySearch"));
const StudentOnboarding = lazyWithErrorHandling(() => import("./pages/student/StudentOnboarding"));
const StudentProfile = lazyWithErrorHandling(() => import("./pages/student/StudentProfile"));
const Documents = lazyWithErrorHandling(() => import("./pages/student/Documents"));
const Applications = lazyWithErrorHandling(() => import("./pages/student/Applications"));
const NewApplication = lazyWithErrorHandling(() => import("./pages/student/NewApplication"));
const ApplicationDetails = lazyWithErrorHandling(() => import("./pages/student/ApplicationDetails"));
const VisaEligibility = lazyWithErrorHandling(() => import("./pages/student/VisaEligibility"));
const SopGenerator = lazyWithErrorHandling(() => import("./pages/student/SopGenerator"));
const IntakeForm = lazyWithErrorHandling(() => import("./pages/IntakeForm"));
const VisaCalculator = lazyWithErrorHandling(() => import("./pages/VisaCalculator"));
const Blog = lazyWithErrorHandling(() => import("./pages/Blog"));
const BlogPost = lazyWithErrorHandling(() => import("./pages/BlogPost"));
const UserFeedback = lazyWithErrorHandling(() => import("./components/analytics/UserFeedback"));
const FeedbackAnalytics = lazyWithErrorHandling(() => import("./pages/admin/FeedbackAnalytics"));
const BlogAdmin = lazyWithErrorHandling(() => import("./pages/admin/BlogAdmin"));
const Messages = lazyWithErrorHandling(() => import("./pages/student/Messages"));
const Payments = lazyWithErrorHandling(() => import("./pages/Payments"));
const Notifications = lazyWithErrorHandling(() => import("./pages/student/Notifications"));
const NotFound = lazyWithErrorHandling(() => import("./pages/NotFound"));

// ✅ Main App component
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <LoadingState
                    message="Loading application..."
                    size="lg"
                    className="text-muted-foreground"
                  />
                </div>
              }
            >
              <div className="min-h-screen flex flex-col">
                <div className="flex-1">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/signup" element={<Signup />} />
                    <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                    <Route path="/auth/reset-password" element={<ResetPassword />} />
                    <Route path="/search" element={<UniversitySearch />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />

                    {/* Protected Routes */}
                    <Route
                      path="/dashboard/*"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/onboarding"
                      element={
                        <ProtectedRoute>
                          <StudentOnboarding />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/profile"
                      element={
                        <ProtectedRoute>
                          <StudentProfile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/documents"
                      element={
                        <ProtectedRoute>
                          <Documents />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/applications"
                      element={
                        <ProtectedRoute>
                          <Applications />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/applications/new"
                      element={
                        <ProtectedRoute>
                          <NewApplication />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/applications/:id"
                      element={
                        <ProtectedRoute>
                          <ApplicationDetails />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/messages"
                      element={
                        <ProtectedRoute>
                          <Messages />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/payments"
                      element={
                        <ProtectedRoute allowedRoles={["student", "agent"]}>
                          <Payments />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/agent/payments"
                      element={
                        <ProtectedRoute allowedRoles={["agent"]}>
                          <Payments />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payments"
                      element={
                        <ProtectedRoute allowedRoles={["student", "agent"]}>
                          <Payments />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/notifications"
                      element={
                        <ProtectedRoute>
                          <Notifications />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/visa-eligibility"
                      element={
                        <ProtectedRoute>
                          <VisaEligibility />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/sop"
                      element={
                        <ProtectedRoute>
                          <SopGenerator />
                        </ProtectedRoute>
                      }
                    />

                    {/* Additional Features */}
                    <Route path="/intake" element={<IntakeForm />} />
                    <Route path="/intake/:formId" element={<IntakeForm />} />
                    <Route path="/visa-calculator" element={<VisaCalculator />} />
                    <Route path="/feedback" element={<UserFeedback />} />
                    <Route
                      path="/admin/feedback-analytics"
                      element={
                        <ProtectedRoute>
                          <FeedbackAnalytics />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/blog"
                      element={
                        <ProtectedRoute allowedRoles={["admin", "staff"]}>
                          <BlogAdmin />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/legal/privacy" element={<LegalPrivacy />} />
                    <Route path="/legal/terms" element={<LegalTerms />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
                <AppFooter />
              </div>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
