import { supabase } from "@/integrations/supabase/client";
import type { PostgrestError } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const agentInviteCodeQueryKey = (agentProfileId?: string | null) => [
  "agent-invite-code",
  agentProfileId ?? "anonymous",
];

const fetchAgentInviteCode = async (
  agentProfileId: string,
): Promise<string> => {
  const { data, error } = await supabase.rpc("ensure_agent_team_invite_code", {
    p_agent_profile_id: agentProfileId,
  });

  if (error) {
    throw error satisfies PostgrestError;
  }

  return data;
};

const regenerateAgentInviteCode = async (
  agentProfileId: string,
): Promise<string> => {
  const { data, error } = await supabase.rpc("ensure_agent_team_invite_code", {
    p_agent_profile_id: agentProfileId,
    p_regenerate: true,
  });

  if (error) {
    throw error satisfies PostgrestError;
  }

  return data;
};

export const useAgentInviteCode = (agentProfileId?: string | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: agentInviteCodeQueryKey(agentProfileId),
    queryFn: () => fetchAgentInviteCode(agentProfileId!),
    enabled: Boolean(agentProfileId),
  });

  const mutation = useMutation({
    mutationFn: () => regenerateAgentInviteCode(agentProfileId!),
    onSuccess: (data) => {
      queryClient.setQueryData(
        agentInviteCodeQueryKey(agentProfileId),
        data,
      );
    },
  });

  return { ...query, regenerate: mutation.mutate, isRegenerating: mutation.isPending };
};
