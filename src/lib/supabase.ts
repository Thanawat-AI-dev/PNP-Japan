import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ยังไม่ได้ตั้งค่า — ดู .env.local.example และ savings-tracker-spec.md ข้อ 13",
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "");
