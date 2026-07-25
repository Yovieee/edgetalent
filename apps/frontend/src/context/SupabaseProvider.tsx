import React, { useState, useEffect, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { SupabaseContext } from "./SupabaseContext";
import { Profile } from "@edgetalent/shared";

interface SupabaseProviderProps {
  children: ReactNode;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        if (error.code === "PGRST301" || error.code === "user_not_found" || error.message?.includes("sub claim") || error.message?.includes("user_not_found")) {
          await supabase.auth.signOut().catch(() => {});
          setSession(null);
          setProfile(null);
          return;
        }
        setProfile(null);
      } else if (!data) {
        // Profile row missing in public.profiles table, attempt automatic creation
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const fallbackProfile = {
            id: userData.user.id,
            email: userData.user.email || "",
            full_name: userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || userData.user.email?.split("@")[0] || "User",
          };
          const { data: createdData } = await supabase
            .from("profiles")
            .upsert(fallbackProfile, { onConflict: "id" })
            .select("*")
            .maybeSingle();

          if (createdData) {
            setProfile(createdData as Profile);
          } else {
            const { data: retryData } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userData.user.id)
              .maybeSingle();
            setProfile((retryData as Profile) || null);
          }
        } else {
          setProfile(null);
        }
      } else {
        setProfile(data as Profile);
      }
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    // Verify active user against Auth API to purge stale JWTs from wiped databases
    supabase.auth.getUser().then(({ data: userData, error: userError }) => {
      if (userError || !userData?.user) {
        // Stale token detected; clear localStorage session
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setProfile(null);
        setLoading(false);
      } else {
        supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
          setSession(activeSession);
          if (activeSession?.user) {
            fetchProfile(activeSession.user.id).finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <SupabaseContext.Provider value={{ supabase, session, profile, loading, fetchProfile, signOut }}>
      {children}
    </SupabaseContext.Provider>
  );
};
