// Utility to get schedule draft and config from localStorage
function getScheduleDraftAndConfig() {
  try {
    const draftRaw = localStorage.getItem("turotugma_schedule_drafts");
    const configRaw = localStorage.getItem("turotugma_schedule_configurations");
    let draftArr = draftRaw ? JSON.parse(draftRaw) : null;
    // Use the first draft object if array, else null
    const draft = Array.isArray(draftArr) && draftArr.length > 0 ? draftArr[0] : null;
    const config = configRaw ? JSON.parse(configRaw) : null;
    // Prefer config from draft if available
    const activeConfig = draft?.config?.jhs || config || {};
    return { draft, config: activeConfig };
  } catch {
    return { draft: null, config: {} };
  }
}

// Calculate teacher loads in minutes and percent
function calculateTeacherLoads(facultyList) {
  const { draft, config } = getScheduleDraftAndConfig();
  if (!draft || !draft.schedule || !draft.schedule.assignments) return facultyList.map(f => ({ ...f, assignedLoadPercent: 0 }));

  // Get periods per day (use the larger value)
  const periodsPerDay = Math.max(
    Number(config.periods?.regular || 0),
    Number(config.periods?.special || 0)
  );
  // Get days of week
  const regularDays = config.regularDays || [];
  const shortenedDays = config.shortenedDays || [];
  const periodMinutes = config.periodMinutes || { regular: 50, shortened: 45 };

  // Calculate balanced min/max using fixed values (4 and 6) as per user formula
  const minBalanced = (4 * regularDays.length * periodMinutes.regular) + (4 * shortenedDays.length * periodMinutes.shortened);
  const maxBalanced = (6 * regularDays.length * periodMinutes.regular) + (6 * shortenedDays.length * periodMinutes.shortened);

  // Improved calculation: count assigned classes per regular and shortened day, multiply by day count and interval, then sum
  const teacherMinutes = {};
  // Build a mapping of teacherId to assigned classes per day type
  facultyList.forEach(faculty => {
    // Count unique periods assigned to this teacher (e.g., all JHS-Px for this teacherId)
    let assignedPeriods = new Set();
    if (draft.schedule && draft.schedule.assignments) {
      Object.entries(draft.schedule.assignments).forEach(([key, assignment]) => {
        if (assignment.teacherId !== faculty.id) return;
        // Only count JHS-Px periods
        const periodMatch = key.match(/\|JHS-P(\d+)/);
        if (periodMatch) {
          assignedPeriods.add(periodMatch[0]);
        }
      });
    }
    const periodCount = assignedPeriods.size;
    // Calculate total minutes for the week
    const totalMinutes = (periodCount * regularDays.length * periodMinutes.regular) + (periodCount * shortenedDays.length * periodMinutes.shortened);
    teacherMinutes[faculty.id] = totalMinutes;
  });

  // Calculate percent for each teacher
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
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

const FACULTY_STORAGE_KEY = "turotugma_faculty";
const SUBJECTS_STORAGE_KEY = "turotugma_subjects";
const SCHEDULE_PERIODS_KEY = "turotugma_schedule_unavailable_periods";

const SEX_OPTIONS = ["Male", "Female", "Prefer not to say", "Other"];
const EMPLOYMENT_STATUS_OPTIONS = ["Regular", "Probationary", "Part-Time"];
const DEPED_DESIGNATION_OPTIONS = [
  "Teacher I",
  "Teacher II",
  "Teacher III",
  "Master Teacher I",
  "Master Teacher II",
  "Master Teacher III",
  "Master Teacher IV",
  "Master Teacher V",
  "Head Teacher I",
  "Head Teacher II",
  "Head Teacher III",
  "Head Teacher IV",
  "Head Teacher V",
  "Head Teacher VI",
];
const GRADE_LEVEL_OPTIONS = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const FALLBACK_PERIOD_OPTIONS = Array.from({ length: 12 }, (_, index) => `P${index + 1}`);
const DEGREE_SUGGESTIONS = ["BSEd", "BEEd", "BS Math", "BS English", "BS Biology", "BS Physics", "MAEd", "MEd", "PhD"];
const MAJOR_SUGGESTIONS = ["Mathematics", "English", "Filipino", "Science", "Araling Panlipunan", "TLE", "ICT", "HUMSS", "ABM", "STEM"];
const MINOR_SUGGESTIONS = ["Mathematics", "English", "Filipino", "Science", "Values Education", "MAPEH", "Computer", "None"];
const ANCILLARY_POOL = [
  "Sports Development Office Adviser",
  "Campus Journalism Coach",
  "Science Club Moderator",
  "Language Coordinator",
  "DRRM Coordinator",
  "ICT Laboratory In-Charge",
  "SPA Program Coordinator",
  "Entrepreneurship Coordinator",
  "Guidance Support Staff",
  "Research Coordinator",
];

const EMPTY_FORM = {
  name: "",
  sex: "",
  employeeId: "",
  position: "",
  employmentStatus: "Regular",
  email: "",
  contact: "",
  degree: "",
  major: "",
  minor: "",
  ancillaryAssignments: [],
  ancillaryInput: "",
  unavailablePeriods: [],
  subjectExpertise: [],
  gradeLevelAssignments: [],
};

export default function FacultyManagement() {
  const [facultyMembers, setFacultyMembers] = useState(() => getInitialFaculty());
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [touched, setTouched] = useState({});
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const [importPreviewRows, setImportPreviewRows] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [isParsingImport, setIsParsingImport] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilters, setGradeFilters] = useState([]);
  const [positionFilters, setPositionFilters] = useState([]);
  const [workloadFilter, setWorkloadFilter] = useState("all");
  const [subjectFilters, setSubjectFilters] = useState([]);
  const noticeTimerRef = useRef(null);
  const formCardRef = useRef(null);

  const subjectOptions = useMemo(() => getSubjectOptions(), []);
  const unavailablePeriodOptions = useMemo(() => getUnavailablePeriodOptions(), []);
    const [facultyWithLoad, setFacultyWithLoad] = useState([]);

    // Whenever faculty list, schedule, or config changes, recalculate loads
    useEffect(() => {
      function recalcLoads() {
        const loaded = calculateTeacherLoads(facultyMembers);
        setFacultyWithLoad(loaded);
        // Do NOT persist to localStorage here; handled by persistFaculty
      }
      recalcLoads();
      window.addEventListener("turotugma:faculty-updated", recalcLoads);
      window.addEventListener("storage", recalcLoads);
      return () => {
        window.removeEventListener("turotugma:faculty-updated", recalcLoads);
        window.removeEventListener("storage", recalcLoads);
      };
    }, [facultyMembers]);

  const validationErrors = useMemo(
    () => validateFacultyForm(formState, facultyMembers, editingId),
    [formState, facultyMembers, editingId]
  );

  const showNotice = (message, type = "success") => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }

    setNotice(message);
    setNoticeType(type);

    noticeTimerRef.current = window.setTimeout(() => {
      setNotice("");
    }, 2600);
  };

  const persistFaculty = (nextFaculty) => {
    setFacultyMembers(nextFaculty);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FACULTY_STORAGE_KEY, JSON.stringify(nextFaculty));
      window.dispatchEvent(new Event("turotugma:faculty-updated"));
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncFromStorage = () => {
      const latestFaculty = getInitialFaculty();
      setFacultyMembers(latestFaculty);

      if (!editingId) {
        return;
      }

      const latestEditingMember = latestFaculty.find((member) => member.id === editingId);
      if (!latestEditingMember) {
        return;
      }

      setFormState((prev) => ({
        ...prev,
        unavailablePeriods: touched.unavailablePeriods ? prev.unavailablePeriods : latestEditingMember.unavailablePeriods,
      }));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncFromStorage();
      }
    };

    window.addEventListener("focus", syncFromStorage);
    window.addEventListener("turotugma:faculty-updated", syncFromStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", syncFromStorage);
      window.removeEventListener("turotugma:faculty-updated", syncFromStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [editingId, touched.unavailablePeriods]);

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleFormField = (field, value) => {
    const sanitizedValue = typeof value === "string" ? sanitizeInputValue(value) : value;

    setFormState((prev) => ({
      ...prev,
      [field]: sanitizedValue,
    }));
  };

  const addAncillaryAssignment = () => {
    const value = sanitizeText(formState.ancillaryInput);
    if (!value) {
      return;
    }

    const exists = formState.ancillaryAssignments.some((item) => item.toLowerCase() === value.toLowerCase());
    if (exists) {
      handleFormField("ancillaryInput", "");
      return;
    }

    setFormState((prev) => ({
      ...prev,
      ancillaryAssignments: [...prev.ancillaryAssignments, value],
      ancillaryInput: "",
    }));
  };

  const removeAncillaryAssignment = (assignment) => {
    setFormState((prev) => ({
      ...prev,
      ancillaryAssignments: prev.ancillaryAssignments.filter((item) => item !== assignment),
    }));
  };

  const toggleMultiSelect = (field, option) => {
    setFormState((prev) => {
      const current = prev[field] || [];
      const next = current.includes(option) ? current.filter((item) => item !== option) : [...current, option];
      return { ...prev, [field]: next };
    });
    markTouched(field);
  };

  const handleFacultyImportFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsParsingImport(true);
    setImportFileName(file.name);
    setImportPreviewRows([]);
    setImportErrors([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        showNotice("No worksheet found in selected file.", "error");
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });

      if (!rows.length) {
        showNotice("File is empty. Please provide at least one teacher row.", "error");
        return;
      }

      const existingEmployeeIds = new Set(facultyMembers.map((member) => sanitizeText(member.employeeId).toLowerCase()));
      const existingEmails = new Set(facultyMembers.map((member) => sanitizeText(member.email).toLowerCase()));
      const importEmployeeIds = new Set();
      const importEmails = new Set();
      const nextPreviewRows = [];
      const nextErrors = [];

      rows.forEach((row, index) => {
        const lineNumber = index + 2;
        const mapped = mapImportedFacultyRow(row, subjectOptions, unavailablePeriodOptions);

        if (!mapped) {
          return;
        }

        const basicValidationErrors = validateFacultyForm(mapped, [], null);
        const firstValidationError = Object.values(basicValidationErrors)[0];
        if (firstValidationError) {
          nextErrors.push(`Row ${lineNumber}: ${firstValidationError}`);
          return;
        }

        const normalizedEmployeeId = sanitizeText(mapped.employeeId).toLowerCase();
        const normalizedEmail = sanitizeText(mapped.email).toLowerCase();

        if (existingEmployeeIds.has(normalizedEmployeeId) || importEmployeeIds.has(normalizedEmployeeId)) {
          nextErrors.push(`Row ${lineNumber}: Employee ID must be unique.`);
          return;
        }

        if (existingEmails.has(normalizedEmail) || importEmails.has(normalizedEmail)) {
          nextErrors.push(`Row ${lineNumber}: Email must be unique.`);
          return;
        }

        importEmployeeIds.add(normalizedEmployeeId);
        importEmails.add(normalizedEmail);
        nextPreviewRows.push(mapped);
      });

      setImportPreviewRows(nextPreviewRows);
      setImportErrors(nextErrors);

      if (!nextPreviewRows.length) {
        showNotice("No valid teacher rows found. Please check your file.", "error");
      } else {
        showNotice(`Parsed ${nextPreviewRows.length} valid teacher row(s).`, "success");
      }
    } catch {
      showNotice("Failed to parse file. Use .xlsx, .xls, or .csv format.", "error");
      setImportPreviewRows([]);
      setImportErrors([]);
    } finally {
      setIsParsingImport(false);
      event.target.value = "";
    }
  };

  const handleImportFacultyRows = () => {
    if (!importPreviewRows.length) {
      showNotice("No valid rows ready to import.", "error");
      return;
    }

    const existingEmployeeIds = new Set(facultyMembers.map((member) => sanitizeText(member.employeeId).toLowerCase()));
    const existingEmails = new Set(facultyMembers.map((member) => sanitizeText(member.email).toLowerCase()));
    const newFaculty = [];

    importPreviewRows.forEach((row) => {
      const employeeId = sanitizeText(row.employeeId).toLowerCase();
      const email = sanitizeText(row.email).toLowerCase();

      if (existingEmployeeIds.has(employeeId) || existingEmails.has(email)) {
        return;
      }

      existingEmployeeIds.add(employeeId);
      existingEmails.add(email);
      newFaculty.push(normalizeFacultyRecord(row, null));
    });

    if (!newFaculty.length) {
      showNotice("All parsed rows already exist in the faculty list.", "error");
      return;
    }

    persistFaculty([...facultyMembers, ...newFaculty]);
    setImportPreviewRows([]);
    setImportErrors([]);
    setImportFileName("");
    showNotice(`Imported ${newFaculty.length} teacher(s) successfully.`, "success");
  };

  const handleSaveFaculty = () => {
    const liveValidationErrors = validateFacultyForm(formState, facultyMembers, editingId);
    const hasErrors = Object.keys(liveValidationErrors).length > 0;
    if (hasErrors) {
      setTouched({
        name: true,
        sex: true,
        employeeId: true,
        position: true,
        employmentStatus: true,
        email: true,
        contact: true,
        subjectExpertise: true,
        gradeLevelAssignments: true,
      });
      showNotice("Please fix the highlighted errors.", "error");
      return;
    }

    const normalized = normalizeFacultyRecord(formState, editingId);

    if (editingId) {
      const existing = facultyMembers.find((member) => member.id === editingId);
      if (!existing) {
        showNotice("Selected faculty record was not found.", "error");
        return;
      }

      const unchanged = JSON.stringify(stripAuditFields(existing)) === JSON.stringify(stripAuditFields(normalized));
      if (unchanged) {
        showNotice("No changes to save.", "error");
        return;
      }

      const nextFaculty = facultyMembers.map((member) =>
        member.id === editingId
          ? {
              ...normalized,
              active: member.active,
              assignedLoadPercent: Number.isFinite(member.assignedLoadPercent) ? member.assignedLoadPercent : 0,
              createdAt: member.createdAt,
              updatedAt: new Date().toISOString(),
            }
          : member
      );

      persistFaculty(nextFaculty);
      setEditingId(null);
      setFormState(EMPTY_FORM);
      setTouched({});
      showNotice("Faculty record updated.", "success");
      return;
    }

    persistFaculty([...facultyMembers, normalized]);
    setFormState(EMPTY_FORM);
    setTouched({});
    showNotice("Faculty record added.", "success");
  };

  const handleEditFaculty = (member) => {
    setEditingId(member.id);
    setFormState({
      name: member.name,
      sex: member.sex,
      employeeId: member.employeeId,
      position: member.position,
      employmentStatus: member.employmentStatus,
      email: member.email,
      contact: member.contact,
      degree: member.degree,
      major: member.major,
      minor: member.minor,
      ancillaryAssignments: member.ancillaryAssignments,
      ancillaryInput: "",
      unavailablePeriods: member.unavailablePeriods,
      subjectExpertise: member.subjectExpertise,
      gradeLevelAssignments: member.gradeLevelAssignments,
    });
    setTouched({});

    window.requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    showNotice("Edit mode enabled.", "success");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormState(EMPTY_FORM);
    setTouched({});
    showNotice("Edit cancelled.", "success");
  };

  const handleDeleteFaculty = (memberId) => {
    const nextFaculty = facultyMembers.filter((member) => member.id !== memberId);
    persistFaculty(nextFaculty);

    if (editingId === memberId) {
      setEditingId(null);
      setFormState(EMPTY_FORM);
      setTouched({});
    }

    showNotice("Faculty record deleted.", "success");
  };

  const handleToggleRetired = (memberId) => {
    const nextFaculty = facultyMembers.map((member) => {
      if (member.id !== memberId) {
        return member;
      }

      return {
        ...member,
        active: !member.active,
        updatedAt: new Date().toISOString(),
      };
    });

    persistFaculty(nextFaculty);
    showNotice("Faculty status updated.", "success");
  };

  const activeCount = facultyMembers.filter((member) => member.active).length;
  const editingMember = editingId ? facultyMembers.find((member) => member.id === editingId) : null;
  const positionFilterOptions = useMemo(() => {
    const knownPositions = DEPED_DESIGNATION_OPTIONS.slice();
    const knownSet = new Set(knownPositions.map((value) => value.toLowerCase()));

    const customPositions = Array.from(
      new Set(
        facultyMembers
          .map((member) => sanitizeText(member.position))
          .filter(Boolean)
          .filter((value) => !knownSet.has(value.toLowerCase()))
      )
    );

    return [...knownPositions, ...customPositions];
  }, [facultyMembers]);
  const subjectFilterOptions = useMemo(() => {
    const catalogSubjects = subjectOptions.map((subject) => getSubjectFilterLabel(subject));
    const facultySubjects = facultyMembers
      .flatMap((member) => (Array.isArray(member.subjectExpertise) ? member.subjectExpertise : []))
      .map((subject) => getSubjectFilterLabel(subject));

    return Array.from(new Set([...catalogSubjects, ...facultySubjects].filter(Boolean))).sort((left, right) => left.localeCompare(right));
  }, [facultyMembers, subjectOptions]);
  const selectedMultiFilterChips = useMemo(
    () => [
      ...subjectFilters.map((value) => ({ key: `subject:${value}`, label: value, type: "subject", value })),
      ...gradeFilters.map((value) => ({ key: `grade:${value}`, label: value, type: "grade", value })),
      ...positionFilters.map((value) => ({ key: `position:${value}`, label: value, type: "position", value })),
    ],
    [subjectFilters, gradeFilters, positionFilters]
  );
  const sortedFacultyMembers = useMemo(
    () =>
      facultyWithLoad
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name)),
    [facultyWithLoad]
  );
  const filteredFacultyMembers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return sortedFacultyMembers.filter((member) => {
      if (statusFilter === "active" && !member.active) {
        return false;
      }

      if (statusFilter === "inactive" && member.active) {
        return false;
      }

      if (gradeFilters.length) {
        const memberGrades = Array.isArray(member.gradeLevelAssignments) ? member.gradeLevelAssignments.map((grade) => String(grade)) : [];
        const hasAnySelectedGrade = gradeFilters.some((selectedGrade) => memberGrades.includes(selectedGrade));
        if (!hasAnySelectedGrade) {
          return false;
        }
      }

      if (positionFilters.length) {
        const memberPosition = sanitizeText(member.position);
        const hasMatchingPosition = positionFilters.includes(memberPosition);
        if (!hasMatchingPosition) {
          return false;
        }
      }

      if (workloadFilter !== "all") {
        // Use assignedLoadStatus for filtering
        const memberLoadStatus = (member.assignedLoadStatus || "Unassigned").toLowerCase();
        if (memberLoadStatus !== workloadFilter) {
          return false;
        }
      }

      if (subjectFilters.length) {
        const memberSubjects = Array.isArray(member.subjectExpertise)
          ? member.subjectExpertise.map((subject) => getSubjectFilterLabel(subject).toLowerCase())
          : [];

        const hasAllSelectedSubjects = subjectFilters.every((selectedSubject) => {
          const selected = selectedSubject.toLowerCase();
          return memberSubjects.some((subject) => subject.includes(selected));
        });

        if (!hasAllSelectedSubjects) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = [member.name, member.employeeId, member.email].map((item) => String(item || "").toLowerCase()).join(" ");
      return searchable.includes(normalizedSearch);
    });
  }, [sortedFacultyMembers, searchQuery, statusFilter, gradeFilters, positionFilters, workloadFilter, subjectFilters]);

  const removeSelectedMultiFilterChip = (type, value) => {
    if (type === "subject") {
      setSubjectFilters((prev) => prev.filter((item) => item !== value));
      return;
    }

    if (type === "grade") {
      setGradeFilters((prev) => prev.filter((item) => item !== value));
      return;
    }

    if (type === "position") {
      setPositionFilters((prev) => prev.filter((item) => item !== value));
    }
  };
  return (
    <>
      <style>
        {`
          .faculty-scroll-list::-webkit-scrollbar { display: none; }

          @media (max-width: 1280px) {
            .faculty-header {
              flex-direction: column;
              align-items: flex-start;
            }

            .faculty-header-actions {
              width: 100%;
              align-items: flex-start;
            }

            .faculty-main-grid {
              grid-template-columns: 1fr !important;
            }

            .faculty-filter-row-primary,
            .faculty-filter-row-secondary {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .faculty-filter-row-primary > button {
              width: 100%;
            }

            .faculty-scroll-list {
              max-height: 520px !important;
            }
          }

          @media (max-width: 900px) {
            .faculty-filter-row-primary,
            .faculty-filter-row-secondary {
              grid-template-columns: 1fr !important;
            }

            .faculty-scroll-list {
              max-height: 460px !important;
            }
          }
        `}
      </style>
      <datalist id="degree-options">
        {DEGREE_SUGGESTIONS.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
      <datalist id="major-options">
        {MAJOR_SUGGESTIONS.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
      <datalist id="minor-options">
        {MINOR_SUGGESTIONS.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>

      <div className="faculty-header" style={{ marginBottom: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>Faculty</h1>
          <p style={{ margin: "8px 0 0", color: "#5b6787", fontSize: 14 }}>
            Manage teacher profiles, assignments, availability, expertise, and active or inactive status.
          </p>
          <p style={{ margin: "6px 0 0", color: "#5b6787", fontSize: 12 }}>
            Total Faculty: {facultyMembers.length} • Active: {activeCount}
          </p>
        </div>

        <div className="faculty-header-actions" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <button type="button" onClick={() => setShowImportPanel((prev) => !prev)} style={secondaryActionStyle()}>
            {showImportPanel ? "Hide Teacher Import" : "Import Teachers"}
          </button>

          {notice ? (
            <div
              role="status"
              aria-live="polite"
              style={{
                background: noticeType === "error" ? "#b53f4e" : "#2f5f3a",
                color: "#ffffff",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 10px 24px rgba(15, 27, 45, 0.2)",
                maxWidth: 360,
              }}
            >
              {notice}
            </div>
          ) : null}
        </div>
      </div>

      {showImportPanel ? (
        <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>Import Teachers (Excel/CSV)</h2>
          <p style={{ margin: "6px 0 0", color: "#5d698d", fontSize: 13 }}>
            Headers: Name, Sex, Employee ID, Position, Employment Status, Email, Contact, Degree, Major, Minor,
            Ancillary Assignments, Unavailable Periods, Subject Expertise, Grade Level Assignments.
          </p>

          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFacultyImportFileChange} style={{ ...inputStyle(), paddingTop: 7, height: 38 }} />
            <button type="button" onClick={handleImportFacultyRows} style={primaryActionStyle()} disabled={!importPreviewRows.length || isParsingImport}>
              Import Valid Rows
            </button>
            {isParsingImport ? <span style={{ color: "#5a678d", fontSize: 12 }}>Parsing file...</span> : null}
          </div>

          {importFileName ? (
            <p style={{ margin: "10px 0 0", color: "#5a678d", fontSize: 12 }}>
              File: {importFileName} • Valid rows: {importPreviewRows.length} • Errors: {importErrors.length}
            </p>
          ) : null}

          {importErrors.length ? (
            <div style={{ marginTop: 10, border: "1px solid #f1d1d6", background: "#fff7f8", borderRadius: 10, padding: 10 }}>
              <p style={{ margin: 0, color: "#a44652", fontSize: 12, fontWeight: 700 }}>Import Errors</p>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#8a4a55", fontSize: 12, display: "grid", gap: 4 }}>
                {importErrors.slice(0, 8).map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
              {importErrors.length > 8 ? <p style={{ margin: "8px 0 0", color: "#8a4a55", fontSize: 12 }}>+{importErrors.length - 8} more error(s)</p> : null}
            </div>
          ) : null}

          {importPreviewRows.length ? (
            <div style={{ marginTop: 10, border: "1px solid #dce3f2", background: "#fbfcff", borderRadius: 10, padding: 10 }}>
              <p style={{ margin: 0, color: "#334174", fontSize: 12, fontWeight: 700 }}>Preview (first 6 valid rows)</p>
              <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                {importPreviewRows.slice(0, 6).map((member, index) => (
                  <div
                    key={`${member.employeeId}-${index}`}
                    style={{
                      border: "1px solid #e5eaf4",
                      borderRadius: 8,
                      background: "#fff",
                      padding: "7px 8px",
                      display: "grid",
                      gridTemplateColumns: "1.1fr 0.9fr 1fr 1.5fr 1.2fr",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: "#27356f", fontSize: 12, fontWeight: 700 }}>{member.name}</span>
                    <span style={chipStyle()}>{member.employeeId}</span>
                    <span style={chipStyle()}>{member.position}</span>
                    <span style={chipStyle()}>{formatList(member.subjectExpertise)}</span>
                    <span style={chipStyle()}>{formatList(member.gradeLevelAssignments)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="faculty-main-grid" style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 16 }}>
        <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 16 }}>
          <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>Faculty List</h2>
          <p style={{ margin: "6px 0 0", color: "#5d698d", fontSize: 13 }}>Includes Name, Employee ID, status, and quick actions.</p>

          <div className="faculty-filter-row-primary" style={{ marginTop: 10, display: "grid", gridTemplateColumns: "minmax(0, 2fr) repeat(2, minmax(0, 1fr)) auto", gap: 8, alignItems: "end" }}>
            <Field label="Search">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                }}
                placeholder="Search name, ID, email"
                style={inputStyle(false)}
              />
            </Field>

            <Field label="Status">
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                }}
                style={selectStyle(false)}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>

            <Field label="Workload">
              <select
                value={workloadFilter}
                onChange={(event) => {
                  setWorkloadFilter(event.target.value);
                }}
                style={selectStyle(false)}
              >
                <option value="all">All Workloads</option>
                <option value="unassigned">Unassigned</option>
                <option value="balanced">Balanced</option>
                <option value="underload">Underload</option>
                <option value="overload">Overload</option>
              </select>
            </Field>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setGradeFilters([]);
                setPositionFilters([]);
                setWorkloadFilter("all");
                setSubjectFilters([]);
              }}
              style={{ ...secondaryActionStyle(), height: 36 }}
            >
              Reset
            </button>
          </div>

          <div className="faculty-filter-row-secondary" style={{ marginTop: 8, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)", gap: 8, alignItems: "end" }}>
            <Field label="Position">
              <SearchableMultiSelectChips
                options={positionFilterOptions}
                selected={positionFilters}
                onToggle={(option) => {
                  setPositionFilters((prev) =>
                    prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
                  );
                }}
                emptyLabel="No position options available."
                placeholder="Search and select positions"
                showSelectedChips={false}
                showEmptySelectionText={false}
              />
            </Field>

            <Field label="Subjects">
              <SearchableMultiSelectChips
                options={subjectFilterOptions}
                selected={subjectFilters}
                onToggle={(option) => {
                  setSubjectFilters((prev) =>
                    prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
                  );
                }}
                emptyLabel="No subject options available."
                placeholder="Search and select subject filters"
                showSelectedChips={false}
                showEmptySelectionText={false}
              />
            </Field>

            <Field label="Grade Level">
              <SearchableMultiSelectChips
                options={GRADE_LEVEL_OPTIONS}
                selected={gradeFilters}
                onToggle={(option) => {
                  setGradeFilters((prev) => (prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]));
                }}
                emptyLabel="No grade level options available."
                placeholder="Search and select grade levels"
                showSelectedChips={false}
                showEmptySelectionText={false}
              />
            </Field>
          </div>

          {selectedMultiFilterChips.length ? (
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {selectedMultiFilterChips.map((chip) => (
                <span key={chip.key} style={chipStyle()}>
                  {chip.label}
                  <button type="button" onClick={() => removeSelectedMultiFilterChip(chip.type, chip.value)} style={chipRemoveStyle()}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <p style={{ margin: "10px 0 0", color: "#5d698d", fontSize: 12 }}>
            Showing {filteredFacultyMembers.length} of {facultyMembers.length} teacher{facultyMembers.length === 1 ? "" : "s"}
          </p>

          {facultyMembers.length === 0 ? (
            <p style={{ margin: "14px 0 0", color: "#7a86a7", fontSize: 13 }}>No faculty records added yet.</p>
          ) : filteredFacultyMembers.length === 0 ? (
            <p style={{ margin: "14px 0 0", color: "#7a86a7", fontSize: 13 }}>No teachers match the current search or filters.</p>
          ) : (
            <>
              <div
                className="faculty-scroll-list"
                style={{
                  marginTop: 12,
                  display: "grid",
                  gap: 8,
                  maxHeight: 620,
                  overflowY: "auto",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {filteredFacultyMembers.map((member) => (
                  <FacultyListRow
                    key={member.id}
                    member={member}
                    isEditing={editingId === member.id}
                    onEdit={handleEditFaculty}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div ref={formCardRef} style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 16 }}>
          <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>{editingId ? "Edit Faculty" : "Add Faculty"}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
            <Field label="Name" required error={touched.name ? validationErrors.name : ""}>
              <input
                type="text"
                value={formState.name}
                onChange={(event) => handleFormField("name", event.target.value)}
                onBlur={() => markTouched("name")}
                style={inputStyle(!!(touched.name && validationErrors.name))}
              />
            </Field>

            <Field label="Sex" required error={touched.sex ? validationErrors.sex : ""}>
              <select
                value={formState.sex}
                onChange={(event) => handleFormField("sex", event.target.value)}
                onBlur={() => markTouched("sex")}
                style={selectStyle(!!(touched.sex && validationErrors.sex))}
              >
                <option value="">Select Sex</option>
                {SEX_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Employee ID" required error={touched.employeeId ? validationErrors.employeeId : ""}>
              <input
                type="text"
                value={formState.employeeId}
                onChange={(event) => handleFormField("employeeId", event.target.value.toUpperCase())}
                onBlur={() => markTouched("employeeId")}
                style={inputStyle(!!(touched.employeeId && validationErrors.employeeId))}
              />
            </Field>

            <Field label="Position / Designation" required error={touched.position ? validationErrors.position : ""}>
              <select
                value={formState.position}
                onChange={(event) => handleFormField("position", event.target.value)}
                onBlur={() => markTouched("position")}
                style={selectStyle(!!(touched.position && validationErrors.position))}
              >
                <option value="">Select Designation</option>
                {DEPED_DESIGNATION_OPTIONS.map((designation) => (
                  <option key={designation} value={designation}>
                    {designation}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Employment Status" required error={touched.employmentStatus ? validationErrors.employmentStatus : ""}>
              <select
                value={formState.employmentStatus}
                onChange={(event) => handleFormField("employmentStatus", event.target.value)}
                onBlur={() => markTouched("employmentStatus")}
                style={selectStyle(!!(touched.employmentStatus && validationErrors.employmentStatus))}
              >
                {EMPLOYMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Email" required error={touched.email ? validationErrors.email : ""}>
              <input
                type="email"
                value={formState.email}
                onChange={(event) => handleFormField("email", event.target.value.toLowerCase())}
                onBlur={() => markTouched("email")}
                style={inputStyle(!!(touched.email && validationErrors.email))}
              />
            </Field>

            <Field label="Contact" required error={touched.contact ? validationErrors.contact : ""}>
              <input
                type="text"
                value={formState.contact}
                onChange={(event) => handleFormField("contact", event.target.value)}
                onBlur={() => markTouched("contact")}
                placeholder="+639XXXXXXXXX or 09XXXXXXXXX"
                style={inputStyle(!!(touched.contact && validationErrors.contact))}
              />
            </Field>

            <Field label="Degree" error={touched.degree ? validationErrors.degree : ""}>
              <input
                type="text"
                list="degree-options"
                value={formState.degree}
                onChange={(event) => handleFormField("degree", event.target.value)}
                onBlur={() => markTouched("degree")}
                style={inputStyle(!!(touched.degree && validationErrors.degree))}
              />
            </Field>

            <Field label="Major" error={touched.major ? validationErrors.major : ""}>
              <input
                type="text"
                list="major-options"
                value={formState.major}
                onChange={(event) => handleFormField("major", event.target.value)}
                onBlur={() => markTouched("major")}
                style={inputStyle(!!(touched.major && validationErrors.major))}
              />
            </Field>

            <Field label="Minor" error={touched.minor ? validationErrors.minor : ""}>
              <input
                type="text"
                list="minor-options"
                value={formState.minor}
                onChange={(event) => handleFormField("minor", event.target.value)}
                onBlur={() => markTouched("minor")}
                style={inputStyle(!!(touched.minor && validationErrors.minor))}
              />
            </Field>
          </div>

          <div style={{ marginTop: 10 }}>
            <Field label="Ancillary Assignments (input)">
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={formState.ancillaryInput}
                  onChange={(event) => handleFormField("ancillaryInput", event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addAncillaryAssignment();
                    }
                  }}
                  style={inputStyle(false)}
                />
                <button type="button" onClick={addAncillaryAssignment} style={smallActionStyle()}>
                  Add
                </button>
              </div>
            </Field>
            <ChipList items={formState.ancillaryAssignments} onRemove={removeAncillaryAssignment} emptyText="No ancillary assignments added." />
          </div>

          <div style={{ marginTop: 10 }}>
            <Field label="Unavailable Periods" error={touched.unavailablePeriods ? validationErrors.unavailablePeriods : ""}>
              <SearchableMultiSelectChips
                options={unavailablePeriodOptions}
                selected={formState.unavailablePeriods}
                onToggle={(option) => toggleMultiSelect("unavailablePeriods", option)}
                placeholder="Search periods..."
              />
            </Field>
          </div>

          <div style={{ marginTop: 10 }}>
            <Field label="Subject Expertise" required error={touched.subjectExpertise ? validationErrors.subjectExpertise : ""}>
              <SearchableMultiSelectChips
                options={subjectOptions}
                selected={formState.subjectExpertise}
                onToggle={(option) => toggleMultiSelect("subjectExpertise", option)}
                emptyLabel="No subjects available yet. Create subjects first."
                placeholder="Search subjects..."
              />
            </Field>
          </div>

          <div style={{ marginTop: 10 }}>
            <Field label="Grade Level Assignments" required error={touched.gradeLevelAssignments ? validationErrors.gradeLevelAssignments : ""}>
              <SearchableMultiSelectChips
                options={GRADE_LEVEL_OPTIONS}
                selected={formState.gradeLevelAssignments}
                onToggle={(option) => toggleMultiSelect("gradeLevelAssignments", option)}
                placeholder="Search grade levels..."
              />
            </Field>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            {editingId ? (
              <>
                <button
                  type="button"
                  onClick={() => handleToggleRetired(editingId)}
                  style={secondaryActionStyle()}
                >
                  {editingMember?.active ? "Deactivate" : "Activate"}
                </button>
                <button type="button" onClick={() => handleDeleteFaculty(editingId)} style={dangerActionStyle()}>
                  Delete
                </button>
              <button type="button" onClick={handleCancelEdit} style={secondaryActionStyle()}>
                Cancel
              </button>
              </>
            ) : null}

            <button type="button" onClick={handleSaveFaculty} style={primaryActionStyle()}>
              {editingId ? "Save Changes" : "Add Faculty"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function FacultyListRow({ member, isEditing, onEdit }) {
  // Use assignedLoadStatus for badge label and color
  const statusToneMap = {
    Unassigned: "neutral",
    Underload: "warning",
    Balanced: "good",
    Overload: "danger",
  };
  const loadStatus = member.assignedLoadStatus || "Unassigned";
  const badgeTone = statusToneMap[loadStatus] || "neutral";

  // For the progress bar, still use percent, but color by status
  const loadPercent = Number.isFinite(member.assignedLoadPercent) ? member.assignedLoadPercent : 0;
  // Chart color mapping for consistency with dashboard
  const fillColor = {
    neutral: "#c3c9de",    // Unassigned
    warning: "#8893d9",   // Underload
    good: "#3B4197",      // Balanced
    danger: "#e53935",    // Overload (red)
  }[badgeTone];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(member)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onEdit(member);
        }
      }}
      style={{
        border: isEditing ? "1px solid #cdd5ff" : "1px solid #e3e7ef",
        borderRadius: 10,
        background: isEditing ? "#f3f6ff" : "#fbfcff",
        padding: "10px 12px",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div>
          <p style={{ margin: 0, color: "#25336f", fontSize: 14, fontWeight: 700 }}>{member.name}</p>
          <p style={{ margin: "2px 0 0", color: "#5d698f", fontSize: 12 }}>{member.employeeId}</p>
        </div>

        <span style={statusPillStyle(member.active)}>{member.active ? "Active" : "Inactive"}</span>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <span style={{ color: "#5d698f", fontSize: 12, fontWeight: 600 }}>Teacher Load</span>
          <span style={loadStateBadgeStyle(badgeTone)}>{loadStatus}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 8, borderRadius: 999, background: "#e8edf9", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.max(0, Math.min(loadPercent, 100))}%`,
                  height: "100%",
                  background: fillColor,
                }}
              />
            </div>
          </div>
          <span style={{ color: "#25336f", fontSize: 12, fontWeight: 500, marginLeft: 8 }}>
            {member.assignedLoadMinutes ? `${(member.assignedLoadMinutes / 60).toFixed(2)} hrs (${member.assignedLoadMinutes} min)` : "0 hrs"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required = false, error = "", children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ margin: 0, color: "#5f6b90", fontSize: 12, fontWeight: 600 }}>
        {label}
        {required ? <span style={{ color: "#b53f4e" }}> *</span> : null}
      </span>
      {children}
      {error ? <span style={{ color: "#b53f4e", fontSize: 12 }}>{error}</span> : null}
    </label>
  );
}

function SearchableMultiSelectChips({
  options,
  selected,
  onToggle,
  emptyLabel = "No options available.",
  placeholder = "Search options...",
  showSelectedChips = true,
  showEmptySelectionText = true,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [showAllChips, setShowAllChips] = useState(false);

  if (!options.length) {
    return <p style={{ margin: 0, color: "#7a86a7", fontSize: 12 }}>{emptyLabel}</p>;
  }

  const filteredOptions = options.filter((option) => option.toLowerCase().includes(query.toLowerCase()));
  const visibleChips = showAllChips ? selected : selected.slice(0, 6);
  const hiddenChipCount = Math.max(0, selected.length - visibleChips.length);

  const commitToggle = (option) => {
    onToggle(option);
    setQuery("");
    setOpen(true);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (event) => {
    if (!open) {
      if (event.key === "ArrowDown") {
        setOpen(true);
      }
      return;
    }

    if (!filteredOptions.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const next = filteredOptions[Math.min(highlightedIndex, filteredOptions.length - 1)];
      if (next) {
        commitToggle(next);
      }
    }
  };

  return (
    <div>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={inputStyle(false)}
        />

        {open ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "calc(100% + 4px)",
              border: "1px solid #d9dfea",
              borderRadius: 10,
              background: "#ffffff",
              maxHeight: 180,
              overflowY: "auto",
              boxShadow: "0 10px 24px rgba(15, 27, 45, 0.12)",
              zIndex: 30,
            }}
          >
            {filteredOptions.length === 0 ? (
              <p style={{ margin: 0, padding: "8px 10px", color: "#7a86a7", fontSize: 12 }}>No matching options.</p>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = selected.includes(option);
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={option}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      commitToggle(option);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      background: isHighlighted ? "#f1f4ff" : "#ffffff",
                      color: "#2f3a73",
                      padding: "8px 10px",
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{option}</span>
                    <span style={{ color: isSelected ? "#3B4197" : "#9aa5c2", fontWeight: 700 }}>{isSelected ? "✓" : "+"}</span>
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      {showSelectedChips && selected.length ? (
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {visibleChips.map((item) => (
            <span key={item} style={chipStyle()}>
              {item}
              <button type="button" onClick={() => onToggle(item)} style={chipRemoveStyle()}>
                ×
              </button>
            </span>
          ))}

          {hiddenChipCount > 0 ? (
            <button type="button" onClick={() => setShowAllChips(true)} style={chipOverflowButtonStyle()}>
              +{hiddenChipCount} more
            </button>
          ) : null}

          {showAllChips && selected.length > 6 ? (
            <button type="button" onClick={() => setShowAllChips(false)} style={chipOverflowButtonStyle()}>
              Show less
            </button>
          ) : null}
        </div>
      ) : showSelectedChips && showEmptySelectionText ? (
        <p style={{ margin: "8px 0 0", color: "#7a86a7", fontSize: 12 }}>No selections yet.</p>
      ) : null}
    </div>
  );
}

function ChipList({ items, onRemove, emptyText }) {
  if (!items.length) {
    return <p style={{ margin: "8px 0 0", color: "#7a86a7", fontSize: 12 }}>{emptyText}</p>;
  }

  return (
    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((item) => (
        <span key={item} style={chipStyle()}>
          {item}
          <button type="button" onClick={() => onRemove(item)} style={chipRemoveStyle()}>
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

function statusPillStyle(active) {
  return {
    color: active ? "#2f5f3a" : "#7f4a18",
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
    background: active ? "#edf8f0" : "#fff3e6",
    borderRadius: 999,
    border: active ? "1px solid #cde8d4" : "1px solid #f2dcc2",
    padding: "3px 8px",
    display: "inline-flex",
    justifyContent: "center",
  };
}

function loadStateBadgeStyle(tone) {
  // Chart color mapping for badge backgrounds and borders
  const palette = {
    neutral: { color: "#4d5a84", background: "#c3c9de", border: "#c3c9de" },    // Unassigned
    warning: { color: "#4d5a84", background: "#8893d9", border: "#8893d9" },   // Underload
    good: { color: "#fff", background: "#3B4197", border: "#3B4197" },        // Balanced
    danger: { color: "#fff", background: "#e53935", border: "#e53935" },      // Overload (red)
  };
  const selected = palette[tone] || palette.neutral;
  return {
    color: selected.color,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
    background: selected.background,
    borderRadius: 999,
    border: `1px solid ${selected.border}`,
    padding: "3px 8px",
    display: "inline-flex",
    justifyContent: "center",
  };
}

function getTeacherLoadState(loadPercent) {
  if (!loadPercent || loadPercent <= 0) {
    return { label: "Unassigned", tone: "neutral", fill: "#cfd7ef" };
  }

  if (loadPercent < 80) {
    return { label: "Underload", tone: "warning", fill: "#f2c28f" };
  }

  if (loadPercent <= 100) {
    return { label: "Balanced", tone: "good", fill: "#3B4197" };
  }

  return { label: "Overload", tone: "danger", fill: "#c7545f" };
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

function chipOverflowButtonStyle() {
  return {
    border: "1px dashed #c8d0ea",
    background: "#f7f9ff",
    color: "#3B4197",
    borderRadius: 999,
    padding: "5px 10px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  };
}

function chipStyle() {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid #cdd5ff",
    background: "#e9edff",
    color: "#3B4197",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 12,
    fontWeight: 600,
  };
}

function chipRemoveStyle() {
  return {
    border: "none",
    background: "transparent",
    color: "#3B4197",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    lineHeight: 1,
    padding: 0,
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

function smallDangerStyle() {
  return {
    ...smallActionStyle(),
    color: "#b53f4e",
    border: "1px solid #e7c4cb",
    background: "#fff6f7",
  };
}

function validateFacultyForm(formState, facultyMembers, editingId) {
  const errors = {};

  if (!formState.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!formState.sex) {
    errors.sex = "Sex is required.";
  }

  if (!formState.employeeId.trim()) {
    errors.employeeId = "Employee ID is required.";
  } else {
    const duplicate = facultyMembers.some(
      (member) => member.id !== editingId && member.employeeId.toLowerCase() === formState.employeeId.trim().toLowerCase()
    );
    if (duplicate) {
      errors.employeeId = "Employee ID must be unique.";
    }
  }

  if (!formState.position.trim()) {
    errors.position = "Position is required.";
  }

  if (!formState.employmentStatus) {
    errors.employmentStatus = "Employment Status is required.";
  }

  if (!formState.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(formState.email.trim())) {
    errors.email = "Enter a valid email address.";
  } else {
    const duplicateEmail = facultyMembers.some(
      (member) => member.id !== editingId && member.email.toLowerCase() === formState.email.trim().toLowerCase()
    );
    if (duplicateEmail) {
      errors.email = "Email must be unique.";
    }
  }

  if (!formState.contact.trim()) {
    errors.contact = "Contact is required.";
  } else if (!/^(\+639\d{9}|09\d{9})$/u.test(formState.contact.trim())) {
    errors.contact = "Use +639XXXXXXXXX or 09XXXXXXXXX format.";
  }

  if (!Array.isArray(formState.subjectExpertise) || formState.subjectExpertise.length === 0) {
    errors.subjectExpertise = "Select at least one subject expertise.";
  }

  if (!Array.isArray(formState.gradeLevelAssignments) || formState.gradeLevelAssignments.length === 0) {
    errors.gradeLevelAssignments = "Select at least one grade level assignment.";
  }

  return errors;
}

function normalizeFacultyRecord(formState, editingId) {
  const now = new Date().toISOString();

  return {
    id: editingId || createFacultyId(),
    name: sanitizeText(formState.name),
    sex: formState.sex,
    employeeId: sanitizeText(formState.employeeId).toUpperCase(),
    position: normalizeDesignation(formState.position),
    employmentStatus: formState.employmentStatus,
    email: sanitizeText(formState.email).toLowerCase(),
    contact: sanitizeText(formState.contact),
    degree: sanitizeText(formState.degree),
    major: sanitizeText(formState.major),
    minor: sanitizeText(formState.minor),
    ancillaryAssignments: normalizeArray(formState.ancillaryAssignments),
    unavailablePeriods: normalizeUnavailablePeriods(formState.unavailablePeriods),
    subjectExpertise: normalizeArray(formState.subjectExpertise),
    gradeLevelAssignments: normalizeArray(formState.gradeLevelAssignments),
    assignedLoadPercent: 0,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const deduped = new Set(values.map((item) => sanitizeText(item)).filter(Boolean));
  return Array.from(deduped);
}

function sanitizeText(value) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/gu, "")
    .trim();
}

function sanitizeInputValue(value) {
  return String(value || "").replace(/[\u0000-\u001F\u007F]/gu, "");
}

function formatList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "—";
  }

  return items.join(", ");
}

function getSubjectFilterLabel(value) {
  const rawValue = sanitizeText(value);
  if (!rawValue) {
    return "";
  }

  const parts = rawValue.split("—");
  if (parts.length <= 1) {
    return rawValue;
  }

  return sanitizeText(parts.slice(1).join("—"));
}

function createFacultyId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function stripAuditFields(member) {
  const { createdAt, updatedAt, ...rest } = member;
  return rest;
}

function getSubjectOptions() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SUBJECTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const optionMap = new Map();
    parsed.forEach((subject) => {
      const code = sanitizeText(subject.subjectCode);
      const name = sanitizeText(subject.subjectName);
      if (!code && !name) {
        return;
      }

      const value = code ? `${code} — ${name}` : name;
      optionMap.set(value.toLowerCase(), value);
    });

    return Array.from(optionMap.values()).sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

function getUnavailablePeriodOptions() {
  if (typeof window === "undefined") {
    return FALLBACK_PERIOD_OPTIONS;
  }

  try {
    const raw = window.localStorage.getItem(SCHEDULE_PERIODS_KEY);
    if (!raw) {
      return FALLBACK_PERIOD_OPTIONS;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return FALLBACK_PERIOD_OPTIONS;
    }

    const normalized = normalizeUnavailablePeriods(parsed);
    return normalized.length ? normalized : FALLBACK_PERIOD_OPTIONS;
  } catch {
    return FALLBACK_PERIOD_OPTIONS;
  }
}

function getInitialFaculty() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FACULTY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((member) => ({
      ...member,
      ancillaryAssignments: normalizeArray(member.ancillaryAssignments),
      unavailablePeriods: normalizeUnavailablePeriods(member.unavailablePeriods),
      subjectExpertise: normalizeArray(member.subjectExpertise),
      gradeLevelAssignments: resolveListToGradeLevels(normalizeArray(member.gradeLevelAssignments)),
      assignedLoadPercent: Number.isFinite(member.assignedLoadPercent) ? member.assignedLoadPercent : 0,
      active: typeof member.active === "boolean" ? member.active : true,
    }));
  } catch {
    return [];
  }
}

function mapImportedFacultyRow(row, subjectOptions, unavailablePeriodOptions) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const normalizedRow = Object.entries(row).reduce((accumulator, [key, value]) => {
    accumulator[normalizeHeaderKey(key)] = sanitizeText(value);
    return accumulator;
  }, {});

  const name = pickRowValue(normalizedRow, ["name", "teachername"]);
  const sex = normalizeSexValue(pickRowValue(normalizedRow, ["sex", "gender"]));
  const employeeId = pickRowValue(normalizedRow, ["employeeid", "id", "teacherid"]);
  const position = normalizeDesignation(pickRowValue(normalizedRow, ["position", "designation"]));
  const employmentStatus = normalizeEmploymentStatus(pickRowValue(normalizedRow, ["employmentstatus", "status"]));
  const email = pickRowValue(normalizedRow, ["email", "emailaddress"]);
  const contact = pickRowValue(normalizedRow, ["contact", "contactnumber", "phone"]);
  const degree = pickRowValue(normalizedRow, ["degree"]);
  const major = pickRowValue(normalizedRow, ["major"]);
  const minor = pickRowValue(normalizedRow, ["minor"]);

  const ancillaryAssignments = splitListInput(pickRowValue(normalizedRow, ["ancillaryassignments", "ancillary"]));
  const unavailablePeriods = resolveListToOptions(
    splitListInput(pickRowValue(normalizedRow, ["unavailableperiods", "unavailable"])),
    unavailablePeriodOptions,
    true
  );
  const subjectExpertise = resolveListToOptions(
    splitListInput(pickRowValue(normalizedRow, ["subjectexpertise", "expertise"])),
    subjectOptions,
    false
  );
  const gradeLevelAssignments = resolveListToGradeLevels(
    splitListInput(pickRowValue(normalizedRow, ["gradelevelassignments", "gradeassignments", "gradelevels"]))
  );

  const isEmptyRow = [name, sex, employeeId, position, email, contact, degree, major].every((value) => !value);
  if (isEmptyRow) {
    return null;
  }

  return {
    ...EMPTY_FORM,
    name,
    sex,
    employeeId,
    position,
    employmentStatus: employmentStatus || "Regular",
    email,
    contact,
    degree,
    major,
    minor,
    ancillaryAssignments,
    ancillaryInput: "",
    unavailablePeriods: normalizeUnavailablePeriods(unavailablePeriods),
    subjectExpertise,
    gradeLevelAssignments,
  };
}

function normalizeUnavailablePeriods(values) {
  const normalized = normalizeArray(values)
    .map((value) => toPeriodToken(value))
    .filter(Boolean)
    .map((token) => token.toUpperCase());

  const deduped = Array.from(new Set(normalized));
  return deduped.sort((left, right) => getPeriodNumber(left) - getPeriodNumber(right));
}

function toPeriodToken(value) {
  const text = sanitizeText(value);
  if (!text) {
    return "";
  }

  const match = text.match(/p\s*(\d+)/iu);
  if (!match) {
    return "";
  }

  const periodNumber = Number.parseInt(match[1], 10);
  if (!Number.isFinite(periodNumber) || periodNumber <= 0) {
    return "";
  }

  return `P${periodNumber}`;
}

function getPeriodNumber(periodLabel) {
  const match = String(periodLabel || "").toUpperCase().match(/^P(\d+)$/u);
  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function normalizeHeaderKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/gu, "");
}

function pickRowValue(row, keys) {
  for (const key of keys) {
    if (row[key]) {
      return row[key];
    }
  }

  return "";
}

function splitListInput(value) {
  return String(value || "")
    .split(/[;,|]/u)
    .map((item) => sanitizeText(item))
    .filter(Boolean);
}

function resolveListToOptions(values, options, allowUnknown) {
  const optionMap = new Map(options.map((option) => [option.toLowerCase(), option]));

  return normalizeArray(
    values
      .map((value) => {
        const direct = optionMap.get(value.toLowerCase());
        if (direct) {
          return direct;
        }

        const fuzzy = options.find((option) => option.toLowerCase().includes(value.toLowerCase()));
        if (fuzzy) {
          return fuzzy;
        }

        return allowUnknown ? value : "";
      })
      .filter(Boolean)
  );
}

function resolveListToGradeLevels(values) {
  const mapped = values.flatMap((value) => {
    const normalized = value.toLowerCase();

    if (normalized === "jhs" || normalized.includes("7-10") || normalized.includes("grade 7 to 10")) {
      return ["Grade 7", "Grade 8", "Grade 9", "Grade 10"];
    }

    if (normalized.includes("grade 7") || normalized === "7") {
      return ["Grade 7"];
    }

    if (normalized.includes("grade 8") || normalized === "8") {
      return ["Grade 8"];
    }

    if (normalized.includes("grade 9") || normalized === "9") {
      return ["Grade 9"];
    }

    if (normalized.includes("grade 10") || normalized === "10") {
      return ["Grade 10"];
    }

    if (normalized.includes("grade 11") || normalized === "11") {
      return ["Grade 11"];
    }

    if (normalized.includes("grade 12") || normalized === "12") {
      return ["Grade 12"];
    }

    const direct = GRADE_LEVEL_OPTIONS.find((option) => option.toLowerCase() === normalized);
    return direct ? [direct] : [];
  });

  return normalizeArray(mapped);
}

function normalizeSexValue(value) {
  const normalized = sanitizeText(value).toLowerCase();
  const match = SEX_OPTIONS.find((option) => option.toLowerCase() === normalized);
  return match || "";
}

function normalizeEmploymentStatus(value) {
  const normalized = sanitizeText(value).toLowerCase();
  const match = EMPLOYMENT_STATUS_OPTIONS.find((option) => option.toLowerCase() === normalized);
  return match || "";
}

function normalizeDesignation(value) {
  const normalized = sanitizeText(value).toLowerCase();

  const direct = DEPED_DESIGNATION_OPTIONS.find((option) => option.toLowerCase() === normalized);
  if (direct) {
    return direct;
  }

  const fuzzy = DEPED_DESIGNATION_OPTIONS.find((option) => option.toLowerCase().includes(normalized));
  return fuzzy || "";
}
