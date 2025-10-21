import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/Dashboard";
import UniversitySearch from "./pages/UniversitySearch";
import StudentOnboarding from "./pages/student/StudentOnboarding";
import StudentProfile from "./pages/student/StudentProfile";
import Documents from "./pages/student/Documents";
import Applications from "./pages/student/Applications";
import NewApplication from "./pages/student/NewApplication";
import Messages from "./pages/student/Messages";
import Payments from "./pages/student/Payments";
import Notifications from "./pages/student/Notifications";

// ✅ Combined imports from both branches
import ApplicationDetails from "./pages/student/ApplicationDetails";
import VisaEligibility from "./pages/student/VisaEligibility";
import SopGenerator from "./pages/student/SopGenerator";
import IntakeForm from "./pages/IntakeForm";
import VisaCalculator from "./pages/VisaCalculator";
import UserFeedback from "./components/analytics/UserFeedback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
