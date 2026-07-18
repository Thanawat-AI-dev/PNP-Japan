import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Goal {
  id: string;
  title: string;
  target_amount: number;
  target_date: string | null;
}

export function useGoal(accountId: string | undefined) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;

    supabase
      .from("goals")
      .select("id, title, target_amount, target_date")
      .eq("account_id", accountId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        setGoal(data);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accountId]);

  return { goal, loading, error };
}
