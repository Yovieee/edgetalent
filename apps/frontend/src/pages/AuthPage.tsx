import React, { useState } from "react";
import { useSupabase } from "../context/SupabaseContext";
import { LoginSchema, RegisterSchema } from "@edgetalent/shared";

interface AuthPageProps {
  onBack: () => void;
}

export default function AuthPage({ onBack }: AuthPageProps): React.ReactElement {
  const { supabase } = useSupabase();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (isSignUp) {
        // Zod validation for register payload
        const validationResult = RegisterSchema.safeParse({ email, password, fullName });
        if (!validationResult.success) {
          throw new Error(validationResult.error.errors[0].message);
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;
        setSuccessMsg("Registration successful! Check your email or try logging in.");
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
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "2rem" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "450px", padding: "2.5rem 2rem", position: "relative" }}>
        
        <button 
          onClick={onBack}
          style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "1.5rem" }}
        >
          ← Back to Home
        </button>

        <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem", background: "var(--grad-cyan-purple)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "2rem" }}>
          {isSignUp ? "Join the EdgeTalent ecosystem today" : "Log in to manage your career or projects"}
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
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={isSignUp}
              />
            </div>
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

          <div className="form-group" style={{ marginBottom: "2rem" }}>
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

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginBottom: "1.5rem" }} disabled={loading}>
            {loading ? "Processing..." : isSignUp ? "Sign Up" : "Log In"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          {isSignUp ? "Already have an account? " : "New to EdgeTalent? "}
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            style={{ background: "none", border: "none", color: "var(--color-cyan)", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }}
          >
            {isSignUp ? "Log In" : "Register"}
          </button>
        </div>

      </div>
    </div>
  );
}
