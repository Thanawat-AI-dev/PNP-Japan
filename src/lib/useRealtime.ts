import { useEffect, useId } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Re-run `onChange` whenever any row in `table` changes (insert/update/delete),
 * so views stay live without a manual page refresh. Pass a `filter` like
 * `account_id=eq.<id>` to only react to relevant rows. Postgres changes still
 * respect RLS - a user only ever receives events for rows they can already
 * read - so this never leaks another account's data.
 *
 * `onChange` should be a stable reference (e.g. a useCallback'd refetch);
 * changing it, the filter, the table, or `enabled` re-subscribes the channel.
 */
export function useRealtimeRefetch(
  table: string,
  onChange: () => void,
  filter?: string,
  enabled = true,
) {
  const id = useId();

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(`rt:${table}:${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, enabled, id, onChange]);
}
