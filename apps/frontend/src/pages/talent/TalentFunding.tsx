import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { FundingOpportunity } from "@edgetalent/shared";

export default function TalentFunding(): React.ReactElement {
  const { supabase, profile } = useSupabase();

  const [fundingOpportunities, setFundingOpportunities] = useState<FundingOpportunity[]>([]);
  const [loadingFunding, setLoadingFunding] = useState<boolean>(false);
  const [searchFundingQuery, setSearchFundingQuery] = useState<string>("");
  const [selectedFundingCategory, setSelectedFundingCategory] = useState<string>("All");
  
  // Modal states
  const [selectedOpportunity, setSelectedOpportunity] = useState<FundingOpportunity | null>(null);
  const [showOpportunityModal, setShowOpportunityModal] = useState<boolean>(false);

  const loadFundingOpportunities = useCallback(async () => {
    setLoadingFunding(true);
    try {
      const { data, error } = await supabase
        .from("funding_opportunities")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setFundingOpportunities(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFunding(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadFundingOpportunities();
  }, [loadFundingOpportunities]);

  const filtered = fundingOpportunities.filter((opp) => {
    const matchCat = selectedFundingCategory === "All" || opp.category === selectedFundingCategory;
    const matchQuery = opp.title.toLowerCase().includes(searchFundingQuery.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchFundingQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Hero Header */}
      <div className="glass-panel" style={{ padding: "2.5rem 2rem", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "4px", background: "var(--grad-cyan-purple)" }} />
        <h3 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "700" }}>Funding & Grants Hub</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", margin: 0, maxWidth: "700px" }}>
          Explore capital financing, accelerators, government research grants, and equity financing opportunities curated for tech entrepreneurs and startups.
        </p>
      </div>

      {/* Filters & Search Panel */}
      <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["All", "Grants", "Accelerators", "Equity/VC", "Loans/Debt"].map((cat) => (
            <button
              key={cat}
              className={`badge ${selectedFundingCategory === cat ? "badge-cyan" : "badge-neutral"}`}
              style={{ cursor: "pointer", border: "none", padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "100px", transition: "all 0.2s" }}
              onClick={() => setSelectedFundingCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", width: "100%", maxWidth: "320px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search opportunities..."
            className="form-input"
            style={{ paddingRight: "2.5rem", margin: 0 }}
            value={searchFundingQuery}
            onChange={(e) => setSearchFundingQuery(e.target.value)}
          />
          <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>🔍</span>
        </div>
      </div>

      {/* Funding Grid */}
      {loadingFunding ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading funding opportunities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No funding opportunities matched your criteria.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          {filtered.map((opp) => {
            // Profile fit mock calculation
            let fitPercent = 0;
            if (profile && profile.skills) {
              const userSkills = profile.skills.map((s: string) => s.toLowerCase());
              const text = (opp.title + " " + opp.description + " " + opp.content).toLowerCase();
              let matches = 0;
              userSkills.forEach((s: string) => {
                if (text.includes(s)) matches++;
              });
              fitPercent = userSkills.length > 0 ? Math.min(100, Math.round(40 + (matches / userSkills.length) * 60)) : 50;
            } else {
              fitPercent = 50;
            }

            return (
              <div key={opp.id} className="glass-panel animate-fade-in" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.5rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span className={`badge ${
                      opp.category === "Grants" ? "badge-emerald" :
                      opp.category === "Accelerators" ? "badge-purple" :
                      opp.category === "Equity/VC" ? "badge-cyan" : "badge-amber"
                    }`} style={{ fontSize: "0.75rem" }}>
                      {opp.category}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Profile Fit:</span>
                      <span className={`badge ${fitPercent >= 75 ? "badge-emerald" : fitPercent >= 50 ? "badge-cyan" : "badge-rose"}`} style={{ fontSize: "0.7rem", padding: "0.1rem 0.3rem" }}>
                        {fitPercent}%
                      </span>
                    </div>
                  </div>
                  <h4 style={{ fontSize: "1.2rem", margin: "0 0 0.5rem 0", fontWeight: "600" }}>{opp.title}</h4>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0 0 1.25rem 0", lineHeight: "1.5" }}>{opp.description}</p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem", borderTop: "1px solid var(--glass-border)", paddingTop: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Amount:</span>
                      <span style={{ fontWeight: "600" }}>{opp.amount || "N/A"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Deadline:</span>
                      <span style={{ fontWeight: "600", color: "var(--color-rose)" }}>{opp.deadline || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "0.6rem" }}
                  onClick={() => {
                    setSelectedOpportunity(opp);
                    setShowOpportunityModal(true);
                  }}
                >
                  Read Details & Apply
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Funding Opportunity Detail Modal */}
      {showOpportunityModal && selectedOpportunity && (
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
          onClick={() => setShowOpportunityModal(false)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: "90%",
              maxWidth: "650px",
              padding: "2.5rem",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <span className={`badge ${
                  selectedOpportunity.category === "Grants" ? "badge-emerald" :
                  selectedOpportunity.category === "Accelerators" ? "badge-purple" :
                  selectedOpportunity.category === "Equity/VC" ? "badge-cyan" : "badge-amber"
                }`} style={{ fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                  {selectedOpportunity.category}
                </span>
                <h3 style={{ fontSize: "1.5rem", margin: 0, fontWeight: "700" }}>{selectedOpportunity.title}</h3>
              </div>
              <button
                className="btn-close"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: 0
                }}
                onClick={() => setShowOpportunityModal(false)}
              >
                &times;
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>Program Description</h4>
                <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0 }}>
                  {selectedOpportunity.content}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "rgba(255, 255, 255, 0.03)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Funding Amount</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)" }}>{selectedOpportunity.amount || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Application Deadline</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--color-rose)" }}>{selectedOpportunity.deadline || "N/A"}</span>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Eligibility Criteria</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)", display: "block" }}>{selectedOpportunity.eligibility || "N/A"}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowOpportunityModal(false)}
                >
                  Close
                </button>
                {selectedOpportunity.link && (
                  <a
                    href={selectedOpportunity.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ flex: 1, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    Apply on Official Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
