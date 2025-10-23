import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppFooter from "@/components/layout/AppFooter";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingState } from "@/components/LoadingState";
import { lazy, Suspense } from "react";

// ✅ Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const LegalPrivacy = lazy(() => import("./pages/LegalPrivacy"));
const LegalTerms = lazy(() => import("./pages/LegalTerms"));
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UniversitySearch = lazy(() => import("./pages/UniversitySearch"));
const StudentOnboarding = lazy(() => import("./pages/student/StudentOnboarding"));
const StudentProfile = lazy(() => import("./pages/student/StudentProfile"));
const Documents = lazy(() => import("./pages/student/Documents"));
const Applications = lazy(() => import("./pages/student/Applications"));
const NewApplication = lazy(() => import("./pages/student/NewApplication"));
const ApplicationDetails = lazy(() => import("./pages/student/ApplicationDetails"));
const VisaEligibility = lazy(() => import("./pages/student/VisaEligibility"));
const SopGenerator = lazy(() => import("./pages/student/SopGenerator"));
const IntakeForm = lazy(() => import("./pages/IntakeForm"));
const VisaCalculator = lazy(() => import("./pages/VisaCalculator"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const UserFeedback = lazy(() => import("./components/analytics/UserFeedback"));
const FeedbackAnalytics = lazy(() => import("./pages/admin/FeedbackAnalytics"));
const BlogAdmin = lazy(() => import("./pages/admin/BlogAdmin"));
const Messages = lazy(() => import("./pages/student/Messages"));
const Payments = lazy(() => import("./pages/student/Payments"));
const Notifications = lazy(() => import("./pages/student/Notifications"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

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
                    <ProtectedRoute>
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

                {/* Catch-All */}
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
