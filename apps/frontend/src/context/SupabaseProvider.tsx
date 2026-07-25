import React, { useState, useEffect, ReactNode } from "react";
import { supabase } from "../supabaseClient";
import { SupabaseContext } from "./SupabaseContext";
import { Profile } from "@edgetalent/shared";
import {
  AuthSession,
  getStoredSession,
  clearSession,
  loginManual,
  registerManual,
  resetPasswordManual,
} from "../utils/auth";

interface SupabaseProviderProps {
  children: ReactNode;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
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
        setProfile(null);
      } else if (!data) {
        // Fallback profile if row is missing in public.profiles table
        const currentSession = getStoredSession();
        if (currentSession?.user) {
          const fallbackProfile: Profile = {
            id: currentSession.user.id,
            email: currentSession.user.email || "",
            full_name: currentSession.user.full_name || currentSession.user.email.split("@")[0],
            role: (currentSession.user.role as any) || "talent",
            avatar_url: currentSession.user.avatar_url || "",
            bio: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const { data: createdData } = await supabase
            .from("profiles")
            .upsert(fallbackProfile, { onConflict: "id" })
            .select("*")
            .maybeSingle();

          setProfile((createdData as Profile) || fallbackProfile);
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
    const activeSession = getStoredSession();
    if (activeSession?.user) {
      setSession(activeSession);
      fetchProfile(activeSession.user.id).finally(() => setLoading(false));
    } else {
      setSession(null);
      setProfile(null);
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { session: newSession, profile: userProfile } = await loginManual(email, password);
      setSession(newSession);
      setProfile(userProfile);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    setLoading(true);
    try {
      const { session: newSession, profile: userProfile } = await registerManual(email, password, fullName, role);
      setSession(newSession);
      setProfile(userProfile);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    clearSession();
    setSession(null);
    setProfile(null);
    setLoading(false);
  };

  const resetPassword = async (email: string, newPassword: string) => {
    await resetPasswordManual(email, newPassword);
  };

  return (
    <SupabaseContext.Provider
      value={{
        supabase,
        session,
        profile,
        loading,
        fetchProfile,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};
