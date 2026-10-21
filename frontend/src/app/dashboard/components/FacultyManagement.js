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

  assignments.forEach((asgn) => {
    const tid = asgn.teacherId;
    if (tid) {
      const faculty = facultyById.get(tid);
      const isClassAdviser = Boolean(
        faculty?.isClassAdviser ||
        (Array.isArray(faculty?.ancillaryAssignments) && faculty.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
      );

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

      // DepEd DO 005, s. 2024: Class Adviser's advisory section HGP period (1 period/wk)
      // is an integral duty covered under their 5.0h advising credit.
      // It is absorbed so it does not count as classroom contact overload.
      let isAdvisoryHGPAbsorbed = false;
      if (isClassAdviser && isHGP) {
        const count = adviserHGPCount[tid] || 0;
        if (count === 0) {
          isAdvisoryHGPAbsorbed = true;
          adviserHGPCount[tid] = 1;
          teacherAbsorbedHGPMap[tid] = true;
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

      // Track distinct academic subject preparations (excluding advisory HGP)
      if (!isHGP && asgn.subjectId) {
        const sec = asgn.sectionId ? sectionsMap.get(asgn.sectionId) : null;
        let prepLabel = String(sub?.subjectName || sub?.name || sub?.subjectCode || asgn.subjectId).trim();
        if (!/\b(?:7|8|9|10|11|12)\b/.test(prepLabel)) {
          const grade = sec?.grade || sub?.gradeLevel;
          if (grade && String(grade) !== "7-10") {
            prepLabel = `${prepLabel} ${grade}`;
          }
        }
        if (!teacherDistinctPrepsMap[tid]) teacherDistinctPrepsMap[tid] = new Set();
        teacherDistinctPrepsMap[tid].add(prepLabel);
      }
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
    // Class Advisers receive a 1-load credit (5 hours/week ancillary credit), capping contact teaching at 25 hrs/week.
    // Operational Workload Categories:
    // - Unassigned: 0 contact hours assigned
    // - Underload: < 20h for regular, < 16h for class adviser, < 12h for part-time (needs more classes assigned)
    // - Balanced: 20 - 30h for regular, 16 - 25h for class adviser, 12 - 20h for part-time (optimal target load)
    // - Overload: > 30h for regular, > 25h for adviser (exceeds teaching ceiling)
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

    const assignedSectionsList = teacherSectionsMap[faculty.id] ? Array.from(teacherSectionsMap[faculty.id].values()) : [];
    const assignedSubjectsList = teacherSubjectsMap[faculty.id] ? Array.from(teacherSubjectsMap[faculty.id].values()) : [];

    const prepsSet = teacherDistinctPrepsMap[faculty.id] || new Set();
    const distinctPrepsList = Array.from(prepsSet);
    const distinctPrepsCount = distinctPrepsList.length;
    const distinctPrepsSummary = distinctPrepsList.join(", ") || "None";
    const hasAdvisoryHGP = Boolean(teacherAbsorbedHGPMap[faculty.id]);

    return {
      ...faculty,
      isClassAdviser,
      appointmentStatus,
      workingArrangement,
      isPartTime,
      distinctPrepsCount,
      distinctPrepsList,
      distinctPrepsSummary,
      hasAdvisoryHGP,
      ancillaryCreditHours,
      maxTeachingContactHours,
      minBalancedHours,
      assignedPeriods: periodCount,
      assignedLoadMinutes: totalMinutes,
      assignedLoadHours: totalHours,
      dailyContactHours: dailyHours,
      assignedLoadPercent: percent,
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
    window.addEventListener("turotugma:schedule-updated", recalcLoads);
    window.addEventListener("storage", recalcLoads);
    return () => {
      window.removeEventListener("turotugma:faculty-updated", recalcLoads);
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

  const handleLoad80Dataset = async () => {
    try {
      const res = await fetch("/faculty_100_profiles.csv");
      if (!res.ok) throw new Error("Dataset file not found");
      const text = await res.text();
      const workbook = XLSX.read(text, { type: "string" });
      const sheetName = workbook.SheetNames[0];
      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
      const mapped = rawRows.map((row) => mapImportedFacultyRow(row, subjectOptions, unavailablePeriodOptions));
      persistFaculty(mapped);
      showNotice(`Successfully loaded 80 DepEd Faculty Profiles (64 JHS Only, 8 SHS Only, 8 Both JHS & SHS)!`, "success");
    } catch {
      showNotice("Failed to load 80 faculty dataset.", "error");
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
        setIsDrawerOpen(false);
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
      setIsDrawerOpen(false);
      showNotice("Faculty record updated.", "success");
      return;
    }

    persistFaculty([...facultyMembers, normalized]);
    setFormState(EMPTY_FORM);
    setTouched({});
    setIsDrawerOpen(false);
    showNotice("Faculty record added.", "success");
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
    setFormState({
      name: member.name,
      sex: member.sex,
      employeeId: member.employeeId,
      position: member.position || "Teacher I",
      appointmentStatus: member.appointmentStatus || member.employmentStatus || "Permanent",
      workingArrangement: member.workingArrangement || (String(member.employmentStatus).toLowerCase().includes("part") ? "Part-Time" : "Full-Time"),
      employmentStatus: member.appointmentStatus || member.employmentStatus || "Permanent",
      email: member.email,
      contact: member.contact,
      degree: member.degree,
      major: member.major,
      minor: member.minor,
      isClassAdviser: Boolean(member.isClassAdviser || member.ancillaryAssignments?.some((a) => String(a).toLowerCase().includes("adviser"))),
      advisorySection: member.advisorySection || "",
      ancillaryAssignments: member.ancillaryAssignments || [],
      ancillaryInput: "",
      unavailablePeriods: member.unavailablePeriods || [],
      subjectExpertise: member.subjectExpertise || member.primaryExpertise || [],
      primaryExpertise: member.primaryExpertise || member.subjectExpertise || [],
      secondaryExpertise: member.secondaryExpertise || [],
      gradeLevelAssignments: member.gradeLevelAssignments || [],
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
            onClick={handleLoad80Dataset}
            style={{
              ...secondaryActionStyle(),
              color: "#3B4197",
              borderColor: "#c7d2fe",
              background: "#eef2ff",
              fontWeight: 700,
            }}
            title="Load 80 DepEd Faculty Profiles dataset"
          >
            Load 80 Teachers
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
          <p style={{ margin: "6px 0 0", color: "#5d698d", fontSize: 13 }}>
            Headers: Name, Sex, Employee ID, Position, Employment Status, Email, Contact, Degree, Major, Minor,
            Ancillary Assignments, Unavailable Periods, Subject Expertise, Grade Level Assignments.
          </p>

          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFacultyImportFileChange} style={{ ...inputStyle(), paddingTop: 7, height: 38 }} />
            <button type="button" onClick={handleImportFacultyRows} style={primaryActionStyle()} disabled={!importPreviewRows.length || isParsingImport}>
              Import Valid Rows
            </button>
            <button
              type="button"
              onClick={handleLoad80Dataset}
              style={{
                ...secondaryActionStyle(),
                color: "#3B4197",
                borderColor: "#c7d2fe",
                background: "#eef2ff",
                fontWeight: 700,
              }}
              title="Load 80 DepEd Faculty Profiles dataset"
            >
              Load 80 Teachers Dataset
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
            20–30 contact hrs/wk
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
            Needs assignment (&lt; 20h)
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
            {/* DepEd Class Adviser 1-Load Credit Toggle */}
            <div style={{ margin: "10px 0", padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#1f2c6f" }}>
                <input
                  type="checkbox"
                  checked={Boolean(formState.isClassAdviser || formState.ancillaryAssignments?.some((a) => String(a).toLowerCase().includes("adviser")))}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    handleFormField("isClassAdviser", checked);
                    if (checked) {
                      if (!formState.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser"))) {
                        handleFormField("ancillaryAssignments", [...formState.ancillaryAssignments, "Class Adviser"]);
                      }
                      showNotice("Designated as Class Adviser (+5h teaching load credit applied under DepEd DO 005, s. 2024).", "success");
                    } else {
                      handleFormField("ancillaryAssignments", formState.ancillaryAssignments.filter((a) => !String(a).toLowerCase().includes("adviser")));
                    }
                  }}
                />
                <span>Class Adviser (DepEd 1-Load Credit / 5 hrs advisory time)</span>
              </label>
              <p style={{ margin: "4px 0 0 24px", fontSize: 11, color: "#64748b" }}>
                Per DO 005, s. 2024, advisory duty is credited as 1 teaching load (caps actual classroom teaching to 25 hrs/week instead of 30 hrs).
              </p>
            </div>
            <ChipList items={formState.ancillaryAssignments} onRemove={removeAncillaryAssignment} emptyText="No ancillary assignments added." />
            {formState.ancillaryAssignments && formState.ancillaryAssignments.length > 0 ? (
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>DepEd Workload Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    showNotice("Applied Major Ancillary Credit (-4 teaching periods/week).", "success");
                  }}
                  style={{ fontSize: 11, background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontWeight: 600 }}
                  title="Deducts 4 teaching periods for major roles like Registrar, Guidance Coordinator, Property Custodian."
                >
                  Major Credit (-4 periods)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showNotice("Applied Minor Ancillary Credit (-2 teaching periods/week).", "success");
                  }}
                  style={{ fontSize: 11, background: "#eef2ff", color: "#3B4197", border: "1px solid #c7d2fe", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontWeight: 600 }}
                  title="Deducts 2 teaching periods for minor roles like Grade Level Chair, Canteen Manager."
                >
                  Minor Credit (-2 periods)
                </button>
              </div>
            ) : null}
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
            <Field label="Primary Subject Expertise (Preferred)" required error={touched.subjectExpertise ? validationErrors.subjectExpertise : ""}>
              <SearchableMultiSelectChips
                options={subjectOptions}
                selected={formState.primaryExpertise && formState.primaryExpertise.length ? formState.primaryExpertise : formState.subjectExpertise}
                onToggle={(option) => {
                  const currentPrimary = formState.primaryExpertise && formState.primaryExpertise.length ? formState.primaryExpertise : formState.subjectExpertise;
                  const nextPrimary = currentPrimary.includes(option) ? currentPrimary.filter((i) => i !== option) : [...currentPrimary, option];
                  setFormState((prev) => ({ ...prev, primaryExpertise: nextPrimary, subjectExpertise: nextPrimary }));
                }}
                emptyLabel="No subjects available yet. Create subjects first."
                placeholder="Search primary subjects..."
              />
            </Field>
          </div>

          <div style={{ marginTop: 6 }}>
            <Field label="Secondary Subject Expertise (Fallback)">
              <SearchableMultiSelectChips
                options={subjectOptions}
                selected={formState.secondaryExpertise || []}
                onToggle={(option) => toggleMultiSelect("secondaryExpertise", option)}
                placeholder="Search secondary subjects..."
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

function FacultyListRow({ member, isEditing, onEdit, onDelete, onToggleActive }) {
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const loadStatus = member.assignedLoadStatus || "Unassigned";

  // Calibrate progress bar against teacher's max teaching limit (30h regular, 25h adviser)
  const memberHours = Number.isFinite(member.assignedLoadHours) ? member.assignedLoadHours : 0;
  const maxHours = member.maxTeachingContactHours || 30;
  const barPercent = Math.max(0, Math.min(100, (memberHours / maxHours) * 100));

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

  // Ancillaries list
  const ancillaries = [];
  if (
    member.isClassAdviser ||
    (Array.isArray(member.ancillaryAssignments) &&
      member.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
  ) {
    ancillaries.push("Class Adviser");
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
            >
              {member.name}
            </h3>

            {/* Position: Directly below the name, smaller, medium-weight */}
            <div style={{ marginTop: 2, fontSize: 12.5, fontWeight: 500, color: "#475569" }}>
              {position}
            </div>

            {/* Employee ID and employment: One muted metadata line */}
            <div style={{ marginTop: 2, fontSize: 11.5, color: "#64748b" }}>
              {employeeId} · {appointmentStatus} · {workingArrangement}
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
      <div style={{ height: 1, background: "#f1f5f9", margin: "12px 0 10px" }} />

      {/* 2. Workload Second: Weekly teaching load | [2 Preps] 25 hrs/wk [Balanced] */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ color: "#334155", fontSize: 12, fontWeight: 600 }}>Weekly teaching load</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {prepsCount > 0 && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "#3B4197",
                background: "#eef2ff",
                border: "1px solid #c7d2fe",
                borderRadius: 4,
                padding: "1px 6px",
              }}
              title={prepsList.length ? `Preparations: ${prepsList.join(", ")}` : ""}
            >
              {prepsCount} {prepsCount === 1 ? "Prep" : "Preps"}
            </span>
          )}
          <span style={{ fontSize: 12, color: "#1e293b", fontWeight: 600 }}>
            {formattedHours} hrs/wk{" "}
            <span style={{ color: statusColor, fontWeight: 700 }}>[{loadStatus}]</span>
          </span>
        </div>
      </div>

      {/* Progress bar: Thin ~6px, quiet background track, no /30 or percentage */}
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "#f1f5f9",
          overflow: "hidden",
          marginTop: 6,
          marginBottom: 12,
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

      {/* 3. Assignments Last: Sections & Ancillaries */}
      <div style={{ display: "grid", gridTemplateColumns: "68px 1fr", gap: 8, alignItems: "start", marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", paddingTop: 2 }}>Sections</span>
        {sections.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {sections.map((sec) => (
              <span
                key={sec.id}
                style={{
                  fontSize: 11,
                  background: "#f8fafc",
                  color: "#1e293b",
                  padding: "2px 8px",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontWeight: 500,
                  lineHeight: 1.4,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {formatSectionChip(sec)}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: 11.5, color: "#94a3b8", fontStyle: "italic", paddingTop: 2 }}>None assigned</span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "68px 1fr", gap: 8, alignItems: "baseline" }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b" }}>Ancillary</span>
        {ancillaries.length > 0 ? (
          <span style={{ fontSize: 12, color: "#334155", lineHeight: 1.4, fontWeight: 400 }}>
            {ancillaries.join(", ")}
          </span>
        ) : (
          <span style={{ fontSize: 11.5, color: "#94a3b8", fontStyle: "italic" }}>None</span>
        )}
      </div>
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
  const maxHours = member.maxTeachingContactHours || 30;
  const barPercent = Math.max(0, Math.min(100, (memberHours / maxHours) * 100));

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
    (Array.isArray(member.ancillaryAssignments) &&
      member.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
  ) {
    ancillaries.push("Class Adviser");
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
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          <span style={{ fontSize: 11.5, color: "#64748b" }}>{appointmentStatus} · {workingArrangement}</span>
          <span style={{ color: "#cbd5e1" }}>•</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: isActive ? "#047857" : "#64748b", fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#10b981" : "#94a3b8" }} />
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
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
    appointmentStatus: formState.appointmentStatus || formState.employmentStatus || "Permanent",
    workingArrangement: formState.workingArrangement || "Full-Time",
    employmentStatus: formState.appointmentStatus || formState.employmentStatus || "Permanent",
    email: sanitizeText(formState.email).toLowerCase(),
    contact: sanitizeText(formState.contact),
    degree: sanitizeText(formState.degree),
    major: sanitizeText(formState.major),
    minor: sanitizeText(formState.minor),
    isClassAdviser: Boolean(formState.isClassAdviser || formState.ancillaryAssignments?.some((a) => String(a).toLowerCase().includes("adviser"))),
    advisorySection: sanitizeText(formState.advisorySection),
    ancillaryAssignments: normalizeArray(formState.ancillaryAssignments),
    unavailablePeriods: normalizeUnavailablePeriods(formState.unavailablePeriods),
    subjectExpertise: normalizeArray(formState.primaryExpertise?.length ? formState.primaryExpertise : formState.subjectExpertise),
    primaryExpertise: normalizeArray(formState.primaryExpertise?.length ? formState.primaryExpertise : formState.subjectExpertise),
    secondaryExpertise: normalizeArray(formState.secondaryExpertise),
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
  const appointmentStatus = normalizeEmploymentStatus(pickRowValue(normalizedRow, ["appointmentcategory", "appointmentstatus", "employmentstatus", "status"]));
  const workingArrangement = normalizeWorkingArrangement(pickRowValue(normalizedRow, ["workingarrangement", "arrangement", "schedule"]));
  const employmentStatus = appointmentStatus;
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
  const rawExpertise = splitListInput(pickRowValue(normalizedRow, ["subjectexpertise", "expertise"]));
  const subjectExpertise = (subjectOptions && subjectOptions.length > 0)
    ? resolveListToOptions(rawExpertise, subjectOptions, true)
    : rawExpertise;
  const gradeLevelAssignments = resolveListToGradeLevels(
    splitListInput(pickRowValue(normalizedRow, ["gradelevelassignments", "gradeassignments", "gradelevels"]))
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
  const normalized = sanitizeText(value).toLowerCase();

  const direct = DEPED_DESIGNATION_OPTIONS.find((option) => option.toLowerCase() === normalized);
  if (direct) {
    return direct;
  }

  const fuzzy = DEPED_DESIGNATION_OPTIONS.find((option) => option.toLowerCase().includes(normalized));
  return fuzzy || "";
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
