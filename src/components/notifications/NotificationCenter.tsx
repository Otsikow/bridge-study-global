import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  X,
  Trash2,
  Settings,
  Info,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  DollarSign,
  BookOpen,
  Clock,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "application_status" | "message" | "commission" | "course_recommendation";
  read: boolean;
  created_at: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  applicationUpdates: boolean;
  messages: boolean;
  documents: boolean;
  deadlines: boolean;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "application_status" | "message" | "commission" | "course_recommendation">("all");
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    applicationUpdates: true,
    messages: true,
    documents: true,
    deadlines: true,
  });

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped = (data || []).map((n) => ({
        id: n.id,
        title: n.subject || "Notification",
        message: n.body || "",
        type: (n.template_key as any) || "info",
        read: !!n.read_at,
        created_at: n.created_at,
        action_url: undefined,
        metadata: (n.payload as Record<string, any>) || {},
      }));

      setNotifications(mapped);
      setUnreadCount(mapped.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({ title: "Error", description: "Failed to load notifications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchNotifications();
    if (!user) return;
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      toast({ title: "Error", description: "Failed to mark as read", variant: "destructive" });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
      if (error) throw error;
      setNotifications((p) => p.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast({ title: "Success", description: "All notifications marked as read" });
    } catch {
      toast({ title: "Error", description: "Failed to mark all as read", variant: "destructive" });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
      const wasUnread = notifications.find((n) => n.id === id)?.read === false;
      setNotifications((p) => p.filter((n) => n.id !== id));
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
      toast({ title: "Deleted", description: "Notification removed" });
    } catch {
      toast({ title: "Error", description: "Failed to delete notification", variant: "destructive" });
    }
  };

  const clearAll = async () => {
    if (!user || !confirm("Delete all notifications?")) return;
    try {
      const { error } = await supabase.from("notifications").delete().eq("user_id", user.id);
      if (error) throw error;
      setNotifications([]);
      setUnreadCount(0);
      toast({ title: "Success", description: "All notifications cleared" });
    } catch {
      toast({ title: "Error", description: "Failed to clear notifications", variant: "destructive" });
    }
  };

  const handleClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    if (n.action_url) navigate(n.action_url);
  };

  const iconFor = (t: string) => {
    switch (t) {
      case "success": return CheckCircle;
      case "warning": return AlertTriangle;
      case "error": return AlertCircle;
      case "application_status": return FileText;
      case "message": return MessageSquare;
      case "commission": return DollarSign;
      case "course_recommendation": return BookOpen;
      default: return Info;
    }
  };

  const colorFor = (t: string) => {
    switch (t) {
      case "application_status": return "text-blue-600 dark:text-blue-400";
      case "message": return "text-purple-600 dark:text-purple-400";
      case "commission": return "text-green-600 dark:text-green-400";
      case "course_recommendation": return "text-orange-600 dark:text-orange-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    if (filter === "all") return true;
    return n.type === filter;
  });

  return (
    <div className="space-y-4 w-full max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Bell className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Notifications</h2>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm"><Settings className="h-4 w-4" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] sm:w-72">
              <div className="space-y-3">
                <h4 className="font-semibold">Notification Settings</h4>
                {Object.entries(settings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label>{key}</Label>
                    <Switch checked={value} onCheckedChange={(checked) => setSettings((p) => ({ ...p, [key]: checked }))} />
                  </div>
                ))}
                <Button onClick={() => toast({ title: "Saved", description: "Settings updated" })} className="w-full">Save</Button>
              </div>
            </PopoverContent>
          </Popover>
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="flex w-full flex-wrap items-center justify-start gap-3 overflow-x-auto rounded-2xl border border-border bg-card/80 p-2 shadow-sm sm:justify-center sm:gap-4">
            <TabsTrigger className="px-4 sm:px-5" value="all">
              All
            </TabsTrigger>
            <TabsTrigger className="px-4 sm:px-5" value="unread">
              Unread
            </TabsTrigger>
            <TabsTrigger className="px-4 sm:px-5" value="read">
              Read
            </TabsTrigger>
            <TabsTrigger className="px-4 sm:px-5" value="application_status">
              Apps
            </TabsTrigger>
            <TabsTrigger className="px-4 sm:px-5" value="message">
              Messages
            </TabsTrigger>
            <TabsTrigger className="px-4 sm:px-5" value="commission">
              Commissions
            </TabsTrigger>
            <TabsTrigger className="px-4 sm:px-5" value="course_recommendation">
              Courses
            </TabsTrigger>
          </TabsList>
          <TabsContent value={filter}>
            <Card className="w-full border border-border/70 shadow-sm sm:rounded-2xl">
              <CardHeader className="space-y-1.5 p-4 sm:p-6">
                <CardTitle>Recent</CardTitle>
                <CardDescription>Stay updated with your activity</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[65vh] sm:max-h-[60vh]">
                    <div className="divide-y">
                      {filtered.map((n) => {
                        const Icon = iconFor(n.type);
                        return (
                          <div
                            key={n.id}
                            className={`p-4 transition hover:bg-muted/50 ${!n.read ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                            onClick={() => handleClick(n)}
                          >
                            <div className="flex items-start gap-3">
                              <Icon className={`mt-1 h-5 w-5 ${colorFor(n.type)}`} />
                              <div className="flex-1">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="font-medium">{n.title}</p>
                                    <p className="text-sm text-muted-foreground">{n.message}</p>
                                  </div>
                                  <div className="flex shrink-0 gap-1 self-start">
                                    {!n.read && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markAsRead(n.id);
                                        }}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(n.id);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
