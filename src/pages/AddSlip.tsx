import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { localOcrParser } from "@/lib/slipParser/localOcrParser";
import { confidenceTier } from "@/lib/slipParser/confidence";
import type { SlipParseResult } from "@/lib/slipParser/types";
import { formatThaiDate } from "@/lib/utils";

export function AddSlip() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SlipParseResult | null>(null);
  const [amount, setAmount] = useState("");

  async function handleFile(f: File | null) {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setParsing(true);
    try {
      const parsed = await localOcrParser.parse(f);
      setResult(parsed);
      setAmount(parsed.amount != null ? String(parsed.amount) : "");
    } catch (err) {
      console.error(err);
      setError("อ่านสลิปไม่สำเร็จ กรุณากรอกจำนวนเงินและวันที่เอง");
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

  const tier = result ? confidenceTier(result.confidence) : null;
  const confidenceTone = tier === "auto" ? "growth" : tier === "review" ? "caution" : "alert";

  return (
    <MobileShell title="แนบสลิป" hideFab>
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
                    <Badge tone={confidenceTone}>
                      ความมั่นใจ {Math.round(result.confidence * 100)}%
                    </Badge>
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
                    <div className="rounded-[var(--radius-control)] bg-surface-sunken px-3 py-2 text-sm text-ink-muted">
                      {result.datetime ? formatThaiDate(result.datetime) : "ไม่พบวันที่ — กรอกเอง"}
                      {result.referenceSource === "qr" && " · อ่าน QR สำเร็จ (กันรายการซ้ำ)"}
                      {result.referenceSource === "ocr" && ` · รหัสอ้างอิง ${result.reference}`}
                      {result.referenceSource == null && " · ไม่พบ QR หรือรหัสอ้างอิง"}
                    </div>
                  </div>
                </Card>

                <Button size="lg" disabled={!amount} onClick={() => navigate("/")}>
                  ยืนยัน
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </MobileShell>
  );
}
