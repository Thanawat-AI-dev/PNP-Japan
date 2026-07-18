import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtimeRefetch } from "@/lib/useRealtime";
import type { Transaction } from "@/lib/transactions";

export function useTransactions(accountId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      .from("transactions")
      .select(
        "id, type, amount_cents, occurred_at, note, needs_review, cancel_requested, created_by, created_at, slip_path",
      )
      .eq("account_id", accountId)
      .order("occurred_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setTransactions(data ?? []);
        setLoading(false);
        loadedRef.current = true;
      });
  }, [accountId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useRealtimeRefetch(
    "transactions",
    refetch,
    accountId ? `account_id=eq.${accountId}` : undefined,
    !!accountId,
  );

  return { transactions, loading, error, refetch };
}
