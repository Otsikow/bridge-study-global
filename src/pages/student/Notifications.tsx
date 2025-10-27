import { DashboardLayout } from '@/components/layout/DashboardLayout';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function Notifications() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in">
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">Notifications</h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Stay up to date with your journey</p>
          </div>
        </div>

        <div className="flex justify-center">
          <NotificationCenter />
        </div>
      </div>
    </DashboardLayout>
  );
}
