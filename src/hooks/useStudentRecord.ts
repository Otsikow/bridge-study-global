import { useMemo } from 'react';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import { logError } from '@/lib/errorUtils';

export type StudentRecord = Tables<'students'> | null;

export const studentRecordQueryKey = (userId: string | undefined) => ['student-record', userId] as const;

interface UseStudentRecordOptions
  extends Pick<UseQueryOptions<StudentRecord, unknown, StudentRecord>, 'enabled' | 'staleTime' | 'gcTime'> {}

export const useStudentRecord = (
  options?: UseStudentRecordOptions
): UseQueryResult<StudentRecord> => {
  const { user } = useAuth();
  const userId = user?.id;

  const queryKey = useMemo(() => studentRecordQueryKey(userId), [userId]);

  return useQuery<StudentRecord>({
    queryKey,
    enabled: Boolean(userId) && (options?.enabled ?? true),
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle();

      if (error) {
        logError(error, 'useStudentRecord.fetch');
        throw error;
      }

      return data ?? null;
    },
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    gcTime: options?.gcTime ?? 30 * 60 * 1000,
  });
};

