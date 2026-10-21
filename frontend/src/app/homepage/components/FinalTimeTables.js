// Normalize sections to flat array with correct IDs and names (copied from ScheduleMaker.js)
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


import React, { useEffect, useState, useRef } from "react";
import html2pdf from "html2pdf.js";

function getFromStorage(key, fallback) {
  try {
    const val = window.localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

const DRAFTS_STORAGE_KEY = "turotugma_schedule_drafts";
const SECTIONS_STORAGE_KEY = "turotugma_sections_created";
const SUBJECTS_STORAGE_KEY = "turotugma_subjects";
const FACULTY_STORAGE_KEY = "turotugma_faculty";

export default function FinalTimeTables() {
  const [draft, setDraft] = useState(null);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [gradeFilter, setGradeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('sections'); // 'sections' or 'teachers'
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [teacherType, setTeacherType] = useState('all'); // 'all', 'adviser', 'non-adviser'
  // Ref for exportable schedules only (not the whole component)
  const exportSchedulesRef = useRef();

  function handleExport() {
    if (exportSchedulesRef.current) {
      // Clone only the schedules container
      const exportClone = exportSchedulesRef.current.cloneNode(true);
      // Add CSS for page-breaks
      const style = document.createElement('style');
      style.innerHTML = `
        .export-section-page-break { page-break-after: always; break-after: page; }
        @media print { .export-section-page-break { page-break-after: always; break-after: page; } }
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      `;
      exportClone.prepend(style);
      // Add class to each schedule block (section or teacher)
      Array.from(exportClone.querySelectorAll('div')).forEach(div => {
        if (div.classList.contains('schedule-block')) {
          div.classList.add('export-section-page-break');
        }
      });
      html2pdf()
        .set({
          margin: 0.2,
          filename: `FinalSchedule-${draft.name || 'export'}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
          pagebreak: { mode: ['css', 'legacy'] }
        })
        .from(exportClone)
        .save();
    }
  }

  const loadActiveSchedule = () => {
    try {
      const publishedRaw = getFromStorage("turotugma_published_schedules", null);
      if (publishedRaw && typeof publishedRaw === "object") {
        const pubList = Object.values(publishedRaw).filter((item) => item && item.assignments && Object.keys(item.assignments).length > 0);
        if (pubList.length > 0) {
          pubList.sort((a, b) => new Date(b.publishedAt || b.updatedAt || 0) - new Date(a.publishedAt || a.updatedAt || 0));
          const latestPub = pubList[0];
          setDraft({
            id: `published-${latestPub.scheduleType || "jhs"}`,
            scheduleType: latestPub.scheduleType || "jhs",
            name: `Published Schedule — ${(latestPub.scheduleType || "jhs").toUpperCase()}`,
            updatedAt: latestPub.publishedAt || latestPub.updatedAt,
            schedule: latestPub,
            config: latestPub.config || latestPub.scheduleConfig,
          });
          const sectionsRaw = getFromStorage(SECTIONS_STORAGE_KEY, {});
          setSections(normalizeSections(sectionsRaw, latestPub?.scheduleType || "jhs"));
          setSubjects(getFromStorage(SUBJECTS_STORAGE_KEY, []));
          setTeachers(getFromStorage(FACULTY_STORAGE_KEY, []));
          return;
        }
      }
      setDraft(null);
    } catch (err) {
      console.error("Error loading active schedule in FinalTimeTables:", err);
      setDraft(null);
    }
  };

  useEffect(() => {
    loadActiveSchedule();
    const handleSync = () => loadActiveSchedule();
    window.addEventListener("storage", handleSync);
    window.addEventListener("focus", handleSync);
    window.addEventListener("turotugma:schedule-updated", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("turotugma:schedule-updated", handleSync);
    };
  }, []);

  function getSectionName(sectionId) {
    // Try to find the section name robustly for IDs like 'jhs-7-0'
    let allSections = [];
    if (Array.isArray(sections)) {
      allSections = sections;
    } else if (sections && (sections.jhs || sections.shs)) {
      allSections = [
        ...(sections.jhs ? Object.values(sections.jhs).flat() : []),
        ...(sections.shs ? Object.values(sections.shs).flat() : []),
      ];
    }
    // Try direct match
    let found = allSections.find((s) => s.id === sectionId);
    if (found) return found.name || found.sectionName || sectionId;
    // Try partial match (e.g., sectionId starts with s.id or vice versa)
    found = allSections.find(
      (s) =>
        typeof s.id === 'string' &&
        (sectionId.startsWith(s.id) || s.id.startsWith(sectionId))
    );
    if (found) return found.name || found.sectionName || sectionId;
    // Try to parse sectionId for fallback label and map by index if possible
    const match = sectionId.match(/jhs-(\d+)-(\d+)/i);
    if (match) {
      const grade = match[1];
      const idx = parseInt(match[2], 10);
      // Try to find all sections for this grade
      let gradeSections = allSections.filter(
        (s) =>
          (s.grade && (s.grade === grade || s.grade == parseInt(grade, 10))) ||
          (s.name && s.name.includes(grade)) ||
          (s.sectionName && s.sectionName.includes(grade))
      );
      // If not found, fallback to allSections
      if (gradeSections.length === 0) gradeSections = allSections;
      if (gradeSections[idx]) {
        return gradeSections[idx].name || gradeSections[idx].sectionName || sectionId;
      }
      return `Grade ${grade} - Section ${idx + 1}`;
    }
    return sectionId;
  }
  function formatCleanSubjectName(rawName) {
    if (!rawName || typeof rawName !== "string") return rawName || "";
    let name = rawName.trim();
    const jhsCorePattern = /^(Science|Mathematics|Math|English|Filipino|Araling Panlipunan|Edukasyon sa Pagpapakakatao|EsP|MAPEH|Technology and Livelihood Education|TLE)\s+\d+$/i;
    if (jhsCorePattern.test(name)) {
      return name.replace(/\s+\d+$/i, "").trim();
    }
    return name;
  }
  function getSubjectName(subjectId) {
    const found = Array.isArray(subjects) ? subjects.find((s) => s.id === subjectId) : null;
    const raw = found ? found.subjectName || found.name : subjectId;
    return formatCleanSubjectName(raw);
  }
  function getTeacherName(teacherId) {
    const found = Array.isArray(teachers) ? teachers.find((t) => t.id === teacherId) : null;
    return found ? found.teacherName || found.name : teacherId;
  }

  const {
    cellAssignmentIndex,
    teacherAssignmentIndex,
    sectionsById,
    subjectsById,
    teachersById,
    days,
    regularDays,
    shortenedDays,
    maxPeriods,
  } = React.useMemo(() => {
    const cellIdx = new Map();
    const teacherIdx = new Map();
    const secMap = new Map();
    const subMap = new Map();
    const tMap = new Map();
    const sById = new Map();

    if (!draft || !draft.schedule) {
      return {
        cellAssignmentIndex: cellIdx,
        teacherAssignmentIndex: teacherIdx,
        sectionsById: secMap,
        subjectsById: subMap,
        teachersById: tMap,
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        regularDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        shortenedDays: ["Friday"],
        maxPeriods: 8,
      };
    }

    const sched = draft.schedule;
    const assign = sched.assignments || {};

    const secList = Array.isArray(sched.sections) && sched.sections.length > 0 ? sched.sections : sections;
    secList.forEach((s) => {
      if (s.id) secMap.set(s.id, s);
      if (s.name) secMap.set(s.name, s);
      if (s.code) secMap.set(s.code, s);
    });

    const allSubjects = Array.isArray(sched.subjects) && sched.subjects.length > 0
      ? [...sched.subjects, ...(subjects || [])]
      : subjects || [];
    allSubjects.forEach((s) => {
      if (s.id) subMap.set(s.id, s);
      if (s.subjectCode) subMap.set(s.subjectCode, s);
      if (s.code) subMap.set(s.code, s);
    });

    const allTeachers = Array.isArray(sched.teachers) && sched.teachers.length > 0
      ? [...sched.teachers, ...(teachers || [])]
      : Array.isArray(sched.faculty) && sched.faculty.length > 0
      ? [...sched.faculty, ...(teachers || [])]
      : teachers || [];
    allTeachers.forEach((t) => {
      if (t.id) tMap.set(t.id, t);
      if (t.name) tMap.set(t.name, t);
      if (t.teacherName) tMap.set(t.teacherName, t);
    });

    const slotList = Array.isArray(sched.slots) && sched.slots.length > 0 ? sched.slots : [];
    slotList.forEach((s) => sById.set(s.id, s));

    const levelCfg = sched.config?.jhs || draft?.config?.jhs || {};
    const weekdayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    let daysFromSlots = [];
    let regDaysFromSlots = [];
    let shortDaysFromSlots = [];

    if (slotList.length > 0) {
      const daySet = new Set();
      const regSet = new Set();
      const shortSet = new Set();

      slotList.forEach((s) => {
        if (s.day) {
          daySet.add(s.day);
          if (s.sessionType === "shortened") shortSet.add(s.day);
          else regSet.add(s.day);
        }
      });

      daysFromSlots = Array.from(daySet);
      regDaysFromSlots = Array.from(regSet);
      shortDaysFromSlots = Array.from(shortSet);
    }

    let regDays = regDaysFromSlots.length > 0
      ? regDaysFromSlots
      : (Array.isArray(levelCfg.regularDays) && levelCfg.regularDays.length > 0
        ? levelCfg.regularDays
        : ["Monday", "Tuesday", "Wednesday", "Thursday"]);

    let shortDays = shortDaysFromSlots.length > 0
      ? shortDaysFromSlots
      : (Array.isArray(levelCfg.shortenedDays) && levelCfg.shortenedDays.length > 0
        ? levelCfg.shortenedDays
        : ["Friday"]);

    let dayList = daysFromSlots.length > 0
      ? daysFromSlots
      : Array.from(new Set([...regDays, ...shortDays]));

    if (assign) {
      Object.keys(assign).forEach((cellKey) => {
        if (!cellKey) return;
        const parts = cellKey.split("|");
        if (parts.length < 2) return;
        const slotId = parts[1];
        let slot = sById.get(slotId);
        let day = slot?.day;
        if (!day) {
          const lowerSlot = slotId.toLowerCase();
          if (lowerSlot.includes("mon")) day = "Monday";
          else if (lowerSlot.includes("tue")) day = "Tuesday";
          else if (lowerSlot.includes("wed")) day = "Wednesday";
          else if (lowerSlot.includes("thu")) day = "Thursday";
          else if (lowerSlot.includes("fri")) day = "Friday";
          else if (lowerSlot.includes("sat")) day = "Saturday";
          else if (lowerSlot.includes("sun")) day = "Sunday";
        }

        const secId = parts[0];
        const period = slot?.period ? Number(slot.period) : null;
        const secObj = secMap.get(secId) || secList.find((s) => s.id === secId || s.name === secId);
        const sectionAliases = new Set([secId]);
        if (secObj) {
          if (secObj.id) sectionAliases.add(secObj.id);
          if (secObj.name) sectionAliases.add(secObj.name);
          if (secObj.code) sectionAliases.add(secObj.code);
        }

        const jhsMatch = String(secId).match(/jhs-(\d+)-(\d+)/i);
        if (jhsMatch) {
          const g = parseInt(jhsMatch[1], 10);
          const idx = parseInt(jhsMatch[2], 10);
          const gradeSecs = secList.filter((s) => Number(s.grade) === g);
          if (gradeSecs[idx]) {
            sectionAliases.add(gradeSecs[idx].id);
            sectionAliases.add(gradeSecs[idx].name);
          }
        }

        sectionAliases.forEach((alias) => {
          if (day && period) {
            cellIdx.set(`${alias}|${day}|${period}`, assign[cellKey]);
          }
          cellIdx.set(`${alias}|${slotId}`, assign[cellKey]);
        });

        if (assign[cellKey]?.teacherId && day && period) {
          teacherIdx.set(`${assign[cellKey].teacherId}|${day}|${period}`, { assignment: assign[cellKey], sectionId: secId });
        }

        if (day && !dayList.includes(day)) {
          dayList.push(day);
        }
      });
    }

    dayList.sort((a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b));
    if (dayList.length === 0) {
      dayList = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    }

    regDays = regDays.filter((d) => dayList.includes(d));
    shortDays = shortDays.filter((d) => dayList.includes(d));

    const maxPFromSlots = slotList.length > 0 ? Math.max(...slotList.map((s) => Number(s.period) || 1)) : 0;
    const maxP = Math.max(maxPFromSlots, levelCfg.periods?.regular || 8, levelCfg.periods?.special || 8);

    return {
      cellAssignmentIndex: cellIdx,
      teacherAssignmentIndex: teacherIdx,
      sectionsById: secMap,
      subjectsById: subMap,
      teachersById: tMap,
      days: dayList,
      regularDays: regDays,
      shortenedDays: shortDays,
      maxPeriods: maxP,
    };
  }, [draft, sections, subjects, teachers]);

  function getCellAssignment(sectionId, day, periodNum) {
    const secObj = sectionsById.get(sectionId);
    const secName = secObj?.name || getSectionName(sectionId);
    return (
      cellAssignmentIndex.get(`${sectionId}|${day}|${periodNum}`) ||
      cellAssignmentIndex.get(`${secName}|${day}|${periodNum}`) ||
      null
    );
  }

  function getTeacherCellAssignment(teacherId, day, periodNum) {
    return teacherAssignmentIndex.get(`${teacherId}|${day}|${periodNum}`) || null;
  }

  function getAdviserName(sectionId) {
    const checkDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    for (const day of checkDays) {
      for (let p = 1; p <= 8; p++) {
        const assign = getCellAssignment(sectionId, day, p);
        if (assign?.teacherId) {
          return getTeacherName(assign.teacherId);
        }
      }
    }
    return "-";
  }

  // Render notice if no published schedule
  if (!draft || !draft.schedule || !draft.config) {
    return (
      <div style={{ padding: "30px 20px" }}>
        <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>Final Time Tables</h1>
        <div
          style={{
            marginTop: 20,
            padding: "32px 30px",
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <h3 style={{ margin: "0 0 8px", color: "#1e293b", fontSize: 20, fontWeight: 700 }}>
            No Published Schedule Available
          </h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: 15, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
            Only officially published schedules are displayed in the public view. If you are an administrator, please go to the <b>Schedule Generator</b> in the dashboard and click <b>Publish Schedule</b> to make the active schedule public.
          </p>
        </div>
      </div>
    );
  }

  // Use config from draft
  const config = draft.config;
  const scheduleType = draft.scheduleType;
  const assignments = draft.schedule.assignments || {};

  // For demo, use JHS config
  const levelConfig = config["jhs"] || {};
  const weekdayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const periods = Array.from({ length: maxPeriods || levelConfig.periods?.regular || 8 }, (_, i) => i + 1);

  // Section and teacher view logic
  let sectionIds = Array.from(
    new Set([...Object.keys(assignments).map((k) => k.split("|")[0]), ...sections.map((s) => s.id)])
  ).filter(Boolean);

  const sectionIdToGrade = {};
  sections.forEach(s => { sectionIdToGrade[s.id] = s.grade; });

  let teacherIds = Array.from(
    new Set(Object.values(assignments).map(a => a?.teacherId).filter(Boolean))
  );
  if (teacherIds.length === 0 && teachers.length > 0) {
    teacherIds = teachers.map((t) => t.id);
  }

  let filteredTeacherIds = teacherIds;
  if (viewMode === 'teachers' && searchTerm.trim()) {
    const lower = searchTerm.trim().toLowerCase();
    filteredTeacherIds = teacherIds.filter(id => {
      const teacher = teachers.find(t => t.id === id);
      return teacher && (teacher.teacherName || teacher.name || '').toLowerCase().includes(lower);
    });
  }

  if (viewMode === 'sections' && gradeFilter !== 'all') {
    sectionIds = sectionIds.filter(id => String(sectionIdToGrade[id]) === String(gradeFilter));
  }
  if (viewMode === 'sections' && selectedSection !== 'all') {
    sectionIds = sectionIds.filter(id => id === selectedSection);
  }
  if (viewMode === 'sections' && searchTerm.trim()) {
    const lower = searchTerm.trim().toLowerCase();
    sectionIds = sectionIds.filter(id => {
      const section = sections.find(s => s.id === id);
      return section && (section.name || '').toLowerCase().includes(lower);
    });
  }

  if (viewMode === 'teachers' && selectedTeacher !== 'all') {
    filteredTeacherIds = filteredTeacherIds.filter(id => id === selectedTeacher);
  }
  if (viewMode === 'teachers' && teacherType !== 'all') {
    const adviserIds = new Set();
    sectionIds.forEach(sectionId => {
      const adviserName = getAdviserName(sectionId);
      if (adviserName && adviserName !== "-") {
        const advObj = teachers.find((t) => (t.teacherName || t.name) === adviserName || t.id === adviserName);
        if (advObj) adviserIds.add(advObj.id);
      }
    });
    if (teacherType === 'adviser') {
      filteredTeacherIds = filteredTeacherIds.filter(id => adviserIds.has(id));
    } else if (teacherType === 'non-adviser') {
      filteredTeacherIds = filteredTeacherIds.filter(id => !adviserIds.has(id));
    }
  }

  return (
    <div>
      <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>Final Time Tables</h1>
      <div style={{ margin: "8px 0 8px", color: "#5b6787", fontSize: 14, maxWidth: 920 }}>
        Viewing published schedule: <b>{draft && draft.name}</b>
      </div>
      {/* View filter and contextual dropdowns + Export button */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: 18,
        marginBottom: 8,
        marginLeft: 0,
        marginRight: 0,
        gap: 18,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <label style={{
            color: '#5b6787',
            fontWeight: 700,
            fontSize: 13.5,
            marginBottom: 5,
            marginLeft: 2,
          }}>
            View
          </label>
          <select
            value={viewMode}
            onChange={e => {
              setViewMode(e.target.value);
              setSelectedSection('all');
              setSelectedTeacher('all');
            }}
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
            <option value="sections">Timetables of Sections</option>
            <option value="teachers">Timetables of Teachers</option>
          </select>
        </div>
        {/* Section dropdown (sections view) */}
        {viewMode === 'sections' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{
              color: '#5b6787',
              fontWeight: 700,
              fontSize: 13.5,
              marginBottom: 5,
              marginLeft: 2,
            }}>
              Section
            </label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              style={{
                width: 180,
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
              <option value="all">All Sections</option>
              {Array.from(new Set(sections.map(s => s.id))).map(id => (
                <option key={id} value={id}>{getSectionName(id)}</option>
              ))}
            </select>
          </div>
        )}
        {/* Grade dropdown (sections view) */}
        {viewMode === 'sections' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
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
              {allGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        )}
        {/* Teacher dropdown and type filter (teachers view) */}
        {viewMode === 'teachers' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <label style={{
                color: '#5b6787',
                fontWeight: 700,
                fontSize: 13.5,
                marginBottom: 5,
                marginLeft: 2,
              }}>
                Teacher
              </label>
              <select
                value={selectedTeacher}
                onChange={e => setSelectedTeacher(e.target.value)}
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
                <option value="all">All Teachers</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.teacherName || t.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <label style={{
                color: '#5b6787',
                fontWeight: 700,
                fontSize: 13.5,
                marginBottom: 5,
                marginLeft: 2,
              }}>
                Type
              </label>
              <select
                value={teacherType}
                onChange={e => setTeacherType(e.target.value)}
                style={{
                  width: 140,
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
                <option value="all">All</option>
                <option value="adviser">Adviser</option>
                <option value="non-adviser">Non-Adviser</option>
              </select>
            </div>
          </>
        )}
        </div>
        <button onClick={handleExport} style={{ padding: '10px 22px', background: '#1a3a8c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginLeft: 'auto', marginTop: 0, marginBottom: 0 }}>
          Export as PDF
        </button>
      </div>
      {/* Schedules to export: only these are included in PDF */}
      <div ref={exportSchedulesRef}>
      {viewMode === 'sections' && sectionIds.map((sectionId) => {
        // Adviser: teacher assigned to first period (P1) for this section
        const firstPeriodKey = `${sectionId}|JHS-P1`;
        const adviserId = assignments[firstPeriodKey]?.teacherId;
        const adviserName = adviserId ? getTeacherName(adviserId) : "-";

        // Find section classification (Regular or Special)
        const section = sections.find(s => s.id === sectionId);
        const isSpecial = section && (section.classification === 'Special' || section.classification === 'special');
        // Use correct period count for this section
        const periodCount = isSpecial ? (levelConfig.periods.special || 9) : (levelConfig.periods.regular || 8);

        // Calculate timings for each period
        function getPeriodTimes(periodType, periodCount, periodMinutes, breaks) {
          let times = [];
          let startHour = 7, startMinute = 30; // Default start time: 7:30 AM
          let currentMinutes = startHour * 60 + startMinute;
          for (let i = 1; i <= periodCount; i++) {
            // Insert breaks if needed
            let breakDuration = 0;
            if (breaks?.morning?.enabled && i - 1 === breaks.morning.afterPeriod) breakDuration += breaks.morning.duration;
            if (breaks?.lunch?.enabled && i - 1 === breaks.lunch.afterPeriod) breakDuration += breaks.lunch.duration;
            if (breaks?.afternoon?.enabled && i - 1 === breaks.afternoon.afterPeriod) breakDuration += breaks.afternoon.duration;
            currentMinutes += breakDuration;
            let endMinutes = currentMinutes + periodMinutes;
            let start = minutesToTime(currentMinutes);
            let end = minutesToTime(endMinutes);
            times.push(`${start} - ${end}`);
            currentMinutes = endMinutes;
          }
          return times;
        }

        function minutesToTime(mins) {
          let h = Math.floor(mins / 60);
          let m = mins % 60;
          let ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          if (h === 0) h = 12;
          // Always pad hour to 2 digits
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
        }

        // Helper to get day initials (e.g., 'Monday' -> 'M', 'Thursday' -> 'Th')
        function getDayInitials(day) {
          if (!day) return '';
          if (day === 'Thursday') return 'Th';
          if (day === 'Saturday') return 'Sat';
          if (day === 'Sunday') return 'Sun';
          return day[0];
        }
        const regularSessionInitials = (regularDays || []).map(getDayInitials).join(', ');
        const shortenedSessionInitials = (shortenedDays || []).map(getDayInitials).join(', ');

        const regularTimes = getPeriodTimes(
          'regular',
          periodCount,
          levelConfig.periodMinutes.regular || 50,
          levelConfig.breaks
        );
        const shortenedTimes = getPeriodTimes(
          'shortened',
          periodCount,
          levelConfig.periodMinutes.shortened || 45,
          levelConfig.breaks
        );

        // Build periods array for this section (1..periodCount)
        const periods = Array.from({ length: periodCount }, (_, i) => i + 1);

        return (
          <div
            key={sectionId}
            className="schedule-block"
            style={{
              marginBottom: 32,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 12px 0 rgba(30,40,90,0.07)',
              padding: 24,
              border: '1px solid #e5eaf4',
              maxWidth: 1400,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              minHeight: 32,
              padding: '0 32px',
            }}>
              <span style={{
                color: '#25326f',
                fontSize: 17,
                fontWeight: 700,
                margin: 0,
                letterSpacing: 0.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
              }}>
                <span style={{ color: '#7a86a7', fontWeight: 500, fontSize: 14, marginRight: 8 }}>Section:</span>
                {getSectionName(sectionId)}
              </span>
              <span style={{
                color: '#5b6787',
                fontSize: 15,
                fontWeight: 500,
                marginLeft: 24,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                <span style={{ color: '#7a86a7', fontWeight: 500, fontSize: 14, marginRight: 6 }}>Name of Adviser:</span>
                <b style={{ fontWeight: 700, color: '#25326f' }}>{adviserName}</b>
              </span>
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid #e5eaf4', borderRadius: 10 }}>
              <table style={{ borderCollapse: 'collapse', minWidth: 170 + days.length * 165, width: '100%' }}>
                <thead>
                  <tr>
                    <th colSpan={2} style={{
                      background: '#f6f8fc',
                      border: '1px solid #e5eaf4',
                      padding: '10px 8px 6px 8px',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      color: '#25326f',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2
                    }}>Time</th>
                    {days.map((day) => (
                      <th key={day} rowSpan={2} style={{
                        background: '#f6f8fc',
                        border: '1px solid #e5eaf4',
                        padding: '10px 8px 6px 8px',
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#25326f',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2
                      }}>{day}</th>
                    ))}
                  </tr>
                  <tr>
                    <th style={{
                      background: '#f6f8fc',
                      border: '1px solid #e5eaf4',
                      padding: '4px 8px',
                      width: 80,
                      fontWeight: 600,
                      fontSize: 12,
                      color: '#5b6787',
                      position: 'sticky',
                      top: 32,
                      zIndex: 2
                    }}>{regularSessionInitials || 'Regular'}</th>
                    <th style={{
                      background: '#f6f8fc',
                      border: '1px solid #e5eaf4',
                      padding: '4px 8px',
                      width: 80,
                      fontWeight: 600,
                      fontSize: 12,
                      color: '#5b6787',
                      position: 'sticky',
                      top: 32,
                      zIndex: 2
                    }}>{shortenedSessionInitials || 'Shortened'}</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((periodNum, idx) => (
                    <tr key={periodNum}>
                      <td style={{
                        background: '#f6f8fc',
                        border: '1px solid #e5eaf4',
                        padding: '10px 8px',
                        fontWeight: 500,
                        fontSize: 13,
                        color: '#5b6787',
                        minWidth: 110,
                        whiteSpace: 'nowrap',
                      }}>{regularTimes[idx]}</td>
                      <td style={{
                        background: '#f6f8fc',
                        border: '1px solid #e5eaf4',
                        padding: '10px 8px',
                        fontWeight: 500,
                        fontSize: 13,
                        color: '#5b6787',
                        minWidth: 110,
                        whiteSpace: 'nowrap',
                      }}>{shortenedTimes[idx]}</td>
                      {days.map((day) => {
                        const assignment = getCellAssignment(sectionId, day, periodNum);
                        return (
                          <td key={day} style={{
                            border: '1px solid #e5eaf4',
                            padding: '10px 8px',
                            background: assignment ? '#f7faf7' : '#fff',
                            fontSize: 13,
                            color: assignment ? '#25326f' : '#7a86a7',
                            fontWeight: assignment ? 700 : 400,
                            minWidth: 120,
                            verticalAlign: 'top'
                          }}>
                            {assignment ? (
                              <>
                                <div style={{ fontWeight: 700, fontSize: 13, color: '#25326f', marginBottom: 2 }}>{getSubjectName(assignment.subjectId)}</div>
                                <div style={{ color: '#6b7898', fontSize: 12, fontWeight: 500 }}>{getTeacherName(assignment.teacherId)}</div>
                              </>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {viewMode === 'teachers' && filteredTeacherIds.map((teacherId) => {
        const teacher = teachers.find(t => t.id === teacherId);
        const teacherName = teacher ? (teacher.teacherName || teacher.name) : teacherId;
        // Find all assignments for this teacher, grouped by section and period
        // Build a map: { [sectionId]: { [periodNum]: { day, subjectId } } }
        // But for display, we want a grid: periods x days, showing subject and section
        // We'll use the same periods/days as the main timetable

        // Helper: for each cell, find the assignment for this teacher
        function findAssignment(day, periodNum) {
          // For each section, check if this teacher is assigned at this slot
          for (const sectionId of sectionIds) {
            const slotKey = `${sectionId}|JHS-P${periodNum}`;
            const assignment = assignments[slotKey];
            if (assignment && assignment.teacherId === teacherId) {
              return { assignment, sectionId };
            }
          }
          return null;
        }

        // Calculate timings for each period (reuse from above)
        function getPeriodTimes(periodType, periodCount, periodMinutes, breaks) {
          let times = [];
          let startHour = 7, startMinute = 30; // Default start time: 7:30 AM
          let currentMinutes = startHour * 60 + startMinute;
          for (let i = 1; i <= periodCount; i++) {
            // Insert breaks if needed
            let breakDuration = 0;
            if (levelConfig.breaks?.morning?.enabled && i - 1 === levelConfig.breaks.morning.afterPeriod) breakDuration += levelConfig.breaks.morning.duration;
            if (levelConfig.breaks?.lunch?.enabled && i - 1 === levelConfig.breaks.lunch.afterPeriod) breakDuration += levelConfig.breaks.lunch.duration;
            if (levelConfig.breaks?.afternoon?.enabled && i - 1 === levelConfig.breaks.afternoon.afterPeriod) breakDuration += levelConfig.breaks.afternoon.duration;
            currentMinutes += breakDuration;
            let endMinutes = currentMinutes + levelConfig.periodMinutes.regular;
            let start = minutesToTime(currentMinutes);
            let end = minutesToTime(endMinutes);
            times.push(`${start} - ${end}`);
            currentMinutes = endMinutes;
          }
          return times;
        }

        function minutesToTime(mins) {
          let h = Math.floor(mins / 60);
          let m = mins % 60;
          let ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          if (h === 0) h = 12;
          // Always pad hour to 2 digits
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
        }

        // Helper to get day initials (e.g., 'Monday' -> 'M', 'Thursday' -> 'Th')
        function getDayInitials(day) {
          if (!day) return '';
          if (day === 'Thursday') return 'Th';
          if (day === 'Saturday') return 'Sat';
          if (day === 'Sunday') return 'Sun';
          return day[0];
        }
        const regularSessionInitials = (regularDays || []).map(getDayInitials).join(', ');
        const shortenedSessionInitials = (shortenedDays || []).map(getDayInitials).join(', ');

        const regularTimes = getPeriodTimes(
          'regular',
          levelConfig.periods.regular || 8,
          levelConfig.periodMinutes.regular || 50,
          levelConfig.breaks
        );
        const shortenedTimes = getPeriodTimes(
          'shortened',
          levelConfig.periods.regular || 8,
          levelConfig.periodMinutes.shortened || 45,
          levelConfig.breaks
        );

        return (
          <div
            key={teacherId}
            className="schedule-block"
            style={{
              marginBottom: 32,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 12px 0 rgba(30,40,90,0.07)',
              padding: 24,
              border: '1px solid #e5eaf4',
              maxWidth: 1400,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              minHeight: 32,
              padding: '0 32px',
            }}>
              <span style={{
                color: '#25326f',
                fontSize: 17,
                fontWeight: 700,
                margin: 0,
                letterSpacing: 0.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
              }}>
                <span style={{ color: '#7a86a7', fontWeight: 500, fontSize: 14, marginRight: 8 }}>Teacher:</span>
                {teacherName}
              </span>
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid #e5eaf4', borderRadius: 10 }}>
              <table style={{ borderCollapse: 'collapse', minWidth: 170 + days.length * 165, width: '100%' }}>
                <thead>
                  <tr>
                    <th colSpan={2} style={{
                      background: '#f6f8fc',
                      border: '1px solid #e5eaf4',
                      padding: '10px 8px 6px 8px',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      color: '#25326f',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2
                    }}>Time</th>
                    {days.map((day) => (
                      <th key={day} rowSpan={2} style={{
                        background: '#f6f8fc',
                        border: '1px solid #e5eaf4',
                        padding: '10px 8px 6px 8px',
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#25326f',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2
                      }}>{day}</th>
                    ))}
                  </tr>
                  <tr>
                    <th style={{
                      background: '#f6f8fc',
                      border: '1px solid #e5eaf4',
                      padding: '4px 8px',
                      width: 80,
                      fontWeight: 600,
                      fontSize: 12,
                      color: '#5b6787',
                      position: 'sticky',
                      top: 32,
                      zIndex: 2
                    }}>{regularSessionInitials || 'Regular'}</th>
                    <th style={{
                      background: '#f6f8fc',
                      border: '1px solid #e5eaf4',
                      padding: '4px 8px',
                      width: 80,
                      fontWeight: 600,
                      fontSize: 12,
                      color: '#5b6787',
                      position: 'sticky',
                      top: 32,
                      zIndex: 2
                    }}>{shortenedSessionInitials || 'Shortened'}</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((periodNum, idx) => (
                    <tr key={periodNum}>
                      <td style={{
                        background: '#f6f8fc',
                        border: '1px solid #e5eaf4',
                        padding: '10px 8px',
                        fontWeight: 500,
                        fontSize: 13,
                        color: '#5b6787',
                        minWidth: 110,
                        whiteSpace: 'nowrap',
                      }}>{regularTimes[idx]}</td>
                      <td style={{
                        background: '#f6f8fc',
                        border: '1px solid #e5eaf4',
                        padding: '10px 8px',
                        fontWeight: 500,
                        fontSize: 13,
                        color: '#5b6787',
                        minWidth: 110,
                        whiteSpace: 'nowrap',
                      }}>{shortenedTimes[idx]}</td>
                      {days.map((day) => {
                        const teacherAssign = getTeacherCellAssignment(teacherId, day, periodNum);
                        const found = teacherAssign ? { assignment: teacherAssign.assignment, sectionId: teacherAssign.sectionId } : null;
                        return (
                          <td key={day} style={{
                            border: '1px solid #e5eaf4',
                            padding: '10px 8px',
                            background: found ? '#f7faf7' : '#fff',
                            fontSize: 13,
                            color: found ? '#25326f' : '#7a86a7',
                            fontWeight: found ? 700 : 400,
                            minWidth: 120,
                            verticalAlign: 'top'
                          }}>
                            {found ? (
                              <>
                                <div style={{ fontWeight: 700, fontSize: 13, color: '#25326f', marginBottom: 2 }}>{getSubjectName(found.assignment.subjectId)}</div>
                                <div style={{ color: '#6b7898', fontSize: 12, fontWeight: 500 }}>{getSectionName(found.sectionId)}</div>
                              </>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
