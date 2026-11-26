import React, { useMemo, useEffect, useState } from "react";

const SUBJECT_CODE_FALLBACK_NAMES = {
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
  DEVREAD: "Developmental Reading",
  ELEMALG: "Elementary Algebra",
  ENVSCI: "Environmental Science",
  "ICT-SPJ": "ICT (SPJ)",
  "ICT-STEM": "ICT (SP-STEM)",
  ICT: "Information and Communications Technology (ICT)",
  ORALCOM: "Oral Communication in Context",
  GENMATH: "General Mathematics",
  EARTHSCI: "Earth and Life Science",
  KOMPAN: "Komunikasyon at Pananaliksik",
  PEH1: "Physical Education and Health 1",
  PEH2: "Physical Education and Health 2",
  LIT21: "21st Century Literature",
  STATPROB: "Statistics and Probability",
  PHYSCI: "Physical Science",
  PERDEV: "Personal Development",
  UCSP: "Understanding Culture, Society, and Politics",
  MIL: "Media and Information Literacy",
  EMPTECH: "Empowerment Technologies",
  EAPP: "English for Academic and Professional Purposes",
  PRACRES1: "Practical Research 1",
  PRACRES2: "Practical Research 2",
  ENTREP: "Entrepreneurship",
  PRECALC: "Pre-Calculus",
  BASCALC: "Basic Calculus",
  GENPHYS1: "General Physics 1",
  GENPHYS2: "General Physics 2",
  GENCHEM1: "General Chemistry 1",
  GENCHEM2: "General Chemistry 2",
  CREWRITE: "Creative Writing",
  PPG: "Philippine Politics and Governance",
  FABM1: "Fundamentals of ABM 1",
  FABM2: "Fundamentals of ABM 2",
  CSS1: "Computer Systems Servicing 1",
  CSS2: "Computer Systems Servicing 2",
};

function formatCleanSubjectName(rawName) {
  if (!rawName || typeof rawName !== "string") return rawName || "";
  const name = rawName.trim();
  const jhsCorePattern =
    /^(Science|Mathematics|Math|English|Filipino|Araling Panlipunan|Edukasyon sa Pagpapakakatao|EsP|Values Education|MAPEH|Technology and Livelihood Education|TLE)\s+\d+$/i;
  if (jhsCorePattern.test(name)) {
    return name.replace(/\s+\d+$/i, "").trim();
  }
  return name;
}

function getSubjectName(subjectId, subjectList = [], scheduleSubjects = []) {
  if (!subjectId) return "";
  const combinedList = [
    ...(Array.isArray(subjectList) ? subjectList : []),
    ...(Array.isArray(scheduleSubjects) ? scheduleSubjects : []),
  ];

  // 1. Direct ID or code match
  const direct = combinedList.find(
    (s) =>
      s &&
      (s.id === subjectId ||
        s.subjectId === subjectId ||
        s.code === subjectId ||
        s.subjectCode === subjectId)
  );
  if (direct) {
    return formatCleanSubjectName(
      direct.subjectName || direct.name || direct.subjectCode || direct.code || subjectId
    );
  }

  // 2. Parse embedded code from legacy IDs like "SUBJ-VE-19912" or "jhs-ve"
  const rawStr = String(subjectId).trim();
  const subjMatch =
    rawStr.match(/^SUBJ-([A-Z0-9-]+)-\d+$/i) ||
    rawStr.match(/^(?:jhs|shs)-([a-z0-9-]+)$/i);
  const extractedCode = subjMatch ? subjMatch[1].toUpperCase() : rawStr.toUpperCase();

  const byCode = combinedList.find(
    (s) =>
      s &&
      (String(s.subjectCode || "").toUpperCase() === extractedCode ||
        String(s.code || "").toUpperCase() === extractedCode)
  );
  if (byCode) {
    return formatCleanSubjectName(byCode.subjectName || byCode.name || extractedCode);
  }

  if (SUBJECT_CODE_FALLBACK_NAMES[extractedCode]) {
    return SUBJECT_CODE_FALLBACK_NAMES[extractedCode];
  }

  return formatCleanSubjectName(rawStr);
}

