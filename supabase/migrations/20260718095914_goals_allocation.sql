-- Support multiple concurrent goals sharing one balance, with an explicit
-- allocation per goal (envelope-style budgeting on top of the single
-- account balance - the money doesn't move, this just tracks how much of
-- it is earmarked for each goal).
--
-- The "sum of allocations <= real balance" constraint is enforced at the
-- application layer, not the database: it's a cross-table aggregate
-- (allocated_amount across all of an account's goals vs. balance computed
-- from transactions), which a plain CHECK constraint can't express without
-- a trigger. For a 2-person trusted app, client-side validation is enough;
-- a non-negative guard is still enforced here as a basic backstop.
alter table goals
  add column allocated_amount numeric(15,2) not null default 0
  check (allocated_amount >= 0);
