import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatBaht, formatThaiDate } from "@/lib/utils";
import { useAccount } from "@/lib/useAccount";
import { useInterestPeriods } from "@/lib/useInterestPeriods";

export function Interest() {
  const { account } = useAccount();
  const { periods, loading } = useInterestPeriods(account?.id);

  return (
    <MobileShell title="ดอกเบี้ย" hideFab>
      {loading ? (
        <p className="py-12 text-center text-sm text-ink-muted">กำลังโหลด...</p>
      ) : periods.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-muted">
          ยังไม่มีรอบดอกเบี้ย — จะขึ้นเองเมื่อถึงรอบจ่ายดอกเบี้ยของธนาคาร
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {periods.map((p) => {
            const matched =
              p.variance_pct != null ? Math.abs(p.variance_pct) <= 1 : null;
            return (
              <Card key={p.id}>
                <div className="flex items-center justify-between">
                  <CardLabel>
                    {formatThaiDate(new Date(p.period_start))} –{" "}
                    {formatThaiDate(new Date(p.period_end))}
                  </CardLabel>
                  {matched == null ? (
                    <Badge tone="neutral">รอบันทึก</Badge>
                  ) : matched ? (
                    <Badge tone="growth">ตรง</Badge>
                  ) : (
                    <Badge tone="alert">ไม่ตรง {p.variance_pct?.toFixed(1)}%</Badge>
                  )}
                </div>
                <div className="tabular mt-2 flex items-center justify-between text-sm">
                  <span className="text-ink-muted">ระบบประเมิน</span>
                  <span className="font-semibold text-ink">
                    {p.estimated_gross != null ? `฿${formatBaht(p.estimated_gross)}` : "—"}
                  </span>
                </div>
                <div className="tabular mt-1 flex items-center justify-between text-sm">
                  <span className="text-ink-muted">ธนาคารจ่ายจริง</span>
                  <span className="font-semibold text-ink">
                    {p.actual_gross != null ? `฿${formatBaht(p.actual_gross)}` : "—"}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </MobileShell>
  );
}
