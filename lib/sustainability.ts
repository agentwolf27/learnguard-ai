import type { SustainabilityEstimate } from "@/lib/types";

export const sustainabilityDisclaimer =
  "These are rough educational estimates, not exact measurements.";

export function estimateSustainability(prompt: string, response = ""): SustainabilityEstimate {
  const words = `${prompt} ${response}`
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const estimatedTokens = Math.round(words * 1.3);

  return {
    estimatedTokens,
    estimatedCO2Grams: Number((estimatedTokens * 0.0005).toFixed(4)),
    estimatedWaterML: Number((estimatedTokens * 0.002).toFixed(3)),
    disclaimer: sustainabilityDisclaimer
  };
}
