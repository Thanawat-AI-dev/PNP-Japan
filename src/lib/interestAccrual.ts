import type { Transaction } from "@/lib/transactions";
import type { RateTier } from "@/lib/useInterestRateTiers";

const DAYS_PER_YEAR = 365; // Thai banks always use 365, even in leap years (spec section 6.4).

function signedAmount(t: Pick<Transaction, "type" | "amount_cents">): number {
  return t.type === "withdrawal" ? -t.amount_cents : t.amount_cents;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Parses a "YYYY-MM-DD" column value as a local calendar date. `new
 * Date("YYYY-MM-DD")` parses as UTC midnight, which in Asia/Bangkok
 * (UTC+7) is 07:00 local - later than the local midnight `startOfDay`
 * produces, so comparing against it directly would silently exclude a
 * tier on its own effective_from day (and everywhere else that compares
 * a date-only column against a local-midnight cursor).
 */
function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function tiersEffectiveOn(tiers: RateTier[], date: Date): RateTier[] {
  return tiers.filter((t) => {
    const from = parseDateOnly(t.effective_from);
    const to = t.effective_to ? parseDateOnly(t.effective_to) : null;
    return date >= from && (!to || date <= to);
  });
}

/** One day's interest in baht for a given closing balance (spec section 6.1/6.4). */
export function calcDailyInterest(balance: number, tiers: RateTier[]): number {
  let interest = 0;
  for (const t of tiers) {
    const upper = t.max_balance ?? Infinity;
    const amountInTier = Math.max(0, Math.min(balance, upper) - t.min_balance);
    if (amountInTier <= 0) continue;
    interest += (amountInTier * t.annual_rate) / DAYS_PER_YEAR;
  }
  return interest;
}

export interface PayoutPeriod {
  start: Date;
  end: Date;
}

/**
 * Payout period boundaries covering `date`, per the account's
 * interest_payout frequency (spec section 6.2's "รอบการจ่ายดอกเบี้ย").
 */
export function periodContaining(
  payout: "monthly" | "quarterly" | "semiannual" | string,
  date: Date,
): PayoutPeriod {
  const y = date.getFullYear();
  const m = date.getMonth();

  if (payout === "monthly") {
    return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0) };
  }
  if (payout === "quarterly") {
    const qStartMonth = Math.floor(m / 3) * 3;
    return { start: new Date(y, qStartMonth, 1), end: new Date(y, qStartMonth + 3, 0) };
  }
  // semiannual (default): Jan-Jun, Jul-Dec
  const half = m < 6 ? 0 : 6;
  return { start: new Date(y, half, 1), end: new Date(y, half + 6, 0) };
}

export function previousPeriod(payout: string, period: PayoutPeriod): PayoutPeriod {
  const dayBefore = new Date(period.start);
  dayBefore.setDate(dayBefore.getDate() - 1);
  return periodContaining(payout, dayBefore);
}

/**
 * Sums daily accrued interest (spec 6.4's accrueInterest) over
 * [periodStart, min(periodEnd, today)], using the real closing balance each
 * day (from real transactions) and whichever rate tiers were effective that
 * day. Returns the estimate in baht - never a hardcoded/example rate.
 */
export function estimatePeriodInterest(
  transactions: Transaction[],
  tiers: RateTier[],
  period: PayoutPeriod,
): number {
  const today = startOfDay(new Date());
  const rangeEnd = period.end < today ? period.end : today;
  if (period.start > rangeEnd) return 0;

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime(),
  );

  let balance = sorted
    .filter((t) => startOfDay(new Date(t.occurred_at)) < period.start)
    .reduce((sum, t) => sum + signedAmount(t), 0);

  let txnIndex = sorted.findIndex((t) => startOfDay(new Date(t.occurred_at)) >= period.start);
  if (txnIndex === -1) txnIndex = sorted.length;

  let totalInterestCents = 0;
  const cursor = new Date(period.start);
  while (cursor <= rangeEnd) {
    while (txnIndex < sorted.length && startOfDay(new Date(sorted[txnIndex].occurred_at)).getTime() === cursor.getTime()) {
      balance += signedAmount(sorted[txnIndex]);
      txnIndex++;
    }
    const balanceBaht = balance / 100;
    const dayTiers = tiersEffectiveOn(tiers, cursor);
    totalInterestCents += calcDailyInterest(balanceBaht, dayTiers) * 100;
    cursor.setDate(cursor.getDate() + 1);
  }

  return totalInterestCents / 100;
}
