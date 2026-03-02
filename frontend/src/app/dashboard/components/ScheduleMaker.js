import { useEffect, useMemo, useRef, useState } from "react";

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
    regularDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    shortenedDays: ["Friday", "Saturday", "Sunday"],
    periodMinutes: { regular: 50, shortened: 45 },
    periods: { regular: 8, special: 9 },
    breaks: {
      morning: { enabled: true, duration: 20, afterPeriod: 2 },
      lunch: { enabled: true, duration: 60, afterPeriod: 4 },
      afternoon: { enabled: false, duration: 15, afterPeriod: 6 },
    },
  },
  shs: {
    regularDays: ["Tuesday", "Wednesday", "Thursday", "Friday"],
    shortenedDays: ["Monday", "Saturday", "Sunday"],
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

export default function ScheduleMaker() {
  const [scheduleType, setScheduleType] = useState("jhs");
  const [configPanel, setConfigPanel] = useState("jhs");
  const [jhsSessionType, setJhsSessionType] = useState("regular");
  const [shsSessionType, setShsSessionType] = useState("regular");
  const [config, setConfig] = useState(() => loadScheduleConfig());
  const [drafts, setDrafts] = useState(() => loadJson(DRAFTS_STORAGE_KEY, []));
  const [publishedSchedules, setPublishedSchedules] = useState(() => loadJson(PUBLISHED_STORAGE_KEY, {}));
  const [schedule, setSchedule] = useState(null);
  const [showDraftsPanel, setShowDraftsPanel] = useState(false);
  const [showSchedulingConfigurations, setShowSchedulingConfigurations] = useState(true);
  const [gridSessionFilter, setGridSessionFilter] = useState("regular");
  const [gridGradeFilter, setGridGradeFilter] = useState("all");
  const [gridSectionTypeFilter, setGridSectionTypeFilter] = useState("all");
  const [gridTrackFilter, setGridTrackFilter] = useState("all");
  const [cellEditorDrafts, setCellEditorDrafts] = useState({});
  const [hoveredCellKey, setHoveredCellKey] = useState("");
  const [teacherRestrictionForm, setTeacherRestrictionForm] = useState(EMPTY_TEACHER_RESTRICTION_FORM);
  const [showTeacherRestrictionEditor, setShowTeacherRestrictionEditor] = useState(false);
  const [subjectRestrictionForm, setSubjectRestrictionForm] = useState(EMPTY_SUBJECT_RESTRICTION_FORM);
  const [showSubjectRestrictionEditor, setShowSubjectRestrictionEditor] = useState(false);
  const [notice, setNotice] = useState({ text: "", type: "success" });
  const [dataRefreshToken, setDataRefreshToken] = useState(0);
  const [configSaveStatus, setConfigSaveStatus] = useState("saved");
  const configSaveTimerRef = useRef(null);

  const sectionsRaw = useMemo(() => loadJson(SECTIONS_STORAGE_KEY, null), [dataRefreshToken]);
  const subjectsRaw = useMemo(() => loadJson(SUBJECTS_STORAGE_KEY, []), [dataRefreshToken]);
  const facultyRaw = useMemo(() => loadJson(FACULTY_STORAGE_KEY, []), [dataRefreshToken]);

  const sections = useMemo(() => getSectionsForSchedule(scheduleType, sectionsRaw), [scheduleType, sectionsRaw]);
  const subjects = useMemo(() => normalizeSubjectsList(subjectsRaw), [subjectsRaw]);
  const faculty = useMemo(() => normalizeFacultyList(facultyRaw), [facultyRaw]);
  const slots = useMemo(() => buildSlots(scheduleType, config), [scheduleType, config]);
  const breakSummary = useMemo(() => buildBreakSummary(scheduleType, config), [scheduleType, config]);
  const isJhsSchedule = scheduleType === "jhs";
  const jhsPeriodTimingBySession = useMemo(() => {
    if (!isJhsSchedule) {
      return new Map();
    }

    return buildJhsPeriodTimingMap(config.jhs, gridSessionFilter);
  }, [config.jhs, gridSessionFilter, isJhsSchedule]);
  const sessionDaysLookup = useMemo(() => {
    if (isJhsSchedule) {
      return null;
    }

    const levelConfig = isJhsSchedule ? config.jhs : config.shs;
    const days = gridSessionFilter === "regular" ? levelConfig.regularDays : levelConfig.shortenedDays;
    return new Set(normalizeDays(days));
  }, [config.jhs, config.shs, gridSessionFilter, isJhsSchedule]);
  const visibleSlots = useMemo(() => {
    if (isJhsSchedule || !sessionDaysLookup) {
      return slots;
    }

    return slots.filter((slot) => sessionDaysLookup.has(slot.day));
  }, [isJhsSchedule, slots, sessionDaysLookup]);
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
      ...buildSlots("jhs", config),
      ...buildSlots("shs-first", config),
      ...buildSlots("shs-last", config),
    ];

    const deduped = new Map();
    labels.forEach((slot) => {
      if (!deduped.has(slot.label)) {
        deduped.set(slot.label, slot);
      }
    });

    return Array.from(deduped.values());
  }, [config]);
  const allPeriodLabels = useMemo(() => allSlotOptions.map((slot) => slot.label), [allSlotOptions]);
  const teacherRestrictionOptions = useMemo(
    () =>
      faculty
        .filter((teacher) => teacher.active !== false)
        .map((teacher) => ({
          id: teacher.id,
          name: teacher.name,
          label: teacher.name,
          ancillaryAssignments: normalizeStringArray(teacher.ancillaryAssignments),
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

    const totalPeriods = Math.max(highestPeriod, 1);
    return Array.from({ length: totalPeriods }, (_, index) => `P${index + 1}`);
  }, [allSlotOptions]);
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
    if (publishedSchedules?.[scheduleType]) {
      return "Published";
    }

    if (draftsForCurrentSchedule.length > 0) {
      return "Draft Saved";
    }

    if (schedule) {
      return "Draft (Unsaved)";
    }

    return "Not Generated";
  }, [draftsForCurrentSchedule.length, publishedSchedules, schedule, scheduleType]);

  const conflictCount = schedule?.conflicts?.length || 0;

  const teacherBusyBySlot = useMemo(
    () => buildTeacherBusyMap(schedule?.assignments || {}, sectionsById, slotsById),
    [schedule?.assignments, sectionsById, slotsById]
  );

  useEffect(() => {
    const latestDraft = draftsForCurrentSchedule[0];
    setSchedule(latestDraft ? latestDraft.schedule : null);
    setCellEditorDrafts({});
    setHoveredCellKey("");
    setShowDraftsPanel(false);
    setGridSessionFilter("regular");
    setGridGradeFilter("all");
    setGridSectionTypeFilter("all");
    setGridTrackFilter("all");
  }, [scheduleType]);

  useEffect(() => {
    setConfigSaveStatus("saving");
    saveJson(CONFIG_STORAGE_KEY, config);

    const allLabels = [
      ...buildSlots("jhs", config),
      ...buildSlots("shs-first", config),
      ...buildSlots("shs-last", config),
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
        (item.ancillaryAssignments || []).some((task) => sanitizeText(task).toLowerCase() === selectedTask)
      );

      if (targetTeachers.length === 0) {
        showNotice("No active teachers found for the selected ancillary task.", "error");
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

    const autoSchedule = generateSchedule({
      scheduleType,
      sections,
      slots,
      subjects,
      activeTeachers,
      config,
    });

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

  const handleSaveDraft = () => {
    if (!schedule) {
      showNotice("Generate or load a schedule first.", "error");
      return;
    }

    const now = new Date().toISOString();
    const existing = drafts.find((draft) => draft.id === schedule.id);

    const nextDraft = {
      id: existing?.id || schedule.id || `draft-${Date.now()}`,
      scheduleType,
      name: `${getScheduleTypeLabel(scheduleType)} — ${formatDateTime(now)}`,
      updatedAt: now,
      schedule: {
        ...schedule,
        id: existing?.id || schedule.id || `draft-${Date.now()}`,
        updatedAt: now,
      },
    };

    const nextDrafts = upsertDraft(drafts, nextDraft);
    setDrafts(nextDrafts);
    saveJson(DRAFTS_STORAGE_KEY, nextDrafts);

    setSchedule(nextDraft.schedule);
    showNotice("Draft saved.", "success");
  };

  const handlePublish = () => {
    if (!schedule) {
      showNotice("Generate or load a draft before publishing.", "error");
      return;
    }

    const now = new Date().toISOString();
    const nextPublished = {
      ...publishedSchedules,
      [scheduleType]: {
        ...schedule,
        status: "published",
        publishedAt: now,
      },
    };

    setPublishedSchedules(nextPublished);
    saveJson(PUBLISHED_STORAGE_KEY, nextPublished);

    persistFacultyLoadPercent(schedule.teacherLoadPercent || {});
    setDataRefreshToken((current) => current + 1);

    showNotice("Schedule published.", "success");
  };

  const handleLoadDraft = (draftId) => {
    const selectedDraft = draftsForCurrentSchedule.find((draft) => draft.id === draftId);
    if (!selectedDraft) {
      showNotice("Draft not found.", "error");
      return;
    }

    setSchedule(selectedDraft.schedule);
    setShowDraftsPanel(false);
    setCellEditorDrafts({});
    setHoveredCellKey("");
    showNotice("Draft loaded.", "success");
  };

  const handleDeleteDraft = (draftId) => {
    const nextDrafts = drafts.filter((draft) => draft.id !== draftId);
    setDrafts(nextDrafts);
    saveJson(DRAFTS_STORAGE_KEY, nextDrafts);

    if (schedule?.id === draftId) {
      setSchedule(null);
      setCellEditorDrafts({});
      setHoveredCellKey("");
    }

    showNotice("Draft deleted.", "success");
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
      teacherLoadPercent: evaluation.teacherLoadPercent,
      updatedAt: now,
    });

    setCellEditorDrafts((prev) => ({
      ...prev,
      [cellKey]: { subjectId, teacherId },
    }));

    showNotice("Assignment saved.", "success");
  };

  const removeAssignmentFromCell = (section, slot, showMessage = true) => {
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
      teacherLoadPercent: evaluation.teacherLoadPercent,
      updatedAt: new Date().toISOString(),
    }));

    setCellEditorDrafts((prev) => ({
      ...prev,
      [cellKey]: { subjectId: "", teacherId: "" },
    }));

    if (showMessage) {
      showNotice("Assignment removed.", "success");
    }
  };

  const handleCellSubjectChange = (section, slot, subjectId) => {
    if (subjectId) {
      const sectionSubjects = getSubjectsForSection(section, subjects, scheduleType);
      const selectedSubject = sectionSubjects.find((item) => item.id === subjectId);

      if (!selectedSubject || isSubjectRestrictedForSlot(selectedSubject, slot, config.constraints)) {
        showNotice("Selected subject is restricted for this period.", "error");
        return;
      }
    }

    const { cellKey } = getCellDraft(section.id, slot.id);
    setCellEditorDrafts((prev) => ({
      ...prev,
      [cellKey]: { subjectId, teacherId: "" },
    }));

    if (!subjectId) {
      removeAssignmentFromCell(section, slot, false);
    }
  };

  const handleCellTeacherChange = (section, slot, teacherId) => {
    const { cellKey, subjectId } = getCellDraft(section.id, slot.id);

    if (!subjectId) {
      showNotice("Select subject first.", "error");
      return;
    }

    if (!teacherId) {
      setCellEditorDrafts((prev) => ({
        ...prev,
        [cellKey]: { subjectId, teacherId: "" },
      }));
      removeAssignmentFromCell(section, slot, false);
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
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>Schedule Maker</h1>
          <p style={{ margin: "8px 0 0", color: "#5b6787", fontSize: 14, maxWidth: 920 }}>
            Generate conflict-aware timetables for JHS and SHS, configure period structures and breaks, assign directly in the grid,
            and manage draft or published schedules.
          </p>
        </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexWrap: "wrap", width: "100%", justifyContent: "flex-start" }}>
            <div style={{ display: "grid", gap: 8, minWidth: 320, flex: "1 1 320px", maxWidth: 400 }}>
              <label style={{ fontSize: 12, color: "#5f6b90", fontWeight: 700 }}>Schedule Type</label>
              <select
                value={scheduleType}
                onChange={(event) => setScheduleType(event.target.value)}
                style={selectStyle(false)}
              >
                {SCHEDULE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={handleGenerateSchedule} style={{ ...primaryActionStyle(), width: 120, textAlign: "center" }}>
                <ActionButtonLabel icon={<GenerateIcon />}>
                  {schedule ? "Re-Generate" : "Generate"}
                </ActionButtonLabel>
              </button>
              <button type="button" onClick={handleSaveDraft} style={{ ...secondaryActionStyle(), width: 120, textAlign: "center" }}>
                <ActionButtonLabel icon={<SaveIcon />}>Save</ActionButtonLabel>
              </button>
              <button type="button" onClick={() => setShowDraftsPanel((prev) => !prev)} style={{ ...secondaryActionStyle(), width: 120, textAlign: "center" }}>
                <ActionButtonLabel icon={<DraftsIcon />}>Drafts ({draftsForCurrentSchedule.length})</ActionButtonLabel>
              </button>
              <button type="button" onClick={handlePublish} style={{ ...secondaryActionStyle(), width: 120, textAlign: "center" }}>
                <ActionButtonLabel icon={<PublishIcon />}>Publish</ActionButtonLabel>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDataRefreshToken((current) => current + 1);
                  showNotice("Data refreshed from local storage.", "success");
                }}
                style={{ ...secondaryActionStyle(), width: 120, textAlign: "center" }}
              >
                <ActionButtonLabel icon={<RefreshIcon />}>Refresh Data</ActionButtonLabel>
              </button>
              <button
                type="button"
                onClick={() => setShowSchedulingConfigurations((prev) => !prev)}
                style={{ ...secondaryActionStyle(), width: 120, textAlign: "center" }}
                aria-pressed={!showSchedulingConfigurations}
              >
                <ActionButtonLabel icon={showSchedulingConfigurations ? <HideConfigIcon /> : <ShowConfigIcon />}>
                  {showSchedulingConfigurations ? "Hide Config" : "Show Config"}
                </ActionButtonLabel>
              </button>
            </div>
          </div>
      </div>

      {notice.text ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: notice.type === "error" ? "#b53f4e" : "#2f5f3a",
            color: "#ffffff",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 10px 24px rgba(15, 27, 45, 0.2)",
            width: "fit-content",
            maxWidth: "100%",
          }}
        >
          {notice.text}
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

      <div style={{ display: "grid", gridTemplateColumns: showSchedulingConfigurations ? "1.8fr 1fr" : "1fr", gap: 12 }}>
        <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 12, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>Schedule Grid</h2>
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
              <select value={gridSessionFilter} onChange={(event) => setGridSessionFilter(event.target.value)} style={selectStyle(false)}>
                <option value="regular">Regular Session</option>
                <option value="shortened">Shortened Session</option>
              </select>
            </Field>

            <Field label="Grade Level">
              <select value={gridGradeFilter} onChange={(event) => setGridGradeFilter(event.target.value)} style={selectStyle(false)}>
                <option value="all">All Grades</option>
                {gridGradeOptions.map((grade) => (
                  <option key={grade} value={grade}>{`Grade ${grade}`}</option>
                ))}
              </select>
            </Field>

            {isJhsSchedule ? (
              <Field label="Section Type">
                <select value={gridSectionTypeFilter} onChange={(event) => setGridSectionTypeFilter(event.target.value)} style={selectStyle(false)}>
                  <option value="all">All Section Types</option>
                  {jhsSectionTypeOptions.map((sectionType) => (
                    <option key={sectionType} value={sectionType}>{sectionType}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Strand/Track">
                <select value={gridTrackFilter} onChange={(event) => setGridTrackFilter(event.target.value)} style={selectStyle(false)}>
                  <option value="all">All Strands/Tracks</option>
                  {shsTrackOptions.map((track) => (
                    <option key={track} value={track}>{track}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {sections.length === 0 ? (
            <p style={{ margin: "10px 0 0", color: "#7a86a7", fontSize: 13 }}>
              No sections available for this schedule type. Configure sections first.
            </p>
          ) : visibleSlots.length === 0 ? (
            <p style={{ margin: "10px 0 0", color: "#7a86a7", fontSize: 13 }}>
              {isJhsSchedule ? "No period slots available. Review scheduling configurations." : "No time slots available for the selected session filter."}
            </p>
          ) : visibleSections.length === 0 ? (
            <p style={{ margin: "10px 0 0", color: "#7a86a7", fontSize: 13 }}>
              No sections match the selected filters.
            </p>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #e5eaf4", borderRadius: 10 }}>
              <table style={{ borderCollapse: "collapse", minWidth: 170 + visibleSlots.length * 165 }}>
                <thead>
                  <tr>
                    <th style={stickyHeaderCellStyle()}>
                      Section
                    </th>
                    {visibleSlots.map((slot) => (
                      <th key={slot.id} style={headerCellStyle()}>
                        {isJhsSchedule ? (
                          <div style={{ display: "grid", gap: 2 }}>
                            <span style={{ fontWeight: 800 }}>{`P${slot.period}`}</span>
                            <span style={{ fontSize: 11 }}>
                              {(() => {
                                const timing = jhsPeriodTimingBySession.get(slot.period);
                                return timing ? `${timing.start} - ${timing.end}` : `${slot.start} - ${slot.end}`;
                              })()}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: "grid", gap: 2 }}>
                            <span>{slot.day}</span>
                            <span style={{ fontWeight: 800 }}>{`P${slot.period}`}</span>
                            <span style={{ fontSize: 11 }}>{`${slot.start} - ${slot.end}`}</span>
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleSections.map((section) => (
                    <tr key={section.id}>
                      <td style={stickyRowHeaderCellStyle()}>
                        <p style={{ margin: 0, color: "#25326f", fontSize: 12, fontWeight: 700 }}>{formatSectionDisplayName(section)}</p>
                        {section.level !== "jhs" ? (
                          <p style={{ margin: "3px 0 0", color: "#6b7898", fontSize: 11 }}>
                            {`${section.track || "No Track"} • Grade ${section.grade}`}
                          </p>
                        ) : null}
                      </td>

                      {visibleSlots.map((slot) => {
                        const allowed = isSlotValidForSection(section, slot, scheduleType, config);
                        const cellKey = createCellKey(section.id, slot.id);
                        const assignment = schedule?.assignments?.[cellKey] || null;
                        const cellDraft = getCellDraft(section.id, slot.id);
                        const subjectOptions = getSubjectsForSection(section, subjects, scheduleType);
                        const subjectOptionsWithState = subjectOptions.map((item) => ({
                          ...item,
                          restricted: isSubjectRestrictedForSlot(item, slot, config.constraints),
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
                              }))
                          : [];
                        const subject = assignment ? subjectsById.get(assignment.subjectId) : null;
                        const teacher = assignment ? facultyById.get(assignment.teacherId) : null;
                        const showEditor = allowed && hoveredCellKey === cellKey;
                        const draftSubject = !assignment && cellDraft.subjectId ? subjectsById.get(cellDraft.subjectId) : null;
                        const draftTeacher = !assignment && cellDraft.teacherId ? facultyById.get(cellDraft.teacherId) : null;

                        return (
                          <td
                            key={`${section.id}-${slot.id}`}
                            style={gridCellStyle(allowed, !!assignment)}
                            onMouseEnter={() => {
                              if (allowed) {
                                setHoveredCellKey(cellKey);
                              }
                            }}
                            onMouseLeave={() => {
                              if (hoveredCellKey === cellKey) {
                                setHoveredCellKey("");
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
                                  disabled={!cellDraft.subjectId}
                                >
                                  <option value="">Select teacher</option>
                                  {teacherOptions.map((option) => (
                                    <option key={option.id} value={option.id} disabled={option.restricted}>
                                      {option.restricted ? `${option.name} (Restricted)` : option.name}
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

        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          {showSchedulingConfigurations ? (
          <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 17 }}>Scheduling Configurations</h2>
              <span style={saveStatusPillStyle(configSaveStatus)}>{configSaveStatus === "saving" ? "Saving..." : "Saved"}</span>
            </div>

            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.35fr)", gap: 6 }}>
              <button type="button" onClick={() => setConfigPanel("jhs")} style={configPanelButtonStyle(configPanel === "jhs")}>JHS Config</button>
              <button type="button" onClick={() => setConfigPanel("shs")} style={configPanelButtonStyle(configPanel === "shs")}>SHS Config</button>
              <button type="button" onClick={() => setConfigPanel("constraints")} style={configPanelButtonStyle(configPanel === "constraints")}>Constraints & Rules</button>
            </div>

            {configPanel === "jhs" ? (
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                <Field label="Session Type">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                    <button type="button" onClick={() => setJhsSessionType("regular")} style={sessionToggleButtonStyle(jhsSessionType === "regular")}>
                      Regular Session
                    </button>
                    <button type="button" onClick={() => setJhsSessionType("shortened")} style={sessionToggleButtonStyle(jhsSessionType === "shortened")}>
                      Shortened Session
                    </button>
                  </div>
                </Field>

                <Field label="School Calendar">
                  <DayCheckboxRow
                    selectedDays={jhsSessionType === "regular" ? config.jhs.regularDays : config.jhs.shortenedDays}
                    secondaryDays={jhsSessionType === "regular" ? config.jhs.shortenedDays : config.jhs.regularDays}
                    onToggle={(day) => handleSessionDayToggle("jhs", jhsSessionType, day)}
                  />
                </Field>

                <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                  <p style={{ margin: 0, color: "#5f6b90", fontSize: 12, fontWeight: 700 }}>Period Structure</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
                  <div>
                    <Field label="Class Duration (minutes)">
                      <input
                        type="number"
                        min={30}
                        max={90}
                        value={jhsSessionType === "regular" ? config.jhs.periodMinutes.regular : config.jhs.periodMinutes.shortened}
                        onChange={(event) => {
                          const value = parseBoundedNumber(event.target.value, 30, 90, jhsSessionType === "regular" ? 50 : 45);
                          setConfig((prev) => ({
                            ...prev,
                            jhs: {
                              ...prev.jhs,
                              periodMinutes: {
                                ...prev.jhs.periodMinutes,
                                [jhsSessionType]: value,
                              },
                            },
                          }));
                        }}
                        style={inputStyle(false)}
                      />
                    </Field>
                  </div>

                  <div>
                    <Field label="Total Periods (Regular Sections)">
                      <input
                        type="number"
                        min={4}
                        max={12}
                        value={config.jhs.periods.regular}
                        onChange={(event) => {
                          const value = parseBoundedNumber(event.target.value, 4, 12, 8);
                          setConfig((prev) => ({
                            ...prev,
                            jhs: {
                              ...prev.jhs,
                              periods: {
                                ...prev.jhs.periods,
                                regular: value,
                              },
                            },
                          }));
                        }}
                        style={inputStyle(false)}
                      />
                    </Field>
                  </div>

                  <div>
                    <Field label="Total Periods (Special Sections)">
                      <input
                        type="number"
                        min={4}
                        max={12}
                        value={config.jhs.periods.special}
                        onChange={(event) => {
                          const value = parseBoundedNumber(event.target.value, 4, 12, 9);
                          setConfig((prev) => ({
                            ...prev,
                            jhs: {
                              ...prev.jhs,
                              periods: {
                                ...prev.jhs.periods,
                                special: value,
                              },
                            },
                          }));
                        }}
                        style={inputStyle(false)}
                      />
                    </Field>
                  </div>
                  </div>
                </div>

                <PeriodStructurePreview
                  title="Period Structure"
                  periodMinutes={config.jhs.periodMinutes[jhsSessionType]}
                  totalPeriods={Math.max(config.jhs.periods.regular, config.jhs.periods.special)}
                  breaks={config.jhs.breaks}
                  metaLabel={`Regular uses first ${config.jhs.periods.regular} period(s) • Special uses first ${config.jhs.periods.special} period(s)`}
                />

                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  <p style={{ margin: 0, color: "#5f6b90", fontSize: 12, fontWeight: 700 }}>Break Settings</p>
                  <BreakRowHeader />
                  <BreakRow label="Morning Break" value={getBreakConfig("jhs", config, "morning")} onChange={(nextBreak) => setBreakConfig("jhs", setConfig, "morning", nextBreak)} />
                  <BreakRow label="Lunch Break" value={getBreakConfig("jhs", config, "lunch")} onChange={(nextBreak) => setBreakConfig("jhs", setConfig, "lunch", nextBreak)} />
                  <BreakRow label="Afternoon Break" value={getBreakConfig("jhs", config, "afternoon")} onChange={(nextBreak) => setBreakConfig("jhs", setConfig, "afternoon", nextBreak)} />
                </div>
              </div>
            ) : null}

            {configPanel === "shs" ? (
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                <Field label="Session Type">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                    <button type="button" onClick={() => setShsSessionType("regular")} style={sessionToggleButtonStyle(shsSessionType === "regular")}>
                      Regular Session
                    </button>
                    <button type="button" onClick={() => setShsSessionType("shortened")} style={sessionToggleButtonStyle(shsSessionType === "shortened")}>
                      Shortened Session
                    </button>
                  </div>
                </Field>

                <Field label="School Calendar">
                  <DayCheckboxRow
                    selectedDays={shsSessionType === "regular" ? config.shs.regularDays : config.shs.shortenedDays}
                    secondaryDays={shsSessionType === "regular" ? config.shs.shortenedDays : config.shs.regularDays}
                    onToggle={(day) => handleSessionDayToggle("shs", shsSessionType, day)}
                  />
                </Field>

                <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                  <p style={{ margin: 0, color: "#5f6b90", fontSize: 12, fontWeight: 700 }}>Period Structure</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
                  <div>
                    <Field label="Class Duration (minutes)">
                      <input
                        type="number"
                        min={30}
                        max={90}
                        value={shsSessionType === "regular" ? config.shs.periodMinutes.regular : config.shs.periodMinutes.shortened}
                        onChange={(event) => {
                          const value = parseBoundedNumber(event.target.value, 30, 90, shsSessionType === "regular" ? 50 : 45);
                          setConfig((prev) => ({
                            ...prev,
                            shs: {
                              ...prev.shs,
                              periodMinutes: {
                                ...prev.shs.periodMinutes,
                                [shsSessionType]: value,
                              },
                            },
                          }));
                        }}
                        style={inputStyle(false)}
                      />
                    </Field>
                  </div>

                  <div>
                    <Field label="Total Periods">
                      <input
                        type="number"
                        min={4}
                        max={12}
                        value={config.shs.periods.default}
                        onChange={(event) => {
                          const value = parseBoundedNumber(event.target.value, 4, 12, 8);
                          setConfig((prev) => ({
                            ...prev,
                            shs: {
                              ...prev.shs,
                              periods: {
                                ...prev.shs.periods,
                                default: value,
                                track: TRACKS.reduce((accumulator, track) => {
                                  accumulator[track] = value;
                                  return accumulator;
                                }, {}),
                              },
                            },
                          }));
                        }}
                        style={inputStyle(false)}
                      />
                    </Field>
                  </div>
                  </div>
                </div>

                <PeriodStructurePreview
                  title="Period Structure"
                  periodMinutes={config.shs.periodMinutes[shsSessionType]}
                  totalPeriods={config.shs.periods.default}
                  breaks={config.shs.breaks}
                />

                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  <p style={{ margin: 0, color: "#5f6b90", fontSize: 12, fontWeight: 700 }}>Break Settings</p>
                  <BreakRowHeader />
                  <BreakRow label="Morning Break" value={getBreakConfig("shs-first", config, "morning")} onChange={(nextBreak) => setBreakConfig("shs-first", setConfig, "morning", nextBreak)} />
                  <BreakRow label="Lunch Break" value={getBreakConfig("shs-first", config, "lunch")} onChange={(nextBreak) => setBreakConfig("shs-first", setConfig, "lunch", nextBreak)} />
                  <BreakRow label="Afternoon Break" value={getBreakConfig("shs-first", config, "afternoon")} onChange={(nextBreak) => setBreakConfig("shs-first", setConfig, "afternoon", nextBreak)} />
                </div>
              </div>
            ) : null}

            {configPanel === "constraints" ? (
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                <div style={{ border: "1px solid #e3e7ef", borderRadius: 10, padding: 10, background: "#fbfcff" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <p style={{ margin: 0, color: "#1f2c6f", fontSize: 14, fontWeight: 700 }}>Faculty Restrictions</p>
                    <span style={{ color: "#5f6b90", fontSize: 12, fontWeight: 700 }}>Active: {effectiveTeacherRestrictions.length}</span>
                  </div>

                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                    {!showTeacherRestrictionEditor ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowTeacherRestrictionEditor(true);
                          setTeacherRestrictionForm(EMPTY_TEACHER_RESTRICTION_FORM);
                        }}
                        style={smallActionStyle()}
                      >
                        + Add Restriction
                      </button>
                    ) : (
                      <div style={{ border: "1px solid #e4e9f5", borderRadius: 10, padding: 12, background: "#ffffff", display: "grid", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <p style={{ margin: 0, color: "#1f2c6f", fontSize: 15, fontWeight: 700 }}>Add Faculty Restriction</p>
                          <button
                            type="button"
                            onClick={() => {
                              setTeacherRestrictionForm(EMPTY_TEACHER_RESTRICTION_FORM);
                              setShowTeacherRestrictionEditor(false);
                            }}
                            style={{ border: "none", background: "transparent", color: "#8191b2", fontSize: 22, lineHeight: 1, cursor: "pointer", padding: 0 }}
                            aria-label="Close"
                          >
                            ×
                          </button>
                        </div>

                        <Field label="Who to restrict?">
                          <select
                            value={
                              teacherRestrictionForm.targetType === "ancillary-task" && teacherRestrictionForm.ancillaryTask
                                ? `ancillary-task:${teacherRestrictionForm.ancillaryTask}`
                                : teacherRestrictionForm.targetType
                            }
                            onChange={(event) => {
                              const selectedValue = event.target.value;
                              if (selectedValue.startsWith("ancillary-task:")) {
                                setTeacherRestrictionForm((prev) => ({
                                  ...prev,
                                  targetType: "ancillary-task",
                                  ancillaryTask: selectedValue.slice("ancillary-task:".length),
                                  teacherId: "",
                                }));
                                return;
                              }

                              setTeacherRestrictionForm((prev) => ({
                                ...prev,
                                targetType: selectedValue,
                                teacherId: "",
                                ancillaryTask: "",
                              }));
                            }}
                            style={selectStyle(false)}
                          >
                            <option value="">-- Select --</option>
                            <option value="specific-teacher">Specific Teacher</option>
                            <option value="all-with-ancillary">All Teachers with Ancillary Tasks</option>
                            {ancillaryTaskOptions.length ? <option value="" disabled>— Ancillary Roles —</option> : null}
                            {ancillaryTaskOptions.map((task) => (
                              <option key={task} value={`ancillary-task:${task}`}>{task}</option>
                            ))}
                          </select>
                        </Field>

                        {teacherRestrictionForm.targetType === "specific-teacher" ? (
                          <Field label="Select Teacher">
                            <select
                              value={teacherRestrictionForm.teacherId}
                              onChange={(event) => setTeacherRestrictionForm((prev) => ({ ...prev, teacherId: event.target.value }))}
                              style={selectStyle(false)}
                            >
                              <option value="">-- Select Teacher --</option>
                              {teacherRestrictionOptions.map((item) => (
                                <option key={item.id} value={item.id}>{item.label}</option>
                              ))}
                            </select>
                          </Field>
                        ) : null}

                        <div style={{ display: "grid", gap: 6 }}>
                          <p style={{ margin: 0, color: "#3f4f6f", fontSize: 13, fontWeight: 700 }}>Cannot teach periods:</p>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                            {restrictionPeriodOptions.map((periodLabel) => {
                              const checked = teacherRestrictionForm.periodLabels.includes(periodLabel);

                              return (
                                <label
                                  key={periodLabel}
                                  style={{
                                    border: "1px solid #d6deee",
                                    borderRadius: 6,
                                    background: "#ffffff",
                                    height: 38,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "0 10px",
                                    color: "#2f3a73",
                                    fontSize: 12,
                                    cursor: "pointer",
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

                                        return {
                                          ...prev,
                                          periodLabels: normalizeStringArray(next),
                                        };
                                      });
                                    }}
                                  />
                                  {periodLabel}
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div style={{ borderTop: "1px solid #e4e9f5", paddingTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setTeacherRestrictionForm(EMPTY_TEACHER_RESTRICTION_FORM);
                              setShowTeacherRestrictionEditor(false);
                            }}
                            style={secondaryActionStyle()}
                          >
                            Cancel
                          </button>
                          <button type="button" onClick={addTeacherRestriction} style={primaryActionStyle()}>
                            Save Restriction
                          </button>
                        </div>
                      </div>
                    )}

                    {effectiveTeacherRestrictions.map((entry) => (
                      <div key={entry.teacherId} style={restrictionRowStyle()}>
                        <div>
                          <p style={{ margin: 0, color: "#27356f", fontSize: 13, fontWeight: 700 }}>{entry.teacherName || entry.teacherId}</p>
                          <p style={{ margin: "2px 0 0", color: "#667398", fontSize: 12 }}>{`Cannot teach: ${(entry.periodLabels || []).join(", ") || "—"}`}</p>
                        </div>
                        <button type="button" onClick={() => removeTeacherRestriction(entry.teacherId)} style={smallDangerStyle()}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ border: "1px solid #e3e7ef", borderRadius: 10, padding: 10, background: "#fbfcff" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <p style={{ margin: 0, color: "#1f2c6f", fontSize: 14, fontWeight: 700 }}>Subject Constraints</p>
                    <span style={{ color: "#5f6b90", fontSize: 12, fontWeight: 700 }}>Active: {(config.constraints.subjectRestrictions || []).length}</span>
                  </div>

                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                    {!showSubjectRestrictionEditor ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowSubjectRestrictionEditor(true);
                          setSubjectRestrictionForm(EMPTY_SUBJECT_RESTRICTION_FORM);
                        }}
                        style={smallActionStyle()}
                      >
                        + Add Constraint
                      </button>
                    ) : (
                      <div style={{ border: "1px solid #e4e9f5", borderRadius: 10, padding: 12, background: "#ffffff", display: "grid", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <p style={{ margin: 0, color: "#1f2c6f", fontSize: 15, fontWeight: 700 }}>Add Subject Constraint</p>
                          <button
                            type="button"
                            onClick={() => {
                              setSubjectRestrictionForm(EMPTY_SUBJECT_RESTRICTION_FORM);
                              setShowSubjectRestrictionEditor(false);
                            }}
                            style={{ border: "none", background: "transparent", color: "#8191b2", fontSize: 22, lineHeight: 1, cursor: "pointer", padding: 0 }}
                            aria-label="Close"
                          >
                            ×
                          </button>
                        </div>

                        <Field label="Subject Name">
                          <select
                            value={subjectRestrictionForm.subjectId}
                            onChange={(event) => {
                              const selectedId = event.target.value;
                              const selected = subjectRestrictionOptions.find((item) => item.id === selectedId);

                              setSubjectRestrictionForm((prev) => ({
                                ...prev,
                                subjectId: selectedId,
                                subjectQuery: selected?.label || "",
                              }));
                            }}
                            style={selectStyle(false)}
                          >
                            <option value="">-- Select Subject --</option>
                            {subjectRestrictionOptions.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <div style={{ display: "grid", gap: 6 }}>
                          <p style={{ margin: 0, color: "#3f4f6f", fontSize: 13, fontWeight: 700 }}>Avoid these periods:</p>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                            {restrictionPeriodOptions.map((periodLabel) => {
                              const checked = subjectRestrictionForm.periodLabels.includes(periodLabel);

                              return (
                                <label
                                  key={periodLabel}
                                  style={{
                                    border: "1px solid #d6deee",
                                    borderRadius: 6,
                                    background: "#ffffff",
                                    height: 38,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "0 10px",
                                    color: "#2f3a73",
                                    fontSize: 12,
                                    cursor: "pointer",
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

                                        return {
                                          ...prev,
                                          periodLabels: normalizeStringArray(next),
                                        };
                                      });
                                    }}
                                  />
                                  {periodLabel}
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <Field label="Reason (optional)">
                          <input
                            type="text"
                            value={subjectRestrictionForm.reason}
                            onChange={(event) =>
                              setSubjectRestrictionForm((prev) => ({
                                ...prev,
                                reason: event.target.value,
                              }))
                            }
                            placeholder="e.g., heat concerns, lab availability"
                            style={inputStyle(false)}
                          />
                        </Field>

                        <div style={{ borderTop: "1px solid #e4e9f5", paddingTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSubjectRestrictionForm(EMPTY_SUBJECT_RESTRICTION_FORM);
                              setShowSubjectRestrictionEditor(false);
                            }}
                            style={secondaryActionStyle()}
                          >
                            Cancel
                          </button>
                          <button type="button" onClick={addSubjectRestriction} style={primaryActionStyle()}>
                            Save Constraint
                          </button>
                        </div>
                      </div>
                    )}

                    {subjectRestrictionsForDisplay.map((entry) => (
                      <div key={entry.subjectId} style={restrictionRowStyle()}>
                        <div>
                          <p style={{ margin: 0, color: "#27356f", fontSize: 13, fontWeight: 700 }}>{entry.subjectCode ? `${entry.subjectCode} — ${entry.subjectName}` : entry.subjectName}</p>
                          <p style={{ margin: "2px 0 0", color: "#667398", fontSize: 12 }}>{`Avoid: ${(entry.periodLabels || []).join(", ") || "—"}`}</p>
                          {entry.reason ? <p style={{ margin: "2px 0 0", color: "#7a86a7", fontSize: 12 }}>{`Reason: ${entry.reason}`}</p> : null}
                        </div>
                        <button type="button" onClick={() => removeSubjectRestriction(entry.subjectId)} style={smallDangerStyle()}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          ) : null}

          {showDraftsPanel ? (
            <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 12 }}>
              <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 17 }}>Draft Schedules</h2>

              {draftsForCurrentSchedule.length === 0 ? (
                <p style={{ margin: "10px 0 0", color: "#7a86a7", fontSize: 13 }}>No drafts for this schedule type yet.</p>
              ) : (
                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {draftsForCurrentSchedule.map((draft) => (
                    <div
                      key={draft.id}
                      style={{
                        border: "1px solid #e3e7ef",
                        borderRadius: 10,
                        padding: 10,
                        background: "#fbfcff",
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <p style={{ margin: 0, color: "#27336f", fontSize: 13, fontWeight: 700 }}>{draft.name}</p>
                      <p style={{ margin: 0, color: "#6b7898", fontSize: 12 }}>Updated: {formatDateTime(draft.updatedAt)}</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => handleLoadDraft(draft.id)} style={smallActionStyle()}>
                          Load
                        </button>
                        <button type="button" onClick={() => handleDeleteDraft(draft.id)} style={smallDangerStyle()}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {schedule?.conflicts?.length ? (
        <div style={{ background: "#fff7f8", border: "1px solid #f0c9cf", borderRadius: 12, padding: 12 }}>
          <h3 style={{ margin: 0, color: "#a44652", fontSize: 14 }}>Detected Conflicts ({schedule.conflicts.length})</h3>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#8a4a55", fontSize: 12, display: "grid", gap: 4 }}>
            {schedule.conflicts.slice(0, 12).map((conflict, index) => (
              <li key={`${conflict}-${index}`}>{conflict}</li>
            ))}
          </ul>
          {schedule.conflicts.length > 12 ? (
            <p style={{ margin: "8px 0 0", color: "#8a4a55", fontSize: 12 }}>
              +{schedule.conflicts.length - 12} more conflict(s)
            </p>
          ) : null}
        </div>
      ) : null}
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
      const gradeLevel = schoolLevel === "jhs" ? "7-10" : sanitizeText(subject?.gradeLevel);
      const strand = sanitizeText(subject?.strand).toUpperCase();
      const semester = sanitizeText(subject?.semester);
      const hoursPerWeek = parseBoundedNumber(subject?.hoursPerWeek, 1, 12, 1);
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
        hoursPerWeek,
      };
    })
    .filter((subject) => !!subject.subjectName);
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
      ancillaryAssignments: normalizeStringArray(teacher?.ancillaryAssignments),
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

  const teacherBusyBySlot = new Map();
  const teacherLoad = new Map(activeTeachers.map((teacher) => [teacher.id, 0]));

  sections.forEach((section) => {
    const eligibleSubjects = getSubjectsForSection(section, subjects, scheduleType);

    if (eligibleSubjects.length === 0) {
      conflicts.push(`${section.name}: no eligible subjects found.`);
      return;
    }

    const remainingHours = eligibleSubjects.map((subject) => ({ ...subject, remaining: subject.hoursPerWeek }));
    const validSlots = slots.filter((slot) => isSlotValidForSection(section, slot, scheduleType, config));

    validSlots.forEach((slot) => {

      const subjectCandidates = remainingHours
        .filter((subject) => subject.remaining > 0)
        .sort((left, right) => right.remaining - left.remaining);

      if (subjectCandidates.length === 0) {
        return;
      }

      let selectedPair = null;

      for (const subject of subjectCandidates) {
        const teacherCandidates = activeTeachers
          .filter((teacher) =>
            isTeacherEligible({
              teacher,
              subject,
              section,
              slot,
              constraints: config.constraints,
              teacherBusyBySlot,
              excludedSectionId: section.id,
            })
          )
          .sort((left, right) => {
            const leftLoad = teacherLoad.get(left.id) || 0;
            const rightLoad = teacherLoad.get(right.id) || 0;
            return leftLoad - rightLoad;
          });

        if (teacherCandidates.length > 0) {
          selectedPair = { subject, teacher: teacherCandidates[0] };
          break;
        }
      }

      if (!selectedPair) {
        conflicts.push(`${section.name} ${slot.label}: no eligible teacher available.`);
        return;
      }

      const cellKey = createCellKey(section.id, slot.id);
      assignments[cellKey] = {
        subjectId: selectedPair.subject.id,
        teacherId: selectedPair.teacher.id,
        source: "auto",
        updatedAt: new Date().toISOString(),
      };

      selectedPair.subject.remaining -= 1;

      const busyForTeacher = teacherBusyBySlot.get(selectedPair.teacher.id) || new Map();
      busyForTeacher.set(slot.id, section.id);
      teacherBusyBySlot.set(selectedPair.teacher.id, busyForTeacher);

      teacherLoad.set(selectedPair.teacher.id, (teacherLoad.get(selectedPair.teacher.id) || 0) + 1);
    });

    const remainingTotal = remainingHours.reduce((total, subject) => total + subject.remaining, 0);
    if (remainingTotal > 0) {
      conflicts.push(`${section.name}: ${remainingTotal} subject-hour slot(s) unassigned.`);
    }
  });

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
    teacherLoadPercent: evaluation.teacherLoadPercent,
    status: "draft",
  };
}

function evaluateSchedule({ assignments, sections, slots, subjects, teachers, scheduleType, config }) {
  const sectionsById = new Map(sections.map((section) => [section.id, section]));
  const slotsById = new Map(slots.map((slot) => [slot.id, slot]));
  const subjectsById = new Map(subjects.map((subject) => [subject.id, subject]));
  const teachersById = new Map(teachers.map((teacher) => [teacher.id, teacher]));

  const teacherSlotMap = new Map();
  const conflicts = [];
  const teacherLoadCount = new Map();

  Object.entries(assignments || {}).forEach(([cellKey, assignment]) => {
    const [sectionId, slotId] = splitCellKey(cellKey);
    const section = sectionsById.get(sectionId);
    const slot = slotsById.get(slotId);
    const subject = subjectsById.get(assignment.subjectId);
    const teacher = teachersById.get(assignment.teacherId);

    if (!section || !slot || !subject || !teacher) {
      conflicts.push(`Invalid assignment reference in ${cellKey}.`);
      return;
    }

    if (!isSlotValidForSection(section, slot, scheduleType, config)) {
      conflicts.push(`${section.name} ${slot.label}: period not valid for section settings.`);
    }

    const teacherRestrictedPeriods = getTeacherRestrictedPeriods(teacher.id, config.constraints);
    if (matchesRestrictedPeriod(slot, teacherRestrictedPeriods)) {
      conflicts.push(`${section.name} ${slot.label}: ${teacher.name} is restricted for this period.`);
    }

    const subjectRestrictedPeriods = getSubjectRestrictedPeriods(subject.id, config.constraints);
    if (matchesRestrictedPeriod(slot, subjectRestrictedPeriods)) {
      conflicts.push(`${section.name} ${slot.label}: ${subject.subjectCode || subject.subjectName} is restricted for this period.`);
    }

    if (config.constraints.enforceUnavailablePeriods) {
      const unavailable = matchesUnavailablePeriod(slot, teacher.unavailablePeriods);
      if (unavailable) {
        conflicts.push(`${section.name} ${slot.label}: ${teacher.name} is unavailable.`);
      }
    }

    if (config.constraints.enforceExpertiseAndGradeMatch) {
      if (!doesTeacherMatchGrade(teacher, section.grade)) {
        conflicts.push(`${section.name} ${slot.label}: ${teacher.name} does not match Grade ${section.grade}.`);
      }

      if (!doesTeacherMatchSubject(teacher, subject)) {
        conflicts.push(`${section.name} ${slot.label}: ${teacher.name} lacks subject expertise for ${subject.subjectCode || subject.subjectName}.`);
      }
    }

    if (config.constraints.enforceNoDoubleBooking) {
      const teacherSlots = teacherSlotMap.get(teacher.id) || new Map();
      const existingSectionId = teacherSlots.get(slot.id);
      if (existingSectionId && existingSectionId !== section.id) {
        const existingSection = sectionsById.get(existingSectionId);
        conflicts.push(
          `${teacher.name} double-booked at ${slot.label} (${existingSection?.name || existingSectionId} and ${section.name}).`
        );
      }

      teacherSlots.set(slot.id, section.id);
      teacherSlotMap.set(teacher.id, teacherSlots);
    }

    teacherLoadCount.set(teacher.id, (teacherLoadCount.get(teacher.id) || 0) + 1);
  });

  const teacherLoadPercent = {};
  teachers.forEach((teacher) => {
    const loadCount = teacherLoadCount.get(teacher.id) || 0;
    teacherLoadPercent[teacher.id] = Math.round((loadCount / MAX_TEACHER_LOAD_BASE) * 100);
  });

  return {
    conflicts: Array.from(new Set(conflicts)),
    teacherLoadPercent,
  };
}

function getSubjectsForSection(section, subjects, scheduleType) {
  if (!section) {
    return [];
  }

  if (scheduleType === "jhs") {
    const scoped = subjects.filter((subject) => subject.schoolLevel === "jhs");

    const classification = String(section.classification || "").toLowerCase();
    const isSpecialSection = classification.includes("special");
    const filtered = scoped.filter((subject) => {
      const type = String(subject.subjectType || "").toLowerCase();

      if (isSpecialSection) {
        return type === "core" || type === "specialized" || type === "";
      }

      return type === "core" || type === "";
    });

    return sortSubjectsByTypeAndName(filtered);
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

    const strand = String(subject.strand || "").toUpperCase();
    return !!strand && strand === String(section.track || "").toUpperCase();
  });

  return sortSubjectsByTypeAndName(filtered);
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

function buildSlots(scheduleType, config) {
  const levelConfig = scheduleType === "jhs" ? config.jhs : config.shs;

  if (scheduleType === "jhs") {
    const maxPeriods = Math.max(levelConfig.periods.regular, levelConfig.periods.special);
    const result = [];
    let cursor = parseTimeToMinutes("07:30");

    for (let period = 1; period <= maxPeriods; period += 1) {
      const start = minutesToTime(cursor);
      const endMinutes = cursor + levelConfig.periodMinutes.regular;
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

      cursor = endMinutes;

      getEnabledBreaks(levelConfig.breaks).forEach((entry) => {
        if (entry.afterPeriod === period) {
          cursor += entry.duration;
        }
      });
    }

    return result;
  }

  const regularDays = normalizeDays(levelConfig.regularDays);
  const shortenedDays = normalizeDays(levelConfig.shortenedDays.length ? levelConfig.shortenedDays : DAYS.filter((day) => !regularDays.includes(day)));
  const daySequence = DAYS.filter((day) => regularDays.includes(day) || shortenedDays.includes(day));

  if (daySequence.length === 0) {
    return [];
  }

  const maxPeriods =
    scheduleType === "jhs"
      ? Math.max(levelConfig.periods.regular, levelConfig.periods.special)
      : Math.max(levelConfig.periods.default, ...Object.values(levelConfig.periods.track));

  const result = [];

  daySequence.forEach((day) => {
    const sessionType = shortenedDays.includes(day) ? "shortened" : "regular";
    const periodMinutes = sessionType === "shortened" ? levelConfig.periodMinutes.shortened : levelConfig.periodMinutes.regular;
    let cursor = parseTimeToMinutes("07:30");

    for (let period = 1; period <= maxPeriods; period += 1) {
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
    const maxPeriod = isSpecial ? config.jhs.periods.special : config.jhs.periods.regular;
    return slot.period <= maxPeriod;
  }

  const trackPeriods = config.shs.periods.track[String(section.track || "").toUpperCase()];
  const maxPeriod = Number.isFinite(trackPeriods) ? trackPeriods : config.shs.periods.default;
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

  const teacherRestrictedPeriods = getTeacherRestrictedPeriods(teacher.id, constraints);
  if (matchesRestrictedPeriod(slot, teacherRestrictedPeriods)) {
    return false;
  }

  const subjectRestrictedPeriods = getSubjectRestrictedPeriods(subject.id, constraints);
  if (matchesRestrictedPeriod(slot, subjectRestrictedPeriods)) {
    return false;
  }

  if (constraints.enforceNoDoubleBooking) {
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

function getTeacherRestrictedPeriods(teacherId, constraints) {
  const restrictions = Array.isArray(constraints?.teacherRestrictions) ? constraints.teacherRestrictions : [];
  const matched = restrictions.find((entry) => entry.teacherId === teacherId);
  return matched ? normalizeStringArray(matched.periodLabels) : [];
}

function matchesRestrictedPeriod(slot, restrictedPeriods) {
  const restrictions = normalizeStringArray(restrictedPeriods).map((entry) => sanitizeText(entry).toLowerCase());
  if (!restrictions.length) {
    return false;
  }

  const slotLabel = sanitizeText(slot?.label).toLowerCase();
  const periodToken = `p${parseBoundedNumber(slot?.period, 1, 20, 1)}`;

  return restrictions.some((entry) => entry === slotLabel || entry === periodToken);
}

function matchesUnavailablePeriod(slot, unavailablePeriods) {
  const restrictions = normalizeStringArray(unavailablePeriods).map((entry) => sanitizeText(entry).toLowerCase());
  if (!restrictions.length) {
    return false;
  }

  const slotLabel = sanitizeText(slot?.label).toLowerCase();
  const periodToken = `p${parseBoundedNumber(slot?.period, 1, 20, 1)}`;

  return restrictions.some((entry) => {
    if (entry === slotLabel || entry === periodToken) {
      return true;
    }

    const parts = entry.split(/\s+/u);
    const trailingToken = parts[parts.length - 1];
    return trailingToken === periodToken;
  });
}

function buildJhsPeriodTimingMap(jhsConfig, sessionType) {
  const maxPeriods = Math.max(jhsConfig?.periods?.regular || 0, jhsConfig?.periods?.special || 0);
  const periodMinutes = sessionType === "shortened" ? jhsConfig?.periodMinutes?.shortened : jhsConfig?.periodMinutes?.regular;
  const timingMap = new Map();
  let cursor = parseTimeToMinutes("07:30");

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

function getSubjectRestrictedPeriods(subjectId, constraints) {
  const restrictions = Array.isArray(constraints?.subjectRestrictions) ? constraints.subjectRestrictions : [];
  const matched = restrictions.find((entry) => entry.subjectId === subjectId);
  return matched ? normalizeStringArray(matched.periodLabels) : [];
}

function isSubjectRestrictedForSlot(subject, slot, constraints) {
  if (!subject || !slot) {
    return false;
  }

  const restrictedPeriods = getSubjectRestrictedPeriods(subject.id, constraints);
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
    return { include: false, restricted: false };
  }

  if (teacher.active === false) {
    return { include: false, restricted: false };
  }

  if (constraints.enforceExpertiseAndGradeMatch) {
    if (!doesTeacherMatchGrade(teacher, section.grade) || !doesTeacherMatchSubject(teacher, subject)) {
      return { include: false, restricted: false };
    }
  }

  if (constraints.enforceNoDoubleBooking) {
    const teacherBusySlots = teacherBusyBySlot.get(teacher.id);
    if (teacherBusySlots && teacherBusySlots.has(slot.id)) {
      const existingSectionId = teacherBusySlots.get(slot.id);
      if (existingSectionId && existingSectionId !== excludedSectionId) {
        return { include: false, restricted: false };
      }
    }
  }

  let periodRestricted = false;

  if (constraints.enforceUnavailablePeriods && matchesUnavailablePeriod(slot, teacher.unavailablePeriods)) {
    periodRestricted = true;
  }

  const teacherRestrictedPeriods = getTeacherRestrictedPeriods(teacher.id, constraints);
  if (matchesRestrictedPeriod(slot, teacherRestrictedPeriods)) {
    periodRestricted = true;
  }

  return { include: true, restricted: periodRestricted };
}

function doesTeacherMatchGrade(teacher, grade) {
  const target = `grade ${grade}`;
  return teacher.gradeLevelAssignments.some((entry) => sanitizeText(entry).toLowerCase() === target);
}

function doesTeacherMatchSubject(teacher, subject) {
  const expertise = teacher.subjectExpertise.map((entry) => sanitizeText(entry).toLowerCase());
  if (expertise.length === 0) {
    return false;
  }

  const code = sanitizeText(subject.subjectCode).toLowerCase();
  const name = sanitizeText(subject.subjectName).toLowerCase();
  const label = `${code} — ${name}`;

  return expertise.some((entry) => {
    if (!entry) {
      return false;
    }

    if (code && entry.includes(code)) {
      return true;
    }

    if (name && entry.includes(name)) {
      return true;
    }

    return entry === label;
  });
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

  const updated = facultyList.map((teacher) => {
    const nextPercent = teacherLoadPercent?.[teacher.id];

    return {
      ...teacher,
      assignedLoadPercent: Number.isFinite(nextPercent) ? nextPercent : Number(teacher.assignedLoadPercent) || 0,
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

  return {
    jhs: {
      ...DEFAULT_CONFIG.jhs,
      ...(saved.jhs || {}),
      periodMinutes: {
        ...DEFAULT_CONFIG.jhs.periodMinutes,
        ...(saved.jhs?.periodMinutes || {}),
      },
      periods: {
        ...DEFAULT_CONFIG.jhs.periods,
        ...(saved.jhs?.periods || {}),
      },
      breaks: {
        ...DEFAULT_CONFIG.jhs.breaks,
        ...(saved.jhs?.breaks || {}),
      },
    },
    shs: {
      ...DEFAULT_CONFIG.shs,
      ...(saved.shs || {}),
      periodMinutes: {
        ...DEFAULT_CONFIG.shs.periodMinutes,
        ...(saved.shs?.periodMinutes || {}),
      },
      periods: {
        ...DEFAULT_CONFIG.shs.periods,
        ...(saved.shs?.periods || {}),
        track: {
          ...DEFAULT_CONFIG.shs.periods.track,
          ...(saved.shs?.periods?.track || {}),
        },
      },
      breaks: {
        ...DEFAULT_CONFIG.shs.breaks,
        ...(saved.shs?.breaks || {}),
      },
    },
    constraints: {
      ...DEFAULT_CONFIG.constraints,
      ...(saved.constraints || {}),
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
    },
  };
}

function parseBoundedNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
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

function gridCellStyle(allowed, hasAssignment) {
  return {
    borderBottom: "1px solid #e7ecf6",
    borderRight: "1px solid #edf1f9",
    background: !allowed ? "#f7f8fc" : hasAssignment ? "#eef2ff" : "#ffffff",
    textAlign: "center",
    verticalAlign: "middle",
    padding: 6,
    minHeight: 56,
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
