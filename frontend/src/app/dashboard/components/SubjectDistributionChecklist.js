import React, { useState, useMemo } from "react";

/**
 * Subject Distribution & Teacher Coverage Checklist
 * For Diadi National High School (DNHS)
 * 
 * Verifies that each curriculum subject has been completely distributed
 * and staffed across all active sections.
 */

/**
 * Determines whether a subject is actually required / applicable for a given section.
 */
export function isSubjectRequiredForSection(subject, section, scheduleType, effectiveAssignments = {}) {
  if (!subject || !section) return false;

  const sectionGrade = Number(section.grade);
  const subjectGradeStr = String(subject.gradeLevel || "").trim();

  // 1. Grade check: If subject specifies an explicit grade (e.g. "7" or "Grade 7"), it must match sectionGrade
  if (subjectGradeStr && subjectGradeStr !== "Universal" && subjectGradeStr !== "7-10" && subjectGradeStr !== "Grades 7–10") {
    const parsedSubGrade = parseInt(subjectGradeStr.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsedSubGrade) && parsedSubGrade > 0 && parsedSubGrade !== sectionGrade) {
      return false;
    }
  }

  const secNameLower = String(section.name || "").trim().toLowerCase();
  const secIdStr = String(section.id || "").trim();

  // 2. Direct section-specific match or exclusivity
  const hasDirectSectionBinding = Boolean(
    subject.exclusiveToSection || subject.exclusiveSection || subject.sectionId || subject.sectionName
  );

  if (hasDirectSectionBinding) {
    const targetName = String(subject.exclusiveToSection || subject.exclusiveSection || subject.sectionName || "").trim().toLowerCase();
    const targetId = String(subject.sectionId || "").trim();
    if (targetId && targetId === secIdStr) return true;
    if (targetName && (targetName === secNameLower || secNameLower.includes(targetName) || targetName.includes(secNameLower))) return true;
    return false; // Specifically exclusive to another section
  }

  if (Array.isArray(subject.applicableSections) && subject.applicableSections.length > 0) {
    const matchesApplicable = subject.applicableSections.some((s) => {
      const sStr = String(s).trim().toLowerCase();
      return sStr === secIdStr.toLowerCase() || sStr === secNameLower;
    });
    if (!matchesApplicable) return false;
    return true;
  }

  // 3. Grid Assignment Presence Check: If scheduler already placed it in this section, it is required
  if (effectiveAssignments && typeof effectiveAssignments === "object") {
    const hasAssignedCell = Object.entries(effectiveAssignments).some(([cellKey, asgn]) => {
      if (!cellKey.startsWith(`${section.id}|`)) return false;
      if (!asgn || !asgn.subjectId) return false;
      if (asgn.subjectId === subject.id) return true;
      if (subject.subjectCode && asgn.subjectCode && String(subject.subjectCode).toLowerCase() === String(asgn.subjectCode).toLowerCase()) return true;
      return false;
    });
    if (hasAssignedCell) return true;
  }

  // 4. JHS Curriculum Exclusivity Rules
  if (scheduleType === "jhs") {
    const rawClass = String(section.classification || "Regular").trim().toLowerCase();
    const isSpStem = rawClass.includes("stem") || rawClass.includes("ste") || rawClass.includes("special science");
    const isSpa = rawClass.includes("spa");
    const isSpj = rawClass.includes("spj");
    const isIntervention = rawClass.includes("intervention") || rawClass.includes("aral") || Boolean(section.isInterventionSection);
    const isRegular = !isSpStem && !isSpa && !isSpj && !isIntervention;

    const code = String(subject.subjectCode || "").trim().toUpperCase();
    const name = String(subject.subjectName || "").trim().toLowerCase();
    const scope = String(subject.programScope || "").trim().toLowerCase();
    const type = String(subject.subjectType || "").trim().toLowerCase();

    // Universal / HGP
    if (code === "HGP" || name.includes("homeroom guidance") || scope === "universal" || scope === "all") {
      return true;
    }

    // SP-STEM Enhanced / Specialized subjects (DEVREAD, ELEMALG, ENVSCI, Research, Biotech, ICT-STEM)
    const isStemExclusive =
      code === "DEVREAD" || name.includes("developmental reading") ||
      code === "ELEMALG" || name.includes("elementary algebra") ||
      code === "ENVSCI" || name.includes("environmental science") ||
      code.includes("RESEARCH") || name.includes("research") ||
      code.includes("BIOTECH") || name.includes("biotechnology") ||
      code === "ICT-STEM" ||
      scope.includes("stem") || scope.includes("ste");

    if (isStemExclusive) {
      return isSpStem;
    }

    // SPA Specialization
    if (code === "SPASPEC" || name.includes("spa specialization") || scope.includes("spa")) {
      return isSpa;
    }

    // SPJ Specialization (ICT-SPJ / Journalism)
    if (code === "ICT-SPJ" || name.includes("journalism") || (scope.includes("spj") && !scope.includes("stem"))) {
      return isSpj;
    }

    // TLE: In DepEd JHS, Regular and SPA sections take standard TLE. SP-STEM and SPJ take specialized subjects instead.
    if (code === "TLE" || name.includes("technology and livelihood")) {
      return isRegular || isSpa;
    }

    // Aral Program / Targeted Remediation
    if (code === "ARAL" || name.includes("aral program") || scope.includes("intervention")) {
      if (scope.includes("intervention")) return isIntervention;
      return isRegular;
    }

    // Standard Core subjects (English, Math, Science, Filipino, AP, VE/EsP, MAPEH)
    const isCore = [
      "MATHEMATICS", "SCIENCE", "FILIPINO", "ENGLISH",
      "VALUES EDUCATION", "ARALING PANLIPUNAN", "MAPEH", "ESP", "EDUKASYON SA PAGPAPAKAKATAO"
    ].some((cName) => name.toUpperCase().includes(cName) || code.includes(cName));

    if (isCore || type === "core") {
      return true;
    }

    // Regular Only Scope
    if (scope.includes("regular")) {
      return isRegular;
    }

    // If scope explicitly targets SPA, SPJ, or STEM and section does not match, return false
    if (scope.includes("spa") && !isSpa) return false;
    if (scope.includes("spj") && !isSpj) return false;
    if ((scope.includes("stem") || scope.includes("ste")) && !isSpStem) return false;

    return scope === "universal" || scope === "" || type === "core";
  }

  // 5. SHS Curriculum Exclusivity Rules
  if (scheduleType.startsWith("shs")) {
    const code = String(subject.subjectCode || "").trim().toUpperCase();
    const name = String(subject.subjectName || "").trim().toLowerCase();
    const type = String(subject.subjectType || "").trim().toLowerCase();
    const strand = String(subject.strand || "").trim().toUpperCase();
    const scope = String(subject.programScope || "").trim().toLowerCase();

    // Universal / HGP / Core
    if (code === "HGP" || name.includes("homeroom guidance") || scope === "universal" || scope === "all" || type === "core") {
      return true;
    }

    // Strand Matching
    if (strand) {
      const secTrack = String(section.track || "").trim().toUpperCase();
      const secCluster = String(section.cluster || section.strand || "").trim().toUpperCase();

      if (strand === "STEM") return secCluster.includes("STEM");
      if (strand === "HUMSS") return secCluster.includes("HUMSS");
      if (strand === "ABM") return secCluster.includes("ABM") || secCluster.includes("BUSINESS");
      if (strand === "TVL" || strand.includes("TECHPRO")) {
        return secTrack === "TECHPRO" || secCluster.includes("TECHPRO") || secCluster.includes("TVL") || secCluster.includes("ICT");
      }
      if (strand === "GAS") return secCluster.includes("GAS") || secCluster.includes("GENERAL");

      return secCluster.includes(strand) || secTrack.includes(strand);
    }

    return type === "core";
  }

  return true;
}

