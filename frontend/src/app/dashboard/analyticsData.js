// --- BEGIN: Copied from FacultyManagement.js for consistent teacher load calculation ---
function getScheduleDraftAndConfig() {
  try {
    const draftRaw = localStorage.getItem("turotugma_schedule_drafts");
    const configRaw = localStorage.getItem("turotugma_schedule_configurations");
    let draftArr = draftRaw ? JSON.parse(draftRaw) : null;
    const draft = Array.isArray(draftArr) && draftArr.length > 0 ? draftArr[0] : null;
    const config = configRaw ? JSON.parse(configRaw) : null;
    const activeConfig = draft?.config?.jhs || config || {};
    return { draft, config: activeConfig };
  } catch {
    return { draft: null, config: {} };
  }
}

function calculateTeacherLoads(facultyList) {
  const { draft, config } = getScheduleDraftAndConfig();
  if (!draft || !draft.schedule || !draft.schedule.assignments) return facultyList.map(f => ({ ...f, assignedLoadPercent: 0 }));

  const periodsPerDay = Math.max(
    Number(config.periods?.regular || 0),
    Number(config.periods?.special || 0)
  );
  const regularDays = config.regularDays || [];
  const shortenedDays = config.shortenedDays || [];
  const periodMinutes = config.periodMinutes || { regular: 50, shortened: 45 };

  const minBalanced = (4 * regularDays.length * periodMinutes.regular) + (4 * shortenedDays.length * periodMinutes.shortened);
  const maxBalanced = (6 * regularDays.length * periodMinutes.regular) + (6 * shortenedDays.length * periodMinutes.shortened);

  const teacherMinutes = {};
  facultyList.forEach(faculty => {
    let assignedPeriods = new Set();
    if (draft.schedule && draft.schedule.assignments) {
      Object.entries(draft.schedule.assignments).forEach(([key, assignment]) => {
        if (assignment.teacherId !== faculty.id) return;
        const periodMatch = key.match(/\|JHS-P(\d+)/);
        if (periodMatch) {
          assignedPeriods.add(periodMatch[0]);
        }
      });
    }
    const periodCount = assignedPeriods.size;
    const totalMinutes = (periodCount * regularDays.length * periodMinutes.regular) + (periodCount * shortenedDays.length * periodMinutes.shortened);
    teacherMinutes[faculty.id] = totalMinutes;
  });

  return facultyList.map(faculty => {
    const minutes = teacherMinutes[faculty.id] || 0;
    let percent = 0;
    if (minutes > 0 && maxBalanced > 0) {
      percent = Math.round((minutes / maxBalanced) * 100);
    }
    return {
      ...faculty,
      assignedLoadPercent: percent,
      assignedLoadMinutes: minutes,
      assignedLoadStatus: minutes === 0 ? "Unassigned" : (minutes < minBalanced ? "Underload" : (minutes <= maxBalanced ? "Balanced" : "Overload")),
    };
  });
}
// --- END: Copied from FacultyManagement.js ---

import ScheduleMaker from "./components/ScheduleMaker";
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
  let loadDistribution = { unassigned: 0, balanced: 0, underload: 0, overload: 0 };
  const teacherLoads = calculateTeacherLoads(activeTeachers);
  teacherLoads.forEach((teacher) => {
    const status = teacher.assignedLoadStatus || "Unassigned";
    if (status === "Unassigned") loadDistribution.unassigned += 1;
    else if (status === "Underload") loadDistribution.underload += 1;
    else if (status === "Balanced") loadDistribution.balanced += 1;
    else if (status === "Overload") loadDistribution.overload += 1;
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
      labels: ["Unassigned", "Underload", "Balanced", "Overload"],
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
    charts: {
      teacherLoad: {
        labels: payload.teacherLoadDistribution.labels,
        datasets: [
          {
            data: payload.teacherLoadDistribution.values,
            backgroundColor: ["#c3c9de", "#8893d9", "#3B4197", "#e53935"],
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
    },
  };
}
