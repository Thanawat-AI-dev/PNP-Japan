import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useAchievements() {
  const [earnedCodes, setEarnedCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("achievements")
      .select("badge_code")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error(error);
        setEarnedCodes(new Set((data ?? []).map((r) => r.badge_code)));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { earnedCodes, loading };
}
