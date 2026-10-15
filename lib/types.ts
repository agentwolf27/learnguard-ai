export type RiskLevel = "low" | "medium" | "high";

export const promptCategories = [
  "Learning Assistance",
  "Research",
  "Brainstorming",
  "Draft Feedback",
  "Concept Explanation",
  "Homework Support",
  "Assessment Circumvention",
  "Direct Answer Request",
  "Academic Integrity Risk"
] as const;

export type PromptCategory = (typeof promptCategories)[number];

export type RuleClassification = {
  flagged: boolean;
  matchedPhrases: string[];
  riskLevel: RiskLevel;
};

export type GovernanceClassification = {
  category: PromptCategory;
  riskLevel: RiskLevel;
  allowed: boolean;
  reason: string;
  educationalAlternative: string;
  confidence: number;
};

export type CombinedClassification = GovernanceClassification & {
  flagged: boolean;
  matchedPhrases: string[];
  ruleRiskLevel: RiskLevel;
};

export type LtiRole = "student" | "teacher" | "admin";

export type LtiLaunchContext = {
  userId: string;
  userName: string;
  userEmail?: string;
  role: LtiRole;
  courseId?: string;
  courseName?: string;
  assignmentId?: string;
  assignmentTitle?: string;
  deploymentId?: string;
  issuer?: string;
  targetLinkUri?: string;
  canvasHost?: string;
};

export type SustainabilityEstimate = {
  estimatedTokens: number;
  estimatedCO2Grams: number;
  estimatedWaterML: number;
  disclaimer: string;
};
