-- Postgres grants EXECUTE to PUBLIC on new functions by default, which
-- PostgREST then exposes as callable RPC endpoints to anon/authenticated
-- (flagged by supabase db advisors: "Public Can Execute SECURITY DEFINER
-- Function"). award_badge in particular would let anyone with the anon key
-- self-award any badge to any profile via POST /rest/v1/rpc/award_badge.
-- None of these five are meant to be called directly - they only run as
-- trigger side effects, which don't need EXECUTE grants to fire.

revoke execute on function log_transaction_audit() from public, anon, authenticated;
revoke execute on function compute_current_streak(uuid, uuid) from public, anon, authenticated;
revoke execute on function award_badge(uuid, text) from public, anon, authenticated;
revoke execute on function check_badges_after_transaction() from public, anon, authenticated;
revoke execute on function check_goal_reached_badge() from public, anon, authenticated;
