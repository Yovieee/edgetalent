import { createClient } from "@supabase/supabase-js";

// Use valid placeholder values as fallbacks to prevent import-time crashes when env vars are missing
const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn("⚠️ Warning: Supabase environment variables are missing. Using placeholders.");
} else {
  console.log("🔌 Connecting to live Supabase Instance at:", supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
