import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Account {
  id: string;
  name: string;
  bank: string | null;
  owner_id: string | null;
  beneficiary_id: string | null;
  interest_payout: string | null;
  tax_enabled: boolean;
}

/** The current session user's shared account (this app is scoped to exactly one account per couple). */
export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    return supabase
      .from("accounts")
      .select("id, name, bank, owner_id, beneficiary_id, interest_payout, tax_enabled")
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setAccount(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { account, loading, error, refetch };
}
