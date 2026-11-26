// Utility to get all created sections as a Map(sectionId => section)
function getAllSectionsMap() {
  const map = new Map();
  if (typeof window === "undefined") return map;
  try {
    const raw = localStorage.getItem("turotugma_sections_created");
    if (!raw) return map;
    const parsed = JSON.parse(raw);
    for (const level of ["jhs", "shs"]) {
      if (parsed && parsed[level] && typeof parsed[level] === "object") {
        for (const gradeKey of Object.keys(parsed[level])) {
          const gradeObj = parsed[level][gradeKey];
          const gradeNum = parseInt(String(gradeKey).replace(/\D/g, ""), 10);
          const sections = Array.isArray(gradeObj?.sections) ? gradeObj.sections : (Array.isArray(gradeObj) ? gradeObj : []);
          sections.forEach((sec, index) => {
            if (sec) {
              const secName = typeof sec === "string" ? sec : (sec.name || "");
              const sectionEntry = {
                ...(typeof sec === "object" ? sec : {}),
                id: sec.id || `${level}-${gradeNum}-${index}`,
                name: secName,
                grade: sec.grade || gradeNum || gradeKey,
                level: sec.level || level,
              };

              // Map under all possible lookup formats from drafts and algorithms
              map.set(`${level}-${gradeNum}-${index}`, sectionEntry);
              map.set(`sec-${gradeNum}-${index}`, sectionEntry);
              map.set(`${gradeNum}-${index}`, sectionEntry);
              if (sec.id) map.set(sec.id, sectionEntry);
              if (secName) {
                map.set(secName, sectionEntry);
                map.set(secName.toLowerCase(), sectionEntry);
              }
            }
          });
        }
      }
    }
  } catch (e) {
    console.error("Error reading sections map:", e);
  }
  return map;
}

// Utility to get all subjects as a Map(subjectId => subject)
function getAllSubjectsMap() {
  const map = new Map();
  if (typeof window === "undefined") return map;
  try {
    const raw = localStorage.getItem("turotugma_subjects");
    if (!raw) return map;
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      list.forEach((sub) => {
        if (sub && sub.id) {
          map.set(sub.id, sub);
        }
      });
    }
  } catch (e) {
    console.error("Error reading subjects map:", e);
  }
  return map;
}

