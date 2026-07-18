-- Two "Trigger ที่ต้องมี" from spec section 9 that never existed, so
-- audit_log and achievements were permanently empty (Opus finding #2).

-- ---------------------------------------------------------------------------
-- Audit log: after insert/update/delete on transactions.
-- Not a client-invokable endpoint (only fires from an already-RLS-checked
-- write), so the main SECURITY DEFINER risk from the security checklist
-- (a public callable bypass) doesn't apply - but search_path is still
-- pinned defensively.
-- ---------------------------------------------------------------------------
create or replace function log_transaction_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_log (actor_id, action, entity, entity_id, before, after)
  values (
    auth.uid(),
    lower(TG_OP),
    'transactions',
    coalesce(NEW.id, OLD.id),
    case when TG_OP in ('update', 'delete') then to_jsonb(OLD) else null end,
    case when TG_OP in ('insert', 'update') then to_jsonb(NEW) else null end
  );
  return coalesce(NEW, OLD);
end;
$$;

create trigger log_transaction_audit_trigger
  after insert or update or delete on transactions
  for each row execute function log_transaction_audit();

-- ---------------------------------------------------------------------------
-- Badges: awarded after a deposit or when a goal is fully allocated.
-- Scoped to the mechanically-checkable conditions from spec section 7.3:
-- first_deposit, streak_3/6/12, first_interest, goal_reached. double_avg,
-- early_bird, and no_withdrawal are NOT implemented here - they need either
-- a scheduled job (no_withdrawal is an absence-over-time condition, not a
-- point-in-time one) or more heuristic judgement calls (double_avg,
-- early_bird) that deserve their own careful pass rather than a rushed
-- guess bundled into this migration.
-- ---------------------------------------------------------------------------
create or replace function compute_current_streak(p_profile_id uuid, p_account_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  streak int := 0;
  cursor_month date := date_trunc('month', now() at time zone 'Asia/Bangkok')::date;
  has_deposit boolean;
begin
  loop
    select exists (
      select 1 from public.transactions
      where account_id = p_account_id
        and created_by = p_profile_id
        and type = 'deposit'
        and date_trunc('month', occurred_at at time zone 'Asia/Bangkok') = cursor_month
    ) into has_deposit;

    exit when not has_deposit;
    streak := streak + 1;
    cursor_month := cursor_month - interval '1 month';
  end loop;

  return streak;
end;
$$;

create or replace function award_badge(p_profile_id uuid, p_badge_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.achievements (profile_id, badge_code)
  values (p_profile_id, p_badge_code)
  on conflict (profile_id, badge_code) do nothing;
end;
$$;

create or replace function check_badges_after_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  deposit_count int;
  streak int;
begin
  if NEW.created_by is null then
    return NEW;
  end if;

  if NEW.type = 'deposit' then
    select count(*) into deposit_count
    from public.transactions
    where created_by = NEW.created_by and type = 'deposit';

    if deposit_count = 1 then
      perform public.award_badge(NEW.created_by, 'first_deposit');
    end if;

    streak := public.compute_current_streak(NEW.created_by, NEW.account_id);
    if streak >= 3 then perform public.award_badge(NEW.created_by, 'streak_3'); end if;
    if streak >= 6 then perform public.award_badge(NEW.created_by, 'streak_6'); end if;
    if streak >= 12 then perform public.award_badge(NEW.created_by, 'streak_12'); end if;
  end if;

  if NEW.type = 'interest' then
    perform public.award_badge(NEW.created_by, 'first_interest');
  end if;

  return NEW;
end;
$$;

create trigger check_badges_after_transaction_trigger
  after insert on transactions
  for each row execute function check_badges_after_transaction();

create or replace function check_goal_reached_badge()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_id uuid;
begin
  if NEW.allocated_amount >= NEW.target_amount and (OLD is null or OLD.allocated_amount < OLD.target_amount) then
    for member_id in
      select owner_id from public.accounts where id = NEW.account_id and owner_id is not null
      union
      select beneficiary_id from public.accounts where id = NEW.account_id and beneficiary_id is not null
    loop
      perform public.award_badge(member_id, 'goal_reached');
    end loop;
  end if;
  return NEW;
end;
$$;

create trigger check_goal_reached_badge_trigger
  after insert or update on goals
  for each row execute function check_goal_reached_badge();
