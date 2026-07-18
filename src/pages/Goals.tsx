import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, ResponsiveContainer } from "recharts";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatBaht } from "@/lib/utils";
import { goal, forecast } from "@/lib/mockData";

const ANNUAL_RATE = 0.0155;

function monthsToGoal(current: number, target: number, monthlyDeposit: number) {
  const r = ANNUAL_RATE / 12;
  let balance = current;
  let months = 0;
  while (balance < target && months < 600) {
    balance = balance * (1 + r) + monthlyDeposit;
    months++;
  }
  return months;
}

export function Goals() {
  const [monthlyDeposit, setMonthlyDeposit] = useState(8_500);
  const goalPct = (goal.currentAmount / goal.targetAmount) * 100;
  const onPacePct = (goal.onPaceAmount / goal.targetAmount) * 100;

  const months = useMemo(
    () => monthsToGoal(goal.currentAmount, goal.targetAmount, monthlyDeposit),
    [monthlyDeposit],
  );

  return (
    <MobileShell title="เป้าหมาย">
      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex items-baseline justify-between">
            <CardLabel>{goal.title}</CardLabel>
            <span className="text-xs font-semibold text-ink-muted">{goalPct.toFixed(1)}%</span>
          </div>
          <p className="tabular mt-1 text-lg font-bold text-ink">
            {formatBaht(goal.currentAmount)} / {formatBaht(goal.targetAmount)} บาท
          </p>
          <ProgressBar value={goalPct} ghostValue={onPacePct} className="mt-3" />
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
              min={2_000}
              max={20_000}
              step={500}
              value={monthlyDeposit}
              onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
              className="accent-growth-600"
            />
            <p className="text-sm text-ink-muted">
              จะถึงเป้าหมายในอีก <span className="font-semibold text-ink">{months}</span> เดือน
            </p>
          </div>
        </Card>
      </div>
    </MobileShell>
  );
}
