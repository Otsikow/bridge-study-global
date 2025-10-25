import { 
  Home, 
  Users, 
  FileText, 
  Building2, 
  BookOpen, 
  DollarSign, 
  Share2, 
  MessageSquare, 
  CheckSquare, 
  Settings,
  BarChart3,
  Upload,
  UserCircle,
  Bell,
  LogOut,
  TrendingUp
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import gegLogo from '@/assets/geg-logo.png';

const menuItems = {
  student: [
    { title: 'Dashboard', url: '/dashboard', icon: Home },
    { title: 'My Profile', url: '/student/profile', icon: UserCircle },
    { title: 'Universities', url: '/universities', icon: Building2 },
    { title: 'Search Programs', url: '/search', icon: BookOpen },
    { title: 'My Applications', url: '/student/applications', icon: FileText },
    { title: 'Documents', url: '/student/documents', icon: Upload },
    { title: 'Messages', url: '/student/messages', icon: MessageSquare },
    { title: 'Payments', url: '/student/payments', icon: DollarSign },
    { title: 'Notifications', url: '/student/notifications', icon: Bell },
  ],
  agent: [
    { title: 'Dashboard', url: '/dashboard', icon: Home },
    { title: 'My Leads', url: '/dashboard/leads', icon: Users },
    { title: 'Applications', url: '/dashboard/applications', icon: FileText },
    { title: 'Tasks', url: '/dashboard/tasks', icon: CheckSquare },
    { title: 'Ranking', url: '/dashboard/ranking', icon: TrendingUp },
    { title: 'Commissions', url: '/dashboard/commissions', icon: DollarSign },
    { title: 'Import', url: '/dashboard/import', icon: Upload },
    { title: 'Resources', url: '/dashboard/resources', icon: BookOpen },
  ],
  partner: [
    { title: 'Dashboard', url: '/dashboard', icon: Home },
    { title: 'Applications', url: '/dashboard/applications', icon: FileText },
    { title: 'Document Requests', url: '/dashboard/requests', icon: Upload },
    { title: 'Offers & CAS', url: '/dashboard/offers', icon: FileText },
    { title: 'Messages', url: '/dashboard/messages', icon: MessageSquare },
    { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3 },
  ],
  staff: [
    { title: 'Dashboard', url: '/dashboard', icon: Home },
    { title: 'Applications', url: '/dashboard/applications', icon: FileText },
    { title: 'Students', url: '/dashboard/students', icon: Users },
    { title: 'Tasks', url: '/dashboard/tasks', icon: CheckSquare },
    { title: 'Messages', url: '/dashboard/messages', icon: MessageSquare },
    { title: 'Reports', url: '/dashboard/reports', icon: BarChart3 },
  ],
  admin: [
    { title: 'Dashboard', url: '/dashboard', icon: Home },
    { title: 'Users', url: '/dashboard/users', icon: Users },
    { title: 'Universities', url: '/dashboard/universities', icon: Building2 },
    { title: 'Programs', url: '/dashboard/programs', icon: BookOpen },
    { title: 'Applications', url: '/dashboard/applications', icon: FileText },
    { title: 'Agents', url: '/dashboard/agents', icon: Share2 },
    { title: 'Commissions', url: '/dashboard/commissions', icon: DollarSign },
    { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3 },
    { title: 'Settings', url: '/dashboard/settings', icon: Settings },
  ],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const items = profile?.role ? menuItems[profile.role] || menuItems.student : menuItems.student;

  return (
    <Sidebar className={state === 'collapsed' ? 'w-14 md:w-16' : 'w-56 md:w-64'}>
      <SidebarHeader className="border-b p-3 md:p-4">
        <div className="flex items-center gap-2 md:gap-3">
          <img 
            src={gegLogo} 
            alt="GEG Logo" 
            className="h-8 w-8 md:h-10 md:w-10 object-contain flex-shrink-0 dark:brightness-0 dark:invert"
          />
          {state !== 'collapsed' && (
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-base md:text-lg truncate">GEG</h2>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {profile?.role || 'User'}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-hide">
        <SidebarGroup>
          {state !== 'collapsed' && (
            <SidebarGroupLabel className="text-xs px-3">Navigation</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={state === 'collapsed' ? item.title : undefined}>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 font-medium'
                          : 'hover:bg-accent transition-colors'
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {state !== 'collapsed' && (
                        <span className="truncate text-sm">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3 md:p-4">
        <div className="space-y-2">
          {state !== 'collapsed' && (
            <div className="px-2.5 md:px-3 py-2 bg-muted rounded-lg">
              <p className="text-xs md:text-sm font-medium truncate">
                {profile?.full_name}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                {profile?.email}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size={state === 'collapsed' ? 'icon' : 'sm'}
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {state !== 'collapsed' && (
              <span className="ml-2 text-sm">Sign Out</span>
            )}
          </Button>
        </div>
        <SidebarTrigger className="mt-2 w-full" />
      </SidebarFooter>
    </Sidebar>
  );
}
