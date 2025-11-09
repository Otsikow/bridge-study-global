import { useQuery } from "@tanstack/react-query";
import { getApplicationDrafts } from "@/data/leads";

export const useApplicationDrafts = (studentId: string) => {
  return useQuery({
    queryKey: ["applicationDrafts", studentId],
    queryFn: () => getApplicationDrafts(studentId),
  });
};
