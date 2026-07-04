import { createContext, useContext } from "react";
import { SupabaseClient, Session } from "@supabase/supabase-js";
import { Profile } from "@edgetalent/shared";

export interface SupabaseContextType {
  supabase: SupabaseClient;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const SupabaseContext = createContext<SupabaseContextType | null>(null);

export const useSupabase = (): SupabaseContextType => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};
