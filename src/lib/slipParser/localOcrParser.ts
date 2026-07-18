import { createWorker } from "tesseract.js";
import type { SlipParser, SlipParseResult } from "./types";
import { loadImageBitmap, preprocessForOcr } from "./image";
import { readQrReference } from "./qr";
import { extractFields } from "./regex";
import { scoreConfidence } from "./confidence";
import { sha256File } from "./hash";

// Free, 100% browser-side implementation of SlipParser (spec section 4/5).
// A paid, bank-verified parser can later implement the same interface as
// e.g. SlipVerifyApiParser without changing any call sites.
export const localOcrParser: SlipParser = {
  name: "LocalOcrParser",

  async parse(file: File): Promise<SlipParseResult> {
    const [bitmap, slipHash] = await Promise.all([loadImageBitmap(file), sha256File(file)]);

    const qrReference = readQrReference(bitmap);

    const ocrCanvas = preprocessForOcr(bitmap);
    const worker = await createWorker(["eng", "tha"]);
    let rawText = "";
    try {
      const { data } = await worker.recognize(ocrCanvas);
      rawText = data.text;
    } finally {
      await worker.terminate();
    }

    const { amount, datetime, reference: printedReference } = extractFields(rawText);
    // Prefer the QR payload (unique nationwide, per spec section 5) - fall back to the
    // printed reference number on the slip only when no QR could be decoded.
    const reference = qrReference ?? printedReference;
    const referenceSource: SlipParseResult["referenceSource"] =
      qrReference != null ? "qr" : printedReference != null ? "ocr" : null;

    const confidence = scoreConfidence({
      qrFound: qrReference != null,
      amountFound: amount != null,
      datetimeFound: datetime != null,
    });

    return {
      amount,
      datetime,
      reference,
      referenceSource,
      receiverName: null,
      senderName: null,
      confidence,
      verified: false,
      rawText,
      slipHash,
    };
  },
};
