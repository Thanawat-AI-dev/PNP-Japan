// Placeholder data shaped like the tables in savings-tracker-spec.md section 9,
// used to build the UI before Supabase is wired up (see src/lib/supabase.ts).

export const account = {
  name: "KKP Savvy — เงินฝากของแนน",
  balance: 152_000,
  interestAccruedThisPeriod: 1_234.56,
  currentStreak: 5,
  bestStreak: 7,
};

export const goal = {
  title: "ดาวน์คอนโด",
  targetAmount: 500_000,
  targetDate: "2028-03-01",
  currentAmount: 152_000,
  onPaceAmount: 180_000,
};

export const growthHistory = [
  { month: "ก.พ.", balance: 62_000 },
  { month: "มี.ค.", balance: 78_500 },
  { month: "เม.ย.", balance: 91_000 },
  { month: "พ.ค.", balance: 110_200 },
  { month: "มิ.ย.", balance: 131_000 },
  { month: "ก.ค.", balance: 152_000 },
];

export const forecast = [
  ...growthHistory,
  { month: "ส.ค.", balance: 160_500, projected: true },
  { month: "ก.ย.", balance: 169_000, projected: true },
  { month: "ต.ค.", balance: 177_500, projected: true },
];

export type TransactionType = "deposit" | "withdrawal" | "interest" | "adjustment";

export const transactions: {
  id: string;
  type: TransactionType;
  amount: number;
  occurredAt: string;
  note: string | null;
  needsReview: boolean;
}[] = [
  {
    id: "1",
    type: "deposit" as const,
    amount: 8_500,
    occurredAt: "2026-07-18T14:32:00+07:00",
    note: null,
    needsReview: false,
  },
  {
    id: "2",
    type: "deposit" as const,
    amount: 8_500,
    occurredAt: "2026-06-15T09:10:00+07:00",
    note: null,
    needsReview: false,
  },
  {
    id: "3",
    type: "interest" as const,
    amount: 1_234.56,
    occurredAt: "2026-06-30T00:00:00+07:00",
    note: "ดอกเบี้ยรอบ ม.ค.-มิ.ย.",
    needsReview: false,
  },
  {
    id: "4",
    type: "deposit" as const,
    amount: 21_000,
    occurredAt: "2026-05-20T18:45:00+07:00",
    note: null,
    needsReview: true,
  },
];

export const badges = [
  { code: "first_deposit", emoji: "🎬", name: "ก้าวแรก", earned: true },
  { code: "streak_3", emoji: "📅", name: "สม่ำเสมอ", earned: true },
  { code: "streak_6", emoji: "🔥", name: "ไฟแรง", earned: false },
  { code: "streak_12", emoji: "👑", name: "ปีทอง", earned: false },
  { code: "double_avg", emoji: "💪", name: "ทะลุเป้า", earned: true },
  { code: "early_bird", emoji: "🐦", name: "นกตื่นเช้า", earned: false },
  { code: "goal_reached", emoji: "🏆", name: "ถึงฝั่ง", earned: false },
  { code: "first_interest", emoji: "💰", name: "ดอกออกผล", earned: true },
  { code: "no_withdrawal", emoji: "🛡️", name: "ไม่ถอนเลย", earned: true },
];

// Thresholds rescaled so level 6 (เพชร) = 50,000, keeping the original
// proportions (each is the old spec value / 20).
export const levels = [
  { order: 1, emoji: "🌱", name: "ต้นกล้า", threshold: 0 },
  { order: 2, emoji: "🪴", name: "ต้นอ่อน", threshold: 500 },
  { order: 3, emoji: "🌳", name: "ต้นไม้", threshold: 2_500 },
  { order: 4, emoji: "🌲", name: "ไม้ใหญ่", threshold: 5_000 },
  { order: 5, emoji: "🏔️", name: "ป่าเขา", threshold: 25_000 },
  { order: 6, emoji: "💎", name: "เพชร", threshold: 50_000 },
];

/** Highest level whose threshold the balance has reached (levels never go backwards in the real DB). */
export function getLevelForBalance(balance: number) {
  return [...levels].reverse().find((l) => balance >= l.threshold) ?? levels[0];
}
