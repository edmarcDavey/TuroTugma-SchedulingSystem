// Pill style for badges (copied from SubjectsManagement)
function pillStyle(isAlt, opts = {}) {
  return {
    display: 'inline-block',
    background: isAlt ? '#e3e7ef' : '#f5f7ff',
    color: isAlt ? '#27356f' : '#4d5a84',
    borderRadius: 8,
    padding: '2px 10px',
    fontSize: 12,
    fontWeight: 600,
    marginRight: 4,
    marginBottom: 2,
    border: '1px solid #dbe3f5',
    letterSpacing: 0.2,
    minWidth: opts.minWidth || undefined,
    width: opts.width || undefined,
    textAlign: opts.textAlign || 'center',
    justifySelf: opts.justifySelf || undefined,
  };
}
// Helper to get subject name from subjectId
function getSubjectName(subjectId, subjectList) {
  if (!subjectId) return '';
  const found = subjectList.find(s => s.id === subjectId || s.subjectId === subjectId || s.code === subjectId);
  return found ? (found.name || found.subjectName || found.code || subjectId) : subjectId;
}
// Helper to normalize sections (copied from FinalTimeTables.js)
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


import React, { useMemo, useEffect, useState } from "react";
// Helper to get all unique grades from sectionList
function getAllGrades(sectionList) {
  return Array.from(new Set(sectionList.map(s => s.grade))).sort((a, b) => a - b);
}

