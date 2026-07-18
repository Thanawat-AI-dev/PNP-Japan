import { useMemo, useState } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatBaht, formatThaiDate } from "@/lib/utils";
import { useAccount } from "@/lib/useAccount";
import { useTransactions } from "@/lib/useTransactions";
import { useInterestRateTiers } from "@/lib/useInterestRateTiers";
import { useInterestPeriods, type InterestPeriod } from "@/lib/useInterestPeriods";
import { useProfile } from "@/lib/useProfile";
import { periodContaining, previousPeriod, estimatePeriodInterest, type PayoutPeriod } from "@/lib/interestAccrual";
import { supabase } from "@/lib/supabase";

const TAX_FREE_THRESHOLD = 20_000;
const TAX_RATE = 0.15;
const PERIODS_SHOWN = 4;

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function Interest() {
  const { account } = useAccount();
  const { transactions } = useTransactions(account?.id);
  const { tiers } = useInterestRateTiers(account?.id);
  const { periods: dbPeriods, refetch: refetchPeriods } = useInterestPeriods(account?.id);
  const { isAdmin } = useProfile();

  const periods = useMemo(() => {
    if (!account) return [];
    const payout = account.interest_payout ?? "semiannual";
    let cursor: PayoutPeriod = periodContaining(payout, new Date());
    const list: PayoutPeriod[] = [];
    for (let i = 0; i < PERIODS_SHOWN; i++) {
      list.push(cursor);
      cursor = previousPeriod(payout, cursor);
    }
    return list;
  }, [account]);

  const currentYear = new Date().getFullYear();
  const yearToDateGross = periods
    .filter((p) => p.end.getFullYear() === currentYear)
    .reduce((sum, p) => {
      const dbRow = dbPeriods.find((r) => r.period_start === toDateKey(p.start));
      const value = dbRow?.actual_gross ?? estimatePeriodInterest(transactions, tiers, p);
      return sum + value;
    }, 0);

  return (
    <MobileShell title="ดอกเบี้ย" hideFab>
      <div className="flex flex-col gap-4">
        {account?.tax_enabled && (
          <Card className="p-4">
            <CardLabel>ดอกเบี้ยสะสมปีนี้ (ก่อนหักภาษี)</CardLabel>
            <p className="tabular mt-1 text-lg font-bold text-ink">
              ฿{formatBaht(yearToDateGross)} / ฿{formatBaht(TAX_FREE_THRESHOLD)}
            </p>
            <ProgressBar value={(yearToDateGross / TAX_FREE_THRESHOLD) * 100} className="mt-2" />
            {yearToDateGross >= TAX_FREE_THRESHOLD && (
              <p className="mt-2 text-xs text-alert-600">
                เกินยอดยกเว้นภาษีแล้ว - ดอกเบี้ยทั้งหมดจะถูกหักภาษี ณ ที่จ่าย 15%
              </p>
            )}
          </Card>
        )}

        {periods.map((period) => {
          const key = toDateKey(period.start);
          const dbRow = dbPeriods.find((r) => r.period_start === key);
          const estimated = dbRow?.estimated_gross ?? estimatePeriodInterest(transactions, tiers, period);
          const isOpen = period.end >= new Date();

          return (
            <PeriodCard
              key={key}
              period={period}
              estimated={estimated}
              dbRow={dbRow ?? null}
              isOpen={isOpen}
              taxEnabled={account?.tax_enabled ?? false}
              isAdmin={isAdmin}
              accountId={account?.id}
              onSaved={refetchPeriods}
            />
          );
        })}
      </div>
    </MobileShell>
  );
}

