import { DIRECTORY_PROFILES, type DirectoryProfile } from "./data";
import { fetchMessagingContactIds } from "./contactsService";

const unique = (values: (string | null | undefined)[]) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

// Mock relationships for development/testing
const AGENT_STUDENT_RELATIONSHIPS: Record<string, string[]> = {
  "agent-riley": ["student-zoe", "student-lucas", "student-amira"],
};

const STAFF_STUDENT_RELATIONSHIPS: Record<string, string[]> = {
  "staff-maya": ["student-zoe", "student-lucas", "student-amira"],
};

const UNIVERSITY_APPLICANT_RELATIONSHIPS: Record<string, string[]> = {
  "uni-sophia": ["student-zoe", "student-lucas"],
};

const STUDENT_SUPPORT_RELATIONSHIPS: Record<string, string[]> = {
  "student-zoe": ["staff-maya"],
  "student-lucas": ["staff-maya"],
  "student-amira": ["staff-maya"],
};

const UNIDOXIA_STAFF_IDS = ["staff-maya", "admin-jordan", "counselor-samira"];
const AGENT_IDS = ["agent-riley"];
const UNIVERSITY_IDS = ["uni-sophia"];
const DIRECTORY_IDS = DIRECTORY_PROFILES.map((profile) => profile.id);

/**
 * Gets messaging contact IDs using mock data (for development)
 * This is the fallback when real database data is not available
 */
const getMessagingContactIdsMock = (profile: DirectoryProfile | null | undefined): string[] => {
  if (!profile) return [];

  switch (profile.role) {
    case "agent":
    case "partner":
      return unique([
        ...UNIDOXIA_STAFF_IDS,
        ...UNIVERSITY_IDS,
        ...(AGENT_STUDENT_RELATIONSHIPS[profile.id] ?? []),
      ]);
    case "staff":
      return unique([
        ...UNIDOXIA_STAFF_IDS,
        ...AGENT_IDS,
        ...UNIVERSITY_IDS,
        ...(STAFF_STUDENT_RELATIONSHIPS[profile.id] ?? []),
      ]);
    case "school_rep":
      return unique([
        ...UNIDOXIA_STAFF_IDS,
        ...AGENT_IDS,
        ...(UNIVERSITY_APPLICANT_RELATIONSHIPS[profile.id] ?? []),
      ]);
    case "counselor":
      return unique([
        ...UNIDOXIA_STAFF_IDS,
        ...AGENT_IDS,
        ...UNIVERSITY_IDS,
        ...DIRECTORY_IDS,
      ]);
    case "student":
      return unique([
        ...UNIDOXIA_STAFF_IDS,
        ...(STUDENT_SUPPORT_RELATIONSHIPS[profile.id] ?? []),
      ]);
    case "admin":
      return unique(DIRECTORY_IDS);
    default:
      return unique([...UNIDOXIA_STAFF_IDS, ...AGENT_IDS, ...UNIVERSITY_IDS]);
  }
};

/**
 * Gets messaging contact IDs for the given profile
 * Attempts to fetch from database first, falls back to mock data
 */
export const getMessagingContactIds = (profile: DirectoryProfile | null | undefined): string[] => {
  // Return mock data synchronously for now
  // This will be replaced by async database call in the hook
  return getMessagingContactIdsMock(profile);
};

/**
 * Async version that fetches real contact IDs from the database
 * Use this in async contexts (e.g., React hooks with useEffect)
 */
export const getMessagingContactIdsAsync = async (): Promise<string[]> => {
  try {
    const contactIds = await fetchMessagingContactIds();
    if (contactIds && contactIds.length > 0) {
      return contactIds;
    }
    // If no real data, return empty array (don't fall back to mock in production)
    return [];
  } catch (error) {
    console.error("Error fetching messaging contact IDs:", error);
    return [];
  }
};

export const getAgentInvitedStudents = (agentId: string) => AGENT_STUDENT_RELATIONSHIPS[agentId] ?? [];
export const getStaffStudentAssignments = (staffId: string) => STAFF_STUDENT_RELATIONSHIPS[staffId] ?? [];
export const getUniversityApplicants = (universityId: string) =>
  UNIVERSITY_APPLICANT_RELATIONSHIPS[universityId] ?? [];

