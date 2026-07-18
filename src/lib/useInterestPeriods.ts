import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface InterestPeriod {
  id: string;
  period_start: string;
  period_end: string;
  estimated_gross: number | null;
  actual_gross: number | null;
  variance_pct: number | null;
}

export function useInterestPeriods(accountId: string | undefined) {
  const [periods, setPeriods] = useState<InterestPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;

    supabase
      .from("interest_periods")
      .select("id, period_start, period_end, estimated_gross, actual_gross, variance_pct")
      .eq("account_id", accountId)
      .order("period_start", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        setPeriods(data ?? []);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accountId]);

  return { periods, loading, error };
}
