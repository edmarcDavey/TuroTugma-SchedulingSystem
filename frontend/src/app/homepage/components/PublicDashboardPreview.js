import React, { useEffect, useState } from "react";
import { FaUser, FaSearch } from "react-icons/fa";

const DEFAULT_TEACHER_LIST = [
  { name: "Mr. Maverick Cadabuna", subject: "English", section: "Grade 9 – Narra" },
  { name: "Mr. Jigerson Benigno", subject: "Mathematics", section: "Grade 9 – Molave" },
  { name: "Mr. Rehd Pacis", subject: "Science", section: "Grade 9 – Acacia" },
  { name: "Dr. Daryl Jake Rivera", subject: "Values Education", section: "Grade 9 – Kalantas" },
  { name: "Mr. Earol John Gannaban", subject: "Araling Panlipunan", section: "Grade 9 – Ipil-Ipil" },
  { name: "Mr. Ian Rovic Tulayao", subject: "Filipino", section: "Grade 9 – Mango" },
];

const SUBJECT_CODE_FALLBACK = {
  ENG: "English",
  MATH: "Mathematics",
  SCI: "Science",
  FIL: "Filipino",
  AP: "Araling Panlipunan",
  VE: "Values Education",
  ESP: "Values Education",
  MAPEH: "MAPEH",
  TLE: "Technology and Livelihood Education (TLE)",
  HGP: "Homeroom Guidance Program (HGP)",
  HRG: "Homeroom Guidance Program (HGP)",
  ARAL: "Aral Program",
  SPASPEC: "SPA Specialization",
};

function cleanSubjectLabel(rawName) {
  if (!rawName || typeof rawName !== "string") return rawName || "";
  const trimmed = rawName.trim();
  const jhsCorePattern =
    /^(Science|Mathematics|Math|English|Filipino|Araling Panlipunan|Edukasyon sa Pagpapakakatao|EsP|Values Education|MAPEH|Technology and Livelihood Education|TLE)\s+\d+$/i;
  return jhsCorePattern.test(trimmed) ? trimmed.replace(/\s+\d+$/i, "").trim() : trimmed;
}

function resolveSubjectTitle(subjectId, subjectsList = [], schedSubjects = []) {
  if (!subjectId) return "Subject";
  const all = [...(Array.isArray(subjectsList) ? subjectsList : []), ...(Array.isArray(schedSubjects) ? schedSubjects : [])];
  const direct = all.find(
    (s) => s && (s.id === subjectId || s.subjectId === subjectId || s.code === subjectId || s.subjectCode === subjectId)
  );
  if (direct) {
    return cleanSubjectLabel(direct.subjectName || direct.name || direct.subjectCode || direct.code || subjectId);
  }
  const rawStr = String(subjectId).trim();
  const match = rawStr.match(/^SUBJ-([A-Z0-9-]+)-\d+$/i) || rawStr.match(/^(?:jhs|shs)-([a-z0-9-]+)$/i);
  const code = match ? match[1].toUpperCase() : rawStr.toUpperCase();
  const byCode = all.find(
    (s) => s && (String(s.subjectCode || "").toUpperCase() === code || String(s.code || "").toUpperCase() === code)
  );
  if (byCode) {
    return cleanSubjectLabel(byCode.subjectName || byCode.name || code);
  }
  return SUBJECT_CODE_FALLBACK[code] || cleanSubjectLabel(rawStr);
}

