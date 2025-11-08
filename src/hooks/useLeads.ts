import { useQuery } from "@tanstack/react-query";
import { getLeads } from "@/data/leads";

export const useLeads = () => {
  return useQuery({
    queryKey: ["leads"],
    queryFn: getLeads,
  });
};
