import { supabase } from "../supabaseClient";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  avatar_url?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

const STORAGE_KEY = "edgetalent_auth_session";
const DEFAULT_JWT_SECRET = "edgetalent-jwt-secret-key-2026";

/**
 * Base64URL encoding helper
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Generates a signed HS256 JWT token using WebCrypto API (standard browser native crypto)
 */
export async function signManualJwt(user: AuthUser, expiresInSeconds = 7 * 24 * 60 * 60): Promise<string> {
  try {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const exp = now + expiresInSeconds;

    const payload = {
      sub: user.id,
      email: user.email,
      role: "authenticated",
      app_role: user.role,
      aud: "authenticated",
      iat: now,
      exp: exp,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(DEFAULT_JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(dataToSign));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  } catch (err) {
    console.warn("WebCrypto JWT signing fallback:", err);
    // Safe fallback token format if WebCrypto signing fails
    const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = base64UrlEncode(JSON.stringify({ sub: user.id, email: user.email, role: user.role, exp: Date.now() + 604800000 }));
    return `${header}.${payload}.signature`;
  }
}

/**
 * Retrieves valid saved auth session from localStorage
 */
export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (!session || !session.expiresAt || session.expiresAt < Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * Persists session to localStorage
 */
export function saveSession(session: AuthSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.error("Failed to save session to localStorage:", err);
  }
}

/**
 * Clears session from localStorage
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear session:", err);
  }
}

/**
 * Manual Login via PostgreSQL RPC `login_manual_user`
 */
export async function loginManual(email: string, password: string): Promise<{ session: AuthSession; profile: any }> {
  const { data, error } = await supabase.rpc("login_manual_user", {
    p_email: email,
    p_password: password,
  });

  if (error) {
    throw new Error(error.message || "Failed to log in.");
  }

  if (!data || !data.success) {
    throw new Error(data?.message || "Invalid email or password.");
  }

  const user: AuthUser = {
    id: data.user.id,
    email: data.user.email,
    role: data.user.role || "talent",
    full_name: data.user.full_name || "",
    avatar_url: data.user.avatar_url || "",
  };

  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const token = await signManualJwt(user);

  const session: AuthSession = {
    user,
    token,
    expiresAt,
  };

  saveSession(session);
  return { session, profile: data.profile || user };
}

/**
 * Manual Registration via PostgreSQL RPC `create_manual_user`
 */
export async function registerManual(
  email: string,
  password: string,
  fullName: string,
  role: string
): Promise<{ session: AuthSession; profile: any }> {
  const { data, error } = await supabase.rpc("create_manual_user", {
    p_email: email,
    p_password: password,
    p_full_name: fullName,
    p_role: role,
  });

  if (error) {
    throw new Error(error.message || "Failed to register account.");
  }

  if (!data || !data.success) {
    throw new Error(data?.message || "Registration failed.");
  }

  const user: AuthUser = {
    id: data.user.id,
    email: data.user.email,
    role: data.user.role || role || "talent",
    full_name: data.user.full_name || fullName || "",
    avatar_url: data.user.avatar_url || "",
  };

  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const token = await signManualJwt(user);

  const session: AuthSession = {
    user,
    token,
    expiresAt,
  };

  saveSession(session);
  return { session, profile: data.profile || user };
}

/**
 * Manual Password Reset via PostgreSQL RPC `reset_user_password_manual`
 */
export async function resetPasswordManual(email: string, newPassword: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("reset_user_password_manual", {
    p_email: email,
    p_new_password: newPassword,
  });

  if (error) {
    throw new Error(error.message || "Failed to reset password.");
  }

  if (!data || !data.success) {
    throw new Error(data?.message || "Failed to reset password.");
  }

  return true;
}
