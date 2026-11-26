// --- BEGIN: Helper functions for consistent teacher load calculation ---
function getActiveScheduleAssignments() {
  if (typeof window === "undefined") {
    return [];
  }

  const allAssignments = [];

  const processSchedule = (sched) => {
    if (!sched || !sched.assignments || typeof sched.assignments !== "object") return;
    Object.entries(sched.assignments).forEach(([cellKey, asgn]) => {
      if (!asgn || !asgn.teacherId) return;
      const parts = String(cellKey || "").split("|");
      allAssignments.push({
        ...asgn,
        cellKey,
        sectionId: asgn.sectionId || parts[0] || "",
        slotId: asgn.slotId || parts[1] || "",
        scheduleType: sched.scheduleType || "",
      });
    });
  };

  const latestByLevel = {};

  try {
    // 1. Check Published Schedules
    const publishedRaw = localStorage.getItem("turotugma_published_schedules");
    if (publishedRaw) {
      const publishedMap = JSON.parse(publishedRaw);
      if (publishedMap && typeof publishedMap === "object") {
        Object.entries(publishedMap).forEach(([key, sched]) => {
          if (!sched) return;
          const level = sched.scheduleType || key || "default";
          const updated = new Date(sched.updatedAt || sched.publishedAt || 0).getTime();
          if (!latestByLevel[level] || updated > latestByLevel[level].updated) {
            latestByLevel[level] = { sched, updated };
          }
        });
      }
    }
  } catch (e) {
    console.error("Error reading published schedules:", e);
  }

  try {
    // 2. Check Draft Schedules (if a draft is newer than published for that level, use the latest working draft)
    const draftRaw = localStorage.getItem("turotugma_schedule_drafts");
    if (draftRaw) {
      const draftArr = JSON.parse(draftRaw);
      if (Array.isArray(draftArr) && draftArr.length > 0) {
        draftArr.forEach((draftItem) => {
          const sched = draftItem?.schedule || draftItem;
          if (!sched) return;
          const level = sched?.scheduleType || draftItem?.scheduleType || "default";
          const updated = new Date(draftItem?.updatedAt || sched?.updatedAt || 0).getTime();
          if (!latestByLevel[level] || updated > latestByLevel[level].updated) {
            latestByLevel[level] = { sched, updated };
          }
        });
      }
    }
  } catch (e) {
    console.error("Error reading schedule drafts:", e);
  }

  Object.values(latestByLevel).forEach(({ sched }) => {
    processSchedule(sched);
  });

  return allAssignments;
}

function getScheduleConfigPeriodMinutes() {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem("turotugma_schedule_configurations") : null;
    if (raw) {
      const cfg = JSON.parse(raw);
      const regMin = Number(cfg?.jhs?.sessions?.regular?.duration || cfg?.jhs?.periodMinutes?.regular);
      if (regMin > 0) return regMin;
    }
  } catch (e) {}
  return 60; // Diadi NHS standard is 60 mins per period
}