function PeriodCard({
  period,
  estimated,
  dbRow,
  isOpen,
  taxEnabled,
  isAdmin,
  accountId,
  onSaved,
}: {
  period: PayoutPeriod;
  estimated: number;
  dbRow: InterestPeriod | null;
  isOpen: boolean;
  taxEnabled: boolean;
  isAdmin: boolean;
  accountId: string | undefined;
  onSaved: () => void;
}) {
  const [recording, setRecording] = useState(false);
  const [actualGross, setActualGross] = useState(dbRow?.actual_gross != null ? String(dbRow.actual_gross) : "");
  const [taxWithheld, setTaxWithheld] = useState(
    dbRow?.tax_withheld != null ? String(dbRow.tax_withheld) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matched = dbRow?.variance_pct != null ? Math.abs(dbRow.variance_pct) <= 1 : null;

  async function saveActual() {
    if (!accountId || !actualGross) return;
    setSaving(true);
    setError(null);
    const gross = Number(actualGross);
    const tax = taxWithheld ? Number(taxWithheld) : 0;
    const payload = {
      account_id: accountId,
      period_start: toDateKey(period.start),
      period_end: toDateKey(period.end),
      estimated_gross: estimated,
      actual_gross: gross,
      tax_withheld: tax,
      actual_net: gross - tax,
      recorded_at: new Date().toISOString(),
    };
    const { error } = dbRow
      ? await supabase.from("interest_periods").update(payload).eq("id", dbRow.id)
      : await supabase.from("interest_periods").insert(payload);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setRecording(false);
    onSaved();
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardLabel>
          {formatThaiDate(period.start)} – {formatThaiDate(period.end)}
        </CardLabel>
        {isOpen ? (
          <Badge tone="neutral">รอบปัจจุบัน</Badge>
        ) : matched == null ? (
          <Badge tone="neutral">รอบันทึก</Badge>
        ) : matched ? (
          <Badge tone="growth">ตรง</Badge>
        ) : (
          <Badge tone="alert">ไม่ตรง {dbRow?.variance_pct?.toFixed(1)}%</Badge>
        )}
      </div>
      <div className="tabular mt-2 flex items-center justify-between text-sm">
        <span className="text-ink-muted">ระบบประเมิน</span>
        <span className="font-semibold text-ink">฿{formatBaht(estimated)}</span>
      </div>
      {taxEnabled && (
        <div className="tabular flex items-center justify-between text-xs text-ink-faint">
          <span>สุทธิโดยประมาณ (หัก 15%)</span>
          <span>฿{formatBaht(estimated * (1 - TAX_RATE))}</span>
        </div>
      )}
      <div className="tabular mt-1 flex items-center justify-between text-sm">
        <span className="text-ink-muted">ธนาคารจ่ายจริง</span>
        <span className="font-semibold text-ink">
          {dbRow?.actual_gross != null ? `฿${formatBaht(dbRow.actual_gross)}` : "—"}
        </span>
      </div>
      {taxEnabled && dbRow?.actual_net != null && (
        <div className="tabular flex items-center justify-between text-xs text-ink-faint">
          <span>สุทธิหลังหักภาษี</span>
          <span>฿{formatBaht(dbRow.actual_net)}</span>
        </div>
      )}

      {isAdmin && !isOpen && (
        <div className="mt-3 border-t border-line pt-3">
          {recording ? (
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-xs font-medium text-ink-muted">ดอกเบี้ยจริงที่ได้รับ (บาท)</label>
                <Input
                  className="mt-1"
                  inputMode="decimal"
                  value={actualGross}
                  onChange={(e) => setActualGross(e.target.value)}
                />
              </div>
              {taxEnabled && (
                <div>
                  <label className="text-xs font-medium text-ink-muted">ภาษีที่ถูกหัก (บาท)</label>
                  <Input
                    className="mt-1"
                    inputMode="decimal"
                    value={taxWithheld}
                    onChange={(e) => setTaxWithheld(e.target.value)}
                  />
                </div>
              )}
              {error && <p className="text-xs text-alert-600">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setRecording(false)}>
                  ยกเลิก
                </Button>
                <Button size="sm" className="flex-1" disabled={saving || !actualGross} onClick={saveActual}>
                  บันทึก
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setRecording(true)}>
              {dbRow?.actual_gross != null ? "แก้ไขยอดจริง" : "บันทึกดอกเบี้ยจริง"}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
