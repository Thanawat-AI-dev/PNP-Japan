import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export interface Profile {
  id: string;
  display_name: string;
  role: "admin" | "friend";
}

/** The signed-in user's own profile row (role, display name). */
export function useProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    supabase
      .from("profiles")
      .select("id, display_name, role")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error(error);
        setProfile(data);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  return { profile, loading, isAdmin: profile?.role === "admin" };
}