// Calculate teacher loads aligned with DepEd DO 005, s. 2024 & RA 4670 (Magna Carta)
// Statuses:
// - "Unassigned": 0 contact hours assigned
// - "Underload": below optimal balanced load (< 20 hrs/wk for regular, < 16 hrs/wk for class adviser)
// - "Balanced": optimal healthy teaching load (20 - 30 hrs/wk for regular, 16 - 25 hrs/wk for adviser)
// - "Overload": exceeds statutory ceiling (> 30 hrs/wk for regular, > 25 hrs/wk for adviser)
function calculateTeacherLoads(facultyList) {
  if (!Array.isArray(facultyList)) {
    return [];
  }

  const assignments = getActiveScheduleAssignments();
  const periodMinutes = getScheduleConfigPeriodMinutes();
  const subjectsList = safeParseStorage("turotugma_subjects", []);
  const subjectsMap = new Map(
    (Array.isArray(subjectsList) ? subjectsList : []).map((s) => [s?.id, s])
  );
  const facultyById = new Map(facultyList.map((f) => [f.id, f]));

  const teacherPeriodCounts = {};
  const adviserHGPCount = {};

  assignments.forEach((asgn) => {
    const sub = asgn.subjectId ? subjectsMap.get(asgn.subjectId) : null;
    const subCode = String(sub?.subjectCode || sub?.code || "").toUpperCase();
    const subName = String(sub?.subjectName || sub?.name || asgn.subjectId || "").toLowerCase();
    const isHGP =
      subCode === "HGP" ||
      subCode === "HRG" ||
      subCode === "ADV" ||
      subName.includes("homeroom") ||
      subName.includes("guidance program") ||
      subName.includes("advisory");

    const cellTeacherIds = new Set();
    if (asgn.teacherId) cellTeacherIds.add(asgn.teacherId);
    if (Array.isArray(asgn.coTeacherIds)) {
      asgn.coTeacherIds.forEach((id) => {
        if (id) cellTeacherIds.add(id);
      });
    }
    if (Array.isArray(asgn.breakoutAssignments)) {
      asgn.breakoutAssignments.forEach((b) => {
        if (b?.teacherId) cellTeacherIds.add(b.teacherId);
      });
    }
    cellTeacherIds.forEach((tid) => {
      if (isHGP && !adviserHGPCount[tid]) {
        adviserHGPCount[tid] = 1;
        return;
      }
      teacherPeriodCounts[tid] = (teacherPeriodCounts[tid] || 0) + 1;
    });
  });

  return facultyList.map((faculty) => {
    const periodCount = teacherPeriodCounts[faculty.id] || 0;
    const totalMinutes = periodCount * periodMinutes;
    const classroomContactHours = Math.round((totalMinutes / 60) * 10) / 10;

    const isClassAdviser = Boolean(
      adviserHGPCount[faculty.id] ||
      faculty.isClassAdviser ||
      (Array.isArray(faculty.ancillaryAssignments) && faculty.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
    );
    const advisoryCreditAdded = isClassAdviser && (periodCount > 0 || adviserHGPCount[faculty.id]) ? 5 : 0;
    const totalHours = Math.round((classroomContactHours + advisoryCreditAdded) * 10) / 10;
    const dailyHours = Math.round((totalHours / 5) * 10) / 10;

    const empStatus = String(faculty.employmentStatus || "").toLowerCase();
    const isPartTime = empStatus.includes("part-time") || empStatus.includes("parttime");

    // Magna Carta & DepEd DO 005, s. 2024:
    // Statutory maximum classroom teaching is 30 contact hours/week (6 hrs/day).
    // Balanced teaching load: 15–30 contact hrs/wk for Full-Time, 10–20h for Part-Time.
    const ancillaryCreditHours = isClassAdviser ? 5 : (Number(faculty.ancillaryCreditHours) || 0);
    const maxTeachingContactHours = isPartTime ? 20 : 30;
    const minBalancedHours = isPartTime ? 10 : 15;

    const percent = Math.round((totalHours / maxTeachingContactHours) * 100);

    let status = "Unassigned";
    if (totalHours === 0 && periodCount === 0) {
      status = "Unassigned";
    } else if (totalHours < minBalancedHours) {
      status = "Underload";
    } else if (totalHours <= maxTeachingContactHours) {
      status = "Balanced";
    } else {
      status = "Overload";
    }

    const statutoryTier = totalHours === 0 ? "Unassigned" : (totalHours >= (isClassAdviser ? 25 : 30) ? "Full load" : "Part load");

    return {
      ...faculty,
      isClassAdviser,
      ancillaryCreditHours,
      maxTeachingContactHours,
      minBalancedHours,
      assignedPeriods: periodCount,
      assignedLoadMinutes: totalMinutes,
      assignedLoadHours: totalHours,
      dailyContactHours: dailyHours,
      assignedLoadPercent: percent,
      assignedLoadStatus: status,
      statutoryTier,
    };
  });
}
// --- END: Helper functions for consistent teacher load calculation ---

import ScheduleGenerator from "./components/ScheduleGenerator";
import { useMemo } from "react";

// Helper: Get most recent schedule (draft or published) for a given level
function getMostRecentScheduleForLevel(level) {
  const drafts = safeParseStorage("turotugma_schedule_drafts", []);
  const published = safeParseStorage("turotugma_published_schedules", {});
  let mostRecent = null;
  let mostRecentTime = 0;
  // Check published
  Object.values(published).forEach((sched) => {
    if (sched && sched.scheduleType === level && sched.updatedAt) {
      const t = new Date(sched.updatedAt).getTime();
      if (t > mostRecentTime) {
        mostRecent = sched;
        mostRecentTime = t;
      }
    }
  });
  // Check drafts
  if (Array.isArray(drafts)) {
    drafts.forEach((draft) => {
      const sched = draft.schedule || draft;
      if (sched && sched.scheduleType === level && draft.updatedAt) {
        const t = new Date(draft.updatedAt).getTime();
        if (t > mostRecentTime) {
          mostRecent = sched;
          mostRecentTime = t;
        }
      }
    });
  }
  return mostRecent;
}

// Helper: Count valid assignments (has subjectId and teacherId, no conflicts)
function countValidAssignments(schedule) {
  if (!schedule || !schedule.assignments) return { valid: 0, total: 0 };
  let valid = 0;
  let total = 0;
  Object.values(schedule.assignments).forEach((a) => {
    total++;
    if (a && a.subjectId && a.teacherId) valid++;
  });
  return { valid, total };
}

// Helper: Calculate percent
function percent(valid, total) {
  return total > 0 ? Math.round((valid / total) * 100) : 0;
}

// Activity log key for localStorage
const ACTIVITY_LOG_STORAGE_KEY = "turotugma_activity_log";

// Log an activity event
export function logActivity(action, details = {}) {
  if (typeof window === "undefined") return;
  const log = safeParseStorage(ACTIVITY_LOG_STORAGE_KEY, []);
  const entry = {
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  log.unshift(entry); // Add to start (most recent first)
  // Limit log to last 100 entries
  if (log.length > 100) log.length = 100;
  window.localStorage.setItem(ACTIVITY_LOG_STORAGE_KEY, JSON.stringify(log));
}

// Get recent activity log (optionally limit count)
export function getRecentActivityLog(limit = 20) {
  const log = safeParseStorage(ACTIVITY_LOG_STORAGE_KEY, []);
  return log.slice(0, limit);
}

// Format activity entry for display
export function formatActivityEntry(entry) {
  if (!entry) return "";
  const date = new Date(entry.timestamp);
  let desc = "";
  switch (entry.action) {
    case "add_subject":
      desc = `Added subject: ${entry.details.name || "(unknown)"}`;
      break;
    case "import_subjects":
      desc = `Imported ${entry.details.count || 0} subject(s)`;
      break;
    case "add_section":
      desc = `Added section: ${entry.details.name || "(unknown)"}`;
      break;
    case "import_sections":
      desc = `Imported ${entry.details.count || 0} section(s)`;
      break;
    case "add_teacher":
      desc = `Added teacher: ${entry.details.name || "(unknown)"}`;
      break;
    case "import_teachers":
      desc = `Imported ${entry.details.count || 0} teacher(s)`;
      break;
    case "generate_schedule":
      desc = `Generated schedule: ${entry.details.name || "(unnamed)"}`;
      break;
    case "draft_schedule":
      desc = `Drafted schedule: ${entry.details.name || "(unnamed)"}`;
      break;
    case "publish_schedule":
      desc = `Published schedule: ${entry.details.name || "(unnamed)"}`;
      break;
    case "export_schedule":
      desc = `Exported schedule: ${entry.details.name || "(unnamed)"}`;
      break;
    default:
      desc = entry.action;
  }
  return `${date.toLocaleString()} — ${desc}`;
}
const FACULTY_STORAGE_KEY = "turotugma_faculty";
const SUBJECTS_STORAGE_KEY = "turotugma_subjects";
const SECTIONS_STORAGE_KEY = "turotugma_sections_created";

function safeParseStorage(key, fallback) {
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

function getTotalSectionsFromSavedConfig(savedSections) {
  if (!savedSections || typeof savedSections !== "object") {
    return 0;
  }

  const levelBlocks = [savedSections.jhs, savedSections.shs].filter(Boolean);

  return levelBlocks.reduce((total, levelConfig) => {
    if (!levelConfig || typeof levelConfig !== "object") {
      return total;
    }

    return total + Object.values(levelConfig).reduce((levelTotal, gradeConfig) => {
      if (Array.isArray(gradeConfig?.sections)) {
        return levelTotal + gradeConfig.sections.length;
      }

      return levelTotal;
    }, 0);
  }, 0);
}

function getSectionGradeBreakdown(savedSections) {
  const grades = [7, 8, 9, 10, 11, 12];
  const breakdown = grades.reduce((accumulator, grade) => {
    accumulator[`g${grade}`] = 0;
    return accumulator;
  }, {});

  if (!savedSections || typeof savedSections !== "object") {
    return { ...breakdown, total: 0 };
  }

  const countForGrade = (level, grade) => {
    const gradeConfig = savedSections?.[level]?.[grade];
    return Array.isArray(gradeConfig?.sections) ? gradeConfig.sections.length : 0;
  };

  grades.forEach((grade) => {
    const level = grade <= 10 ? "jhs" : "shs";
    breakdown[`g${grade}`] = countForGrade(level, grade);
  });

  const total = grades.reduce((sum, grade) => sum + breakdown[`g${grade}`], 0);
  return { ...breakdown, total };
}

function parseGradeLevelValue(value) {
  const text = String(value || "");
  const matched = text.match(/\d{1,2}/);
  if (!matched) {
    return null;
  }

  const parsed = Number.parseInt(matched[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getTeacherAssignmentBreakdown(teachers, debugLabel = '') {
  const counts = teachers.reduce(
    (counts, teacher) => {
      const gradeAssignments = Array.isArray(teacher?.gradeLevelAssignments)
        ? teacher.gradeLevelAssignments
        : [];
      const gradeNumbers = gradeAssignments.map(parseGradeLevelValue).filter((grade) => grade !== null);
      const hasJhs = gradeNumbers.some((grade) => grade >= 7 && grade <= 10);
      const hasShs = gradeNumbers.some((grade) => grade >= 11 && grade <= 12);
      if (hasJhs && hasShs) {
        counts.both += 1;
      } else if (hasJhs && !hasShs) {
        counts.jhs += 1;
      } else if (!hasJhs && hasShs) {
        counts.shs += 1;
      }
      // Teachers with no assignments are not counted in any group
      return counts;
    },
    { jhs: 0, shs: 0, both: 0 }
  );
  return counts;
}

function getEmploymentStatusBreakdown(teachers) {
  const MINUTES_PER_PERIOD = 60;
  const teacherLoads = calculateTeacherLoads(teachers);
  const result = {
    regular: { count: 0, totalPeriods: 0, overload: 0, balanced: 0, underload: 0, unassigned: 0 },
    probationary: { count: 0, totalPeriods: 0, overload: 0, balanced: 0, underload: 0, unassigned: 0 },
    partTime: { count: 0, totalPeriods: 0, overload: 0, balanced: 0, underload: 0, unassigned: 0 },
  };

  teacherLoads.forEach((teacher) => {
    const rawStatus = String(teacher.employmentStatus || "").toLowerCase();

    let category = "regular";
    if (rawStatus.includes("probationary")) {
      category = "probationary";
    } else if (rawStatus.includes("part-time") || rawStatus.includes("parttime")) {
      category = "partTime";
    }

    const periods = Math.round((teacher.assignedLoadMinutes || 0) / MINUTES_PER_PERIOD);
    const loadStatus = teacher.assignedLoadStatus || "Unassigned";

    result[category].count += 1;
    result[category].totalPeriods += periods;

    if (loadStatus === "Overload") {
      result[category].overload += 1;
    } else if (loadStatus === "Balanced" || loadStatus === "Full load") {
      result[category].balanced += 1;
    } else if (loadStatus === "Underload" || loadStatus === "Part load") {
      result[category].underload += 1;
    } else {
      result[category].unassigned += 1;
    }
  });

  return result;
}

function getDepartmentWorkloadBreakdown(teachers) {
  const MINUTES_PER_PERIOD = 60;
  const teacherLoads = calculateTeacherLoads(teachers);

  const DEPT_BUCKETS = [
    { key: "math", label: "Mathematics", match: (s) => s.includes("math") || s.includes("algebra") || s.includes("calculus") || s.includes("stat") },
    { key: "science", label: "Science & STEM", match: (s) => s.includes("sci") || s.includes("bio") || s.includes("chem") || s.includes("phys") || s.includes("stem") },
    { key: "english", label: "English & SPJ", match: (s) => s.includes("eng") || s.includes("journal") || s.includes("spj") || s.includes("read") || s.includes("lit") || s.includes("comm") },
    { key: "filipino", label: "Filipino", match: (s) => s.includes("fil") || s.includes("komunikasyon") },
    { key: "mapeh", label: "MAPEH & SPA", match: (s) => s.includes("mapeh") || s.includes("music") || s.includes("art") || s.includes("dance") || s.includes("pe") || s.includes("spa") || s.includes("health") },
    { key: "tle_ict", label: "TLE & ICT", match: (s) => s.includes("tle") || s.includes("ict") || s.includes("tech") || s.includes("tvl") || s.includes("livelihood") || s.includes("abm") || s.includes("entrep") || s.includes("agri") || s.includes("home ec") },
    { key: "ap", label: "Araling Panlipunan", match: (s) => s.includes("araling") || /\bap\b/.test(s) || s.includes("social") || s.includes("hist") || s.includes("ucsp") },
    { key: "esp", label: "Values Ed (EsP)", match: (s) => s.includes("values") || s.includes("esp") || s.includes("gmrc") || s.includes("hgp") || s.includes("perdev") || s.includes("guidance") },
  ];

  const buckets = {};
  DEPT_BUCKETS.forEach((b) => {
    buckets[b.key] = {
      key: b.key,
      label: b.label,
      count: 0,
      totalPeriods: 0,
      balanced: 0,
      underload: 0,
      overload: 0,
      unassigned: 0,
    };
  });
  buckets.general = {
    key: "general",
    label: "General / Other",
    count: 0,
    totalPeriods: 0,
    balanced: 0,
    underload: 0,
    overload: 0,
    unassigned: 0,
  };

  teacherLoads.forEach((teacher) => {
    const rawDept = [
      teacher.department,
      teacher.major,
      teacher.specialization,
      ...(Array.isArray(teacher.subjects) ? teacher.subjects : []),
      ...(Array.isArray(teacher.subjectExpertise) ? teacher.subjectExpertise : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchedBucket = DEPT_BUCKETS.find((b) => b.match(rawDept));
    const targetKey = matchedBucket ? matchedBucket.key : "general";
    const entry = buckets[targetKey];

    const periods = Math.round((teacher.assignedLoadMinutes || 0) / MINUTES_PER_PERIOD);
    const loadStatus = teacher.assignedLoadStatus || "Unassigned";

    entry.count += 1;
    entry.totalPeriods += periods;

    if (loadStatus === "Overload") {
      entry.overload += 1;
    } else if (loadStatus === "Balanced" || loadStatus === "Full load") {
      entry.balanced += 1;
    } else if (loadStatus === "Underload" || loadStatus === "Part load") {
      entry.underload += 1;
    } else {
      entry.unassigned += 1;
    }
  });

  const ordered = [
    ...DEPT_BUCKETS.map((b) => buckets[b.key]),
    ...(buckets.general.count > 0 ? [buckets.general] : []),
  ];

  return ordered;
}

function getSubjectBreakdown(subjectsList) {
  const trackKeys = ["STEM", "HUMSS", "ABM", "TVL", "GAS"];
  const initialTracks = trackKeys.reduce((accumulator, key) => {
    accumulator[key] = 0;
    return accumulator;
  }, {});

  const breakdown = {
    jhsCore: 0,
    jhsSpecialized: 0,
    shsCore: 0,
    shsTracks: initialTracks,
  };

  subjectsList.forEach((subject) => {
    const schoolLevel = String(subject?.schoolLevel || "").toLowerCase();
    const subjectType = String(subject?.subjectType || "").trim().toLowerCase();
    const strand = String(subject?.strand || "").trim().toUpperCase();

    if (schoolLevel === "jhs") {
      if (subjectType === "core") {
        breakdown.jhsCore += 1;
      } else {
        breakdown.jhsSpecialized += 1;
      }
      return;
    }

    if (schoolLevel === "shs") {
      if (subjectType === "core") {
        breakdown.shsCore += 1;
        return;
      }

      if (trackKeys.includes(strand)) {
        breakdown.shsTracks[strand] += 1;
      }
    }
  });

  return breakdown;
}

export function getSystemSnapshot() {
  // Load all data
  const faculty = safeParseStorage(FACULTY_STORAGE_KEY, []);
  const subjects = safeParseStorage(SUBJECTS_STORAGE_KEY, []);
  const sections = safeParseStorage(SECTIONS_STORAGE_KEY, null);
  const drafts = safeParseStorage("turotugma_schedule_drafts", []);
  const published = safeParseStorage("turotugma_published_schedules", {});

  // Find the most recently updated schedule (published or draft)
  let latestSchedule = null;
  let latestConfig = null;
  let latestUpdated = 0;

  // Check published schedules
  Object.values(published).forEach((sched) => {
    if (sched && sched.updatedAt && new Date(sched.updatedAt).getTime() > latestUpdated) {
      latestSchedule = sched;
      latestConfig = sched.config;
      latestUpdated = new Date(sched.updatedAt).getTime();
    }
  });
  // Check drafts
  if (Array.isArray(drafts)) {
    drafts.forEach((draft) => {
      if (draft && draft.updatedAt && new Date(draft.updatedAt).getTime() > latestUpdated) {
        latestSchedule = draft.schedule || draft;
        latestConfig = draft.config;
        latestUpdated = new Date(draft.updatedAt).getTime();
      }
    });
  }

  let facultyList = Array.isArray(faculty) ? faculty : [];
  let subjectsList = Array.isArray(subjects) ? subjects : [];
  let activeTeachers = facultyList.filter((teacher) => teacher?.active !== false);
  let sectionGradeBreakdown = getSectionGradeBreakdown(sections);
  let subjectBreakdown = getSubjectBreakdown(subjectsList);
  // Total Sections is always based on created sections in storage
  let totalSections = getTotalSectionsFromSavedConfig(sections);
  let totalSubjects = subjectsList.length;
  let jhsSubjects = subjectsList.filter((subject) => subject?.schoolLevel === "jhs").length;
  let shsSubjects = subjectsList.filter((subject) => subject?.schoolLevel === "shs").length;
  // Always compute both breakdowns
  let profiledAssignmentBreakdown = getTeacherAssignmentBreakdown(facultyList, 'FULL LIST');
  let assignmentBreakdown = profiledAssignmentBreakdown;

  let allActiveFaculty = facultyList.filter((teacher) => teacher?.active !== false);
  let assignedTeachers = allActiveFaculty;

  // --- Use the same load calculation as FacultyManagement.js for dashboard chart ---
  let loadDistribution = { unassigned: 0, underload: 0, balanced: 0, overload: 0 };
  const teacherLoads = calculateTeacherLoads(allActiveFaculty);
  teacherLoads.forEach((teacher) => {
    const status = teacher.assignedLoadStatus || "Unassigned";
    if (status === "Unassigned") {
      loadDistribution.unassigned += 1;
    } else if (status === "Underload") {
      loadDistribution.underload += 1;
    } else if (status === "Balanced") {
      loadDistribution.balanced += 1;
    } else if (status === "Overload") {
      loadDistribution.overload += 1;
    }
  });
  if (latestSchedule) {
    if (latestSchedule.assignments && typeof latestSchedule.assignments === "object") {
      const teacherIds = new Set();
      Object.values(latestSchedule.assignments).forEach((a) => {
        if (!a) return;
        if (a.teacherId) teacherIds.add(a.teacherId);
        if (Array.isArray(a.coTeacherIds)) a.coTeacherIds.forEach((id) => id && teacherIds.add(id));
        if (Array.isArray(a.breakoutAssignments)) a.breakoutAssignments.forEach((b) => b?.teacherId && teacherIds.add(b.teacherId));
      });
      assignedTeachers = allActiveFaculty.filter((t) => teacherIds.has(t.id));
      assignmentBreakdown = getTeacherAssignmentBreakdown(assignedTeachers, 'ACTIVE ONLY');
    }
  }

  // Always pass allActiveFaculty so Unassigned teachers are accurately counted in breakdowns
  let employmentStatusBreakdown = getEmploymentStatusBreakdown(allActiveFaculty);
  let departmentBreakdown = getDepartmentWorkloadBreakdown(allActiveFaculty);

  return {
    // Always show total profiled/created values, not filtered by schedule
    profiledTeachers: facultyList.length,
    profiledSections: getTotalSectionsFromSavedConfig(sections),
    profiledSubjects: subjectsList.length,
    activeTeachers: allActiveFaculty.length,
    assignedTeachersCount: assignedTeachers.length,
    totalTeachers: facultyList.length,
    totalSections,
    sectionGradeBreakdown,
    totalSubjects,
    subjectBreakdown,
    jhsSubjects,
    shsSubjects,
    unresolvedConflicts: loadDistribution.overload,
    loadDistribution,
    employmentStatusBreakdown,
    departmentBreakdown,
    assignmentBreakdown, // active (filtered) breakdown
    profiledAssignmentBreakdown, // always full list breakdown
  };
}

export function getDashboardAnalyticsPayload() {
  const snapshot = getSystemSnapshot();
  const hasAnyData = snapshot.totalTeachers > 0 || snapshot.totalSections > 0 || snapshot.totalSubjects > 0;
  const schoolProfile = safeParseStorage("turotugma_school_profile", {});
  const offeredLevels = schoolProfile?.offeredLevels || "both";

  // Get most recent schedules for each level
  const jhsSched = getMostRecentScheduleForLevel("jhs");
  const shsFirstSched =
    getMostRecentScheduleForLevel("shs-first") ||
    getMostRecentScheduleForLevel("shs_first") ||
    getMostRecentScheduleForLevel("shs-term1") ||
    getMostRecentScheduleForLevel("shs");

  // Compute completion by grade/level accurately
  const countValidByGrade = (sched, gradeNum) => {
    if (!sched || !sched.assignments) return { valid: 0, total: 0 };
    const secCount = snapshot.sectionGradeBreakdown?.[`g${gradeNum}`] || 0;
    if (secCount === 0) return { valid: 0, total: 0 };
    let valid = 0;
    Object.entries(sched.assignments).forEach(([cellKey, a]) => {
      if (!a || !a.subjectId || !a.teacherId) return;
      const [secId] = String(cellKey || "").split("|");
      if (secId.includes(`-${gradeNum}-`) || secId.startsWith(`${gradeNum}-`)) {
        valid += 1;
      }
    });
    // Expected weekly periods per section (~35-38 for JHS, ~32-36 for SHS, or derived from total assigned in grade)
    const expectedPerSec = gradeNum <= 10 ? 37 : 32;
    const rawTotal = secCount * expectedPerSec;
    const pct = valid > 0 ? Math.min(100, Math.round((valid / Math.max(valid, rawTotal)) * 100)) : 0;
    return { valid, total: rawTotal, pct };
  };

  const jhsValid = countValidAssignments(jhsSched);
  const shsFirstValid = countValidAssignments(shsFirstSched);

  const jhsCompletion = percent(jhsValid.valid, jhsValid.total);
  const shsFirstCompletion = percent(shsFirstValid.valid, shsFirstValid.total);

  let completionLabels = ["JHS", "SHS", "Overall"];
  let completionPercentages = [jhsCompletion, shsFirstCompletion, Math.round((jhsCompletion + shsFirstCompletion) / 2)];

  if (offeredLevels === "jhs_only") {
    const g7 = jhsSched ? (countValidByGrade(jhsSched, 7).valid > 0 ? jhsCompletion : 0) : 0;
    const g8 = jhsSched ? (countValidByGrade(jhsSched, 8).valid > 0 ? jhsCompletion : 0) : 0;
    const g9 = jhsSched ? (countValidByGrade(jhsSched, 9).valid > 0 ? jhsCompletion : 0) : 0;
    const g10 = jhsSched ? (countValidByGrade(jhsSched, 10).valid > 0 ? jhsCompletion : 0) : 0;
    completionLabels = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Overall JHS"];
    completionPercentages = [g7, g8, g9, g10, jhsCompletion];
  } else if (offeredLevels === "shs_only") {
    const g11 = shsFirstSched ? (countValidByGrade(shsFirstSched, 11).valid > 0 ? shsFirstCompletion : 0) : 0;
    const g12 = shsFirstSched ? (countValidByGrade(shsFirstSched, 12).valid > 0 ? shsFirstCompletion : 0) : 0;
    completionLabels = ["Grade 11", "Grade 12", "Overall SHS"];
    completionPercentages = [g11, g12, shsFirstCompletion];
  } else {
    // When "both", if only one level has a schedule generated so far, reflect active scheduled completion
    const activeOverall =
      jhsValid.total > 0 && shsFirstValid.total > 0
        ? Math.round((jhsCompletion + shsFirstCompletion) / 2)
        : jhsValid.total > 0
          ? jhsCompletion
          : shsFirstCompletion;
    completionLabels = ["JHS (G7–10)", "SHS (G11–12)", "Active Overall"];
    completionPercentages = [jhsCompletion, shsFirstCompletion, activeOverall];
  }

  // Use the most recent schedule across offered levels for status info
  let latestSchedule = null;
  let latestUpdated = 0;
  let latestScheduleType = null;
  const candidateScheds =
    offeredLevels === "jhs_only"
      ? [jhsSched]
      : offeredLevels === "shs_only"
        ? [shsFirstSched]
        : [jhsSched, shsFirstSched];

  candidateScheds.forEach((sched) => {
    if (sched && sched.updatedAt) {
      const t = new Date(sched.updatedAt).getTime();
      if (t > latestUpdated) {
        latestSchedule = sched;
        latestUpdated = t;
        latestScheduleType = sched.scheduleType || null;
      }
    }
  });

  let lastUpdatedString = "No data yet";
  let currentVersionString = "No draft";
  let activeScheduleString = "Not configured";
  let publishedString = "No";
  let draftCount = 0;
  if (latestScheduleType) {
    const drafts = safeParseStorage("turotugma_schedule_drafts", []);
    draftCount = Array.isArray(drafts)
      ? drafts.filter((d) => (d.scheduleType || d.schedule?.scheduleType) === latestScheduleType).length
      : 0;
  }
  if (latestSchedule) {
    if (latestScheduleType === "jhs") {
      activeScheduleString = "Junior High School (JHS)";
    } else if (latestScheduleType === "shs_first" || latestScheduleType === "shs-first") {
      activeScheduleString = "SHS First Semester";
    } else if (latestScheduleType === "shs_second" || latestScheduleType === "shs-second") {
      activeScheduleString = "SHS Second Semester";
    } else if (latestScheduleType) {
      activeScheduleString = String(latestScheduleType).toUpperCase();
    }
    const isPublished = latestSchedule.status === "published";
    currentVersionString = isPublished ? "Official Published" : (draftCount > 0 ? `Draft v${draftCount}` : "Draft v1");
    publishedString = isPublished ? "Yes" : "No";
    if (latestSchedule.updatedAt) {
      const date = new Date(latestSchedule.updatedAt);
      lastUpdatedString = date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  } else if (hasAnyData) {
    lastUpdatedString = "Based on current records";
    currentVersionString = "Draft v1";
    activeScheduleString = "Configured";
    publishedString = "No";
  }

  // Use actual conflicts from the most recent schedule
  let actualConflicts = [];
  if (latestSchedule && Array.isArray(latestSchedule.conflicts)) {
    actualConflicts = latestSchedule.conflicts;
  }
  const unresolvedConflictsCount = actualConflicts.length;

  // Categorize conflicts for the Conflicts Detected KPI card
  let teacherOverlapsCount = 0;
  let quotaIssuesCount = 0;
  let restrictionIssuesCount = 0;
  actualConflicts.forEach((c) => {
    const msg = String(c || "").toLowerCase();
    if (msg.includes("booked") || msg.includes("multiple streams")) {
      teacherOverlapsCount += 1;
    } else if (msg.includes("exceeding") || msg.includes("recurring daily") || msg.includes("times on")) {
      quotaIssuesCount += 1;
    } else {
      restrictionIssuesCount += 1;
    }
  });

  return {
    offeredLevels,
    summary: {
      profiledTeachers: snapshot.profiledTeachers,
      activeTeachers: snapshot.activeTeachers,
      assignedTeachersCount: snapshot.assignedTeachersCount,
      profiledAssignmentBreakdown: {
        ...snapshot.profiledAssignmentBreakdown,
        total: snapshot.profiledTeachers,
      },
      totalSections: snapshot.totalSections,
      totalSectionGradeBreakdown: snapshot.sectionGradeBreakdown,
      totalSubjects: snapshot.totalSubjects,
      totalSubjectBreakdown: snapshot.subjectBreakdown,
      unresolvedConflicts: unresolvedConflictsCount,
      conflictBreakdown: {
        teacherOverlaps: teacherOverlapsCount,
        quotaIssues: quotaIssuesCount,
        restrictionIssues: restrictionIssuesCount,
        total: unresolvedConflictsCount,
      },
      published: publishedString,
    },
    scheduleStatus: {
      activeSchedule: activeScheduleString,
      currentVersion: currentVersionString,
      lastUpdated: lastUpdatedString,
    },
    trends: {
      conflictCountByWeek: [0, 0, 0, 0, 0, unresolvedConflictsCount],
      labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
    },
    teacherLoadDistribution: {
      labels: ["Balanced (Target Load)", "Underload (< 15h)", "Unassigned (0h)", "Overload (> 30h)"],
      values: [
        snapshot.loadDistribution.balanced,
        snapshot.loadDistribution.underload,
        snapshot.loadDistribution.unassigned,
        snapshot.loadDistribution.overload,
      ],
      raw: snapshot.loadDistribution,
    },
    scheduleCompletionByLevel: {
      labels: completionLabels,
      percentages: completionPercentages,
    },
    activity: [
      `${snapshot.totalSections} sections currently configured`,
      `${snapshot.totalSubjects} subjects currently saved`,
      `${snapshot.activeTeachers} active teachers currently available`,
    ],
    employmentStatusBreakdown: snapshot.employmentStatusBreakdown,
    departmentBreakdown: snapshot.departmentBreakdown,
    conflicts:
      unresolvedConflictsCount > 0
        ? actualConflicts.map((c, i) => typeof c === "string" ? c : `Conflict ${i + 1}`)
        : [],
  };
}

export function toDashboardViewModel(payload) {
  const deptList = Array.isArray(payload.departmentBreakdown) ? payload.departmentBreakdown : [];

  return {
    offeredLevels: payload.offeredLevels || "both",
    loadSummary: {
      total: payload.summary.activeTeachers || payload.summary.profiledTeachers || 0,
      balanced: payload.teacherLoadDistribution?.raw?.balanced || 0,
      underload: payload.teacherLoadDistribution?.raw?.underload || 0,
      unassigned: payload.teacherLoadDistribution?.raw?.unassigned || 0,
      overload: payload.teacherLoadDistribution?.raw?.overload || 0,
    },
    metrics: [
      {
        label: "Profiled Teachers",
        value: String(payload.summary.profiledTeachers),
        subtitle: `${payload.summary.assignedTeachersCount || 0} Assigned • ${payload.teacherLoadDistribution?.raw?.unassigned || 0} Unassigned`,
        assignmentBreakdown: payload.summary.profiledAssignmentBreakdown,
      },
      {
        label: "Total Sections",
        value: String(payload.summary.totalSections),
        subtitle: payload.offeredLevels === "jhs_only" ? "Grades 7 to 10 (JHS)" : payload.offeredLevels === "shs_only" ? "Grades 11 to 12 (SHS)" : "Grades 7 to 12 (JHS & SHS)",
        sectionBreakdown: payload.summary.totalSectionGradeBreakdown,
      },
      {
        label: "Total Subjects",
        value: String(payload.summary.totalSubjects),
        subtitle: "DepEd Curriculum Catalog",
        subjectBreakdown: payload.summary.totalSubjectBreakdown,
      },
      {
        label: "Conflicts Detected",
        value: String(payload.summary.unresolvedConflicts),
        subtitle: payload.summary.unresolvedConflicts === 0 ? "100% Conflict-Free" : "Requires Attention",
        conflictBreakdown: payload.summary.conflictBreakdown,
      },
    ],
    scheduleStatusRows: [
      { label: "Active Schedule", value: payload.scheduleStatus.activeSchedule },
      { label: "Current Version", value: payload.scheduleStatus.currentVersion },
      { label: "Last Updated", value: payload.scheduleStatus.lastUpdated },
      { label: "Published", value: payload.summary.published === "Yes" ? "Yes" : "No" },
    ],
    activity: payload.activity,
    conflicts: payload.conflicts,
    employmentBreakdown: payload.employmentStatusBreakdown || {
      regular: { count: 0, totalPeriods: 0, overload: 0, balanced: 0, underload: 0, unassigned: 0 },
      probationary: { count: 0, totalPeriods: 0, overload: 0, balanced: 0, underload: 0, unassigned: 0 },
      partTime: { count: 0, totalPeriods: 0, overload: 0, balanced: 0, underload: 0, unassigned: 0 },
    },
    departmentBreakdown: deptList,
    charts: {
      teacherLoad: {
        labels: payload.teacherLoadDistribution.labels,
        datasets: [
          {
            data: payload.teacherLoadDistribution.values,
            backgroundColor: ["#3B4197", "#818cf8", "#cbd5e1", "#ef4444"],
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        ],
      },
      scheduleCompletion: {
        labels: payload.scheduleCompletionByLevel.labels,
        datasets: [
          {
            label: "Completion %",
            data: payload.scheduleCompletionByLevel.percentages,
            backgroundColor: payload.scheduleCompletionByLevel.labels.map((_, idx, arr) =>
              idx === arr.length - 1 ? "#2563eb" : "#3B4197"
            ),
            borderRadius: 6,
          },
        ],
      },
      departmentWorkload: {
        labels: deptList.map((d) => d.label),
        datasets: [
          {
            label: "Balanced (Target Load)",
            data: deptList.map((d) => d.balanced),
            backgroundColor: "#3B4197",
            borderRadius: 4,
          },
          {
            label: "Underload (< 15h)",
            data: deptList.map((d) => d.underload),
            backgroundColor: "#818cf8",
            borderRadius: 4,
          },
          {
            label: "Overload (> 30h)",
            data: deptList.map((d) => d.overload),
            backgroundColor: "#ef4444",
            borderRadius: 4,
          },
          {
            label: "Unassigned (0h)",
            data: deptList.map((d) => d.unassigned),
            backgroundColor: "#cbd5e1",
            borderRadius: 4,
          },
        ],
      },
      fusionAnalytics: {
        labels: deptList.map((d) => d.label),
        datasets: [
          {
            label: "Balanced (Target Load)",
            data: deptList.map((d) => d.balanced),
            backgroundColor: "#3B4197",
            borderRadius: 4,
          },
          {
            label: "Underload (Needs More Load)",
            data: deptList.map((d) => d.underload),
            backgroundColor: "#818cf8",
            borderRadius: 4,
          },
          {
            label: "Overload (Exceeds Limit)",
            data: deptList.map((d) => d.overload),
            backgroundColor: "#ef4444",
            borderRadius: 4,
          },
          {
            label: "Unassigned (0h)",
            data: deptList.map((d) => d.unassigned),
            backgroundColor: "#cbd5e1",
            borderRadius: 4,
          },
        ],
      },
    },
  };
}
