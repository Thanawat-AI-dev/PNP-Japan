import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtimeRefetch } from "@/lib/useRealtime";

export interface Goal {
  id: string;
  title: string;
  target_amount: number;
  target_date: string | null;
  allocated_amount: number;
}

export function useGoals(accountId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Only the first load for a given account shows the loading state; later
  // refetches (manual or realtime) update in place without a spinner flash.
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
  }, [accountId]);

  const refetch = useCallback(() => {
    if (!accountId) return;
    if (!loadedRef.current) setLoading(true);
    return supabase
      .from("goals")
      .select("id, title, target_amount, target_date, allocated_amount")
      .eq("account_id", accountId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setGoals(data ?? []);
        setLoading(false);
        loadedRef.current = true;
      });
  }, [accountId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useRealtimeRefetch(
    "goals",
    refetch,
    accountId ? `account_id=eq.${accountId}` : undefined,
    !!accountId,
  );

  return { goals, loading, error, refetch };
}
