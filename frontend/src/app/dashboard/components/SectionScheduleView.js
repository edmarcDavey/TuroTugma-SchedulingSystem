import React, { useEffect, useMemo, useState } from "react";

// Utility to get schedule draft and config from localStorage
function getScheduleDraftAndConfig() {
  try {
    const draftRaw = localStorage.getItem("turotugma_schedule_drafts");
    let draftArr = draftRaw ? JSON.parse(draftRaw) : null;
    const draft = Array.isArray(draftArr) && draftArr.length > 0 ? draftArr[0] : null;
    const config = draft?.config?.jhs || {};
    return { draft, config };
  } catch {
    return { draft: null, config: {} };
  }
}

function getFacultyList() {
  try {
    const raw = localStorage.getItem("turotugma_faculty");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getSectionInfo(sectionId) {
  try {
    const raw = localStorage.getItem("turotugma_sections_created");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Try JHS first
    for (const level of ["jhs", "shs"]) {
      if (parsed[level]) {
        for (const gradeKey of Object.keys(parsed[level])) {
          const grade = parsed[level][gradeKey];
          if (grade.sections) {
            const found = grade.sections.find((s) => s.id === sectionId);
            if (found) return found;
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

function getPeriods(config) {
  // Returns an array of period objects: { label, start, end }
  const periods = config?.periodTimes || [];
  if (Array.isArray(periods) && periods.length) return periods;
  // Fallback: generate generic periods
  const count = config?.periods?.regular || 7;
  const startHour = 7;
  return Array.from({ length: count }, (_, i) => ({
    label: `Period ${i + 1}`,
    start: `${startHour + i}:00`,
    end: `${startHour + i + 1}:00`,
  }));
}

function getSectionAssignments(sectionId, assignments, facultyList) {
  // Returns array of { period, subject, teacherName }
  return Object.entries(assignments)
    .filter(([key]) => key.startsWith(sectionId + "|"))
    .map(([key, assignment]) => {
      const [, period] = key.split("|");
      const teacher = facultyList.find((f) => f.id === assignment.teacherId);
      return {
        period,
        subject: assignment.subjectName || assignment.subjectCode || "",
        teacherName: teacher ? teacher.name : "Unassigned",
      };
    });
}

function getCurrentPeriodIdx(periods) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < periods.length; i++) {
    const [startH, startM = 0] = periods[i].start.split(":").map(Number);
    const [endH, endM = 0] = periods[i].end.split(":").map(Number);
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;
    if (nowMinutes >= start && nowMinutes < end) return i;
  }
  return -1;
}

export default function SectionScheduleView({ sectionId }) {
  const { draft, config } = useMemo(getScheduleDraftAndConfig, []);
  const facultyList = useMemo(getFacultyList, []);
  const section = useMemo(() => getSectionInfo(sectionId), [sectionId]);
  const periods = useMemo(() => getPeriods(config), [config]);
  const assignments = draft?.schedule?.assignments || {};
  const sectionAssignments = useMemo(
    () => getSectionAssignments(sectionId, assignments, facultyList),
    [sectionId, assignments, facultyList]
  );

  const [currentPeriodIdx, setCurrentPeriodIdx] = useState(getCurrentPeriodIdx(periods));
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      setCurrentPeriodIdx(getCurrentPeriodIdx(periods));
    }, 1000 * 30); // update every 30s
    return () => clearInterval(timer);
  }, [periods]);

  const handlePeriodSelect = (idx) => setCurrentPeriodIdx(idx);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0 }}>{section ? section.name : "Section"}</h2>
          <div style={{ color: "#7a86a7", fontSize: 14 }}>{section ? `${section.room || ""} ${section.campus || ""}` : null}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {periods.map((p, idx) => (
              <button
                key={p.label}
                onClick={() => handlePeriodSelect(idx)}
                style={{
                  background: idx === currentPeriodIdx ? "#3B4197" : "#f2f4f8",
                  color: idx === currentPeriodIdx ? "#fff" : "#3B4197",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 14px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {p.label}
                {idx === currentPeriodIdx ? " · Now" : ""}
              </button>
            ))}
          </div>
          <span style={{ color: "#7a86a7", fontSize: 15, fontWeight: 600, minWidth: 70, textAlign: "right" }}>
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
      <div>
        {periods.map((p, idx) => {
          const assignment = sectionAssignments.find(a => a.period === p.label || a.period === `JHS-P${idx + 1}`);
          return (
            <div
              key={p.label}
              style={{
                marginBottom: 12,
                background: idx === currentPeriodIdx ? "#e9edff" : "#f7f9ff",
                border: idx === currentPeriodIdx ? "2px solid #3B4197" : "1px solid #e0e4ef",
                borderRadius: 14,
                padding: "16px 18px",
                boxShadow: idx === currentPeriodIdx ? "0 2px 8px rgba(59,65,151,0.07)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ color: "#7a86a7", fontSize: 13, fontWeight: 500 }}>{p.start}–{p.end}</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: "#25336f" }}>
                  {assignment ? assignment.subject : "—"}
                </div>
                <div style={{ color: "#7a86a7", fontSize: 14, fontWeight: 500 }}>
                  {assignment ? assignment.teacherName : "Unassigned"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#b3b9d7", fontSize: 13, fontWeight: 600 }}>{section ? section.name : ""}</div>
                {idx === currentPeriodIdx ? (
                  <span style={{ background: "#3B4197", color: "#fff", borderRadius: 8, padding: "2px 12px", fontWeight: 700, fontSize: 13, marginLeft: 8 }}>
                    NOW
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