// Utility to get active schedule assignments from localStorage (published or drafts)
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

  // 1. Inspect Published Schedules
  try {
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

  // 2. Inspect Draft Schedules (if draft is newer than published, draft reflects latest generated schedule)
  try {
    const draftRaw = localStorage.getItem("turotugma_schedule_drafts");
    if (draftRaw) {
      const draftArr = JSON.parse(draftRaw);
      if (Array.isArray(draftArr) && draftArr.length > 0) {
        draftArr.forEach((draftItem) => {
          const sched = draftItem?.schedule || draftItem;
          const level = sched?.scheduleType || draftItem?.scheduleType || "default";
          const updated = new Date(draftItem?.updatedAt || sched?.updatedAt || 0).getTime();
          if (!latestByLevel[level] || updated >= latestByLevel[level].updated) {
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
// Actual classroom contact hours only (30.0 contact hours/week standard). Advisory, ARAL, remediation, prep counted separately.
function calculateTeacherLoads(facultyList) {
  if (!Array.isArray(facultyList)) {
    return [];
  }

  const assignments = getActiveScheduleAssignments();
  const periodMinutes = getScheduleConfigPeriodMinutes();
  const sectionsMap = getAllSectionsMap();
  const subjectsMap = getAllSubjectsMap();

  const facultyById = new Map(facultyList.map((f) => [f.id, f]));

  // Count assigned periods and collect assigned sections / subjects per teacher
  const teacherPeriodCounts = {};
  const teacherSectionsMap = {};
  const teacherSubjectsMap = {};
  const teacherDistinctPrepsMap = {};
  const adviserHGPCount = {};
  const teacherAbsorbedHGPMap = {};
  const teacherAdvisorySectionMap = {};

  assignments.forEach((asgn) => {
    const processTeacherAssignment = (tid) => {
      if (!tid) return;

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

      // DepEd DO 005, s. 2024: Any teacher assigned to a section's HGP (Homeroom Guidance Program) period
      // is automatically that section's Class Adviser. Their 1 period/wk advisory HGP is covered under
      // their 5.0h advising credit and absorbed so it does not count as classroom contact overload.
      let isAdvisoryHGPAbsorbed = false;
      if (isHGP) {
        const count = adviserHGPCount[tid] || 0;
        if (count === 0) {
          isAdvisoryHGPAbsorbed = true;
          adviserHGPCount[tid] = 1;
          teacherAbsorbedHGPMap[tid] = true;
          if (asgn.sectionId) {
            const advSec = sectionsMap.get(asgn.sectionId);
            const advSecName = advSec?.name || asgn.sectionId;
            const advGrade = advSec?.grade ? String(advSec.grade).replace(/^Grade\s*/i, "").replace(/^G/i, "").trim() : "";
            teacherAdvisorySectionMap[tid] = advGrade && !advSecName.toLowerCase().includes(`grade ${advGrade}`)
              ? `Grade ${advGrade} - ${advSecName}`
              : advSecName;
          }
        }
      }

      if (!isAdvisoryHGPAbsorbed) {
        teacherPeriodCounts[tid] = (teacherPeriodCounts[tid] || 0) + 1;
      }

      if (!teacherSectionsMap[tid]) teacherSectionsMap[tid] = new Map();
      if (asgn.sectionId) {
        const sec = sectionsMap.get(asgn.sectionId);
        const secName = sec?.name || asgn.sectionId;
        const rawGrade = sec?.grade ? String(sec.grade).replace(/^Grade\s*/i, "").replace(/^G/i, "").trim() : "";
        const gradeText = rawGrade ? `Grade ${rawGrade}` : "";
        const label = gradeText && !secName.toLowerCase().includes(gradeText.toLowerCase())
          ? `${gradeText} - ${secName}`
          : secName;
        teacherSectionsMap[tid].set(asgn.sectionId, {
          id: asgn.sectionId,
          name: secName,
          grade: sec?.grade || "",
          label,
        });
      }

      if (!teacherSubjectsMap[tid]) teacherSubjectsMap[tid] = new Map();
      if (asgn.subjectId) {
        const displayName = sub?.subjectName || sub?.name || sub?.subjectCode || asgn.subjectId;
        teacherSubjectsMap[tid].set(asgn.subjectId, {
          id: asgn.subjectId,
          name: displayName,
          code: sub?.subjectCode || sub?.code || displayName,
        });
      }

      // Track distinct grade-level preparations (excluding advisory HGP)
      if (!isHGP && asgn.subjectId) {
        const sec = asgn.sectionId ? sectionsMap.get(asgn.sectionId) : null;
        const rawGrade = sec?.grade || sub?.gradeLevel || "";
        const gradeMatch = String(rawGrade).match(/\b(7|8|9|10|11|12)\b/);
        const gradeNum = gradeMatch ? gradeMatch[1] : "";
        const matchedFaculty = facultyById.get(tid);
        const primarySubj = Array.isArray(matchedFaculty?.subjectExpertise) && matchedFaculty.subjectExpertise.length > 0
          ? String(matchedFaculty.subjectExpertise[0]).split("—").pop().trim()
          : String(sub?.subjectName || sub?.name || sub?.subjectCode || asgn.subjectId).trim();
        const prepLabel = gradeNum ? `Grade ${gradeNum} (${primarySubj})` : primarySubj;
        if (!teacherDistinctPrepsMap[tid]) teacherDistinctPrepsMap[tid] = new Set();
        teacherDistinctPrepsMap[tid].add(prepLabel);
      }
    };

    processTeacherAssignment(asgn.teacherId);
    if (Array.isArray(asgn.coTeacherIds)) {
      asgn.coTeacherIds.forEach((coTid) => processTeacherAssignment(coTid));
    }
  });

  // Helper to check if a teacher is a Class Adviser (from HGP assignment or profile)
  const checkIsClassAdviser = (f) =>
    Boolean(
      teacherAbsorbedHGPMap[f.id] ||
      f.isClassAdviser ||
      (Array.isArray(f.ancillaryAssignments) && f.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
    );

  // Find the highest assigned teaching load across the roster so the highest load always equals 100% of the progress bar regardless of status
  let highestAssignedHours = 0;
  facultyList.forEach((f) => {
    const pCount = teacherPeriodCounts[f.id] || 0;
    const classroomHrs = Math.round(((pCount * periodMinutes) / 60) * 10) / 10;
    const isAdv = checkIsClassAdviser(f);
    // DepEd DO 005, s. 2024: Class Adviser equivalence is 5.0 hrs/wk (1 hr/day, which includes the 1h HGP period)
    const advCredit = isAdv && (pCount > 0 || teacherAbsorbedHGPMap[f.id]) ? 5 : 0;
    const hrs = Math.round((classroomHrs + advCredit) * 10) / 10;
    if (hrs > highestAssignedHours) {
      highestAssignedHours = hrs;
    }
  });
  const progressBarCeilingHours = highestAssignedHours > 0 ? highestAssignedHours : 30;

  return facultyList.map((faculty) => {
    const periodCount = teacherPeriodCounts[faculty.id] || 0;
    const totalMinutes = periodCount * periodMinutes;
    const classroomContactHours = Math.round((totalMinutes / 60) * 10) / 10;

    const hasAdvisoryHGP = Boolean(teacherAbsorbedHGPMap[faculty.id]);
    const isClassAdviser = checkIsClassAdviser(faculty);
    // Include 5h Class Adviser credit (which already absorbs the 1h HGP period) into the total credited weekly load
    const advisoryCreditAdded = isClassAdviser && (periodCount > 0 || hasAdvisoryHGP) ? 5 : 0;
    const totalHours = Math.round((classroomContactHours + advisoryCreditAdded) * 10) / 10;
    const dailyHours = Math.round((totalHours / 5) * 10) / 10;
    const autoAdvisorySection = teacherAdvisorySectionMap[faculty.id] || faculty.advisorySection || "";

    const rawAppt = faculty.appointmentStatus || faculty.employmentStatus || "Permanent";
    let appointmentStatus = "Permanent";
    const lowAppt = String(rawAppt).toLowerCase();
    if (lowAppt.includes("prov") || lowAppt.includes("prob")) {
      appointmentStatus = "Provisional";
    } else if (lowAppt.includes("cont")) {
      appointmentStatus = "Contractual";
    } else if (lowAppt.includes("sub")) {
      appointmentStatus = "Substitute";
    } else if (lowAppt.includes("part")) {
      appointmentStatus = "Permanent";
    }

    const rawArrangement = faculty.workingArrangement || (String(faculty.employmentStatus).toLowerCase().includes("part") ? "Part-Time" : "Full-Time");
    const workingArrangement = String(rawArrangement).toLowerCase().includes("part") ? "Part-Time" : "Full-Time";
    const isPartTime = workingArrangement === "Part-Time";

    // Magna Carta & DepEd DO 005, s. 2024:
    // Statutory maximum classroom teaching is 30 contact hours/week (6 hrs/day).
    // Operational Workload Categories (aligned 100% with the top KPI tiles):
    // - Unassigned: 0 contact hours assigned
    // - Underload: < 15 contact hours/week (< 10h for part-time)
    // - Balanced: 15 - 30 contact hours/week (10 - 20h for part-time)
    // - Overload: > 30 contact hours/week (> 20h for part-time)
    const isMajorAncillary = Boolean(
      Array.isArray(faculty.ancillaryAssignments) && faculty.ancillaryAssignments.some((a) => {
        const l = String(a).toLowerCase();
        return l.includes("drrm") || l.includes("ict") || l.includes("custodian") || (l.includes("guidance") && !l.includes("homeroom")) || l.includes("registrar") || l.includes("canteen") || l.includes("testing");
      })
    );
    const hasActiveAdvisory = isClassAdviser || Boolean(teacherAbsorbedHGPMap[faculty.id]);
    const ancillaryCreditHours = hasActiveAdvisory ? 5 : (isMajorAncillary ? 4 : (Number(faculty.ancillaryCreditHours) || 0));
    const maxTeachingContactHours = isPartTime ? 20 : 30;
    const minBalancedHours = isPartTime ? 10 : 15;

    const percent = Math.round((totalHours / maxTeachingContactHours) * 100);
    const progressBarPercent =
      totalHours > 0
        ? Math.max(4, Math.min(100, Math.round((totalHours / progressBarCeilingHours) * 100)))
        : 0;

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

    const statutoryTier = totalHours === 0 ? "Unassigned" : (totalHours >= 30 ? "Full load" : "Part load");

    const extractSectionGradeNum = (sec) => {
      if (sec?.grade) {
        const m = String(sec.grade).match(/\d+/);
        if (m) return parseInt(m[0], 10);
      }
      const m2 = String(sec?.label || sec?.name || sec?.id || "").match(/\b(7|8|9|10|11|12)\b/);
      return m2 ? parseInt(m2[1], 10) : 99;
    };

    const assignedSectionsList = (teacherSectionsMap[faculty.id] ? Array.from(teacherSectionsMap[faculty.id].values()) : [])
      .slice()
      .sort((a, b) => {
        const gA = extractSectionGradeNum(a);
        const gB = extractSectionGradeNum(b);
        if (gA !== gB) return gA - gB;
        return String(a.name || a.label || "").localeCompare(String(b.name || b.label || ""));
      });
    const assignedSubjectsList = teacherSubjectsMap[faculty.id] ? Array.from(teacherSubjectsMap[faculty.id].values()) : [];

    const prepsSet = teacherDistinctPrepsMap[faculty.id] || new Set();
    const extractPrepGradeNum = (p) => {
      const m = String(p).match(/Grade\s*(\d+)/i);
      return m ? parseInt(m[1], 10) : 99;
    };
    const distinctPrepsList = Array.from(prepsSet).sort((a, b) => {
      const gA = extractPrepGradeNum(a);
      const gB = extractPrepGradeNum(b);
      if (gA !== gB) return gA - gB;
      return String(a).localeCompare(String(b));
    });
    const distinctPrepsCount = distinctPrepsList.length;
    const distinctPrepsSummary = distinctPrepsList.join(", ") || "None";

    return {
      ...faculty,
      isClassAdviser,
      autoAdvisorySection,
      appointmentStatus,
      workingArrangement,
      isPartTime,
      distinctPrepsCount,
      distinctPrepsList,
      distinctPrepsSummary,
      hasAdvisoryHGP,
      ancillaryCreditHours,
      advisoryCreditAdded,
      classroomContactHours,
      maxTeachingContactHours,
      minBalancedHours,
      assignedPeriods: periodCount,
      assignedLoadMinutes: totalMinutes,
      assignedLoadHours: totalHours,
      dailyContactHours: dailyHours,
      assignedLoadPercent: percent,
      progressBarPercent,
      progressBarCeilingHours,
      assignedLoadStatus: status, // "Unassigned" | "Underload" | "Balanced" | "Overload"
      statutoryTier, // Informational DepEd statutory tier ("Full load" vs "Part load")
      assignedSections: assignedSectionsList,
      assignedSectionsSummary: assignedSectionsList.map((s) => s.label).join(", ") || "",
      assignedSubjects: assignedSubjectsList,
      assignedSubjectsSummary: assignedSubjectsList.map((s) => s.code || s.name).join(", ") || "",
    };
  });
}
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

const FACULTY_STORAGE_KEY = "turotugma_faculty";
const SUBJECTS_STORAGE_KEY = "turotugma_subjects";
const SCHEDULE_PERIODS_KEY = "turotugma_schedule_unavailable_periods";

const SEX_OPTIONS = ["Male", "Female", "Prefer not to say", "Other"];
const APPOINTMENT_STATUS_OPTIONS = ["Permanent", "Provisional", "Contractual", "Substitute"];
const WORKING_ARRANGEMENT_OPTIONS = ["Full-Time", "Part-Time"];
const EMPLOYMENT_STATUS_OPTIONS = ["Permanent", "Provisional", "Contractual", "Substitute"];
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
  "Class Adviser",
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
  appointmentStatus: "Permanent",
  workingArrangement: "Full-Time",
  employmentStatus: "Permanent",
  email: "",
  contact: "",
  degree: "",
  major: "",
  minor: "",
  isClassAdviser: false,
  advisorySection: "",
  ancillaryCreditHours: 0,
  ancillaryAssignments: [],
  ancillaryInput: "",
  unavailablePeriods: [],
  subjectExpertise: [],
  primaryExpertise: [],
  secondaryExpertise: [],
  gradeLevelAssignments: [],
};

export default function FacultyManagement() {
  const [facultyMembers, setFacultyMembers] = useState(() => getInitialFaculty());
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
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
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", confirmLabel: "Confirm", onConfirm: null, onCancel: null });
  const noticeTimerRef = useRef(null);
  const formCardRef = useRef(null);
  const drawerBodyRef = useRef(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportMenuOpen]);

  const subjectOptions = useMemo(() => getSubjectOptions(), []);
  const unavailablePeriodOptions = useMemo(() => getUnavailablePeriodOptions(), []);
  const sectionOptions = useMemo(() => getSectionOptions(), []);
  const [facultyWithLoad, setFacultyWithLoad] = useState([]);

  // Summary KPI statistics: Balanced vs Underload vs Overload vs Unassigned
  const loadKpis = useMemo(() => {
    let balanced = 0;
    let underload = 0;
    let overload = 0;
    let unassigned = 0;
    let full = 0;
    let part = 0;
    let totalContactHours = 0;

    facultyWithLoad.forEach((m) => {
      const status = m.assignedLoadStatus || "Unassigned";
      if (status === "Balanced") balanced += 1;
      else if (status === "Underload") underload += 1;
      else if (status === "Overload") overload += 1;
      else unassigned += 1;

      if (m.statutoryTier === "Full load" || status === "Full load") full += 1;
      else if (m.statutoryTier === "Part load" || status === "Part load") part += 1;

      totalContactHours += Number(m.assignedLoadHours) || 0;
    });

    const activeFacultyCount = facultyWithLoad.filter((m) => m.active !== false).length;
    const avgHours = activeFacultyCount > 0 ? (totalContactHours / activeFacultyCount).toFixed(1) : "0.0";

    return { balanced, underload, overload, unassigned, full, part, avgHours, total: facultyWithLoad.length };
  }, [facultyWithLoad]);

  // Helper to reliably trigger file download across Chromium, Edge, and Firefox
  const triggerDownloadFile = (content, filename, mimeType) => {
    try {
      const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });

      if (typeof window.navigator !== "undefined" && window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(blob, filename);
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = url;
      link.download = filename;
      link.setAttribute("download", filename);
      link.rel = "noopener";
      document.body.appendChild(link);

      try {
        const mouseEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        link.dispatchEvent(mouseEvent);
      } catch (e) {
        link.click();
      }

      // Retain blob URL for 60s so browser download manager finishes saving with custom filename
      setTimeout(() => {
        try {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
          window.URL.revokeObjectURL(url);
        } catch (_) {}
      }, 60000);
    } catch (err) {
      console.error("Download trigger failed:", err);
      throw err;
    }
  };

  // Send to server-side endpoint with official Content-Disposition & Content-Type headers
  const triggerServerDownload = (filename, contentType, content, base64) => {
    try {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "http://127.0.0.1:8000/export.php";
      form.style.display = "none";

      const fileInput = document.createElement("input");
      fileInput.type = "hidden";
      fileInput.name = "filename";
      fileInput.value = filename;
      form.appendChild(fileInput);

      const typeInput = document.createElement("input");
      typeInput.type = "hidden";
      typeInput.name = "contentType";
      typeInput.value = contentType;
      form.appendChild(typeInput);

      if (base64) {
        const b64Input = document.createElement("input");
        b64Input.type = "hidden";
        b64Input.name = "base64";
        b64Input.value = base64;
        form.appendChild(b64Input);
      } else if (content) {
        const contentInput = document.createElement("input");
        contentInput.type = "hidden";
        contentInput.name = "content";
        contentInput.value = content;
        form.appendChild(contentInput);
      }

      document.body.appendChild(form);
      form.submit();
      setTimeout(() => {
        if (form.parentNode) document.body.removeChild(form);
      }, 3000);
      return true;
    } catch (err) {
      console.warn("Server download submission failed:", err);
      return false;
    }
  };

  // Export DepEd Teacher Load Tracker spreadsheet (Excel or CSV)
  const handleExportRoster = (format = "xlsx") => {
    try {
      const rowsToExport = filteredFacultyMembers.map((member) => ({
        "Teacher Name": member.name,
        "Employee ID": member.employeeId,
        "Position / Designation": member.position,
        "Appointment Category": member.appointmentStatus || member.employmentStatus || "Permanent",
        "Working Arrangement": member.workingArrangement || (String(member.employmentStatus).toLowerCase().includes("part") ? "Part-Time" : "Full-Time"),
        "Active Status": member.active ? "Active" : "Inactive",
        "Distinct Preparations Count": member.distinctPrepsCount || 0,
        "Distinct Preparations": member.distinctPrepsSummary || "None",
        "Subject Expertise": Array.isArray(member.subjectExpertise) ? member.subjectExpertise.join(", ") : "",
        "Degree / Major": member.major ? `${member.degree || "BSED"} - ${member.major}` : (member.degree || ""),
        "Grade / Sections Assigned": member.assignedSectionsSummary || "None assigned",
        "Assigned Subjects": member.assignedSubjectsSummary || "None assigned",
        "Daily Contact Hours": `${member.dailyContactHours || 0} hrs/day`,
        "Weekly Contact Hours": `${member.assignedLoadHours || 0} hrs/wk`,
        "Weekly Periods (60 min)": member.assignedPeriods || 0,
        "Workload Status": member.assignedLoadStatus || "Unassigned",
        "Balanced Target Range": `${member.minBalancedHours || 20} - ${member.maxTeachingContactHours || 30} hrs/wk`,
        "Statutory Standard": "30.0 contact hrs/wk (6.0 hrs/day)",
        "Statutory Tier": member.statutoryTier || "Unassigned",
        "Class Adviser": member.isClassAdviser ? "Class Adviser (5h ancillary credit)" : "No",
        "Advisory HGP Credit": member.hasAdvisoryHGP ? "Absorbed in 5.0h advising credit" : "N/A",
        "Ancillary Duties": Array.isArray(member.ancillaryAssignments) ? member.ancillaryAssignments.join(", ") : "None",
      }));

      const dateStr = new Date().toISOString().slice(0, 10);
      const baseName = `DepEd_Teacher_Load_Tracker_${dateStr}`;
      const ws = XLSX.utils.json_to_sheet(rowsToExport);

      if (format === "csv") {
        const csvContent = XLSX.utils.sheet_to_csv(ws);
        const filename = `${baseName}.csv`;
        const contentType = "text/csv;charset=utf-8;";
        const submitted = triggerServerDownload(filename, contentType, "\uFEFF" + csvContent, null);

        if (!submitted) {
          const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent("\uFEFF" + csvContent);
          const link = document.createElement("a");
          link.style.display = "none";
          link.href = encodedUri;
          link.download = filename;
          link.setAttribute("download", filename);
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            if (link.parentNode) link.parentNode.removeChild(link);
          }, 2000);
        }
        showNotice("DepEd Teacher Load Tracker CSV (.csv) exported successfully!", "success");
        return;
      }

      // Default: Excel .xlsx
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Teacher Load Tracker");
      const base64Data = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
      const filename = `${baseName}.xlsx`;
      const contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const submitted = triggerServerDownload(filename, contentType, null, base64Data);

      if (!submitted) {
        const dataUri = `data:${contentType};base64,` + base64Data;
        const link = document.createElement("a");
        link.style.display = "none";
        link.href = dataUri;
        link.download = filename;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (link.parentNode) link.parentNode.removeChild(link);
        }, 2000);
      }
      showNotice("DepEd Teacher Load Tracker spreadsheet (.xlsx) exported successfully!", "success");
    } catch (e) {
      console.error("Export error:", e);
      showNotice("Failed to export faculty roster", "error");
    }
  };

  const handleExportLoadTracker = handleExportRoster;

  // Whenever faculty list, schedule, or config changes, recalculate loads
  useEffect(() => {
    function recalcLoads() {
      const loaded = calculateTeacherLoads(facultyMembers);
      setFacultyWithLoad(loaded);
    }
    recalcLoads();
    window.addEventListener("turotugma:faculty-updated", recalcLoads);
    window.addEventListener("turotugma_faculty_updated", recalcLoads);
    window.addEventListener("turotugma:schedule-updated", recalcLoads);
    window.addEventListener("storage", recalcLoads);
    return () => {
      window.removeEventListener("turotugma:faculty-updated", recalcLoads);
      window.removeEventListener("turotugma_faculty_updated", recalcLoads);
      window.removeEventListener("turotugma:schedule-updated", recalcLoads);
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

      // Dynamically sync updated teacher metadata into existing Schedule Drafts and Published Schedules
      try {
        const byId = new Map();
        if (Array.isArray(nextFaculty)) {
          nextFaculty.forEach((t) => {
            if (!t) return;
            if (t.id) byId.set(String(t.id), t);
            if (t.employeeId) byId.set(String(t.employeeId), t);
          });
        }

        const syncScheduleTeachers = (sched) => {
          if (!sched || typeof sched !== "object") return false;
          let changed = false;
          if (Array.isArray(sched.teachers)) {
            sched.teachers = sched.teachers.map((oldT) => {
              if (!oldT) return oldT;
              const match = byId.get(String(oldT.id)) || byId.get(String(oldT.employeeId));
              if (!match) return oldT;
              changed = true;
              return {
                ...oldT,
                ...match,
              };
            });
          }
          if (sched.assignments && typeof sched.assignments === "object") {
            Object.values(sched.assignments).forEach((asgn) => {
              if (!asgn || typeof asgn !== "object") return;
              if (asgn.teacherId && byId.has(String(asgn.teacherId))) {
                const match = byId.get(String(asgn.teacherId));
                if (asgn.teacherName && match.name && asgn.teacherName !== match.name) {
                  asgn.teacherName = match.name;
                  changed = true;
                }
              }
              if (Array.isArray(asgn.breakoutAssignments)) {
                asgn.breakoutAssignments.forEach((b) => {
                  if (b && b.teacherId && byId.has(String(b.teacherId))) {
                    const match = byId.get(String(b.teacherId));
                    if (match.name && b.teacherName !== match.name) {
                      b.teacherName = match.name;
                      changed = true;
                    }
                  }
                });
              }
            });
          }
          return changed;
        };

        const draftsRaw = window.localStorage.getItem("turotugma_schedule_drafts");
        if (draftsRaw) {
          const parsedDrafts = JSON.parse(draftsRaw);
          if (Array.isArray(parsedDrafts)) {
            let anyDraftChanged = false;
            parsedDrafts.forEach((d) => {
              const sched = d?.schedule || d;
              if (syncScheduleTeachers(sched)) {
                anyDraftChanged = true;
              }
            });
            if (anyDraftChanged) {
              window.localStorage.setItem("turotugma_schedule_drafts", JSON.stringify(parsedDrafts));
            }
          }
        }

        const pubRaw = window.localStorage.getItem("turotugma_published_schedules");
        if (pubRaw) {
          const parsedPub = JSON.parse(pubRaw);
          if (parsedPub && typeof parsedPub === "object") {
            let anyPubChanged = false;
            Object.values(parsedPub).forEach((sched) => {
              if (syncScheduleTeachers(sched)) {
                anyPubChanged = true;
              }
            });
            if (anyPubChanged) {
              window.localStorage.setItem("turotugma_published_schedules", JSON.stringify(parsedPub));
            }
          }
        }
      } catch {
        // Ignore schedule sync errors
      }

      window.dispatchEvent(new Event("turotugma:faculty-updated"));
      window.dispatchEvent(new Event("turotugma_faculty_updated"));
      window.dispatchEvent(new CustomEvent("turotugma:schedule-updated", { detail: { type: "faculty-sync" } }));
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
    window.addEventListener("turotugma_faculty_updated", syncFromStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", syncFromStorage);
      window.removeEventListener("turotugma:faculty-updated", syncFromStorage);
      window.removeEventListener("turotugma_faculty_updated", syncFromStorage);
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

    const currentAssignments = Array.isArray(formState.ancillaryAssignments) ? formState.ancillaryAssignments : [];
    const exists = currentAssignments.some((item) => item.toLowerCase() === value.toLowerCase());
    if (exists) {
      handleFormField("ancillaryInput", "");
      return;
    }

    const isAdviser = value.toLowerCase().includes("adviser");
    setFormState((prev) => ({
      ...prev,
      isClassAdviser: isAdviser ? true : prev.isClassAdviser,
      ancillaryAssignments: [...(prev.ancillaryAssignments || []), value],
      ancillaryInput: "",
    }));
  };

  const removeAncillaryAssignment = (assignment) => {
    const isAdviserRole = String(assignment).toLowerCase().includes("adviser");
    setFormState((prev) => ({
      ...prev,
      isClassAdviser: isAdviserRole ? false : prev.isClassAdviser,
      advisorySection: isAdviserRole ? "" : prev.advisorySection,
      ancillaryAssignments: (prev.ancillaryAssignments || []).filter((item) => item !== assignment),
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
        const normalizedEmployeeId = sanitizeText(mapped.employeeId).toLowerCase();
        const normalizedEmail = sanitizeText(mapped.email).toLowerCase();

        if (normalizedEmployeeId && (existingEmployeeIds.has(normalizedEmployeeId) || importEmployeeIds.has(normalizedEmployeeId))) {
          basicValidationErrors.employeeId = "Employee ID must be unique.";
        }

        if (normalizedEmail && (existingEmails.has(normalizedEmail) || importEmails.has(normalizedEmail))) {
          basicValidationErrors.email = "Email must be unique.";
        }

        const allRowErrors = Object.values(basicValidationErrors);
        if (allRowErrors.length > 0) {
          nextErrors.push(`Row ${lineNumber}: ${allRowErrors.join(" • ")}`);
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

  const handleLoad64Dataset = async () => {
    try {
      const text = `Name,Sex,Employee ID,Position,Employment Status,Email,Contact,Degree,Major,Minor,Ancillary Assignments,Unavailable Periods,Subject Expertise,Grade Level Assignments
Jose B. Reyes,Male,EMP-2026-001,Teacher II,Regular,jose.reyes1@deped.gov.ph,09171008765,Bachelor of Secondary Education,Mathematics,Education,Grade Level Chairman,,Mathematics,Grade 7; Grade 8; Grade 9; Grade 10
Cristina C. Cruz,Female,EMP-2026-002,Teacher III,Regular,cristina.cruz2@deped.gov.ph,09171017530,Bachelor of Secondary Education,Mathematics,Education,ICT Coordinator,,Mathematics,Grade 7; Grade 8; Grade 9; Grade 10
Gabriel D. Bautista,Male,EMP-2026-003,Master Teacher I,Regular,gabriel.bautista3@deped.gov.ph,09171026295,Bachelor of Secondary Education,Mathematics,Education,School Registrar Assistant,,Mathematics,Grade 7; Grade 8; Grade 9; Grade 10
Angelica E. Ocampo,Female,EMP-2026-004,Master Teacher II,Regular,angelica.ocampo4@deped.gov.ph,09171035060,Bachelor of Secondary Education,Mathematics,Education,Property Custodian Assistant,,Mathematics,Grade 7; Grade 8; Grade 9; Grade 10
Angelo F. Garcia,Male,EMP-2026-005,Teacher I,Regular,angelo.garcia5@deped.gov.ph,09171043825,Bachelor of Secondary Education,Mathematics,Education,DRRM Coordinator,,Mathematics,Grade 7; Grade 8; Grade 9; Grade 10
Jennifer G. Mendoza,Female,EMP-2026-006,Teacher II,Regular,jennifer.mendoza6@deped.gov.ph,09171052590,Bachelor of Secondary Education,Mathematics,Education,Canteen Coordinator,,Mathematics,Grade 7; Grade 8; Grade 9; Grade 10
Rafael H. Torres,Male,EMP-2026-007,Teacher III,Regular,rafael.torres7@deped.gov.ph,09171061355,Bachelor of Secondary Education,Mathematics,Education,,P1,Mathematics,Grade 7; Grade 8; Grade 9; Grade 10
Joshua L. Ramos,Male,EMP-2026-008,Teacher II,Regular,joshua.ramos8@deped.gov.ph,09171096415,Bachelor of Secondary Education,Mathematics,Education,Property Custodian Assistant,,Elementary Algebra,Grade 7; Grade 8; Grade 9; Grade 10
Stephanie I. Tomas,Female,EMP-2026-009,Master Teacher I,Probationary,stephanie.tomas9@deped.gov.ph,09171070120,Bachelor of Secondary Education,TLE / ICT,Education,Grade Level Chairman,,Technology and Livelihood Education (TLE),Grade 7; Grade 8; Grade 9; Grade 10
Francis J. Andrada,Male,EMP-2026-010,Master Teacher II,Regular,francis.andrada10@deped.gov.ph,09171078885,Bachelor of Secondary Education,TLE / ICT,Education,ICT Coordinator,P8,Technology and Livelihood Education (TLE),Grade 7; Grade 8; Grade 9; Grade 10
Rosemary K. Gonzales,Female,EMP-2026-011,Teacher I,Regular,rosemary.gonzales11@deped.gov.ph,09171087650,Bachelor of Secondary Education,Values / Guidance,Education,School Registrar Assistant,,Values Education,Grade 7; Grade 8; Grade 9; Grade 10
Teresa M. Aquino,Female,EMP-2026-012,Teacher III,Regular,teresa.aquino12@deped.gov.ph,09171105180,Bachelor of Secondary Education,Science,Education,DRRM Coordinator,,Science,Grade 7; Grade 8; Grade 9; Grade 10
Eduardo N. Villanueva,Male,EMP-2026-013,Master Teacher I,Regular,eduardo.villanueva13@deped.gov.ph,09171113945,Bachelor of Secondary Education,Science,Education,Canteen Coordinator,,Science,Grade 7; Grade 8; Grade 9; Grade 10
Veronica O. Castillo,Female,EMP-2026-014,Master Teacher II,Regular,veronica.castillo14@deped.gov.ph,09171122710,Bachelor of Secondary Education,Science,Education,,P1,Science,Grade 7; Grade 8; Grade 9; Grade 10
Ferdinand P. Flores,Male,EMP-2026-015,Teacher I,Regular,ferdinand.flores15@deped.gov.ph,09171131475,Bachelor of Secondary Education,Science,Education,Grade Level Chairman,,Science,Grade 7; Grade 8; Grade 9; Grade 10
Corazon Q. Navarro,Female,EMP-2026-016,Teacher II,Probationary,corazon.navarro16@deped.gov.ph,09171140240,Bachelor of Secondary Education,Science,Education,ICT Coordinator,,Science,Grade 7; Grade 8; Grade 9; Grade 10
Dominic R. Mercado,Male,EMP-2026-017,Teacher III,Regular,dominic.mercado17@deped.gov.ph,09171149005,Bachelor of Secondary Education,Science,Education,School Registrar Assistant,,Science,Grade 7; Grade 8; Grade 9; Grade 10
Rowena S. Aguilar,Female,EMP-2026-018,Master Teacher I,Regular,rowena.aguilar18@deped.gov.ph,09171157770,Bachelor of Secondary Education,Science,Education,Property Custodian Assistant,P8,Science,Grade 7; Grade 8; Grade 9; Grade 10
Ricardo X. Santiago,Male,EMP-2026-019,Master Teacher I,Regular,ricardo.santiago19@deped.gov.ph,09171201595,Bachelor of Secondary Education,Science,Education,ICT Coordinator,,Environmental Science,Grade 7; Grade 8; Grade 9; Grade 10
Victor T. Valenzuela,Male,EMP-2026-020,Master Teacher II,Regular,victor.valenzuela20@deped.gov.ph,09171166535,Bachelor of Secondary Education,TLE / ICT,Education,DRRM Coordinator,,Technology and Livelihood Education (TLE),Grade 7; Grade 8; Grade 9; Grade 10
Jasmine U. Del Rosario,Female,EMP-2026-021,Teacher I,Regular,jasmine.delrosario21@deped.gov.ph,09171175300,Bachelor of Secondary Education,TLE / ICT,Education,Canteen Coordinator,,Technology and Livelihood Education (TLE),Grade 7; Grade 8; Grade 9; Grade 10
Vicente V. De Leon,Male,EMP-2026-022,Teacher II,Regular,vicente.deleon22@deped.gov.ph,09171184065,Bachelor of Secondary Education,Values / Guidance,Education,,P1,Values Education,Grade 7; Grade 8; Grade 9; Grade 10
Gwendolyn W. Perez,Female,EMP-2026-023,Teacher III,Regular,gwendolyn.perez23@deped.gov.ph,09171192830,Bachelor of Secondary Education,Values / Guidance,Education,Grade Level Chairman,,Values Education,Grade 7; Grade 8; Grade 9; Grade 10
Maricel Y. Soriano,Female,EMP-2026-024,Master Teacher II,Probationary,maricel.soriano24@deped.gov.ph,09171210360,Bachelor of Secondary Education,English,Education,School Registrar Assistant,,English,Grade 7; Grade 8; Grade 9; Grade 10
Edgardo Z. Corpuz,Male,EMP-2026-025,Teacher I,Regular,edgardo.corpuz25@deped.gov.ph,09171219125,Bachelor of Secondary Education,English,Education,Property Custodian Assistant,,English,Grade 7; Grade 8; Grade 9; Grade 10
Josefina A. Manalo,Female,EMP-2026-026,Teacher II,Regular,josefina.manalo26@deped.gov.ph,09171227890,Bachelor of Secondary Education,English,Education,DRRM Coordinator,,English,Grade 7; Grade 8; Grade 9; Grade 10
Roderick B. Dela Rosa,Male,EMP-2026-027,Teacher III,Regular,roderick.delarosa27@deped.gov.ph,09171236655,Bachelor of Secondary Education,English,Education,Canteen Coordinator,P8,English,Grade 7; Grade 8; Grade 9; Grade 10
Consuelo C. Pineda,Female,EMP-2026-028,Master Teacher I,Regular,consuelo.pineda28@deped.gov.ph,09171245420,Bachelor of Secondary Education,English,Education,,P1,English,Grade 7; Grade 8; Grade 9; Grade 10
Stephen D. Valdez,Male,EMP-2026-029,Master Teacher II,Regular,stephen.valdez29@deped.gov.ph,09171254185,Bachelor of Secondary Education,English,Education,Grade Level Chairman,,English,Grade 7; Grade 8; Grade 9; Grade 10
Maria E. Fernandez,Female,EMP-2026-030,Teacher I,Regular,maria.fernandez30@deped.gov.ph,09171262950,Bachelor of Secondary Education,MAPEH,Education,ICT Coordinator,,MAPEH,Grade 7; Grade 8; Grade 9; Grade 10
Nathaniel F. Sison,Male,EMP-2026-031,Teacher II,Regular,nathaniel.sison31@deped.gov.ph,09171271715,Bachelor of Secondary Education,MAPEH,Education,School Registrar Assistant,,MAPEH,Grade 7; Grade 8; Grade 9; Grade 10
Cristina G. Tiongson,Female,EMP-2026-032,Teacher III,Probationary,cristina.tiongson32@deped.gov.ph,09171280480,Bachelor of Secondary Education,Values / Guidance,Education,Property Custodian Assistant,,Values Education,Grade 7; Grade 8; Grade 9; Grade 10
Christopher H. Dizon,Male,EMP-2026-033,Master Teacher I,Regular,christopher.dizon33@deped.gov.ph,09171289245,Bachelor of Secondary Education,English,Education,DRRM Coordinator,,Developmental Reading,Grade 7; Grade 8; Grade 9; Grade 10
Angelica I. Guerrero,Female,EMP-2026-034,Master Teacher II,Regular,angelica.guerrero34@deped.gov.ph,09171298010,Bachelor of Secondary Education,English,Education,Canteen Coordinator,,Aral Program,Grade 7; Grade 8; Grade 9; Grade 10
Matthew J. Marquez,Male,EMP-2026-035,Teacher I,Regular,matthew.marquez35@deped.gov.ph,09171306775,Bachelor of Secondary Education,Filipino,Education,,P1,Filipino,Grade 7; Grade 8; Grade 9; Grade 10
Jennifer K. Pascual,Female,EMP-2026-036,Teacher II,Regular,jennifer.pascual36@deped.gov.ph,09171315540,Bachelor of Secondary Education,Filipino,Education,Grade Level Chairman,P8,Filipino,Grade 7; Grade 8; Grade 9; Grade 10
Nicholas L. Salvador,Male,EMP-2026-037,Teacher III,Regular,nicholas.salvador37@deped.gov.ph,09171324305,Bachelor of Secondary Education,Filipino,Education,ICT Coordinator,,Filipino,Grade 7; Grade 8; Grade 9; Grade 10
Stephanie M. Ventura,Female,EMP-2026-038,Master Teacher I,Regular,stephanie.ventura38@deped.gov.ph,09171333070,Bachelor of Secondary Education,Filipino,Education,School Registrar Assistant,,Filipino,Grade 7; Grade 8; Grade 9; Grade 10
Patrick N. Cabrera,Male,EMP-2026-039,Master Teacher II,Regular,patrick.cabrera39@deped.gov.ph,09171341835,Bachelor of Secondary Education,Filipino,Education,Property Custodian Assistant,,Filipino,Grade 7; Grade 8; Grade 9; Grade 10
Rosemary O. Serrano,Female,EMP-2026-040,Teacher I,Probationary,rosemary.serrano40@deped.gov.ph,09171350600,Bachelor of Secondary Education,Filipino,Education,DRRM Coordinator,,Filipino,Grade 7; Grade 8; Grade 9; Grade 10
Jose P. Morales,Male,EMP-2026-041,Teacher II,Regular,jose.morales41@deped.gov.ph,09171359365,Bachelor of Secondary Education,Filipino,Education,Canteen Coordinator,,Filipino,Grade 7; Grade 8; Grade 9; Grade 10
Teresa Q. Cordero,Female,EMP-2026-042,Teacher III,Regular,teresa.cordero42@deped.gov.ph,09171368130,Bachelor of Secondary Education,Filipino,Education,,P1,Filipino,Grade 7; Grade 8; Grade 9; Grade 10
Gabriel R. Miranda,Male,EMP-2026-043,Master Teacher I,Regular,gabriel.miranda43@deped.gov.ph,09171376895,Bachelor of Secondary Education,Araling Panlipunan,Education,Grade Level Chairman,,Araling Panlipunan,Grade 7; Grade 8; Grade 9; Grade 10
Veronica S. Padilla,Female,EMP-2026-044,Master Teacher II,Regular,veronica.padilla44@deped.gov.ph,09171385660,Bachelor of Secondary Education,Araling Panlipunan,Education,ICT Coordinator,,Araling Panlipunan,Grade 7; Grade 8; Grade 9; Grade 10
Angelo T. Rosales,Male,EMP-2026-045,Teacher I,Regular,angelo.rosales45@deped.gov.ph,09171394425,Bachelor of Secondary Education,Araling Panlipunan,Education,School Registrar Assistant,P8,Araling Panlipunan,Grade 7; Grade 8; Grade 9; Grade 10
Corazon U. Velasco,Female,EMP-2026-046,Teacher II,Regular,corazon.velasco46@deped.gov.ph,09171403190,Bachelor of Secondary Education,Araling Panlipunan,Education,Property Custodian Assistant,,Araling Panlipunan,Grade 7; Grade 8; Grade 9; Grade 10
Rafael V. Zapata,Male,EMP-2026-047,Teacher III,Regular,rafael.zapata47@deped.gov.ph,09171411955,Bachelor of Secondary Education,Araling Panlipunan,Education,DRRM Coordinator,,Araling Panlipunan,Grade 7; Grade 8; Grade 9; Grade 10
Rowena W. Gutierrez,Female,EMP-2026-048,Master Teacher I,Probationary,rowena.gutierrez48@deped.gov.ph,09171420720,Bachelor of Secondary Education,Araling Panlipunan,Education,Canteen Coordinator,,Araling Panlipunan,Grade 7; Grade 8; Grade 9; Grade 10
Francis X. Alvarez,Male,EMP-2026-049,Master Teacher II,Regular,francis.alvarez49@deped.gov.ph,09171429485,Bachelor of Secondary Education,Araling Panlipunan,Education,,P1,Araling Panlipunan,Grade 7; Grade 8; Grade 9; Grade 10
Jasmine Y. Santos,Female,EMP-2026-050,Teacher I,Regular,jasmine.santos50@deped.gov.ph,09171438250,Bachelor of Secondary Education,Araling Panlipunan,Education,Grade Level Chairman,,Araling Panlipunan,Grade 7; Grade 8; Grade 9; Grade 10
Cherry Mae Garing,Female,EMP-2026-051,Teacher I,Regular,cherry.garing@deped.gov.ph,09171447015,Bachelor of Secondary Education,MAPEH (SPA Media Arts),Education,ICT Coordinator,,SPA Specialization (Media Arts),Grade 7; Grade 8; Grade 9; Grade 10
Alpha Mae Ambatali,Female,EMP-2026-052,Teacher II,Regular,alpha.ambatali@deped.gov.ph,09171455780,Bachelor of Secondary Education,MAPEH (SPA Dance Arts),Education,School Registrar Assistant,,SPA Specialization (Dance Arts),Grade 7; Grade 8; Grade 9; Grade 10
May Bitla,Female,EMP-2026-053,Teacher III,Regular,may.bitla@deped.gov.ph,09171464545,Bachelor of Secondary Education,MAPEH (SPA Instrumental Music),Education,Property Custodian Assistant,,SPA Specialization (Instrumental Music),Grade 7; Grade 8; Grade 9; Grade 10
Joshua Z. Reyes,Male,EMP-2026-054,Master Teacher I,Regular,joshua.reyes@deped.gov.ph,09171473310,Bachelor of Secondary Education,MAPEH (SPA Visual Arts),Education,DRRM Coordinator,P8,SPA Specialization (Visual Arts),Grade 7; Grade 8; Grade 9; Grade 10
Gwendolyn A. Cruz,Female,EMP-2026-055,Teacher II,Regular,gwendolyn.cruz@deped.gov.ph,09171482075,Bachelor of Secondary Education,MAPEH,Education,Canteen Coordinator,,MAPEH,Grade 7; Grade 8; Grade 9; Grade 10
Eduardo B. Bautista,Male,EMP-2026-056,Master Teacher II,Probationary,eduardo.bautista@deped.gov.ph,09171490840,Bachelor of Secondary Education,MAPEH,Education,,P1,MAPEH,Grade 7; Grade 8; Grade 9; Grade 10
Dominic F. Torres,Male,EMP-2026-057,Teacher III,Regular,dominic.torres57@deped.gov.ph,09171499605,Bachelor of Secondary Education,TLE / ICT,Education,Grade Level Chairman,,Technology and Livelihood Education (TLE),Grade 7; Grade 8; Grade 9; Grade 10
Consuelo G. Tomas,Female,EMP-2026-058,Master Teacher I,Regular,consuelo.tomas58@deped.gov.ph,09171508370,Bachelor of Secondary Education,TLE / ICT,Education,ICT Coordinator,,Technology and Livelihood Education (TLE),Grade 7; Grade 8; Grade 9; Grade 10
Victor H. Andrada,Male,EMP-2026-059,Master Teacher II,Regular,victor.andrada59@deped.gov.ph,09171517135,Bachelor of Secondary Education,TLE / ICT,Education,School Registrar Assistant,,ICT (SPJ),Grade 7; Grade 8; Grade 9; Grade 10
Maria I. Gonzales,Female,EMP-2026-060,Teacher I,Regular,maria.gonzales60@deped.gov.ph,09171525900,Bachelor of Secondary Education,TLE / ICT,Education,Property Custodian Assistant,,ICT (SP-STEM),Grade 7; Grade 8; Grade 9; Grade 10
Vicente J. Ramos,Male,EMP-2026-061,Teacher II,Regular,vicente.ramos61@deped.gov.ph,09171534665,Bachelor of Secondary Education,Values / Guidance,Education,DRRM Coordinator,,Values Education,Grade 7; Grade 8; Grade 9; Grade 10
Cristina K. Aquino,Female,EMP-2026-062,Teacher III,Regular,cristina.aquino62@deped.gov.ph,09171543430,Bachelor of Secondary Education,Values / Guidance,Education,Canteen Coordinator,,Values Education,Grade 7; Grade 8; Grade 9; Grade 10
Ricardo L. Villanueva,Male,EMP-2026-063,Master Teacher I,Regular,ricardo.villanueva63@deped.gov.ph,09171552195,Bachelor of Secondary Education,Values / Guidance,Education,,P1,Values Education,Grade 7; Grade 8; Grade 9; Grade 10
Angelica M. Castillo,Female,EMP-2026-064,Master Teacher II,Probationary,angelica.castillo64@deped.gov.ph,09171560960,Bachelor of Secondary Education,Values / Guidance,Education,Grade Level Chairman,,Values Education,Grade 7; Grade 8; Grade 9; Grade 10`;

      const workbook = XLSX.read(text, { type: "string" });
      const sheetName = workbook.SheetNames[0];
      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" }).slice(0, 64);
      const mapped = rawRows
        .map((row) => {
          const item = mapImportedFacultyRow(row, subjectOptions, unavailablePeriodOptions);
          if (!item) return null;
          // Enforce strictly 1 subject per teacher while keeping multiple grade levels
          const singleSubject = Array.isArray(item.subjectExpertise) && item.subjectExpertise.length > 0
            ? [item.subjectExpertise[0]]
            : [];
          return {
            ...item,
            subjectExpertise: singleSubject,
            primaryExpertise: singleSubject,
            secondaryExpertise: [],
          };
        })
        .filter(Boolean);
      persistFaculty(mapped);
      showNotice(`Successfully loaded ${mapped.length} DepEd Faculty Profiles (1 Subject per Teacher, Multi-Grade Levels & SPA Specializations)!`, "success");
    } catch {
      showNotice("Failed to load 64 faculty dataset.", "error");
    }
  };

  const handleClearAllFaculty = () => {
    setConfirmModal({
      open: true,
      title: "Clear All Faculty",
      message: "Are you sure you want to clear ALL faculty members? This action cannot be undone.",
      confirmLabel: "Clear All",
      onConfirm: () => {
        persistFaculty([]);
        showNotice("All faculty members cleared.", "success");
        setConfirmModal({ open: false });
      },
      onCancel: () => setConfirmModal({ open: false }),
    });
  };

  const handleSaveFaculty = () => {
    // 1. Auto-commit any pending ancillary input text first!
    let nextAncillaryAssignments = Array.isArray(formState.ancillaryAssignments) ? [...formState.ancillaryAssignments] : [];
    const pendingAncillary = sanitizeText(formState.ancillaryInput);
    if (pendingAncillary && !nextAncillaryAssignments.some((item) => item.toLowerCase() === pendingAncillary.toLowerCase())) {
      nextAncillaryAssignments.push(pendingAncillary);
    }

    const stateToValidate = {
      ...formState,
      ancillaryAssignments: nextAncillaryAssignments,
      ancillaryInput: "",
    };

    const liveValidationErrors = validateFacultyForm(stateToValidate, facultyMembers, editingId);
    const hasErrors = Object.keys(liveValidationErrors).length > 0;
    if (hasErrors) {
      setTouched({
        name: true,
        sex: true,
        employeeId: true,
        position: true,
        employmentStatus: true,
        appointmentStatus: true,
        email: true,
        contact: true,
        subjectExpertise: true,
        gradeLevelAssignments: true,
      });
      const allErrorMsgs = Object.values(liveValidationErrors);
      const summaryMsg = allErrorMsgs.length > 0 ? allErrorMsgs.join(" • ") : "Please fix highlighted fields.";
      showNotice(summaryMsg, "error");
      return;
    }

    const normalized = normalizeFacultyRecord(stateToValidate, editingId);

    if (editingId) {
      const existing = facultyMembers.find((member) => member.id === editingId);
      if (!existing) {
        showNotice("Selected faculty record was not found.", "error");
        return;
      }

      const nextFaculty = facultyMembers.map((member) =>
        member.id === editingId
          ? {
              ...member,
              ...normalized,
              active: typeof member.active === "boolean" ? member.active : true,
              assignedLoadPercent: Number.isFinite(member.assignedLoadPercent) ? member.assignedLoadPercent : 0,
              createdAt: member.createdAt || normalized.createdAt,
              updatedAt: new Date().toISOString(),
            }
          : member
      );

      persistFaculty(nextFaculty);
      setEditingId(null);
      setFormState(EMPTY_FORM);
      setTouched({});
      setIsDrawerOpen(false);
      showNotice("Faculty record updated successfully.", "success");
      return;
    }

    persistFaculty([...facultyMembers, normalized]);
    setFormState(EMPTY_FORM);
    setTouched({});
    setIsDrawerOpen(false);
    showNotice("Faculty record added successfully.", "success");
  };

  const handleAddNewFaculty = () => {
    setEditingId(null);
    setFormState(EMPTY_FORM);
    setTouched({});
    setIsDrawerOpen(true);
    if (drawerBodyRef.current) {
      drawerBodyRef.current.scrollTop = 0;
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
    setFormState(EMPTY_FORM);
    setTouched({});
  };

  const handleEditFaculty = (member) => {
    setEditingId(member.id);
    const hasAdviserAncillary = Array.isArray(member.ancillaryAssignments) &&
      member.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser"));
    const isAdviser = Boolean(member.isClassAdviser || hasAdviserAncillary);

    setFormState({
      name: member.name || "",
      sex: member.sex || "",
      employeeId: member.employeeId || "",
      position: member.position || "Teacher I",
      appointmentStatus: member.appointmentStatus || member.employmentStatus || "Permanent",
      workingArrangement: member.workingArrangement || (String(member.employmentStatus).toLowerCase().includes("part") ? "Part-Time" : "Full-Time"),
      employmentStatus: member.appointmentStatus || member.employmentStatus || "Permanent",
      email: member.email || "",
      contact: member.contact || "",
      degree: member.degree || "",
      major: member.major || "",
      minor: member.minor || "",
      isClassAdviser: isAdviser,
      advisorySection: member.advisorySection || "",
      ancillaryCreditHours: Number(member.ancillaryCreditHours) || 0,
      ancillaryAssignments: Array.isArray(member.ancillaryAssignments) ? [...member.ancillaryAssignments] : [],
      ancillaryInput: "",
      unavailablePeriods: Array.isArray(member.unavailablePeriods) ? [...member.unavailablePeriods] : [],
      subjectExpertise: Array.isArray(member.subjectExpertise) ? [...member.subjectExpertise] : (Array.isArray(member.primaryExpertise) ? [...member.primaryExpertise] : []),
      primaryExpertise: Array.isArray(member.primaryExpertise) ? [...member.primaryExpertise] : (Array.isArray(member.subjectExpertise) ? [...member.subjectExpertise] : []),
      secondaryExpertise: Array.isArray(member.secondaryExpertise) ? [...member.secondaryExpertise] : [],
      gradeLevelAssignments: Array.isArray(member.gradeLevelAssignments) ? [...member.gradeLevelAssignments] : [],
    });
    setTouched({});
    setIsDrawerOpen(true);

    if (drawerBodyRef.current) {
      drawerBodyRef.current.scrollTop = 0;
    }
    showNotice("Edit mode enabled.", "success");
  };

  const handleCancelEdit = () => {
    handleCloseDrawer();
    showNotice("Edit cancelled.", "success");
  };

  // Close drawer on Escape key and lock background scroll
  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleCloseDrawer();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  const handleDeleteFaculty = (memberId) => {
    const targetMember = facultyMembers.find((m) => m.id === memberId);
    const memberName = targetMember?.name || "this faculty member";

    setConfirmModal({
      open: true,
      title: "Delete Faculty Member",
      message: `Are you sure you want to delete "${memberName}"?`,
      confirmLabel: "Delete",
      onConfirm: () => {
        const nextFaculty = facultyMembers.filter((member) => member.id !== memberId);
        persistFaculty(nextFaculty);

        if (editingId === memberId) {
          setEditingId(null);
          setFormState(EMPTY_FORM);
          setTouched({});
          setIsDrawerOpen(false);
        }

        showNotice("Faculty record deleted.", "success");
        setConfirmModal({ open: false });
      },
      onCancel: () => setConfirmModal({ open: false }),
    });
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
        const memberLoadStatus = (member.assignedLoadStatus || "Unassigned").toLowerCase();
        const target = workloadFilter.toLowerCase();
        if (target === "balanced") {
          if (memberLoadStatus !== "balanced") return false;
        } else if (target === "underload") {
          if (memberLoadStatus !== "underload") return false;
        } else if (target === "overload") {
          if (memberLoadStatus !== "overload") return false;
        } else if (target === "unassigned") {
          if (memberLoadStatus !== "unassigned") return false;
        } else if (target === "full load") {
          if (memberLoadStatus !== "balanced" && member.statutoryTier !== "Full load") return false;
        } else if (target === "part load") {
          if (memberLoadStatus !== "underload" && member.statutoryTier !== "Part load") return false;
        } else if (memberLoadStatus !== target) {
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

      const searchable = [
        member.name,
        member.employeeId,
        member.email,
        member.position,
        member.degree,
        member.major,
        member.assignedSectionsSummary,
        member.assignedSubjectsSummary,
      ].map((item) => String(item || "").toLowerCase()).join(" ");
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
  const maxLoadMinutes = useMemo(() => {
    if (!facultyWithLoad || facultyWithLoad.length === 0) return 0;
    return Math.max(...facultyWithLoad.map((m) => m.assignedLoadMinutes || 0), 0);
  }, [facultyWithLoad]);

  return (
    <>
      <style>
        {`
          .faculty-scroll-list::-webkit-scrollbar { display: none; }
          .faculty-drawer-scroll::-webkit-scrollbar { width: 6px; }
          .faculty-drawer-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          .faculty-drawer-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          .faculty-drawer-scroll::-webkit-scrollbar-track { background: transparent; }

          @media (max-width: 1280px) {
            .faculty-header {
              flex-direction: column;
              align-items: flex-start;
            }

            .faculty-header-actions {
              width: 100%;
              align-items: flex-start;
            }

            .faculty-filter-row-primary,
            .faculty-filter-row-secondary {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .faculty-filter-row-primary > button {
              width: 100%;
            }

            .faculty-scroll-list {
              max-height: 600px !important;
            }
          }

          @media (max-width: 900px) {
            .faculty-filter-row-primary,
            .faculty-filter-row-secondary {
              grid-template-columns: 1fr !important;
            }

            .faculty-scroll-list {
              max-height: 520px !important;
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
          <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Faculty Management</h1>
          <p style={{ margin: "6px 0 0", color: "#5b6787", fontSize: 13.5 }}>
            Manage teacher profiles, DepEd contact hours, subject expertise, and section assignments.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
            <span>Total Profiled: <strong style={{ color: "#1f2c6f" }}>{facultyMembers.length}</strong></span>
            <span>•</span>
            <span>Active: <strong style={{ color: "#047857" }}>{activeCount}</strong></span>
            <span>•</span>
            <span>Benchmark: <strong style={{ color: "#1f2c6f" }}>30.0 contact hrs/wk</strong> (DepEd DO 005, s. 2024 &amp; RA 4670)</span>
          </div>
        </div>

        <div className="faculty-header-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleAddNewFaculty}
            style={{
              ...primaryActionStyle(),
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 700,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            <span>Add Faculty</span>
          </button>
          <div style={{ position: "relative" }} ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportMenuOpen((prev) => !prev)}
              style={{
                ...secondaryActionStyle(),
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>Export Roster</span>
              <span style={{ fontSize: 10 }}>▾</span>
            </button>
            {exportMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 4,
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
                  zIndex: 100,
                  minWidth: 200,
                  padding: "4px 0",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExportRoster("xlsx");
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 14px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: "#1e293b",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <span>Excel Spreadsheet</span>
                  <span style={{ fontSize: 11, color: "#3B4197", fontWeight: 700, background: "#eef2ff", padding: "2px 6px", borderRadius: 4 }}>.xlsx</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExportRoster("csv");
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 14px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: "#1e293b",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <span>CSV Document</span>
                  <span style={{ fontSize: 11, color: "#475569", fontWeight: 700, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>.csv</span>
                </button>
              </div>
            )}
          </div>
          <button type="button" onClick={() => setShowImportPanel((prev) => !prev)} style={secondaryActionStyle()}>
            {showImportPanel ? "Hide Import" : "Import Teachers"}
          </button>
          <button
            type="button"
            onClick={handleLoad64Dataset}
            style={{
              ...secondaryActionStyle(),
              background: "#eef2ff",
              color: "#3B4197",
              border: "1px solid #c7d2fe",
            }}
          >
            Load 64 Teachers
          </button>
          <button type="button" onClick={handleClearAllFaculty} style={dangerActionStyle()}>
            Clear All Faculty
          </button>

          {notice ? (
            <div
              role="status"
              aria-live="polite"
              style={{
                position: "fixed",
                top: 24,
                right: 24,
                zIndex: 100000,
                background: noticeType === "error" ? "#dc2626" : "#3B4197",
                color: "#ffffff",
                borderRadius: 10,
                padding: "12px 18px",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.25)",
                maxWidth: 420,
                display: "flex",
                alignItems: "center",
                gap: 10,
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {noticeType === "error" ? "!" : "i"}
              </span>
              <span>{notice}</span>
            </div>
          ) : null}
        </div>
      </div>

      {showImportPanel ? (
        <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>Import Teachers (Excel/CSV)</h2>
          <p style={{ margin: "6px 0 0", color: "#5d698d", fontSize: 13, lineHeight: 1.5 }}>
            <strong style={{ color: "#1f2c6f" }}>Required Columns:</strong> Name, Sex (Male/Female or M/F), Employee ID (unique), Position, Email (unique), Contact (09XXXXXXXXX or +639XXXXXXXXX), Subject Expertise, and Grade Level Assignments (e.g., Grade 7, Grade 8).
          </p>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12.5, lineHeight: 1.5 }}>
            <strong style={{ color: "#475569" }}>Optional Columns:</strong> Employment Status (defaults to Permanent), Working Arrangement (defaults to Full-Time), Degree, Major, Minor, Ancillary Assignments, Unavailable Periods.
          </p>

          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFacultyImportFileChange} style={{ ...inputStyle(), paddingTop: 7, height: 38 }} />
            <button type="button" onClick={handleImportFacultyRows} style={primaryActionStyle()} disabled={!importPreviewRows.length || isParsingImport}>
              Import Valid Rows
            </button>
            <button
              type="button"
              onClick={handleLoad64Dataset}
              style={{
                ...secondaryActionStyle(),
                background: "#eef2ff",
                color: "#3B4197",
                border: "1px solid #c7d2fe",
              }}
            >
              Load 64 Teachers Dataset
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

      {/* Executive Workload Distribution Ribbon & Quick-Filter Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Card 1: Total Profiled */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setWorkloadFilter("all")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setWorkloadFilter("all"); } }}
          style={{
            background: workloadFilter === "all" ? "#f0f4ff" : "#ffffff",
            border: workloadFilter === "all" ? "2px solid #3B4197" : "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "12px 16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Total Faculty
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#1f2c6f", lineHeight: 1 }}>{facultyWithLoad.length}</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>profiled</span>
          </div>
          <div style={{ fontSize: 11, color: "#047857", marginTop: 4, fontWeight: 600 }}>
            {activeCount} active · avg {loadKpis.avgHours}h/wk
          </div>
        </div>

        {/* Card 2: Balanced Target Load */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setWorkloadFilter("balanced")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setWorkloadFilter("balanced"); } }}
          style={{
            background: workloadFilter === "balanced" ? "#f0f4ff" : "#ffffff",
            border: workloadFilter === "balanced" ? "2px solid #3B4197" : "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "12px 16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#3B4197", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Balanced (Target Load)
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#3B4197", lineHeight: 1 }}>{loadKpis.balanced}</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>teachers</span>
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
            15–30 contact hrs/wk
          </div>
        </div>

        {/* Card 3: Underload */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setWorkloadFilter("underload")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setWorkloadFilter("underload"); } }}
          style={{
            background: workloadFilter === "underload" ? "#f0f4ff" : "#ffffff",
            border: workloadFilter === "underload" ? "2px solid #3B4197" : "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "12px 16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Underload
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#4f46e5", lineHeight: 1 }}>{loadKpis.underload}</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>teachers</span>
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
            Needs assignment (&lt; 15h)
          </div>
        </div>

        {/* Card 4: Overload */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setWorkloadFilter("overload")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setWorkloadFilter("overload"); } }}
          style={{
            background: workloadFilter === "overload" ? "#fef2f2" : "#ffffff",
            border: workloadFilter === "overload" ? "2px solid #dc2626" : "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "12px 16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Overload
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#dc2626", lineHeight: 1 }}>{loadKpis.overload}</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>teachers</span>
          </div>
          <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4, fontWeight: 600 }}>
            Exceeds DepEd limit (&gt; 30h)
          </div>
        </div>

        {/* Card 5: Unassigned */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setWorkloadFilter("unassigned")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setWorkloadFilter("unassigned"); } }}
          style={{
            background: workloadFilter === "unassigned" ? "#f8fafc" : "#ffffff",
            border: workloadFilter === "unassigned" ? "2px solid #64748b" : "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "12px 16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Unassigned
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#64748b", lineHeight: 1 }}>{loadKpis.unassigned}</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>teachers</span>
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            0 contact hrs scheduled
          </div>
        </div>
      </div>

      {/* Faculty Directory Main Container (Full Width) */}
      <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 20, fontWeight: 700 }}>Faculty Directory</h2>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#3B4197", background: "#f0f4ff", padding: "3px 12px", borderRadius: 99, border: "1px solid #dce4f8" }}>
                {filteredFacultyMembers.length} of {facultyMembers.length} teachers
              </span>
            </div>
            <p style={{ margin: "4px 0 0", color: "#5d698d", fontSize: 13 }}>
              Identity, weekly contact hours, sections &amp; assignments.
            </p>
          </div>
          {/* Grid / List View Switcher */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#f1f5f9",
              borderRadius: 8,
              padding: 3,
              border: "1px solid #e2e8f0",
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: viewMode === "grid" ? "#ffffff" : "transparent",
                color: viewMode === "grid" ? "#1f2c6f" : "#64748b",
                fontWeight: viewMode === "grid" ? 700 : 500,
                fontSize: 12.5,
                cursor: "pointer",
                boxShadow: viewMode === "grid" ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1.5" />
                <rect x="9" y="1" width="6" height="6" rx="1.5" />
                <rect x="1" y="9" width="6" height="6" rx="1.5" />
                <rect x="9" y="9" width="6" height="6" rx="1.5" />
              </svg>
              <span>Grid View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: viewMode === "list" ? "#ffffff" : "transparent",
                color: viewMode === "list" ? "#1f2c6f" : "#64748b",
                fontWeight: viewMode === "list" ? 700 : 500,
                fontSize: 12.5,
                cursor: "pointer",
                boxShadow: viewMode === "list" ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1.5" y="2" width="13" height="3" rx="1" />
                <rect x="1.5" y="6.5" width="13" height="3" rx="1" />
                <rect x="1.5" y="11" width="13" height="3" rx="1" />
              </svg>
              <span>List View</span>
            </button>
          </div>
        </div>

        <div className="faculty-filter-row-primary" style={{ marginTop: 12, display: "grid", gridTemplateColumns: "minmax(0, 2fr) repeat(2, minmax(0, 1fr)) auto", gap: 8, alignItems: "end" }}>
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
              <option value="balanced">Balanced (Target Load)</option>
              <option value="underload">Underload (Needs More Load)</option>
              <option value="overload">Overload (Exceeds Limit)</option>
              <option value="unassigned">Unassigned (0 hrs)</option>
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
        ) : viewMode === "grid" ? (
          <div
            className="faculty-scroll-list"
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: 12,
              maxHeight: 740,
              overflowY: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              padding: 2,
            }}
          >
            {filteredFacultyMembers.map((member) => (
              <FacultyListRow
                key={member.id}
                member={member}
                isEditing={editingId === member.id && isDrawerOpen}
                onEdit={handleEditFaculty}
                onDelete={handleDeleteFaculty}
                onToggleActive={handleToggleRetired}
              />
            ))}
          </div>
        ) : (
          <div
            className="faculty-scroll-list"
            style={{
              marginTop: 12,
              maxHeight: 740,
              overflowY: "auto",
              overflowX: "auto",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              background: "#ffffff",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 }}>
                  <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.03em" }}>Teacher</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.03em" }}>Position &amp; Status</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.03em", minWidth: 200 }}>Weekly Load</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.03em" }}>Sections</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.03em" }}>Ancillaries</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700, fontSize: 12, textAlign: "right", textTransform: "uppercase", letterSpacing: "0.03em" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFacultyMembers.map((member) => (
                  <FacultyTableRow
                    key={member.id}
                    member={member}
                    isEditing={editingId === member.id && isDrawerOpen}
                    onEdit={handleEditFaculty}
                    onDelete={handleDeleteFaculty}
                    onToggleActive={handleToggleRetired}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Backdrop Overlay */}
      <div
        onClick={handleCloseDrawer}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          zIndex: 99990,
          opacity: isDrawerOpen ? 1 : 0,
          pointerEvents: isDrawerOpen ? "auto" : "none",
          transition: "opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* Slide-over Editing Sidebar Drawer (Moving right-to-left smoothly) */}
      <aside
        ref={formCardRef}
        role="dialog"
        aria-modal="true"
        aria-label={editingId ? "Edit Faculty Profile" : "Add Faculty Profile"}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 580,
          maxWidth: "92vw",
          height: "100vh",
          backgroundColor: "#ffffff",
          zIndex: 99995,
          boxShadow: isDrawerOpen ? "-12px 0 36px rgba(15, 23, 42, 0.2)" : "none",
          transform: isDrawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.32s ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          pointerEvents: isDrawerOpen ? "auto" : "none",
        }}
      >
        {/* Drawer Header (Fixed at top) */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8faff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: editingId ? "#3B4197" : "#10b981",
                  display: "inline-block",
                }}
              />
              <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18, fontWeight: 800 }}>
                {editingId ? "Edit Faculty Profile" : "Add Faculty Profile"}
              </h2>
            </div>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12.5 }}>
              {editingId
                ? `Updating profile for ${editingMember?.name || "faculty member"}${editingMember?.employeeId ? ` (${editingMember.employeeId})` : ""}`
                : "Enter credentials, subject expertise, and advisory designation"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCloseDrawer}
            aria-label="Close editing panel"
            style={{
              background: "transparent",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#eef2ff";
              e.currentTarget.style.color = "#3B4197";
              e.currentTarget.style.borderColor = "#3B4197";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            ×
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div
          ref={drawerBodyRef}
          className="faculty-drawer-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
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

            <Field label="Appointment Category" required error={touched.appointmentStatus ? validationErrors.appointmentStatus : ""}>
              <select
                value={formState.appointmentStatus || formState.employmentStatus || "Permanent"}
                onChange={(event) => {
                  handleFormField("appointmentStatus", event.target.value);
                  handleFormField("employmentStatus", event.target.value);
                }}
                onBlur={() => markTouched("appointmentStatus")}
                style={selectStyle(!!(touched.appointmentStatus && validationErrors.appointmentStatus))}
              >
                {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Working Arrangement" required>
              <select
                value={formState.workingArrangement || "Full-Time"}
                onChange={(event) => handleFormField("workingArrangement", event.target.value)}
                style={selectStyle(false)}
              >
                {WORKING_ARRANGEMENT_OPTIONS.map((arr) => (
                  <option key={arr} value={arr}>
                    {arr}
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

          <div style={{ marginTop: 6 }}>
            <Field label="Ancillary Assignments (input)">
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  list="deped-ancillary-pool"
                  placeholder="e.g. DRRM Coordinator, ICT Coordinator, Custodian..."
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
                <datalist id="deped-ancillary-pool">
                  {ANCILLARY_POOL.map((role) => (
                    <option key={role} value={role} />
                  ))}
                </datalist>
                <button type="button" onClick={addAncillaryAssignment} style={smallActionStyle()}>
                  Add
                </button>
              </div>
            </Field>

            {/* Quick add popular DepEd ancillary tags */}
            <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Quick Add Role:</span>
              {[
                "School DRRM Coordinator",
                "School ICT Coordinator",
                "School Property Custodian",
                "School Guidance Coordinator",
                "Grade Level Coordinator",
                "Subject Area Coordinator",
              ].map((role) => {
                const isPresent = (formState.ancillaryAssignments || []).some(
                  (item) => item.toLowerCase() === role.toLowerCase()
                );
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      if (!isPresent) {
                        setFormState((prev) => ({
                          ...prev,
                          ancillaryAssignments: [...(prev.ancillaryAssignments || []), role],
                        }));
                        showNotice(`Added ${role}.`, "success");
                      }
                    }}
                    style={{
                      fontSize: 11,
                      background: isPresent ? "#f1f5f9" : "#eef2ff",
                      color: isPresent ? "#94a3b8" : "#3730a3",
                      border: isPresent ? "1px solid #e2e8f0" : "1px solid #c7d2fe",
                      borderRadius: 6,
                      padding: "2px 7px",
                      cursor: isPresent ? "default" : "pointer",
                      fontWeight: 600,
                    }}
                    disabled={isPresent}
                  >
                    {isPresent ? "✓ " : "+"} {role.replace(/^School\s*/i, "")}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 8 }}>
              <ChipList items={formState.ancillaryAssignments || []} onRemove={removeAncillaryAssignment} emptyText="No ancillary assignments added." />
            </div>
          </div>

          <div style={{ marginTop: 6 }}>
            <Field label="Unavailable Periods" error={touched.unavailablePeriods ? validationErrors.unavailablePeriods : ""}>
              <SearchableMultiSelectChips
                options={unavailablePeriodOptions}
                selected={formState.unavailablePeriods}
                onToggle={(option) => toggleMultiSelect("unavailablePeriods", option)}
                placeholder="Search periods..."
              />
            </Field>
          </div>

          <div style={{ marginTop: 6 }}>
            <Field label="Subject Expertise" required error={touched.subjectExpertise ? validationErrors.subjectExpertise : ""}>
              <SearchableMultiSelectChips
                options={subjectOptions}
                selected={formState.primaryExpertise && formState.primaryExpertise.length ? formState.primaryExpertise : formState.subjectExpertise}
                onToggle={(option) => {
                  const currentPrimary = formState.primaryExpertise && formState.primaryExpertise.length ? formState.primaryExpertise : formState.subjectExpertise;
                  const nextPrimary = currentPrimary.includes(option) ? currentPrimary.filter((i) => i !== option) : [...currentPrimary, option];
                  setFormState((prev) => ({ ...prev, primaryExpertise: nextPrimary, subjectExpertise: nextPrimary, secondaryExpertise: [] }));
                }}
                emptyLabel="No subjects available yet. Create subjects first."
                placeholder="Search and select subject expertise..."
              />
            </Field>
          </div>

          <div style={{ marginTop: 6 }}>
            <Field label="Grade Level Assignments" required error={touched.gradeLevelAssignments ? validationErrors.gradeLevelAssignments : ""}>
              <SearchableMultiSelectChips
                options={GRADE_LEVEL_OPTIONS}
                selected={formState.gradeLevelAssignments}
                onToggle={(option) => toggleMultiSelect("gradeLevelAssignments", option)}
                placeholder="Search grade levels..."
              />
            </Field>
          </div>
        </div>

        {/* Drawer Sticky Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e2e8f0",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            boxShadow: "0 -4px 12px rgba(15,23,42,0.04)",
            gap: 10,
          }}
        >
          {editingId ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => handleToggleRetired(editingId)}
                style={{
                  ...secondaryActionStyle(),
                  padding: "8px 12px",
                  fontSize: 12,
                }}
              >
                {editingMember?.active ? "Deactivate" : "Activate"}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFaculty(editingId)}
                style={{
                  ...dangerActionStyle(),
                  padding: "8px 12px",
                  fontSize: 12,
                }}
              >
                Delete Member
              </button>
            </div>
          ) : (
            <div />
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={handleCloseDrawer}
              style={{
                ...secondaryActionStyle(),
                padding: "8px 16px",
                fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveFaculty}
              style={{
                ...primaryActionStyle(),
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {editingId ? "Save Changes" : "Add Faculty"}
            </button>
          </div>
        </div>
      </aside>

      <ConfirmationModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
      />
    </>
  );
}

function getTeacherInitials(name) {
  if (!name || typeof name !== "string") return "FC";
  const cleaned = name.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.|Master\s+Teacher\s+[I|V|X]+)\s+/i, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "FC";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatSectionChip(sec) {
  if (!sec) return "";
  const name = String(sec.name || sec.id || "").trim();
  const rawId = String(sec.id || "").trim();

  // 1. Direct match for standard DepEd format like "9-Stravinsky" or "Grade 9 - Stravinsky"
  const gradeNamedMatch = name.match(/^(?:Grade\s*|G)?(\d{1,2})\s*[-_·\s:]+\s*([A-Za-z].*)$/i);
  if (gradeNamedMatch) {
    const grade = gradeNamedMatch[1];
    const rest = gradeNamedMatch[2].trim();
    if (!/^Section\s*\d+$/i.test(rest) && !/^\d+$/.test(rest)) {
      return `${grade}-${rest}`;
    }
  }

  // 2. Grade known separately and name is a custom word (e.g., "Stravinsky", "Diamond", "Rizal")
  let gradeNum = "";
  if (sec.grade) {
    const m = String(sec.grade).match(/\d+/);
    if (m) gradeNum = m[0];
  }
  if (!gradeNum && sec.id) {
    const m = String(sec.id).match(/(?:grade|g|jhs|shs|^)[-_·\s]*(\d{1,2})/i);
    if (m) gradeNum = m[1];
  }

  if (gradeNum && name && !/^(?:Section\s*\d+|\d+|jhs|shs)/i.test(name)) {
    const cleanName = name.replace(new RegExp(`^(?:Grade\\s*|G)?${gradeNum}\\s*[-_·]?\\s*`, "i"), "").trim();
    if (cleanName && !/^(?:Section\s*\d+|\d+)$/i.test(cleanName)) {
      return `${gradeNum}-${cleanName}`;
    }
  }

  // 3. Fallback for numeric sections: ensure 1-based indexing (never Section 0)
  const combined = `${name} ${rawId}`;
  const numMatch = combined.match(/\b(?:jhs|shs)?[-_·\s]*(\d{1,2})[-_·\s]+(\d+)\b/i) ||
                   name.match(/^(?:Grade\s*|G)?(\d{1,2})\s*[-_·]\s*(?:Section\s*)?(\d+)$/i);
  if (numMatch) {
    const grade = numMatch[1];
    let secNum = parseInt(numMatch[2], 10);
    // If zero-based index (e.g. 0), convert to 1-based
    if (secNum === 0 || rawId.endsWith("-0") || name.endsWith(" 0")) {
      secNum = secNum + 1;
    }
    return `${grade}-Section ${secNum}`;
  }

  if (sec.label) {
    return String(sec.label).replace(/^Grade\s*/i, "").replace(/\s*[-·]\s*/, "-");
  }
  return name;
}

function formatCompactGradeRange(rawGrades) {
  if (!Array.isArray(rawGrades) || rawGrades.length === 0) return "";
  const nums = Array.from(
    new Set(
      rawGrades
        .map((g) => {
          const m = String(g || "").match(/(\d{1,2})/);
          return m ? parseInt(m[1], 10) : null;
        })
        .filter((n) => n !== null && !Number.isNaN(n))
    )
  ).sort((a, b) => a - b);

  if (nums.length === 0) {
    return rawGrades
      .map((g) => String(g || "").replace(/^Grade\s*/i, "G").trim())
      .filter(Boolean)
      .join(", ");
  }

  const ranges = [];
  let start = nums[0];
  let end = nums[0];

  for (let i = 1; i < nums.length; i += 1) {
    if (nums[i] === end + 1) {
      end = nums[i];
    } else {
      ranges.push(start === end ? `G${start}` : `G${start}–G${end}`);
      start = nums[i];
      end = nums[i];
    }
  }
  ranges.push(start === end ? `G${start}` : `G${start}–G${end}`);
  return ranges.join(", ");
}

function FacultyListRow({ member, isEditing, onEdit, onDelete, onToggleActive }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAllSections, setShowAllSections] = useState(false);
  const [showAllPreps, setShowAllPreps] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const loadStatus = member.assignedLoadStatus || "Unassigned";

  // Calibrate progress bar against the highest load in the directory (so highest load is always 100% regardless of status)
  const memberHours = Number.isFinite(member.assignedLoadHours) ? member.assignedLoadHours : 0;
  const barPercent = Number.isFinite(member.progressBarPercent)
    ? member.progressBarPercent
    : Math.max(0, Math.min(100, (memberHours / (member.progressBarCeilingHours || 30)) * 100));

  const fillColor = {
    Unassigned: "#cbd5e1",
    Underload: "#818cf8",
    "Part load": "#818cf8",
    Balanced: "#3B4197",
    "Full load": "#3B4197",
    Overload: "#ef4444",
  }[loadStatus] || "#cbd5e1";

  const statusColor = {
    Unassigned: "#64748b",
    Underload: "#4f46e5",
    "Part load": "#4f46e5",
    Balanced: "#3B4197",
    "Full load": "#3B4197",
    Overload: "#dc2626",
  }[loadStatus] || "#64748b";

  const formattedHours = memberHours ? `${memberHours.toFixed(1).replace(/\.0$/, "")}` : "0";
  const maxContactHours = Number.isFinite(member.maxTeachingContactHours) && member.maxTeachingContactHours > 0
    ? member.maxTeachingContactHours
    : 30;
  const formattedMaxHours = `${maxContactHours.toFixed(1).replace(/\.0$/, "")}`;
  const utilizationPct = Math.round((memberHours / maxContactHours) * 100);
  const diffHours = Math.round((maxContactHours - memberHours) * 10) / 10;
  const formattedDiffHours = `${Math.abs(diffHours).toFixed(1).replace(/\.0$/, "")}`;
  const overLimitSubtext =
    diffHours < 0
      ? `+${formattedDiffHours} ${Math.abs(diffHours) === 1 ? "hr" : "hrs"} over limit`
      : "";

  const appointmentStatus = member.appointmentStatus || member.employmentStatus || "Permanent";
  const workingArrangement = member.workingArrangement || (String(member.employmentStatus).toLowerCase().includes("part") ? "Part-Time" : "Full-Time");
  const isPartTimeArrangement = String(workingArrangement).toLowerCase().includes("part");
  const position = member.position || "Teacher I";
  const employeeId = member.employeeId || "—";
  const isActive = member.active !== false;
  const prepsCount = member.distinctPrepsCount || 0;
  const prepsList = Array.isArray(member.distinctPrepsList) ? member.distinctPrepsList : [];

  // Ancillaries list (automatically includes Class Adviser & section when assigned HGP)
  const ancillaries = [];
  if (
    member.isClassAdviser ||
    member.hasAdvisoryHGP ||
    (Array.isArray(member.ancillaryAssignments) &&
      member.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
  ) {
    const advSecChip = member.autoAdvisorySection ? formatSectionChip({ name: member.autoAdvisorySection }) : "";
    ancillaries.push(advSecChip ? `Class Adviser (${advSecChip})` : "Class Adviser");
  }
  if (Array.isArray(member.ancillaryAssignments)) {
    member.ancillaryAssignments.forEach((anc) => {
      const text = String(anc).trim();
      if (text && !text.toLowerCase().includes("adviser") && !ancillaries.includes(text)) {
        ancillaries.push(text);
      }
    });
  }

  const sections = Array.isArray(member.assignedSections) ? member.assignedSections : [];
  const rawSubjects = Array.isArray(member.subjectExpertise) && member.subjectExpertise.length > 0
    ? member.subjectExpertise
    : Array.isArray(member.primaryExpertise)
    ? member.primaryExpertise
    : [];
  const formattedSubjects = rawSubjects
    .map((s) => {
      const str = String(s || "").trim();
      const parts = str.split("—");
      return parts.length > 1 ? parts.slice(1).join("—").trim() : str;
    })
    .filter(Boolean);
  const rawGrades = Array.isArray(member.gradeLevelAssignments) ? member.gradeLevelAssignments : [];
  const compactGradesLabel = formatCompactGradeRange(rawGrades);

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
        border: isEditing ? "2px solid #3B4197" : "1px solid #e2e8f0",
        borderRadius: 14,
        background: isEditing ? "#f8faff" : "#ffffff",
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        boxShadow: isEditing ? "0 2px 8px rgba(59,65,151,0.12)" : "0 1px 3px rgba(15,23,42,0.03)",
        position: "relative",
      }}
    >
      {/* 1. Identity First: [Initials] Name, Position, EMP-ID · Regular | ● Active ⋮ */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: "#eef2ff",
              border: "1px solid #c7d2fe",
              color: "#3B4197",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              letterSpacing: "0.5px",
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            {getTeacherInitials(member.name)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Faculty name: Largest text in the card */}
            <h3
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1.25,
                wordBreak: "break-word",
              }}
              title={`${member.name} (${employeeId})`}
            >
              {member.name}
            </h3>

            {/* Position & Appointment: Clean single metadata line */}
            <div
              style={{
                marginTop: 2,
                fontSize: 12,
                fontWeight: 500,
                color: "#475569",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={`Employee ID: ${employeeId} · ${position} · ${appointmentStatus} · ${workingArrangement}`}
            >
              {position} · {appointmentStatus}
              {isPartTimeArrangement ? " · Part-Time" : ""}
            </div>

            {/* Italicized Ancillary directly under Position · Permanent (never truncated) */}
            <div
              style={{
                marginTop: 2,
                fontSize: 11.5,
                fontStyle: "italic",
                color: ancillaries.length > 0 ? "#64748b" : "#94a3b8",
                lineHeight: 1.35,
                wordBreak: "break-word",
              }}
              title={ancillaries.length > 0 ? `Ancillary: ${ancillaries.join(", ")}` : "No ancillary assignment"}
            >
              {ancillaries.length > 0 ? ancillaries.join(", ") : "No ancillary role"}
            </div>
          </div>
        </div>

        {/* Active Status & Actions Menu */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: isActive ? "#10b981" : "#94a3b8",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: isActive ? "#047857" : "#64748b",
              }}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Action Menu (⋮) */}
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              type="button"
              aria-label="Faculty actions"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              style={{
                background: menuOpen ? "#f1f5f9" : "transparent",
                border: "none",
                borderRadius: 6,
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
                fontSize: 16,
                lineHeight: 1,
                transition: "background 0.15s ease",
              }}
            >
              ⋮
            </button>
            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 4,
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
                  zIndex: 50,
                  minWidth: 140,
                  padding: "4px 0",
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit?.(member);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onToggleActive?.(member.id);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  {isActive ? "Deactivate" : "Activate"}
                </button>
                <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete?.(member.id);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#dc2626",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  Delete Member
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#f1f5f9", margin: "10px 0" }} />

      {/* 2. Dominant Capacity & Status Row: 17 / 30 hrs (57%) | 13 hrs left · [Balanced] */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div
          style={{ display: "flex", alignItems: "baseline", gap: 5 }}
          title={
            member.advisoryCreditAdded > 0
              ? `${member.classroomContactHours || 0}h academic contact + ${member.advisoryCreditAdded}h Class Adviser credit (includes 1h HGP) = ${formattedHours} / ${formattedMaxHours} hrs/wk`
              : `${formattedHours} / ${formattedMaxHours} contact hrs/wk`
          }
        >
          <span style={{ color: "#0f172a", fontSize: 13.5, fontWeight: 700 }}>
            {formattedHours} / {formattedMaxHours} hrs
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: loadStatus === "Overload" ? "#dc2626" : "#3B4197",
              background: loadStatus === "Overload" ? "#fef2f2" : "#eef2ff",
              border: loadStatus === "Overload" ? "1px solid #fecaca" : "1px solid #c7d2fe",
              borderRadius: 5,
              padding: "0px 5px",
            }}
          >
            {utilizationPct}%
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 5, fontSize: 11.5 }}>
          {overLimitSubtext && (
            <>
              <span style={{ color: "#dc2626", fontWeight: 600 }}>{overLimitSubtext}</span>
              <span style={{ color: "#cbd5e1" }}>·</span>
            </>
          )}
          <span style={{ color: statusColor, fontWeight: 700 }}>[{loadStatus}]</span>
        </div>
      </div>

      {/* Progress bar: Thin ~6px, calibrated to highest directory load */}
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "#f1f5f9",
          overflow: "hidden",
          marginTop: 6,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: `${barPercent}%`,
            height: "100%",
            background: fillColor,
            borderRadius: 999,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* 3. Interactive Dropdown Strip: [ N Sections ▾ ]   [ N Preps ▾ ] */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: showAllSections || showAllPreps ? 6 : 0,
        }}
      >
        {sections.length > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAllSections((prev) => !prev);
            }}
            title={sections.map((s) => formatSectionChip(s)).join(", ")}
            style={{
              fontSize: 11,
              background: showAllSections ? "#eef2ff" : "#f8fafc",
              color: showAllSections ? "#3B4197" : "#1e293b",
              padding: "3px 10px",
              borderRadius: 6,
              border: showAllSections ? "1px solid #c7d2fe" : "1px solid #e2e8f0",
              fontWeight: 600,
              cursor: "pointer",
              lineHeight: 1.4,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s ease",
            }}
          >
            <span>
              {sections.length} {sections.length === 1 ? "Section" : "Sections"}
            </span>
            <span style={{ fontSize: 10, color: showAllSections ? "#3B4197" : "#64748b" }}>
              {showAllSections ? "▴" : "▾"}
            </span>
          </button>
        ) : (
          <span
            style={{
              fontSize: 11,
              background: "#f8fafc",
              color: "#94a3b8",
              padding: "3px 10px",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            0 Sections
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowAllPreps((prev) => !prev);
          }}
          title={
            prepsList.length > 0
              ? `Preparations: ${prepsList.join(", ")}`
              : formattedSubjects.length > 0
              ? `Expertise: ${formattedSubjects.join(", ")}${compactGradesLabel ? ` (${compactGradesLabel})` : ""}`
              : "No preparations assigned"
          }
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: showAllPreps || prepsCount > 0 ? "#3B4197" : "#64748b",
            background: showAllPreps || prepsCount > 0 ? "#eef2ff" : "#f8fafc",
            border: showAllPreps || prepsCount > 0 ? "1px solid #c7d2fe" : "1px solid #e2e8f0",
            borderRadius: 6,
            padding: "3px 10px",
            lineHeight: 1.4,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            transition: "all 0.15s ease",
          }}
        >
          <span>
            {prepsCount} {prepsCount === 1 ? "Prep" : "Preps"}
          </span>
          <span style={{ fontSize: 10, color: showAllPreps || prepsCount > 0 ? "#3B4197" : "#64748b" }}>
            {showAllPreps ? "▴" : "▾"}
          </span>
        </button>
      </div>

      {/* Inline Dropdown 1: Assigned Sections */}
      {showAllSections && sections.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexWrap: "wrap",
            padding: "7px 8px",
            marginTop: 6,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
          }}
        >
          {sections.map((sec) => (
            <span
              key={sec.id}
              style={{
                fontSize: 10.5,
                background: "#ffffff",
                color: "#1e293b",
                padding: "2px 7px",
                borderRadius: 5,
                border: "1px solid #e2e8f0",
                fontWeight: 500,
                lineHeight: 1.35,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {formatSectionChip(sec)}
            </span>
          ))}
        </div>
      )}

      {/* Inline Dropdown 2: Subject & Grade Preparations */}
      {showAllPreps && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexWrap: "wrap",
            padding: "7px 8px",
            marginTop: 6,
            background: "#f8faff",
            border: "1px solid #c7d2fe",
            borderRadius: 8,
          }}
        >
          {prepsList.length > 0 ? (
            prepsList.map((prep, idx) => (
              <span
                key={`${prep}-${idx}`}
                style={{
                  fontSize: 10.5,
                  background: "#ffffff",
                  color: "#3B4197",
                  padding: "2px 8px",
                  borderRadius: 5,
                  border: "1px solid #c7d2fe",
                  fontWeight: 600,
                  lineHeight: 1.35,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {prep}
              </span>
            ))
          ) : formattedSubjects.length > 0 ? (
            <span
              style={{
                fontSize: 10.5,
                background: "#ffffff",
                color: "#475569",
                padding: "2px 8px",
                borderRadius: 5,
                border: "1px solid #e2e8f0",
                fontWeight: 600,
                lineHeight: 1.35,
              }}
            >
              Profiled Expertise: {formattedSubjects.join(", ")}
              {compactGradesLabel ? ` · ${compactGradesLabel}` : ""}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
              No subject preparations assigned
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function FacultyTableRow({ member, isEditing, onEdit, onDelete, onToggleActive }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const loadStatus = member.assignedLoadStatus || "Unassigned";
  const memberHours = Number.isFinite(member.assignedLoadHours) ? member.assignedLoadHours : 0;
  const barPercent = Number.isFinite(member.progressBarPercent)
    ? member.progressBarPercent
    : Math.max(0, Math.min(100, (memberHours / (member.progressBarCeilingHours || 30)) * 100));

  const fillColor = {
    Unassigned: "#cbd5e1",
    Underload: "#818cf8",
    "Part load": "#818cf8",
    Balanced: "#3B4197",
    "Full load": "#3B4197",
    Overload: "#ef4444",
  }[loadStatus] || "#cbd5e1";

  const statusColor = {
    Unassigned: "#64748b",
    Underload: "#4f46e5",
    "Part load": "#4f46e5",
    Balanced: "#3B4197",
    "Full load": "#3B4197",
    Overload: "#dc2626",
  }[loadStatus] || "#64748b";

  const formattedHours = memberHours ? `${memberHours.toFixed(1).replace(/\.0$/, "")}` : "0";
  const appointmentStatus = member.appointmentStatus || member.employmentStatus || "Permanent";
  const workingArrangement = member.workingArrangement || (String(member.employmentStatus).toLowerCase().includes("part") ? "Part-Time" : "Full-Time");
  const position = member.position || "Teacher I";
  const employeeId = member.employeeId || "—";
  const isActive = member.active !== false;
  const prepsCount = member.distinctPrepsCount || 0;
  const prepsList = Array.isArray(member.distinctPrepsList) ? member.distinctPrepsList : [];

  const ancillaries = [];
  if (
    member.isClassAdviser ||
    member.hasAdvisoryHGP ||
    (Array.isArray(member.ancillaryAssignments) &&
      member.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
  ) {
    const advSecChip = member.autoAdvisorySection ? formatSectionChip({ name: member.autoAdvisorySection }) : "";
    ancillaries.push(advSecChip ? `Class Adviser (${advSecChip})` : "Class Adviser");
  }
  if (Array.isArray(member.ancillaryAssignments)) {
    member.ancillaryAssignments.forEach((anc) => {
      const text = String(anc).trim();
      if (text && !text.toLowerCase().includes("adviser") && !ancillaries.includes(text)) {
        ancillaries.push(text);
      }
    });
  }

  const sections = Array.isArray(member.assignedSections) ? member.assignedSections : [];
  const rawSubjects = Array.isArray(member.subjectExpertise) && member.subjectExpertise.length > 0
    ? member.subjectExpertise
    : Array.isArray(member.primaryExpertise)
    ? member.primaryExpertise
    : [];
  const formattedSubjects = rawSubjects
    .map((s) => {
      const str = String(s || "").trim();
      const parts = str.split("—");
      return parts.length > 1 ? parts.slice(1).join("—").trim() : str;
    })
    .filter(Boolean);
  const rawGrades = Array.isArray(member.gradeLevelAssignments) ? member.gradeLevelAssignments : [];
  const compactGradesLabel = formatCompactGradeRange(rawGrades);

  return (
    <tr
      onClick={() => onEdit?.(member)}
      style={{
        borderBottom: "1px solid #f1f5f9",
        background: isEditing ? "#eef2ff" : "#ffffff",
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!isEditing) e.currentTarget.style.background = "#f8faff";
      }}
      onMouseLeave={(e) => {
        if (!isEditing) e.currentTarget.style.background = "#ffffff";
      }}
    >
      {/* Teacher */}
      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "#eef2ff",
              border: "1px solid #c7d2fe",
              color: "#3B4197",
              fontWeight: 700,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {getTeacherInitials(member.name)}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13.5 }}>{member.name}</div>
            <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{employeeId}</div>
          </div>
        </div>
      </td>

      {/* Position & Status */}
      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
        <div style={{ fontWeight: 600, color: "#334155", fontSize: 12.5 }}>{position}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: "#64748b" }}>{appointmentStatus} · {workingArrangement}</span>
          <span style={{ color: "#cbd5e1" }}>•</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: isActive ? "#047857" : "#64748b", fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#10b981" : "#94a3b8" }} />
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
        {Array.isArray(member.subjectExpertise) && member.subjectExpertise.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: "#3B4197", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 4, padding: "1px 6px" }}>
              {member.subjectExpertise
                .map((s) => {
                  const parts = String(s || "").split("—");
                  return parts.length > 1 ? parts.slice(1).join("—").trim() : String(s || "").trim();
                })
                .join(", ")}
            </span>
            {Array.isArray(member.gradeLevelAssignments) && member.gradeLevelAssignments.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 600, color: "#475569", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 4, padding: "1px 5px" }}>
                {formatCompactGradeRange(member.gradeLevelAssignments)}
              </span>
            )}
          </div>
        )}
      </td>

      {/* Weekly Load */}
      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, maxWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{formattedHours} hrs/wk</span>
            {prepsCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#3B4197",
                  background: "#eef2ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: 4,
                  padding: "1px 5px",
                }}
                title={prepsList.length ? `Preparations: ${prepsList.join(", ")}` : ""}
              >
                {prepsCount} {prepsCount === 1 ? "Prep" : "Preps"}
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>[{loadStatus}]</span>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: "#f1f5f9", overflow: "hidden", marginTop: 5, maxWidth: 220 }}>
          <div style={{ width: `${barPercent}%`, height: "100%", background: fillColor, borderRadius: 99, transition: "width 0.3s ease" }} />
        </div>
      </td>

      {/* Sections Assigned */}
      <td style={{ padding: "12px 16px", verticalAlign: "middle", maxWidth: 240 }}>
        {sections.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            {sections.slice(0, 4).map((sec) => (
              <span
                key={sec.id}
                style={{
                  fontSize: 10.5,
                  background: "#f8fafc",
                  color: "#1e293b",
                  padding: "2px 6px",
                  borderRadius: 4,
                  border: "1px solid #e2e8f0",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {formatSectionChip(sec)}
              </span>
            ))}
            {sections.length > 4 && (
              <span style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600 }}>
                +{sections.length - 4} more
              </span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 11.5, color: "#94a3b8", fontStyle: "italic" }}>None</span>
        )}
      </td>

      {/* Ancillary */}
      <td style={{ padding: "12px 16px", verticalAlign: "middle", maxWidth: 180 }}>
        {ancillaries.length > 0 ? (
          <span style={{ fontSize: 12, color: "#334155", lineHeight: 1.3 }}>
            {ancillaries.join(", ")}
          </span>
        ) : (
          <span style={{ fontSize: 11.5, color: "#94a3b8", fontStyle: "italic" }}>None</span>
        )}
      </td>

      {/* Action Menu (⋮) */}
      <td style={{ padding: "12px 16px", verticalAlign: "middle", textAlign: "right" }}>
        <div style={{ position: "relative", display: "inline-block" }} ref={menuRef}>
          <button
            type="button"
            aria-label="Faculty actions"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            style={{
              background: menuOpen ? "#f1f5f9" : "transparent",
              border: "none",
              borderRadius: 6,
              width: 28,
              height: 28,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
              fontSize: 16,
              lineHeight: 1,
              transition: "background 0.15s ease",
            }}
          >
            ⋮
          </button>
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 4,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
                zIndex: 50,
                minWidth: 140,
                padding: "4px 0",
                textAlign: "left",
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit?.(member);
                }}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#334155",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onToggleActive?.(member.id);
                }}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#334155",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                {isActive ? "Deactivate" : "Activate"}
              </button>
              <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete?.(member.id);
                }}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#dc2626",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                Delete Member
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
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
                    <span style={{ color: isSelected ? "#3B4197" : "#9aa5c2", fontSize: 11, fontWeight: 700 }}>{isSelected ? "Selected" : "+"}</span>
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
    color: active ? "#3B4197" : "#64748b",
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
    background: active ? "#eef2ff" : "#f1f5f9",
    borderRadius: 999,
    border: active ? "1px solid #c7d2fe" : "1px solid #cbd5e1",
    padding: "3px 8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function loadStateBadgeStyle(tone) {
  // Monochromatic Blue palette, RED for Overload
  const palette = {
    neutral: { color: "#475569", background: "#f8fafc", border: "#cbd5e1" },     // Unassigned (slate)
    underload: { color: "#5663bd", background: "#f8faff", border: "#d0dcfd" },   // Underload (soft monochromatic blue)
    warning: { color: "#5663bd", background: "#f8faff", border: "#d0dcfd" },     // Underload alias
    part: { color: "#5663bd", background: "#f8faff", border: "#d0dcfd" },        // Underload alias
    balanced: { color: "#3B4197", background: "#eef2ff", border: "#c7d2fe" },    // Balanced (primary brand blue)
    good: { color: "#3B4197", background: "#eef2ff", border: "#c7d2fe" },        // Balanced alias
    full: { color: "#3B4197", background: "#eef2ff", border: "#c7d2fe" },        // Balanced alias
    danger: { color: "#b91c1c", background: "#fee2e2", border: "#fca5a5" },      // Overload (RED)
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
    padding: "3px 10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  };
}

function getTeacherLoadState(loadPercent) {
  if (!loadPercent || loadPercent <= 0) {
    return { label: "Unassigned", tone: "neutral", fill: "#cbd5e1" };
  }

  if (loadPercent < 80) {
    return { label: "Underload", tone: "underload", fill: "#818cf8" };
  }

  if (loadPercent <= 100) {
    return { label: "Balanced", tone: "balanced", fill: "#3B4197" };
  }

  return { label: "Overload", tone: "danger", fill: "#ef4444" };
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

  const name = String(formState.name || "").trim();
  if (!name) {
    errors.name = "Name is required.";
  }

  if (!formState.sex) {
    errors.sex = "Sex is required.";
  }

  const employeeId = String(formState.employeeId || "").trim();
  if (!employeeId) {
    errors.employeeId = "Employee ID is required.";
  } else {
    const duplicate = facultyMembers.some(
      (member) => member.id !== editingId && String(member.employeeId || "").trim().toLowerCase() === employeeId.toLowerCase()
    );
    if (duplicate) {
      errors.employeeId = "Employee ID must be unique.";
    }
  }

  const position = String(formState.position || "").trim();
  if (!position) {
    errors.position = "Position is required.";
  }

  if (!formState.employmentStatus && !formState.appointmentStatus) {
    errors.employmentStatus = "Employment Status is required.";
  }

  const email = String(formState.email || "").trim();
  if (!email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    errors.email = "Enter a valid email address.";
  } else {
    const duplicateEmail = facultyMembers.some(
      (member) => member.id !== editingId && String(member.email || "").trim().toLowerCase() === email.toLowerCase()
    );
    if (duplicateEmail) {
      errors.email = "Email must be unique.";
    }
  }

  const rawContact = String(formState.contact || "").trim();
  const cleanedContact = rawContact.replace(/[\s\-()]/g, "");
  if (!rawContact) {
    errors.contact = "Contact is required.";
  } else if (!/^(\+639\d{9}|09\d{9}|9\d{9}|639\d{9})$/u.test(cleanedContact)) {
    errors.contact = "Contact must use 09XXXXXXXXX or +639XXXXXXXXX format.";
  }

  const primaryOrExpertise = (Array.isArray(formState.primaryExpertise) && formState.primaryExpertise.length)
    ? formState.primaryExpertise
    : (Array.isArray(formState.subjectExpertise) ? formState.subjectExpertise : []);

  if (primaryOrExpertise.length === 0) {
    errors.subjectExpertise = "Select at least one subject expertise.";
  }

  if (!Array.isArray(formState.gradeLevelAssignments) || formState.gradeLevelAssignments.length === 0) {
    errors.gradeLevelAssignments = "Select at least one grade level assignment.";
  }

  return errors;
}

function normalizeFacultyRecord(formState, editingId) {
  const now = new Date().toISOString();
  const isClassAdviser = Boolean(
    formState.isClassAdviser ||
    (Array.isArray(formState.ancillaryAssignments) && formState.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
  );
  const rawCredit = Number(formState.ancillaryCreditHours);
  const ancillaryCreditHours = Number.isFinite(rawCredit) && rawCredit > 0 ? rawCredit : (isClassAdviser ? 5 : 0);

  return {
    id: editingId || createFacultyId(),
    name: sanitizeText(formState.name),
    sex: formState.sex || "Male",
    employeeId: sanitizeText(formState.employeeId).toUpperCase(),
    position: normalizeDesignation(formState.position),
    appointmentStatus: formState.appointmentStatus || formState.employmentStatus || "Permanent",
    workingArrangement: formState.workingArrangement || "Full-Time",
    employmentStatus: formState.appointmentStatus || formState.employmentStatus || "Permanent",
    email: sanitizeText(formState.email).toLowerCase(),
    contact: sanitizeText(formState.contact),
    degree: sanitizeText(formState.degree),
    major: sanitizeText(formState.major),
    minor: sanitizeText(formState.minor),
    isClassAdviser,
    advisorySection: sanitizeText(formState.advisorySection),
    ancillaryCreditHours,
    ancillaryAssignments: normalizeArray(formState.ancillaryAssignments),
    unavailablePeriods: normalizeUnavailablePeriods(formState.unavailablePeriods),
    subjectExpertise: normalizeArray(formState.primaryExpertise?.length ? formState.primaryExpertise : formState.subjectExpertise),
    primaryExpertise: normalizeArray(formState.primaryExpertise?.length ? formState.primaryExpertise : formState.subjectExpertise),
    secondaryExpertise: normalizeArray(formState.secondaryExpertise),
    gradeLevelAssignments: normalizeArray(formState.gradeLevelAssignments),
    assignedLoadPercent: Number(formState.assignedLoadPercent) || 0,
    active: typeof formState.active === "boolean" ? formState.active : true,
    createdAt: formState.createdAt || now,
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

const SPA_SPECIALIZATION_STREAMS = [
  "SPA Specialization (Media Arts)",
  "SPA Specialization (Dance Arts)",
  "SPA Specialization (Instrumental Music)",
  "SPA Specialization (Visual Arts)",
  "SPA Specialization (Vocal Music)",
  "SPA Specialization (Theater Arts)",
  "SPA Specialization (Creative Writing)",
];

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
    let hasSpaSpec = false;

    parsed.forEach((subject) => {
      const code = sanitizeText(subject.subjectCode);
      const name = sanitizeText(subject.subjectName);
      if (!code && !name) {
        return;
      }

      const value = code ? `${code} — ${name}` : name;
      optionMap.set(value.toLowerCase(), value);

      if (code.toUpperCase() === "SPASPEC" || name.toLowerCase().includes("spa specialization")) {
        hasSpaSpec = true;
      }

      // Also include any configured breakout streams as selectable specializations
      if (Array.isArray(subject.breakoutStreams)) {
        subject.breakoutStreams.forEach((stream) => {
          const streamName = sanitizeText(typeof stream === "string" ? stream : stream?.name);
          if (streamName) {
            const label = code ? `${code} — ${name} (${streamName})` : `${name} (${streamName})`;
            optionMap.set(label.toLowerCase(), label);
          }
        });
      }
    });

    if (hasSpaSpec || parsed.some((s) => s && s.schoolLevel === "jhs")) {
      SPA_SPECIALIZATION_STREAMS.forEach((spaTitle) => {
        const label = `SPASPEC — ${spaTitle}`;
        optionMap.set(label.toLowerCase(), label);
      });
    }

    return Array.from(optionMap.values()).sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

function getSectionOptions() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("turotugma_sections_created");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const sections = [];
    const seen = new Set();
    for (const level of ["jhs", "shs"]) {
      if (parsed && parsed[level] && typeof parsed[level] === "object") {
        for (const gradeKey of Object.keys(parsed[level])) {
          const gradeObj = parsed[level][gradeKey];
          const gradeNum = parseInt(String(gradeKey).replace(/\D/g, ""), 10);
          const secs = Array.isArray(gradeObj?.sections) ? gradeObj.sections : (Array.isArray(gradeObj) ? gradeObj : []);
          secs.forEach((sec, index) => {
            if (sec) {
              const secName = typeof sec === "string" ? sec : (sec.name || "");
              if (!secName || seen.has(secName.toLowerCase())) return;
              seen.add(secName.toLowerCase());
              const grade = sec.grade || gradeNum || gradeKey;
              const label = secName.toLowerCase().includes(`grade ${grade}`) || secName.startsWith(`${grade}-`)
                ? secName
                : `Grade ${grade} - ${secName}`;
              sections.push({ id: sec.id || `${level}-${gradeNum}-${index}`, name: secName, label });
            }
          });
        }
      }
    }
    return sections;
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
      ancillaryCreditHours: Number(member.ancillaryCreditHours) || 0,
      advisorySection: sanitizeText(member.advisorySection),
      isClassAdviser: Boolean(member.isClassAdviser || (Array.isArray(member.ancillaryAssignments) && member.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))),
      unavailablePeriods: normalizeUnavailablePeriods(member.unavailablePeriods),
      subjectExpertise: normalizeArray(member.subjectExpertise || member.primaryExpertise),
      primaryExpertise: normalizeArray(member.primaryExpertise || member.subjectExpertise),
      secondaryExpertise: normalizeArray(member.secondaryExpertise),
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

  const name = pickRowValue(normalizedRow, ["name", "teachername", "fullname", "facultyname"]);
  const sex = normalizeSexValue(pickRowValue(normalizedRow, ["sex", "gender"]));
  const employeeId = pickRowValue(normalizedRow, ["employeeid", "id", "teacherid", "empid", "depedid"]);
  const position = normalizeDesignation(pickRowValue(normalizedRow, ["position", "designation", "rank", "plantilla"]));
  const appointmentStatus = normalizeEmploymentStatus(pickRowValue(normalizedRow, ["appointmentcategory", "appointmentstatus", "employmentstatus", "status"]));
  const workingArrangement = normalizeWorkingArrangement(pickRowValue(normalizedRow, ["workingarrangement", "arrangement", "schedule"]));
  const employmentStatus = appointmentStatus;
  const email = pickRowValue(normalizedRow, ["email", "emailaddress", "depedemail"]);
  const rawContactVal = pickRowValue(normalizedRow, ["contact", "contactnumber", "phone", "mobile", "mobilenumber", "cellphone", "cpnumber", "contactno"]);
  const cleanedPhone = rawContactVal.replace(/[\s\-()]/g, "");
  const contact = /^9\d{9}$/.test(cleanedPhone)
    ? `0${cleanedPhone}`
    : /^639\d{9}$/.test(cleanedPhone)
    ? `+${cleanedPhone}`
    : rawContactVal;
  const degree = pickRowValue(normalizedRow, ["degree", "highestdegree", "education"]);
  const major = pickRowValue(normalizedRow, ["major", "specialization"]);
  const minor = pickRowValue(normalizedRow, ["minor"]);

  const ancillaryAssignments = splitListInput(pickRowValue(normalizedRow, ["ancillaryassignments", "ancillary", "ancillaryroles", "coordinatorships"]));
  const unavailablePeriods = resolveListToOptions(
    splitListInput(pickRowValue(normalizedRow, ["unavailableperiods", "unavailable"])),
    unavailablePeriodOptions,
    true
  );
  const rawExpertise = splitListInput(
    pickRowValue(normalizedRow, ["subjectexpertise", "expertise", "primaryexpertise", "subjects", "subject"]) || major
  );
  const subjectExpertise = (subjectOptions && subjectOptions.length > 0)
    ? resolveListToOptions(rawExpertise, subjectOptions, true)
    : rawExpertise;
  const gradeLevelAssignments = resolveListToGradeLevels(
    splitListInput(pickRowValue(normalizedRow, ["gradelevelassignments", "gradeassignments", "gradelevels", "gradelevel", "grades", "grade"]))
  );

  const isEmptyRow = [name, sex, employeeId, position, email, contact, degree, major].every((value) => !value);
  if (isEmptyRow) {
    return null;
  }

  const uniqueId = employeeId || `EMP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  return {
    ...EMPTY_FORM,
    id: uniqueId,
    name,
    sex,
    employeeId: uniqueId,
    position,
    appointmentStatus: appointmentStatus || "Permanent",
    workingArrangement: workingArrangement || "Full-Time",
    employmentStatus: appointmentStatus || "Permanent",
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
    active: true,
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
        const cleanVal = value.toLowerCase().trim();
        const direct = optionMap.get(cleanVal);
        if (direct) {
          return direct;
        }

        // Exact match against either the Subject Name (after "—") or Subject Code (before "—")
        const exactNameOrCode = options.find((option) => {
          const parts = option.split("—").map((p) => p.trim().toLowerCase());
          return parts.some((p) => p === cleanVal);
        });
        if (exactNameOrCode) {
          return exactNameOrCode;
        }

        const fuzzy = options.find((option) => option.toLowerCase().includes(cleanVal));
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
  if (!normalized) return "";
  if (normalized === "m" || normalized === "male") return "Male";
  if (normalized === "f" || normalized === "female") return "Female";
  const match = SEX_OPTIONS.find((option) => option.toLowerCase() === normalized);
  return match || "";
}

function normalizeEmploymentStatus(value) {
  const normalized = sanitizeText(value).toLowerCase();
  if (normalized.includes("reg") || normalized.includes("perm")) return "Permanent";
  if (normalized.includes("prov") || normalized.includes("prob")) return "Provisional";
  if (normalized.includes("cont")) return "Contractual";
  if (normalized.includes("sub")) return "Substitute";
  const match = EMPLOYMENT_STATUS_OPTIONS.find((option) => option.toLowerCase() === normalized);
  return match || "Permanent";
}

function normalizeWorkingArrangement(value) {
  const normalized = sanitizeText(value).toLowerCase();
  if (normalized.includes("part")) return "Part-Time";
  return "Full-Time";
}

function normalizeDesignation(value) {
  const raw = sanitizeText(value);
  if (!raw) return "Teacher I";
  const normalized = raw.toLowerCase();

  const direct = DEPED_DESIGNATION_OPTIONS.find((option) => option.toLowerCase() === normalized);
  if (direct) {
    return direct;
  }

  const fuzzy = DEPED_DESIGNATION_OPTIONS.find((option) => option.toLowerCase().includes(normalized));
  return fuzzy || direct || raw || "Teacher I";
}

function ConfirmationModal({ open, message, onConfirm, onCancel, title = "Confirmation", confirmLabel = "Confirm" }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999 }}>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, width: 440, maxWidth: "90%", padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
        <h3 style={{ margin: "0 0 10px", color: "#1e293b", fontSize: 18, fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button type="button" onClick={onCancel} style={{ padding: "9px 18px", borderRadius: 8, background: "#f1f5f9", color: "#475569", fontWeight: 600, border: "none", cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={onConfirm} style={{ padding: "9px 18px", borderRadius: 8, background: "#b53f4e", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