function normalizeSections(sectionsRaw) {
  if (!sectionsRaw || typeof sectionsRaw !== "object") {
    return [];
  }
  const jhsList = [7, 8, 9, 10].flatMap((grade) => {
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
  });

  const shsList = [11, 12].flatMap((grade) => {
    const gradeConfig = sectionsRaw?.shs?.[grade];
    const entries = Array.isArray(gradeConfig?.sections) ? gradeConfig.sections : [];
    return entries.map((section, index) => ({
      id: `shs-${grade}-${index}`,
      originalId: section?.id,
      level: "shs",
      grade: Number(grade),
      name: section?.name || `Grade ${grade} Section ${index + 1}`,
      classification: section?.cluster || section?.track || "Academic",
      track: section?.track || "",
    }));
  });

  return [...jhsList, ...shsList].sort((left, right) => {
    if (left.grade !== right.grade) return left.grade - right.grade;
    return String(left.name).localeCompare(String(right.name));
  });
}

function getAllGrades(sectionList) {
  return Array.from(new Set(sectionList.map((s) => s.grade))).sort((a, b) => a - b);
}

function getActiveSchedulesAndConfig() {
  try {
    let liveConfig = {};
    const cfgRaw = localStorage.getItem("turotugma_schedule_configurations");
    if (cfgRaw) {
      liveConfig = JSON.parse(cfgRaw) || {};
    }

    const activeSchedules = [];

    // 1. Check Published Schedules first
    const publishedRaw = localStorage.getItem("turotugma_published_schedules");
    if (publishedRaw) {
      const parsedPub = JSON.parse(publishedRaw);
      if (parsedPub && typeof parsedPub === "object") {
        Object.values(parsedPub).forEach((item) => {
          if (item && item.assignments && Object.keys(item.assignments).length > 0) {
            activeSchedules.push({
              schedule: item,
              source: "Published",
              updatedAt: new Date(item.publishedAt || item.updatedAt || 0).getTime(),
            });
          }
        });
      }
    }

    // 2. Also check Drafts if no published schedule exists for a level or if draft is newer
    const draftsRaw = localStorage.getItem("turotugma_schedule_drafts");
    if (draftsRaw && activeSchedules.length === 0) {
      const parsedDrafts = JSON.parse(draftsRaw);
      if (Array.isArray(parsedDrafts)) {
        parsedDrafts.forEach((d) => {
          const sched = d?.schedule || d;
          if (sched && sched.assignments && Object.keys(sched.assignments).length > 0) {
            activeSchedules.push({
              schedule: sched,
              source: "Active Draft",
              updatedAt: new Date(d.updatedAt || sched.updatedAt || 0).getTime(),
            });
          }
        });
      }
    }

    activeSchedules.sort((a, b) => b.updatedAt - a.updatedAt);

    // Keep latest schedule per scheduleType (jhs, shs)
    const byType = new Map();
    activeSchedules.forEach((entry) => {
      const sType = entry.schedule?.scheduleType || "jhs";
      if (!byType.has(sType)) {
        byType.set(sType, entry);
      }
    });

    const primaryEntry = activeSchedules[0] || null;
    const jhsConfig =
      primaryEntry?.schedule?.config?.jhs ||
      primaryEntry?.schedule?.scheduleConfig?.jhs ||
      liveConfig?.jhs ||
      {};

    // Calculate the exact maximum period count actually used in the active published schedule(s)
    let maxUsedPeriod = 0;
    Array.from(byType.values()).forEach(({ schedule: sched }) => {
      if (!sched) return;
      const slotList = Array.isArray(sched.slots) ? sched.slots : [];
      const sById = new Map(slotList.map((s) => [s.id, s]));
      const assign = sched.assignments || {};

      Object.keys(assign).forEach((cellKey) => {
        if (!assign[cellKey] || !assign[cellKey].teacherId) return;
        const parts = cellKey.split("|");
        if (parts.length >= 2) {
          const slotId = parts[1];
          const slot = sById.get(slotId);
          let p = slot?.period ? Number(slot.period) : null;
          if (!p) {
            const pMatch = slotId.match(/P(\d+)/i) || slotId.match(/(\d+)$/);
            if (pMatch) p = parseInt(pMatch[1], 10);
          }
          if (p && p > maxUsedPeriod) maxUsedPeriod = p;
        }
      });

      if (maxUsedPeriod === 0 && slotList.length > 0) {
        slotList.forEach((s) => {
          const p = Number(s?.period);
          if (p && p > maxUsedPeriod) maxUsedPeriod = p;
        });
      }
    });

    return {
      schedulesByType: Array.from(byType.values()),
      primarySchedule: primaryEntry?.schedule || null,
      scheduleSource: primaryEntry?.source || "Published",
      config: jhsConfig,
      maxUsedPeriod: maxUsedPeriod > 0 ? maxUsedPeriod : 8,
    };
  } catch {
    return { schedulesByType: [], primarySchedule: null, scheduleSource: "Published", config: {}, maxUsedPeriod: 8 };
  }
}

