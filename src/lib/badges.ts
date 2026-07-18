// Static catalog of possible badges (spec section 7.3). This is app
// configuration, not user data - which ones are actually earned comes from
// the `achievements` table via useAchievements.
export const badgeCatalog = [
  { code: "first_deposit", emoji: "🎬", name: "ก้าวแรก", description: "ฝากเงินครั้งแรก" },
  { code: "streak_3", emoji: "📅", name: "สม่ำเสมอ", description: "ฝากต่อเนื่อง 3 เดือนติด" },
  { code: "streak_6", emoji: "🔥", name: "ไฟแรง", description: "ฝากต่อเนื่อง 6 เดือนติด" },
  { code: "streak_12", emoji: "👑", name: "ปีทอง", description: "ฝากต่อเนื่อง 12 เดือนติด" },
  {
    code: "double_avg",
    emoji: "💪",
    name: "ทะลุเป้า",
    description: "ฝากเกินยอดเฉลี่ยของตัวเอง 2 เท่าในเดือนเดียว",
  },
  {
    code: "early_bird",
    emoji: "🐦",
    name: "นกตื่นเช้า",
    description: "ฝากภายในวันที่ 5 ของเดือน ติดต่อกัน 3 เดือน",
  },
  { code: "goal_reached", emoji: "🏆", name: "ถึงฝั่ง", description: "ถึงเป้าหมายที่ตั้งไว้" },
  { code: "first_interest", emoji: "💰", name: "ดอกออกผล", description: "ได้รับดอกเบี้ยรอบแรก" },
  {
    code: "no_withdrawal",
    emoji: "🛡️",
    name: "ไม่ถอนเลย",
    description: "ไม่มีการถอนเงินเลยตลอด 12 เดือน",
  },
];
