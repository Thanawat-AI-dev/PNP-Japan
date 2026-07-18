import { Flame, TriangleAlert } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { formatBaht } from "@/lib/utils";
import { account, goal, growthHistory, transactions, getLevelForBalance } from "@/lib/mockData";

export function Dashboard() {
  const goalPct = (goal.currentAmount / goal.targetAmount) * 100;
  const onPacePct = (goal.onPaceAmount / goal.targetAmount) * 100;
  const flagged = transactions.filter((t) => t.needsReview).length;
  const level = getLevelForBalance(account.balance);

  return (
    <MobileShell title="SaveTogether">
      <div className="flex flex-col gap-4">
        {flagged > 0 && (
          <div className="flex items-center gap-2 rounded-[var(--radius-control)] bg-caution-50 px-3.5 py-2.5 text-sm font-medium text-caution-600">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            มี {flagged} รายการที่ระบบไม่มั่นใจ รอ Admin ตรวจสอบ
          </div>
        )}

        {/* Hero balance — the single largest thing on screen, per spec section 8 */}
        <Card className="flex flex-col items-center text-center">
          <CardLabel>ยอดรวมทั้งหมด</CardLabel>
          <p className="tabular mt-1 text-[40px] font-extrabold leading-tight text-ink">
            ฿{formatBaht(account.balance)}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Badge tone="growth">
              {level.emoji} {level.name}
            </Badge>
            <Badge tone="trust">
              <Flame className="h-3.5 w-3.5" /> {account.currentStreak} เดือนติด
            </Badge>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <CardLabel>ดอกเบี้ยสะสมรอบนี้</CardLabel>
            <p className="tabular mt-1 text-xl font-bold text-growth-600">
              +฿{formatBaht(account.interestAccruedThisPeriod)}
            </p>
          </Card>
          <Card className="p-4">
            <CardLabel>Best streak</CardLabel>
            <p className="tabular mt-1 text-xl font-bold text-ink">
              {account.bestStreak} เดือน
            </p>
          </Card>
        </div>

        <Card>
          <div className="flex items-baseline justify-between">
            <CardLabel>เป้าหมาย: {goal.title}</CardLabel>
            <span className="text-xs font-semibold text-ink-muted">
              {goalPct.toFixed(1)}%
            </span>
          </div>
          <p className="tabular mt-1 text-sm text-ink">
            {formatBaht(goal.currentAmount)} / {formatBaht(goal.targetAmount)} บาท
          </p>
          <ProgressBar value={goalPct} ghostValue={onPacePct} className="mt-3" />
          <p className="mt-2 text-xs text-ink-faint">
            เส้นเทา = ควรอยู่ตรงนี้ถ้าอยากถึงเป้าตามกำหนด
          </p>
        </Card>

        <Card>
          <CardLabel>การเติบโตของยอดเงิน</CardLabel>
          <div className="-mx-2 mt-2 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthHistory} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-growth-500)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-growth-500)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
                />
                <Tooltip
                  formatter={(v) => [`฿${formatBaht(Number(v))}`, "ยอดรวม"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-line)",
                    background: "var(--color-surface)",
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--color-growth-500)"
                  strokeWidth={2.5}
                  fill="url(#growthFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </MobileShell>
  );
}
