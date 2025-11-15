interface Profile {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  avatar_url?: string | null;
  role?: string | null;
}

export interface StudentProfileDetails {
  id?: string;
  date_of_birth?: string | null;
  nationality?: string | null;
  passport_number?: string | null;
  address?: string | null;
  education_history?: Record<string, unknown> | null;
}

export interface AgentProfileDetails {
  id?: string;
  company_name?: string | null;
  verification_status?: 'pending' | 'approved' | 'rejected' | null;
  referral_code?: string | null;
}

export type ProfileRoleData =
  | { type: 'student'; data: StudentProfileDetails }
  | { type: 'agent'; data: AgentProfileDetails };

const isNonEmptyString = (value?: string | null): value is string => {
  return typeof value === 'string' && value.trim() !== '';
};

const isPopulatedObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && Object.keys(value).length > 0;
};

export const calculateProfileCompletion = (
  profile: Profile,
  roleData?: ProfileRoleData | null
): number => {
  let totalFields = 0;
  let completedFields = 0;

  // Basic profile fields (40% weight)
  const basicFields = [
    profile.full_name,
    profile.email,
    profile.phone,
    profile.country,
    profile.avatar_url,
  ];

  totalFields += basicFields.length;
  completedFields += basicFields.filter((field) => isNonEmptyString(field)).length;

  // Role-specific fields (60% weight)
  if (roleData?.type === 'student' && roleData.data) {
    const studentFields = [
      roleData.data.date_of_birth,
      roleData.data.nationality,
      roleData.data.passport_number,
      roleData.data.address,
      roleData.data.education_history,
    ];

    totalFields += studentFields.length;
    completedFields += studentFields.filter((field) => {
      if (isNonEmptyString(field)) return true;
      if (isPopulatedObject(field)) return true;
      return Boolean(field);
    }).length;
  } else if (roleData?.type === 'agent' && roleData.data) {
    const agentFields = [
      roleData.data.company_name,
      roleData.data.verification_status !== 'pending',
      roleData.data.referral_code,
    ];

    totalFields += agentFields.length;
    completedFields += agentFields.filter((field) => Boolean(field)).length;
  }

  if (totalFields === 0) return 0;

  return Math.round((completedFields / totalFields) * 100);
};
