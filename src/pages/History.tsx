import { Download, TriangleAlert } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatBaht, formatThaiDate } from "@/lib/utils";
import { transactions } from "@/lib/mockData";

const typeLabel: Record<string, string> = {
  deposit: "ฝากเงิน",
  withdrawal: "ถอนเงิน",
  interest: "ดอกเบี้ย",
  adjustment: "ปรับปรุง",
};

export function History() {
  return (
    <MobileShell title="ประวัติรายการ">
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        {transactions.map((t) => (
          <Card key={t.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-ink">{typeLabel[t.type]}</p>
              <p className="text-xs text-ink-muted">
                {formatThaiDate(new Date(t.occurredAt))}
                {t.note ? ` · ${t.note}` : ""}
              </p>
              {t.needsReview && (
                <Badge tone="caution" className="mt-1.5">
                  <TriangleAlert className="h-3 w-3" /> รอตรวจสอบ
                </Badge>
              )}
            </div>
            <p
              className={`tabular text-base font-bold ${
                t.type === "withdrawal" ? "text-ink" : "text-growth-600"
              }`}
            >
              +฿{formatBaht(t.amount)}
            </p>
          </Card>
        ))}
      </div>
    </MobileShell>
  );
}
