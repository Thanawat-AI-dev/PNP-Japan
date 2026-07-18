-- Fixes the "Multiple Permissive Policies" performance warning from
-- `supabase db advisors`: five tables each had a SELECT-scoped "read" policy
-- and a separate "FOR ALL" admin/member policy that also covers SELECT,
-- so every read had to evaluate both. Postgres has no "FOR INSERT, UPDATE,
-- DELETE" shorthand (only ALL or one verb), so each "FOR ALL" policy is
-- split into three single-verb policies that skip SELECT - already handled
-- by the existing read policy.

-- accounts
drop policy "admin manages accounts" on accounts;
create policy "admin insert accounts" on accounts for insert to authenticated with check (is_admin());
create policy "admin update accounts" on accounts for update to authenticated using (is_admin()) with check (is_admin());
create policy "admin delete accounts" on accounts for delete to authenticated using (is_admin());

-- goals
drop policy "manage account goals" on goals;
create policy "insert account goals" on goals for insert to authenticated with check (is_account_member(account_id));
create policy "update account goals" on goals for update to authenticated using (is_account_member(account_id)) with check (is_account_member(account_id));
create policy "delete account goals" on goals for delete to authenticated using (is_account_member(account_id));

-- interest_periods
drop policy "admin manages interest periods" on interest_periods;
create policy "admin insert interest periods" on interest_periods for insert to authenticated with check (is_admin());
create policy "admin update interest periods" on interest_periods for update to authenticated using (is_admin()) with check (is_admin());
create policy "admin delete interest periods" on interest_periods for delete to authenticated using (is_admin());

-- interest_rate_tiers
drop policy "admin manages interest tiers" on interest_rate_tiers;
create policy "admin insert interest tiers" on interest_rate_tiers for insert to authenticated with check (is_admin());
create policy "admin update interest tiers" on interest_rate_tiers for update to authenticated using (is_admin()) with check (is_admin());
create policy "admin delete interest tiers" on interest_rate_tiers for delete to authenticated using (is_admin());

-- reconciliations
drop policy "admin manages reconciliations" on reconciliations;
create policy "admin insert reconciliations" on reconciliations for insert to authenticated with check (is_admin());
create policy "admin update reconciliations" on reconciliations for update to authenticated using (is_admin()) with check (is_admin());
create policy "admin delete reconciliations" on reconciliations for delete to authenticated using (is_admin());
