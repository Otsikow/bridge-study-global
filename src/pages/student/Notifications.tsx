import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, FileText, AlertTriangle, Settings } from 'lucide-react';

const notifications = [
  { id: 'n1', type: 'Application', title: 'Offer received from UBC', time: '2h ago', tone: 'success' },
  { id: 'n2', type: 'Task', title: 'Upload passport copy for verification', time: '1d ago', tone: 'warning' },
  { id: 'n3', type: 'Message', title: 'New message from Visa Support', time: '3d ago', tone: 'info' },
];

export default function Notifications() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in">
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">Notifications</h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Stay up to date with your journey</p>
          </div>
          <div className="flex gap-2 flex-wrap flex-shrink-0">
            <Button variant="outline" className="gap-2 hover-scale whitespace-nowrap">
              <Settings className="h-4 w-4" /> <span className="hidden sm:inline">Preferences</span>
            </Button>
            <Button className="gap-2 hover-scale whitespace-nowrap">
              <CheckCircle2 className="h-4 w-4" /> <span className="hidden sm:inline">Mark all read</span>
            </Button>
          </div>
        </div>

        <Card className="rounded-xl border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Recent</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {notifications.map((n) => (
                <li key={n.id} className="py-4 flex items-start gap-3">
                  {n.tone === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                  ) : n.tone === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  ) : (
                    <FileText className="h-5 w-5 text-info mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{n.type}</Badge>
                      <p className="font-medium truncate">{n.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