/**
 * Generates an informative exclusivity badge label when a subject applies to a subset of sections.
 */
export function getExclusivityLabel(subject, applicableCount, totalGradeSections) {
  if (applicableCount >= totalGradeSections) {
    return null; // Universal across all sections in this grade
  }

  const scope = String(subject.programScope || "").trim().toLowerCase();
  const code = String(subject.subjectCode || "").trim().toUpperCase();
  const strand = String(subject.strand || "").trim().toUpperCase();

  if (code === "DEVREAD" || code === "ELEMALG" || code === "ENVSCI" || scope.includes("stem") || scope.includes("ste")) {
    return `SP-STEM Exclusive (${applicableCount} ${applicableCount === 1 ? "Section" : "Sections"})`;
  }
  if (code === "SPASPEC" || scope.includes("spa")) {
    return `SPA Exclusive (${applicableCount} ${applicableCount === 1 ? "Section" : "Sections"})`;
  }
  if (code === "ICT-SPJ" || scope.includes("spj")) {
    return `SPJ Exclusive (${applicableCount} ${applicableCount === 1 ? "Section" : "Sections"})`;
  }
  if (scope.includes("regular") || code === "TLE" || code === "ARAL") {
    return `Regular Exclusive (${applicableCount} ${applicableCount === 1 ? "Section" : "Sections"})`;
  }
  if (strand) {
    return `${strand} Exclusive (${applicableCount} ${applicableCount === 1 ? "Section" : "Sections"})`;
  }
  if (subject.exclusiveToSection || subject.exclusiveSection || subject.sectionName) {
    const secName = subject.exclusiveToSection || subject.exclusiveSection || subject.sectionName;
    return `Exclusive: ${secName}`;
  }

  return `Exclusive (${applicableCount} ${applicableCount === 1 ? "Section" : "Sections"})`;
}

/**
 * Computes overall subject distribution metrics across all active sections
 * for checking 100% completion before publishing.
 */
export function computeSubjectDistributionMetrics({
  sections = [],
  subjects = [],
  scheduleType = "jhs",
  assignments = {},
  subjectsById = new Map(),
}) {
  const activeGradeLevels = scheduleType === "jhs" ? [7, 8, 9, 10] : [11, 12];
  const sectionsByGrade = { 7: [], 8: [], 9: [], 10: [], 11: [], 12: [] };
  sections.forEach((sec) => {
    const g = Number(sec.grade);
    if (sectionsByGrade[g]) {
      sectionsByGrade[g].push(sec);
    }
  });

  const relevantSubjects = subjects.filter((sub) => {
    const subLevel = sub.schoolLevel || (sub.gradeLevel && Number(sub.gradeLevel) >= 11 ? "shs" : "jhs");
    if (scheduleType === "jhs") return subLevel === "jhs";
    return subLevel === "shs";
  });

  const isSubjectMatch = (asgn, targetSub) => {
    if (!asgn || !asgn.subjectId) return false;
    if (asgn.subjectId === targetSub.id) return true;
    const subObj = subjectsById?.get ? subjectsById.get(asgn.subjectId) : null;
    if (!subObj) return false;
    if (subObj.subjectCode && targetSub.subjectCode && subObj.subjectCode.toLowerCase() === targetSub.subjectCode.toLowerCase()) return true;
    if (subObj.subjectName && targetSub.subjectName && subObj.subjectName.toLowerCase() === targetSub.subjectName.toLowerCase()) return true;
    return false;
  };

  let totalRequired = 0;
  let totalAssigned = 0;
  let incompleteCount = 0;

  activeGradeLevels.forEach((gradeNum) => {
    const gradeSections = sectionsByGrade[gradeNum] || [];
    if (gradeSections.length === 0) return;

    relevantSubjects.forEach((sub) => {
      const applicableSections = gradeSections.filter((sec) =>
        isSubjectRequiredForSection(sub, sec, scheduleType, assignments)
      );
      if (applicableSections.length === 0) return;

      const subReq = applicableSections.length;
      let subAssigned = 0;

      applicableSections.forEach((sec) => {
        const hasAssignment = Object.entries(assignments || {}).some(([cellKey, asgn]) => {
          if (!cellKey.startsWith(`${sec.id}|`)) return false;
          if (!asgn || !asgn.teacherId) return false;
          return isSubjectMatch(asgn, sub);
        });
        if (hasAssignment) {
          subAssigned++;
        }
      });

      totalRequired += subReq;
      totalAssigned += subAssigned;
      if (subAssigned < subReq) {
        incompleteCount++;
      }
    });
  });

  const percentage = totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 100;
  const isComplete = totalRequired === 0 || totalAssigned >= totalRequired || percentage >= 100;

  return {
    totalRequired,
    totalAssigned,
    percentage,
    incompleteCount,
    isComplete,
  };
}

