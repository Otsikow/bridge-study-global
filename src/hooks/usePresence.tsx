import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface UserPresence {
  id: string;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
  updated_at: string;
}

export function usePresence() {
  const { user } = useAuth();
  const [presence, setPresence] = useState<Record<string, UserPresence>>({});
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Update own presence status
  const updatePresence = async (status: 'online' | 'offline' | 'away') => {
    if (!user?.id) return;

    try {
      await supabase.from('user_presence').upsert({
        id: user.id,
        status,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  // Set user online when component mounts
  useEffect(() => {
    if (!user?.id) return;

    // Set online
    updatePresence('online');

    // Setup realtime subscription
    const presenceChannel = supabase
      .channel('presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          const presenceData = payload.new as UserPresence;
          setPresence(prev => ({
            ...prev,
            [presenceData.id]: presenceData
          }));
        }
      )
      .subscribe();

    setChannel(presenceChannel);

    // Load initial presence data
    const loadPresence = async () => {
      const { data } = await supabase
        .from('user_presence')
        .select('*');

      if (data) {
        const presenceMap = data.reduce((acc, p) => {
          acc[p.id] = p as UserPresence;
          return acc;
        }, {} as Record<string, UserPresence>);
        setPresence(presenceMap);
      }
    };

    loadPresence();

    // Heartbeat to keep presence updated
    const heartbeatInterval = setInterval(() => {
      updatePresence('online');
    }, 30000); // Every 30 seconds

    // Set offline on page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set offline on unmount/close
    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence('offline');
      presenceChannel.unsubscribe();
    };
  }, [user?.id]);

  // Get presence status for a specific user
  const getUserPresence = (userId: string): UserPresence | null => {
    return presence[userId] || null;
  };

  // Check if user is online
  const isUserOnline = (userId: string): boolean => {
    const userPresence = presence[userId];
    if (!userPresence) return false;

    // Consider user online if last update was within 2 minutes
    const lastSeen = new Date(userPresence.last_seen).getTime();
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000;

    return userPresence.status === 'online' && (now - lastSeen) < twoMinutes;
  };

  return {
    presence,
    updatePresence,
    getUserPresence,
    isUserOnline
  };
}
