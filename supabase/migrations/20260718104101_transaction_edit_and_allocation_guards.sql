-- Two business rules that a client-side check alone can't actually
-- guarantee, so they're enforced with triggers (defense in depth - the app
-- also validates these before ever sending the request):
--
-- 1. Past the 24h edit window, a non-admin creator can still update their
--    own transaction row, but ONLY to set cancel_requested from false to
--    true (spec section 2: "ทำได้แค่ขอยกเลิก"). Nothing else may change,
--    and they can't clear it back to false (only Admin resolves requests).
-- 2. A goal's allocated_amount can only increase via UPDATE. The only way
--    to reduce it is deleting the goal outright, which releases the funds
--    back to the account's unallocated pool.

-- Widen row-level access so a creator can attempt an update on their own
-- transaction at any time (previously gated to the first 24h) - the
-- trigger below is what actually restricts what they're allowed to change.
drop policy "update transactions" on transactions;
create policy "update transactions" on transactions for update
  to authenticated
  using (is_admin() or created_by = (select auth.uid()))
  with check (is_admin() or created_by = (select auth.uid()));

create or replace function enforce_transaction_edit_rules()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if old.created_by = auth.uid() and old.created_at > now() - interval '24 hours' then
    return new;
  end if;

  -- Past the window: only a false -> true flip of cancel_requested is allowed.
  if new.cancel_requested = true
     and old.cancel_requested = false
     and new.account_id = old.account_id
     and new.type = old.type
     and new.amount_cents = old.amount_cents
     and new.occurred_at = old.occurred_at
     and new.note is not distinct from old.note
     and new.slip_path is not distinct from old.slip_path
     and new.slip_hash is not distinct from old.slip_hash
     and new.bank_reference is not distinct from old.bank_reference
     and new.ocr_confidence is not distinct from old.ocr_confidence
     and new.ocr_raw is not distinct from old.ocr_raw
     and new.needs_review = old.needs_review
     and new.created_by = old.created_by
     and new.created_at = old.created_at
  then
    return new;
  end if;

  raise exception 'ไม่สามารถแก้ไขรายการนี้ได้ - เกิน 24 ชม. ทำได้แค่ขอยกเลิกรายการ';
end;
$$;

create trigger enforce_transaction_edit_rules_trigger
  before update on transactions
  for each row execute function enforce_transaction_edit_rules();

create or replace function enforce_goal_allocation_non_decreasing()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.allocated_amount < old.allocated_amount then
    raise exception 'ลดยอดจัดสรรไม่ได้ - ถ้าต้องการนำเงินออก ให้ลบเป้าหมายนี้ทิ้งแทน';
  end if;
  return new;
end;
$$;

create trigger enforce_goal_allocation_non_decreasing_trigger
  before update on goals
  for each row execute function enforce_goal_allocation_non_decreasing();