/**
 * Resolves the official Class Adviser for a given section from:
 * 1. User overrides (customAdvisers state / localStorage)
 * 2. Section object properties (sec.adviser, sec.classAdviser)
 * 3. Active teachers advisory class configuration (t.advisoryClass, t.advisorySection)
 * 4. Official Diadi National High School historical roster
 */
export function resolveSectionAdviser(sec, activeTeachers = [], customAdvisers = {}) {
  if (!sec) return "";

  // 1. Check custom overrides from local state or localStorage
  if (customAdvisers && (customAdvisers[sec.id] || customAdvisers[sec.name])) {
    return customAdvisers[sec.id] || customAdvisers[sec.name];
  }

  // 2. Check sec.adviser or sec.classAdviser directly on section object
  const secAdv = String(sec.adviser || sec.classAdviser || "").trim();
  if (secAdv && secAdv !== "—" && secAdv !== "None" && secAdv !== "No Adviser Set" && secAdv !== "undefined") {
    return secAdv;
  }

  const secNameLower = String(sec.name || "").trim().toLowerCase();

  // 3. Match from active teachers: check if any teacher has this section as their advisoryClass
  const matchedTeacher = activeTeachers.find((t) => {
    const adv = String(t.advisoryClass || t.advisorySection || "").trim().toLowerCase();
    if (!adv || adv === "none") return false;
    return adv === secNameLower || adv.includes(secNameLower) || secNameLower.includes(adv);
  });
  if (matchedTeacher) {
    return matchedTeacher.name;
  }

  // 4. Default Diadi National High School Class Advisers roster
  const defaultAdvisers = {
    // Grade 7
    "grade 7 - diamond": "Juan Dela Cruz",
    "grade 7 - ruby": "Maria Santos",
    "grade 7 - emerald": "Pedro Reyes",
    "grade 7 - sapphire": "Elena Garcia",
    "grade 7 - topaz": "Roberto Mendoza",
    "grade 7 - amethyst": "Grace Bautista",
    "grade 7 - pearl": "Teresa Aquino",
    "grade 7 - ste einstein": "Mark Anthony Ramos",
    "diamond": "Juan Dela Cruz",
    "ruby": "Maria Santos",
    "emerald": "Pedro Reyes",
    "sapphire": "Elena Garcia",
    "topaz": "Roberto Mendoza",
    "amethyst": "Grace Bautista",
    "pearl": "Teresa Aquino",
    "ste einstein": "Mark Anthony Ramos",

    // Grade 8
    "grade 8 - diamond": "Pedro Reyes",
    "grade 8 - ruby": "Elena Garcia",
    "grade 8 - emerald": "Juan Dela Cruz",
    "grade 8 - sapphire": "Maria Santos",
    "grade 8 - topaz": "Roberto Mendoza",
    "grade 8 - amethyst": "Grace Bautista",
    "grade 8 - pearl": "Teresa Aquino",
    "grade 8 - ste einstein": "Mark Anthony Ramos",

    // Grade 9
    "grade 9 - diamond": "Roberto Mendoza",
    "grade 9 - ruby": "Grace Bautista",
    "grade 9 - emerald": "Juan Dela Cruz",
    "grade 9 - sapphire": "Maria Santos",
    "grade 9 - topaz": "Pedro Reyes",
    "grade 9 - amethyst": "Elena Garcia",
    "grade 9 - pearl": "Teresa Aquino",
    "grade 9 - ste einstein": "Mark Anthony Ramos",

    // Grade 10
    "grade 10 - diamond": "Teresa Aquino",
    "grade 10 - ruby": "Mark Anthony Ramos",
    "grade 10 - emerald": "Juan Dela Cruz",
    "grade 10 - sapphire": "Maria Santos",
    "grade 10 - topaz": "Pedro Reyes",
    "grade 10 - amethyst": "Elena Garcia",
    "grade 10 - pearl": "Roberto Mendoza",
    "grade 10 - ste einstein": "Grace Bautista",

    // Grade 11
    "grade 11 - stem newton": "Dr. Fernando Castro",
    "grade 11 - humss rizal": "Liza Macaraeg",
    "grade 11 - tvl tesla": "Engr. Daniel Panganiban",
    "stem newton": "Dr. Fernando Castro",
    "humss rizal": "Liza Macaraeg",
    "tvl tesla": "Engr. Daniel Panganiban",

    // Grade 12
    "grade 12 - stem einstein": "Ronald Gutierrez",
    "grade 12 - humss mabini": "Jocelyn Navarro",
    "grade 12 - tvl edison": "Jonathan Santos",
    "stem einstein": "Ronald Gutierrez",
    "humss mabini": "Jocelyn Navarro",
    "tvl edison": "Jonathan Santos",
  };

  for (const [pattern, advName] of Object.entries(defaultAdvisers)) {
    if (secNameLower.includes(pattern) || pattern.includes(secNameLower)) {
      return advName;
    }
  }

  // Fallback by grade and section index if standard generic name like "Grade 7 Section 1"
  const secIndexMatch = sec.id?.match(/-(\d+)$/);
  if (secIndexMatch) {
    const idx = parseInt(secIndexMatch[1], 10);
    const jhsOrder = [
      "Juan Dela Cruz",
      "Maria Santos",
      "Pedro Reyes",
      "Elena Garcia",
      "Roberto Mendoza",
      "Grace Bautista",
      "Teresa Aquino",
      "Mark Anthony Ramos",
    ];
    if (Number(sec.grade) <= 10 && jhsOrder[idx]) {
      return jhsOrder[idx];
    }
  }

  return "";
}

