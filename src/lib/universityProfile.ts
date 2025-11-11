import type { Database } from "@/integrations/supabase/types";

export type UniversityRecord = Database["public"]["Tables"]["universities"]["Row"];

export interface UniversityContactDetails {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
}

export interface UniversitySocialLinks {
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
}

export interface UniversityMediaSettings {
  heroImageUrl?: string | null;
  gallery?: string[];
}

export interface UniversityProfileDetails {
  tagline?: string | null;
  highlights: string[];
  contacts: {
    primary?: UniversityContactDetails | null;
  };
  social: UniversitySocialLinks;
  media: UniversityMediaSettings;
}

export const emptyUniversityProfileDetails: UniversityProfileDetails = {
  tagline: null,
  highlights: [],
  contacts: {},
  social: {},
  media: {},
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
};

const sanitizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitizeContact = (value: unknown): UniversityContactDetails | null => {
  if (!isObject(value)) return null;
  const contact: UniversityContactDetails = {
    name: sanitizeString(value.name),
    email: sanitizeString(value.email),
    phone: sanitizeString(value.phone),
    title: sanitizeString(value.title),
  };

  const hasValues = Object.values(contact).some((entry) => entry && entry.length > 0);
  return hasValues ? contact : null;
};

const sanitizeSocial = (value: unknown): UniversitySocialLinks => {
  if (!isObject(value)) return {};
  return {
    website: sanitizeString(value.website),
    facebook: sanitizeString(value.facebook),
    instagram: sanitizeString(value.instagram),
    linkedin: sanitizeString(value.linkedin),
    youtube: sanitizeString(value.youtube),
  };
};

const sanitizeMedia = (value: unknown): UniversityMediaSettings => {
  if (!isObject(value)) return {};
  return {
    heroImageUrl: sanitizeString(value.heroImageUrl),
    gallery: sanitizeStringArray(value.gallery),
  };
};

export const parseUniversityProfileDetails = (
  rawValue: unknown,
): UniversityProfileDetails => {
  let source: unknown = rawValue;

  if (typeof rawValue === "string") {
    try {
      source = JSON.parse(rawValue);
    } catch (error) {
      console.warn("Unable to parse university profile details JSON", error);
      source = null;
    }
  }

  if (!isObject(source)) {
    return { ...emptyUniversityProfileDetails };
  }

  const contactsRaw = isObject(source.contacts) ? source.contacts : {};

  const parsed: UniversityProfileDetails = {
    tagline: sanitizeString(source.tagline),
    highlights: sanitizeStringArray(source.highlights),
    contacts: {
      primary: sanitizeContact(contactsRaw.primary),
    },
    social: sanitizeSocial(source.social),
    media: sanitizeMedia(source.media),
  };

  return {
    ...emptyUniversityProfileDetails,
    ...parsed,
  };
};

export interface UniversityProfileCompletionResult {
  percentage: number;
  missingFields: string[];
}

const COMPLETION_FIELDS: Array<{
  key: string;
  label: string;
  isComplete: (
    university: UniversityRecord | null,
    details: UniversityProfileDetails,
  ) => boolean;
}> = [
  {
    key: "name",
    label: "University name",
    isComplete: (university) => Boolean(university?.name?.trim()),
  },
  {
    key: "location",
    label: "City and country",
    isComplete: (university) => Boolean(university?.country && university?.city),
  },
  {
    key: "website",
    label: "Website",
    isComplete: (university) => Boolean(university?.website),
  },
  {
    key: "description",
    label: "About section",
    isComplete: (university) => Boolean(university?.description && university.description.length > 30),
  },
  {
    key: "logo",
    label: "Logo",
    isComplete: (university) => Boolean(university?.logo_url),
  },
  {
    key: "heroImage",
    label: "Hero image",
    isComplete: (_, details) => Boolean(details.media.heroImageUrl),
  },
  {
    key: "contact",
    label: "Primary contact",
    isComplete: (_, details) => Boolean(details.contacts.primary?.email && details.contacts.primary?.name),
  },
  {
    key: "highlights",
    label: "Highlights",
    isComplete: (_, details) => details.highlights.length >= 2,
  },
  {
    key: "tagline",
    label: "Tagline",
    isComplete: (_, details) => Boolean(details.tagline),
  },
];

export const computeUniversityProfileCompletion = (
  university: UniversityRecord | null,
  details: UniversityProfileDetails,
): UniversityProfileCompletionResult => {
  const completed = COMPLETION_FIELDS.filter((field) => field.isComplete(university, details));
  const percentage = Math.round((completed.length / COMPLETION_FIELDS.length) * 100);

  const missingFields = COMPLETION_FIELDS.filter(
    (field) => !field.isComplete(university, details),
  ).map((field) => field.label);

  return {
    percentage: Math.min(100, Math.max(0, percentage)),
    missingFields,
  };
};

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  "australia": "AUD",
  "canada": "CAD",
  "ireland": "EUR",
  "new zealand": "NZD",
  "united kingdom": "GBP",
  "united states": "USD",
  "usa": "USD",
  "u.s.a": "USD",
  "us": "USD",
  "uae": "AED",
  "united arab emirates": "AED",
  "nigeria": "NGN",
  "south africa": "ZAR",
  "india": "INR",
  "kenya": "KES",
  "ghana": "GHS",
  "germany": "EUR",
  "france": "EUR",
  "spain": "EUR",
  "italy": "EUR",
  "netherlands": "EUR",
};

export const getSuggestedCurrencyForCountry = (
  country: string | null | undefined,
): string | null => {
  if (!country) return null;
  const normalized = country.trim().toLowerCase();
  if (!normalized) return null;
  return COUNTRY_CURRENCY_MAP[normalized] ?? null;
};

export const mergeUniversityProfileDetails = (
  base: UniversityProfileDetails,
  updates: Partial<UniversityProfileDetails>,
): UniversityProfileDetails => ({
  ...base,
  ...updates,
  contacts: {
    ...base.contacts,
    ...updates.contacts,
  },
  social: {
    ...base.social,
    ...updates.social,
  },
  media: {
    ...base.media,
    ...updates.media,
  },
});
