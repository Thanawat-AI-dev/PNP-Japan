import { supabase } from "@/lib/supabase";
import { compressToWebp } from "@/lib/slipParser/compress";
import type { SlipParseResult } from "@/lib/slipParser/types";

export class DuplicateSlipError extends Error {}

interface SaveSlipInput {
  accountId: string;
  file: File;
  amount: number;
  datetime: Date | null;
  parsed: SlipParseResult;
}

/**
 * Persists a confirmed slip as a deposit transaction, per spec section 5
 * steps 4 ("ป้องกันสลิปซ้ำ") and the storage convention in section 5
 * "เก็บไฟล์สลิป": WebP q80, uploaded to `<account_id>/<file>` in the private
 * `slips` bucket, matching the storage RLS policy's folder-based check.
 *
 * Duplicate detection: only the slip-hash check (layer 2) runs client-side
 * up front, since it's a plain equality lookup. The reference-code check
 * (layer 1) is enforced by the `transactions.bank_reference` unique
 * constraint at insert time instead of a separate pre-check, to avoid a
 * race between two people confirming near-identical slips at once. Layer 3
 * (amount + time proximity) only warns per spec, so it's surfaced to the
 * caller as a non-fatal `warning` rather than blocking the insert.
 */
export async function saveSlipTransaction({
  accountId,
  file,
  amount,
  datetime,
  parsed,
}: SaveSlipInput): Promise<{ warning: string | null }> {
  const { data: byHash } = await supabase
    .from("transactions")
    .select("id, occurred_at")
    .eq("account_id", accountId)
    .eq("slip_hash", parsed.slipHash)
    .maybeSingle();
  if (byHash) {
    throw new DuplicateSlipError("สลิปรูปนี้เคยถูกบันทึกแล้ว");
  }

  const occurredAt = datetime ?? new Date();
  let warning: string | null = null;
  if (occurredAt) {
    const windowStart = new Date(occurredAt.getTime() - 2 * 60_000).toISOString();
    const windowEnd = new Date(occurredAt.getTime() + 2 * 60_000).toISOString();
    const { data: similar } = await supabase
      .from("transactions")
      .select("id")
      .eq("account_id", accountId)
      .eq("type", "deposit")
      .eq("amount_cents", Math.round(amount * 100))
      .gte("occurred_at", windowStart)
      .lte("occurred_at", windowEnd)
      .limit(1);
    if (similar && similar.length > 0) {
      warning = "มีรายการยอดและเวลาใกล้เคียงกันที่บันทึกไว้แล้ว - ตรวจสอบว่าไม่ใช่รายการซ้ำ";
    }
  }

  const webp = await compressToWebp(file);
  const path = `${accountId}/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage.from("slips").upload(path, webp, {
    contentType: "image/webp",
  });
  if (uploadError) throw uploadError;

  const { data: session } = await supabase.auth.getSession();

  const { error: insertError } = await supabase.from("transactions").insert({
    account_id: accountId,
    type: "deposit",
    amount_cents: Math.round(amount * 100),
    occurred_at: occurredAt.toISOString(),
    slip_path: path,
    slip_hash: parsed.slipHash,
    bank_reference: parsed.reference,
    ocr_confidence: parsed.confidence,
    ocr_raw: { text: parsed.rawText, referenceSource: parsed.referenceSource },
    needs_review: parsed.confidence < 0.5,
    created_by: session.session?.user.id,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      throw new DuplicateSlipError("สลิปนี้เคยถูกบันทึกแล้ว (รหัสอ้างอิงซ้ำ)");
    }
    throw insertError;
  }

  return { warning };
}
