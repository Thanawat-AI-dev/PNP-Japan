import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface AuditLogEntry {
  id: number;
  action: string;
  entity: string;
  entity_id: string | null;
  created_at: string;
  actor: { display_name: string } | null;
}

export function useAuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("audit_log")
      .select("id, action, entity, entity_id, created_at, actor:profiles(display_name)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error(error);
        setEntries((data as unknown as AuditLogEntry[]) ?? []);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { entries, loading };
}
