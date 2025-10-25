// STUB: Presence system requires database table that doesn't exist yet
// Table needed: user_presence

import { useState } from 'react';
import { useAuth } from './useAuth';

export interface UserPresence {
  id: string;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
  updated_at: string;
}

export function usePresence() {
  const { user } = useAuth();
  const [presence] = useState<Record<string, UserPresence>>({});

  const updatePresence = async (status: 'online' | 'offline' | 'away') => {
    // Stub - requires user_presence table
    console.warn('Presence feature requires database migration');
  };

  const getUserPresence = (userId: string): UserPresence | null => {
    return presence[userId] || null;
  };

  const isUserOnline = (userId: string): boolean => {
    return false;
  };

  return {
    presence,
    updatePresence,
    getUserPresence,
    isUserOnline
  };
}

