"use client";

import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from "react";
import { useLocation, Link } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PartnerSidebar } from "@/components/partner/PartnerSidebar";
import { PartnerHeader } from "@/components/partner/PartnerHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Download,
  FileText as FileTextIcon,
  Filter,
  Mail,
  MessageCircle,
  TrendingUp,
  Upload,
} from "lucide-react";
import gegLogo from "@/assets/geg-logo.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PartnerOverviewPage from "@/pages/partner/dashboard/Overview";

// --- Sidebar Views ---
const partnerDashboardViews = [
  "overview",
  "applications",
  "documents",
  "offers",
  "messages",
  "analytics",
] as const;

type PartnerDashboardView = (typeof partnerDashboardViews)[number];

const isPartnerDashboardView = (value: string | null): value is PartnerDashboardView =>
  value !== null && partnerDashboardViews.some((view) => view === value);

const getViewFromLocation = (search: string): PartnerDashboardView => {
  const params = new URLSearchParams(search);
  const viewParam = params.get("view");
  return isPartnerDashboardView(viewParam) ? viewParam : "overview";
};

// --- Main Component ---
export default function PartnerDashboard() {
  const location = useLocation();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const currentView = useMemo<PartnerDashboardView>(
    () => getViewFromLocation(location.search),
    [location.search]
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <p>Loading your partner profile...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-950 text-slate-100">
        <PartnerSidebar />
        <SidebarInset className="flex min-h-screen flex-1 flex-col bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
          <PartnerHeader />
          <main className="flex-1 space-y-8 px-4 pb-12 pt-6 md:px-8 lg:px-12">
            {currentView === "overview" && <OverviewView />}
            {currentView === "applications" && <ApplicationsView />}
            {currentView === "documents" && <DocumentsView />}
            {currentView === "offers" && <OffersView />}
            {currentView === "messages" && <MessagesView />}
            {currentView === "analytics" && <AnalyticsView />}
          </main>
          <footer className="mt-8 flex items-center justify-between border-t border-slate-800 bg-slate-950/70 px-6 py-4">
            <div className="flex items-center gap-3">
              <img src={gegLogo} alt="GEG Logo" className="h-8 w-8 dark:brightness-0 dark:invert" />
              <span className="text-sm text-slate-400">
                © {new Date().getFullYear()} Global Education Gateway
              </span>
            </div>
            <div className="flex gap-4 text-sm text-blue-400">
              <Link to="/contact" className="hover:underline">
                Contact Support
              </Link>
              <Link to="/terms" className="hover:underline">
                Terms
              </Link>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

// --- Dashboard Sections (Views) ---
function OverviewView() {
  return <PartnerOverviewPage />;
}

function ApplicationsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-100">Applications</h2>
      <Card className="border border-slate-800 bg-slate-900/70 p-4">
        <CardContent className="text-slate-400">
          Application details and filters coming soon.
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-100">Documents</h2>
      <Card className="border border-slate-800 bg-slate-900/70 p-4">
        <CardContent className="text-slate-400">
          Document checklist and tracking interface will appear here.
        </CardContent>
      </Card>
    </div>
  );
}

function OffersView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-100">Offers & CAS</h2>
      <Card className="border border-slate-800 bg-slate-900/70 p-4">
        <CardContent className="text-slate-400">
          Offer generation and CAS tracking UI coming soon.
        </CardContent>
      </Card>
    </div>
  );
}

function MessagesView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-100">Messages</h2>
      <Card className="border border-slate-800 bg-slate-900/70 p-4">
        <CardContent className="text-slate-400">
          Communication threads and notifications will appear here.
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-100">Analytics</h2>
      <Card className="border border-slate-800 bg-slate-900/70 p-4">
        <CardContent className="text-slate-400">
          Partner analytics dashboards are being integrated.
        </CardContent>
      </Card>
    </div>
  );
}
