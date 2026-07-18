import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export interface Account {
  id: string;
  name: string;
  bank: string | null;
  owner_id: string | null;
  beneficiary_id: string | null;
  interest_payout: string | null;
  tax_enabled: boolean;
}

interface AccountContextValue {
  account: Account | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const AccountContext = createContext<AccountContextValue>({
  account: null,
  loading: true,
  error: null,
  refetch: () => {},
});

/**
 * Fetches the current session user's shared account exactly once and shares it
 * through context. Previously every page plus the always-mounted BottomNav each
 * called useAccount() and fired its own identical query; a single provider
 * collapses that to one request per session. (This app is scoped to exactly one
 * account per couple.)
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (authLoading) return;
    if (!session) {
      setAccount(null);
      setLoading(false);
      return;
    }
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
  }, [session, authLoading]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <AccountContext.Provider value={{ account, loading, error, refetch }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}
