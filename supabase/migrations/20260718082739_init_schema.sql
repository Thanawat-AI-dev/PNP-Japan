-- SaveTogether: RLS hardening.
--
-- The base tables (savings-tracker-spec.md section 9) and RLS-enabled flag on
-- every table already exist in this project - applied earlier directly
-- through the Supabase SQL Editor, before this migration history existed.
-- This migration only adds what was still missing: the spec's section 10
-- only wrote policies for `transactions`, leaving every other table
-- RLS-enabled but policy-less (which means default-deny - safe, just
-- non-functional). This fills in helper functions, policies, and grants for
-- all 10 tables, per the Supabase security checklist: any table reachable
-- via the Data API with anon/authenticated grants needs RLS *and* policies
-- that match the real access model.

-- ---------------------------------------------------------------------------
-- Helper functions (security invoker: they run as the calling user, so they
-- only ever see what that user's own RLS policies already allow - no
-- privilege escalation risk).
-- ---------------------------------------------------------------------------

create or replace function is_admin()
returns boolean
language sql
security invoker
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_account_member(target_account_id uuid)
returns boolean
language sql
security invoker
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.accounts
    where id = target_account_id
      and (owner_id = auth.uid() or beneficiary_id = auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security policies and grants. Nothing is granted to `anon` - the
-- app only ever calls the Data API using a signed-in session.
-- ---------------------------------------------------------------------------

-- profiles: both profiles in this 2-person app can see each other (needed to
-- show "you" / "your friend" in the UI); each can only edit their own
-- display_name. `role` is intentionally not grantable via UPDATE at all -
-- column-level GRANT below enforces that, since a USING/WITH CHECK clause
-- can't restrict which columns an UPDATE touches.
create policy "read linked profiles" on profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from accounts
      where (owner_id = (select auth.uid()) and beneficiary_id = profiles.id)
         or (beneficiary_id = (select auth.uid()) and owner_id = profiles.id)
    )
  );

create policy "update own profile" on profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

grant select on profiles to authenticated;
grant update (display_name) on profiles to authenticated;

-- accounts: members can read; only the admin can create/edit account settings.
create policy "read own accounts" on accounts for select
  to authenticated
  using (owner_id = (select auth.uid()) or beneficiary_id = (select auth.uid()));

create policy "admin manages accounts" on accounts for all
  to authenticated
  using (is_admin())
  with check (is_admin());

grant select, insert, update on accounts to authenticated;

-- transactions: both members can read/insert; admin can edit/delete anything,
-- the creator can edit their own within 24h (spec section 2/10).
create policy "read account transactions" on transactions for select
  to authenticated
  using (is_account_member(account_id));

create policy "insert account transactions" on transactions for insert
  to authenticated
  with check (is_account_member(account_id));

create policy "update transactions" on transactions for update
  to authenticated
  using (
    is_admin()
    or (created_by = (select auth.uid()) and created_at > now() - interval '24 hours')
  )
  with check (
    is_admin()
    or (created_by = (select auth.uid()) and created_at > now() - interval '24 hours')
  );

create policy "admin delete transactions" on transactions for delete
  to authenticated
  using (is_admin());

grant select, insert, update on transactions to authenticated;
grant delete on transactions to authenticated; -- restricted further by the policy above

-- interest_rate_tiers / interest_periods / reconciliations: members read,
-- admin writes (setting rates, recording actual interest, reconciling).
create policy "read interest tiers" on interest_rate_tiers for select
  to authenticated
  using (is_account_member(account_id));

create policy "admin manages interest tiers" on interest_rate_tiers for all
  to authenticated
  using (is_admin())
  with check (is_admin());

grant select, insert, update, delete on interest_rate_tiers to authenticated;

-- interest_accruals: read-only for members via the API for now - rows are
-- meant to be populated by a future scheduled job using the service_role key
-- (which bypasses RLS), not written by client code.
create policy "read interest accruals" on interest_accruals for select
  to authenticated
  using (is_account_member(account_id));

grant select on interest_accruals to authenticated;

create policy "read interest periods" on interest_periods for select
  to authenticated
  using (is_account_member(account_id));

create policy "admin manages interest periods" on interest_periods for all
  to authenticated
  using (is_admin())
  with check (is_admin());

grant select, insert, update, delete on interest_periods to authenticated;

-- goals: both members can set/adjust (spec section 2 permission table).
create policy "read account goals" on goals for select
  to authenticated
  using (is_account_member(account_id));

create policy "manage account goals" on goals for all
  to authenticated
  using (is_account_member(account_id))
  with check (is_account_member(account_id));

grant select, insert, update, delete on goals to authenticated;

-- achievements: you can see your own badges and your account partner's
-- (transparency by default, spec section 1). No INSERT policy yet - badges
-- are meant to be awarded by a future trigger after transactions, not
-- self-reported by the client.
create policy "read linked achievements" on achievements for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or exists (
      select 1 from accounts
      where (owner_id = (select auth.uid()) and beneficiary_id = achievements.profile_id)
         or (beneficiary_id = (select auth.uid()) and owner_id = achievements.profile_id)
    )
  );

grant select on achievements to authenticated;

-- reconciliations: members read, admin writes.
create policy "read reconciliations" on reconciliations for select
  to authenticated
  using (is_account_member(account_id));

create policy "admin manages reconciliations" on reconciliations for all
  to authenticated
  using (is_admin())
  with check (is_admin());

grant select, insert, update, delete on reconciliations to authenticated;

-- audit_log: read-only for both roles (spec section 2), account-scoped via
-- the entity_id when the entity is a transaction. No write grants at all -
-- see TODO below.
create policy "read account audit log" on audit_log for select
  to authenticated
  using (
    entity <> 'transactions'
    or exists (
      select 1 from transactions
      where transactions.id = audit_log.entity_id
        and is_account_member(transactions.account_id)
    )
  );

grant select on audit_log to authenticated;

-- TODO before Phase 2/3 (see savings-tracker-spec.md section 9 "Trigger ที่ต้องมี"):
-- add AFTER INSERT/UPDATE/DELETE triggers on transactions (and other mutable
-- tables) that write audit_log rows via a SECURITY DEFINER function. Keep
-- that function out of any exposed schema and re-run `supabase db advisors`
-- after adding it, per the Supabase security checklist for SECURITY DEFINER
-- functions.
