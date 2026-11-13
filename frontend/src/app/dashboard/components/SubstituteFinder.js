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
  FaUserPlus,
} from "react-icons/fa";
import {
  DepEdOfficialSeal,
  SchoolOfficialSeal,
  BagongPilipinasLogo,
  DepEdWordmarkLogo,
} from "./depedSeals";
import { DEFAULT_SIGNATORIES_BY_LEVEL } from "./SchoolProfileSettings";

const SUBSTITUTIONS_STORAGE_KEY = "turotugma_pinch_hit_assignments";

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
  if (lower.includes("araling") || lower.includes("ap") || lower.includes("social") || lower.includes("kasaysayan") || lower.includes("ekonomiks") || lower.includes("philippine")) {
    return "Araling Panlipunan";
  }
  if (lower.includes("mapeh") || lower.includes("music") || lower.includes("arts") || lower.includes("physical education") || lower.includes("pe") || lower.includes("health")) {
    return "MAPEH";
  }
  if (lower.includes("tle") || lower.includes("livelihood") || lower.includes("ict") || lower.includes("cookery") || lower.includes("tvl") || lower.includes("computer")) {
    return "TLE / TVL";
  }
  if (lower.includes("esp") || lower.includes("pagpapakatao") || lower.includes("values") || lower.includes("homeroom") || lower.includes("hgp") || lower.includes("philosophy")) {
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

  const [selectedDay, setSelectedDay] = useState(() => days[0] || "Monday");
  const [fromPeriod, setFromPeriod] = useState(() => minPeriod);
  const [toPeriod, setToPeriod] = useState(() => maxPeriod);
  const [absenceDate, setAbsenceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [absenceReason, setAbsenceReason] = useState(COMMON_ABSENCE_REASONS[0]);

  // Master-detail state: which affected class key (`${absentTid}|P${period}`) is currently focused
  const [activeClassKey, setActiveClassKey] = useState(null);
  const [expandedTeacherId, setExpandedTeacherId] = useState(null);
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [includeBusyTeachers, setIncludeBusyTeachers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLetterModal, setShowLetterModal] = useState(false);

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

  const [pinchHitMap, setPinchHitMap] = useState(() =>
    getFromStorage(SUBSTITUTIONS_STORAGE_KEY, {})
  );

  const savePinchHitAssignment = (
    absentTid,
    periodNum,
    substituteTeacherId,
    classInfo,
    eligibilityLabel = ""
  ) => {
    const key = `${selectedDay}|P${periodNum}|${absentTid}`;
    setPinchHitMap((prev) => {
      const next = { ...prev };
      if (!substituteTeacherId) {
        delete next[key];
      } else {
        next[key] = {
          day: selectedDay,
          date: absenceDate,
          period: periodNum,
          absentTeacherId: String(absentTid),
          absentTeacherName: getTeacherName(absentTid),
          substituteTeacherId: String(substituteTeacherId),
          substituteTeacherName: getTeacherName(substituteTeacherId),
          sectionId: classInfo?.sectionId || "",
          sectionName: classInfo?.sectionName || "",
          subjectId: classInfo?.subjectId || "",
          subjectName: classInfo?.subjectName || "",
          eligibilityLabel,
          reason: absenceReason,
          updatedAt: new Date().toISOString(),
        };
      }
      try {
        window.localStorage.setItem(SUBSTITUTIONS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const clearSelectedAbsentTeachersPinchHits = () => {
    setPinchHitMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        const parts = k.split("|");
        const dayPart = parts[0];
        const tidPart = parts[2];
        if (dayPart === selectedDay && absentTeacherIds.includes(String(tidPart))) {
          delete next[k];
        }
      });
      try {
        window.localStorage.setItem(SUBSTITUTIONS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const startP = Math.min(Number(fromPeriod) || minPeriod, Number(toPeriod) || maxPeriod);
  const endP = Math.max(Number(fromPeriod) || minPeriod, Number(toPeriod) || maxPeriod);

  const rangePeriods = useMemo(
    () => periods.filter((p) => p >= startP && p <= endP),
    [periods, startP, endP]
  );

  const isShortenedDay = shortenedSessionDays.includes(selectedDay);
  const getTimeForPeriod = (periodNum) => {
    const idx = periods.indexOf(periodNum);
    if (idx === -1) return `Period ${periodNum}`;
    return (isShortenedDay ? shortenedTimes[idx] : regularTimes[idx]) || `Period ${periodNum}`;
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

      if (tObj) {
        if (tObj.major) {
          subjectNames.add(String(tObj.major).toLowerCase().trim());
          const area = normalizeSubjectAreaKey(tObj.major);
          if (area) subjectAreas.add(area);
        }
        if (tObj.minor) {
          subjectNames.add(String(tObj.minor).toLowerCase().trim());
          const area = normalizeSubjectAreaKey(tObj.minor);
          if (area) subjectAreas.add(area);
        }
        if (Array.isArray(tObj.subjectExpertise)) {
          tObj.subjectExpertise.forEach((s) => {
            subjectNames.add(String(s).toLowerCase().trim());
            const area = normalizeSubjectAreaKey(s);
            if (area) subjectAreas.add(area);
          });
        }
        if (Array.isArray(tObj.subjects)) {
          tObj.subjects.forEach((s) => {
            subjectIds.add(String(s));
            const sName = getSubjectName(s);
            subjectNames.add(String(sName).toLowerCase().trim());
            const area = normalizeSubjectAreaKey(sName);
            if (area) subjectAreas.add(area);
          });
        }
        if (Array.isArray(tObj.gradeLevels)) {
          tObj.gradeLevels.forEach((g) => {
            const num = parseInt(String(g).replace(/\D/g, ""), 10);
            if (!Number.isNaN(num)) gradeLevels.add(num);
          });
        }
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
            if (cell.assignment.subjectId) {
              subjectIds.add(String(cell.assignment.subjectId));
              const sName = getSubjectName(cell.assignment.subjectId);
              if (sName) {
                subjectNames.add(String(sName).toLowerCase().trim());
                const area = normalizeSubjectAreaKey(sName);
                if (area) subjectAreas.add(area);
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

  // Build affected classes across ALL selected absent teachers, sorted by Period then Teacher
  const affectedClasses = useMemo(() => {
    const list = [];

    rangePeriods.forEach((periodNum) => {
      absentTeacherIds.forEach((absentTid) => {
        const found = getTeacherCellAssignment
          ? getTeacherCellAssignment(absentTid, selectedDay, periodNum)
          : null;
        if (!found) return;

        const classKey = `${absentTid}|P${periodNum}`;
        const subjectId = found?.assignment?.subjectId || "";
        const subjectName = subjectId ? getSubjectName(subjectId) : "";
        const targetSubjectArea = normalizeSubjectAreaKey(subjectName);
        const sectionId = found?.sectionId || "";
        const sectionName = sectionId ? getSectionName(sectionId) : "";
        const secObj = sectionsById.get(sectionId) || sectionsById.get(String(sectionId));
        const targetGrade = extractGradeNumber(secObj, sectionId, sectionName);

        // Check which substitutes are already assigned to OTHER absent teachers in this exact period
        const alreadyPinchHittingInPeriod = new Map();
        absentTeacherIds.forEach((otherAbsentTid) => {
          if (String(otherAbsentTid) === String(absentTid)) return;
          const otherKey = `${selectedDay}|P${periodNum}|${otherAbsentTid}`;
          const existingSub = pinchHitMap[otherKey];
          if (existingSub?.substituteTeacherId) {
            alreadyPinchHittingInPeriod.set(
              String(existingSub.substituteTeacherId),
              existingSub
            );
          }
        });

        // Evaluate all active teachers who are NOT part of the absent group
        const candidates = allTeacherIds
          .filter((tid) => !absentTeacherSet.has(String(tid)))
          .map((tid) => {
            const existingClass = getTeacherCellAssignment
              ? getTeacherCellAssignment(tid, selectedDay, periodNum)
              : null;
            const markedUnavail = isTeacherMarkedUnavailable(tid, selectedDay, periodNum);
            const assignedOtherSub = alreadyPinchHittingInPeriod.get(String(tid));
            const isFree = !existingClass && !markedUnavail && !assignedOtherSub;

            const prof = teacherCompetencyProfile.get(String(tid));
            const dayLoad = prof?.dayLoadMap?.[selectedDay] || 0;
            const weeklyLoad = prof?.weeklyLoad || 0;
            const tObj = prof?.teacherObj;

            const cleanTargetSub = String(subjectName || "")
              .toLowerCase()
              .replace(/\s+\d+$/, "")
              .trim();
            const isSubjectMatch = Boolean(
              (subjectId && prof?.subjectIds?.has(String(subjectId))) ||
                (targetSubjectArea && prof?.subjectAreas?.includes(targetSubjectArea)) ||
                (cleanTargetSub &&
                  prof?.subjectNames?.some(
                    (s) => s.includes(cleanTargetSub) || cleanTargetSub.includes(s)
                  ))
            );

            const isGradeMatch = Boolean(
              targetGrade && prof?.gradeLevels?.includes(Number(targetGrade))
            );

            // Match Score:
            // - Eligible (Free + Subject + Grade): 92 - 98%
            // - Subject Eligible (Free + Subject): 84 - 90%
            // - Grade Eligible (Free + Grade): 75 - 81%
            // - Other Active Free Teacher (General Pinch-Hit): 65 - 71%
            // - Busy / Already Assigned: 20 - 45%
            let matchScore = 0;
            const loadBonus = Math.max(0, 6 - dayLoad);
            if (isFree) {
              if (isSubjectMatch && isGradeMatch) {
                matchScore = 92 + loadBonus;
              } else if (isSubjectMatch) {
                matchScore = 84 + loadBonus;
              } else if (isGradeMatch) {
                matchScore = 75 + loadBonus;
              } else {
                matchScore = 65 + loadBonus;
              }
            } else {
              matchScore = 25 + (isSubjectMatch ? 12 : 0) + (isGradeMatch ? 6 : 0);
            }
            matchScore = Math.min(98, Math.max(15, matchScore));

            let eligibilityTier = 5;
            let eligibilityBadge = "Has Class Conflict";
            if (isFree) {
              if (isSubjectMatch && isGradeMatch) {
                eligibilityTier = 1;
                eligibilityBadge = `Eligible (${targetSubjectArea || subjectName} • Grade ${targetGrade})`;
              } else if (isSubjectMatch) {
                eligibilityTier = 2;
                eligibilityBadge = `Eligible Subject (${targetSubjectArea || subjectName})`;
              } else if (isGradeMatch) {
                eligibilityTier = 3;
                eligibilityBadge = `Same Grade Level (Grade ${targetGrade})`;
              } else {
                eligibilityTier = 4;
                eligibilityBadge = `Active Teacher (${prof?.subjectAreas?.join(", ") || tObj?.major || "General"})`;
              }
            } else if (assignedOtherSub) {
              eligibilityBadge = `Covering ${assignedOtherSub.sectionName} (P${periodNum})`;
            }

            const reasons = [];
            if (isFree) {
              reasons.push({
                ok: true,
                text: `Available during ${getOrdinal(periodNum)} Period (No class or sub conflict)`,
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
                text: `Handles same subject area (${targetSubjectArea || subjectName})`,
              });
            } else {
              reasons.push({
                ok: true,
                text: `Active teacher from ${prof?.subjectAreas?.join(", ") || tObj?.major || "General Department"} (Can supervise / pinch-hit)`,
              });
            }

            if (isGradeMatch) {
              reasons.push({
                ok: true,
                text: `Handles Grade ${targetGrade} students`,
              });
            }

            reasons.push({
              ok: dayLoad < 6,
              text:
                dayLoad < 6
                  ? `Workload within limit (${dayLoad} classes today • ${weeklyLoad}/wk)`
                  : `High daily load (${dayLoad} classes today • ${weeklyLoad}/wk)`,
            });

            const dayTimeline = periods.map((p) => {
              const c = getTeacherCellAssignment
                ? getTeacherCellAssignment(tid, selectedDay, p)
                : null;
              return {
                period: p,
                isCurrentPeriod: p === periodNum,
                hasClass: Boolean(c),
                subjectName: c?.assignment?.subjectId ? getSubjectName(c.assignment.subjectId) : "",
                sectionName: c?.sectionId ? getSectionName(c.sectionId) : "",
              };
            });

            return {
              teacherId: String(tid),
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
              hasAssignment: Boolean(existingClass) || Boolean(assignedOtherSub),
              isSubjectMatch,
              isGradeMatch,
              eligibilityTier,
              eligibilityBadge,
              matchScore,
              reasons,
              dayLoad,
              weeklyLoad,
              dayTimeline,
            };
          });

        candidates.sort((a, b) => {
          if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
          if (a.dayLoad !== b.dayLoad) return a.dayLoad - b.dayLoad;
          return a.teacherName.localeCompare(b.teacherName);
        });

        list.push({
          classKey,
          absentTeacherId: String(absentTid),
          absentTeacherName: getTeacherName(absentTid),
          period: periodNum,
          timeLabel: getTimeForPeriod(periodNum),
          subjectId,
          subjectName,
          targetSubjectArea,
          sectionId,
          sectionName,
          targetGrade,
          candidates,
        });
      });
    });

    return list;
  }, [
    rangePeriods,
    absentTeacherIds,
    absentTeacherSet,
    selectedDay,
    allTeacherIds,
    getTeacherCellAssignment,
    getSubjectName,
    getSectionName,
    getTeacherName,
    sectionsById,
    teacherCompetencyProfile,
    pinchHitMap,
    periods,
  ]);

  useEffect(() => {
    if (affectedClasses.length > 0) {
      const exists = affectedClasses.some((c) => c.classKey === activeClassKey);
      if (!exists) {
        const firstUnassigned = affectedClasses.find(
          (c) => !pinchHitMap[`${selectedDay}|P${c.period}|${c.absentTeacherId}`]
        );
        setActiveClassKey(
          firstUnassigned ? firstUnassigned.classKey : affectedClasses[0].classKey
        );
      }
    } else {
      setActiveClassKey(null);
    }
  }, [affectedClasses, activeClassKey, selectedDay, pinchHitMap]);

  useEffect(() => {
    setShowAllCandidates(false);
    setExpandedTeacherId(null);
  }, [activeClassKey, selectedDay]);

  const activeClassObj = useMemo(
    () =>
      affectedClasses.find((c) => c.classKey === activeClassKey) ||
      affectedClasses[0] ||
      null,
    [affectedClasses, activeClassKey]
  );

  const coveredCount = useMemo(
    () =>
      affectedClasses.filter(
        (c) => Boolean(pinchHitMap[`${selectedDay}|P${c.period}|${c.absentTeacherId}`])
      ).length,
    [affectedClasses, pinchHitMap, selectedDay]
  );

  const uncoveredCount = affectedClasses.length - coveredCount;

  // Smart Auto-Assign across single or multiple absent teachers:
  // Prioritizes Eligible Teachers first, then seamlessly falls back to any Free Active Teacher
  // while ensuring no substitute teacher is double-booked in the same period!
  const handleAutoAssignAll = () => {
    const usedInPeriod = {}; // periodNum -> Set of substituteTeacherIds
    const usedCountInDay = {}; // substituteTeacherId -> count assigned today

    const nextPinchMap = { ...pinchHitMap };

    affectedClasses.forEach((cls) => {
      if (!usedInPeriod[cls.period]) {
        usedInPeriod[cls.period] = new Set();
      }
      // Filter to active teachers who are free in this period AND not already assigned to another absent teacher in the same period
      const availablePool = cls.candidates.filter(
        (c) => c.isFree && !usedInPeriod[cls.period].has(c.teacherId)
      );
      if (availablePool.length === 0) return;

      availablePool.sort((a, b) => {
        // Eligible (Tier 1-3) comes first, then Tier 4 (Other Active Free Teachers), balanced by daily assignments
        const adjScoreA = a.matchScore - (usedCountInDay[a.teacherId] || 0) * 4;
        const adjScoreB = b.matchScore - (usedCountInDay[b.teacherId] || 0) * 4;
        return adjScoreB - adjScoreA;
      });

      const chosen = availablePool[0];
      usedInPeriod[cls.period].add(chosen.teacherId);
      usedCountInDay[chosen.teacherId] = (usedCountInDay[chosen.teacherId] || 0) + 1;

      const key = `${selectedDay}|P${cls.period}|${cls.absentTeacherId}`;
      nextPinchMap[key] = {
        day: selectedDay,
        date: absenceDate,
        period: cls.period,
        absentTeacherId: cls.absentTeacherId,
        absentTeacherName: cls.absentTeacherName,
        substituteTeacherId: chosen.teacherId,
        substituteTeacherName: chosen.teacherName,
        sectionId: cls.sectionId || "",
        sectionName: cls.sectionName || "",
        subjectId: cls.subjectId || "",
        subjectName: cls.subjectName || "",
        eligibilityLabel: chosen.eligibilityBadge,
        reason: absenceReason,
        updatedAt: new Date().toISOString(),
      };
    });

    setPinchHitMap(nextPinchMap);
    try {
      window.localStorage.setItem(SUBSTITUTIONS_STORAGE_KEY, JSON.stringify(nextPinchMap));
    } catch {
      // ignore
    }
  };

  const handleExportFormalLetterPdf = () => {
    if (!letterRef.current) return;
    const opt = {
      margin: 0,
      filename: `PinchHit_Formal_Letter_${absenceDate}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(letterRef.current).save();
  };

  const designatedSubstitutesList = useMemo(() => {
    const map = new Map();
    affectedClasses.forEach((cls) => {
      const pinchKey = `${selectedDay}|P${cls.period}|${cls.absentTeacherId}`;
      const assigned = pinchHitMap[pinchKey];
      const topSuggested = cls.candidates.find((c) => c.isFree);
      const tid = assigned?.substituteTeacherId || topSuggested?.teacherId;
      const tName = assigned?.substituteTeacherName || topSuggested?.teacherName;
      if (tid && tName && !map.has(String(tid))) {
        map.set(String(tid), {
          teacherId: String(tid),
          teacherName: tName,
        });
      }
    });
    return Array.from(map.values());
  }, [affectedClasses, selectedDay, pinchHitMap]);

  const absentTeachersNamesText = useMemo(
    () => absentTeacherIds.map((id) => getTeacherName(id)).join(", "),
    [absentTeacherIds, getTeacherName]
  );

  const formattedDateLong = useMemo(() => {
    try {
      const d = new Date(absenceDate + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return absenceDate;
    }
  }, [absenceDate]);

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

  return (
    <div style={{ marginTop: 12 }}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-formal-pinch-hit-letter,
          #printable-formal-pinch-hit-letter * {
            visibility: visible !important;
          }
          #printable-formal-pinch-hit-letter {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 6mm 8mm !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* =====================================================================
          1. WHO IS ABSENT? — Single Compact Context Bar (Supports 1 or Multiple Teachers)
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
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
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
                minWidth: 240,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  maxWidth: 210,
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
                <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 8 }}>
                  Check multiple teachers if they are attending a seminar or competition together.
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
                    const checked = absentTeacherIds.includes(String(tid));
                    const prof = teacherCompetencyProfile.get(String(tid));
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
                        <div style={{ flex: 1 }}>
                          <div>{getTeacherName(tid)}</div>
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

          <div>
            <label style={compactLabelStyle}>Day</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              style={compactSelectStyle}
            >
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
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
              style={compactSelectStyle}
            >
              {COMMON_ABSENCE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={compactLabelStyle}>Date</label>
            <input
              type="date"
              value={absenceDate}
              onChange={(e) => setAbsenceDate(e.target.value)}
              style={compactSelectStyle}
            />
          </div>
        </div>

        {/* Right: Primary Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {affectedClasses.length > 0 && (
            <button
              type="button"
              onClick={handleAutoAssignAll}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 13.5,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <FaMagic size={13} />
              Auto-Assign Best Matches
            </button>
          )}

          {coveredCount > 0 && (
            <button
              type="button"
              onClick={clearSelectedAbsentTeachersPinchHits}
              title="Clear assigned substitutes"
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

          <button
            type="button"
            onClick={() => setShowLetterModal(true)}
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

      {/* =====================================================================
          2. MASTER-DETAIL WORKSPACE (Left: Affected Classes | Right: Suggested Substitutes)
          ===================================================================== */}
      {absentTeacherIds.length === 0 ? (
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
            The selected teacher(s) have no scheduled classes on <b>{selectedDay}</b> between the{" "}
            <b>{getOrdinal(startP)}</b> and <b>{getOrdinal(endP)} Period</b>.
          </p>
        </div>
      ) : (
        <div
          className="turotugma-no-print"
          style={{
            display: "grid",
            gridTemplateColumns: "360px 1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* LEFT PANEL: Affected Classes List */}
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
                  {absentTeacherIds.length > 1
                    ? `Across ${absentTeacherIds.length} absent teachers`
                    : "Select a class to assign a substitute"}
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

            <div style={{ display: "grid", maxHeight: 620, overflowY: "auto" }}>
              {affectedClasses.map((cls) => {
                const isSelected = activeClassObj?.classKey === cls.classKey;
                const pinchKey = `${selectedDay}|P${cls.period}|${cls.absentTeacherId}`;
                const assignedSub = pinchHitMap[pinchKey];

                return (
                  <div
                    key={cls.classKey}
                    onClick={() => setActiveClassKey(cls.classKey)}
                    style={{
                      padding: "14px 16px",
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
                          color: assignedSub ? "#15803d" : "#dc2626",
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
                            background: assignedSub ? "#16a34a" : "#dc2626",
                          }}
                        />
                        {assignedSub ? "Covered" : "Needs Sub"}
                      </span>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                      {cls.subjectName} — {cls.sectionName}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginTop: 2 }}>
                      Absent: {cls.absentTeacherName}
                    </div>

                    {assignedSub && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "5px 8px",
                          borderRadius: 6,
                          background: "#dcfce7",
                          color: "#166534",
                          fontSize: 12,
                          fontWeight: 700,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>Sub: {assignedSub.substituteTeacherName}</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            savePinchHitAssignment(cls.absentTeacherId, cls.period, null, cls);
                          }}
                          style={{
                            cursor: "pointer",
                            color: "#15803d",
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
          </div>

          {/* RIGHT PANEL: Top Suggested Substitutes for Active Class */}
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
                  paddingBottom: 16,
                  borderBottom: "1px solid #e2e8f0",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>
                    Suggested Replacements • {getOrdinal(activeClassObj.period)} Period ({activeClassObj.timeLabel})
                  </div>
                  <h3 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                    {activeClassObj.subjectName} — {activeClassObj.sectionName}
                  </h3>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                    Absent: <b>{activeClassObj.absentTeacherName}</b> • Prioritizing eligible teachers first, then all{" "}
                    <b>{totalAvailableForActiveClass} active free teachers</b>
                  </div>
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

              {/* Ranked Candidate List */}
              <div style={{ display: "grid", gap: 10 }}>
                {visibleCandidatesForActiveClass.map((cand, index) => {
                  const pinchKey = `${selectedDay}|P${activeClassObj.period}|${activeClassObj.absentTeacherId}`;
                  const assignedSub = pinchHitMap[pinchKey];
                  const isAssigned = assignedSub?.substituteTeacherId === cand.teacherId;
                  const isExpanded =
                    expandedTeacherId === cand.teacherId || (index === 0 && expandedTeacherId === null);

                  return (
                    <div
                      key={cand.teacherId}
                      style={{
                        borderRadius: 10,
                        border: isAssigned
                          ? "2px solid #16a34a"
                          : index === 0 && cand.isFree
                          ? "1.5px solid #93c5fd"
                          : "1px solid #e2e8f0",
                        background: isAssigned
                          ? "#f0fdf4"
                          : index === 0 && cand.isFree
                          ? "#f8faff"
                          : "#ffffff",
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
                            setExpandedTeacherId(
                              isExpanded && expandedTeacherId !== null ? "__none__" : cand.teacherId
                            )
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
                                  background: cand.isFree ? "#dcfce7" : "#fef3c7",
                                  color: cand.isFree ? "#15803d" : "#b45309",
                                }}
                              >
                                {cand.isFree ? "Available" : "Has Conflict"}
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
                          <div style={{ textAlign: "right" }}>
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 800,
                                color:
                                  cand.matchScore >= 84
                                    ? "#15803d"
                                    : cand.matchScore >= 65
                                    ? "#1d4ed8"
                                    : "#64748b",
                              }}
                            >
                              {cand.matchScore}% Match
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTeacherId(
                                isExpanded && expandedTeacherId !== null ? "__none__" : cand.teacherId
                              )
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
                            onClick={() => {
                              const nextVal = isAssigned ? null : cand.teacherId;
                              savePinchHitAssignment(
                                activeClassObj.absentTeacherId,
                                activeClassObj.period,
                                nextVal,
                                activeClassObj,
                                cand.eligibilityBadge
                              );
                              // If assigning (not unassigning), auto-advance to the next unassigned class
                              if (nextVal) {
                                const currentIdx = affectedClasses.findIndex(
                                  (c) => c.classKey === activeClassObj.classKey
                                );
                                const orderedAfter = [
                                  ...affectedClasses.slice(currentIdx + 1),
                                  ...affectedClasses.slice(0, currentIdx),
                                ];
                                const nextUnassigned = orderedAfter.find(
                                  (c) =>
                                    !pinchHitMap[`${selectedDay}|P${c.period}|${c.absentTeacherId}`]
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
                              background: isAssigned ? "#16a34a" : "#2563eb",
                              color: "#ffffff",
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: "pointer",
                              minWidth: 96,
                            }}
                          >
                            {isAssigned ? "Assigned" : "Assign"}
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
                            <div style={{ fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                              Why recommended:
                            </div>
                            <div style={{ display: "grid", gap: 4 }}>
                              {cand.reasons.map((r, i) => (
                                <div
                                  key={i}
                                  style={{
                                    color: r.ok ? "#166534" : "#64748b",
                                    display: "flex",
                                    alignItems: "center",
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
                              {selectedDay} Schedule ({cand.dayLoad} classes):
                            </div>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: `repeat(${periods.length}, minmax(0, 1fr))`,
                                gap: 4,
                              }}
                            >
                              {cand.dayTimeline.map((tSlot) => (
                                <div
                                  key={tSlot.period}
                                  title={
                                    tSlot.hasClass
                                      ? `P${tSlot.period}: ${tSlot.subjectName} (${tSlot.sectionName})`
                                      : `P${tSlot.period}: Free`
                                  }
                                  style={{
                                    textAlign: "center",
                                    padding: "4px 2px",
                                    borderRadius: 5,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    border: tSlot.isCurrentPeriod
                                      ? "2px solid #2563eb"
                                      : "1px solid #e2e8f0",
                                    background: tSlot.hasClass ? "#f1f5f9" : "#dcfce7",
                                    color: tSlot.hasClass ? "#475569" : "#166534",
                                  }}
                                >
                                  P{tSlot.period}
                                  <div style={{ fontSize: 9, fontWeight: 600 }}>
                                    {tSlot.hasClass ? "Busy" : "Free"}
                                  </div>
                                </div>
                              ))}
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
                      : `Show All ${totalAvailableForActiveClass} Available Active Teachers (Eligible + Other Subjects)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          3. FORMAL LETTER MODAL (A4 Portrait 210mm x 297mm)
          ===================================================================== */}
      {showLetterModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLetterModal(false);
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
            style={{
              background: "#e2e8f0",
              borderRadius: 14,
              maxWidth: 940,
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
                padding: "14px 20px",
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
                    Memo No.
                  </span>
                  <input
                    type="text"
                    value={memoNumber}
                    onChange={(e) => setMemoNumber(e.target.value)}
                    placeholder="Memo No."
                    style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, width: 115 }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Prepared By (Name & Position)
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <input
                      type="text"
                      value={coordinatorName}
                      onChange={(e) => setCoordinatorName(e.target.value)}
                      placeholder="Prepared By Name"
                      style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, width: 165 }}
                    />
                    <input
                      type="text"
                      value={coordinatorTitle}
                      onChange={(e) => setCoordinatorTitle(e.target.value)}
                      placeholder="Position / Title"
                      style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, width: 135 }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Approved By (Name & Position)
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <input
                      type="text"
                      value={principalName}
                      onChange={(e) => setPrincipalName(e.target.value)}
                      placeholder="Approved By Name"
                      style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, width: 165 }}
                    />
                    <input
                      type="text"
                      value={principalTitle}
                      onChange={(e) => setPrincipalTitle(e.target.value)}
                      placeholder="Position / Title"
                      style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, width: 135 }}
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
                  onClick={() => setShowLetterModal(false)}
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

            <div style={{ padding: 24, overflowY: "auto" }}>
              {renderFormalLetterDocument()}
            </div>
          </div>
        </div>
      )}

      {!showLetterModal && (
        <div style={{ position: "absolute", left: -99999, top: 0, width: "210mm" }}>
          {renderFormalLetterDocument()}
        </div>
      )}
    </div>
  );

  function renderFormalLetterDocument() {
    return (
      <div
        ref={letterRef}
        id="printable-formal-pinch-hit-letter"
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          padding: "16mm 18mm",
          color: "#000",
          fontFamily: "'Times New Roman', Georgia, serif",
          width: "210mm",
          minHeight: "297mm",
          boxSizing: "border-box",
          margin: "0 auto",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
            <DepEdOfficialSeal
              size={60}
              customUrl={schoolProfile?.depedSealUrl || schoolProfile?.depedLogoUrl}
            />
          </div>
          <div style={{ fontSize: 13, fontFamily: "'Old English Text MT', serif", fontWeight: 700 }}>
            Republic of the Philippines
          </div>
          <div style={{ fontSize: 17, fontFamily: "'Old English Text MT', serif", fontWeight: 800 }}>
            Department of Education
          </div>
          <div style={{ fontSize: 11.5, fontFamily: "Arial, sans-serif", fontWeight: 600 }}>
            {schoolProfile?.region || "Region II – Cagayan Valley"}
          </div>
          <div style={{ fontSize: 11.5, fontFamily: "Arial, sans-serif", fontWeight: 600 }}>
            {schoolProfile?.division || "Schools Division of Nueva Vizcaya"}
          </div>
          <div
            style={{
              fontSize: 13.5,
              fontFamily: "Arial, sans-serif",
              fontWeight: 800,
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            {schoolProfile?.schoolName || "DIADI NATIONAL HIGH SCHOOL"}
          </div>
          <hr style={{ border: "none", borderTop: "2px solid #000", margin: "10px 0 0" }} />
        </div>

        <div style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>OFFICE OF THE SCHOOL PRINCIPAL</span>
            <span>MEMORANDUM NO. {memoNumber}</span>
          </div>

          <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse", fontSize: 12.5 }}>
            <tbody>
              <tr>
                <td style={{ width: 90, fontWeight: 800, padding: "2px 0" }}>TO</td>
                <td style={{ width: 15, fontWeight: 800, padding: "2px 0" }}>:</td>
                <td style={{ fontWeight: 700, padding: "2px 0" }}>
                  {designatedSubstitutesList.length > 0
                    ? designatedSubstitutesList.map((s) => s.teacherName.toUpperCase()).join("; ")
                    : "DESIGNATED PINCH-HIT / SUBSTITUTE FACULTY MEMBER(S)"}
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 800, padding: "2px 0" }}>FROM</td>
                <td style={{ fontWeight: 800, padding: "2px 0" }}>:</td>
                <td style={{ fontWeight: 700, padding: "2px 0" }}>
                  {principalName.toUpperCase()} — <span style={{ fontWeight: 400 }}>{principalTitle}</span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 800, padding: "2px 0" }}>SUBJECT</td>
                <td style={{ fontWeight: 800, padding: "2px 0" }}>:</td>
                <td style={{ fontWeight: 800, textTransform: "uppercase", padding: "2px 0" }}>
                  DESIGNATION AS PINCH-HIT / SUBSTITUTE TEACHER FOR THE CLASSES OF{" "}
                  {absentTeachersNamesText}
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 800, padding: "2px 0" }}>DATE</td>
                <td style={{ fontWeight: 800, padding: "2px 0" }}>:</td>
                <td style={{ fontWeight: 700, padding: "2px 0" }}>
                  {formattedDateLong} ({selectedDay})
                </td>
              </tr>
            </tbody>
          </table>
          <hr style={{ border: "none", borderTop: "1.5px solid #000", margin: "10px 0 0" }} />
        </div>

        <div style={{ fontSize: 12.5, lineHeight: 1.55, textAlign: "justify", marginBottom: 14 }}>
          <p style={{ margin: "0 0 8px" }}>
            1. In the exigency of public service and to ensure uninterrupted instructional delivery,
            you are hereby designated to pinch-hit and handle the scheduled classes of{" "}
            <b>{absentTeachersNamesText.toUpperCase()}</b>, who {absentTeacherIds.length > 1 ? "are" : "is"} unable to attend
            classes on <b>{selectedDay}, {formattedDateLong}</b> ({getOrdinal(startP)} to{" "}
            {getOrdinal(endP)} Period) due to <b>{absenceReason}</b>.
          </p>
          <p style={{ margin: 0 }}>
            2. Please be guided by the class substitution assignments below and affix your signature
            in the Conforme column:
          </p>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1.5px solid #000",
            fontFamily: "Arial, sans-serif",
            marginBottom: 16,
          }}
        >
          <thead>
            <tr style={{ background: "#e2e8f0" }}>
              <th style={slipThStyle}>Period & Time</th>
              <th style={slipThStyle}>Absent Teacher</th>
              <th style={slipThStyle}>Grade & Section</th>
              <th style={slipThStyle}>Subject</th>
              <th style={slipThStyle}>Designated Substitute</th>
              <th style={slipThStyle}>Qualification / Basis</th>
              <th style={slipThStyle}>Conforme (Signature)</th>
            </tr>
          </thead>
          <tbody>
            {affectedClasses.map((cls) => {
              const pinchKey = `${selectedDay}|P${cls.period}|${cls.absentTeacherId}`;
              const assignedSub = pinchHitMap[pinchKey];
              const topSuggested = cls.candidates.find((c) => c.isFree);
              const chosenName =
                assignedSub?.substituteTeacherName ||
                topSuggested?.teacherName ||
                "______________________";
              const basis =
                assignedSub?.eligibilityLabel ||
                topSuggested?.eligibilityBadge ||
                "Available Active Teacher";

              return (
                <tr key={cls.classKey}>
                  <td style={slipTdStyle}>
                    <b>{getOrdinal(cls.period)} Period</b>
                    <div style={{ fontSize: 10 }}>{cls.timeLabel}</div>
                  </td>
                  <td style={slipTdStyle}>{cls.absentTeacherName}</td>
                  <td style={slipTdStyle}>
                    <b>{cls.sectionName}</b>
                  </td>
                  <td style={slipTdStyle}>{cls.subjectName}</td>
                  <td style={slipTdStyle}>
                    <b style={{ textTransform: "uppercase" }}>{chosenName}</b>
                  </td>
                  <td style={{ ...slipTdStyle, fontSize: 10.5 }}>{basis}</td>
                  <td style={{ ...slipTdStyle, minWidth: 110 }}>&nbsp;</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 28,
            fontFamily: "Arial, sans-serif",
            marginTop: 22,
            pageBreakInside: "avoid",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 24 }}>Prepared & Verified by:</div>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", textDecoration: "underline" }}>
              {coordinatorName}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: "#222", marginTop: 2 }}>
              {coordinatorTitle}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 24 }}>Approved by:</div>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", textDecoration: "underline" }}>
              {principalName}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: "#222", marginTop: 2 }}>
              {principalTitle}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1.5px solid #000",
            marginTop: "auto",
            paddingTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SchoolOfficialSeal size={38} schoolName={schoolProfile?.schoolName} />
            <DepEdWordmarkLogo size={38} />
            <BagongPilipinasLogo size={38} />
          </div>
          <div style={{ fontSize: 9.5, color: "#111", textAlign: "right" }}>
            <div>{schoolProfile?.address || "Poblacion, Diadi, Nueva Vizcaya"}</div>
            <div>School ID: {schoolProfile?.schoolId || "300627"}</div>
          </div>
        </div>
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
  padding: "6px 7px",
  fontSize: 10.5,
  fontWeight: 800,
  textAlign: "left",
  textTransform: "uppercase",
};

const slipTdStyle = {
  border: "1px solid #000",
  padding: "6px 7px",
  fontSize: 11,
};
