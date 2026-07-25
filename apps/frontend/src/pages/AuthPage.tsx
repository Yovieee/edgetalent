import React, { useState, useEffect } from "react";
import { useSupabase } from "../context/SupabaseContext";
import { LoginSchema, RegisterSchema, ForgotPasswordSchema } from "@edgetalent/shared";
import { ArrowLeft } from "lucide-react";

interface AuthPageProps {
  onBack: () => void;
}

type AuthMode = "login" | "signup" | "forgot";

export default function AuthPage({ onBack }: AuthPageProps): React.ReactElement {
  const { supabase } = useSupabase();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [role, setRole] = useState<string>("talent");
  const [newPassword, setNewPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  useEffect(() => {
    // Clear stale session token from browser if unauthenticated
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        supabase.auth.signOut().catch(() => {});
      }
    });
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (mode === "forgot") {
        const validationResult = ForgotPasswordSchema.safeParse({ email });
        if (!validationResult.success) {
          throw new Error(validationResult.error.errors[0].message);
        }

        // Attempt manual password reset via RPC first
        if (newPassword && newPassword.length >= 6) {
          const { data: rpcData, error: rpcError } = await supabase.rpc("reset_user_password_manual", {
            p_email: email,
            p_new_password: newPassword,
          });

          if (!rpcError && rpcData?.success) {
            setSuccessMsg("Password reset successfully! You can now log in with your new password.");
            setMode("login");
            setPassword(newPassword);
            setNewPassword("");
            return;
          }
        }

        // Fallback to standard email link reset
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
        setSuccessMsg("Password reset link sent! Please check your inbox and spam folder.");
      } else if (mode === "signup") {
        // Zod validation for register payload
        const validationResult = RegisterSchema.safeParse({ email, password, fullName });
        if (!validationResult.success) {
          throw new Error(validationResult.error.errors[0].message);
        }

        // Attempt manual user creation via RPC
        const { data: rpcData, error: rpcError } = await supabase.rpc("create_manual_user", {
          p_email: email,
          p_password: password,
          p_full_name: fullName,
          p_role: role,
        });

        if (rpcError || (rpcData && !rpcData.success)) {
          const rpcErrMsg = rpcError?.message || rpcData?.message;
          // Fallback to standard Supabase auth signUp if RPC function is unavailable
          if (rpcErrMsg && rpcErrMsg.includes("function") && rpcErrMsg.includes("does not exist")) {
            const { error: signUpErr } = await supabase.auth.signUp({
              email,
              password,
              options: { data: { full_name: fullName } },
            });
            if (signUpErr) throw signUpErr;
            setSuccessMsg("Registration successful! Try logging in.");
          } else {
            throw new Error(rpcErrMsg || "Failed to create user account.");
          }
        } else {
          // Immediately sign in user after manual creation
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInErr) {
            setSuccessMsg("Account created! Please log in with your credentials.");
            setMode("login");
          }
        }
      } else {
        // Zod validation for login payload
        const validationResult = LoginSchema.safeParse({ email, password });
        if (!validationResult.success) {
          throw new Error(validationResult.error.errors[0].message);
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      let rawMsg = "";
      if (typeof err === "string") {
        rawMsg = err;
      } else if (err?.message && typeof err.message === "string") {
        rawMsg = err.message;
      } else if (err?.error_description && typeof err.error_description === "string") {
        rawMsg = err.error_description;
      }

      if (!rawMsg || rawMsg === "{}" || rawMsg === "[object Object]") {
        rawMsg = "Invalid email or password. Please verify your credentials or check connection.";
      }

      if (rawMsg.toLowerCase().includes("rate limit") || rawMsg.toLowerCase().includes("over_email_send_rate_limit")) {
        rawMsg = "Email rate limit exceeded. You can reset your password directly by entering your new password below.";
      } else if (rawMsg.toLowerCase().includes("invalid login credentials")) {
        rawMsg = "Invalid email or password. Please verify your credentials.";
      }
      setErrorMsg(rawMsg);
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMsg("");
    setSuccessMsg("");
    setPassword("");
    setFullName("");
    setNewPassword("");
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "2rem" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "450px", padding: "2.5rem 2rem", position: "relative" }}>
        
        <button 
          onClick={onBack}
          style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.375rem", marginBottom: "1.5rem" }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <h2 style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          {mode === "signup" ? "Create Account" : mode === "forgot" ? "Forgot Password" : "Welcome Back"}
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "2rem" }}>
          {mode === "signup"
            ? "Join the EdgeTalent ecosystem today"
            : mode === "forgot"
            ? "Reset your password directly or request a link"
            : "Log in to manage your career or projects"}
        </p>

        {errorMsg && (
          <div className="badge badge-rose" style={{ display: "block", padding: "0.8rem", width: "100%", borderRadius: "var(--radius-sm)", marginBottom: "1.5rem", textAlign: "center" }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="badge badge-emerald" style={{ display: "block", padding: "0.8rem", width: "100%", borderRadius: "var(--radius-sm)", marginBottom: "1.5rem", textAlign: "center" }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={mode === "signup"}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Account Role</label>
                <select
                  id="role"
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ cursor: "pointer" }}
                >
                  <option value="talent">Talent / Developer</option>
                  <option value="partner">Partner / Enterprise</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== "forgot" && (
            <div className="form-group" style={{ marginBottom: mode === "login" ? "0.75rem" : "2rem" }}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {mode === "forgot" && (
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="newPassword">New Password (Instant Manual Reset)</label>
              <input
                id="newPassword"
                type="password"
                className="form-input"
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          )}

          {mode === "login" && (
            <div style={{ textAlign: "right", marginBottom: "1.5rem" }}>
              <button
                type="button"
                onClick={() => changeMode("forgot")}
                style={{ background: "none", border: "none", color: "var(--color-cyan)", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500" }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginBottom: "1.5rem", marginTop: mode === "forgot" ? "1rem" : "0" }} disabled={loading}>
            {loading
              ? "Processing..."
              : mode === "signup"
              ? "Sign Up"
              : mode === "forgot"
              ? newPassword ? "Reset Password Instantly" : "Send Reset Link"
              : "Log In"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          {mode === "forgot" ? (
            <span>
              Remember your password?{" "}
              <button
                onClick={() => changeMode("login")}
                style={{ background: "none", border: "none", color: "var(--color-cyan)", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }}
              >
                Log In
              </button>
            </span>
          ) : (
            <span>
              {mode === "signup" ? "Already have an account? " : "New to EdgeTalent? "}
              <button 
                onClick={() => changeMode(mode === "signup" ? "login" : "signup")}
                style={{ background: "none", border: "none", color: "var(--color-cyan)", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }}
              >
                {mode === "signup" ? "Log In" : "Register"}
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

