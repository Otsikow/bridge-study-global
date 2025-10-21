import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeToggle } from "@/components/ThemeToggle";

import { lazy, Suspense } from "react";

const Index = lazy(() => import("./pages/Index"));
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
const UserFeedback = lazy(() => import("./components/analytics/UserFeedback"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>}>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/search" element={<UniversitySearch />} />

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

            {/* Catch-All */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
