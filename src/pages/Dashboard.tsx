import { lazy, Suspense } from "react";
import { Flame, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { formatBaht } from "@/lib/utils";
import { useAccount } from "@/lib/useAccount";
import { useTransactions } from "@/lib/useTransactions";
import { useGoals } from "@/lib/useGoals";
import { useInterestRateTiers } from "@/lib/useInterestRateTiers";
import { computeBalance, computeDailyGrowth } from "@/lib/transactions";
import {
  computeCurrentStreak,
  computeBestStreak,
  computeCurrentWeeklyStreak,
  computeBestWeeklyStreak,
} from "@/lib/streak";
import { getLevelForBalance } from "@/lib/levels";
import { periodContaining, estimatePeriodInterest } from "@/lib/interestAccrual";

const GrowthChart = lazy(() => import("@/components/GrowthChart"));

export function Dashboard() {
  const { account, loading: accountLoading } = useAccount();
  const { transactions, loading: txLoading } = useTransactions(account?.id);
  const { goals } = useGoals(account?.id);
  const { tiers } = useInterestRateTiers(account?.id);

  if (accountLoading || txLoading) {
    return (
      <MobileShell title="SaveTogether">
        <p className="py-12 text-center text-sm text-ink-muted">กำลังโหลด...</p>
      </MobileShell>
    );
  }

  if (!account) {
    return (
      <MobileShell title="SaveTogether">
        <p className="py-12 text-center text-sm text-ink-muted">
          ยังไม่พบบัญชีที่เชื่อมกับผู้ใช้นี้ ติดต่อ Admin เพื่อตั้งค่าบัญชี
        </p>
      </MobileShell>
    );
  }

  const balance = computeBalance(transactions);
  const growthHistory = computeDailyGrowth(transactions);
  const flagged = transactions.filter((t) => t.needs_review).length;
  const level = getLevelForBalance(balance);
  const currentStreak = computeCurrentStreak(transactions);
  const bestStreak = computeBestStreak(transactions);
  const currentWeeklyStreak = computeCurrentWeeklyStreak(transactions);
  const bestWeeklyStreak = computeBestWeeklyStreak(transactions);
  const currentPeriod = periodContaining(account.interest_payout ?? "semiannual", new Date());
  const estimatedInterest = estimatePeriodInterest(transactions, tiers, currentPeriod);
  const tickInterval = Math.max(0, Math.ceil(growthHistory.length / 6) - 1);

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
            ฿{formatBaht(balance)}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Badge tone="growth">
              {level.emoji} {level.name}
            </Badge>
            {currentStreak > 0 && (
              <Badge tone="trust">
                <Flame className="h-3.5 w-3.5" /> {currentStreak} เดือนติด
              </Badge>
            )}
            {currentWeeklyStreak > 0 && (
              <Badge tone="trust">
                <Flame className="h-3.5 w-3.5" /> {currentWeeklyStreak} สัปดาห์ติด
              </Badge>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <CardLabel>ดอกเบี้ยประเมินรอบนี้</CardLabel>
            <p className="tabular mt-1 text-xl font-bold text-growth-600">
              {tiers.length === 0 ? "ยังไม่ตั้งค่าอัตรา" : `+฿${formatBaht(estimatedInterest)}`}
            </p>
          </Card>
          <Card className="p-4">
            <CardLabel>Best streak</CardLabel>
            <p className="tabular mt-1 text-xl font-bold text-ink">{bestStreak} เดือน</p>
            <p className="tabular text-xs font-medium text-ink-muted">{bestWeeklyStreak} สัปดาห์</p>
          </Card>
        </div>

        <Link to="/goals" className="block">
          {goals.length === 0 ? (
            <Card className="text-center text-sm text-ink-muted">
              ยังไม่มีเป้าหมาย — แตะเพื่อตั้งเป้าหมาย
            </Card>
          ) : goals.length === 1 ? (
            <Card>
              <div className="flex items-baseline justify-between">
                <CardLabel>เป้าหมาย: {goals[0].title}</CardLabel>
                <span className="text-xs font-semibold text-ink-muted">
                  {((goals[0].allocated_amount / goals[0].target_amount) * 100).toFixed(1)}%
                </span>
              </div>
              <p className="tabular mt-1 text-sm text-ink">
                {formatBaht(goals[0].allocated_amount)} / {formatBaht(goals[0].target_amount)} บาท
              </p>
              <ProgressBar
                value={(goals[0].allocated_amount / goals[0].target_amount) * 100}
                className="mt-3"
              />
            </Card>
          ) : (
            <Card>
              <div className="flex items-baseline justify-between">
                <CardLabel>เป้าหมาย {goals.length} รายการ</CardLabel>
                <span className="text-xs font-semibold text-growth-600">ดูทั้งหมด →</span>
              </div>
              <p className="tabular mt-1 text-sm text-ink">
                จัดสรรแล้ว ฿
                {formatBaht(goals.reduce((sum, g) => sum + g.allocated_amount, 0))} จาก ฿
                {formatBaht(balance)}
              </p>
            </Card>
          )}
        </Link>

        <Card>
          <CardLabel>การเติบโตของยอดเงิน (90 วันล่าสุด)</CardLabel>
          {growthHistory.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">
              ยังไม่มีรายการ — แนบสลิปแรกเพื่อเริ่มติดตาม
            </p>
          ) : (
            <Suspense fallback={<div className="-mx-2 mt-2 h-36" />}>
              <GrowthChart data={growthHistory} tickInterval={tickInterval} />
            </Suspense>
          )}
        </Card>
      </div>
    </MobileShell>
  );
}
