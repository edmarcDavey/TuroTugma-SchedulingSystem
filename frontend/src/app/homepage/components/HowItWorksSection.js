import React from "react";

export default function HowItWorksSection() {
  return (
    <section style={{ background: "#f4f8fc", position: "relative", padding: "64px 0" }}>
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ color: "#1a3a8c", fontWeight: 700, fontSize: 14, marginBottom: 12, letterSpacing: 1 }}>
            THE PROCESS
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, color: "#1a2536", marginBottom: 0 }}>
            From profiles to
          </div>
          <div style={{ fontSize: 38, fontFamily: "serif", fontStyle: "italic", fontWeight: 500, color: "#1a2536", marginBottom: 8 }}>
            finalized timetable.
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", gap: 32, justifyContent: "center" }}>
          {/* Horizontal line behind cards */}
          <div style={{ position: "absolute", top: 40, left: 0, right: 0, height: 1, background: "linear-gradient(to right, #1a3a8c22 0%, #1a3a8c66 50%, #1a3a8c22 100%)", zIndex: 0 }}></div>
          <HowItWorksCard
            icon="🗂️"
            step="01"
            title="Profile Teachers & Sections"
            desc="Manage teacher specializations, grade permissions, unavailable periods, and max load. Create and organize sections with themed names and assign rooms."
            bullets={[
              "Employee ID, department, position type",
              "Period restrictions (e.g., P1–P2 for Head Teachers)",
              "Specialization subjects & max weekly load"
            ]}
          />
          <HowItWorksCard
            icon="⚡"
            step="02"
            title="Generate the Schedule"
            desc="Automatically allocate subject slots per section, match qualified teachers, check availability, and flag conflicts."
            bullets={[
              "Respects period restrictions & travel rules",
              "Strand/SPA/extra block allocation",
              "Double-booking & room collision detection"
            ]}
          />
          <HowItWorksCard
            icon="🚦"
            step="03"
            title="Resolve & Finalize"
            desc="Conflicts appear in a panel next to the grid. Resolve by reassigning, dragging, or swapping. Finalize to lock the schedule and export PDFs."
            bullets={[
              "Inline conflict editor per cell",
              "Live conflict count updates",
              "Export per-teacher or per-section PDF"
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function HowItWorksCard({ icon, step, title, desc, bullets }) {
  return (
    <div style={{ flex: 1, background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(26,58,140,0.07)", border: "1px solid #e3e7ef", padding: 32, minWidth: 320, maxWidth: 420, display: "flex", flexDirection: "column", gap: 16, position: "relative", zIndex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ background: "#eaf0fa", color: "#1a3a8c", fontWeight: 700, borderRadius: 8, padding: "8px 14px", fontSize: 22 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 38, color: "#1a2536", fontFamily: "Newspaper, serif", marginLeft: "auto" }}>{step}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 18, color: "#1a2536", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 15, color: "#3a3a3a", marginBottom: 10 }}>{desc}</div>
      <ul style={{ paddingLeft: 0, margin: 0, color: "#3a3a3a", fontSize: 14, listStyle: "none" }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#1a3a8c", fontSize: 18, marginRight: 4 }}>✓</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
