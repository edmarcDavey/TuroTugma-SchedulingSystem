import React from "react";
import { FaFolderOpen, FaClipboard, FaSchool, FaCogs, FaRobot, FaBolt, FaTrafficLight, FaBrain, FaUpload } from "react-icons/fa";

export default function FeaturesSection() {
  return (
    <section id="features" className="hero-background" style={{ position: "relative", padding: "64px 0" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.5)", zIndex: 1 }}></div>
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ color: "#1a3a8c", fontWeight: 700, fontSize: 13.5, marginBottom: 12, letterSpacing: 1 }}>
            ONE SYSTEM. COMPLETE CONTROL. CONFLICT-FREE SCHEDULING.
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 800, color: "#1a2536", marginBottom: 8 }}>
            Built for one powerful workspace,
            <br />
            <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#1a2536", fontWeight: 500 }}>
              managing everything in one system.
            </span>
          </h2>
          <p style={{ maxWidth: 620, margin: "0 auto", color: "#3a3a3a", fontSize: 17, lineHeight: 1.5 }}>
            The Administrator manages master data, configures DepEd DO 005 workload rules, generates conflict-free timetables, and publishes official schedules — all in one platform.
          </p>
        </div>
        <div style={{ display: "flex", gap: 28, justifyContent: "center", flexWrap: "wrap" }}>
          {/* Data & Configuration Management Card */}
          <div
            style={{
              flex: "1 1 340px",
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 4px 24px rgba(26,37,54,0.07)",
              border: "1px solid #e3e7ef",
              padding: 28,
              maxWidth: 480,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <span style={{ background: "#eaf0fa", color: "#1a3a8c", fontWeight: 700, borderRadius: 8, padding: "8px 14px", fontSize: 18 }}>
                <FaFolderOpen />
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#1a2536" }}>Data & Configuration Management</div>
                <div style={{ fontSize: 13, color: "#1a3a8c", fontWeight: 600 }}>Administrator Workspace</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <FeatureItem
                icon={<FaClipboard />}
                title="Teacher Profiling & DO 005 Loads"
                desc="Manage faculty subject expertise, grade assignments, ancillary credits, unavailable periods, and statutory teaching load caps."
              />
              <FeatureItem
                icon={<FaSchool />}
                title="Section & Naming Themes"
                desc="Create Junior High (Regular, SP-STEM, SPA, SPJ) and Senior High sections with grade-level naming themes."
              />
              <FeatureItem
                icon={<FaFolderOpen />}
                title="Curriculum Subject Catalog"
                desc="Configure JHS MATATAG and Strengthened SHS subjects, preferred day/period placement locks, and multi-teacher breakouts."
              />
              <FeatureItem
                icon={<FaCogs />}
                title="Bell Schedules & School Year Rollover"
                desc="Define regular and shortened Friday sessions, break timings, signatories, and archive or carry over data to the next school year."
              />
            </div>
          </div>

          {/* Intelligent Schedule Engine Card */}
          <div
            style={{
              flex: "1 1 340px",
              background: "linear-gradient(135deg, #1a3a8c 60%, #2a4ca7 100%)",
              borderRadius: 20,
              boxShadow: "0 4px 24px rgba(26,58,140,0.12)",
              border: "1px solid #e3e7ef",
              padding: 28,
              maxWidth: 480,
              color: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <span style={{ background: "#eaf0fa", color: "#1a3a8c", fontWeight: 700, borderRadius: 8, padding: "8px 14px", fontSize: 18 }}>
                <FaRobot />
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>Intelligent Schedule Engine</div>
                <div style={{ fontSize: 13, color: "#eaf0fa" }}>Automated & Manual Timetable Control</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <FeatureItem
                icon={<FaBolt />}
                title="Multi-Pass Automated Generation"
                desc="Generates 100% conflict-free timetables while consolidating plantilla loads and honoring fixed day/period subject locks."
                dark
              />
              <FeatureItem
                icon={<FaTrafficLight />}
                title="Interactive Conflict & Auto-Fix Panel"
                desc="Detects overlaps, quota shortfalls, or restricted periods in real time with 1-click automated resolution."
                dark
              />
              <FeatureItem
                icon={<FaBrain />}
                title="Pinch-Hit Finder & Official Memo"
                desc="Ranks available replacement teachers by subject, grade, and daily workload when faculty are absent and prints an A4 DepEd memo."
                dark
              />
              <FeatureItem
                icon={<FaUpload />}
                title="Official DepEd A4 Landscape PDF"
                desc="Publish master schedules to the live portal and export single-page A4 Classroom Programs and Teacher Timetables."
                dark
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureItem({ icon, title, desc, dark }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: dark ? "rgba(255,255,255,0.06)" : "#fff",
        borderRadius: 12,
        padding: "14px 16px",
        boxShadow: dark ? undefined : "0 2px 8px rgba(26,37,54,0.06)",
        border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e3e7ef",
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: dark ? "#fff" : "#1a2536" }}>{title}</div>
        <div style={{ fontSize: 13, color: dark ? "#eaf0fa" : "#3a3a3a", marginTop: 3, lineHeight: 1.45 }}>{desc}</div>
      </div>
    </div>
  );
}