function getScheduleDraftAndConfig() {
  try {
    const draftRaw = localStorage.getItem("turotugma_schedule_drafts");
    let draftArr = draftRaw ? JSON.parse(draftRaw) : null;
    // Use the first draft object if array, else null
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


export default function CurrentAssignmentView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const { draft, config } = useMemo(getScheduleDraftAndConfig, []);
  const facultyList = useMemo(getFacultyList, []);
  const assignments = draft?.schedule?.assignments || {};
  // Get sections from localStorage and normalize
  const sectionsRaw = useMemo(() => {
    try {
      const raw = localStorage.getItem("turotugma_sections_created");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const sectionList = useMemo(() => normalizeSections(sectionsRaw, "jhs"), [sectionsRaw]);

  // Get subjects from localStorage
  const subjectList = useMemo(() => {
    try {
      const raw = localStorage.getItem("turotugma_subjects");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  // Get periods from config
  const periods = useMemo(() => {
    const periodTimes = config?.periodTimes || [];
    if (Array.isArray(periodTimes) && periodTimes.length) return periodTimes;
    const count = config?.periods?.regular || 7;
    const startHour = 7;
    return Array.from({ length: count }, (_, i) => ({
      label: `JHS-P${i + 1}`,
      start: `${startHour + i}:00`,
      end: `${startHour + i + 1}:00`,
    }));
  }, [config]);

  // Find current period index
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

  const [now, setNow] = useState(new Date());
  const [currentPeriodIdx, setCurrentPeriodIdx] = useState(getCurrentPeriodIdx(periods));
  // Selector state: -1 means "live/current", otherwise fixed period index
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(-1);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      setCurrentPeriodIdx(getCurrentPeriodIdx(periods));
    }, 1000); // update every second for live clock
    return () => clearInterval(timer);
  }, [periods]);

  // Determine which period to show: live or selected
  const effectivePeriodIdx = selectedPeriodIdx === -1 ? currentPeriodIdx : selectedPeriodIdx;
  const effectivePeriodLabel = effectivePeriodIdx !== -1 ? periods[effectivePeriodIdx]?.label : undefined;

  // Build a list of assignments for the selected or current period, filtered by search and grade
  const currentAssignments = useMemo(() => {
    if (effectivePeriodIdx === -1 || !effectivePeriodLabel) return [];
    let rows = Object.entries(assignments)
      .filter(([key]) => key.endsWith("|" + effectivePeriodLabel))
      .map(([key, assignment]) => {
        const [sectionId] = key.split("|");
        const teacher = facultyList.find(f => f.id === assignment.teacherId);
        const section = sectionList.find(s => s.id === sectionId);
        // Try to get subject name from assignment, else lookup by subjectId/code
        let subject = assignment.subjectName || assignment.subject || assignment.subjectCode || "";
        if (!subject && assignment.subjectId) {
          subject = getSubjectName(assignment.subjectId, subjectList);
        } else if (!subject && assignment.subjectCode) {
          subject = getSubjectName(assignment.subjectCode, subjectList);
        } else if (!subject && assignment.subject) {
          subject = getSubjectName(assignment.subject, subjectList);
        }
        return {
          teacherName: teacher ? teacher.name : "Unassigned",
          teacherId: teacher ? teacher.employeeId : "",
          sectionName: section ? section.name : sectionId,
          sectionGrade: section ? section.grade : undefined,
          period: effectivePeriodLabel,
          subject,
        };
      });
    // Filter by grade
    if (gradeFilter !== "all") {
      rows = rows.filter(row => String(row.sectionGrade) === String(gradeFilter));
    }
    // Filter by search term (teacher name, teacherId, section name)
    if (searchTerm.trim()) {
      const lower = searchTerm.trim().toLowerCase();
      rows = rows.filter(row =>
        (row.teacherName && row.teacherName.toLowerCase().includes(lower)) ||
        (row.teacherId && row.teacherId.toLowerCase().includes(lower)) ||
        (row.sectionName && row.sectionName.toLowerCase().includes(lower))
      );
    }
    return rows;
  }, [assignments, facultyList, sectionList, subjectList, periods, effectivePeriodIdx, effectivePeriodLabel, gradeFilter, searchTerm]);

  // Uniform page title and description styling
  return (
    <div style={{ padding: 0 }}>
      <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30, fontWeight: 700 }}>Current Assignment View</h1>
      <p style={{ margin: "8px 0 24px", color: "#5b6787", fontSize: 14, maxWidth: 920 }}>
        This is where you see the current view assignment and final timetables.
      </p>
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 18, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
            {/* Period Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: 8 }}>
              <label style={{
                color: '#5b6787',
                fontWeight: 700,
                fontSize: 13.5,
                marginBottom: 5,
                marginLeft: 2,
              }}>
                Period
              </label>
              <select
                value={selectedPeriodIdx}
                onChange={e => setSelectedPeriodIdx(Number(e.target.value))}
                style={{
                  width: 220,
                  fontSize: 15.5,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1.2px solid #e5eaf4',
                  color: '#25326f',
                  background: '#f8faff',
                  fontWeight: 500,
                  outline: 'none',
                  boxShadow: '0 1px 4px 0 rgba(30,40,90,0.04)',
                  transition: 'border 0.2s',
                }}
              >
                <option value={-1}>Live (Current Period)</option>
                {periods.map((p, idx) => {
                  // Ordinal suffix helper
                  const ord = n => {
                    if (n % 10 === 1 && n % 100 !== 11) return n + 'st';
                    if (n % 10 === 2 && n % 100 !== 12) return n + 'nd';
                    if (n % 10 === 3 && n % 100 !== 13) return n + 'rd';
                    return n + 'th';
                  };
                  // Format time to AM/PM
                  const fmt = t => {
                    const [h, m = '00'] = t.split(":");
                    const date = new Date();
                    date.setHours(Number(h), Number(m), 0, 0);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                  };
                  return (
                    <option key={p.label} value={idx}>
                      {ord(idx + 1)} period ({fmt(p.start)} - {fmt(p.end)})
                    </option>
                  );
                })}
              </select>
            </div>
            {/* Grade Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: 8 }}>
              <label style={{
                color: '#5b6787',
                fontWeight: 700,
                fontSize: 13.5,
                marginBottom: 5,
                marginLeft: 2,
              }}>
                Grade
              </label>
              <select
                value={gradeFilter}
                onChange={e => setGradeFilter(e.target.value)}
                style={{
                  width: 120,
                  fontSize: 15.5,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1.2px solid #e5eaf4',
                  color: '#25326f',
                  background: '#f8faff',
                  fontWeight: 500,
                  outline: 'none',
                  boxShadow: '0 1px 4px 0 rgba(30,40,90,0.04)',
                  transition: 'border 0.2s',
                }}
              >
                <option value="all">All Grades</option>
                {getAllGrades(sectionList).map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            {/* Search Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 220 }}>
              <label style={{
                color: '#5b6787',
                fontWeight: 700,
                fontSize: 13.5,
                marginBottom: 5,
                marginLeft: 2,
              }}>
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search teacher, section, or ID..."
                style={{
                  width: 220,
                  fontSize: 15.5,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1.2px solid #e5eaf4',
                  color: '#25326f',
                  background: '#f8faff',
                  fontWeight: 500,
                  outline: 'none',
                  boxShadow: '0 1px 4px 0 rgba(30,40,90,0.04)',
                  transition: 'border 0.2s',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
            <span style={{
              color: "#7a86a7",
              fontSize: 15,
              fontWeight: 600,
              minWidth: 150,
              maxWidth: 150,
              textAlign: "right",
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'monospace',
              background: '#f8faff',
              borderRadius: 8,
              padding: '7px 10px',
              border: '1px solid #e5eaf4',
              boxSizing: 'border-box',
              letterSpacing: 1,
              height: 39,
            }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 2 }}>
                <circle cx="10" cy="10" r="9" stroke="#7a86a7" strokeWidth="2" fill="none" />
                <rect x="9.2" y="4" width="1.6" height="7" rx="0.8" fill="#7a86a7" />
                <rect x="10.8" y="10.2" width="1.6" height="5" rx="0.8" transform="rotate(90 10.8 10.2)" fill="#7a86a7" />
              </svg>
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </div>


        <div style={{ marginTop: 10, border: "1px solid #dce3f2", background: "#fbfcff", borderRadius: 10, padding: 10 }}>
          {currentAssignments.length === 0 ? (
            <div style={{ textAlign: "center", padding: 16, color: "#7a86a7", background: "#f7f8fc", borderRadius: 10, border: "1px solid #e0e4ef" }}>
              No teachers are teaching right now.
            </div>
          ) : (
            <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
              {currentAssignments.map((row, idx) => (
                <div key={idx} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  alignItems: 'center',
                  background: '#fff',
                  border: '1px solid #e0e4ef',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 14,
                  fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(30,40,90,0.03)'
                }}>
                  <div>
                    <p style={{ margin: 0, color: '#25336f', fontSize: 13, fontWeight: 700 }}>{row.teacherName}</p>
                    <p style={{ margin: '2px 0 0', color: '#5d698f', fontSize: 11 }}>{row.teacherId}</p>
                  </div>
                  <span style={pillStyle(false, { width: '50%', minWidth: 90, textAlign: 'center', justifySelf: 'center' })}>{row.sectionName}</span>
                  <span style={pillStyle(false, { width: '80%', minWidth: 180, textAlign: 'center', justifySelf: 'center' })}>{row.subject}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
