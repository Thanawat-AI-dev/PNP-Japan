import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/lib/transactions";

export function useTransactions(accountId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    setLoading(true);

    supabase
      .from("transactions")
      .select("id, type, amount_cents, occurred_at, note, needs_review, created_by, created_at")
      .eq("account_id", accountId)
      .order("occurred_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        setTransactions(data ?? []);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accountId]);

  return { transactions, loading, error };
}
