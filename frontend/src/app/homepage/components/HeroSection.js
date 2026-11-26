import React, { useEffect, useState } from "react";
import { FaUser, FaSquare } from "react-icons/fa";

const DEFAULT_SECTION_ROWS = [
  { period: "07:30–08:30", subject: "English", teacher: "R. Ganilo", section: "Grade 9 – Narra", color: "#eaf0fa" },
  { period: "08:30–09:30", subject: "Mathematics", teacher: "K. De Guzman", section: "Grade 9 – Narra", color: "#e3eaf7" },
  { period: "09:50–10:50", subject: "Science", teacher: "M. Rimando", section: "Grade 9 – Narra", color: "#dbe3f7", now: true },
  { period: "10:50–11:50", subject: "Filipino", teacher: "G. Meamo", section: "Grade 9 – Narra", color: "#f0f4fa" },
  { period: "01:00–02:00", subject: "Araling Panlipunan", teacher: "M. Mercado", section: "Grade 9 – Narra", color: "#eaf0fa" },
  { period: "02:00–03:00", subject: "MAPEH", teacher: "A. Paguio", section: "Grade 9 – Narra", color: "#e3eaf7" },
];

const DEFAULT_LIVE_CARDS = [
  { name: "Maricel R. Rimando", subject: "Science", section: "Grade 9 – Narra" },
  { name: "Dr. Cesar Olinag", subject: "English", section: "Grade 7 – Sapphire" },
  { name: "Supremo Alibin", subject: "Mathematics", section: "Grade 8 – Lyra" },
  { name: "Kael Aviliti", subject: "SPA Specialization", section: "Grade 10 – Mabini" },
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

const ROW_COLORS = ["#eaf0fa", "#e3eaf7", "#dbe3f7", "#f0f4fa", "#eaf0fa", "#e3eaf7"];
const DEFAULT_PERIOD_TIMES = ["07:30–08:30", "08:30–09:30", "09:50–10:50", "10:50–11:50", "01:00–02:00", "02:00–03:00"];

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

function getLiveHomepageSnapshot() {
  const fallback = {
    schoolName: "Diadi National High School",
    academicYear: "2026–2027",
    activeTerm: "Term 1",
    teachersCount: 64,
    sectionsCount: 38,
    subjectsCount: 45,
    conflictsCount: 0,
    featuredSectionTitle: "Grade 9 – Narra (Regular)",
    featuredSectionAdviser: "Maricel R. Rimando",
    activePeriodLabel: "Period 3 · Active",
    activePeriodSubtitle: "3rd Period · 09:50 AM – 10:50 AM (Conflict-Free)",
    sectionRows: DEFAULT_SECTION_ROWS,
    liveCards: DEFAULT_LIVE_CARDS,
  };

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const profileRaw = window.localStorage.getItem("turotugma_school_profile");
    const profile = profileRaw ? JSON.parse(profileRaw) : {};

    const facultyRaw = window.localStorage.getItem("turotugma_faculty");
    const faculty = facultyRaw ? JSON.parse(facultyRaw) : [];
    const teachersCount = Array.isArray(faculty) && faculty.length > 0 ? faculty.length : 64;

    const subjectsRaw = window.localStorage.getItem("turotugma_subjects");
    const subjects = subjectsRaw ? JSON.parse(subjectsRaw) : [];
    const subjectsCount = Array.isArray(subjects) && subjects.length > 0 ? subjects.length : 45;

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
                  classification: sec?.classification || sec?.cluster || sec?.track || "Regular",
                });
              });
            }
          });
        }
      });
    }
    const sectionsCount = flatSections.length > 0 ? flatSections.length : 38;

    // Inspect Published or Draft Schedule
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

    let featuredSectionTitle = fallback.featuredSectionTitle;
    let featuredSectionAdviser = fallback.featuredSectionAdviser;
    let sectionRows = DEFAULT_SECTION_ROWS;
    let liveCards = DEFAULT_LIVE_CARDS;

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
      const schedSections = Array.isArray(activeSchedule.sections) && activeSchedule.sections.length > 0
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
        sectionById.set(key, {
          id: key,
          label,
          fullTitle: `${label} (${sec.classification || "Regular"})`,
          adviserName: sec.adviserName || sec.adviser || "",
        });
        if (sec.originalId) {
          sectionById.set(String(sec.originalId), sectionById.get(key));
        }
      });

      const slotList = Array.isArray(activeSchedule.slots) ? activeSchedule.slots : [];
      const slotById = new Map(slotList.map((s) => [String(s.id), s]));

      const parsedEntries = [];
      Object.entries(activeSchedule.assignments).forEach(([cellKey, assign]) => {
        if (!assign || (!assign.subjectId && !assign.teacherId)) return;
        const [secId, slotId] = cellKey.split("|");
        if (!secId || !slotId) return;
        const slot = slotById.get(slotId);
        const day = slot?.day || (slotId.includes("Monday") ? "Monday" : slotId.split("-")[1] || "Monday");
        let period = slot?.period ? Number(slot.period) : null;
        if (!period) {
          const pMatch = slotId.match(/P(\d+)/i) || slotId.match(/(\d+)$/);
          if (pMatch) period = parseInt(pMatch[1], 10);
        }
        if (!period) return;

        const secInfo = sectionById.get(secId) || {
          id: secId,
          label: secId,
          fullTitle: secId,
          adviserName: "",
        };
        const tName =
          assign.teacherName ||
          teacherById.get(String(assign.teacherId)) ||
          "Assigned Teacher";
        const subjTitle = resolveSubjectTitle(
          assign.subjectId || assign.subjectName || assign.subjectCode,
          subjects,
          activeSchedule.subjects
        );
        const timeLabel =
          slot?.start && slot?.end
            ? `${slot.start}–${slot.end}`
            : DEFAULT_PERIOD_TIMES[(period - 1) % DEFAULT_PERIOD_TIMES.length];

        parsedEntries.push({
          secId,
          secLabel: secInfo.label,
          secFullTitle: secInfo.fullTitle,
          adviserName: secInfo.adviserName,
          day,
          period,
          timeLabel,
          teacherId: String(assign.teacherId || tName),
          teacherName: tName,
          subjectTitle: subjTitle,
        });
      });

      if (parsedEntries.length > 0) {
        // Pick first section that has Monday (or first available day) assignments
        const firstSecId = parsedEntries[0].secId;
        const secEntries = parsedEntries.filter((e) => e.secId === firstSecId);
        const preferredDay = secEntries.some((e) => e.day === "Monday") ? "Monday" : secEntries[0].day;
        const dayEntries = secEntries
          .filter((e) => e.day === preferredDay)
          .sort((a, b) => a.period - b.period)
          .slice(0, 6);

        if (dayEntries.length > 0) {
          featuredSectionTitle = dayEntries[0].secFullTitle;
          // Identify Adviser from HGP assignment anywhere in the week for this section
          const hgpEntry = secEntries.find(
            (e) =>
              /HGP|HOMEROOM GUIDANCE/i.test(e.subjectTitle) &&
              e.teacherName &&
              e.teacherName !== "Assigned Teacher"
          );
          featuredSectionAdviser =
            hgpEntry?.teacherName ||
            dayEntries[0].adviserName ||
            dayEntries[0].teacherName;

          sectionRows = dayEntries.map((e, idx) => ({
            period: e.timeLabel,
            subject: e.subjectTitle,
            teacher: e.teacherName,
            section: e.secLabel,
            color: ROW_COLORS[idx % ROW_COLORS.length],
            now: e.period === 3 || (idx === 2 && dayEntries.length >= 3),
          }));
        }

        // Build 4 distinct-section teacher cards for Period 3 (or first period with >= 4 entries)
        const targetPeriod = parsedEntries.some((e) => e.day === preferredDay && e.period === 3)
          ? 3
          : dayEntries[0]?.period || 1;
        const periodPool = parsedEntries.filter((e) => e.day === preferredDay && e.period === targetPeriod);
        const seenTeachers = new Set();
        const seenSections = new Set();
        const distinctCards = [];
        periodPool.forEach((e) => {
          if (distinctCards.length >= 4) return;
          if (seenTeachers.has(e.teacherId) || seenSections.has(e.secId)) return;
          seenTeachers.add(e.teacherId);
          seenSections.add(e.secId);
          distinctCards.push({
            name: e.teacherName,
            subject: e.subjectTitle,
            section: e.secLabel,
          });
        });
        if (distinctCards.length > 0) {
          liveCards = distinctCards;
        }
      }
    } else if (Array.isArray(faculty) && faculty.length > 0) {
      // No generated schedule yet, but real faculty/sections/subjects exist in localStorage
      const firstSec = flatSections[0]
        ? {
            label: `Grade ${flatSections[0].grade} – ${flatSections[0].name}`,
            full: `Grade ${flatSections[0].grade} – ${flatSections[0].name} (${flatSections[0].classification})`,
          }
        : { label: "Grade 7 – Section 1", full: "Grade 7 – Section 1 (Regular)" };

      featuredSectionTitle = firstSec.full;
      const firstTeacherName =
        faculty[0]?.fullName || faculty[0]?.name || `${faculty[0]?.firstName || ""} ${faculty[0]?.lastName || ""}`.trim();
      if (firstTeacherName) featuredSectionAdviser = firstTeacherName;

      sectionRows = DEFAULT_PERIOD_TIMES.map((timeStr, idx) => {
        const t = faculty[idx % faculty.length];
        const tName = t?.fullName || t?.name || `${t?.firstName || ""} ${t?.lastName || ""}`.trim() || DEFAULT_SECTION_ROWS[idx].teacher;
        const subj = subjects[idx % Math.max(1, subjects.length)];
        const sName = subj
          ? cleanSubjectLabel(subj.subjectName || subj.name || subj.subjectCode || subj.code)
          : DEFAULT_SECTION_ROWS[idx].subject;
        return {
          period: timeStr,
          subject: sName,
          teacher: tName,
          section: firstSec.label,
          color: ROW_COLORS[idx % ROW_COLORS.length],
          now: idx === 2,
        };
      });

      liveCards = faculty.slice(0, 4).map((t, idx) => {
        const tName = t?.fullName || t?.name || `${t?.firstName || ""} ${t?.lastName || ""}`.trim() || DEFAULT_LIVE_CARDS[idx].name;
        const subj = subjects[idx % Math.max(1, subjects.length)];
        const sName = subj
          ? cleanSubjectLabel(subj.subjectName || subj.name || subj.subjectCode || subj.code)
          : DEFAULT_LIVE_CARDS[idx].subject;
        const sec = flatSections[idx % Math.max(1, flatSections.length)];
        const secLabel = sec ? `Grade ${sec.grade} – ${sec.name}` : DEFAULT_LIVE_CARDS[idx].section;
        return {
          name: tName,
          subject: sName,
          section: secLabel,
        };
      });
    }

    return {
      schoolName: profile?.schoolName || "Diadi National High School",
      academicYear: (profile?.academicYear || "2026-2027").replace("-", "–"),
      activeTerm: profile?.activeTerm || profile?.shsActiveTerm || "Term 1",
      teachersCount,
      sectionsCount,
      subjectsCount,
      conflictsCount: 0,
      featuredSectionTitle,
      featuredSectionAdviser,
      activePeriodLabel: fallback.activePeriodLabel,
      activePeriodSubtitle: fallback.activePeriodSubtitle,
      sectionRows,
      liveCards,
    };
  } catch {
    return fallback;
  }
}

