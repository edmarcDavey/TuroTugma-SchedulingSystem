// Normalize sections to flat array with correct IDs and names (supporting JHS and SHS)
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
          originalId: section?.id,
          level: "jhs",
          grade: Number(grade),
          name: section?.name || `Grade ${grade} Section ${index + 1}`,
          classification: section?.classification || "Regular",
          track: section?.track || "",
        }));
      })
      .sort((left, right) => {
        if (left.grade !== right.grade) {
          return left.grade - right.grade;
        }
        return String(left.name).localeCompare(String(right.name));
      });
  }
  return [11, 12]
    .flatMap((grade) => {
      const gradeConfig = sectionsRaw?.shs?.[grade];
      const entries = Array.isArray(gradeConfig?.sections) ? gradeConfig.sections : [];
      return entries.map((section, index) => ({
        id: `shs-${grade}-${index}`,
        originalId: section?.id,
        level: "shs",
        grade: Number(grade),
        name: section?.name || `Grade ${grade} Section ${index + 1}`,
        classification: "",
        track: section?.track || "",
      }));
    })
    .sort((left, right) => {
      if (left.grade !== right.grade) {
        return left.grade - right.grade;
      }
      return String(left.name).localeCompare(String(right.name));
    });
}


import React, { useEffect, useState, useRef, useMemo } from "react";
import html2pdf from "html2pdf.js";
import {
  DEFAULT_PROFILE_FALLBACK,
  getEffectiveSchoolProfile,
  SignatoryBlock,
  DepEdTopHeader,
} from "../../dashboard/components/TimeTables";

