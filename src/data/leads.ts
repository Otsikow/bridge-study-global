import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/lead";

export const getLeads = async (): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id,
      legal_name,
      preferred_name,
      contact_email,
      current_country,
      agent_student_links!inner(
        status
      )
    `
    )
    .eq("agent_student_links.status", "active");

  if (error) {
    console.error("Error fetching leads:", error);
    throw error;
  }

  // The type needs to be adjusted because Supabase returns the nested data
  // inside the 'agent_student_links' property.
  return (data as any[]).map((student) => ({
    id: student.id,
    first_name: student.legal_name || student.preferred_name || '',
    last_name: '',
    email: student.contact_email || '',
    country: student.current_country || '',
    status: student.agent_student_links[0]?.status || 'unknown',
  })) as Lead[];
};

export const deleteLead = async (leadId: string): Promise<void> => {
  const { error } = await supabase
    .from("agent_student_links")
    .delete()
    .eq("student_id", leadId);

  if (error) {
    console.error("Error deleting lead:", error);
    throw error;
  }
};