const MARQUEE_TAGS = [
  "DepEd MATATAG JHS Curriculum",
  "Strengthened SHS (DO 017)",
  "DepEd DO 005 Load Balancing",
  "SP-STEM • SPA • SPJ Programs",
  "Zero Double-Booking Engine",
  "Multi-Teacher Breakout Streams",
  "Pinch-Hit Finder & Official Memo PDF",
  "School Year Rollover & Historical Archives",
  "Official DepEd A4 Timetable PDF Export",
];

export default function HeroSection() {
  const [currentTime, setCurrentTime] = useState("09:45 AM");
  const [snapshot, setSnapshot] = useState(() => getLiveHomepageSnapshot());

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true }));
    };
    tick();
    const id = setInterval(tick, 1000);

    const syncSnapshot = () => setSnapshot(getLiveHomepageSnapshot());
    window.addEventListener("storage", syncSnapshot);
    window.addEventListener("turotugma:xampp-remote-update", syncSnapshot);
    return () => {
      clearInterval(id);
      window.removeEventListener("storage", syncSnapshot);
      window.removeEventListener("turotugma:xampp-remote-update", syncSnapshot);
    };
  }, []);

  return (
    <section className="hero-background" style={{ minHeight: "100vh", paddingTop: 48, paddingBottom: 64 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "inline-block",
              background: "#eaf0fa",
              color: "#1a3a8c",
              borderRadius: 999,
              padding: "6px 18px",
              fontWeight: 700,
              fontSize: 13.5,
              border: "1px solid #c7d7f4",
            }}
          >
            {snapshot.schoolName} • S.Y. {snapshot.academicYear} · {snapshot.activeTerm}
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: "clamp(34px, 5vw, 50px)", fontWeight: 700, color: "#1a2536", margin: "0 0 10px", lineHeight: 1.15 }}>
            Smart Scheduling
            <br />
            <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#1a3a8c", fontWeight: 500 }}>
              for Every Teacher.
            </span>
          </h1>
          <p style={{ maxWidth: 640, margin: "0 auto", color: "#3a3a3a", fontSize: 17, lineHeight: 1.55 }}>
            TuroTugma auto-generates conflict-free timetables for Junior High and Senior High — respecting DepEd DO 005 teacher workloads, subject expertise, and period restrictions.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 40, flexWrap: "wrap" }}>
          <button
            type="button"
            style={{
              background: "#1a3a8c",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15.5,
              border: "none",
              borderRadius: 10,
              padding: "14px 28px",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(26, 58, 140, 0.2)",
            }}
            onClick={() => {
              window.location.href = "/public-dashboard";
            }}
          >
            ➔ View Public Timetables
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/login";
            }}
            style={{
              background: "#fff",
              color: "#1a3a8c",
              fontWeight: 700,
              fontSize: 15.5,
              border: "2px solid #1a3a8c",
              borderRadius: 10,
              padding: "14px 28px",
              cursor: "pointer",
            }}
          >
            Staff Login
          </button>
        </div>

        {/* ── BENTO GRID ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 28,
            margin: "36px auto 0 auto",
            maxWidth: 1200,
            width: "100%",
            alignItems: "stretch",
          }}
        >
          {/* LEFT: Section Timetable Card */}
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 4px 24px rgba(26,37,54,0.07)",
              border: "1px solid #e3e7ef",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Card Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid #e3e7ef",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: "#1a3a8c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaSquare style={{ color: "#eaf0fa", fontWeight: 700, fontSize: 15 }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#1a2536", margin: 0 }}>{snapshot.featuredSectionTitle}</p>
                  <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600, margin: "2px 0 0" }}>
                    Adviser: {snapshot.featuredSectionAdviser}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    background: "#eaf0fa",
                    color: "#1a3a8c",
                    fontWeight: 700,
                    fontSize: 12,
                    borderRadius: 8,
                    padding: "4px 12px",
                  }}
                >
                  {snapshot.activePeriodLabel}
                </span>
                <span style={{ fontSize: 12, color: "#475569", fontWeight: 700, fontFamily: "monospace" }}>
                  {currentTime}
                </span>
              </div>
            </div>

            {/* Mini schedule rows */}
            <div style={{ padding: "18px 22px", flex: 1 }}>
              {snapshot.sectionRows.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: row.color,
                    borderRadius: 12,
                    padding: "11px 16px",
                    marginBottom: 8,
                    boxShadow: row.now ? "0 0 0 2px #1a3a8c44" : undefined,
                  }}
                >
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#475569", width: 76, flexShrink: 0 }}>
                    {row.period}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
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
                      {row.subject}
                    </p>
                    <p style={{ fontSize: 10.5, color: "#475569", fontWeight: 600, margin: 0 }}>{row.teacher}</p>
                  </div>
                  <span style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600 }}>{row.section}</span>
                  {row.now && (
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        background: "#1a3a8c",
                        color: "#fff",
                        padding: "2px 8px",
                        borderRadius: 12,
                      }}
                    >
                      NOW
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Live Multi-Section Period 3 Status + Real System KPIs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Teacher Status Panel — Distinct Sections in Period 3 (Zero Overlap!) */}
            <div
              style={{
                background: "#1a3a8c",
                borderRadius: 20,
                boxShadow: "0 4px 24px rgba(26,37,54,0.12)",
                flex: 1,
                color: "#fff",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "18px 24px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "#ffffff", margin: 0 }}>
                    Current Assignment View · Live Across Sections
                  </p>
                  <p style={{ fontSize: 11, color: "#c7d7f4", fontWeight: 500, margin: "3px 0 0 0" }}>
                    3rd Period · 09:50 AM – 10:50 AM (Conflict-Free)
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    background: "rgba(34, 197, 94, 0.2)",
                    color: "#86efac",
                    border: "1px solid rgba(134, 239, 172, 0.4)",
                    padding: "3px 8px",
                    borderRadius: 999,
                  }}
                >
                  0 Overlaps
                </span>
              </div>
              <div style={{ padding: "14px 18px" }}>
                {snapshot.liveCards.map((card, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 12,
                      padding: "11px 16px",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "#eaf0fa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <FaUser style={{ color: "#1a3a8c", fontWeight: 700, fontSize: 13 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#ffffff",
                          margin: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {card.name}
                      </p>
                      <p style={{ fontSize: 10.5, color: "#c7d7f4", margin: 0 }}>{card.subject}</p>
                    </div>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: "#ffffff",
                        background: "rgba(255,255,255,0.12)",
                        padding: "3px 9px",
                        borderRadius: 999,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {card.section}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Row (Dynamically synced from active database) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { label: "TEACHERS PROFILED", value: snapshot.teachersCount },
                { label: "ACTIVE SECTIONS", value: snapshot.sectionsCount },
                { label: "SUBJECTS CATALOG", value: snapshot.subjectsCount },
                { label: "UNRESOLVED CONFLICTS", value: snapshot.conflictsCount },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    boxShadow: "0 2px 8px rgba(26,37,54,0.07)",
                    border: "1px solid #e3e7ef",
                    padding: "14px 18px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#1a3a8c",
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                    }}
                  >
                    {stat.label}
                  </span>
                  <p style={{ fontSize: 26, fontWeight: 800, color: "#1a2536", margin: "4px 0 0 0" }}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Seamless Single-Line Marquee Strip */}
        <div
          style={{
            marginTop: 44,
            padding: "14px 0",
            borderTop: "1px solid #e3e7ef",
            borderBottom: "1px solid #e3e7ef",
            overflow: "hidden",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "max-content",
              gap: 36,
              animation: "turotugmaMarquee 34s linear infinite",
            }}
          >
            {[...MARQUEE_TAGS, ...MARQUEE_TAGS].map((item, i) => (
              <span
                key={i}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: i % 2 === 1 ? "#3B4197" : "#1a3a8c",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#93c5fd" }} />
                {item}
              </span>
            ))}
          </div>
          <style>{`
            @keyframes turotugmaMarquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
        </div>
      </div>
    </section>
  );
}
