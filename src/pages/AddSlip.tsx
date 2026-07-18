import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { confidenceTier } from "@/lib/slipParser/confidence";
import type { SlipParseResult } from "@/lib/slipParser/types";
import { toDatetimeLocalValue } from "@/lib/utils";
import { useAccount } from "@/lib/useAccount";
import { useProfile } from "@/lib/useProfile";
import { supabase } from "@/lib/supabase";
import { saveSlipTransaction, DuplicateSlipError } from "@/lib/saveSlipTransaction";
import type { TransactionType } from "@/lib/transactions";

type Mode = "slip" | "manual";

export function AddSlip() {
  const [mode, setMode] = useState<Mode>("slip");
  const { isAdmin } = useProfile();

  return (
    <MobileShell title="เพิ่มรายการ" hideFab>
      {isAdmin && (
        <div className="mb-4 flex rounded-[var(--radius-control)] bg-surface-sunken p-1">
          <button
            type="button"
            onClick={() => setMode("slip")}
            className={`flex-1 rounded-[calc(var(--radius-control)-4px)] py-2 text-sm font-medium transition-colors ${
              mode === "slip" ? "bg-surface text-ink shadow-sm" : "text-ink-muted"
            }`}
          >
            แนบสลิป
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex-1 rounded-[calc(var(--radius-control)-4px)] py-2 text-sm font-medium transition-colors ${
              mode === "manual" ? "bg-surface text-ink shadow-sm" : "text-ink-muted"
            }`}
          >
            กรอกเอง
          </button>
        </div>
      )}

      {mode === "slip" || !isAdmin ? <SlipForm /> : <ManualForm isAdmin={isAdmin} />}
    </MobileShell>
  );
}

function SlipForm() {
  const navigate = useNavigate();
  const { account } = useAccount();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SlipParseResult | null>(null);
  const [amount, setAmount] = useState("");
  const [datetimeInput, setDatetimeInput] = useState("");
  const [savedWarning, setSavedWarning] = useState<string | null>(null);

  async function handleFile(f: File | null) {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setParsing(true);
    try {
      // Loaded on demand so the OCR engine (tesseract.js + jsqr, the single
      // largest dependency) never ships in the initial bundle - it only
      // downloads the first time someone actually parses a slip.
      const { localOcrParser } = await import("@/lib/slipParser/localOcrParser");
      const parsed = await localOcrParser.parse(f);
      setResult(parsed);
      setAmount(parsed.amount != null ? String(parsed.amount) : "");
      setDatetimeInput(toDatetimeLocalValue(parsed.datetime ?? new Date()));
    } catch (err) {
      console.error(err);
      setError("อ่านสลิปไม่สำเร็จ กรุณากรอกจำนวนเงินและวันที่เอง");
      setDatetimeInput(toDatetimeLocalValue(new Date()));
      setResult({
        amount: null,
        datetime: null,
        reference: null,
        referenceSource: null,
        receiverName: null,
        senderName: null,
        confidence: 0,
        verified: false,
        rawText: "",
        slipHash: "",
      });
    } finally {
      setParsing(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    setAmount("");
  }

  async function handleConfirm() {
    if (!account || !file || !result) return;
    setSaving(true);
    setError(null);
    try {
      const { warning } = await saveSlipTransaction({
        accountId: account.id,
        file,
        amount: Number(amount),
        datetime: datetimeInput ? new Date(datetimeInput) : null,
        parsed: result,
      });
      if (warning) {
        setSaving(false);
        setSavedWarning(warning);
        return;
      }
      navigate("/");
    } catch (err) {
      setSaving(false);
      if (err instanceof DuplicateSlipError) {
        setError(err.message);
        return;
      }
      console.error(err);
      setError("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  const tier = result ? confidenceTier(result.confidence) : null;
  const confidenceTone = tier === "auto" ? "growth" : tier === "review" ? "caution" : "alert";

  if (savedWarning) {
    return (
      <Card className="flex flex-col items-center gap-3 text-center">
        <p className="font-semibold text-ink">บันทึกแล้ว</p>
        <p className="text-sm text-caution-600">{savedWarning}</p>
        <Button size="lg" className="w-full" onClick={() => navigate("/")}>
          ไปหน้าแรก
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!file ? (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-line-strong bg-surface-sunken px-6 py-14 text-center">
          <ImagePlus className="h-8 w-8 text-ink-faint" />
          <span className="font-semibold text-ink">ลากรูปสลิปมาวาง หรือแตะเพื่อเลือก</span>
          <span className="text-sm text-ink-muted">รองรับ JPG, PNG จากแอปธนาคาร</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
      ) : (
        <>
          <Card className="flex items-center justify-between p-3">
            <span className="truncate text-sm text-ink-muted">{file.name}</span>
            <button
              type="button"
              onClick={reset}
              className="rounded-full p-1.5 text-ink-faint hover:bg-surface-sunken"
            >
              <X className="h-4 w-4" />
            </button>
          </Card>

          {parsing && (
            <Card className="flex items-center justify-center gap-2 py-8 text-ink-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              กำลังอ่านสลิป...
            </Card>
          )}

          {!parsing && result && (
            <>
              {error && (
                <div className="rounded-[var(--radius-control)] bg-alert-50 px-3.5 py-2.5 text-sm font-medium text-alert-600">
                  {error}
                </div>
              )}

              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <CardLabel>ระบบอ่านได้</CardLabel>
                  <Badge tone={confidenceTone}>ความมั่นใจ {Math.round(result.confidence * 100)}%</Badge>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-sm font-medium text-ink">จำนวนเงิน (บาท)</label>
                    <Input
                      className={
                        tier === "review" && result.amount == null ? "mt-1 border-caution-400" : "mt-1"
                      }
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      inputMode="decimal"
                      placeholder={result.amount == null ? "ไม่พบ กรอกเอง" : undefined}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-ink">วันที่และเวลา</label>
                    <Input
                      type="datetime-local"
                      className={result.datetime == null ? "mt-1 border-caution-400" : "mt-1"}
                      value={datetimeInput}
                      onChange={(e) => setDatetimeInput(e.target.value)}
                    />
                    {result.datetime == null && (
                      <p className="mt-1 text-xs text-caution-600">
                        ไม่พบวันที่บนสลิป — ตรวจสอบและแก้ไขให้ตรงก่อนยืนยัน
                      </p>
                    )}
                  </div>
                  <div className="rounded-[var(--radius-control)] bg-surface-sunken px-3 py-2 text-sm text-ink-muted">
                    {result.referenceSource === "qr" && "อ่าน QR สำเร็จ (กันรายการซ้ำ)"}
                    {result.referenceSource === "ocr" && `รหัสอ้างอิง ${result.reference}`}
                    {result.referenceSource == null && "ไม่พบ QR หรือรหัสอ้างอิง"}
                  </div>
                </div>
              </Card>

              <Button
                size="lg"
                disabled={!amount || !datetimeInput || !account || saving}
                onClick={handleConfirm}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยัน"}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function ManualForm({ isAdmin }: { isAdmin: boolean }) {
  const navigate = useNavigate();
  const { account } = useAccount();
  const [type, setType] = useState<TransactionType>("deposit");
  const [amount, setAmount] = useState("");
  const [datetimeInput, setDatetimeInput] = useState(toDatetimeLocalValue(new Date()));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account || !amount) return;
    setSaving(true);
    setError(null);
    const { data: session } = await supabase.auth.getSession();
    const { error } = await supabase.from("transactions").insert({
      account_id: account.id,
      type,
      amount_cents: Math.round(Number(amount) * 100),
      occurred_at: new Date(datetimeInput).toISOString(),
      note: note || null,
      created_by: session.session?.user.id,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate("/");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-ink">ประเภทรายการ</label>
          <select
            className="mt-1 h-12 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 text-[15px] text-ink"
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
          >
            <option value="deposit">ฝากเงิน</option>
            {isAdmin && (
              <>
                <option value="withdrawal">ถอนเงิน</option>
                <option value="interest">ดอกเบี้ย</option>
                <option value="adjustment">ปรับปรุงยอด (เช่น ยอดตั้งต้น)</option>
              </>
            )}
          </select>
          {!isAdmin && (
            <p className="mt-1 text-xs text-ink-faint">
              ถอนเงิน/ดอกเบี้ย/ปรับปรุงยอด บันทึกได้เฉพาะ Admin
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-ink">จำนวนเงิน (บาท)</label>
          <Input
            className="mt-1"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
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
          <label className="text-sm font-medium text-ink">หมายเหตุ (ไม่บังคับ)</label>
          <Input className="mt-1" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </Card>

      {error && (
        <div className="rounded-[var(--radius-control)] bg-alert-50 px-3.5 py-2.5 text-sm font-medium text-alert-600">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" disabled={!amount || !account || saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "บันทึก"}
      </Button>
    </form>
  );
}
