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

  try {
    // 1. Check Published Schedules
    const publishedRaw = localStorage.getItem("turotugma_published_schedules");
    if (publishedRaw) {
      const publishedMap = JSON.parse(publishedRaw);
      if (publishedMap && typeof publishedMap === "object") {
        Object.values(publishedMap).forEach((sched) => {
          processSchedule(sched);
        });
      }
    }
  } catch (e) {
    console.error("Error reading published schedules:", e);
  }

  // If published schedules had assignments, return them
  if (allAssignments.length > 0) {
    return allAssignments;
  }

  try {
    // 2. Fallback to Draft Schedules if no published schedules exist.
    // Deduplicate by taking the most recent draft per scheduleType so multiple versions don't multiply count.
    const draftRaw = localStorage.getItem("turotugma_schedule_drafts");
    if (draftRaw) {
      const draftArr = JSON.parse(draftRaw);
      if (Array.isArray(draftArr) && draftArr.length > 0) {
        const latestByLevel = {};
        draftArr.forEach((draftItem) => {
          const sched = draftItem?.schedule || draftItem;
          const level = sched?.scheduleType || draftItem?.scheduleType || "default";
          const updated = new Date(draftItem?.updatedAt || sched?.updatedAt || 0).getTime();
          if (!latestByLevel[level] || updated > latestByLevel[level].updated) {
            latestByLevel[level] = { sched, updated };
          }
        });
        Object.values(latestByLevel).forEach(({ sched }) => {
          processSchedule(sched);
        });
      }
    }
  } catch (e) {
    console.error("Error reading schedule drafts:", e);
  }

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

  const teacherPeriodCounts = {};
  assignments.forEach((asgn) => {
    const tid = asgn.teacherId;
    if (tid) {
      teacherPeriodCounts[tid] = (teacherPeriodCounts[tid] || 0) + 1;
    }
  });

  return facultyList.map((faculty) => {
    const periodCount = teacherPeriodCounts[faculty.id] || 0;
    const totalMinutes = periodCount * periodMinutes;
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const dailyHours = Math.round((totalHours / 5) * 10) / 10;

    const isClassAdviser = Boolean(
      faculty.isClassAdviser ||
      (Array.isArray(faculty.ancillaryAssignments) && faculty.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
    );

    const empStatus = String(faculty.employmentStatus || "").toLowerCase();
    const isPartTime = empStatus.includes("part-time") || empStatus.includes("parttime");

    // Magna Carta & DepEd DO 005, s. 2024:
    // Statutory maximum classroom teaching is 30 contact hours/week (6 hrs/day).
    // Class Advisers receive a 1-load credit (5 hours/week), capping classroom teaching at 25 hrs/week.
    // Minimum balanced teaching load: 20h for regular, 16h for class adviser, 12h for part-time.
    const ancillaryCreditHours = isClassAdviser ? 5 : (Number(faculty.ancillaryCreditHours) || 0);
    const maxTeachingContactHours = isPartTime ? 20 : (isClassAdviser ? 25 : 30);
    const minBalancedHours = isPartTime ? 12 : (isClassAdviser ? 16 : 20);

    const percent = Math.round((totalHours / maxTeachingContactHours) * 100);

    let status = "Unassigned";
    if (periodCount === 0) {
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

  // --- Use the same load calculation as FacultyManagement.js for dashboard chart ---
  let loadDistribution = { unassigned: 0, underload: 0, balanced: 0, overload: 0 };
  const teacherLoads = calculateTeacherLoads(activeTeachers);
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
    // Use assignments and teacher loads from latest schedule if available
    if (latestSchedule.assignments && typeof latestSchedule.assignments === "object") {
      // Count unique teacherIds in assignments as active teachers
      const teacherIds = new Set();
      Object.values(latestSchedule.assignments).forEach((a) => {
        if (a && a.teacherId) teacherIds.add(a.teacherId);
      });
      activeTeachers = facultyList.filter((t) => teacherIds.has(t.id));
      assignmentBreakdown = getTeacherAssignmentBreakdown(activeTeachers, 'ACTIVE ONLY');
    }
    // Use teacherLoadPercent for load distribution if available
    // (No longer needed: teacherLoadPercent percent-based logic is replaced by config-driven minute-based logic above)
  }

  let employmentStatusBreakdown = getEmploymentStatusBreakdown(activeTeachers);

  return {
    // Always show total profiled/created values, not filtered by schedule
    profiledTeachers: facultyList.length,
    profiledSections: getTotalSectionsFromSavedConfig(sections),
    profiledSubjects: subjectsList.length,
    // Keep old values for compatibility, but these are not used for login metrics anymore
    activeTeachers: activeTeachers.length,
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
    assignmentBreakdown, // active (filtered) breakdown
    profiledAssignmentBreakdown, // always full list breakdown
  };
}

export function getDashboardAnalyticsPayload() {
  const snapshot = getSystemSnapshot();
  const hasAnyData = snapshot.totalTeachers > 0 || snapshot.totalSections > 0 || snapshot.totalSubjects > 0;

  // Get most recent schedules for each level
  const jhsSched = getMostRecentScheduleForLevel("jhs");
  const shsFirstSched = getMostRecentScheduleForLevel("shs_first");
  // If you want to support SHS Second Sem, add: const shsSecondSched = getMostRecentScheduleForLevel("shs_second");

  const jhsValid = countValidAssignments(jhsSched);
  const shsFirstValid = countValidAssignments(shsFirstSched);
  // For now, ignore SHS Second Sem in overall

  const jhsCompletion = percent(jhsValid.valid, jhsValid.total);
  const shsFirstCompletion = percent(shsFirstValid.valid, shsFirstValid.total);
  const overallCompletion = Math.round((jhsCompletion + shsFirstCompletion) / 2);

  // Use the most recent schedule for status info
  let latestSchedule = null;
  let latestUpdated = 0;
  let latestScheduleType = null;
  [jhsSched, shsFirstSched].forEach((sched) => {
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
    // Count drafts for the active schedule type
    const drafts = safeParseStorage("turotugma_schedule_drafts", []);
    draftCount = Array.isArray(drafts)
      ? drafts.filter(d => (d.scheduleType || d.schedule?.scheduleType) === latestScheduleType).length
      : 0;
  }
  if (latestSchedule) {
    // Determine schedule type label
    if (latestScheduleType === "jhs") {
      activeScheduleString = "JHS";
    } else if (latestScheduleType === "shs_first") {
      activeScheduleString = "SHS First Sem";
    } else if (latestScheduleType === "shs_second") {
      activeScheduleString = "SHS Second Sem";
    } else if (latestScheduleType) {
      activeScheduleString = latestScheduleType;
    }
    // Always show Draft vN for current version
    currentVersionString = draftCount > 0 ? `Draft v${draftCount}` : "Draft v1";
    // Published only Yes if most recent schedule is published
    publishedString = latestSchedule.status === "published" ? "Yes" : "No";
    if (latestSchedule.updatedAt) {
      const date = new Date(latestSchedule.updatedAt);
      lastUpdatedString = date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    }
  } else if (hasAnyData) {
    lastUpdatedString = "Based on current records";
    currentVersionString = "Draft v1";
    activeScheduleString = "Configured";
    publishedString = "No";
  }

  const publishedSchedules = safeParseStorage("turotugma_published_schedules", {});
  const hasPublished = publishedSchedules && Object.keys(publishedSchedules).length > 0;

  // Use actual conflicts from the most recent schedule
  let actualConflicts = [];
  if (latestSchedule && Array.isArray(latestSchedule.conflicts)) {
    actualConflicts = latestSchedule.conflicts;
  }
  const unresolvedConflictsCount = actualConflicts.length;

  return {
    summary: {
      profiledTeachers: snapshot.profiledTeachers,
      profiledAssignmentBreakdown: {
        ...snapshot.profiledAssignmentBreakdown,
        total: snapshot.profiledTeachers,
      },
      totalSections: snapshot.totalSections,
      totalSectionGradeBreakdown: snapshot.sectionGradeBreakdown,
      totalSubjects: snapshot.totalSubjects,
      totalSubjectBreakdown: snapshot.subjectBreakdown,
      unresolvedConflicts: unresolvedConflictsCount,
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
      labels: ["Unassigned (0h)", "Underload (< 20h)", "Balanced (Target Load)", "Overload (> Limit)"],
      values: [
        snapshot.loadDistribution.unassigned,
        snapshot.loadDistribution.underload,
        snapshot.loadDistribution.balanced,
        snapshot.loadDistribution.overload,
      ],
    },
    scheduleCompletionByLevel: {
      labels: ["JHS", "SHS", "Overall"],
      percentages: [jhsCompletion, shsFirstCompletion, overallCompletion],
    },
    activity: [
      `${snapshot.totalSections} sections currently configured`,
      `${snapshot.totalSubjects} subjects currently saved`,
      `${snapshot.activeTeachers} active teachers currently available`,
    ],
    employmentStatusBreakdown: snapshot.employmentStatusBreakdown,
    conflicts:
      unresolvedConflictsCount > 0
        ? actualConflicts.map((c, i) => typeof c === "string" ? c : `Conflict ${i + 1}`)
        : [],
  };
}

export function toDashboardViewModel(payload) {
  // Always use profiledAssignmentBreakdown for the profiled teachers card
  return {
    metrics: [
      {
        label: "Profiled Teachers",
        value: String(payload.summary.profiledTeachers),
        assignmentBreakdown: payload.summary.profiledAssignmentBreakdown,
      },
      {
        label: "Total Sections",
        value: String(payload.summary.totalSections),
        sectionBreakdown: payload.summary.totalSectionGradeBreakdown,
      },
      {
        label: "Total Subjects",
        value: String(payload.summary.totalSubjects),
        subjectBreakdown: payload.summary.totalSubjectBreakdown,
      },
      { label: "Conflicts Detected", value: String(payload.summary.unresolvedConflicts) },
    ],
    scheduleStatusRows: [
      { label: "Active Schedule", value: payload.scheduleStatus.activeSchedule },
      { label: "Current Version", value: payload.scheduleStatus.currentVersion },
      { label: "Last Updated", value: payload.scheduleStatus.lastUpdated },
      { label: "Published", value: payload.summary.published ? "Yes" : "No" },
    ],
    activity: payload.activity,
    conflicts: payload.conflicts,
    employmentBreakdown: payload.employmentStatusBreakdown || {
      regular: { count: 0, totalPeriods: 0, overload: 0, balanced: 0, underload: 0, unassigned: 0 },
      probationary: { count: 0, totalPeriods: 0, overload: 0, balanced: 0, underload: 0, unassigned: 0 },
      partTime: { count: 0, totalPeriods: 0, overload: 0, balanced: 0, underload: 0, unassigned: 0 },
    },
    charts: {
      teacherLoad: {
        labels: payload.teacherLoadDistribution.labels,
        datasets: [
          {
            data: payload.teacherLoadDistribution.values,
            backgroundColor: ["#cbd5e1", "#818cf8", "#3B4197", "#ef4444"],
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
            backgroundColor: ["#3B4197", "#5663bd", "#7a87dd"],
            borderRadius: 6,
          },
        ],
      },
      employmentLoad: {
        labels: ["Regular / Permanent", "Probationary", "Part-Time"],
        datasets: [
          {
            label: "Faculty Count",
            data: [
              payload.employmentStatusBreakdown?.regular?.count || 0,
              payload.employmentStatusBreakdown?.probationary?.count || 0,
              payload.employmentStatusBreakdown?.partTime?.count || 0,
            ],
            backgroundColor: "#3B4197",
            borderRadius: 6,
          },
          {
            label: "Total Assigned Periods",
            data: [
              payload.employmentStatusBreakdown?.regular?.totalPeriods || 0,
              payload.employmentStatusBreakdown?.probationary?.totalPeriods || 0,
              payload.employmentStatusBreakdown?.partTime?.totalPeriods || 0,
            ],
            backgroundColor: "#818cf8",
            borderRadius: 6,
          },
        ],
      },
      fusionAnalytics: {
        labels: ["Regular / Permanent", "Probationary", "Part-Time"],
        datasets: [
          {
            label: "Balanced (Target Load)",
            data: [
              payload.employmentStatusBreakdown?.regular?.balanced || 0,
              payload.employmentStatusBreakdown?.probationary?.balanced || 0,
              payload.employmentStatusBreakdown?.partTime?.balanced || 0,
            ],
            backgroundColor: "#3B4197",
            borderRadius: 4,
          },
          {
            label: "Underload (Needs More Load)",
            data: [
              payload.employmentStatusBreakdown?.regular?.underload || 0,
              payload.employmentStatusBreakdown?.probationary?.underload || 0,
              payload.employmentStatusBreakdown?.partTime?.underload || 0,
            ],
            backgroundColor: "#818cf8",
            borderRadius: 4,
          },
          {
            label: "Overload (Exceeds Limit)",
            data: [
              payload.employmentStatusBreakdown?.regular?.overload || 0,
              payload.employmentStatusBreakdown?.probationary?.overload || 0,
              payload.employmentStatusBreakdown?.partTime?.overload || 0,
            ],
            backgroundColor: "#ef4444",
            borderRadius: 4,
          },
          {
            label: "Unassigned (0h)",
            data: [
              payload.employmentStatusBreakdown?.regular?.unassigned || 0,
              payload.employmentStatusBreakdown?.probationary?.unassigned || 0,
              payload.employmentStatusBreakdown?.partTime?.unassigned || 0,
            ],
            backgroundColor: "#cbd5e1",
            borderRadius: 4,
          },
        ],
      },
    },
  };
}
