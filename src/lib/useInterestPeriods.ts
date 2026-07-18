import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface InterestPeriod {
  id: string;
  period_start: string;
  period_end: string;
  estimated_gross: number | null;
  actual_gross: number | null;
  tax_withheld: number | null;
  actual_net: number | null;
  variance_pct: number | null;
}

export function useInterestPeriods(accountId: string | undefined) {
  const [periods, setPeriods] = useState<InterestPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!accountId) return;
    setLoading(true);
    return supabase
      .from("interest_periods")
      .select(
        "id, period_start, period_end, estimated_gross, actual_gross, tax_withheld, actual_net, variance_pct",
      )
      .eq("account_id", accountId)
      .order("period_start", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setPeriods(data ?? []);
        setLoading(false);
      });
  }, [accountId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { periods, loading, error, refetch };
}
