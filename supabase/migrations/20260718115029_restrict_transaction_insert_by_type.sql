-- The "insert account transactions" policy let any account member insert
-- ANY transaction type, but spec section 2's permission table only allows
-- both roles to record deposits - withdrawals and interest bookings are
-- Admin-only. Without this, a friend could bypass the UI (which is about
-- to gain a manual-entry form) and call the API directly to record a fake
-- withdrawal or interest payment.
drop policy "insert account transactions" on transactions;
create policy "insert account transactions" on transactions for insert
  to authenticated
  with check (
    is_account_member(account_id)
    and (type = 'deposit' or is_admin())
  );
