import { useState, useEffect } from "react";
import { TriangleAlert, Ban, Check, X } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatBaht, formatThaiDate, toDatetimeLocalValue } from "@/lib/utils";
import { useAccount } from "@/lib/useAccount";
import { useTransactions } from "@/lib/useTransactions";
import { supabase } from "@/lib/supabase";
import type { Transaction, TransactionType } from "@/lib/transactions";

const typeLabel: Record<string, string> = {
  deposit: "ฝากเงิน",
  withdrawal: "ถอนเงิน",
  interest: "ดอกเบี้ย",
  adjustment: "ปรับปรุง",
};

export function Admin() {
  const { account } = useAccount();
  const { transactions, loading, refetch } = useTransactions(account?.id);

  const needsReview = transactions.filter((t) => t.needs_review);
  const cancelRequests = transactions.filter((t) => t.cancel_requested);

  return (
    <MobileShell title="ตรวจสอบรายการ" hideFab>
      {loading ? (
        <p className="py-12 text-center text-sm text-ink-muted">กำลังโหลด...</p>
      ) : needsReview.length === 0 && cancelRequests.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-muted">ไม่มีรายการที่ต้องตรวจสอบ</p>
      ) : (
        <div className="flex flex-col gap-6">
          {cancelRequests.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-alert-600">
                <Ban className="h-4 w-4" /> คำขอยกเลิกรายการ ({cancelRequests.length})
              </h2>
              <div className="flex flex-col gap-2.5">
                {cancelRequests.map((t) => (
                  <CancelRequestRow key={t.id} transaction={t} onChanged={refetch} />
                ))}
              </div>
            </section>
          )}

          {needsReview.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-caution-600">
                <TriangleAlert className="h-4 w-4" /> รอตรวจสอบ ({needsReview.length})
              </h2>
              <div className="flex flex-col gap-2.5">
                {needsReview.map((t) => (
                  <ReviewRow key={t.id} transaction={t} onChanged={refetch} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </MobileShell>
  );
}

function SlipThumbnail({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    supabase.storage
      .from("slips")
      .createSignedUrl(path, 60)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error(error);
          return;
        }
        setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) return null;
  if (!url) return <p className="mt-2 text-xs text-ink-faint">กำลังโหลดรูปสลิป...</p>;

  return (
    <a href={url} target="_blank" rel="noreferrer" className="mt-2 block">
      <img
        src={url}
        alt="สลิป"
        className="max-h-56 w-full rounded-[var(--radius-control)] border border-line object-contain"
      />
    </a>
  );
}

function CancelRequestRow({ transaction: t, onChanged }: { transaction: Transaction; onChanged: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    if (!confirm("ยืนยันลบรายการนี้ทิ้งถาวร?")) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("transactions").delete().eq("id", t.id);
    setSaving(false);
    if (error) return setError(error.message);
    onChanged();
  }

  async function deny() {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("transactions")
      .update({ cancel_requested: false })
      .eq("id", t.id);
    setSaving(false);
    if (error) return setError(error.message);
    onChanged();
  }

  return (
    <Card className="p-4">
      <p className="font-semibold text-ink">{typeLabel[t.type]}</p>
      <p className="tabular text-sm text-ink-muted">
        ฿{formatBaht(t.amount_cents / 100)} · {formatThaiDate(new Date(t.occurred_at))}
        {t.note ? ` · ${t.note}` : ""}
      </p>
      <SlipThumbnail path={t.slip_path} />
      {error && <p className="mt-1 text-xs text-alert-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" disabled={saving} onClick={deny} className="flex-1">
          <X className="h-3.5 w-3.5" /> ปฏิเสธคำขอ
        </Button>
        <Button size="sm" disabled={saving} onClick={approve} className="flex-1">
          <Check className="h-3.5 w-3.5" /> อนุมัติ (ลบรายการ)
        </Button>
      </div>
    </Card>
  );
}

function ReviewRow({ transaction: t, onChanged }: { transaction: Transaction; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<TransactionType>(t.type);
  const [amount, setAmount] = useState(String(t.amount_cents / 100));
  const [datetimeInput, setDatetimeInput] = useState(toDatetimeLocalValue(new Date(t.occurred_at)));
  const [note, setNote] = useState(t.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveEdit(clearFlag: boolean) {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("transactions")
      .update({
        type,
        amount_cents: Math.round(Number(amount) * 100),
        occurred_at: new Date(datetimeInput).toISOString(),
        note: note || null,
        needs_review: !clearFlag,
      })
      .eq("id", t.id);
    setSaving(false);
    if (error) return setError(error.message);
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
            <Button className="flex-1" disabled={saving} onClick={() => saveEdit(false)}>
              บันทึก
            </Button>
          </div>
          <Button variant="secondary" disabled={saving} onClick={() => saveEdit(true)}>
            <Check className="h-4 w-4" /> บันทึกและถือว่าตรวจสอบแล้ว
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-ink">{typeLabel[t.type]}</p>
          <p className="tabular text-sm text-ink-muted">
            ฿{formatBaht(t.amount_cents / 100)} · {formatThaiDate(new Date(t.occurred_at))}
          </p>
          {t.note && <p className="text-xs text-ink-muted">{t.note}</p>}
        </div>
        <Badge tone="caution">รอตรวจสอบ</Badge>
      </div>
      <SlipThumbnail path={t.slip_path} />
      {error && <p className="mt-1 text-xs text-alert-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="flex-1">
          แก้ไข
        </Button>
        <Button size="sm" disabled={saving} onClick={() => saveEdit(true)} className="flex-1">
          <Check className="h-3.5 w-3.5" /> ตรวจสอบแล้ว
        </Button>
      </div>
    </Card>
  );
}
