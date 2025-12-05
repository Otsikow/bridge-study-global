import { supabase } from "@/integrations/supabase/client";
import type { PostgrestError } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

/**
 * Represents student data accessible to agents via the restricted view.
 * Sensitive fields like passport_number, passport_expiry, visa_history_json,
 * and finances_json are excluded for privacy protection.
 */
export interface RestrictedStudentData {
  studentId: string;
  tenantId: string;
  profileId: string;
  dateOfBirth: string | null;
  nationality: string | null;
  address: Record<string, unknown> | null;
  educationHistory: Record<string, unknown> | null;
  testScores: Record<string, unknown> | null;
  guardian: Record<string, unknown> | null;
  createdAt: string | null;
  updatedAt: string | null;
  legalName: string | null;
  preferredName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  currentCountry: string | null;
  consentFlagsJson: Record<string, unknown> | null;
  profileCompleteness: number | null;
  linkStatus: string | null;
  applicationCount: number;
}

export const agentRestrictedStudentDataQueryKey = (agentProfileId?: string | null) => [
  "agent-restricted-student-data",
  agentProfileId ?? "anonymous",
];

/**
 * Fetches student data for agents using the restricted view.
 * This ensures sensitive fields are never exposed to agents.
 */
const fetchAgentRestrictedStudentData = async (
  agentProfileId: string
): Promise<RestrictedStudentData[]> => {
  const { data, error } = await supabase.rpc("get_agent_linked_students", {
    agent_profile_id: agentProfileId,
  });

  if (error) {
    throw error satisfies PostgrestError;
  }

  if (!data) {
    return [];
  }

  return data.map((row) => ({
    studentId: row.student_id,
    tenantId: row.tenant_id,
    profileId: row.profile_id,
    dateOfBirth: row.date_of_birth,
    nationality: row.nationality,
    address: row.address as Record<string, unknown> | null,
    educationHistory: row.education_history as Record<string, unknown> | null,
    testScores: row.test_scores as Record<string, unknown> | null,
    guardian: row.guardian as Record<string, unknown> | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    legalName: row.legal_name,
    preferredName: row.preferred_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    currentCountry: row.current_country,
    consentFlagsJson: row.consent_flags_json as Record<string, unknown> | null,
    profileCompleteness: row.profile_completeness,
    linkStatus: row.link_status,
    applicationCount: row.application_count ?? 0,
  }));
};

/**
 * Hook for agents to access student data via the restricted view.
 * Excludes sensitive fields: passport_number, passport_expiry,
 * visa_history_json, and finances_json.
 *
 * @param agentProfileId - The profile ID of the agent
 * @returns Query result with restricted student data
 */
export const useAgentRestrictedStudentData = (agentProfileId?: string | null) =>
  useQuery({
    queryKey: agentRestrictedStudentDataQueryKey(agentProfileId),
    queryFn: () => fetchAgentRestrictedStudentData(agentProfileId!),
    enabled: Boolean(agentProfileId),
    staleTime: 60_000,
  });

/**
 * Alternative function to query the view directly for more flexibility.
 * Uses the agent_student_data_view which excludes sensitive fields.
 */
export const fetchStudentDataFromView = async (studentIds: string[]) => {
  const { data, error } = await supabase
    .from("agent_student_data_view")
    .select("*")
    .in("id", studentIds);

  if (error) {
    throw error satisfies PostgrestError;
  }

  return data;
};
