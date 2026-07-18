import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/lib/transactions";

export function useTransactions(accountId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!accountId) return;
    setLoading(true);
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
      });
  }, [accountId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { transactions, loading, error, refetch };
}
