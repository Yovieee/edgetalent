import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../../context/SupabaseContext";

export default function TalentEvents(): React.ReactElement {
  const { supabase, profile } = useSupabase();

  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
  
  // Search & Filter state
  const [searchEventQuery, setSearchEventQuery] = useState<string>("");
  const [selectedEventCategory, setSelectedEventCategory] = useState<string>("All");
  
  // Modal & Loading state
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showEventDetailModal, setShowEventDetailModal] = useState<boolean>(false);
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);

  const profileId = profile?.id;

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });
      if (!error && data) {
        setEvents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvents(false);
    }
  }, [supabase]);

  const loadEventRegistrations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*");
      if (!error && data) {
        setAllRegistrations(data);
        if (profileId) {
          setEventRegistrations(data.filter((r: any) => r.user_id === profileId));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [profileId, supabase]);

  useEffect(() => {
    loadEvents();
    loadEventRegistrations();
  }, [loadEvents, loadEventRegistrations]);

  const handleEventRSVP = async (eventId: string) => {
    if (!profileId) return;

    const eventObj = events.find(e => e.id === eventId);
    const existingRegistration = eventRegistrations.find(r => r.event_id === eventId);
    
    if (eventObj && eventObj.capacity && !existingRegistration) {
      const currentRSVPs = allRegistrations.filter(r => r.event_id === eventId).length;
      if (currentRSVPs >= eventObj.capacity) {
        alert("Sorry, this event has already reached its capacity limit!");
        return;
      }
    }

    setRegisteringEventId(eventId);
    try {
      if (existingRegistration) {
        const { error } = await supabase
          .from("event_registrations")
          .delete()
          .eq("id", existingRegistration.id);
        
        if (error) throw error;
        
        setEventRegistrations(prev => prev.filter(r => r.id !== existingRegistration.id));
        setAllRegistrations(prev => prev.filter(r => r.id !== existingRegistration.id));
      } else {
        const { data, error } = await supabase
          .from("event_registrations")
          .insert({
            event_id: eventId,
            user_id: profileId
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setEventRegistrations(prev => [...prev, data]);
          setAllRegistrations(prev => [...prev, data]);
        }
      }
    } catch (e: any) {
      console.error(e);
      alert("Failed to update RSVP status: " + e.message);
    } finally {
      setRegisteringEventId(null);
    }
  };

  const filtered = events.filter((evt) => {
    const matchCat = selectedEventCategory === "All" || evt.category === selectedEventCategory;
    const matchQuery = evt.title.toLowerCase().includes(searchEventQuery.trim().toLowerCase()) ||
      evt.description.toLowerCase().includes(searchEventQuery.trim().toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Hero Header */}
      <div className="glass-panel" style={{ padding: "2.5rem 2rem", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "4px", background: "var(--grad-cyan-purple)" }} />
        <h3 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "700" }}>Events & Workshops</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", margin: 0, maxWidth: "700px" }}>
          Join webinars, hackathons, and interactive networking nights hosted by industry leaders and community organizers.
        </p>
      </div>

      {/* Filters & Search Panel */}
      <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["All", "Hackathon", "Webinar", "Workshop", "Networking", "Pitch Night"].map((cat) => (
            <button
              key={cat}
              className={`badge ${selectedEventCategory === cat ? "badge-cyan" : "badge-neutral"}`}
              style={{ cursor: "pointer", border: "none", padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "100px", transition: "all 0.2s" }}
              onClick={() => setSelectedEventCategory(cat)}
            >
              {cat === "All" ? "All Events" : cat}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", width: "100%", maxWidth: "320px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search events..."
            className="form-input"
            style={{ paddingRight: "2.5rem", margin: 0 }}
            value={searchEventQuery}
            onChange={(e) => setSearchEventQuery(e.target.value)}
          />
          <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>🔍</span>
        </div>
      </div>

      {/* Events Grid */}
      {loadingEvents ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading upcoming events...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No upcoming events matched your criteria.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          {filtered.map((evt) => {
            const isRegistered = eventRegistrations.some((reg) => reg.event_id === evt.id);
            const registeredCount = allRegistrations.filter((r) => r.event_id === evt.id).length;
            const isFull = evt.capacity ? registeredCount >= evt.capacity : false;
            const capacityText = evt.capacity
              ? `${registeredCount} / ${evt.capacity} registered ${isFull ? "(Full)" : ""}`
              : `${registeredCount} registered (Unlimited)`;

            return (
              <div key={evt.id} className="glass-panel animate-fade-in" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.5rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span className={`badge ${
                      evt.category === "Hackathon" ? "badge-rose" :
                      evt.category === "Webinar" ? "badge-purple" :
                      evt.category === "Workshop" ? "badge-cyan" :
                      evt.category === "Networking" ? "badge-emerald" : "badge-amber"
                    }`} style={{ fontSize: "0.75rem" }}>
                      {evt.category}
                    </span>
                    {isRegistered && (
                      <span className="badge badge-emerald" style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem" }}>
                        ✓ Registered
                      </span>
                    )}
                    {!isRegistered && isFull && (
                      <span className="badge badge-rose" style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem" }}>
                        Full
                      </span>
                    )}
                  </div>
                  <h4 style={{ fontSize: "1.2rem", margin: "0 0 0.5rem 0", fontWeight: "600" }}>{evt.title}</h4>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0 0 1.25rem 0", lineHeight: "1.5" }}>{evt.description}</p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem", borderTop: "1px solid var(--glass-border)", paddingTop: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Date & Time:</span>
                      <span style={{ fontWeight: "600", color: "var(--color-cyan)" }}>{new Date(evt.event_date).toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Location:</span>
                      <span style={{ fontWeight: "600" }}>{evt.location}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Host:</span>
                      <span style={{ fontWeight: "600" }}>{evt.organizer}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Capacity:</span>
                      <span style={{ fontWeight: "600", color: isFull ? "var(--color-rose)" : "var(--text-muted)" }}>{capacityText}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: "0.6rem" }}
                    onClick={() => {
                      setSelectedEvent(evt);
                      setShowEventDetailModal(true);
                    }}
                  >
                    Details
                  </button>
                  <button
                    className={`btn ${isRegistered ? "btn-secondary" : isFull ? "btn-secondary" : "btn-primary"}`}
                    style={{ flex: 1.5, padding: "0.6rem" }}
                    disabled={registeringEventId === evt.id || (isFull && !isRegistered)}
                    onClick={() => handleEventRSVP(evt.id)}
                  >
                    {registeringEventId === evt.id ? "Loading..." : isRegistered ? "Cancel RSVP" : isFull ? "Full" : "RSVP / Register"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Detail Modal */}
      {showEventDetailModal && selectedEvent && (() => {
        const isRegistered = eventRegistrations.some((reg) => reg.event_id === selectedEvent.id);
        return (
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
            onClick={() => setShowEventDetailModal(false)}
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
                    selectedEvent.category === "Hackathon" ? "badge-rose" :
                    selectedEvent.category === "Webinar" ? "badge-purple" :
                    selectedEvent.category === "Workshop" ? "badge-cyan" :
                    selectedEvent.category === "Networking" ? "badge-emerald" : "badge-amber"
                  }`} style={{ fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                    {selectedEvent.category}
                  </span>
                  <h3 style={{ fontSize: "1.5rem", margin: 0, fontWeight: "700" }}>{selectedEvent.title}</h3>
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
                  onClick={() => setShowEventDetailModal(false)}
                >
                  &times;
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>Event Description</h4>
                  <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0 }}>
                    {selectedEvent.content}
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "rgba(255, 255, 255, 0.03)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Date & Time</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--color-cyan)" }}>{new Date(selectedEvent.event_date).toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Location</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)" }}>{selectedEvent.location}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Organizer</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)" }}>{selectedEvent.organizer}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Capacity Limit</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)" }}>{selectedEvent.capacity ? `${selectedEvent.capacity} spots` : "Unlimited"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setShowEventDetailModal(false)}
                  >
                    Close
                  </button>
                  <button
                    className={`btn ${isRegistered ? "btn-secondary" : "btn-primary"}`}
                    style={{ flex: 1.2 }}
                    disabled={registeringEventId === selectedEvent.id}
                    onClick={() => handleEventRSVP(selectedEvent.id)}
                  >
                    {registeringEventId === selectedEvent.id ? "Processing..." : isRegistered ? "Cancel RSVP" : "RSVP / Register"}
                  </button>
                  {selectedEvent.link && (
                    <a
                      href={selectedEvent.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success"
                      style={{ flex: 1.2, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      Official Page ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
