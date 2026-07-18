-- Push live updates to the app so it never needs a manual refresh. Adding a
-- table to the supabase_realtime publication is what makes postgres_changes
-- events flow to subscribed clients; RLS still applies, so each client only
-- receives events for rows it is already allowed to read.
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.goals;
alter publication supabase_realtime add table public.achievements;

-- Default replica identity only exposes the primary key on UPDATE/DELETE, which
-- is not enough to evaluate an account_id filter on those events (e.g. an admin
-- approving a cancel request deletes a row). REPLICA IDENTITY FULL includes the
-- whole old row so filtered update/delete events still reach the right client.
alter table public.transactions replica identity full;
alter table public.goals replica identity full;
