import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserPresence {
  id: string;
  status: 'online' | 'offline' | 'away';
  last_seen: string | null;
  updated_at: string | null;
}

export function usePresence() {
  const { user } = useAuth();
  const [presence, setPresence] = useState<Record<string, UserPresence>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  const updatePresence = useCallback(async (status: 'online' | 'offline' | 'away') => {
    if (!user?.id) return;

    try {
      const timestamp = new Date().toISOString();
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          id: user.id,
          status,
          last_seen: timestamp,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user?.id]);

  const fetchPresence = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('id, status, last_seen, updated_at');

      if (error) throw error;

      const mapped: Record<string, UserPresence> = {};
      (data || []).forEach((record: any) => {
        mapped[record.id] = {
          id: record.id,
          status: (record.status as UserPresence['status']) ?? 'offline',
          last_seen: record.last_seen,
          updated_at: record.updated_at,
        };
      });

      setPresence(mapped);
    } catch (error) {
      console.error('Error fetching presence:', error);
    }
  }, []);

  const getUserPresence = useCallback((userId: string): UserPresence | null => {
    return presence[userId] || null;
  }, [presence]);

  const isUserOnline = useCallback((userId: string): boolean => {
    const userPresence = presence[userId];
    return userPresence ? userPresence.status === 'online' : false;
  }, [presence]);

  useEffect(() => {
    if (!user?.id) {
      setPresence({});
      return;
    }

    fetchPresence();
    updatePresence('online');

    const heartbeat = setInterval(() => updatePresence('online'), 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    };

    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`user-presence-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_presence',
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as any)?.id;
          if (!deletedId) return;
          setPresence(prev => {
            const updated = { ...prev };
            delete updated[deletedId];
            return updated;
          });
          return;
        }

        const record = payload.new as any;
        setPresence(prev => ({
          ...prev,
          [record.id]: {
            id: record.id,
            status: (record.status as UserPresence['status']) ?? 'offline',
            last_seen: record.last_seen,
            updated_at: record.updated_at,
          },
        }));
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      updatePresence('offline');
    };
  }, [fetchPresence, updatePresence, user?.id]);

  return {
    presence,
    updatePresence,
    getUserPresence,
    isUserOnline,
  };
}

