import { Link } from 'react-router-dom';
import gegLogo from '@/assets/geg-logo.png';
import {
  Mail,
  Search,
  Calculator,
  MessageSquare,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Shield,
  FileText,
} from 'lucide-react';

export function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={gegLogo}
                alt="GEG Logo"
                className="h-9 w-9 object-contain dark:brightness-0 dark:invert"
              />
              <span className="font-semibold text-lg">GEG — Global Education Gateway</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Connecting international students with world-class universities through verified agents
              and transparent application management.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-primary" />
              <a
                href="mailto:info@globaltalentgateway.com"
                className="hover:underline"
              >
                info@globaltalentgateway.com
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Platform</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/search" className="inline-flex items-center gap-2 hover:underline">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  Search Universities
                </Link>
              </li>
              <li>
                <Link to="/visa-calculator" className="inline-flex items-center gap-2 hover:underline">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  Visa Calculator
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="inline-flex items-center gap-2 hover:underline">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Feedback
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/contact" className="inline-flex items-center gap-2 hover:underline">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="inline-flex items-center gap-2 hover:underline">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="inline-flex items-center gap-2 hover:underline">
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Account & Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/auth/login" className="inline-flex items-center gap-2 hover:underline">
                  <LogIn className="h-4 w-4 text-muted-foreground" />
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/auth/signup" className="inline-flex items-center gap-2 hover:underline">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  Get Started
                </Link>
              </li>
              <li>
                <Link to="/legal/privacy" className="inline-flex items-center gap-2 hover:underline">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/terms" className="inline-flex items-center gap-2 hover:underline">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-6">
          <p className="text-xs text-muted-foreground">© {year} GEG — Global Education Gateway. All rights reserved.</p>
          <div className="text-xs text-muted-foreground">
            <span className="hidden sm:inline">Questions? </span>
            <a className="hover:underline" href="mailto:info@globaltalentgateway.com">Email us</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;
