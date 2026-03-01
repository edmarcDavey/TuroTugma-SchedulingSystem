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
  const faculty = safeParseStorage(FACULTY_STORAGE_KEY, []);
  const subjects = safeParseStorage(SUBJECTS_STORAGE_KEY, []);
  const sections = safeParseStorage(SECTIONS_STORAGE_KEY, null);

  const facultyList = Array.isArray(faculty) ? faculty : [];
  const subjectsList = Array.isArray(subjects) ? subjects : [];
  const activeTeachers = facultyList.filter((teacher) => teacher?.active !== false);
  const assignmentBreakdown = getTeacherAssignmentBreakdown(activeTeachers);
  const sectionGradeBreakdown = getSectionGradeBreakdown(sections);
  const subjectBreakdown = getSubjectBreakdown(subjectsList);

  const loadDistribution = activeTeachers.reduce(
    (counts, teacher) => {
      const load = Number(teacher?.assignedLoadPercent) || 0;

      if (load <= 0) {
        counts.unassigned += 1;
      } else if (load > 100) {
        counts.overload += 1;
      } else if (load >= 70) {
        counts.balanced += 1;
      } else {
        counts.underload += 1;
      }

      return counts;
    },
    { unassigned: 0, balanced: 0, underload: 0, overload: 0 }
  );

  const jhsSubjects = subjectsList.filter((subject) => subject?.schoolLevel === "jhs").length;
  const shsSubjects = subjectsList.filter((subject) => subject?.schoolLevel === "shs").length;

  return {
    activeTeachers: activeTeachers.length,
    totalTeachers: facultyList.length,
    totalSections: getTotalSectionsFromSavedConfig(sections),
    sectionGradeBreakdown,
    totalSubjects: subjectsList.length,
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
  const overallCompletion = Math.min(100, Math.round((jhsCompletion + shsCompletion) / 2));

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
      published: false,
    },
    scheduleStatus: {
      activeSchedule: hasAnyData ? "Configured" : "Not configured",
      currentVersion: hasAnyData ? "Draft v1" : "No draft",
      lastUpdated: hasAnyData ? "Based on current records" : "No data yet",
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
      percentages: [jhsCompletion, shsCompletion, overallCompletion],
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
      conflictTrend: {
        labels: payload.trends.labels,
        datasets: [
          {
            label: "Conflicts",
            data: payload.trends.conflictCountByWeek,
            borderColor: "#3B4197",
            backgroundColor: "rgba(59,65,151,0.12)",
            borderWidth: 2,
            tension: 0.35,
            fill: true,
          },
        ],
      },
      teacherLoad: {
        labels: payload.teacherLoadDistribution.labels,
        datasets: [
          {
            data: payload.teacherLoadDistribution.values,
            backgroundColor: ["#c3c9de", "#8893d9", "#3B4197", "#d0d8ff"],
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
