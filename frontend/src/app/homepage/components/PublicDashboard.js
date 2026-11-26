import React, { useEffect, useState } from 'react';
import { FaChalkboardTeacher, FaTable, FaBars, FaTimes } from "react-icons/fa";
import FinalTimeTables from './FinalTimeTables';
import CurrentAssignmentView from './CurrentAssignmentView';
import { isAdminAuthenticated } from '../../../auth';

function getFromStorage(key, fallback) {
  try {
    const val = window.localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeSections(sectionsRaw, scheduleType = "jhs") {
  if (!sectionsRaw || typeof sectionsRaw !== "object") {
    return [];
  }
  if (scheduleType === "jhs") {
    return [7, 8, 9, 10]
      .flatMap((grade) => {
        const gradeConfig = sectionsRaw?.jhs?.[grade];
        const entries = Array.isArray(gradeConfig?.sections) ? gradeConfig.sections : [];
        return entries.map((section, index) => ({
          id: `jhs-${grade}-${index}`,
          level: "jhs",
          grade,
          name: section?.name || `Grade ${grade} Section ${index + 1}`,
          classification: section?.classification || "Regular",
          track: section?.track || "",
        }));
      })
      .sort((left, right) => {
        if (left.grade !== right.grade) {
          return left.grade - right.grade;
        }
        return left.name.localeCompare(right.name);
      });
  }
  // Add SHS logic if needed
  return [];
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
    cursor: "pointer",
  };
}

export default function PublicDashboard() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 860 || (window.innerHeight <= 500 && window.innerWidth <= 1024);
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "final-timetables" || tab === "final-time-tables") {
        return "final-timetables";
      }
    }
    return "current-assignment";
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url);
    }
  };

  let content;
  if (activeTab === "current-assignment") {
    content = (
      <div>
        <CurrentAssignmentView />
      </div>
    );
  } else if (activeTab === "final-timetables") {
    content = (
      <div>
        <FinalTimeTables />
      </div>
    );
  }

  return (
    <main
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
            <img src="/turotugma-logo.png" alt="TuroTugma" style={{ width: 28, height: 28, borderRadius: 6, background: "#fff", padding: 2 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.1 }}>TuroTugma</div>
              <div style={{ fontSize: 10.5, opacity: 0.85 }}>
                {activeTab === "final-timetables" ? "Final Time Tables" : "Current Assignment View"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => handleTabChange("current-assignment")}
              style={{
                border: "1px solid rgba(255,255,255,0.3)",
                background: activeTab === "current-assignment" ? "#ffffff" : "rgba(255,255,255,0.14)",
                color: activeTab === "current-assignment" ? "#3B4197" : "#ffffff",
                borderRadius: 7,
                padding: "5px 9px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Live
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("final-timetables")}
              style={{
                border: "1px solid rgba(255,255,255,0.3)",
                background: activeTab === "final-timetables" ? "#ffffff" : "rgba(255,255,255,0.14)",
                color: activeTab === "final-timetables" ? "#3B4197" : "#ffffff",
                borderRadius: 7,
                padding: "5px 9px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Timetables
            </button>
          </div>
        </header>
      )}

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
          width: 260,
          minWidth: 260,
          height: "100dvh",
          maxHeight: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          transform: isMobile ? (mobileMenuOpen ? "translateX(0)" : "translateX(-105%)") : "none",
          transition: "transform 0.24s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "linear-gradient(180deg, #3B4197 0%, #2c327e 100%)",
          color: "#ffffff",
          padding: "24px 20px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.14)",
          zIndex: isMobile ? 100 : 50,
          flexShrink: 0,
          overflowY: "auto",
          boxShadow: isMobile && mobileMenuOpen ? "10px 0 30px rgba(0,0,0,0.35)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <img src="/turotugma-logo.png" alt="TuroTugma" style={{ width: 34, height: 34, borderRadius: 8, background: "#fff", padding: 3 }} />
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>TuroTugma</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.8 }}>Public Dashboard</p>
          </div>
        </div>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.68, marginBottom: 10 }}>
          Navigation
        </div>
        <nav style={{ display: "grid", gap: 8 }}>
          <button
            type="button"
            id="public-nav-current-assignment"
            style={{
              ...navLinkItemStyle(activeTab === "current-assignment"),
              width: "100%",
              fontFamily: "inherit",
              outline: "none",
            }}
            onClick={() => handleTabChange("current-assignment")}
          >
            <FaChalkboardTeacher style={{ marginRight: 8 }} /> Current Assignment View
          </button>
          <button
            type="button"
            id="public-nav-final-timetables"
            style={{
              ...navLinkItemStyle(activeTab === "final-timetables"),
              width: "100%",
              fontFamily: "inherit",
              outline: "none",
            }}
            onClick={() => handleTabChange("final-timetables")}
          >
            <FaTable style={{ marginRight: 8 }} /> Final Time Tables
          </button>
        </nav>
        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.16)", display: "grid", gap: 8 }}>
          {isAdminAuthenticated() ? (
            <a
              href="/dashboard"
              style={{
                display: "block",
                textDecoration: "none",
                color: "#3B4197",
                background: "#ffffff",
                border: "none",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 700,
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              ← Return to Admin Panel
            </a>
          ) : null}
          <a
            href="/"
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
            ← Back to Homepage
          </a>
        </div>
      </aside>
      <section
        style={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          marginLeft: isMobile ? 0 : 260,
          padding: isMobile ? "16px 12px 72px" : 36,
          boxSizing: "border-box",
        }}
      >
        {content}
      </section>
    </main>
  );
}
