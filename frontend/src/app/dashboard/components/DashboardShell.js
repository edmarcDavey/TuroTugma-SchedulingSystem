import { FaTachometerAlt, FaUsers, FaBook, FaChalkboardTeacher, FaCalendarAlt, FaTable } from "react-icons/fa";

export default function DashboardShell({ activeTab, children }) {
  return (
    <main style={{ minHeight: "100vh", display: "flex", background: "#f5f7ff" }}>
      <aside
        style={{
          width: 280,
          background: "linear-gradient(180deg, #3B4197 0%, #2c327e 100%)",
          color: "#ffffff",
          padding: "28px 20px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.14)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <img src="/turotugma-logo.png" alt="TuroTugma" style={{ width: 34, height: 34, borderRadius: 8, background: "#fff", padding: 3 }} />
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>TuroTugma</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.8 }}>Admin Panel</p>
          </div>
        </div>

        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.68, marginBottom: 10 }}>
          Navigation
        </div>

        <nav style={{ display: "grid", gap: 8 }}>
          <a href="/dashboard" style={navLinkItemStyle(activeTab === "dashboard")}> <FaTachometerAlt style={{marginRight:8}} /> Dashboard</a>
          <a href="/dashboard?tab=sections" style={navLinkItemStyle(activeTab === "sections")}> <FaTable style={{marginRight:8}} /> Sections</a>
          <a href="/dashboard?tab=subjects" style={navLinkItemStyle(activeTab === "subjects")}> <FaBook style={{marginRight:8}} /> Subjects</a>
          <a href="/dashboard?tab=faculty" style={navLinkItemStyle(activeTab === "faculty")}> <FaUsers style={{marginRight:8}} /> Faculty</a>
          <a href="/dashboard?tab=schedule-maker" style={navLinkItemStyle(activeTab === "schedule-maker")}> <FaCalendarAlt style={{marginRight:8}} /> Schedule Maker</a>
          <a href="/dashboard?tab=time-tables" style={navLinkItemStyle(activeTab === "time-tables")}> <FaChalkboardTeacher style={{marginRight:8}} /> Time Tables</a>
        </nav>

        <div style={{ marginTop: "auto" }}>
          <a
            href="/login"
            style={{
              display: "block",
              textDecoration: "none",
              color: "#fff",
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            Logout
          </a>
        </div>
      </aside>

      <section style={{ flex: 1, padding: 36, boxSizing: "border-box" }}>{children}</section>
    </main>
  );
}

function navLinkItemStyle(active) {
  return {
    textAlign: "left",
    background: active ? "rgba(255,255,255,0.2)" : "transparent",
    color: "#ffffff",
    border: active ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: active ? 700 : 500,
    textDecoration: "none",
    display: "block",
  };
}
