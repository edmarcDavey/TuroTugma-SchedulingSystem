import React from "react";
import { FaFolderOpen, FaBolt, FaTrafficLight } from "react-icons/fa";

export default function HowItWorksSection() {
  return (
    <section id="process" style={{ background: "#f4f8fc", position: "relative", padding: "64px 0" }}>
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ color: "#1a3a8c", fontWeight: 700, fontSize: 13.5, marginBottom: 12, letterSpacing: 1 }}>
            THE PROCESS
          </div>
          <div style={{ fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 800, color: "#1a2536", marginBottom: 0 }}>
            From profiles to
          </div>
          <div
            style={{
              fontSize: "clamp(28px, 4vw, 38px)",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontWeight: 500,
              color: "#1a2536",
              marginBottom: 8,
            }}
          >
            finalized timetable.
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", gap: 28, justifyContent: "center", flexWrap: "wrap" }}>
          <HowItWorksCard
            icon={<FaFolderOpen />}
            step="01"
            title="Profile Faculty, Sections & Subjects"
            desc="Import or add teacher specializations, grade assignments, and ancillary roles. Configure themed sections and curriculum subjects."
            bullets={[
              "Bulk Excel/CSV import for Teachers & Subjects",
              "Preferred day & period placement locks (e.g., HGP)",
              "DepEd DO 005 advisory & ancillary load credits",
            ]}
          />
          <HowItWorksCard
            icon={<FaBolt />}
            step="02"
            title="Generate the Schedule"
            desc="Run the multi-pass constraint engine to allocate subject slots per section, match qualified teachers, and prevent double-booking."
            bullets={[
              "Respects faculty & subject period restrictions",
              "SP-STEM, SPA breakout streams & SHS clusters",
              "Strict zero double-booking enforcement",
            ]}
          />
          <HowItWorksCard
            icon={<FaTrafficLight />}
            step="03"
            title="Publish, Export & Pinch-Hit"
            desc="Inspect or fine-tune cells inline, publish the master schedule to the live portal, export DepEd A4 PDFs, and assign pinch-hitters."
            bullets={[
              "Inline cell editor & 1-click conflict Auto-Fix",
              "Single-page A4 landscape DepEd PDF export",
              "Pinch-Hit Finder with formal A4 memorandum",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function HowItWorksCard({ icon, step, title, desc, bullets }) {
  return (
    <div
      style={{
        flex: "1 1 310px",
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 4px 24px rgba(26,58,140,0.07)",
        border: "1px solid #e3e7ef",
        padding: 28,
        maxWidth: 380,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ background: "#eaf0fa", color: "#1a3a8c", fontWeight: 700, borderRadius: 8, padding: "8px 14px", fontSize: 20 }}>
          {icon}
        </span>
        <span style={{ fontWeight: 800, fontSize: 34, color: "#1a2536", fontFamily: "Georgia, serif", marginLeft: "auto" }}>
          {step}
        </span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 18, color: "#1a2536" }}>{title}</div>
      <div style={{ fontSize: 14.5, color: "#3a3a3a", lineHeight: 1.5 }}>{desc}</div>
      <ul style={{ paddingLeft: 0, margin: "4px 0 0", color: "#3a3a3a", fontSize: 13.5, listStyle: "none", display: "grid", gap: 6 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ color: "#1a3a8c", fontSize: 15, fontWeight: 800, lineHeight: 1.3 }}>✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
