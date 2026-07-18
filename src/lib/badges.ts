// Static catalog of possible badges (spec section 7.3). This is app
// configuration, not user data - which ones are actually earned comes from
// the `achievements` table via useAchievements.
export const badgeCatalog = [
  { code: "first_deposit", emoji: "🎬", name: "ก้าวแรก" },
  { code: "streak_3", emoji: "📅", name: "สม่ำเสมอ" },
  { code: "streak_6", emoji: "🔥", name: "ไฟแรง" },
  { code: "streak_12", emoji: "👑", name: "ปีทอง" },
  { code: "double_avg", emoji: "💪", name: "ทะลุเป้า" },
  { code: "early_bird", emoji: "🐦", name: "นกตื่นเช้า" },
  { code: "goal_reached", emoji: "🏆", name: "ถึงฝั่ง" },
  { code: "first_interest", emoji: "💰", name: "ดอกออกผล" },
  { code: "no_withdrawal", emoji: "🛡️", name: "ไม่ถอนเลย" },
];
