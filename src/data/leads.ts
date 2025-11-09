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
  return (data as any[]).map((student) => {
    const nameParts = (student.legal_name || student.preferred_name || "").split(" ");
    const firstName = nameParts.shift() || "";
    const lastName = nameParts.join(" ");
    return {
      id: student.id,
      first_name: firstName,
      last_name: lastName,
      email: student.contact_email || "",
      country: student.current_country || "",
      status: student.agent_student_links[0]?.status || "unknown",
    };
  }) as Lead[];
};

export const getStudent = async (studentId: string): Promise<Lead> => {
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
    .eq("id", studentId)
    .single();

  if (error) {
    console.error("Error fetching student:", error);
    throw error;
  }

  const student = data as any;
  const nameParts = (student.legal_name || student.preferred_name || "").split(" ");
  const firstName = nameParts.shift() || "";
  const lastName = nameParts.join(" ");
  return {
    id: student.id,
    first_name: firstName,
    last_name: lastName,
    email: student.contact_email || "",
    country: student.current_country || "",
    status: student.agent_student_links[0]?.status || "unknown",
  } as Lead;
};

export const getApplicationDrafts = async (studentId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from("application_drafts")
    .select("last_step, updated_at")
    .eq("student_id", studentId);

  if (error) {
    console.error("Error fetching application drafts:", error);
    throw error;
  }

  return data;
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

export const deleteLeads = async (leadIds: string[]): Promise<void> => {
  const { error } = await supabase
    .from("agent_student_links")
    .delete()
    .in("student_id", leadIds);

  if (error) {
    console.error("Error deleting leads:", error);
    throw error;
  }
};
