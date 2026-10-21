import { useState, useEffect } from "react";
import { FaTachometerAlt, FaBuilding, FaUsers, FaBook, FaChalkboardTeacher, FaCalendarAlt, FaTable, FaChevronLeft, FaChevronRight, FaSignOutAlt } from "react-icons/fa";

export default function DashboardShell({ activeTab, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("turotugma_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("turotugma_sidebar_collapsed", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const navItems = [
    { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: FaTachometerAlt },
    { key: "school-profile", label: "School Profile & Settings", href: "/dashboard?tab=school-profile", icon: FaBuilding },
    { key: "sections", label: "Sections", href: "/dashboard?tab=sections", icon: FaTable },
    { key: "subjects", label: "Subjects", href: "/dashboard?tab=subjects", icon: FaBook },
    { key: "faculty", label: "Faculty", href: "/dashboard?tab=faculty", icon: FaUsers },
    { key: "schedule-generator", label: "Schedule Generator", href: "/dashboard?tab=schedule-generator", icon: FaCalendarAlt },
    { key: "time-tables", label: "Time Tables", href: "/dashboard?tab=time-tables", icon: FaChalkboardTeacher },
  ];

  return (
    <main style={{ minHeight: "100vh", display: "flex", background: "#f5f7ff" }}>
      <aside
        style={{
          width: isCollapsed ? 72 : 280,
          minWidth: isCollapsed ? 72 : 280,
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "linear-gradient(180deg, #3B4197 0%, #2c327e 100%)",
          color: "#ffffff",
          padding: isCollapsed ? "20px 10px" : "28px 20px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.14)",
          position: "relative",
          zIndex: 50,
        }}
      >
        {/* Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            position: "absolute",
            top: 24,
            right: -13,
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "#ffffff",
            color: "#3B4197",
            border: "1px solid #cfd7ef",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            zIndex: 60,
          }}
        >
          {isCollapsed ? <FaChevronRight size={11} /> : <FaChevronLeft size={11} />}
        </button>

        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, overflow: "hidden" }}>
          <img
            src="/turotugma-logo.png"
            alt="TuroTugma"
            style={{ width: 34, height: 34, minWidth: 34, borderRadius: 8, background: "#fff", padding: 3 }}
          />
          {!isCollapsed ? (
            <div style={{ whiteSpace: "nowrap" }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>TuroTugma</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.8 }}>Admin Panel</p>
            </div>
          ) : null}
        </div>

        {!isCollapsed ? (
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.68, marginBottom: 10 }}>
            Navigation
          </div>
        ) : null}

        {/* Navigation Links */}
        <nav style={{ display: "grid", gap: 6 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <a
                key={item.key}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                style={navLinkItemStyle(active, isCollapsed)}
              >
                <Icon style={{ fontSize: 16, minWidth: 16, marginRight: isCollapsed ? 0 : 10 }} />
                {!isCollapsed ? <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span> : null}
              </a>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div style={{ marginTop: "auto" }}>
          <a
            href="/login"
            title={isCollapsed ? "Logout" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "center",
              gap: isCollapsed ? 0 : 8,
              textDecoration: "none",
              color: "#fff",
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 10,
              padding: isCollapsed ? "10px 0" : "10px 12px",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            <FaSignOutAlt style={{ fontSize: 14 }} />
            {!isCollapsed ? <span>Logout</span> : null}
          </a>
        </div>
      </aside>

      <section style={{ flex: 1, padding: isCollapsed ? "24px 20px" : 36, boxSizing: "border-box", width: "100%", overflowX: "auto" }}>
        {children}
      </section>
    </main>
  );
}

function navLinkItemStyle(active, isCollapsed) {
  return {
    textAlign: "left",
    background: active ? "rgba(255,255,255,0.2)" : "transparent",
    color: "#ffffff",
    border: active ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent",
    borderRadius: 10,
    padding: isCollapsed ? "10px 0" : "10px 12px",
    fontSize: 14,
    fontWeight: active ? 700 : 500,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: isCollapsed ? "center" : "flex-start",
    transition: "background 0.15s ease",
  };
}
