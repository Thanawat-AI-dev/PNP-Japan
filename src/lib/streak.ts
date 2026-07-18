import type { Transaction } from "@/lib/transactions";

/**
 * Consecutive calendar months (counting back from the current month) with at
 * least one deposit. This is the spec section 7.2 baseline definition only -
 * it does not implement the "grace period" leniency (missing one month before
 * resetting) yet, since that needs a scheduled job to evaluate, not just a
 * point-in-time read.
 */
export function computeCurrentStreak(transactions: Transaction[], now = new Date()): number {
  const depositMonths = new Set(
    transactions
      .filter((t) => t.type === "deposit")
      .map((t) => {
        const d = new Date(t.occurred_at);
        return `${d.getFullYear()}-${d.getMonth()}`;
      }),
  );

  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  while (depositMonths.has(`${cursor.getFullYear()}-${cursor.getMonth()}`)) {
    streak++;
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return streak;
}

export function computeBestStreak(transactions: Transaction[]): number {
  const depositMonthKeys = [
    ...new Set(
      transactions
        .filter((t) => t.type === "deposit")
        .map((t) => {
          const d = new Date(t.occurred_at);
          return d.getFullYear() * 12 + d.getMonth();
        }),
    ),
  ].sort((a, b) => a - b);

  let best = 0;
  let current = 0;
  let prev: number | null = null;
  for (const key of depositMonthKeys) {
    current = prev != null && key === prev + 1 ? current + 1 : 1;
    best = Math.max(best, current);
    prev = key;
  }
  return best;
}
