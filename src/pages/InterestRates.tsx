import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatBaht, formatThaiDate } from "@/lib/utils";
import { useAccount } from "@/lib/useAccount";
import { useInterestRateTiers } from "@/lib/useInterestRateTiers";
import { supabase } from "@/lib/supabase";

export function InterestRates() {
  const { account } = useAccount();
  const { tiers, loading, refetch } = useInterestRateTiers(account?.id);
  const [showForm, setShowForm] = useState(false);

  const groups = new Map<string, typeof tiers>();
  for (const t of tiers) {
    const key = t.effective_from;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  async function deleteTier(id: string) {
    if (!confirm("ลบขั้นบันไดอัตรานี้?")) return;
    const { error } = await supabase.from("interest_rate_tiers").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    refetch();
  }

  return (
    <MobileShell title="อัตราดอกเบี้ย" hideFab>
      <div className="flex flex-col gap-4">
        <div className="rounded-[var(--radius-control)] bg-caution-50 px-3.5 py-2.5 text-xs text-caution-600">
          คัดลอกตัวเลขจากประกาศอัตราดอกเบี้ยของธนาคารจริงเท่านั้น (savings-tracker-spec.md ข้อ 6.2)
          ห้ามเดาหรือใช้ตัวเลขตัวอย่าง
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-ink-muted">กำลังโหลด...</p>
        ) : groups.size === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">ยังไม่ได้ตั้งค่าอัตราดอกเบี้ย</p>
        ) : (
          [...groups.entries()].map(([effectiveFrom, rows]) => (
            <Card key={effectiveFrom}>
              <CardLabel>มีผลตั้งแต่ {formatThaiDate(new Date(effectiveFrom))}</CardLabel>
              <div className="mt-2 flex flex-col gap-1.5">
                {rows.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink">
                      {formatBaht(t.min_balance)} –{" "}
                      {t.max_balance != null ? formatBaht(t.max_balance) : "ขึ้นไป"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="tabular font-semibold text-growth-600">
                        {(t.annual_rate * 100).toFixed(2)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteTier(t.id)}
                        className="text-ink-faint hover:text-alert-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {rows[0]?.source_note && (
                <p className="mt-2 text-xs text-ink-faint">อ้างอิง: {rows[0].source_note}</p>
              )}
            </Card>
          ))
        )}

        {showForm ? (
          <NewTierForm
            accountId={account?.id}
            nextTierOrder={
              (tiers.filter((t) => t.effective_from === tiers[0]?.effective_from).length || 0) + 1
            }
            onCreated={() => {
              refetch();
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <Button variant="outline" size="lg" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> เพิ่มขั้นบันไดอัตราใหม่
          </Button>
        )}
      </div>
    </MobileShell>
  );
}

function NewTierForm({
  accountId,
  nextTierOrder,
  onCreated,
  onCancel,
}: {
  accountId: string | undefined;
  nextTierOrder: number;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [tierOrder, setTierOrder] = useState(String(nextTierOrder));
  const [minBalance, setMinBalance] = useState("0");
  const [maxBalance, setMaxBalance] = useState("");
  const [annualRatePct, setAnnualRatePct] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId || !annualRatePct) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("interest_rate_tiers").insert({
      account_id: accountId,
      effective_from: effectiveFrom,
      tier_order: Number(tierOrder),
      min_balance: Number(minBalance),
      max_balance: maxBalance ? Number(maxBalance) : null,
      annual_rate: Number(annualRatePct) / 100,
      source_note: sourceNote || null,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMinBalance(maxBalance || "0");
    setMaxBalance("");
    setAnnualRatePct("");
    setTierOrder(String(Number(tierOrder) + 1));
    onCreated();
  }

  return (
    <Card>
      <CardLabel>เพิ่มขั้นบันไดอัตรา</CardLabel>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-ink">มีผลตั้งแต่วันที่</label>
          <Input
            type="date"
            className="mt-1"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-ink">ยอดขั้นต่ำ (บาท)</label>
            <Input
              className="mt-1"
              inputMode="decimal"
              value={minBalance}
              onChange={(e) => setMinBalance(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">ยอดสูงสุด (เว้นว่าง = ไม่จำกัด)</label>
            <Input
              className="mt-1"
              inputMode="decimal"
              value={maxBalance}
              onChange={(e) => setMaxBalance(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-ink">อัตราดอกเบี้ยต่อปี (%)</label>
          <Input
            className="mt-1"
            inputMode="decimal"
            placeholder="1.55"
            value={annualRatePct}
            onChange={(e) => setAnnualRatePct(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">อ้างอิงประกาศ (ไม่บังคับ)</label>
          <Input
            className="mt-1"
            placeholder="ประกาศ KKP ที่ ..."
            value={sourceNote}
            onChange={(e) => setSourceNote(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-alert-600">{error}</p>}
        <div className="mt-2 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            ปิด
          </Button>
          <Button type="submit" className="flex-1" disabled={saving || !accountId}>
            {saving ? "กำลังบันทึก..." : "เพิ่มขั้นนี้"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
