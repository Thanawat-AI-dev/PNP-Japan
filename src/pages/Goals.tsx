import { useMemo, useState } from "react";
import { Pencil, Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, ResponsiveContainer } from "recharts";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatBaht } from "@/lib/utils";
import { useAccount } from "@/lib/useAccount";
import { useTransactions } from "@/lib/useTransactions";
import { useGoals, type Goal } from "@/lib/useGoals";
import { useInterestRateTiers, calcEffectiveAnnualRate } from "@/lib/useInterestRateTiers";
import { computeBalance } from "@/lib/transactions";
import { supabase } from "@/lib/supabase";

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
  const { goals, refetch } = useGoals(account?.id);
  const { tiers } = useInterestRateTiers(account?.id);
  const [showNewForm, setShowNewForm] = useState(false);

  const balance = computeBalance(transactions);
  const annualRate = calcEffectiveAnnualRate(balance, tiers);
  const totalAllocated = goals.reduce((sum, g) => sum + g.allocated_amount, 0);
  const unallocated = balance - totalAllocated;

  return (
    <MobileShell title="เป้าหมาย">
      <div className="flex flex-col gap-4">
        {goals.length > 0 && (
          <Card className="p-4">
            <CardLabel>ยอดที่ยังไม่จัดสรร</CardLabel>
            <p
              className={`tabular mt-1 text-xl font-bold ${
                unallocated < 0 ? "text-alert-600" : "text-ink"
              }`}
            >
              ฿{formatBaht(unallocated)}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              จากยอดรวม ฿{formatBaht(balance)} · จัดสรรแล้ว ฿{formatBaht(totalAllocated)}
            </p>
          </Card>
        )}

        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            unallocated={unallocated}
            annualRate={annualRate}
            onChanged={refetch}
          />
        ))}

        {showNewForm || goals.length === 0 ? (
          <NewGoalForm
            accountId={account?.id}
            onCreated={() => {
              setShowNewForm(false);
              refetch();
            }}
            onCancel={goals.length > 0 ? () => setShowNewForm(false) : undefined}
          />
        ) : (
          <Button variant="outline" size="lg" onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4" /> เพิ่มเป้าหมายใหม่
          </Button>
        )}
      </div>
    </MobileShell>
  );
}

