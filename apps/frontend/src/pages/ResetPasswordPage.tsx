import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabase } from "../context/SupabaseContext";
import { ResetPasswordSchema } from "@edgetalent/shared";
import { KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage(): React.ReactElement {
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // Validate input using Zod schema
      const validationResult = ResetPasswordSchema.safeParse({ password, confirmPassword });
      if (!validationResult.success) {
        throw new Error(validationResult.error.errors[0].message);
      }

      // Update password via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password. Please try again or request a new reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "2rem" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "450px", padding: "2.5rem 2rem", position: "relative" }}>
        
        <button 
          onClick={() => navigate("/auth")}
          style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.375rem", marginBottom: "1.5rem" }}
        >
          <ArrowLeft size={16} /> Back to Login
        </button>

        {isSuccess ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              marginBottom: "1.25rem"
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              Password Reset Complete
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "2rem" }}>
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <KeyRound size={24} style={{ color: "var(--color-cyan)" }} />
              <h2 style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
                Reset Your Password
              </h2>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "2rem" }}>
              Enter a new secure password for your account.
            </p>

            {errorMsg && (
              <div className="badge badge-rose" style={{ display: "block", padding: "0.8rem", width: "100%", borderRadius: "var(--radius-sm)", marginBottom: "1.5rem", textAlign: "center" }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "2rem" }}>
                <label htmlFor="confirm-password">Confirm New Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: "100%", marginBottom: "1rem" }} 
                disabled={loading}
              >
                {loading ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
