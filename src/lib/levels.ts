// Thresholds scaled so level 6 (เพชร) = 50,000, keeping the original spec
// proportions (each is the spec's value / 20).
export const levels = [
  { order: 1, emoji: "🌱", name: "ต้นกล้า", threshold: 0, description: "เริ่มต้นการออม" },
  { order: 2, emoji: "🪴", name: "ต้นอ่อน", threshold: 500, description: "สะสมครบ 500 บาท" },
  { order: 3, emoji: "🌳", name: "ต้นไม้", threshold: 2_500, description: "สะสมครบ 2,500 บาท" },
  { order: 4, emoji: "🌲", name: "ไม้ใหญ่", threshold: 5_000, description: "สะสมครบ 5,000 บาท" },
  { order: 5, emoji: "🏔️", name: "ป่าเขา", threshold: 25_000, description: "สะสมครบ 25,000 บาท" },
  { order: 6, emoji: "💎", name: "เพชร", threshold: 50_000, description: "สะสมครบ 50,000 บาท" },
];

/** Highest level whose threshold the balance has reached. */
export function getLevelForBalance(balance: number) {
  return [...levels].reverse().find((l) => balance >= l.threshold) ?? levels[0];
}
