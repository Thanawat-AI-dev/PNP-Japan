import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
// Publishable key (sb_publishable_...) - the current recommended replacement
// for the legacy anon key (https://supabase.com/docs/guides/api/api-keys).
// Safe to expose in frontend code; RLS is what actually restricts access.
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  console.warn(
    "VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY ยังไม่ได้ตั้งค่า — ดู .env.local.example และ savings-tracker-spec.md ข้อ 13",
  );
}

export const supabase = createClient(url ?? "", publishableKey ?? "");
