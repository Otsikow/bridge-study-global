import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
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
const HelpCenter = lazyWithErrorHandling(() => import("./pages/HelpCenter"));
const LegalPrivacy = lazyWithErrorHandling(() => import("./pages/LegalPrivacy"));
const LegalTerms = lazyWithErrorHandling(() => import("./pages/LegalTerms"));
const Login = lazyWithErrorHandling(() => import("./pages/auth/Login"));
const Signup = lazyWithErrorHandling(() => import("./pages/auth/Signup"));
const ForgotPassword = lazyWithErrorHandling(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazyWithErrorHandling(() => import("./pages/auth/ResetPassword"));
const Dashboard = lazyWithErrorHandling(() => import("./pages/Dashboard"));
const UniversitySearch = lazyWithErrorHandling(() => import("./pages/UniversitySearch"));
const CourseDiscovery = lazyWithErrorHandling(() => import("./pages/CourseDiscovery"));
const UniversityPartnership = lazyWithErrorHandling(
  () => import("./pages/UniversityPartnership")
);
const UniversityDirectory = lazyWithErrorHandling(() => import("./pages/UniversityDirectory"));
const UniversityProfile = lazyWithErrorHandling(() => import("./pages/UniversityProfile"));
const StudentOnboarding = lazyWithErrorHandling(() => import("./pages/student/StudentOnboarding"));
const StudentProfile = lazyWithErrorHandling(() => import("./pages/student/StudentProfile"));
const Documents = lazyWithErrorHandling(() => import("./pages/student/Documents"));
const Applications = lazyWithErrorHandling(() => import("./pages/student/Applications"));
const ApplicationTracking = lazyWithErrorHandling(() => import("./pages/student/ApplicationTracking"));
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
const FeaturedUniversitiesAdmin = lazyWithErrorHandling(
  () => import("./pages/admin/FeaturedUniversitiesAdmin")
);
const AdminDashboard = lazyWithErrorHandling(() => import("./pages/dashboards/AdminDashboard"));
const Messages = lazyWithErrorHandling(() => import("./pages/student/Messages"));
const Payments = lazyWithErrorHandling(() => import("./pages/Payments"));
const Notifications = lazyWithErrorHandling(() => import("./pages/student/Notifications"));
const Analytics = lazyWithErrorHandling(() => import("./pages/admin/Analytics"));
const ProfileSettings = lazyWithErrorHandling(() => import("./pages/ProfileSettings"));
const UniversityDashboard = lazyWithErrorHandling(() => import("./pages/dashboards/UniversityDashboard"));
const NotFound = lazyWithErrorHandling(() => import("./pages/NotFound"));

// Staff Dashboard Pages
const StaffApplications = lazyWithErrorHandling(() => import("./pages/dashboard/StaffApplications"));
const StaffStudents = lazyWithErrorHandling(() => import("./pages/dashboard/StaffStudents"));
const StaffTasks = lazyWithErrorHandling(() => import("./pages/dashboard/StaffTasks"));
const StaffMessages = lazyWithErrorHandling(() => import("./pages/dashboard/StaffMessages"));
const StaffReports = lazyWithErrorHandling(() => import("./pages/dashboard/StaffReports"));

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
                    <Route
                      path="/"
                      element={
                        <PublicLayout>
                          <Index />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/auth/login"
                      element={
                        <PublicLayout>
                          <Login />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/auth/signup"
                      element={
                        <PublicLayout>
                          <Signup />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/auth/forgot-password"
                      element={
                        <PublicLayout>
                          <ForgotPassword />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/auth/reset-password"
                      element={
                        <PublicLayout>
                          <ResetPassword />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/search"
                      element={
                        <PublicLayout>
                          <UniversitySearch />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/courses"
                      element={
                        <PublicLayout>
                          <CourseDiscovery />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/partnership"
                      element={
                        <PublicLayout>
                          <UniversityPartnership />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/universities"
                      element={
                        <PublicLayout>
                          <UniversityDirectory />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/universities/:id"
                      element={
                        <PublicLayout>
                          <UniversityProfile />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/contact"
                      element={
                        <PublicLayout>
                          <Contact />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/faq"
                      element={
                        <PublicLayout>
                          <FAQ />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/help"
                      element={
                        <PublicLayout>
                          <HelpCenter />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/blog"
                      element={
                        <PublicLayout>
                          <Blog />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/blog/:slug"
                      element={
                        <PublicLayout>
                          <BlogPost />
                        </PublicLayout>
                      }
                    />

                    {/* Protected Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/applications"
                      element={
                        <ProtectedRoute allowedRoles={["staff", "admin", "agent"]}>
                          <StaffApplications />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/students"
                      element={
                        <ProtectedRoute allowedRoles={["staff", "admin"]}>
                          <StaffStudents />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/tasks"
                      element={
                        <ProtectedRoute allowedRoles={["staff", "admin", "agent"]}>
                          <StaffTasks />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/messages"
                      element={
                        <ProtectedRoute allowedRoles={["staff", "admin", "agent", "partner"]}>
                          <StaffMessages />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/reports"
                      element={
                        <ProtectedRoute allowedRoles={["staff", "admin"]}>
                          <StaffReports />
                        </ProtectedRoute>
                      }
                    />

                    {/* Student Routes */}
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
                      path="/student/application-tracking"
                      element={
                        <ProtectedRoute>
                          <ApplicationTracking />
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

                    {/* Settings & Dashboards */}
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <PublicLayout>
                            <ProfileSettings />
                          </PublicLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin-dashboard"
                      element={
                        <ProtectedRoute allowedRoles={["admin", "staff"]}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/university/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={["partner", "admin", "staff"]}>
                          <UniversityDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Other Routes */}
                    <Route
                      path="/intake"
                      element={
                        <PublicLayout>
                          <IntakeForm />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/intake/:formId"
                      element={
                        <PublicLayout>
                          <IntakeForm />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/visa-calculator"
                      element={
                        <PublicLayout>
                          <VisaCalculator />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/feedback"
                      element={
                        <PublicLayout>
                          <UserFeedback />
                        </PublicLayout>
                      }
                    />
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
                    <Route
                      path="/admin/featured-universities"
                      element={
                        <ProtectedRoute allowedRoles={["admin", "staff"]}>
                          <FeaturedUniversitiesAdmin />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/analytics"
                      element={
                        <ProtectedRoute allowedRoles={["admin", "staff"]}>
                          <Analytics />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/legal/privacy"
                      element={
                        <PublicLayout>
                          <LegalPrivacy />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/legal/terms"
                      element={
                        <PublicLayout>
                          <LegalTerms />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="*"
                      element={
                        <PublicLayout>
                          <NotFound />
                        </PublicLayout>
                      }
                    />
                  </Routes>
                </div>
              </div>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
