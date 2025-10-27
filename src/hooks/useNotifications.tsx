import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  read: boolean;
  metadata: Record<string, any>;
  action_url: string | null;
  created_at: string;
  read_at: string | null;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch notifications - using existing notifications table
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('id, tenant_id, user_id, template_key, subject, body, created_at, read_at, payload')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      // Transform data to match our interface
      const transformed = (data || []).map((n: any) => ({
        id: n.id,
        tenant_id: n.tenant_id,
        user_id: n.user_id,
        type: n.template_key,
        title: n.subject,
        content: n.body,
        read: !!n.read_at,
        metadata: n.payload || {},
        action_url: null,
        created_at: n.created_at,
        read_at: n.read_at,
      }));

      setNotifications(transformed);
      setUnreadCount(transformed.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: countError } = await supabase
        .from('notifications')
        .select('id, read_at')
        .eq('user_id', user.id)
        .is('read_at', null);

      if (countError) throw countError;

      setUnreadCount(data?.length || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      toast({
        title: 'Notification marked as read',
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  }, [user?.id, toast]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (updateError) throw updateError;

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      toast({
        title: 'All notifications marked as read',
      });
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  }, [user?.id, toast]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (deleteError) throw deleteError;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      toast({
        title: 'Notification deleted',
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  }, [user?.id, notifications, toast]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const raw = payload.new as any;
            const newNotification: Notification = {
              id: raw.id,
              tenant_id: raw.tenant_id,
              user_id: raw.user_id,
              type: raw.template_key,
              title: raw.subject,
              content: raw.body,
              read: !!raw.read_at,
              metadata: raw.payload || {},
              action_url: null,
              created_at: raw.created_at,
              read_at: raw.read_at,
            };
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show toast for new notification
            toast({
              title: newNotification.title,
              description: newNotification.content,
            });
          } else if (payload.eventType === 'UPDATE') {
            const raw = payload.new as any;
            const updatedNotification: Notification = {
              id: raw.id,
              tenant_id: raw.tenant_id,
              user_id: raw.user_id,
              type: raw.template_key,
              title: raw.subject,
              content: raw.body,
              read: !!raw.read_at,
              metadata: raw.payload || {},
              action_url: null,
              created_at: raw.created_at,
              read_at: raw.read_at,
            };
            setNotifications(prev =>
              prev.map(n => (n.id === updatedNotification.id ? updatedNotification : n))
            );
            fetchUnreadCount();
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            fetchUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications, fetchUnreadCount, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
