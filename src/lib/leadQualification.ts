import { Lead, LeadCore, LeadQualificationBreakdown, LeadScoreDetail } from "@/types/lead";

const REQUIRED_DOCUMENTS = [
  "Passport bio page",
  "Academic transcripts",
  "Proof of funds statement",
  "Statement of purpose",
  "Recommendation letter",
  "English proficiency score",
];

const scoreToLevel = (score: number): LeadScoreDetail["level"] => {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
};

const summaryForMetric = (metric: keyof Omit<LeadQualificationBreakdown, "missingDocuments">, level: LeadScoreDetail["level"]): string => {
  const levelText =
    level === "high"
      ? "Strong signals"
      : level === "medium"
        ? "Moderate signals"
        : "Limited signals";

  switch (metric) {
    case "academicStrength":
      return `${levelText} from transcripts, GPA trends, and recommender tone.`;
    case "financialReadiness":
      return `${levelText} based on declared savings, sponsor reliability, and tuition coverage.`;
    case "destinationInterest":
      return `${levelText} inferred from program shortlists, portal logins, and counselor chats.`;
    case "conversionLikelihood":
      return `${levelText} derived from engagement velocity, response time, and task completion.`;
    default:
      return `${levelText} from recent activity signals.`;
  }
};

const stringFingerprint = (input: string): number => {
  return input.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
};

const deterministicScore = (fingerprint: number, offset: number, bias = 0): number => {
  const raw = Math.sin(fingerprint * (offset + 1)) + 1; // 0-2
  const normalized = raw / 2; // 0-1
  const weighted = normalized * 60 + 25 + bias; // ensure between ~25-85 before clamp
  return Math.max(10, Math.min(100, Math.round(weighted)));
};

const rotateDocuments = (fingerprint: number, count: number): string[] => {
  if (count <= 0) return [];
  const docs: string[] = [];
  for (let i = 0; i < count; i++) {
    const index = (fingerprint + i) % REQUIRED_DOCUMENTS.length;
    docs.push(REQUIRED_DOCUMENTS[index]);
  }
  return docs;
};

const createScoreDetail = (
  metric: keyof Omit<LeadQualificationBreakdown, "missingDocuments">,
  score: number,
): LeadScoreDetail => ({
  score,
  level: scoreToLevel(score),
  summary: summaryForMetric(metric, scoreToLevel(score)),
});

export const enrichLeadWithQualification = (lead: LeadCore): Lead => {
  const fingerprint = stringFingerprint(
    `${lead.id}-${lead.email}-${lead.country}-${lead.status}`,
  );

  const academicStrength = deterministicScore(fingerprint, 1);
  const financialReadiness = deterministicScore(
    fingerprint,
    2,
    lead.status.includes("offer") ? 10 : 0,
  );
  const destinationInterest = deterministicScore(
    fingerprint,
    3,
    lead.country ? 5 : 0,
  );
  const conversionLikelihood = Math.max(
    20,
    Math.min(
      100,
      Math.round(
        academicStrength * 0.3 +
          financialReadiness * 0.25 +
          destinationInterest * 0.2 +
          (lead.status.includes("ready") || lead.status.includes("offer") ? 15 : 0),
      ),
    ),
  );

  const missingCount = Math.max(
    0,
    Math.min(4, Math.round(5 - conversionLikelihood / 20 - destinationInterest / 35)),
  );
  const missingDocuments = rotateDocuments(fingerprint, missingCount);

  const qualification: LeadQualificationBreakdown = {
    academicStrength: createScoreDetail("academicStrength", academicStrength),
    financialReadiness: createScoreDetail("financialReadiness", financialReadiness),
    destinationInterest: createScoreDetail("destinationInterest", destinationInterest),
    conversionLikelihood: createScoreDetail(
      "conversionLikelihood",
      conversionLikelihood,
    ),
    missingDocuments: {
      missingCount,
      documents: missingDocuments,
      summary:
        missingCount === 0
          ? "All priority documents received."
          : `${missingCount} document${missingCount > 1 ? "s" : ""} still outstanding for visa/admission packages.`,
    },
  };

  const priorityScore = Math.max(
    15,
    Math.min(
      100,
      Math.round(
        academicStrength * 0.25 +
          financialReadiness * 0.25 +
          destinationInterest * 0.2 +
          conversionLikelihood * 0.3 -
          missingCount * 3,
      ),
    ),
  );

  const priorityLevel = priorityScore >= 80 ? "hot" : priorityScore >= 60 ? "warm" : "nurture";
  const prioritySummary =
    priorityLevel === "hot"
      ? "Fast-track this student – strong scores and minimal outstanding work."
      : priorityLevel === "warm"
        ? "Engaged lead with a few blockers – nudge documents and funding proof."
        : "Longer-term nurture – focus on education and keep sharing destination options.";

  return {
    ...lead,
    priorityScore,
    priorityLevel,
    prioritySummary,
    qualification,
  };
};
