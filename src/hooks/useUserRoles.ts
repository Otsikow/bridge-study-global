import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { PostgrestError } from "@supabase/supabase-js";
import { useAuth } from "./useAuth";

export type AppRole = Database["public"]["Enums"]["app_role"];

interface UseUserRolesResult {
  roles: AppRole[];
  primaryRole: AppRole | null;
  loading: boolean;
  error: PostgrestError | Error | null;
  refresh: () => Promise<void>;
  hasRole: (role: AppRole | AppRole[]) => boolean;
}

export const useUserRoles = (): UseUserRolesResult => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<PostgrestError | Error | null>(null);

  const mapRoles = useCallback((data: { role: AppRole }[] | null) => {
    if (!data) return [] as AppRole[];
    return data.map((item) => item.role);
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchRoles = async () => {
      if (!userId) {
        if (isActive) {
          setRoles([]);
          setError(null);
          setLoading(false);
        }
        return;
      }

      if (isActive) {
        setLoading(true);
      }

      const { data, error: fetchError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (!isActive) return;

      if (fetchError) {
        console.error("Error fetching user roles:", fetchError);
        setError(fetchError);
        setRoles([]);
      } else {
        setError(null);
        setRoles(mapRoles(data));
      }

      setLoading(false);
    };

    fetchRoles();

    return () => {
      isActive = false;
    };
  }, [mapRoles, userId]);

  const refresh = useCallback(async () => {
    if (!userId) {
      setRoles([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error: fetchError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Error refreshing user roles:", fetchError);
      setError(fetchError);
      setRoles([]);
    } else {
      setError(null);
      setRoles(mapRoles(data));
    }

    setLoading(false);
  }, [mapRoles, userId]);

  const hasRole = useCallback(
    (requiredRoles: AppRole | AppRole[]) => {
      const roleList = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      return roleList.some((role) => roles.includes(role));
    },
    [roles]
  );

  const primaryRole = useMemo(() => (roles.length > 0 ? roles[0] : null), [roles]);

  return {
    roles,
    primaryRole,
    loading,
    error,
    refresh,
    hasRole,
  };
};
