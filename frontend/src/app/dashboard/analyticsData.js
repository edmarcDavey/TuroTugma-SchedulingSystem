import ScheduleMaker from "./components/ScheduleMaker";
import { useMemo } from "react";

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

function getTeacherAssignmentBreakdown(activeTeachers) {
  return activeTeachers.reduce(
    (counts, teacher) => {
      const gradeAssignments = Array.isArray(teacher?.gradeLevelAssignments)
        ? teacher.gradeLevelAssignments
        : [];
      const gradeNumbers = gradeAssignments.map(parseGradeLevelValue).filter((grade) => grade !== null);
      const hasJhs = gradeNumbers.some((grade) => grade >= 7 && grade <= 10);
      const hasShs = gradeNumbers.some((grade) => grade >= 11 && grade <= 12);

      if (hasJhs && hasShs) {
        counts.both += 1;
      } else if (hasJhs) {
        counts.jhs += 1;
      } else if (hasShs) {
        counts.shs += 1;
      }

      return counts;
    },
    { jhs: 0, shs: 0, both: 0 }
  );
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
  let totalSections = getTotalSectionsFromSavedConfig(sections);
  let totalSubjects = subjectsList.length;
  let jhsSubjects = subjectsList.filter((subject) => subject?.schoolLevel === "jhs").length;
  let shsSubjects = subjectsList.filter((subject) => subject?.schoolLevel === "shs").length;
  let assignmentBreakdown = getTeacherAssignmentBreakdown(activeTeachers);
  let loadDistribution = activeTeachers.reduce(
    (counts, teacher) => {
      const status = teacher?.assignedLoadStatus || "Unassigned";
      if (status === "Unassigned") counts.unassigned += 1;
      else if (status === "Underload") counts.underload += 1;
      else if (status === "Balanced") counts.balanced += 1;
      else if (status === "Overload") counts.overload += 1;
      return counts;
    },
    { unassigned: 0, balanced: 0, underload: 0, overload: 0 }
  );
  if (latestSchedule) {
    // Use config from latest schedule if available
    if (latestConfig) {
      // Use config for section breakdown and total sections
      sectionGradeBreakdown = getSectionGradeBreakdown(latestConfig);
      totalSections = getTotalSectionsFromSavedConfig(latestConfig);
    }
    // Use assignments and teacher loads from latest schedule if available
    if (latestSchedule.assignments && typeof latestSchedule.assignments === "object") {
      // Count unique teacherIds in assignments as active teachers
      const teacherIds = new Set();
      Object.values(latestSchedule.assignments).forEach((a) => {
        if (a && a.teacherId) teacherIds.add(a.teacherId);
      });
      activeTeachers = facultyList.filter((t) => teacherIds.has(t.id));
      assignmentBreakdown = getTeacherAssignmentBreakdown(activeTeachers);
    }
    // Use teacherLoadPercent for load distribution if available
    if (latestSchedule.teacherLoadPercent && typeof latestSchedule.teacherLoadPercent === "object") {
      // Map teacher load percent to load categories
      const loadDist = { unassigned: 0, balanced: 0, underload: 0, overload: 0 };
      Object.entries(latestSchedule.teacherLoadPercent).forEach(([tid, percent]) => {
        if (percent === 0) loadDist.unassigned += 1;
        else if (percent < 8) loadDist.underload += 1;
        else if (percent === 8) loadDist.balanced += 1;
        else if (percent > 8) loadDist.overload += 1;
      });
      loadDistribution = loadDist;
    }
  }

  return {
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
    assignmentBreakdown,
  };
}

