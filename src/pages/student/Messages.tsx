import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Search, Send, Filter } from 'lucide-react';

const conversations = [
  {
    id: '1',
    name: 'Admissions Advisor',
    lastMessage: 'Please upload your IELTS score for verification.',
    time: '2h ago',
    unread: 2,
  },
  {
    id: '2',
    name: 'Scholarship Office',
    lastMessage: 'Your application has been received.',
    time: '1d ago',
    unread: 0,
  },
  {
    id: '3',
    name: 'Visa Support',
    lastMessage: 'Book a call to discuss your visa docs.',
    time: '3d ago',
    unread: 1,
  },
];

export default function Messages() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Stay connected with advisors and support</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" /> Filters</Button>
            <Button className="gap-2"><MessageSquare className="h-4 w-4" /> New Message</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="lg:col-span-1 rounded-xl border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conversations</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" className="pl-9" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[420px]">
                <ul className="divide-y">
                  {conversations.map((c) => (
                    <li key={c.id} className="p-4 hover:bg-accent/50 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage alt={c.name} />
                          <AvatarFallback>{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{c.name}</p>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{c.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
                        </div>
                        {c.unread > 0 && (
                          <Badge variant="secondary" className="rounded-full px-2 py-0.5">{c.unread}</Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 rounded-xl border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="max-w-[80%] rounded-lg bg-muted p-3">
                  <p className="text-sm">Hi! Please upload your IELTS score for verification.</p>
                </div>
                <div className="max-w-[80%] rounded-lg bg-primary text-primary-foreground p-3 ml-auto">
                  <p className="text-sm">Thanks! I will upload it today.</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Input placeholder="Type a message..." className="flex-1" />
                <Button className="gap-2"><Send className="h-4 w-4" /> Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
