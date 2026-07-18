import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatBaht } from "@/lib/utils";

const periods = [
  { range: "ม.ค.–มิ.ย. 2569", estimated: 2845.3, actual: 2845.28, status: "matched" as const },
  { range: "ก.ค.–ธ.ค. 2569", estimated: 3102.55, actual: null, status: "pending" as const },
];

export function Interest() {
  return (
    <MobileShell title="ดอกเบี้ย" hideFab>
      <div className="flex flex-col gap-3">
        {periods.map((p) => (
          <Card key={p.range}>
            <div className="flex items-center justify-between">
              <CardLabel>{p.range}</CardLabel>
              {p.status === "matched" ? (
                <Badge tone="growth">ตรง</Badge>
              ) : (
                <Badge tone="neutral">รอบันทึก</Badge>
              )}
            </div>
            <div className="tabular mt-2 flex items-center justify-between text-sm">
              <span className="text-ink-muted">ระบบประเมิน</span>
              <span className="font-semibold text-ink">฿{formatBaht(p.estimated)}</span>
            </div>
            <div className="tabular mt-1 flex items-center justify-between text-sm">
              <span className="text-ink-muted">ธนาคารจ่ายจริง</span>
              <span className="font-semibold text-ink">
                {p.actual != null ? `฿${formatBaht(p.actual)}` : "—"}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </MobileShell>
  );
}