function getLivePreviewAssignments() {
  if (typeof window === "undefined") return DEFAULT_TEACHER_LIST;

  try {
    const facultyRaw = window.localStorage.getItem("turotugma_faculty");
    const faculty = facultyRaw ? JSON.parse(facultyRaw) : [];

    const subjectsRaw = window.localStorage.getItem("turotugma_subjects");
    const subjects = subjectsRaw ? JSON.parse(subjectsRaw) : [];

    const sectionsRaw = window.localStorage.getItem("turotugma_sections_created");
    const sectionsObj = sectionsRaw ? JSON.parse(sectionsRaw) : null;
    const flatSections = [];
    if (sectionsObj && typeof sectionsObj === "object") {
      ["jhs", "shs"].forEach((lvl) => {
        if (sectionsObj[lvl] && typeof sectionsObj[lvl] === "object") {
          Object.entries(sectionsObj[lvl]).forEach(([gradeKey, g]) => {
            if (Array.isArray(g?.sections)) {
              g.sections.forEach((sec, idx) => {
                flatSections.push({
                  id: `${lvl}-${gradeKey}-${idx}`,
                  originalId: sec?.id,
                  grade: Number(gradeKey),
                  name: sec?.name || `Section ${idx + 1}`,
                });
              });
            }
          });
        }
      });
    }

    let activeSchedule = null;
    const pubRaw = window.localStorage.getItem("turotugma_published_schedules");
    if (pubRaw) {
      const parsedPub = JSON.parse(pubRaw);
      if (parsedPub && typeof parsedPub === "object") {
        const list = Object.values(parsedPub).filter((s) => s && s.assignments && Object.keys(s.assignments).length > 0);
        if (list.length > 0) activeSchedule = list[0];
      }
    }
    if (!activeSchedule) {
      const draftsRaw = window.localStorage.getItem("turotugma_schedule_drafts");
      if (draftsRaw) {
        const parsedDrafts = JSON.parse(draftsRaw);
        if (Array.isArray(parsedDrafts)) {
          const valid = parsedDrafts
            .map((d) => d?.schedule || d)
            .filter((s) => s && s.assignments && Object.keys(s.assignments).length > 0);
          if (valid.length > 0) activeSchedule = valid[0];
        }
      }
    }

    const teacherById = new Map();
    if (Array.isArray(faculty)) {
      faculty.forEach((t) => {
        if (!t) return;
        const name = t.fullName || t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim();
        if (name) {
          if (t.id) teacherById.set(String(t.id), name);
          if (t.employeeId) teacherById.set(String(t.employeeId), name);
        }
      });
    }

    if (activeSchedule && activeSchedule.assignments) {
      const schedSections =
        Array.isArray(activeSchedule.sections) && activeSchedule.sections.length > 0
          ? activeSchedule.sections
          : flatSections;
      const schedTeachers = Array.isArray(activeSchedule.teachers) ? activeSchedule.teachers : [];
      schedTeachers.forEach((t) => {
        if (!t) return;
        const name = t.fullName || t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim();
        if (name && t.id && !teacherById.has(String(t.id))) {
          teacherById.set(String(t.id), name);
        }
      });

      const sectionById = new Map();
      schedSections.forEach((sec, idx) => {
        if (!sec) return;
        const key = String(sec.id || `jhs-${sec.grade || 7}-${idx}`);
        const label = `Grade ${sec.grade || 7} – ${sec.name || `Section ${idx + 1}`}`;
        sectionById.set(key, label);
        if (sec.originalId) sectionById.set(String(sec.originalId), label);
      });

      const slotList = Array.isArray(activeSchedule.slots) ? activeSchedule.slots : [];
      const slotById = new Map(slotList.map((s) => [String(s.id), s]));

      const rows = [];
      const seenTeachers = new Set();
      const seenSections = new Set();

      Object.entries(activeSchedule.assignments).forEach(([cellKey, assign]) => {
        if (!assign || (!assign.teacherId && !assign.teacherName)) return;
        const [secId, slotId] = cellKey.split("|");
        if (!secId || !slotId) return;
        const slot = slotById.get(slotId);
        const day = slot?.day || (slotId.includes("Monday") ? "Monday" : slotId.split("-")[1] || "Monday");
        let period = slot?.period ? Number(slot.period) : null;
        if (!period) {
          const pMatch = slotId.match(/P(\d+)/i) || slotId.match(/(\d+)$/);
          if (pMatch) period = parseInt(pMatch[1], 10);
        }
        if (day !== "Monday" || (period !== 3 && rows.length >= 6)) return;

        const tKey = String(assign.teacherId || assign.teacherName);
        if (seenTeachers.has(tKey) || seenSections.has(secId)) return;

        const tName = assign.teacherName || teacherById.get(String(assign.teacherId));
        if (!tName) return;

        seenTeachers.add(tKey);
        seenSections.add(secId);

        rows.push({
          name: tName,
          subject: resolveSubjectTitle(
            assign.subjectId || assign.subjectName || assign.subjectCode,
            subjects,
            activeSchedule.subjects
          ),
          section: sectionById.get(secId) || secId,
        });
      });

      if (rows.length >= 4) {
        return rows.slice(0, 12);
      }
    }

    if (Array.isArray(faculty) && faculty.length > 0) {
      return faculty.slice(0, 12).map((t, idx) => {
        const tName =
          t?.fullName ||
          t?.name ||
          `${t?.firstName || ""} ${t?.lastName || ""}`.trim() ||
          DEFAULT_TEACHER_LIST[idx % DEFAULT_TEACHER_LIST.length].name;
        const subj = subjects[idx % Math.max(1, subjects.length)];
        const sName = subj
          ? cleanSubjectLabel(subj.subjectName || subj.name || subj.subjectCode || subj.code)
          : DEFAULT_TEACHER_LIST[idx % DEFAULT_TEACHER_LIST.length].subject;
        const sec = flatSections[idx % Math.max(1, flatSections.length)];
        const secLabel = sec
          ? `Grade ${sec.grade} – ${sec.name}`
          : DEFAULT_TEACHER_LIST[idx % DEFAULT_TEACHER_LIST.length].section;
        return {
          name: tName,
          subject: sName,
          section: secLabel,
        };
      });
    }

    return DEFAULT_TEACHER_LIST;
  } catch {
    return DEFAULT_TEACHER_LIST;
  }
}

