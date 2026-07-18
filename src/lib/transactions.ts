export interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "interest" | "adjustment";
  amount_cents: number;
  occurred_at: string;
  note: string | null;
  needs_review: boolean;
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

/** One point per calendar month that had activity, with the running (cumulative) balance as of that month. */
export function computeMonthlyGrowth(
  transactions: Transaction[],
): { month: string; balance: number }[] {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime(),
  );

  const byMonth = new Map<string, number>();
  let running = 0;
  for (const t of sorted) {
    running += signedAmount(t);
    const d = new Date(t.occurred_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    byMonth.set(key, running);
  }

  return [...byMonth.entries()].map(([key, cents]) => {
    const [, monthIndex] = key.split("-").map(Number);
    return { month: THAI_MONTHS_SHORT[monthIndex], balance: cents / 100 };
  });
}
