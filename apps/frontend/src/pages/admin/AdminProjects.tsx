import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { ProjectSchema } from "@edgetalent/shared";
import Modal from "../../components/Modal";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: "talent" | "partner" | "admin" | null;
  skills: string[];
  skill_gaps: string[];
  created_at: string;
}

interface ProjectItem {
  id: string;
  partner_id: string;
  title: string;
  description: string;
  required_skills: string[];
  budget: number | null;
  scope: "short-term" | "medium-term" | "long-term";
  created_at: string;
}

export default function AdminProjects(): React.ReactElement {
  const { supabase } = useSupabase();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });

  // Project Form Fields
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectSkills, setProjectSkills] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [projectScope, setProjectScope] = useState<"short-term" | "medium-term" | "long-term">("medium-term");
  const [projectPartnerId, setProjectPartnerId] = useState("");
  
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<"project" | null>(null);

  const showStatus = (text: string, type: "success" | "error") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: "", type: "" }), 4000);
  };

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProjects(data as ProjectItem[]);
      } else {
        showStatus("Failed to load job listings: " + error?.message, "error");
      }
    } catch (e: any) {
      showStatus("Projects error: " + e.message, "error");
    } finally {
      setLoadingProjects(false);
    }
  }, [supabase]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setUsers(data as UserProfile[]);
      }
    } catch (e: any) {
      console.error(e);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [fetchProjects, fetchUsers]);

  const openProjectModal = (proj?: ProjectItem) => {
    const defaultPartner = users.find((u) => u.role === "partner")?.id || "";

    if (proj) {
      setEditMode(true);
      setSelectedId(proj.id);
      setProjectTitle(proj.title);
      setProjectDesc(proj.description);
      setProjectSkills(proj.required_skills.join(", "));
      setProjectBudget(proj.budget !== null ? proj.budget.toString() : "");
      setProjectScope(proj.scope);
      setProjectPartnerId(proj.partner_id);
    } else {
      setEditMode(false);
      setSelectedId(null);
      setProjectTitle("");
      setProjectDesc("");
      setProjectSkills("");
      setProjectBudget("");
      setProjectScope("medium-term");
      setProjectPartnerId(defaultPartner);
    }
    setActiveModal("project");
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = projectSkills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      title: projectTitle,
      description: projectDesc,
      required_skills: skillsArray,
      budget: projectBudget ? parseFloat(projectBudget) : null,
      scope: projectScope,
      partner_id: projectPartnerId,
    };

    const validate = ProjectSchema.safeParse(payload);
    if (!validate.success) {
      showStatus("Validation Error: " + validate.error.errors[0].message, "error");
      return;
    }

    try {
      let error;
      if (editMode && selectedId) {
        const { error: err } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", selectedId);
        error = err;
      } else {
        const { error: err } = await supabase.from("projects").insert(payload);
        error = err;
      }

      if (error) {
        showStatus("Saving project failed: " + error.message, "error");
      } else {
        showStatus(editMode ? "Project updated successfully!" : "Project created successfully!", "success");
        setActiveModal(null);
        fetchProjects();
      }
    } catch (e: any) {
      showStatus("Save error: " + e.message, "error");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Are you sure you want to delete this project listing?")) return;
    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) {
        showStatus("Delete project failed: " + error.message, "error");
      } else {
        showStatus("Project deleted successfully!", "success");
        fetchProjects();
      }
    } catch (e: any) {
      showStatus("Delete error: " + e.message, "error");
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: 0 }}>Job Marketplace Listings</h3>
        <button className="btn btn-primary" onClick={() => openProjectModal()}>
          Add Project / Job
        </button>
      </div>

      {statusMsg.text && (
        <div className={`badge ${statusMsg.type === "error" ? "badge-rose" : "badge-emerald"}`} style={{ display: "block", padding: "0.8rem", textAlign: "center", marginBottom: "1.5rem" }}>
          {statusMsg.text}
        </div>
      )}

      {loadingProjects ? (
        <p>Loading projects...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "1rem" }}>Title</th>
                <th style={{ padding: "1rem" }}>Budget</th>
                <th style={{ padding: "1rem" }}>Scope</th>
                <th style={{ padding: "1rem" }}>Required Skills</th>
                <th style={{ padding: "1rem" }}>Partner/Company</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const company = users.find((u) => u.id === p.partner_id);
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "1rem", fontWeight: 600 }}>{p.title}</td>
                    <td style={{ padding: "1rem", color: "var(--color-emerald)", fontWeight: 600 }}>
                      {p.budget ? `$${p.budget.toLocaleString()}` : "N/A"}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className="badge badge-secondary" style={{ textTransform: "uppercase" }}>
                        {p.scope}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                        {p.required_skills.map((s, idx) => (
                          <span key={idx} className="badge badge-cyan" style={{ fontSize: "0.75rem" }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.9rem" }}>
                      {company ? company.full_name : "Unknown Partner"}
                      <br />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.partner_id.slice(0, 8)}...</span>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button className="btn btn-secondary" onClick={() => openProjectModal(p)} style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleDeleteProject(p.id)}
                          style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", color: "var(--color-rose)" }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Project Modal Form */}
      <Modal
        isOpen={activeModal === "project"}
        onClose={() => setActiveModal(null)}
        title={editMode ? "Edit Project Details" : "Publish New Project"}
        size="md"
      >
        <form onSubmit={handleSaveProject}>
          <div className="form-group">
            <label>Project Title</label>
            <input
              type="text"
              required
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="form-input"
              placeholder="e.g. Build an Admin Panel"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              required
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              className="form-input"
              placeholder="Detail project specifications and parameters..."
              style={{ minHeight: "80px" }}
            />
          </div>
          <div className="form-group">
            <label>Required Skills (comma-separated list)</label>
            <input
              type="text"
              value={projectSkills}
              onChange={(e) => setProjectSkills(e.target.value)}
              className="form-input"
              placeholder="React, Supabase, pgvector"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Budget (USD)</label>
              <input
                type="number"
                value={projectBudget}
                onChange={(e) => setProjectBudget(e.target.value)}
                className="form-input"
                placeholder="e.g. 2500"
              />
            </div>
            <div className="form-group">
              <label>Project Scope</label>
              <select
                value={projectScope}
                onChange={(e) => setProjectScope(e.target.value as any)}
                className="form-input"
              >
                <option value="short-term">Short-term</option>
                <option value="medium-term">Medium-term</option>
                <option value="long-term">Long-term</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Belongs to Corporate Partner / Company</label>
            <select
              required
              value={projectPartnerId}
              onChange={(e) => setProjectPartnerId(e.target.value)}
              className="form-input"
            >
              <option value="">-- Select Partner --</option>
              {users
                .filter((u) => u.role === "partner")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email} ({p.id.slice(0, 8)})
                  </option>
                ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {editMode ? "Save Changes" : "Publish Job"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
