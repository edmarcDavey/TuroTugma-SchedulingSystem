import React from "react";

const teacherList = [
  { name: "Ms. Rowena Santos",    subject: "English 9",       section: "9-Narra",   building: "Main",  status: "In Class",  statusClass: "status-in-class" },
  { name: "Mr. Manuel Cruz",      subject: "Math 9",          section: "9-Molave",  building: "JICA",  status: "In Class",  statusClass: "status-in-class" },
  { name: "Ms. Liza Reyes",       subject: "Science 9",       section: "9-Acacia",  building: "Main",  status: "In Class",  statusClass: "status-in-class" },
  { name: "Dr. Ana Bautista",     subject: "—",               section: "—",         building: "Main",  status: "In Meeting",statusClass: "status-meeting" },
  { name: "Mr. Jose Flores",      subject: "AP 9",            section: "9-Ipil",    building: "JICA",  status: "In Class",  statusClass: "status-in-class" },
  { name: "Ms. Carmen Garcia",    subject: "—",               section: "—",         building: "—",     status: "On Leave",  statusClass: "status-leave" },
];

export default function PublicDashboardPreview() {
  return (
    <section style={{ background: "#fff", padding: "64px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        {/* Left: Copy */}
        <div>
          <span style={{ color: "#1a3a8c", fontWeight: 700, fontSize: 14, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, display: "inline-block" }}>
            Public Access
          </span>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: "#1a2536", marginBottom: 0, lineHeight: 1.1 }}>
            Teachers & students<br />
            <span style={{ fontFamily: "serif", fontStyle: "italic", fontWeight: 500 }}>see it live.</span>
          </h2>
          <p style={{ color: "#3a3a3a", fontSize: 17, margin: "18px 0 0 0", maxWidth: 480 }}>
            No login required. The public dashboard shows every teacher's current room assignment, real-time status, and the full finalized timetable — updated to the active period.
          </p>
          <ul style={{ margin: "28px 0 32px 0", padding: 0, listStyle: "none" }}>
            {["Live period clock — always shows the current block", "Toggle to next period with one click", "Search by teacher name, section, or subject", "Download per-teacher timetable PDF"].map((item, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "#1a2536", marginBottom: 10 }}>
                <span style={{ color: "#2ecc71", fontSize: 18, marginRight: 4 }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
          <a href="/public-dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1a3a8c", color: "#fff", fontWeight: 700, fontSize: 16, border: "none", borderRadius: 10, padding: "16px 32px", textDecoration: "none", boxShadow: "0 2px 8px rgba(26,58,140,0.07)", cursor: "pointer" }}>
            <span style={{ fontSize: 18 }}>→</span> View Public Dashboard
          </a>
        </div>
        {/* Right: Preview Card */}
        <div>
          <div style={{ background: "#f8f6f1", borderRadius: 20, boxShadow: "0 4px 24px rgba(26,37,54,0.12)", border: "1px solid #e3e7ef", overflow: "hidden", minWidth: 380 }}>
            {/* Header */}
            <div style={{ background: "#1a2536", padding: "20px 32px 12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: 0 }}>Current Room Assignments</p>
                <p style={{ fontSize: 10, color: "#eaf0fa", fontWeight: 500, margin: "4px 0 0 0" }}>Period 3 · 9:30 – 10:30 AM</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 12px", marginRight: 4, cursor: "pointer" }}>Current</button>
                <button style={{ fontSize: 10, fontWeight: 600, color: "#eaf0fa", background: "rgba(26,58,140,0.08)", border: "1px solid #1a3a8c33", borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>Next →</button>
              </div>
            </div>
            {/* Search bar */}
            <div style={{ padding: "12px 32px", borderBottom: "1px solid #e3e7ef", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#eaf0fa", borderRadius: 8, padding: "8px 16px", border: "1px solid #e3e7ef" }}>
                <span style={{ color: "#1a3a8c", fontSize: 16 }}>🔍</span>
                <span style={{ fontSize: 12, color: "#1a2536", opacity: 0.4 }}>Search teacher, section, subject…</span>
              </div>
            </div>
            {/* Teacher list */}
            <div>
              {teacherList.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 32px", borderBottom: i < teacherList.length - 1 ? "1px solid #e3e7ef" : "none", background: "#f8f6f1" }}>
                  <span style={{ background: "#eaf0fa", color: "#1a3a8c", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>👤</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2536", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</p>
                    <p style={{ fontSize: 10, color: "rgba(26,37,54,0.45)", fontWeight: 500, margin: 0 }}>
                      {t.subject !== "—" ? `${t.subject} · ` : ""}{t.section !== "—" ? `${t.section} · ` : ""}{t.building !== "—" ? t.building : ""}
                    </p>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: t.status === "In Class" ? "#2ecc71" : t.status === "In Meeting" ? "#1a3a8c" : "#e74c3c", color: t.status === "In Meeting" ? "#fff" : "#fff" }}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
