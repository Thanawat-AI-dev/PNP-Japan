import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

  const refetch = useCallback(() => {
    if (!accountId) return;
    setLoading(true);
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
      });
  }, [accountId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { goals, loading, error, refetch };
}
