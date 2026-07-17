import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../../context/SupabaseContext";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: "talent" | "partner" | "admin" | null;
  skills: string[];
  skill_gaps: string[];
  created_at: string;
}

export default function AdminUsers(): React.ReactElement {
  const { supabase, profile } = useSupabase();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [profileMsg, setProfileMsg] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setUsers(data as UserProfile[]);
      } else {
        setIsError(true);
        setProfileMsg("Failed to load users: " + error?.message);
      }
    } catch (e: any) {
      setIsError(true);
      setProfileMsg("Users error: " + e.message);
    } finally {
      setLoadingUsers(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateRole = async (userId: string, newRole: "talent" | "partner" | "admin" | null) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) {
        setIsError(true);
        setProfileMsg("Role update failed: " + error.message);
      } else {
        setIsError(false);
        setProfileMsg("User role updated successfully!");
        fetchUsers();
      }
    } catch (e: any) {
      setIsError(true);
      setProfileMsg("Update error: " + e.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This will also cascade delete their profile, projects, and applications.")) {
      return;
    }
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) {
        setIsError(true);
        setProfileMsg("Delete profile failed: " + error.message);
      } else {
        setIsError(false);
        setProfileMsg("User profile deleted successfully!");
        fetchUsers();
      }
    } catch (e: any) {
      setIsError(true);
      setProfileMsg("Delete error: " + e.message);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
      <h3 style={{ marginBottom: "1.5rem" }}>Users Accounts Profiles</h3>

      {profileMsg && (
        <div className={`badge ${isError ? "badge-rose" : "badge-emerald"}`} style={{ display: "block", padding: "0.8rem", textAlign: "center", marginBottom: "1.5rem" }}>
          {profileMsg}
        </div>
      )}

      {loadingUsers ? (
        <p>Loading users list...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "1rem" }}>Name</th>
                <th style={{ padding: "1rem" }}>Email</th>
                <th style={{ padding: "1rem" }}>Role</th>
                <th style={{ padding: "1rem" }}>Skills</th>
                <th style={{ padding: "1rem" }}>Created At</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <td style={{ padding: "1rem", fontWeight: 600 }}>{u.full_name || "N/A"}</td>
                  <td style={{ padding: "1rem" }}>{u.email}</td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      className={`badge ${
                        u.role === "admin"
                          ? "badge-rose"
                          : u.role === "partner"
                          ? "badge-emerald"
                          : u.role === "talent"
                          ? "badge-cyan"
                          : "badge-secondary"
                      }`}
                      style={{ textTransform: "uppercase" }}
                    >
                      {u.role || "No Role"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {u.skills && u.skills.length > 0 ? (
                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                        {u.skills.slice(0, 3).map((s, i) => (
                          <span key={i} className="badge badge-secondary" style={{ fontSize: "0.75rem" }}>
                            {s}
                          </span>
                        ))}
                        {u.skills.length > 3 && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>+{u.skills.length - 3} more</span>}
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>None</span>
                    )}
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                      <select
                        value={u.role || ""}
                        onChange={(e) => handleUpdateRole(u.id, (e.target.value || null) as any)}
                        className="form-input"
                        style={{ padding: "0.3rem 0.5rem", fontSize: "0.85rem", width: "110px", margin: 0 }}
                        disabled={u.id === profile?.id}
                      >
                        <option value="">Unassigned</option>
                        <option value="talent">Talent</option>
                        <option value="partner">Partner</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleDeleteUser(u.id)}
                        style={{ padding: "0.3rem 0.6rem", color: "var(--color-rose)" }}
                        disabled={u.id === profile?.id}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
