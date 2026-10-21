import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import TimeTables from "./TimeTables";

function ConfirmationModal({ open, message, onConfirm, onCancel, title = "Confirmation", confirmLabel = "Confirm" }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.35)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 32px rgba(26,37,54,0.18)',
        padding: '32px 28px',
        minWidth: 400,
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 18, color: '#1a2536' }}>{title}</div>
        <div style={{ fontSize: 15, marginBottom: 24, color: '#3a3a3a' }}>{message}</div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ padding: '10px 24px', borderRadius: 8, background: '#eaf0fa', color: '#1a3a8c', fontWeight: 700, border: 'none', fontSize: 15, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '10px 24px', borderRadius: 8, background: '#b53f4e', color: '#fff', fontWeight: 700, border: 'none', fontSize: 15, cursor: 'pointer' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

const SECTIONS_STORAGE_KEY = "turotugma_sections_created";
const SUBJECTS_STORAGE_KEY = "turotugma_subjects";
const FACULTY_STORAGE_KEY = "turotugma_faculty";
const DRAFTS_STORAGE_KEY = "turotugma_schedule_drafts";
const PUBLISHED_STORAGE_KEY = "turotugma_published_schedules";
const CONFIG_STORAGE_KEY = "turotugma_schedule_configurations";
const SCHEDULE_PERIODS_KEY = "turotugma_schedule_unavailable_periods";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT_LABELS = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};
const TRACKS = ["HUMSS", "STEM", "ABM", "TVL", "GAS"];
const MAX_TEACHER_LOAD_BASE = 40;

const SCHEDULE_OPTIONS = [
  { value: "jhs", label: "Junior High School" },
  { value: "shs-first", label: "Senior High School — First Semester" },
  { value: "shs-last", label: "Senior High School — Last Semester" },
];

const DEFAULT_CONFIG = {
  jhs: {
    schoolStartTime: "07:30",
    schoolEndTime: "16:00",
    flagCeremonyMinutes: 0,
    zoneImprovementMinutes: 0,
    periodStructureMode: "configured",
    periodCalculationMode: "manual",
    regularDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    shortenedDays: [],
    periodMinutes: { regular: 50, shortened: 45 },
    periods: { regular: 8, special: 9 },
    breaks: {
      morning: { enabled: true, duration: 20, afterPeriod: 2 },
      lunch: { enabled: true, duration: 60, afterPeriod: 4 },
      afternoon: { enabled: false, duration: 15, afterPeriod: 6 },
    },
  },
  shs: {
    periodStructureMode: "configured",
    periodCalculationMode: "manual",
    regularDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    shortenedDays: [],
    periodMinutes: { regular: 50, shortened: 45 },
    periods: {
      default: 8,
      track: { HUMSS: 8, STEM: 8, ABM: 8, TVL: 8, GAS: 8 },
    },
    breaks: {
      morning: { enabled: true, duration: 20, afterPeriod: 2 },
      lunch: { enabled: true, duration: 60, afterPeriod: 4 },
      afternoon: { enabled: false, duration: 15, afterPeriod: 6 },
    },
  },
  constraints: {
    enforceNoDoubleBooking: true,
    enforceUnavailablePeriods: true,
    enforceExpertiseAndGradeMatch: true,
    enforceRestrictedPeriods: true,
    restrictedPeriodLabels: [],
    teacherRestrictions: [],
    subjectRestrictions: [],
  },
};

const EMPTY_TEACHER_RESTRICTION_FORM = {
  targetType: "",
  teacherId: "",
  ancillaryTask: "",
  periodLabels: [],
};

const EMPTY_SUBJECT_RESTRICTION_FORM = {
  subjectId: "",
  subjectQuery: "",
  periodLabels: [],
  reason: "",
};

function formatDayGroupLabel(days) {
  if (!days || days.length === 0) return "";
  const shortMap = {
    Monday: "M",
    Tuesday: "T",
    Wednesday: "W",
    Thursday: "Th",
    Friday: "F",
    Saturday: "Sa",
    Sunday: "Su",
  };

  const sortedDays = [...days].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
  const dayIndices = sortedDays.map((d) => DAYS.indexOf(d));

  let isContiguous = dayIndices.length >= 3;
  for (let i = 0; i < dayIndices.length - 1; i++) {
    if (dayIndices[i + 1] !== dayIndices[i] + 1) {
      isContiguous = false;
      break;
    }
  }

  if (isContiguous) {
    const startDay = sortedDays[0];
    const endDay = sortedDays[sortedDays.length - 1];
    return `${DAY_SHORT_LABELS[startDay] || startDay} – ${DAY_SHORT_LABELS[endDay] || endDay}`;
  }

  if (sortedDays.length === 1) {
    return DAY_SHORT_LABELS[sortedDays[0]] || sortedDays[0];
  }

  return sortedDays.map((d) => shortMap[d] || d).join(", ");
}

function renderScheduleSectionBadge(section) {
  if (!section) return null;
  const level = section.level || (Number(section.grade) <= 10 ? "jhs" : "shs");

  if (level === "jhs") {
    let cls = section.classification || "Regular";
    if (cls === "Special" || cls === "STE") cls = "SP-STEM";

    let badgeStyle = { bg: "#f1f5f9", border: "#cbd5e1", color: "#475569" };

    if (cls === "SP-STEM") {
      badgeStyle = { bg: "#e0f2fe", border: "#38bdf8", color: "#0369a1" };
    } else if (cls === "SPA") {
      badgeStyle = { bg: "#f3e8ff", border: "#c084fc", color: "#7e22ce" };
    } else if (cls === "SPJ") {
      badgeStyle = { bg: "#fff7ed", border: "#fb923c", color: "#c2410c" };
    }

    return (
      <span
        style={{
          color: badgeStyle.color,
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap",
          background: badgeStyle.bg,
          borderRadius: 999,
          border: `1px solid ${badgeStyle.border}`,
          padding: "2px 8px",
          display: "inline-block",
        }}
      >
        {cls === "SP-STEM" ? "SP-STEM" : cls === "SPA" ? "SPA" : cls === "SPJ" ? "SPJ" : "Regular"}
      </span>
    );
  }

  const track = section.track || "Academic";
  const cluster = section.cluster || section.strand || "";
  let clusterStyle = { bg: "#f1f5f9", border: "#cbd5e1", color: "#475569" };
  const lowerCluster = (cluster || "").toLowerCase();
  if (lowerCluster.includes("stem")) {
    clusterStyle = { bg: "#ecfeff", border: "#67e8f9", color: "#0e7490" };
  } else if (lowerCluster.includes("abm") || lowerCluster.includes("business")) {
    clusterStyle = { bg: "#ecfdf5", border: "#6ee7b7", color: "#047857" };
  } else if (lowerCluster.includes("humss") || lowerCluster.includes("social")) {
    clusterStyle = { bg: "#fff1f2", border: "#fda4af", color: "#be123c" };
  } else if (lowerCluster.includes("ict") || lowerCluster.includes("industrial") || lowerCluster.includes("tech") || track === "TechPro") {
    clusterStyle = { bg: "#f5f3ff", border: "#c4b5fd", color: "#6d28d9" };
  }

  return (
    <div style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      <span
        style={{
          color: track === "TechPro" ? "#7c2d12" : "#1e40af",
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap",
          background: track === "TechPro" ? "#ffedd5" : "#dbeafe",
          borderRadius: 999,
          border: track === "TechPro" ? "1px solid #fed7aa" : "1px solid #bfdbfe",
          padding: "2px 8px",
        }}
      >
        {track}
      </span>
      {cluster ? (
        <span
          style={{
            color: clusterStyle.color,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
            background: clusterStyle.bg,
            borderRadius: 999,
            border: `1px solid ${clusterStyle.border}`,
            padding: "2px 8px",
          }}
        >
          {cluster.split(" (")[0]}
        </span>
      ) : null}
      {section.grade ? (
        <span
          style={{
            color: "#475569",
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
            background: "#f1f5f9",
            borderRadius: 999,
            border: "1px solid #cbd5e1",
            padding: "2px 8px",
          }}
        >
          Grade {section.grade}
        </span>
      ) : null}
    </div>
  );
}

export default function ScheduleGenerator({ readOnly = false, hideControls = false, generatorMode = true }) {
  const isGeneratorMode = generatorMode;
  // Track which suggestion to show for each conflict (default or alternative)
  const [conflictSuggestionMode, setConflictSuggestionMode] = useState({});
  // State declarations
  const [scheduleType, setScheduleType] = useState("jhs");
  const [configPanel, setConfigPanel] = useState("jhs");
  const [jhsSessionType, setJhsSessionType] = useState("regular");
  const [shsSessionType, setShsSessionType] = useState("regular");
  const [drafts, setDrafts] = useState(() => loadJson(DRAFTS_STORAGE_KEY, []));
  const [publishedSchedules, setPublishedSchedules] = useState(() => loadJson(PUBLISHED_STORAGE_KEY, {}));
  const [schedule, setSchedule] = useState(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState(null); // null | "drafts" | "conflicts" | "restrictions"
  const showDraftsPanel = activeDrawerTab === "drafts";
  const showConflictsPanel = activeDrawerTab === "conflicts";
  const showRestrictionsModal = activeDrawerTab === "restrictions";
  const setShowDraftsPanel = (val) => setActiveDrawerTab((prev) => ((typeof val === "function" ? val(prev === "drafts") : val) ? "drafts" : null));
  const setShowConflictsPanel = (val) => setActiveDrawerTab((prev) => ((typeof val === "function" ? val(prev === "conflicts") : val) ? "conflicts" : null));
  const setShowRestrictionsModal = (val) => setActiveDrawerTab((prev) => ((typeof val === "function" ? val(prev === "restrictions") : val) ? "restrictions" : null));
  const [previewDraftModal, setPreviewDraftModal] = useState(null);
  const [showSchedulingConfigurations, setShowSchedulingConfigurations] = useState(true);
  const [gridSessionFilter, setGridSessionFilter] = useState("all");
  const [gridGradeFilter, setGridGradeFilter] = useState("all");
  const [gridSectionTypeFilter, setGridSectionTypeFilter] = useState("all");
  const [gridTrackFilter, setGridTrackFilter] = useState("all");
  const [cellEditorDrafts, setCellEditorDrafts] = useState({});
  const [hoveredCellKey, setHoveredCellKey] = useState("");
  const [activeCellKey, setActiveCellKey] = useState("");
  const [cellConflictTooltip, setCellConflictTooltip] = useState({ visible: false, messages: [], x: 0, y: 0 });
  const [teacherRestrictionForm, setTeacherRestrictionForm] = useState(EMPTY_TEACHER_RESTRICTION_FORM);
  const [showTeacherRestrictionEditor, setShowTeacherRestrictionEditor] = useState(false);
  const [subjectRestrictionForm, setSubjectRestrictionForm] = useState(EMPTY_SUBJECT_RESTRICTION_FORM);
  const [showSubjectRestrictionEditor, setShowSubjectRestrictionEditor] = useState(false);
  const [notice, setNotice] = useState({ text: "", type: "success" });
  const [clearGridModal, setClearGridModal] = useState({ open: false, message: '', onConfirm: null, onCancel: null });

  function handleClearGrid() {
    if (!schedule) return;
    const activeConfigSnapshot = JSON.parse(JSON.stringify(activeConfig));
    setSchedule((current) =>
      current
        ? {
          ...current,
          config: activeConfigSnapshot,
          assignments: {},
          conflicts: [],
          conflictDetails: [],
          teacherLoadPercent: {},
          updatedAt: new Date().toISOString(),
          status: "unsaved",
        }
        : current
    );
    setCellEditorDrafts({});
    setHoveredCellKey("");
    showNotice("Grid cleared and updated to latest scheduling configurations.", "success");
  }

  const [dataRefreshToken, setDataRefreshToken] = useState(0);
  const [configSaveStatus, setConfigSaveStatus] = useState("saved");
  const configSaveTimerRef = useRef(null);

  useEffect(() => {
    const handleSync = () => {
      setDataRefreshToken((prev) => prev + 1);
    };
    window.addEventListener("storage", handleSync);
    window.addEventListener("turotugma:config-updated", handleSync);
    window.addEventListener("turotugma_config_updated", handleSync);
    window.addEventListener("turotugma_subjects_updated", handleSync);
    window.addEventListener("turotugma_faculty_updated", handleSync);
    window.addEventListener("turotugma_sections_updated", handleSync);
    window.addEventListener("turotugma_schedule_configurations_updated", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("turotugma:config-updated", handleSync);
      window.removeEventListener("turotugma_config_updated", handleSync);
      window.removeEventListener("turotugma_subjects_updated", handleSync);
      window.removeEventListener("turotugma_faculty_updated", handleSync);
      window.removeEventListener("turotugma_sections_updated", handleSync);
      window.removeEventListener("turotugma_schedule_configurations_updated", handleSync);
    };
  }, []);

  const activeConfig = useMemo(() => loadScheduleConfig(), [dataRefreshToken]);
  const config = useMemo(() => {
    if (schedule && schedule.config) {
      return schedule.config;
    }
    return activeConfig;
  }, [schedule, activeConfig]);

  const setConfig = (updater) => {
    const currentConfig = loadScheduleConfig();
    const nextConfig = typeof updater === "function" ? updater(currentConfig) : updater;
    saveJson(CONFIG_STORAGE_KEY, nextConfig);
    setDataRefreshToken((prev) => prev + 1);
  };
  const sectionsRaw = useMemo(() => loadJson(SECTIONS_STORAGE_KEY, null), [dataRefreshToken]);
  const subjectsRaw = useMemo(() => loadJson(SUBJECTS_STORAGE_KEY, []), [dataRefreshToken]);
  const facultyRaw = useMemo(() => loadJson(FACULTY_STORAGE_KEY, []), [dataRefreshToken]);
  const schoolProfileRaw = useMemo(() => loadJson("turotugma_school_profile", {}), [dataRefreshToken]);

  const offeredLevels = schoolProfileRaw?.offeredLevels || "both";

  const filteredScheduleOptions = useMemo(() => {
    if (offeredLevels === "jhs_only") {
      return SCHEDULE_OPTIONS.filter((opt) => opt.value === "jhs");
    }
    if (offeredLevels === "shs_only") {
      return SCHEDULE_OPTIONS.filter((opt) => opt.value.startsWith("shs"));
    }
    return SCHEDULE_OPTIONS;
  }, [offeredLevels]);

  useEffect(() => {
    if (offeredLevels === "shs_only" && scheduleType === "jhs") {
      setScheduleType("shs-first");
    } else if (offeredLevels === "jhs_only" && scheduleType !== "jhs") {
      setScheduleType("jhs");
    }
  }, [offeredLevels, scheduleType]);

  const sections = useMemo(() => getSectionsForSchedule(scheduleType, sectionsRaw), [scheduleType, sectionsRaw]);
  const subjects = useMemo(() => normalizeSubjectsList(subjectsRaw), [subjectsRaw]);
  const faculty = useMemo(() => normalizeFacultyList(facultyRaw), [facultyRaw]);
  const slots = useMemo(
    () => buildSlots(scheduleType, config, { deriveJhsPeriods: isGeneratorMode, subjects }),
    [config, isGeneratorMode, scheduleType, subjects]
  );
  const breakSummary = useMemo(() => buildBreakSummary(scheduleType, config), [scheduleType, config]);
  const isJhsSchedule = scheduleType === "jhs";
  const levelConfig = isJhsSchedule ? config.jhs : config.shs;

  const { regularDays, shortenedDays, daySequence } = useMemo(() => {
    return extractDaysFromLevelConfig(levelConfig);
  }, [levelConfig]);

  const baseDaysSequence = useMemo(() => (daySequence.length ? daySequence : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]), [daySequence]);

  const generatorDays = useMemo(() => {
    if (gridSessionFilter === "regular") {
      return regularDays.filter((d) => baseDaysSequence.includes(d));
    }
    if (gridSessionFilter === "shortened") {
      return shortenedDays.filter((d) => baseDaysSequence.includes(d));
    }
    return baseDaysSequence;
  }, [baseDaysSequence, gridSessionFilter, regularDays, shortenedDays]);

  const activeRegularDays = useMemo(
    () => regularDays.filter((d) => baseDaysSequence.includes(d)),
    [regularDays, baseDaysSequence]
  );
  const activeShortenedDays = useMemo(
    () => shortenedDays.filter((d) => baseDaysSequence.includes(d)),
    [shortenedDays, baseDaysSequence]
  );

  const hasDualSessions = useMemo(() => {
    if (gridSessionFilter !== "all") return false;
    return activeRegularDays.length > 0 && activeShortenedDays.length > 0;
  }, [gridSessionFilter, activeRegularDays, activeShortenedDays]);
  const regularDaysLabel = useMemo(() => formatDayGroupLabel(activeRegularDays), [activeRegularDays]);
  const shortenedDaysLabel = useMemo(() => formatDayGroupLabel(activeShortenedDays), [activeShortenedDays]);

  const regularPeriodMinutes = useMemo(() => {
    if (!isGeneratorMode || scheduleType !== "jhs") return levelConfig?.periodMinutes?.regular || 50;
    const isAutoMode = config.jhs.periodStructureMode === "automated" || config.jhs.periodCalculationMode === "automated";
    if (isAutoMode) {
      return getGeneratorPeriodMinutes(subjects, scheduleType, levelConfig?.periodMinutes?.regular || 50);
    }
    return levelConfig?.periodMinutes?.regular || 50;
  }, [config.jhs, isGeneratorMode, levelConfig, scheduleType, subjects]);

  const shortenedPeriodMinutes = useMemo(() => {
    if (!isGeneratorMode || scheduleType !== "jhs") return levelConfig?.periodMinutes?.shortened || 45;
    const isAutoMode = config.jhs.periodStructureMode === "automated" || config.jhs.periodCalculationMode === "automated";
    if (isAutoMode) {
      return getGeneratorPeriodMinutes(subjects, scheduleType, levelConfig?.periodMinutes?.shortened || 45);
    }
    return levelConfig?.periodMinutes?.shortened || 45;
  }, [config.jhs, isGeneratorMode, levelConfig, scheduleType, subjects]);

  const regularTimingMap = useMemo(() => {
    const totalMaxRequiredPeriods = calculateMaxGeneratorPeriodsForSections(sections, subjects, scheduleType);
    const activeDaysCount = daySequence.length || 5;
    const sectionMaxPeriods = (isGeneratorMode && activeDaysCount > 0 && totalMaxRequiredPeriods > 0)
      ? Math.ceil(totalMaxRequiredPeriods / activeDaysCount)
      : 0;

    return buildJhsPeriodTimingMap(levelConfig, "regular", {
      deriveJhsPeriods: isGeneratorMode,
      periodMinutes: regularPeriodMinutes,
      sectionMaxPeriods,
      subjects,
      scheduleType,
    });
  }, [levelConfig, isGeneratorMode, daySequence.length, sections, subjects, scheduleType, regularPeriodMinutes]);

  const shortenedTimingMap = useMemo(() => {
    const totalMaxRequiredPeriods = calculateMaxGeneratorPeriodsForSections(sections, subjects, scheduleType);
    const activeDaysCount = daySequence.length || 5;
    const sectionMaxPeriods = (isGeneratorMode && activeDaysCount > 0 && totalMaxRequiredPeriods > 0)
      ? Math.ceil(totalMaxRequiredPeriods / activeDaysCount)
      : 0;

    return buildJhsPeriodTimingMap(levelConfig, "shortened", {
      deriveJhsPeriods: isGeneratorMode,
      periodMinutes: shortenedPeriodMinutes,
      sectionMaxPeriods,
      subjects,
      scheduleType,
    });
  }, [levelConfig, isGeneratorMode, daySequence.length, sections, subjects, scheduleType, shortenedPeriodMinutes]);

  const generatorPeriods = useMemo(() => {
    let maxPeriods = Math.max(regularTimingMap.size || 0, shortenedTimingMap.size || 0, 1);
    if (gridSessionFilter === "regular" && regularTimingMap.size > 0) {
      maxPeriods = regularTimingMap.size;
    } else if (gridSessionFilter === "shortened" && shortenedTimingMap.size > 0) {
      maxPeriods = shortenedTimingMap.size;
    }
    maxPeriods = Math.min(maxPeriods, 10);

    const periodsList = [];
    for (let p = 1; p <= maxPeriods; p++) {
      const reg = regularTimingMap.get(p);
      const short = shortenedTimingMap.get(p);

      let start = reg?.start || short?.start || "";
      let end = reg?.end || short?.end || "";

      if (gridSessionFilter === "shortened") {
        start = short?.start || reg?.start || "";
        end = short?.end || reg?.end || "";
      } else if (gridSessionFilter === "regular") {
        start = reg?.start || short?.start || "";
        end = reg?.end || short?.end || "";
      }

      periodsList.push({
        period: p,
        regularStart: reg?.start || "",
        regularEnd: reg?.end || "",
        shortenedStart: short?.start || "",
        shortenedEnd: short?.end || "",
        start,
        end,
      });
    }
    return periodsList;
  }, [regularTimingMap, shortenedTimingMap, gridSessionFilter]);

  const sessionDaysLookup = useMemo(() => {
    const levelConfig = isJhsSchedule ? config.jhs : config.shs;
    const { regularDays, shortenedDays, daySequence } = extractDaysFromLevelConfig(levelConfig);
    const active = daySequence.length ? daySequence : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    if (gridSessionFilter === "regular") return new Set(regularDays.filter((d) => active.includes(d)));
    if (gridSessionFilter === "shortened") return new Set(shortenedDays.filter((d) => active.includes(d)));
    return new Set(active);
  }, [config.jhs, config.shs, gridSessionFilter, isJhsSchedule]);

  const visibleSlots = useMemo(() => {
    if (!sessionDaysLookup || sessionDaysLookup.size === 0) {
      return slots;
    }

    return slots.filter((slot) => sessionDaysLookup.has(slot.day));
  }, [slots, sessionDaysLookup]);
  const gridGradeOptions = useMemo(
    () => Array.from(new Set(sections.map((section) => String(section.grade)).filter(Boolean))).sort((left, right) => Number(left) - Number(right)),
    [sections]
  );
  const jhsSectionTypeOptions = useMemo(
    () => Array.from(new Set(sections.map((section) => sanitizeText(section.classification) || "Regular").filter(Boolean))).sort((left, right) => left.localeCompare(right)),
    [sections]
  );
  const shsTrackOptions = useMemo(
    () => Array.from(new Set(sections.map((section) => sanitizeText(section.track).toUpperCase()).filter(Boolean))).sort((left, right) => left.localeCompare(right)),
    [sections]
  );
  const visibleSections = useMemo(() => {
    return sections.filter((section) => {
      const sectionGrade = Number(section.grade);
      const isShsSection = section.level === "shs" || sectionGrade >= 11;
      const isJhsSection = section.level === "jhs" || (sectionGrade >= 7 && sectionGrade <= 10) || (!section.level && !sectionGrade);

      if (isJhsSchedule && isShsSection) {
        return false;
      }
      if (!isJhsSchedule && isJhsSection && !isShsSection) {
        return false;
      }

      if (gridGradeFilter !== "all" && String(section.grade) !== gridGradeFilter) {
        return false;
      }

      if (isJhsSchedule) {
        if (gridSectionTypeFilter !== "all") {
          const sectionType = sanitizeText(section.classification) || "Regular";
          if (sectionType !== gridSectionTypeFilter) {
            return false;
          }
        }

        return true;
      }

      if (gridTrackFilter !== "all") {
        const sectionTrack = sanitizeText(section.track).toUpperCase();
        if (sectionTrack !== gridTrackFilter) {
          return false;
        }
      }

      return true;
    });
  }, [sections, gridGradeFilter, isJhsSchedule, gridSectionTypeFilter, gridTrackFilter]);
  const allSlotOptions = useMemo(() => {
    const labels = [
      ...buildSlots("jhs", config, { deriveJhsPeriods: isGeneratorMode, subjects }),
      ...buildSlots("shs-first", config, { deriveJhsPeriods: isGeneratorMode }),
      ...buildSlots("shs-last", config, { deriveJhsPeriods: isGeneratorMode }),
    ];

    const deduped = new Map();
    labels.forEach((slot) => {
      if (!deduped.has(slot.label)) {
        deduped.set(slot.label, slot);
      }
    });

    return Array.from(deduped.values());
  }, [config, isGeneratorMode, subjects]);
  const allPeriodLabels = useMemo(() => allSlotOptions.map((slot) => slot.label), [allSlotOptions]);
  const teacherRestrictionOptions = useMemo(
    () =>
      faculty
        .filter((teacher) => teacher.active !== false)
        .map((teacher) => ({
          id: teacher.id,
          name: teacher.name,
          label: teacher.name,
          ancillaryAssignments: extractTeacherAncillaryTasks(teacher),
        })),
    [faculty]
  );
  const effectiveTeacherRestrictions = useMemo(
    () => buildEffectiveTeacherRestrictions(config.constraints.teacherRestrictions, faculty),
    [config.constraints.teacherRestrictions, faculty]
  );
  const subjectRestrictionsForDisplay = useMemo(
    () =>
      [...(config.constraints.subjectRestrictions || [])].sort((left, right) =>
        compareRecentFirst(left?.updatedAt, right?.updatedAt)
      ),
    [config.constraints.subjectRestrictions]
  );
  const ancillaryTaskOptions = useMemo(() => {
    const tasks = teacherRestrictionOptions
      .flatMap((teacher) => teacher.ancillaryAssignments || [])
      .map((item) => sanitizeText(item))
      .filter(Boolean);

    return Array.from(new Set(tasks)).sort((left, right) => left.localeCompare(right));
  }, [teacherRestrictionOptions]);
  const restrictionPeriodOptions = useMemo(() => {
    const highestPeriod = allSlotOptions.reduce((maxPeriod, slot) => {
      const period = Number.parseInt(String(slot?.period ?? ""), 10);
      if (!Number.isFinite(period)) {
        return maxPeriod;
      }

      return Math.max(maxPeriod, period);
    }, 0);

    const isAutomated = (config?.jhs?.periodStructureMode || config?.jhs?.periodCalculationMode || "automated") === "automated";
    const manualDefault = Number(config?.jhs?.sessions?.regular?.manualPeriodCount || config?.jhs?.periods?.regular || 8);
    const totalPeriods = highestPeriod > 0 ? highestPeriod : (isAutomated ? 8 : Math.max(1, Math.min(10, manualDefault)));

    return Array.from({ length: totalPeriods }, (_, index) => formatPeriodOrdinalLabel({ period: index + 1 }));
  }, [allSlotOptions, config]);
  const subjectRestrictionOptions = useMemo(
    () =>
      sortSubjectsByTypeAndName(subjects).map((subject) => ({
        id: subject.id,
        name: subject.subjectName,
        code: subject.subjectCode,
        label: subject.subjectName,
      })),
    [subjects]
  );

  const slotsById = useMemo(() => {
    const map = new Map();
    slots.forEach((slot) => {
      map.set(slot.id, slot);
    });
    return map;
  }, [slots]);

  const sectionsById = useMemo(() => {
    const map = new Map();
    sections.forEach((section) => {
      map.set(section.id, section);
    });
    return map;
  }, [sections]);

  const subjectsById = useMemo(() => {
    const map = new Map();
    subjects.forEach((subject) => {
      map.set(subject.id, subject);
    });
    return map;
  }, [subjects]);

  const facultyById = useMemo(() => {
    const map = new Map();
    faculty.forEach((teacher) => {
      map.set(teacher.id, teacher);
    });
    return map;
  }, [faculty]);

  const activeTeachers = useMemo(() => faculty.filter((teacher) => teacher.active !== false), [faculty]);
  const activeTeachersForSchedule = useMemo(() => {
    const relevantGrades = scheduleType === "jhs" ? [7, 8, 9, 10] : [11, 12];

    return activeTeachers.filter((teacher) =>
      teacher.gradeLevelAssignments.some((gradeLabel) => {
        const grade = parseGrade(gradeLabel);
        return grade !== null && relevantGrades.includes(grade);
      })
    );
  }, [activeTeachers, scheduleType]);

  const draftsForCurrentSchedule = useMemo(
    () => getDraftsForScheduleType(drafts, scheduleType),
    [drafts, scheduleType]
  );

  const scheduleStatusLabel = useMemo(() => {
    if (schedule) {
      if (schedule.status === "published") return "Published";
      if (schedule.status === "draft") return "Draft Saved";
      if (schedule.status === "unsaved") return "Draft (Unsaved)";
      // fallback for legacy or missing status
      if (publishedSchedules?.[scheduleType] && publishedSchedules[scheduleType].id === schedule.id) return "Published";
      if (draftsForCurrentSchedule.some((d) => d.id === schedule.id)) return "Draft Saved";
      return "Draft (Unsaved)";
    }
    return "Not Generated";
  }, [schedule, publishedSchedules, scheduleType, draftsForCurrentSchedule]);

  const hasAssignments = useMemo(() => {
    return Boolean(schedule?.assignments && Object.keys(schedule.assignments).length > 0);
  }, [schedule?.assignments]);

  const evaluationForDisplay = useMemo(() => {
    if (!schedule || !hasAssignments) {
      return { conflicts: [], conflictDetails: [], teacherLoadPercent: {} };
    }

    return evaluateSchedule({
      assignments: schedule.assignments || {},
      sections,
      slots,
      subjects,
      teachers: activeTeachers,
      scheduleType,
      config,
    });
  }, [schedule, hasAssignments, sections, slots, subjects, activeTeachers, scheduleType, config]);

  const conflictDetailsForDisplay = useMemo(() => {
    if (!schedule || !hasAssignments) {
      return [];
    }

    return mergeConflictDetails(schedule.conflictDetails, evaluationForDisplay.conflictDetails);
  }, [schedule, hasAssignments, evaluationForDisplay]);

  const conflictsForDisplay = useMemo(() => {
    if (!schedule || !hasAssignments) {
      return [];
    }

    const set = new Set();
    const result = [];
    (schedule.conflicts || []).forEach((c) => {
      const s = sanitizeText(c);
      if (s && !set.has(s)) {
        set.add(s);
        result.push(s);
      }
    });
    (evaluationForDisplay.conflicts || []).forEach((c) => {
      const s = sanitizeText(c);
      if (s && !set.has(s)) {
        set.add(s);
        result.push(s);
      }
    });
    return result;
  }, [schedule, hasAssignments, evaluationForDisplay]);

  const conflictCount = conflictsForDisplay.length;
  const hasPublishBlockingConflicts = conflictCount > 0;

  const conflictMessagesByCell = useMemo(() => {
    const map = new Map();

    conflictDetailsForDisplay.forEach((entry) => {
      const message = sanitizeText(entry?.message);
      const cellKeys = Array.isArray(entry?.cellKeys) ? entry.cellKeys : [];

      if (!message || cellKeys.length === 0) {
        return;
      }

      cellKeys.forEach((cellKey) => {
        const normalizedCellKey = sanitizeText(cellKey);
        if (!normalizedCellKey) {
          return;
        }

        const existing = map.get(normalizedCellKey) || [];
        if (!existing.includes(message)) {
          map.set(normalizedCellKey, [...existing, message]);
        }
      });
    });

    return map;
  }, [conflictDetailsForDisplay]);

  const assignmentValidationSummary = useMemo(() => {
    const assignedKeys = Object.keys(schedule?.assignments || {});
    const invalidAssignedSaved = assignedKeys.filter((cellKey) => (conflictMessagesByCell.get(cellKey) || []).length > 0).length;
    const pendingInvalidCellKeys = Object.entries(cellEditorDrafts || {}).reduce((accumulator, [cellKey, draft]) => {
      const assignment = schedule?.assignments?.[cellKey];
      if (assignment) {
        return accumulator;
      }

      if (!!sanitizeText(draft?.subjectId) && !sanitizeText(draft?.teacherId)) {
        accumulator.add(cellKey);
      }

      return accumulator;
    }, new Set());

    const unassignedConflictCellKeys = Array.from(conflictMessagesByCell.keys()).filter((cellKey) => {
      const assignment = schedule?.assignments?.[cellKey];
      return !assignment && !pendingInvalidCellKeys.has(cellKey);
    });

    const pendingInvalid = pendingInvalidCellKeys.size;
    const invalidAssigned = invalidAssignedSaved + pendingInvalid + unassignedConflictCellKeys.length;
    const totalAssigned = assignedKeys.length + pendingInvalid + unassignedConflictCellKeys.length;
    const validAssigned = Math.max(0, totalAssigned - invalidAssigned);
    const totalRequired = sections.reduce(
      (sectionCount, section) =>
        sectionCount +
        slots.reduce(
          (slotCount, slot) => slotCount + (isSlotValidForSection(section, slot, scheduleType, config) ? 1 : 0),
          0
        ),
      0
    );

    return {
      totalAssigned,
      validAssigned,
      invalidAssigned,
      totalRequired,
    };
  }, [schedule?.assignments, conflictMessagesByCell, cellEditorDrafts, sections, slots, scheduleType, config]);

  const teacherBusyBySlot = useMemo(
    () => buildTeacherBusyMap(schedule?.assignments || {}, sectionsById, slotsById),
    [schedule?.assignments, sectionsById, slotsById]
  );

  const capacityIssues = useMemo(() => {
    if (!sections || !slots || !subjects) return [];
    const issues = [];
    for (const sec of sections) {
      const secSlots = slots.filter((s) => isSlotValidForSection(sec, s, scheduleType, config));
      const secSubjs = getSubjectsForSection(sec, subjects, scheduleType);
      const totalReq = secSubjs.reduce(
        (sum, sub) => sum + parseBoundedNumber(sub?.classesPerWeek, 1, 12, 4),
        0
      );
      if (totalReq > secSlots.length) {
        issues.push({
          section: sec,
          sectionName: formatConflictSectionName(sec),
          totalRequired: totalReq,
          availableSlots: secSlots.length,
          deficit: totalReq - secSlots.length,
        });
      }
    }
    return issues;
  }, [sections, slots, subjects, scheduleType, config]);

  const handleQuickIncreasePeriods = () => {
    const currentConfig = loadScheduleConfig();
    const nextConfig = JSON.parse(JSON.stringify(currentConfig || DEFAULT_CONFIG));
    const targetLevel = scheduleType === "jhs" ? "jhs" : "shs";
    if (!nextConfig[targetLevel]) nextConfig[targetLevel] = {};
    if (!nextConfig[targetLevel].sessions) nextConfig[targetLevel].sessions = {};
    if (!nextConfig[targetLevel].sessions.regular) nextConfig[targetLevel].sessions.regular = {};
    if (!nextConfig[targetLevel].sessions.shortened) nextConfig[targetLevel].sessions.shortened = {};

    const maxDemanded = (capacityIssues || []).reduce((max, i) => Math.max(max, i.totalRequired), 45);
    const regularDaysCount = (nextConfig[targetLevel]?.regularDays || ["Monday", "Tuesday", "Wednesday", "Thursday"]).length || 4;
    const shortenedDaysCount = (nextConfig[targetLevel]?.shortenedDays || ["Friday"]).length || 1;
    const totalDaysCount = regularDaysCount + shortenedDaysCount || 5;
    const targetPeriodPerDay = Math.max(9, Math.ceil(maxDemanded / totalDaysCount));

    nextConfig[targetLevel].sessions.regular.manualPeriodCount = targetPeriodPerDay;
    nextConfig[targetLevel].sessions.shortened.manualPeriodCount = targetPeriodPerDay;
    nextConfig[targetLevel].periods = {
      regular: targetPeriodPerDay,
      special: targetPeriodPerDay,
      shortened: targetPeriodPerDay,
      default: targetPeriodPerDay,
    };
    nextConfig[targetLevel].manualPeriodCount = targetPeriodPerDay;
    nextConfig[targetLevel].periodStructureMode = "configured";
    nextConfig[targetLevel].periodCalculationMode = "manual";

    saveJson(CONFIG_STORAGE_KEY, nextConfig);
    saveJson("turotugma_schedule_configurations", nextConfig);
    window.dispatchEvent(new Event("turotugma_schedule_configurations_updated"));
    setDataRefreshToken((prev) => prev + 1);

    const updatedSlots = buildSlots(scheduleType, nextConfig, { deriveJhsPeriods: isGeneratorMode, subjects });

    const autoSchedule = generateSchedule({
      scheduleType,
      sections,
      slots: updatedSlots,
      subjects,
      activeTeachers,
      config: nextConfig,
    });

    autoSchedule.config = nextConfig;
    autoSchedule.status = "unsaved";
    setSchedule(autoSchedule);
    setCellEditorDrafts({});
    setHoveredCellKey("");

    const remainingConflicts = autoSchedule.conflicts.length;
    if (remainingConflicts > 0) {
      showNotice(`Expanded to ${targetPeriodPerDay} periods/day (${targetPeriodPerDay * totalDaysCount} slots). Remaining conflicts: ${remainingConflicts}.`, "info");
    } else {
      showNotice(`Timetable capacity successfully expanded to ${targetPeriodPerDay} periods/day (${targetPeriodPerDay * totalDaysCount} slots)! All subjects scheduled with 0 conflicts.`, "success");
    }
  };

  useEffect(() => {
    // Find the most recent schedule (draft or published) for the selected schedule type
    const draftsForType = draftsForCurrentSchedule;
    const publishedForType = publishedSchedules?.[scheduleType] || null;
    let mostRecent = null;
    if (draftsForType.length > 0 && publishedForType) {
      // Compare updatedAt timestamps
      const draftDate = new Date(draftsForType[0].schedule?.updatedAt || draftsForType[0].updatedAt || 0).getTime();
      const publishedDate = new Date(publishedForType.updatedAt || publishedForType.publishedAt || 0).getTime();
      if (draftDate >= publishedDate) {
        const draftObj = draftsForType[0];
        mostRecent = {
          ...draftObj.schedule,
          config: draftObj.schedule?.config || draftObj.config || JSON.parse(JSON.stringify(activeConfig)),
        };
      } else {
        mostRecent = publishedForType
          ? {
              ...publishedForType,
              config: publishedForType.config || JSON.parse(JSON.stringify(activeConfig)),
            }
          : null;
      }
    } else if (draftsForType.length > 0) {
      const draftObj = draftsForType[0];
      mostRecent = {
        ...draftObj.schedule,
        config: draftObj.schedule?.config || draftObj.config || JSON.parse(JSON.stringify(activeConfig)),
      };
    } else if (publishedForType) {
      mostRecent = {
        ...publishedForType,
        config: publishedForType.config || JSON.parse(JSON.stringify(activeConfig)),
      };
    }
    setSchedule(mostRecent);
    setCellEditorDrafts({});
    setHoveredCellKey("");
    setShowDraftsPanel(false);
    setGridSessionFilter("all");
    setGridGradeFilter("all");
    setGridSectionTypeFilter("all");
    setGridTrackFilter("all");
  }, [scheduleType, draftsForCurrentSchedule, publishedSchedules]);

  useEffect(() => {
    setConfigSaveStatus("saved");
    // Master configuration is managed centrally via School Profile & Settings

    const allLabels = [
      ...buildSlots("jhs", config, { deriveJhsPeriods: isGeneratorMode }),
      ...buildSlots("shs-first", config, { deriveJhsPeriods: isGeneratorMode }),
      ...buildSlots("shs-last", config, { deriveJhsPeriods: isGeneratorMode }),
    ].map((slot) => slot.label);

    const dedupedLabels = Array.from(new Set(allLabels));
    saveJson(SCHEDULE_PERIODS_KEY, dedupedLabels);

    if (configSaveTimerRef.current) {
      window.clearTimeout(configSaveTimerRef.current);
    }

    configSaveTimerRef.current = window.setTimeout(() => {
      setConfigSaveStatus("saved");
    }, 1000);

    return () => {
      if (configSaveTimerRef.current) {
        window.clearTimeout(configSaveTimerRef.current);
      }
    };
  }, [config]);

  const showNotice = (text, type = "success") => {
    setNotice({ text, type });
    window.clearTimeout(window.__turotugmaScheduleNoticeTimer);
    window.__turotugmaScheduleNoticeTimer = window.setTimeout(() => {
      setNotice({ text: "", type: "success" });
    }, 2500);
  };

  const handleSessionDayToggle = (level, sessionType, day) => {
    setConfig((prev) => {
      const current = level === "jhs" ? prev.jhs : prev.shs;
      const activeKey = sessionType === "regular" ? "regularDays" : "shortenedDays";
      const otherKey = sessionType === "regular" ? "shortenedDays" : "regularDays";
      const hasDay = current[activeKey].includes(day);

      const nextActiveDays = hasDay ? current[activeKey].filter((item) => item !== day) : [...current[activeKey], day];
      const sanitizedActiveDays = DAYS.filter((item) => nextActiveDays.includes(item));
      const baseOtherDays = normalizeDays(current[otherKey]);
      const nextOtherDays = hasDay
        ? baseOtherDays
        : baseOtherDays.filter((item) => item !== day);

      const nextLevelConfig = {
        ...current,
        [activeKey]: sanitizedActiveDays,
        [otherKey]: nextOtherDays,
      };

      if (level === "jhs") {
        return { ...prev, jhs: nextLevelConfig };
      }

      return { ...prev, shs: nextLevelConfig };
    });
  };

  const addTeacherRestriction = () => {
    const now = new Date().toISOString();
    const periodLabels = normalizeStringArray(teacherRestrictionForm.periodLabels);
    if (periodLabels.length === 0) {
      showNotice("Select at least one restricted period.", "error");
      return;
    }

    const targetType = sanitizeText(teacherRestrictionForm.targetType);
    let targetTeachers = [];

    if (targetType === "specific-teacher") {
      const selectedTeacher = teacherRestrictionOptions.find((item) => item.id === teacherRestrictionForm.teacherId);

      if (!selectedTeacher) {
        showNotice("Select a teacher first.", "error");
        return;
      }

      targetTeachers = [selectedTeacher];
    } else if (targetType === "all-with-ancillary") {
      targetTeachers = teacherRestrictionOptions.filter((item) => (item.ancillaryAssignments || []).length > 0);
      if (targetTeachers.length === 0) {
        showNotice("No active teachers with ancillary tasks found.", "error");
        return;
      }
    } else if (targetType === "ancillary-task") {
      const selectedTask = sanitizeText(teacherRestrictionForm.ancillaryTask).toLowerCase();
      if (!selectedTask) {
        showNotice("Choose an ancillary task first.", "error");
        return;
      }

      targetTeachers = teacherRestrictionOptions.filter((item) =>
        (item.ancillaryAssignments || []).some((task) => {
          const cleanTask = sanitizeText(task).toLowerCase();
          return cleanTask === selectedTask || cleanTask.includes(selectedTask) || selectedTask.includes(cleanTask);
        })
      );

      if (targetTeachers.length === 0) {
        showNotice(`No active teachers found with ancillary task "${teacherRestrictionForm.ancillaryTask}".`, "error");
        return;
      }
    } else {
      showNotice("Select who to restrict.", "error");
      return;
    }

    setConfig((prev) => {
      const existing = Array.isArray(prev.constraints.teacherRestrictions) ? prev.constraints.teacherRestrictions : [];
      const targetIds = new Set(targetTeachers.map((teacher) => teacher.id));
      const others = existing.filter((item) => !targetIds.has(item.teacherId));
      const nextEntries = targetTeachers.map((teacher) => ({
        teacherId: teacher.id,
        teacherName: teacher.name || "Teacher",
        periodLabels,
        updatedAt: now,
      }));

      return {
        ...prev,
        constraints: {
          ...prev.constraints,
          teacherRestrictions: [...nextEntries, ...others],
        },
      };
    });

    persistFacultyUnavailablePeriods(
      targetTeachers.reduce((accumulator, teacher) => {
        accumulator[teacher.id] = periodLabels;
        return accumulator;
      }, {})
    );
    setDataRefreshToken((current) => current + 1);

    setTeacherRestrictionForm(EMPTY_TEACHER_RESTRICTION_FORM);
    setShowTeacherRestrictionEditor(false);
    showNotice(`Saved restriction for ${targetTeachers.length} teacher(s).`, "success");
  };

  const removeTeacherRestriction = (teacherId) => {
    const normalizedTeacherId = sanitizeText(teacherId);
    if (!normalizedTeacherId) {
      showNotice("Teacher restriction could not be removed.", "error");
      return;
    }

    setConfig((prev) => ({
      ...prev,
      constraints: {
        ...prev.constraints,
        teacherRestrictions: (prev.constraints.teacherRestrictions || []).filter(
          (item) => sanitizeText(item.teacherId) !== normalizedTeacherId
        ),
      },
    }));

    persistFacultyUnavailablePeriods({ [normalizedTeacherId]: [] });
    setDataRefreshToken((current) => current + 1);

    showNotice("Teacher restriction removed.", "success");
  };

  const addSubjectRestriction = () => {
    const now = new Date().toISOString();
    const periodLabels = normalizeStringArray(subjectRestrictionForm.periodLabels);
    if (periodLabels.length === 0) {
      showNotice("Select at least one restricted period.", "error");
      return;
    }

    const query = sanitizeText(subjectRestrictionForm.subjectQuery).toLowerCase();
    const selectedSubject =
      subjectRestrictionOptions.find((item) => item.id === subjectRestrictionForm.subjectId) ||
      subjectRestrictionOptions.find(
        (item) => item.label.toLowerCase() === query || sanitizeText(item.name).toLowerCase() === query
      );

    if (!selectedSubject) {
      showNotice("Select or enter a valid subject.", "error");
      return;
    }

    const reason = sanitizeText(subjectRestrictionForm.reason);

    setConfig((prev) => {
      const existing = Array.isArray(prev.constraints.subjectRestrictions) ? prev.constraints.subjectRestrictions : [];
      const nextEntry = {
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name || "Subject",
        subjectCode: selectedSubject.code || "",
        periodLabels,
        reason,
        updatedAt: now,
      };

      const others = existing.filter((item) => item.subjectId !== nextEntry.subjectId);

      return {
        ...prev,
        constraints: {
          ...prev.constraints,
          subjectRestrictions: [nextEntry, ...others],
        },
      };
    });

    setSubjectRestrictionForm(EMPTY_SUBJECT_RESTRICTION_FORM);
    setShowSubjectRestrictionEditor(false);
    showNotice("Subject restriction added.", "success");
  };

  const removeSubjectRestriction = (subjectId) => {
    setConfig((prev) => ({
      ...prev,
      constraints: {
        ...prev.constraints,
        subjectRestrictions: (prev.constraints.subjectRestrictions || []).filter((item) => item.subjectId !== subjectId),
      },
    }));

    showNotice("Subject restriction removed.", "success");
  };

  const handleGenerateSchedule = () => {
    if (sections.length === 0) {
      showNotice("No sections found for this schedule type.", "error");
      return;
    }

    const activeConfigSnapshot = JSON.parse(JSON.stringify(activeConfig));
    const autoSchedule = generateSchedule({
      scheduleType,
      sections,
      slots: buildSlots(scheduleType, activeConfig, { deriveJhsPeriods: isGeneratorMode, subjects }),
      subjects,
      activeTeachers,
      config: activeConfig,
    });

    // Mark as unsaved and embed current active configuration snapshot
    autoSchedule.config = activeConfigSnapshot;
    autoSchedule.status = "unsaved";
    setSchedule(autoSchedule);
    setCellEditorDrafts({});
    setHoveredCellKey("");

    const unresolved = autoSchedule.conflicts.length;
    if (unresolved > 0) {
      showNotice(`Generated with ${unresolved} unresolved conflict(s).`, "error");
    } else {
      showNotice("Schedule generated successfully.", "success");
    }
  };

  const handleAutoFixAllConflicts = () => {
    if (!schedule) {
      showNotice("Generate or load a schedule first.", "error");
      return;
    }

    const normalizeSectionString = (value) => String(value || "").replace(/\s+/g, "").replace(/[-–—]/g, "").toLowerCase();
    const normalizePeriodLabel = (value) => String(value || "").replace(/\s+/g, "").replace(/[-–—]/g, "").replace(/\./g, "").toLowerCase();

    const findSectionByLabel = (label) => {
      let sectionObj = sections.find((sec) => normalizeSectionString(formatConflictSectionName(sec)) === normalizeSectionString(label));
      if (!sectionObj) {
        sectionObj = sections.find((sec) => {
          const code = sec.code || "";
          const name = sec.name || "";
          const grade = sec.grade ? String(sec.grade) : "";
          return (
            normalizeSectionString(code) === normalizeSectionString(label) ||
            normalizeSectionString(name) === normalizeSectionString(label) ||
            normalizeSectionString(`${grade}${name}`) === normalizeSectionString(label) ||
            normalizeSectionString(`${grade}-${name}`) === normalizeSectionString(label)
          );
        });
      }
      return sectionObj;
    };

    let workingAssignments = { ...(schedule.assignments || {}) };
    let workingDrafts = { ...(cellEditorDrafts || {}) };
    let fixedCount = 0;
    let pass = 0;
    const maxPasses = 60;

    const getEvaluation = (assignments) =>
      evaluateSchedule({
        assignments,
        sections,
        slots,
        subjects,
        teachers: activeTeachers,
        scheduleType,
        config,
      });

    while (pass < maxPasses) {
      pass += 1;

      const evaluation = getEvaluation(workingAssignments);
      const conflictDetails = Array.isArray(evaluation.conflictDetails) ? evaluation.conflictDetails : [];
      if (conflictDetails.length === 0) {
        break;
      }

      let appliedThisPass = false;

      for (const detail of conflictDetails) {
        const message = detail?.message || "";
        const cellKeys = Array.isArray(detail?.cellKeys) ? detail.cellKeys : [];

        // -------------------------------------------------------------
        // Strategy 0: Under-scheduled subject (Missing recurring daily periods)
        // -------------------------------------------------------------
        if (message.includes("required recurring daily period")) {
          const match = message.match(/^(.*?):\s*(.*?)\s+has\s+(\d+)\s+of\s+(\d+)\s+required recurring daily period/i);
          let targetSection = null;
          let targetSubject = null;
          let assignedCount = 0;
          let requiredCount = 0;

          if (match) {
            const secLabel = match[1].trim();
            const subLabel = match[2].trim();
            assignedCount = parseInt(match[3], 10) || 0;
            requiredCount = parseInt(match[4], 10) || 0;

            targetSection = findSectionByLabel(secLabel);
            if (targetSection) {
              const eligibleSubjs = getSubjectsForSection(targetSection, subjects, scheduleType);
              targetSubject = eligibleSubjs.find(
                (s) =>
                  (s.subjectName || "").trim().toLowerCase() === subLabel.toLowerCase() ||
                  (s.subjectCode || "").trim().toLowerCase() === subLabel.toLowerCase() ||
                  (s.name || "").trim().toLowerCase() === subLabel.toLowerCase() ||
                  (s.code || "").trim().toLowerCase() === subLabel.toLowerCase() ||
                  s.id === subLabel
              );
            }
          }

          if (targetSection && targetSubject && assignedCount < requiredCount) {
            const sectionObj = targetSection;
            const subjectObj = targetSubject;
            const sectionId = sectionObj.id;

            // Get all cell keys for this section
            const sectionCellKeys = Object.keys(workingAssignments).filter(
              (ck) => splitCellKey(ck)[0] === sectionId
            );

            // Find which days already have this subject scheduled
            let sectionSubjectTeacherId = null;
            sectionCellKeys.forEach((ck) => {
              const assign = workingDrafts[ck] || workingAssignments[ck];
              if (assign && assign.subjectId === subjectObj.id) {
                if (assign.teacherId) sectionSubjectTeacherId = assign.teacherId;
              }
            });

            const levelConfig = scheduleType === "jhs" ? config?.jhs : config?.shs;
            const activeDaysList = extractDaysFromLevelConfig(levelConfig)?.daySequence || [];
            const totalDaysCount = activeDaysList.length || 5;
            const isDouble = Boolean(subjectObj.isDoublePeriod);
            const maxPerDay = isDouble ? 2 : (requiredCount > totalDaysCount ? Math.ceil(requiredCount / totalDaysCount) : 1);

            // Get valid slots for this section
            const validSlots = slots.filter((slot) => isSlotValidForSection(sectionObj, slot, scheduleType, config));

            // Find empty slots for this section
            const emptySlots = validSlots.filter((slot) => {
              const ck = createCellKey(sectionId, slot.id);
              return !workingAssignments[ck];
            });

            // Filter for empty slots on days that haven't reached maxPerDay for this subject
            const candidateSlots = emptySlots.filter((slot) => {
              const day = slot.day || "Monday";
              const currentDayCount = sectionCellKeys.filter((ck) => {
                const [, sId] = splitCellKey(ck);
                const s = slotsById.get(sId);
                if (s?.day !== day) return false;
                const a = workingDrafts[ck] || workingAssignments[ck];
                return a?.subjectId === subjectObj.id;
              }).length;
              if (currentDayCount >= maxPerDay) return false;
              if (isSubjectRestrictedForSlot(subjectObj, slot, config.constraints, config, scheduleType)) return false;
              return true;
            });

            let placed = false;
            const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);

            // 1. Direct Placement into an empty slot
            for (const slot of candidateSlots) {
              let candidateTeacher = null;
              if (sectionSubjectTeacherId) {
                const t = facultyById.get(sectionSubjectTeacherId);
                if (t && isTeacherEligible({ teacher: t, subject: subjectObj, section: sectionObj, slot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId })) {
                  candidateTeacher = t;
                }
              }

              if (!candidateTeacher) {
                candidateTeacher = activeTeachers.find((t) =>
                  isTeacherEligible({ teacher: t, subject: subjectObj, section: sectionObj, slot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId })
                );
              }

              if (candidateTeacher) {
                const newCellKey = createCellKey(sectionId, slot.id);
                workingDrafts[newCellKey] = { subjectId: subjectObj.id, teacherId: candidateTeacher.id };
                workingAssignments[newCellKey] = {
                  subjectId: subjectObj.id,
                  teacherId: candidateTeacher.id,
                  source: "auto-fix",
                  updatedAt: new Date().toISOString(),
                };
                fixedCount += 1;
                appliedThisPass = true;
                placed = true;
                break;
              }
            }

            // 2. Intra-Section Relocation: Move another flexible subject to an empty slot
            if (!placed && emptySlots.length > 0) {
              const allPlacementRules = getAllPlacementRules(config, scheduleType);
              for (const occupiedKey of sectionCellKeys) {
                const [, occSlotId] = splitCellKey(occupiedKey);
                const occSlot = slotsById.get(occSlotId);
                if (!occSlot) continue;
                const occAssign = workingDrafts[occupiedKey] || workingAssignments[occupiedKey];
                if (!occAssign || occAssign.subjectId === subjectObj.id) continue;

                const occSubject = subjectsById.get(occAssign.subjectId);
                if (!occSubject) continue;

                const rule = findPlacementRuleForSubject(occSubject, allPlacementRules);
                if (rule || (occSubject.preferredDay && occSubject.preferredDay !== "any") || (occSubject.preferredPeriodSlot && occSubject.preferredPeriodSlot !== "any")) {
                  continue;
                }

                if (isSubjectRestrictedForSlot(subjectObj, occSlot, config.constraints, config, scheduleType)) continue;

                const occDay = occSlot.day || "Monday";
                const currentDayCount = sectionCellKeys.filter((ck) => {
                  if (ck === occupiedKey) return false;
                  const [, sId] = splitCellKey(ck);
                  const s = slotsById.get(sId);
                  if (s?.day !== occDay) return false;
                  const a = workingDrafts[ck] || workingAssignments[ck];
                  return a?.subjectId === subjectObj.id;
                }).length;
                if (currentDayCount >= maxPerDay) continue;

                for (const emptySlot of emptySlots) {
                  if (emptySlot.id === occSlot.id) continue;
                  if (isSubjectRestrictedForSlot(occSubject, emptySlot, config.constraints, config, scheduleType)) continue;

                  const emptyDay = emptySlot.day || "Monday";
                  const occClassesPerWeek = parseBoundedNumber(occSubject?.classesPerWeek, 1, 12, 4);
                  const occMaxPerDay = occSubject.isDoublePeriod ? 2 : (occClassesPerWeek > totalDaysCount ? Math.ceil(occClassesPerWeek / totalDaysCount) : 1);
                  const occCountOnEmptyDay = sectionCellKeys.filter((ck) => {
                    if (ck === occupiedKey) return false;
                    const [, sId] = splitCellKey(ck);
                    const s = slotsById.get(sId);
                    if (s?.day !== emptyDay) return false;
                    const a = workingDrafts[ck] || workingAssignments[ck];
                    return a?.subjectId === occSubject.id;
                  }).length;
                  if (occCountOnEmptyDay >= occMaxPerDay) continue;

                  let occTeacher = facultyById.get(occAssign.teacherId);
                  if (!occTeacher || !isTeacherEligible({ teacher: occTeacher, subject: occSubject, section: sectionObj, slot: emptySlot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId })) {
                    occTeacher = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: occSubject, section: sectionObj, slot: emptySlot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId }));
                  }
                  if (!occTeacher) continue;

                  const tempAssignments = { ...workingAssignments };
                  delete tempAssignments[occupiedKey];
                  const tempBusyMap = buildTeacherBusyMap(tempAssignments, sectionsById, slotsById);

                  let targetTeacher = null;
                  if (sectionSubjectTeacherId) {
                    const t = facultyById.get(sectionSubjectTeacherId);
                    if (t && isTeacherEligible({ teacher: t, subject: subjectObj, section: sectionObj, slot: occSlot, constraints: config.constraints, teacherBusyBySlot: tempBusyMap, excludedSectionId: sectionId })) {
                      targetTeacher = t;
                    }
                  }
                  if (!targetTeacher) {
                    targetTeacher = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: subjectObj, section: sectionObj, slot: occSlot, constraints: config.constraints, teacherBusyBySlot: tempBusyMap, excludedSectionId: sectionId }));
                  }
                  if (!targetTeacher) continue;

                  const emptyCellKey = createCellKey(sectionId, emptySlot.id);
                  workingDrafts[emptyCellKey] = { subjectId: occSubject.id, teacherId: occTeacher.id };
                  workingAssignments[emptyCellKey] = { subjectId: occSubject.id, teacherId: occTeacher.id, source: "auto-fix", updatedAt: new Date().toISOString() };

                  workingDrafts[occupiedKey] = { subjectId: subjectObj.id, teacherId: targetTeacher.id };
                  workingAssignments[occupiedKey] = { subjectId: subjectObj.id, teacherId: targetTeacher.id, source: "auto-fix", updatedAt: new Date().toISOString() };

                  fixedCount += 1;
                  appliedThisPass = true;
                  placed = true;
                  break;
                }

                if (placed) break;
              }
            }

            // 3. Excess-quota subject replacement
            if (!placed) {
              const subjectCounts = new Map();
              sectionCellKeys.forEach((ck) => {
                const a = workingDrafts[ck] || workingAssignments[ck];
                if (a?.subjectId) {
                  subjectCounts.set(a.subjectId, (subjectCounts.get(a.subjectId) || 0) + 1);
                }
              });

              for (const [sId, count] of subjectCounts.entries()) {
                const otherSub = subjectsById.get(sId);
                const otherRequired = parseBoundedNumber(otherSub?.classesPerWeek, 1, 12, 4);
                if (count > otherRequired) {
                  const replaceableKeys = sectionCellKeys.filter((ck) => {
                    const a = workingDrafts[ck] || workingAssignments[ck];
                    return a?.subjectId === sId;
                  });

                  for (const repKey of replaceableKeys) {
                    const [, rSlotId] = splitCellKey(repKey);
                    const rSlot = slotsById.get(rSlotId);
                    if (!rSlot) continue;
                    if (isSubjectRestrictedForSlot(subjectObj, rSlot, config.constraints, config, scheduleType)) continue;

                    const rDay = rSlot.day || "Monday";
                    const dayCount = sectionCellKeys.filter((ck) => {
                      if (ck === repKey) return false;
                      const [, s] = splitCellKey(ck);
                      const sl = slotsById.get(s);
                      if (sl?.day !== rDay) return false;
                      const a = workingDrafts[ck] || workingAssignments[ck];
                      return a?.subjectId === subjectObj.id;
                    }).length;
                    if (dayCount >= maxPerDay) continue;

                    const tempBusyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);
                    let repTeacher = null;
                    if (sectionSubjectTeacherId) {
                      const t = facultyById.get(sectionSubjectTeacherId);
                      if (t && isTeacherEligible({ teacher: t, subject: subjectObj, section: sectionObj, slot: rSlot, constraints: config.constraints, teacherBusyBySlot: tempBusyMap, excludedSectionId: sectionId })) {
                        repTeacher = t;
                      }
                    }
                    if (!repTeacher) {
                      repTeacher = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: subjectObj, section: sectionObj, slot: rSlot, constraints: config.constraints, teacherBusyBySlot: tempBusyMap, excludedSectionId: sectionId }));
                    }

                    if (repTeacher) {
                      workingDrafts[repKey] = { subjectId: subjectObj.id, teacherId: repTeacher.id };
                      workingAssignments[repKey] = { subjectId: subjectObj.id, teacherId: repTeacher.id, source: "auto-fix", updatedAt: new Date().toISOString() };
                      fixedCount += 1;
                      appliedThisPass = true;
                      placed = true;
                      break;
                    }
                  }
                  if (placed) break;
                }
              }
            }

            if (appliedThisPass) {
              break;
            }
          }
        }

        if (cellKeys.length === 0) continue;

        // -------------------------------------------------------------
        // Strategy 1: Same-Day Duplicate Subject or Weekly Quota Exceeded
        // -------------------------------------------------------------
        if (
          (message.includes("scheduled") && message.includes("times on")) ||
          message.includes("exceeding required") ||
          message.includes("duplicated in multiple")
        ) {
          let resolvedConflict = false;
          const [firstSectionId] = splitCellKey(cellKeys[0]);
          const sectionObj = sectionsById.get(firstSectionId);

          if (sectionObj && cellKeys.length > 1) {
            // Keep cellKeys[0], try to fix cellKeys[1..N]
            for (let i = 1; i < cellKeys.length; i++) {
              const targetKey = cellKeys[i];
              const [, targetSlotId] = splitCellKey(targetKey);
              const targetSlot = slotsById.get(targetSlotId);
              if (!targetSlot) continue;
              const targetDay = targetSlot.day || "Monday";

              const sectionCellKeys = Object.keys(workingAssignments).filter(
                (ck) => splitCellKey(ck)[0] === sectionObj.id && ck !== targetKey
              );

              // 1. Try Intra-Section Day Swap
              let swapSuccess = false;
              for (const otherKey of sectionCellKeys) {
                const [, otherSlotId] = splitCellKey(otherKey);
                const otherSlot = slotsById.get(otherSlotId);
                if (!otherSlot) continue;
                const otherDay = otherSlot.day || "Monday";
                if (otherDay === targetDay) continue; // Must be on a different day

                const assignA = workingDrafts[targetKey] || workingAssignments[targetKey];
                const assignB = workingDrafts[otherKey] || workingAssignments[otherKey];
                if (!assignA || !assignB) continue;

                const subA = subjectsById.get(assignA.subjectId);
                const subB = subjectsById.get(assignB.subjectId);
                if (!subA || !subB || subA.id === subB.id) continue;

                // Check if subB is already scheduled on targetDay for this section
                const subjectsOnTargetDay = sectionCellKeys
                  .filter((ck) => {
                    const [, sId] = splitCellKey(ck);
                    const s = slotsById.get(sId);
                    return s && (s.day || "Monday") === targetDay;
                  })
                  .map((ck) => (workingDrafts[ck] || workingAssignments[ck])?.subjectId);

                if (subjectsOnTargetDay.includes(subB.id)) continue;

                // Check if subA is already scheduled on otherDay for this section
                const subjectsOnOtherDay = sectionCellKeys
                  .filter((ck) => {
                    const [, sId] = splitCellKey(ck);
                    const s = slotsById.get(sId);
                    return s && (s.day || "Monday") === otherDay && ck !== targetKey;
                  })
                  .map((ck) => (workingDrafts[ck] || workingAssignments[ck])?.subjectId);

                if (subjectsOnOtherDay.includes(subA.id)) continue;

                // Find eligible teachers for swapped slots
                const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);
                let teacherA = facultyById.get(assignA.teacherId);
                if (!teacherA || !isTeacherEligible({ teacher: teacherA, subject: subA, section: sectionObj, slot: otherSlot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id })) {
                  teacherA = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: subA, section: sectionObj, slot: otherSlot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id }));
                }

                let teacherB = facultyById.get(assignB.teacherId);
                if (!teacherB || !isTeacherEligible({ teacher: teacherB, subject: subB, section: sectionObj, slot: targetSlot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id })) {
                  teacherB = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: subB, section: sectionObj, slot: targetSlot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id }));
                }

                if (teacherA && teacherB) {
                  workingDrafts[targetKey] = { subjectId: subB.id, teacherId: teacherB.id };
                  workingAssignments[targetKey] = { subjectId: subB.id, teacherId: teacherB.id, source: "auto-fix", updatedAt: new Date().toISOString() };
                  workingDrafts[otherKey] = { subjectId: subA.id, teacherId: teacherA.id };
                  workingAssignments[otherKey] = { subjectId: subA.id, teacherId: teacherA.id, source: "auto-fix", updatedAt: new Date().toISOString() };
                  swapSuccess = true;
                  break;
                }
              }

              if (swapSuccess) {
                resolvedConflict = true;
                break;
              }

              // 2. Try Reassigning to Under-scheduled / Missing Subject
              const offeredSubjects = getSubjectsForSection(sectionObj, subjects, scheduleType);
              const subjectCounts = new Map();
              sectionCellKeys.concat([targetKey]).forEach((ck) => {
                const sId = (workingDrafts[ck] || workingAssignments[ck])?.subjectId;
                if (sId) subjectCounts.set(sId, (subjectCounts.get(sId) || 0) + 1);
              });

              const underQuotaSubjects = offeredSubjects.filter((sb) => {
                const count = subjectCounts.get(sb.id) || 0;
                const req = parseBoundedNumber(sb.classesPerWeek, 1, 12, 4);
                return count < req;
              });

              const candidateReplacements = underQuotaSubjects.length > 0 ? underQuotaSubjects : offeredSubjects.filter((sb) => !subjectCounts.has(sb.id));

              for (const replacementSubject of candidateReplacements) {
                const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);
                const replacementTeacher = activeTeachers.find((teacher) =>
                  isTeacherEligible({
                    teacher,
                    subject: replacementSubject,
                    section: sectionObj,
                    slot: targetSlot,
                    constraints: config.constraints,
                    teacherBusyBySlot: busyMap,
                    excludedSectionId: sectionObj.id,
                  })
                );

                if (replacementTeacher) {
                  workingDrafts[targetKey] = { subjectId: replacementSubject.id, teacherId: replacementTeacher.id };
                  workingAssignments[targetKey] = {
                    subjectId: replacementSubject.id,
                    teacherId: replacementTeacher.id,
                    source: "auto-fix",
                    updatedAt: new Date().toISOString(),
                  };
                  resolvedConflict = true;
                  break;
                }
              }

              if (resolvedConflict) break;
            }
          }

          if (resolvedConflict) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        // -------------------------------------------------------------
        // Strategy 2: Teacher Double-Booking / Multiple-Booking
        // -------------------------------------------------------------
        if (message.includes("booked at") || message.includes("double-booked") || message.includes("multiple-booked")) {
          let changed = false;
          for (let i = 1; i < cellKeys.length; i++) {
            const cellKey = cellKeys[i];
            const [sectionId, slotId] = splitCellKey(cellKey);
            const sectionObj = sectionsById.get(sectionId);
            const slot = slotsById.get(slotId);
            const currentAssignment = workingDrafts[cellKey] || workingAssignments[cellKey];
            const subjectObj = currentAssignment?.subjectId ? subjectsById.get(currentAssignment.subjectId) : null;

            if (sectionObj && slot && subjectObj) {
              const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);
              const replacementTeacher = activeTeachers.find(
                (teacher) =>
                  teacher.id !== currentAssignment?.teacherId &&
                  isTeacherEligible({
                    teacher,
                    subject: subjectObj,
                    section: sectionObj,
                    slot,
                    constraints: config.constraints,
                    teacherBusyBySlot: busyMap,
                    excludedSectionId: sectionObj.id,
                  })
              );

              if (replacementTeacher) {
                workingDrafts[cellKey] = { subjectId: subjectObj.id, teacherId: replacementTeacher.id };
                workingAssignments[cellKey] = {
                  subjectId: subjectObj.id,
                  teacherId: replacementTeacher.id,
                  source: "auto-fix",
                  updatedAt: new Date().toISOString(),
                };
                changed = true;
              }
            }
          }
          if (changed) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        // -------------------------------------------------------------
        // Strategy 3: Teacher Restricted / Unavailable Period or Expertise / Grade Mismatch
        // -------------------------------------------------------------
        if (
          message.includes("restricted") ||
          message.includes("unavailable") ||
          message.includes("expertise") ||
          message.includes("match Grade")
        ) {
          let changed = false;
          for (const cellKey of cellKeys) {
            const [sectionId, slotId] = splitCellKey(cellKey);
            const sectionObj = sectionsById.get(sectionId);
            const slot = slotsById.get(slotId);
            const currentAssignment = workingDrafts[cellKey] || workingAssignments[cellKey];
            const subjectObj = currentAssignment?.subjectId ? subjectsById.get(currentAssignment.subjectId) : null;

            if (sectionObj && slot && subjectObj) {
              const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);
              const replacementTeacher = activeTeachers.find(
                (teacher) =>
                  teacher.id !== currentAssignment?.teacherId &&
                  isTeacherEligible({
                    teacher,
                    subject: subjectObj,
                    section: sectionObj,
                    slot,
                    constraints: config.constraints,
                    teacherBusyBySlot: busyMap,
                    excludedSectionId: sectionObj.id,
                  })
              );

              if (replacementTeacher) {
                workingDrafts[cellKey] = { subjectId: subjectObj.id, teacherId: replacementTeacher.id };
                workingAssignments[cellKey] = {
                  subjectId: subjectObj.id,
                  teacherId: replacementTeacher.id,
                  source: "auto-fix",
                  updatedAt: new Date().toISOString(),
                };
                changed = true;
              }
            }
          }
          if (changed) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        // -------------------------------------------------------------
        // Strategy 4: Specialized Subject Limit Exceeded
        // -------------------------------------------------------------
        if (message.includes("specialized subject assigned")) {
          let changed = false;
          const [firstSectionId] = splitCellKey(cellKeys[0]);
          const sectionObj = sectionsById.get(firstSectionId);

          if (sectionObj && cellKeys.length > 1) {
            const offeredSubjects = getSubjectsForSection(sectionObj, subjects, scheduleType);
            const coreSubjects = offeredSubjects.filter((s) => String(s.subjectType).toLowerCase() !== "specialized");

            for (let i = 1; i < cellKeys.length; i++) {
              const cellKey = cellKeys[i];
              const [, slotId] = splitCellKey(cellKey);
              const slot = slotsById.get(slotId);

              for (const replacementSubject of coreSubjects) {
                const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);
                const replacementTeacher = activeTeachers.find((teacher) =>
                  isTeacherEligible({
                    teacher,
                    subject: replacementSubject,
                    section: sectionObj,
                    slot,
                    constraints: config.constraints,
                    teacherBusyBySlot: busyMap,
                    excludedSectionId: sectionObj.id,
                  })
                );

                if (replacementTeacher) {
                  workingDrafts[cellKey] = { subjectId: replacementSubject.id, teacherId: replacementTeacher.id };
                  workingAssignments[cellKey] = {
                    subjectId: replacementSubject.id,
                    teacherId: replacementTeacher.id,
                    source: "auto-fix",
                    updatedAt: new Date().toISOString(),
                  };
                  changed = true;
                  break;
                }
              }
              if (changed) break;
            }
          }
          if (changed) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        // -------------------------------------------------------------
        // Strategy 5: Generic Intra-Section Conflict-Minimizing Swap
        // -------------------------------------------------------------
        for (const cellKey of cellKeys) {
          const [sectionId, slotId] = splitCellKey(cellKey);
          const sectionObj = sectionsById.get(sectionId);
          const slot = slotsById.get(slotId);
          const currentAssignment = workingDrafts[cellKey] || workingAssignments[cellKey];

          if (sectionObj && slot && currentAssignment) {
            const otherCellKeys = Object.keys(workingAssignments).filter(
              (ck) => splitCellKey(ck)[0] === sectionObj.id && ck !== cellKey
            );

            let swapDone = false;
            for (const otherKey of otherCellKeys) {
              const [, otherSlotId] = splitCellKey(otherKey);
              const otherSlot = slotsById.get(otherSlotId);
              const otherAssignment = workingDrafts[otherKey] || workingAssignments[otherKey];

              if (!otherSlot || !otherAssignment) continue;

              const subjectA = subjectsById.get(currentAssignment.subjectId);
              const subjectB = subjectsById.get(otherAssignment.subjectId);
              if (!subjectA || !subjectB) continue;

              const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);
              let teacherA = facultyById.get(currentAssignment.teacherId);
              if (!teacherA || !isTeacherEligible({ teacher: teacherA, subject: subjectA, section: sectionObj, slot: otherSlot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id })) {
                teacherA = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: subjectA, section: sectionObj, slot: otherSlot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id }));
              }

              let teacherB = facultyById.get(otherAssignment.teacherId);
              if (!teacherB || !isTeacherEligible({ teacher: teacherB, subject: subjectB, section: sectionObj, slot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id })) {
                teacherB = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: subjectB, section: sectionObj, slot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id }));
              }

              if (teacherA && teacherB) {
                const testAssignments = {
                  ...workingAssignments,
                  [cellKey]: { subjectId: subjectB.id, teacherId: teacherB.id, source: "auto-fix", updatedAt: new Date().toISOString() },
                  [otherKey]: { subjectId: subjectA.id, teacherId: teacherA.id, source: "auto-fix", updatedAt: new Date().toISOString() },
                };

                const testEval = getEvaluation(testAssignments);
                if (testEval.conflicts.length < evaluation.conflicts.length) {
                  workingDrafts[cellKey] = { subjectId: subjectB.id, teacherId: teacherB.id };
                  workingAssignments[cellKey] = testAssignments[cellKey];
                  workingDrafts[otherKey] = { subjectId: subjectA.id, teacherId: teacherA.id };
                  workingAssignments[otherKey] = testAssignments[otherKey];
                  swapDone = true;
                  break;
                }
              }
            }

            if (swapDone) {
              fixedCount += 1;
              appliedThisPass = true;
              break;
            }
          }
        }

        if (appliedThisPass) break;

        // -------------------------------------------------------------
        // Strategy 6: Duplicate Subject Daily Session Resolution (max 1 per day)
        // -------------------------------------------------------------
        for (const cellKey of cellKeys) {
          const [sectionId, slotId] = splitCellKey(cellKey);
          const sectionObj = sectionsById.get(sectionId);
          const slot = slotsById.get(slotId);
          const currentAssignment = workingDrafts[cellKey] || workingAssignments[cellKey];
          if (!sectionObj || !slot || !currentAssignment) continue;

          const subject = subjectsById.get(currentAssignment.subjectId);
          if (!subject) continue;

          const sectionSlots = slots.filter((s) => isSlotValidForSection(sectionObj, s, scheduleType, config));
          const sameDayCells = sectionSlots
            .filter((s) => s.day === slot.day)
            .map((s) => createCellKey(sectionObj.id, s.id));

          const sameDaySubjectCount = sameDayCells.filter((ck) => {
            const asgn = workingAssignments[ck];
            return asgn && asgn.subjectId === subject.id;
          }).length;

          if (sameDaySubjectCount <= 1) continue; // Not a duplicate session on this day

          const otherDaySlots = sectionSlots.filter((s) => s.day !== slot.day);
          let fixApplied = false;

          for (const targetSlot of otherDaySlots) {
            const targetCellKey = createCellKey(sectionObj.id, targetSlot.id);
            const targetAssignment = workingAssignments[targetCellKey];

            const targetDayCells = sectionSlots.filter((s) => s.day === targetSlot.day).map((s) => createCellKey(sectionObj.id, s.id));
            const subjectOnTargetDay = targetDayCells.some((ck) => workingAssignments[ck]?.subjectId === subject.id);
            if (subjectOnTargetDay) continue;

            const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);

            if (!targetAssignment) {
              let teacher = facultyById.get(currentAssignment.teacherId);
              if (!teacher || !isTeacherEligible({ teacher, subject, section: sectionObj, slot: targetSlot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id })) {
                teacher = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject, section: sectionObj, slot: targetSlot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id }));
              }

              if (teacher) {
                const testAssignments = { ...workingAssignments };
                delete testAssignments[cellKey];
                testAssignments[targetCellKey] = { subjectId: subject.id, teacherId: teacher.id, source: "auto-fix", updatedAt: new Date().toISOString() };

                const testEval = getEvaluation(testAssignments);
                if (testEval.conflicts.length < evaluation.conflicts.length) {
                  delete workingDrafts[cellKey];
                  delete workingAssignments[cellKey];
                  workingDrafts[targetCellKey] = { subjectId: subject.id, teacherId: teacher.id };
                  workingAssignments[targetCellKey] = testAssignments[targetCellKey];
                  fixApplied = true;
                  break;
                }
              }
            } else {
              const targetSubject = subjectsById.get(targetAssignment.subjectId);
              if (!targetSubject) continue;

              const subjectBOnCurrentDay = sameDayCells.some((ck) => ck !== cellKey && workingAssignments[ck]?.subjectId === targetSubject.id);
              if (subjectBOnCurrentDay) continue;

              let teacherA = facultyById.get(currentAssignment.teacherId);
              if (!teacherA || !isTeacherEligible({ teacher: teacherA, subject, section: sectionObj, slot: targetSlot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id })) {
                teacherA = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject, section: sectionObj, slot: targetSlot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id }));
              }

              let teacherB = facultyById.get(targetAssignment.teacherId);
              if (!teacherB || !isTeacherEligible({ teacher: teacherB, subject: targetSubject, section: sectionObj, slot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id })) {
                teacherB = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: targetSubject, section: sectionObj, slot, constraints: config.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id }));
              }

              if (teacherA && teacherB) {
                const testAssignments = {
                  ...workingAssignments,
                  [cellKey]: { subjectId: targetSubject.id, teacherId: teacherB.id, source: "auto-fix", updatedAt: new Date().toISOString() },
                  [targetCellKey]: { subjectId: subject.id, teacherId: teacherA.id, source: "auto-fix", updatedAt: new Date().toISOString() },
                };

                const testEval = getEvaluation(testAssignments);
                if (testEval.conflicts.length < evaluation.conflicts.length) {
                  workingDrafts[cellKey] = { subjectId: targetSubject.id, teacherId: teacherB.id };
                  workingAssignments[cellKey] = testAssignments[cellKey];
                  workingDrafts[targetCellKey] = { subjectId: subject.id, teacherId: teacherA.id };
                  workingAssignments[targetCellKey] = testAssignments[targetCellKey];
                  fixApplied = true;
                  break;
                }
              }
            }
          }

          if (fixApplied) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        if (appliedThisPass) break;
      }
    }

    const finalEvaluation = evaluateSchedule({
      assignments: workingAssignments,
      sections,
      slots,
      subjects,
      teachers: activeTeachers,
      scheduleType,
      config,
    });

    setCellEditorDrafts(workingDrafts);
    setSchedule((current) => ({
      ...current,
      assignments: workingAssignments,
      conflicts: finalEvaluation.conflicts,
      conflictDetails: finalEvaluation.conflictDetails,
      teacherLoadPercent: finalEvaluation.teacherLoadPercent,
      updatedAt: new Date().toISOString(),
    }));

    if (finalEvaluation.conflicts.length > 0) {
      const underScheduledConflicts = finalEvaluation.conflicts.filter((c) =>
        c.includes("required recurring daily period")
      );

      let capacityIssue = null;
      for (const sec of sections) {
        const secSlots = slots.filter((s) => isSlotValidForSection(sec, s, scheduleType, config));
        const secSubjs = getSubjectsForSection(sec, subjects, scheduleType);
        const totalReq = secSubjs.reduce(
          (sum, sub) => sum + parseBoundedNumber(sub?.classesPerWeek, 1, 12, 4),
          0
        );
        if (totalReq > secSlots.length) {
          const deficit = totalReq - secSlots.length;
          const secName = formatConflictSectionName(sec);
          capacityIssue = { secName, totalReq, slotCount: secSlots.length, deficit };
          break;
        }
      }

      if (underScheduledConflicts.length > 0 && capacityIssue) {
        setActiveDrawerTab("conflicts");
        return;
      }

      if (fixedCount > 0) {
        showNotice(`Auto-fix applied ${fixedCount} fix(es). Remaining conflicts: ${finalEvaluation.conflicts.length}.`, "success");
        return;
      }

      showNotice(
        `No further auto-fixes available. Remaining ${finalEvaluation.conflicts.length} conflict(s) require adding faculty or adjusting period restrictions.`,
        "info"
      );
      return;
    }

    showNotice("No conflicts found.", "success");
  };

  const handleSaveDraft = () => {
    if (!schedule) {
      showNotice("Generate or load a schedule first.", "error");
      return;
    }

    const now = new Date().toISOString();
    const existing = drafts.find((draft) => draft.id === schedule.id);
    const configSnapshot = JSON.parse(JSON.stringify(schedule?.config || config || activeConfig));

    // Merge any manual cell draft edits into assignments
    const mergedAssignments = { ...(schedule?.assignments || {}) };
    Object.entries(cellEditorDrafts || {}).forEach(([cellKey, draft]) => {
      if (draft && draft.subjectId && draft.teacherId) {
        mergedAssignments[cellKey] = {
          subjectId: draft.subjectId,
          teacherId: draft.teacherId,
          source: "manual",
          updatedAt: now,
        };
      }
    });

    const nextDraft = {
      id: existing?.id || schedule.id || `draft-${Date.now()}`,
      scheduleType,
      name: `${getScheduleTypeLabel(scheduleType)} — ${formatDateTime(now)}`,
      updatedAt: now,
      schedule: {
        ...schedule,
        assignments: mergedAssignments,
        sections: sections,
        slots: slots,
        subjects: subjects,
        teachers: activeTeachers,
        config: configSnapshot,
        id: existing?.id || schedule.id || `draft-${Date.now()}`,
        updatedAt: now,
        status: "draft",
      },
      config: configSnapshot,
    };

    const nextDrafts = upsertDraft(drafts, nextDraft);
    setDrafts(nextDrafts);
    saveJson(DRAFTS_STORAGE_KEY, nextDrafts);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("turotugma:schedule-updated", { detail: { type: "draft", id: nextDraft.id } }));
    }

    setSchedule(nextDraft.schedule);
    showNotice("Draft saved.", "success");
  };

  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null });

  const handlePublish = () => {
    if (readOnly) return;


    let message = '';
    let needsConfirm = false;
    const mergedAssignments = { ...(schedule?.assignments || {}) };
    Object.entries(cellEditorDrafts || {}).forEach(([cellKey, draft]) => {
      if (draft && draft.subjectId && draft.teacherId) {
        mergedAssignments[cellKey] = {
          subjectId: draft.subjectId,
          teacherId: draft.teacherId,
          source: "manual",
          updatedAt: new Date().toISOString(),
        };
      }
    });

    const publishEvaluation = schedule
      ? evaluateSchedule({
        assignments: mergedAssignments,
        sections,
        slots,
        subjects,
        teachers: activeTeachers,
        scheduleType,
        config,
      })
      : { conflicts: [] };
    const totalConflicts = (schedule?.conflicts?.length || 0) + (publishEvaluation.conflicts?.length || 0);
    const invalidCells = assignmentValidationSummary.invalidAssigned;
    const totalAssigned = assignmentValidationSummary.totalAssigned;

    if (!schedule) {
      message = 'No schedule is loaded or generated. Do you want to publish anyway?';
      needsConfirm = true;
    } else if (totalAssigned === 0) {
      // Block publishing empty schedule
      setNotice({ text: 'Cannot publish an empty schedule. Please assign at least one subject/teacher.', type: 'error' });
      return;
    } else if (totalAssigned < assignmentValidationSummary.totalRequired) {
      message = `Warning: Only ${totalAssigned} out of ${assignmentValidationSummary.totalRequired} required assignments are filled. Do you want to publish anyway?`;
      needsConfirm = true;
    } else if (totalConflicts > 0 && invalidCells > 0) {
      message = `There are ${totalConflicts} conflict(s) and ${invalidCells} invalid cell(s). Do you want to publish anyway?`;
      needsConfirm = true;
    } else if (totalConflicts > 0) {
      message = `There are ${totalConflicts} conflict(s). Do you want to publish anyway?`;
      needsConfirm = true;
    } else if (invalidCells > 0) {
      message = `There are ${invalidCells} invalid cell(s). Do you want to publish anyway?`;
      needsConfirm = true;
    }

    if (needsConfirm) {
      setConfirmModal({
        open: true,
        message,
        onConfirm: () => {
          setConfirmModal({ open: false, message: '', onConfirm: null });
          // Only update conflicts after confirmation
          setSchedule((current) =>
            current
              ? {
                ...current,
                assignments: mergedAssignments,
                conflicts: publishEvaluation.conflicts,
                conflictDetails: publishEvaluation.conflictDetails,
                teacherLoadPercent: publishEvaluation.teacherLoadPercent,
                updatedAt: new Date().toISOString(),
              }
              : current
          );
          doPublish();
        },
        onCancel: () => setConfirmModal({ open: false, message: '', onConfirm: null }),
      });
      return;
    }
    // If no confirmation needed, update conflicts immediately
    setSchedule((current) =>
      current
        ? {
          ...current,
          assignments: mergedAssignments,
          conflicts: publishEvaluation.conflicts,
          conflictDetails: publishEvaluation.conflictDetails,
          teacherLoadPercent: publishEvaluation.teacherLoadPercent,
          updatedAt: new Date().toISOString(),
        }
        : current
    );
    doPublish();
  };

  function doPublish() {
    const now = new Date().toISOString();
    const mergedAssignments = { ...(schedule?.assignments || {}) };
    Object.entries(cellEditorDrafts || {}).forEach(([cellKey, draft]) => {
      if (draft && draft.subjectId && draft.teacherId) {
        mergedAssignments[cellKey] = {
          subjectId: draft.subjectId,
          teacherId: draft.teacherId,
          source: "manual",
          updatedAt: now,
        };
      }
    });

    const publishEvaluation = schedule
      ? evaluateSchedule({
        assignments: mergedAssignments,
        sections,
        slots,
        subjects,
        teachers: activeTeachers,
        scheduleType,
        config,
      })
      : { conflicts: [], conflictDetails: [], teacherLoadPercent: {} };

    const configSnapshot = JSON.parse(JSON.stringify(schedule?.config || config || activeConfig));
    const publishedSchedule = {
      ...schedule,
      assignments: mergedAssignments,
      sections: sections,
      slots: slots,
      subjects: subjects,
      teachers: activeTeachers,
      config: configSnapshot,
      status: "published",
      publishedAt: now,
      conflicts: publishEvaluation.conflicts,
      conflictDetails: publishEvaluation.conflictDetails,
      teacherLoadPercent: publishEvaluation.teacherLoadPercent,
      updatedAt: now,
    };

    const nextPublished = {
      ...publishedSchedules,
      [scheduleType]: publishedSchedule,
    };

    setPublishedSchedules(nextPublished);
    saveJson(PUBLISHED_STORAGE_KEY, nextPublished);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("turotugma:schedule-updated", { detail: { type: "published", scheduleType } }));
    }

    setSchedule(publishedSchedule);
    persistFacultyLoadPercent(schedule?.teacherLoadPercent || {});
    setDataRefreshToken((current) => current + 1);

    showNotice("Schedule published.", "success");
  }

  const handleLoadDraft = (draftId) => {
    const selectedDraft = drafts.find((draft) => draft.id === draftId) || draftsForCurrentSchedule.find((draft) => draft.id === draftId);
    if (!selectedDraft) {
      showNotice("Draft not found.", "error");
      return;
    }

    if (selectedDraft.scheduleType && selectedDraft.scheduleType !== scheduleType) {
      setScheduleType(selectedDraft.scheduleType);
    }

    const loadedConfig = selectedDraft.config || selectedDraft.schedule?.config || activeConfig;
    setSchedule({
      ...selectedDraft.schedule,
      config: loadedConfig,
      status: "draft",
    });
    setShowDraftsPanel(false);
    setPreviewDraftModal(null);
    setCellEditorDrafts({});
    setHoveredCellKey("");
    showNotice("Draft loaded successfully.", "success");
  };

  const handleDeleteDraft = (draftId) => {
    const targetDraft = drafts.find((d) => d.id === draftId);
    const draftName = targetDraft?.name || "this draft";
    setConfirmModal({
      open: true,
      title: "Delete Draft",
      message: `Are you sure you want to delete "${draftName}"? This action cannot be undone.`,
      confirmLabel: "Delete Draft",
      onConfirm: () => {
        const nextDrafts = drafts.filter((draft) => draft.id !== draftId);
        setDrafts(nextDrafts);
        saveJson(DRAFTS_STORAGE_KEY, nextDrafts);

        if (schedule?.id === draftId) {
          setSchedule(null);
          setCellEditorDrafts({});
          setHoveredCellKey("");
        }

        setConfirmModal({ open: false, message: '', onConfirm: null });
        showNotice("Draft deleted.", "success");
      },
      onCancel: () => setConfirmModal({ open: false, message: '', onConfirm: null }),
    });
  };

  const getCellDraft = (sectionId, slotId) => {
    const cellKey = createCellKey(sectionId, slotId);
    const draft = cellEditorDrafts[cellKey];
    const assignment = schedule?.assignments?.[cellKey];

    return {
      cellKey,
      subjectId: draft?.subjectId ?? assignment?.subjectId ?? "",
      teacherId: draft?.teacherId ?? assignment?.teacherId ?? "",
    };
  };

  const applyCellAssignment = ({ section, slot, subjectId, teacherId }) => {
    const now = new Date().toISOString();
    const baseSchedule = schedule || {
      id: `draft-${Date.now()}`,
      scheduleType,
      createdAt: now,
      updatedAt: now,
      assignments: {},
      conflicts: [],
      conflictDetails: [],
      teacherLoadPercent: {},
      status: "draft",
    };

    if (!isSlotValidForSection(section, slot, scheduleType, config)) {
      showNotice("Selected period is not allowed for this section.", "error");
      return;
    }

    const eligibleSubjects = getSubjectsForSection(section, subjects, scheduleType);
    const selectedSubject = eligibleSubjects.find((item) => item.id === subjectId);
    if (!selectedSubject) {
      showNotice("Selected subject is not eligible for this section.", "error");
      return;
    }

    const teacher = facultyById.get(teacherId);
    if (!teacher) {
      showNotice("Selected teacher not found.", "error");
      return;
    }

    const busyMap = buildTeacherBusyMap(baseSchedule.assignments || {}, sectionsById, slotsById);
    const eligible = isTeacherEligible({
      teacher,
      subject: selectedSubject,
      section,
      slot,
      constraints: config.constraints,
      teacherBusyBySlot: busyMap,
      excludedSectionId: section.id,
      ignoreDoubleBooking: true,
    });

    if (!eligible) {
      showNotice("Teacher is not eligible for this assignment.", "error");
      return;
    }

    const cellKey = createCellKey(section.id, slot.id);
    const nextAssignments = {
      ...(baseSchedule.assignments || {}),
      [cellKey]: {
        subjectId: selectedSubject.id,
        teacherId: teacher.id,
        source: "manual",
        updatedAt: now,
      },
    };

    const evaluation = evaluateSchedule({
      assignments: nextAssignments,
      sections,
      slots,
      subjects,
      teachers: activeTeachers,
      scheduleType,
      config,
    });

    setSchedule({
      ...baseSchedule,
      assignments: nextAssignments,
      conflicts: evaluation.conflicts,
      conflictDetails: evaluation.conflictDetails,
      teacherLoadPercent: evaluation.teacherLoadPercent,
      updatedAt: now,
    });

    setCellEditorDrafts((prev) => ({
      ...prev,
      [cellKey]: { subjectId, teacherId },
    }));

    showNotice("Assignment saved.", "success");
  };

  const removeAssignmentFromCell = (section, slot, showMessage = true, nextDraft = null) => {
    if (!schedule) {
      return;
    }

    const cellKey = createCellKey(section.id, slot.id);
    if (!schedule.assignments?.[cellKey]) {
      if (showMessage) {
        showNotice("No assignment found in selected cell.", "error");
      }
      return;
    }

    const nextAssignments = { ...schedule.assignments };
    delete nextAssignments[cellKey];

    const evaluation = evaluateSchedule({
      assignments: nextAssignments,
      sections,
      slots,
      subjects,
      teachers: activeTeachers,
      scheduleType,
      config,
    });

    setSchedule((current) => ({
      ...current,
      assignments: nextAssignments,
      conflicts: evaluation.conflicts,
      conflictDetails: evaluation.conflictDetails,
      teacherLoadPercent: evaluation.teacherLoadPercent,
      updatedAt: new Date().toISOString(),
    }));

    setCellEditorDrafts((prev) => ({
      ...prev,
      [cellKey]: nextDraft || { subjectId: "", teacherId: "" },
    }));

    if (showMessage) {
      showNotice("Assignment removed.", "success");
    }
  };

  const handleCellSubjectChange = (section, slot, subjectId) => {
    if (subjectId) {
      const sectionSubjects = getSubjectsForSection(section, subjects, scheduleType);
      const selectedSubject = sectionSubjects.find((item) => item.id === subjectId);

      if (!selectedSubject || isSubjectRestrictedForSlot(selectedSubject, slot, config.constraints, config)) {
        showNotice("Selected subject is restricted for this period.", "error");
        return;
      }
    }

    const { cellKey, teacherId: currentTeacherId } = getCellDraft(section.id, slot.id);
    setActiveCellKey(cellKey);

    const hasExistingAssignment = !!schedule?.assignments?.[cellKey];
    const existingAssignment = schedule?.assignments?.[cellKey];

    // Try to auto-retain teacher if candidate teacher is eligible for the new subject
    let nextTeacherId = "";
    if (subjectId && (existingAssignment?.teacherId || currentTeacherId)) {
      const candidateTeacherId = existingAssignment?.teacherId || currentTeacherId;
      const candidateTeacher = activeTeachers.find((t) => t.id === candidateTeacherId);
      const newSubjectObj = subjectsById.get(subjectId);
      if (candidateTeacher && newSubjectObj) {
        const eligible = isTeacherEligible({
          teacher: candidateTeacher,
          subject: newSubjectObj,
          section,
          slot,
          constraints: config.constraints,
          teacherBusyBySlot,
          excludedSectionId: section.id,
          ignoreDoubleBooking: true,
        });
        if (eligible) {
          nextTeacherId = candidateTeacherId;
        }
      }
    }

    if (subjectId && nextTeacherId) {
      setCellEditorDrafts((prev) => ({
        ...prev,
        [cellKey]: { subjectId, teacherId: nextTeacherId },
      }));
      applyCellAssignment({ section, slot, subjectId, teacherId: nextTeacherId });
      return;
    }

    setCellEditorDrafts((prev) => ({
      ...prev,
      [cellKey]: { subjectId, teacherId: "" },
    }));

    if (hasExistingAssignment) {
      removeAssignmentFromCell(section, slot, false, { subjectId, teacherId: "" });
      return;
    }

    if (!subjectId) {
      removeAssignmentFromCell(section, slot, false);
    }
  };

  const handleCellTeacherChange = (section, slot, teacherId) => {
    const { cellKey, subjectId } = getCellDraft(section.id, slot.id);
    setActiveCellKey(cellKey);

    if (!subjectId) {
      showNotice("Select subject first.", "error");
      return;
    }

    if (!teacherId) {
      removeAssignmentFromCell(section, slot, false, { subjectId, teacherId: "" });
      return;
    }

    const selectedSubject = getSubjectsForSection(section, subjects, scheduleType).find((item) => item.id === subjectId);
    const selectedTeacher = activeTeachers.find((item) => item.id === teacherId);

    if (!selectedSubject || !selectedTeacher) {
      showNotice("Selected teacher is not valid for this assignment.", "error");
      return;
    }

    const eligible = isTeacherEligible({
      teacher: selectedTeacher,
      subject: selectedSubject,
      section,
      slot,
      constraints: config.constraints,
      teacherBusyBySlot,
      excludedSectionId: section.id,
      ignoreDoubleBooking: true,
    });

    if (!eligible) {
      showNotice("Selected teacher is restricted for this period.", "error");
      return;
    }

    setCellEditorDrafts((prev) => ({
      ...prev,
      [cellKey]: { subjectId, teacherId },
    }));

    applyCellAssignment({ section, slot, subjectId, teacherId });
  };

  const metrics = [
    { label: "Active Teachers", value: String(activeTeachersForSchedule.length) },
    { label: "Total Sections", value: String(sections.length) },
    { label: "Conflicts", value: String(conflictCount) },
    { label: "Schedule Status", value: scheduleStatusLabel },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {!hideControls && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>{isGeneratorMode ? "Schedule Generator" : "Schedule Maker"}</h1>
            <p style={{ margin: "8px 0 0", color: "#5b6787", fontSize: 14, maxWidth: 920 }}>
              {isGeneratorMode
                ? "Generate conflict-aware timetables for JHS and SHS from subject workload, school time frame, and breaks."
                : "Generate conflict-aware timetables for JHS and SHS, configure period structures and breaks, assign directly in the grid, and manage draft or published schedules."}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexWrap: "wrap", width: "100%", justifyContent: "flex-start" }}>
            <div style={{ display: "grid", gap: 8, minWidth: 320, flex: "1 1 320px", maxWidth: 400 }}>
              <label style={{ fontSize: 12, color: "#5f6b90", fontWeight: 700 }}>Schedule Type</label>
              <select
                value={scheduleType}
                onChange={(event) => setScheduleType(event.target.value)}
                style={selectStyle(false)}
                disabled={readOnly}
              >
                {filteredScheduleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={handleGenerateSchedule} style={{ ...primaryActionStyle(), width: 120, textAlign: "center" }} disabled={readOnly}>
                <ActionButtonLabel icon={<GenerateIcon />}>
                  {schedule ? "Re-Generate" : "Generate"}
                </ActionButtonLabel>
              </button>
              <button type="button" onClick={handleSaveDraft} style={{ ...secondaryActionStyle(), width: 120, textAlign: "center" }} disabled={readOnly}>
                <ActionButtonLabel icon={<SaveIcon />}>Save</ActionButtonLabel>
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawerTab((prev) => (prev === "drafts" ? null : "drafts"))}
                style={{
                  ...secondaryActionStyle(),
                  width: 120,
                  textAlign: "center",
                  background: activeDrawerTab === "drafts" ? "#e0e7ff" : "#f8fafc",
                  borderColor: activeDrawerTab === "drafts" ? "#818cf8" : "#cbd5e1",
                  color: activeDrawerTab === "drafts" ? "#3730a3" : "#475569",
                  fontWeight: 700,
                }}
                disabled={readOnly}
              >
                <ActionButtonLabel icon={<DraftsIcon />}>Drafts ({draftsForCurrentSchedule.length})</ActionButtonLabel>
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawerTab((prev) => (prev === "conflicts" ? null : "conflicts"))}
                disabled={readOnly}
                style={{
                  ...secondaryActionStyle(),
                  background: activeDrawerTab === "conflicts"
                    ? (conflictCount > 0 ? "#ffe4e6" : "#e0e7ff")
                    : conflictCount > 0 ? "#fff1f2" : "#f8fafc",
                  border: activeDrawerTab === "conflicts"
                    ? (conflictCount > 0 ? "1px solid #f43f5e" : "1px solid #818cf8")
                    : conflictCount > 0 ? "1px solid #fecdd3" : "1px solid #cbd5e1",
                  color: activeDrawerTab === "conflicts"
                    ? (conflictCount > 0 ? "#9f1239" : "#3730a3")
                    : conflictCount > 0 ? "#be123c" : "#475569",
                  fontWeight: 700,
                  width: 130,
                  textAlign: "center",
                }}
              >
                <ActionButtonLabel icon={<WarningIcon />}>
                  Conflicts ({conflictCount})
                </ActionButtonLabel>
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawerTab((prev) => (prev === "restrictions" ? null : "restrictions"))}
                disabled={readOnly}
                style={{
                  ...secondaryActionStyle(),
                  background: activeDrawerTab === "restrictions" ? "#dbeafe" : "#eff6ff",
                  border: activeDrawerTab === "restrictions" ? "1px solid #3b82f6" : "1px solid #bfdbfe",
                  color: "#1e40af",
                  fontWeight: 700,
                  padding: "8px 14px",
                  cursor: readOnly ? "not-allowed" : "pointer",
                }}
              >
                Period Restrictions ({(effectiveTeacherRestrictions.length + subjectRestrictionsForDisplay.length)})
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={readOnly}
                title={readOnly ? "Read-only mode" : "Publish schedule"}
                style={{
                  ...secondaryActionStyle(),
                  width: 120,
                  textAlign: "center",
                  opacity: readOnly ? 0.55 : 1,
                  cursor: readOnly ? "not-allowed" : "pointer",
                }}
              >
                <ActionButtonLabel icon={<PublishIcon />}>Publish</ActionButtonLabel>
              </button>
              <ConfirmationModal
                open={confirmModal.open}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={confirmModal.onCancel}
                title={confirmModal.title || "Publish Confirmation"}
                confirmLabel={confirmModal.confirmLabel || "Publish Anyway"}
              />
              <button
                type="button"
                onClick={() => {
                  setDataRefreshToken((current) => current + 1);
                  showNotice("Data refreshed from local storage.", "success");
                }}
                style={{ ...secondaryActionStyle(), width: 120, textAlign: "center" }}
                disabled={readOnly}
              >
                <ActionButtonLabel icon={<RefreshIcon />}>Refresh Data</ActionButtonLabel>
              </button>
              <button
                type="button"
                onClick={() => setShowSchedulingConfigurations((prev) => !prev)}
                style={{ ...secondaryActionStyle(), width: 120, textAlign: "center" }}
                aria-pressed={!showSchedulingConfigurations}
                disabled={readOnly}
              >
                <ActionButtonLabel icon={showSchedulingConfigurations ? <HideConfigIcon /> : <ShowConfigIcon />}>
                  {showSchedulingConfigurations ? "Hide Config" : "Show Config"}
                </ActionButtonLabel>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Grid Confirmation Modal (separate from publish) */}
      {clearGridModal && clearGridModal.open && (
        <ConfirmationModal
          open={clearGridModal.open}
          message={clearGridModal.message}
          onConfirm={clearGridModal.onConfirm}
          onCancel={clearGridModal.onCancel}
          title="Clear Grid Confirmation"
          confirmLabel="Yes, Clear Grid"
        />
      )}

      {/* Draft Timetable Preview Modal */}
      {previewDraftModal ? (
        <DraftTimetablePreviewModal
          open={!!previewDraftModal}
          draft={previewDraftModal}
          onClose={() => setPreviewDraftModal(null)}
          onLoad={(draftId) => {
            handleLoadDraft(draftId);
            setPreviewDraftModal(null);
          }}
        />
      ) : null}
      {notice.text ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 100000,
            background: notice.type === "error" ? "#dc2626" : notice.type === "info" ? "#2563eb" : notice.type === "warning" ? "#d97706" : "#16a34a",
            color: "#ffffff",
            borderRadius: 10,
            padding: "12px 18px",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.25)",
            maxWidth: 400,
            display: "flex",
            alignItems: "center",
            gap: 8,
            pointerEvents: "none",
          }}
        >
          <span>{notice.type === "error" ? "!" : notice.type === "info" ? "i" : notice.type === "warning" ? "!" : "✓"}</span>
          <span>{notice.text}</span>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
        {metrics.map((metric) => (
          <article
            key={metric.label}
            style={{
              background: "#ffffff",
              border: "1px solid #e3e7ef",
              borderRadius: 12,
              padding: 12,
              display: "grid",
              gap: 4,
            }}
          >
            <p style={{ margin: 0, color: "#6a7697", fontSize: 12, fontWeight: 700 }}>{metric.label}</p>
            <p style={{ margin: 0, color: "#24306f", fontSize: 20, fontWeight: 800 }}>{metric.value}</p>
          </article>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 12, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>Schedule Grid</h2>
            {/* Functional Clear Grid button */}
            <button
              id="btn-clear-grid"
              type="button"
              style={{
                ...secondaryActionStyle(),
                width: 120,
                textAlign: "center",
                background: "#f5f6fa",
                color: "#b53f4e",
                border: "1px solid #e3e7ef",
                fontWeight: 700,
                marginLeft: 12,
                cursor: readOnly || !schedule ? "not-allowed" : "pointer",
                opacity: readOnly || !schedule ? 0.7 : 1,
              }}
              disabled={readOnly || !schedule}
              title="Clear all assignments in the grid"
              onClick={() => {
                if (!schedule) return;
                const isDraftSaved = schedule.status === "draft" || draftsForCurrentSchedule.some((d) => d.id === schedule.id);
                if (isDraftSaved) {
                  handleClearGrid();
                } else {
                  setClearGridModal({
                    open: true,
                    message: "This schedule is not saved as a draft. Clearing the grid will remove all assignments and cannot be undone. Do you want to continue?",
                    onConfirm: () => {
                      setClearGridModal({ open: false, message: '', onConfirm: null, onCancel: null });
                      handleClearGrid();
                    },
                    onCancel: () => setClearGridModal({ open: false, message: '', onConfirm: null, onCancel: null }),
                  });
                }
              }}
            >
              Clear Grid
            </button>
          </div>

          <div
            style={{
              marginBottom: 10,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 8,
              alignItems: "end",
            }}
          >
            <Field label="Session Type">
              <select value={gridSessionFilter} onChange={(event) => setGridSessionFilter(event.target.value)} style={selectStyle(false)} disabled={readOnly}>
                <option value="all">All Sessions</option>
                <option value="regular">Regular Session</option>
                <option value="shortened">Shortened Session</option>
              </select>
            </Field>

            <Field label="Grade Level">
              <select value={gridGradeFilter} onChange={(event) => setGridGradeFilter(event.target.value)} style={selectStyle(false)} disabled={readOnly}>
                <option value="all">All Grades</option>
                {gridGradeOptions.map((grade) => (
                  <option key={grade} value={grade}>{`Grade ${grade}`}</option>
                ))}
              </select>
            </Field>

            {isJhsSchedule ? (
              <Field label="Section Type">
                <select value={gridSectionTypeFilter} onChange={(event) => setGridSectionTypeFilter(event.target.value)} style={selectStyle(false)} disabled={readOnly}>
                  <option value="all">All Section Types</option>
                  {jhsSectionTypeOptions.map((sectionType) => (
                    <option key={sectionType} value={sectionType}>{sectionType}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Strand/Track">
                <select value={gridTrackFilter} onChange={(event) => setGridTrackFilter(event.target.value)} style={selectStyle(false)} disabled={readOnly}>
                  <option value="all">All Strands/Tracks</option>
                  {shsTrackOptions.map((track) => (
                    <option key={track} value={track}>{track}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {schedule ? (
            <div
              style={{
                marginBottom: 10,
                border: "1px solid #e3e7ef",
                borderRadius: 10,
                background: "#fbfcff",
                padding: "8px 10px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ color: "#4f5d86", fontSize: 12, fontWeight: 700 }}>
                Assignment Validation:
              </span>
              <span style={{ color: "#2f5f3a", fontSize: 12, fontWeight: 700 }}>
                Valid: {assignmentValidationSummary.validAssigned}
              </span>
              <span style={{ color: "#a44652", fontSize: 12, fontWeight: 700 }}>
                Invalid: {assignmentValidationSummary.invalidAssigned}
              </span>
              <span style={{ color: "#5f6b90", fontSize: 12 }}>
                Assigned: {assignmentValidationSummary.totalAssigned} out of {assignmentValidationSummary.totalRequired}
              </span>
            </div>
          ) : null}

          {sections.length === 0 ? (
            <p style={{ margin: "10px 0 0", color: "#7a86a7", fontSize: 13 }}>
              No sections available for this schedule type. Configure sections first.
            </p>
          ) : visibleSections.length === 0 ? (
            <p style={{ margin: "10px 0 0", color: "#7a86a7", fontSize: 13 }}>
              No sections match the selected filters.
            </p>
          ) : generatorPeriods.length === 0 ? (
            <p style={{ margin: "10px 0 0", color: "#7a86a7", fontSize: 13 }}>
              No periods available. Review scheduling configurations.
            </p>
          ) : generatorDays.length === 0 ? (
            <p style={{ margin: "10px 0 0", color: "#7a86a7", fontSize: 13 }}>
              No days configured for the selected session type. Review scheduling configurations.
            </p>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #e5eaf4", borderRadius: 10 }}>
              <table style={{ borderCollapse: "collapse", tableLayout: "auto", minWidth: (hasDualSessions ? 320 : 190) + generatorDays.length * 160 }}>
                <thead>
                  <tr>
                    <th
                      colSpan={hasDualSessions ? 2 : 1}
                      rowSpan={hasDualSessions ? 1 : 2}
                      style={{
                        ...stickyHeaderCellStyle(),
                        left: 0,
                        width: hasDualSessions ? 320 : 190,
                        minWidth: hasDualSessions ? 320 : 190,
                        textAlign: "center",
                        verticalAlign: "middle",
                        background: "#eff3ff",
                      }}
                    >
                      Time
                    </th>
                    {generatorDays.map((day) => (
                      <th key={day} rowSpan={2} style={{ ...headerCellStyle(), verticalAlign: "middle" }}>
                        {day}
                      </th>
                    ))}
                  </tr>
                  {hasDualSessions ? (
                    <tr>
                      <th
                        style={{
                          ...stickyHeaderCellStyle(),
                          left: 0,
                          width: 160,
                          minWidth: 160,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#2c3a74",
                          textAlign: "center",
                          background: "#eff3ff",
                          borderTop: "1px solid #d9e0f0",
                        }}
                      >
                        {regularDaysLabel}
                      </th>
                      <th
                        style={{
                          ...stickyHeaderCellStyle(),
                          left: 160,
                          width: 160,
                          minWidth: 160,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#2c3a74",
                          textAlign: "center",
                          background: "#eff3ff",
                          borderTop: "1px solid #d9e0f0",
                        }}
                      >
                        {shortenedDaysLabel}
                      </th>
                    </tr>
                  ) : null}
                </thead>
                <tbody>
                  {visibleSections.map((section) => (
                    <Fragment key={section.id}>
                      <tr>
                        <th
                          colSpan={(hasDualSessions ? 2 : 1) + generatorDays.length}
                          style={{
                            background: "#eef3ff",
                            color: "#24326d",
                            borderBottom: "1px solid #d9e0f0",
                            borderRight: "1px solid #d9e0f0",
                            textAlign: "left",
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 800,
                            position: "sticky",
                            left: 0,
                            zIndex: 3,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span>{formatSectionDisplayName(section)}</span>
                            {renderScheduleSectionBadge(section)}
                          </div>
                        </th>
                      </tr>
                      {generatorPeriods.map((periodEntry, index) => (
                        <tr key={`${section.id}-P${periodEntry.period}`}>
                          {hasDualSessions ? (
                            <>
                              <td
                                style={{
                                  ...stickyHeaderCellStyle(),
                                  left: 0,
                                  width: 160,
                                  minWidth: 160,
                                  background: index % 2 === 0 ? "#ffffff" : "#fbfcff",
                                  padding: "8px 6px",
                                  textAlign: "center",
                                }}
                              >
                                <div style={{ display: "grid", gap: 2 }}>
                                  <span style={{ color: "#25326f", fontSize: 11, fontWeight: 700 }}>{`P${periodEntry.period}`}</span>
                                  <span style={{ color: "#51608d", fontSize: 10, fontWeight: 600 }}>
                                    {periodEntry.regularStart && periodEntry.regularEnd
                                      ? `${periodEntry.regularStart} - ${periodEntry.regularEnd}`
                                      : "—"}
                                  </span>
                                </div>
                              </td>
                              <td
                                style={{
                                  ...stickyHeaderCellStyle(),
                                  left: 160,
                                  width: 160,
                                  minWidth: 160,
                                  background: index % 2 === 0 ? "#ffffff" : "#fbfcff",
                                  padding: "8px 6px",
                                  textAlign: "center",
                                }}
                              >
                                <div style={{ display: "grid", gap: 2 }}>
                                  <span style={{ color: "#25326f", fontSize: 11, fontWeight: 700 }}>{`P${periodEntry.period}`}</span>
                                  <span style={{ color: "#51608d", fontSize: 10, fontWeight: 600 }}>
                                    {periodEntry.shortenedStart && periodEntry.shortenedEnd
                                      ? `${periodEntry.shortenedStart} - ${periodEntry.shortenedEnd}`
                                      : "—"}
                                  </span>
                                </div>
                              </td>
                            </>
                          ) : (
                            <td
                              style={{
                                ...stickyHeaderCellStyle(),
                                left: 0,
                                width: 190,
                                minWidth: 190,
                                background: index % 2 === 0 ? "#ffffff" : "#fbfcff",
                                padding: "8px 10px",
                              }}
                            >
                              <div style={{ display: "grid", gap: 2 }}>
                                <span style={{ color: "#25326f", fontSize: 11, fontWeight: 700 }}>{`P${periodEntry.period}`}</span>
                                <span style={{ color: "#6b7898", fontSize: 10 }}>{`${periodEntry.start} - ${periodEntry.end}`}</span>
                              </div>
                            </td>
                          )}

                          {generatorDays.map((day) => {
                            const slotId = `${day}-P${periodEntry.period}`;
                            const slot = slotsById.get(slotId) || {
                              id: slotId,
                              label: `${day} P${periodEntry.period}`,
                              day,
                              period: periodEntry.period,
                              start: periodEntry.start,
                              end: periodEntry.end,
                            };
                            const allowed = isSlotValidForSection(section, slot, scheduleType, config);
                            const cellKey = createCellKey(section.id, slot.id);
                            const assignment = schedule?.assignments?.[cellKey] || null;
                            const cellDraft = getCellDraft(section.id, slot.id);
                            const cellConflictMessages = conflictMessagesByCell.get(cellKey) || [];
                            const hasPendingTeacher = !assignment && !!cellDraft.subjectId && !cellDraft.teacherId;
                            const pendingTeacherMessage = "Teacher is required for the selected subject.";
                            const cellDisplayConflictMessages = hasPendingTeacher
                              ? [...cellConflictMessages, pendingTeacherMessage]
                              : cellConflictMessages;
                            const hasCellConflict = cellDisplayConflictMessages.length > 0;
                            const hasValidAssignment = !!assignment && !hasCellConflict;
                            const subjectOptions = getSubjectsForSection(section, subjects, scheduleType);
                            const subjectOptionsWithState = subjectOptions.map((item) => ({
                              ...item,
                              restricted: isSubjectRestrictedForSlot(item, slot, config.constraints, config),
                            }));
                            const selectedSubject = subjectOptions.find((item) => item.id === cellDraft.subjectId) || null;
                            const teacherOptions = selectedSubject
                              ? activeTeachers
                                .map((candidate) => ({
                                  candidate,
                                  state: getTeacherDropdownOptionState({
                                    teacher: candidate,
                                    subject: selectedSubject,
                                    section,
                                    slot,
                                    constraints: config.constraints,
                                    teacherBusyBySlot,
                                    excludedSectionId: section.id,
                                  }),
                                }))
                                .filter((item) => item.state.include)
                                .map((item) => ({
                                  ...item.candidate,
                                  restricted: item.state.restricted,
                                  restrictedReason: item.state.restrictedReason,
                                  statusNote: item.state.statusNote,
                                }))
                              : [];
                            const subject = assignment ? subjectsById.get(assignment.subjectId) : null;
                            const teacher = assignment ? facultyById.get(assignment.teacherId) : null;
                            const showEditor = allowed && !readOnly && (activeCellKey === cellKey || hoveredCellKey === cellKey);
                            const draftSubject = !assignment && cellDraft.subjectId ? subjectsById.get(cellDraft.subjectId) : null;
                            const draftTeacher = !assignment && cellDraft.teacherId ? facultyById.get(cellDraft.teacherId) : null;

                            return (
                              <td
                                key={`${section.id}-${slot.id}`}
                                style={{
                                  ...gridCellStyle(allowed, !!assignment, hasCellConflict, hasValidAssignment),
                                  minHeight: 62,
                                  verticalAlign: "middle",
                                  padding: "8px 8px",
                                  cursor: allowed && !readOnly ? "pointer" : "default",
                                }}
                                onClick={() => {
                                  if (allowed && !readOnly) {
                                    setActiveCellKey(cellKey);
                                  }
                                }}
                                onMouseEnter={(event) => {
                                  if (allowed) {
                                    setHoveredCellKey(cellKey);

                                    if (hasCellConflict) {
                                      const rect = event.currentTarget.getBoundingClientRect();
                                      setCellConflictTooltip({
                                        visible: true,
                                        messages: cellDisplayConflictMessages,
                                        x: rect.left + rect.width / 2,
                                        y: rect.top - 8,
                                      });
                                    }
                                  }
                                }}
                                onMouseLeave={() => {
                                  if (hoveredCellKey === cellKey) {
                                    setHoveredCellKey("");
                                  }

                                  if (hasCellConflict) {
                                    setCellConflictTooltip((current) => ({ ...current, visible: false }));
                                  }
                                }}
                              >
                                {!allowed ? (
                                  <span style={{ color: "#9aa5c2", fontSize: 11, fontWeight: 600 }}>N/A</span>
                                ) : showEditor ? (
                                  <div style={{ display: "grid", gap: 4 }}>
                                    <select
                                      value={cellDraft.subjectId}
                                      onChange={(event) => handleCellSubjectChange(section, slot, event.target.value)}
                                      style={cellEditorSelectStyle()}
                                      disabled={readOnly}
                                    >
                                      <option value="">Select subject</option>
                                      {subjectOptionsWithState.map((option) => (
                                        <option key={option.id} value={option.id} disabled={option.restricted}>
                                          {option.restricted ? `${option.subjectName} (Restricted)` : option.subjectName}
                                        </option>
                                      ))}
                                    </select>

                                    <select
                                      value={cellDraft.teacherId}
                                      onChange={(event) => handleCellTeacherChange(section, slot, event.target.value)}
                                      style={cellEditorSelectStyle()}
                                      disabled={!cellDraft.subjectId || readOnly}
                                    >
                                      <option value="">Select teacher</option>
                                      {teacherOptions.map((option) => (
                                        <option key={option.id} value={option.id} disabled={option.restricted}>
                                          {option.restricted
                                            ? `${option.name} (${option.restrictedReason || "Restricted"})`
                                            : option.statusNote
                                              ? `${option.name} (${option.statusNote})`
                                              : option.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                ) : assignment ? (
                                  <div style={{ display: "grid", gap: 2 }}>
                                    <span style={{ color: "#263475", fontSize: 11, fontWeight: 700 }}>{subject?.subjectName || "Subject"}</span>
                                    <span style={{ color: "#51608d", fontSize: 11 }}>{teacher?.name || "Teacher"}</span>
                                  </div>
                                ) : draftSubject ? (
                                  <div style={{ display: "grid", gap: 2 }}>
                                    <span style={{ color: "#263475", fontSize: 11, fontWeight: 700 }}>{draftSubject.subjectName}</span>
                                    <span style={{ color: "#7a86a7", fontSize: 11 }}>{draftTeacher?.name || "Teacher pending"}</span>
                                  </div>
                                ) : (
                                  <span style={{ color: "#a0abc7", fontSize: 11 }}>—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: 10, display: "grid", gap: 4 }}>
            <p style={{ margin: 0, color: "#5d698d", fontSize: 12, fontWeight: 700 }}>Break Settings (Current Schedule)</p>
            {breakSummary.length ? (
              breakSummary.map((entry) => (
                <p key={entry} style={{ margin: 0, color: "#5d698d", fontSize: 12 }}>
                  • {entry}
                </p>
              ))
            ) : (
              <p style={{ margin: 0, color: "#7a86a7", fontSize: 12 }}>No breaks enabled.</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom inline conflicts card removed so only 1 side drawer conflict panel is used */}
      {false && schedule?.conflicts?.length ? (
        <div id="conflicts-card" style={{ background: "#fff7f8", border: "1px solid #f0c9cf", borderRadius: 12, padding: 12, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: "#a44652", fontSize: 14 }}>Detected Conflicts ({schedule.conflicts.length})</h3>
              <p style={{ margin: "6px 0 0", color: "#8a4a55", fontSize: 12, fontWeight: 600 }}>
                Conflicting cells are highlighted in red in the schedule grid.
              </p>
            </div>
            <button
              type="button"
              style={{ ...secondaryActionStyle(), minWidth: 90 }}
              onClick={handleAutoFixAllConflicts}
              title="Auto-fix all supported conflicts"
            >
              Auto-Fix All
            </button>
          </div>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {schedule.conflicts.map((conflict, index) => {
              // Handler for Apply Fix button for supported conflict types
              async function handleApplyFixConflict() {
                const multipleBookingMatch = conflict.match(/^(.*?) is (double|triple|multiple)-booked at (.+) for (.+)\.$/i);
                if (multipleBookingMatch) {
                  const teacher = multipleBookingMatch[1];
                  const period = multipleBookingMatch[3];
                  const sectionsStr = multipleBookingMatch[4];
                  const sectionNames = sectionsStr.split(/, ?/);
                  const mode = conflictSuggestionMode[index] || 0;
                  let sectionsToChange = [];
                  if (sectionNames.length === 2) {
                    sectionsToChange = mode % 2 === 0 ? [sectionNames[0]] : [sectionNames[1]];
                  } else if (sectionNames.length === 3) {
                    if (mode % 3 === 0) {
                      sectionsToChange = [sectionNames[0], sectionNames[1]];
                    } else if (mode % 3 === 1) {
                      sectionsToChange = [sectionNames[1], sectionNames[2]];
                    } else {
                      sectionsToChange = [sectionNames[0], sectionNames[2]];
                    }
                  } else if (sectionNames.length > 3) {
                    const keepIdx = mode % sectionNames.length;
                    sectionsToChange = sectionNames.filter((_, idx) => idx !== keepIdx);
                  }

                  function normalizeSectionString(str) {
                    return String(str).replace(/\s+/g, '').replace(/-/g, '').toLowerCase();
                  }
                  function normalizePeriodLabel(str) {
                    return String(str).replace(/\s+/g, '').replace(/[-–—]/g, '').replace(/\./g, '').toLowerCase();
                  }

                  let slot = slots.find((s) => normalizePeriodLabel(s.label) === normalizePeriodLabel(period));
                  if (!slot) {
                    const periodNumMatch = period.match(/(\d+)/);
                    if (periodNumMatch) {
                      const periodNum = parseInt(periodNumMatch[1], 10);
                      slot = slots.find((s) => String(s.period) === String(periodNum));
                    }
                  }
                  if (!slot) return;

                  let nextAssignments = { ...(schedule?.assignments || {}) };
                  let nextDrafts = { ...(cellEditorDrafts || {}) };

                  sectionsToChange.forEach((sectionName) => {
                    let sectionObj = sections.find((sec) => normalizeSectionString(formatSectionDisplayName(sec)) === normalizeSectionString(sectionName));
                    if (!sectionObj) {
                      sectionObj = sections.find((sec) => {
                        const code = sec.code || '';
                        const name = sec.name || '';
                        const grade = sec.grade ? String(sec.grade) : '';
                        return (
                          normalizeSectionString(code) === normalizeSectionString(sectionName) ||
                          normalizeSectionString(name) === normalizeSectionString(sectionName) ||
                          normalizeSectionString(`${grade}${name}`) === normalizeSectionString(sectionName) ||
                          normalizeSectionString(`${grade}-${name}`) === normalizeSectionString(sectionName)
                        );
                      });
                    }
                    if (!sectionObj) return;

                    const cellKey = createCellKey(sectionObj.id, slot.id);
                    const draft = cellEditorDrafts?.[cellKey] || null;
                    const subjectId = draft?.subjectId || (schedule?.assignments?.[cellKey]?.subjectId ?? null);
                    if (!subjectId) return;
                    const subject = subjectsById.get(subjectId);

                    let availableTeachers = [];
                    if (subject && slot) {
                      availableTeachers = activeTeachers.filter((t) => {
                        if (t.name === teacher) return false;
                        return isTeacherEligible({
                          teacher: t,
                          subject,
                          section: sectionObj,
                          slot,
                          constraints: config.constraints,
                          teacherBusyBySlot,
                          excludedSectionId: sectionObj.id,
                        });
                      });
                    }

                    const newTeacherId = availableTeachers.length > 0 ? availableTeachers[0].id : '';
                    nextDrafts[cellKey] = { subjectId, teacherId: newTeacherId };
                    nextAssignments[cellKey] = {
                      subjectId,
                      teacherId: newTeacherId,
                      source: 'auto-fix',
                      updatedAt: new Date().toISOString(),
                    };
                  });

                  const evaluation = evaluateSchedule({
                    assignments: nextAssignments,
                    sections,
                    slots,
                    subjects,
                    teachers: activeTeachers,
                    scheduleType,
                    config,
                  });
                  setCellEditorDrafts(nextDrafts);
                  setSchedule((current) => ({
                    ...current,
                    assignments: nextAssignments,
                    conflicts: evaluation.conflicts,
                    conflictDetails: evaluation.conflictDetails,
                    teacherLoadPercent: evaluation.teacherLoadPercent,
                    updatedAt: new Date().toISOString(),
                  }));
                  return;
                }

                const specializedConflictMatch = conflict.match(/^(.*?) has more than one specialized subject assigned \((.*?)\)\.$/i);
                if (specializedConflictMatch) {
                  const sectionLabel = specializedConflictMatch[1];
                  const mode = conflictSuggestionMode[index] || 0;

                  function findSectionForSpecializedFix(label) {
                    let sectionObj = sections.find((sec) => sanitizeText(formatConflictSectionName(sec)).toLowerCase() === sanitizeText(label).toLowerCase());
                    if (!sectionObj) {
                      sectionObj = sections.find((sec) => {
                        const code = sec.code || "";
                        const name = sec.name || "";
                        const grade = sec.grade ? String(sec.grade) : "";
                        return (
                          sanitizeText(code).toLowerCase() === sanitizeText(label).toLowerCase() ||
                          sanitizeText(name).toLowerCase() === sanitizeText(label).toLowerCase() ||
                          sanitizeText(`${grade}${name}`).toLowerCase() === sanitizeText(label).toLowerCase() ||
                          sanitizeText(`${grade}-${name}`).toLowerCase() === sanitizeText(label).toLowerCase()
                        );
                      });
                    }
                    return sectionObj;
                  }

                  const sectionObj = findSectionForSpecializedFix(sectionLabel);
                  if (!sectionObj) {
                    return;
                  }

                  const conflictDetail = (conflictDetailsForDisplay || []).find((entry) => sanitizeText(entry?.message) === sanitizeText(conflict));
                  const specializedEntries = Array.isArray(conflictDetail?.cellKeys)
                    ? conflictDetail.cellKeys
                      .map((cellKey) => {
                        const [, slotId] = splitCellKey(cellKey);
                        const slot = slotsById.get(slotId);
                        const draft = cellEditorDrafts?.[cellKey] || null;
                        const assignment = draft?.subjectId || draft?.teacherId
                          ? {
                            subjectId: draft.subjectId || (schedule?.assignments?.[cellKey]?.subjectId ?? null),
                            teacherId: draft.teacherId || (schedule?.assignments?.[cellKey]?.teacherId ?? null),
                          }
                          : (schedule?.assignments?.[cellKey] || null);
                        const subjectObj = assignment?.subjectId ? subjectsById.get(assignment.subjectId) : null;
                        return { cellKey, slot, assignment, subjectObj };
                      })
                      .filter((entry) => {
                        const type = String(entry?.subjectObj?.subjectType || "").toLowerCase();
                        return Boolean(entry?.cellKey) && type === "specialized";
                      })
                    : [];

                  if (specializedEntries.length <= 1) {
                    return;
                  }

                  const sectionCellKeys = Array.from(new Set([
                    ...Object.keys(schedule?.assignments || {}),
                    ...Object.keys(cellEditorDrafts || {}),
                  ])).filter((cellKey) => splitCellKey(cellKey)[0] === sectionObj.id);

                  const assignedSubjectIds = new Set();
                  sectionCellKeys.forEach((cellKey) => {
                    const draft = cellEditorDrafts?.[cellKey] || null;
                    const assignment = draft?.subjectId || draft?.teacherId
                      ? {
                        subjectId: draft.subjectId || (schedule?.assignments?.[cellKey]?.subjectId ?? null),
                        teacherId: draft.teacherId || (schedule?.assignments?.[cellKey]?.teacherId ?? null),
                      }
                      : (schedule?.assignments?.[cellKey] || null);
                    if (assignment?.subjectId) {
                      assignedSubjectIds.add(assignment.subjectId);
                    }
                  });

                  const offeredSubjects = getSubjectsForSection(sectionObj, subjects, scheduleType);
                  const missingSubjects = offeredSubjects.filter((subjectItem) => !assignedSubjectIds.has(subjectItem.id));

                  const options = specializedEntries.flatMap((keepSubjectEntry) =>
                    specializedEntries.map((keepPeriodEntry) => ({
                      keepSubjectEntry,
                      keepPeriodEntry,
                    }))
                  );

                  if (options.length === 0) {
                    return;
                  }

                  const selectedOption = options[mode % options.length];
                  const keepSubjectEntry = selectedOption.keepSubjectEntry;
                  const keepPeriodEntry = selectedOption.keepPeriodEntry;
                  const reassignEntries = specializedEntries.filter((entry) => entry.cellKey !== keepPeriodEntry.cellKey);

                  let nextAssignments = { ...(schedule?.assignments || {}) };
                  let nextDrafts = { ...(cellEditorDrafts || {}) };

                  function pickTeacherId({ preferredTeacherId, subject, slot }) {
                    if (!subject || !slot) {
                      return "";
                    }

                    const preferredTeacher = preferredTeacherId ? facultyById.get(preferredTeacherId) : null;
                    if (
                      preferredTeacher &&
                      isTeacherEligible({
                        teacher: preferredTeacher,
                        subject,
                        section: sectionObj,
                        slot,
                        constraints: config.constraints,
                        teacherBusyBySlot,
                        excludedSectionId: sectionObj.id,
                      })
                    ) {
                      return preferredTeacher.id;
                    }

                    const fallback = activeTeachers.find((teacher) =>
                      isTeacherEligible({
                        teacher,
                        subject,
                        section: sectionObj,
                        slot,
                        constraints: config.constraints,
                        teacherBusyBySlot,
                        excludedSectionId: sectionObj.id,
                      })
                    );

                    return fallback ? fallback.id : "";
                  }

                  const keepCellKey = keepPeriodEntry.cellKey;
                  const keepSlot = keepPeriodEntry.slot;
                  const keepSubjectId = keepSubjectEntry?.assignment?.subjectId || keepSubjectEntry?.subjectObj?.id || null;
                  if (keepCellKey && keepSubjectId) {
                    const keepSubjectObj = subjectsById.get(keepSubjectId);
                    const keepTeacherId = pickTeacherId({
                      preferredTeacherId: keepPeriodEntry?.assignment?.teacherId || "",
                      subject: keepSubjectObj,
                      slot: keepSlot,
                    });

                    nextDrafts[keepCellKey] = { subjectId: keepSubjectId, teacherId: keepTeacherId };
                    nextAssignments[keepCellKey] = {
                      subjectId: keepSubjectId,
                      teacherId: keepTeacherId,
                      source: 'auto-fix',
                      updatedAt: new Date().toISOString(),
                    };
                  }

                  reassignEntries.forEach((entry, replacementIndex) => {
                    const replacementSubject = missingSubjects[replacementIndex] || missingSubjects[0] || null;
                    if (!replacementSubject || !entry?.cellKey) {
                      return;
                    }

                    const newTeacherId = pickTeacherId({
                      preferredTeacherId: entry?.assignment?.teacherId || "",
                      subject: replacementSubject,
                      slot: entry?.slot,
                    });

                    nextDrafts[entry.cellKey] = { subjectId: replacementSubject.id, teacherId: newTeacherId };
                    nextAssignments[entry.cellKey] = {
                      subjectId: replacementSubject.id,
                      teacherId: newTeacherId,
                      source: 'auto-fix',
                      updatedAt: new Date().toISOString(),
                    };
                  });

                  const evaluation = evaluateSchedule({
                    assignments: nextAssignments,
                    sections,
                    slots,
                    subjects,
                    teachers: activeTeachers,
                    scheduleType,
                    config,
                  });

                  setCellEditorDrafts(nextDrafts);
                  setSchedule((current) => ({
                    ...current,
                    assignments: nextAssignments,
                    conflicts: evaluation.conflicts,
                    conflictDetails: evaluation.conflictDetails,
                    teacherLoadPercent: evaluation.teacherLoadPercent,
                    updatedAt: new Date().toISOString(),
                  }));
                  return;
                }

                const duplicateSubjectMatch = conflict.match(/^(.*?) is duplicated in multiple periods for (.*?)\.$/i);
                if (!duplicateSubjectMatch) {
                  return;
                }

                const sectionLabel = duplicateSubjectMatch[2];
                const mode = conflictSuggestionMode[index] || 0;

                function findSectionForDuplicateFix(label) {
                  let sectionObj = sections.find((sec) => sanitizeText(formatConflictSectionName(sec)).toLowerCase() === sanitizeText(label).toLowerCase());
                  if (!sectionObj) {
                    sectionObj = sections.find((sec) => {
                      const code = sec.code || "";
                      const name = sec.name || "";
                      const grade = sec.grade ? String(sec.grade) : "";
                      return (
                        sanitizeText(code).toLowerCase() === sanitizeText(label).toLowerCase() ||
                        sanitizeText(name).toLowerCase() === sanitizeText(label).toLowerCase() ||
                        sanitizeText(`${grade}${name}`).toLowerCase() === sanitizeText(label).toLowerCase() ||
                        sanitizeText(`${grade}-${name}`).toLowerCase() === sanitizeText(label).toLowerCase()
                      );
                    });
                  }
                  return sectionObj;
                }

                const sectionObj = findSectionForDuplicateFix(sectionLabel);
                if (!sectionObj) {
                  return;
                }

                const conflictDetail = (conflictDetailsForDisplay || []).find((entry) => sanitizeText(entry?.message) === sanitizeText(conflict));
                const duplicateEntries = Array.isArray(conflictDetail?.cellKeys)
                  ? conflictDetail.cellKeys
                    .map((cellKey) => {
                      const [, slotId] = splitCellKey(cellKey);
                      const slot = slotsById.get(slotId);
                      return {
                        cellKey,
                        slot,
                      };
                    })
                    .filter((entry) => Boolean(entry.cellKey))
                  : [];

                if (duplicateEntries.length <= 1) {
                  return;
                }

                const keepIndex = mode % duplicateEntries.length;
                const targetEntries = duplicateEntries.filter((_, entryIndex) => entryIndex !== keepIndex);
                let nextAssignments = { ...(schedule?.assignments || {}) };
                let nextDrafts = { ...(cellEditorDrafts || {}) };

                const sectionCellKeys = Array.from(new Set([
                  ...Object.keys(schedule?.assignments || {}),
                  ...Object.keys(cellEditorDrafts || {}),
                ])).filter((cellKey) => splitCellKey(cellKey)[0] === sectionObj.id);

                const assignedSubjectIds = new Set();
                const subjectCounts = new Map();
                sectionCellKeys.forEach((cellKey) => {
                  const draft = cellEditorDrafts?.[cellKey] || null;
                  const assignment = draft?.subjectId || draft?.teacherId
                    ? {
                      subjectId: draft.subjectId || (schedule?.assignments?.[cellKey]?.subjectId ?? null),
                      teacherId: draft.teacherId || (schedule?.assignments?.[cellKey]?.teacherId ?? null),
                    }
                    : (schedule?.assignments?.[cellKey] || null);
                  if (assignment?.subjectId) {
                    assignedSubjectIds.add(assignment.subjectId);
                    subjectCounts.set(assignment.subjectId, (subjectCounts.get(assignment.subjectId) || 0) + 1);
                  }
                });

                const offeredSubjects = getSubjectsForSection(sectionObj, subjects, scheduleType);
                const missingSubjects = offeredSubjects.filter((subjectItem) => !assignedSubjectIds.has(subjectItem.id));
                const underQuotaSubjects = offeredSubjects.filter((sb) => {
                  const count = subjectCounts.get(sb.id) || 0;
                  const req = parseBoundedNumber(sb.classesPerWeek, 1, 12, 4);
                  return count < req;
                });

                const candidateReplacements = missingSubjects.length > 0
                  ? missingSubjects
                  : (underQuotaSubjects.length > 0 ? underQuotaSubjects : offeredSubjects);

                targetEntries.forEach((entry, replacementIndex) => {
                  const replacementSubject = candidateReplacements[replacementIndex % candidateReplacements.length] || candidateReplacements[0] || null;
                  if (!replacementSubject) {
                    return;
                  }

                  const cellKey = entry.cellKey;
                  const slot = entry.slot;
                  const draft = cellEditorDrafts?.[cellKey] || null;
                  const currentAssignment = draft?.subjectId || draft?.teacherId
                    ? {
                      subjectId: draft.subjectId || (schedule?.assignments?.[cellKey]?.subjectId ?? null),
                      teacherId: draft.teacherId || (schedule?.assignments?.[cellKey]?.teacherId ?? null),
                    }
                    : (schedule?.assignments?.[cellKey] || null);

                  let newTeacherId = currentAssignment?.teacherId || '';
                  const currentTeacher = newTeacherId ? facultyById.get(newTeacherId) : null;
                  const canKeepTeacher = slot && currentTeacher
                    ? isTeacherEligible({
                      teacher: currentTeacher,
                      subject: replacementSubject,
                      section: sectionObj,
                      slot,
                      constraints: config.constraints,
                      teacherBusyBySlot,
                      excludedSectionId: sectionObj.id,
                    })
                    : false;

                  if (!canKeepTeacher) {
                    const fallbackTeacher = slot
                      ? activeTeachers.find((teacher) =>
                        isTeacherEligible({
                          teacher,
                          subject: replacementSubject,
                          section: sectionObj,
                          slot,
                          constraints: config.constraints,
                          teacherBusyBySlot,
                          excludedSectionId: sectionObj.id,
                        })
                      )
                      : null;
                    newTeacherId = fallbackTeacher ? fallbackTeacher.id : '';
                  }

                  nextDrafts[cellKey] = { subjectId: replacementSubject.id, teacherId: newTeacherId };
                  nextAssignments[cellKey] = {
                    subjectId: replacementSubject.id,
                    teacherId: newTeacherId,
                    source: 'auto-fix',
                    updatedAt: new Date().toISOString(),
                  };
                });

                const evaluation = evaluateSchedule({
                  assignments: nextAssignments,
                  sections,
                  slots,
                  subjects,
                  teachers: activeTeachers,
                  scheduleType,
                  config,
                });

                setCellEditorDrafts(nextDrafts);
                setSchedule((current) => ({
                  ...current,
                  assignments: nextAssignments,
                  conflicts: evaluation.conflicts,
                  conflictDetails: evaluation.conflictDetails,
                  teacherLoadPercent: evaluation.teacherLoadPercent,
                  updatedAt: new Date().toISOString(),
                }));
              }
              // Dynamic, explicit suggestions: fully resolve multiple-booking conflicts
              let suggestions = [];
              let isMultipleBooking = false;
              let debugInfo = null;
              if (/is (double|triple|multiple)-booked at (.+) for (.+)/i.test(conflict)) {
                const match = conflict.match(/^(.*?) is (double|triple|multiple)-booked at (.+) for (.+)\.$/i);
                if (match) {
                  isMultipleBooking = true;
                  const teacher = match[1];
                  const period = match[3];
                  const sectionsStr = match[4];
                  const sectionNames = sectionsStr.split(/, ?/);
                  // Build suggestions as before
                  if (sectionNames.length === 2) {
                    suggestions.push(`Assign a different teacher to ${sectionNames[0]} at ${period}, so ${teacher} is only scheduled for ${sectionNames[1]} at that period.`);
                    suggestions.push(`Assign a different teacher to ${sectionNames[1]} at ${period}, so ${teacher} is only scheduled for ${sectionNames[0]} at that period.`);
                  } else if (sectionNames.length === 3) {
                    suggestions.push(`Assign different teachers to ${sectionNames[0]} and ${sectionNames[1]} at ${period}, so ${teacher} is only scheduled for ${sectionNames[2]} at that period.`);
                    suggestions.push(`Assign different teachers to ${sectionNames[1]} and ${sectionNames[2]} at ${period}, so ${teacher} is only scheduled for ${sectionNames[0]} at that period.`);
                    suggestions.push(`Assign different teachers to ${sectionNames[0]} and ${sectionNames[2]} at ${period}, so ${teacher} is only scheduled for ${sectionNames[1]} at that period.`);
                  } else if (sectionNames.length > 3) {
                    for (let i = 0; i < sectionNames.length; i++) {
                      const keepSection = sectionNames[i];
                      const reassignSections = sectionNames.filter((_, idx) => idx !== i);
                      suggestions.push(`Assign different teachers to ${reassignSections.join(", ")} at ${period}, so ${teacher} is only scheduled for ${keepSection} at that period.`);
                    }
                  }
                  // Build debug info for the current suggestion
                  const mode = conflictSuggestionMode[index] || 0;
                  let sectionsToChange = [];
                  let sectionToKeep = null;
                  if (sectionNames.length === 2) {
                    // Only one to change, one to keep
                    if (mode % 2 === 0) {
                      sectionsToChange = [sectionNames[0]];
                      sectionToKeep = sectionNames[1];
                    } else {
                      sectionsToChange = [sectionNames[1]];
                      sectionToKeep = sectionNames[0];
                    }
                  } else if (sectionNames.length === 3) {
                    if (mode % 3 === 0) {
                      sectionsToChange = [sectionNames[0], sectionNames[1]];
                      sectionToKeep = sectionNames[2];
                    } else if (mode % 3 === 1) {
                      sectionsToChange = [sectionNames[1], sectionNames[2]];
                      sectionToKeep = sectionNames[0];
                    } else {
                      sectionsToChange = [sectionNames[0], sectionNames[2]];
                      sectionToKeep = sectionNames[1];
                    }
                  } else if (sectionNames.length > 3) {
                    const keepIdx = mode % sectionNames.length;
                    sectionToKeep = sectionNames[keepIdx];
                    sectionsToChange = sectionNames.filter((_, idx) => idx !== keepIdx);
                  }
                  // Find slot by period label
                  // Robustly match period label to slot (normalize both)
                  function normalizePeriodLabel(str) {
                    return String(str).replace(/\s+/g, '').replace(/[-–—]/g, '').replace(/\./g, '').toLowerCase();
                  }
                  let slot = slots.find((s) => normalizePeriodLabel(s.label) === normalizePeriodLabel(period));
                  // Fallback: try to match by period number (e.g., "1st Period" => slot with period: 1)
                  if (!slot) {
                    const periodNumMatch = period.match(/(\d+)/);
                    if (periodNumMatch) {
                      const periodNum = parseInt(periodNumMatch[1], 10);
                      slot = slots.find((s) => String(s.period) === String(periodNum));
                    }
                  }
                  debugInfo = [];
                  debugInfo.push(`[DEBUG]`);
                  debugInfo.push(`Conflict: ${conflict}`);
                  debugInfo.push(`Period: ${period}`);
                  debugInfo.push(`Sections to change: ${sectionsToChange.join(", ")}`);
                  // Helper: normalize a string for loose matching
                  function normalizeSectionString(str) {
                    return String(str).replace(/\s+/g, '').replace(/-/g, '').toLowerCase();
                  }
                  sectionsToChange.forEach((sectionName) => {
                    // Use the full sections list for matching
                    let sectionObj = sections.find((sec) => normalizeSectionString(formatSectionDisplayName(sec)) === normalizeSectionString(sectionName));
                    if (!sectionObj) {
                      // Try matching by code or name only
                      sectionObj = sections.find((sec) => {
                        const code = sec.code || '';
                        const name = sec.name || '';
                        const grade = sec.grade ? String(sec.grade) : '';
                        return (
                          normalizeSectionString(code) === normalizeSectionString(sectionName) ||
                          normalizeSectionString(name) === normalizeSectionString(sectionName) ||
                          normalizeSectionString(`${grade}${name}`) === normalizeSectionString(sectionName) ||
                          normalizeSectionString(`${grade}-${name}`) === normalizeSectionString(sectionName)
                        );
                      });
                    }
                    if (!sectionObj) {
                      debugInfo.push(`  ${sectionName}: [Section not found in data]`);
                      return;
                    }
                    let cellKey = null;
                    let assignment = null;
                    let subject = null;
                    let slotId = slot ? slot.id : '(no slot)';
                    let sectionId = sectionObj.id || '(no section id)';
                    let draft = null;
                    if (slot) {
                      cellKey = createCellKey(sectionObj.id, slot.id);
                      // Use draft if present, else assignment
                      draft = cellEditorDrafts?.[cellKey] || null;
                      if (draft && (draft.subjectId || draft.teacherId)) {
                        assignment = {
                          subjectId: draft.subjectId || (schedule?.assignments?.[cellKey]?.subjectId ?? null),
                          teacherId: draft.teacherId || (schedule?.assignments?.[cellKey]?.teacherId ?? null),
                          source: 'draft',
                          updatedAt: null
                        };
                      } else {
                        assignment = schedule?.assignments?.[cellKey] || null;
                      }
                      subject = assignment && assignment.subjectId ? subjectsById.get(assignment.subjectId) : null;
                    }
                    // Find available teachers for this subject and slot
                    let availableTeachers = [];
                    if (subject && slot) {
                      availableTeachers = activeTeachers.filter((t) => {
                        if (t.name === teacher) return false; // Exclude conflicted teacher
                        return isTeacherEligible({
                          teacher: t,
                          subject,
                          section: sectionObj,
                          slot,
                          constraints: config.constraints,
                          teacherBusyBySlot,
                          excludedSectionId: sectionObj.id,
                        });
                      });
                    }
                    debugInfo.push(`  ${sectionName}:`);
                    debugInfo.push(`    Section ID: ${sectionId}`);
                    debugInfo.push(`    Slot ID: ${slotId}`);
                    debugInfo.push(`    CellKey: ${cellKey || '(no id)'}`);
                    debugInfo.push(`    Assignment: ${assignment ? JSON.stringify(assignment) : 'null'}`);
                    debugInfo.push(`    Assigned Subject: ${subject ? subject.subjectName : '(none)'}`);
                    debugInfo.push(`    Assigned Teacher: ${assignment ? (facultyById.get(assignment.teacherId)?.name || '(none)') : '(none)'}`);
                    debugInfo.push(`    Available Teachers: ${availableTeachers.length > 0 ? availableTeachers.map(t => t.name).join(', ') : '(none)'}`);
                    // Show assignment keys for this cell
                    if (schedule && schedule.assignments && cellKey) {
                      debugInfo.push(`    Assignment keys: ${Object.keys(schedule.assignments).filter(k => k === cellKey).join(', ')}`);
                    }
                  });
                  // (Removed debug line for all assignment keys)
                  debugInfo.push(`Section to keep: ${sectionToKeep}`);
                }
              }
              // Fallback to previous logic for other conflicts
              if (!isMultipleBooking) {
                const mode = conflictSuggestionMode[index] || 0;
                // Unavailable teacher
                if (/(.+) is unavailable\./i.test(conflict)) {
                  const match = conflict.match(/^(.*?) (\d+.*?): (.*?) is unavailable\.$/i);
                  if (match) {
                    const sectionPeriod = match[1] + ' ' + match[2];
                    const teacher = match[3];
                    suggestions = [
                      `${teacher} is not available for ${sectionPeriod}. Assign a different teacher who is available at this time.`,
                      `Move this subject in ${sectionPeriod} to a period when ${teacher} is available.`,
                      `Assign a substitute teacher for ${sectionPeriod} to cover for ${teacher}.`,
                      `Reschedule ${teacher}'s other commitments to make them available for ${sectionPeriod}.`,
                    ];
                  } else {
                    suggestions = [
                      "The assigned teacher is unavailable. Assign a different teacher.",
                      "Move this subject to a period when the teacher is available.",
                      "Assign a substitute teacher for this period.",
                    ];
                  }
                } else if (/(.+) is restricted for this period\./i.test(conflict)) {
                  const match = conflict.match(/^(.*?) (\d+.*?): (.*?) is restricted for this period\.$/i);
                  if (match) {
                    const sectionPeriod = match[1] + ' ' + match[2];
                    const teacher = match[3];
                    suggestions = [
                      `${teacher} cannot be assigned to ${sectionPeriod} due to a restriction. Assign a different teacher.`,
                      `Move this subject in ${sectionPeriod} to a period that is not restricted for ${teacher}.`,
                      `Request an exception to the restriction for ${teacher} at ${sectionPeriod}.`,
                    ];
                  } else {
                    suggestions = [
                      "The assigned teacher is restricted for this period. Assign a different teacher.",
                      "Move this subject to a period without restrictions.",
                    ];
                  }
                } else if (/(.+) is restricted for this period\./i.test(conflict)) {
                  suggestions = [
                    "The subject is restricted for this period. Move this subject to a different period.",
                    "Adjust the subject's restrictions to allow this period.",
                  ];
                } else if (/is duplicated in multiple periods for (.+)\./i.test(conflict)) {
                  const match = conflict.match(/^(.*?) is duplicated in multiple periods for (.*?)\.$/i);
                  if (match) {
                    const subject = match[1];
                    const section = match[2];
                    function findSectionForDuplicateDebug(sectionLabel) {
                      let sectionObj = sections.find((sec) => sanitizeText(formatConflictSectionName(sec)).toLowerCase() === sanitizeText(sectionLabel).toLowerCase());
                      if (!sectionObj) {
                        sectionObj = sections.find((sec) => {
                          const code = sec.code || "";
                          const name = sec.name || "";
                          const grade = sec.grade ? String(sec.grade) : "";
                          return (
                            sanitizeText(code).toLowerCase() === sanitizeText(sectionLabel).toLowerCase() ||
                            sanitizeText(name).toLowerCase() === sanitizeText(sectionLabel).toLowerCase() ||
                            sanitizeText(`${grade}${name}`).toLowerCase() === sanitizeText(sectionLabel).toLowerCase() ||
                            sanitizeText(`${grade}-${name}`).toLowerCase() === sanitizeText(sectionLabel).toLowerCase()
                          );
                        });
                      }
                      return sectionObj;
                    }

                    const sectionObj = findSectionForDuplicateDebug(section);
                    const offeredSubjects = sectionObj ? getSubjectsForSection(sectionObj, subjects, scheduleType) : [];
                    const sectionCellKeys = sectionObj
                      ? Array.from(new Set([
                        ...Object.keys(schedule?.assignments || {}),
                        ...Object.keys(cellEditorDrafts || {}),
                      ])).filter((cellKey) => splitCellKey(cellKey)[0] === sectionObj.id)
                      : [];

                    const assignedSubjectMap = new Map();
                    sectionCellKeys.forEach((cellKey) => {
                      const [sectionId, slotId] = splitCellKey(cellKey);
                      if (!sectionObj || sectionId !== sectionObj.id) {
                        return;
                      }

                      const draft = cellEditorDrafts?.[cellKey] || null;
                      const assignment = draft?.subjectId || draft?.teacherId
                        ? {
                          subjectId: draft.subjectId || (schedule?.assignments?.[cellKey]?.subjectId ?? null),
                          teacherId: draft.teacherId || (schedule?.assignments?.[cellKey]?.teacherId ?? null),
                          source: "draft",
                        }
                        : (schedule?.assignments?.[cellKey] || null);

                      if (!assignment?.subjectId) {
                        return;
                      }

                      const existing = assignedSubjectMap.get(assignment.subjectId) || {
                        label: subjectsById.get(assignment.subjectId)?.subjectName || subjectsById.get(assignment.subjectId)?.subjectCode || assignment.subjectId,
                        periods: [],
                        cellKeys: [],
                        teachers: [],
                      };
                      const slot = slotsById.get(slotId);
                      const periodLabel = slot ? formatPeriodOrdinalLabel(slot) : slotId;
                      const teacherLabel = assignment.teacherId ? (facultyById.get(assignment.teacherId)?.name || assignment.teacherId) : "(none)";

                      existing.periods.push(periodLabel);
                      existing.cellKeys.push(cellKey);
                      if (!existing.teachers.includes(teacherLabel)) {
                        existing.teachers.push(teacherLabel);
                      }
                      assignedSubjectMap.set(assignment.subjectId, existing);
                    });

                    const missingSubjects = offeredSubjects.filter((subjectItem) => !assignedSubjectMap.has(subjectItem.id));
                    const missingSubjectNames = missingSubjects
                      .map((subjectItem) => sanitizeText(subjectItem?.subjectName))
                      .filter(Boolean);

                    function formatNaturalList(items) {
                      const safeItems = (items || []).map((item) => sanitizeText(item)).filter(Boolean);
                      if (safeItems.length === 0) {
                        return "the missing subject";
                      }

                      if (safeItems.length === 1) {
                        return safeItems[0];
                      }

                      if (safeItems.length === 2) {
                        return `${safeItems[0]} and ${safeItems[1]}`;
                      }

                      return `${safeItems.slice(0, -1).join(", ")}, and ${safeItems[safeItems.length - 1]}`;
                    }
                    const conflictDetail = (conflictDetailsForDisplay || []).find((entry) => sanitizeText(entry?.message) === sanitizeText(conflict));
                    const duplicatePeriods = Array.isArray(conflictDetail?.cellKeys)
                      ? conflictDetail.cellKeys
                        .map((cellKey) => {
                          const [, slotId] = splitCellKey(cellKey);
                          const slot = slotsById.get(slotId);
                          return {
                            cellKey,
                            slot,
                            label: slot ? formatPeriodOrdinalLabel(slot) : slotId,
                          };
                        })
                        .filter((entry) => Boolean(entry.cellKey))
                      : [];

                    if (duplicatePeriods.length > 0) {
                      suggestions = duplicatePeriods.map((keepEntry, duplicateIndex) => {
                        const otherPeriods = duplicatePeriods
                          .filter((_, otherIndex) => otherIndex !== duplicateIndex)
                          .map((entry) => entry.label);
                        const subjectsToAssign = otherPeriods.map((_, idx) => missingSubjectNames[idx] || "a missing subject");
                        const missingListText = formatNaturalList(subjectsToAssign);

                        if (otherPeriods.length === 0) {
                          return `This section does not have ${formatNaturalList(missingSubjectNames)}. Keep ${subject} at ${keepEntry.label}.`;
                        }

                        if (otherPeriods.length === 1) {
                          return `This section does not have ${missingListText}. Keep ${subject} at ${keepEntry.label}, and assign ${subjectsToAssign[0]} at ${otherPeriods[0]}.`;
                        }

                        const assignmentsText = formatNaturalList(subjectsToAssign.map((subjectName, idx) => `${subjectName} at ${otherPeriods[idx]}`));
                        return `This section does not have ${missingListText}. Keep ${subject} at ${keepEntry.label}, and assign ${assignmentsText}.`;
                      });
                      const currentMode = conflictSuggestionMode[index] || 0;
                      const activeSuggestion = suggestions[currentMode % suggestions.length] || "";
                      const debugLines = [
                        "[DEBUG] Duplicate Subject Conflict",
                        `Section: ${sectionObj ? formatConflictSectionName(sectionObj) : section}`,
                        `Duplicated Subject: ${subject}`,
                        "Periods where subject is duplicated:",
                      ];

                      duplicatePeriods.forEach((entry, periodIndex) => {
                        const draft = cellEditorDrafts?.[entry.cellKey] || null;
                        const assignment = draft?.subjectId || draft?.teacherId
                          ? {
                            subjectId: draft.subjectId || (schedule?.assignments?.[entry.cellKey]?.subjectId ?? null),
                            teacherId: draft.teacherId || (schedule?.assignments?.[entry.cellKey]?.teacherId ?? null),
                            source: "draft",
                          }
                          : (schedule?.assignments?.[entry.cellKey] || null);
                        const assignedSubject = assignment?.subjectId ? (subjectsById.get(assignment.subjectId)?.subjectName || assignment.subjectId) : "(none)";
                        const assignedTeacher = assignment?.teacherId ? (facultyById.get(assignment.teacherId)?.name || assignment.teacherId) : "(none)";
                        debugLines.push(`  ${periodIndex + 1}. Period: ${entry.label}`);
                        debugLines.push(`     CellKey: ${entry.cellKey}`);
                        debugLines.push(`     Assignment: ${assignment ? JSON.stringify(assignment) : "null"}`);
                        debugLines.push(`     Assigned Subject: ${assignedSubject}`);
                        debugLines.push(`     Assigned Teacher: ${assignedTeacher}`);
                      });

                      if (sectionObj) {
                        debugLines.push(`Subject offerings for ${getScheduleTypeLabel(scheduleType)}:`);
                        if (offeredSubjects.length === 0) {
                          debugLines.push("  [No subject offerings found for this section and schedule type]");
                        } else {
                          offeredSubjects.forEach((subjectItem) => {
                            debugLines.push(`  - ${subjectItem.subjectName}${subjectItem.subjectCode ? ` (${subjectItem.subjectCode})` : ""}`);
                          });
                        }

                        debugLines.push("Assigned subjects in this section:");
                        if (assignedSubjectMap.size === 0) {
                          debugLines.push("  [No assigned subjects found]");
                        } else {
                          Array.from(assignedSubjectMap.values()).forEach((entry) => {
                            debugLines.push(`  - ${entry.label}`);
                            debugLines.push(`    Periods: ${entry.periods.join(", ")}`);
                            debugLines.push(`    CellKeys: ${entry.cellKeys.join(", ")}`);
                            debugLines.push(`    Teachers: ${entry.teachers.join(", ")}`);
                          });
                        }

                        debugLines.push("Missing subjects in this section:");
                        if (missingSubjects.length === 0) {
                          debugLines.push("  [No missing subjects]");
                        } else {
                          missingSubjects.forEach((subjectItem) => {
                            debugLines.push(`  - ${subjectItem.subjectName}${subjectItem.subjectCode ? ` (${subjectItem.subjectCode})` : ""}`);
                          });
                        }
                      } else {
                        debugLines.push("Subject offerings for this schedule type:");
                        debugLines.push("  [Section not found in data, so offerings and missing subjects could not be derived]");
                      }

                      debugLines.push(`Current suggested fix shown: ${activeSuggestion}`);
                      debugInfo = debugLines;
                    } else {
                      suggestions = [
                        `${subject} is assigned more than once for ${section}. Remove the duplicate assignment(s) so that this subject only appears once per section.`,
                        `Keep only one assignment of ${subject} for ${section} and remove the rest.`,
                        `Reassign one of the duplicate periods to a different subject.`,
                      ];
                    }

                    if (!debugInfo) {
                      debugInfo = [
                        "[DEBUG] Duplicate Subject Conflict",
                        `Section: ${section}`,
                        `Duplicated Subject: ${subject}`,
                        "Periods where subject is duplicated:",
                        "  [No duplicate period data found in conflict details]",
                        `Current suggested fix shown: ${suggestions[conflictSuggestionMode[index] || 0] || "(none)"}`,
                      ];
                    }
                  }
                } else if (/lacks subject expertise for (.+)\./i.test(conflict)) {
                  const match = conflict.match(/^(.*?) lacks subject expertise for (.*?)\.$/i);
                  if (match) {
                    const teacher = match[1];
                    const subject = match[2];
                    suggestions = [
                      `${teacher} does not have the required expertise to teach ${subject}. Assign a teacher who is qualified for this subject.`,
                      `Assign a different teacher with expertise in ${subject}.`,
                      `Provide training to ${teacher} so they can teach ${subject} in the future.`,
                    ];
                  }
                } else if (/does not match Grade (\d+)/i.test(conflict)) {
                  const match = conflict.match(/^(.*?) does not match Grade (\d+)\.$/i);
                  if (match) {
                    const teacher = match[1];
                    const grade = match[2];
                    suggestions = [
                      `${teacher} is not qualified to teach Grade ${grade}. Assign a teacher who is qualified for Grade ${grade}.`,
                      `Assign a teacher with Grade ${grade} qualifications.`,
                      `Move this assignment to a grade that matches ${teacher}'s qualifications.`,
                    ];
                  }
                } else if (/has more than one specialized subject assigned \((.+)\)\./i.test(conflict)) {
                  const match = conflict.match(/^(.*?) has more than one specialized subject assigned \((.*?)\)\.$/i);
                  if (match) {
                    const section = match[1];
                    function findSectionForSpecializedFix(sectionLabel) {
                      let sectionObj = sections.find((sec) => sanitizeText(formatConflictSectionName(sec)).toLowerCase() === sanitizeText(sectionLabel).toLowerCase());
                      if (!sectionObj) {
                        sectionObj = sections.find((sec) => {
                          const code = sec.code || "";
                          const name = sec.name || "";
                          const grade = sec.grade ? String(sec.grade) : "";
                          return (
                            sanitizeText(code).toLowerCase() === sanitizeText(sectionLabel).toLowerCase() ||
                            sanitizeText(name).toLowerCase() === sanitizeText(sectionLabel).toLowerCase() ||
                            sanitizeText(`${grade}${name}`).toLowerCase() === sanitizeText(sectionLabel).toLowerCase() ||
                            sanitizeText(`${grade}-${name}`).toLowerCase() === sanitizeText(sectionLabel).toLowerCase()
                          );
                        });
                      }
                      return sectionObj;
                    }

                    function formatNaturalList(items) {
                      const safeItems = (items || []).map((item) => sanitizeText(item)).filter(Boolean);
                      if (safeItems.length === 0) {
                        return "the missing subject";
                      }

                      if (safeItems.length === 1) {
                        return safeItems[0];
                      }

                      if (safeItems.length === 2) {
                        return `${safeItems[0]} and ${safeItems[1]}`;
                      }

                      return `${safeItems.slice(0, -1).join(", ")}, and ${safeItems[safeItems.length - 1]}`;
                    }

                    const sectionObj = findSectionForSpecializedFix(section);
                    const conflictDetail = (conflictDetailsForDisplay || []).find((entry) => sanitizeText(entry?.message) === sanitizeText(conflict));
                    const specializedEntries = Array.isArray(conflictDetail?.cellKeys)
                      ? conflictDetail.cellKeys
                        .map((cellKey) => {
                          const [, slotId] = splitCellKey(cellKey);
                          const slot = slotsById.get(slotId);
                          const draft = cellEditorDrafts?.[cellKey] || null;
                          const assignment = draft?.subjectId || draft?.teacherId
                            ? {
                              subjectId: draft.subjectId || (schedule?.assignments?.[cellKey]?.subjectId ?? null),
                              teacherId: draft.teacherId || (schedule?.assignments?.[cellKey]?.teacherId ?? null),
                              source: "draft",
                            }
                            : (schedule?.assignments?.[cellKey] || null);
                          const subjectObj = assignment?.subjectId ? subjectsById.get(assignment.subjectId) : null;
                          return {
                            cellKey,
                            slot,
                            label: slot ? formatPeriodOrdinalLabel(slot) : slotId,
                            assignment,
                            subjectObj,
                          };
                        })
                        .filter((entry) => {
                          const type = String(entry?.subjectObj?.subjectType || "").toLowerCase();
                          return Boolean(entry?.cellKey) && type === "specialized";
                        })
                      : [];

                    const offeredSubjects = sectionObj ? getSubjectsForSection(sectionObj, subjects, scheduleType) : [];
                    const sectionCellKeys = sectionObj
                      ? Array.from(new Set([
                        ...Object.keys(schedule?.assignments || {}),
                        ...Object.keys(cellEditorDrafts || {}),
                      ])).filter((cellKey) => splitCellKey(cellKey)[0] === sectionObj.id)
                      : [];

                    const assignedSubjectIds = new Set();
                    sectionCellKeys.forEach((cellKey) => {
                      const draft = cellEditorDrafts?.[cellKey] || null;
                      const assignment = draft?.subjectId || draft?.teacherId
                        ? {
                          subjectId: draft.subjectId || (schedule?.assignments?.[cellKey]?.subjectId ?? null),
                          teacherId: draft.teacherId || (schedule?.assignments?.[cellKey]?.teacherId ?? null),
                        }
                        : (schedule?.assignments?.[cellKey] || null);
                      if (assignment?.subjectId) {
                        assignedSubjectIds.add(assignment.subjectId);
                      }
                    });

                    const missingSubjects = offeredSubjects.filter((subjectItem) => !assignedSubjectIds.has(subjectItem.id));
                    const missingSubjectNames = missingSubjects
                      .map((subjectItem) => sanitizeText(subjectItem?.subjectName))
                      .filter(Boolean);
                    const assignedSubjectMap = new Map();
                    sectionCellKeys.forEach((cellKey) => {
                      const [, slotId] = splitCellKey(cellKey);
                      const slot = slotsById.get(slotId);
                      const draft = cellEditorDrafts?.[cellKey] || null;
                      const assignment = draft?.subjectId || draft?.teacherId
                        ? {
                          subjectId: draft.subjectId || (schedule?.assignments?.[cellKey]?.subjectId ?? null),
                          teacherId: draft.teacherId || (schedule?.assignments?.[cellKey]?.teacherId ?? null),
                          source: "draft",
                        }
                        : (schedule?.assignments?.[cellKey] || null);
                      if (!assignment?.subjectId) {
                        return;
                      }

                      const subjectObj = subjectsById.get(assignment.subjectId);
                      const subjectLabel = subjectObj?.subjectName || subjectObj?.subjectCode || assignment.subjectId;
                      const periodLabel = slot ? formatPeriodOrdinalLabel(slot) : slotId;
                      const teacherLabel = assignment.teacherId ? (facultyById.get(assignment.teacherId)?.name || assignment.teacherId) : "(none)";
                      const existing = assignedSubjectMap.get(assignment.subjectId) || {
                        label: subjectLabel,
                        periods: [],
                        cellKeys: [],
                        teachers: [],
                      };

                      existing.periods.push(periodLabel);
                      existing.cellKeys.push(cellKey);
                      if (!existing.teachers.includes(teacherLabel)) {
                        existing.teachers.push(teacherLabel);
                      }
                      assignedSubjectMap.set(assignment.subjectId, existing);
                    });

                    if (specializedEntries.length > 0) {
                      suggestions = specializedEntries.flatMap((keepSubjectEntry) => {
                        const keptSpecializedLabel = keepSubjectEntry?.subjectObj?.subjectName || keepSubjectEntry?.subjectObj?.subjectCode || "specialized subject";

                        return specializedEntries.map((keepPeriodEntry) => {
                          const reassignEntries = specializedEntries.filter((entry) => entry.cellKey !== keepPeriodEntry.cellKey);
                          const subjectsToAssign = reassignEntries.map((_, assignIndex) => missingSubjectNames[assignIndex] || "a missing subject");
                          const missingListText = formatNaturalList(subjectsToAssign);

                          if (reassignEntries.length === 0) {
                            return `A special section should only have atmost one specialized subject. This section does not have ${formatNaturalList(missingSubjectNames)}. Keep ${keptSpecializedLabel} at ${keepPeriodEntry.label}.`;
                          }

                          if (reassignEntries.length === 1) {
                            return `A special section should only have atmost one specialized subject. This section does not have ${missingListText}. Keep ${keptSpecializedLabel} at ${keepPeriodEntry.label}, and assign ${subjectsToAssign[0]} at ${reassignEntries[0].label}.`;
                          }

                          const assignmentsText = formatNaturalList(reassignEntries.map((entry, assignIndex) => `${subjectsToAssign[assignIndex]} at ${entry.label}`));
                          return `A special section should only have atmost one specialized subject. This section does not have ${missingListText}. Keep ${keptSpecializedLabel} at ${keepPeriodEntry.label}, and assign ${assignmentsText}.`;
                        });
                      });

                      const currentMode = conflictSuggestionMode[index] || 0;
                      const activeSuggestion = suggestions[currentMode % suggestions.length] || "";
                      const debugLines = [
                        "[DEBUG] Multiple Specialized Subject Conflict",
                        `Section: ${sectionObj ? formatConflictSectionName(sectionObj) : section}`,
                        "Specialized subjects involved:",
                      ];

                      specializedEntries.forEach((entry, entryIndex) => {
                        const subjectLabel = entry?.subjectObj?.subjectName || entry?.subjectObj?.subjectCode || "(unknown subject)";
                        const teacherLabel = entry?.assignment?.teacherId
                          ? (facultyById.get(entry.assignment.teacherId)?.name || entry.assignment.teacherId)
                          : "(none)";
                        debugLines.push(`  ${entryIndex + 1}. ${subjectLabel}`);
                        debugLines.push(`     Period: ${entry.label}`);
                        debugLines.push(`     CellKey: ${entry.cellKey}`);
                        debugLines.push(`     Assignment: ${entry.assignment ? JSON.stringify(entry.assignment) : "null"}`);
                        debugLines.push(`     Assigned Teacher: ${teacherLabel}`);
                      });

                      debugLines.push(`Subject offerings for ${getScheduleTypeLabel(scheduleType)}:`);
                      if (offeredSubjects.length === 0) {
                        debugLines.push("  [No subject offerings found for this section and schedule type]");
                      } else {
                        offeredSubjects.forEach((subjectItem) => {
                          debugLines.push(`  - ${subjectItem.subjectName}${subjectItem.subjectCode ? ` (${subjectItem.subjectCode})` : ""}`);
                        });
                      }

                      debugLines.push("Assigned subjects in this section:");
                      if (assignedSubjectMap.size === 0) {
                        debugLines.push("  [No assigned subjects found]");
                      } else {
                        Array.from(assignedSubjectMap.values()).forEach((entry) => {
                          debugLines.push(`  - ${entry.label}`);
                          debugLines.push(`    Periods: ${entry.periods.join(", ")}`);
                          debugLines.push(`    CellKeys: ${entry.cellKeys.join(", ")}`);
                          debugLines.push(`    Teachers: ${entry.teachers.join(", ")}`);
                        });
                      }

                      debugLines.push("Missing subjects in this section:");
                      if (missingSubjects.length === 0) {
                        debugLines.push("  [No missing subjects]");
                      } else {
                        missingSubjects.forEach((subjectItem) => {
                          debugLines.push(`  - ${subjectItem.subjectName}${subjectItem.subjectCode ? ` (${subjectItem.subjectCode})` : ""}`);
                        });
                      }

                      debugLines.push(`Current suggested fix shown: ${activeSuggestion}`);
                      debugInfo = debugLines;
                    } else {
                      const subjects = match[2];
                      suggestions = [
                        `${section} has more than one specialized subject assigned: ${subjects}. Remove one of these specialized subjects so that only one is assigned to this section.`,
                        `Review the specialized subjects assigned to ${section} and keep only the most appropriate one.`,
                        `Consult the curriculum guidelines to determine which specialized subject should remain.`,
                      ];

                      debugInfo = [
                        "[DEBUG] Multiple Specialized Subject Conflict",
                        `Section: ${section}`,
                        "Specialized subjects involved:",
                        `  ${subjects}`,
                        `Current suggested fix shown: ${suggestions[conflictSuggestionMode[index] || 0] || "(none)"}`,
                      ];
                    }
                  }
                } else if (/Invalid assignment reference in (.+)\./i.test(conflict)) {
                  const match = conflict.match(/^Invalid assignment reference in (.*?)\.$/i);
                  if (match) {
                    const ref = match[1];
                    suggestions = [
                      `There is an invalid assignment for ${ref.replace(/-/g, ' ')}. Please review and correct or remove this assignment.`,
                      `Remove or update the invalid assignment for ${ref.replace(/-/g, ' ')} to resolve this issue.`,
                      `Check the assignment data for errors or inconsistencies in ${ref.replace(/-/g, ' ')}.`,
                    ];
                  }
                } else if (/period not valid for section settings\./i.test(conflict)) {
                  const match = conflict.match(/^(.*?) (\d+.*?): period not valid for section settings\.$/i);
                  if (match) {
                    const section = match[1];
                    const period = match[2];
                    suggestions = [
                      `The ${period} is not a valid period for ${section} based on its section settings. Move this assignment to a valid period for this section.`,
                      `Check the section settings for ${section} and assign this subject to a valid period.`,
                      `Adjust the section's period configuration to allow for this assignment, if appropriate.`,
                    ];
                  } else {
                    suggestions = [
                      "This period is not valid for the section. Move the assignment to a valid period.",
                      "Assign this subject to a valid period for the section.",
                    ];
                  }
                } else {
                  suggestions = [
                    "Review this conflict and adjust assignments as needed.",
                    "Consult the scheduling guidelines or contact an administrator for further assistance.",
                  ];
                }
              }
              // Determine which suggestion to show
              const mode = conflictSuggestionMode[index] || 0;
              const suggestionToShow = suggestions[mode % suggestions.length];
              return (
                <div
                  key={`${conflict}-${index}`}
                  style={{
                    border: "1.5px dashed #e53935",
                    borderRadius: 10,
                    background: "#fff7f8",
                    padding: 12,
                    color: "#b71c1c",
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                    <div style={{ wordBreak: 'break-word', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{conflict}</div>
                    <div style={{ color: "#7a8bb7", fontSize: 12, fontWeight: 500, wordBreak: 'break-word', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{suggestionToShow}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      style={{
                        border: 'none',
                        borderRadius: 999,
                        minWidth: 110,
                        padding: '6px 18px',
                        background: '#1a3a8c',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(26,58,140,0.08)',
                        opacity: 1,
                        transition: 'background 0.2s',
                      }}
                      onClick={handleApplyFixConflict}
                      title="Apply this fix"
                    >
                      Apply Fix
                    </button>
                    <button
                      type="button"
                      style={{
                        border: 'none',
                        borderRadius: 999,
                        minWidth: 110,
                        padding: '6px 18px',
                        background: '#eaf0fa',
                        color: '#1a3a8c',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(26,58,140,0.08)',
                        opacity: 0.7,
                      }}
                      onClick={() => setConflictSuggestionMode((prev) => ({ ...prev, [index]: (prev[index] || 0) + 1 }))}
                      title="See other options"
                    >
                      See Other Option
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <ScheduleDrawerPanel
        activeDrawerTab={activeDrawerTab}
        setActiveDrawerTab={setActiveDrawerTab}
        draftsForCurrentSchedule={draftsForCurrentSchedule}
        handleLoadDraft={handleLoadDraft}
        handleDeleteDraft={handleDeleteDraft}
        setPreviewDraftModal={setPreviewDraftModal}
        formatDateTime={formatDateTime}
        smallActionStyle={smallActionStyle}
        smallDangerStyle={smallDangerStyle}
        schedule={schedule}
        conflictsForDisplay={conflictsForDisplay}
        handleAutoFixAllConflicts={handleAutoFixAllConflicts}
        secondaryActionStyle={secondaryActionStyle}
        effectiveTeacherRestrictions={effectiveTeacherRestrictions}
        showTeacherRestrictionEditor={showTeacherRestrictionEditor}
        setShowTeacherRestrictionEditor={setShowTeacherRestrictionEditor}
        teacherRestrictionForm={teacherRestrictionForm}
        setTeacherRestrictionForm={setTeacherRestrictionForm}
        ancillaryTaskOptions={ancillaryTaskOptions}
        teacherRestrictionOptions={teacherRestrictionOptions}
        restrictionPeriodOptions={restrictionPeriodOptions}
        addTeacherRestriction={addTeacherRestriction}
        removeTeacherRestriction={removeTeacherRestriction}
        subjectRestrictionsForDisplay={subjectRestrictionsForDisplay}
        showSubjectRestrictionEditor={showSubjectRestrictionEditor}
        setShowSubjectRestrictionEditor={setShowSubjectRestrictionEditor}
        subjectRestrictionForm={subjectRestrictionForm}
        setSubjectRestrictionForm={setSubjectRestrictionForm}
        subjectRestrictionOptions={subjectRestrictionOptions}
        addSubjectRestriction={addSubjectRestriction}
        removeSubjectRestriction={removeSubjectRestriction}
        EMPTY_TEACHER_RESTRICTION_FORM={EMPTY_TEACHER_RESTRICTION_FORM}
        EMPTY_SUBJECT_RESTRICTION_FORM={EMPTY_SUBJECT_RESTRICTION_FORM}
        notice={notice}
        capacityIssues={capacityIssues}
        handleQuickIncreasePeriods={handleQuickIncreasePeriods}
      />
    </div>
  );
}

function DayCheckboxRow({ selectedDays, secondaryDays = [], onToggle }) {
  const activeLookup = new Set(selectedDays);
  const secondaryLookup = new Set(secondaryDays);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 }}>
        {DAYS.map((day) => {
          const active = activeLookup.has(day);
          const secondary = !active && secondaryLookup.has(day);

          return (
            <button
              key={day}
              type="button"
              onClick={() => onToggle(day)}
              style={{
                border: active ? "1px solid #8da0ff" : secondary ? "1px solid #c2d2ff" : "1px solid #d8dfef",
                borderRadius: 999,
                background: active ? "#3B4197" : secondary ? "#dfe7ff" : "#ffffff",
                color: active ? "#ffffff" : secondary ? "#3f57a0" : "#4a5880",
                padding: "5px 8px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                width: "100%",
                textAlign: "center",
              }}
            >
              {DAY_SHORT_LABELS[day] || day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PeriodStructurePreview({ title, periodMinutes, totalPeriods, breaks, metaLabel }) {
  const timeline = buildPeriodStructureTimeline({ periodMinutes, totalPeriods, breaks });

  return (
    <div style={{ border: "1px solid #e3e7ef", borderRadius: 10, background: "#f8faff", padding: 10, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gap: 6 }}>
        {timeline.map((item) => {
          if (item.type === "break") {
            return (
              <div key={item.id} style={periodBreakRowStyle(item.key)}>
                <span style={{ fontWeight: 700 }}>{item.label}</span>
                <span>{`${item.duration} min`}</span>
              </div>
            );
          }

          return (
            <div key={item.id} style={periodCardStyle(item.tone)}>
              <span style={{ fontWeight: 800 }}>{`P${item.period}`}</span>
              <span>{`${item.start} - ${item.end}`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BreakRow({ label, value, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 100px 1fr 1fr", gap: 8, alignItems: "center" }}>
      <span style={{ color: "#4f5d86", fontSize: 12, fontWeight: 600 }}>{label}</span>

      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#4f5d86", fontSize: 12 }}>
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
        />
        Enabled
      </label>

      <label>
        <input
          type="number"
          min={5}
          max={90}
          value={value.duration}
          onChange={(event) => onChange({ ...value, duration: parseBoundedNumber(event.target.value, 5, 90, 20) })}
          aria-label={`${label} duration in minutes`}
          style={{ ...inputStyle(false), height: 32 }}
        />
      </label>

      <label>
        <input
          type="number"
          min={1}
          max={12}
          value={value.afterPeriod}
          onChange={(event) => onChange({ ...value, afterPeriod: parseBoundedNumber(event.target.value, 1, 12, 4) })}
          aria-label={`${label} after period`}
          style={{ ...inputStyle(false), height: 32 }}
        />
      </label>
    </div>
  );
}

function BreakRowHeader() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 100px 1fr 1fr", gap: 8, alignItems: "center" }}>
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span style={{ color: "#5f6b90", fontSize: 11, fontWeight: 700 }}>Duration (min)</span>
      <span style={{ color: "#5f6b90", fontSize: 11, fontWeight: 700 }}>After Period</span>
    </div>
  );
}

function buildPeriodStructureTimeline({ periodMinutes, totalPeriods, breaks }) {
  const safeMinutes = parseBoundedNumber(periodMinutes, 30, 90, 50);
  const safeTotal = parseBoundedNumber(totalPeriods, 4, 12, 8);
  const enabledBreaks = getEnabledBreaks(breaks).sort((left, right) => left.afterPeriod - right.afterPeriod);
  const breakLookup = new Map(enabledBreaks.map((entry) => [entry.afterPeriod, entry]));

  const timeline = [];
  let cursor = parseTimeToMinutes("07:30");

  for (let period = 1; period <= safeTotal; period += 1) {
    const start = minutesToTime(cursor);
    const endMinutes = cursor + safeMinutes;
    const end = minutesToTime(endMinutes);

    timeline.push({
      id: `period-${period}`,
      type: "period",
      period,
      start,
      end,
      tone: getPeriodTone(period, safeTotal, breaks),
    });

    cursor = endMinutes;

    const breakEntry = breakLookup.get(period);
    if (breakEntry) {
      timeline.push({
        id: `break-${breakEntry.key}-${period}`,
        type: "break",
        key: breakEntry.key,
        label: breakEntry.label,
        duration: breakEntry.duration,
      });

      cursor += breakEntry.duration;
    }
  }

  return timeline;
}

function getPeriodTone(period, totalPeriods, breaks) {
  const morningAfter = breaks?.morning?.enabled ? parseBoundedNumber(breaks.morning.afterPeriod, 1, 12, 2) : null;
  const lunchAfter = breaks?.lunch?.enabled ? parseBoundedNumber(breaks.lunch.afterPeriod, 1, 12, 4) : null;

  if (morningAfter && period <= morningAfter) {
    return "morning";
  }

  if (lunchAfter && period <= lunchAfter) {
    return "midday";
  }

  if (!morningAfter && lunchAfter && period <= lunchAfter) {
    return "morning";
  }

  if (!morningAfter && !lunchAfter && period <= Math.ceil(totalPeriods / 2)) {
    return "morning";
  }

  return "afternoon";
}

function periodCardStyle(tone) {
  const palette = {
    morning: {
      border: "#8cb7ff",
      background: "#eaf2ff",
      color: "#1f4a8f",
    },
    midday: {
      border: "#7ecdbf",
      background: "#e5f7f3",
      color: "#1f6b5f",
    },
    afternoon: {
      border: "#f2b2bd",
      background: "#fff0f3",
      color: "#8b3d4a",
    },
  };

  const toneStyle = palette[tone] || palette.morning;

  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    border: `1px solid ${toneStyle.border}`,
    background: toneStyle.background,
    color: toneStyle.color,
    fontSize: 11,
    padding: "7px 10px",
    fontWeight: 700,
  };
}

function periodBreakRowStyle(key) {
  if (key === "morning") {
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 8,
      border: "1px dashed #f2b63f",
      background: "#fff7df",
      color: "#8a6a21",
      fontSize: 11,
      padding: "6px 10px",
    };
  }

  if (key === "lunch") {
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 8,
      border: "1px dashed #f1a24c",
      background: "#fff1e2",
      color: "#8f5a1d",
      fontSize: 11,
      padding: "6px 10px",
    };
  }

  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    border: "1px dashed #c8cedd",
    background: "#f3f5fa",
    color: "#576387",
    fontSize: 11,
    padding: "6px 10px",
  };
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#50608a", fontSize: 12, fontWeight: 600 }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ margin: 0, color: "#5f6b90", fontSize: 12, fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  );
}

function getBreakConfig(scheduleType, config, breakKey) {
  if (scheduleType === "jhs") {
    return config.jhs.breaks[breakKey];
  }

  return config.shs.breaks[breakKey];
}

function setBreakConfig(scheduleType, setConfig, breakKey, nextBreak) {
  setConfig((prev) => {
    if (scheduleType === "jhs") {
      return {
        ...prev,
        jhs: {
          ...prev.jhs,
          breaks: {
            ...prev.jhs.breaks,
            [breakKey]: {
              ...nextBreak,
            },
          },
        },
      };
    }

    return {
      ...prev,
      shs: {
        ...prev.shs,
        breaks: {
          ...prev.shs.breaks,
          [breakKey]: {
            ...nextBreak,
          },
        },
      },
    };
  });
}

function getSectionsForSchedule(scheduleType, sectionsRaw) {
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
          name: sanitizeText(section?.name) || `Grade ${grade} Section ${index + 1}`,
          classification: sanitizeText(section?.classification) || "Regular",
          track: "",
        }));
      })
      .sort((left, right) => {
        if (left.grade !== right.grade) {
          return left.grade - right.grade;
        }

        return left.name.localeCompare(right.name);
      });
  }

  return [11, 12]
    .flatMap((grade) => {
      const gradeConfig = sectionsRaw?.shs?.[grade];
      const entries = Array.isArray(gradeConfig?.sections) ? gradeConfig.sections : [];

      return entries.map((section, index) => ({
        id: `shs-${grade}-${index}`,
        level: "shs",
        grade,
        name: sanitizeText(section?.name) || `Grade ${grade} Section ${index + 1}`,
        classification: "",
        track: sanitizeText(section?.track).toUpperCase(),
      }));
    })
    .sort((left, right) => {
      if (left.grade !== right.grade) {
        return left.grade - right.grade;
      }

      return left.name.localeCompare(right.name);
    });
}

function normalizeSubjectsList(subjectsRaw) {
  if (!Array.isArray(subjectsRaw)) {
    return [];
  }

  return subjectsRaw
    .map((subject, index) => {
      const code = sanitizeText(subject?.subjectCode).toUpperCase();
      const name = sanitizeText(subject?.subjectName);
      const schoolLevel = String(subject?.schoolLevel || "").toLowerCase() === "shs" ? "shs" : "jhs";
      const subjectType = sanitizeText(subject?.subjectType) || "Core";
      const rawGradeLevel = sanitizeText(subject?.gradeLevel);
      const gradeLevel = schoolLevel === "jhs" ? rawGradeLevel || "7-10" : rawGradeLevel;
      const strand = sanitizeText(subject?.strand).toUpperCase();
      const semester = sanitizeText(subject?.semester);
      const dailyMinutes = parseBoundedNumber(subject?.dailyMinutes, 1, 480, 0);
      const classesPerWeek = parseBoundedNumber(subject?.classesPerWeek, 1, 12, 0);
      const hoursPerWeek = parseBoundedDecimal(subject?.hoursPerWeek, 1, 12, 1);
      const id = sanitizeText(subject?.id) || `${schoolLevel}-${code || name || "subject"}-${gradeLevel}-${semester}-${strand}-${index}`;

      return {
        ...subject,
        id,
        subjectCode: code,
        subjectName: name || "Untitled Subject",
        schoolLevel,
        subjectType,
        gradeLevel,
        strand,
        semester,
        dailyMinutes,
        classesPerWeek,
        hoursPerWeek,
      };
    })
    .filter((subject) => !!subject.subjectName);
}

function extractTeacherAncillaryTasks(teacher) {
  if (!teacher) return [];
  const tasks = new Set();

  const handleEntry = (val) => {
    const clean = sanitizeText(val);
    if (clean) tasks.add(clean);
  };

  if (Array.isArray(teacher.ancillaryAssignments)) {
    teacher.ancillaryAssignments.forEach(handleEntry);
  } else if (typeof teacher.ancillaryAssignments === "string") {
    try {
      const parsed = JSON.parse(teacher.ancillaryAssignments);
      if (Array.isArray(parsed)) parsed.forEach(handleEntry);
      else if (typeof parsed === "string") parsed.split(",").forEach(handleEntry);
    } catch {
      teacher.ancillaryAssignments.split(",").forEach(handleEntry);
    }
  }

  if (teacher.ancillaryTask) handleEntry(teacher.ancillaryTask);
  if (teacher.ancillary) handleEntry(teacher.ancillary);

  return Array.from(tasks);
}

function isPermanentTeacher(teacher) {
  if (!teacher) return false;
  const status = String(teacher.employmentStatus || "").trim().toLowerCase();

  if (status) {
    if (status.includes("regular") || status.includes("permanent")) {
      return true;
    }
    if (status.includes("probationary") || status.includes("part-time") || status.includes("contract") || status.includes("substitute")) {
      return false;
    }
  }

  const pos = String(teacher.position || "").trim().toLowerCase();
  if (pos.includes("regular") || pos.includes("permanent") || pos.includes("master teacher")) {
    return true;
  }

  return false;
}

function normalizeFacultyList(facultyRaw) {
  if (!Array.isArray(facultyRaw)) {
    return [];
  }

  return facultyRaw
    .map((teacher, index) => ({
      ...teacher,
      id: sanitizeText(teacher?.id) || `teacher-${index + 1}`,
      name: sanitizeText(teacher?.name) || `Teacher ${index + 1}`,
      employeeId: sanitizeText(teacher?.employeeId),
      active: teacher?.active !== false,
      isClassAdviser: Boolean(
        teacher?.isClassAdviser ||
        (Array.isArray(teacher?.ancillaryAssignments) && teacher.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
      ),
      advisorySection: sanitizeText(teacher?.advisorySection),
      ancillaryAssignments: extractTeacherAncillaryTasks(teacher),
      unavailablePeriods: normalizeStringArray(teacher?.unavailablePeriods),
      subjectExpertise: normalizeStringArray(teacher?.subjectExpertise),
      gradeLevelAssignments: normalizeStringArray(teacher?.gradeLevelAssignments),
      assignedLoadPercent: Number.isFinite(teacher?.assignedLoadPercent) ? teacher.assignedLoadPercent : 0,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function generateSchedule({ scheduleType, sections, slots, subjects, activeTeachers, config }) {
  const assignments = {};
  const conflicts = [];
  const conflictDetailByKey = new Map();

  const pushConflict = (message, cellKeys = []) => {
    const normalizedMessage = sanitizeText(message);
    if (!normalizedMessage) {
      return;
    }

    const normalizedCellKeys = normalizeStringArray(cellKeys);
    const detailKey = `${normalizedMessage}::${[...normalizedCellKeys].sort().join("|")}`;

    if (!conflictDetailByKey.has(detailKey)) {
      conflictDetailByKey.set(detailKey, {
        message: normalizedMessage,
        cellKeys: normalizedCellKeys,
      });
    }

    conflicts.push(normalizedMessage);
  };

  const teacherBusyBySlot = new Map();
  const teacherLoad = new Map(activeTeachers.map((teacher) => [teacher.id, 0]));
  const teacherAssignedPreps = new Map(activeTeachers.map((teacher) => [teacher.id, new Set()]));

  // Helper to shuffle an array in-place (Fisher-Yates)
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function getSubjectPreparationKey(subj, sec) {
    if (!subj) return "General";
    const name = String(subj.subjectName || subj.name || subj.subjectCode || "Subject").trim();
    if (/\b(?:7|8|9|10|11|12)\b/.test(name)) {
      return name;
    }
    const grade = sec?.grade || subj.gradeLevel;
    if (grade && String(grade) !== "7-10") {
      return `${name} ${grade}`;
    }
    return name;
  }

  // Capacity-based teacher sorting aligned with DepEd DO 005, s. 2024
  // Logic order: Qualification -> Authorized Capacity Ratio -> Minimizing Distinct Preps -> Raw Load
  function sortTeacherCandidates(candidates, subjectItem) {
    const policy = config?.constraints?.teacherAssignmentPolicy || "equal_balance";
    const maxCap = config?.constraints?.maxTeachingLoadCap || 24;
    const enforceCap = config?.constraints?.enforceMaxLoadCap !== false;
    const prepKey = getSubjectPreparationKey(subjectItem);

    return candidates.slice().sort((left, right) => {
      const leftLoad = teacherLoad.get(left.id) || 0;
      const rightLoad = teacherLoad.get(right.id) || 0;

      // DepEd DO 005, s. 2024: Class Advisers receive 1 teaching load credit (5 hours ancillary credit)
      const isLeftAdviser = Boolean(
        left.isClassAdviser ||
        (Array.isArray(left.ancillaryAssignments) && left.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
      );
      const isRightAdviser = Boolean(
        right.isClassAdviser ||
        (Array.isArray(right.ancillaryAssignments) && right.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
      );

      // Part-time working arrangement pro-rating
      const isLeftPartTime = Boolean(
        (left.workingArrangement && String(left.workingArrangement).toLowerCase().includes("part")) ||
        (left.employmentStatus && String(left.employmentStatus).toLowerCase().includes("part"))
      );
      const isRightPartTime = Boolean(
        (right.workingArrangement && String(right.workingArrangement).toLowerCase().includes("part")) ||
        (right.employmentStatus && String(right.employmentStatus).toLowerCase().includes("part"))
      );

      const baseLeftCap = isLeftPartTime ? Math.max(8, Math.round(maxCap * 0.5)) : maxCap;
      const baseRightCap = isRightPartTime ? Math.max(8, Math.round(maxCap * 0.5)) : maxCap;

      const leftCap = isLeftAdviser ? Math.max(12, baseLeftCap - 4) : baseLeftCap;
      const rightCap = isRightAdviser ? Math.max(12, baseRightCap - 4) : baseRightCap;

      // Feature 1: Max Teaching Load Cap constraint
      if (enforceCap) {
        const leftOver = leftLoad >= leftCap;
        const rightOver = rightLoad >= rightCap;
        if (!leftOver && rightOver) return -1;
        if (leftOver && !rightOver) return 1;
      }

      // Feature 2: Teacher qualification and specialization (DepEd DO 005, s. 2024 Priority 2)
      const leftTier = getTeacherExpertiseTier(left, subjectItem);
      const rightTier = getTeacherExpertiseTier(right, subjectItem);
      if (leftTier !== rightTier) return rightTier - leftTier;

      // Feature 3: Minimize Preparation Sprawl (Workload Fairness)
      // If a candidate already teaches this exact preparation in another section, prioritize them (0 new prep)
      const leftPreps = teacherAssignedPreps.get(left.id) || new Set();
      const rightPreps = teacherAssignedPreps.get(right.id) || new Set();
      const leftHasPrep = leftPreps.has(prepKey) ? 1 : 0;
      const rightHasPrep = rightPreps.has(prepKey) ? 1 : 0;
      if (leftHasPrep !== rightHasPrep) {
        return rightHasPrep - leftHasPrep;
      }

      // Feature 4: Capacity-Based Allocation Ratio (assigned load / authorized capacity)
      const leftRatio = leftLoad / Math.max(1, leftCap);
      const rightRatio = rightLoad / Math.max(1, rightCap);

      if (policy === "prioritize_regular") {
        const leftPerm = isPermanentTeacher(left);
        const rightPerm = isPermanentTeacher(right);
        if (leftPerm && !rightPerm) return -1;
        if (!leftPerm && rightPerm) return 1;
      } else if (policy === "hybrid_weighted") {
        const leftPerm = isPermanentTeacher(left) ? 30 : 0;
        const rightPerm = isPermanentTeacher(right) ? 30 : 0;
        const leftScore = leftPerm + Math.max(0, 100 - leftRatio * 100) * 0.7;
        const rightScore = rightPerm + Math.max(0, 100 - rightRatio * 100) * 0.7;
        if (leftScore !== rightScore) return rightScore - leftScore;
      }

      // If utilization differs by more than 4%, assign to teacher with lower utilization ratio
      if (Math.abs(leftRatio - rightRatio) > 0.04) {
        return leftRatio - rightRatio;
      }

      // Tie-breaker 1: Fewer total distinct preparations
      if (leftPreps.size !== rightPreps.size) {
        return leftPreps.size - rightPreps.size;
      }

      // Tie-breaker 2: Raw load
      return leftLoad - rightLoad;
    });
  }

  const CORE_KEYWORDS = ["math", "science", "english", "araling panlipunan", "filipino"];
  const isCore = (subj) => {
    const name = String(subj?.subjectName || "").toLowerCase();
    const code = String(subj?.subjectCode || "").toLowerCase();
    return CORE_KEYWORDS.some((k) => name.includes(k) || code.includes(k));
  };

  const allPlacementRules = getAllPlacementRules(config, scheduleType);

  // 1. Prepare per-section scheduling contexts
  const sectionContexts = sections.map((section) => {
    const eligibleSubjects = shuffleArray(getSubjectsForSection(section, subjects, scheduleType).slice());
    const sectionLabel = formatConflictSectionName(section);

    if (eligibleSubjects.length === 0) {
      pushConflict(`No eligible subjects were found for ${sectionLabel}.`);
    }

    const enhancedEligibleSubjects = eligibleSubjects.map((subj) => {
      const rule = findPlacementRuleForSubject(subj, allPlacementRules);
      if (rule) {
        return {
          ...subj,
          preferredDay: rule.preferredDay || subj.preferredDay,
          preferredPeriodSlot: rule.preferredPeriodSlot || subj.preferredPeriodSlot,
          isDoublePeriod: Boolean(rule.isDoublePeriod ?? subj.isDoublePeriod),
          consecutiveType: rule.consecutiveType || subj.consecutiveType,
          specificPeriods: Array.isArray(rule.specificPeriods) && rule.specificPeriods.length > 0 ? rule.specificPeriods : subj.specificPeriods,
        };
      }
      return subj;
    });

    const remainingHours = enhancedEligibleSubjects.map((subject) => ({
      ...subject,
      required: getSubjectDailySlotRequirement(subject, scheduleType, config),
      remaining: getSubjectDailySlotRequirement(subject, scheduleType, config),
    }));

    const rawSlots = slots.filter((slot) => isSlotValidForSection(section, slot, scheduleType, config));
    const validSlots = rawSlots.slice().sort((left, right) => {
      const pLeft = Number(left.period || 0);
      const pRight = Number(right.period || 0);
      if (pLeft !== pRight) return pLeft - pRight;

      const dLeft = DAYS.indexOf(left.day);
      const dRight = DAYS.indexOf(right.day);
      return (dLeft !== -1 ? dLeft : 99) - (dRight !== -1 ? dRight : 99);
    });

    remainingHours.forEach((subject) => {
      if (subject.required > validSlots.length) {
        pushConflict(
          `${sectionLabel}: ${subject.subjectName} requires ${subject.required} recurring daily period(s), but only ${validSlots.length} period(s) are available in this section template.`
        );
      }
    });

    // Dedicated teacher map per subject for this section
    const sectionTeacherMap = new Map();
    enhancedEligibleSubjects.forEach((subject) => {
      if (isHomeroomOrAdvisorySubject(subject)) {
        return;
      }

      const candidates = activeTeachers.filter(
        (teacher) =>
          doesTeacherMatchGrade(teacher, section.grade) &&
          doesTeacherMatchSubject(teacher, subject)
      );

      const sorted = sortTeacherCandidates(candidates, subject);
      if (sorted.length > 0) {
        sectionTeacherMap.set(subject.id, sorted[0]);
      }
    });

    const subjectDayUsage = new Map();
    const sectionDailyCoreCounts = new Map();
    const dailyPeriodSubjectMap = new Map();
    const assignedSlotIds = new Set();

    function findBestTeacherForSlot(subj, targetSlot) {
      const isMondayP1 = targetSlot.day === "Monday" && Number(targetSlot.period || 0) === 1;
      const isAdviserSlot = isMondayP1 || isHomeroomOrAdvisorySubject(subj);
      const boundTeacher = isAdviserSlot ? null : sectionTeacherMap.get(subj.id);
      let teacherCandidates = [];

      if (
        boundTeacher &&
        isTeacherEligible({
          teacher: boundTeacher,
          subject: subj,
          section,
          slot: targetSlot,
          constraints: config.constraints,
          teacherBusyBySlot,
          excludedSectionId: section.id,
        })
      ) {
        teacherCandidates = [boundTeacher];
      } else {
        const rawEligible = activeTeachers.filter((teacher) =>
          isTeacherEligible({
            teacher,
            subject: subj,
            section,
            slot: targetSlot,
            constraints: config.constraints,
            teacherBusyBySlot,
            excludedSectionId: section.id,
          })
        );
        teacherCandidates = sortTeacherCandidates(rawEligible, subj);
      }

      return teacherCandidates.length > 0 ? teacherCandidates[0] : null;
    }

    function commitSlotAssignment(subj, teacher, targetSlot) {
      const cellKey = createCellKey(section.id, targetSlot.id);
      const tier = getTeacherExpertiseTier(teacher, subj);
      const isMondayP1 = targetSlot.day === "Monday" && Number(targetSlot.period || 0) === 1;
      const isAdviserRole = isHomeroomOrAdvisorySubject(subj) || isMondayP1;
      const tierLabel = isAdviserRole
        ? "Class Adviser"
        : tier === 2
        ? "Primary Expertise"
        : tier === 1
        ? "Secondary Expertise"
        : "General Match";
      const permLabel = isPermanentTeacher(teacher) ? "Permanent / Regular" : "Non-Permanent";
      const loadVal = (teacherLoad.get(teacher.id) || 0) + 1;

      assignments[cellKey] = {
        subjectId: subj.id,
        teacherId: teacher.id,
        source: "auto",
        auditInfo: `${tierLabel} • ${permLabel} • ${loadVal} periods load`,
        updatedAt: new Date().toISOString(),
      };

      subj.remaining -= 1;
      const dayKey = `${targetSlot.day}::${subj.id}`;
      subjectDayUsage.set(dayKey, (subjectDayUsage.get(dayKey) || 0) + 1);
      dailyPeriodSubjectMap.set(`${targetSlot.day}::${Number(targetSlot.period || 0)}`, subj.id);

      const busyForTeacher = teacherBusyBySlot.get(teacher.id) || new Map();
      busyForTeacher.set(targetSlot.id, section.id);
      teacherBusyBySlot.set(teacher.id, busyForTeacher);

      teacherLoad.set(teacher.id, loadVal);
      if (!isHomeroomOrAdvisorySubject(subj)) {
        const prepKey = getSubjectPreparationKey(subj, section);
        const prepsSet = teacherAssignedPreps.get(teacher.id) || new Set();
        prepsSet.add(prepKey);
        teacherAssignedPreps.set(teacher.id, prepsSet);
      }
      assignedSlotIds.add(targetSlot.id);
    }

    return {
      section,
      sectionLabel,
      enhancedEligibleSubjects,
      remainingHours,
      validSlots,
      sectionTeacherMap,
      subjectDayUsage,
      sectionDailyCoreCounts,
      dailyPeriodSubjectMap,
      assignedSlotIds,
      findBestTeacherForSlot,
      commitSlotAssignment,
    };
  });

  // MRV (Minimum Remaining Values) Section Scheduling Ordering:
  // Prioritize special program curriculum sections (SP-STEM, SPA, SPJ) that require specialized faculty
  // and multiple specialized subjects before standard regular sections take flexible slot assignments.
  const getSectionMRVRank = (sec) => {
    const c = String(sec.classification || "").toLowerCase();
    if (c.includes("stem") || c.includes("ste")) return 1; // Highest constraint: 45 periods, scarce STEM enhancement faculty
    if (c.includes("spa")) return 2; // High constraint: scarce arts specialization faculty
    if (c.includes("spj")) return 3; // High constraint: scarce journalism faculty
    return 4; // Regular sections: broad pool of general core/applied faculty
  };

  sectionContexts.sort((a, b) => getSectionMRVRank(a.section) - getSectionMRVRank(b.section));

  // ==========================================
  // PASS 1: GLOBAL PRIORITY SLOT ALLOCATION (LOCKED SUBJECTS ACROSS ALL SECTIONS)
  // ==========================================
  // Strict placement rules (e.g. HGP on Monday Period 1, or any day/slot placement lock)
  // must be allocated FIRST across all sections before any section takes flexible slots.
  // Furthermore, each section's Monday 1st Period teacher is that section's unique Class Adviser
  // and cannot be double-booked across sections.
  sectionContexts.forEach((ctx) => {
    const placementLockedSubjects = ctx.remainingHours.filter((s) => {
      const hasDay = s.preferredDay && s.preferredDay !== "any";
      const hasSlot = s.preferredPeriodSlot && s.preferredPeriodSlot !== "any";
      const hasSpecific = Array.isArray(s.specificPeriods) && s.specificPeriods.length > 0;
      return hasDay || hasSlot || hasSpecific;
    }).sort((left, right) => {
      const leftStrict = (left.preferredDay && left.preferredDay !== "any") && (left.preferredPeriodSlot && left.preferredPeriodSlot !== "any");
      const rightStrict = (right.preferredDay && right.preferredDay !== "any") && (right.preferredPeriodSlot && right.preferredPeriodSlot !== "any");
      if (leftStrict && !rightStrict) return -1;
      if (!leftStrict && rightStrict) return 1;
      return right.required - left.required;
    });

    placementLockedSubjects.forEach((lockedSubj) => {
      while (lockedSubj.remaining > 0) {
        const candidateSlots = ctx.validSlots.filter((slot) => {
          if (ctx.assignedSlotIds.has(slot.id)) return false;
          return !isSubjectRestrictedForSlot(lockedSubj, slot, config.constraints, config, scheduleType);
        });

        if (candidateSlots.length === 0) {
          break;
        }

        let placed = false;
        for (const slot of candidateSlots) {
          const teacher = ctx.findBestTeacherForSlot(lockedSubj, slot);
          if (teacher) {
            ctx.commitSlotAssignment(lockedSubj, teacher, slot);
            placed = true;
            break;
          }
        }

        if (!placed) {
          break;
        }
      }
    });
  });

  // ==========================================
  // PASS 2: GENERAL SLOT ALLOCATION (FLEXIBLE SUBJECTS)
  // ==========================================
  sectionContexts.forEach((ctx) => {
    const {
      section,
      sectionLabel,
      enhancedEligibleSubjects,
      remainingHours,
      validSlots,
      assignedSlotIds,
      subjectDayUsage,
      sectionDailyCoreCounts,
      dailyPeriodSubjectMap,
      findBestTeacherForSlot,
      commitSlotAssignment,
    } = ctx;

    validSlots.forEach((slot) => {
      if (assignedSlotIds.has(slot.id)) {
        return;
      }

      const day = slot.day || "Monday";
      const levelConfig = scheduleType === "jhs" ? config?.jhs : config?.shs;
      const activeDaysList = extractDaysFromLevelConfig(levelConfig)?.daySequence || [];
      const totalDaysCount = activeDaysList.length ? activeDaysList.length : 5;
      const currentPeriodNum = Number(slot.period || 0);
      const prevPeriodSubjectId = dailyPeriodSubjectMap.get(`${day}::${currentPeriodNum - 1}`);

      // Filter candidates that have remaining > 0 AND haven't exceeded daily limit for this day AND not restricted for slot
      let subjectCandidates = shuffleArray(
        remainingHours.filter((subject) => {
          if (subject.remaining <= 0) return false;
          if (isSubjectRestrictedForSlot(subject, slot, config.constraints, config, scheduleType)) return false;

          const classesPerWeek = parseBoundedNumber(subject?.classesPerWeek, 1, 12, 0);
          const maxPerDay = subject.isDoublePeriod
            ? Math.max(2, classesPerWeek > totalDaysCount ? Math.ceil(classesPerWeek / totalDaysCount) : 1)
            : (classesPerWeek > totalDaysCount ? Math.ceil(classesPerWeek / totalDaysCount) : 1);
          const currentDayCount = subjectDayUsage.get(`${day}::${subject.id}`) || 0;

          return currentDayCount < maxPerDay;
        })
      ).sort((left, right) => {
        // Priority 1: Double Period Continuation - if previous period was this subject and it requires double period, place it immediately
        const leftIsPrev = left.id === prevPeriodSubjectId && left.isDoublePeriod;
        const rightIsPrev = right.id === prevPeriodSubjectId && right.isDoublePeriod;
        if (leftIsPrev && !rightIsPrev) return -1;
        if (!leftIsPrev && rightIsPrev) return 1;

        // Priority 2: Placement Lock Priority - Subjects locked to specific day or period should be placed before generic flexible subjects
        const leftLocked = (left.preferredDay && left.preferredDay !== "any") || (left.preferredPeriodSlot && left.preferredPeriodSlot !== "any");
        const rightLocked = (right.preferredDay && right.preferredDay !== "any") || (right.preferredPeriodSlot && right.preferredPeriodSlot !== "any");
        if (leftLocked && !rightLocked) return -1;
        if (!leftLocked && rightLocked) return 1;

        // Priority 3: MRV Scarce Program / Specialization Priority (SPA, SPJ, SP-STEM enhancements)
        const leftIsSpecialized = String(left.subjectType || "").toLowerCase() === "specialized";
        const rightIsSpecialized = String(right.subjectType || "").toLowerCase() === "specialized";
        if (leftIsSpecialized && !rightIsSpecialized) return -1;
        if (!leftIsSpecialized && rightIsSpecialized) return 1;

        // Feature 5: Student Core Subject Balancing across the day
        if (config?.constraints?.enforceStudentCoreBalance !== false) {
          const currentDayCore = sectionDailyCoreCounts.get(day) || 0;
          if (currentDayCore >= 2) {
            const leftIsCore = isCore(left);
            const rightIsCore = isCore(right);
            if (!leftIsCore && rightIsCore) return -1;
            if (leftIsCore && !rightIsCore) return 1;
          }
        }
        return right.remaining - left.remaining;
      });

      // Fallback: If strict daily limit filtering leaves 0 candidates, do NOT assign a second period on the same day
      // unless the subject is explicitly configured as a double period. This prevents illegal same-day duplicate conflicts!
      if (subjectCandidates.length === 0) {
        subjectCandidates = shuffleArray(
          remainingHours.filter((subject) => {
            if (subject.remaining <= 0) return false;
            if (!subject.isDoublePeriod) return false;
            if (isSubjectRestrictedForSlot(subject, slot, config.constraints, config, scheduleType)) return false;
            const currentDayCount = subjectDayUsage.get(`${day}::${subject.id}`) || 0;
            return currentDayCount < 2;
          })
        ).sort((left, right) => right.remaining - left.remaining);
      }

      if (subjectCandidates.length === 0) {
        return;
      }

      let selectedPair = null;

      for (const subject of subjectCandidates) {
        const teacher = findBestTeacherForSlot(subject, slot);
        if (teacher) {
          selectedPair = { subject, teacher };
          break;
        }
      }

      if (!selectedPair) {
        pushConflict(`No eligible teacher is available for ${sectionLabel} at ${formatPeriodOrdinalLabel(slot)}.`, [createCellKey(section.id, slot.id)]);
        return;
      }

      commitSlotAssignment(selectedPair.subject, selectedPair.teacher, slot);
    });

    // Unmet Subject Recovery Pass: Attempt to fulfill required weekly quota for any subjects that still have remaining hours
    const unmetList = remainingHours.filter((subject) => subject.remaining > 0);
    if (unmetList.length > 0) {
      const levelConfig = scheduleType === "jhs" ? config?.jhs : config?.shs;
      const activeDaysList = extractDaysFromLevelConfig(levelConfig)?.daySequence || [];
      const totalDaysCount = activeDaysList.length || 5;

      unmetList.forEach((subject) => {
        while (subject.remaining > 0) {
          const isDouble = Boolean(subject.isDoublePeriod);
          const classesPerWeek = parseBoundedNumber(subject?.classesPerWeek, 1, 12, 4);
          const maxPerDay = isDouble ? 2 : (classesPerWeek > totalDaysCount ? Math.ceil(classesPerWeek / totalDaysCount) : 1);

          // 1. Direct placement into an empty slot on an open day
          const emptySlots = validSlots.filter((slot) => {
            if (assignedSlotIds.has(slot.id)) return false;
            if (isSubjectRestrictedForSlot(subject, slot, config.constraints, config, scheduleType)) return false;
            const currentDayCount = subjectDayUsage.get(`${slot.day}::${subject.id}`) || 0;
            return currentDayCount < maxPerDay;
          });

          let placed = false;
          for (const emptySlot of emptySlots) {
            const teacher = findBestTeacherForSlot(subject, emptySlot);
            if (teacher) {
              commitSlotAssignment(subject, teacher, emptySlot);
              placed = true;
              break;
            }
          }

          if (placed) continue;

          // 2. Intra-section relocation: shift another flexible subject to an empty slot
          const allEmpty = validSlots.filter((s) => !assignedSlotIds.has(s.id));
          for (const emptySlot of allEmpty) {
            const emptyDay = emptySlot.day || "Monday";
            let swapped = false;

            for (const occSlot of validSlots) {
              if (!assignedSlotIds.has(occSlot.id)) continue;
              const occDay = occSlot.day || "Monday";
              const currentDayCount = subjectDayUsage.get(`${occDay}::${subject.id}`) || 0;
              if (currentDayCount >= maxPerDay) continue;
              if (isSubjectRestrictedForSlot(subject, occSlot, config.constraints, config, scheduleType)) continue;

              const occKey = createCellKey(section.id, occSlot.id);
              const occAssign = assignments[occKey];
              if (!occAssign) continue;
              const occSubject = enhancedEligibleSubjects.find((s) => s.id === occAssign.subjectId);
              if (!occSubject || occSubject.id === subject.id) continue;

              // Do not move placement locked subjects
              const rule = findPlacementRuleForSubject(occSubject, allPlacementRules);
              if (rule || (occSubject.preferredDay && occSubject.preferredDay !== "any") || (occSubject.preferredPeriodSlot && occSubject.preferredPeriodSlot !== "any")) continue;

              // Check if occSubject can move to emptySlot
              if (isSubjectRestrictedForSlot(occSubject, emptySlot, config.constraints, config, scheduleType)) continue;
              const occDayCountOnEmpty = subjectDayUsage.get(`${emptyDay}::${occSubject.id}`) || 0;
              const occClassesPerWeek = parseBoundedNumber(occSubject?.classesPerWeek, 1, 12, 4);
              const occMaxPerDay = occSubject.isDoublePeriod ? 2 : (occClassesPerWeek > totalDaysCount ? Math.ceil(occClassesPerWeek / totalDaysCount) : 1);
              if (occDayCountOnEmpty >= occMaxPerDay) continue;

              // Check if occTeacher is eligible at emptySlot
              const occTeacher = activeTeachers.find((t) => t.id === occAssign.teacherId);
              if (!occTeacher) continue;

              // Temporarily unassign occSlot
              delete assignments[occKey];
              assignedSlotIds.delete(occSlot.id);
              subjectDayUsage.set(`${occDay}::${occSubject.id}`, (subjectDayUsage.get(`${occDay}::${occSubject.id}`) || 1) - 1);
              const busyMapForOcc = teacherBusyBySlot.get(occTeacher.id);
              if (busyMapForOcc) busyMapForOcc.delete(occSlot.id);

              const occTeacherEligible = isTeacherEligible({
                teacher: occTeacher,
                subject: occSubject,
                section,
                slot: emptySlot,
                constraints: config.constraints,
                teacherBusyBySlot,
                excludedSectionId: section.id,
              });

              let targetTeacher = null;
              if (occTeacherEligible) {
                targetTeacher = findBestTeacherForSlot(subject, occSlot);
              }

              if (occTeacherEligible && targetTeacher) {
                commitSlotAssignment(occSubject, occTeacher, emptySlot);
                commitSlotAssignment(subject, targetTeacher, occSlot);
                placed = true;
                swapped = true;
                break;
              } else {
                // Revert
                assignments[occKey] = occAssign;
                assignedSlotIds.add(occSlot.id);
                subjectDayUsage.set(`${occDay}::${occSubject.id}`, (subjectDayUsage.get(`${occDay}::${occSubject.id}`) || 0) + 1);
                if (busyMapForOcc) busyMapForOcc.set(occSlot.id, section.id);
              }
            }

            if (swapped) break;
          }

          if (!placed) {
            break;
          }
        }
      });
    }

    const unmetSubjects = remainingHours.filter((subject) => subject.remaining > 0);
    unmetSubjects.forEach((subject) => {
      const assignedCount = subject.required - subject.remaining;
      pushConflict(
        `${sectionLabel}: ${subject.subjectName} has ${assignedCount} of ${subject.required} required recurring daily period(s) assigned.`
      );
    });
  });

  // Pass to compact schedule: Fill early days (Mon-Thu) up to the end of the day, leaving lesser scheduled classes on the end day of the week (Fri)
  const getSlotSortKey = (slot) => {
    const dIndex = DAYS.indexOf(slot?.day);
    const pNum = Number(slot?.period || 0);
    return (dIndex !== -1 ? dIndex : 99) * 100 + pNum;
  };

  for (let pass = 0; pass < 5; pass++) {
    let movedAny = false;

    sections.forEach((section) => {
      const rawSlots = slots.filter((slot) => isSlotValidForSection(section, slot, scheduleType, config));
      const sortedSlots = rawSlots.slice().sort((left, right) => getSlotSortKey(left) - getSlotSortKey(right));

      const getSubjectsOnDay = (dayName) => {
        const set = new Set();
        sortedSlots.forEach((s) => {
          if (s.day === dayName) {
            const key = createCellKey(section.id, s.id);
            if (assignments[key]) set.add(assignments[key].subjectId);
          }
        });
        return set;
      };

      for (let i = 0; i < sortedSlots.length; i++) {
        const emptySlot = sortedSlots[i];
        const emptyCellKey = createCellKey(section.id, emptySlot.id);
        if (assignments[emptyCellKey]) continue;

        const daySubjects = getSubjectsOnDay(emptySlot.day);
        let candidateMove = null;

        // 1. Try moving a class from a later day/period whose subject is NOT yet assigned on emptySlot's day (Intra-day only)
        for (let j = sortedSlots.length - 1; j > i; j--) {
          const laterSlot = sortedSlots[j];
          if (getSlotSortKey(laterSlot) <= getSlotSortKey(emptySlot)) break;
          if (laterSlot.day !== emptySlot.day) continue;

          const laterCellKey = createCellKey(section.id, laterSlot.id);
          const assignment = assignments[laterCellKey];
          if (!assignment) continue;

          if (daySubjects.has(assignment.subjectId)) continue;

          const subject = subjects.find((s) => s.id === assignment.subjectId);
          const teacher = activeTeachers.find((t) => t.id === assignment.teacherId);
          const rule = findPlacementRuleForSubject(subject, allPlacementRules);
          const isPlacementLocked = Boolean(rule) ||
            (subject?.preferredDay && subject.preferredDay !== "any") ||
            (subject?.preferredPeriodSlot && subject.preferredPeriodSlot !== "any");
          if (isPlacementLocked) continue;

          if (
            teacher &&
            subject &&
            !isSubjectRestrictedForSlot(subject, emptySlot, config.constraints, config, scheduleType) &&
            isTeacherEligible({
              teacher,
              subject,
              section,
              slot: emptySlot,
              constraints: config.constraints,
              teacherBusyBySlot,
              excludedSectionId: section.id,
            })
          ) {
            candidateMove = { emptySlot, emptyCellKey, laterSlot, laterCellKey, assignment, teacher };
            break;
          }
        }

        // 2. Fallback: Try moving any eligible class from a later day/period (Intra-day only)
        if (!candidateMove) {
          for (let j = sortedSlots.length - 1; j > i; j--) {
            const laterSlot = sortedSlots[j];
            if (getSlotSortKey(laterSlot) <= getSlotSortKey(emptySlot)) break;
            if (laterSlot.day !== emptySlot.day) continue;

            const laterCellKey = createCellKey(section.id, laterSlot.id);
            const assignment = assignments[laterCellKey];
            if (!assignment) continue;

            const subject = subjects.find((s) => s.id === assignment.subjectId);
            const teacher = activeTeachers.find((t) => t.id === assignment.teacherId);
            const rule = findPlacementRuleForSubject(subject, allPlacementRules);
            const isPlacementLocked = Boolean(rule) ||
              (subject?.preferredDay && subject.preferredDay !== "any") ||
              (subject?.preferredPeriodSlot && subject.preferredPeriodSlot !== "any");
            if (isPlacementLocked) continue;

            if (
              teacher &&
              subject &&
              !isSubjectRestrictedForSlot(subject, emptySlot, config.constraints, config, scheduleType) &&
              isTeacherEligible({
                teacher,
                subject,
                section,
                slot: emptySlot,
                constraints: config.constraints,
                teacherBusyBySlot,
                excludedSectionId: section.id,
              })
            ) {
              candidateMove = { emptySlot, emptyCellKey, laterSlot, laterCellKey, assignment, teacher };
              break;
            }
          }
        }

        if (candidateMove) {
          const { emptyCellKey: targetKey, laterSlot, laterCellKey: sourceKey, assignment, teacher, emptySlot: targetSlot } = candidateMove;

          assignments[targetKey] = {
            ...assignment,
            updatedAt: new Date().toISOString(),
          };
          delete assignments[sourceKey];

          const busyForTeacher = teacherBusyBySlot.get(teacher.id) || new Map();
          busyForTeacher.delete(laterSlot.id);
          busyForTeacher.set(targetSlot.id, section.id);
          teacherBusyBySlot.set(teacher.id, busyForTeacher);

          movedAny = true;
        }
      }
    });

    if (!movedAny) break;
  }

  const evaluation = evaluateSchedule({
    assignments,
    sections,
    slots,
    subjects,
    teachers: activeTeachers,
    scheduleType,
    config,
  });

  return {
    id: `draft-${Date.now()}`,
    scheduleType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignments,
    conflicts: Array.from(new Set([...conflicts, ...evaluation.conflicts])),
    conflictDetails: mergeConflictDetails(Array.from(conflictDetailByKey.values()), evaluation.conflictDetails),
    teacherLoadPercent: evaluation.teacherLoadPercent,
    status: "draft",
  };
}

function evaluateSchedule({ assignments, sections, slots, subjects, teachers, scheduleType, config }) {
  if (!assignments || Object.keys(assignments).length === 0) {
    return {
      conflicts: [],
      conflictDetails: [],
      teacherLoadPercent: {},
    };
  }

  const sectionsById = new Map(sections.map((section) => [section.id, section]));
  const slotsById = new Map(slots.map((slot) => [slot.id, slot]));
  const subjectsById = new Map(subjects.map((subject) => [subject.id, subject]));
  const teachersById = new Map(teachers.map((teacher) => [teacher.id, teacher]));

  const teacherSlotMap = new Map();
  const conflicts = [];
  const conflictDetails = [];
  const conflictDetailKeys = new Set();
  const teacherLoadCount = new Map();
  const sectionSubjectUsage = new Map();
  const sectionSpecializedSubjectUsage = new Map();

  const pushConflict = (message, cellKeys = []) => {
    const normalizedMessage = sanitizeText(message);
    if (!normalizedMessage) {
      return;
    }

    const normalizedCellKeys = normalizeStringArray(cellKeys);
    const detailKey = `${normalizedMessage}::${[...normalizedCellKeys].sort().join("|")}`;

    if (conflictDetailKeys.has(detailKey)) {
      return;
    }

    conflictDetailKeys.add(detailKey);
    conflicts.push(normalizedMessage);
    conflictDetails.push({
      message: normalizedMessage,
      cellKeys: normalizedCellKeys,
    });
  };

  // First pass: gather all teacher-slot assignments
  const teacherSlotAssignments = new Map(); // teacherId -> slotId -> [{ sectionId, cellKey }]

  Object.entries(assignments || {}).forEach(([cellKey, assignment]) => {
    const [sectionId, slotId] = splitCellKey(cellKey);
    const teacherId = assignment.teacherId;
    if (!teacherId) return;
    if (!teacherSlotAssignments.has(teacherId)) teacherSlotAssignments.set(teacherId, new Map());
    const slotMap = teacherSlotAssignments.get(teacherId);
    if (!slotMap.has(slotId)) slotMap.set(slotId, []);
    slotMap.get(slotId).push({ sectionId, cellKey });
  });

  // Second pass: process assignments and detect conflicts
  Object.entries(assignments || {}).forEach(([cellKey, assignment]) => {
    const [sectionId, slotId] = splitCellKey(cellKey);
    const section = sectionsById.get(sectionId);
    const slot = slotsById.get(slotId);
    const subject = subjectsById.get(assignment.subjectId);
    const teacher = teachersById.get(assignment.teacherId);
    const currentCellKey = createCellKey(sectionId, slotId);

    if (!section || !slot || !subject || !teacher) {
      pushConflict(`Invalid assignment reference in ${cellKey}.`, [cellKey]);
      return;
    }

    if (!isSlotValidForSection(section, slot, scheduleType, config)) {
      pushConflict(`${section.name} ${slot.label}: period not valid for section settings.`, [currentCellKey]);
    }

    const teacherRestrictedPeriods = getTeacherRestrictedPeriods(teacher.id, config.constraints);
    if (matchesRestrictedPeriod(slot, teacherRestrictedPeriods)) {
      pushConflict(`${section.name} ${slot.label}: ${teacher.name} is restricted for this period.`, [currentCellKey]);
    }

    const subjectRestrictedPeriods = getSubjectRestrictedPeriods(subject.id, config.constraints);
    if (matchesRestrictedPeriod(slot, subjectRestrictedPeriods)) {
      pushConflict(`${section.name} ${slot.label}: ${subject.subjectCode || subject.subjectName} is restricted for this period.`, [currentCellKey]);
    }

    if (config.constraints.enforceUnavailablePeriods) {
      const unavailable = matchesUnavailablePeriod(slot, teacher.unavailablePeriods);
      if (unavailable) {
        pushConflict(`${section.name} ${slot.label}: ${teacher.name} is unavailable.`, [currentCellKey]);
      }
    }

    if (config.constraints.enforceExpertiseAndGradeMatch) {
      if (!doesTeacherMatchGrade(teacher, section.grade)) {
        pushConflict(`${section.name} ${slot.label}: ${teacher.name} does not match Grade ${section.grade}.`, [currentCellKey]);
      }

      if (!doesTeacherMatchSubject(teacher, subject)) {
        pushConflict(`${section.name} ${slot.label}: ${teacher.name} lacks subject expertise for ${subject.subjectCode || subject.subjectName}.`, [currentCellKey]);
      }
    }

    // Subject eligibility check for section (strict grade exclusivity & program exclusivity like SP-STEM, SPA, SPJ)
    const eligibleSubjectsForSection = getSubjectsForSection(section, subjects, scheduleType);
    const isSubjectEligible = eligibleSubjectsForSection.some(
      (s) => s.id === subject.id || (s.subjectCode && subject.subjectCode && s.subjectCode.toUpperCase() === subject.subjectCode.toUpperCase())
    );
    if (!isSubjectEligible) {
      const subjectDesc = subject.subjectCode || subject.subjectName;
      const sectionDesc = `${section.name} (Grade ${section.grade} ${section.classification || "Regular"})`;
      pushConflict(
        `${sectionDesc} at ${formatPeriodOrdinalLabel(slot)}: ${subjectDesc} is not eligible for this section.`,
        [currentCellKey]
      );
    }

    // Multiple-booking detection
    if (config.constraints.enforceNoDoubleBooking) {
      const slotMap = teacherSlotAssignments.get(teacher.id);
      const assignmentsInSlot = slotMap ? slotMap.get(slot.id) : [];
      if (assignmentsInSlot && assignmentsInSlot.length > 1) {
        // Only generate the conflict once per slot per teacher
        if (assignmentsInSlot[0].cellKey === cellKey) {
          const sectionLabels = assignmentsInSlot.map(({ sectionId }) => {
            const sec = sectionsById.get(sectionId);
            return sec ? formatConflictSectionName(sec) : sectionId;
          });
          const involvedCellKeys = assignmentsInSlot.map(({ cellKey }) => cellKey);
          let conflictType = '';
          if (assignmentsInSlot.length === 2) {
            conflictType = 'double-booked';
          } else if (assignmentsInSlot.length === 3) {
            conflictType = 'triple-booked';
          } else {
            conflictType = 'multiple-booked';
          }
          pushConflict(
            `${teacher.name} is ${conflictType} at ${formatPeriodOrdinalLabel(slot)} for ${sectionLabels.join(", ")}.`,
            involvedCellKeys
          );
        }
      }
    }

    // DepEd DO 005, s. 2024: Class adviser's HGP period (1 period/wk) is absorbed in their 5.0h advising credit
    const isTeacherAdviser = Boolean(
      teacher.isClassAdviser ||
      (Array.isArray(teacher.ancillaryAssignments) && teacher.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
    );
    const isAdvisoryHGP = isTeacherAdviser && isHomeroomOrAdvisorySubject(subject);
    if (!isAdvisoryHGP) {
      teacherLoadCount.set(teacher.id, (teacherLoadCount.get(teacher.id) || 0) + 1);
    }

    const sectionSubjects = sectionSubjectUsage.get(section.id) || new Map();
    const subjectCells = sectionSubjects.get(subject.id) || [];
    sectionSubjects.set(subject.id, [...subjectCells, currentCellKey]);
    sectionSubjectUsage.set(section.id, sectionSubjects);

    const sectionClassification = sanitizeText(section.classification).toLowerCase();
    const subjectType = sanitizeText(subject.subjectType).toLowerCase();
    const isSpecialSection =
      sectionClassification.includes("special") ||
      sectionClassification.includes("stem") ||
      sectionClassification.includes("spa") ||
      sectionClassification.includes("spj") ||
      sectionClassification.includes("ste");
    const isSpecializedSubject = subjectType === "specialized";

    if (isSpecialSection && isSpecializedSubject) {
      const specializedSubjects = sectionSpecializedSubjectUsage.get(section.id) || new Map();
      const specializedCells = specializedSubjects.get(subject.id) || [];
      specializedSubjects.set(subject.id, [...specializedCells, currentCellKey]);
      sectionSpecializedSubjectUsage.set(section.id, specializedSubjects);
    }
  });

  sectionSubjectUsage.forEach((subjectMap, sectionId) => {
    const section = sectionsById.get(sectionId);
    if (!section) {
      return;
    }

    const sectionLabel = formatConflictSectionName(section);
    const levelConfig = scheduleType === "jhs" ? config?.jhs : config?.shs;
    const activeDays = extractDaysFromLevelConfig(levelConfig)?.daySequence || [];
    const totalDaysCount = activeDays.length || 5;

    subjectMap.forEach((cellKeys, subjectId) => {
      if (!Array.isArray(cellKeys) || cellKeys.length === 0) {
        return;
      }

      const subject = subjectsById.get(subjectId);
      const classesPerWeek = parseBoundedNumber(subject?.classesPerWeek, 1, 12, 4);
      const subjectLabel = subject?.subjectName || subject?.subjectCode || subjectId;

      // Group assigned cell keys by day
      const cellsByDay = new Map();
      cellKeys.forEach((cellKey) => {
        const [, slotId] = splitCellKey(cellKey);
        const slot = slotsById.get(slotId);
        const day = slot?.day || "Monday";
        const existing = cellsByDay.get(day) || [];
        cellsByDay.set(day, [...existing, cellKey]);
      });

      const isDouble = Boolean(subject?.isDoublePeriod);
      const maxAllowedPerDay = isDouble ? 2 : (classesPerWeek > totalDaysCount ? Math.ceil(classesPerWeek / totalDaysCount) : 1);

      // 1. Same-day duplicate check: flag cells if assigned more times than maxAllowedPerDay on the same day
      cellsByDay.forEach((dayCellKeys, day) => {
        if (dayCellKeys.length > maxAllowedPerDay) {
          pushConflict(
            `${subjectLabel} is scheduled ${dayCellKeys.length} times on ${day} for ${sectionLabel} (max ${maxAllowedPerDay} per day).`,
            dayCellKeys
          );
        }
      });

      // 2. Weekly quota check: flag cells if total weekly assignments exceed subject's required classes per week
      if (cellKeys.length > classesPerWeek) {
        pushConflict(
          `${subjectLabel} has ${cellKeys.length} weekly periods assigned for ${sectionLabel}, exceeding required ${classesPerWeek} classes per week.`,
          cellKeys
        );
      }

      const allPlacementRules = getAllPlacementRules(config, scheduleType);
      const pRule = findPlacementRuleForSubject(subject, allPlacementRules);
      const effectiveSubj = pRule ? { ...subject, ...pRule } : (subject || {});

      // 3. Preferred Day Lock check
      if (effectiveSubj?.preferredDay && effectiveSubj.preferredDay !== "any") {
        cellKeys.forEach((cellKey) => {
          const [, slotId] = splitCellKey(cellKey);
          const slot = slotsById.get(slotId);
          if (slot && slot.day !== effectiveSubj.preferredDay) {
            pushConflict(
              `${subjectLabel} is scheduled on ${slot.day} for ${sectionLabel}, but is locked to ${effectiveSubj.preferredDay}.`,
              [cellKey]
            );
          }
        });
      }

      // 4. Preferred Period Slot Lock check
      if (effectiveSubj?.preferredPeriodSlot && effectiveSubj.preferredPeriodSlot !== "any") {
        const prefSlot = String(effectiveSubj.preferredPeriodSlot);
        cellKeys.forEach((cellKey) => {
          const [, slotId] = splitCellKey(cellKey);
          const slot = slotsById.get(slotId);
          if (slot) {
            const pNum = slot.period || extractPeriodNumberFromSlotOrLabel(slot);
            let isMismatch = false;
            let slotDesc = "";

            if (prefSlot.includes("-")) {
              const parts = prefSlot.split("-").map(Number);
              if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                if (pNum < parts[0] || pNum > parts[1]) {
                  isMismatch = true;
                  slotDesc = `${formatPeriodOrdinalLabel({ period: parts[0] })} & ${formatPeriodOrdinalLabel({ period: parts[1] })}`;
                }
              }
            } else if (prefSlot === "first" || prefSlot === "1") {
              if (pNum !== 1) { isMismatch = true; slotDesc = "1st Period"; }
            } else if (prefSlot === "last") {
              const maxP = config?.constraints?.manualPeriodCount || config?.constraints?.periodCount || 7;
              if (pNum < maxP) { isMismatch = true; slotDesc = `Last Period (${formatPeriodOrdinalLabel({ period: maxP })})`; }
            } else if (prefSlot === "morning") {
              const lunchP = config?.constraints?.lunchAfterPeriod || 4;
              if (pNum > lunchP) { isMismatch = true; slotDesc = `Morning Classes (1st Period – ${formatPeriodOrdinalLabel({ period: lunchP })})`; }
            } else if (prefSlot === "afternoon") {
              const lunchP = config?.constraints?.lunchAfterPeriod || 4;
              const maxP = config?.constraints?.manualPeriodCount || config?.constraints?.periodCount || 7;
              if (pNum <= lunchP) { isMismatch = true; slotDesc = `Afternoon Classes (${formatPeriodOrdinalLabel({ period: lunchP + 1 })} – ${formatPeriodOrdinalLabel({ period: maxP })})`; }
            } else if (!isNaN(Number(prefSlot))) {
              if (pNum !== Number(prefSlot)) { isMismatch = true; slotDesc = formatPeriodOrdinalLabel({ period: Number(prefSlot) }); }
            }

            if (isMismatch) {
              pushConflict(
                `${subjectLabel} is scheduled on ${formatPeriodOrdinalLabel({ period: pNum })} for ${sectionLabel}, but is locked to ${slotDesc}.`,
                [cellKey]
              );
            }
          }
        });
      }

      // 5. Double Period Block check
      if (subject?.isDoublePeriod) {
        cellsByDay.forEach((dayCellKeys, day) => {
          if (dayCellKeys.length > 1) {
            const periodNums = dayCellKeys.map((cellKey) => {
              const [, slotId] = splitCellKey(cellKey);
              const slot = slotsById.get(slotId);
              return slot?.period || extractPeriodNumberFromSlotOrLabel(slot);
            }).sort((a, b) => a - b);

            let isConsecutive = false;
            for (let i = 0; i < periodNums.length - 1; i++) {
              if (periodNums[i + 1] - periodNums[i] === 1) {
                isConsecutive = true;
                break;
              }
            }

            if (!isConsecutive) {
              pushConflict(
                `${subjectLabel} requires a Double Period block for ${sectionLabel}, but is scheduled in non-consecutive periods on ${day}.`,
                dayCellKeys
              );
            }
          }
        });
      }
    });
  });

  // 6. Weekly quota under-scheduled check: check ALL sections to ensure all required subjects have their required weekly periods
  sections.forEach((section) => {
    const sectionLabel = formatConflictSectionName(section);
    const subjectMap = sectionSubjectUsage.get(section.id) || new Map();
    const eligibleSubjectsForSection = getSubjectsForSection(section, subjects, scheduleType);
    eligibleSubjectsForSection.forEach((eligibleSubj) => {
      const required = parseBoundedNumber(eligibleSubj?.classesPerWeek, 1, 12, 4);
      const assignedCellKeys = subjectMap.get(eligibleSubj.id) || [];
      const assignedCount = assignedCellKeys.length;
      if (assignedCount < required) {
        const subjectLabel = eligibleSubj?.subjectName || eligibleSubj?.subjectCode || eligibleSubj.id;
        pushConflict(
          `${sectionLabel}: ${subjectLabel} has ${assignedCount} of ${required} required recurring daily period(s) assigned.`
        );
      }
    });
  });

  sectionSpecializedSubjectUsage.forEach((specializedMap, sectionId) => {
    if (specializedMap.size <= 1) {
      return;
    }

    const section = sectionsById.get(sectionId);
    if (!section) {
      return;
    }

    const sectionClassification = sanitizeText(section.classification).toLowerCase();
    // In DepEd curriculum:
    // - SP-STEM sections take multiple STEM specializations (ICT, Dev Reading, Env Science, Elem Algebra)
    // - SPA sections take both TLE and SPA Specialization
    const isStem = sectionClassification.includes("stem") || sectionClassification.includes("ste");
    if (isStem) {
      return;
    }
    const isSpa = sectionClassification.includes("spa");
    if (isSpa && specializedMap.size <= 2) {
      return;
    }

    const sectionLabel = formatConflictSectionName(section);

    const specializedSubjectLabels = Array.from(specializedMap.keys()).map((subjectId) => {
      const subject = subjectsById.get(subjectId);
      return subject?.subjectName || subject?.subjectCode || subjectId;
    });

    const allSpecializedCellKeys = Array.from(specializedMap.values()).flat();
    pushConflict(
      `${sectionLabel} has more than one specialized subject assigned (${specializedSubjectLabels.join(", ")}).`,
      allSpecializedCellKeys
    );
  });

  const teacherLoadPercent = {};
  teachers.forEach((teacher) => {
    const loadCount = teacherLoadCount.get(teacher.id) || 0;
    const isAdviser = Boolean(
      teacher.isClassAdviser ||
      (Array.isArray(teacher.ancillaryAssignments) && teacher.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
    );
    const isPartTime = Boolean(
      (teacher.workingArrangement && String(teacher.workingArrangement).toLowerCase().includes("part")) ||
      (teacher.employmentStatus && String(teacher.employmentStatus).toLowerCase().includes("part"))
    );
    // At 50-60 mins/period, DepEd statutory max contact hours is 30h. For advisers, 25h contact + 5h credit.
    let baseCap = isAdviser ? Math.round(MAX_TEACHER_LOAD_BASE * (25 / 30)) : MAX_TEACHER_LOAD_BASE;
    if (isPartTime) {
      baseCap = Math.max(10, Math.round(baseCap * 0.5));
    }
    teacherLoadPercent[teacher.id] = Math.round((loadCount / (baseCap || 1)) * 100);
  });

  return {
    conflicts,
    conflictDetails,
    teacherLoadPercent,
  };
}

function mergeConflictDetails(baseDetails, evaluationDetails) {
  const merged = new Map();

  [...(Array.isArray(baseDetails) ? baseDetails : []), ...(Array.isArray(evaluationDetails) ? evaluationDetails : [])].forEach((entry) => {
    const message = sanitizeText(entry?.message);
    if (!message) {
      return;
    }

    const cellKeys = normalizeStringArray(entry?.cellKeys);
    const key = `${message}::${[...cellKeys].sort().join("|")}`;
    if (!merged.has(key)) {
      merged.set(key, { message, cellKeys });
    }
  });

  return Array.from(merged.values());
}

function getSubjectsForSection(section, subjects, scheduleType) {
  if (!section || !Array.isArray(subjects)) {
    return [];
  }

  if (scheduleType === "jhs") {
    const sectionGrade = parseGrade(section.grade);
    const rawClassification = String(section.classification || "").trim();

    let classification = "Regular";
    const lowerClass = rawClassification.toLowerCase();
    if (lowerClass.includes("spa")) {
      classification = "SPA";
    } else if (lowerClass.includes("spj")) {
      classification = "SPJ";
    } else if (lowerClass.includes("stem") || lowerClass.includes("ste") || lowerClass.includes("special science")) {
      classification = "SP-STEM";
    } else if (lowerClass.includes("regular")) {
      classification = "Regular";
    }

    const jhsSubjects = subjects.filter((s) => s.schoolLevel === "jhs");

    const matched = jhsSubjects.filter((subject) => {
      const name = String(subject.subjectName || "").trim();
      const code = String(subject.subjectCode || "").trim().toUpperCase();
      const scope = String(subject.programScope || "").trim();
      const lowerScope = scope.toLowerCase();
      const type = String(subject.subjectType || "").trim().toLowerCase();
      const subjectGradeStr = String(subject.gradeLevel || "").trim();

      // STRICT GRADE EXCLUSIVITY:
      // If a subject is strictly exclusive to a grade level (e.g., Grade 7 exclusive subjects like DEVREAD, ELEMALG, ENVSCI, or subjects with explicit grade), it MUST match sectionGrade!
      if (!doesJhsSubjectMatchGrade(subject, sectionGrade)) {
        return false;
      }

      // Check for SP-STEM enhanced / specialized subjects
      const isEnhancedStem =
        code === "DEVREAD" || name.toLowerCase().includes("developmental reading") ||
        code === "ELEMALG" || name.toLowerCase().includes("elementary algebra") ||
        code === "ENVSCI" || name.toLowerCase().includes("environmental science") ||
        code.includes("RESEARCH") || name.toLowerCase().includes("research") ||
        code.includes("BIOTECH") || name.toLowerCase().includes("biotechnology") ||
        lowerScope.includes("stem") || lowerScope.includes("ste");

      if (isEnhancedStem) {
        // EXCLUSIVELY for SP-STEM sections ONLY
        if (classification !== "SP-STEM") {
          return false;
        }
        if (!doesJhsSubjectMatchGrade(subject, sectionGrade)) {
          return false;
        }
        return true;
      }

      // 1. HGP (Homeroom Guidance Program): ALL sections
      if (code === "HGP" || name.toUpperCase() === "HGP" || name.toLowerCase().includes("homeroom guidance")) {
        return true;
      }

      // 2. Aral Program: Regular sections (or targeted intervention sections if configured as Intervention scope)
      if (code === "ARAL" || name.toLowerCase().includes("aral program")) {
        if (lowerScope.includes("intervention")) {
          return Boolean(section.isInterventionSection || section.needsRemediation);
        }
        return classification === "Regular";
      }

      // 3. TLE: Regular and SPA sections ONLY (No TLE subject for SPJ and SP-STEM)
      if (code === "TLE" || name.toUpperCase().includes("TLE") || name.toLowerCase().includes("technology and livelihood")) {
        return classification === "Regular" || classification === "SPA";
      }

      // 4. SPA Specialization: SPA sections ONLY
      if (code === "SPASPEC" || name.toLowerCase().includes("spa specialization") || lowerScope.includes("spa")) {
        return classification === "SPA";
      }

      // 5. ICT: SPJ and SP-STEM sections ONLY
      if (code === "ICT" || name.toUpperCase() === "ICT") {
        return classification === "SPJ" || classification === "SP-STEM";
      }

      // 6. Core Subjects (Mathematics, Science, Filipino, English, Values Education, Araling Panlipunan, MAPEH)
      const isCoreSubjectName = [
        "MATHEMATICS", "SCIENCE", "FILIPINO", "ENGLISH",
        "VALUES EDUCATION", "ARALING PANLIPUNAN", "MAPEH", "ESP", "EDUKASYON SA PAGPAPAKAKATAO"
      ].some((cName) => name.toUpperCase().includes(cName) || code.includes(cName));

      if (isCoreSubjectName) {
        return true;
      }

      // Direct Section-Specific Match:
      // If a subject is explicitly assigned to this section by ID, section name, or program scope:
      const sectionNameLower = String(section.name || "").trim().toLowerCase();
      const isExplicitForThisSection =
        (subject.sectionId && String(subject.sectionId) === String(section.id)) ||
        (subject.sectionName && String(subject.sectionName).trim().toLowerCase() === sectionNameLower) ||
        (subject.exclusiveToSection && String(subject.exclusiveToSection).trim().toLowerCase() === sectionNameLower) ||
        (lowerScope && (lowerScope === sectionNameLower || lowerScope === String(section.id).toLowerCase())) ||
        (Array.isArray(subject.applicableSections) && (
          subject.applicableSections.includes(section.id) ||
          subject.applicableSections.map((s) => String(s).toLowerCase()).includes(sectionNameLower)
        ));

      if (isExplicitForThisSection) {
        return true;
      }

      // Fallback matching based on programScope / subjectType for custom subjects
      if (type === "core" || lowerScope === "universal" || lowerScope === "all") {
        return true;
      }
      if (lowerScope.includes("regular") && classification === "Regular") {
        return true;
      }
      if (lowerScope.includes("spa") && classification === "SPA") {
        return true;
      }
      if (lowerScope.includes("spj") && classification === "SPJ") {
        return true;
      }
      if ((lowerScope.includes("stem") || lowerScope.includes("ste")) && classification === "SP-STEM") {
        return true;
      }

      return false;
    });

    return sortSubjectsByTypeAndName(matched);
  }

  const targetSemester = scheduleType === "shs-first" ? "first semester" : "last semester";

  const filtered = subjects.filter((subject) => {
    if (subject.schoolLevel !== "shs") {
      return false;
    }

    const subjectSemester = String(subject.semester || "").toLowerCase();
    if (subjectSemester !== targetSemester) {
      return false;
    }

    const grade = parseGrade(subject.gradeLevel);
    if (grade !== section.grade) {
      return false;
    }

    const subjectType = String(subject.subjectType || "").toLowerCase();
    if (subjectType === "core") {
      return true;
    }

    const strand = String(subject.strand || "").toUpperCase().trim();
    const secTrack = String(section.track || "").toUpperCase().trim();
    const secCluster = String(section.cluster || "").toUpperCase().trim();
    const isStrandMatch = !!strand && (
      strand === secTrack ||
      secCluster.includes(strand) ||
      strand.includes(secCluster.split(" ")[0]) ||
      secTrack.includes(strand)
    );

    const sectionNameLower = String(section.name || "").trim().toLowerCase();
    const isExplicitForThisSection =
      (subject.sectionId && String(subject.sectionId) === String(section.id)) ||
      (subject.sectionName && String(subject.sectionName).trim().toLowerCase() === sectionNameLower) ||
      (subject.exclusiveToSection && String(subject.exclusiveToSection).trim().toLowerCase() === sectionNameLower);

    return isStrandMatch || isExplicitForThisSection;
  });

  return sortSubjectsByTypeAndName(filtered);
}

function calculateGeneratorPeriodsForSection(section, subjects, scheduleType) {
  // Calculate total periods needed for a section based on subject requirements
  if (!section) {
    return 0;
  }

  const eligibleSubjects = getSubjectsForSection(section, subjects, scheduleType);
  const totalPeriods = eligibleSubjects.reduce((sum, subject) => {
    const classesPerWeek = parseBoundedNumber(subject?.classesPerWeek, 1, 12, 0);
    if (classesPerWeek > 0) {
      return sum + classesPerWeek;
    }

    const hoursPerWeek = parseBoundedDecimal(subject?.hoursPerWeek, 1, 12, 1);
    return sum + Math.max(1, Math.round(hoursPerWeek));
  }, 0);

  return Math.max(1, totalPeriods);
}

function calculateMaxGeneratorPeriodsForSections(sections, subjects, scheduleType) {
  // Calculate maximum periods needed across all visible sections
  if (!Array.isArray(sections) || sections.length === 0) {
    return 0;
  }

  return Math.max(...sections.map((section) => calculateGeneratorPeriodsForSection(section, subjects, scheduleType)));
}

function sortSubjectsByTypeAndName(subjectList) {
  return [...subjectList].sort((left, right) => {
    const typeOrder = compareSubjectTypeRank(left?.subjectType, right?.subjectType);
    if (typeOrder !== 0) {
      return typeOrder;
    }

    const leftName = sanitizeText(left?.subjectName).toLowerCase();
    const rightName = sanitizeText(right?.subjectName).toLowerCase();
    const nameOrder = leftName.localeCompare(rightName);
    if (nameOrder !== 0) {
      return nameOrder;
    }

    const leftCode = sanitizeText(left?.subjectCode).toLowerCase();
    const rightCode = sanitizeText(right?.subjectCode).toLowerCase();
    return leftCode.localeCompare(rightCode);
  });
}

function compareSubjectTypeRank(leftType, rightType) {
  return getSubjectTypeRank(leftType) - getSubjectTypeRank(rightType);
}

function getSubjectTypeRank(type) {
  const normalized = sanitizeText(type).toLowerCase();
  if (normalized === "core" || normalized === "") {
    return 0;
  }

  if (normalized === "specialized") {
    return 1;
  }

  return 2;
}

function getGeneratorPeriodMinutes(subjects, scheduleType, fallbackMinutes) {
  if (scheduleType !== "jhs") {
    return parseBoundedNumber(fallbackMinutes, 30, 120, 50);
  }

  const counts = new Map();
  (Array.isArray(subjects) ? subjects : [])
    .filter((subject) => subject?.schoolLevel === "jhs")
    .forEach((subject) => {
      const dailyMinutes = parseBoundedNumber(subject?.dailyMinutes, 1, 480, 0);
      if (dailyMinutes > 0) {
        counts.set(dailyMinutes, (counts.get(dailyMinutes) || 0) + 1);
      }
    });

  if (counts.size === 0) {
    return parseBoundedNumber(fallbackMinutes, 30, 120, 50);
  }

  let selectedMinutes = parseBoundedNumber(fallbackMinutes, 30, 120, 50);
  let selectedCount = -1;

  counts.forEach((count, minutes) => {
    if (count > selectedCount || (count === selectedCount && minutes > selectedMinutes)) {
      selectedMinutes = minutes;
      selectedCount = count;
    }
  });

  return parseBoundedNumber(selectedMinutes, 30, 120, 50);
}

function extractDaysFromLevelConfig(levelConfig) {
  if (!levelConfig) {
    return {
      regularDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      shortenedDays: [],
      daySequence: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    };
  }

  if (levelConfig.dayAssignments && typeof levelConfig.dayAssignments === "object") {
    const regularDays = [];
    const shortenedDays = [];
    DAYS.forEach((day) => {
      const assignment = levelConfig.dayAssignments[day];
      if (assignment === "regular") regularDays.push(day);
      else if (assignment === "shortened") shortenedDays.push(day);
    });
    const daySequence = DAYS.filter((day) => regularDays.includes(day) || shortenedDays.includes(day));
    if (daySequence.length > 0) {
      return { regularDays, shortenedDays, daySequence };
    }
  }

  const regularDays = normalizeDays(levelConfig.regularDays);
  const shortenedDays = normalizeDays(levelConfig.shortenedDays);
  const daySequence = DAYS.filter((day) => regularDays.includes(day) || shortenedDays.includes(day));
  return {
    regularDays: regularDays.length ? regularDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    shortenedDays,
    daySequence: daySequence.length ? daySequence : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  };
}

function buildSlots(scheduleType, config, options = {}) {
  const levelConfig = scheduleType === "jhs" ? config.jhs : config.shs;
  const { regularDays, shortenedDays, daySequence } = extractDaysFromLevelConfig(levelConfig);

  if (scheduleType === "jhs") {
    const regularPeriodMinutes = options.deriveJhsPeriods
      ? getGeneratorPeriodMinutes(options.subjects, scheduleType, levelConfig?.periodMinutes?.regular || 50)
      : (levelConfig?.periodMinutes?.regular || 50);
    const shortenedPeriodMinutes = options.deriveJhsPeriods
      ? getGeneratorPeriodMinutes(options.subjects, scheduleType, levelConfig?.periodMinutes?.shortened || 45)
      : (levelConfig?.periodMinutes?.shortened || 45);

    const isAutomated = (levelConfig?.periodStructureMode || levelConfig?.periodCalculationMode || "automated") === "automated";
    const maxPeriods = !isAutomated
      ? Math.max(
          Number(levelConfig?.sessions?.regular?.manualPeriodCount || levelConfig?.periods?.regular || levelConfig?.manualPeriodCount || 8),
          Number(levelConfig?.sessions?.shortened?.manualPeriodCount || levelConfig?.periods?.special || levelConfig?.manualPeriodCount || 8),
          1
        )
      : Math.max(
          getDerivedJhsPeriodCount(levelConfig, "regular", regularPeriodMinutes, options.subjects),
          getDerivedJhsPeriodCount(levelConfig, "shortened", shortenedPeriodMinutes, options.subjects),
          1
        );
    const result = [];
    const baseCursor = parseTimeToMinutes(levelConfig.schoolStartTime || "07:30");

    if (options.deriveJhsPeriods) {
      const days = daySequence.length ? daySequence : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

      days.forEach((day) => {
        const isShortenedDay = shortenedDays.includes(day);
        const periodMinutes = isShortenedDay ? shortenedPeriodMinutes : regularPeriodMinutes;
        let dayCursor = baseCursor;

        for (let period = 1; period <= maxPeriods; period += 1) {
          const start = minutesToTime(dayCursor);
          const endMinutes = dayCursor + periodMinutes;
          const end = minutesToTime(endMinutes);

          result.push({
            id: `${day}-P${period}`,
            label: `${day} P${period}`,
            day,
            period,
            start,
            end,
            sessionType: isShortenedDay ? "shortened" : "regular",
          });

          dayCursor = endMinutes;

          getEnabledBreaks(levelConfig.breaks).forEach((entry) => {
            if (entry.afterPeriod === period) {
              dayCursor += entry.duration;
            }
          });
        }
      });

      return result;
    }

    for (let period = 1; period <= maxPeriods; period += 1) {
      const start = minutesToTime(baseCursor);
      const endMinutes = baseCursor + levelConfig.periodMinutes.regular;
      const end = minutesToTime(endMinutes);

      result.push({
        id: `JHS-P${period}`,
        label: `P${period}`,
        day: "All Days",
        period,
        start,
        end,
        sessionType: "all-days",
      });

      baseCursor = endMinutes;

      getEnabledBreaks(levelConfig.breaks).forEach((entry) => {
        if (entry.afterPeriod === period) {
          baseCursor += entry.duration;
        }
      });
    }

    return result;
  }

  const isShsAutomated = (levelConfig?.periodStructureMode || levelConfig?.periodCalculationMode || "automated") === "automated";
  const shsMaxPeriods = !isShsAutomated
    ? Math.max(Number(levelConfig?.sessions?.regular?.manualPeriodCount || levelConfig?.periods?.regular || levelConfig?.periods?.default || 8), 1)
    : (scheduleType === "jhs"
      ? Math.max(levelConfig.periods.regular, levelConfig.periods.special)
      : Math.max(levelConfig.periods.default, ...Object.values(levelConfig.periods.track || {})));

  const result = [];

  daySequence.forEach((day) => {
    const sessionType = shortenedDays.includes(day) ? "shortened" : "regular";
    const periodMinutes = sessionType === "shortened" ? levelConfig.periodMinutes.shortened : levelConfig.periodMinutes.regular;
    let cursor = parseTimeToMinutes("07:30");

    for (let period = 1; period <= shsMaxPeriods; period += 1) {
      const start = minutesToTime(cursor);
      const endMinutes = cursor + periodMinutes;
      const end = minutesToTime(endMinutes);

      result.push({
        id: `${day}-P${period}`,
        label: `${day} P${period}`,
        day,
        period,
        start,
        end,
        sessionType,
      });

      cursor = endMinutes;

      getEnabledBreaks(levelConfig.breaks).forEach((entry) => {
        if (entry.afterPeriod === period) {
          cursor += entry.duration;
        }
      });
    }
  });

  return result;
}

function buildBreakSummary(scheduleType, config) {
  const levelConfig = scheduleType === "jhs" ? config.jhs : config.shs;

  return getEnabledBreaks(levelConfig.breaks)
    .map((entry) => `${entry.label}: ${entry.duration} min after P${entry.afterPeriod}`)
    .sort((left, right) => left.localeCompare(right));
}

function getEnabledBreaks(breakConfig) {
  const entries = [
    { key: "morning", label: "Morning Break" },
    { key: "lunch", label: "Lunch Break" },
    { key: "afternoon", label: "Afternoon Break" },
  ];

  return entries
    .map((entry) => ({ ...entry, ...(breakConfig?.[entry.key] || {}) }))
    .filter((entry) => entry.enabled)
    .map((entry) => ({
      ...entry,
      duration: parseBoundedNumber(entry.duration, 5, 90, entry.key === "lunch" ? 60 : 20),
      afterPeriod: parseBoundedNumber(entry.afterPeriod, 1, 12, 4),
    }));
}

function isSlotValidForSection(section, slot, scheduleType, config) {
  if (!section || !slot) {
    return false;
  }

  if (scheduleType === "jhs") {
    const isSpecial = String(section.classification || "").toLowerCase() === "special";
    const isShortenedSlot =
      slot.sessionType === "shortened" ||
      (Array.isArray(config?.jhs?.shortenedDays) && config.jhs.shortenedDays.includes(slot.day));

    const regularMax = Number(
      config?.jhs?.sessions?.regular?.manualPeriodCount ??
      config?.jhs?.sessions?.regular?.periodCount ??
      (typeof config?.jhs?.periods === "number" ? config.jhs.periods : config?.jhs?.periods?.regular) ??
      config?.jhs?.manualPeriodCount ??
      8
    );

    const shortenedMax = Number(
      config?.jhs?.sessions?.shortened?.manualPeriodCount ??
      config?.jhs?.sessions?.shortened?.periodCount ??
      (typeof config?.jhs?.periods === "object" ? (config?.jhs?.periods?.special || config?.jhs?.periods?.shortened) : undefined) ??
      (typeof config?.jhs?.periods === "number" ? config.jhs.periods : undefined) ??
      config?.jhs?.manualPeriodCount ??
      6
    );

    const configuredMax = isShortenedSlot
      ? shortenedMax
      : isSpecial
        ? Number(config?.jhs?.periods?.special || regularMax)
        : regularMax;

    const maxPeriod = Math.min(Math.max(1, configuredMax || 8), 10);
    return slot.period <= maxPeriod;
  }

  const trackPeriods = config?.shs?.periods?.track?.[String(section.track || "").toUpperCase()];
  const configuredMax = Number.isFinite(trackPeriods)
    ? trackPeriods
    : Number(
        config?.shs?.sessions?.regular?.manualPeriodCount ??
        config?.shs?.periods?.default ??
        (typeof config?.shs?.periods === "number" ? config.shs.periods : config?.shs?.periods?.regular) ??
        8
      );
  const maxPeriod = Math.min(Math.max(1, configuredMax || 8), 10);
  return slot.period <= maxPeriod;
}

function isTeacherEligible({
  teacher,
  subject,
  section,
  slot,
  constraints,
  teacherBusyBySlot,
  excludedSectionId,
  ignoreDoubleBooking = false,
}) {
  if (!teacher || !subject || !section || !slot) {
    return false;
  }

  if (teacher.active === false) {
    return false;
  }

  if (constraints.enforceExpertiseAndGradeMatch) {
    if (!doesTeacherMatchGrade(teacher, section.grade)) {
      return false;
    }

    if (!doesTeacherMatchSubject(teacher, subject)) {
      return false;
    }
  }

  if (constraints.enforceUnavailablePeriods) {
    const unavailable = matchesUnavailablePeriod(slot, teacher.unavailablePeriods);
    if (unavailable) {
      return false;
    }
  }

  const teacherRestrictedPeriods = getTeacherRestrictedPeriods(teacher.id, constraints, teacher);
  if (matchesRestrictedPeriod(slot, teacherRestrictedPeriods)) {
    return false;
  }

  const subjectRestrictedPeriods = getSubjectRestrictedPeriods(subject.id, constraints);
  if (matchesRestrictedPeriod(slot, subjectRestrictedPeriods)) {
    return false;
  }

  if (constraints.enforceNoDoubleBooking && !ignoreDoubleBooking) {
    const teacherBusySlots = teacherBusyBySlot.get(teacher.id);
    if (teacherBusySlots && teacherBusySlots.has(slot.id)) {
      const existingSectionId = teacherBusySlots.get(slot.id);
      if (existingSectionId && existingSectionId !== excludedSectionId) {
        return false;
      }
    }
  }

  return true;
}

function extractPeriodNumberFromSlotOrLabel(slotOrValue) {
  if (typeof slotOrValue === "number" && Number.isFinite(slotOrValue)) {
    return slotOrValue;
  }
  if (!slotOrValue) return 0;
  const raw = typeof slotOrValue === "object"
    ? String(slotOrValue?.period ?? slotOrValue?.label ?? slotOrValue?.id ?? "")
    : String(slotOrValue);
  const digits = raw.replace(/\D/g, "");
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTeacherRestrictedPeriods(teacherId, constraints, teacher = null) {
  const restrictions = Array.isArray(constraints?.teacherRestrictions) ? constraints.teacherRestrictions : [];
  const matched = restrictions.find((entry) => entry.teacherId === teacherId);
  const configPeriods = matched ? normalizeStringArray(matched.periodLabels) : [];
  const teacherUnavailable = teacher ? normalizeStringArray(teacher.unavailablePeriods) : [];
  return Array.from(new Set([...configPeriods, ...teacherUnavailable]));
}

function matchesRestrictedPeriod(slot, restrictedPeriods) {
  const restrictions = normalizeStringArray(restrictedPeriods).map((entry) => sanitizeText(entry).toLowerCase());
  if (!restrictions.length) {
    return false;
  }

  const slotPeriodNum = extractPeriodNumberFromSlotOrLabel(slot);
  const slotLabel = sanitizeText(slot?.label).toLowerCase();
  const slotId = sanitizeText(slot?.id).toLowerCase();

  return restrictions.some((entry) => {
    if (entry === slotLabel || entry === slotId) {
      return true;
    }
    const entryNum = extractPeriodNumberFromSlotOrLabel(entry);
    if (entryNum > 0 && slotPeriodNum > 0 && entryNum === slotPeriodNum) {
      return true;
    }
    return false;
  });
}

function matchesUnavailablePeriod(slot, unavailablePeriods) {
  return matchesRestrictedPeriod(slot, unavailablePeriods);
}

function buildJhsPeriodTimingMap(jhsConfig, sessionType, options = {}) {
  const isShortened = sessionType === "shortened";
  const configuredPeriodCount = isShortened
    ? (jhsConfig?.sessions?.shortened?.manualPeriodCount || jhsConfig?.periods?.special || 6)
    : (jhsConfig?.sessions?.regular?.manualPeriodCount || jhsConfig?.periods?.regular || 8);

  const derivedFromTime = getDerivedJhsPeriodCount(
    jhsConfig,
    sessionType,
    options.periodMinutes,
    options.subjects,
    options.scheduleType
  );
  const isAutomated = jhsConfig?.periodStructureMode === "automated" || jhsConfig?.periodCalculationMode === "automated";
  const maxPeriods = isAutomated
    ? Math.max(derivedFromTime, options.sectionMaxPeriods || 0, 1)
    : configuredPeriodCount;
  const periodMinutes = parseBoundedNumber(
    options.periodMinutes ?? (isShortened ? (jhsConfig?.periodMinutes?.shortened || jhsConfig?.sessions?.shortened?.duration) : (jhsConfig?.periodMinutes?.regular || jhsConfig?.sessions?.regular?.duration)),
    30,
    120,
    50
  );
  const timingMap = new Map();
  let cursor = parseTimeToMinutes(jhsConfig?.schoolStartTime || "07:30");

  for (let period = 1; period <= maxPeriods; period += 1) {
    const start = minutesToTime(cursor);
    const endMinutes = cursor + parseBoundedNumber(periodMinutes, 30, 90, 50);
    const end = minutesToTime(endMinutes);

    timingMap.set(period, { start, end });
    cursor = endMinutes;

    getEnabledBreaks(jhsConfig?.breaks).forEach((entry) => {
      if (entry.afterPeriod === period) {
        cursor += entry.duration;
      }
    });
  }

  return timingMap;
}

function buildGeneratorPeriodTimingMap(jhsConfig, totalPeriods, sessionType) {
  // Build period timing map for schedule generator (subject-driven periods)
  // totalPeriods: total number of periods needed, calculated from subject requirements
  // JHS config controls: start time, end time, period duration, breaks, flag ceremony timing
  if (!Number.isFinite(totalPeriods) || totalPeriods <= 0) {
    return new Map();
  }

  const periodMinutes = sessionType === "shortened" ? jhsConfig?.periodMinutes?.shortened : jhsConfig?.periodMinutes?.regular;
  const timingMap = new Map();
  let cursor = parseTimeToMinutes(jhsConfig?.schoolStartTime || "07:30");

  for (let period = 1; period <= totalPeriods; period += 1) {
    const start = minutesToTime(cursor);
    const endMinutes = cursor + parseBoundedNumber(periodMinutes, 30, 90, 50);
    const end = minutesToTime(endMinutes);

    timingMap.set(period, { start, end });
    cursor = endMinutes;

    // Insert breaks after periods as configured
    getEnabledBreaks(jhsConfig?.breaks).forEach((entry) => {
      if (entry.afterPeriod === period) {
        cursor += entry.duration;
      }
    });
  }

  return timingMap;
}

function getDerivedJhsPeriodCount(jhsConfig, sessionType, periodMinutesOverride, subjects = [], scheduleType = "jhs") {
  const isManual =
    jhsConfig?.periodCalculationMode === "manual" ||
    jhsConfig?.periodStructureMode === "configured" ||
    jhsConfig?.periodStructureMode === "manual";
  if (isManual) {
    const sessionConfig = sessionType === "shortened"
      ? (jhsConfig?.sessions?.shortened || {})
      : (jhsConfig?.sessions?.regular || {});
    const manualCount = Number(
      sessionConfig.manualPeriodCount ??
      (sessionType === "shortened" ? jhsConfig?.periods?.special : jhsConfig?.periods?.regular) ??
      jhsConfig?.manualPeriodCount ??
      8
    );
    return Math.max(1, Math.min(10, manualCount));
  }

  // If curriculum subjects are provided, calculate automated period count dynamically based on required weekly periods
  if (Array.isArray(subjects) && subjects.length > 0) {
    const matchedSubjects = subjects.filter((s) => !s.schoolLevel || s.schoolLevel === scheduleType);
    const targetSubjects = matchedSubjects.length > 0 ? matchedSubjects : subjects;
    const totalWeeklySlots = targetSubjects.reduce(
      (sum, sub) => sum + parseBoundedNumber(sub?.classesPerWeek || sub?.weeklyPeriods || 1, 1, 12, 1),
      0
    );
    const dayAssignments = jhsConfig?.dayAssignments || {};
    const activeDaysFromAssignments = Object.values(dayAssignments).filter((v) => v !== "off").length;
    const activeDaysFromLists = (normalizeDays(jhsConfig?.regularDays).length + normalizeDays(jhsConfig?.shortenedDays).length);
    const activeDaysCount = Math.max(1, activeDaysFromAssignments || activeDaysFromLists || 5);
    const curriculumPeriodsPerDay = Math.max(1, Math.ceil(totalWeeklySlots / activeDaysCount));
    return Math.min(curriculumPeriodsPerDay, 10);
  }

  const startMinutes = parseTimeToMinutes(jhsConfig?.schoolStartTime || "07:30");
  const endMinutes = parseTimeToMinutes(jhsConfig?.schoolEndTime || "16:00");
  const schoolMinutes = Math.max(0, endMinutes - startMinutes);
  const periodMinutes = parseBoundedNumber(
    periodMinutesOverride ?? (sessionType === "shortened" ? jhsConfig?.periodMinutes?.shortened : jhsConfig?.periodMinutes?.regular),
    30,
    120,
    50
  );
  const breakMinutes = getEnabledBreaks(jhsConfig?.breaks).reduce((total, entry) => total + parseBoundedNumber(entry?.duration, 5, 120, 0), 0);
  const flagMinutes = parseBoundedNumber(jhsConfig?.flagCeremonyMinutes, 0, 120, 0);
  const zoneImprovementMinutes = parseBoundedNumber(jhsConfig?.zoneImprovementMinutes, 0, 240, 0);
  const usableMinutes = Math.max(0, schoolMinutes - breakMinutes - flagMinutes - zoneImprovementMinutes);

  if (!Number.isFinite(periodMinutes) || periodMinutes <= 0) {
    return 8;
  }

  return Math.max(1, Math.min(12, Math.floor(usableMinutes / periodMinutes) || 7));
}

function getSubjectRestrictedPeriods(subjectId, constraints) {
  const restrictions = Array.isArray(constraints?.subjectRestrictions) ? constraints.subjectRestrictions : [];
  const matched = restrictions.find((entry) => entry.subjectId === subjectId);
  return matched ? normalizeStringArray(matched.periodLabels) : [];
}

export function getAllPlacementRules(config = null, scheduleType = "jhs") {
  const levelKey = scheduleType === "jhs" ? "jhs" : "shs";
  const fromConfig = [
    ...(Array.isArray(config?.[levelKey]?.constraints?.subjectPlacementRules) ? config[levelKey].constraints.subjectPlacementRules : []),
    ...(Array.isArray(config?.jhs?.constraints?.subjectPlacementRules) ? config.jhs.constraints.subjectPlacementRules : []),
    ...(Array.isArray(config?.shs?.constraints?.subjectPlacementRules) ? config.shs.constraints.subjectPlacementRules : []),
    ...(Array.isArray(config?.constraints?.subjectPlacementRules) ? config.constraints.subjectPlacementRules : []),
  ];

  let fromStorage = [];
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        fromStorage = [
          ...(Array.isArray(parsed?.[levelKey]?.constraints?.subjectPlacementRules) ? parsed[levelKey].constraints.subjectPlacementRules : []),
          ...(Array.isArray(parsed?.jhs?.constraints?.subjectPlacementRules) ? parsed.jhs.constraints.subjectPlacementRules : []),
          ...(Array.isArray(parsed?.shs?.constraints?.subjectPlacementRules) ? parsed.shs.constraints.subjectPlacementRules : []),
          ...(Array.isArray(parsed?.constraints?.subjectPlacementRules) ? parsed.constraints.subjectPlacementRules : []),
        ];
      }
    }
  } catch (e) {
    // fallback
  }

  const seen = new Set();
  const combined = [];
  [...fromConfig, ...fromStorage].forEach((rule) => {
    if (!rule) return;
    const key = `${rule.subjectId || ""}::${rule.subjectCode || ""}::${rule.subjectName || ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(rule);
    }
  });

  return combined;
}

export function findPlacementRuleForSubject(subject, placementRules) {
  if (!subject || !Array.isArray(placementRules) || placementRules.length === 0) {
    return null;
  }

  const subjIdStr = subject.id != null ? String(subject.id).trim().toLowerCase() : "";
  const subjCodeLower = subject.subjectCode ? sanitizeText(subject.subjectCode).trim().toLowerCase() : "";
  const subjNameLower = subject.subjectName ? sanitizeText(subject.subjectName).trim().toLowerCase() : "";

  return (
    placementRules.find((r) => {
      if (!r) return false;

      // 1. Direct ID match
      const rIdStr = r.subjectId != null ? String(r.subjectId).trim().toLowerCase() : "";
      if (subjIdStr && rIdStr && subjIdStr === rIdStr) return true;

      // 2. Subject Code match (exact or prefix/suffix)
      const rCode = sanitizeText(r.subjectCode).trim().toLowerCase();
      if (subjCodeLower && rCode) {
        if (subjCodeLower === rCode) return true;
        if (subjCodeLower.startsWith(rCode) || rCode.startsWith(subjCodeLower)) return true;
      }

      // 3. Subject Name match (exact or substring)
      const rName = sanitizeText(r.subjectName).trim().toLowerCase();
      if (subjNameLower && rName) {
        if (subjNameLower === rName) return true;
        if (subjNameLower.includes(rName) || rName.includes(subjNameLower)) return true;
      }

      // 4. Cross match: rule code against subject name or rule name against subject code
      if (rCode && subjNameLower && (subjNameLower.includes(rCode) || subjNameLower === rCode)) return true;
      if (subjCodeLower && rName && (rName.includes(subjCodeLower) || rName === subjCodeLower)) return true;

      return false;
    }) || null
  );
}

function isSubjectRestrictedForSlot(subject, slot, constraints, extraConfig = null, scheduleType = "jhs") {
  if (!subject || !slot) {
    return false;
  }

  const placementRules = getAllPlacementRules(extraConfig || { constraints }, scheduleType);
  const rule = findPlacementRuleForSubject(subject, placementRules);
  const effectiveSubject = rule ? { ...subject, ...rule } : subject;

  // Check Preferred Day restriction
  if (effectiveSubject.preferredDay && effectiveSubject.preferredDay !== "any") {
    if (slot.day && slot.day !== effectiveSubject.preferredDay) {
      return true;
    }
  }

  // Check Preferred Period Slot restriction
  if (effectiveSubject.preferredPeriodSlot && effectiveSubject.preferredPeriodSlot !== "any") {
    const prefSlot = String(effectiveSubject.preferredPeriodSlot);
    const pNum = slot.period || extractPeriodNumberFromSlotOrLabel(slot);

    if (prefSlot.includes("-")) {
      const parts = prefSlot.split("-").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        if (pNum < parts[0] || pNum > parts[1]) {
          return true;
        }
      }
    } else if (prefSlot === "first" || prefSlot === "1") {
      if (pNum !== 1) return true;
    } else if (prefSlot === "last") {
      const maxP = constraints?.manualPeriodCount || constraints?.periodCount || 7;
      if (pNum < maxP) return true;
    } else if (prefSlot === "morning") {
      const lunchP = constraints?.lunchAfterPeriod || 4;
      if (pNum > lunchP) return true;
    } else if (prefSlot === "afternoon") {
      const lunchP = constraints?.lunchAfterPeriod || 4;
      if (pNum <= lunchP) return true;
    } else if (!isNaN(Number(prefSlot))) {
      if (pNum !== Number(prefSlot)) return true;
    }
  }

  // Check specificPeriods if provided
  if (Array.isArray(effectiveSubject.specificPeriods) && effectiveSubject.specificPeriods.length > 0) {
    const pNum = slot.period || extractPeriodNumberFromSlotOrLabel(slot);
    if (!effectiveSubject.specificPeriods.includes(pNum)) {
      return true;
    }
  }

  const restrictedPeriods = getSubjectRestrictedPeriods(effectiveSubject.id, constraints);
  return matchesRestrictedPeriod(slot, restrictedPeriods);
}

function getTeacherDropdownOptionState({
  teacher,
  subject,
  section,
  slot,
  constraints,
  teacherBusyBySlot,
  excludedSectionId,
}) {
  if (!teacher || !subject || !section || !slot) {
    return { include: false, restricted: false, restrictedReason: "", statusNote: "" };
  }

  if (teacher.active === false) {
    return { include: false, restricted: false, restrictedReason: "", statusNote: "" };
  }

  if (constraints.enforceExpertiseAndGradeMatch) {
    if (!doesTeacherMatchGrade(teacher, section.grade) || !doesTeacherMatchSubject(teacher, subject)) {
      return { include: false, restricted: false, restrictedReason: "", statusNote: "" };
    }
  }

  let restricted = false;
  let restrictedReason = "";
  let statusNote = "";

  if (constraints.enforceNoDoubleBooking) {
    const teacherBusySlots = teacherBusyBySlot.get(teacher.id);
    if (teacherBusySlots && teacherBusySlots.has(slot.id)) {
      const existingSectionId = teacherBusySlots.get(slot.id);
      if (existingSectionId && existingSectionId !== excludedSectionId) {
        statusNote = "Already assigned";
      }
    }
  }

  if (constraints.enforceUnavailablePeriods && matchesUnavailablePeriod(slot, teacher.unavailablePeriods)) {
    restricted = true;
    restrictedReason = restrictedReason || "Unavailable";
  }

  const teacherRestrictedPeriods = getTeacherRestrictedPeriods(teacher.id, constraints);
  if (matchesRestrictedPeriod(slot, teacherRestrictedPeriods)) {
    restricted = true;
    restrictedReason = restrictedReason || "Restricted";
  }

  return { include: true, restricted, restrictedReason, statusNote };
}

function doesTeacherMatchGrade(teacher, grade) {
  if (!teacher || !Array.isArray(teacher.gradeLevelAssignments) || teacher.gradeLevelAssignments.length === 0) {
    return true;
  }
  const gradeNum = String(grade || "").replace(/[^0-9]/g, "");
  return teacher.gradeLevelAssignments.some((entry) => {
    const text = sanitizeText(entry).toLowerCase();
    if (!text) return false;
    const entryNum = text.replace(/[^0-9]/g, "");
    if (gradeNum && entryNum && entryNum.includes(gradeNum)) return true;
    return text.includes(`grade ${grade}`) || text === String(grade) || text.includes("jhs") || text.includes("shs");
  });
}

function checkExpertiseMatch(list, subject) {
  if (!Array.isArray(list) || list.length === 0) return false;
  const code = sanitizeText(subject?.subjectCode).toLowerCase();
  const name = sanitizeText(subject?.subjectName).toLowerCase();

  return list.some((raw) => {
    const entry = sanitizeText(raw).toLowerCase();
    if (!entry) return false;
    if (code && (entry.includes(code) || code.includes(entry))) return true;
    if (name && (entry.includes(name) || name.includes(entry))) return true;

    const mainWord = name.split(/\s+/)[0];
    if (mainWord && mainWord.length >= 3 && entry.includes(mainWord)) return true;

    // Standard DepEd curriculum cross-subject / specialized program discipline mappings:
    // 1. Developmental Reading, Remedial Reading, Journalism, Creative Writing -> English / Filipino / Language
    if (
      (name.includes("reading") || name.includes("journalism") || name.includes("creative writing") || code === "devread" || code === "spj") &&
      (entry.includes("english") || entry.includes("reading") || entry.includes("literature") || entry.includes("filipino") || entry.includes("language"))
    ) {
      return true;
    }

    // 2. Elementary Algebra, Advanced Math, Geometry, Statistics, Trigonometry, Calculus -> Mathematics
    if (
      (name.includes("algebra") || name.includes("geometry") || name.includes("statistics") || name.includes("calculus") || name.includes("trigonometry") || code === "elemalg") &&
      (entry.includes("math") || entry.includes("mathematics"))
    ) {
      return true;
    }

    // 3. Environmental Science, Biotechnology, Research, Applied Science -> Science
    if (
      (name.includes("science") || name.includes("biotech") || name.includes("research") || code === "envsci" || code.includes("biotech")) &&
      (entry.includes("science") || entry.includes("biology") || entry.includes("chemistry") || entry.includes("physics"))
    ) {
      return true;
    }

    // 4. ICT, Computer, Programming, CSS -> TLE / TVL
    if (
      (name.includes("ict") || name.includes("computer") || code === "ict") &&
      (entry.includes("tle") || entry.includes("tvl") || entry.includes("ict") || entry.includes("technology") || entry.includes("livelihood"))
    ) {
      return true;
    }

    // 5. SPA Specialization, Visual Arts, Music, Dance, Theater -> MAPEH
    if (
      (name.includes("spa") || name.includes("arts") || name.includes("music") || code === "spaspec" || code.includes("spa")) &&
      (entry.includes("mapeh") || entry.includes("music") || entry.includes("arts") || entry.includes("pe") || entry.includes("health") || entry.includes("spa"))
    ) {
      return true;
    }

    // 6. Aral Program / Academic Remediation -> Core Subject Teachers
    if (
      (name.includes("aral") || code === "aral") &&
      (entry.includes("english") || entry.includes("math") || entry.includes("science") || entry.includes("filipino") || entry.includes("reading"))
    ) {
      return true;
    }

    // 7. Values Education / Edukasyon sa Pagpapakatao -> ESP / Values / Araling Panlipunan
    if (
      (name.includes("values") || name.includes("esp") || name.includes("pagpapakatao") || code === "esp" || code === "valed") &&
      (entry.includes("values") || entry.includes("esp") || entry.includes("pagpapakatao") || entry.includes("araling panlipunan") || entry.includes("social"))
    ) {
      return true;
    }

    return false;
  });
}

export function isHomeroomOrAdvisorySubject(subject) {
  if (!subject) return false;
  const code = sanitizeText(subject?.subjectCode).toUpperCase();
  const name = sanitizeText(subject?.subjectName).toLowerCase();
  const type = sanitizeText(subject?.subjectType).toLowerCase();

  return (
    code === "HGP" ||
    code === "HRG" ||
    code === "ADV" ||
    name === "hgp" ||
    name.includes("hgp") ||
    name.includes("homeroom") ||
    name.includes("guidance program") ||
    name.includes("advisory")
  );
}

function getTeacherExpertiseTier(teacher, subject) {
  if (!teacher || !subject) return 0;
  const primary = teacher.primaryExpertise?.length ? teacher.primaryExpertise : teacher.subjectExpertise;
  if (checkExpertiseMatch(primary, subject)) return 2; // Primary expertise (Preferred)
  if (checkExpertiseMatch(teacher.secondaryExpertise, subject)) return 1; // Secondary expertise (Fallback)
  const totalExp = [...(primary || []), ...(teacher.secondaryExpertise || [])];
  if (totalExp.length === 0) return 1; // Unspecified expertise matches all

  // Homeroom / Advisory / HGP:
  // In DepEd, Homeroom Guidance is conducted by the Class Adviser (who is an academic subject teacher).
  // Any active teacher is eligible to be the Class Adviser / Homeroom teacher!
  if (isHomeroomOrAdvisorySubject(subject)) {
    return 1;
  }

  return 0;
}

function doesTeacherMatchSubject(teacher, subject) {
  if (isHomeroomOrAdvisorySubject(subject)) {
    return true;
  }
  return getTeacherExpertiseTier(teacher, subject) > 0;
}

function buildTeacherBusyMap(assignments, sectionsById, slotsById) {
  const teacherBusyBySlot = new Map();

  Object.entries(assignments || {}).forEach(([cellKey, value]) => {
    const [sectionId, slotId] = splitCellKey(cellKey);
    if (!sectionsById.has(sectionId) || !slotsById.has(slotId) || !value?.teacherId) {
      return;
    }

    const teacherMap = teacherBusyBySlot.get(value.teacherId) || new Map();
    teacherMap.set(slotId, sectionId);
    teacherBusyBySlot.set(value.teacherId, teacherMap);
  });

  return teacherBusyBySlot;
}

function persistFacultyLoadPercent(teacherLoadPercent) {
  const facultyList = loadJson(FACULTY_STORAGE_KEY, []);
  if (!Array.isArray(facultyList)) {
    return;
  }

  // Use the same thresholds as FacultyManagement.js
  // 80% of maxBalanced is the minimum for 'Balanced', >100% is 'Overload'
  // We'll use 100 as maxBalanced (percent), so:
  // Unassigned: 0
  // Underload: <80
  // Balanced: 80-100
  // Overload: >100

  const minBalancedPercent = 80;
  const maxBalancedPercent = 100;

  const updated = facultyList.map((teacher) => {
    const nextPercent = Number.isFinite(teacherLoadPercent?.[teacher.id]) ? teacherLoadPercent[teacher.id] : Number(teacher.assignedLoadPercent) || 0;
    let assignedLoadStatus = "Unassigned";
    if (nextPercent === 0) {
      assignedLoadStatus = "Unassigned";
    } else if (nextPercent < minBalancedPercent) {
      assignedLoadStatus = "Underload";
    } else if (nextPercent <= maxBalancedPercent) {
      assignedLoadStatus = "Balanced";
    } else if (nextPercent > maxBalancedPercent) {
      assignedLoadStatus = "Overload";
    }
    return {
      ...teacher,
      assignedLoadPercent: nextPercent,
      assignedLoadStatus,
      updatedAt: new Date().toISOString(),
    };
  });

  saveJson(FACULTY_STORAGE_KEY, updated);
  dispatchFacultyUpdatedEvent();
}

function persistFacultyUnavailablePeriods(periodsByTeacherId) {
  const facultyList = loadJson(FACULTY_STORAGE_KEY, []);
  if (!Array.isArray(facultyList)) {
    return;
  }

  const rawUpdates = periodsByTeacherId && typeof periodsByTeacherId === "object" ? periodsByTeacherId : {};
  const updates = Object.entries(rawUpdates).reduce((accumulator, [teacherId, periods]) => {
    const normalizedTeacherId = sanitizeText(teacherId);
    if (!normalizedTeacherId) {
      return accumulator;
    }

    accumulator[normalizedTeacherId] = normalizeStringArray(periods);
    return accumulator;
  }, {});

  const updated = facultyList.map((teacher) => {
    const normalizedTeacherId = sanitizeText(teacher?.id);
    if (!normalizedTeacherId || !Object.prototype.hasOwnProperty.call(updates, normalizedTeacherId)) {
      return teacher;
    }

    return {
      ...teacher,
      unavailablePeriods: updates[normalizedTeacherId],
      updatedAt: new Date().toISOString(),
    };
  });

  saveJson(FACULTY_STORAGE_KEY, updated);
  dispatchFacultyUpdatedEvent();
}

function dispatchFacultyUpdatedEvent() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("turotugma:faculty-updated"));
}

function buildEffectiveTeacherRestrictions(configRestrictions, facultyList) {
  const map = new Map();

  normalizeTeacherRestrictions(configRestrictions).forEach((entry) => {
    map.set(entry.teacherId, {
      teacherId: entry.teacherId,
      teacherName: sanitizeText(entry.teacherName) || entry.teacherId,
      periodLabels: normalizeStringArray(entry.periodLabels),
      updatedAt: normalizeTimestamp(entry.updatedAt),
    });
  });

  (Array.isArray(facultyList) ? facultyList : []).forEach((teacher) => {
    const teacherId = sanitizeText(teacher?.id);
    if (!teacherId) {
      return;
    }

    const unavailable = normalizeStringArray(teacher?.unavailablePeriods);
    if (unavailable.length === 0) {
      return;
    }

    const existing = map.get(teacherId);
    const mergedLabels = Array.from(new Set([...(existing?.periodLabels || []), ...unavailable]));

    map.set(teacherId, {
      teacherId,
      teacherName: sanitizeText(teacher?.name) || existing?.teacherName || teacherId,
      periodLabels: mergedLabels,
      updatedAt: existing?.updatedAt || normalizeTimestamp(teacher?.updatedAt),
    });
  });

  return Array.from(map.values()).sort((left, right) => {
    const byRecent = compareRecentFirst(left?.updatedAt, right?.updatedAt);
    if (byRecent !== 0) {
      return byRecent;
    }

    return sanitizeText(left.teacherName).localeCompare(sanitizeText(right.teacherName));
  });
}

function normalizeTeacherRestrictions(restrictions) {
  if (!Array.isArray(restrictions)) {
    return [];
  }

  return restrictions
    .map((entry) => ({
      teacherId: sanitizeText(entry?.teacherId),
      teacherName: sanitizeText(entry?.teacherName),
      periodLabels: normalizeStringArray(entry?.periodLabels),
      updatedAt: normalizeTimestamp(entry?.updatedAt),
    }))
    .filter((entry) => entry.teacherId);
}

function upsertDraft(drafts, draftToSave) {
  const otherDrafts = drafts.filter((draft) => draft.id !== draftToSave.id);
  return [draftToSave, ...otherDrafts].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

function getDraftsForScheduleType(drafts, scheduleType) {
  return drafts
    .filter((draft) => draft.scheduleType === scheduleType)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

function loadScheduleConfig() {
  const saved = loadJson(CONFIG_STORAGE_KEY, null);
  if (!saved || typeof saved !== "object") {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  const parseLevelConfig = (savedLevel, defaultLevel, levelKey = "jhs") => {
    if (!savedLevel || typeof savedLevel !== "object") return defaultLevel;

    let dayAssignments = savedLevel.dayAssignments || null;
    let regularDays = [];
    let shortenedDays = [];

    if (dayAssignments && typeof dayAssignments === "object") {
      DAYS.forEach((day) => {
        const assignment = dayAssignments[day];
        if (assignment === "regular") regularDays.push(day);
        else if (assignment === "shortened") shortenedDays.push(day);
      });
    } else {
      regularDays = normalizeDays(savedLevel.regularDays);
      shortenedDays = normalizeDays(savedLevel.shortenedDays);
      const defaultWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      defaultWeekdays.forEach((day) => {
        if (!regularDays.includes(day) && !shortenedDays.includes(day)) {
          regularDays.push(day);
        }
      });
      regularDays.sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
    }

    if (regularDays.length === 0 && shortenedDays.length === 0) {
      regularDays = defaultLevel.regularDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      shortenedDays = defaultLevel.shortenedDays || [];
    }

    const schoolStartTime = sanitizeText(savedLevel.schoolStartTime) || defaultLevel.schoolStartTime || "07:30";
    const schoolEndTime = sanitizeText(savedLevel.schoolEndTime) || defaultLevel.schoolEndTime || "16:30";

    const regDuration = savedLevel.sessions?.regular?.duration || savedLevel.periodMinutes?.regular || defaultLevel.periodMinutes?.regular || 50;
    const shortDuration = savedLevel.sessions?.shortened?.duration || savedLevel.periodMinutes?.shortened || defaultLevel.periodMinutes?.shortened || 45;

    const breaks = {
      morning: savedLevel.sessions?.regular?.breaks?.morning || savedLevel.breaks?.morning || defaultLevel.breaks?.morning || { enabled: true, duration: 20, afterPeriod: 2 },
      lunch: savedLevel.sessions?.regular?.breaks?.lunch || savedLevel.breaks?.lunch || defaultLevel.breaks?.lunch || { enabled: true, duration: 60, afterPeriod: 4 },
      afternoon: savedLevel.sessions?.regular?.breaks?.afternoon || savedLevel.breaks?.afternoon || defaultLevel.breaks?.afternoon || { enabled: false, duration: 15, afterPeriod: 6 },
    };

    const regPeriods = Math.max(1, Math.min(10, Number(savedLevel.sessions?.regular?.manualPeriodCount || savedLevel.periods?.regular || defaultLevel.periods?.regular || 8)));
    const shortPeriods = Math.max(1, Math.min(10, Number(savedLevel.sessions?.shortened?.manualPeriodCount || savedLevel.periods?.special || savedLevel.periods?.shortened || defaultLevel.periods?.special || 7)));

    return {
      ...defaultLevel,
      ...savedLevel,
      periodStructureMode: "configured",
      periodCalculationMode: "manual",
      schoolStartTime,
      schoolEndTime,
      dayAssignments,
      regularDays,
      shortenedDays,
      periodMinutes: { regular: regDuration, shortened: shortDuration },
      periods: { regular: regPeriods, special: shortPeriods, default: regPeriods, track: savedLevel.periods?.track || defaultLevel.periods?.track || { HUMSS: regPeriods, STEM: regPeriods, ABM: regPeriods, TVL: regPeriods, GAS: regPeriods } },
      breaks,
      constraints: {
        ...(defaultLevel.constraints || {}),
        ...(savedLevel.constraints || {}),
      },
    };
  };

  const parsedJhs = parseLevelConfig(saved.jhs, DEFAULT_CONFIG.jhs, "jhs");
  const parsedShs = parseLevelConfig(saved.shs, DEFAULT_CONFIG.shs, "shs");

  const rootConstraints = {
    ...DEFAULT_CONFIG.constraints,
    ...(saved.constraints || {}),
    ...(saved.jhs?.constraints || {}),
    ...(saved.shs?.constraints || {}),
    subjectPlacementRules: [
      ...(Array.isArray(saved.constraints?.subjectPlacementRules) ? saved.constraints.subjectPlacementRules : []),
      ...(Array.isArray(saved.jhs?.constraints?.subjectPlacementRules) ? saved.jhs.constraints.subjectPlacementRules : []),
      ...(Array.isArray(saved.shs?.constraints?.subjectPlacementRules) ? saved.shs.constraints.subjectPlacementRules : []),
    ],
    restrictedPeriodLabels: Array.isArray(saved.constraints?.restrictedPeriodLabels)
      ? saved.constraints.restrictedPeriodLabels.map((item) => sanitizeText(item)).filter(Boolean)
      : [],
    teacherRestrictions: Array.isArray(saved.constraints?.teacherRestrictions)
      ? saved.constraints.teacherRestrictions
        .map((entry) => ({
          teacherId: sanitizeText(entry?.teacherId),
          teacherName: sanitizeText(entry?.teacherName),
          periodLabels: normalizeStringArray(entry?.periodLabels),
          updatedAt: normalizeTimestamp(entry?.updatedAt),
        }))
        .filter((entry) => !!entry.teacherId && entry.periodLabels.length > 0)
      : [],
    subjectRestrictions: Array.isArray(saved.constraints?.subjectRestrictions)
      ? saved.constraints.subjectRestrictions
        .map((entry) => ({
          subjectId: sanitizeText(entry?.subjectId),
          subjectName: sanitizeText(entry?.subjectName),
          subjectCode: sanitizeText(entry?.subjectCode),
          reason: sanitizeText(entry?.reason),
          periodLabels: normalizeStringArray(entry?.periodLabels),
          updatedAt: normalizeTimestamp(entry?.updatedAt),
        }))
        .filter((entry) => !!entry.subjectId && entry.periodLabels.length > 0)
      : [],
  };

  return {
    jhs: parsedJhs,
    shs: parsedShs,
    constraints: rootConstraints,
  };
}

function parseBoundedNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
}

function parseBoundedDecimal(value, min, max, fallback) {
  const parsed = Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
}

function getSubjectDailySlotRequirement(subject, scheduleType, config) {
  const classesPerWeek = parseBoundedNumber(subject?.classesPerWeek, 1, 12, 0);
  const weeklyHours = parseBoundedDecimal(subject?.hoursPerWeek, 1, 12, 1);

  if (classesPerWeek > 0) {
    return classesPerWeek;
  }

  if (scheduleType !== "jhs") {
    return Math.max(1, Math.round(weeklyHours));
  }

  const weeklyMinutesPerDailySlot = getJhsWeeklyMinutesPerDailySlot(config?.jhs);
  if (!Number.isFinite(weeklyMinutesPerDailySlot) || weeklyMinutesPerDailySlot <= 0) {
    return Math.max(1, Math.round(weeklyHours));
  }

  const required = Math.ceil((weeklyHours * 60) / weeklyMinutesPerDailySlot);
  return Math.max(1, required);
}

function getJhsWeeklyMinutesPerDailySlot(jhsConfig) {
  const regularDays = normalizeDays(jhsConfig?.regularDays).length;
  const shortenedDays = normalizeDays(jhsConfig?.shortenedDays).length;
  const regularMinutes = parseBoundedNumber(jhsConfig?.periodMinutes?.regular, 30, 90, 50);
  const shortenedMinutes = parseBoundedNumber(jhsConfig?.periodMinutes?.shortened, 30, 90, 45);

  return regularDays * regularMinutes + shortenedDays * shortenedMinutes;
}

function parseGrade(value) {
  const text = String(value || "");
  const matched = text.match(/\d{1,2}/u);
  if (!matched) {
    return null;
  }

  const parsed = Number.parseInt(matched[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function doesJhsSubjectMatchGrade(subject, grade) {
  const targetGrade = Number.parseInt(grade, 10);
  if (!Number.isFinite(targetGrade)) {
    return true;
  }

  // 1. Check explicit gradeLevel field first
  const gradeText = sanitizeText(subject?.gradeLevel).toLowerCase();
  
  // Range check in gradeLevel (e.g. "7-10", "Grades 7–10", "7 - 10")
  const rangeMatch = gradeText.match(/(\d{1,2})\s*[-–—]\s*(\d{1,2})/u);
  if (rangeMatch) {
    const rangeStart = Number.parseInt(rangeMatch[1], 10);
    const rangeEnd = Number.parseInt(rangeMatch[2], 10);
    if (Number.isFinite(rangeStart) && Number.isFinite(rangeEnd)) {
      return targetGrade >= Math.min(rangeStart, rangeEnd) && targetGrade <= Math.max(rangeStart, rangeEnd);
    }
  }

  if (gradeText === "7-10" || gradeText === "7–10" || gradeText === "jhs" || gradeText.includes("universal") || gradeText.includes("shared")) {
    return true;
  }

  // Exact single grade in gradeLevel field (e.g. "7", "Grade 7")
  const exactGradeMatch = gradeText.match(/^(?:grade\s*)?(\d{1,2})$/u);
  if (exactGradeMatch) {
    return Number.parseInt(exactGradeMatch[1], 10) === targetGrade;
  }

  // 2. Check title / code for explicit grade specification (e.g. "Grade 7", "G7", "Science 7")
  const nameOrCode = `${subject?.subjectName || ""} ${subject?.subjectCode || ""}`.toLowerCase();
  
  // Check if name has a range like "7-10"
  const nameRangeMatch = nameOrCode.match(/(\d{1,2})\s*[-–—]\s*(\d{1,2})/u);
  if (nameRangeMatch) {
    const rStart = Number.parseInt(nameRangeMatch[1], 10);
    const rEnd = Number.parseInt(nameRangeMatch[2], 10);
    if (Number.isFinite(rStart) && Number.isFinite(rEnd)) {
      return targetGrade >= Math.min(rStart, rEnd) && targetGrade <= Math.max(rStart, rEnd);
    }
  }

  const explicitGradeMatch =
    nameOrCode.match(/\b(?:grade|gr|g)\s*[-.]?\s*(7|8|9|10)\b/u) ||
    nameOrCode.match(/\b(?:math|science|english|filipino|ap|ve|mapeh|tle|ict)\s*(7|8|9|10)\b/u);
  if (explicitGradeMatch) {
    const subjectGradeNum = Number.parseInt(explicitGradeMatch[1], 10);
    return subjectGradeNum === targetGrade;
  }

  return true;
}

function normalizeDays(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const lookup = new Set(values.map((day) => sanitizeText(day)));
  return DAYS.filter((day) => lookup.has(day));
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(new Set(values.map((entry) => sanitizeText(entry)).filter(Boolean)));
}

function normalizeTimestamp(value) {
  const raw = sanitizeText(value);
  if (!raw) {
    return "";
  }

  const parsed = new Date(raw).getTime();
  if (Number.isNaN(parsed)) {
    return "";
  }

  return new Date(parsed).toISOString();
}

function compareRecentFirst(leftTimestamp, rightTimestamp) {
  const left = new Date(normalizeTimestamp(leftTimestamp) || 0).getTime();
  const right = new Date(normalizeTimestamp(rightTimestamp) || 0).getTime();
  return right - left;
}

function sanitizeText(value) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/gu, "")
    .trim();
}

function createCellKey(sectionId, slotId) {
  return `${sectionId}|${slotId}`;
}

function splitCellKey(cellKey) {
  const [sectionId, slotId] = String(cellKey || "").split("|");
  return [sectionId, slotId];
}

function formatSectionDisplayName(section) {
  const rawName = sanitizeText(section?.name);
  if (!rawName) {
    return "Section";
  }

  if (section?.level !== "jhs") {
    return rawName;
  }

  const gradeText = String(section?.grade ?? "").trim();
  const escapedGrade = gradeText.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const gradePrefixPattern = new RegExp(`^grade\\s*${escapedGrade}\\s*[-–—]?\\s*`, "iu");
  const baseName = rawName.replace(gradePrefixPattern, "").trim();

  if (!baseName || !gradeText) {
    return rawName;
  }

  return `${gradeText}-${baseName}`;
}

function formatConflictSectionName(section) {
  const label = formatSectionDisplayName(section);
  if (section?.level !== "jhs") {
    return label;
  }

  const compactFormat = label.match(/^(\d+)\s*-\s*(.+)$/u);
  if (compactFormat) {
    return `${compactFormat[1]} - ${compactFormat[2]}`;
  }

  const noSpaceFormat = label.match(/^(\d+)-(.+)$/u);
  if (noSpaceFormat) {
    return `${noSpaceFormat[1]} - ${noSpaceFormat[2]}`;
  }

  return label;
}

function formatPeriodOrdinalLabel(slot) {
  const rawNum = typeof slot === "number" ? slot : (slot?.period ?? slot);
  let periodNumber = Number.parseInt(rawNum, 10);
  if (!Number.isFinite(periodNumber) || periodNumber <= 0) {
    const digits = String(slot?.label || slot?.id || slot || "").replace(/\D/g, "");
    periodNumber = Number.parseInt(digits, 10);
  }
  if (!Number.isFinite(periodNumber) || periodNumber <= 0) {
    return sanitizeText(slot?.label) || "this period";
  }

  const mod100 = periodNumber % 100;
  const mod10 = periodNumber % 10;
  const suffix = mod100 >= 11 && mod100 <= 13 ? "th" : mod10 === 1 ? "st" : mod10 === 2 ? "nd" : mod10 === 3 ? "rd" : "th";
  return `${periodNumber}${suffix} Period`;
}

function loadJson(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function parseTimeToMinutes(timeText) {
  const [hourText, minuteText] = String(timeText || "").split(":");
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return 450;
  }

  return hour * 60 + minute;
}

function minutesToTime(totalMinutes) {
  const safe = Number.isFinite(totalMinutes) ? totalMinutes : 0;
  const normalized = ((safe % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;

  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  const hourText = String(hour12).padStart(2, "0");
  const minuteText = String(minute).padStart(2, "0");
  return `${hourText}:${minuteText} ${meridiem}`;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function getScheduleTypeLabel(scheduleType) {
  const found = SCHEDULE_OPTIONS.find((item) => item.value === scheduleType);
  return found ? found.label : scheduleType;
}

function stickyHeaderCellStyle() {
  return {
    position: "sticky",
    left: 0,
    zIndex: 3,
    minWidth: 190,
    background: "#eff3ff",
    borderBottom: "1px solid #d9e0f0",
    borderRight: "1px solid #d9e0f0",
    padding: "8px 10px",
    textAlign: "left",
    color: "#2c3a74",
    fontSize: 12,
    fontWeight: 800,
  };
}

function headerCellStyle() {
  return {
    minWidth: 160,
    borderBottom: "1px solid #d9e0f0",
    borderRight: "1px solid #e4e9f5",
    background: "#f7f9ff",
    color: "#2c3a74",
    fontSize: 12,
    fontWeight: 700,
    padding: 8,
    textAlign: "center",
    verticalAlign: "top",
  };
}

function stickyRowHeaderCellStyle() {
  return {
    position: "sticky",
    left: 0,
    zIndex: 2,
    minWidth: 190,
    borderBottom: "1px solid #e7ecf6",
    borderRight: "1px solid #d9e0f0",
    background: "#ffffff",
    padding: "8px 10px",
    textAlign: "left",
    verticalAlign: "top",
  };
}

function gridCellStyle(allowed, hasAssignment, hasConflict = false, hasValidAssignment = false) {
  return {
    borderBottom: "1px solid #e7ecf6",
    borderRight: hasConflict ? "1px solid #f0c9cf" : hasValidAssignment ? "1px solid #cde8d4" : "1px solid #edf1f9",
    background: !allowed ? "#f7f8fc" : hasConflict ? "#fff1f3" : hasValidAssignment ? "#edf8f0" : hasAssignment ? "#eef2ff" : "#ffffff",
    textAlign: "center",
    verticalAlign: "middle",
    padding: 6,
    minHeight: 56,
    boxShadow: hasConflict
      ? "inset 0 0 0 2px #e7a7b0"
      : hasValidAssignment
        ? "inset 0 0 0 1px #cde8d4"
        : "none",
  };
}

function inputStyle(hasError = false) {
  return {
    width: "100%",
    height: 36,
    border: hasError ? "1px solid #b53f4e" : "1px solid #cfd7ef",
    borderRadius: 9,
    padding: "0 10px",
    fontSize: 13,
    color: "#1f2c6f",
    boxSizing: "border-box",
    background: "#ffffff",
  };
}

function selectStyle(hasError = false) {
  return {
    ...inputStyle(hasError),
    appearance: "none",
  };
}

function chipStyle() {
  return {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid #cdd5ff",
    background: "#e9edff",
    color: "#3B4197",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  };
}

function sessionToggleButtonStyle(active = false) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    color: active ? "#2f3a73" : "#4f5d86",
    fontSize: 13,
    fontWeight: 700,
    border: active ? "1px solid #cdd5ff" : "1px solid #d8dfef",
    background: active ? "#eef2ff" : "#ffffff",
    borderRadius: 999,
    padding: "7px 14px",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };
}

function restrictionRowStyle() {
  return {
    border: "1px solid #e4e9f5",
    borderRadius: 10,
    padding: "8px 10px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  };
}

function configPanelButtonStyle(active) {
  return {
    border: active ? "1px solid #cdd5ff" : "1px solid #d8dfef",
    background: active ? "#e9edff" : "#ffffff",
    color: active ? "#3B4197" : "#4a5880",
    borderRadius: 9,
    padding: "8px 8px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    lineHeight: 1,
    textAlign: "center",
    minHeight: 40,
  };
}

function saveStatusPillStyle(status) {
  const isSaving = status === "saving";

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    border: isSaving ? "1px solid #d8dfef" : "1px solid #cde8d4",
    background: isSaving ? "#f4f6fb" : "#edf8f0",
    color: isSaving ? "#4f5d86" : "#2f5f3a",
    padding: "3px 9px",
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  };
}

function ActionButtonLabel({ icon, children }) {
  return (
    <span style={actionButtonLabelStyle()}>
      {icon}
      <span>{children}</span>
    </span>
  );
}

function ActionIcon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

function GenerateIcon() {
  return (
    <ActionIcon>
      <path d="M12 4l1.75 4.25L18 10l-4.25 1.75L12 16l-1.75-4.25L6 10l4.25-1.75L12 4z" />
      <path d="M18.5 4.5l.85 1.95 1.95.85-1.95.85-.85 1.95-.85-1.95-1.95-.85 1.95-.85.85-1.95z" />
      <path d="M6 15.25l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7.7-1.6z" />
    </ActionIcon>
  );
}

function SaveIcon() {
  return (
    <ActionIcon>
      <path d="M5 3h12l4 4v14H3V3h2z" />
      <path d="M7 3v6h10V3" />
      <path d="M7 21v-7h10v7" />
    </ActionIcon>
  );
}

function DraftsIcon() {
  return (
    <ActionIcon>
      <path d="M7 3h10l4 4v14H7z" />
      <path d="M17 3v4h4" />
      <path d="M3 7h4" />
      <path d="M3 12h4" />
      <path d="M3 17h4" />
    </ActionIcon>
  );
}

function WarningIcon() {
  return (
    <ActionIcon>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </ActionIcon>
  );
}

function PublishIcon() {
  return (
    <ActionIcon>
      <path d="M12 15V3" />
      <path d="M8 7l4-4 4 4" />
      <path d="M4 14v5h16v-5" />
    </ActionIcon>
  );
}

function RefreshIcon() {
  return (
    <ActionIcon>
      <path d="M19 7v4h-4" />
      <path d="M19 11a7 7 0 1 0 2.05 4.95" />
    </ActionIcon>
  );
}

function HideConfigIcon() {
  return (
    <ActionIcon>
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
      <path d="M9 9l6 6" />
      <path d="M15 9l-6 6" />
    </ActionIcon>
  );
}

function ShowConfigIcon() {
  return (
    <ActionIcon>
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
      <circle cx="12" cy="12" r="2.5" />
    </ActionIcon>
  );
}

function actionButtonLabelStyle() {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    lineHeight: 1,
  };
}

function primaryActionStyle() {
  return {
    border: "none",
    background: "#3B4197",
    color: "#ffffff",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function secondaryActionStyle() {
  return {
    border: "1px solid #cfd7ef",
    background: "#ffffff",
    color: "#2f3a73",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function dangerActionStyle() {
  return {
    border: "1px solid #e7c4cb",
    background: "#fff6f7",
    color: "#b53f4e",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function smallActionStyle() {
  return {
    border: "1px solid #d3daf0",
    background: "#ffffff",
    color: "#2f3a73",
    borderRadius: 8,
    padding: "6px 8px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  };
}

function cellEditorSelectStyle() {
  return {
    width: "100%",
    height: 24,
    border: "1px solid #cfd7ef",
    borderRadius: 6,
    padding: "0 6px",
    fontSize: 10,
    color: "#1f2c6f",
    background: "#ffffff",
    boxSizing: "border-box",
  };
}

function smallDangerStyle() {
  return {
    ...smallActionStyle(),
    color: "#b53f4e",
    border: "1px solid #e7c4cb",
    background: "#fff6f7",
  };
}

function ScheduleDrawerPanel({
  activeDrawerTab,
  setActiveDrawerTab,
  draftsForCurrentSchedule,
  handleLoadDraft,
  handleDeleteDraft,
  setPreviewDraftModal,
  formatDateTime,
  smallActionStyle,
  smallDangerStyle,
  schedule,
  conflictsForDisplay,
  handleAutoFixAllConflicts,
  secondaryActionStyle,
  effectiveTeacherRestrictions,
  showTeacherRestrictionEditor,
  setShowTeacherRestrictionEditor,
  teacherRestrictionForm,
  setTeacherRestrictionForm,
  ancillaryTaskOptions,
  teacherRestrictionOptions,
  restrictionPeriodOptions,
  addTeacherRestriction,
  removeTeacherRestriction,
  subjectRestrictionsForDisplay,
  showSubjectRestrictionEditor,
  setShowSubjectRestrictionEditor,
  subjectRestrictionForm,
  setSubjectRestrictionForm,
  subjectRestrictionOptions,
  addSubjectRestriction,
  removeSubjectRestriction,
  EMPTY_TEACHER_RESTRICTION_FORM,
  EMPTY_SUBJECT_RESTRICTION_FORM,
  notice,
  capacityIssues = [],
  handleQuickIncreasePeriods,
}) {
  if (!activeDrawerTab) return null;

  const conflictCount = conflictsForDisplay ? conflictsForDisplay.length : (schedule?.conflicts?.length || 0);
  const restrictionCount = (effectiveTeacherRestrictions?.length || 0) + (subjectRestrictionsForDisplay?.length || 0);
  const hasAssignments = Boolean(schedule?.assignments && Object.keys(schedule.assignments).length > 0);

  return (
    <>
      {/* Dark backdrop overlay */}
      <div
        onClick={() => setActiveDrawerTab(null)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.35)",
          backdropFilter: "blur(2px)",
          zIndex: 9998,
        }}
      />

      {/* Right sliding drawer container */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 520,
          maxWidth: "100vw",
          height: "100vh",
          background: "#ffffff",
          boxShadow: "-8px 0 32px rgba(15, 23, 42, 0.18)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Uniform Header Bar */}
        <div
          style={{
            padding: "16px 20px 0 20px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: 0, color: "#1f2c6f", fontSize: 16, fontWeight: 700 }}>
                Schedule Side Panel
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveDrawerTab(null)}
              style={{
                border: "none",
                background: "#cbd5e1",
                color: "#1e293b",
                width: 28,
                height: 28,
                borderRadius: "50%",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* Uniform Tabs Bar */}
          <div style={{ display: "flex", gap: 4 }}>
            <button
              type="button"
              onClick={() => setActiveDrawerTab("drafts")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px 8px 0 0",
                border: "1px solid",
                borderColor: activeDrawerTab === "drafts" ? "#cbd5e1" : "transparent",
                borderBottom: activeDrawerTab === "drafts" ? "2px solid #3B4197" : "none",
                background: activeDrawerTab === "drafts" ? "#ffffff" : "transparent",
                color: activeDrawerTab === "drafts" ? "#1f2c6f" : "#64748b",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Drafts <span style={{ background: "#e0e7ff", color: "#3730a3", fontSize: 11, padding: "1px 6px", borderRadius: 99 }}>{draftsForCurrentSchedule.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDrawerTab("conflicts")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px 8px 0 0",
                border: "1px solid",
                borderColor: activeDrawerTab === "conflicts" ? (conflictCount > 0 ? "#fecdd3" : "#bfdbfe") : "transparent",
                borderBottom: activeDrawerTab === "conflicts" ? (conflictCount > 0 ? "2px solid #e11d48" : "2px solid #2563eb") : "none",
                background: activeDrawerTab === "conflicts" ? "#ffffff" : "transparent",
                color: activeDrawerTab === "conflicts" ? (conflictCount > 0 ? "#be123c" : "#1f2c6f") : "#64748b",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Conflicts <span style={{ background: conflictCount > 0 ? "#ffe4e6" : "#f1f5f9", color: conflictCount > 0 ? "#9f1239" : "#475569", fontSize: 11, padding: "1px 6px", borderRadius: 99 }}>{conflictCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDrawerTab("restrictions")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px 8px 0 0",
                border: "1px solid",
                borderColor: activeDrawerTab === "restrictions" ? "#bfdbfe" : "transparent",
                borderBottom: activeDrawerTab === "restrictions" ? "2px solid #2563eb" : "none",
                background: activeDrawerTab === "restrictions" ? "#ffffff" : "transparent",
                color: activeDrawerTab === "restrictions" ? "#1d4ed8" : "#64748b",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Period Restrictions <span style={{ background: "#dbeafe", color: "#1e40af", fontSize: 11, padding: "1px 6px", borderRadius: 99 }}>{restrictionCount}</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
          {activeDrawerTab === "drafts" && (
            <div>
              <h3 style={{ margin: "0 0 4px", color: "#1f2c6f", fontSize: 16, fontWeight: 700 }}>Saved Schedule Drafts</h3>
              <p style={{ margin: "0 0 14px", color: "#64748b", fontSize: 12 }}>
                Load, preview, or delete existing draft schedules for this grade level.
              </p>

              {draftsForCurrentSchedule.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 10px", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
                  <p style={{ margin: 0, color: "#64748b", fontSize: 13, fontWeight: 600 }}>No saved drafts found.</p>
                  <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 12 }}>Click "Save" on the main toolbar to store current draft.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {draftsForCurrentSchedule.map((draft) => (
                    <div
                      key={draft.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: 12,
                        background: "#f8fafc",
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <p style={{ margin: 0, color: "#1e293b", fontSize: 14, fontWeight: 700 }}>{draft.name}</p>
                          <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 11 }}>Updated: {formatDateTime(draft.updatedAt)}</p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#e0e7ff", color: "#3730a3" }}>Draft</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button type="button" onClick={() => handleLoadDraft(draft.id)} style={{ ...smallActionStyle(), flex: 1, padding: "6px" }}>
                          Load Schedule
                        </button>
                        <button type="button" onClick={() => setPreviewDraftModal(draft)} style={{ ...smallActionStyle(), flex: 1, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "6px" }}>
                          Preview Timetable
                        </button>
                        <button type="button" onClick={() => handleDeleteDraft(draft.id)} style={{ ...smallDangerStyle(), padding: "6px 12px" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeDrawerTab === "conflicts" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, color: conflictCount > 0 ? "#991b1b" : "#166534", fontSize: 16, fontWeight: 700 }}>
                    Schedule Conflicts ({conflictCount})
                  </h3>
                  <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 12 }}>
                    Conflicting cells are highlighted in red on grid.
                  </p>
                </div>
                {conflictCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleAutoFixAllConflicts}
                    style={{ ...secondaryActionStyle(), background: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b", fontSize: 12, padding: "6px 12px" }}
                  >
                    Auto-Fix All
                  </button>
                ) : null}
              </div>

              {/* Timetable Capacity Deficit Diagnostic Card */}
              {hasAssignments && capacityIssues.length > 0 && conflictsForDisplay.some((c) => c.includes("required recurring daily period")) && (
                <div
                  style={{
                    background: "#f0f4ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: 14,
                    boxShadow: "0 2px 8px rgba(59, 65, 151, 0.08)",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 20, color: "#3B4197", lineHeight: 1 }}>ℹ️</span>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#1f2c6f" }}>
                        Timetable Capacity Shortfall Detected
                      </h4>
                      {capacityIssues.map((issue) => (
                        <p
                          key={issue.section.id}
                          style={{ margin: "0 0 8px", fontSize: 12, color: "#334155", lineHeight: 1.45 }}
                        >
                          <strong>{issue.sectionName}</strong> requires <strong>{issue.totalRequired} weekly periods</strong> across its subjects, but the timetable physically only has <strong>{issue.availableSlots} available slots</strong> (<span style={{ color: "#1e40af", fontWeight: 700, background: "#dbeafe", padding: "1px 6px", borderRadius: 4 }}>{issue.deficit} slot shortage</span>). Auto-Fix cannot place subjects beyond available timetable capacity.
                        </p>
                      ))}

                      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                        <button
                          type="button"
                          onClick={handleQuickIncreasePeriods}
                          style={{
                            padding: "9px 14px",
                            background: "linear-gradient(135deg, #3B4197 0%, #2563eb 100%)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            boxShadow: "0 2px 6px rgba(59, 65, 151, 0.28)",
                          }}
                        >
                          Expand to 9 Periods & Populate (45 Slots Quick Fix)
                        </button>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = "/dashboard?tab=school-profile&subtab=config";
                            }}
                            style={{
                              flex: 1,
                              padding: "7px 10px",
                              background: "#ffffff",
                              color: "#3B4197",
                              border: "1px solid #bfdbfe",
                              borderRadius: 6,
                              fontWeight: 600,
                              fontSize: 11,
                              cursor: "pointer",
                              textAlign: "center",
                            }}
                          >
                            Adjust Daily Periods (Scheduling Configurations)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = "/dashboard?tab=subjects";
                            }}
                            style={{
                              flex: 1,
                              padding: "7px 10px",
                              background: "#ffffff",
                              color: "#3B4197",
                              border: "1px solid #bfdbfe",
                              borderRadius: 6,
                              fontWeight: 600,
                              fontSize: 11,
                              cursor: "pointer",
                              textAlign: "center",
                            }}
                          >
                            Adjust Subject Workload (Subjects)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {conflictCount === 0 ? (
                !hasAssignments ? (
                  <div style={{ textAlign: "center", padding: "32px 16px", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
                    <p style={{ margin: 0, color: "#1e293b", fontSize: 14, fontWeight: 700 }}>Grid Cleared (Empty Schedule)</p>
                    <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>
                      All assignments have been cleared. Click &quot;Re-Generate&quot; to populate conflict-free slots.
                    </p>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "32px 16px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
                    <span style={{ fontSize: 24, display: "block", marginBottom: 6 }}>✓</span>
                    <p style={{ margin: 0, color: "#166534", fontSize: 14, fontWeight: 700 }}>No conflicts detected!</p>
                    <p style={{ margin: "4px 0 0", color: "#15803d", fontSize: 12 }}>All section & teacher assignments are valid.</p>
                  </div>
                )
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {conflictsForDisplay.map((conflict, index) => (
                    <div key={index} style={{ border: "1px solid #fecdd3", borderRadius: 10, padding: 12, background: "#fff1f2" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ color: "#e11d48", fontWeight: 800, fontSize: 14 }}>!</span>
                        <p style={{ margin: 0, color: "#991b1b", fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{conflict}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {activeDrawerTab === "restrictions" && (
            <PeriodRestrictionsContent
              effectiveTeacherRestrictions={effectiveTeacherRestrictions}
              showTeacherRestrictionEditor={showTeacherRestrictionEditor}
              setShowTeacherRestrictionEditor={setShowTeacherRestrictionEditor}
              teacherRestrictionForm={teacherRestrictionForm}
              setTeacherRestrictionForm={setTeacherRestrictionForm}
              ancillaryTaskOptions={ancillaryTaskOptions}
              teacherRestrictionOptions={teacherRestrictionOptions}
              restrictionPeriodOptions={restrictionPeriodOptions}
              addTeacherRestriction={addTeacherRestriction}
              removeTeacherRestriction={removeTeacherRestriction}
              subjectRestrictionsForDisplay={subjectRestrictionsForDisplay}
              showSubjectRestrictionEditor={showSubjectRestrictionEditor}
              setShowSubjectRestrictionEditor={setShowSubjectRestrictionEditor}
              subjectRestrictionForm={subjectRestrictionForm}
              setSubjectRestrictionForm={setSubjectRestrictionForm}
              subjectRestrictionOptions={subjectRestrictionOptions}
              addSubjectRestriction={addSubjectRestriction}
              removeSubjectRestriction={removeSubjectRestriction}
              EMPTY_TEACHER_RESTRICTION_FORM={EMPTY_TEACHER_RESTRICTION_FORM}
              EMPTY_SUBJECT_RESTRICTION_FORM={EMPTY_SUBJECT_RESTRICTION_FORM}
              notice={notice}
            />
          )}
        </div>
      </div>
    </>
  );
}

function PeriodRestrictionsContent({
  effectiveTeacherRestrictions,
  showTeacherRestrictionEditor,
  setShowTeacherRestrictionEditor,
  teacherRestrictionForm,
  setTeacherRestrictionForm,
  ancillaryTaskOptions,
  teacherRestrictionOptions,
  restrictionPeriodOptions,
  addTeacherRestriction,
  removeTeacherRestriction,
  subjectRestrictionsForDisplay,
  showSubjectRestrictionEditor,
  setShowSubjectRestrictionEditor,
  subjectRestrictionForm,
  setSubjectRestrictionForm,
  subjectRestrictionOptions,
  addSubjectRestriction,
  removeSubjectRestriction,
  EMPTY_TEACHER_RESTRICTION_FORM,
  EMPTY_SUBJECT_RESTRICTION_FORM,
  notice,
}) {
  const [activeTab, setActiveTab] = useState("faculty");
  const [targetSearchQuery, setTargetSearchQuery] = useState("");
  const [showTargetDropdown, setShowTargetDropdown] = useState(false);
  const [hoveredTargetId, setHoveredTargetId] = useState(null);
  const comboboxRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setShowTargetDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allGroupRoles = useMemo(() => {
    const list = [
      { id: "all-with-ancillary", name: "All Teachers with Ancillary Tasks", type: "all-with-ancillary" },
    ];

    (ancillaryTaskOptions || []).forEach((task) => {
      list.push({ id: `ancillary:${task}`, name: task, type: "ancillary-task" });
    });

    return list;
  }, [ancillaryTaskOptions]);

  const filteredGroupRoles = useMemo(() => {
    const query = targetSearchQuery.toLowerCase().trim();
    if (!query) return allGroupRoles;
    return allGroupRoles.filter((item) => item.name.toLowerCase().includes(query));
  }, [targetSearchQuery, allGroupRoles]);

  const filteredTeachers = useMemo(() => {
    const query = targetSearchQuery.toLowerCase().trim();
    if (!query) return teacherRestrictionOptions;
    return teacherRestrictionOptions.filter((item) =>
      (item.label || item.name || "").toLowerCase().includes(query)
    );
  }, [targetSearchQuery, teacherRestrictionOptions]);



  return (
    <div>
      <div style={{ display: "flex", borderBottom: "1px solid #eef2f7", background: "#ffffff", marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setActiveTab("faculty")}
          style={{
            padding: "10px 14px",
            border: "none",
            background: "transparent",
            borderBottom: activeTab === "faculty" ? "2.5px solid #1e40af" : "2.5px solid transparent",
            color: activeTab === "faculty" ? "#1e40af" : "#64748b",
            fontWeight: activeTab === "faculty" ? 700 : 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Faculty Restrictions ({effectiveTeacherRestrictions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("subject")}
          style={{
            padding: "10px 14px",
            border: "none",
            background: "transparent",
            borderBottom: activeTab === "subject" ? "2.5px solid #1e40af" : "2.5px solid transparent",
            color: activeTab === "subject" ? "#1e40af" : "#64748b",
            fontWeight: activeTab === "subject" ? 700 : 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Subject Constraints ({subjectRestrictionsForDisplay.length})
        </button>
      </div>

      <div>
        {notice?.text ? (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: notice.type === "error" ? "#fef2f2" : "#f0fdf4",
              border: notice.type === "error" ? "1px solid #fecdd3" : "1px solid #bbf7d0",
              color: notice.type === "error" ? "#991b1b" : "#166534",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            {notice.text}
          </div>
        ) : null}
        {activeTab === "faculty" ? (
          <div style={{ display: "grid", gap: 14 }}>
            {!showTeacherRestrictionEditor ? (
              <button
                type="button"
                onClick={() => {
                  setShowTeacherRestrictionEditor(true);
                  setTeacherRestrictionForm(EMPTY_TEACHER_RESTRICTION_FORM);
                  setTargetSearchQuery("");
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  background: "#1e40af",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  alignSelf: "start",
                }}
              >
                + Add Faculty Restriction
              </button>
            ) : (
              <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 16, background: "#f8fafc", display: "grid", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>New Faculty Restriction</span>
                  <button
                    type="button"
                    onClick={() => setShowTeacherRestrictionEditor(false)}
                    style={{ border: "none", background: "transparent", color: "#64748b", fontSize: 18, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>

                <Field label="Who to restrict? (Type teacher name or ancillary role)">
                  <div ref={comboboxRef} style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Type teacher name (e.g. Ana Manalastas) or role (e.g. Head Teacher)..."
                      value={targetSearchQuery}
                      onChange={(e) => {
                        setTargetSearchQuery(e.target.value);
                        setShowTargetDropdown(true);
                      }}
                      onFocus={() => setShowTargetDropdown(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setShowTargetDropdown(false);
                      }}
                      style={inputStyle(false)}
                    />

                    {showTargetDropdown && (
                      <div
                        onMouseDown={(e) => e.preventDefault()}
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          maxHeight: 240,
                          overflowY: "auto",
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: 10,
                          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.18)",
                          zIndex: 9999,
                          marginTop: 4,
                        }}
                      >
                        {filteredGroupRoles.length > 0 && (
                          <div>
                            <div style={{ padding: "6px 12px", background: "#f1f5f9", fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                              Ancillary Roles & Group Targets
                            </div>
                            {filteredGroupRoles.map((role) => {
                              const isHovered = hoveredTargetId === role.id;
                              return (
                                <div
                                  key={role.id}
                                  onMouseEnter={() => setHoveredTargetId(role.id)}
                                  onMouseLeave={() => setHoveredTargetId(null)}
                                  onClick={() => {
                                    if (role.type === "all-with-ancillary") {
                                      setTeacherRestrictionForm((prev) => ({
                                        ...prev,
                                        targetType: "all-with-ancillary",
                                        ancillaryTask: "",
                                        teacherId: "",
                                      }));
                                      setTargetSearchQuery("All Teachers with Ancillary Tasks");
                                    } else {
                                      setTeacherRestrictionForm((prev) => ({
                                        ...prev,
                                        targetType: "ancillary-task",
                                        ancillaryTask: role.name,
                                        teacherId: "",
                                      }));
                                      setTargetSearchQuery(role.name);
                                    }
                                    setShowTargetDropdown(false);
                                  }}
                                  style={{
                                    padding: "9px 12px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#1e40af",
                                    background: isHovered ? "#eff6ff" : "#ffffff",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f1f5f9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    transition: "background 0.1s ease",
                                  }}
                                >
                                  <span>{role.name}</span>
                                  <span style={{ fontSize: 10, background: isHovered ? "#bfdbfe" : "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>Group Role</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {filteredTeachers.length > 0 && (
                          <div>
                            <div style={{ padding: "6px 12px", background: "#f1f5f9", fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                              Individual Faculty Members
                            </div>
                            {filteredTeachers.map((teacher) => {
                              const isHovered = hoveredTargetId === teacher.id;
                              return (
                                <div
                                  key={teacher.id}
                                  onMouseEnter={() => setHoveredTargetId(teacher.id)}
                                  onMouseLeave={() => setHoveredTargetId(null)}
                                  onClick={() => {
                                    setTeacherRestrictionForm((prev) => ({
                                      ...prev,
                                      targetType: "specific-teacher",
                                      teacherId: teacher.id,
                                      ancillaryTask: "",
                                    }));
                                    setTargetSearchQuery(teacher.name);
                                    setShowTargetDropdown(false);
                                  }}
                                  style={{
                                    padding: "9px 12px",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: isHovered ? "#0f172a" : "#334155",
                                    background: isHovered ? "#f1f5f9" : "#ffffff",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f1f5f9",
                                    transition: "background 0.1s ease",
                                  }}
                                >
                                  {teacher.name}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {filteredGroupRoles.length === 0 && filteredTeachers.length === 0 && (
                          <div style={{ padding: "14px", fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                            No matching teacher or ancillary role found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Field>

                <div>
                  <div style={{ marginBottom: 6 }}>
                    <label style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#334155" }}>
                      Cannot teach during these periods:
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6 }}>
                    {restrictionPeriodOptions.map((periodLabel) => {
                      const checked = teacherRestrictionForm.periodLabels.includes(periodLabel);
                      return (
                        <label
                          key={periodLabel}
                          style={{
                            border: checked ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                            background: checked ? "#eff6ff" : "#ffffff",
                            borderRadius: 6,
                            padding: "6px 8px",
                            fontSize: 12,
                            fontWeight: 600,
                            color: checked ? "#1e40af" : "#334155",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setTeacherRestrictionForm((prev) => {
                                const current = Array.isArray(prev.periodLabels) ? prev.periodLabels : [];
                                const next = current.includes(periodLabel)
                                  ? current.filter((item) => item !== periodLabel)
                                  : [...current, periodLabel];
                                return { ...prev, periodLabels: normalizeStringArray(next) };
                              });
                            }}
                          />
                          {periodLabel}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowTeacherRestrictionEditor(false)}
                    style={{ padding: "8px 16px", borderRadius: 6, background: "#f1f5f9", border: "none", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addTeacherRestriction}
                    style={{ padding: "8px 16px", borderRadius: 6, background: "#1e40af", border: "none", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                  >
                    Save Restriction
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              {effectiveTeacherRestrictions.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>No faculty restrictions configured yet.</p>
              ) : (
                effectiveTeacherRestrictions.map((entry) => (
                  <div
                    key={entry.teacherId}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      background: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block" }}>
                        {entry.teacherName || entry.teacherId}
                      </span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        Restricted: {(entry.periodLabels || []).join(", ") || "—"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTeacherRestriction(entry.teacherId)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                        color: "#991b1b",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {!showSubjectRestrictionEditor ? (
              <button
                type="button"
                onClick={() => {
                  setShowSubjectRestrictionEditor(true);
                  setSubjectRestrictionForm(EMPTY_SUBJECT_RESTRICTION_FORM);
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  background: "#1e40af",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  alignSelf: "start",
                }}
              >
                + Add Subject Constraint
              </button>
            ) : (
              <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 16, background: "#f8fafc", display: "grid", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>New Subject Constraint</span>
                  <button
                    type="button"
                    onClick={() => setShowSubjectRestrictionEditor(false)}
                    style={{ border: "none", background: "transparent", color: "#64748b", fontSize: 18, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>

                <Field label="Select Subject">
                  <select
                    value={subjectRestrictionForm.subjectId}
                    onChange={(event) => setSubjectRestrictionForm((prev) => ({ ...prev, subjectId: event.target.value }))}
                    style={selectStyle(false)}
                  >
                    <option value="">-- Select Subject --</option>
                    {subjectRestrictionOptions.map((item) => (
                      <option key={item.id} value={item.id}>{item.subjectName || item.label} ({item.subjectCode || item.gradeLevel})</option>
                    ))}
                  </select>
                </Field>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Restricted Periods:
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6 }}>
                    {restrictionPeriodOptions.map((periodLabel) => {
                      const checked = subjectRestrictionForm.periodLabels.includes(periodLabel);
                      return (
                        <label
                          key={periodLabel}
                          style={{
                            border: checked ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                            background: checked ? "#eff6ff" : "#ffffff",
                            borderRadius: 6,
                            padding: "6px 8px",
                            fontSize: 12,
                            fontWeight: 600,
                            color: checked ? "#1e40af" : "#334155",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSubjectRestrictionForm((prev) => {
                                const current = Array.isArray(prev.periodLabels) ? prev.periodLabels : [];
                                const next = current.includes(periodLabel)
                                  ? current.filter((item) => item !== periodLabel)
                                  : [...current, periodLabel];
                                return { ...prev, periodLabels: normalizeStringArray(next) };
                              });
                            }}
                          />
                          {periodLabel}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <Field label="Reason / Notes">
                  <input
                    type="text"
                    placeholder="e.g. Physical Education should not be scheduled at 1st Period or last period"
                    value={subjectRestrictionForm.reason}
                    onChange={(event) => setSubjectRestrictionForm((prev) => ({ ...prev, reason: event.target.value }))}
                    style={inputStyle(false)}
                  />
                </Field>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowSubjectRestrictionEditor(false)}
                    style={{ padding: "8px 16px", borderRadius: 6, background: "#f1f5f9", border: "none", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addSubjectRestriction}
                    style={{ padding: "8px 16px", borderRadius: 6, background: "#1e40af", border: "none", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                  >
                    Save Constraint
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              {subjectRestrictionsForDisplay.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>No subject constraints configured yet.</p>
              ) : (
                subjectRestrictionsForDisplay.map((entry) => (
                  <div
                    key={entry.subjectId}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      background: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block" }}>
                        {entry.subjectName || entry.subjectId}
                      </span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        Restricted: {(entry.periodLabels || []).join(", ") || "—"} {entry.reason ? `(${entry.reason})` : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSubjectRestriction(entry.subjectId)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                        color: "#991b1b",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DraftTimetablePreviewModal({ open, draft, onClose, onLoad }) {
  if (!open || !draft) return null;

  return (
    <TimeTables
      initialData={draft}
      isModal={true}
      modalTitle={`Draft Timetable Preview: ${draft.name || "Saved Draft"}`}
      onClose={onClose}
      onLoadDraft={onLoad}
    />
  );
}

export { ScheduleGenerator as ScheduleMaker };

