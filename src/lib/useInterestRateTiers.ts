import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { tiersEffectiveOn } from "@/lib/interestAccrual";

export interface RateTier {
  id: string;
  effective_from: string;
  effective_to: string | null;
  tier_order: number;
  min_balance: number;
  max_balance: number | null;
  annual_rate: number;
  source_note: string | null;
}

export function useInterestRateTiers(accountId: string | undefined) {
  const [tiers, setTiers] = useState<RateTier[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!accountId) return;
    setLoading(true);
    return supabase
      .from("interest_rate_tiers")
      .select(
        "id, effective_from, effective_to, tier_order, min_balance, max_balance, annual_rate, source_note",
      )
      .eq("account_id", accountId)
      .order("effective_from", { ascending: false })
      .order("tier_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setTiers(data ?? []);
        setLoading(false);
      });
  }, [accountId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tiers, loading, refetch };
}

/**
 * Blended annual rate for a given balance, per the tiered calculation in
 * spec section 6.1/6.4. Returns 0 if no rate tiers have been configured yet
 * (Admin hasn't set them up in the rates screen) - never a hardcoded guess.
 */
export function calcEffectiveAnnualRate(
  balance: number,
  allTiers: RateTier[],
  asOf = new Date(),
): number {
  const tiers = tiersEffectiveOn(allTiers, asOf);
  if (tiers.length === 0 || balance <= 0) return 0;

  let annualInterest = 0;
  for (const t of tiers) {
    const upper = t.max_balance ?? Infinity;
    const amountInTier = Math.max(0, Math.min(balance, upper) - t.min_balance);
    if (amountInTier <= 0) continue;
    annualInterest += amountInTier * t.annual_rate;
  }
  return annualInterest / balance;
}
