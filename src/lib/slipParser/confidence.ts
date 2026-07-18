// Confidence scoring per savings-tracker-spec.md section 5, step 3.
// The 4th criterion (receiver name matches account settings, +0.15) is not
// scored yet because there's no receiver-name setting wired up in Settings
// yet - it's left out of the total rather than silently counted as a match.

export function scoreConfidence(input: {
  qrFound: boolean;
  amountFound: boolean;
  datetimeFound: boolean;
}): number {
  let score = 0;
  if (input.qrFound) score += 0.35;
  if (input.amountFound) score += 0.3;
  if (input.datetimeFound) score += 0.2;
  return Math.min(1, score);
}

export type ConfidenceTier = "auto" | "review" | "manual";

export function confidenceTier(score: number): ConfidenceTier {
  if (score >= 0.8) return "auto";
  if (score >= 0.5) return "review";
  return "manual";
}
