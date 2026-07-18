import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtimeRefetch } from "@/lib/useRealtime";

export function useAchievements() {
  const [earnedCodes, setEarnedCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    return supabase
      .from("achievements")
      .select("badge_code")
      .then(({ data, error }) => {
        if (error) console.error(error);
        setEarnedCodes(new Set((data ?? []).map((r) => r.badge_code)));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Badges are awarded by DB triggers, so a new row can appear at any time -
  // keep the page live without a refresh.
  useRealtimeRefetch("achievements", refetch);

  return { earnedCodes, loading };
}
