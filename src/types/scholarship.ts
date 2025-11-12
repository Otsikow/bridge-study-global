export interface ScholarshipEligibility {
  nationality?: string[];
  gpa?: string;
  fieldOfStudy?: string[];
  ageLimit?: string;
  languageRequirement?: string;
  experience?: string;
  notes?: string;
}

export interface Scholarship {
  id: string;
  title: string;
  country: string;
  institution: string;
  level: string;
  awardAmount: string;
  fundingType: "Full" | "Partial" | "Mixed" | string;
  eligibility: ScholarshipEligibility;
  eligibilitySummary: string;
  deadline: string;
  description: string;
  overview?: string;
  applicationSteps: string[];
  documentsRequired: string[];
  officialLink: string;
  tags: string[];
  aiScore?: number;
  languageSupport?: string[];
  logoUrl?: string | null;
  currency?: string;
  stipendDetails?: string;
  selectionProcess?: string;
  recommendedFor?: string;
  verified?: boolean;
}

export interface ScholarshipSearchFilters {
  countries: string[];
  levels: string[];
  fundingTypes: string[];
  deadline: "all" | "upcoming" | "flexible" | "closed";
  fieldsOfStudy: string[];
  eligibilityTags: string[];
}

export interface ScholarshipSearchResult extends Scholarship {
  matchReasons?: string[];
  deadlineDaysRemaining?: number | null;
  deadlineLabel?: string;
}

export interface ScholarshipAIRecommendation {
  id: string;
  title: string;
  reason: string;
  score: number;
}