function getFromStorage(key, fallback) {
  try {
    const val = window.localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

const PUBLISHED_STORAGE_KEY = "turotugma_published_schedules";
const SECTIONS_STORAGE_KEY = "turotugma_sections_created";
const SUBJECTS_STORAGE_KEY = "turotugma_subjects";
const FACULTY_STORAGE_KEY = "turotugma_faculty";
function buildSlotsForTimetable(config, scheduleType = "jhs") {
  const levelConfig = config?.[scheduleType] || config?.jhs || {};
  const regularDays = Array.isArray(levelConfig.regularDays) && levelConfig.regularDays.length > 0
    ? levelConfig.regularDays
    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const shortenedDays = Array.isArray(levelConfig.shortenedDays) ? levelConfig.shortenedDays : [];
  const maxPeriods = levelConfig.periods?.regular || 8;

  const slots = [];
  const activeDays = Array.from(new Set([...regularDays, ...shortenedDays]));

  activeDays.forEach((day) => {
    const isShortened = shortenedDays.includes(day);
    for (let period = 1; period <= maxPeriods; period++) {
      const slotId = `${day}-P${period}`;
      slots.push({
        id: slotId,
        day,
        period,
        sessionType: isShortened ? "shortened" : "regular",
        label: `${period}${period === 1 ? "st" : period === 2 ? "nd" : period === 3 ? "rd" : "th"} Period`,
      });
    }
  });
  return slots;
}

export default function FinalTimeTables() {
  const [draft, setDraft] = useState(null);
  const [publishedList, setPublishedList] = useState([]);
  const [selectedPublishedId, setSelectedPublishedId] = useState("");
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [gradeFilter, setGradeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('sections'); // 'sections' or 'teachers'
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [teacherType, setTeacherType] = useState('all'); // 'all', 'adviser', 'non-adviser'
  const [schoolProfile, setSchoolProfile] = useState(() => getEffectiveSchoolProfile());
  // Ref for exportable schedules only (not the whole component)
  const exportSchedulesRef = useRef();

  useEffect(() => {
    const handleProfileSync = () => {
      setSchoolProfile(getEffectiveSchoolProfile());
    };
    window.addEventListener("storage", handleProfileSync);
    window.addEventListener("focus", handleProfileSync);
    window.addEventListener("turotugma:profile-updated", handleProfileSync);
    return () => {
      window.removeEventListener("storage", handleProfileSync);
      window.removeEventListener("focus", handleProfileSync);
      window.removeEventListener("turotugma:profile-updated", handleProfileSync);
    };
  }, []);

  function handleExport() {
    if (exportSchedulesRef.current) {
      // Clone only the schedules container
      const exportClone = exportSchedulesRef.current.cloneNode(true);
      exportClone.style.width = '100%';
      exportClone.style.maxWidth = 'none';
      exportClone.style.margin = '0';
      exportClone.style.padding = '0';
      exportClone.style.background = '#ffffff';

      // Add CSS for page-breaks and compact A4 landscape printing
      const style = document.createElement('style');
      style.innerHTML = `
        @page {
          size: A4 landscape;
          margin: 0;
        }
        .export-section-page-break {
          margin: 0 !important;
          padding: 3.5mm 4.5mm !important;
          box-shadow: none !important;
          border: 1.5px solid #000 !important;
          border-radius: 0 !important;
          box-sizing: border-box !important;
          width: 100% !important;
          max-width: 100% !important;
          background: #ffffff !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          min-height: 202mm !important;
          max-height: 204mm !important;
          overflow: hidden !important;
        }
        .export-section-page-break .deped-top-header {
          margin-bottom: 4px !important;
          line-height: 1.1 !important;
          flex-shrink: 0 !important;
        }
        .export-section-page-break .deped-draft-badge {
          font-size: 8.5px !important;
          padding: 2px 6px !important;
        }
        .export-section-page-break .deped-header-republic {
          font-size: 9px !important;
          margin: 0 !important;
          line-height: 1.1 !important;
        }
        .export-section-page-break .deped-header-department {
          font-size: 11px !important;
          margin: 0 !important;
          line-height: 1.1 !important;
        }
        .export-section-page-break .deped-header-region,
        .export-section-page-break .deped-header-division {
          font-size: 8.5px !important;
          margin: 0 !important;
          line-height: 1.1 !important;
        }
        .export-section-page-break .deped-header-school {
          font-size: 12px !important;
          margin: 1px 0 0 !important;
          line-height: 1.15 !important;
        }
        .export-section-page-break .deped-header-title {
          font-size: 10.5px !important;
          margin: 2px 0 0 !important;
          line-height: 1.1 !important;
        }
        .export-section-page-break .deped-header-sy {
          font-size: 8.5px !important;
          margin: 0 !important;
          line-height: 1.1 !important;
        }
        .export-section-page-break .deped-header-subtitle {
          font-size: 11.5px !important;
          margin: 1px 0 0 !important;
          line-height: 1.15 !important;
        }
        .export-section-page-break .deped-header-adviser {
          font-size: 8.5px !important;
          margin: 0 !important;
          line-height: 1.1 !important;
        }

        .export-section-page-break .timetable-table-wrap {
          flex: 1 1 auto !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: visible !important;
        }
        .export-section-page-break table {
          width: 100% !important;
          flex: 1 1 auto !important;
          border-collapse: collapse !important;
          margin: 0 !important;
        }
        .export-section-page-break th,
        .export-section-page-break td {
          padding: 2.5px 4px !important;
          font-size: 8.5px !important;
          line-height: 1.12 !important;
          min-height: 0 !important;
          height: auto !important;
        }
        .export-section-page-break thead tr {
          background: transparent !important;
        }
        .export-section-page-break thead th,
        .export-section-page-break th {
          font-size: 9.5px !important;
          font-weight: 800 !important;
          padding: 3.5px 4px !important;
          color: #000000 !important;
          background: #8fb6e5 !important;
          background-color: #8fb6e5 !important;
          opacity: 1 !important;
        }
        .export-section-page-break td.time-cell,
        .export-section-page-break td:first-child,
        .export-section-page-break td:nth-child(2) {
          white-space: nowrap !important;
          font-size: 8px !important;
          line-height: 1.1 !important;
          color: #000000 !important;
        }
        .export-section-page-break .schedule-cell {
          min-height: 0 !important;
          height: auto !important;
          padding: 2.5px 4px !important;
        }
        .export-section-page-break .schedule-cell-content {
          gap: 1.5px !important;
        }
        .export-section-page-break .schedule-cell-subject {
          font-size: 9px !important;
          line-height: 1.12 !important;
          font-weight: 800 !important;
          color: #000000 !important;
        }
        .export-section-page-break .schedule-cell-subtext {
          font-size: 7.5px !important;
          line-height: 1.05 !important;
          font-weight: 600 !important;
          letter-spacing: 0 !important;
          margin-top: 0.5px !important;
          color: #111111 !important;
        }
        .export-section-page-break .schedule-cell-breakout {
          font-size: 6.8px !important;
          line-height: 1.0 !important;
          gap: 0.5px !important;
        }
        .export-section-page-break .break-banner {
          font-size: 8.5px !important;
          padding: 2.5px 4px !important;
          letter-spacing: 0.8px !important;
          line-height: 1.1 !important;
          background: #f5b301 !important;
          background-color: #f5b301 !important;
          color: #000000 !important;
        }

        .export-section-page-break .signatory-container {
          margin-top: 5px !important;
          padding-top: 2px !important;
          flex-shrink: 0 !important;
        }
        .export-section-page-break .signatory-row {
          gap: 8px !important;
          margin-bottom: 3px !important;
        }
        .export-section-page-break .signatory-row-mid {
          margin-top: 3px !important;
          margin-bottom: 3px !important;
          gap: 14px !important;
        }
        .export-section-page-break .signatory-grid {
          gap: 6px !important;
        }
        .export-section-page-break .signatory-col-right {
          width: 190px !important;
        }
        .export-section-page-break .signatory-box {
          min-width: 190px !important;
        }
        .export-section-page-break .signatory-heading {
          font-size: 8.5px !important;
          margin-bottom: 3px !important;
          font-weight: 700 !important;
          color: #000000 !important;
        }
        .export-section-page-break .signatory-name {
          font-size: 8.5px !important;
          line-height: 1.1 !important;
          font-weight: 800 !important;
          color: #000000 !important;
        }
        .export-section-page-break .signatory-title {
          font-size: 7.5px !important;
          line-height: 1.05 !important;
          margin-top: 1px !important;
          font-weight: 600 !important;
          color: #222222 !important;
        }
        .export-section-page-break .signatory-contact-bar {
          margin-top: 4px !important;
          padding-top: 4px !important;
          border-top: 1.2px solid #000 !important;
          font-size: 8px !important;
          line-height: 1.15 !important;
          gap: 8px !important;
        }
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      `;
      exportClone.prepend(style);
      Array.from(exportClone.querySelectorAll('.turotugma-no-print')).forEach((el) => {
        el.remove();
      });
      // Add class to each schedule block (section or teacher)
      Array.from(exportClone.querySelectorAll('div')).forEach((div) => {
        if (div.classList.contains('schedule-block')) {
          div.classList.add('export-section-page-break');
        }
      });
      const docTitle = `${viewMode === 'teachers' ? 'Teacher-Timetables' : 'Section-Timetables'}-${(draft?.name || 'Published').replace(/[^a-zA-Z0-9_-]/g, '_')}`;

      let blockRects = [];
      let containerHeight = 0;

      const worker = html2pdf()
        .set({
          margin: [3, 4, 3, 4],
          filename: `${docTitle}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            scrollY: 0,
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'landscape',
          },
          pagebreak: {
            mode: [],
          },
        })
        .from(exportClone);

      worker
        .toContainer()
        .then(function () {
          const container = this.prop.container;
          if (container) {
            const blocks = Array.from(container.querySelectorAll('.export-section-page-break'));
            const cRect = container.getBoundingClientRect();
            blockRects = blocks.map((b) => {
              const r = b.getBoundingClientRect();
              return {
                top: Math.max(0, r.top - cRect.top),
                height: r.height,
              };
            });
            containerHeight = cRect.height || container.scrollHeight || 1;
          }
        })
        .toCanvas()
        .then(function () {
          const srcCanvas = this.prop.canvas;
          if (srcCanvas && blockRects.length > 0 && containerHeight > 0) {
            const pxPageHeight = Math.floor(srcCanvas.width * this.prop.pageSize.inner.ratio);
            const scaleY = srcCanvas.height / containerHeight;
            const normalizedCanvas = document.createElement('canvas');
            normalizedCanvas.width = srcCanvas.width;
            normalizedCanvas.height = pxPageHeight * blockRects.length;
            const ctx = normalizedCanvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, normalizedCanvas.width, normalizedCanvas.height);

            blockRects.forEach((rect, idx) => {
              const sy = Math.max(0, Math.round(rect.top * scaleY));
              const sh = Math.min(srcCanvas.height - sy, Math.round(rect.height * scaleY));
              if (sh <= 0) return;
              const destY = idx * pxPageHeight;
              const drawH = Math.min(sh, pxPageHeight);
              ctx.drawImage(
                srcCanvas,
                0,
                sy,
                srcCanvas.width,
                sh,
                0,
                destY,
                normalizedCanvas.width,
                drawH
              );
            });

            this.prop.canvas = normalizedCanvas;
          }
        })
        .toPdf()
        .save();
    }
  }

  const loadActiveSchedule = (preferredId = null) => {
    try {
      const publishedRaw = getFromStorage(PUBLISHED_STORAGE_KEY, null);
      if (publishedRaw && typeof publishedRaw === "object") {
        const pubList = [];
        Object.entries(publishedRaw).forEach(([type, item]) => {
          if (item && item.assignments && Object.keys(item.assignments).length > 0) {
            const pubId = `published-${item.scheduleType || type}`;
            pubList.push({
              id: pubId,
              scheduleType: item.scheduleType || type,
              name: `Published Schedule — ${(item.scheduleType || type).toUpperCase()}`,
              updatedAt: item.publishedAt || item.updatedAt || new Date(0).toISOString(),
              schedule: item,
              config: item.config || item.scheduleConfig || {},
            });
          }
        });

        pubList.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        setPublishedList(pubList);

        if (pubList.length > 0) {
          const target = preferredId ? pubList.find((p) => p.id === preferredId) || pubList[0] : pubList[0];
          setSelectedPublishedId(target.id);
          setDraft(target);
          const sectionsRaw = getFromStorage(SECTIONS_STORAGE_KEY, {});
          setSections(normalizeSections(sectionsRaw, target?.scheduleType || "jhs"));
          setSubjects(getFromStorage(SUBJECTS_STORAGE_KEY, []));
          setTeachers(getFromStorage(FACULTY_STORAGE_KEY, []));
          return;
        }
      }
      setPublishedList([]);
      setSelectedPublishedId("");
      setDraft(null);
    } catch (err) {
      console.error("Error loading active schedule in FinalTimeTables:", err);
      setPublishedList([]);
      setSelectedPublishedId("");
      setDraft(null);
    }
  };

  const handleSwitchPublished = (id) => {
    setSelectedPublishedId(id);
    const found = publishedList.find((p) => p.id === id);
    if (found) {
      setDraft(found);
      const sectionsRaw = getFromStorage(SECTIONS_STORAGE_KEY, {});
      setSections(normalizeSections(sectionsRaw, found?.scheduleType || "jhs"));
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
    if (!subjectId) return "";
    const sub = subjectsById?.get(subjectId) || subjectsById?.get(String(subjectId));
    let found = sub || (Array.isArray(subjects) ? subjects.find((s) => s.id === subjectId || s.subjectCode === subjectId) : null);

    if (!found && typeof subjectId === "string") {
      const codeMatch = subjectId.match(/^(?:SUBJ|jhs|shs)-([A-Z0-9-]+?)(?:-\d+)?$/i);
      if (codeMatch) {
        const extractedCode = codeMatch[1].toUpperCase();
        if (Array.isArray(subjects)) {
          found = subjects.find(
            (s) =>
              (s.subjectCode && String(s.subjectCode).toUpperCase() === extractedCode) ||
              (s.id && String(s.id).toUpperCase() === `JHS-${extractedCode}`) ||
              (s.id && String(s.id).toUpperCase().includes(`-${extractedCode}`))
          );
        }
        if (!found) {
          const codeFallbackMap = {
            VE: "Values Education",
            ESP: "Values Education",
            MATH: "Mathematics",
            SCI: "Science",
            ENG: "English",
            FIL: "Filipino",
            AP: "Araling Panlipunan",
            MAPEH: "MAPEH",
            TLE: "Technology and Livelihood Education",
          };
          if (codeFallbackMap[extractedCode]) return codeFallbackMap[extractedCode];
        }
      }
    }

    const raw = found ? found.subjectName || found.subjectCode || found.name : subjectId;
    return formatCleanSubjectName(raw);
  }
  function getTeacherName(teacherId) {
    if (!teacherId) return "";
    const teacher = teachersById?.get(teacherId) || teachersById?.get(String(teacherId));
    const found = teacher || (Array.isArray(teachers) ? teachers.find((t) => t.id === teacherId) : null);
    return found ? found.teacherName || found.name : teacherId;
  }

  const {
    cellAssignmentIndex,
    teacherAssignmentIndex,
    sectionsById,
    subjectsById,
    teachersById,
    slots,
    days,
    regularDays,
    shortenedDays,
    maxPeriods,
    assignedSectionIds,
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
        slots: [],
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        regularDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        shortenedDays: ["Friday"],
        maxPeriods: 8,
        assignedSectionIds: [],
      };
    }

    const sched = draft.schedule;
    const assign = sched.assignments || {};

    const rawSecList = Array.isArray(sched.sections) && sched.sections.length > 0 ? sched.sections : sections;
    const secList = [...rawSecList].sort((a, b) => {
      const gA = Number(a.grade) || 0;
      const gB = Number(b.grade) || 0;
      if (gA !== gB) return gA - gB;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
    secList.forEach((s) => {
      if (s.id) {
        secMap.set(s.id, s);
        secMap.set(String(s.id), s);
      }
      if (s.originalId) {
        secMap.set(s.originalId, s);
        secMap.set(String(s.originalId), s);
      }
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

    let slotList = Array.isArray(sched.slots) && sched.slots.length > 0 ? sched.slots : [];
    if (slotList.length === 0) {
      slotList = buildSlotsForTimetable(draft?.config || sched.config, draft?.scheduleType || "jhs");
    }
    slotList.forEach((s) => sById.set(s.id, s));

    const stType = draft?.scheduleType || sched?.scheduleType || "jhs";
    const levelCfg = sched.config?.[stType] || sched.config?.jhs || draft?.config?.[stType] || draft?.config?.jhs || {};
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
        let period = slot?.period ? Number(slot.period) : null;
        if (!period) {
          const numMatch = slotId.match(/P(\d+)/i) || slotId.match(/(\d+)/);
          if (numMatch) period = parseInt(numMatch[1], 10);
        }
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

        const targetDays = (!day || day === "All Days") ? dayList : [day];

        sectionAliases.forEach((alias) => {
          targetDays.forEach((d) => {
            if (period) {
              cellIdx.set(`${alias}|${d}|${period}`, assign[cellKey]);
            }
          });
          cellIdx.set(`${alias}|${slotId}`, assign[cellKey]);
        });

        if (period) {
          targetDays.forEach((d) => {
            if (assign[cellKey]?.teacherId) {
              teacherIdx.set(`${assign[cellKey].teacherId}|${d}|${period}`, { assignment: assign[cellKey], sectionId: secId });
              teacherIdx.set(`${String(assign[cellKey].teacherId)}|${d}|${period}`, { assignment: assign[cellKey], sectionId: secId });
            }
            if (Array.isArray(assign[cellKey]?.coTeacherIds)) {
              assign[cellKey].coTeacherIds.forEach((coTid) => {
                if (coTid) {
                  teacherIdx.set(`${coTid}|${d}|${period}`, { assignment: assign[cellKey], sectionId: secId, isCoTeacher: true });
                  teacherIdx.set(`${String(coTid)}|${d}|${period}`, { assignment: assign[cellKey], sectionId: secId, isCoTeacher: true });
                }
              });
            }
            if (Array.isArray(assign[cellKey]?.breakoutAssignments)) {
              assign[cellKey].breakoutAssignments.forEach((b) => {
                if (b?.teacherId) {
                  teacherIdx.set(`${b.teacherId}|${d}|${period}`, { assignment: assign[cellKey], sectionId: secId, streamName: b.stream, isBreakout: true });
                  teacherIdx.set(`${String(b.teacherId)}|${d}|${period}`, { assignment: assign[cellKey], sectionId: secId, streamName: b.stream, isBreakout: true });
                }
              });
            }
          });
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
    const maxPFromAssignments = Object.keys(assign).reduce((maxVal, cellKey) => {
      const parts = cellKey.split("|");
      if (parts.length >= 2) {
        const slotId = parts[1];
        const numMatch = slotId.match(/P(\d+)/i) || slotId.match(/(\d+)/);
        if (numMatch) return Math.max(maxVal, parseInt(numMatch[1], 10));
      }
      return maxVal;
    }, 0);
    const maxP = (maxPFromAssignments > 0 || maxPFromSlots > 0)
      ? Math.max(maxPFromAssignments, maxPFromSlots)
      : Math.max(levelCfg.periods?.regular || 8, 1);

    const assignedSecKeySet = new Set(Object.keys(assign).map((k) => k.split("|")[0]));
    const secIds = [];
    const addedSec = new Set();
    secList.forEach((s) => {
      if (!addedSec.has(s.id) && (assignedSecKeySet.has(s.id) || assignedSecKeySet.has(s.originalId) || assignedSecKeySet.has(s.name) || Object.keys(assign).length === 0)) {
        secIds.push(s.id);
        addedSec.add(s.id);
        if (s.originalId) addedSec.add(s.originalId);
      }
    });
    assignedSecKeySet.forEach((sid) => {
      if (sid && !addedSec.has(sid)) {
        const mapped = secMap.get(sid);
        const canonicalId = mapped?.id || sid;
        if (!addedSec.has(canonicalId)) {
          secIds.push(canonicalId);
          addedSec.add(canonicalId);
        }
      }
    });

    return {
      cellAssignmentIndex: cellIdx,
      teacherAssignmentIndex: teacherIdx,
      sectionsById: secMap,
      subjectsById: subMap,
      teachersById: tMap,
      slots: slotList,
      days: dayList,
      regularDays: regDays,
      shortenedDays: shortDays,
      maxPeriods: maxP,
      assignedSectionIds: secIds,
    };
  }, [draft, sections, subjects, teachers]);

  function getCellAssignment(sectionId, day, periodNum) {
    const secObj = sectionsById.get(sectionId) || sectionsById.get(String(sectionId));
    const secName = secObj?.name || getSectionName(sectionId);
    return (
      cellAssignmentIndex.get(`${sectionId}|${day}|${periodNum}`) ||
      cellAssignmentIndex.get(`${String(sectionId)}|${day}|${periodNum}`) ||
      cellAssignmentIndex.get(`${secName}|${day}|${periodNum}`) ||
      cellAssignmentIndex.get(`${sectionId}|${day}-P${periodNum}`) ||
      cellAssignmentIndex.get(`${secName}|${day}-P${periodNum}`) ||
      null
    );
  }

  function getTeacherCellAssignment(teacherId, day, periodNum) {
    return (
      teacherAssignmentIndex.get(`${teacherId}|${day}|${periodNum}`) ||
      teacherAssignmentIndex.get(`${String(teacherId)}|${day}|${periodNum}`) ||
      null
    );
  }

  function getAdviserName(sectionId) {
    const secObj = sectionsById.get(sectionId) || sectionsById.get(String(sectionId));
    if (secObj?.adviserName) return secObj.adviserName;
    if (secObj?.adviserId) return getTeacherName(secObj.adviserId);

    const checkDays = days?.length > 0 ? days : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const maxP = maxPeriods || 8;

    // 1. Check if any teacher in the faculty roster is explicitly designated as Class Adviser for this section
    const secNameClean = String(secObj?.name || getSectionName(sectionId) || "").toLowerCase();
    const explicitAdviser = (Array.isArray(teachers) ? teachers : []).find((t) => {
      if (!t?.advisorySection) return false;
      const advSec = String(t.advisorySection).toLowerCase();
      return advSec === String(sectionId).toLowerCase() || (secNameClean && (advSec.includes(secNameClean) || secNameClean.includes(advSec)));
    });
    if (explicitAdviser) {
      return explicitAdviser.teacherName || explicitAdviser.name || explicitAdviser.id;
    }

    // 2. Look for the teacher assigned to HGP / Homeroom Guidance Program anywhere in the week (even if plotted on Friday Last Period or random slot)
    for (const day of checkDays) {
      for (let p = 1; p <= maxP; p++) {
        const assign = getCellAssignment(sectionId, day, p);
        if (assign?.teacherId && assign?.subjectId) {
          const subj = subjectsById?.get(assign.subjectId);
          const sCode = String(subj?.subjectCode || assign.subjectId || "").toUpperCase();
          const sName = String(subj?.subjectName || getSubjectName(assign.subjectId) || "").toLowerCase();
          if (
            sCode === "HGP" ||
            sCode === "HRG" ||
            sCode.includes("HGP") ||
            sName === "hgp" ||
            sName.includes("homeroom") ||
            sName.includes("guidance program") ||
            sName.includes("advisory")
          ) {
            return getTeacherName(assign.teacherId);
          }
        }
      }
    }

    // 3. Fallback: First assigned period of the week if HGP is not in the curriculum
    for (const day of checkDays) {
      for (let p = 1; p <= maxP; p++) {
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
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 16, background: "#eef2ff", color: "#3B4197", marginBottom: 16 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
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
  const config = draft.config || {};
  const scheduleType = draft.scheduleType || "jhs";
  const assignments = draft.schedule.assignments || {};

  const levelConfig = config[scheduleType] || config["jhs"] || {};
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
  let sectionIds = [...assignedSectionIds];

  const fromSecs = sections.map((s) => Number(s.grade)).filter(Boolean);
  const gradeSet = new Set(fromSecs);
  const availableGrades = gradeSet.size > 0
    ? Array.from(gradeSet).sort((a, b) => a - b)
    : (scheduleType === "shs" ? [11, 12] : [7, 8, 9, 10]);

  let teacherIds = Array.from(
    new Set(Object.values(assignments).map((a) => a?.teacherId).filter(Boolean))
  );
  Object.values(assignments).forEach((a) => {
    if (Array.isArray(a?.coTeacherIds)) {
      a.coTeacherIds.forEach((coTid) => {
        if (coTid && !teacherIds.includes(coTid)) teacherIds.push(coTid);
      });
    }
    if (Array.isArray(a?.breakoutAssignments)) {
      a.breakoutAssignments.forEach((b) => {
        if (b?.teacherId && !teacherIds.includes(b.teacherId)) teacherIds.push(b.teacherId);
      });
    }
  });
  if (teacherIds.length === 0 && teachers.length > 0) {
    teacherIds = teachers.map((t) => t.id);
  }

  let filteredTeacherIds = teacherIds;
  if (viewMode === 'teachers' && searchTerm.trim()) {
    const lower = searchTerm.trim().toLowerCase();
    filteredTeacherIds = teacherIds.filter((id) => {
      const teacher = teachers.find((t) => t.id === id);
      return teacher && (teacher.teacherName || teacher.name || '').toLowerCase().includes(lower);
    });
  }

  if (viewMode === 'sections' && gradeFilter !== 'all') {
    sectionIds = sectionIds.filter((id) => {
      const sec = sectionsById.get(id) || sections.find((s) => s.id === id || s.name === id);
      const grade = sec?.grade || (id.includes("7") ? 7 : id.includes("8") ? 8 : id.includes("9") ? 9 : id.includes("10") ? 10 : null);
      return String(grade) === String(gradeFilter);
    });
  }
  if (viewMode === 'sections' && selectedSection !== 'all') {
    sectionIds = sectionIds.filter((id) => id === selectedSection);
  }
  if (viewMode === 'sections' && searchTerm.trim()) {
    const lower = searchTerm.trim().toLowerCase();
    sectionIds = sectionIds.filter((id) => {
      const secName = getSectionName(id);
      return secName.toLowerCase().includes(lower);
    });
  }

  if (viewMode === 'teachers' && selectedTeacher !== 'all') {
    filteredTeacherIds = filteredTeacherIds.filter((id) => id === selectedTeacher);
  }
  if (viewMode === 'teachers' && teacherType !== 'all') {
    const adviserIds = new Set();
    sectionIds.forEach((sectionId) => {
      const adviserName = getAdviserName(sectionId);
      if (adviserName && adviserName !== "-") {
        const advObj = teachers.find((t) => (t.teacherName || t.name) === adviserName || t.id === adviserName);
        if (advObj) adviserIds.add(advObj.id);
      }
    });
    if (teacherType === 'adviser') {
      filteredTeacherIds = filteredTeacherIds.filter((id) => adviserIds.has(id));
    } else if (teacherType === 'non-adviser') {
      filteredTeacherIds = filteredTeacherIds.filter((id) => !adviserIds.has(id));
    }
  }

  return (
    <div>
      <style>{`
        @media print {
          @page {
            size: A4 landscape !important;
            margin: 3mm 4mm !important;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide UI elements marked with turotugma-no-print */
          .turotugma-no-print,
          .turotugma-no-print * {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            max-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          #printable-timetables-container {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          /* Strictly ONE schedule block per printed A4 landscape page */
          .schedule-block {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 200mm !important;
            max-height: 202mm !important;
            box-sizing: border-box !important;
            page-break-before: auto !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
            padding: 3.5mm 4.5mm !important;
            box-shadow: none !important;
            border: 1.5px solid #000 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }
          .schedule-block:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .schedule-block .deped-top-header {
            margin-bottom: 4px !important;
            line-height: 1.1 !important;
            flex-shrink: 0 !important;
          }
          .schedule-block .deped-draft-badge {
            font-size: 8.5px !important;
            padding: 2px 6px !important;
          }
          .schedule-block .deped-header-republic {
            font-size: 9px !important;
            margin: 0 !important;
            line-height: 1.1 !important;
          }
          .schedule-block .deped-header-department {
            font-size: 11px !important;
            margin: 0 !important;
            line-height: 1.1 !important;
          }
          .schedule-block .deped-header-region,
          .schedule-block .deped-header-division {
            font-size: 8.5px !important;
            margin: 0 !important;
            line-height: 1.1 !important;
          }
          .schedule-block .deped-header-school {
            font-size: 12px !important;
            margin: 1px 0 0 !important;
            line-height: 1.15 !important;
          }
          .schedule-block .deped-header-title {
            font-size: 10.5px !important;
            margin: 2px 0 0 !important;
            line-height: 1.1 !important;
          }
          .schedule-block .deped-header-sy {
            font-size: 8.5px !important;
            margin: 0 !important;
            line-height: 1.1 !important;
          }
          .schedule-block .deped-header-subtitle {
            font-size: 11.5px !important;
            margin: 1px 0 0 !important;
            line-height: 1.15 !important;
          }
          .schedule-block .deped-header-adviser {
            font-size: 8.5px !important;
            margin: 0 !important;
            line-height: 1.1 !important;
          }

          .schedule-block .timetable-table-wrap {
            flex: 1 1 auto !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: visible !important;
          }
          .schedule-block table {
            width: 100% !important;
            flex: 1 1 auto !important;
            border-collapse: collapse !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
          }
          .schedule-block th,
          .schedule-block td {
            padding: 2.5px 4px !important;
            font-size: 8.5px !important;
            line-height: 1.12 !important;
            min-height: 0 !important;
            height: auto !important;
          }
          .schedule-block thead tr {
            background: transparent !important;
          }
          .schedule-block thead th,
          .schedule-block th {
            font-size: 9.5px !important;
            font-weight: 800 !important;
            padding: 3.5px 4px !important;
            color: #000000 !important;
            background: #8fb6e5 !important;
            background-color: #8fb6e5 !important;
            opacity: 1 !important;
          }
          .schedule-block td.time-cell,
          .schedule-block td:first-child,
          .schedule-block td:nth-child(2) {
            white-space: nowrap !important;
            font-size: 8px !important;
            line-height: 1.1 !important;
            color: #000000 !important;
          }
          .schedule-block .schedule-cell {
            min-height: 0 !important;
            height: auto !important;
            padding: 2.5px 4px !important;
          }
          .schedule-block .schedule-cell-content {
            gap: 1.5px !important;
          }
          .schedule-block .schedule-cell-subject {
            font-size: 9px !important;
            line-height: 1.12 !important;
            font-weight: 800 !important;
            color: #000000 !important;
          }
          .schedule-block .schedule-cell-subtext {
            font-size: 7.5px !important;
            line-height: 1.05 !important;
            font-weight: 600 !important;
            letter-spacing: 0 !important;
            margin-top: 0.5px !important;
            color: #111111 !important;
          }
          .schedule-block .schedule-cell-breakout {
            font-size: 6.8px !important;
            line-height: 1.0 !important;
            gap: 0.5px !important;
          }
          .schedule-block .break-banner {
            font-size: 8.5px !important;
            padding: 2.5px 4px !important;
            letter-spacing: 0.8px !important;
            line-height: 1.1 !important;
            background: #f5b301 !important;
            background-color: #f5b301 !important;
            color: #000000 !important;
          }

          .schedule-block .signatory-container {
            margin-top: 5px !important;
            padding-top: 2px !important;
            flex-shrink: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .schedule-block .signatory-row {
            gap: 8px !important;
            margin-bottom: 3px !important;
          }
          .schedule-block .signatory-row-mid {
            margin-top: 3px !important;
            margin-bottom: 3px !important;
            gap: 14px !important;
          }
          .schedule-block .signatory-grid {
            gap: 6px !important;
          }
          .schedule-block .signatory-col-right {
            width: 190px !important;
          }
          .schedule-block .signatory-box {
            min-width: 190px !important;
          }
          .schedule-block .signatory-heading {
            font-size: 8.5px !important;
            margin-bottom: 3px !important;
            font-weight: 700 !important;
            color: #000000 !important;
          }
          .schedule-block .signatory-name {
            font-size: 8.5px !important;
            line-height: 1.1 !important;
            font-weight: 800 !important;
            color: #000000 !important;
          }
          .schedule-block .signatory-title {
            font-size: 7.5px !important;
            line-height: 1.05 !important;
            margin-top: 1px !important;
            font-weight: 600 !important;
            color: #222222 !important;
          }
          .schedule-block .signatory-contact-bar {
            margin-top: 4px !important;
            padding-top: 4px !important;
            border-top: 1.2px solid #000 !important;
            font-size: 8px !important;
            line-height: 1.15 !important;
            gap: 8px !important;
          }
        }
      `}</style>
      <div className="turotugma-no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30, fontWeight: 800 }}>Final Time Tables</h1>
          <div style={{ margin: "8px 0 0", color: "#5b6787", fontSize: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, color: "#1e293b" }}>Official Published Timetable:</span>
            {publishedList.length > 1 ? (
              <select
                value={selectedPublishedId}
                onChange={(e) => handleSwitchPublished(e.target.value)}
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "1.5px solid #cbd5e1",
                  background: "#fff",
                  color: "#1e293b",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {publishedList.map((pub) => (
                  <option key={pub.id} value={pub.id}>
                    {pub.name}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontWeight: 600, color: "#1e293b" }}>{draft && draft.name}</span>
            )}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 99, background: "#dcfce7", color: "#15803d", fontWeight: 700, fontSize: 12, border: "1px solid #bbf7d0" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
              Official Published Schedule (Public View)
            </span>
          </div>
        </div>
      </div>
      {/* View filter and contextual dropdowns + Export button */}
      <div className="turotugma-no-print" style={{
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
        {/* Section controls (sections view) */}
        {viewMode === 'sections' && (
          <>
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
                {availableGrades.map(g => (
                  <option key={g} value={g}>Grade {g}</option>
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
                Search Section
              </label>
              <input
                type="text"
                placeholder="Search section..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: 180,
                  fontSize: 14.5,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1.2px solid #e5eaf4',
                  color: '#25326f',
                  background: '#f8faff',
                  outline: 'none',
                  boxShadow: '0 1px 4px 0 rgba(30,40,90,0.04)',
                }}
              />
            </div>
          </>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <label style={{
                color: '#5b6787',
                fontWeight: 700,
                fontSize: 13.5,
                marginBottom: 5,
                marginLeft: 2,
              }}>
                Search Teacher
              </label>
              <input
                type="text"
                placeholder="Search teacher..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: 180,
                  fontSize: 14.5,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1.2px solid #e5eaf4',
                  color: '#25326f',
                  background: '#f8faff',
                  outline: 'none',
                  boxShadow: '0 1px 4px 0 rgba(30,40,90,0.04)',
                }}
              />
            </div>
          </>
        )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: '10px 18px',
              background: '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Print Schedule
          </button>
          <button
            type="button"
            onClick={handleExport}
            style={{
              padding: '10px 22px',
              background: '#1a3a8c',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Export as PDF
          </button>
        </div>
      </div>
      {/* Schedules to export: only these are included in PDF */}
      <div ref={exportSchedulesRef} id="printable-timetables-container" className="printable-timetables-container">
      {viewMode === 'sections' && sectionIds.map((sectionId) => {
        const adviserName = getAdviserName(sectionId);

        const section = sectionsById.get(sectionId) || sections.find(s => s.id === sectionId);
        const sectionLevel = (section?.level === "shs" || Number(section?.grade) >= 11 || String(sectionId).toLowerCase().includes("shs")) ? "shs" : "jhs";
        const periodCount = maxPeriods || levelConfig.periods?.regular || 8;

        function parseTimeToMinutes(timeText) {
          if (!timeText) return 450;
          const clean = String(timeText).trim();
          const isPm = clean.toUpperCase().includes("PM");
          const isAm = clean.toUpperCase().includes("AM");
          const [hStr, mStr] = clean.replace(/[^0-9:]/g, "").split(":");
          let h = parseInt(hStr, 10) || 7;
          let m = parseInt(mStr, 10) || 30;
          if (isPm && h < 12) h += 12;
          if (isAm && h === 12) h = 0;
          return h * 60 + m;
        }

        function getPeriodTimes(periodType, count, periodMinutes, breaks) {
          let times = [];
          const startTimeText = levelConfig.schoolStartTime || "07:30";
          let currentMinutes = parseTimeToMinutes(startTimeText);
          for (let i = 1; i <= count; i++) {
            const matchingSlot = (slots || []).find((s) => Number(s.period) === i && (s.sessionType === periodType || !s.sessionType));
            if (matchingSlot && matchingSlot.start && matchingSlot.end) {
              times.push(`${matchingSlot.start} – ${matchingSlot.end}`);
              continue;
            }
            let breakDuration = 0;
            if (breaks?.morning?.enabled && i - 1 === breaks.morning.afterPeriod) breakDuration += breaks.morning.duration;
            if (breaks?.lunch?.enabled && i - 1 === breaks.lunch.afterPeriod) breakDuration += breaks.lunch.duration;
            if (breaks?.afternoon?.enabled && i - 1 === breaks.afternoon.afterPeriod) breakDuration += breaks.afternoon.duration;
            currentMinutes += breakDuration;
            let endMinutes = currentMinutes + periodMinutes;
            let start = minutesToTime(currentMinutes);
            let end = minutesToTime(endMinutes);
            times.push(`${start} – ${end}`);
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
          return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
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
          levelConfig.periodMinutes?.regular || 50,
          levelConfig.breaks
        );
        const shortenedTimes = getPeriodTimes(
          'shortened',
          periodCount,
          levelConfig.periodMinutes?.shortened || 45,
          levelConfig.breaks
        );

        // Build periods array for this section (1..periodCount)
        const periods = Array.from({ length: periodCount }, (_, i) => i + 1);

        return (
          <div
            key={sectionId}
            className="schedule-block"
            style={{
              marginBottom: 40,
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 12px 0 rgba(0,0,0,0.08)',
              padding: '28px 24px',
              border: '1.5px solid #000',
              maxWidth: 1400,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {/* DepEd Official Header */}
            <DepEdTopHeader
              schoolProfile={schoolProfile}
              title="CLASSROOM PROGRAM"
              subtitle={getSectionName(sectionId)}
              adviserName={adviserName}
              isDraft={false}
              level={sectionLevel}
            />

            <div className="timetable-table-wrap" style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', border: '2px solid #000' }}>
                <colgroup>
                  {shortenedDays.length > 0 ? (
                    <>
                      <col style={{ width: "11%" }} />
                      <col style={{ width: "11%" }} />
                    </>
                  ) : (
                    <col style={{ width: "16%" }} />
                  )}
                  {days.map((day) => (
                    <col
                      key={day}
                      style={{
                        width: `${(shortenedDays.length > 0 ? 78 : 84) / days.length}%`,
                      }}
                    />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th colSpan={shortenedDays.length > 0 ? 2 : 1} style={{
                      border: '1px solid #000',
                      padding: '8px 6px',
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: 13,
                      color: '#000000',
                      background: '#8fb6e5',
                      backgroundColor: '#8fb6e5',
                      textTransform: 'uppercase',
                    }}>Time</th>
                    {days.map((day) => (
                      <th key={day} rowSpan={2} style={{
                        border: '1px solid #000',
                        padding: '8px 6px',
                        fontWeight: 800,
                        fontSize: 13,
                        color: '#000000',
                        background: '#8fb6e5',
                        backgroundColor: '#8fb6e5',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        textTransform: 'uppercase',
                      }}>{day}</th>
                    ))}
                  </tr>
                  <tr>
                    <th style={{
                      border: '1px solid #000',
                      padding: '4px 6px',
                      fontWeight: 700,
                      fontSize: 11,
                      color: '#000000',
                      background: '#8fb6e5',
                      backgroundColor: '#8fb6e5',
                      textAlign: 'center',
                    }}>{regularSessionInitials || 'Regular'}</th>
                    {shortenedDays.length > 0 && (
                      <th style={{
                        border: '1px solid #000',
                        padding: '4px 6px',
                        fontWeight: 700,
                        fontSize: 11,
                        color: '#000000',
                        background: '#8fb6e5',
                        backgroundColor: '#8fb6e5',
                        textAlign: 'center',
                      }}>{shortenedSessionInitials || 'Shortened'}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {/* Flag Raising Row on Monday */}
                  <tr style={{ background: '#fff' }}>
                    <td className="time-cell" style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700, fontSize: 12, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                      7:00 – 7:30
                    </td>
                    {shortenedDays.length > 0 && (
                      <td className="time-cell" style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700, fontSize: 12, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                        7:00 – 7:30
                      </td>
                    )}
                    <td
                      colSpan={days.length}
                      className="break-banner"
                      style={{
                        border: '1px solid #000',
                        padding: '8px',
                        background: '#f5b301',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: 13,
                        textAlign: 'center',
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      FLAG RAISING CEREMONY (MONDAY)
                    </td>
                  </tr>

                  {periods.map((periodNum, idx) => {
                    const morningAfter = levelConfig?.breaks?.morning?.enabled !== false ? (levelConfig?.breaks?.morning?.afterPeriod || 2) : -1;
                    const lunchAfter = levelConfig?.breaks?.lunch?.enabled !== false ? (levelConfig?.breaks?.lunch?.afterPeriod || 4) : -1;
                    const isMorningBreak = idx === morningAfter;
                    const isLunchBreak = idx === lunchAfter;

                    const getBreakRange = (timesArr, fallback) => {
                      if (idx > 0 && timesArr[idx - 1] && timesArr[idx]) {
                        const prevParts = String(timesArr[idx - 1]).split(/[–-]/);
                        const currParts = String(timesArr[idx]).split(/[–-]/);
                        const prevEnd = prevParts[1]?.trim();
                        const currStart = currParts[0]?.trim();
                        if (prevEnd && currStart && prevEnd !== currStart) {
                          return `${prevEnd} – ${currStart}`;
                        }
                      }
                      return fallback;
                    };

                    return (
                      <React.Fragment key={periodNum}>
                        {isMorningBreak && (
                          <tr>
                            <td className="time-cell" style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 700, fontSize: 11, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                              {getBreakRange(regularTimes, "9:30 – 9:50")}
                            </td>
                            {shortenedDays.length > 0 && (
                              <td className="time-cell" style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 700, fontSize: 11, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                                {getBreakRange(shortenedTimes, "9:15 – 9:35")}
                              </td>
                            )}
                            <td
                              colSpan={days.length}
                              className="break-banner"
                              style={{
                                border: '1px solid #000',
                                padding: '6px',
                                background: '#f5b301',
                                color: '#000',
                                fontWeight: 800,
                                fontSize: 12,
                                textAlign: 'center',
                                letterSpacing: 1.5,
                                textTransform: 'uppercase',
                              }}
                            >
                              RECESS / MORNING BREAK
                            </td>
                          </tr>
                        )}

                        {isLunchBreak && (
                          <tr>
                            <td className="time-cell" style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 700, fontSize: 11, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                              {getBreakRange(regularTimes, "11:50 – 1:00")}
                            </td>
                            {shortenedDays.length > 0 && (
                              <td className="time-cell" style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 700, fontSize: 11, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                                {getBreakRange(shortenedTimes, "11:30 – 12:30")}
                              </td>
                            )}
                            <td
                              colSpan={days.length}
                              className="break-banner"
                              style={{
                                border: '1px solid #000',
                                padding: '6px',
                                background: '#f5b301',
                                color: '#000',
                                fontWeight: 800,
                                fontSize: 12,
                                textAlign: 'center',
                                letterSpacing: 1.5,
                                textTransform: 'uppercase',
                              }}
                            >
                              LUNCH BREAK
                            </td>
                          </tr>
                        )}

                        <tr>
                          <td className="time-cell" style={{
                            border: '1px solid #000',
                            padding: '10px 8px',
                            fontWeight: 700,
                            fontSize: 12,
                            color: '#000',
                            textAlign: 'center',
                            background: '#f8fafc',
                            whiteSpace: 'nowrap',
                          }}>{regularTimes[idx]}</td>
                          {shortenedDays.length > 0 && (
                            <td className="time-cell" style={{
                              border: '1px solid #000',
                              padding: '10px 8px',
                              fontWeight: 700,
                              fontSize: 12,
                              color: '#000',
                              textAlign: 'center',
                              background: '#f8fafc',
                              whiteSpace: 'nowrap',
                            }}>{shortenedTimes[idx]}</td>
                          )}
                          {days.map((day) => {
                            const assignment = getCellAssignment(sectionId, day, periodNum);
                            return (
                              <td key={day} className="schedule-cell" style={{
                                border: '1px solid #000',
                                padding: '8px 6px',
                                background: '#fff',
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                minHeight: 52,
                              }}>
                                {assignment ? (
                                  <div className="schedule-cell-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                                    <div className="schedule-cell-subject" style={{ fontWeight: 800, fontSize: 13, color: '#000', textTransform: 'uppercase', lineHeight: 1.2 }}>{getSubjectName(assignment.subjectId)}</div>
                                    {Array.isArray(assignment.breakoutAssignments) && assignment.breakoutAssignments.length > 0 ? (
                                      <div className="schedule-cell-subtext schedule-cell-breakout" style={{ color: '#222', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.1, lineHeight: 1.15, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {assignment.breakoutAssignments.map((b, bIdx) => (
                                          <div key={bIdx} style={{ whiteSpace: 'nowrap' }}>
                                            <span style={{ fontWeight: 800 }}>{b.stream}:</span> {b.teacherName || getTeacherName(b.teacherId)}
                                          </div>
                                        ))}
                                      </div>
                                    ) : Array.isArray(assignment.coTeacherIds) && assignment.coTeacherIds.length > 0 ? (
                                      <div className="schedule-cell-subtext" style={{ color: '#222', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.2 }}>
                                        {[getTeacherName(assignment.teacherId), ...assignment.coTeacherIds.map((id) => getTeacherName(id))].join(', ')}
                                      </div>
                                    ) : (
                                      <div className="schedule-cell-subtext" style={{ color: '#222', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.2 }}>{getTeacherName(assignment.teacherId)}</div>
                                    )}
                                  </div>
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  })}

                  {/* Footer Maintenance Banner */}
                  <tr>
                    <td className="time-cell" style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700, fontSize: 11, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                      END
                    </td>
                    {shortenedDays.length > 0 && (
                      <td className="time-cell" style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700, fontSize: 11, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                        END
                      </td>
                    )}
                    <td
                      colSpan={days.length}
                      className="break-banner"
                      style={{
                        border: '1px solid #000',
                        padding: '8px',
                        background: '#f5b301',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: 13,
                        textAlign: 'center',
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                      }}
                    >
                      ROOM MAINTENANCE & ZONE IMPROVEMENT
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official DepEd Signatories Block */}
            <SignatoryBlock schoolProfile={schoolProfile} sectionId={sectionId} level={sectionLevel} />
          </div>
        );
      })}

      {viewMode === 'teachers' && filteredTeacherIds.map((teacherId) => {
        const teacherName = getTeacherName(teacherId);
        const teacherLevel = (sectionIds.some((sId) => {
          const sec = sectionsById.get(sId) || sections.find(s => s.id === sId);
          return (sec?.level === "shs" || Number(sec?.grade) >= 11 || String(sId).toLowerCase().includes("shs")) &&
            Object.keys(assignments).some((k) => k.startsWith(`${sId}|`) && assignments[k]?.teacherId === teacherId);
        })) ? "shs" : "jhs";

        function parseTimeToMinutes(timeText) {
          if (!timeText) return 450;
          const clean = String(timeText).trim();
          const isPm = clean.toUpperCase().includes("PM");
          const isAm = clean.toUpperCase().includes("AM");
          const [hStr, mStr] = clean.replace(/[^0-9:]/g, "").split(":");
          let h = parseInt(hStr, 10) || 7;
          let m = parseInt(mStr, 10) || 30;
          if (isPm && h < 12) h += 12;
          if (isAm && h === 12) h = 0;
          return h * 60 + m;
        }

        function getPeriodTimes(periodType, periodCount, periodMinutes, breaks) {
          let times = [];
          const startTimeText = levelConfig.schoolStartTime || "07:30";
          let currentMinutes = parseTimeToMinutes(startTimeText);
          for (let i = 1; i <= periodCount; i++) {
            const matchingSlot = (slots || []).find((s) => Number(s.period) === i && (s.sessionType === periodType || !s.sessionType));
            if (matchingSlot && matchingSlot.start && matchingSlot.end) {
              times.push(`${matchingSlot.start} – ${matchingSlot.end}`);
              continue;
            }
            let breakDuration = 0;
            if (breaks?.morning?.enabled && i - 1 === breaks.morning.afterPeriod) breakDuration += breaks.morning.duration;
            if (breaks?.lunch?.enabled && i - 1 === breaks.lunch.afterPeriod) breakDuration += breaks.lunch.duration;
            if (breaks?.afternoon?.enabled && i - 1 === breaks.afternoon.afterPeriod) breakDuration += breaks.afternoon.duration;
            currentMinutes += breakDuration;
            let endMinutes = currentMinutes + (periodMinutes || levelConfig.periodMinutes?.regular || 50);
            let start = minutesToTime(currentMinutes);
            let end = minutesToTime(endMinutes);
            times.push(`${start} – ${end}`);
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
          return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
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
          periods.length,
          levelConfig.periodMinutes?.regular || 50,
          levelConfig.breaks
        );
        const shortenedTimes = getPeriodTimes(
          'shortened',
          periods.length,
          levelConfig.periodMinutes?.shortened || 45,
          levelConfig.breaks
        );

        return (
          <div
            key={teacherId}
            className="schedule-block"
            style={{
              marginBottom: 40,
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 12px 0 rgba(0,0,0,0.08)',
              padding: '28px 24px',
              border: '1.5px solid #000',
              maxWidth: 1400,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {/* DepEd Official Header */}
            <DepEdTopHeader
              schoolProfile={schoolProfile}
              title="TEACHER CLASS PROGRAM"
              subtitle={`TEACHER: ${teacherName}`}
              isDraft={false}
              level={teacherLevel}
            />

            <div className="timetable-table-wrap" style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', border: '2px solid #000' }}>
                <colgroup>
                  {shortenedDays.length > 0 ? (
                    <>
                      <col style={{ width: "11%" }} />
                      <col style={{ width: "11%" }} />
                    </>
                  ) : (
                    <col style={{ width: "16%" }} />
                  )}
                  {days.map((day) => (
                    <col
                      key={day}
                      style={{
                        width: `${(shortenedDays.length > 0 ? 78 : 84) / days.length}%`,
                      }}
                    />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th colSpan={shortenedDays.length > 0 ? 2 : 1} style={{
                      border: '1px solid #000',
                      padding: '8px 6px',
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: 13,
                      color: '#000000',
                      background: '#8fb6e5',
                      backgroundColor: '#8fb6e5',
                      textTransform: 'uppercase',
                    }}>Time</th>
                    {days.map((day) => (
                      <th key={day} rowSpan={2} style={{
                        border: '1px solid #000',
                        padding: '8px 6px',
                        fontWeight: 800,
                        fontSize: 13,
                        color: '#000000',
                        background: '#8fb6e5',
                        backgroundColor: '#8fb6e5',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        textTransform: 'uppercase',
                      }}>{day}</th>
                    ))}
                  </tr>
                  <tr>
                    <th style={{
                      border: '1px solid #000',
                      padding: '4px 6px',
                      fontWeight: 700,
                      fontSize: 11,
                      color: '#000000',
                      background: '#8fb6e5',
                      backgroundColor: '#8fb6e5',
                      textAlign: 'center',
                    }}>{regularSessionInitials || 'Regular'}</th>
                    {shortenedDays.length > 0 && (
                      <th style={{
                        border: '1px solid #000',
                        padding: '4px 6px',
                        fontWeight: 700,
                        fontSize: 11,
                        color: '#000000',
                        background: '#8fb6e5',
                        backgroundColor: '#8fb6e5',
                        textAlign: 'center',
                      }}>{shortenedSessionInitials || 'Shortened'}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {/* Flag Raising Row on Monday */}
                  <tr style={{ background: '#fff' }}>
                    <td className="time-cell" style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700, fontSize: 12, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                      7:00 – 7:30
                    </td>
                    {shortenedDays.length > 0 && (
                      <td className="time-cell" style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700, fontSize: 12, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                        7:00 – 7:30
                      </td>
                    )}
                    <td
                      colSpan={days.length}
                      className="break-banner"
                      style={{
                        border: '1px solid #000',
                        padding: '8px',
                        background: '#f5b301',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: 13,
                        textAlign: 'center',
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      FLAG RAISING CEREMONY (MONDAY)
                    </td>
                  </tr>

                  {periods.map((periodNum, idx) => {
                    const morningAfter = levelConfig?.breaks?.morning?.enabled !== false ? (levelConfig?.breaks?.morning?.afterPeriod || 2) : -1;
                    const lunchAfter = levelConfig?.breaks?.lunch?.enabled !== false ? (levelConfig?.breaks?.lunch?.afterPeriod || 4) : -1;
                    const isMorningBreak = idx === morningAfter;
                    const isLunchBreak = idx === lunchAfter;

                    const getBreakRange = (timesArr, fallback) => {
                      if (idx > 0 && timesArr[idx - 1] && timesArr[idx]) {
                        const prevParts = String(timesArr[idx - 1]).split(/[–-]/);
                        const currParts = String(timesArr[idx]).split(/[–-]/);
                        const prevEnd = prevParts[1]?.trim();
                        const currStart = currParts[0]?.trim();
                        if (prevEnd && currStart && prevEnd !== currStart) {
                          return `${prevEnd} – ${currStart}`;
                        }
                      }
                      return fallback;
                    };

                    return (
                      <React.Fragment key={periodNum}>
                        {isMorningBreak && (
                          <tr>
                            <td className="time-cell" style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 700, fontSize: 11, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                              {getBreakRange(regularTimes, "9:30 – 9:50")}
                            </td>
                            {shortenedDays.length > 0 && (
                              <td className="time-cell" style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 700, fontSize: 11, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                                {getBreakRange(shortenedTimes, "9:15 – 9:35")}
                              </td>
                            )}
                            <td
                              colSpan={days.length}
                              className="break-banner"
                              style={{
                                border: '1px solid #000',
                                padding: '6px',
                                background: '#f5b301',
                                color: '#000',
                                fontWeight: 800,
                                fontSize: 12,
                                textAlign: 'center',
                                letterSpacing: 1.5,
                                textTransform: 'uppercase',
                              }}
                            >
                              RECESS / MORNING BREAK
                            </td>
                          </tr>
                        )}

                        {isLunchBreak && (
                          <tr>
                            <td className="time-cell" style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 700, fontSize: 11, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                              {getBreakRange(regularTimes, "11:50 – 1:00")}
                            </td>
                            {shortenedDays.length > 0 && (
                              <td className="time-cell" style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 700, fontSize: 11, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                                {getBreakRange(shortenedTimes, "11:30 – 12:30")}
                              </td>
                            )}
                            <td
                              colSpan={days.length}
                              className="break-banner"
                              style={{
                                border: '1px solid #000',
                                padding: '6px',
                                background: '#f5b301',
                                color: '#000',
                                fontWeight: 800,
                                fontSize: 12,
                                textAlign: 'center',
                                letterSpacing: 1.5,
                                textTransform: 'uppercase',
                              }}
                            >
                              LUNCH BREAK
                            </td>
                          </tr>
                        )}

                        <tr>
                          <td className="time-cell" style={{
                            border: '1px solid #000',
                            padding: '10px 8px',
                            fontWeight: 700,
                            fontSize: 12,
                            color: '#000',
                            textAlign: 'center',
                            background: '#f8fafc',
                            whiteSpace: 'nowrap',
                          }}>{regularTimes[idx]}</td>
                          {shortenedDays.length > 0 && (
                            <td className="time-cell" style={{
                              border: '1px solid #000',
                              padding: '10px 8px',
                              fontWeight: 700,
                              fontSize: 12,
                              color: '#000',
                              textAlign: 'center',
                              background: '#f8fafc',
                              whiteSpace: 'nowrap',
                            }}>{shortenedTimes[idx]}</td>
                          )}
                          {days.map((day) => {
                            const teacherAssign = getTeacherCellAssignment(teacherId, day, periodNum);
                            const found = teacherAssign ? { assignment: teacherAssign.assignment, sectionId: teacherAssign.sectionId } : null;
                            return (
                              <td key={day} className="schedule-cell" style={{
                                border: '1px solid #000',
                                padding: '8px 6px',
                                background: '#fff',
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                minHeight: 52,
                              }}>
                                {found ? (
                                  <div className="schedule-cell-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                                    <div className="schedule-cell-subject" style={{ fontWeight: 800, fontSize: 13, color: '#000', textTransform: 'uppercase', lineHeight: 1.2 }}>
                                      {getSubjectName(found.assignment.subjectId)}
                                      {teacherAssign?.streamName ? ` (${teacherAssign.streamName})` : ''}
                                    </div>
                                    <div className="schedule-cell-subtext" style={{ color: '#222', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.2 }}>{getSectionName(found.sectionId)}</div>
                                  </div>
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  })}

                  {/* Footer Maintenance Banner */}
                  <tr>
                    <td className="time-cell" style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700, fontSize: 11, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                      END
                    </td>
                    {shortenedDays.length > 0 && (
                      <td className="time-cell" style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 700, fontSize: 11, color: '#000', textAlign: 'center', background: '#f8fafc' }}>
                        END
                      </td>
                    )}
                    <td
                      colSpan={days.length}
                      className="break-banner"
                      style={{
                        border: '1px solid #000',
                        padding: '8px',
                        background: '#f5b301',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: 13,
                        textAlign: 'center',
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                      }}
                    >
                      ROOM MAINTENANCE & ZONE IMPROVEMENT
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official DepEd Signatories Block */}
            <SignatoryBlock schoolProfile={schoolProfile} level={teacherLevel} />
          </div>
        );
      })}
      </div>
    </div>
  );
}
