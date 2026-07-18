-- Product decision update: a Friend can only shape a transaction before
-- confirming it (client-side, in the add-slip form) - once saved, they can
-- only request cancellation, never edit directly, regardless of how soon
-- after creation. This replaces the earlier 24h full-edit window for
-- non-admins with the cancel-request-only rule immediately.
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

  -- Non-admin: only a false -> true flip of cancel_requested is ever allowed.
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

  raise exception 'ไม่สามารถแก้ไขรายการนี้ได้ - ทำได้แค่ขอยกเลิกรายการ';
end;
$$;
