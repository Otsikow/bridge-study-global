import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteLead } from "@/data/leads";

export const useDeleteLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};
