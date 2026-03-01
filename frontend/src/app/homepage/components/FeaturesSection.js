import React from "react";

export default function FeaturesSection() {
  return (
    <section className="hero-background" style={{ position: "relative", padding: "64px 0" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.5)", zIndex: 1 }}></div>
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ color: "#1a3a8c", fontWeight: 700, fontSize: 14, marginBottom: 12, letterSpacing: 1 }}>
            ONE SYSTEM. COMPLETE CONTROL. CONFLICT-FREE SCHEDULING.
          </div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: "#1a2536", marginBottom: 8 }}>
            Built for one powerful workspace,<br />
            <span style={{ fontFamily: "serif", fontStyle: "italic", color: "#1a2536", fontWeight: 500 }}>
              managing everything in one system.
            </span>
          </h2>
          <p style={{ maxWidth: 600, margin: "0 auto", color: "#3a3a3a", fontSize: 18 }}>
            The Administrator manages master data, configures rules, generates conflict-free timetables, and publishes the final schedule — all in one intelligent platform.
          </p>
        </div>
        <div style={{ display: "flex", gap: 32, justifyContent: "center" }}>
          {/* Data & Configuration Management Card */}
          <div style={{ flex: 1, background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(26,37,54,0.07)", border: "1px solid #e3e7ef", padding: 32, minWidth: 320, maxWidth: 420 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <span style={{ background: "#eaf0fa", color: "#1a3a8c", fontWeight: 700, borderRadius: 8, padding: "8px 14px", fontSize: 18 }}>🗂️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#1a2536" }}>Data & Configuration Management</div>
                <div style={{ fontSize: 13, color: "#1a3a8c" }}>Administrator Workspace</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <FeatureItem icon="📋" title="Teacher Profiling" desc="Manage teacher information including subject expertise, grade level assignments, unavailable periods, and maximum teaching load." />
              <FeatureItem icon="🏫" title="Section Management" desc="Create and organize Junior High and Senior High sections, assign themes, classify special sections, and define Senior High tracks." />
              <FeatureItem icon="🗃️" title="Subject Management" desc="Add and categorize subjects by grade level, semester, strand, and subject type with defined weekly hours." />
              <FeatureItem icon="⚙️" title="Scheduling Configurations" desc="Define session types, school days, period structure, break settings, and system-wide constraints for accurate timetable generation." />
            </div>
          </div>
          {/* Intelligent Schedule Engine Card */}
          <div style={{ flex: 1, background: "linear-gradient(135deg, #1a3a8c 60%, #2a4ca7 100%)", borderRadius: 20, boxShadow: "0 4px 24px rgba(26,58,140,0.12)", border: "1px solid #e3e7ef", padding: 32, minWidth: 320, maxWidth: 420, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <span style={{ background: "#eaf0fa", color: "#1a3a8c", fontWeight: 700, borderRadius: 8, padding: "8px 14px", fontSize: 18 }}>🤖</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>Intelligent Schedule Engine</div>
                <div style={{ fontSize: 13, color: "#eaf0fa" }}>Automated & Manual Timetable Control</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <FeatureItem icon="⚡" title="One-Click Auto Generation" desc="Automatically generates conflict-free schedules while respecting teacher loads, subject limits, and restricted periods." dark />
              <FeatureItem icon="🚦" title="Conflict Detection Panel" desc="Flags scheduling conflicts instantly and prevents double-booking or invalid assignments." dark />
              <FeatureItem icon="🧠" title="Smart Allocation Logic" desc="Matches teachers to subjects strictly based on Subject Expertise and Grade Level Assignments, while respecting unavailable periods." dark />
              <FeatureItem icon="📤" title="Finalize & Publish" desc="Save drafts, export per-section or per-teacher schedules as PDF, and publish the official timetable to the public dashboard." dark />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureItem({ icon, title, desc, dark }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: dark ? "rgba(255,255,255,0.04)" : "#fff", borderRadius: 12, padding: "14px 18px", boxShadow: dark ? undefined : "0 2px 8px rgba(26,37,54,0.07)", border: dark ? undefined : "1px solid #e3e7ef" }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: dark ? "#fff" : "#1a2536" }}>{title}</div>
        <div style={{ fontSize: 13, color: dark ? "#eaf0fa" : "#3a3a3a", marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}
