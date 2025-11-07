import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, BellRing, CheckCheck, Circle, CircleCheck, CreditCard, Filter, ListFilter, Loader2, ShieldAlert, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type NotificationCategory = "new_signups" | "payment_events" | "pending_approvals" | "system_alerts";

type NotificationMetadata = Record<string, unknown>;

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
  readAt: string | null;
  metadata: NotificationMetadata;
  category: NotificationCategory;
}

type SupabaseNotificationRow = {
  id: string;
  tenant_id: string | null;
  user_id: string;
  template_key: string | null;
  subject: string | null;
  body: string | null;
  created_at: string;
  read_at: string | null;
  payload: unknown;
};

const CATEGORY_CONFIG: Record<NotificationCategory, { label: string; description: string; icon: ComponentType<{ className?: string }>; }>
  = {
    new_signups: {
      label: "New Signups",
      description: "Recently created student or agent accounts",
      icon: Users,
    },
    payment_events: {
      label: "Payment Events",
      description: "Invoices, payouts, and billing updates",
      icon: CreditCard,
    },
    pending_approvals: {
      label: "Pending Approvals",
      description: "Items awaiting admin review",
      icon: ListFilter,
    },
    system_alerts: {
      label: "System Alerts",
      description: "Platform or compliance notifications",
      icon: ShieldAlert,
    },
  };

const CATEGORY_KEYWORDS: Record<NotificationCategory, string[]> = {
  new_signups: ["signup", "sign-up", "registration", "new_student", "new_application", "enrollment", "new_user"],
  payment_events: ["payment", "invoice", "billing", "transaction", "payout", "refund"],
  pending_approvals: ["approval", "review", "pending", "awaiting", "verification", "compliance"],
  system_alerts: ["alert", "system", "incident", "downtime", "security", "warning", "error"],
};

const getMetadataString = (metadata: NotificationMetadata, key: string) => {
  const value = metadata[key];
  return typeof value === "string" ? value : "";
};

