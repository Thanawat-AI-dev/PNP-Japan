import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export interface Profile {
  id: string;
  display_name: string;
  role: "admin" | "friend";
}

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  isAdmin: false,
});

/**
 * Fetches the signed-in user's own profile (role, display name) once and shares
 * it through context. Previously BottomNav, RequireAdmin, and several pages each
 * called useProfile() and fired a separate query; one provider collapses that to
 * a single request per session.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

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
  }, [session, authLoading]);

  return (
    <ProfileContext.Provider value={{ profile, loading, isAdmin: profile?.role === "admin" }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