function GoalCard({
  goal,
  unallocated,
  annualRate,
  onChanged,
}: {
  goal: Goal;
  unallocated: number;
  annualRate: number;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [targetAmount, setTargetAmount] = useState(String(goal.target_amount));
  const [targetDate, setTargetDate] = useState(goal.target_date ?? "");
  const [allocatedInput, setAllocatedInput] = useState("0");
  const [monthlyDeposit, setMonthlyDeposit] = useState(2_000);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const goalPct = (goal.allocated_amount / goal.target_amount) * 100;

  async function saveEdit() {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("goals")
      .update({
        title,
        target_amount: Number(targetAmount),
        target_date: targetDate || null,
      })
      .eq("id", goal.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditing(false);
    onChanged();
  }

  async function saveAllocation() {
    const addAmount = Number(allocatedInput);
    setError(null);
    setSuccess(null);
    if (!addAmount || addAmount <= 0) {
      setError("กรอกจำนวนที่จะจัดสรรเพิ่ม");
      return;
    }
    if (addAmount > unallocated) {
      setError(`จัดสรรเพิ่มได้ไม่เกิน ฿${formatBaht(unallocated)} (ยอดที่ยังไม่จัดสรร)`);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("goals")
      .update({ allocated_amount: goal.allocated_amount + addAmount })
      .eq("id", goal.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setAllocatedInput("0");
    setSuccess(`จัดสรรสำเร็จ +฿${formatBaht(addAmount)}`);
    setTimeout(() => setSuccess(null), 3000);
    onChanged();
  }

  async function handleDelete() {
    if (
      !confirm(
        `ลบเป้าหมาย "${goal.title}" ทิ้ง? เงินที่จัดสรรไว้ ฿${formatBaht(goal.allocated_amount)} จะกลับไปเป็นยอดที่ยังไม่จัดสรร`,
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("goals").delete().eq("id", goal.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onChanged();
  }

  const months = monthsToGoal(goal.allocated_amount, goal.target_amount, monthlyDeposit, annualRate);
  const forecast = useMemo(() => {
    if (!showForecast) return [];
    const projectionMonths = Math.min(months === Infinity ? 12 : months, 60);
    return projectForward(goal.allocated_amount, monthlyDeposit, annualRate, projectionMonths, new Date());
  }, [showForecast, goal.allocated_amount, monthlyDeposit, annualRate, months]);

  if (editing) {
    return (
      <Card>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium text-ink">ชื่อเป้าหมาย</label>
            <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">ยอดเป้าหมาย (บาท)</label>
            <Input
              className="mt-1"
              inputMode="decimal"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">วันที่ต้องการถึง</label>
            <Input
              type="date"
              className="mt-1"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-alert-600">{error}</p>}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>
              ยกเลิก
            </Button>
            <Button className="flex-1" disabled={saving} onClick={saveEdit}>
              บันทึก
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <CardLabel>{goal.title}</CardLabel>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-ink-muted">{goalPct.toFixed(1)}%</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-ink-faint hover:text-ink"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="text-ink-faint hover:text-alert-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="tabular mt-1 text-lg font-bold text-ink">
        {formatBaht(goal.allocated_amount)} / {formatBaht(goal.target_amount)} บาท
      </p>
      <ProgressBar value={goalPct} className="mt-3" />

      <div className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <label className="text-xs font-medium text-ink-muted">จัดสรรเพิ่มให้เป้าหมายนี้ (บาท)</label>
          <Input
            className="mt-1"
            inputMode="decimal"
            value={allocatedInput}
            onChange={(e) => {
              setAllocatedInput(e.target.value);
              setSuccess(null);
            }}
          />
        </div>
        <Button size="sm" disabled={saving} onClick={saveAllocation}>
          จัดสรร
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-alert-600">{error}</p>}
      {success && <p className="mt-1 text-xs font-medium text-growth-600">{success}</p>}

      <button
        type="button"
        onClick={() => setShowForecast((v) => !v)}
        className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-growth-600"
      >
        {showForecast ? "ซ่อนพยากรณ์" : "ดูพยากรณ์"}
        {showForecast ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {showForecast && (
        <div className="mt-3">
          <div className="-mx-2 h-32">
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
          <div className="mt-2 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">
              ถ้าจัดสรรเพิ่มเดือนละ{" "}
              <span className="tabular font-bold text-growth-600">
                ฿{formatBaht(monthlyDeposit)}
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={10_000}
              step={500}
              value={monthlyDeposit}
              onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
              className="accent-growth-600"
            />
            <p className="text-sm text-ink-muted">
              {months === Infinity ? (
                "เพิ่มยอดจัดสรรต่อเดือนเพื่อดูวันที่คาดว่าจะถึงเป้าหมาย"
              ) : (
                <>
                  จะถึงเป้าหมายในอีก <span className="font-semibold text-ink">{months}</span> เดือน
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function NewGoalForm({
  accountId,
  onCreated,
  onCancel,
}: {
  accountId: string | undefined;
  onCreated: () => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId || !title || !targetAmount) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("goals").insert({
      account_id: accountId,
      title,
      target_amount: Number(targetAmount),
      target_date: targetDate || null,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onCreated();
  }

  return (
    <Card>
      <CardLabel>ตั้งเป้าหมายใหม่</CardLabel>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-ink" htmlFor="goal-title">
            ชื่อเป้าหมาย
          </label>
          <Input
            id="goal-title"
            className="mt-1"
            placeholder="เช่น ดาวน์คอนโด"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink" htmlFor="goal-amount">
            ยอดเป้าหมาย (บาท)
          </label>
          <Input
            id="goal-amount"
            className="mt-1"
            inputMode="decimal"
            placeholder="500000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink" htmlFor="goal-date">
            วันที่ต้องการถึง (ไม่บังคับ)
          </label>
          <Input
            id="goal-date"
            type="date"
            className="mt-1"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-alert-600">{error}</p>}
        <div className="mt-2 flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              ยกเลิก
            </Button>
          )}
          <Button type="submit" size="lg" className="flex-1" disabled={saving || !accountId}>
            {saving ? "กำลังบันทึก..." : "ตั้งเป้าหมาย"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