export default function SubjectDistributionChecklist({
  scheduleType = "jhs",
  sections = [],
  subjects = [],
  activeTeachers = [],
  facultyById = new Map(),
  subjectsById = new Map(),
  schedule = null,
  setSchedule = () => {},
  cellEditorDrafts = {},
  setCellEditorDrafts = () => {},
  showNotice = () => {},
  slots = [],
  config = {},
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // "all" | "incomplete" | "complete"
  const [gradeFilter, setGradeFilter] = useState("all"); // "all" | "7" | "8" | "9" | "10" | "11" | "12"
  const [expandedSubjectKeys, setExpandedSubjectKeys] = useState(new Set());

  // Custom advisers state with localStorage persistence
  const [customAdvisers, setCustomAdvisers] = useState(() => {
    try {
      const stored = localStorage.getItem("turotugma_section_advisers");
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return {};
  });

  // Handler to assign / change a section's Class Adviser on the fly
  const handleAssignSectionAdviser = (sec, teacherName) => {
    if (!sec || !teacherName) return;

    setCustomAdvisers((prev) => {
      const next = { ...prev, [sec.id]: teacherName, [sec.name]: teacherName };
      try {
        localStorage.setItem("turotugma_section_advisers", JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    // Also persist into "turotugma_sections_created"
    try {
      const raw = localStorage.getItem("turotugma_sections_created");
      if (raw) {
        const parsed = JSON.parse(raw);
        const level = sec.grade >= 11 ? "shs" : "jhs";
        const gradeObj = parsed?.[level]?.[sec.grade];
        if (gradeObj && Array.isArray(gradeObj.sections)) {
          const target = gradeObj.sections.find((s) => s.id === sec.id || s.name === sec.name);
          if (target) {
            target.adviser = teacherName;
            target.classAdviser = teacherName;
            localStorage.setItem("turotugma_sections_created", JSON.stringify(parsed));
          }
        }
      }
    } catch (_) {}

    showNotice(`Assigned ${teacherName} as Class Adviser for ${sec.name}!`, "success");
  };

  // Determine current active grades based on scheduleType
  const activeGradeLevels = useMemo(() => {
    if (scheduleType === "jhs") return [7, 8, 9, 10];
    return [11, 12];
  }, [scheduleType]);

  // Combine schedule.assignments with live cellEditorDrafts
  const effectiveAssignments = useMemo(() => {
    const base = { ...(schedule?.assignments || {}) };
    Object.entries(cellEditorDrafts || {}).forEach(([cellKey, draft]) => {
      if (draft && draft.subjectId && draft.teacherId) {
        base[cellKey] = {
          subjectId: draft.subjectId,
          teacherId: draft.teacherId,
          source: "draft",
          updatedAt: new Date().toISOString(),
        };
      } else if (draft && !draft.subjectId) {
        delete base[cellKey];
      }
    });
    return base;
  }, [schedule?.assignments, cellEditorDrafts]);

  // Compute coverage data per subject & grade with strict exclusivity checking
  const checklistData = useMemo(() => {
    // 1. Group sections by grade
    const sectionsByGrade = { 7: [], 8: [], 9: [], 10: [], 11: [], 12: [] };
    sections.forEach((sec) => {
      const g = Number(sec.grade);
      if (sectionsByGrade[g]) {
        sectionsByGrade[g].push(sec);
      }
    });

    // 2. Identify subjects relevant to current schedule level
    const relevantSubjects = subjects.filter((sub) => {
      const subLevel = sub.schoolLevel || (sub.gradeLevel && Number(sub.gradeLevel) >= 11 ? "shs" : "jhs");
      if (scheduleType === "jhs") return subLevel === "jhs";
      return subLevel === "shs";
    });

    // 3. Helper to check if a subject matches an assignment
    const isSubjectMatch = (asgn, targetSub) => {
      if (!asgn || !asgn.subjectId) return false;
      if (asgn.subjectId === targetSub.id) return true;
      const subObj = subjectsById.get(asgn.subjectId);
      if (!subObj) return false;
      if (subObj.subjectCode && targetSub.subjectCode && subObj.subjectCode.toLowerCase() === targetSub.subjectCode.toLowerCase()) return true;
      if (subObj.subjectName && targetSub.subjectName && subObj.subjectName.toLowerCase() === targetSub.subjectName.toLowerCase()) return true;
      return false;
    };

    // 4. Generate Checklist Items
    const items = [];

    // Special: HGP (Homeroom Guidance Program) — Universal across all active sections
    const hgpSub = relevantSubjects.find((s) => (s.subjectCode && s.subjectCode.toUpperCase() === "HGP") || (s.subjectName && s.subjectName.toLowerCase().includes("homeroom"))) || {
      id: "universal-hgp",
      subjectCode: "HGP",
      subjectName: "Homeroom Guidance Program (HGP)",
      gradeLevel: "Universal",
    };

    const allApplicableSections = sections.filter((s) => activeGradeLevels.includes(Number(s.grade)));
    
    // Compute HGP coverage
    const hgpSectionDetails = allApplicableSections.map((sec) => {
      let assignedTeacher = null;
      let slotCount = 0;

      Object.entries(effectiveAssignments).forEach(([cellKey, asgn]) => {
        if (!cellKey.startsWith(`${sec.id}|`)) return;
        if (isSubjectMatch(asgn, hgpSub)) {
          slotCount++;
          if (asgn.teacherId) {
            assignedTeacher = facultyById.get(asgn.teacherId) || { id: asgn.teacherId, name: asgn.teacherName || "Assigned Teacher" };
          }
        }
      });

      const adviserName = resolveSectionAdviser(sec, activeTeachers, customAdvisers);

      return {
        section: sec,
        isAssigned: Boolean(assignedTeacher),
        teacher: assignedTeacher,
        slotCount,
        adviserName,
      };
    });

    const hgpAssignedCount = hgpSectionDetails.filter((d) => d.isAssigned).length;
    items.push({
      key: "hgp-universal",
      subjectCode: "HGP",
      subjectName: "Homeroom Guidance Program (HGP)",
      grade: "All",
      gradeLabel: "All Grades",
      totalRequired: allApplicableSections.length,
      assignedCount: hgpAssignedCount,
      percentage: allApplicableSections.length > 0 ? Math.round((hgpAssignedCount / allApplicableSections.length) * 100) : 100,
      sectionDetails: hgpSectionDetails,
      subjectObj: hgpSub,
      isUniversal: true,
      exclusivityLabel: null,
    });

    // Generate items for each grade level
    activeGradeLevels.forEach((gradeNum) => {
      const gradeSections = sectionsByGrade[gradeNum] || [];
      if (gradeSections.length === 0) return;

      // Filter subjects for this grade
      const gradeSubjects = relevantSubjects.filter((sub) => {
        if ((sub.subjectCode && sub.subjectCode.toUpperCase() === "HGP") || (sub.subjectName && sub.subjectName.toLowerCase().includes("homeroom"))) {
          return false; // Handled in universal HGP
        }
        if (sub.gradeLevel === "Universal" || sub.gradeLevel === "7-10" || sub.gradeLevel === "Grades 7–10") return true;
        if (String(sub.gradeLevel).includes(String(gradeNum))) return true;
        return true;
      });

      // Deduplicate by code or name
      const seen = new Set();
      gradeSubjects.forEach((sub) => {
        const identifier = (sub.subjectCode || sub.subjectName || "").toUpperCase();
        if (seen.has(identifier)) return;
        seen.add(identifier);

        // FILTER GRADE SECTIONS TO ONLY THOSE THAT ACTUALLY REQUIRE THIS SUBJECT!
        const applicableSections = gradeSections.filter((sec) =>
          isSubjectRequiredForSection(sub, sec, scheduleType, effectiveAssignments)
        );

        // If this subject is not applicable to any section in this grade, skip it!
        if (applicableSections.length === 0) return;

        const exclusivityLabel = getExclusivityLabel(sub, applicableSections.length, gradeSections.length);

        const sectionDetails = applicableSections.map((sec) => {
          let assignedTeacher = null;
          let slotCount = 0;

          Object.entries(effectiveAssignments).forEach(([cellKey, asgn]) => {
            if (!cellKey.startsWith(`${sec.id}|`)) return;
            if (isSubjectMatch(asgn, sub)) {
              slotCount++;
              if (asgn.teacherId) {
                assignedTeacher = facultyById.get(asgn.teacherId) || { id: asgn.teacherId, name: asgn.teacherName || "Assigned Teacher" };
              }
            }
          });

          const adviserName = resolveSectionAdviser(sec, activeTeachers, customAdvisers);

          return {
            section: sec,
            isAssigned: Boolean(assignedTeacher),
            teacher: assignedTeacher,
            slotCount,
            adviserName,
          };
        });

        const assignedCount = sectionDetails.filter((d) => d.isAssigned).length;
        const totalRequired = applicableSections.length;
        const percentage = totalRequired > 0 ? Math.round((assignedCount / totalRequired) * 100) : 100;

        items.push({
          key: `${sub.id || sub.subjectCode}-${gradeNum}`,
          subjectCode: sub.subjectCode || sub.subjectName,
          subjectName: sub.subjectName || sub.subjectCode,
          grade: gradeNum,
          gradeLabel: `Grade ${gradeNum}`,
          totalRequired,
          assignedCount,
          percentage,
          sectionDetails,
          subjectObj: sub,
          isUniversal: !exclusivityLabel,
          exclusivityLabel,
        });
      });
    });

    return items;
  }, [sections, subjects, scheduleType, activeGradeLevels, effectiveAssignments, facultyById, subjectsById, activeTeachers, customAdvisers]);

  // Filter items based on user search, status filter, and grade filter
  const filteredItems = useMemo(() => {
    return checklistData.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.subjectCode?.toLowerCase().includes(q);
        const matchName = item.subjectName?.toLowerCase().includes(q);
        const matchGrade = String(item.grade).toLowerCase().includes(q);
        const matchExclusivity = item.exclusivityLabel?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchGrade && !matchExclusivity) return false;
      }

      // 2. Status Filter
      if (filterMode === "incomplete" && item.assignedCount >= item.totalRequired) return false;
      if (filterMode === "complete" && item.assignedCount < item.totalRequired) return false;

      // 3. Grade Filter
      if (gradeFilter !== "all") {
        if (item.grade !== "All" && String(item.grade) !== String(gradeFilter)) return false;
      }

      return true;
    });
  }, [checklistData, searchQuery, filterMode, gradeFilter]);

  // High level metrics
  const totalAllocationsRequired = useMemo(() => checklistData.reduce((acc, it) => acc + it.totalRequired, 0), [checklistData]);
  const totalAllocationsAssigned = useMemo(() => checklistData.reduce((acc, it) => acc + it.assignedCount, 0), [checklistData]);
  const overallPercentage = totalAllocationsRequired > 0 ? Math.round((totalAllocationsAssigned / totalAllocationsRequired) * 100) : 100;
  const incompleteSubjectsCount = checklistData.filter((it) => it.assignedCount < it.totalRequired).length;

  const toggleExpand = (key) => {
    setExpandedSubjectKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ACTION 1: Quick Assign Teacher to Section
  const handleQuickAssignTeacher = (sec, sub, teacherId) => {
    if (!sec || !sub || !teacherId) return;
    const targetTeacher = facultyById.get(teacherId);
    if (!targetTeacher) return;

    // Find slots in this section that already have this subject
    const matchingCellKeys = [];
    Object.entries(effectiveAssignments).forEach(([cellKey, asgn]) => {
      if (!cellKey.startsWith(`${sec.id}|`)) return;
      if (asgn.subjectId === sub.id || (sub.subjectCode && asgn.subjectCode === sub.subjectCode)) {
        matchingCellKeys.push(cellKey);
      }
    });

    const newDrafts = { ...cellEditorDrafts };

    if (matchingCellKeys.length > 0) {
      matchingCellKeys.forEach((ck) => {
        newDrafts[ck] = {
          subjectId: sub.id,
          teacherId: targetTeacher.id,
        };
      });
    } else {
      const sectionSlots = slots.filter((sl) => sl && !sl.isBreak);
      let targetSlot = null;
      for (const sl of sectionSlots) {
        const ck = `${sec.id}|${sl.id}`;
        if (!effectiveAssignments[ck]) {
          targetSlot = sl;
          break;
        }
      }

      if (targetSlot) {
        const ck = `${sec.id}|${targetSlot.id}`;
        newDrafts[ck] = {
          subjectId: sub.id,
          teacherId: targetTeacher.id,
        };
      } else {
        const fallbackSlot = sectionSlots[0];
        if (fallbackSlot) {
          const ck = `${sec.id}|${fallbackSlot.id}`;
          newDrafts[ck] = {
            subjectId: sub.id,
            teacherId: targetTeacher.id,
          };
        }
      }
    }

    setCellEditorDrafts(newDrafts);
    setSchedule((prev) => (prev ? { ...prev, status: "unsaved" } : prev));
    showNotice(`Assigned ${targetTeacher.name} to ${sub.subjectCode || sub.subjectName} for ${sec.name}!`, "success");
  };

  // ACTION 2: Sync HGP to Class Advisers
  const handleSyncHGPToAdvisers = () => {
    let syncedCount = 0;
    const newDrafts = { ...cellEditorDrafts };

    const applicableSections = sections.filter((s) => activeGradeLevels.includes(Number(s.grade)));

    applicableSections.forEach((sec) => {
      const adviserName = resolveSectionAdviser(sec, activeTeachers, customAdvisers);
      if (!adviserName) return;
      const lowerAdv = adviserName.toLowerCase().trim();

      const matchingTeacher = activeTeachers.find((t) => {
        const tName = (t.name || "").toLowerCase().trim();
        return tName === lowerAdv || tName.includes(lowerAdv) || lowerAdv.includes(tName);
      });

      if (!matchingTeacher) return;

      const hgpSub = subjects.find((s) => (s.subjectCode && s.subjectCode.toUpperCase() === "HGP") || (s.subjectName && s.subjectName.toLowerCase().includes("homeroom"))) || {
        id: "universal-hgp",
        subjectCode: "HGP",
      };

      const sectionSlots = slots.filter((sl) => sl && !sl.isBreak);
      let targetSlot = null;

      for (const sl of sectionSlots) {
        const ck = `${sec.id}|${sl.id}`;
        const asgn = effectiveAssignments[ck];
        if (asgn && (asgn.subjectId === hgpSub.id || asgn.subjectCode === "HGP")) {
          targetSlot = sl;
          break;
        }
      }

      if (!targetSlot) {
        targetSlot = sectionSlots.find((sl) => sl.day === "Monday" && (sl.periodNumber === 8 || sl.period === 8)) || sectionSlots[0];
      }

      if (targetSlot) {
        const ck = `${sec.id}|${targetSlot.id}`;
        newDrafts[ck] = {
          subjectId: hgpSub.id,
          teacherId: matchingTeacher.id,
        };
        syncedCount++;
      }
    });

    setCellEditorDrafts(newDrafts);
    setSchedule((prev) => (prev ? { ...prev, status: "unsaved" } : prev));
    showNotice(`Successfully synced Homeroom Guidance (HGP) for ${syncedCount} section advisers!`, "success");
  };

  // ACTION 3: Auto-Distribute Unassigned Loads to Qualified Faculty (Only to applicable sections!)
  const handleAutoDistributeRemaining = () => {
    let autoAssignedCount = 0;
    const newDrafts = { ...cellEditorDrafts };

    checklistData.forEach((item) => {
      if (item.assignedCount >= item.totalRequired) return;

      const unassignedDetails = item.sectionDetails.filter((d) => !d.isAssigned);
      if (unassignedDetails.length === 0) return;

      const sub = item.subjectObj;
      const subTitle = (sub.subjectName || sub.subjectCode || "").toLowerCase();

      const candidates = activeTeachers.filter((t) => {
        const major = (t.major || "").toLowerCase();
        const spec = (t.specialization || "").toLowerCase();
        if (subTitle.includes("math") && (major.includes("math") || spec.includes("math"))) return true;
        if (subTitle.includes("eng") && (major.includes("eng") || spec.includes("eng"))) return true;
        if (subTitle.includes("sci") && (major.includes("sci") || spec.includes("sci") || major.includes("bio") || major.includes("chem") || major.includes("phys"))) return true;
        if (subTitle.includes("fil") && (major.includes("fil") || spec.includes("fil"))) return true;
        if ((subTitle.includes("araling") || subTitle.includes("ap")) && (major.includes("aral") || major.includes("social") || major.includes("history"))) return true;
        if ((subTitle.includes("values") || subTitle.includes("esp")) && (major.includes("values") || major.includes("guidance") || major.includes("esp"))) return true;
        if (subTitle.includes("mapeh") && (major.includes("mapeh") || major.includes("pe") || major.includes("music") || major.includes("arts"))) return true;
        if (subTitle.includes("tle") && (major.includes("tle") || major.includes("ict") || major.includes("industrial") || major.includes("agri"))) return true;
        return false;
      });

      const pool = candidates.length > 0 ? candidates : activeTeachers;

      unassignedDetails.forEach((detail, idx) => {
        const assignedTeacher = pool[idx % pool.length];
        if (!assignedTeacher) return;

        const sec = detail.section;
        const sectionSlots = slots.filter((sl) => sl && !sl.isBreak);
        const openSlot = sectionSlots.find((sl) => !effectiveAssignments[`${sec.id}|${sl.id}`]) || sectionSlots[idx % sectionSlots.length];

        if (openSlot) {
          const ck = `${sec.id}|${openSlot.id}`;
          newDrafts[ck] = {
            subjectId: sub.id,
            teacherId: assignedTeacher.id,
          };
          autoAssignedCount++;
        }
      });
    });

    setCellEditorDrafts(newDrafts);
    setSchedule((prev) => (prev ? { ...prev, status: "unsaved" } : prev));
    showNotice(`Auto-distributed ${autoAssignedCount} subject loads across sections!`, "success");
  };

  // ACTION 4: Export to CSV for DepEd Form 7 / SF7 Audit
  const handleExportCSV = () => {
    try {
      const headers = ["Subject Code", "Subject Title", "Grade Level", "Curriculum Scope / Exclusivity", "Required Sections", "Distributed Sections", "Distribution %", "Assigned Faculty", "Unassigned Sections"];
      const rows = checklistData.map((item) => {
        const assignedFacultyNames = item.sectionDetails
          .filter((d) => d.isAssigned && d.teacher)
          .map((d) => `${d.section.name}: ${d.teacher.name}`)
          .join("; ");

        const unassignedSectionNames = item.sectionDetails
          .filter((d) => !d.isAssigned)
          .map((d) => d.section.name)
          .join("; ");

        return [
          `"${item.subjectCode}"`,
          `"${item.subjectName}"`,
          `"${item.gradeLabel}"`,
          `"${item.exclusivityLabel || "Universal (All Sections)"}"`,
          item.totalRequired,
          item.assignedCount,
          `"${item.percentage}%"`,
          `"${assignedFacultyNames || "None"}"`,
          `"${unassignedSectionNames || "None (Fully Staffed)"}"`,
        ];
      });

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `DNHS_Subject_Distribution_Checklist_${scheduleType.toUpperCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotice("Exported Subject Distribution Checklist (CSV) successfully!", "success");
    } catch (e) {
      showNotice("Failed to export checklist: " + e.message, "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header Summary Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1f2c6f 0%, #3B4197 55%, #2563eb 100%)",
          borderRadius: 12,
          padding: "16px 18px",
          color: "#ffffff",
          boxShadow: "0 4px 14px rgba(31, 44, 111, 0.16)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#93c5fd" }}>
                Curriculum Subject Distribution
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: overallPercentage === 100 ? "rgba(255, 255, 255, 0.22)" : "#f59e0b",
                  border: overallPercentage === 100 ? "1px solid rgba(255, 255, 255, 0.45)" : "none",
                  color: "#ffffff",
                }}
              >
                {overallPercentage === 100 ? "✓ 100% DISTRIBUTED TO ALL SECTIONS" : `${incompleteSubjectsCount} SUBJECTS NEED DISTRIBUTION`}
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#ffffff" }}>
              {totalAllocationsAssigned} / {totalAllocationsRequired} Subjects Distributed Across All Sections ({overallPercentage}%)
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#bfdbfe" }}>
              Verifies that each curriculum subject has been completely distributed and staffed across all active sections.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.18)", padding: "3px 10px", borderRadius: 999 }}>
              {checklistData.length} Subjects Tracked
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#93c5fd" }}>
              {activeGradeLevels.map((g) => `G${g}`).join(", ")} Active
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.18)", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleSyncHGPToAdvisers}
            style={{
              padding: "7px 13px",
              borderRadius: 6,
              border: "none",
              background: "#ffffff",
              color: "#3B4197",
              fontSize: 11.5,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
            title="Auto-assigns each section's Homeroom Guidance (HGP) to its designated Class Adviser"
          >
            <span>⚡ Sync HGP to Advisers</span>
          </button>

          <button
            type="button"
            onClick={handleAutoDistributeRemaining}
            style={{
              padding: "7px 13px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.12)",
              color: "#ffffff",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
            title="Auto-distribute unassigned subjects across sections based on teacher specialization"
          >
            <span>✨ Auto-Distribute Unassigned</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              padding: "7px 13px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.12)",
              color: "#ffffff",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              marginLeft: "auto",
            }}
            title="Export full Subject Distribution Checklist for DepEd Form 7 audit"
          >
            <span>📄 Export CSV (SF7)</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search subject code, name, or exclusivity..."
          style={{
            flex: 1,
            minWidth: 160,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 12,
            outline: "none",
          }}
        />

        {/* Status Filter Pills */}
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 3, borderRadius: 8 }}>
          {[
            { id: "all", label: "All" },
            { id: "incomplete", label: `Needs Attention (${incompleteSubjectsCount})` },
            { id: "complete", label: "Complete" },
          ].map((tab) => {
            const active = filterMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: active ? "#3B4197" : "transparent",
                  color: active ? "#ffffff" : "#64748b",
                  fontWeight: active ? 800 : 600,
                  fontSize: 11,
                  cursor: "pointer",
                  boxShadow: active ? "0 2px 4px rgba(59, 65, 151, 0.25)" : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Grade Filter */}
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 11.5,
            fontWeight: 700,
            color: "#334155",
            background: "#ffffff",
          }}
        >
          <option value="all">All Grades</option>
          {activeGradeLevels.map((g) => (
            <option key={g} value={g}>Grade {g}</option>
          ))}
        </select>
      </div>

      {/* Checklist Items Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", background: "#f8fafc", borderRadius: 10, border: "1px dashed #cbd5e1", color: "#64748b", fontSize: 12.5 }}>
            No subjects match the selected filters.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedSubjectKeys.has(item.key);
            const isComplete = item.assignedCount >= item.totalRequired;
            const isZero = item.assignedCount === 0;

            let badgeBg = "#eef2ff";
            let badgeColor = "#3B4197";
            let borderColor = "#c7d2fe";

            if (isZero) {
              badgeBg = "#fee2e2";
              badgeColor = "#991b1b";
              borderColor = "#fca5a5";
            } else if (!isComplete) {
              badgeBg = "#fef3c7";
              badgeColor = "#92400e";
              borderColor = "#fde68a";
            }

            return (
              <div
                key={item.key}
                style={{
                  background: "#ffffff",
                  border: "1px solid",
                  borderColor: isExpanded ? "#3B4197" : "#e2e8f0",
                  borderRadius: 10,
                  overflow: "hidden",
                  boxShadow: isExpanded ? "0 4px 12px rgba(59, 65, 151, 0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {/* Subject Item Header Row */}
                <div
                  onClick={() => toggleExpand(item.key)}
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    background: isExpanded ? "#f8fafc" : "#ffffff",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: isComplete ? "#eef2ff" : isZero ? "#fee2e2" : "#fef3c7",
                        color: isComplete ? "#3B4197" : isZero ? "#991b1b" : "#92400e",
                        border: isComplete ? "1px solid #c7d2fe" : isZero ? "1px solid #fca5a5" : "1px solid #fde68a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {isComplete ? "✓" : item.assignedCount}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: "#1f2c6f" }}>
                          {item.subjectCode}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: item.isUniversal ? "#fef3c7" : "#f1f5f9",
                            color: item.isUniversal ? "#92400e" : "#475569",
                          }}
                        >
                          {item.gradeLabel}
                        </span>
                        {item.exclusivityLabel && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "#e0e7ff",
                              color: "#3730a3",
                              border: "1px solid #c7d2fe",
                            }}
                          >
                            {item.exclusivityLabel}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.subjectName}
                      </div>
                    </div>
                  </div>

                  {/* Ratio & Status Badges */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 900,
                          padding: "2px 10px",
                          borderRadius: 6,
                          background: badgeBg,
                          color: badgeColor,
                          border: `1px solid ${borderColor}`,
                          display: "inline-block",
                        }}
                      >
                        {item.assignedCount} / {item.totalRequired}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginTop: 1 }}>
                        {item.percentage}% distributed
                      </div>
                    </div>

                    <span style={{ color: "#94a3b8", fontSize: 14, fontWeight: 700 }}>
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Progress mini-bar */}
                <div style={{ height: 3, background: "#f1f5f9", width: "100%" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${item.percentage}%`,
                      background: isComplete ? "#3B4197" : isZero ? "#ef4444" : "#f59e0b",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                {/* Expanded Section Details Panel */}
                {isExpanded && (
                  <div style={{ padding: 14, background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 8, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                      <span>
                        Sections Breakdown for <strong>{item.subjectCode}</strong> ({item.gradeLabel})
                        {item.exclusivityLabel && ` • ${item.exclusivityLabel}`}:
                      </span>
                      <span>Distributed to {item.assignedCount} of {item.totalRequired} sections</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {item.sectionDetails.map((detail, dIdx) => {
                        const sec = detail.section;
                        const isAssigned = detail.isAssigned;
                        const teacher = detail.teacher;

                        return (
                          <div
                            key={dIdx}
                            style={{
                              padding: "10px 14px",
                              background: "#ffffff",
                              borderRadius: 8,
                              border: "1px solid #e2e8f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: 10,
                              fontSize: 12,
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
                                <span>{sec.name}</span>
                                {sec.classification && (
                                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "#f1f5f9", color: "#475569" }}>
                                    {sec.classification}
                                  </span>
                                )}
                              </div>

                              {/* Class Adviser Info & Interactive Selector */}
                              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 11, color: "#64748b" }}>Class Adviser:</span>
                                {detail.adviserName ? (
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#1f2c6f", background: "#f0f4ff", padding: "1px 7px", borderRadius: 4, border: "1px solid #dbeafe" }}>
                                      👤 {detail.adviserName}
                                    </span>
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        if (e.target.value) handleAssignSectionAdviser(sec, e.target.value);
                                      }}
                                      style={{
                                        fontSize: 9.5,
                                        padding: "1px 4px",
                                        borderRadius: 4,
                                        border: "1px solid #cbd5e1",
                                        background: "#ffffff",
                                        color: "#475569",
                                        cursor: "pointer",
                                      }}
                                      title="Change Class Adviser for this section"
                                    >
                                      <option value="" disabled>Change...</option>
                                      {activeTeachers.map((t) => (
                                        <option key={t.id} value={t.name}>{t.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                ) : (
                                  <select
                                    defaultValue=""
                                    onChange={(e) => {
                                      if (e.target.value) handleAssignSectionAdviser(sec, e.target.value);
                                    }}
                                    style={{
                                      fontSize: 10.5,
                                      padding: "2px 6px",
                                      borderRadius: 4,
                                      border: "1px solid #3B4197",
                                      background: "#eef2ff",
                                      color: "#3B4197",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <option value="" disabled>Assign Class Adviser...</option>
                                    {activeTeachers.map((t) => (
                                      <option key={t.id} value={t.name}>{t.name} ({t.major || t.designation || "Faculty"})</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>

                            {/* Assigned Teacher or Quick Assign Dropdown */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {isAssigned && teacher ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#3B4197" }}>
                                    ✓ {teacher.name}
                                  </span>
                                  {teacher.major && (
                                    <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#eef2ff", color: "#3B4197", border: "1px solid #c7d2fe" }}>
                                      {teacher.major}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>
                                    ⚠️ Unassigned
                                  </span>
                                  <select
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleQuickAssignTeacher(sec, item.subjectObj, e.target.value);
                                      }
                                    }}
                                    defaultValue=""
                                    style={{
                                      padding: "4px 8px",
                                      borderRadius: 6,
                                      border: "1px solid #cbd5e1",
                                      fontSize: 11,
                                      fontWeight: 600,
                                      background: "#ffffff",
                                      color: "#1e293b",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <option value="" disabled>Select Teacher to Assign...</option>
                                    {activeTeachers.map((t) => (
                                      <option key={t.id} value={t.id}>
                                        {t.name} ({t.major || t.designation || "Faculty"})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
