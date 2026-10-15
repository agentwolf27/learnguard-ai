import type { RiskLevel, RuleClassification } from "@/lib/types";

const phraseCatalog: Array<{ phrase: string; riskLevel: Exclude<RiskLevel, "low"> }> = [
  { phrase: "write my essay", riskLevel: "medium" },
  { phrase: "do my homework", riskLevel: "medium" },
  { phrase: "take my quiz", riskLevel: "high" },
  { phrase: "give me the answers", riskLevel: "medium" },
  { phrase: "solve this test", riskLevel: "high" },
  { phrase: "complete my assignment", riskLevel: "medium" },
  { phrase: "make it undetectable", riskLevel: "high" },
  { phrase: "bypass plagiarism", riskLevel: "high" },
  { phrase: "answer key", riskLevel: "medium" },
  { phrase: "cheat on", riskLevel: "high" },
  { phrase: "submit for me", riskLevel: "high" }
];

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function classifyWithRules(prompt: string): RuleClassification {
  const normalized = prompt.toLowerCase().replace(/\s+/g, " ").trim();

  const matches = phraseCatalog.filter(({ phrase }) => {
    const pattern = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "i");
    return pattern.test(normalized);
  });

  const matchedPhrases = matches.map(({ phrase }) => phrase);
  const highRiskCount = matches.filter(({ riskLevel }) => riskLevel === "high").length;
  const riskLevel: RiskLevel =
    highRiskCount > 0 || matchedPhrases.length >= 2
      ? "high"
      : matchedPhrases.length === 1
        ? "medium"
        : "low";

  return {
    flagged: matchedPhrases.length > 0,
    matchedPhrases,
    riskLevel
  };
}