/**
 * Builds the accurate daily bell schedule (periods + breaks) from the published schedule's actual used periods
 */
function buildBellScheduleForDay(jhsConfig, dayName = "Monday", maxUsedPeriod = 8) {
  const dayAssignments = jhsConfig?.dayAssignments || {};
  const shortenedDays = Array.isArray(jhsConfig?.shortenedDays) ? jhsConfig.shortenedDays : ["Friday"];
  const isShortened =
    dayAssignments[dayName] === "shortened" ||
    (!dayAssignments[dayName] && shortenedDays.includes(dayName));

  const sessionCfg = isShortened
    ? jhsConfig?.sessions?.shortened || {}
    : jhsConfig?.sessions?.regular || {};

  const duration = Number(
    sessionCfg.duration ||
      (isShortened ? jhsConfig?.periodMinutes?.shortened : jhsConfig?.periodMinutes?.regular) ||
      (isShortened ? 45 : 60)
  );

  // Strictly bound the period count to the actual periods used in the published schedule (e.g. 8 periods)
  const count = Math.max(
    1,
    Math.min(
      12,
      Number(maxUsedPeriod) ||
        Number(
          sessionCfg.manualPeriodCount ||
            (isShortened ? (jhsConfig?.periods?.shortened || jhsConfig?.periods?.special) : jhsConfig?.periods?.regular) ||
            8
        )
    )
  );

  const breaks = sessionCfg.breaks || jhsConfig?.breaks || {
    morning: { enabled: true, duration: isShortened ? 15 : 20, afterPeriod: 2 },
    lunch: { enabled: true, duration: isShortened ? 50 : 60, afterPeriod: 4 },
    afternoon: { enabled: !isShortened, duration: 10, afterPeriod: 6 },
  };

  const startStr = jhsConfig?.schoolStartTime || "07:30";
  const [startH, startM] = startStr.split(":").map(Number);
  let cursorMins = (Number.isFinite(startH) ? startH : 7) * 60 + (Number.isFinite(startM) ? startM : 30);

  const minsTo24 = (m) => {
    const h = Math.floor(m / 60) % 24;
    const min = m % 60;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  };

  const minsTo12 = (m) => {
    const h24 = Math.floor(m / 60) % 24;
    const min = m % 60;
    const ampm = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 || 12;
    return `${String(h12).padStart(2, "0")}:${String(min).padStart(2, "0")} ${ampm}`;
  };

  const periods = [];
  const breakSlots = [];

  for (let p = 1; p <= count; p++) {
    const pStart = cursorMins;
    const pEnd = cursorMins + duration;
    periods.push({
      periodNum: p,
      label: `JHS-P${p}`,
      start: minsTo24(pStart),
      end: minsTo24(pEnd),
      start12: minsTo12(pStart),
      end12: minsTo12(pEnd),
      startMins: pStart,
      endMins: pEnd,
    });
    cursorMins = pEnd;

    [
      { key: "morning", title: "Morning Recess", ...(breaks.morning || {}) },
      { key: "lunch", title: "Lunch Break", ...(breaks.lunch || {}) },
      { key: "afternoon", title: "Afternoon Break", ...(breaks.afternoon || {}) },
    ].forEach((b) => {
      if (b.enabled && Number(b.afterPeriod) === p) {
        const bDur = Number(b.duration) || 15;
        const bStart = cursorMins;
        const bEnd = cursorMins + bDur;
        breakSlots.push({
          title: b.title,
          afterPeriod: p,
          start12: minsTo12(bStart),
          end12: minsTo12(bEnd),
          startMins: bStart,
          endMins: bEnd,
        });
        cursorMins = bEnd;
      }
    });
  }

  return { periods, breakSlots, isShortened, duration };
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
  const [selectedDay, setSelectedDay] = useState("live"); // "live" | "Monday" .. "Friday"
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(-1); // -1 means Current Period
  const [sortBy, setSortBy] = useState("section"); // "section" | "teacher" | "subject"
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"
  const [syncToken, setSyncToken] = useState(0);
  const [now, setNow] = useState(() => new Date());

  const handleHeaderSort = (field) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  useEffect(() => {
    const handleSync = () => setSyncToken((prev) => prev + 1);
    window.addEventListener("storage", handleSync);
    window.addEventListener("focus", handleSync);
    window.addEventListener("turotugma:schedule-updated", handleSync);
    window.addEventListener("turotugma:config-updated", handleSync);
    window.addEventListener("turotugma:faculty-updated", handleSync);
    window.addEventListener("turotugma_subjects_updated", handleSync);
    window.addEventListener("turotugma:sections-updated", handleSync);
    window.addEventListener("turotugma:xampp-remote-update", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("turotugma:schedule-updated", handleSync);
      window.removeEventListener("turotugma:config-updated", handleSync);
      window.removeEventListener("turotugma:faculty-updated", handleSync);
      window.removeEventListener("turotugma_subjects_updated", handleSync);
      window.removeEventListener("turotugma:sections-updated", handleSync);
      window.removeEventListener("turotugma:xampp-remote-update", handleSync);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { schedulesByType, scheduleSource, config, maxUsedPeriod } = useMemo(getActiveSchedulesAndConfig, [syncToken]);
  const facultyList = useMemo(getFacultyList, [syncToken]);

  const sectionsRaw = useMemo(() => {
    try {
      const raw = localStorage.getItem("turotugma_sections_created");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [syncToken]);

  const sectionList = useMemo(() => normalizeSections(sectionsRaw), [sectionsRaw]);

  const subjectList = useMemo(() => {
    try {
      const raw = localStorage.getItem("turotugma_subjects");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [syncToken]);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[now.getDay()];
  const liveSchoolDay = todayName === "Saturday" || todayName === "Sunday" ? "Monday" : todayName;
  const activeDay = selectedDay === "live" ? liveSchoolDay : selectedDay;

  const { periods, breakSlots, isShortened } = useMemo(
    () => buildBellScheduleForDay(config, activeDay, maxUsedPeriod),
    [config, activeDay, maxUsedPeriod]
  );

  // Determine current period or break slot index from clock time for default selector behavior
  const liveTimeStatus = useMemo(() => {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < periods.length; i++) {
      if (nowMinutes >= periods[i].startMins && nowMinutes < periods[i].endMins) {
        return {
          periodIdx: i,
        };
      }
    }

    for (let b = 0; b < breakSlots.length; b++) {
      if (nowMinutes >= breakSlots[b].startMins && nowMinutes < breakSlots[b].endMins) {
        const fallbackIdx = Math.min(periods.length - 1, Math.max(0, breakSlots[b].afterPeriod - 1));
        return {
          periodIdx: fallbackIdx,
        };
      }
    }

    return {
      periodIdx: 0,
    };
  }, [now, periods, breakSlots]);

  const effectivePeriodIdx =
    selectedPeriodIdx === -1 ? liveTimeStatus.periodIdx : Math.min(periods.length - 1, selectedPeriodIdx);
  const targetPeriod = effectivePeriodIdx + 1;
  const activePeriodObj = periods[effectivePeriodIdx] || null;

  // Build scheduled assignments and unassigned teacher list strictly from the selected day and period
  const { currentAssignments, availableTeachers, totalAvailableCount } = useMemo(() => {
    if (!schedulesByType || schedulesByType.length === 0 || targetPeriod < 1) {
      return { currentAssignments: [], availableTeachers: [], totalAvailableCount: 0 };
    }

    const matched = [];
    // Track seen teacherIds in this exact (activeDay, targetPeriod) so a teacher does not duplicate within displayed rows
    const seenTeachersInPeriod = new Set();
    // Track all teachers assigned during (activeDay, targetPeriod) across all sections/grades before UI filtering
    const assignedTeacherKeys = new Set();

    const recordAssignedTeacher = (rawTeacherId, fallbackName = "") => {
      const idStr = rawTeacherId ? String(rawTeacherId).trim() : "";
      const matchedTeacher = idStr
        ? facultyList.find((f) => f && (String(f.id || "") === idStr || String(f.employeeId || "") === idStr))
        : null;
      [
        idStr,
        matchedTeacher?.id,
        matchedTeacher?.employeeId,
        matchedTeacher?.name,
        matchedTeacher?.teacherName,
        fallbackName,
      ].forEach((val) => {
        const norm = String(val || "").trim().toLowerCase();
        if (norm) assignedTeacherKeys.add(norm);
      });
      return matchedTeacher;
    };

    schedulesByType.forEach(({ schedule: sched }) => {
      if (!sched || !sched.assignments) return;
      const assign = sched.assignments;
      const slotList = Array.isArray(sched.slots) ? sched.slots : [];
      const sById = new Map(slotList.map((s) => [s.id, s]));
      const schedSubjects = Array.isArray(sched.subjects) ? sched.subjects : [];
      const schedSections = Array.isArray(sched.sections) ? sched.sections : [];

      Object.entries(assign).forEach(([key, assignment]) => {
        const hasBreakouts = Array.isArray(assignment?.breakoutAssignments) && assignment.breakoutAssignments.length > 0;
        if (!assignment || (!assignment.teacherId && !hasBreakouts)) return;
        const parts = key.split("|");
        if (parts.length < 2) return;
        const sectionId = parts[0];
        const slotId = parts[1];

        const slot = sById.get(slotId);
        let day = slot?.day || "";
        let period = slot?.period ? Number(slot.period) : null;

        if (!day || !period) {
          const lowerSlot = slotId.toLowerCase();
          if (lowerSlot.includes("monday") || lowerSlot.startsWith("mon")) day = "Monday";
          else if (lowerSlot.includes("tuesday") || lowerSlot.startsWith("tue")) day = "Tuesday";
          else if (lowerSlot.includes("wednesday") || lowerSlot.startsWith("wed")) day = "Wednesday";
          else if (lowerSlot.includes("thursday") || lowerSlot.startsWith("thu")) day = "Thursday";
          else if (lowerSlot.includes("friday") || lowerSlot.startsWith("fri")) day = "Friday";

          const pMatch = slotId.match(/P(\d+)/i) || slotId.match(/(\d+)$/);
          if (pMatch) period = parseInt(pMatch[1], 10);
        }

        if (day !== activeDay || period !== targetPeriod) {
          return;
        }

        const section =
          sectionList.find((s) => s.id === sectionId || s.originalId === sectionId || s.name === sectionId) ||
          schedSections.find((s) => s.id === sectionId || s.name === sectionId);

        const rawSecName = section ? section.name || section.sectionName : sectionId;
        const secGrade = section ? Number(section.grade) : undefined;
        const cleanSecBase = secGrade
          ? String(rawSecName || "")
              .trim()
              .replace(new RegExp(`^grade\\s*${secGrade}\\s*[-–—:]?\\s*|^${secGrade}\\s*[-–—]\\s*`, "i"), "")
          : String(rawSecName || "").trim();
        const displaySecName =
          secGrade && cleanSecBase
            ? `Grade ${secGrade} - ${cleanSecBase}`
            : String(rawSecName || sectionId);

        const subject = getSubjectName(
          assignment.subjectId || assignment.subjectCode || assignment.subjectName || assignment.subject,
          subjectList,
          schedSubjects
        );

        // Always record primary and co-teachers as assigned for this period before display deduplication
        if (assignment.teacherId) {
          recordAssignedTeacher(assignment.teacherId);
        }
        if (Array.isArray(assignment.coTeacherIds)) {
          assignment.coTeacherIds.forEach((coId) => {
            if (coId) recordAssignedTeacher(coId);
          });
        }

        // If multi-teacher breakout (e.g. SPA Specialization), list each stream teacher cleanly
        if (hasBreakouts) {
          assignment.breakoutAssignments.forEach((b) => {
            if (!b?.teacherId) return;
            const tObj = recordAssignedTeacher(b.teacherId, b.teacherName || "");
            if (seenTeachersInPeriod.has(b.teacherId)) return;
            seenTeachersInPeriod.add(b.teacherId);

            matched.push({
              cellKey: `${key}-${b.teacherId}`,
              teacherName: tObj ? tObj.name || tObj.teacherName : b.teacherName || "Assigned Teacher",
              sectionName: displaySecName,
              sectionGrade: Number.isFinite(secGrade) ? secGrade : undefined,
              subject: `${subject} (${b.stream})`,
            });
          });
          return;
        }

        if (!assignment.teacherId || seenTeachersInPeriod.has(assignment.teacherId)) {
          return;
        }
        seenTeachersInPeriod.add(assignment.teacherId);

        const teacher = recordAssignedTeacher(assignment.teacherId);

        matched.push({
          cellKey: `${key}-${assignment.teacherId}`,
          teacherName: teacher ? teacher.name || teacher.teacherName : "Assigned Teacher",
          sectionName: displaySecName,
          sectionGrade: Number.isFinite(secGrade) ? secGrade : undefined,
          subject: subject || "Assigned Subject",
        });
      });
    });

    const dirFactor = sortDir === "desc" ? -1 : 1;
    matched.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "teacher") {
        cmp = String(a.teacherName).localeCompare(String(b.teacherName));
        if (cmp === 0) cmp = (Number(a.sectionGrade) || 999) - (Number(b.sectionGrade) || 999);
        if (cmp === 0) cmp = String(a.sectionName).localeCompare(String(b.sectionName));
      } else if (sortBy === "subject") {
        cmp = String(a.subject).localeCompare(String(b.subject));
        if (cmp === 0) cmp = (Number(a.sectionGrade) || 999) - (Number(b.sectionGrade) || 999);
        if (cmp === 0) cmp = String(a.sectionName).localeCompare(String(b.sectionName));
        if (cmp === 0) cmp = String(a.teacherName).localeCompare(String(b.teacherName));
      } else {
        cmp = (Number(a.sectionGrade) || 999) - (Number(b.sectionGrade) || 999);
        if (cmp === 0) cmp = String(a.sectionName).localeCompare(String(b.sectionName));
        if (cmp === 0) cmp = String(a.subject).localeCompare(String(b.subject));
        if (cmp === 0) cmp = String(a.teacherName).localeCompare(String(b.teacherName));
      }
      return cmp * dirFactor;
    });

    let rows = matched;
    if (gradeFilter !== "all") {
      rows = rows.filter((row) => String(row.sectionGrade) === String(gradeFilter));
    }
    const trimmedSearch = searchTerm.trim().toLowerCase();
    if (trimmedSearch) {
      rows = rows.filter(
        (row) =>
          (row.sectionName && row.sectionName.toLowerCase().includes(trimmedSearch)) ||
          (row.teacherName && row.teacherName.toLowerCase().includes(trimmedSearch)) ||
          (row.subject && row.subject.toLowerCase().includes(trimmedSearch))
      );
    }

    const publishedLevels = new Set(
      schedulesByType.map((entry) => String(entry?.schedule?.scheduleType || "jhs").toLowerCase())
    );
    const seenAvailableNames = new Set();
    const allUnassignedTeachers = [];

    facultyList.forEach((f) => {
      if (!f) return;
      const statusLower = String(f.status || "Active").trim().toLowerCase();
      if (statusLower === "inactive" || f.archived === true) return;

      if (publishedLevels.size > 0) {
        const rawGrades = f.gradeLevelAssignments ?? f.gradeLevels;
        const gradeText = Array.isArray(rawGrades) ? rawGrades.join(" ") : String(rawGrades || "");
        const gradeNums = (gradeText.match(/\b(7|8|9|10|11|12)\b/g) || []).map(Number);
        if (gradeNums.length > 0) {
          const hasJhs = gradeNums.some((g) => g >= 7 && g <= 10);
          const hasShs = gradeNums.some((g) => g >= 11 && g <= 12);
          const matchesLevel =
            (publishedLevels.has("jhs") && hasJhs) ||
            (publishedLevels.has("shs") && hasShs);
          if (!matchesLevel) return;
        }
      }

      const teacherName = String(f.name || f.teacherName || "").trim();
      if (!teacherName) return;

      const keysToCheck = [f.id, f.employeeId, f.name, f.teacherName]
        .map((v) => String(v || "").trim().toLowerCase())
        .filter(Boolean);
      if (keysToCheck.some((k) => assignedTeacherKeys.has(k))) return;

      const normName = teacherName.toLowerCase();
      if (seenAvailableNames.has(normName)) return;
      seenAvailableNames.add(normName);

      allUnassignedTeachers.push({
        key: f.id || f.employeeId || normName,
        teacherName,
      });
    });

    allUnassignedTeachers.sort((a, b) => a.teacherName.localeCompare(b.teacherName));

    const filteredAvailableTeachers = trimmedSearch
      ? allUnassignedTeachers.filter((t) => t.teacherName.toLowerCase().includes(trimmedSearch))
      : allUnassignedTeachers;

    return {
      currentAssignments: rows,
      availableTeachers: filteredAvailableTeachers,
      totalAvailableCount: allUnassignedTeachers.length,
    };
  }, [
    schedulesByType,
    facultyList,
    sectionList,
    subjectList,
    activeDay,
    targetPeriod,
    gradeFilter,
    searchTerm,
    sortBy,
    sortDir,
  ]);

  const ord = (n) => {
    if (n % 10 === 1 && n % 100 !== 11) return `${n}st`;
    if (n % 10 === 2 && n % 100 !== 12) return `${n}nd`;
    if (n % 10 === 3 && n % 100 !== 13) return `${n}rd`;
    return `${n}th`;
  };

  const sortLabel =
    sortBy === "teacher" ? "Assigned Teacher" : sortBy === "subject" ? "Subject" : "Section";

  const renderSortIndicator = (field) => {
    if (sortBy !== field) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  const getHeaderCellStyle = (field, width) => ({
    width,
    padding: "8px 12px",
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: sortBy === field ? "#1f2c6f" : "#475569",
    background: "#f4f6fc",
    borderBottom: "1px solid #dce3f2",
    textAlign: "left",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ padding: 0 }}>
      <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 28, fontWeight: 700 }}>
        Current Assignment View
      </h1>
      <p style={{ margin: "6px 0 18px", color: "#5b6787", fontSize: 13.5, maxWidth: 920 }}>
        Scheduled teaching assignments by day and period based on the latest published timetable.
      </p>

      <div style={{ padding: "4px 0" }}>
        {/* Filter & Sort Controls Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
            {/* Day Selector */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <label style={{ color: "#5b6787", fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>
                Day
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                style={{
                  width: 175,
                  fontSize: 13.5,
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1.2px solid #e5eaf4",
                  color: "#25326f",
                  background: "#f8faff",
                  fontWeight: 600,
                  outline: "none",
                }}
              >
                <option value="live">Today ({liveSchoolDay})</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
              </select>
            </div>

            {/* Period Selector */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <label style={{ color: "#5b6787", fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>
                Period
              </label>
              <select
                value={selectedPeriodIdx}
                onChange={(e) => setSelectedPeriodIdx(Number(e.target.value))}
                style={{
                  width: 245,
                  fontSize: 13.5,
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1.2px solid #e5eaf4",
                  color: "#25326f",
                  background: "#f8faff",
                  fontWeight: 600,
                  outline: "none",
                }}
              >
                <option value={-1}>
                  Current Period ({ord(liveTimeStatus.periodIdx + 1)} Period)
                </option>
                {periods.map((p, idx) => (
                  <option key={p.label} value={idx}>
                    {ord(idx + 1)} Period ({p.start12} - {p.end12})
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Filter */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <label style={{ color: "#5b6787", fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>
                Grade
              </label>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                style={{
                  width: 125,
                  fontSize: 13.5,
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1.2px solid #e5eaf4",
                  color: "#25326f",
                  background: "#f8faff",
                  fontWeight: 600,
                  outline: "none",
                }}
              >
                <option value="all">All Grades</option>
                {getAllGrades(sectionList).map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By Selector */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <label style={{ color: "#5b6787", fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setSortDir("asc");
                }}
                style={{
                  width: 165,
                  fontSize: 13.5,
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1.2px solid #e5eaf4",
                  color: "#25326f",
                  background: "#f8faff",
                  fontWeight: 600,
                  outline: "none",
                }}
              >
                <option value="section">Section</option>
                <option value="teacher">Assigned Teacher</option>
                <option value="subject">Subject</option>
              </select>
            </div>

            {/* Search Bar */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <label style={{ color: "#5b6787", fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search section, teacher, subject..."
                style={{
                  width: 230,
                  fontSize: 13.5,
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1.2px solid #e5eaf4",
                  color: "#25326f",
                  background: "#f8faff",
                  fontWeight: 500,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Reference Clock Display */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
            <span
              style={{
                color: "#25326f",
                fontSize: 13.5,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "monospace",
                background: "#f8faff",
                borderRadius: 8,
                padding: "7px 11px",
                border: "1px solid #e5eaf4",
                height: 36,
                boxSizing: "border-box",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="#3B4197" strokeWidth="2" fill="none" />
                <rect x="9.2" y="4" width="1.6" height="7" rx="0.8" fill="#3B4197" />
                <rect x="10.8" y="10.2" width="1.6" height="5" rx="0.8" transform="rotate(90 10.8 10.2)" fill="#3B4197" />
              </svg>
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Period & Sort Summary Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            padding: "8px 14px",
            marginBottom: 12,
            borderRadius: 8,
            background: "#eef2ff",
            border: "1px solid #c7d2fe",
            color: "#1e3a8a",
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          <span>
            <strong>{activeDay}</strong> • <strong>{ord(targetPeriod)} Period</strong>{" "}
            {activePeriodObj ? `(${activePeriodObj.start12} - ${activePeriodObj.end12})` : ""}
            {isShortened ? " • Shortened Session" : " • Regular Session"} •{" "}
            {scheduleSource === "Published" ? "Published Timetable" : scheduleSource}
          </span>
          <span style={{ color: "#3B4197", fontWeight: 700 }}>
            {currentAssignments.length} Scheduled Assignment{currentAssignments.length === 1 ? "" : "s"} •{" "}
            {totalAvailableCount} Available Teacher{totalAvailableCount === 1 ? "" : "s"} • Sorted by{" "}
            {sortLabel}
          </span>
        </div>

        {/* High-Density Scheduled Assignments Table */}
        <div
          style={{
            border: "1px solid #dce3f2",
            background: "#ffffff",
            borderRadius: 10,
            overflowX: "auto",
          }}
        >
          {currentAssignments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 20,
                color: "#64748b",
                background: "#f8fafc",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              No matching scheduled assignments found for {activeDay} • {ord(targetPeriod)} Period.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th onClick={() => handleHeaderSort("section")} style={getHeaderCellStyle("section", "28%")}>
                    Section{renderSortIndicator("section")}
                  </th>
                  <th onClick={() => handleHeaderSort("teacher")} style={getHeaderCellStyle("teacher", "34%")}>
                    Assigned Teacher{renderSortIndicator("teacher")}
                  </th>
                  <th onClick={() => handleHeaderSort("subject")} style={getHeaderCellStyle("subject", "38%")}>
                    Subject{renderSortIndicator("subject")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentAssignments.map((row, idx) => (
                  <tr
                    key={`${row.cellKey}-${idx}`}
                    style={{
                      background: idx % 2 === 1 ? "#fafbfe" : "#ffffff",
                    }}
                  >
                    <td
                      style={{
                        padding: "6px 12px",
                        fontSize: 13,
                        lineHeight: 1.3,
                        fontWeight: 700,
                        color: "#1f2c6f",
                        borderBottom: "1px solid #eef2f8",
                      }}
                    >
                      {row.sectionName}
                    </td>
                    <td
                      style={{
                        padding: "6px 12px",
                        fontSize: 13,
                        lineHeight: 1.3,
                        fontWeight: 600,
                        color: "#1e293b",
                        borderBottom: "1px solid #eef2f8",
                      }}
                    >
                      {row.teacherName}
                    </td>
                    <td
                      style={{
                        padding: "6px 12px",
                        fontSize: 13,
                        lineHeight: 1.3,
                        fontWeight: 500,
                        color: "#334155",
                        borderBottom: "1px solid #eef2f8",
                      }}
                    >
                      {row.subject}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Available Teachers (No Assignment This Period) */}
        <div
          style={{
            marginTop: 18,
            border: "1px solid #dce3f2",
            borderRadius: 10,
            background: "#ffffff",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              padding: "9px 14px",
              background: "#f4f6fc",
              borderBottom: "1px solid #dce3f2",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#1f2c6f" }}>
              Available Teachers (No Assignment This Period)
            </h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
              {availableTeachers.length}
              {searchTerm.trim() ? ` of ${totalAvailableCount}` : ""} Teacher
              {availableTeachers.length === 1 ? "" : "s"} • Schedule-based
            </span>
          </div>

          {!schedulesByType || schedulesByType.length === 0 ? (
            <div style={{ padding: "14px 16px", fontSize: 13, color: "#64748b", fontWeight: 500 }}>
              No published timetable available to determine unassigned teachers.
            </div>
          ) : availableTeachers.length === 0 ? (
            <div style={{ padding: "14px 16px", fontSize: 13, color: "#64748b", fontWeight: 500 }}>
              {searchTerm.trim()
                ? `No unassigned teachers match "${searchTerm.trim()}".`
                : "All teachers are scheduled for this period."}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              }}
            >
              {availableTeachers.map((teacher) => (
                <div
                  key={teacher.key}
                  style={{
                    padding: "6px 12px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#1e293b",
                    borderBottom: "1px solid #eef2f8",
                    borderRight: "1px solid #f1f5f9",
                  }}
                >
                  {teacher.teacherName}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
