export type TransactionType = "deposit" | "withdrawal" | "interest" | "adjustment";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount_cents: number;
  occurred_at: string;
  note: string | null;
  needs_review: boolean;
  cancel_requested: boolean;
  created_by: string | null;
  created_at: string;
}

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/** Withdrawals subtract; deposit/interest/adjustment add (adjustment's sign lives in amount_cents itself). */
function signedAmount(t: Pick<Transaction, "type" | "amount_cents">): number {
  return t.type === "withdrawal" ? -t.amount_cents : t.amount_cents;
}

export function computeBalance(transactions: Transaction[]): number {
  const totalCents = transactions.reduce((sum, t) => sum + signedAmount(t), 0);
  return totalCents / 100;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * One point per calendar day (not month) from the earlier of "first
 * transaction" or `windowDays` ago, through today, carrying the running
 * balance forward on days with no activity. Capped to `windowDays` (default
 * 90) so the chart stays readable once history builds up.
 */
export function computeDailyGrowth(
  transactions: Transaction[],
  windowDays = 90,
): { date: string; balance: number }[] {
  if (transactions.length === 0) return [];

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime(),
  );

  const today = startOfDay(new Date());
  const firstTxnDay = startOfDay(new Date(sorted[0].occurred_at));
  const earliestWindowStart = new Date(today);
  earliestWindowStart.setDate(earliestWindowStart.getDate() - (windowDays - 1));
  const start = firstTxnDay > earliestWindowStart ? firstTxnDay : earliestWindowStart;

  // Balance carried in from before the visible window.
  let running = sorted
    .filter((t) => startOfDay(new Date(t.occurred_at)) < start)
    .reduce((sum, t) => sum + signedAmount(t), 0);

  let txnIndex = sorted.findIndex((t) => startOfDay(new Date(t.occurred_at)) >= start);
  if (txnIndex === -1) txnIndex = sorted.length;

  const points: { date: string; balance: number }[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    while (txnIndex < sorted.length && startOfDay(new Date(sorted[txnIndex].occurred_at)).getTime() === cursor.getTime()) {
      running += signedAmount(sorted[txnIndex]);
      txnIndex++;
    }
    points.push({
      date: `${cursor.getDate()} ${THAI_MONTHS_SHORT[cursor.getMonth()]}`,
      balance: running / 100,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}
