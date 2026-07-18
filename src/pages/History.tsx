import { useState } from "react";
import { Download, TriangleAlert, Pencil, Ban } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatBaht, formatThaiDate, toDatetimeLocalValue } from "@/lib/utils";
import { useAccount } from "@/lib/useAccount";
import { useTransactions } from "@/lib/useTransactions";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/useProfile";
import { supabase } from "@/lib/supabase";
import type { Transaction, TransactionType } from "@/lib/transactions";

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
  const rows = transactions.map((t) => {
    // Signed so the amount column sums to the real balance, matching the
    // same convention as computeBalance (withdrawals subtract).
    const signedAmount = (t.type === "withdrawal" ? -t.amount_cents : t.amount_cents) / 100;
    return [typeLabel[t.type], signedAmount.toFixed(2), t.occurred_at, t.note ?? ""]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",");
  });
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
  const { transactions, loading, refetch } = useTransactions(account?.id);
  const { session } = useAuth();
  const { isAdmin } = useProfile();

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
            <TransactionRow
              key={t.id}
              transaction={t}
              isAdmin={isAdmin}
              myId={session?.user.id}
              onChanged={refetch}
            />
          ))}
        </div>
      )}
    </MobileShell>
  );
}

function TransactionRow({
  transaction: t,
  isAdmin,
  myId,
  onChanged,
}: {
  transaction: Transaction;
  isAdmin: boolean;
  myId: string | undefined;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<TransactionType>(t.type);
  const [amount, setAmount] = useState(String(t.amount_cents / 100));
  const [datetimeInput, setDatetimeInput] = useState(toDatetimeLocalValue(new Date(t.occurred_at)));
  const [note, setNote] = useState(t.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwn = t.created_by === myId;
  // Admin can always edit. A friend can only shape a transaction before
  // confirming it (in the add-slip flow itself) - once it's saved, their
  // only option is requesting cancellation, never a direct edit.
  const canEdit = isAdmin;
  const canRequestCancel = !isAdmin && isOwn && !t.cancel_requested;

  async function saveEdit() {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("transactions")
      .update({
        type,
        amount_cents: Math.round(Number(amount) * 100),
        occurred_at: new Date(datetimeInput).toISOString(),
        note: note || null,
      })
      .eq("id", t.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditing(false);
    onChanged();
  }

  async function requestCancel() {
    if (!confirm("ขอยกเลิกรายการนี้? Admin จะเห็นคำขอและตรวจสอบ")) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("transactions")
      .update({ cancel_requested: true })
      .eq("id", t.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onChanged();
  }

  if (editing) {
    return (
      <Card>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium text-ink">ประเภท</label>
            <select
              className="mt-1 h-12 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 text-[15px] text-ink"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
            >
              <option value="deposit">ฝากเงิน</option>
              <option value="withdrawal">ถอนเงิน</option>
              <option value="interest">ดอกเบี้ย</option>
              <option value="adjustment">ปรับปรุง</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-ink">จำนวนเงิน (บาท)</label>
            <Input
              className="mt-1"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">วันที่และเวลา</label>
            <Input
              type="datetime-local"
              className="mt-1"
              value={datetimeInput}
              onChange={(e) => setDatetimeInput(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">หมายเหตุ</label>
            <Input className="mt-1" value={note} onChange={(e) => setNote(e.target.value)} />
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
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-ink">{typeLabel[t.type]}</p>
          <p className="text-xs text-ink-muted">
            {formatThaiDate(new Date(t.occurred_at))}
            {t.note ? ` · ${t.note}` : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {t.needs_review && (
              <Badge tone="caution">
                <TriangleAlert className="h-3 w-3" /> รอตรวจสอบ
              </Badge>
            )}
            {t.cancel_requested && (
              <Badge tone="alert">
                <Ban className="h-3 w-3" /> รอ Admin อนุมัติยกเลิก
              </Badge>
            )}
          </div>
        </div>
        <p
          className={`tabular text-base font-bold ${
            t.type === "withdrawal" ? "text-alert-600" : "text-growth-600"
          }`}
        >
          {t.type === "withdrawal" ? "-" : "+"}฿{formatBaht(t.amount_cents / 100)}
        </p>
      </div>

      {(canEdit || canRequestCancel) && (
        <div className="mt-3 flex gap-2 border-t border-line pt-3">
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> แก้ไข
            </Button>
          )}
          {canRequestCancel && (
            <Button variant="outline" size="sm" disabled={saving} onClick={requestCancel}>
              <Ban className="h-3.5 w-3.5" /> ขอยกเลิก
            </Button>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-alert-600">{error}</p>}
    </Card>
  );
}
