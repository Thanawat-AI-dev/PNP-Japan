import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/** Count of transactions needing admin attention (flagged by OCR, or a pending cancellation request). */
export function useAdminAlertCount(accountId: string | undefined, enabled: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!accountId || !enabled) return;
    let cancelled = false;

    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("account_id", accountId)
      .or("needs_review.eq.true,cancel_requested.eq.true")
      .then(({ count: c, error }) => {
        if (cancelled) return;
        if (error) console.error(error);
        setCount(c ?? 0);
      });

    return () => {
      cancelled = true;
    };
  }, [accountId, enabled]);

  return count;
}
