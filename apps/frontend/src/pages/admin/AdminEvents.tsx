import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { EventSchema } from "@edgetalent/shared";

interface EventItem {
  id: string;
  title: string;
  description: string;
  content: string;
  event_date: string;
  location: string;
  organizer: string;
  organizer_id: string | null;
  category: "Hackathon" | "Webinar" | "Workshop" | "Networking" | "Pitch Night";
  capacity: number | null;
  link: string | null;
  created_at: string;
}

export default function AdminEvents(): React.ReactElement {
  const { supabase, profile } = useSupabase();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });

  // Event Form fields
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventContent, setEventContent] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventOrganizer, setEventOrganizer] = useState("");
  const [eventCategory, setEventCategory] = useState<"Hackathon" | "Webinar" | "Workshop" | "Networking" | "Pitch Night">("Workshop");
  const [eventCapacity, setEventCapacity] = useState("");
  const [eventLink, setEventLink] = useState("");

  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<"event" | null>(null);

  const showStatus = (text: string, type: "success" | "error") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: "", type: "" }), 4000);
  };

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (!error && data) {
        setEvents(data as EventItem[]);
      } else {
        showStatus("Failed to load events: " + error?.message, "error");
      }
    } catch (e: any) {
      showStatus("Events error: " + e.message, "error");
    } finally {
      setLoadingEvents(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleOpenEventAdd = () => {
    setEditMode(false);
    setSelectedId(null);
    setEventTitle("");
    setEventDescription("");
    setEventContent("");
    setEventDate("");
    setEventLocation("");
    setEventOrganizer("");
    setEventCategory("Workshop");
    setEventCapacity("");
    setEventLink("");
    setActiveModal("event");
  };

  const handleOpenEventEdit = (evt: EventItem) => {
    setEditMode(true);
    setSelectedId(evt.id);
    setEventTitle(evt.title);
    setEventDescription(evt.description);
    setEventContent(evt.content);
    let formattedDate = "";
    if (evt.event_date) {
      const d = new Date(evt.event_date);
      const offset = d.getTimezoneOffset();
      const localDate = new Date(d.getTime() - (offset * 60 * 1000));
      formattedDate = localDate.toISOString().slice(0, 16);
    }
    setEventDate(formattedDate);
    setEventLocation(evt.location);
    setEventOrganizer(evt.organizer);
    setEventCategory(evt.category);
    setEventCapacity(evt.capacity !== null ? evt.capacity.toString() : "");
    setEventLink(evt.link || "");
    setActiveModal("event");
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: eventTitle,
      description: eventDescription,
      content: eventContent,
      event_date: eventDate ? new Date(eventDate).toISOString() : "",
      location: eventLocation,
      organizer: eventOrganizer,
      category: eventCategory,
      capacity: eventCapacity ? parseInt(eventCapacity, 10) : null,
      link: eventLink || null,
      organizer_id: profile?.id || null
    };

    const validate = EventSchema.safeParse(payload);
    if (!validate.success) {
      showStatus("Validation Error: " + validate.error.errors[0].message, "error");
      return;
    }

    try {
      let error;
      if (editMode && selectedId) {
        const { error: err } = await supabase
          .from("events")
          .update(payload)
          .eq("id", selectedId);
        error = err;
      } else {
        const { error: err } = await supabase.from("events").insert(payload);
        error = err;
      }

      if (error) {
        showStatus("Saving event failed: " + error.message, "error");
      } else {
        showStatus(editMode ? "Event updated successfully!" : "Event created successfully!", "success");
        setActiveModal(null);
        fetchEvents();
      }
    } catch (e: any) {
      showStatus("Save error: " + e.message, "error");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event? This will cascade delete registrations.")) return;
    try {
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) {
        showStatus("Delete failed: " + error.message, "error");
      } else {
        showStatus("Event deleted successfully!", "success");
        fetchEvents();
      }
    } catch (e: any) {
      showStatus("Delete error: " + e.message, "error");
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1.5rem" }}>
        <div>
          <h3 style={{ fontSize: "1.5rem", margin: 0 }}>Events & Workshops</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
            Create and manage community tech events, hackathons, webinars, workshops, and pitch nights.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenEventAdd}>
          + Add New Event
        </button>
      </div>

      {statusMsg.text && (
        <div className={`badge ${statusMsg.type === "error" ? "badge-rose" : "badge-emerald"}`} style={{ display: "block", padding: "0.8rem", textAlign: "center", marginBottom: "1.5rem" }}>
          {statusMsg.text}
        </div>
      )}

      {loadingEvents ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading events...</p>
      ) : events.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No events found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <th style={{ padding: "1rem" }}>Title</th>
                <th style={{ padding: "1rem" }}>Category</th>
                <th style={{ padding: "1rem" }}>Organizer</th>
                <th style={{ padding: "1rem" }}>Date & Time</th>
                <th style={{ padding: "1rem" }}>Location</th>
                <th style={{ padding: "1rem" }}>Capacity</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => (
                <tr key={evt.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <td style={{ padding: "1rem", fontWeight: "600" }}>{evt.title}</td>
                  <td style={{ padding: "1rem" }}>
                    <span className={`badge ${
                      evt.category === "Hackathon" ? "badge-rose" :
                      evt.category === "Webinar" ? "badge-purple" :
                      evt.category === "Workshop" ? "badge-cyan" :
                      evt.category === "Networking" ? "badge-emerald" : "badge-amber"
                    }`} style={{ fontSize: "0.75rem" }}>
                      {evt.category}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>{evt.organizer}</td>
                  <td style={{ padding: "1rem", color: "var(--color-cyan)" }}>
                    {new Date(evt.event_date).toLocaleString()}
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {evt.location}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {evt.capacity ? evt.capacity : "Unlimited"}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                      <button className="btn btn-secondary" onClick={() => handleOpenEventEdit(evt)} style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                        Edit
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleDeleteEvent(evt.id)}
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

      {/* Event Modal Form */}
      {activeModal === "event" && (
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
                {editMode ? "Edit Event" : "Create New Event"}
              </h3>
              <button
                className="btn-close"
                style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer" }}
                onClick={() => setActiveModal(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEvent} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  placeholder="e.g. EdgeTalent AI Hackathon"
                  className="form-input"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={eventCategory}
                  onChange={(e: any) => setEventCategory(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="Hackathon">Hackathon</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Networking">Networking</option>
                  <option value="Pitch Night">Pitch Night</option>
                </select>
              </div>

              <div className="form-group">
                <label>Organizer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. EdgeTalent Foundation"
                  className="form-input"
                  value={eventOrganizer}
                  onChange={(e) => setEventOrganizer(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Short Description *</label>
                <input
                  type="text"
                  placeholder="Brief 1-sentence summary of the event"
                  className="form-input"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Full Event Details *</label>
                <textarea
                  rows={4}
                  placeholder="Describe the event itinerary, speakers, and topics..."
                  className="form-input"
                  value={eventContent}
                  onChange={(e) => setEventContent(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    placeholder="e.g. Zoom or Jakarta Office"
                    className="form-input"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Capacity (Leave empty for unlimited)</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    className="form-input"
                    value={eventCapacity}
                    onChange={(e) => setEventCapacity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Event Website Link / Registration Link</label>
                  <input
                    type="url"
                    placeholder="https://example.com/register"
                    className="form-input"
                    value={eventLink}
                    onChange={(e) => setEventLink(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editMode ? "Save Changes" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
