import { MobileShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui/Card";
import { formatThaiDate } from "@/lib/utils";

const entries = [
  {
    id: 1,
    actor: "แนน",
    action: "สร้างรายการ",
    entity: "ฝากเงิน ฿8,500",
    at: "2026-07-18T14:32:00+07:00",
  },
  {
    id: 2,
    actor: "Admin",
    action: "แก้ไขอัตราดอกเบี้ย",
    entity: "ขั้นบันไดใหม่ มีผล 1 ก.พ. 2569",
    at: "2026-06-30T10:05:00+07:00",
  },
];

export function AuditLog() {
  return (
    <MobileShell title="Audit Log" hideFab>
      <div className="flex flex-col gap-2.5">
        {entries.map((e) => (
          <Card key={e.id} className="p-4">
            <p className="text-sm font-semibold text-ink">
              {e.actor} · {e.action}
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">{e.entity}</p>
            <p className="mt-1 text-xs text-ink-faint">{formatThaiDate(new Date(e.at))}</p>
          </Card>
        ))}
      </div>
    </MobileShell>
  );
}
