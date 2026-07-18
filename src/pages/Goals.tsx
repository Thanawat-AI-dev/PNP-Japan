import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, ResponsiveContainer } from "recharts";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatBaht } from "@/lib/utils";
import { useAccount } from "@/lib/useAccount";
import { useTransactions } from "@/lib/useTransactions";
import { useGoal } from "@/lib/useGoal";
import { useInterestRateTiers, calcEffectiveAnnualRate } from "@/lib/useInterestRateTiers";
import { computeBalance, computeMonthlyGrowth } from "@/lib/transactions";

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

function monthsToGoal(current: number, target: number, monthlyDeposit: number, annualRate: number) {
  if (current >= target) return 0;
  if (monthlyDeposit <= 0 && annualRate <= 0) return Infinity;
  const r = annualRate / 12;
  let balance = current;
  let months = 0;
  while (balance < target && months < 600) {
    balance = balance * (1 + r) + monthlyDeposit;
    months++;
  }
  return months;
}

function projectForward(
  current: number,
  monthlyDeposit: number,
  annualRate: number,
  monthsAhead: number,
  startDate: Date,
) {
  const r = annualRate / 12;
  let balance = current;
  const points: { month: string; balance: number }[] = [];
  for (let i = 1; i <= monthsAhead; i++) {
    balance = balance * (1 + r) + monthlyDeposit;
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    points.push({ month: THAI_MONTHS_SHORT[d.getMonth()], balance });
  }
  return points;
}

export function Goals() {
  const { account } = useAccount();
  const { transactions } = useTransactions(account?.id);
  const { goal } = useGoal(account?.id);
  const { tiers } = useInterestRateTiers(account?.id);
  const [monthlyDeposit, setMonthlyDeposit] = useState(8_500);

  const balance = computeBalance(transactions);
  const pastGrowth = computeMonthlyGrowth(transactions);
  const annualRate = calcEffectiveAnnualRate(balance, tiers);

  const months = useMemo(
    () =>
      goal ? monthsToGoal(balance, goal.target_amount, monthlyDeposit, annualRate) : 0,
    [balance, goal, monthlyDeposit, annualRate],
  );

  const forecast = useMemo(() => {
    const projectionMonths = Math.min(months === Infinity ? 12 : months, 60);
    const projected = projectForward(balance, monthlyDeposit, annualRate, projectionMonths, new Date());
    return [...pastGrowth, ...projected];
  }, [balance, monthlyDeposit, annualRate, months, pastGrowth]);

  if (!goal) {
    return (
      <MobileShell title="เป้าหมาย">
        <p className="py-12 text-center text-sm text-ink-muted">ยังไม่มีเป้าหมาย</p>
      </MobileShell>
    );
  }

  const goalPct = (balance / goal.target_amount) * 100;

  return (
    <MobileShell title="เป้าหมาย">
      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex items-baseline justify-between">
            <CardLabel>{goal.title}</CardLabel>
            <span className="text-xs font-semibold text-ink-muted">{goalPct.toFixed(1)}%</span>
          </div>
          <p className="tabular mt-1 text-lg font-bold text-ink">
            {formatBaht(balance)} / {formatBaht(goal.target_amount)} บาท
          </p>
          <ProgressBar value={goalPct} className="mt-3" />
        </Card>

        <Card>
          <CardLabel>กราฟพยากรณ์ถึงเป้าหมาย</CardLabel>
          <div className="-mx-2 mt-2 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--color-trust-500)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink" htmlFor="deposit-slider">
              ถ้าฝากเดือนละ{" "}
              <span className="tabular font-bold text-growth-600">
                ฿{formatBaht(monthlyDeposit)}
              </span>
            </label>
            <input
              id="deposit-slider"
              type="range"
              min={0}
              max={20_000}
              step={500}
              value={monthlyDeposit}
              onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
              className="accent-growth-600"
            />
            <p className="text-sm text-ink-muted">
              {months === Infinity ? (
                "เพิ่มยอดฝากต่อเดือนเพื่อดูวันที่คาดว่าจะถึงเป้าหมาย"
              ) : (
                <>
                  จะถึงเป้าหมายในอีก <span className="font-semibold text-ink">{months}</span> เดือน
                </>
              )}
            </p>
            {annualRate === 0 && (
              <p className="text-xs text-ink-faint">
                * ยังไม่ได้ตั้งค่าอัตราดอกเบี้ย คำนวณนี้ยังไม่รวมดอกเบี้ยทบต้น
              </p>
            )}
          </div>
        </Card>
      </div>
    </MobileShell>
  );
}
