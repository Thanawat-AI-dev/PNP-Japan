import { MobileShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui/Card";
import { formatThaiDate } from "@/lib/utils";
import { useAuditLog } from "@/lib/useAuditLog";

const actionLabel: Record<string, string> = {
  create: "สร้างรายการ",
  update: "แก้ไขรายการ",
  delete: "ลบรายการ",
  login: "เข้าสู่ระบบ",
};

export function AuditLog() {
  const { entries, loading } = useAuditLog();

  return (
    <MobileShell title="Audit Log" hideFab>
      {loading ? (
        <p className="py-12 text-center text-sm text-ink-muted">กำลังโหลด...</p>
      ) : entries.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-muted">ยังไม่มีประวัติการเปลี่ยนแปลง</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {entries.map((e) => (
            <Card key={e.id} className="p-4">
              <p className="text-sm font-semibold text-ink">
                {e.actor?.display_name ?? "ไม่ทราบผู้ใช้"} · {actionLabel[e.action] ?? e.action}
              </p>
              <p className="mt-0.5 text-sm text-ink-muted">{e.entity}</p>
              <p className="mt-1 text-xs text-ink-faint">{formatThaiDate(new Date(e.created_at))}</p>
            </Card>
          ))}
        </div>
      )}
    </MobileShell>
  );
}
