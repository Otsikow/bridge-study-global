import { DEFAULT_TENANT_ID, DIRECTORY_PROFILES, type DirectoryProfile } from "./data";

const dynamicProfiles = new Map<string, DirectoryProfile>();

const baseProfilesMap = () => {
  const map = new Map<string, DirectoryProfile>();
  for (const profile of DIRECTORY_PROFILES) {
    map.set(profile.id, profile);
  }
  for (const [id, profile] of dynamicProfiles.entries()) {
    map.set(id, profile);
  }
  return map;
};

const collectProfiles = () => Array.from(baseProfilesMap().values());

export const registerDirectoryProfile = (profile: DirectoryProfile) => {
  if (!profile.id) return;
  dynamicProfiles.set(profile.id, profile);
};

export const getDirectoryProfiles = (tenantId?: string | null) => {
  const activeTenant = tenantId ?? DEFAULT_TENANT_ID;
  return collectProfiles().filter((profile) => profile.tenant_id === activeTenant);
};

export const findDirectoryProfileById = (profileId: string) =>
  baseProfilesMap().get(profileId);

export const getDefaultProfileForRole = (role: DirectoryProfile["role"]) =>
  collectProfiles().find((profile) => profile.role === role);

export interface SearchDirectoryOptions {
  tenantId?: string | null;
  excludeIds?: string[];
  roles?: DirectoryProfile["role"][];
  limit?: number;
}

const normalize = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const matchProfile = (
  profile: DirectoryProfile,
  query: string,
  options: SearchDirectoryOptions,
) => {
  if (options.tenantId && profile.tenant_id !== options.tenantId) {
    return false;
  }

  if (options.roles && options.roles.length > 0 && !options.roles.includes(profile.role)) {
    return false;
  }

  if (options.excludeIds?.includes(profile.id)) {
    return false;
  }

  if (!query) return true;

  const haystack = `${profile.full_name} ${profile.email} ${profile.headline ?? ""}`.toLowerCase();
  return haystack.includes(query);
};

export const searchDirectoryProfiles = async (
  query: string,
  options: SearchDirectoryOptions = {},
): Promise<DirectoryProfile[]> => {
  const normalizedQuery = normalize(query);
  const tenantId = options.tenantId ?? DEFAULT_TENANT_ID;
  const profiles = getDirectoryProfiles(tenantId);
  const matches = profiles.filter((profile) => matchProfile(profile, normalizedQuery, { ...options, tenantId }));
  const limited = typeof options.limit === "number" ? matches.slice(0, Math.max(options.limit, 0)) : matches;

  return new Promise((resolve) => {
    setTimeout(() => resolve(limited), 160);
  });
};

const ROLE_PLACEHOLDER_MAP: Partial<Record<DirectoryProfile["role"], string>> = {
  student: "student-zoe",
  agent: "agent-riley",
  partner: "agent-riley",
  staff: "staff-maya",
  admin: "admin-jordan",
  counselor: "counselor-samira",
  verifier: "staff-maya",
  finance: "admin-jordan",
  school_rep: "uni-sophia",
};

export const getPlaceholderIdForRole = (role: DirectoryProfile["role"]) =>
  ROLE_PLACEHOLDER_MAP[role];

export type { DirectoryProfile };
