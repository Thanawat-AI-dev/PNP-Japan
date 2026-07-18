-- The badge trigger only fires on INSERT going forward, so real activity
-- that happened before the trigger existed (7 deposits for one profile
-- spanning months, 3 for the other) never got a chance to earn anything -
-- achievements was empty even though first_deposit and possibly streak
-- badges were already genuinely earned. One-time backfill using the same
-- logic the trigger uses, applied to current data instead of only new rows.

do $$
declare
  r record;
  streak int;
begin
  -- first_deposit: anyone with at least one deposit already made it.
  for r in select distinct created_by from transactions where type = 'deposit' and created_by is not null
  loop
    perform award_badge(r.created_by, 'first_deposit');
  end loop;

  -- streak_3/6/12: award whatever their current streak already qualifies for.
  for r in
    select distinct t.created_by, t.account_id
    from transactions t
    where t.type = 'deposit' and t.created_by is not null
  loop
    streak := compute_current_streak(r.created_by, r.account_id);
    if streak >= 3 then perform award_badge(r.created_by, 'streak_3'); end if;
    if streak >= 6 then perform award_badge(r.created_by, 'streak_6'); end if;
    if streak >= 12 then perform award_badge(r.created_by, 'streak_12'); end if;
  end loop;

  -- first_interest: anyone who has already recorded an interest transaction.
  for r in select distinct created_by from transactions where type = 'interest' and created_by is not null
  loop
    perform award_badge(r.created_by, 'first_interest');
  end loop;

  -- goal_reached: any goal already at or past its target.
  for r in
    select a.owner_id, a.beneficiary_id
    from goals g
    join accounts a on a.id = g.account_id
    where g.allocated_amount >= g.target_amount
  loop
    if r.owner_id is not null then perform award_badge(r.owner_id, 'goal_reached'); end if;
    if r.beneficiary_id is not null then perform award_badge(r.beneficiary_id, 'goal_reached'); end if;
  end loop;
end;
$$;
