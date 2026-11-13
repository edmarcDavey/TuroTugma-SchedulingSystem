import { useState } from "react";
import { FaTachometerAlt, FaBuilding, FaUsers, FaBook, FaChalkboardTeacher, FaCalendarAlt, FaTable, FaChevronLeft, FaChevronRight, FaSignOutAlt, FaUserClock } from "react-icons/fa";

export default function DashboardShell({ activeTab, onSelectTab, children }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("turotugma_sidebar_collapsed");
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

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
    { key: "substitute-finder", label: "Pinch-Hit / Sub Finder", href: "/dashboard?tab=substitute-finder", icon: FaUserClock },
  ];

  const handleNavClick = (e, item) => {
    if (
      onSelectTab &&
      e.button === 0 &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey
    ) {
      e.preventDefault();
      onSelectTab(item.key, item.href);
    }
  };

  return (
    <main className="turotugma-dashboard-main" style={{ minHeight: "100vh", display: "flex", background: "#f5f7ff" }}>
      <aside
        className="turotugma-no-print"
        style={{
          width: isCollapsed ? 72 : 280,
          minWidth: isCollapsed ? 72 : 280,
          transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1), padding 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "linear-gradient(180deg, #3B4197 0%, #2c327e 100%)",
          color: "#ffffff",
          padding: isCollapsed ? "20px 10px" : "28px 20px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.14)",
          position: "relative",
          zIndex: 50,
          flexShrink: 0,
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: isCollapsed ? 0 : 10,
            marginBottom: 28,
            overflow: "hidden",
            minHeight: 40,
          }}
        >
          <img
            src="/turotugma-logo.png"
            alt="TuroTugma"
            style={{ width: 34, height: 34, minWidth: 34, borderRadius: 8, background: "#fff", padding: 3 }}
          />
          {!isCollapsed ? (
            <div style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>TuroTugma</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.8 }}>Admin Panel</p>
            </div>
          ) : null}
        </div>

        {!isCollapsed ? (
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.68, marginBottom: 10, whiteSpace: "nowrap", overflow: "hidden" }}>
            Navigation
          </div>
        ) : null}

        {/* Navigation Links */}
        <nav style={{ display: "grid", gap: 6 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key || (activeTab === "schedule-maker" && item.key === "schedule-generator");
            return (
              <a
                key={item.key}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                title={isCollapsed ? item.label : undefined}
                style={navLinkItemStyle(active, isCollapsed)}
              >
                <Icon style={{ fontSize: 16, minWidth: 16, marginRight: isCollapsed ? 0 : 10, flexShrink: 0 }} />
                {!isCollapsed ? (
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.label}
                  </span>
                ) : null}
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

      <section className="turotugma-dashboard-section" style={{ flex: 1, padding: isCollapsed ? "24px 20px" : 36, boxSizing: "border-box", width: "100%", overflowX: "auto" }}>
        {children}
      </section>
    </main>
  );
}

function navLinkItemStyle(active, isCollapsed) {
  return {
    textAlign: "left",
    background: active ? "rgba(255, 255, 255, 0.22)" : "transparent",
    color: "#ffffff",
    border: active ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid transparent",
    borderLeft: active ? "4px solid #60a5fa" : isCollapsed ? "1px solid transparent" : "4px solid transparent",
    borderRadius: 10,
    boxShadow: active ? "0 4px 14px rgba(0, 0, 0, 0.18), inset 0 0 0 1px rgba(255, 255, 255, 0.25)" : "none",
    padding: isCollapsed ? "10px 0" : "10px 14px",
    fontSize: 14,
    fontWeight: active ? 700 : 500,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: isCollapsed ? "center" : "flex-start",
    transition: "all 0.18s ease",
  };
}
