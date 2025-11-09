import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteLeads } from "@/data/leads";

export const useDeleteLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadIds: string[]) => deleteLeads(leadIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};
