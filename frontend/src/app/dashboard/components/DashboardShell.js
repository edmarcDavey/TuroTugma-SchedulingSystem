import { useState, useEffect } from "react";
import { FaTachometerAlt, FaBuilding, FaUsers, FaBook, FaChalkboardTeacher, FaCalendarAlt, FaTable, FaChevronLeft, FaChevronRight, FaSignOutAlt, FaUserClock, FaExternalLinkAlt, FaBars, FaTimes } from "react-icons/fa";
import { clearAdminSession } from "../../../auth";

export default function DashboardShell({ activeTab, onSelectTab, children }) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 860 || (window.innerHeight <= 500 && window.innerWidth <= 1024);
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("turotugma_sidebar_collapsed");
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 860 || (window.innerHeight <= 500 && window.innerWidth <= 1024);
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen((prev) => !prev);
      return;
    }
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
    { key: "substitute-finder", label: "Pinch-Hit Finder", href: "/dashboard?tab=substitute-finder", icon: FaUserClock },
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
      if (isMobile) {
        setMobileMenuOpen(false);
      }
    }
  };

  const showCollapsedDesktop = !isMobile && isCollapsed;
  const activeNavLabel = navItems.find((i) => i.key === activeTab)?.label || "Admin Panel";

  return (
    <main
      className="turotugma-dashboard-main"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        background: "#f5f7ff",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
      }}
    >
      {/* Mobile Top Header Bar */}
      {isMobile && (
        <header
          className="turotugma-no-print"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 80,
            background: "linear-gradient(90deg, #3B4197 0%, #2c327e 100%)",
            color: "#ffffff",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.16)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Navigation Menu"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.28)",
                background: "rgba(255,255,255,0.14)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {mobileMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
            </button>
            <img
              src="/turotugma-logo.png"
              alt="TuroTugma"
              style={{ width: 28, height: 28, borderRadius: 6, background: "#fff", padding: 2 }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.1 }}>TuroTugma</div>
              <div style={{ fontSize: 10.5, opacity: 0.85 }}>{activeNavLabel}</div>
            </div>
          </div>

          <a
            href="/public-dashboard"
            style={{
              textDecoration: "none",
              color: "#ffffff",
              background: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 11.5,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span>Public View</span>
            <FaExternalLinkAlt size={10} />
          </a>
        </header>
      )}

      {/* Mobile Drawer Backdrop */}
      {isMobile && mobileMenuOpen && (
        <div
          className="turotugma-no-print"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(2px)",
            zIndex: 90,
          }}
        />
      )}

      <aside
        className="turotugma-no-print"
        style={{
          width: isMobile ? 270 : showCollapsedDesktop ? 72 : 280,
          minWidth: isMobile ? 270 : showCollapsedDesktop ? 72 : 280,
          height: "100dvh",
          maxHeight: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          transform: isMobile ? (mobileMenuOpen ? "translateX(0)" : "translateX(-105%)") : "none",
          transition: "transform 0.24s cubic-bezier(0.4, 0, 0.2, 1), width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1), padding 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "linear-gradient(180deg, #3B4197 0%, #2c327e 100%)",
          color: "#ffffff",
          padding: showCollapsedDesktop ? "20px 10px" : "24px 20px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.14)",
          zIndex: isMobile ? 100 : 50,
          flexShrink: 0,
          boxShadow: isMobile && mobileMenuOpen ? "10px 0 30px rgba(0,0,0,0.35)" : "none",
        }}
      >
        {/* Toggle Button (Desktop collapse OR Mobile close) */}
        {!isMobile ? (
          <button
            type="button"
            onClick={toggleSidebar}
            title={showCollapsedDesktop ? "Expand sidebar" : "Collapse sidebar"}
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
            {showCollapsedDesktop ? <FaChevronRight size={11} /> : <FaChevronLeft size={11} />}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close sidebar"
            style={{
              position: "absolute",
              top: 18,
              right: 14,
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "rgba(255,255,255,0.16)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <FaTimes size={14} />
          </button>
        )}

        {/* Brand Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: showCollapsedDesktop ? "center" : "flex-start",
            gap: showCollapsedDesktop ? 0 : 10,
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
          {!showCollapsedDesktop ? (
            <div style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>TuroTugma</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.8 }}>Admin Panel</p>
            </div>
          ) : null}
        </div>

        {!showCollapsedDesktop ? (
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.68, marginBottom: 10, whiteSpace: "nowrap", overflow: "hidden" }}>
            Navigation
          </div>
        ) : null}

        {/* Navigation Links */}
        <nav style={{ display: "grid", gap: 6, overflowY: "auto", flex: 1, alignContent: "start", paddingRight: 2 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key || (activeTab === "schedule-maker" && item.key === "schedule-generator");
            return (
              <a
                key={item.key}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                title={showCollapsedDesktop ? item.label : undefined}
                style={navLinkItemStyle(active, showCollapsedDesktop)}
              >
                <Icon style={{ fontSize: 16, minWidth: 16, marginRight: showCollapsedDesktop ? 0 : 10, flexShrink: 0 }} />
                {!showCollapsedDesktop ? (
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.label}
                  </span>
                ) : null}
              </a>
            );
          })}
        </nav>

        {/* Footer / Portal Switcher & Logout (Pinned at bottom of viewport) */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.16)",
            display: "grid",
            gap: 8,
          }}
        >
          <a
            href="/public-dashboard"
            title="Preview Public / Teacher Timetable Portal"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: showCollapsedDesktop ? 0 : 8,
              textDecoration: "none",
              color: "#ffffff",
              background: "rgba(255, 255, 255, 0.14)",
              border: "1px solid rgba(255, 255, 255, 0.28)",
              borderRadius: 10,
              padding: showCollapsedDesktop ? "9px 0" : "9px 12px",
              fontSize: 12.5,
              fontWeight: 700,
              textAlign: "center",
              transition: "background 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            <FaExternalLinkAlt style={{ fontSize: 13 }} />
            {!showCollapsedDesktop ? <span>Public / Teacher View</span> : null}
          </a>

          <a
            href="/login"
            title="Logout"
            onClick={() => {
              clearAdminSession();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: showCollapsedDesktop ? 0 : 8,
              textDecoration: "none",
              color: "#ffffff",
              background: "rgba(239, 68, 68, 0.22)",
              border: "1px solid rgba(252, 165, 165, 0.4)",
              borderRadius: 10,
              padding: showCollapsedDesktop ? "10px 0" : "10px 12px",
              fontSize: 13,
              fontWeight: 700,
              textAlign: "center",
              transition: "background 0.15s ease",
            }}
          >
            <FaSignOutAlt style={{ fontSize: 15 }} />
            {!showCollapsedDesktop ? <span>Logout</span> : null}
          </a>
        </div>
      </aside>

      <section
        className="turotugma-dashboard-section"
        style={{
          flex: 1,
          minWidth: 0,
          marginLeft: isMobile ? 0 : showCollapsedDesktop ? 72 : 280,
          padding: isMobile ? "16px 12px 72px" : showCollapsedDesktop ? "24px 20px" : 36,
          boxSizing: "border-box",
          width: isMobile ? "100%" : `calc(100% - ${showCollapsedDesktop ? 72 : 280}px)`,
          transition: "margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1), width 0.22s cubic-bezier(0.4, 0, 0.2, 1), padding 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowX: "auto",
        }}
      >
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
