import { useQuery } from "@tanstack/react-query";
import { getStudent } from "@/data/leads";

export const useStudent = (studentId: string) => {
  return useQuery({
    queryKey: ["student", studentId],
    queryFn: () => getStudent(studentId),
  });
};
