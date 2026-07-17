import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { FundingOpportunitySchema } from "@edgetalent/shared";

export default function AdminFunding(): React.ReactElement {
  const { supabase } = useSupabase();

  const [fundingOpportunities, setFundingOpportunities] = useState<any[]>([]);
  const [loadingFunding, setLoadingFunding] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });

  // Funding Form fields
  const [fundingTitle, setFundingTitle] = useState("");
  const [fundingDescription, setFundingDescription] = useState("");
  const [fundingContent, setFundingContent] = useState("");
  const [fundingAmount, setFundingAmount] = useState("");
  const [fundingEligibility, setFundingEligibility] = useState("");
  const [fundingDeadline, setFundingDeadline] = useState("");
  const [fundingLink, setFundingLink] = useState("");
  const [fundingCategory, setFundingCategory] = useState<"Grants" | "Equity/VC" | "Accelerators" | "Loans/Debt">("Grants");

  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<"funding" | null>(null);

  const showStatus = (text: string, type: "success" | "error") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: "", type: "" }), 4000);
  };

  const fetchFundingOpportunities = useCallback(async () => {
    setLoadingFunding(true);
    try {
      const { data, error } = await supabase
        .from("funding_opportunities")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setFundingOpportunities(data);
      } else {
        showStatus("Failed to load funding: " + error?.message, "error");
      }
    } catch (e: any) {
      showStatus("Funding error: " + e.message, "error");
    } finally {
      setLoadingFunding(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchFundingOpportunities();
  }, [fetchFundingOpportunities]);

  const handleOpenFundingAdd = () => {
    setEditMode(false);
    setSelectedId(null);
    setFundingTitle("");
    setFundingDescription("");
    setFundingContent("");
    setFundingAmount("");
    setFundingEligibility("");
    setFundingDeadline("");
    setFundingLink("");
    setFundingCategory("Grants");
    setActiveModal("funding");
  };

  const handleOpenFundingEdit = (opp: any) => {
    setEditMode(true);
    setSelectedId(opp.id);
    setFundingTitle(opp.title);
    setFundingDescription(opp.description);
    setFundingContent(opp.content);
    setFundingAmount(opp.amount || "");
    setFundingEligibility(opp.eligibility || "");
    setFundingDeadline(opp.deadline || "");
    setFundingLink(opp.link || "");
    setFundingCategory(opp.category);
    setActiveModal("funding");
  };

  const handleSaveFunding = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: fundingTitle,
      description: fundingDescription,
      content: fundingContent,
      amount: fundingAmount || null,
      eligibility: fundingEligibility || null,
      deadline: fundingDeadline || null,
      link: fundingLink || null,
      category: fundingCategory,
    };

    const validate = FundingOpportunitySchema.safeParse(payload);
    if (!validate.success) {
      showStatus("Validation Error: " + validate.error.errors[0].message, "error");
      return;
    }

    try {
      let error;
      if (editMode && selectedId) {
        const { error: err } = await supabase
          .from("funding_opportunities")
          .update(payload)
          .eq("id", selectedId);
        error = err;
      } else {
        const { error: err } = await supabase.from("funding_opportunities").insert(payload);
        error = err;
      }

      if (error) {
        showStatus("Saving funding opportunity failed: " + error.message, "error");
      } else {
        showStatus(editMode ? "Funding opportunity updated successfully!" : "Funding opportunity created successfully!", "success");
        setActiveModal(null);
        fetchFundingOpportunities();
      }
    } catch (e: any) {
      showStatus("Save error: " + e.message, "error");
    }
  };

  const handleDeleteFunding = async (oppId: string) => {
    if (!window.confirm("Are you sure you want to delete this funding opportunity?")) return;
    try {
      const { error } = await supabase.from("funding_opportunities").delete().eq("id", oppId);
      if (error) {
        showStatus("Delete failed: " + error.message, "error");
      } else {
        showStatus("Funding opportunity deleted successfully!", "success");
        fetchFundingOpportunities();
      }
    } catch (e: any) {
      showStatus("Delete error: " + e.message, "error");
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1.5rem" }}>
        <div>
          <h3 style={{ fontSize: "1.5rem", margin: 0 }}>Funding Opportunities</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
            Create and manage entrepreneurship funding opportunities, grants, accelerators, and loans.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenFundingAdd}>
          + Add Funding Opportunity
        </button>
      </div>

      {statusMsg.text && (
        <div className={`badge ${statusMsg.type === "error" ? "badge-rose" : "badge-emerald"}`} style={{ display: "block", padding: "0.8rem", textAlign: "center", marginBottom: "1.5rem" }}>
          {statusMsg.text}
        </div>
      )}

      {loadingFunding ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading opportunities...</p>
      ) : fundingOpportunities.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No funding opportunities found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <th style={{ padding: "1rem" }}>Title</th>
                <th style={{ padding: "1rem" }}>Category</th>
                <th style={{ padding: "1rem" }}>Amount</th>
                <th style={{ padding: "1rem" }}>Deadline</th>
                <th style={{ padding: "1rem" }}>Eligibility</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fundingOpportunities.map((opp) => (
                <tr key={opp.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <td style={{ padding: "1rem", fontWeight: "600" }}>{opp.title}</td>
                  <td style={{ padding: "1rem" }}>
                    <span className={`badge ${
                      opp.category === "Grants" ? "badge-emerald" :
                      opp.category === "Accelerators" ? "badge-purple" :
                      opp.category === "Equity/VC" ? "badge-cyan" : "badge-amber"
                    }`} style={{ fontSize: "0.75rem" }}>
                      {opp.category}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>{opp.amount || "N/A"}</td>
                  <td style={{ padding: "1rem", color: "var(--color-rose)" }}>{opp.deadline || "N/A"}</td>
                  <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {opp.eligibility ? (opp.eligibility.length > 50 ? opp.eligibility.slice(0, 50) + "..." : opp.eligibility) : "N/A"}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                      <button className="btn btn-secondary" onClick={() => handleOpenFundingEdit(opp)} style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                        Edit
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleDeleteFunding(opp.id)}
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", color: "var(--color-rose)" }}
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

      {/* Funding Modal Form */}
      {activeModal === "funding" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
        >
          <div className="glass-panel animate-fade-in" style={{ width: "90%", maxWidth: "600px", padding: "2.5rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.5rem", margin: 0 }}>
                {editMode ? "Edit Funding Opportunity" : "Add Funding Opportunity"}
              </h3>
              <button
                className="btn-close"
                style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer" }}
                onClick={() => setActiveModal(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveFunding} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label>Opportunity Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Y Combinator W27 Program"
                  value={fundingTitle}
                  onChange={(e) => setFundingTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={fundingCategory}
                  onChange={(e: any) => setFundingCategory(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="Grants">Grants</option>
                  <option value="Equity/VC">Equity/VC</option>
                  <option value="Accelerators">Accelerators</option>
                  <option value="Loans/Debt">Loans/Debt</option>
                </select>
              </div>

              <div className="form-group">
                <label>Short Description *</label>
                <input
                  type="text"
                  placeholder="Brief 1-sentence summary of the program"
                  value={fundingDescription}
                  onChange={(e) => setFundingDescription(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Full Program Content / Details *</label>
                <textarea
                  rows={5}
                  placeholder="Detailed explanation of the program, terms, and perks..."
                  value={fundingContent}
                  onChange={(e) => setFundingContent(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Funding Amount</label>
                <input
                  type="text"
                  placeholder="e.g. $500,000 or Up to $100k equity-free"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Eligibility Requirements</label>
                <input
                  type="text"
                  placeholder="e.g. Tech startups, under 22 founders, US businesses"
                  value={fundingEligibility}
                  onChange={(e) => setFundingEligibility(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Application Deadline</label>
                <input
                  type="text"
                  placeholder="e.g. September 15, 2026 or Rolling"
                  value={fundingDeadline}
                  onChange={(e) => setFundingDeadline(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Official Application Link / URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/apply"
                  value={fundingLink}
                  onChange={(e) => setFundingLink(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editMode ? "Save Changes" : "Create Opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
