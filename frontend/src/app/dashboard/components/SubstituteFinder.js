import React, { useState, useMemo, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import {
  FaChevronDown,
  FaChevronUp,
  FaPrint,
  FaFilePdf,
  FaMagic,
  FaFileSignature,
  FaTimes,
  FaUndo,
  FaSearch,
  FaHistory,
  FaDownload,
  FaTrash,
  FaChalkboardTeacher,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaSave,
  FaCheckCircle,
} from "react-icons/fa";
import {
  DepEdOfficialSeal,
  SchoolOfficialSeal,
  BagongPilipinasLogo,
  DepEdWordmarkLogo,
} from "./depedSeals";
import { DEFAULT_SIGNATORIES_BY_LEVEL } from "./SchoolProfileSettings";

const SUBSTITUTIONS_STORAGE_KEY = "turotugma_pinch_hit_assignments";
const ABSENCES_STORAGE_KEY = "turotugma_pinch_hit_absences";
const CANCELLED_HISTORY_STORAGE_KEY = "turotugma_pinch_hit_cancelled";
const CO_TEACHERS_COVERAGE_ID = "CO_TEACHERS";
const VALID_YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATE_PINCH_KEY_REGEX = /^\d{4}-\d{2}-\d{2}\|P\d+\|.+$/;
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const COMMON_ABSENCE_REASONS = [
  "Official Business / DepEd Seminar-Training",
  "Coaching Athletes in Division / Regional Competition",
  "Sick Leave / Medical Attention",
  "Personal / Emergency Leave",
  "Official Division / District Meeting",
];

function getFromStorage(key, fallback) {
  try {
    const val = window.localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function formatLocalYMD(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalYMD(ymd) {
  if (!ymd || typeof ymd !== "string") return null;
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function getDefaultSchoolDate(validDays = []) {
  const activeDays =
    Array.isArray(validDays) && validDays.length > 0
      ? validDays
      : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const dayName = WEEKDAY_NAMES[cursor.getDay()];
    if (activeDays.includes(dayName)) {
      return formatLocalYMD(cursor);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return formatLocalYMD(new Date());
}

function enumerateSchoolDates(startYMD, endYMD, validDays = [], maxSchoolDays = 15) {
  const start = parseLocalYMD(startYMD);
  const end = parseLocalYMD(endYMD || startYMD);
  if (!start || !end) return [];

  const activeSet = new Set(
    Array.isArray(validDays) && validDays.length > 0
      ? validDays
      : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  );
  const from = start <= end ? new Date(start) : new Date(end);
  const to = start <= end ? new Date(end) : new Date(start);
  const results = [];
  const cursor = new Date(from);

  for (let step = 0; step < 45 && cursor <= to && results.length < maxSchoolDays; step++) {
    const dayName = WEEKDAY_NAMES[cursor.getDay()];
    if (activeSet.has(dayName)) {
      results.push({
        date: formatLocalYMD(cursor),
        day: dayName,
        shortLabel: cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        longLabel: cursor.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return results;
}

function formatDateLongText(ymd) {
  const dt = parseLocalYMD(ymd);
  if (!dt) return ymd || "";
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatDateRangeSummary(startYMD, endYMD) {
  const start = parseLocalYMD(startYMD);
  const end = parseLocalYMD(endYMD || startYMD);
  if (!start) return startYMD || "";
  if (!end || startYMD === endYMD) {
    const dayName = WEEKDAY_NAMES[start.getDay()];
    return `${formatDateLongText(startYMD)} (${dayName})`;
  }
  const s = start <= end ? start : end;
  const e = start <= end ? end : start;
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    const monthStr = s.toLocaleDateString("en-US", { month: "long" });
    return `${monthStr} ${s.getDate()} - ${e.getDate()}, ${s.getFullYear()}`;
  }
  if (s.getFullYear() === e.getFullYear()) {
    const startPart = s.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    const endPart = e.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    return `${startPart} - ${endPart}`;
  }
  return `${formatDateLongText(formatLocalYMD(s))} - ${formatDateLongText(formatLocalYMD(e))}`;
}

function normalizeAndMigratePinchHitMap(rawMap) {
  if (!rawMap || typeof rawMap !== "object" || Array.isArray(rawMap)) {
    return { map: {}, migrated: false };
  }
  const normalized = {};
  let migrated = false;

  Object.entries(rawMap).forEach(([key, entry]) => {
    if (!entry || typeof entry !== "object") {
      migrated = true;
      return;
    }
    if (DATE_PINCH_KEY_REGEX.test(key)) {
      normalized[key] = entry;
      return;
    }

    // Legacy weekday-only key (e.g. "Monday|P1|FAC-001"): migrate to exact date key if valid date exists,
    // otherwise purge so past weekday entries never auto-fill new dates when selecting a teacher.
    migrated = true;
    const entryDate = String(entry.date || "").trim();
    const entryPeriod = Number(entry.period);
    const absentId = String(entry.absentTeacherId || key.split("|")[2] || "").trim();
    if (VALID_YMD_REGEX.test(entryDate) && entryPeriod > 0 && absentId && entry.substituteTeacherId) {
      const parsed = parseLocalYMD(entryDate);
      const derivedDay = parsed ? WEEKDAY_NAMES[parsed.getDay()] : entry.day || "";
      const canonicalKey = `${entryDate}|P${entryPeriod}|${absentId}`;
      if (!normalized[canonicalKey]) {
        normalized[canonicalKey] = {
          ...entry,
          id: entry.id || canonicalKey,
          date: entryDate,
          day: derivedDay,
          period: entryPeriod,
          absentTeacherId: absentId,
        };
      }
    }
  });

  return { map: normalized, migrated };
}

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function normalizeSubjectAreaKey(rawName) {
  if (!rawName) return "";
  const lower = String(rawName)
    .toLowerCase()
    .replace(/\b(grade|gr\.?|jhs|shs|i|ii|iii|iv|1|2|3|4|5|6|7|8|9|10|11|12)\b/gi, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    /\bspa\b/.test(lower) ||
    lower.includes("special program in the arts") ||
    lower.includes("dance arts") ||
    lower.includes("media arts") ||
    lower.includes("instrumental music") ||
    lower.includes("visual arts") ||
    lower.includes("theater arts") ||
    lower.includes("theatre arts") ||
    lower.includes("creative writing")
  ) {
    return "SPA Specialization";
  }
  if (lower.includes("math") || lower.includes("algebra") || lower.includes("calculus") || lower.includes("stat")) {
    return "Mathematics";
  }
  if (lower.includes("sci") || lower.includes("bio") || lower.includes("chem") || lower.includes("phys") || lower.includes("earth")) {
    return "Science";
  }
  if (lower.includes("eng") || lower.includes("reading") || lower.includes("literature") || lower.includes("oral comm")) {
    return "English";
  }
  if (lower.includes("fil") || lower.includes("komunikasyon") || lower.includes("pananaliksik") || lower.includes("pagbasa")) {
    return "Filipino";
  }
  if (
    lower.includes("araling") ||
    /\bap\b/.test(lower) ||
    lower.includes("social") ||
    lower.includes("kasaysayan") ||
    lower.includes("ekonomiks") ||
    lower.includes("philippine") ||
    lower.includes("history")
  ) {
    return "Araling Panlipunan";
  }
  if (/\bmapeh\b|\bmusic\b|\barts?\b|\bphysical education\b|\bp\s*e\b|\bhealth\b/.test(lower)) {
    return "MAPEH";
  }
  if (/\btle\b|\btvl\b|\bict\b/.test(lower) || lower.includes("livelihood") || lower.includes("cookery") || lower.includes("computer") || lower.includes("technology")) {
    return "TLE / TVL";
  }
  if (/\besp\b|\bhgp\b/.test(lower) || lower.includes("pagpapakatao") || lower.includes("values") || lower.includes("homeroom") || lower.includes("guidance") || lower.includes("philosophy")) {
    return "EsP / Values";
  }
  return lower ? lower.charAt(0).toUpperCase() + lower.slice(1) : "";
}

function extractGradeNumber(secObj, sectionId, sectionName) {
  if (secObj?.grade && !Number.isNaN(Number(secObj.grade))) {
    return Number(secObj.grade);
  }
  const combined = `${sectionId || ""} ${sectionName || ""}`;
  const m = combined.match(/\b(7|8|9|10|11|12)\b/);
  return m ? Number(m[1]) : null;
}

export default function SubstituteFinder({
  days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  periods = [1, 2, 3, 4, 5, 6, 7, 8],
  regularTimes = [],
  shortenedTimes = [],
  shortenedSessionDays = [],
  teachers = [],
  teachersById = new Map(),
  sectionsById = new Map(),
  assignedTeacherIds = [],
  getTeacherCellAssignment,
  getSectionName,
  getSubjectName,
  getTeacherName,
  initialTeacherId = "",
  schoolProfile = null,
  scheduleType = "jhs",
}) {
  const letterRef = useRef(null);
  const teacherPickerRef = useRef(null);

  const [activeSubTab, setActiveSubTab] = useState("assign"); // "assign" | "history"

  const allTeacherIds = useMemo(() => {
    const set = new Set(assignedTeacherIds.map((id) => String(id)));
    if (Array.isArray(teachers)) {
      teachers.forEach((t) => {
        if (t?.id && t?.status !== "Inactive") set.add(String(t.id));
      });
    }
    const arr = Array.from(set);
    arr.sort((a, b) => {
      const nameA = String(getTeacherName ? getTeacherName(a) : a).toLowerCase();
      const nameB = String(getTeacherName ? getTeacherName(b) : b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
    return arr;
  }, [assignedTeacherIds, teachers, getTeacherName]);

  const maxPeriod = periods.length > 0 ? periods[periods.length - 1] : 8;
  const minPeriod = periods.length > 0 ? periods[0] : 1;

  // Support selecting one OR multiple absent teachers (starts empty unless initialTeacherId is passed)
  const [absentTeacherIds, setAbsentTeacherIds] = useState(() => {
    if (initialTeacherId && allTeacherIds.includes(String(initialTeacherId))) {
      return [String(initialTeacherId)];
    }
    return [];
  });

  const [showTeacherPicker, setShowTeacherPicker] = useState(false);
  const [absentPickerSearch, setAbsentPickerSearch] = useState("");

  useEffect(() => {
    if (initialTeacherId && allTeacherIds.includes(String(initialTeacherId))) {
      setAbsentTeacherIds([String(initialTeacherId)]);
    }
  }, [initialTeacherId, allTeacherIds]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (teacherPickerRef.current && !teacherPickerRef.current.contains(e.target)) {
        setShowTeacherPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleAbsentTeacher = (tid) => {
    const idStr = String(tid);
    setAbsentTeacherIds((prev) => {
      if (prev.includes(idStr)) {
        return prev.filter((item) => item !== idStr);
      }
      return [...prev, idStr];
    });
  };

  // Multi-day date range state (defaults to a single school day, expandable to multi-day absences)
  const [startDate, setStartDate] = useState(() => getDefaultSchoolDate(days));
  const [endDate, setEndDate] = useState(() => getDefaultSchoolDate(days));
  const [fromPeriod, setFromPeriod] = useState(() => minPeriod);
  const [toPeriod, setToPeriod] = useState(() => maxPeriod);
  const [absenceReason, setAbsenceReason] = useState(COMMON_ABSENCE_REASONS[0]);

  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (!endDate || val > endDate) {
      setEndDate(val);
    }
  };

  const handleEndDateChange = (val) => {
    setEndDate(val);
    if (!startDate || val < startDate) {
      setStartDate(val);
    }
  };

  const selectedAbsenceDays = useMemo(
    () => enumerateSchoolDates(startDate, endDate, days, 15),
    [startDate, endDate, days]
  );

  // Master-detail state: active affected class key (`${date}|P${period}|${absentTid}`)
  const [activeClassKey, setActiveClassKey] = useState(null);
  const [expandedTeacherId, setExpandedTeacherId] = useState(null);
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [includeBusyTeachers, setIncludeBusyTeachers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [letterMode, setLetterMode] = useState("consolidated"); // "consolidated" | "per-substitute" | "per-absent"
  const [letterSourceOverride, setLetterSourceOverride] = useState(null);

  // Signatories for Formal Letter
  const isShs = String(scheduleType).toLowerCase() === "shs";
  const defaultSigs = isShs
    ? DEFAULT_SIGNATORIES_BY_LEVEL?.shs
    : DEFAULT_SIGNATORIES_BY_LEVEL?.jhs;
  const levelSigs =
    schoolProfile?.signatoriesByLevel?.[isShs ? "shs" : "jhs"] || defaultSigs || {};

  const [principalName, setPrincipalName] = useState(
    levelSigs?.recommendingApproval?.name ||
      levelSigs?.preparedBy?.[0]?.name ||
      "ROBERTO D. CUTILLON"
  );
  const [principalTitle, setPrincipalTitle] = useState(
    levelSigs?.recommendingApproval?.title ||
      levelSigs?.preparedBy?.[0]?.title ||
      "School Principal IV"
  );
  const [coordinatorName, setCoordinatorName] = useState(
    levelSigs?.conformed?.name || "TERESA M. ALVAREZ, HT IV"
  );
  const [coordinatorTitle, setCoordinatorTitle] = useState(
    levelSigs?.conformed?.title || "Assistant Principal II"
  );
  const [memoNumber, setMemoNumber] = useState(
    () => `SO-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`
  );

  // Left-panel filters for managing large multi-teacher / multi-day absences
  const [classListStatusFilter, setClassListStatusFilter] = useState("all"); // "all" | "unassigned" | "covered"
  const [classListDateFilter, setClassListDateFilter] = useState("all");
  const [classListTeacherFilter, setClassListTeacherFilter] = useState("all");

  // Draft staging & Upcoming Schedules view states
  const [draftChanges, setDraftChanges] = useState({}); // classKey -> assignment obj | null (staged removal)
  const [saveNotice, setSaveNotice] = useState("");
  const [upcomingViewMode, setUpcomingViewMode] = useState("by-pinch-hitter"); // "by-pinch-hitter" | "by-absent"
  const [upcomingSearch, setUpcomingSearch] = useState("");

  // History filter states
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all"); // "all" | "active" | "cancelled"
  const [historyAbsentFilter, setHistoryAbsentFilter] = useState("all");
  const [historySubFilter, setHistorySubFilter] = useState("all");
  const [historyReasonFilter, setHistoryReasonFilter] = useState("all");
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(25);
  const [showTallyPanel, setShowTallyPanel] = useState(true);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null); // { mode: "single", entry } | { mode: "filtered", keys, entries, count }
  const [cancelConfirmTarget, setCancelConfirmTarget] = useState(null); // { keys, count, title, description }

  const [pinchHitMap, setPinchHitMap] = useState(() => {
    const raw = getFromStorage(SUBSTITUTIONS_STORAGE_KEY, {});
    return normalizeAndMigratePinchHitMap(raw).map;
  });

  const [cancelledHistoryMap, setCancelledHistoryMap] = useState(() => {
    const raw = getFromStorage(CANCELLED_HISTORY_STORAGE_KEY, {});
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  });

  const [recordedAbsencesMap, setRecordedAbsencesMap] = useState(() => {
    const raw = getFromStorage(ABSENCES_STORAGE_KEY, {});
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  });

  const effectivePinchHitMap = useMemo(() => {
    const merged = { ...pinchHitMap };
    Object.entries(draftChanges || {}).forEach(([k, val]) => {
      if (val === null) {
        delete merged[k];
      } else if (val && val.substituteTeacherId) {
        merged[k] = val;
      }
    });
    return merged;
  }, [pinchHitMap, draftChanges]);

  const unsavedChangesCount = useMemo(
    () => Object.keys(draftChanges || {}).length,
    [draftChanges]
  );

  const draftKeySet = useMemo(
    () => new Set(Object.keys(draftChanges || {})),
    [draftChanges]
  );

  useEffect(() => {
    if (!saveNotice) return;
    const timer = setTimeout(() => setSaveNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [saveNotice]);

  // One-time cleanup of legacy weekday-only keys + multi-tab / XAMPP LAN sync listener
  useEffect(() => {
    const raw = getFromStorage(SUBSTITUTIONS_STORAGE_KEY, {});
    const { map: cleanMap, migrated } = normalizeAndMigratePinchHitMap(raw);
    if (migrated) {
      setPinchHitMap(cleanMap);
      try {
        window.localStorage.setItem(SUBSTITUTIONS_STORAGE_KEY, JSON.stringify(cleanMap));
      } catch {
        // ignore
      }
    }

    const syncFromStorage = () => {
      const latestRaw = getFromStorage(SUBSTITUTIONS_STORAGE_KEY, {});
      const { map: normalizedLatest } = normalizeAndMigratePinchHitMap(latestRaw);
      setPinchHitMap(normalizedLatest);

      const latestAbsencesRaw = getFromStorage(ABSENCES_STORAGE_KEY, {});
      setRecordedAbsencesMap(
        latestAbsencesRaw && typeof latestAbsencesRaw === "object" && !Array.isArray(latestAbsencesRaw)
          ? latestAbsencesRaw
          : {}
      );

      const latestCancelledRaw = getFromStorage(CANCELLED_HISTORY_STORAGE_KEY, {});
      setCancelledHistoryMap(
        latestCancelledRaw && typeof latestCancelledRaw === "object" && !Array.isArray(latestCancelledRaw)
          ? latestCancelledRaw
          : {}
      );
    };

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("turotugma:xampp-remote-update", syncFromStorage);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("turotugma:xampp-remote-update", syncFromStorage);
    };
  }, []);

  const persistPinchHitMap = (nextMap) => {
    try {
      window.localStorage.setItem(SUBSTITUTIONS_STORAGE_KEY, JSON.stringify(nextMap));
    } catch {
      // ignore
    }
  };

  const persistRecordedAbsencesMap = (nextMap) => {
    try {
      window.localStorage.setItem(ABSENCES_STORAGE_KEY, JSON.stringify(nextMap));
    } catch {
      // ignore
    }
  };

  const persistCancelledHistoryMap = (nextMap) => {
    try {
      window.localStorage.setItem(CANCELLED_HISTORY_STORAGE_KEY, JSON.stringify(nextMap));
    } catch {
      // ignore
    }
  };

  const archiveCancelledEntries = (entriesToArchive = [], cancelNote = "Cancelled from schedule") => {
    const valid = (Array.isArray(entriesToArchive) ? entriesToArchive : []).filter(
      (entry) => entry && entry.date && entry.substituteTeacherId
    );
    if (valid.length === 0) return;

    const stamp = Date.now();
    const cancelledIso = new Date().toISOString();
    setCancelledHistoryMap((prev) => {
      const next = { ...prev };
      valid.forEach((entry, idx) => {
        const baseKey = entry.id || entry.key || `${entry.date}|P${entry.period}|${entry.absentTeacherId}`;
        const uniqueKey = `cancelled|${baseKey}|${stamp}_${idx}`;
        next[uniqueKey] = {
          ...entry,
          id: uniqueKey,
          key: uniqueKey,
          originalKey: baseKey,
          status: "cancelled",
          cancelledAt: cancelledIso,
          cancelNote,
        };
      });
      persistCancelledHistoryMap(next);
      return next;
    });
  };

  const upsertRecordedAbsences = (entries = []) => {
    if (!Array.isArray(entries) || entries.length === 0) return;
    setRecordedAbsencesMap((prev) => {
      const next = { ...prev };
      let changed = false;
      entries.forEach((entry) => {
        if (!entry || !VALID_YMD_REGEX.test(String(entry.date || "")) || !entry.teacherId) return;
        const tidStr = String(entry.teacherId);
        const absKey = `${entry.date}|${tidStr}`;
        const existing = next[absKey];
        const nextFrom = existing
          ? Math.min(Number(existing.fromPeriod) || minPeriod, Number(entry.fromPeriod) || minPeriod)
          : Number(entry.fromPeriod) || minPeriod;
        const nextTo = existing
          ? Math.max(Number(existing.toPeriod) || maxPeriod, Number(entry.toPeriod) || maxPeriod)
          : Number(entry.toPeriod) || maxPeriod;

        next[absKey] = {
          id: absKey,
          date: entry.date,
          day: entry.day || existing?.day || "",
          teacherId: tidStr,
          teacherName: entry.teacherName || existing?.teacherName || getTeacherName(tidStr),
          fromPeriod: nextFrom,
          toPeriod: nextTo,
          reason: entry.reason || existing?.reason || absenceReason,
          updatedAt: new Date().toISOString(),
        };
        changed = true;
      });
      if (changed) {
        persistRecordedAbsencesMap(next);
        return next;
      }
      return prev;
    });
  };

  const pruneRecordedAbsencesWithoutPinchHits = (nextPinchMap, pairsToCheck = []) => {
    if (!Array.isArray(pairsToCheck) || pairsToCheck.length === 0) return;
    setRecordedAbsencesMap((prev) => {
      const next = { ...prev };
      let changed = false;
      pairsToCheck.forEach(({ date, teacherId }) => {
        if (!date || !teacherId) return;
        const tidStr = String(teacherId);
        const hasRemaining = Object.values(nextPinchMap || {}).some(
          (e) =>
            e &&
            e.substituteTeacherId &&
            e.date === date &&
            String(e.absentTeacherId) === tidStr
        );
        const absKey = `${date}|${tidStr}`;
        if (!hasRemaining && next[absKey]) {
          delete next[absKey];
          changed = true;
        }
      });
      if (changed) {
        persistRecordedAbsencesMap(next);
        return next;
      }
      return prev;
    });
  };

  // Stages a pinch-hit assignment into working draft only; finalized only when Save & Finalize is clicked
  const savePinchHitAssignment = (
    dateStr,
    dayName,
    periodNum,
    absentTid,
    substituteTeacherId,
    classInfo,
    meta = {}
  ) => {
    if (!VALID_YMD_REGEX.test(String(dateStr || ""))) return;
    const key = `${dateStr}|P${periodNum}|${absentTid}`;
    setSaveNotice("");
    setDraftChanges((prev) => {
      const next = { ...prev };
      const savedEntry = pinchHitMap[key];
      if (!substituteTeacherId) {
        if (savedEntry) {
          next[key] = null;
        } else {
          delete next[key];
        }
      } else if (
        savedEntry &&
        String(savedEntry.substituteTeacherId) === String(substituteTeacherId)
      ) {
        delete next[key];
      } else {
        next[key] = {
          id: key,
          date: dateStr,
          day: dayName,
          period: periodNum,
          timeLabel: classInfo?.timeLabel || getTimeForPeriod(dayName, periodNum),
          absentTeacherId: String(absentTid),
          absentTeacherName: getTeacherName(absentTid),
          substituteTeacherId: String(substituteTeacherId),
          substituteTeacherName:
            String(substituteTeacherId) === CO_TEACHERS_COVERAGE_ID
              ? meta.customSubstituteName || "Covered by Present Co-Teacher(s)"
              : getTeacherName(substituteTeacherId),
          sectionId: classInfo?.sectionId || "",
          sectionName: classInfo?.sectionName || "",
          subjectId: classInfo?.subjectId || "",
          subjectName: classInfo?.subjectName || "",
          eligibilityLabel: meta.eligibilityLabel || "",
          matchScore: meta.matchScore ?? null,
          reason: absenceReason,
          memoNumber: memoNumber,
          updatedAt: new Date().toISOString(),
        };
      }
      return next;
    });
  };

  const handleFinalizeDraft = () => {
    const draftEntries = Object.entries(draftChanges || {});
    if (draftEntries.length === 0) return;

    const nextPinchMap = { ...pinchHitMap };
    const addedAbsences = [];
    const removedPairs = [];
    const cancelledEntries = [];

    draftEntries.forEach(([key, val]) => {
      if (val === null) {
        const prevEntry = nextPinchMap[key];
        if (prevEntry?.date && prevEntry?.absentTeacherId) {
          removedPairs.push({
            date: prevEntry.date,
            teacherId: String(prevEntry.absentTeacherId),
          });
          if (prevEntry.substituteTeacherId) {
            cancelledEntries.push({ key, ...prevEntry });
          }
        }
        delete nextPinchMap[key];
      } else if (val && val.substituteTeacherId) {
        const stampedVal = {
          ...val,
          reason: val.reason || absenceReason,
          memoNumber: memoNumber,
          updatedAt: new Date().toISOString(),
        };
        nextPinchMap[key] = stampedVal;
        addedAbsences.push({
          date: stampedVal.date,
          day: stampedVal.day,
          teacherId: String(stampedVal.absentTeacherId),
          teacherName: stampedVal.absentTeacherName || getTeacherName(stampedVal.absentTeacherId),
          fromPeriod: startP,
          toPeriod: endP,
          reason: stampedVal.reason || absenceReason,
        });
      }
    });

    // Ensure every absent teacher who now has finalized coverage across selectedAbsenceDays blocks their whole unavailable period window
    selectedAbsenceDays.forEach((dateObj) => {
      absentTeacherIds.forEach((absentTid) => {
        const hasFinalizedOnDate = Object.values(nextPinchMap).some(
          (e) =>
            e &&
            e.substituteTeacherId &&
            e.date === dateObj.date &&
            String(e.absentTeacherId) === String(absentTid)
        );
        if (hasFinalizedOnDate) {
          addedAbsences.push({
            date: dateObj.date,
            day: dateObj.day,
            teacherId: String(absentTid),
            teacherName: getTeacherName(absentTid),
            fromPeriod: startP,
            toPeriod: endP,
            reason: absenceReason,
          });
        }
      });
    });

    setPinchHitMap(nextPinchMap);
    persistPinchHitMap(nextPinchMap);
    upsertRecordedAbsences(addedAbsences);
    pruneRecordedAbsencesWithoutPinchHits(nextPinchMap, removedPairs);
    if (cancelledEntries.length > 0) {
      archiveCancelledEntries(cancelledEntries, "Cancelled during schedule edit");
    }
    setDraftChanges({});
    setSaveNotice(
      `Saved & finalized ${draftEntries.length} pinch-hit update${
        draftEntries.length === 1 ? "" : "s"
      } to Upcoming Schedules and History.`
    );
  };

  const handleDiscardDraft = () => {
    setDraftChanges({});
    setSaveNotice("");
  };

  const startP = Math.min(Number(fromPeriod) || minPeriod, Number(toPeriod) || maxPeriod);
  const endP = Math.max(Number(fromPeriod) || minPeriod, Number(toPeriod) || maxPeriod);

  const rangePeriods = useMemo(
    () => periods.filter((p) => p >= startP && p <= endP),
    [periods, startP, endP]
  );

  // Reset stages clearing assignments for the active date range, period window, and selected absent teacher(s)
  const clearSelectedAbsentTeachersPinchHits = () => {
    const selectedDateSet = new Set(selectedAbsenceDays.map((d) => d.date));
    const selectedPeriodSet = new Set(rangePeriods.map((p) => Number(p)));
    const selectedAbsentSet = new Set(absentTeacherIds.map((id) => String(id)));

    setDraftChanges((prev) => {
      const next = { ...prev };
      Object.keys(effectivePinchHitMap).forEach((k) => {
        const entry = effectivePinchHitMap[k];
        const parts = k.split("|");
        const entryDate = entry?.date || parts[0];
        const entryPeriod = Number(entry?.period || String(parts[1] || "").replace(/\D/g, ""));
        const entryAbsentId = String(entry?.absentTeacherId || parts[2] || "");
        if (
          selectedDateSet.has(entryDate) &&
          selectedPeriodSet.has(entryPeriod) &&
          selectedAbsentSet.has(entryAbsentId)
        ) {
          if (pinchHitMap[k]) {
            next[k] = null;
          } else {
            delete next[k];
          }
        }
      });
      return next;
    });
  };

  const getTimeForPeriod = (dayName, periodNum) => {
    const idx = periods.indexOf(periodNum);
    if (idx === -1) return `Period ${periodNum}`;
    const isShort = shortenedSessionDays.includes(dayName);
    return (isShort ? shortenedTimes[idx] : regularTimes[idx]) || `Period ${periodNum}`;
  };

  const getTeacherObj = (tid) => {
    if (!tid) return null;
    return (
      teachersById.get(tid) ||
      teachersById.get(String(tid)) ||
      teachersById.get(Number(tid)) ||
      (Array.isArray(teachers)
        ? teachers.find((t) => String(t?.id) === String(tid))
        : null)
    );
  };

  // Competency & workload profile per teacher
  const teacherCompetencyProfile = useMemo(() => {
    const profileMap = new Map();
    allTeacherIds.forEach((tid) => {
      const tObj = getTeacherObj(tid);
      const subjectNames = new Set();
      const subjectAreas = new Set();
      const subjectIds = new Set();
      const gradeLevels = new Set();
      const spaStreams = new Set();

      const captureSpaStream = (rawText) => {
        const txt = String(rawText || "").toLowerCase();
        [
          "dance arts",
          "dance",
          "media arts",
          "instrumental music",
          "vocal",
          "visual arts",
          "theater arts",
          "theatre arts",
          "creative writing",
        ].forEach((kw) => {
          if (txt.includes(kw)) spaStreams.add(kw);
        });
      };

      if (tObj) {
        if (tObj.major) {
          subjectNames.add(String(tObj.major).toLowerCase().trim());
          const area = normalizeSubjectAreaKey(tObj.major);
          if (area) subjectAreas.add(area);
          captureSpaStream(tObj.major);
        }
        if (tObj.minor) {
          subjectNames.add(String(tObj.minor).toLowerCase().trim());
          const area = normalizeSubjectAreaKey(tObj.minor);
          if (area) subjectAreas.add(area);
          captureSpaStream(tObj.minor);
        }
        if (tObj.specialization) {
          subjectNames.add(String(tObj.specialization).toLowerCase().trim());
          const area = normalizeSubjectAreaKey(tObj.specialization);
          if (area) subjectAreas.add(area);
          captureSpaStream(tObj.specialization);
        }
        if (Array.isArray(tObj.subjectExpertise)) {
          tObj.subjectExpertise.forEach((s) => {
            subjectNames.add(String(s).toLowerCase().trim());
            const area = normalizeSubjectAreaKey(s);
            if (area) subjectAreas.add(area);
            captureSpaStream(s);
          });
        }
        if (Array.isArray(tObj.subjects)) {
          tObj.subjects.forEach((s) => {
            subjectIds.add(String(s));
            const sName = getSubjectName(s);
            subjectNames.add(String(sName).toLowerCase().trim());
            const area = normalizeSubjectAreaKey(sName);
            if (area) subjectAreas.add(area);
            captureSpaStream(sName);
          });
        }
        // Check both gradeLevelAssignments (FacultyManagement canonical) and gradeLevels
        const rawGradesSource = tObj.gradeLevelAssignments ?? tObj.gradeLevels;
        const gradeText = Array.isArray(rawGradesSource)
          ? rawGradesSource.join(" ")
          : String(rawGradesSource || "");
        const matchedGrades = gradeText.match(/\b(7|8|9|10|11|12)\b/g) || [];
        matchedGrades.forEach((gNumStr) => {
          gradeLevels.add(Number(gNumStr));
        });
      }

      let weeklyLoad = 0;
      const dayLoadMap = {};
      days.forEach((d) => {
        dayLoadMap[d] = 0;
        periods.forEach((p) => {
          const cell = getTeacherCellAssignment ? getTeacherCellAssignment(tid, d, p) : null;
          if (cell && cell.assignment) {
            weeklyLoad += 1;
            dayLoadMap[d] += 1;
            if (cell.streamName) {
              captureSpaStream(cell.streamName);
              subjectNames.add(String(cell.streamName).toLowerCase().trim());
            }
            if (cell.assignment.subjectId) {
              subjectIds.add(String(cell.assignment.subjectId));
              const sName = getSubjectName(cell.assignment.subjectId);
              if (sName) {
                subjectNames.add(String(sName).toLowerCase().trim());
                const area = normalizeSubjectAreaKey(sName);
                if (area) subjectAreas.add(area);
                captureSpaStream(sName);
              }
            }
            if (cell.sectionId) {
              const secObj =
                sectionsById.get(cell.sectionId) || sectionsById.get(String(cell.sectionId));
              const secName = getSectionName(cell.sectionId);
              const gNum = extractGradeNumber(secObj, cell.sectionId, secName);
              if (gNum) gradeLevels.add(gNum);
            }
          }
        });
      });

      profileMap.set(String(tid), {
        teacherObj: tObj,
        subjectIds,
        subjectNames: Array.from(subjectNames).filter(Boolean),
        subjectAreas: Array.from(subjectAreas).filter(Boolean),
        spaStreams: Array.from(spaStreams).filter(Boolean),
        gradeLevels: Array.from(gradeLevels).sort((a, b) => a - b),
        weeklyLoad,
        dayLoadMap,
      });
    });
    return profileMap;
  }, [
    allTeacherIds,
    days,
    periods,
    getTeacherCellAssignment,
    getSubjectName,
    getSectionName,
    sectionsById,
    teachers,
    teachersById,
  ]);

  const isTeacherMarkedUnavailable = (tid, day, periodNum) => {
    const tObj = getTeacherObj(tid);
    if (!tObj) return false;
    const unavail = tObj.unavailablePeriods || tObj.unavailableSlots || [];
    if (!Array.isArray(unavail)) return false;
    return unavail.some((entry) => {
      if (typeof entry === "string") {
        return (
          entry === `${day}-P${periodNum}` ||
          entry === `${day}|${periodNum}` ||
          entry === `All Days-P${periodNum}`
        );
      }
      if (entry && typeof entry === "object") {
        const dayMatch = !entry.day || entry.day === "All Days" || entry.day === day;
        const pMatch = Number(entry.period) === Number(periodNum);
        return dayMatch && pMatch;
      }
      return false;
    });
  };

  const absentTeacherSet = useMemo(
    () => new Set(absentTeacherIds.map((id) => String(id))),
    [absentTeacherIds]
  );

  // Index active pinch-hit entries (finalized + staged draft) by date+period and by pinch-hitter for double-booking checks & rotation fairness
  const { pinchByDatePeriod, pinchHistoryByTeacher } = useMemo(() => {
    const byDP = new Map();
    const bySub = new Map();

    Object.entries(effectivePinchHitMap || {}).forEach(([k, entry]) => {
      if (
        !entry ||
        !entry.substituteTeacherId ||
        String(entry.substituteTeacherId) === CO_TEACHERS_COVERAGE_ID ||
        !entry.date
      ) {
        return;
      }
      const dpKey = `${entry.date}|P${Number(entry.period)}`;
      if (!byDP.has(dpKey)) byDP.set(dpKey, []);
      byDP.get(dpKey).push({ key: k, ...entry });

      const subId = String(entry.substituteTeacherId);
      if (!bySub.has(subId)) bySub.set(subId, []);
      bySub.get(subId).push({ key: k, ...entry });
    });

    return { pinchByDatePeriod: byDP, pinchHistoryByTeacher: bySub };
  }, [effectivePinchHitMap]);

  // Index previously recorded absent teachers by `${date}|${teacherId}` so earlier waves exclude them as candidates
  const absentByDatePeriod = useMemo(() => {
    const map = new Map();

    Object.values(recordedAbsencesMap || {}).forEach((entry) => {
      if (!entry || !entry.date || !entry.teacherId) return;
      const key = `${entry.date}|${String(entry.teacherId)}`;
      map.set(key, {
        fromPeriod: Number(entry.fromPeriod) || minPeriod,
        toPeriod: Number(entry.toPeriod) || maxPeriod,
        reason: entry.reason || "Recorded Absent",
      });
    });

    Object.values(pinchHitMap || {}).forEach((entry) => {
      if (!entry || !entry.date || !entry.absentTeacherId || !entry.substituteTeacherId) return;
      const key = `${entry.date}|${String(entry.absentTeacherId)}`;
      if (!map.has(key)) {
        map.set(key, {
          fromPeriod: minPeriod,
          toPeriod: maxPeriod,
          reason: entry.reason || "Recorded Absent",
        });
      }
    });

    return map;
  }, [recordedAbsencesMap, pinchHitMap, minPeriod, maxPeriod]);

  // Detect cascade conflicts: teachers newly marked absent who are already covering another teacher on the selected date(s)/period(s)
  const cascadeConflicts = useMemo(() => {
    if (absentTeacherIds.length === 0 || selectedAbsenceDays.length === 0 || rangePeriods.length === 0) {
      return [];
    }
    const selectedDateSet = new Set(selectedAbsenceDays.map((d) => d.date));
    const selectedPeriodSet = new Set(rangePeriods.map((p) => Number(p)));
    const conflicts = [];

    Object.entries(pinchHitMap || {}).forEach(([key, entry]) => {
      if (
        !entry ||
        !entry.substituteTeacherId ||
        String(entry.substituteTeacherId) === CO_TEACHERS_COVERAGE_ID ||
        !entry.date
      ) {
        return;
      }
      if (
        selectedDateSet.has(entry.date) &&
        selectedPeriodSet.has(Number(entry.period)) &&
        absentTeacherSet.has(String(entry.substituteTeacherId))
      ) {
        const dt = parseLocalYMD(entry.date);
        conflicts.push({
          key,
          ...entry,
          substituteNameResolved: entry.substituteTeacherName || getTeacherName(entry.substituteTeacherId),
          absentNameResolved: entry.absentTeacherName || getTeacherName(entry.absentTeacherId),
          shortDateLabel: dt
            ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : entry.date,
        });
      }
    });

    conflicts.sort((a, b) => {
      if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
      if (Number(a.period) !== Number(b.period)) return Number(a.period) - Number(b.period);
      return String(a.substituteNameResolved).localeCompare(String(b.substituteNameResolved));
    });

    return conflicts;
  }, [pinchHitMap, selectedAbsenceDays, rangePeriods, absentTeacherIds.length, absentTeacherSet, getTeacherName]);

  // Build affected classes across ALL selected absence dates -> periods -> absent teachers
  const affectedClasses = useMemo(() => {
    const list = [];

    selectedAbsenceDays.forEach((dateObj) => {
      const targetDateMs = parseLocalYMD(dateObj.date)?.getTime() || 0;

      rangePeriods.forEach((periodNum) => {
        const dpEntries = pinchByDatePeriod.get(`${dateObj.date}|P${periodNum}`) || [];

        absentTeacherIds.forEach((absentTid) => {
          const found = getTeacherCellAssignment
            ? getTeacherCellAssignment(absentTid, dateObj.day, periodNum)
            : null;
          if (!found) return;

          const classKey = `${dateObj.date}|P${periodNum}|${absentTid}`;
          const subjectId = found?.assignment?.subjectId || "";
          const streamName = found?.streamName || "";
          const baseSubjectName = subjectId ? getSubjectName(subjectId) : "";
          const subjectName =
            streamName && !baseSubjectName.toLowerCase().includes(streamName.toLowerCase())
              ? `${baseSubjectName} (${streamName})`
              : baseSubjectName;
          const targetSubjectArea = normalizeSubjectAreaKey(subjectName);
          const sectionId = found?.sectionId || "";
          const sectionName = sectionId ? getSectionName(sectionId) : "";
          const secObj = sectionsById.get(sectionId) || sectionsById.get(String(sectionId));
          const targetGrade = extractGradeNumber(secObj, sectionId, sectionName);

          // Gather co-teachers / breakout teachers sharing this same section & period
          const coTeacherMap = new Map();
          const addCoTeacher = (tidVal, ctStream = "") => {
            if (!tidVal) return;
            const ctStr = String(tidVal);
            if (ctStr === String(absentTid)) return;
            if (!coTeacherMap.has(ctStr)) {
              const recAbs = absentByDatePeriod.get(`${dateObj.date}|${ctStr}`);
              const isRecAbs = Boolean(
                recAbs && periodNum >= recAbs.fromPeriod && periodNum <= recAbs.toPeriod
              );
              const isAbsent = absentTeacherSet.has(ctStr) || isRecAbs;
              coTeacherMap.set(ctStr, {
                teacherId: ctStr,
                teacherName: getTeacherName(ctStr),
                streamName: ctStream,
                isAbsent,
              });
            }
          };
          if (Array.isArray(found?.assignment?.breakoutAssignments)) {
            found.assignment.breakoutAssignments.forEach((b) =>
              addCoTeacher(b?.teacherId, b?.stream || "")
            );
          }
          if (found?.assignment?.teacherId) {
            addCoTeacher(found.assignment.teacherId, "");
          }
          if (Array.isArray(found?.assignment?.coTeacherIds)) {
            found.assignment.coTeacherIds.forEach((ctId) => addCoTeacher(ctId, ""));
          }
          const coTeachers = Array.from(coTeacherMap.values());
          const presentCoTeachers = coTeachers.filter((ct) => !ct.isAbsent);
          const absentCoTeachers = coTeachers.filter((ct) => ct.isAbsent);

          // Prevent cross-session double-booking: check ALL pinch-hit entries at this exact (date, period)
          const alreadyPinchHittingInPeriod = new Map();
          dpEntries.forEach((entry) => {
            if (String(entry.absentTeacherId) === String(absentTid)) return;
            if (entry.substituteTeacherId) {
              alreadyPinchHittingInPeriod.set(String(entry.substituteTeacherId), entry);
            }
          });

          let excludedAbsentCount = 0;
          let excludedPinchHittingCount = 0;
          let excludedRegularClassCount = 0;
          let excludedUnavailableCount = 0;

          const candidates = allTeacherIds
            .filter((tid) => !absentTeacherSet.has(String(tid)))
            .map((tid) => {
              const tidStr = String(tid);
              const existingClass = getTeacherCellAssignment
                ? getTeacherCellAssignment(tid, dateObj.day, periodNum)
                : null;
              const markedUnavail = isTeacherMarkedUnavailable(tid, dateObj.day, periodNum);
              const assignedOtherSub = alreadyPinchHittingInPeriod.get(tidStr);
              const recordedAbsentInfo = absentByDatePeriod.get(`${dateObj.date}|${tidStr}`);
              const isRecordedAbsent = Boolean(
                recordedAbsentInfo &&
                  periodNum >= recordedAbsentInfo.fromPeriod &&
                  periodNum <= recordedAbsentInfo.toPeriod
              );
              const isFree =
                !existingClass && !markedUnavail && !assignedOtherSub && !isRecordedAbsent;

              if (isRecordedAbsent) {
                excludedAbsentCount += 1;
              } else if (assignedOtherSub) {
                excludedPinchHittingCount += 1;
              } else if (existingClass) {
                excludedRegularClassCount += 1;
              } else if (markedUnavail) {
                excludedUnavailableCount += 1;
              }

              const prof = teacherCompetencyProfile.get(tidStr);
              const dayLoad = prof?.dayLoadMap?.[dateObj.day] || 0;
              const weeklyLoad = prof?.weeklyLoad || 0;
              const tObj = prof?.teacherObj;

              const subEntries = pinchHistoryByTeacher.get(tidStr) || [];
              let pinchHitsOnSameDate = 0;
              let recent30dPinchHits = 0;
              subEntries.forEach((e) => {
                const isSelfCell =
                  e.date === dateObj.date &&
                  Number(e.period) === Number(periodNum) &&
                  String(e.absentTeacherId) === String(absentTid);
                if (isSelfCell) return;
                if (e.date === dateObj.date) {
                  pinchHitsOnSameDate += 1;
                }
                const entryMs = parseLocalYMD(e.date)?.getTime() || 0;
                const diffDays = (targetDateMs - entryMs) / 86400000;
                if (diffDays >= 0 && diffDays <= 30) {
                  recent30dPinchHits += 1;
                }
              });

              const cleanTargetSub = String(subjectName || "")
                .toLowerCase()
                .replace(/\s+\d+$/, "")
                .trim();
              const cleanStreamLower = String(streamName || "").toLowerCase().trim();
              const isExactSpaStreamMatch = Boolean(
                cleanStreamLower &&
                  (prof?.spaStreams?.some(
                    (st) => cleanStreamLower.includes(st) || st.includes(cleanStreamLower)
                  ) ||
                    prof?.subjectNames?.some((s) => s.includes(cleanStreamLower)))
              );
              const isSubjectMatch = Boolean(
                (subjectId && prof?.subjectIds?.has(String(subjectId))) ||
                  (targetSubjectArea && prof?.subjectAreas?.includes(targetSubjectArea)) ||
                  isExactSpaStreamMatch ||
                  (cleanTargetSub &&
                    prof?.subjectNames?.some(
                      (s) => s.includes(cleanTargetSub) || cleanTargetSub.includes(s)
                    ))
              );
              const isRelatedSubjectMatch = Boolean(
                !isSubjectMatch &&
                  targetSubjectArea === "SPA Specialization" &&
                  prof?.subjectAreas?.includes("MAPEH")
              );

              const isGradeMatch = Boolean(
                targetGrade && prof?.gradeLevels?.includes(Number(targetGrade))
              );

              // Transparent 100-Point Scoring Rubric:
              // 1. Free This Period (no class, unavailable slot, or pinch-hit conflict): 40 pts
              // 2. Subject Area Match (30 exact, or 18 related fallback e.g. MAPEH for SPA): up to 30 pts
              // 3. Grade Level Match: 15 pts
              // 4. Daily Workload Headroom (based on regular load + same-day pinch-hits vs 6-period baseline): up to 10 pts
              // 5. Rotation Fairness (fewer recent pinch-hits in past 30 days): up to 5 pts
              const effectiveDayLoad = dayLoad + pinchHitsOnSameDate;
              let availabilityPts = 0;
              let subjectPts = 0;
              let gradePts = 0;
              let workloadPts = 0;
              let fairnessPts = 0;

              if (isFree) {
                availabilityPts = 40;
                subjectPts = isSubjectMatch ? 30 : isRelatedSubjectMatch ? 18 : 0;
                gradePts = isGradeMatch ? 15 : 0;
                workloadPts = Math.max(
                  0,
                  Math.min(10, Math.round(((6 - effectiveDayLoad) / 6) * 10))
                );
                fairnessPts =
                  recent30dPinchHits === 0
                    ? 5
                    : recent30dPinchHits <= 2
                    ? 3
                    : recent30dPinchHits <= 4
                    ? 1
                    : 0;
              } else {
                subjectPts = isSubjectMatch ? 25 : isRelatedSubjectMatch ? 15 : 0;
                gradePts = isGradeMatch ? 15 : 0;
              }

              const matchScore =
                availabilityPts + subjectPts + gradePts + workloadPts + fairnessPts;

              const scoreBreakdown = [
                { label: "Free This Period", earned: availabilityPts, max: 40 },
                { label: "Subject Area Match", earned: subjectPts, max: 30 },
                { label: "Grade Level Match", earned: gradePts, max: 15 },
                {
                  label: `Daily Load (${dayLoad} reg${pinchHitsOnSameDate > 0 ? ` + ${pinchHitsOnSameDate} sub` : ""} today)`,
                  earned: workloadPts,
                  max: 10,
                },
                {
                  label: `Rotation Fairness (${recent30dPinchHits} recent)`,
                  earned: fairnessPts,
                  max: 5,
                },
              ];

              const scoreTooltip = `Score Basis (${matchScore}%): Free ${availabilityPts}/40 + Subject ${subjectPts}/30 + Grade ${gradePts}/15 + Load ${workloadPts}/10 + Fairness ${fairnessPts}/5`;

              let eligibilityTier = 5;
              let fitLabel = "Has Conflict";
              let eligibilityBadge = "Has Class Conflict";

              if (isFree) {
                const displaySubjectLabel =
                  targetSubjectArea === "SPA Specialization" && streamName
                    ? `SPA — ${streamName}`
                    : targetSubjectArea || subjectName;

                if (isSubjectMatch && isGradeMatch) {
                  eligibilityTier = 1;
                  fitLabel = "Best Fit";
                  eligibilityBadge = `Best Fit (${displaySubjectLabel} • Grade ${targetGrade})`;
                } else if (isSubjectMatch) {
                  eligibilityTier = 2;
                  fitLabel = "Subject Fit";
                  eligibilityBadge = `Subject Fit (${displaySubjectLabel})`;
                } else if (isRelatedSubjectMatch) {
                  eligibilityTier = 3;
                  fitLabel = "Related Fit";
                  eligibilityBadge = isGradeMatch
                    ? `Related Area (MAPEH • Grade ${targetGrade})`
                    : "Related Area (MAPEH)";
                } else if (isGradeMatch) {
                  eligibilityTier = 3;
                  fitLabel = "Grade Fit";
                  eligibilityBadge = `Grade Fit (Grade ${targetGrade})`;
                } else {
                  eligibilityTier = 4;
                  fitLabel = "Available Backup";
                  eligibilityBadge = `Available Backup (${prof?.subjectAreas?.join(", ") || tObj?.major || "General"})`;
                }
              } else if (isRecordedAbsent) {
                fitLabel = "Recorded Absent";
                eligibilityBadge = `Absent (${recordedAbsentInfo.reason || "Recorded"})`;
              } else if (assignedOtherSub) {
                fitLabel = "Already Pinch-Hitting";
                eligibilityBadge = `Covering ${assignedOtherSub.sectionName} (P${periodNum})`;
              }

              const reasons = [];
              if (isFree) {
                reasons.push({
                  ok: true,
                  text: `Available during ${getOrdinal(periodNum)} Period on ${dateObj.shortLabel} (no class or pinch-hit conflict)`,
                });
              } else if (isRecordedAbsent) {
                reasons.push({
                  ok: false,
                  text: `Recorded absent on ${dateObj.shortLabel} (Periods ${recordedAbsentInfo.fromPeriod}-${recordedAbsentInfo.toPeriod}: ${recordedAbsentInfo.reason || "Unavailable"})`,
                });
              } else if (assignedOtherSub) {
                reasons.push({
                  ok: false,
                  text: `Already assigned to pinch-hit ${assignedOtherSub.sectionName} (${assignedOtherSub.absentTeacherName}) in Period ${periodNum}`,
                });
              } else if (existingClass) {
                reasons.push({
                  ok: false,
                  text: `Currently teaching ${getSubjectName(existingClass.assignment?.subjectId)} in ${getSectionName(existingClass.sectionId)}`,
                });
              } else {
                reasons.push({ ok: false, text: "Marked unavailable during this period" });
              }

              if (isSubjectMatch) {
                reasons.push({
                  ok: true,
                  text:
                    targetSubjectArea === "SPA Specialization" && streamName
                      ? `Handles SPA Specialization (${streamName})`
                      : `Handles same subject area (${targetSubjectArea || subjectName})`,
                });
              } else if (isRelatedSubjectMatch) {
                reasons.push({
                  ok: true,
                  text: "Handles related area (MAPEH) as backup when no SPA specialist is free",
                });
              } else {
                reasons.push({
                  ok: true,
                  text: `General backup from ${prof?.subjectAreas?.join(", ") || tObj?.major || "General Department"}`,
                });
              }

              if (isGradeMatch) {
                reasons.push({
                  ok: true,
                  text: `Handles Grade ${targetGrade} level`,
                });
              }

              reasons.push({
                ok: effectiveDayLoad < 6,
                text: `Daily load: ${dayLoad} regular${pinchHitsOnSameDate > 0 ? ` + ${pinchHitsOnSameDate} pinch-hit` : ""} (${weeklyLoad}/wk) • ${recent30dPinchHits} pinch-hits in 30d`,
              });

              const dayTimeline = periods.map((p) => {
                const c = getTeacherCellAssignment
                  ? getTeacherCellAssignment(tid, dateObj.day, p)
                  : null;
                const pEntries = pinchByDatePeriod.get(`${dateObj.date}|P${p}`) || [];
                const subEntry = pEntries.find(
                  (e) =>
                    String(e.substituteTeacherId) === tidStr &&
                    !(
                      e.date === dateObj.date &&
                      Number(e.period) === Number(periodNum) &&
                      String(e.absentTeacherId) === String(absentTid)
                    )
                );
                return {
                  period: p,
                  isCurrentPeriod: p === periodNum,
                  hasClass: Boolean(c),
                  hasSub: Boolean(subEntry),
                  subSectionName: subEntry?.sectionName || "",
                  subAbsentName: subEntry?.absentTeacherName || "",
                  subjectName: c?.assignment?.subjectId ? getSubjectName(c.assignment.subjectId) : "",
                  sectionName: c?.sectionId ? getSectionName(c.sectionId) : "",
                };
              });

              return {
                teacherId: tidStr,
                teacherName: getTeacherName(tid),
                subjectAreaLabel:
                  prof?.subjectAreas?.length > 0
                    ? prof.subjectAreas.join(", ")
                    : tObj?.major || "General",
                gradeLevelsLabel:
                  prof?.gradeLevels?.length > 0
                    ? `Grade ${prof.gradeLevels.join(", ")}`
                    : "All Grades",
                isFree,
                isRecordedAbsent,
                hasAssignment: Boolean(existingClass) || Boolean(assignedOtherSub),
                isSubjectMatch,
                isGradeMatch,
                eligibilityTier,
                fitLabel,
                eligibilityBadge,
                matchScore,
                scoreBreakdown,
                scoreTooltip,
                reasons,
                dayLoad,
                effectiveDayLoad,
                weeklyLoad,
                recent30dPinchHits,
                dayTimeline,
              };
            });

          candidates.sort((a, b) => {
            if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
            if (a.effectiveDayLoad !== b.effectiveDayLoad) return a.effectiveDayLoad - b.effectiveDayLoad;
            return a.teacherName.localeCompare(b.teacherName);
          });

          list.push({
            classKey,
            date: dateObj.date,
            day: dateObj.day,
            shortDateLabel: dateObj.shortLabel,
            longDateLabel: dateObj.longLabel,
            absentTeacherId: String(absentTid),
            absentTeacherName: getTeacherName(absentTid),
            period: periodNum,
            timeLabel: getTimeForPeriod(dateObj.day, periodNum),
            subjectId,
            subjectName,
            streamName,
            targetSubjectArea,
            sectionId,
            sectionName,
            targetGrade,
            isMultiTeacher: coTeachers.length > 0,
            presentCoTeachers,
            absentCoTeachers,
            excludedSummary: {
              absentCount: excludedAbsentCount,
              pinchHittingCount: excludedPinchHittingCount,
              regularClassCount: excludedRegularClassCount,
              unavailableCount: excludedUnavailableCount,
            },
            candidates,
          });
        });
      });
    });

    return list;
  }, [
    selectedAbsenceDays,
    rangePeriods,
    absentTeacherIds,
    absentTeacherSet,
    allTeacherIds,
    getTeacherCellAssignment,
    getSubjectName,
    getSectionName,
    getTeacherName,
    sectionsById,
    teacherCompetencyProfile,
    pinchByDatePeriod,
    pinchHistoryByTeacher,
    absentByDatePeriod,
    periods,
  ]);

  useEffect(() => {
    if (affectedClasses.length > 0) {
      const exists = affectedClasses.some((c) => c.classKey === activeClassKey);
      if (!exists) {
        const firstUnassigned = affectedClasses.find((c) => !effectivePinchHitMap[c.classKey]);
        setActiveClassKey(
          firstUnassigned ? firstUnassigned.classKey : affectedClasses[0].classKey
        );
      }
    } else {
      setActiveClassKey(null);
    }
  }, [affectedClasses, activeClassKey, effectivePinchHitMap]);

  useEffect(() => {
    setShowAllCandidates(false);
    setExpandedTeacherId(null);
  }, [activeClassKey, startDate, endDate]);

  const activeClassObj = useMemo(
    () =>
      affectedClasses.find((c) => c.classKey === activeClassKey) ||
      affectedClasses[0] ||
      null,
    [affectedClasses, activeClassKey]
  );

  const coveredCount = useMemo(
    () => affectedClasses.filter((c) => Boolean(effectivePinchHitMap[c.classKey])).length,
    [affectedClasses, effectivePinchHitMap]
  );

  const uncoveredCount = affectedClasses.length - coveredCount;

  const savedKeysForSelection = useMemo(() => {
    const selectedDateSet = new Set(selectedAbsenceDays.map((d) => d.date));
    const selectedPeriodSet = new Set(rangePeriods.map((p) => Number(p)));
    const selectedAbsentSet = new Set(absentTeacherIds.map((id) => String(id)));
    const keys = [];
    Object.entries(pinchHitMap || {}).forEach(([k, entry]) => {
      if (!entry || !entry.substituteTeacherId) return;
      const parts = k.split("|");
      const entryDate = entry.date || parts[0];
      const entryPeriod = Number(entry.period || String(parts[1] || "").replace(/\D/g, ""));
      const entryAbsentId = String(entry.absentTeacherId || parts[2] || "");
      if (
        selectedDateSet.has(entryDate) &&
        selectedPeriodSet.has(entryPeriod) &&
        selectedAbsentSet.has(entryAbsentId)
      ) {
        keys.push(k);
      }
    });
    return keys;
  }, [pinchHitMap, selectedAbsenceDays, rangePeriods, absentTeacherIds]);

  const handleRequestCancelSavedSelection = () => {
    if (savedKeysForSelection.length === 0) return;
    setCancelConfirmTarget({
      keys: savedKeysForSelection,
      count: savedKeysForSelection.length,
      title: `Cancel ${savedKeysForSelection.length} Scheduled Pinch-Hit${
        savedKeysForSelection.length === 1 ? "" : "s"
      }?`,
      description: `This will cancel ${savedKeysForSelection.length} saved pinch-hit assignment${
        savedKeysForSelection.length === 1 ? "" : "s"
      } only for the currently selected teacher(s), date(s), and period(s). Other waves and dates will not be affected, and cancelled entries will remain logged in History as Cancelled.`,
    });
  };

  const confirmCancelSavedSelection = () => {
    if (!cancelConfirmTarget || !Array.isArray(cancelConfirmTarget.keys)) return;
    const keysToCancel = cancelConfirmTarget.keys;
    if (keysToCancel.length > 0) {
      const nextPinchMap = { ...pinchHitMap };
      const affectedPairs = [];
      const cancelledEntries = [];
      keysToCancel.forEach((k) => {
        const entry = nextPinchMap[k];
        if (entry?.date && entry?.absentTeacherId) {
          affectedPairs.push({ date: entry.date, teacherId: String(entry.absentTeacherId) });
        }
        if (entry && entry.substituteTeacherId) {
          cancelledEntries.push({ key: k, ...entry });
        }
        delete nextPinchMap[k];
      });
      setPinchHitMap(nextPinchMap);
      persistPinchHitMap(nextPinchMap);
      pruneRecordedAbsencesWithoutPinchHits(nextPinchMap, affectedPairs);
      if (cancelledEntries.length > 0) {
        archiveCancelledEntries(cancelledEntries, "Cancelled from Assign Pinch-Hitters");
      }
      setDraftChanges((prev) => {
        const nextDraft = { ...prev };
        let changed = false;
        keysToCancel.forEach((k) => {
          if (Object.prototype.hasOwnProperty.call(nextDraft, k)) {
            delete nextDraft[k];
            changed = true;
          }
        });
        return changed ? nextDraft : prev;
      });
      setSaveNotice(
        `Cancelled ${keysToCancel.length} pinch-hit assignment${
          keysToCancel.length === 1 ? "" : "s"
        } for the selected teacher(s). Recorded in History as Cancelled.`
      );
    }
    setCancelConfirmTarget(null);
  };

  // Group affected classes by calendar date for clear multi-day rendering
  const affectedClassesByDate = useMemo(() => {
    const groups = [];
    const byDateMap = new Map();
    affectedClasses.forEach((cls) => {
      if (!byDateMap.has(cls.date)) {
        const grp = {
          date: cls.date,
          day: cls.day,
          shortLabel: cls.shortDateLabel,
          longLabel: cls.longDateLabel,
          classes: [],
        };
        byDateMap.set(cls.date, grp);
        groups.push(grp);
      }
      byDateMap.get(cls.date).classes.push(cls);
    });
    return groups;
  }, [affectedClasses]);

  // Reset left-panel filters automatically when their target date or teacher leaves selection
  useEffect(() => {
    if (
      classListDateFilter !== "all" &&
      !selectedAbsenceDays.some((d) => d.date === classListDateFilter)
    ) {
      setClassListDateFilter("all");
    }
  }, [selectedAbsenceDays, classListDateFilter]);

  useEffect(() => {
    if (
      classListTeacherFilter !== "all" &&
      !absentTeacherIds.includes(classListTeacherFilter)
    ) {
      setClassListTeacherFilter("all");
    }
  }, [absentTeacherIds, classListTeacherFilter]);

  const filteredAffectedClassesByDate = useMemo(() => {
    return affectedClassesByDate
      .filter((grp) => classListDateFilter === "all" || grp.date === classListDateFilter)
      .map((grp) => ({
        ...grp,
        classes: grp.classes.filter((cls) => {
          if (
            classListTeacherFilter !== "all" &&
            String(cls.absentTeacherId) !== String(classListTeacherFilter)
          ) {
            return false;
          }
          const isCovered = Boolean(effectivePinchHitMap[cls.classKey]?.substituteTeacherId);
          if (classListStatusFilter === "unassigned" && isCovered) return false;
          if (classListStatusFilter === "covered" && !isCovered) return false;
          return true;
        }),
      }))
      .filter((grp) => grp.classes.length > 0);
  }, [
    affectedClassesByDate,
    classListDateFilter,
    classListTeacherFilter,
    classListStatusFilter,
    effectivePinchHitMap,
  ]);

  // Explicit button only: fills UNCOVERED classes in working draft without touching finalized records or double-booking
  const handleAutoAssignAll = () => {
    const workingMap = { ...effectivePinchHitMap };
    const stagedUpdates = {};
    const usedInDatePeriod = new Map(); // `${date}|P${period}` -> Set of substituteTeacherIds
    const usedOnDateCount = new Map(); // `${date}|${substituteId}` -> count
    const usedInRangeCount = new Map(); // substituteId -> count across entire auto-assign run

    const markUsed = (dateStr, periodNum, subId) => {
      const dpKey = `${dateStr}|P${periodNum}`;
      if (!usedInDatePeriod.has(dpKey)) usedInDatePeriod.set(dpKey, new Set());
      usedInDatePeriod.get(dpKey).add(String(subId));

      const dKey = `${dateStr}|${subId}`;
      usedOnDateCount.set(dKey, (usedOnDateCount.get(dKey) || 0) + 1);
      usedInRangeCount.set(String(subId), (usedInRangeCount.get(String(subId)) || 0) + 1);
    };

    // Seed with ALL finalized + manual draft assignments on the selected dates so double-booking never occurs
    const selectedDateSet = new Set(selectedAbsenceDays.map((d) => d.date));
    Object.values(workingMap).forEach((entry) => {
      if (
        entry &&
        entry.date &&
        selectedDateSet.has(entry.date) &&
        entry.substituteTeacherId &&
        String(entry.substituteTeacherId) !== CO_TEACHERS_COVERAGE_ID
      ) {
        markUsed(entry.date, entry.period, entry.substituteTeacherId);
      }
    });

    affectedClasses.forEach((cls) => {
      // Preserve existing finalized or manually staged assignments
      if (workingMap[cls.classKey]?.substituteTeacherId) {
        return;
      }

      const dpKey = `${cls.date}|P${cls.period}`;
      const busySubs = usedInDatePeriod.get(dpKey) || new Set();

      const availablePool = cls.candidates.filter(
        (c) => c.isFree && !busySubs.has(c.teacherId)
      );
      if (availablePool.length === 0) return;

      availablePool.sort((a, b) => {
        const dayCountA = usedOnDateCount.get(`${cls.date}|${a.teacherId}`) || 0;
        const dayCountB = usedOnDateCount.get(`${cls.date}|${b.teacherId}`) || 0;
        const rangeCountA = usedInRangeCount.get(a.teacherId) || 0;
        const rangeCountB = usedInRangeCount.get(b.teacherId) || 0;
        const adjScoreA = a.matchScore - dayCountA * 4 - rangeCountA * 2;
        const adjScoreB = b.matchScore - dayCountB * 4 - rangeCountB * 2;
        return adjScoreB - adjScoreA;
      });

      const chosen = availablePool[0];
      markUsed(cls.date, cls.period, chosen.teacherId);

      const entryObj = {
        id: cls.classKey,
        date: cls.date,
        day: cls.day,
        period: cls.period,
        timeLabel: cls.timeLabel,
        absentTeacherId: cls.absentTeacherId,
        absentTeacherName: cls.absentTeacherName,
        substituteTeacherId: chosen.teacherId,
        substituteTeacherName: chosen.teacherName,
        sectionId: cls.sectionId || "",
        sectionName: cls.sectionName || "",
        subjectId: cls.subjectId || "",
        subjectName: cls.subjectName || "",
        eligibilityLabel: chosen.eligibilityBadge,
        matchScore: chosen.matchScore,
        reason: absenceReason,
        memoNumber: memoNumber,
        updatedAt: new Date().toISOString(),
      };
      workingMap[cls.classKey] = entryObj;
      stagedUpdates[cls.classKey] = entryObj;
    });

    if (Object.keys(stagedUpdates).length > 0) {
      setSaveNotice("");
      setDraftChanges((prev) => ({ ...prev, ...stagedUpdates }));
    }
  };

  const handleOpenActiveFormalLetter = () => {
    setLetterSourceOverride(null);
    setShowLetterModal(true);
  };

  // Unified data source for the Formal Letter modal (either live workspace or re-opened from History / Upcoming)
  const letterContext = useMemo(() => {
    if (letterSourceOverride) {
      return letterSourceOverride;
    }

    const rows = affectedClasses.map((cls) => {
      const assigned = effectivePinchHitMap[cls.classKey];
      const hasAssignedSub = Boolean(assigned?.substituteTeacherId);
      return {
        rowKey: cls.classKey,
        date: cls.date,
        day: cls.day,
        shortDateLabel: cls.shortDateLabel,
        period: cls.period,
        timeLabel: cls.timeLabel,
        absentTeacherId: cls.absentTeacherId,
        absentTeacherName: cls.absentTeacherName,
        sectionName: cls.sectionName,
        subjectName: cls.subjectName,
        isAssigned: hasAssignedSub,
        substituteTeacherId: hasAssignedSub ? String(assigned.substituteTeacherId) : "",
        substituteTeacherName: hasAssignedSub ? assigned.substituteTeacherName : "",
        basis: hasAssignedSub ? (assigned.eligibilityLabel || "Assigned Pinch-Hitter") : "Unassigned",
      };
    });

    return {
      rows,
      memoNumber,
      reason: absenceReason,
      startDate,
      endDate,
      periodRangeText: `${getOrdinal(startP)} to ${getOrdinal(endP)} Period`,
    };
  }, [letterSourceOverride, affectedClasses, effectivePinchHitMap, memoNumber, absenceReason, startDate, endDate, startP, endP]);

  const unassignedLetterCount = useMemo(
    () => letterContext.rows.filter((r) => !r.isAssigned).length,
    [letterContext]
  );

  // Build pages for the active letter mode ("consolidated" | "per-substitute" | "per-absent")
  const letterPages = useMemo(() => {
    const rows = letterContext.rows || [];
    const distinctDates = Array.from(new Set(rows.map((r) => r.date).filter(Boolean))).sort();
    const showDateColumn = distinctDates.length > 1;

    const buildAbsentSummary = (pageRows) =>
      Array.from(new Set(pageRows.map((r) => r.absentTeacherName).filter(Boolean))).join(", ");

    const buildSubSummary = (pageRows) =>
      Array.from(
        new Set(
          pageRows
            .filter((r) => r.isAssigned && r.substituteTeacherName)
            .map((r) => r.substituteTeacherName.toUpperCase())
        )
      ).join("; ");

    if (letterMode === "per-substitute") {
      const subMap = new Map();
      rows.forEach((r) => {
        if (!r.isAssigned || !r.substituteTeacherId) return;
        if (!subMap.has(r.substituteTeacherId)) {
          subMap.set(r.substituteTeacherId, {
            id: r.substituteTeacherId,
            name: r.substituteTeacherName,
            rows: [],
          });
        }
        subMap.get(r.substituteTeacherId).rows.push(r);
      });

      const subGroups = Array.from(subMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      if (subGroups.length === 0) {
        return [
          {
            pageKey: "per-sub-empty",
            toLine: "NO DESIGNATED SUBSTITUTE ASSIGNED YET",
            absentNamesText: buildAbsentSummary(rows) || "SELECTED FACULTY",
            isPluralAbsent: new Set(rows.map((r) => r.absentTeacherId)).size > 1,
            pageStartDate: letterContext.startDate,
            pageEndDate: letterContext.endDate,
            periodRangeText: letterContext.periodRangeText,
            showDateColumn,
            rows: [],
            emptyNotice:
              "No substitute teachers have been assigned yet. Assign substitutes first or switch to Consolidated view.",
          },
        ];
      }

      return subGroups.map((grp) => {
        const grpDates = Array.from(new Set(grp.rows.map((r) => r.date))).sort();
        const grpPeriods = grp.rows.map((r) => Number(r.period)).filter(Boolean);
        const minP = grpPeriods.length > 0 ? Math.min(...grpPeriods) : startP;
        const maxGrpP = grpPeriods.length > 0 ? Math.max(...grpPeriods) : endP;
        return {
          pageKey: `sub-${grp.id}`,
          toLine: grp.name.toUpperCase(),
          absentNamesText: buildAbsentSummary(grp.rows),
          isPluralAbsent: new Set(grp.rows.map((r) => r.absentTeacherId)).size > 1,
          pageStartDate: grpDates[0] || letterContext.startDate,
          pageEndDate: grpDates[grpDates.length - 1] || letterContext.endDate,
          periodRangeText:
            minP === maxGrpP
              ? `${getOrdinal(minP)} Period`
              : `${getOrdinal(minP)} to ${getOrdinal(maxGrpP)} Period`,
          showDateColumn: grpDates.length > 1 || showDateColumn,
          rows: grp.rows,
          emptyNotice: "",
        };
      });
    }

    if (letterMode === "per-absent") {
      const absMap = new Map();
      rows.forEach((r) => {
        if (!absMap.has(r.absentTeacherId)) {
          absMap.set(r.absentTeacherId, {
            id: r.absentTeacherId,
            name: r.absentTeacherName,
            rows: [],
          });
        }
        absMap.get(r.absentTeacherId).rows.push(r);
      });

      const absGroups = Array.from(absMap.values());
      if (absGroups.length === 0) {
        return [
          {
            pageKey: "per-abs-empty",
            toLine: "DESIGNATED PINCH-HIT / SUBSTITUTE FACULTY MEMBER(S)",
            absentNamesText: "SELECTED FACULTY",
            isPluralAbsent: false,
            pageStartDate: letterContext.startDate,
            pageEndDate: letterContext.endDate,
            periodRangeText: letterContext.periodRangeText,
            showDateColumn,
            rows: [],
            emptyNotice: "No affected classes found for the current selection.",
          },
        ];
      }

      return absGroups.map((grp) => {
        const grpDates = Array.from(new Set(grp.rows.map((r) => r.date))).sort();
        const grpPeriods = grp.rows.map((r) => Number(r.period)).filter(Boolean);
        const minP = grpPeriods.length > 0 ? Math.min(...grpPeriods) : startP;
        const maxGrpP = grpPeriods.length > 0 ? Math.max(...grpPeriods) : endP;
        return {
          pageKey: `abs-${grp.id}`,
          toLine: buildSubSummary(grp.rows) || "DESIGNATED PINCH-HIT / SUBSTITUTE FACULTY MEMBER(S)",
          absentNamesText: grp.name,
          isPluralAbsent: false,
          pageStartDate: grpDates[0] || letterContext.startDate,
          pageEndDate: grpDates[grpDates.length - 1] || letterContext.endDate,
          periodRangeText:
            minP === maxGrpP
              ? `${getOrdinal(minP)} Period`
              : `${getOrdinal(minP)} to ${getOrdinal(maxGrpP)} Period`,
          showDateColumn: grpDates.length > 1,
          rows: grp.rows,
          emptyNotice: grp.rows.length === 0 ? "No affected classes for this absent teacher." : "",
        };
      });
    }

    return [
      {
        pageKey: "consolidated",
        toLine: buildSubSummary(rows) || "DESIGNATED PINCH-HIT / SUBSTITUTE FACULTY MEMBER(S)",
        absentNamesText: buildAbsentSummary(rows) || "SELECTED FACULTY",
        isPluralAbsent: new Set(rows.map((r) => r.absentTeacherId)).size > 1,
        pageStartDate: letterContext.startDate,
        pageEndDate: letterContext.endDate,
        periodRangeText: letterContext.periodRangeText,
        showDateColumn,
        rows,
        emptyNotice: rows.length === 0 ? "No affected classes found for the current selection." : "",
      },
    ];
  }, [letterContext, letterMode, startP, endP]);

  const handleExportFormalLetterPdf = () => {
    if (!letterRef.current) return;
    const activeMemo = letterContext.memoNumber || memoNumber || "MEMO";
    const fileDate = letterContext.startDate || startDate;

    const exportClone = letterRef.current.cloneNode(true);
    exportClone.style.width = "100%";
    exportClone.style.maxWidth = "none";
    exportClone.style.margin = "0";
    exportClone.style.padding = "0";
    exportClone.style.background = "#ffffff";

    exportClone.querySelectorAll(".pinch-letter-page").forEach((pageEl) => {
      pageEl.style.display = "block";
      pageEl.style.width = "100%";
      pageEl.style.minHeight = "auto";
      pageEl.style.height = "auto";
      pageEl.style.padding = "0";
      pageEl.style.margin = "0";
      pageEl.style.border = "none";
      pageEl.style.boxShadow = "none";
    });

    const opt = {
      margin: [12, 14, 12, 14],
      filename: `PinchHit_Letter_${activeMemo}_${fileDate}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"], avoid: ["tr", ".pinch-no-break"] },
    };
    html2pdf().set(opt).from(exportClone).save();
  };

  const absentTeachersNamesText = useMemo(
    () => absentTeacherIds.map((id) => getTeacherName(id)).join(", "),
    [absentTeacherIds, getTeacherName]
  );

  const visibleCandidatesForActiveClass = useMemo(() => {
    if (!activeClassObj) return [];
    const list = activeClassObj.candidates.filter((cand) => {
      if (!includeBusyTeachers && !cand.isFree) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          cand.teacherName.toLowerCase().includes(q) ||
          cand.subjectAreaLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
    if (!showAllCandidates && !searchQuery.trim()) {
      return list.slice(0, 5);
    }
    return list;
  }, [activeClassObj, includeBusyTeachers, searchQuery, showAllCandidates]);

  const totalAvailableForActiveClass = useMemo(() => {
    if (!activeClassObj) return 0;
    return activeClassObj.candidates.filter((c) => c.isFree).length;
  }, [activeClassObj]);

  const filteredPickerTeachers = useMemo(() => {
    if (!absentPickerSearch.trim()) return allTeacherIds;
    const q = absentPickerSearch.toLowerCase().trim();
    return allTeacherIds.filter((tid) =>
      String(getTeacherName(tid)).toLowerCase().includes(q)
    );
  }, [allTeacherIds, absentPickerSearch, getTeacherName]);

  // =====================================================================
  // HISTORY & PINCH-HIT LOG COMPUTATIONS
  // =====================================================================
  const activeFinalizedEntries = useMemo(() => {
    return Object.entries(pinchHitMap || {})
      .filter(([, entry]) => entry && entry.date && entry.substituteTeacherId)
      .map(([key, entry]) => ({
        ...entry,
        key,
        status: "active",
        sourceStore: "active",
        absentNameResolved: entry.absentTeacherName || getTeacherName(entry.absentTeacherId),
        substituteNameResolved: entry.substituteTeacherName || getTeacherName(entry.substituteTeacherId),
      }))
      .sort((a, b) => {
        if (a.date !== b.date) return String(b.date).localeCompare(String(a.date));
        if (Number(a.period) !== Number(b.period)) return Number(a.period) - Number(b.period);
        return String(a.absentNameResolved).localeCompare(String(b.absentNameResolved));
      });
  }, [pinchHitMap, getTeacherName]);

  const allHistoryEntries = useMemo(() => {
    const cancelledList = Object.entries(cancelledHistoryMap || {})
      .filter(([, entry]) => entry && entry.date && entry.substituteTeacherId)
      .map(([key, entry]) => ({
        ...entry,
        key,
        status: "cancelled",
        sourceStore: "cancelled",
        absentNameResolved: entry.absentTeacherName || getTeacherName(entry.absentTeacherId),
        substituteNameResolved: entry.substituteTeacherName || getTeacherName(entry.substituteTeacherId),
      }));

    return [...activeFinalizedEntries, ...cancelledList].sort((a, b) => {
      if (a.date !== b.date) return String(b.date).localeCompare(String(a.date));
      if (Number(a.period) !== Number(b.period)) return Number(a.period) - Number(b.period);
      if (a.status !== b.status) return a.status === "active" ? -1 : 1;
      return String(b.cancelledAt || b.updatedAt || "").localeCompare(
        String(a.cancelledAt || a.updatedAt || "")
      );
    });
  }, [activeFinalizedEntries, cancelledHistoryMap, getTeacherName]);

  const existingCoverageForSelectedDates = useMemo(() => {
    const selectedDateSet = new Set(selectedAbsenceDays.map((d) => d.date));
    if (selectedDateSet.size === 0) {
      return { totalPeriods: 0, absentCount: 0, pinchHitterCount: 0 };
    }
    const matchingEntries = activeFinalizedEntries.filter((e) => selectedDateSet.has(e.date));
    const absentSet = new Set();
    const subSet = new Set();
    matchingEntries.forEach((e) => {
      if (e.absentTeacherId) absentSet.add(String(e.absentTeacherId));
      if (e.substituteTeacherId) subSet.add(String(e.substituteTeacherId));
    });
    Object.values(recordedAbsencesMap || {}).forEach((rec) => {
      if (rec && selectedDateSet.has(rec.date) && rec.teacherId) {
        absentSet.add(String(rec.teacherId));
      }
    });
    return {
      totalPeriods: matchingEntries.length,
      absentCount: absentSet.size,
      pinchHitterCount: subSet.size,
    };
  }, [activeFinalizedEntries, recordedAbsencesMap, selectedAbsenceDays]);

  const handleUnassignCascadeConflict = (conflict, coverNow = false) => {
    if (!conflict?.key) return;
    const prevEntry = pinchHitMap[conflict.key];
    const nextPinchMap = { ...pinchHitMap };
    delete nextPinchMap[conflict.key];
    setPinchHitMap(nextPinchMap);
    persistPinchHitMap(nextPinchMap);
    if (prevEntry && prevEntry.substituteTeacherId) {
      archiveCancelledEntries(
        [{ key: conflict.key, ...prevEntry }],
        "Unassigned due to pinch-hitter absence conflict"
      );
      if (prevEntry.date && prevEntry.absentTeacherId) {
        pruneRecordedAbsencesWithoutPinchHits(nextPinchMap, [
          { date: prevEntry.date, teacherId: String(prevEntry.absentTeacherId) },
        ]);
      }
    }
    if (coverNow && conflict.absentTeacherId) {
      const origAbsentId = String(conflict.absentTeacherId);
      setAbsentTeacherIds((prev) =>
        prev.includes(origAbsentId) ? prev : [...prev, origAbsentId]
      );
      setClassListStatusFilter("all");
      setClassListDateFilter("all");
      setClassListTeacherFilter("all");
      setActiveClassKey(conflict.key);
    }
  };

  const handleViewHistoryForSelectedDates = () => {
    setHistoryFromDate(startDate || "");
    setHistoryToDate(endDate || startDate || "");
    setHistoryStatusFilter("all");
    setHistoryAbsentFilter("all");
    setHistorySubFilter("all");
    setHistoryReasonFilter("all");
    setHistorySearch("");
    setActiveSubTab("history");
  };

  const todayYMD = formatLocalYMD(new Date());

  // Dropdown indicator badges for teachers already recorded absent or already pinch-hitting on the selected dates
  const selectedDateTeacherBadges = useMemo(() => {
    const recordedAbsentIds = new Set();
    const pinchHitCountsByTeacher = new Map();
    const selectedDateSet = new Set(selectedAbsenceDays.map((d) => d.date));

    selectedAbsenceDays.forEach((dObj) => {
      allTeacherIds.forEach((tid) => {
        if (absentByDatePeriod.has(`${dObj.date}|${String(tid)}`)) {
          recordedAbsentIds.add(String(tid));
        }
      });
    });

    activeFinalizedEntries.forEach((e) => {
      if (
        !selectedDateSet.has(e.date) ||
        !e.substituteTeacherId ||
        String(e.substituteTeacherId) === CO_TEACHERS_COVERAGE_ID
      ) {
        return;
      }
      const subId = String(e.substituteTeacherId);
      pinchHitCountsByTeacher.set(subId, (pinchHitCountsByTeacher.get(subId) || 0) + 1);
    });

    return { recordedAbsentIds, pinchHitCountsByTeacher };
  }, [selectedAbsenceDays, allTeacherIds, absentByDatePeriod, activeFinalizedEntries]);

  // Chronological day-by-day Upcoming Pinch-Hit Schedules (active finalized only, starting today)
  const upcomingTotalCounts = useMemo(() => {
    const daySet = new Set();
    let totalPeriods = 0;
    activeFinalizedEntries.forEach((e) => {
      if (e.date >= todayYMD) {
        daySet.add(e.date);
        totalPeriods += 1;
      }
    });
    return { totalDays: daySet.size, totalPeriods };
  }, [activeFinalizedEntries, todayYMD]);

  const upcomingByDate = useMemo(() => {
    const tomorrowDt = parseLocalYMD(todayYMD) || new Date();
    tomorrowDt.setDate(tomorrowDt.getDate() + 1);
    const tomorrowYMD = formatLocalYMD(tomorrowDt);

    const dayAfterDt = parseLocalYMD(todayYMD) || new Date();
    dayAfterDt.setDate(dayAfterDt.getDate() + 2);
    const dayAfterYMD = formatLocalYMD(dayAfterDt);

    const q = upcomingSearch.trim().toLowerCase();
    const filtered = activeFinalizedEntries.filter((e) => {
      if (!e.date || e.date < todayYMD) return false;
      if (q) {
        const hay = `${e.date} ${e.day} ${e.absentNameResolved} ${e.substituteNameResolved} ${e.sectionName} ${e.subjectName} ${e.reason || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dateMap = new Map();
    filtered.forEach((e) => {
      if (!dateMap.has(e.date)) {
        const dt = parseLocalYMD(e.date);
        const dayName = e.day || (dt ? WEEKDAY_NAMES[dt.getDay()] : "");
        const shortLabel = dt
          ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : e.date;
        const longLabel = dt
          ? dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
          : e.date;
        let relativeBadge = "";
        if (e.date === todayYMD) relativeBadge = "Today";
        else if (e.date === tomorrowYMD) relativeBadge = "Tomorrow";
        else if (e.date === dayAfterYMD) relativeBadge = "Day After Tomorrow";

        dateMap.set(e.date, {
          date: e.date,
          day: dayName,
          shortLabel,
          longLabel,
          relativeBadge,
          entries: [],
        });
      }
      dateMap.get(e.date).entries.push(e);
    });

    return Array.from(dateMap.values())
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map((grp) => {
        grp.entries.sort((a, b) => {
          if (Number(a.period) !== Number(b.period)) return Number(a.period) - Number(b.period);
          return String(a.absentNameResolved).localeCompare(String(b.absentNameResolved));
        });

        const pinchMap = new Map();
        const absMap = new Map();

        grp.entries.forEach((e) => {
          const subId = String(e.substituteTeacherId);
          if (!pinchMap.has(subId)) {
            pinchMap.set(subId, {
              teacherId: subId,
              teacherName: e.substituteNameResolved,
              items: [],
            });
          }
          pinchMap.get(subId).items.push(e);

          const absId = String(e.absentTeacherId);
          if (!absMap.has(absId)) {
            absMap.set(absId, {
              teacherId: absId,
              teacherName: e.absentNameResolved,
              reason: e.reason || "",
              items: [],
            });
          }
          absMap.get(absId).items.push(e);
        });

        const byPinchHitter = Array.from(pinchMap.values()).sort((a, b) =>
          a.teacherName.localeCompare(b.teacherName)
        );
        const byAbsentTeacher = Array.from(absMap.values()).sort((a, b) =>
          a.teacherName.localeCompare(b.teacherName)
        );

        return {
          ...grp,
          byPinchHitter,
          byAbsentTeacher,
          pinchHitterCount: byPinchHitter.length,
          absentCount: byAbsentTeacher.length,
          totalPeriods: grp.entries.length,
        };
      });
  }, [activeFinalizedEntries, todayYMD, upcomingSearch]);

  const handleEditUpcomingDayInAssign = (dayGroup) => {
    if (!dayGroup) return;
    setStartDate(dayGroup.date);
    setEndDate(dayGroup.date);
    setFromPeriod(minPeriod);
    setToPeriod(maxPeriod);
    setAbsentTeacherIds(dayGroup.byAbsentTeacher.map((a) => String(a.teacherId)));
    setClassListStatusFilter("all");
    setClassListDateFilter("all");
    setClassListTeacherFilter("all");
    setActiveSubTab("assign");
  };

  const handleEditUpcomingTeacherInAssign = (dateStr, absentTeacherId) => {
    if (!dateStr || !absentTeacherId) return;
    setStartDate(dateStr);
    setEndDate(dateStr);
    setFromPeriod(minPeriod);
    setToPeriod(maxPeriod);
    setAbsentTeacherIds([String(absentTeacherId)]);
    setClassListStatusFilter("all");
    setClassListDateFilter("all");
    setClassListTeacherFilter("all");
    setActiveSubTab("assign");
  };

  const handleOpenDayLetter = (dayGroup) => {
    if (!dayGroup || dayGroup.entries.length === 0) return;
    const sourceRows = dayGroup.entries.map((e) => ({
      rowKey: e.key,
      date: e.date,
      day: dayGroup.day,
      shortDateLabel: dayGroup.shortLabel,
      period: e.period,
      timeLabel: e.timeLabel || getTimeForPeriod(dayGroup.day, e.period),
      absentTeacherId: e.absentTeacherId,
      absentTeacherName: e.absentNameResolved,
      sectionName: e.sectionName,
      subjectName: e.subjectName,
      isAssigned: true,
      substituteTeacherId: String(e.substituteTeacherId),
      substituteTeacherName: e.substituteNameResolved,
      basis: e.eligibilityLabel || "Assigned Pinch-Hitter",
    }));

    const pNums = sourceRows.map((r) => Number(r.period)).filter(Boolean);
    const minP = pNums.length > 0 ? Math.min(...pNums) : minPeriod;
    const maxP = pNums.length > 0 ? Math.max(...pNums) : maxPeriod;
    const memos = Array.from(new Set(dayGroup.entries.map((e) => e.memoNumber).filter(Boolean)));
    const reasons = Array.from(new Set(dayGroup.entries.map((e) => e.reason).filter(Boolean)));

    setLetterMode("consolidated");
    setLetterSourceOverride({
      rows: sourceRows,
      memoNumber: memos[0] || memoNumber,
      reason: reasons.join("; ") || absenceReason,
      startDate: dayGroup.date,
      endDate: dayGroup.date,
      periodRangeText:
        minP === maxP ? `${getOrdinal(minP)} Period` : `${getOrdinal(minP)} to ${getOrdinal(maxP)} Period`,
    });
    setShowLetterModal(true);
  };

  const historyFilterOptions = useMemo(() => {
    const absents = new Map();
    const subs = new Map();
    const reasons = new Set();

    allHistoryEntries.forEach((e) => {
      if (e.absentTeacherId) absents.set(String(e.absentTeacherId), e.absentNameResolved);
      if (e.substituteTeacherId) subs.set(String(e.substituteTeacherId), e.substituteNameResolved);
      if (e.reason) reasons.add(e.reason);
    });

    return {
      absents: Array.from(absents.entries()).sort((a, b) => a[1].localeCompare(b[1])),
      subs: Array.from(subs.entries()).sort((a, b) => a[1].localeCompare(b[1])),
      reasons: Array.from(reasons).sort(),
    };
  }, [allHistoryEntries]);

  const filteredHistoryEntries = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return allHistoryEntries.filter((e) => {
      if (historyStatusFilter !== "all" && (e.status || "active") !== historyStatusFilter) return false;
      if (historyFromDate && e.date < historyFromDate) return false;
      if (historyToDate && e.date > historyToDate) return false;
      if (historyAbsentFilter !== "all" && String(e.absentTeacherId) !== historyAbsentFilter) return false;
      if (historySubFilter !== "all" && String(e.substituteTeacherId) !== historySubFilter) return false;
      if (historyReasonFilter !== "all" && e.reason !== historyReasonFilter) return false;
      if (q) {
        const hay = `${e.date} ${e.day} ${e.status || "active"} ${e.absentNameResolved} ${e.substituteNameResolved} ${e.sectionName} ${e.subjectName} ${e.reason || ""} ${e.cancelNote || ""} ${e.memoNumber || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    allHistoryEntries,
    historyStatusFilter,
    historyFromDate,
    historyToDate,
    historyAbsentFilter,
    historySubFilter,
    historyReasonFilter,
    historySearch,
  ]);

  const historyTotalPages = Math.max(
    1,
    Math.ceil(filteredHistoryEntries.length / historyPageSize)
  );
  const safeHistoryPage = Math.min(historyPage, historyTotalPages);

  const paginatedHistoryEntries = useMemo(() => {
    const startIdx = (safeHistoryPage - 1) * historyPageSize;
    return filteredHistoryEntries.slice(startIdx, startIdx + historyPageSize);
  }, [filteredHistoryEntries, safeHistoryPage, historyPageSize]);

  useEffect(() => {
    setHistoryPage(1);
  }, [
    historyFromDate,
    historyToDate,
    historyStatusFilter,
    historyAbsentFilter,
    historySubFilter,
    historyReasonFilter,
    historySearch,
    historyPageSize,
  ]);

  useEffect(() => {
    if (historyPage > historyTotalPages) {
      setHistoryPage(historyTotalPages);
    }
  }, [historyPage, historyTotalPages]);

  const historySummary = useMemo(() => {
    const distinctDates = new Set();
    const distinctAbsents = new Set();
    const distinctSubs = new Set();
    const tallyMap = new Map();
    let activeCount = 0;
    let cancelledCount = 0;

    filteredHistoryEntries.forEach((e) => {
      if (e.status === "cancelled") {
        cancelledCount += 1;
        return;
      }
      activeCount += 1;
      if (e.date) distinctDates.add(e.date);
      if (e.absentTeacherId) distinctAbsents.add(String(e.absentTeacherId));
      const subId = String(e.substituteTeacherId || e.substituteNameResolved);
      distinctSubs.add(subId);

      if (!tallyMap.has(subId)) {
        tallyMap.set(subId, {
          teacherId: subId,
          teacherName: e.substituteNameResolved,
          totalPeriods: 0,
          datesSet: new Set(),
          latestDate: e.date,
        });
      }
      const item = tallyMap.get(subId);
      item.totalPeriods += 1;
      if (e.date) item.datesSet.add(e.date);
      if (e.date && e.date > item.latestDate) item.latestDate = e.date;
    });

    const tallyList = Array.from(tallyMap.values())
      .map((item) => ({
        teacherId: item.teacherId,
        teacherName: item.teacherName,
        totalPeriods: item.totalPeriods,
        distinctDatesCount: item.datesSet.size,
        latestDate: item.latestDate,
      }))
      .sort((a, b) => {
        if (b.totalPeriods !== a.totalPeriods) return b.totalPeriods - a.totalPeriods;
        return a.teacherName.localeCompare(b.teacherName);
      });

    return {
      totalPeriods: activeCount,
      cancelledCount,
      datesCount: distinctDates.size,
      absentTeachersCount: distinctAbsents.size,
      pinchHittersCount: distinctSubs.size,
      tallyList,
    };
  }, [filteredHistoryEntries]);

  const handleOpenHistoryLetter = (entry) => {
    const related = activeFinalizedEntries.filter((e) => {
      if (entry.memoNumber && e.memoNumber) {
        return e.memoNumber === entry.memoNumber && e.absentTeacherId === entry.absentTeacherId;
      }
      return e.date === entry.date && e.absentTeacherId === entry.absentTeacherId;
    });
    const sourceRows = (related.length > 0 ? related : [entry]).map((e) => {
      const dt = parseLocalYMD(e.date);
      return {
        rowKey: e.key,
        date: e.date,
        day: e.day || (dt ? WEEKDAY_NAMES[dt.getDay()] : ""),
        shortDateLabel: dt
          ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : e.date,
        period: e.period,
        timeLabel: e.timeLabel || getTimeForPeriod(e.day, e.period),
        absentTeacherId: e.absentTeacherId,
        absentTeacherName: e.absentNameResolved,
        sectionName: e.sectionName,
        subjectName: e.subjectName,
        isAssigned: true,
        substituteTeacherId: String(e.substituteTeacherId),
        substituteTeacherName: e.substituteNameResolved,
        basis: e.eligibilityLabel || "Assigned Substitute",
      };
    });

    sourceRows.sort((a, b) => {
      if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
      return Number(a.period) - Number(b.period);
    });

    const dates = Array.from(new Set(sourceRows.map((r) => r.date))).sort();
    const pNums = sourceRows.map((r) => Number(r.period)).filter(Boolean);
    const minHistP = pNums.length > 0 ? Math.min(...pNums) : 1;
    const maxHistP = pNums.length > 0 ? Math.max(...pNums) : 1;

    setLetterMode("consolidated");
    setLetterSourceOverride({
      rows: sourceRows,
      memoNumber: entry.memoNumber || memoNumber,
      reason: entry.reason || absenceReason,
      startDate: dates[0] || entry.date,
      endDate: dates[dates.length - 1] || entry.date,
      periodRangeText:
        minHistP === maxHistP
          ? `${getOrdinal(minHistP)} Period`
          : `${getOrdinal(minHistP)} to ${getOrdinal(maxHistP)} Period`,
    });
    setShowLetterModal(true);
  };

  const handleDeleteHistoryEntry = (entry) => {
    if (!entry?.key) return;
    setDeleteConfirmTarget({ mode: "single", entry });
  };

  const handleDeleteFilteredHistory = () => {
    if (filteredHistoryEntries.length === 0) return;
    setDeleteConfirmTarget({
      mode: "filtered",
      keys: filteredHistoryEntries.map((e) => e.key),
      count: filteredHistoryEntries.length,
    });
  };

  const confirmDeleteHistory = () => {
    if (!deleteConfirmTarget) return;
    const keysToDelete =
      deleteConfirmTarget.mode === "filtered"
        ? deleteConfirmTarget.keys || []
        : deleteConfirmTarget.entry?.key
        ? [deleteConfirmTarget.entry.key]
        : [];
    if (keysToDelete.length > 0) {
      const nextPinchMap = { ...pinchHitMap };
      const nextCancelledMap = { ...cancelledHistoryMap };
      const affectedPairs = [];
      let pinchChanged = false;
      let cancelledChanged = false;

      keysToDelete.forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(nextPinchMap, k)) {
          const entry = nextPinchMap[k];
          if (entry?.date && entry?.absentTeacherId) {
            affectedPairs.push({ date: entry.date, teacherId: String(entry.absentTeacherId) });
          }
          delete nextPinchMap[k];
          pinchChanged = true;
        }
        if (Object.prototype.hasOwnProperty.call(nextCancelledMap, k)) {
          delete nextCancelledMap[k];
          cancelledChanged = true;
        } else {
          Object.keys(nextCancelledMap).forEach((ck) => {
            if (nextCancelledMap[ck]?.id === k || nextCancelledMap[ck]?.key === k) {
              delete nextCancelledMap[ck];
              cancelledChanged = true;
            }
          });
        }
      });

      if (pinchChanged) {
        setPinchHitMap(nextPinchMap);
        persistPinchHitMap(nextPinchMap);
        pruneRecordedAbsencesWithoutPinchHits(nextPinchMap, affectedPairs);
      }
      if (cancelledChanged) {
        setCancelledHistoryMap(nextCancelledMap);
        persistCancelledHistoryMap(nextCancelledMap);
      }
      setDraftChanges((prev) => {
        const nextDraft = { ...prev };
        let changed = false;
        keysToDelete.forEach((k) => {
          if (Object.prototype.hasOwnProperty.call(nextDraft, k)) {
            delete nextDraft[k];
            changed = true;
          }
        });
        return changed ? nextDraft : prev;
      });
    }
    setDeleteConfirmTarget(null);
  };

  const handleExportHistoryCsv = () => {
    if (filteredHistoryEntries.length === 0) return;
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = [
      "Date",
      "Day",
      "Period",
      "Time",
      "Status",
      "Absent Teacher",
      "Section",
      "Subject",
      "Pinch-Hitter",
      "Qualification / Basis",
      "Reason",
      "Memo No.",
      "Recorded / Cancelled At",
    ];
    const lines = [headers.map(esc).join(",")];
    filteredHistoryEntries.forEach((e) => {
      lines.push(
        [
          e.date,
          e.day,
          `Period ${e.period}`,
          e.timeLabel || "",
          e.status === "cancelled" ? "Cancelled" : "Active",
          e.absentNameResolved,
          e.sectionName || "",
          e.subjectName || "",
          e.substituteNameResolved,
          e.eligibilityLabel || "",
          e.reason || "",
          e.memoNumber || "",
          e.cancelledAt || e.updatedAt || "",
        ]
          .map(esc)
          .join(",")
      );
    });
    const csvBlob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(csvBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PinchHit_Coverage_History_${formatLocalYMD(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 12mm 14mm !important;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          .turotugma-dashboard-main,
          .turotugma-dashboard-section {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          .no-print,
          .turotugma-no-print,
          .turotugma-no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          .pinch-letter-modal-backdrop,
          .pinch-letter-modal-card,
          .pinch-letter-modal-scroll,
          .pinch-letter-offscreen-print {
            position: static !important;
            inset: auto !important;
            left: auto !important;
            top: auto !important;
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          #printable-formal-pinch-hit-letter {
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .pinch-letter-page {
            display: block !important;
            width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          #printable-formal-pinch-hit-letter table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          #printable-formal-pinch-hit-letter thead {
            display: table-header-group !important;
          }
          #printable-formal-pinch-hit-letter tr,
          .pinch-no-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* =====================================================================
          TOP VIEW SWITCH: Assign Pinch-Hitters vs. Upcoming Schedules vs. History & Log
          ===================================================================== */}
      <div
        className="turotugma-no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            background: "#f1f5f9",
            padding: 4,
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveSubTab("assign")}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: activeSubTab === "assign" ? "#ffffff" : "transparent",
              color: activeSubTab === "assign" ? "#1e3a8a" : "#475569",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              boxShadow: activeSubTab === "assign" ? "0 1px 3px rgba(15,23,42,0.1)" : "none",
            }}
          >
            <FaChalkboardTeacher size={13} />
            <span>Assign Pinch-Hitters</span>
            {unsavedChangesCount > 0 && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 99,
                  background: "#fef3c7",
                  color: "#b45309",
                }}
              >
                {unsavedChangesCount} unsaved
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("upcoming")}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: activeSubTab === "upcoming" ? "#ffffff" : "transparent",
              color: activeSubTab === "upcoming" ? "#1e3a8a" : "#475569",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              boxShadow: activeSubTab === "upcoming" ? "0 1px 3px rgba(15,23,42,0.1)" : "none",
            }}
          >
            <FaCalendarAlt size={12} />
            Upcoming Schedules ({upcomingTotalCounts.totalPeriods})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("history")}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: activeSubTab === "history" ? "#ffffff" : "transparent",
              color: activeSubTab === "history" ? "#1e3a8a" : "#475569",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              boxShadow: activeSubTab === "history" ? "0 1px 3px rgba(15,23,42,0.1)" : "none",
            }}
          >
            <FaHistory size={12} />
            Pinch-Hit History & Log ({allHistoryEntries.length})
          </button>
        </div>

        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          Master schedule remains unchanged; finalized pinch-hit records are stored separately.
        </div>
      </div>

      {activeSubTab === "assign" ? (
        <>
          {/* =====================================================================
              1. ABSENCE CONTEXT BAR (Teachers + Multi-Day Date Range + Periods + Reason)
              ===================================================================== */}
          <div
            className="turotugma-no-print"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 18,
              boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
              {/* Multi-Teacher Selector Popover */}
              <div ref={teacherPickerRef} style={{ position: "relative" }}>
                <label style={compactLabelStyle}>
                  Absent Teacher(s) ({absentTeacherIds.length} Selected)
                </label>
                <button
                  type="button"
                  onClick={() => setShowTeacherPicker((prev) => !prev)}
                  style={{
                    ...compactSelectStyle,
                    minWidth: 230,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      maxWidth: 195,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: absentTeacherIds.length === 0 ? "#64748b" : "#0f172a",
                    }}
                  >
                    {absentTeacherIds.length === 0
                      ? "Select Absent Teacher(s)..."
                      : absentTeacherIds.length === 1
                      ? getTeacherName(absentTeacherIds[0])
                      : `${absentTeacherIds.length} Teachers (${absentTeachersNamesText})`}
                  </span>
                  <FaChevronDown size={11} color="#475569" />
                </button>

                {showTeacherPicker && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: 6,
                      width: 310,
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: 10,
                      boxShadow: "0 12px 28px rgba(15, 23, 42, 0.16)",
                      zIndex: 200,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
                        Select Absent Teacher(s)
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {selectedDateTeacherBadges.recordedAbsentIds.size > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const recIds = Array.from(selectedDateTeacherBadges.recordedAbsentIds);
                              setAbsentTeacherIds((prev) =>
                                Array.from(new Set([...prev, ...recIds]))
                              );
                            }}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#2563eb",
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            Load Saved ({selectedDateTeacherBadges.recordedAbsentIds.size})
                          </button>
                        )}
                        {absentTeacherIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setAbsentTeacherIds([])}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#dc2626",
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 8 }}>
                      Unchecking only hides a teacher from this workspace. Use Cancel Schedule inside Assign Pinch-Hitters to cancel saved coverage for selected teacher(s) without affecting other waves.
                    </div>
                    <input
                      type="text"
                      placeholder="Filter faculty..."
                      value={absentPickerSearch}
                      onChange={(e) => setAbsentPickerSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        fontSize: 12.5,
                        marginBottom: 8,
                        boxSizing: "border-box",
                      }}
                    />
                    <div style={{ maxHeight: 220, overflowY: "auto", display: "grid", gap: 4 }}>
                      {filteredPickerTeachers.map((tid) => {
                        const tidStr = String(tid);
                        const checked = absentTeacherIds.includes(tidStr);
                        const prof = teacherCompetencyProfile.get(tidStr);
                        const isSavedAbsent = selectedDateTeacherBadges.recordedAbsentIds.has(tidStr);
                        const activePinchCount =
                          selectedDateTeacherBadges.pinchHitCountsByTeacher.get(tidStr) || 0;
                        return (
                          <label
                            key={tid}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 8px",
                              borderRadius: 6,
                              background: checked ? "#eff6ff" : "transparent",
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: checked ? 700 : 500,
                              color: "#0f172a",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAbsentTeacher(tid)}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 6,
                                  flexWrap: "wrap",
                                }}
                              >
                                <span>{getTeacherName(tid)}</span>
                                <span style={{ display: "inline-flex", gap: 4 }}>
                                  {isSavedAbsent && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        padding: "1px 6px",
                                        borderRadius: 99,
                                        background: "#fee2e2",
                                        color: "#b91c1c",
                                      }}
                                    >
                                      Recorded Absent
                                    </span>
                                  )}
                                  {activePinchCount > 0 && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        padding: "1px 6px",
                                        borderRadius: 99,
                                        background: "#fef3c7",
                                        color: "#b45309",
                                      }}
                                    >
                                      Pinch-Hitting ({activePinchCount})
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>
                                {prof?.subjectAreas?.join(", ") || "General"}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Synchronized Multi-Day Date Range */}
              <div>
                <label style={compactLabelStyle}>
                  Absence Date(s){" "}
                  {selectedAbsenceDays.length > 1
                    ? `(${selectedAbsenceDays.length} School Days)`
                    : selectedAbsenceDays.length === 1
                    ? `(${selectedAbsenceDays[0].day})`
                    : ""}
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    style={compactSelectStyle}
                  />
                  <span style={{ color: "#64748b", fontSize: 13 }}>to</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    style={compactSelectStyle}
                  />
                </div>
              </div>

              <div>
                <label style={compactLabelStyle}>Periods Unavailable</label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <select
                    value={fromPeriod}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setFromPeriod(v);
                      if (v > toPeriod) setToPeriod(v);
                    }}
                    style={compactSelectStyle}
                  >
                    {periods.map((p) => (
                      <option key={p} value={p}>
                        {getOrdinal(p)} Period
                      </option>
                    ))}
                  </select>
                  <span style={{ color: "#64748b", fontSize: 13 }}>to</span>
                  <select
                    value={toPeriod}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setToPeriod(v);
                      if (v < fromPeriod) setFromPeriod(v);
                    }}
                    style={compactSelectStyle}
                  >
                    {periods.map((p) => (
                      <option key={p} value={p}>
                        {getOrdinal(p)} {p === maxPeriod ? "(Last)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={compactLabelStyle}>Reason</label>
                <select
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  style={{ ...compactSelectStyle, maxWidth: 250 }}
                >
                  {COMMON_ABSENCE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right: Primary Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {affectedClasses.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoAssignAll}
                  disabled={uncoveredCount === 0}
                  title={
                    uncoveredCount === 0
                      ? "All affected classes already have assigned pinch-hitters"
                      : "Stage best available pinch-hitters into draft for remaining uncovered classes"
                  }
                  style={{
                    padding: "9px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: uncoveredCount === 0 ? "#cbd5e1" : "#2563eb",
                    color: uncoveredCount === 0 ? "#475569" : "#ffffff",
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: uncoveredCount === 0 ? "default" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <FaMagic size={13} />
                  {uncoveredCount === 0 ? "All Classes Covered" : "Auto-Assign Best Matches"}
                </button>
              )}

              <button
                type="button"
                onClick={handleFinalizeDraft}
                disabled={unsavedChangesCount === 0}
                title={
                  unsavedChangesCount === 0
                    ? "No unsaved draft changes to finalize"
                    : "Save & finalize staged pinch-hitters into Upcoming Schedules and History"
                }
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: unsavedChangesCount > 0 ? "#15803d" : "#e2e8f0",
                  color: unsavedChangesCount > 0 ? "#ffffff" : "#64748b",
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: unsavedChangesCount > 0 ? "pointer" : "default",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <FaSave size={13} />
                {unsavedChangesCount > 0
                  ? `Save & Finalize (${unsavedChangesCount})`
                  : "Saved"}
              </button>

              {unsavedChangesCount > 0 && (
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  title="Discard unsaved draft selections and revert to last saved schedule"
                  style={{
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #fcd34d",
                    background: "#fffbeb",
                    color: "#b45309",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Discard Unsaved
                </button>
              )}

              {coveredCount > 0 && (
                <button
                  type="button"
                  onClick={clearSelectedAbsentTeachersPinchHits}
                  title="Stage clearing pinch-hitters for the current selected dates & absent teacher(s)"
                  style={{
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <FaUndo size={11} />
                  Reset
                </button>
              )}

              {savedKeysForSelection.length > 0 && (
                <button
                  type="button"
                  onClick={handleRequestCancelSavedSelection}
                  title="Cancel saved pinch-hit schedule for the currently selected absent teacher(s) & date(s) only — logged as Cancelled in History"
                  style={{
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <FaTimes size={11} />
                  Cancel Schedule ({savedKeysForSelection.length})
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenActiveFormalLetter}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "1px solid #0f172a",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <FaFileSignature size={13} />
                View Formal Letter
              </button>
            </div>
          </div>

          {/* Save & Finalize Confirmation Banner */}
          {saveNotice && (
            <div
              className="turotugma-no-print"
              style={{
                background: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                color: "#166534",
                fontWeight: 700,
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <FaCheckCircle size={14} color="#16a34a" />
                <span>{saveNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveNotice("")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#15803d",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Unsaved Draft Reminder Banner */}
          {unsavedChangesCount > 0 && (
            <div
              className="turotugma-no-print"
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                fontSize: 12.5,
                color: "#92400e",
              }}
            >
              <div>
                <b>Draft Mode ({unsavedChangesCount} unsaved change{unsavedChangesCount === 1 ? "" : "s"}):</b>{" "}
                Your current picks are staged for planning only and are not yet logged in <b>Upcoming Schedules</b> or <b>History</b>. Click <b>Save & Finalize</b> when ready.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleFinalizeDraft}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: "#15803d",
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save & Finalize Now
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "1px solid #fcd34d",
                    background: "#ffffff",
                    color: "#92400e",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Cascade Conflict Alert Banner (when an assigned pinch-hitter is later marked absent) */}
          {cascadeConflicts.length > 0 && (
            <div
              className="turotugma-no-print"
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 14,
                boxShadow: "0 1px 3px rgba(220, 38, 38, 0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#991b1b",
                  marginBottom: 4,
                }}
              >
                <FaExclamationTriangle size={14} color="#dc2626" />
                <span>Pinch-Hitter Conflict Detected ({cascadeConflicts.length})</span>
              </div>
              <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#7f1d1d", lineHeight: 1.45 }}>
                A teacher currently marked absent was previously assigned as a pinch-hitter on these selected date(s) and period(s). Unassign the conflicted coverage below so a replacement can be chosen.
              </p>
              <div style={{ display: "grid", gap: 8 }}>
                {cascadeConflicts.map((conflict) => (
                  <div
                    key={conflict.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 10,
                      background: "#ffffff",
                      border: "1px solid #fecaca",
                      borderRadius: 8,
                      padding: "8px 12px",
                    }}
                  >
                    <div style={{ fontSize: 12.5, color: "#1e293b" }}>
                      <b>{conflict.substituteNameResolved}</b> is covering{" "}
                      <b>{conflict.sectionName}</b> ({conflict.subjectName}) for{" "}
                      <b>{conflict.absentNameResolved}</b> on{" "}
                      <b>
                        {conflict.day}, {conflict.shortDateLabel} • {getOrdinal(Number(conflict.period))} Period
                      </b>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleUnassignCascadeConflict(conflict, true)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "none",
                          background: "#dc2626",
                          color: "#ffffff",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Unassign & Cover Now
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnassignCascadeConflict(conflict, false)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #fca5a5",
                          background: "#fff5f5",
                          color: "#b91c1c",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Unassign Only
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date-Scoped Saved Coverage Overview Strip */}
          {existingCoverageForSelectedDates.totalPeriods > 0 && (
            <div
              className="turotugma-no-print"
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 13, color: "#1e3a8a" }}>
                <b>Saved Coverage on {formatDateRangeSummary(startDate, endDate)}:</b>{" "}
                {existingCoverageForSelectedDates.totalPeriods} period
                {existingCoverageForSelectedDates.totalPeriods === 1 ? "" : "s"} covered across{" "}
                {existingCoverageForSelectedDates.absentCount} absent teacher
                {existingCoverageForSelectedDates.absentCount === 1 ? "" : "s"} by{" "}
                {existingCoverageForSelectedDates.pinchHitterCount} pinch-hitter
                {existingCoverageForSelectedDates.pinchHitterCount === 1 ? "" : "s"}.
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(endDate || startDate) >= todayYMD && (
                  <button
                    type="button"
                    onClick={() => {
                      setUpcomingSearch("");
                      setActiveSubTab("upcoming");
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 7,
                      border: "1px solid #93c5fd",
                      background: "#ffffff",
                      color: "#1d4ed8",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <FaCalendarAlt size={11} />
                    View Upcoming Schedules
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleViewHistoryForSelectedDates}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 7,
                    border: "1px solid #93c5fd",
                    background: "#ffffff",
                    color: "#1d4ed8",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <FaHistory size={11} />
                  View in History & Log
                </button>
              </div>
            </div>
          )}

          {/* =====================================================================
              2. MASTER-DETAIL WORKSPACE (Left: Affected Classes | Right: Suggested Substitutes)
              ===================================================================== */}
          {selectedAbsenceDays.length === 0 ? (
            <div
              className="turotugma-no-print"
              style={{
                background: "#ffffff",
                border: "1px dashed #cbd5e1",
                borderRadius: 12,
                padding: 36,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                No Active School Days in Selected Date Range
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>
                The selected date range ({startDate} to {endDate}) contains no scheduled school weekdays ({days.join(", ")}).
              </p>
            </div>
          ) : absentTeacherIds.length === 0 ? (
            <div
              className="turotugma-no-print"
              style={{
                background: "#ffffff",
                border: "1px dashed #cbd5e1",
                borderRadius: 12,
                padding: 40,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                No Absent Teacher Selected
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>
                Click <b>Absent Teacher(s)</b> above to select one or more teachers who are unable to attend class.
              </p>
            </div>
          ) : affectedClasses.length === 0 ? (
            <div
              className="turotugma-no-print"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 36,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                No Classes Require Coverage
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>
                The selected teacher(s) have no scheduled classes across{" "}
                <b>{formatDateRangeSummary(startDate, endDate)}</b> between the{" "}
                <b>{getOrdinal(startP)}</b> and <b>{getOrdinal(endP)} Period</b>.
              </p>
            </div>
          ) : (
            <div
              className="turotugma-no-print"
              style={{
                display: "grid",
                gridTemplateColumns: "370px 1fr",
                gap: 20,
                alignItems: "start",
              }}
            >
              {/* LEFT PANEL: Affected Classes Grouped by Date */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#f8fafc",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                      Affected Classes ({affectedClasses.length})
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {selectedAbsenceDays.length > 1
                        ? `Across ${selectedAbsenceDays.length} school days`
                        : `${selectedAbsenceDays[0]?.day}, ${selectedAbsenceDays[0]?.shortLabel}`}{" "}
                      • Click a class to assign manually
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 99,
                      background: uncoveredCount > 0 ? "#fef2f2" : "#dcfce7",
                      color: uncoveredCount > 0 ? "#dc2626" : "#15803d",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: uncoveredCount > 0 ? "#dc2626" : "#16a34a",
                      }}
                    />
                    {uncoveredCount > 0 ? `${uncoveredCount} Unassigned` : "All Covered"}
                  </span>
                </div>

                {/* Left-Panel Quick Filters for Large Seminars / Multi-Wave Coverage */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid #e2e8f0",
                    background: "#ffffff",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      { id: "all", label: `All (${affectedClasses.length})` },
                      { id: "unassigned", label: `Unassigned (${uncoveredCount})` },
                      { id: "covered", label: `Covered (${coveredCount})` },
                    ].map((pill) => {
                      const active = classListStatusFilter === pill.id;
                      return (
                        <button
                          key={pill.id}
                          type="button"
                          onClick={() => setClassListStatusFilter(pill.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 99,
                            border: active ? "1px solid #2563eb" : "1px solid #cbd5e1",
                            background: active ? "#eff6ff" : "#f8fafc",
                            color: active ? "#1d4ed8" : "#475569",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {pill.label}
                        </button>
                      );
                    })}
                  </div>

                  {(selectedAbsenceDays.length > 1 || absentTeacherIds.length > 1) && (
                    <div style={{ display: "flex", gap: 6 }}>
                      {selectedAbsenceDays.length > 1 && (
                        <select
                          value={classListDateFilter}
                          onChange={(e) => setClassListDateFilter(e.target.value)}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: "5px 8px",
                            borderRadius: 6,
                            border: "1px solid #cbd5e1",
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "#334155",
                            background: "#ffffff",
                          }}
                        >
                          <option value="all">All Days ({selectedAbsenceDays.length})</option>
                          {selectedAbsenceDays.map((d) => (
                            <option key={d.date} value={d.date}>
                              {d.day}, {d.shortLabel}
                            </option>
                          ))}
                        </select>
                      )}
                      {absentTeacherIds.length > 1 && (
                        <select
                          value={classListTeacherFilter}
                          onChange={(e) => setClassListTeacherFilter(e.target.value)}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: "5px 8px",
                            borderRadius: 6,
                            border: "1px solid #cbd5e1",
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "#334155",
                            background: "#ffffff",
                          }}
                        >
                          <option value="all">All Absent Teachers ({absentTeacherIds.length})</option>
                          {absentTeacherIds.map((tid) => (
                            <option key={tid} value={String(tid)}>
                              {getTeacherName(tid)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ maxHeight: 650, overflowY: "auto" }}>
                  {filteredAffectedClassesByDate.length === 0 ? (
                    <div style={{ padding: "28px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                        No classes match the current filter
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setClassListStatusFilter("all");
                          setClassListDateFilter("all");
                          setClassListTeacherFilter("all");
                        }}
                        style={{
                          marginTop: 8,
                          padding: "5px 12px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          background: "#f8fafc",
                          color: "#1e293b",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    filteredAffectedClassesByDate.map((dateGroup) => (
                      <div key={dateGroup.date}>
                        {filteredAffectedClassesByDate.length > 1 && (
                        <div
                          style={{
                            padding: "8px 14px",
                            background: "#eef2ff",
                            borderBottom: "1px solid #c7d2fe",
                            borderTop: "1px solid #c7d2fe",
                            fontSize: 11.5,
                            fontWeight: 800,
                            color: "#1e3a8a",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>
                            {dateGroup.day}, {dateGroup.shortLabel} ({dateGroup.date})
                          </span>
                          <span>
                            {dateGroup.classes.length} class{dateGroup.classes.length === 1 ? "" : "es"}
                          </span>
                        </div>
                      )}

                      {dateGroup.classes.map((cls) => {
                        const isSelected = activeClassObj?.classKey === cls.classKey;
                        const assignedSub = effectivePinchHitMap[cls.classKey];
                        const isDraftChange = draftKeySet.has(cls.classKey);
                        const isPendingRemoval =
                          Boolean(pinchHitMap[cls.classKey]) && draftChanges[cls.classKey] === null;

                        return (
                          <div
                            key={cls.classKey}
                            onClick={() => setActiveClassKey(cls.classKey)}
                            style={{
                              padding: "13px 16px",
                              borderBottom: "1px solid #f1f5f9",
                              borderLeft: isSelected ? "4px solid #2563eb" : "4px solid transparent",
                              background: isSelected ? "#eff6ff" : "#ffffff",
                              cursor: "pointer",
                              transition: "background 0.15s ease",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 4,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 800,
                                  color: isSelected ? "#1d4ed8" : "#475569",
                                }}
                              >
                                {getOrdinal(cls.period)} Period • {cls.timeLabel}
                              </span>
                              <span
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  color: isPendingRemoval
                                    ? "#b45309"
                                    : assignedSub
                                    ? isDraftChange
                                      ? "#b45309"
                                      : "#15803d"
                                    : "#dc2626",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                }}
                              >
                                <span
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: isPendingRemoval
                                      ? "#d97706"
                                      : assignedSub
                                      ? isDraftChange
                                        ? "#d97706"
                                        : "#16a34a"
                                      : "#dc2626",
                                  }}
                                />
                                {isPendingRemoval
                                  ? "Removal Pending"
                                  : assignedSub
                                  ? isDraftChange
                                    ? "Draft (Unsaved)"
                                    : "Saved"
                                  : "Needs Pinch-Hitter"}
                              </span>
                            </div>

                            <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a" }}>
                              {cls.subjectName} — {cls.sectionName}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginTop: 2 }}>
                              Absent: {cls.absentTeacherName}
                            </div>
                            {cls.presentCoTeachers?.length > 0 && (
                              <div style={{ fontSize: 11.5, color: "#4338ca", fontWeight: 600, marginTop: 2 }}>
                                Co-teachers present:{" "}
                                {cls.presentCoTeachers
                                  .map((ct) =>
                                    ct.streamName
                                      ? `${ct.teacherName} (${ct.streamName})`
                                      : ct.teacherName
                                  )
                                  .join(", ")}
                              </div>
                            )}

                            {isPendingRemoval && (
                              <div
                                style={{
                                  marginTop: 8,
                                  padding: "5px 8px",
                                  borderRadius: 6,
                                  border: "1px solid #fecaca",
                                  background: "#fef2f2",
                                  color: "#b91c1c",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span>Removed (Click Save &amp; Finalize)</span>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDraftChanges((prev) => {
                                      const next = { ...prev };
                                      delete next[cls.classKey];
                                      return next;
                                    });
                                  }}
                                  style={{
                                    cursor: "pointer",
                                    color: "#1d4ed8",
                                    fontSize: 11,
                                    textDecoration: "underline",
                                  }}
                                >
                                  Undo
                                </span>
                              </div>
                            )}

                            {assignedSub && (
                              <div
                                style={{
                                  marginTop: 8,
                                  padding: "5px 8px",
                                  borderRadius: 6,
                                  border: isDraftChange ? "1px solid #fde68a" : "1px solid transparent",
                                  background: isDraftChange ? "#fefce8" : "#dcfce7",
                                  color: isDraftChange ? "#92400e" : "#166534",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span>Pinch-Hitter: {assignedSub.substituteTeacherName}</span>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    savePinchHitAssignment(
                                      cls.date,
                                      cls.day,
                                      cls.period,
                                      cls.absentTeacherId,
                                      null,
                                      cls
                                    );
                                  }}
                                  style={{
                                    cursor: "pointer",
                                    color: isDraftChange ? "#b45309" : "#15803d",
                                    fontSize: 11,
                                    textDecoration: "underline",
                                  }}
                                >
                                  Remove
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RIGHT PANEL: Suggested Substitutes for Active Class */}
              {activeClassObj && (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "20px 24px",
                    boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 12,
                      paddingBottom: 14,
                      borderBottom: "1px solid #e2e8f0",
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>
                        {activeClassObj.day}, {activeClassObj.shortDateLabel} •{" "}
                        {getOrdinal(activeClassObj.period)} Period ({activeClassObj.timeLabel})
                      </div>
                      <h3 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                        {activeClassObj.subjectName} — {activeClassObj.sectionName}
                      </h3>
                      <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                        Absent: <b>{activeClassObj.absentTeacherName}</b> • Ranked by availability, subject/grade fit, daily load &amp; rotation across{" "}
                        <b>{totalAvailableForActiveClass} free teachers</b>
                      </div>
                      {activeClassObj.excludedSummary &&
                        (activeClassObj.excludedSummary.absentCount > 0 ||
                          activeClassObj.excludedSummary.pinchHittingCount > 0 ||
                          activeClassObj.excludedSummary.regularClassCount > 0) && (
                          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                            Excluded on {activeClassObj.shortDateLabel} ({getOrdinal(activeClassObj.period)} Period):{" "}
                            <b>{activeClassObj.excludedSummary.absentCount}</b> previously recorded absent •{" "}
                            <b>{activeClassObj.excludedSummary.pinchHittingCount}</b> already pinch-hitting •{" "}
                            <b>{activeClassObj.excludedSummary.regularClassCount}</b> teaching regular class
                          </div>
                        )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ position: "relative" }}>
                        <FaSearch
                          size={12}
                          color="#94a3b8"
                          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
                        />
                        <input
                          type="text"
                          placeholder="Search teacher..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{
                            padding: "7px 10px 7px 28px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            width: 180,
                            outline: "none",
                          }}
                        />
                      </div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12.5,
                          color: "#475569",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={includeBusyTeachers}
                          onChange={(e) => setIncludeBusyTeachers(e.target.checked)}
                        />
                        Show busy teachers
                      </label>
                    </div>
                  </div>

                  {/* Multi-Teacher / Breakout Stream Co-Teacher Info Strip */}
                  {activeClassObj.isMultiTeacher && (
                    <div
                      style={{
                        background: "#eef2ff",
                        border: "1px solid #c7d2fe",
                        borderRadius: 9,
                        padding: "10px 14px",
                        marginBottom: 14,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <div style={{ fontSize: 12.5, color: "#1e3a8a", lineHeight: 1.45, flex: 1 }}>
                        {activeClassObj.presentCoTeachers.length > 0 ? (
                          <>
                            <b>Multi-Teacher Class:</b>{" "}
                            {activeClassObj.presentCoTeachers
                              .map((ct) =>
                                ct.streamName
                                  ? `${ct.teacherName} (${ct.streamName})`
                                  : ct.teacherName
                              )
                              .join(", ")}{" "}
                            {activeClassObj.presentCoTeachers.length === 1 ? "is" : "are"} still present during this period. Only{" "}
                            <b>{activeClassObj.absentTeacherName}</b>&apos;s group
                            {activeClassObj.streamName ? ` (${activeClassObj.streamName})` : ""} needs coverage.
                          </>
                        ) : (
                          <>
                            <b>Multi-Teacher Class:</b> All co-teachers for this class are also absent on this period.
                          </>
                        )}
                      </div>

                      {activeClassObj.presentCoTeachers.length > 0 && (() => {
                        const currentAssigned = effectivePinchHitMap[activeClassObj.classKey];
                        const isCoTeacherCovered =
                          currentAssigned?.substituteTeacherId === CO_TEACHERS_COVERAGE_ID;
                        const coNamesText = activeClassObj.presentCoTeachers
                          .map((ct) =>
                            ct.streamName
                              ? `${ct.teacherName} (${ct.streamName})`
                              : ct.teacherName
                          )
                          .join(", ");

                        return (
                          <button
                            type="button"
                            onClick={() =>
                              savePinchHitAssignment(
                                activeClassObj.date,
                                activeClassObj.day,
                                activeClassObj.period,
                                activeClassObj.absentTeacherId,
                                isCoTeacherCovered ? null : CO_TEACHERS_COVERAGE_ID,
                                activeClassObj,
                                {
                                  eligibilityLabel: "Co-Teacher Supervision",
                                  customSubstituteName: `Present Co-Teacher(s): ${coNamesText}`,
                                }
                              )
                            }
                            style={{
                              padding: "6px 12px",
                              borderRadius: 7,
                              border: isCoTeacherCovered ? "1px solid #15803d" : "1px solid #818cf8",
                              background: isCoTeacherCovered ? "#16a34a" : "#ffffff",
                              color: isCoTeacherCovered ? "#ffffff" : "#3730a3",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isCoTeacherCovered
                              ? "Covered by Co-Teacher(s)"
                              : "Mark Covered by Co-Teacher(s)"}
                          </button>
                        );
                      })()}
                    </div>
                  )}

                  {/* Ranked Candidate List */}
                  <div style={{ display: "grid", gap: 10 }}>
                    {visibleCandidatesForActiveClass.map((cand, index) => {
                      const assignedSub = effectivePinchHitMap[activeClassObj.classKey];
                      const isAssigned = assignedSub?.substituteTeacherId === cand.teacherId;
                      const isExpanded = expandedTeacherId === cand.teacherId;

                      return (
                        <div
                          key={cand.teacherId}
                          style={{
                            borderRadius: 10,
                            border: isAssigned
                              ? "2px solid #16a34a"
                              : "1px solid #e2e8f0",
                            background: isAssigned ? "#f0fdf4" : "#ffffff",
                            padding: "12px 16px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 12,
                              flexWrap: "wrap",
                            }}
                          >
                            <div
                              onClick={() =>
                                setExpandedTeacherId(isExpanded ? null : cand.teacherId)
                              }
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                cursor: "pointer",
                                flex: 1,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  minWidth: 28,
                                  height: 24,
                                  borderRadius: 6,
                                  background: index < 3 ? "#dbeafe" : "#f1f5f9",
                                  color: index < 3 ? "#1e40af" : "#475569",
                                  fontWeight: 800,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                #{index + 1}
                              </span>

                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                                    {cand.teacherName}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 11.5,
                                      fontWeight: 700,
                                      padding: "2px 8px",
                                      borderRadius: 99,
                                      background: cand.isRecordedAbsent
                                        ? "#fee2e2"
                                        : cand.isFree
                                        ? "#dcfce7"
                                        : "#fef3c7",
                                      color: cand.isRecordedAbsent
                                        ? "#b91c1c"
                                        : cand.isFree
                                        ? "#15803d"
                                        : "#b45309",
                                    }}
                                  >
                                    {cand.isRecordedAbsent
                                      ? "Recorded Absent"
                                      : cand.isFree
                                      ? "Available"
                                      : "Has Conflict"}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color: cand.eligibilityTier <= 3 ? "#1d4ed8" : "#475569",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {cand.eligibilityBadge}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ textAlign: "right" }} title={cand.scoreTooltip}>
                                <span
                                  style={{
                                    fontSize: 13.5,
                                    fontWeight: 800,
                                    color:
                                      cand.matchScore >= 85
                                        ? "#15803d"
                                        : cand.matchScore >= 60
                                        ? "#1d4ed8"
                                        : "#64748b",
                                  }}
                                >
                                  {cand.fitLabel} • {cand.matchScore}%
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedTeacherId(isExpanded ? null : cand.teacherId)
                                }
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 6,
                                  border: "1px solid #e2e8f0",
                                  background: "#f8fafc",
                                  color: "#475569",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                Details {isExpanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                              </button>

                              <button
                                type="button"
                                disabled={cand.isRecordedAbsent && !isAssigned}
                                onClick={() => {
                                  const nextVal = isAssigned ? null : cand.teacherId;
                                  savePinchHitAssignment(
                                    activeClassObj.date,
                                    activeClassObj.day,
                                    activeClassObj.period,
                                    activeClassObj.absentTeacherId,
                                    nextVal,
                                    activeClassObj,
                                    {
                                      eligibilityLabel: cand.eligibilityBadge,
                                      matchScore: cand.matchScore,
                                    }
                                  );
                                  if (nextVal) {
                                    const currentIdx = affectedClasses.findIndex(
                                      (c) => c.classKey === activeClassObj.classKey
                                    );
                                    const orderedAfter = [
                                      ...affectedClasses.slice(currentIdx + 1),
                                      ...affectedClasses.slice(0, currentIdx),
                                    ];
                                    const nextUnassigned = orderedAfter.find(
                                      (c) => c.classKey !== activeClassObj.classKey && !effectivePinchHitMap[c.classKey]
                                    );
                                    if (nextUnassigned) {
                                      setActiveClassKey(nextUnassigned.classKey);
                                    }
                                  }
                                }}
                                style={{
                                  padding: "7px 16px",
                                  borderRadius: 8,
                                  border: isAssigned ? "1px solid #16a34a" : "none",
                                  background:
                                    cand.isRecordedAbsent && !isAssigned
                                      ? "#e2e8f0"
                                      : isAssigned
                                      ? "#16a34a"
                                      : "#2563eb",
                                  color:
                                    cand.isRecordedAbsent && !isAssigned ? "#64748b" : "#ffffff",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  cursor:
                                    cand.isRecordedAbsent && !isAssigned
                                      ? "not-allowed"
                                      : "pointer",
                                  minWidth: 96,
                                }}
                              >
                                {isAssigned ? "Assigned" : cand.isRecordedAbsent ? "Absent" : "Assign"}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div
                              style={{
                                marginTop: 12,
                                paddingTop: 12,
                                borderTop: "1px solid #e2e8f0",
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 16,
                                fontSize: 12.5,
                              }}
                            >
                              <div>
                                <div style={{ display: "grid", gap: 5 }}>
                                  {cand.reasons.map((r, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        color: r.ok ? "#166534" : "#64748b",
                                        fontSize: 12,
                                        display: "flex",
                                        gap: 6,
                                      }}
                                    >
                                      <span style={{ fontWeight: 800 }}>{r.ok ? "Yes:" : "Note:"}</span>
                                      <span>{r.text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <div style={{ fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                                  {activeClassObj.day}, {activeClassObj.shortDateLabel} Schedule ({cand.dayLoad} regular
                                  {cand.effectiveDayLoad > cand.dayLoad
                                    ? ` + ${cand.effectiveDayLoad - cand.dayLoad} pinch-hit`
                                    : ""}
                                  ):
                                </div>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: `repeat(${periods.length}, minmax(0, 1fr))`,
                                    gap: 4,
                                  }}
                                >
                                  {cand.dayTimeline.map((tSlot) => {
                                    const slotTitle = tSlot.hasSub
                                      ? `P${tSlot.period}: Pinch-hitting ${tSlot.subSectionName} (for ${tSlot.subAbsentName})`
                                      : tSlot.hasClass
                                      ? `P${tSlot.period}: ${tSlot.subjectName} (${tSlot.sectionName})`
                                      : `P${tSlot.period}: Free`;
                                    const slotBg = tSlot.hasSub
                                      ? "#fef3c7"
                                      : tSlot.hasClass
                                      ? "#f1f5f9"
                                      : "#dcfce7";
                                    const slotColor = tSlot.hasSub
                                      ? "#b45309"
                                      : tSlot.hasClass
                                      ? "#475569"
                                      : "#166534";
                                    const slotLabel = tSlot.hasSub
                                      ? "P-Hit"
                                      : tSlot.hasClass
                                      ? "Busy"
                                      : "Free";

                                    return (
                                      <div
                                        key={tSlot.period}
                                        title={slotTitle}
                                        style={{
                                          textAlign: "center",
                                          padding: "4px 2px",
                                          borderRadius: 5,
                                          fontSize: 11,
                                          fontWeight: 700,
                                          border: tSlot.isCurrentPeriod
                                            ? "2px solid #2563eb"
                                            : "1px solid #e2e8f0",
                                          background: slotBg,
                                          color: slotColor,
                                        }}
                                      >
                                        P{tSlot.period}
                                        <div style={{ fontSize: 9, fontWeight: 600 }}>
                                          {slotLabel}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!searchQuery.trim() && totalAvailableForActiveClass > 5 && (
                    <div style={{ marginTop: 14, textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => setShowAllCandidates((prev) => !prev)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "1px solid #cbd5e1",
                          background: "#f8fafc",
                          color: "#334155",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {showAllCandidates
                          ? "Show Top 5 Best Candidates Only"
                          : `Show All ${totalAvailableForActiveClass} Available Active Teachers`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ) : activeSubTab === "upcoming" ? (
        /* =====================================================================
           UPCOMING PINCH-HIT SCHEDULES TAB (Today, Tomorrow, Future Dates)
           ===================================================================== */
        <div className="turotugma-no-print" style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                Upcoming Pinch-Hit Schedules
              </div>
              <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>
                Finalized pinch-hit assignments from Today ({todayYMD}) onward — organized chronologically so you can verify who is covering whom each day.
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div
                style={{
                  display: "inline-flex",
                  background: "#f1f5f9",
                  padding: 3,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  gap: 3,
                }}
              >
                <button
                  type="button"
                  onClick={() => setUpcomingViewMode("by-pinch-hitter")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: upcomingViewMode === "by-pinch-hitter" ? "#ffffff" : "transparent",
                    color: upcomingViewMode === "by-pinch-hitter" ? "#1e3a8a" : "#475569",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow:
                      upcomingViewMode === "by-pinch-hitter"
                        ? "0 1px 2px rgba(15,23,42,0.08)"
                        : "none",
                  }}
                >
                  By Pinch-Hitter
                </button>
                <button
                  type="button"
                  onClick={() => setUpcomingViewMode("by-absent")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: upcomingViewMode === "by-absent" ? "#ffffff" : "transparent",
                    color: upcomingViewMode === "by-absent" ? "#1e3a8a" : "#475569",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow:
                      upcomingViewMode === "by-absent"
                        ? "0 1px 2px rgba(15,23,42,0.08)"
                        : "none",
                  }}
                >
                  By Absent Teacher / Class
                </button>
              </div>

              <div style={{ position: "relative" }}>
                <FaSearch
                  size={12}
                  color="#94a3b8"
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="text"
                  placeholder="Search teacher, section..."
                  value={upcomingSearch}
                  onChange={(e) => setUpcomingSearch(e.target.value)}
                  style={{
                    padding: "7px 10px 7px 28px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 12.5,
                    width: 210,
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {upcomingByDate.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                border: "1px dashed #cbd5e1",
                borderRadius: 12,
                padding: 40,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                No Upcoming Finalized Pinch-Hit Schedules
              </div>
              <p style={{ margin: "6px 0 14px", fontSize: 13.5, color: "#64748b" }}>
                {upcomingSearch.trim()
                  ? "No upcoming schedules match your search filter."
                  : "Once you finalize pinch-hit assignments in Assign Pinch-Hitters, Today, Tomorrow, and future dates will appear here."}
              </p>
              {unsavedChangesCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveSubTab("assign")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#15803d",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Return to Assign Pinch-Hitters ({unsavedChangesCount} unsaved)
                </button>
              )}
            </div>
          ) : (
            upcomingByDate.map((dayGroup) => (
              <div
                key={dayGroup.date}
                style={{
                  background: "#ffffff",
                  border: dayGroup.relativeBadge === "Today" ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div
                  style={{
                    padding: "13px 18px",
                    background: dayGroup.relativeBadge === "Today" ? "#eff6ff" : "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {dayGroup.relativeBadge && (
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 99,
                          fontSize: 11.5,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          background:
                            dayGroup.relativeBadge === "Today"
                              ? "#2563eb"
                              : dayGroup.relativeBadge === "Tomorrow"
                              ? "#0f766e"
                              : "#475569",
                          color: "#ffffff",
                        }}
                      >
                        {dayGroup.relativeBadge}
                      </span>
                    )}
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                        {dayGroup.longLabel}
                      </div>
                      <div style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>
                        {dayGroup.totalPeriods} class period{dayGroup.totalPeriods === 1 ? "" : "s"} •{" "}
                        {dayGroup.pinchHitterCount} pinch-hitter{dayGroup.pinchHitterCount === 1 ? "" : "s"} covering{" "}
                        {dayGroup.absentCount} absent teacher{dayGroup.absentCount === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleEditUpcomingDayInAssign(dayGroup)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 7,
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#334155",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Edit Day in Assign Tab
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDayLetter(dayGroup)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 7,
                        border: "none",
                        background: "#0f172a",
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <FaFileSignature size={11} />
                      Formal Letter
                    </button>
                  </div>
                </div>

                <div style={{ padding: "14px 18px", display: "grid", gap: 12 }}>
                  {upcomingViewMode === "by-pinch-hitter"
                    ? dayGroup.byPinchHitter.map((phGroup) => (
                        <div
                          key={phGroup.teacherId}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "11px 14px",
                            background: "#f8fafc",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 8,
                              marginBottom: 8,
                            }}
                          >
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                              Pinch-Hitter:{" "}
                              <span style={{ color: "#15803d" }}>{phGroup.teacherName}</span>
                            </div>
                            <span
                              style={{
                                fontSize: 11.5,
                                fontWeight: 700,
                                padding: "2px 9px",
                                borderRadius: 99,
                                background: "#dcfce7",
                                color: "#166534",
                              }}
                            >
                              {phGroup.items.length} period{phGroup.items.length === 1 ? "" : "s"} on {dayGroup.shortLabel}
                            </span>
                          </div>
                          <div style={{ display: "grid", gap: 6 }}>
                            {phGroup.items.map((item) => (
                              <div
                                key={item.key}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: 8,
                                  background: "#ffffff",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 7,
                                  padding: "7px 10px",
                                  fontSize: 12.5,
                                }}
                              >
                                <div>
                                  <b>{getOrdinal(Number(item.period))} Period</b>{" "}
                                  <span style={{ color: "#64748b" }}>({item.timeLabel})</span> •{" "}
                                  <b>{item.sectionName}</b> ({item.subjectName})
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <span style={{ color: "#475569", fontSize: 12 }}>
                                    For Absent Teacher: <b>{item.absentNameResolved}</b>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEditUpcomingTeacherInAssign(dayGroup.date, item.absentTeacherId)
                                    }
                                    title="Edit only this absent teacher in Assign Pinch-Hitters without affecting other waves"
                                    style={{
                                      padding: "3px 9px",
                                      borderRadius: 5,
                                      border: "1px solid #cbd5e1",
                                      background: "#f8fafc",
                                      color: "#1e3a8a",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    : dayGroup.byAbsentTeacher.map((absGroup) => (
                        <div
                          key={absGroup.teacherId}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "11px 14px",
                            background: "#f8fafc",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 8,
                              marginBottom: 8,
                            }}
                          >
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                              Absent Teacher:{" "}
                              <span style={{ color: "#b91c1c" }}>{absGroup.teacherName}</span>
                              {absGroup.reason && (
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginLeft: 8 }}>
                                  ({absGroup.reason})
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  padding: "2px 9px",
                                  borderRadius: 99,
                                  background: "#fee2e2",
                                  color: "#b91c1c",
                                }}
                              >
                                {absGroup.items.length} affected class{absGroup.items.length === 1 ? "" : "es"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditUpcomingTeacherInAssign(dayGroup.date, absGroup.teacherId)
                                }
                                title="Edit only this absent teacher in Assign Pinch-Hitters without affecting other waves"
                                style={{
                                  padding: "3px 10px",
                                  borderRadius: 6,
                                  border: "1px solid #cbd5e1",
                                  background: "#ffffff",
                                  color: "#1e3a8a",
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Edit Teacher
                              </button>
                            </div>
                          </div>
                          <div style={{ display: "grid", gap: 6 }}>
                            {absGroup.items.map((item) => (
                              <div
                                key={item.key}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: 8,
                                  background: "#ffffff",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 7,
                                  padding: "7px 10px",
                                  fontSize: 12.5,
                                }}
                              >
                                <div>
                                  <b>{getOrdinal(Number(item.period))} Period</b>{" "}
                                  <span style={{ color: "#64748b" }}>({item.timeLabel})</span> •{" "}
                                  <b>{item.sectionName}</b> ({item.subjectName})
                                </div>
                                <div style={{ color: "#15803d", fontWeight: 700, fontSize: 12.5 }}>
                                  Pinch-Hitter: {item.substituteNameResolved}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* =====================================================================
           HISTORY & PINCH-HIT LOG TAB
           ===================================================================== */
        <div className="turotugma-no-print" style={{ display: "grid", gap: 16 }}>
          {/* 4 Summary Metrics Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12,
            }}
          >
            {[
              {
                label: "Active Periods Covered",
                value: historySummary.totalPeriods,
                sub:
                  historySummary.cancelledCount > 0
                    ? `${historySummary.cancelledCount} cancelled in log`
                    : "",
                color: "#1e3a8a",
              },
              { label: "Absence Dates Logged", value: historySummary.datesCount, sub: "", color: "#0f766e" },
              { label: "Absent Teachers Covered", value: historySummary.absentTeachersCount, sub: "", color: "#b45309" },
              { label: "Unique Pinch-Hitters", value: historySummary.pinchHittersCount, sub: "", color: "#15803d" },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "14px 16px",
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  {card.label}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: card.color, marginTop: 4 }}>
                  {card.value}
                </div>
                {card.sub && (
                  <div style={{ fontSize: 11.5, color: "#b91c1c", fontWeight: 600, marginTop: 2 }}>
                    + {card.sub}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Filter & CSV Export Bar */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <div>
                <label style={compactLabelStyle}>Status</label>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  style={{ ...compactSelectStyle, minWidth: 135 }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="cancelled">Cancelled Only</option>
                </select>
              </div>
              <div>
                <label style={compactLabelStyle}>From Date</label>
                <input
                  type="date"
                  value={historyFromDate}
                  onChange={(e) => setHistoryFromDate(e.target.value)}
                  style={compactSelectStyle}
                />
              </div>
              <div>
                <label style={compactLabelStyle}>To Date</label>
                <input
                  type="date"
                  value={historyToDate}
                  onChange={(e) => setHistoryToDate(e.target.value)}
                  style={compactSelectStyle}
                />
              </div>
              <div>
                <label style={compactLabelStyle}>Absent Teacher</label>
                <select
                  value={historyAbsentFilter}
                  onChange={(e) => setHistoryAbsentFilter(e.target.value)}
                  style={{ ...compactSelectStyle, minWidth: 165 }}
                >
                  <option value="all">All Absent Teachers</option>
                  {historyFilterOptions.absents.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={compactLabelStyle}>Pinch-Hitter</label>
                <select
                  value={historySubFilter}
                  onChange={(e) => setHistorySubFilter(e.target.value)}
                  style={{ ...compactSelectStyle, minWidth: 165 }}
                >
                  <option value="all">All Pinch-Hitters</option>
                  {historyFilterOptions.subs.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={compactLabelStyle}>Reason</label>
                <select
                  value={historyReasonFilter}
                  onChange={(e) => setHistoryReasonFilter(e.target.value)}
                  style={{ ...compactSelectStyle, maxWidth: 210 }}
                >
                  <option value="all">All Reasons</option>
                  {historyFilterOptions.reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={compactLabelStyle}>Search</label>
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Section, subject, memo..."
                  style={{ ...compactSelectStyle, width: 190, cursor: "text" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {(historyFromDate ||
                historyToDate ||
                historyStatusFilter !== "all" ||
                historyAbsentFilter !== "all" ||
                historySubFilter !== "all" ||
                historyReasonFilter !== "all" ||
                historySearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setHistoryFromDate("");
                    setHistoryToDate("");
                    setHistoryStatusFilter("all");
                    setHistoryAbsentFilter("all");
                    setHistorySubFilter("all");
                    setHistoryReasonFilter("all");
                    setHistorySearch("");
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Clear Filters
                </button>
              )}

              <button
                type="button"
                onClick={handleExportHistoryCsv}
                disabled={filteredHistoryEntries.length === 0}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: filteredHistoryEntries.length === 0 ? "#cbd5e1" : "#15803d",
                  color: filteredHistoryEntries.length === 0 ? "#475569" : "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: filteredHistoryEntries.length === 0 ? "default" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FaDownload size={12} />
                Export CSV
              </button>

              {filteredHistoryEntries.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteFilteredHistory}
                  title="Delete all currently filtered history records"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <FaTrash size={11} />
                  Delete Filtered ({filteredHistoryEntries.length})
                </button>
              )}
            </div>
          </div>

          {/* Pinch-Hitter Fairness Tally */}
          {historySummary.tallyList.length > 0 && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                onClick={() => setShowTallyPanel((prev) => !prev)}
                style={{
                  padding: "11px 16px",
                  background: "#f8fafc",
                  borderBottom: showTallyPanel ? "1px solid #e2e8f0" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                  Pinch-Hitter Coverage Tally ({historySummary.tallyList.length} Teachers)
                </span>
                <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>
                  {showTallyPanel ? "Hide" : "Show"} {showTallyPanel ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                </span>
              </div>

              {showTallyPanel && (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f4f6fc" }}>
                        <th style={historyThStyle}>Pinch-Hitter</th>
                        <th style={historyThStyle}>Total Periods Covered</th>
                        <th style={historyThStyle}>Distinct Dates</th>
                        <th style={historyThStyle}>Most Recent Coverage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historySummary.tallyList.map((t, idx) => (
                        <tr key={t.teacherId} style={{ background: idx % 2 === 1 ? "#fafbfe" : "#ffffff" }}>
                          <td style={{ ...historyTdStyle, fontWeight: 700, color: "#0f172a" }}>
                            {t.teacherName}
                          </td>
                          <td style={historyTdStyle}>
                            <b>{t.totalPeriods}</b> period{t.totalPeriods === 1 ? "" : "s"}
                          </td>
                          <td style={historyTdStyle}>
                            {t.distinctDatesCount} day{t.distinctDatesCount === 1 ? "" : "s"}
                          </td>
                          <td style={historyTdStyle}>{t.latestDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Full Chronological Pinch-Hit Log Table */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                Chronological Coverage Log ({filteredHistoryEntries.length} Record
                {filteredHistoryEntries.length === 1 ? "" : "s"})
              </span>

              {filteredHistoryEntries.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                    Showing {(safeHistoryPage - 1) * historyPageSize + 1}–
                    {Math.min(safeHistoryPage * historyPageSize, filteredHistoryEntries.length)} of{" "}
                    {filteredHistoryEntries.length}
                  </span>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    Rows:
                    <select
                      value={historyPageSize}
                      onChange={(e) => setHistoryPageSize(Number(e.target.value) || 25)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0f172a",
                        cursor: "pointer",
                      }}
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </label>
                </div>
              )}
            </div>

            {filteredHistoryEntries.length === 0 ? (
              <div style={{ padding: 28, textAlign: "center", color: "#64748b", fontSize: 13.5 }}>
                No pinch-hit history records found matching the current filters.
              </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f4f6fc" }}>
                        <th style={historyThStyle}>Date &amp; Day</th>
                        <th style={historyThStyle}>Period</th>
                        <th style={historyThStyle}>Status</th>
                        <th style={historyThStyle}>Absent Teacher</th>
                        <th style={historyThStyle}>Section &amp; Subject</th>
                        <th style={historyThStyle}>Pinch-Hitter</th>
                        <th style={historyThStyle}>Reason</th>
                        <th style={historyThStyle}>Memo No.</th>
                        <th style={{ ...historyThStyle, textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHistoryEntries.map((entry, idx) => {
                      const isCancelled = entry.status === "cancelled";
                      return (
                      <tr
                        key={entry.key}
                        style={{
                          background: isCancelled
                            ? "#fffafa"
                            : idx % 2 === 1
                            ? "#fafbfe"
                            : "#ffffff",
                          opacity: isCancelled ? 0.85 : 1,
                        }}
                      >
                        <td style={{ ...historyTdStyle, whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{entry.date}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{entry.day}</div>
                        </td>
                        <td style={{ ...historyTdStyle, whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 700 }}>{getOrdinal(Number(entry.period))} Period</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{entry.timeLabel || ""}</div>
                        </td>
                        <td style={{ ...historyTdStyle, whiteSpace: "nowrap" }}>
                          {isCancelled ? (
                            <span
                              title={entry.cancelNote || "Cancelled schedule"}
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: 99,
                                background: "#fee2e2",
                                color: "#b91c1c",
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              Cancelled
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: 99,
                                background: "#dcfce7",
                                color: "#15803d",
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              Active
                            </span>
                          )}
                          {isCancelled && entry.cancelledAt && (
                            <div style={{ fontSize: 10.5, color: "#991b1b", marginTop: 2 }}>
                              {String(entry.cancelledAt).slice(0, 10)}
                            </div>
                          )}
                        </td>
                        <td style={{ ...historyTdStyle, fontWeight: 600 }}>{entry.absentNameResolved}</td>
                        <td style={historyTdStyle}>
                          <div style={{ fontWeight: 700, color: "#1e3a8a" }}>{entry.sectionName}</div>
                          <div style={{ fontSize: 11.5, color: "#475569" }}>{entry.subjectName}</div>
                        </td>
                        <td style={historyTdStyle}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: isCancelled ? "#64748b" : "#15803d",
                              textDecoration: isCancelled ? "line-through" : "none",
                            }}
                          >
                            {entry.substituteNameResolved}
                          </div>
                          {entry.eligibilityLabel && (
                            <div style={{ fontSize: 11, color: "#64748b" }}>{entry.eligibilityLabel}</div>
                          )}
                        </td>
                        <td style={{ ...historyTdStyle, maxWidth: 200 }}>{entry.reason || "-"}</td>
                        <td style={{ ...historyTdStyle, whiteSpace: "nowrap", fontFamily: "monospace" }}>
                          {entry.memoNumber || "-"}
                        </td>
                        <td style={{ ...historyTdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: 6,
                            }}
                          >
                            {!isCancelled && (
                              <button
                                type="button"
                                onClick={() => handleOpenHistoryLetter(entry)}
                                style={{
                                  height: 28,
                                  padding: "0 10px",
                                  borderRadius: 6,
                                  border: "1px solid #cbd5e1",
                                  background: "#ffffff",
                                  color: "#1e3a8a",
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  boxSizing: "border-box",
                                }}
                              >
                                View Letter
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteHistoryEntry(entry)}
                              title="Permanently delete this record from History"
                              aria-label="Delete record"
                              style={{
                                height: 28,
                                padding: "0 10px",
                                borderRadius: 6,
                                border: "1px solid #fecaca",
                                background: "#fef2f2",
                                color: "#dc2626",
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                boxSizing: "border-box",
                              }}
                            >
                              <FaTrash size={11} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer Bar */}
                <div
                  style={{
                    padding: "10px 16px",
                    background: "#f8fafc",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 12.5, color: "#475569", fontWeight: 600 }}>
                    Showing {(safeHistoryPage - 1) * historyPageSize + 1}–
                    {Math.min(safeHistoryPage * historyPageSize, filteredHistoryEntries.length)} of{" "}
                    <b>{filteredHistoryEntries.length}</b> records (Page <b>{safeHistoryPage}</b> of{" "}
                    <b>{historyTotalPages}</b>)
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {[
                      { label: "First", targetPage: 1, disabled: safeHistoryPage <= 1 },
                      { label: "Prev", targetPage: Math.max(1, safeHistoryPage - 1), disabled: safeHistoryPage <= 1 },
                      {
                        label: "Next",
                        targetPage: Math.min(historyTotalPages, safeHistoryPage + 1),
                        disabled: safeHistoryPage >= historyTotalPages,
                      },
                      {
                        label: "Last",
                        targetPage: historyTotalPages,
                        disabled: safeHistoryPage >= historyTotalPages,
                      },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        disabled={btn.disabled}
                        onClick={() => setHistoryPage(btn.targetPage)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          background: btn.disabled ? "#f1f5f9" : "#ffffff",
                          color: btn.disabled ? "#94a3b8" : "#1e293b",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: btn.disabled ? "not-allowed" : "pointer",
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          3. FORMAL LETTER MODAL (Consolidated / Per Substitute / Per Absent)
          ===================================================================== */}
      {showLetterModal && (
        <div
          className="pinch-letter-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLetterModal(false);
              setLetterSourceOverride(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(3px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="pinch-letter-modal-card"
            style={{
              background: "#e2e8f0",
              borderRadius: 14,
              maxWidth: 980,
              width: "100%",
              maxHeight: "94vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div
              className="turotugma-no-print"
              style={{
                padding: "12px 20px",
                background: "#ffffff",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Letter Format
                  </span>
                  <select
                    value={letterMode}
                    onChange={(e) => setLetterMode(e.target.value)}
                    style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, fontWeight: 700 }}
                  >
                    <option value="consolidated">Consolidated (All-in-One)</option>
                    <option value="per-substitute">Per Substitute Teacher (Individual)</option>
                    <option value="per-absent">Per Absent Teacher</option>
                  </select>
                </div>

                {!letterSourceOverride && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Memo No.
                    </span>
                    <input
                      type="text"
                      value={memoNumber}
                      onChange={(e) => setMemoNumber(e.target.value)}
                      placeholder="Memo No."
                      style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, width: 110 }}
                    />
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Prepared By
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <input
                      type="text"
                      value={coordinatorName}
                      onChange={(e) => setCoordinatorName(e.target.value)}
                      placeholder="Prepared By Name"
                      style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, width: 150 }}
                    />
                    <input
                      type="text"
                      value={coordinatorTitle}
                      onChange={(e) => setCoordinatorTitle(e.target.value)}
                      placeholder="Title"
                      style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, width: 120 }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Approved By
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <input
                      type="text"
                      value={principalName}
                      onChange={(e) => setPrincipalName(e.target.value)}
                      placeholder="Approved By Name"
                      style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, width: 150 }}
                    />
                    <input
                      type="text"
                      value={principalTitle}
                      onChange={(e) => setPrincipalTitle(e.target.value)}
                      placeholder="Title"
                      style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, width: 120 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: "#16a34a",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <FaPrint size={12} />
                  Print A4
                </button>
                <button
                  type="button"
                  onClick={handleExportFormalLetterPdf}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: "#1e3a8a",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <FaFilePdf size={12} />
                  Download A4 PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLetterModal(false);
                    setLetterSourceOverride(null);
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  <FaTimes size={14} />
                </button>
              </div>
            </div>

            {!letterSourceOverride && unsavedChangesCount > 0 && (
              <div
                className="turotugma-no-print"
                style={{
                  background: "#fef3c7",
                  borderBottom: "1px solid #fcd34d",
                  color: "#92400e",
                  padding: "8px 20px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <span>
                  Draft Preview: Showing {unsavedChangesCount} unsaved change
                  {unsavedChangesCount === 1 ? "" : "s"} (not yet logged to Upcoming Schedules or History).
                </span>
                <button
                  type="button"
                  onClick={handleFinalizeDraft}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "none",
                    background: "#15803d",
                    color: "#ffffff",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save & Finalize Now
                </button>
              </div>
            )}

            {unassignedLetterCount > 0 && letterMode === "consolidated" && (
              <div
                className="turotugma-no-print"
                style={{
                  background: "#fffbeb",
                  borderBottom: "1px solid #fde68a",
                  color: "#92400e",
                  padding: "8px 20px",
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                Notice: {unassignedLetterCount} affected class{unassignedLetterCount === 1 ? " has" : "es have"} no assigned substitute yet and will show "UNASSIGNED" on the memorandum.
              </div>
            )}

            <div className="pinch-letter-modal-scroll" style={{ padding: 24, overflowY: "auto" }}>
              {renderFormalLetterDocument()}
            </div>
          </div>
        </div>
      )}

      {!showLetterModal && (
        <div
          className="pinch-letter-offscreen-print"
          style={{ position: "absolute", left: -99999, top: 0, width: "210mm" }}
        >
          {renderFormalLetterDocument()}
        </div>
      )}

      {deleteConfirmTarget && (
        <div
          className="turotugma-no-print"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirmTarget(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(2px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              maxWidth: 440,
              width: "100%",
              padding: "20px 22px",
              boxShadow: "0 20px 40px -12px rgba(15, 23, 42, 0.25)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
              {deleteConfirmTarget.title ||
                (deleteConfirmTarget.mode === "filtered"
                  ? `Delete ${deleteConfirmTarget.count} History Record${deleteConfirmTarget.count === 1 ? "" : "s"}?`
                  : "Delete Pinch-Hit Record?")}
            </h3>
            {deleteConfirmTarget.mode === "filtered" ? (
              <p style={{ margin: "10px 0 18px", fontSize: 13.5, color: "#475569", lineHeight: 1.5 }}>
                {deleteConfirmTarget.description || (
                  <>
                    This will permanently remove all <b>{deleteConfirmTarget.count}</b> currently filtered pinch-hit record{deleteConfirmTarget.count === 1 ? "" : "s"} from history. Master schedules will not be changed.
                  </>
                )}
              </p>
            ) : (
              <div
                style={{
                  margin: "12px 0 18px",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                  color: "#334155",
                  lineHeight: 1.45,
                }}
              >
                <div>
                  <b>{deleteConfirmTarget.entry?.date}</b> ({deleteConfirmTarget.entry?.day}) •{" "}
                  <b>{getOrdinal(Number(deleteConfirmTarget.entry?.period || 1))} Period</b>
                </div>
                <div style={{ marginTop: 4 }}>
                  <b>{deleteConfirmTarget.entry?.sectionName}</b> — {deleteConfirmTarget.entry?.subjectName}
                </div>
                <div style={{ marginTop: 4, fontSize: 12.5, color: "#475569" }}>
                  Absent: {deleteConfirmTarget.entry?.absentNameResolved} • Pinch-Hitter:{" "}
                  <b style={{ color: "#15803d" }}>{deleteConfirmTarget.entry?.substituteNameResolved}</b>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteHistory}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FaTrash size={11} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelConfirmTarget && (
        <div
          className="turotugma-no-print"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancelConfirmTarget(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(2px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              maxWidth: 460,
              width: "100%",
              padding: "20px 22px",
              boxShadow: "0 20px 40px -12px rgba(15, 23, 42, 0.25)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
              {cancelConfirmTarget.title}
            </h3>
            <p style={{ margin: "10px 0 18px", fontSize: 13.5, color: "#475569", lineHeight: 1.5 }}>
              {cancelConfirmTarget.description}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setCancelConfirmTarget(null)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Keep Schedule
              </button>
              <button
                type="button"
                onClick={confirmCancelSavedSelection}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#b91c1c",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FaTimes size={11} />
                Confirm Cancel Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderFormalLetterDocument() {
    const activeMemo = letterContext.memoNumber || memoNumber;
    const activeReason = letterContext.reason || absenceReason;

    return (
      <div ref={letterRef} id="printable-formal-pinch-hit-letter">
        {letterPages.map((page, pageIdx) => (
          <div
            key={page.pageKey}
            className="pinch-letter-page"
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              padding: "12mm 14mm",
              color: "#000",
              fontFamily: "'Times New Roman', Georgia, serif",
              width: "210mm",
              minHeight: "297mm",
              boxSizing: "border-box",
              margin: pageIdx < letterPages.length - 1 ? "0 auto 20px" : "0 auto",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
              display: "flex",
              flexDirection: "column",
              pageBreakAfter: pageIdx < letterPages.length - 1 ? "always" : "auto",
              breakAfter: pageIdx < letterPages.length - 1 ? "page" : "auto",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                <DepEdOfficialSeal
                  size={48}
                  customUrl={schoolProfile?.depedSealUrl || schoolProfile?.depedLogoUrl}
                />
              </div>
              <div style={{ fontSize: 12, fontFamily: "'Old English Text MT', serif", fontWeight: 700, lineHeight: 1.15 }}>
                Republic of the Philippines
              </div>
              <div style={{ fontSize: 15.5, fontFamily: "'Old English Text MT', serif", fontWeight: 800, lineHeight: 1.15 }}>
                Department of Education
              </div>
              <div style={{ fontSize: 10.5, fontFamily: "Arial, sans-serif", fontWeight: 600, lineHeight: 1.2 }}>
                {schoolProfile?.region || "Region II – Cagayan Valley"}
              </div>
              <div style={{ fontSize: 10.5, fontFamily: "Arial, sans-serif", fontWeight: 600, lineHeight: 1.2 }}>
                {schoolProfile?.division || "Schools Division of Nueva Vizcaya"}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  fontFamily: "Arial, sans-serif",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  marginTop: 1,
                }}
              >
                {schoolProfile?.schoolName || "DIADI NATIONAL HIGH SCHOOL"}
              </div>
              <hr style={{ border: "none", borderTop: "2px solid #000", margin: "7px 0 0" }} />
            </div>

            <div style={{ fontSize: 11.5, lineHeight: 1.35, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>OFFICE OF THE SCHOOL PRINCIPAL</span>
                <span>MEMORANDUM NO. {activeMemo}</span>
              </div>

              <table style={{ width: "100%", marginTop: 7, borderCollapse: "collapse", fontSize: 11.5 }}>
                <tbody>
                  <tr>
                    <td style={{ width: 78, fontWeight: 800, padding: "1.5px 0", verticalAlign: "top" }}>TO</td>
                    <td style={{ width: 14, fontWeight: 800, padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                    <td style={{ fontWeight: 700, padding: "1.5px 0" }}>{page.toLine}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 800, padding: "1.5px 0", verticalAlign: "top" }}>FROM</td>
                    <td style={{ fontWeight: 800, padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                    <td style={{ fontWeight: 700, padding: "1.5px 0" }}>
                      {principalName.toUpperCase()} — <span style={{ fontWeight: 400 }}>{principalTitle}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 800, padding: "1.5px 0", verticalAlign: "top" }}>SUBJECT</td>
                    <td style={{ fontWeight: 800, padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                    <td style={{ fontWeight: 800, textTransform: "uppercase", padding: "1.5px 0" }}>
                      DESIGNATION AS PINCH-HIT / SUBSTITUTE TEACHER FOR THE CLASSES OF{" "}
                      {page.absentNamesText}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 800, padding: "1.5px 0", verticalAlign: "top" }}>DATE</td>
                    <td style={{ fontWeight: 800, padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                    <td style={{ fontWeight: 700, padding: "1.5px 0" }}>
                      {formatDateRangeSummary(page.pageStartDate, page.pageEndDate)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <hr style={{ border: "none", borderTop: "1.5px solid #000", margin: "7px 0 0" }} />
            </div>

            <div style={{ fontSize: 11.5, lineHeight: 1.4, textAlign: "justify", marginBottom: 10 }}>
              <p style={{ margin: "0 0 6px" }}>
                1. In the exigency of public service and to ensure uninterrupted instructional delivery,
                you are hereby designated to pinch-hit and handle the scheduled classes of{" "}
                <b>{page.absentNamesText.toUpperCase()}</b>, who {page.isPluralAbsent ? "are" : "is"} unable to attend
                classes on <b>{formatDateRangeSummary(page.pageStartDate, page.pageEndDate)}</b> ({page.periodRangeText})
                due to <b>{activeReason}</b>.
              </p>
              <p style={{ margin: 0 }}>
                2. Please be guided by the class substitution assignments below and affix your signature
                in the Conforme column:
              </p>
            </div>

            {page.emptyNotice ? (
              <div
                style={{
                  border: "1px dashed #64748b",
                  padding: "14px",
                  textAlign: "center",
                  fontFamily: "Arial, sans-serif",
                  fontSize: 11.5,
                  color: "#475569",
                  marginBottom: 12,
                }}
              >
                {page.emptyNotice}
              </div>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: "1.5px solid #000",
                  fontFamily: "Arial, sans-serif",
                  marginBottom: 12,
                  tableLayout: "fixed",
                }}
              >
                <thead>
                  <tr style={{ background: "#e2e8f0" }}>
                    {page.showDateColumn && (
                      <th style={{ ...slipThStyle, width: "9%" }}>Date & Day</th>
                    )}
                    <th style={{ ...slipThStyle, width: page.showDateColumn ? "14%" : "16%" }}>
                      Period & Time
                    </th>
                    <th style={{ ...slipThStyle, width: page.showDateColumn ? "14%" : "15%" }}>
                      Absent Teacher
                    </th>
                    <th style={{ ...slipThStyle, width: page.showDateColumn ? "13%" : "14%" }}>
                      Grade & Section
                    </th>
                    <th style={{ ...slipThStyle, width: page.showDateColumn ? "13%" : "15%" }}>
                      Subject
                    </th>
                    <th style={{ ...slipThStyle, width: page.showDateColumn ? "15%" : "17%" }}>
                      Designated Substitute
                    </th>
                    <th style={{ ...slipThStyle, width: page.showDateColumn ? "12%" : "13%" }}>
                      Qualification / Basis
                    </th>
                    <th
                      style={{
                        ...slipThStyle,
                        width: "10%",
                        minWidth: 72,
                      }}
                    >
                      Conforme (Signature)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((r) => (
                    <tr key={r.rowKey}>
                      {page.showDateColumn && (
                        <td style={slipTdStyle}>
                          <b style={{ whiteSpace: "nowrap" }}>{r.shortDateLabel}</b>
                          <div style={{ fontSize: 8.5 }}>{r.day}</div>
                        </td>
                      )}
                      <td style={slipTdStyle}>
                        <b>{getOrdinal(Number(r.period))} Period</b>
                        <div style={{ fontSize: 8.5, color: "#222" }}>{r.timeLabel}</div>
                      </td>
                      <td style={slipTdStyle}>{r.absentTeacherName}</td>
                      <td style={slipTdStyle}>
                        <b>{r.sectionName}</b>
                      </td>
                      <td style={slipTdStyle}>{r.subjectName}</td>
                      <td style={slipTdStyle}>
                        {r.isAssigned ? (
                          <b style={{ textTransform: "uppercase" }}>{r.substituteTeacherName}</b>
                        ) : (
                          <span style={{ fontStyle: "italic", color: "#64748b" }}>UNASSIGNED</span>
                        )}
                      </td>
                      <td style={{ ...slipTdStyle, fontSize: 9 }}>{r.basis}</td>
                      <td style={{ ...slipTdStyle, minWidth: 72 }}>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div
              className="pinch-no-break"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
                fontFamily: "Arial, sans-serif",
                marginTop: 14,
                pageBreakInside: "avoid",
                breakInside: "avoid",
              }}
            >
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 18 }}>Prepared & Verified by:</div>
                <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", textDecoration: "underline" }}>
                  {coordinatorName}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#222", marginTop: 2 }}>
                  {coordinatorTitle}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 18 }}>Approved by:</div>
                <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", textDecoration: "underline" }}>
                  {principalName}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#222", marginTop: 2 }}>
                  {principalTitle}
                </div>
              </div>
            </div>

            <div
              className="pinch-no-break"
              style={{
                borderTop: "1.5px solid #000",
                marginTop: 14,
                paddingTop: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: "Arial, sans-serif",
                pageBreakInside: "avoid",
                breakInside: "avoid",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SchoolOfficialSeal size={34} schoolName={schoolProfile?.schoolName} />
                <DepEdWordmarkLogo size={34} />
                <BagongPilipinasLogo size={34} />
              </div>
              <div style={{ fontSize: 9, color: "#111", textAlign: "right" }}>
                <div>{schoolProfile?.address || "Poblacion, Diadi, Nueva Vizcaya"}</div>
                <div>School ID: {schoolProfile?.schoolId || "300627"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
}

const compactLabelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  marginBottom: 4,
};

const compactSelectStyle = {
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

const slipThStyle = {
  border: "1px solid #000",
  padding: "4px 5px",
  fontSize: 9.5,
  lineHeight: 1.2,
  fontWeight: 800,
  textAlign: "left",
  textTransform: "uppercase",
};

const slipTdStyle = {
  border: "1px solid #000",
  padding: "4px 5px",
  fontSize: 10,
  lineHeight: 1.25,
  verticalAlign: "middle",
  wordBreak: "break-word",
};

const historyThStyle = {
  padding: "9px 12px",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#475569",
  borderBottom: "1px solid #e2e8f0",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const historyTdStyle = {
  padding: "8px 12px",
  fontSize: 12.5,
  color: "#1e293b",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top",
};
