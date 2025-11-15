import { DIRECTORY_PROFILES, type DirectoryProfile } from "./data";

const unique = (values: (string | null | undefined)[]) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

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

const GEG_STAFF_IDS = ["staff-maya", "admin-jordan", "counselor-samira"];
const AGENT_IDS = ["agent-riley"];
const UNIVERSITY_IDS = ["uni-sophia"];
const DIRECTORY_IDS = DIRECTORY_PROFILES.map((profile) => profile.id);

export const getMessagingContactIds = (profile: DirectoryProfile | null | undefined) => {
  if (!profile) return [];

  switch (profile.role) {
    case "agent":
    case "partner":
      return unique([
        ...GEG_STAFF_IDS,
        ...UNIVERSITY_IDS,
        ...(AGENT_STUDENT_RELATIONSHIPS[profile.id] ?? []),
      ]);
    case "staff":
      return unique([
        ...GEG_STAFF_IDS,
        ...AGENT_IDS,
        ...UNIVERSITY_IDS,
        ...(STAFF_STUDENT_RELATIONSHIPS[profile.id] ?? []),
      ]);
    case "school_rep":
      return unique([
        ...GEG_STAFF_IDS,
        ...AGENT_IDS,
        ...(UNIVERSITY_APPLICANT_RELATIONSHIPS[profile.id] ?? []),
      ]);
    case "counselor":
      return unique([
        ...GEG_STAFF_IDS,
        ...AGENT_IDS,
        ...UNIVERSITY_IDS,
        ...DIRECTORY_IDS,
      ]);
    case "student":
      return unique([
        ...GEG_STAFF_IDS,
        ...(STUDENT_SUPPORT_RELATIONSHIPS[profile.id] ?? []),
      ]);
    case "admin":
      return unique(DIRECTORY_IDS);
    default:
      return unique([...GEG_STAFF_IDS, ...AGENT_IDS, ...UNIVERSITY_IDS]);
  }
};

export const getAgentInvitedStudents = (agentId: string) => AGENT_STUDENT_RELATIONSHIPS[agentId] ?? [];
export const getStaffStudentAssignments = (staffId: string) => STAFF_STUDENT_RELATIONSHIPS[staffId] ?? [];
export const getUniversityApplicants = (universityId: string) =>
  UNIVERSITY_APPLICANT_RELATIONSHIPS[universityId] ?? [];

