export type LeadPriorityLevel = "hot" | "warm" | "nurture";

export interface LeadScoreDetail {
  score: number;
  level: "low" | "medium" | "high";
  summary: string;
}

export interface LeadMissingDocumentsInsight {
  missingCount: number;
  documents: string[];
  summary: string;
}

export interface LeadQualificationBreakdown {
  academicStrength: LeadScoreDetail;
  financialReadiness: LeadScoreDetail;
  destinationInterest: LeadScoreDetail;
  conversionLikelihood: LeadScoreDetail;
  missingDocuments: LeadMissingDocumentsInsight;
}

export interface LeadCore {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  status: string;
}

export interface Lead extends LeadCore {
  priorityScore: number;
  priorityLevel: LeadPriorityLevel;
  prioritySummary: string;
  qualification: LeadQualificationBreakdown;
}
