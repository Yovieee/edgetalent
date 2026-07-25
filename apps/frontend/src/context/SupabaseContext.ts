import { createContext, useContext } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Profile } from "@edgetalent/shared";
import { AuthSession } from "../utils/auth";

export interface SupabaseContextType {
  supabase: SupabaseClient;
  session: AuthSession | null;
  profile: Profile | null;
  loading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
}

export const SupabaseContext = createContext<SupabaseContextType | null>(null);

export const useSupabase = (): SupabaseContextType => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};