export default function PublicDashboardPreview() {
  const [assignments, setAssignments] = useState(() => getLivePreviewAssignments());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const sync = () => setAssignments(getLivePreviewAssignments());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("turotugma:xampp-remote-update", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("turotugma:xampp-remote-update", sync);
    };
  }, []);

  const filteredList = assignments
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(item.name || "").toLowerCase().includes(q) ||
        String(item.subject || "").toLowerCase().includes(q) ||
        String(item.section || "").toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  return (
    <section style={{ background: "#fff", padding: "64px 0" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 40,
          alignItems: "center",
        }}
      >
        {/* Left: Copy */}
        <div>
          <span
            style={{
              color: "#1a3a8c",
              fontWeight: 700,
              fontSize: 13.5,
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 12,
              display: "inline-block",
            }}
          >
            Public Access
          </span>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 800, color: "#1a2536", marginBottom: 0, lineHeight: 1.15 }}>
            Teachers & students
            <br />
            <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 500 }}>see it live.</span>
          </h2>
          <p style={{ color: "#3a3a3a", fontSize: 16.5, margin: "16px 0 0 0", maxWidth: 480, lineHeight: 1.55 }}>
            No login required. The public dashboard displays every teacher&apos;s current class section assignment and the full published timetable — synchronized to the active school bell schedule.
          </p>
          <ul style={{ margin: "24px 0 28px 0", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {[
              "Live bell clock — automatically tracks the active period or break",
              "Inspect any weekday (Monday–Friday) or period with one click",
              "Search by teacher name, Employee ID, section, or subject",
              "Download official DepEd A4 landscape Section & Teacher PDFs",
            ].map((item, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14.5, color: "#1a2536" }}>
                <span style={{ color: "#16a34a", fontSize: 16, fontWeight: 800 }}>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a
            href="/public-dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#1a3a8c",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15.5,
              border: "none",
              borderRadius: 10,
              padding: "14px 28px",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(26,58,140,0.18)",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 18 }}>→</span> View Public Dashboard
          </a>
        </div>

        {/* Right: Preview Card */}
        <div>
          <div
            style={{
              background: "#f8faff",
              borderRadius: 20,
              boxShadow: "0 4px 24px rgba(26,37,54,0.1)",
              border: "1px solid #e3e7ef",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "#1a2536",
                padding: "18px 24px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: "#ffffff", margin: 0 }}>Current Class Assignments</p>
                <p style={{ fontSize: 11, color: "#c7d7f4", fontWeight: 500, margin: "3px 0 0 0" }}>
                  3rd Period · 09:50 AM – 10:50 AM
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "#ffffff",
                    background: "#1a3a8c",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 8,
                    padding: "4px 10px",
                  }}
                >
                  Live Today
                </span>
              </div>
            </div>

            {/* Search bar */}
            <div style={{ padding: "12px 24px", borderBottom: "1px solid #e3e7ef", background: "#fff" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#f1f5fd",
                  borderRadius: 8,
                  padding: "8px 14px",
                  border: "1px solid #dce5f7",
                }}
              >
                <span style={{ color: "#1a3a8c", fontSize: 14, display: "flex" }}>
                  <FaSearch />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search teacher, section, subject…"
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 12.5,
                    color: "#1a2536",
                    width: "100%",
                    fontWeight: 500,
                  }}
                />
              </div>
            </div>

            {/* Teacher list */}
            <div>
              {filteredList.length === 0 ? (
                <div style={{ padding: "20px 24px", textAlign: "center", fontSize: 12.5, color: "#64748b", background: "#fff" }}>
                  No matching teacher, subject, or section found.
                </div>
              ) : (
                filteredList.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "11px 24px",
                      borderBottom: i < filteredList.length - 1 ? "1px solid #e3e7ef" : "none",
                      background: "#ffffff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <span
                        style={{
                          background: "#eaf0fa",
                          color: "#1a3a8c",
                          borderRadius: "50%",
                          width: 28,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        <FaUser />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#1a2536",
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {t.name}
                        </p>
                        <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600, margin: 0 }}>{t.subject}</p>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#1a3a8c",
                        background: "#eaf0fa",
                        padding: "3px 10px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.section}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
