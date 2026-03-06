import React, { useEffect, useState } from 'react';
import { FaChalkboardTeacher, FaTable } from "react-icons/fa";
import FinalTimeTables from './FinalTimeTables';
import CurrentAssignmentView from './CurrentAssignmentView';

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
  const [activeTab, setActiveTab] = useState("current-assignment");



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
    <main style={{ minHeight: "100vh", display: "flex", background: "#f5f7ff" }}>
      <aside
        style={{
          width: 260,
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
            <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.8 }}>Public Dashboard</p>
          </div>
        </div>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.68, marginBottom: 10 }}>
          Navigation
        </div>
        <nav style={{ display: "grid", gap: 8 }}>
          <span
            style={navLinkItemStyle(activeTab === "current-assignment")}
            onClick={() => setActiveTab("current-assignment")}
          >
            <FaChalkboardTeacher style={{marginRight:8}} /> Current Assignment View
          </span>
          <span
            style={navLinkItemStyle(activeTab === "final-timetables")}
            onClick={() => setActiveTab("final-timetables")}
          >
            <FaTable style={{marginRight:8}} /> Final Time Tables
          </span>
        </nav>
        <div style={{ marginTop: "auto" }}>
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
              marginTop: 24,
            }}
          >
            ← Back to Homepage
          </a>
        </div>
      </aside>
      <section style={{ flex: 1, padding: 36, boxSizing: "border-box" }}>{content}</section>
    </main>
  );
}
