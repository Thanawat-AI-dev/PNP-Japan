import { Download, TriangleAlert } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatBaht, formatThaiDate } from "@/lib/utils";
import { useAccount } from "@/lib/useAccount";
import { useTransactions } from "@/lib/useTransactions";

const typeLabel: Record<string, string> = {
  deposit: "ฝากเงิน",
  withdrawal: "ถอนเงิน",
  interest: "ดอกเบี้ย",
  adjustment: "ปรับปรุง",
};

function downloadCsv(
  transactions: { type: string; amount_cents: number; occurred_at: string; note: string | null }[],
) {
  const header = "type,amount,occurred_at,note";
  const rows = transactions.map((t) =>
    [typeLabel[t.type], (t.amount_cents / 100).toFixed(2), t.occurred_at, t.note ?? ""]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `savetogether-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function History() {
  const { account } = useAccount();
  const { transactions, loading } = useTransactions(account?.id);

  return (
    <MobileShell title="ประวัติรายการ">
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={transactions.length === 0}
          onClick={() => downloadCsv(transactions)}
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-ink-muted">กำลังโหลด...</p>
      ) : transactions.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-muted">ยังไม่มีรายการ</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {transactions.map((t) => (
            <Card key={t.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-ink">{typeLabel[t.type]}</p>
                <p className="text-xs text-ink-muted">
                  {formatThaiDate(new Date(t.occurred_at))}
                  {t.note ? ` · ${t.note}` : ""}
                </p>
                {t.needs_review && (
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
                {t.type === "withdrawal" ? "-" : "+"}฿{formatBaht(t.amount_cents / 100)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </MobileShell>
  );
}
