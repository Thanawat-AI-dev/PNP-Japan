// Field extraction regexes. Originally copied verbatim from
// savings-tracker-spec.md section 5, step 2, then revised against 4 real SCB
// slips (see Slip-Test/) which surfaced two mismatches with the spec's
// assumed text shape:
//  1. The amount on a real SCB slip has no currency word next to it at all
//     ("100.00", not "100.00 บาท") - the spec's regex would never match.
//  2. The reference code is mixed-case alphanumeric ("TBgdJUBljdJ93DZG"),
//     not uppercase-only as the spec's character class assumed.

const AMOUNT_WITH_UNIT_RE = /(\d{1,3}(?:,\d{3})*\.\d{2})\s*(?:บาท|THB|baht)/i;
// "จำนวนเงิน" (amount) label followed by its value, possibly on the next line.
const AMOUNT_LABELED_RE = /จำนวนเงิน[\s\S]{0,20}?(\d{1,3}(?:,\d{3})*\.\d{2})/;
// Last resort: the first bare decimal-with-cents number anywhere in the text.
const AMOUNT_BARE_RE = /(\d{1,3}(?:,\d{3})*\.\d{2})/;

const THAI_DATE_RE =
  /(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(\d{2,4})/;
const TIME_RE = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:น\.)?/;
// Reference codes are mixed-case alphanumeric (e.g. "TBgdJUBljdJ93DZG"), not uppercase-only.
// OCR also occasionally drops a stray single space mid-code ("...ttoY EXobFuiy"); a lone
// space is allowed through as long as another alnum char follows on the same line, and
// stripped back out afterward - two+ spaces or a newline still ends the match.
const REFERENCE_RE =
  /(?:รหัสอ้างอิง|Ref(?:erence)?(?:\s*No)?)[:\s]*([A-Za-z0-9](?:[A-Za-z0-9]| (?=[A-Za-z0-9]))*)/i;

const THAI_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export interface ExtractedFields {
  amount: number | null;
  datetime: Date | null;
  reference: string | null;
}

function toGregorianYear(year: number): number {
  // Buddhist Era is always 543 years ahead of Gregorian.
  return year > 2400 ? year - 543 : year;
}

/**
 * Tesseract's Thai model frequently inserts a space between every glyph
 * ("บ า ท" instead of "บาท") since Thai script has no inter-word spaces for
 * it to anchor on. Left alone, that silently breaks every literal-substring
 * match below (บาท, รหัสอ้างอิง). Thai text never legitimately needs a space
 * between two Thai-script codepoints, so collapsing those is safe.
 */
function collapseThaiSpacing(text: string): string {
  let result = text.replace(/([฀-๿])\s+(?=[฀-๿])/gu, "$1");
  // Thai date abbreviations ("ก.ค.") come back as "ก . ค ." - the periods aren't
  // Thai-script codepoints, so the pass above doesn't touch the spaces around them.
  // Collapse "<Thai-or-digit> ." and ". <Thai-or-digit>" the same way.
  result = result.replace(/([฀-๿0-9])\s+\./gu, "$1.");
  result = result.replace(/\.\s+([฀-๿0-9])/gu, ".$1");
  return result;
}

function extractAmount(text: string): number | null {
  // Prefer a match next to an explicit currency word or the "จำนวนเงิน" label -
  // only fall back to "first bare decimal number in the whole text" when
  // neither is present, since that's a guess rather than a targeted read.
  const match =
    text.match(AMOUNT_WITH_UNIT_RE) ?? text.match(AMOUNT_LABELED_RE) ?? text.match(AMOUNT_BARE_RE);
  return match ? Number(match[1].replace(/,/g, "")) : null;
}

export function extractFields(rawText: string): ExtractedFields {
  const text = collapseThaiSpacing(rawText);
  const amount = extractAmount(text);

  const dateMatch = text.match(THAI_DATE_RE);
  const timeMatch = text.match(TIME_RE);

  let datetime: Date | null = null;
  if (dateMatch) {
    const day = Number(dateMatch[1]);
    const monthIndex = THAI_MONTHS.indexOf(dateMatch[2]);
    const year = toGregorianYear(Number(dateMatch[3]));
    const hour = timeMatch ? Number(timeMatch[1]) : 0;
    const minute = timeMatch ? Number(timeMatch[2]) : 0;
    const second = timeMatch?.[3] ? Number(timeMatch[3]) : 0;

    if (monthIndex >= 0) {
      datetime = new Date(year, monthIndex, day, hour, minute, second);
    }
  }

  const referenceMatch = text.match(REFERENCE_RE);
  const referenceRaw = referenceMatch ? referenceMatch[1].replace(/\s+/g, "") : null;
  // MIN_REFERENCE_LENGTH mirrors the {10,} lower bound the spec's original regex enforced.
  const reference = referenceRaw && referenceRaw.length >= 10 ? referenceRaw : null;

  return { amount, datetime, reference };
}