const resolveCategory = (notification: { type: string; metadata: NotificationMetadata; title: string; message: string; }): NotificationCategory => {
  const metadataCategory = getMetadataString(notification.metadata, "category");
  const metadataType = getMetadataString(notification.metadata, "type");
  const base = `${notification.type ?? ""} ${metadataCategory} ${metadataType} ${notification.title ?? ""} ${notification.message ?? ""}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [NotificationCategory, string[]][]) {
    if (keywords.some((keyword) => base.includes(keyword))) {
      return category;
    }
  }

  return "system_alerts";
};

const parseMetadata = (payload: unknown): NotificationMetadata => {
  if (!payload) return {};
  if (typeof payload === "object") return payload as NotificationMetadata;
  try {
    return JSON.parse(String(payload));
  } catch (error) {
    console.warn("Failed to parse notification metadata", error);
    return {};
  }
};

const AdminNotifications = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | "all">("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("id, tenant_id, user_id, template_key, subject, body, created_at, read_at, payload")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(150);

      if (error) throw error;

      const rows = (data as SupabaseNotificationRow[] | null) ?? [];
      const mapped: AdminNotification[] = rows.map((row) => {
        const metadata = parseMetadata(row.payload);
        const metadataType = getMetadataString(metadata, "type");
        const metadataTitle = getMetadataString(metadata, "title") || "Notification";
        const metadataMessage = getMetadataString(metadata, "message");
        const type = row.template_key && row.template_key.length > 0 ? row.template_key : metadataType || "general";
        const title = row.subject && row.subject.length > 0 ? row.subject : metadataTitle;
        const message = row.body && row.body.length > 0 ? row.body : metadataMessage;
        return {
          id: row.id,
          title,
          message,
          type,
          createdAt: row.created_at,
          read: !!row.read_at,
          readAt: row.read_at,
          metadata,
          category: resolveCategory({ type, metadata, title, message }),
        };
      });

      setNotifications(mapped);
    } catch (error) {
      console.error("Failed to fetch admin notifications", error);
      toast({
        title: "Error loading notifications",
        description: "We couldn't load the latest alerts. Please try again shortly.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    const channel = supabase
      .channel(`admin-notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as SupabaseNotificationRow;
            const metadata = parseMetadata(row.payload);
            const metadataType = getMetadataString(metadata, "type");
            const metadataTitle = getMetadataString(metadata, "title") || "Notification";
            const metadataMessage = getMetadataString(metadata, "message");
            const type = row.template_key && row.template_key.length > 0 ? row.template_key : metadataType || "general";
            const title = row.subject && row.subject.length > 0 ? row.subject : metadataTitle;
            const message = row.body && row.body.length > 0 ? row.body : metadataMessage;
            const notification: AdminNotification = {
              id: row.id,
              title,
              message,
              type,
              createdAt: row.created_at,
              read: !!row.read_at,
              readAt: row.read_at,
              metadata,
              category: resolveCategory({ type, metadata, title, message }),
            };

            setNotifications((prev) => {
              const next = [notification, ...prev.filter((item) => item.id !== notification.id)];
              return next.slice(0, 150);
            });

            toast({
              title: notification.title,
              description: notification.message,
            });
          }

          if (payload.eventType === "UPDATE") {
            const row = payload.new as SupabaseNotificationRow;
            setNotifications((prev) =>
              prev.map((notification) =>
                notification.id === row.id
                  ? {
                      ...notification,
                      read: !!row.read_at,
                      readAt: row.read_at,
                    }
                  : notification
              )
            );
          }

          if (payload.eventType === "DELETE") {
            const row = payload.old as SupabaseNotificationRow;
            setNotifications((prev) => prev.filter((notification) => notification.id !== row.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, toast, user?.id]);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  const categoryCounts = useMemo(() => {
    return notifications.reduce<Record<NotificationCategory, { total: number; unread: number }>>(
      (acc, notification) => {
        acc[notification.category].total += 1;
        if (!notification.read) acc[notification.category].unread += 1;
        return acc;
      },
      {
        new_signups: { total: 0, unread: 0 },
        payment_events: { total: 0, unread: 0 },
        pending_approvals: { total: 0, unread: 0 },
        system_alerts: { total: 0, unread: 0 },
      }
    );
  }, [notifications]);

  const updateNotificationReadState = useCallback(
    async (notificationId: string, read: boolean) => {
      if (!user?.id) return;
      const timestamp = new Date().toISOString();
      try {
        const { error } = await supabase
          .from("notifications")
          .update({ read_at: read ? timestamp : null })
          .eq("id", notificationId)
          .eq("user_id", user.id);

        if (error) throw error;

        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read, readAt: read ? timestamp : null }
              : notification
          )
        );
      } catch (error) {
        console.error("Failed to update notification read state", error);
        toast({
          title: "Update failed",
          description: "We couldn't update the notification status. Please try again.",
          variant: "destructive",
        });
      }
    },
    [toast, user?.id]
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!user?.id) return;
    try {
      setBulkUpdating(true);
      const timestamp = new Date().toISOString();
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: timestamp })
        .eq("user_id", user.id)
        .is("read_at", null);

      if (error) throw error;

      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true, readAt: timestamp })));
      toast({ title: "Success", description: "All notifications marked as read" });
    } catch (error) {
      console.error("Failed to mark all as read", error);
      toast({
        title: "Update failed",
        description: "We couldn't mark all notifications as read. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBulkUpdating(false);
    }
  }, [toast, user?.id]);

  const handleClearAll = useCallback(async () => {
    if (!user?.id) return;
    if (!confirm("Clear all admin notifications? This action cannot be undone.")) return;

    try {
      setBulkUpdating(true);
      const { error } = await supabase.from("notifications").delete().eq("user_id", user.id);
      if (error) throw error;

      setNotifications([]);
      toast({ title: "Notifications cleared", description: "All notifications have been removed." });
    } catch (error) {
      console.error("Failed to clear notifications", error);
      toast({
        title: "Deletion failed",
        description: "We couldn't clear the notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBulkUpdating(false);
    }
  }, [toast, user?.id]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (showUnreadOnly && notification.read) return false;
      if (categoryFilter === "all") return true;
      return notification.category === categoryFilter;
    });
  }, [notifications, showUnreadOnly, categoryFilter]);

  const categoriesToDisplay: NotificationCategory[] = useMemo(() => {
    if (categoryFilter === "all") {
      return ["new_signups", "payment_events", "pending_approvals", "system_alerts"];
    }
    return [categoryFilter];
  }, [categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" /> Notifications center
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Monitor key tenant activity including new enrollments, finance events, compliance reviews, and platform alerts. Updates arrive in real time via Supabase Realtime.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0 || bulkUpdating}>
            {bulkUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
            Mark all read
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={notifications.length === 0 || bulkUpdating}>
            {bulkUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Clear all
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BellRing className="h-5 w-5" /> Realtime activity snapshot
            </CardTitle>
            <CardDescription>Track unread volume across notification groups.</CardDescription>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-2 font-medium">
              <CircleCheck className="h-4 w-4 text-primary" /> {unreadCount} unread
            </span>
            <Separator orientation="vertical" className="h-6" />
            <span className="flex items-center gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              {filteredNotifications.length} showing
            </span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoriesToDisplay.map((category) => {
            const Icon = CATEGORY_CONFIG[category].icon;
            const stats = categoryCounts[category];
            return (
              <div key={category} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {CATEGORY_CONFIG[category].label}
                  </span>
                  <Badge variant="outline">{stats.total}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {CATEGORY_CONFIG[category].description}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <Circle className={cn("h-3 w-3", stats.unread > 0 ? "text-primary" : "text-muted-foreground")} />
                  {stats.unread} unread
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListFilter className="h-5 w-5" /> Filters
            </CardTitle>
            <CardDescription>Select a category or focus on unread alerts.</CardDescription>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Tabs value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as NotificationCategory | "all") }>
              <TabsList className="grid grid-cols-5 gap-2">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="new_signups">Signups</TabsTrigger>
                <TabsTrigger value="payment_events">Payments</TabsTrigger>
                <TabsTrigger value="pending_approvals">Approvals</TabsTrigger>
                <TabsTrigger value="system_alerts">System</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Switch id="unread-only" checked={showUnreadOnly} onCheckedChange={(checked) => setShowUnreadOnly(Boolean(checked))} />
              <Label htmlFor="unread-only" className="text-sm">Unread only</Label>
            </div>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        categoriesToDisplay.map((category) => {
          const items = filteredNotifications.filter((notification) => notification.category === category);
          const Icon = CATEGORY_CONFIG[category].icon;

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  {CATEGORY_CONFIG[category].label}
                  <Badge variant="secondary">{items.length}</Badge>
                </CardTitle>
                <CardDescription>{CATEGORY_CONFIG[category].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    <CircleCheck className="h-5 w-5" />
                    <span>No notifications in this category right now.</span>
                  </div>
                ) : (
                  items.map((notification) => {
                    const actor = getMetadataString(notification.metadata, "actor");
                    const context = getMetadataString(notification.metadata, "context");
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "rounded-lg border p-4 transition-colors",
                          notification.read ? "bg-muted/50" : "bg-background"
                        )}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold leading-none">{notification.title}</h3>
                              <Badge variant="outline" className="text-xs capitalize">{notification.type.replace(/_/g, " ")}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                              {actor && <span>By {actor}</span>}
                              {context && <span>{context}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={notification.read ? "outline" : "secondary"}
                              size="sm"
                              onClick={() => updateNotificationReadState(notification.id, !notification.read)}
                            >
                              {notification.read ? "Mark unread" : "Mark read"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default AdminNotifications;
