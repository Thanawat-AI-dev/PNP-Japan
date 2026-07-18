// Matches the SlipParser interface in savings-tracker-spec.md section 4.
// v1 implementation is LocalOcrParser (free, runs entirely in the browser).
// A future paid API (SlipOK/EasySlip) can implement the same interface
// without touching call sites.

export interface SlipParseResult {
  amount: number | null;
  datetime: Date | null;
  reference: string | null;
  // Where `reference` came from. QR payloads are opaque EMVCo strings that
  // share a long common boilerplate prefix across unrelated slips (same bank,
  // same static merchant tags) - two different transactions can look nearly
  // identical if truncated for display, even though the full strings differ.
  // Callers should not render the raw "qr" value as if it were human-legible;
  // "ocr" values are the actual printed reference number on the slip.
  referenceSource: "qr" | "ocr" | null;
  receiverName: string | null;
  senderName: string | null;
  confidence: number; // 0.0 - 1.0
  verified: boolean; // true only when confirmed against the bank
  rawText: string; // raw OCR text, kept for debugging / ocr_raw column
  slipHash: string; // SHA-256 of the file, for duplicate detection
}

export interface SlipParser {
  name: string;
  parse(file: File): Promise<SlipParseResult>;
}