export function getDashboardAnalyticsPayload() {
  const snapshot = getSystemSnapshot();
  const hasAnyData = snapshot.totalTeachers > 0 || snapshot.totalSections > 0 || snapshot.totalSubjects > 0;
  const jhsCompletion = snapshot.totalSections > 0 ? Math.min(100, Math.round((snapshot.jhsSubjects / snapshot.totalSections) * 100)) : 0;
  const shsCompletion = snapshot.totalSections > 0 ? Math.min(100, Math.round((snapshot.shsSubjects / snapshot.totalSections) * 100)) : 0;

  // Use valid/conflict-free assignment completion for 'Overall'
  let validCompletion = { valid: 0, total: 0, percent: 0 };
  // Find the latest schedule and its config/sections/slots
  let latestSchedule = null;
  let latestConfig = null;
  let latestSections = null;
  let latestSlots = null;
  let latestScheduleType = null;
  // Check published schedules
  const publishedSchedules = safeParseStorage("turotugma_published_schedules", {});
  let latestUpdated = 0;
  Object.values(publishedSchedules).forEach((sched) => {
    if (sched && sched.updatedAt && new Date(sched.updatedAt).getTime() > latestUpdated) {
      latestSchedule = sched;
      latestConfig = sched.config;
      latestSections = sched.sections;
      latestSlots = sched.slots;
      latestScheduleType = sched.scheduleType;
      latestUpdated = new Date(sched.updatedAt).getTime();
    }
  });
  // Check drafts
  const drafts = safeParseStorage("turotugma_schedule_drafts", []);
  if (Array.isArray(drafts)) {
    drafts.forEach((draft) => {
      if (draft && draft.updatedAt && new Date(draft.updatedAt).getTime() > latestUpdated) {
        latestSchedule = draft.schedule || draft;
        latestConfig = draft.config;
        latestSections = (draft.schedule && draft.schedule.sections) || draft.sections;
        latestSlots = (draft.schedule && draft.schedule.slots) || draft.slots;
        latestScheduleType = (draft.schedule && draft.schedule.scheduleType) || draft.scheduleType;
        latestUpdated = new Date(draft.updatedAt).getTime();
      }
    });
  }
  if (latestSchedule && latestSections && latestSlots && latestScheduleType && latestConfig) {
    validCompletion = getValidScheduleCompletion(latestSchedule, latestSections, latestSlots, latestScheduleType, latestConfig);
  }

  const hasPublished = publishedSchedules && Object.keys(publishedSchedules).length > 0;
  let lastUpdatedString = "No data yet";
  let currentVersionString = "No draft";
  if (latestSchedule) {
    // Use the name property if available, otherwise fallback to versioned label
    if (latestSchedule.name && typeof latestSchedule.name === "string" && latestSchedule.name.trim() !== "") {
      currentVersionString = latestSchedule.name;
    } else if (latestSchedule.status === "published") {
      currentVersionString = "Published v1";
    } else if (latestSchedule.status === "draft") {
      currentVersionString = "Draft v1";
    }
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
  }

  return {
    summary: {
      activeTeachers: snapshot.activeTeachers,
      activeAssignmentBreakdown: {
        ...snapshot.assignmentBreakdown,
        total: snapshot.activeTeachers,
      },
      totalSections: snapshot.totalSections,
      totalSectionGradeBreakdown: snapshot.sectionGradeBreakdown,
      totalSubjects: snapshot.totalSubjects,
      totalSubjectBreakdown: snapshot.subjectBreakdown,
      unresolvedConflicts: snapshot.unresolvedConflicts,
      published: hasPublished,
    },
    scheduleStatus: {
      activeSchedule: hasAnyData ? "Configured" : "Not configured",
      currentVersion: currentVersionString,
      lastUpdated: lastUpdatedString,
    },
    trends: {
      conflictCountByWeek: [0, 0, 0, 0, 0, snapshot.unresolvedConflicts],
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
      percentages: [jhsCompletion, shsCompletion, validCompletion.percent],
    },
    activity: [
      `${snapshot.totalSections} sections currently configured`,
      `${snapshot.totalSubjects} subjects currently saved`,
      `${snapshot.activeTeachers} active teachers currently available`,
    ],
    conflicts:
      snapshot.unresolvedConflicts > 0
        ? [`${snapshot.unresolvedConflicts} teacher load conflict(s) detected (overload).`]
        : [],
  };
}

export function toDashboardViewModel(payload) {
  return {
    metrics: [
      {
        label: "Active Teachers",
        value: String(payload.summary.activeTeachers),
        assignmentBreakdown: payload.summary.activeAssignmentBreakdown,
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
