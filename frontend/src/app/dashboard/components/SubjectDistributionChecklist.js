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
 * Resolves required weekly periods for a subject, defaulting HGP and unset counts cleanly.
 */
function getRequiredPeriodsPerWeek(sub) {
  const code = String(sub?.subjectCode || "").trim().toUpperCase();
  const name = String(sub?.subjectName || "").trim().toLowerCase();
  const rawClasses = sub?.classesPerWeek;
  const hasExplicit = rawClasses !== undefined && rawClasses !== null && String(rawClasses).trim() !== "";

  if (hasExplicit) {
    const parsed = Number(rawClasses);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.max(1, Math.min(12, Math.round(parsed)));
    }
  }

  if (code === "HGP" || name.includes("homeroom")) {
    return 1;
  }

  return 1;
}

/**
 * Extracts all assigned teacher references (primary, SPA breakouts, co-teachers) from a schedule cell.
 */
function extractAssignedTeachersFromCell(asgn, facultyById = new Map()) {
  if (!asgn || typeof asgn !== "object") {
    return { primaryTeacher: null, teacherLabels: [], hasAnyTeacher: false };
  }

  let primaryTeacher = null;
  const teacherLabels = [];
  const seenLabels = new Set();

  const resolveTeacherObj = (id, fallbackName) => {
    const cleanId = String(id || "").trim();
    if (!cleanId) return null;
    const found = facultyById?.get ? facultyById.get(cleanId) : null;
    return found || { id: cleanId, name: String(fallbackName || "").trim() || "Assigned Teacher" };
  };

  if (Array.isArray(asgn.breakoutAssignments) && asgn.breakoutAssignments.length > 0) {
    asgn.breakoutAssignments.forEach((b) => {
      if (!b || !b.teacherId) return;
      const tObj = resolveTeacherObj(b.teacherId, b.teacherName);
      if (!tObj) return;
      if (!primaryTeacher) primaryTeacher = tObj;
      const stream = String(b.specialization || b.stream || b.label || "").trim();
      const label = stream ? `${stream}: ${tObj.name}` : tObj.name;
      if (!seenLabels.has(label)) {
        seenLabels.add(label);
        teacherLabels.push(label);
      }
    });
  }

  if (asgn.teacherId) {
    const tObj = resolveTeacherObj(asgn.teacherId, asgn.teacherName);
    if (tObj) {
      if (!primaryTeacher) primaryTeacher = tObj;
      if (!seenLabels.has(tObj.name) && !(Array.isArray(asgn.breakoutAssignments) && asgn.breakoutAssignments.length > 0)) {
        seenLabels.add(tObj.name);
        teacherLabels.push(tObj.name);
      }
    }
  }

  if (Array.isArray(asgn.coTeacherIds) && asgn.coTeacherIds.length > 0) {
    asgn.coTeacherIds.forEach((coId) => {
      const tObj = resolveTeacherObj(coId, "");
      if (!tObj) return;
      if (!primaryTeacher) primaryTeacher = tObj;
      if (!seenLabels.has(tObj.name)) {
        seenLabels.add(tObj.name);
        teacherLabels.push(tObj.name);
      }
    });
  }

  return {
    primaryTeacher,
    teacherLabels,
    hasAnyTeacher: Boolean(primaryTeacher) || teacherLabels.length > 0,
  };
}

function formatSlotShortLabel(slot) {
  if (!slot) return "";
  const day = String(slot.day || "").trim();
  const period = slot.period ?? slot.periodNumber;
  if (day && period !== undefined && period !== null && String(period).trim() !== "") {
    return `${day.slice(0, 3)} P${period}`;
  }
  return String(slot.label || slot.id || "").trim();
}

function formatSlotOrdinalDisplay(slot, fallbackSlotId = "") {
  const day = String(slot?.day || "").trim();
  const rawPeriod = slot?.period ?? slot?.periodNumber;
  let periodNum = Number.parseInt(String(rawPeriod ?? ""), 10);
  if (!Number.isFinite(periodNum) || periodNum <= 0) {
    const match = String(slot?.label || slot?.id || fallbackSlotId || "").match(/P(\d+)|(\d+)/i);
    if (match) periodNum = Number.parseInt(match[1] || match[2], 10);
  }
  if (!Number.isFinite(periodNum) || periodNum <= 0) {
    return String(slot?.label || fallbackSlotId || "this period").trim();
  }
  const mod100 = periodNum % 100;
  const mod10 = periodNum % 10;
  const suffix = mod100 >= 11 && mod100 <= 13 ? "th" : mod10 === 1 ? "st" : mod10 === 2 ? "nd" : mod10 === 3 ? "rd" : "th";
  const periodLabel = `${periodNum}${suffix} Period`;
  return day ? `${day} ${periodLabel}` : periodLabel;
}

function normalizePeriodToken(labelOrNum) {
  const str = String(labelOrNum || "").trim();
  if (!str) return "";
  const match = str.match(/\d+/);
  return match ? String(Number.parseInt(match[0], 10)) : str.toLowerCase();
}

function getTeacherRestrictedSlotLabels(teacher, slotIds = [], slotsById = new Map(), config = {}) {
  if (!teacher || !Array.isArray(slotIds) || slotIds.length === 0) return [];
  const rawTokens = [];
  if (Array.isArray(teacher.unavailablePeriods)) {
    rawTokens.push(...teacher.unavailablePeriods);
  }
  const cfgRestrictions = config?.constraints?.teacherRestrictions;
  if (Array.isArray(cfgRestrictions)) {
    const found = cfgRestrictions.find((r) => String(r?.teacherId || "").trim() === String(teacher.id || "").trim());
    if (found && Array.isArray(found.periodLabels)) {
      rawTokens.push(...found.periodLabels);
    }
  }
  const restrictedNums = new Set(rawTokens.map(normalizePeriodToken).filter(Boolean));
  if (restrictedNums.size === 0) return [];

  const matchedLabels = [];
  const seen = new Set();
  slotIds.forEach((slotId) => {
    const slotObj = slotsById?.get ? slotsById.get(slotId) : null;
    const periodNum = normalizePeriodToken(slotObj?.period ?? slotObj?.periodNumber ?? slotObj?.label ?? slotId);
    if (periodNum && restrictedNums.has(periodNum)) {
      const display = formatSlotOrdinalDisplay(slotObj, slotId);
      if (display && !seen.has(display)) {
        seen.add(display);
        matchedLabels.push(display);
      }
    }
  });
  return matchedLabels;
}

function isHgpSubject(sub) {
  if (!sub) return false;
  const code = String(sub.subjectCode || "").trim().toUpperCase();
  const name = String(sub.subjectName || "").trim().toLowerCase();
  return code === "HGP" || name.includes("homeroom");
}

function getScheduledHgpTeacherName(sec, assignments = {}, subjectsById = new Map(), facultyById = new Map()) {
  if (!sec || !assignments || typeof assignments !== "object") return "";
  for (const [cellKey, asgn] of Object.entries(assignments)) {
    if (!cellKey.startsWith(`${sec.id}|`)) continue;
    if (!asgn || !asgn.teacherId) continue;
    const subObj = subjectsById?.get ? subjectsById.get(asgn.subjectId) : null;
    const isHgp =
      isHgpSubject(subObj) ||
      String(asgn.subjectCode || "").trim().toUpperCase() === "HGP" ||
      String(asgn.subjectId || "") === "universal-hgp";
    if (!isHgp) continue;
    const facultyObj = facultyById?.get ? facultyById.get(asgn.teacherId) : null;
    const name = String(facultyObj?.name || asgn.teacherName || "").trim();
    if (name) return name;
  }
  return "";
}

function getPlacementRulesFromConfig(config = {}, scheduleType = "jhs") {
  const levelKey = scheduleType === "jhs" ? "jhs" : "shs";
  const fromConfig = [
    ...(Array.isArray(config?.[levelKey]?.constraints?.subjectPlacementRules) ? config[levelKey].constraints.subjectPlacementRules : []),
    ...(Array.isArray(config?.jhs?.constraints?.subjectPlacementRules) ? config.jhs.constraints.subjectPlacementRules : []),
    ...(Array.isArray(config?.shs?.constraints?.subjectPlacementRules) ? config.shs.constraints.subjectPlacementRules : []),
    ...(Array.isArray(config?.constraints?.subjectPlacementRules) ? config.constraints.subjectPlacementRules : []),
  ];

  let fromStorage = [];
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("turotugma_schedule_config_v3");
      if (raw) {
        const parsed = JSON.parse(raw);
        fromStorage = [
          ...(Array.isArray(parsed?.[levelKey]?.constraints?.subjectPlacementRules) ? parsed[levelKey].constraints.subjectPlacementRules : []),
          ...(Array.isArray(parsed?.jhs?.constraints?.subjectPlacementRules) ? parsed.jhs.constraints.subjectPlacementRules : []),
          ...(Array.isArray(parsed?.shs?.constraints?.subjectPlacementRules) ? parsed.shs.constraints.subjectPlacementRules : []),
          ...(Array.isArray(parsed?.constraints?.subjectPlacementRules) ? parsed.constraints.subjectPlacementRules : []),
        ];
      }
    }
  } catch (_) {}

  const seen = new Set();
  const combined = [];
  [...fromConfig, ...fromStorage].forEach((rule) => {
    if (!rule) return;
    const key = `${rule.subjectId || ""}::${rule.subjectCode || ""}::${rule.subjectName || ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(rule);
    }
  });
  return combined;
}

function matchPlacementRuleForChecklistSubject(sub, rules = []) {
  if (!sub || !Array.isArray(rules) || rules.length === 0) return null;
  const subId = String(sub.id || "").trim().toLowerCase();
  const subCode = String(sub.subjectCode || "").trim().toLowerCase();
  const subName = String(sub.subjectName || "").trim().toLowerCase();

  return (
    rules.find((r) => {
      if (!r) return false;
      const rId = String(r.subjectId || "").trim().toLowerCase();
      if (subId && rId && subId === rId) return true;
      const rCode = String(r.subjectCode || "").trim().toLowerCase();
      if (subCode && rCode && subCode === rCode) return true;
      const rName = String(r.subjectName || "").trim().toLowerCase();
      if (subName && rName && subName === rName) return true;
      if (isHgpSubject(sub) && (rCode === "hgp" || rName.includes("homeroom"))) return true;
      return false;
    }) || null
  );
}

function getExactLockedSlotsForChecklistSubject(sub, sectionSlots = [], config = {}, scheduleType = "jhs") {
  if (!sub || !Array.isArray(sectionSlots) || sectionSlots.length === 0) return [];
  const rules = getPlacementRulesFromConfig(config, scheduleType);
  const matchedRule = matchPlacementRuleForChecklistSubject(sub, rules);
  const effectiveSubj = matchedRule ? { ...sub, ...matchedRule } : sub;

  const prefDay = String(effectiveSubj.preferredDay || "").trim();
  if (!prefDay || prefDay.toLowerCase() === "any") return [];

  const targetPeriods = new Set();
  const prefSlot = String(effectiveSubj.preferredPeriodSlot || "").trim();
  if (prefSlot && prefSlot.toLowerCase() !== "any") {
    if (prefSlot === "first" || prefSlot === "1") {
      targetPeriods.add(1);
    } else if (!prefSlot.includes("-") && !Number.isNaN(Number(prefSlot))) {
      targetPeriods.add(Number(prefSlot));
    }
  }
  if (Array.isArray(effectiveSubj.specificPeriods) && effectiveSubj.specificPeriods.length > 0) {
    effectiveSubj.specificPeriods.forEach((p) => {
      const n = Number(p);
      if (Number.isFinite(n) && n > 0) targetPeriods.add(n);
    });
  }
  if (targetPeriods.size === 0) return [];

  return sectionSlots.filter((sl) => {
    if (!sl || String(sl.day || "").trim() !== prefDay) return false;
    const pNum = Number(sl.period ?? sl.periodNumber ?? 0);
    return targetPeriods.has(pNum);
  });
}

function getReservedSlotIdsForSection(sec, sectionSubjects = [], sectionSlots = [], config = {}, scheduleType = "jhs", excludeSub = null) {
  const reserved = new Set();
  (sectionSubjects || []).forEach((candidateSub) => {
    if (!candidateSub) return;
    if (
      excludeSub &&
      (candidateSub.id === excludeSub.id || (isHgpSubject(candidateSub) && isHgpSubject(excludeSub)))
    ) {
      return;
    }
    const locked = getExactLockedSlotsForChecklistSubject(candidateSub, sectionSlots, config, scheduleType);
    locked.forEach((sl) => {
      if (sl?.id) reserved.add(sl.id);
    });
  });
  return reserved;
}

function isSubjectAssignmentMatch(asgn, targetSub, subjectsById = new Map()) {
  if (!asgn || !asgn.subjectId || !targetSub) return false;
  if (asgn.subjectId === targetSub.id) return true;
  if (isHgpSubject(targetSub) && (String(asgn.subjectId) === "universal-hgp" || String(asgn.subjectCode || "").trim().toUpperCase() === "HGP")) {
    return true;
  }
  const subObj = subjectsById?.get ? subjectsById.get(asgn.subjectId) : null;
  if (!subObj) return false;
  if (subObj.subjectCode && targetSub.subjectCode && subObj.subjectCode.toLowerCase() === targetSub.subjectCode.toLowerCase()) {
    return true;
  }
  if (subObj.subjectName && targetSub.subjectName && subObj.subjectName.toLowerCase() === targetSub.subjectName.toLowerCase()) {
    return true;
  }
  return false;
}

function partitionTeachersForSubject(sub, activeTeachers = []) {
  const list = Array.isArray(activeTeachers) ? activeTeachers : [];
  if (!sub || isHgpSubject(sub)) {
    return { recommended: [], others: list };
  }
  const subTitle = `${sub.subjectName || ""} ${sub.subjectCode || ""}`.toLowerCase();
  const recommended = [];
  const others = [];

  list.forEach((t) => {
    const major = String(t?.major || "").toLowerCase();
    const spec = String(t?.specialization || "").toLowerCase();
    const combined = `${major} ${spec}`;
    const isMatch =
      (subTitle.includes("math") && combined.includes("math")) ||
      ((subTitle.includes("eng") || subTitle.includes("devread") || subTitle.includes("reading") || subTitle.includes("journalism")) && combined.includes("eng")) ||
      ((subTitle.includes("sci") || subTitle.includes("envsci") || subTitle.includes("biotech") || subTitle.includes("research")) && (combined.includes("sci") || combined.includes("bio") || combined.includes("chem") || combined.includes("phys"))) ||
      (subTitle.includes("fil") && combined.includes("fil")) ||
      ((subTitle.includes("araling") || /\bap\b/.test(subTitle)) && (combined.includes("aral") || combined.includes("social") || combined.includes("history"))) ||
      ((subTitle.includes("values") || subTitle.includes("esp")) && (combined.includes("values") || combined.includes("guidance") || combined.includes("esp"))) ||
      ((subTitle.includes("mapeh") || subTitle.includes("spa")) && (combined.includes("mapeh") || combined.includes("pe") || combined.includes("music") || combined.includes("arts") || combined.includes("spa"))) ||
      ((subTitle.includes("tle") || subTitle.includes("ict")) && (combined.includes("tle") || combined.includes("ict") || combined.includes("industrial") || combined.includes("agri") || combined.includes("home")));

    if (isMatch) recommended.push(t);
    else others.push(t);
  });

  return { recommended, others };
}

function computeCompletionPercent(assigned, required) {
  if (!required || required <= 0) return 100;
  if (assigned >= required) return 100;
  return Math.min(99, Math.round((assigned / required) * 100));
}

/**
 * Computes overall subject distribution metrics across all active sections
 * for checking 100% completion before publishing and powering live inspector badges.
 */
export function computeSubjectDistributionMetrics({
  sections = [],
  subjects = [],
  scheduleType = "jhs",
  assignments = {},
  subjectsById = new Map(),
  slots = [],
  facultyById = new Map(),
  conflictMessagesByCell = new Map(),
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

  const evaluateSubjectSectionStatus = (sec, targetSub) => {
    let slotCount = 0;
    let hasTeacher = false;
    let hasConflict = false;
    Object.entries(assignments || {}).forEach(([cellKey, asgn]) => {
      if (!cellKey.startsWith(`${sec.id}|`)) return;
      if (!isSubjectAssignmentMatch(asgn, targetSub, subjectsById)) return;
      const teacherInfo = extractAssignedTeachersFromCell(asgn, facultyById);
      if (teacherInfo.hasAnyTeacher) {
        hasTeacher = true;
        slotCount += 1;
      }
      const cellConflicts = conflictMessagesByCell?.get ? (conflictMessagesByCell.get(cellKey) || []) : [];
      if (cellConflicts.length > 0) {
        hasConflict = true;
      }
    });
    const requiredPeriods = getRequiredPeriodsPerWeek(targetSub);
    return hasTeacher && slotCount >= requiredPeriods && !hasConflict;
  };

  let totalRequired = 0;
  let totalAssigned = 0;
  let incompleteCount = 0;

  // Universal HGP across all active sections (matching checklistData)
  const allApplicableSections = sections.filter((s) => activeGradeLevels.includes(Number(s.grade)));
  if (allApplicableSections.length > 0) {
    const hgpSub = relevantSubjects.find(
      (s) =>
        (s.subjectCode && s.subjectCode.toUpperCase() === "HGP") ||
        (s.subjectName && s.subjectName.toLowerCase().includes("homeroom"))
    ) || {
      id: "universal-hgp",
      subjectCode: "HGP",
      subjectName: "Homeroom Guidance Program (HGP)",
      gradeLevel: "Universal",
      classesPerWeek: 1,
    };

    const hgpComplete = allApplicableSections.filter((sec) => evaluateSubjectSectionStatus(sec, hgpSub)).length;
    totalRequired += allApplicableSections.length;
    totalAssigned += hgpComplete;
    if (hgpComplete < allApplicableSections.length) {
      incompleteCount += 1;
    }
  }

  activeGradeLevels.forEach((gradeNum) => {
    const gradeSections = sectionsByGrade[gradeNum] || [];
    if (gradeSections.length === 0) return;

    const gradeSubjects = relevantSubjects.filter((sub) => {
      if (
        (sub.subjectCode && sub.subjectCode.toUpperCase() === "HGP") ||
        (sub.subjectName && sub.subjectName.toLowerCase().includes("homeroom"))
      ) {
        return false;
      }
      if (sub.gradeLevel === "Universal" || sub.gradeLevel === "7-10" || sub.gradeLevel === "Grades 7–10") return true;
      if (String(sub.gradeLevel).includes(String(gradeNum))) return true;
      return true;
    });

    const seen = new Set();
    gradeSubjects.forEach((sub) => {
      const dedupeKey = sub.id || `${String(sub.subjectCode || "").toUpperCase()}|${String(sub.subjectName || "").toUpperCase()}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      const applicableSections = gradeSections.filter((sec) =>
        isSubjectRequiredForSection(sub, sec, scheduleType, assignments)
      );
      if (applicableSections.length === 0) return;

      const subReq = applicableSections.length;
      const subAssigned = applicableSections.filter((sec) => evaluateSubjectSectionStatus(sec, sub)).length;

      totalRequired += subReq;
      totalAssigned += subAssigned;
      if (subAssigned < subReq) {
        incompleteCount += 1;
      }
    });
  });

  const percentage = computeCompletionPercent(totalAssigned, totalRequired);
  const isComplete = totalRequired === 0 || (totalAssigned >= totalRequired && incompleteCount === 0);

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
 * 1. Live scheduled HGP / Homeroom teacher (source of truth when schedule is loaded)
 * 2. Live first day 1st Period (Monday 1st Period) teacher fallback when HGP is unassigned
 * 3. User overrides (customAdvisers state / localStorage)
 * 4. Section object properties (sec.adviser, sec.classAdviser)
 * 5. Active teachers advisory class configuration (t.advisoryClass, t.advisorySection)
 */
export function resolveSectionAdviser(sec, activeTeachers = [], customAdvisers = {}, scheduleCtx = null) {
  if (!sec) return "";

  // 1. Live HGP / Homeroom teacher in the schedule is the authoritative Class Adviser
  if (scheduleCtx?.assignments) {
    const scheduledHgpAdviser = getScheduledHgpTeacherName(
      sec,
      scheduleCtx.assignments,
      scheduleCtx.subjectsById,
      scheduleCtx.facultyById
    );
    if (scheduledHgpAdviser) {
      return scheduledHgpAdviser;
    }

    // 2. Fallback: First day 1st Period (Monday 1st Period) teacher when HGP is unassigned
    const monP1Key = `${sec.id}|Monday-P1`;
    let fallbackAsgn = scheduleCtx.assignments[monP1Key];
    if (!fallbackAsgn?.teacherId) {
      fallbackAsgn = null;
      const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const periodOneCandidates = [];
      for (const [cellKey, asgn] of Object.entries(scheduleCtx.assignments)) {
        if (!cellKey.startsWith(`${sec.id}|`) || !asgn?.teacherId) continue;
        const slotId = cellKey.slice(sec.id.length + 1);
        const slotObj = scheduleCtx.slotsById?.get ? scheduleCtx.slotsById.get(slotId) : null;
        const day = String(slotObj?.day || "").trim().toLowerCase();
        const periodNum = Number(slotObj?.period ?? slotObj?.periodNumber ?? 0);
        if (slotId === "Monday-P1" || (day === "monday" && periodNum === 1)) {
          fallbackAsgn = asgn;
          break;
        }
        if (periodNum === 1) {
          const dayIdx = dayOrder.indexOf(day);
          periodOneCandidates.push({ asgn, dayRank: dayIdx >= 0 ? dayIdx : 99 });
        }
      }
      if (!fallbackAsgn && periodOneCandidates.length > 0) {
        periodOneCandidates.sort((a, b) => a.dayRank - b.dayRank);
        fallbackAsgn = periodOneCandidates[0].asgn;
      }
    }
    if (fallbackAsgn?.teacherId) {
      const tObj = scheduleCtx.facultyById?.get
        ? scheduleCtx.facultyById.get(fallbackAsgn.teacherId)
        : activeTeachers.find((t) => t.id === fallbackAsgn.teacherId);
      const fallbackName = String(tObj?.name || fallbackAsgn.teacherName || "").trim();
      if (fallbackName) return fallbackName;
    }
  }

  // 3. Check custom overrides from local state or localStorage
  if (customAdvisers && (customAdvisers[sec.id] || customAdvisers[sec.name])) {
    return customAdvisers[sec.id] || customAdvisers[sec.name];
  }

  // 4. Check sec.adviser or sec.classAdviser directly on section object
  const secAdv = String(sec.adviser || sec.classAdviser || "").trim();
  if (secAdv && secAdv !== "—" && secAdv !== "None" && secAdv !== "No Adviser Set" && secAdv !== "undefined") {
    return secAdv;
  }

  const secNameLower = String(sec.name || "").trim().toLowerCase();

  // 5. Match from active teachers: check if any teacher has this section as their advisoryClass
  const matchedTeacher = activeTeachers.find((t) => {
    const adv = String(t.advisoryClass || t.advisorySection || "").trim().toLowerCase();
    if (!adv || adv === "none") return false;
    return adv === secNameLower || adv.includes(secNameLower) || secNameLower.includes(adv);
  });
  if (matchedTeacher) {
    return matchedTeacher.name;
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
  sectionsById = new Map(),
  conflictMessagesByCell = new Map(),
  schedule = null,
  setSchedule = () => {},
  cellEditorDrafts = {},
  setCellEditorDrafts = () => {},
  showNotice = () => {},
  slots = [],
  config = {},
  isTeacherEligibleForSubject = null,
  onAutoDistribute = null,
  isAutoDistributing = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // "all" | "incomplete" | "complete"
  const [gradeFilter, setGradeFilter] = useState("all"); // "all" | "7" | "8" | "9" | "10" | "11" | "12"
  const [expandedSubjectKeys, setExpandedSubjectKeys] = useState(new Set());
  const [pendingTeacherConflict, setPendingTeacherConflict] = useState(null);

  const sortedActiveTeachers = useMemo(
    () =>
      [...(activeTeachers || [])].sort((left, right) =>
        String(left?.name || "").localeCompare(String(right?.name || ""))
      ),
    [activeTeachers]
  );

  // Custom advisers state with localStorage persistence
  const [customAdvisers, setCustomAdvisers] = useState(() => {
    try {
      const stored = localStorage.getItem("turotugma_section_advisers");
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return {};
  });

  // Persist section Class Adviser into local state & section metadata (kept synced with HGP)
  const persistSectionAdviserRecord = (sec, teacherName) => {
    if (!sec || !teacherName) return;

    setCustomAdvisers((prev) => {
      const next = { ...prev, [sec.id]: teacherName, [sec.name]: teacherName };
      try {
        localStorage.setItem("turotugma_section_advisers", JSON.stringify(next));
      } catch (_) {}
      return next;
    });

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
  };

  const clearSectionAdviserRecordIfMatches = (sec, teacherName) => {
    if (!sec) return;
    setCustomAdvisers((prev) => {
      const next = { ...prev };
      let changed = false;
      if (!teacherName || next[sec.id] === teacherName) {
        delete next[sec.id];
        changed = true;
      }
      if (!teacherName || next[sec.name] === teacherName) {
        delete next[sec.name];
        changed = true;
      }
      if (changed) {
        try {
          localStorage.setItem("turotugma_section_advisers", JSON.stringify(next));
        } catch (_) {}
      }
      return changed ? next : prev;
    });

    try {
      const raw = localStorage.getItem("turotugma_sections_created");
      if (raw) {
        const parsed = JSON.parse(raw);
        const level = sec.grade >= 11 ? "shs" : "jhs";
        const gradeObj = parsed?.[level]?.[sec.grade];
        if (gradeObj && Array.isArray(gradeObj.sections)) {
          const target = gradeObj.sections.find((s) => s.id === sec.id || s.name === sec.name);
          if (target && (!teacherName || target.adviser === teacherName || target.classAdviser === teacherName)) {
            target.adviser = "";
            target.classAdviser = "";
            localStorage.setItem("turotugma_sections_created", JSON.stringify(parsed));
          }
        }
      }
    } catch (_) {}
  };

  // Determine current active grades based on scheduleType
  const activeGradeLevels = useMemo(() => {
    if (scheduleType === "jhs") return [7, 8, 9, 10];
    return [11, 12];
  }, [scheduleType]);

  // Combine schedule.assignments with live cellEditorDrafts (preserving co-teachers and breakout streams)
  const effectiveAssignments = useMemo(() => {
    const base = { ...(schedule?.assignments || {}) };
    Object.entries(cellEditorDrafts || {}).forEach(([cellKey, draft]) => {
      if (!draft || (!draft.subjectId && !draft.teacherId)) {
        delete base[cellKey];
      } else if (draft.subjectId && draft.teacherId) {
        const prevCell = base[cellKey] || {};
        base[cellKey] = {
          ...prevCell,
          subjectId: draft.subjectId,
          teacherId: draft.teacherId,
          coTeacherIds: draft.coTeacherIds !== undefined ? draft.coTeacherIds : prevCell.coTeacherIds,
          breakoutAssignments: draft.breakoutAssignments !== undefined ? draft.breakoutAssignments : prevCell.breakoutAssignments,
          breakoutNote: draft.breakoutNote !== undefined ? draft.breakoutNote : prevCell.breakoutNote,
          source: "draft",
          updatedAt: new Date().toISOString(),
        };
      }
    });
    return base;
  }, [schedule?.assignments, cellEditorDrafts]);

  const slotsById = useMemo(() => {
    const map = new Map();
    (slots || []).forEach((sl) => {
      if (sl && sl.id) map.set(sl.id, sl);
    });
    return map;
  }, [slots]);

  const resolvedSectionsById = useMemo(() => {
    const map = new Map();
    if (sectionsById?.forEach) {
      sectionsById.forEach((sec, id) => map.set(id, sec));
    }
    (sections || []).forEach((sec) => {
      if (sec && sec.id && !map.has(sec.id)) map.set(sec.id, sec);
    });
    return map;
  }, [sectionsById, sections]);

  // Index live teacher slot usage & HGP adviser mappings for smart availability + 1-click swaps
  const teacherScheduleIndex = useMemo(() => {
    const byTeacherSlot = new Map();
    const hgpAdviserByTeacher = new Map();

    const recordTeacherSlot = (teacherId, slotId, entry) => {
      if (!teacherId || !slotId) return;
      let tMap = byTeacherSlot.get(teacherId);
      if (!tMap) {
        tMap = new Map();
        byTeacherSlot.set(teacherId, tMap);
      }
      const list = tMap.get(slotId) || [];
      list.push(entry);
      tMap.set(slotId, list);
    };

    Object.entries(effectiveAssignments || {}).forEach(([cellKey, asgn]) => {
      if (!asgn) return;
      const pipeIdx = cellKey.indexOf("|");
      if (pipeIdx <= 0) return;
      const sectionId = cellKey.slice(0, pipeIdx);
      const slotId = cellKey.slice(pipeIdx + 1);
      const secObj = resolvedSectionsById.get(sectionId);
      const sectionName = secObj?.name || sectionId;
      const subjObj = subjectsById?.get ? subjectsById.get(asgn.subjectId) : null;
      const isHgp =
        isHgpSubject(subjObj) ||
        String(asgn.subjectCode || "").trim().toUpperCase() === "HGP" ||
        String(asgn.subjectId || "") === "universal-hgp";
      const subjectName = subjObj?.subjectCode || subjObj?.subjectName || (isHgp ? "HGP" : "Class");

      const tIds = new Set();
      if (asgn.teacherId) tIds.add(asgn.teacherId);
      if (Array.isArray(asgn.coTeacherIds)) asgn.coTeacherIds.forEach((id) => id && tIds.add(id));
      if (Array.isArray(asgn.breakoutAssignments)) asgn.breakoutAssignments.forEach((b) => b?.teacherId && tIds.add(b.teacherId));

      tIds.forEach((tId) => {
        recordTeacherSlot(tId, slotId, {
          cellKey,
          sectionId,
          sectionName,
          subjectId: asgn.subjectId,
          subjectName,
          isHgp,
        });
      });

      if (isHgp && asgn.teacherId) {
        const list = hgpAdviserByTeacher.get(asgn.teacherId) || [];
        if (!list.some((x) => x.sectionId === sectionId)) {
          list.push({ sectionId, sectionName, cellKey, slotId });
        }
        hgpAdviserByTeacher.set(asgn.teacherId, list);
      }
    });

    return { byTeacherSlot, hgpAdviserByTeacher };
  }, [effectiveAssignments, resolvedSectionsById, subjectsById]);

  // Compute coverage data per subject & grade with exclusivity, weekly period, and conflict tracking
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

    const buildSectionDetail = (sec, targetSub) => {
      let primaryTeacher = null;
      const teacherDisplayList = [];
      const seenTeacherLabels = new Set();
      const scheduledSlots = [];
      const seenSlots = new Set();
      const slotIds = [];
      const seenSlotIds = new Set();
      const sectionConflicts = [];
      const seenConflicts = new Set();
      let slotCount = 0;

      Object.entries(effectiveAssignments).forEach(([cellKey, asgn]) => {
        if (!cellKey.startsWith(`${sec.id}|`)) return;
        if (!isSubjectAssignmentMatch(asgn, targetSub, subjectsById)) return;

        const cellConflicts = conflictMessagesByCell?.get ? (conflictMessagesByCell.get(cellKey) || []) : [];
        cellConflicts.forEach((msg) => {
          if (msg && !seenConflicts.has(msg)) {
            seenConflicts.add(msg);
            sectionConflicts.push(msg);
          }
        });

        const teacherInfo = extractAssignedTeachersFromCell(asgn, facultyById);
        if (!teacherInfo.hasAnyTeacher) return;

        slotCount += 1;
        if (!primaryTeacher && teacherInfo.primaryTeacher) {
          primaryTeacher = teacherInfo.primaryTeacher;
        }
        teacherInfo.teacherLabels.forEach((lbl) => {
          if (!seenTeacherLabels.has(lbl)) {
            seenTeacherLabels.add(lbl);
            teacherDisplayList.push(lbl);
          }
        });

        const parts = cellKey.split("|");
        const slotId = parts.slice(1).join("|");
        if (slotId && !seenSlotIds.has(slotId)) {
          seenSlotIds.add(slotId);
          slotIds.push(slotId);
        }
        const slotObj = slotsById.get(slotId);
        const slotLabel = formatSlotShortLabel(slotObj) || slotId;
        if (slotLabel && !seenSlots.has(slotLabel)) {
          seenSlots.add(slotLabel);
          scheduledSlots.push(slotLabel);
        }
      });

      const requiredPeriods = getRequiredPeriodsPerWeek(targetSub);
      const isAssigned = Boolean(primaryTeacher) || teacherDisplayList.length > 0;
      const hasConflict = sectionConflicts.length > 0;
      const isComplete = isAssigned && slotCount >= requiredPeriods && !hasConflict;
      const isPartial = isAssigned && slotCount < requiredPeriods;
      const adviserName = resolveSectionAdviser(sec, activeTeachers, customAdvisers, {
        assignments: effectiveAssignments,
        subjectsById,
        facultyById,
        slotsById,
      });

      return {
        section: sec,
        isAssigned,
        isComplete,
        isPartial,
        hasConflict,
        conflicts: sectionConflicts,
        teacher: primaryTeacher,
        teacherDisplayList,
        slotCount,
        requiredPeriods,
        slotIds,
        scheduledSlots,
        adviserName,
      };
    };

    // 3. Generate Checklist Items
    const items = [];

    // Special: HGP (Homeroom Guidance Program) — Universal across all active sections
    const hgpSub = relevantSubjects.find(
      (s) => (s.subjectCode && s.subjectCode.toUpperCase() === "HGP") || (s.subjectName && s.subjectName.toLowerCase().includes("homeroom"))
    ) || {
      id: "universal-hgp",
      subjectCode: "HGP",
      subjectName: "Homeroom Guidance Program (HGP)",
      gradeLevel: "Universal",
      classesPerWeek: 1,
    };

    const allApplicableSections = sections.filter((s) => activeGradeLevels.includes(Number(s.grade)));
    const hgpSectionDetails = allApplicableSections.map((sec) => buildSectionDetail(sec, hgpSub));
    const hgpCompleteCount = hgpSectionDetails.filter((d) => d.isComplete).length;
    const hgpStaffedCount = hgpSectionDetails.filter((d) => d.isAssigned).length;
    const hgpConflictCount = hgpSectionDetails.filter((d) => d.hasConflict).length;

    items.push({
      key: "hgp-universal",
      subjectCode: "HGP",
      subjectName: "Homeroom Guidance Program (HGP)",
      grade: "All",
      gradeLabel: "All Grades",
      totalRequired: allApplicableSections.length,
      assignedCount: hgpCompleteCount,
      staffedCount: hgpStaffedCount,
      conflictSectionCount: hgpConflictCount,
      requiredPeriods: getRequiredPeriodsPerWeek(hgpSub),
      percentage: computeCompletionPercent(hgpCompleteCount, allApplicableSections.length),
      sectionDetails: hgpSectionDetails,
      subjectObj: hgpSub,
      isUniversal: true,
      exclusivityLabel: null,
    });

    // Generate items for each grade level
    activeGradeLevels.forEach((gradeNum) => {
      const gradeSections = sectionsByGrade[gradeNum] || [];
      if (gradeSections.length === 0) return;

      const gradeSubjects = relevantSubjects.filter((sub) => {
        if ((sub.subjectCode && sub.subjectCode.toUpperCase() === "HGP") || (sub.subjectName && sub.subjectName.toLowerCase().includes("homeroom"))) {
          return false; // Handled in universal HGP
        }
        if (sub.gradeLevel === "Universal" || sub.gradeLevel === "7-10" || sub.gradeLevel === "Grades 7–10") return true;
        if (String(sub.gradeLevel).includes(String(gradeNum))) return true;
        return true;
      });

      const seen = new Set();
      gradeSubjects.forEach((sub) => {
        const dedupeKey = sub.id || `${String(sub.subjectCode || "").toUpperCase()}|${String(sub.subjectName || "").toUpperCase()}`;
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);

        const applicableSections = gradeSections.filter((sec) =>
          isSubjectRequiredForSection(sub, sec, scheduleType, effectiveAssignments)
        );
        if (applicableSections.length === 0) return;

        const exclusivityLabel = getExclusivityLabel(sub, applicableSections.length, gradeSections.length);
        const sectionDetails = applicableSections.map((sec) => buildSectionDetail(sec, sub));

        const assignedCount = sectionDetails.filter((d) => d.isComplete).length;
        const staffedCount = sectionDetails.filter((d) => d.isAssigned).length;
        const conflictSectionCount = sectionDetails.filter((d) => d.hasConflict).length;
        const totalRequired = applicableSections.length;
        const percentage = computeCompletionPercent(assignedCount, totalRequired);

        items.push({
          key: `${sub.id || sub.subjectCode}-${gradeNum}`,
          subjectCode: sub.subjectCode || sub.subjectName,
          subjectName: sub.subjectName || sub.subjectCode,
          grade: gradeNum,
          gradeLabel: `Grade ${gradeNum}`,
          totalRequired,
          assignedCount,
          staffedCount,
          conflictSectionCount,
          requiredPeriods: getRequiredPeriodsPerWeek(sub),
          percentage,
          sectionDetails,
          subjectObj: sub,
          isUniversal: !exclusivityLabel,
          exclusivityLabel,
        });
      });
    });

    return items;
  }, [sections, subjects, scheduleType, activeGradeLevels, effectiveAssignments, facultyById, subjectsById, slotsById, activeTeachers, customAdvisers, conflictMessagesByCell]);

  // Scope items by search + grade first so status counts & HGP slice reflect active grade filter cleanly
  const itemNeedsAttention = (it) => (it.conflictSectionCount || 0) > 0 || it.assignedCount < it.totalRequired;

  const gradeAndSearchScopedItems = useMemo(() => {
    return checklistData
      .map((item) => {
        if (gradeFilter !== "all" && item.grade === "All") {
          const scopedDetails = (item.sectionDetails || []).filter(
            (d) => String(d.section?.grade) === String(gradeFilter)
          );
          if (scopedDetails.length === 0) return null;
          const assignedCount = scopedDetails.filter((d) => d.isComplete).length;
          const staffedCount = scopedDetails.filter((d) => d.isAssigned).length;
          const conflictSectionCount = scopedDetails.filter((d) => d.hasConflict).length;
          const totalRequired = scopedDetails.length;
          return {
            ...item,
            gradeLabel: `Grade ${gradeFilter}`,
            sectionDetails: scopedDetails,
            totalRequired,
            assignedCount,
            staffedCount,
            conflictSectionCount,
            percentage: computeCompletionPercent(assignedCount, totalRequired),
          };
        }
        return item;
      })
      .filter(Boolean)
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = item.subjectCode?.toLowerCase().includes(q);
          const matchName = item.subjectName?.toLowerCase().includes(q);
          const matchGrade = String(item.grade).toLowerCase().includes(q);
          const matchExclusivity = item.exclusivityLabel?.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchGrade && !matchExclusivity) return false;
        }

        if (gradeFilter !== "all") {
          if (item.grade !== "All" && String(item.grade) !== String(gradeFilter)) return false;
        }

        return true;
      });
  }, [checklistData, searchQuery, gradeFilter]);

  // Filter items based on status pill ("all" | "incomplete" | "complete")
  const filteredItems = useMemo(() => {
    return gradeAndSearchScopedItems.filter((item) => {
      if (filterMode === "incomplete") return itemNeedsAttention(item);
      if (filterMode === "complete") return !itemNeedsAttention(item);
      return true;
    });
  }, [gradeAndSearchScopedItems, filterMode]);

  const filterAllCount = gradeAndSearchScopedItems.length;
  const filterNeedsAttentionCount = useMemo(
    () => gradeAndSearchScopedItems.filter(itemNeedsAttention).length,
    [gradeAndSearchScopedItems]
  );
  const filterCompleteCount = useMemo(
    () => gradeAndSearchScopedItems.filter((it) => !itemNeedsAttention(it)).length,
    [gradeAndSearchScopedItems]
  );

  // High level metrics (across full schedule)
  const totalAllocationsRequired = useMemo(() => checklistData.reduce((acc, it) => acc + it.totalRequired, 0), [checklistData]);
  const totalAllocationsAssigned = useMemo(() => checklistData.reduce((acc, it) => acc + it.assignedCount, 0), [checklistData]);
  const overallPercentage = computeCompletionPercent(totalAllocationsAssigned, totalAllocationsRequired);
  const incompleteSubjectsCount = checklistData.filter(itemNeedsAttention).length;

  const toggleExpand = (key) => {
    setExpandedSubjectKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Placement-lock-aware slot selector for newly assigned checklist subjects
  const placeUnscheduledSubjectInBestSlot = ({ sec, sub, targetTeacher, nextAssignments, nextDrafts, nowIso }) => {
    const sectionSlots = slots.filter((sl) => sl && !sl.isBreak);
    if (sectionSlots.length === 0) return { targetSlot: null, extraNote: "" };

    const sectionSubjects = subjects.filter((s) => isSubjectRequiredForSection(s, sec, scheduleType, effectiveAssignments));
    if (!sectionSubjects.some(isHgpSubject)) {
      sectionSubjects.push({
        id: "universal-hgp",
        subjectCode: "HGP",
        subjectName: "Homeroom Guidance Program (HGP)",
      });
    }

    const lockedSlots = getExactLockedSlotsForChecklistSubject(sub, sectionSlots, config, scheduleType);
    const reservedByOtherIds = getReservedSlotIdsForSection(sec, sectionSubjects, sectionSlots, config, scheduleType, sub);
    const lockedSlotIdSet = new Set(lockedSlots.map((sl) => sl.id));

    const isCellFreeForSec = (sl) =>
      Boolean(sl?.id) && !nextAssignments[`${sec.id}|${sl.id}`] && !effectiveAssignments[`${sec.id}|${sl.id}`];

    const canRelocateOccupant = (occAsgn, occSubj, destSlot) => {
      if (!occAsgn || !destSlot || !isCellFreeForSec(destSlot)) return false;
      if (reservedByOtherIds.has(destSlot.id) || lockedSlotIdSet.has(destSlot.id)) return false;
      if (occSubj) {
        const occLocked = getExactLockedSlotsForChecklistSubject(occSubj, sectionSlots, config, scheduleType);
        if (occLocked.length > 0 && !occLocked.some((ls) => ls.id === destSlot.id)) return false;
        if (!occSubj.isDoublePeriod) {
          const alreadyOnDay = Object.entries(nextAssignments).some(([ck, a]) => {
            if (!ck.startsWith(`${sec.id}|`) || a?.subjectId !== occSubj.id) return false;
            const sObj = slotsById.get(ck.slice(sec.id.length + 1));
            return sObj?.day === destSlot.day;
          });
          if (alreadyOnDay) return false;
        }
      }

      const occTeacherIds = Array.from(
        new Set(
          [
            occAsgn.teacherId,
            ...(Array.isArray(occAsgn.coTeacherIds) ? occAsgn.coTeacherIds : []),
            ...(Array.isArray(occAsgn.breakoutAssignments) ? occAsgn.breakoutAssignments.map((b) => b?.teacherId) : []),
          ].filter(Boolean)
        )
      );
      return occTeacherIds.every((tId) => {
        const busyEntries = teacherScheduleIndex.byTeacherSlot.get(tId)?.get(destSlot.id) || [];
        if (busyEntries.some((entry) => entry.sectionId !== sec.id)) return false;
        const tObj = facultyById.get(tId);
        if (tObj && getTeacherRestrictedSlotLabels(tObj, [destSlot.id], slotsById, config).length > 0) return false;
        return true;
      });
    };

    if (lockedSlots.length > 0) {
      const emptyLocked = lockedSlots.find(isCellFreeForSec);
      if (emptyLocked) {
        const ck = `${sec.id}|${emptyLocked.id}`;
        nextAssignments[ck] = { subjectId: sub.id, teacherId: targetTeacher.id, source: "manual", updatedAt: nowIso };
        nextDrafts[ck] = { subjectId: sub.id, teacherId: targetTeacher.id };
        return { targetSlot: emptyLocked, extraNote: "" };
      }

      const primaryLocked = lockedSlots[0];
      const lockedKey = `${sec.id}|${primaryLocked.id}`;
      const occAsgn = nextAssignments[lockedKey] || effectiveAssignments[lockedKey];
      const occSubj = occAsgn?.subjectId ? subjectsById.get(occAsgn.subjectId) : null;
      const occLabel = occSubj?.subjectCode || occSubj?.subjectName || "another subject";
      const relocSlot = sectionSlots.find((s) => canRelocateOccupant(occAsgn, occSubj, s));

      if (relocSlot && occAsgn) {
        const relocKey = `${sec.id}|${relocSlot.id}`;
        nextAssignments[relocKey] = {
          ...occAsgn,
          source: occAsgn.source || "manual",
          updatedAt: nowIso,
        };
        nextDrafts[relocKey] = {
          subjectId: occAsgn.subjectId,
          teacherId: occAsgn.teacherId,
          coTeacherIds: occAsgn.coTeacherIds,
          breakoutAssignments: occAsgn.breakoutAssignments,
          breakoutNote: occAsgn.breakoutNote,
        };
        nextAssignments[lockedKey] = { subjectId: sub.id, teacherId: targetTeacher.id, source: "manual", updatedAt: nowIso };
        nextDrafts[lockedKey] = { subjectId: sub.id, teacherId: targetTeacher.id };
        return {
          targetSlot: primaryLocked,
          extraNote: `Moved ${occLabel} to ${formatSlotOrdinalDisplay(relocSlot, relocSlot.id)} to free ${formatSlotOrdinalDisplay(primaryLocked, primaryLocked.id)}.`,
        };
      }

      const fallbackSlot =
        sectionSlots.find((s) => isCellFreeForSec(s) && !reservedByOtherIds.has(s.id)) ||
        sectionSlots.find(isCellFreeForSec) ||
        sectionSlots[0];
      const fallbackKey = `${sec.id}|${fallbackSlot.id}`;
      nextAssignments[fallbackKey] = { subjectId: sub.id, teacherId: targetTeacher.id, source: "manual", updatedAt: nowIso };
      nextDrafts[fallbackKey] = { subjectId: sub.id, teacherId: targetTeacher.id };
      return {
        targetSlot: fallbackSlot,
        extraNote: `${formatSlotOrdinalDisplay(primaryLocked, primaryLocked.id)} is currently occupied by ${occLabel}; resolve in Conflicts to swap or relocate ${occLabel}.`,
      };
    }

    const targetSlot =
      sectionSlots.find((sl) => isCellFreeForSec(sl) && !reservedByOtherIds.has(sl.id)) ||
      sectionSlots.find(isCellFreeForSec) ||
      sectionSlots[0];
    const ck = `${sec.id}|${targetSlot.id}`;
    nextAssignments[ck] = { subjectId: sub.id, teacherId: targetTeacher.id, source: "manual", updatedAt: nowIso };
    nextDrafts[ck] = { subjectId: sub.id, teacherId: targetTeacher.id };
    return { targetSlot, extraNote: "" };
  };

  // Apply direct single-section assignment without clearing other sections
  const applyDirectTeacherAssignment = (sec, sub, targetTeacher, extraWarning = "") => {
    if (!sec || !sub || !targetTeacher) return;
    const nowIso = new Date().toISOString();
    const matchingCellKeys = [];
    Object.entries(effectiveAssignments).forEach(([cellKey, asgn]) => {
      if (!cellKey.startsWith(`${sec.id}|`)) return;
      if (isSubjectAssignmentMatch(asgn, sub, subjectsById)) {
        matchingCellKeys.push(cellKey);
      }
    });

    const nextAssignments = { ...(schedule?.assignments || {}) };
    const nextDrafts = { ...cellEditorDrafts };
    let updatedCount = 0;
    let placementNote = "";

    if (matchingCellKeys.length > 0) {
      matchingCellKeys.forEach((ck) => {
        const prevCell = effectiveAssignments[ck] || nextAssignments[ck] || {};
        const resolvedSubjId = prevCell.subjectId || sub.id;
        nextAssignments[ck] = {
          ...prevCell,
          subjectId: resolvedSubjId,
          teacherId: targetTeacher.id,
          source: "manual",
          updatedAt: nowIso,
        };
        nextDrafts[ck] = {
          ...(nextDrafts[ck] || {}),
          subjectId: resolvedSubjId,
          teacherId: targetTeacher.id,
        };
        updatedCount += 1;
      });
    } else {
      const placed = placeUnscheduledSubjectInBestSlot({ sec, sub, targetTeacher, nextAssignments, nextDrafts, nowIso });
      if (placed.targetSlot) {
        updatedCount = 1;
      }
      placementNote = placed.extraNote || "";
    }

    setCellEditorDrafts(nextDrafts);
    setSchedule((prev) =>
      prev
        ? {
            ...prev,
            assignments: nextAssignments,
            updatedAt: nowIso,
            status: "unsaved",
          }
        : prev
    );

    const combinedNotes = [extraWarning, placementNote].filter(Boolean).join(" ");
    if (isHgpSubject(sub)) {
      persistSectionAdviserRecord(sec, targetTeacher.name);
      showNotice(
        combinedNotes
          ? `Assigned ${targetTeacher.name} to ${sec.name} HGP. ${combinedNotes}`
          : `Assigned ${targetTeacher.name} as HGP Teacher & Class Adviser for ${sec.name}.`,
        combinedNotes ? "info" : "success"
      );
    } else {
      showNotice(
        combinedNotes
          ? `Assigned ${targetTeacher.name} to ${sub.subjectCode || sub.subjectName} for ${sec.name}. ${combinedNotes}`
          : `Assigned ${targetTeacher.name} to ${sub.subjectCode || sub.subjectName} for ${sec.name} (${updatedCount} slot${updatedCount === 1 ? "" : "s"}).`,
        combinedNotes ? "info" : "success"
      );
    }
  };

  // Handle dropdown selection: check clashes & show choice card if teacher is already assigned at this period
  const handleSelectTeacherFromDropdown = (itemKey, sec, sub, teacherId, detail, isHgpRow) => {
    if (!sec || !sub || !teacherId) return;
    const targetTeacher = facultyById.get(teacherId);
    if (!targetTeacher) return;

    let slotList = Array.isArray(detail?.slotIds) ? detail.slotIds : [];
    if (slotList.length === 0) {
      const sectionSlots = slots.filter((sl) => sl && !sl.isBreak);
      const lockedSlots = getExactLockedSlotsForChecklistSubject(sub, sectionSlots, config, scheduleType);
      const plannedSlot =
        lockedSlots[0] ||
        sectionSlots.find((sl) => !effectiveAssignments[`${sec.id}|${sl.id}`]) ||
        sectionSlots[0];
      if (plannedSlot?.id) {
        slotList = [plannedSlot.id];
      }
    }
    const clashes = [];
    slotList.forEach((slotId) => {
      const entries = teacherScheduleIndex.byTeacherSlot.get(targetTeacher.id)?.get(slotId) || [];
      entries.forEach((entry) => {
        if (entry.sectionId !== sec.id) {
          clashes.push({
            ...entry,
            slotId,
            slotOrdinal: formatSlotOrdinalDisplay(slotsById.get(slotId), slotId),
          });
        }
      });
    });

    const restrictedSlotLabels = getTeacherRestrictedSlotLabels(targetTeacher, slotList, slotsById, config);

    if (clashes.length > 0) {
      setPendingTeacherConflict({
        rowKey: `${itemKey}::${sec.id}`,
        section: sec,
        subject: sub,
        isHgpRow,
        targetTeacher,
        currentTeacher: detail?.teacher || null,
        detailSlotIds: slotList,
        clashes,
        restrictedSlotLabels,
      });
      return;
    }

    setPendingTeacherConflict(null);
    const warningText =
      restrictedSlotLabels.length > 0
        ? `Warning: ${targetTeacher.name} is restricted at ${restrictedSlotLabels.join(", ")}.`
        : "";
    applyDirectTeacherAssignment(sec, sub, targetTeacher, warningText);
  };

  const handleConfirmSwapAssignment = (pending) => {
    if (!pending || !pending.clashes || pending.clashes.length === 0) return;
    const { section: sec, subject: sub, targetTeacher, currentTeacher, clashes } = pending;
    const otherSecId = clashes[0].sectionId;
    const otherSec = resolvedSectionsById.get(otherSecId);
    if (!otherSec || !targetTeacher) return;

    const nowIso = new Date().toISOString();
    const myKeys = [];
    const otherKeys = [];
    const allSameSubjInClash = clashes.every((c) =>
      isSubjectAssignmentMatch({ subjectId: c.subjectId, subjectCode: c.subjectName }, sub, subjectsById)
    );

    Object.entries(effectiveAssignments).forEach(([cellKey, asgn]) => {
      if (cellKey.startsWith(`${sec.id}|`) && isSubjectAssignmentMatch(asgn, sub, subjectsById)) {
        myKeys.push(cellKey);
      } else if (
        allSameSubjInClash &&
        cellKey.startsWith(`${otherSec.id}|`) &&
        isSubjectAssignmentMatch(asgn, sub, subjectsById)
      ) {
        otherKeys.push(cellKey);
      }
    });

    if (!allSameSubjInClash || otherKeys.length === 0) {
      clashes.forEach((c) => {
        if (c.sectionId === otherSecId && c.cellKey && !otherKeys.includes(c.cellKey)) {
          otherKeys.push(c.cellKey);
        }
      });
    }

    const nextAssignments = { ...(schedule?.assignments || {}) };
    const nextDrafts = { ...cellEditorDrafts };

    if (myKeys.length > 0) {
      myKeys.forEach((ck) => {
        const prevCell = effectiveAssignments[ck] || nextAssignments[ck] || {};
        const resolvedSubjId = prevCell.subjectId || sub.id;
        nextAssignments[ck] = {
          ...prevCell,
          subjectId: resolvedSubjId,
          teacherId: targetTeacher.id,
          source: "manual",
          updatedAt: nowIso,
        };
        nextDrafts[ck] = {
          ...(nextDrafts[ck] || {}),
          subjectId: resolvedSubjId,
          teacherId: targetTeacher.id,
        };
      });
    } else {
      placeUnscheduledSubjectInBestSlot({ sec, sub, targetTeacher, nextAssignments, nextDrafts, nowIso });
    }

    if (currentTeacher) {
      otherKeys.forEach((ck) => {
        const prevCell = effectiveAssignments[ck] || nextAssignments[ck] || {};
        const resolvedSubjId = prevCell.subjectId || sub.id;
        nextAssignments[ck] = {
          ...prevCell,
          subjectId: resolvedSubjId,
          teacherId: currentTeacher.id,
          source: "manual",
          updatedAt: nowIso,
        };
        nextDrafts[ck] = {
          ...(nextDrafts[ck] || {}),
          subjectId: resolvedSubjId,
          teacherId: currentTeacher.id,
        };
      });
    }

    setCellEditorDrafts(nextDrafts);
    setSchedule((prev) =>
      prev
        ? {
            ...prev,
            assignments: nextAssignments,
            updatedAt: nowIso,
            status: "unsaved",
          }
        : prev
    );

    if (isHgpSubject(sub)) {
      persistSectionAdviserRecord(sec, targetTeacher.name);
      if (currentTeacher) persistSectionAdviserRecord(otherSec, currentTeacher.name);
    }

    setPendingTeacherConflict(null);
    showNotice(
      `Swapped assignment between ${sec.name} (${targetTeacher.name}) and ${otherSec.name} (${currentTeacher?.name || "Unassigned"}).`,
      "success"
    );
  };

  const handleConfirmAssignAndLeaveOtherEmpty = (pending) => {
    if (!pending) return;
    const { section: sec, subject: sub, targetTeacher, clashes } = pending;
    if (!sec || !sub || !targetTeacher) return;

    const nowIso = new Date().toISOString();
    const myKeys = [];
    Object.entries(effectiveAssignments).forEach(([cellKey, asgn]) => {
      if (cellKey.startsWith(`${sec.id}|`) && isSubjectAssignmentMatch(asgn, sub, subjectsById)) {
        myKeys.push(cellKey);
      }
    });

    const nextAssignments = { ...(schedule?.assignments || {}) };
    const nextDrafts = { ...cellEditorDrafts };

    // Remove targetTeacher from clashing slot(s) in the other section(s), leaving those cells empty
    const emptiedSectionNames = [];
    const seenClearedSections = new Set();
    clashes.forEach((c) => {
      if (c.cellKey) {
        delete nextAssignments[c.cellKey];
        nextDrafts[c.cellKey] = { subjectId: "", teacherId: "" };
      }
      if (!seenClearedSections.has(c.sectionId)) {
        seenClearedSections.add(c.sectionId);
        emptiedSectionNames.push(c.sectionName || c.sectionId);
        if (c.isHgp) {
          const otherSec = resolvedSectionsById.get(c.sectionId);
          if (otherSec) clearSectionAdviserRecordIfMatches(otherSec, targetTeacher.name);
        }
      }
    });

    if (myKeys.length > 0) {
      myKeys.forEach((ck) => {
        const prevCell = effectiveAssignments[ck] || nextAssignments[ck] || {};
        const resolvedSubjId = prevCell.subjectId || sub.id;
        nextAssignments[ck] = {
          ...prevCell,
          subjectId: resolvedSubjId,
          teacherId: targetTeacher.id,
          source: "manual",
          updatedAt: nowIso,
        };
        nextDrafts[ck] = {
          ...(nextDrafts[ck] || {}),
          subjectId: resolvedSubjId,
          teacherId: targetTeacher.id,
        };
      });
    } else {
      placeUnscheduledSubjectInBestSlot({ sec, sub, targetTeacher, nextAssignments, nextDrafts, nowIso });
    }

    setCellEditorDrafts(nextDrafts);
    setSchedule((prev) =>
      prev
        ? {
            ...prev,
            assignments: nextAssignments,
            updatedAt: nowIso,
            status: "unsaved",
          }
        : prev
    );

    if (isHgpSubject(sub)) {
      persistSectionAdviserRecord(sec, targetTeacher.name);
    }

    setPendingTeacherConflict(null);
    showNotice(
      `Assigned ${targetTeacher.name} to ${sec.name} and left ${emptiedSectionNames.join(", ")} empty.`,
      "success"
    );
  };

  // ACTION 2: Auto-Distribute Unassigned Loads via the real ScheduleGenerator solver engine
  const handleAutoDistributeRemaining = () => {
    if (isAutoDistributing) return;
    if (typeof onAutoDistribute === "function") {
      onAutoDistribute();
      return;
    }
    showNotice("Generator engine is unavailable in this view.", "error");
  };

  // ACTION 4: Export complete flat per-section CSV for DepEd Form 7 / SF7 Audit
  const handleExportCSV = () => {
    try {
      const escCsv = (val) => `"${String(val ?? "").replace(/\r?\n/g, " ").replace(/"/g, '""')}"`;
      const headers = [
        "Grade Level",
        "Section",
        "Classification",
        "Class Adviser",
        "Subject Code",
        "Subject Title",
        "Curriculum Scope",
        "Assigned Teacher(s)",
        "Periods Assigned",
        "Periods Required",
        "Scheduled Slots",
        "Status",
      ];

      const rows = [];
      checklistData.forEach((item) => {
        (item.sectionDetails || []).forEach((detail) => {
          const sec = detail.section || {};
          const teacherText =
            detail.teacherDisplayList && detail.teacherDisplayList.length > 0
              ? detail.teacherDisplayList.join("; ")
              : detail.teacher?.name || "Unassigned";
          const statusText = detail.hasConflict
            ? `Conflict: ${detail.conflicts.join(" | ")}`
            : detail.isComplete
            ? "Complete"
            : detail.isPartial
            ? `Partial (${detail.slotCount}/${detail.requiredPeriods} periods)`
            : "Unassigned";

          rows.push([
            escCsv(sec.grade ? `Grade ${sec.grade}` : item.gradeLabel),
            escCsv(sec.name || sec.code || sec.id || ""),
            escCsv(sec.classification || sec.track || "Regular"),
            escCsv(detail.adviserName || "Not Assigned"),
            escCsv(item.subjectCode || ""),
            escCsv(item.subjectName || ""),
            escCsv(item.exclusivityLabel || "Universal (All Sections)"),
            escCsv(teacherText),
            detail.slotCount ?? 0,
            detail.requiredPeriods ?? 1,
            escCsv(detail.scheduledSlots && detail.scheduledSlots.length > 0 ? detail.scheduledSlots.join("; ") : "None"),
            escCsv(statusText),
          ]);
        });
      });

      const csvContent = "\uFEFF" + [headers.map(escCsv).join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `DNHS_Subject_Distribution_Checklist_${scheduleType.toUpperCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotice(`Exported complete Subject Distribution Checklist (${rows.length} rows) to CSV.`, "success");
    } catch (e) {
      showNotice("Failed to export checklist: " + e.message, "error");
    }
  };

  const hasChecklistAttention = incompleteSubjectsCount > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Clean Header & Summary Bar matching other Side Panel Inspectors */}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, color: hasChecklistAttention ? "#991b1b" : "#166534", fontSize: 16, fontWeight: 700 }}>
              Subject Distribution Checklist ({overallPercentage}%)
            </h3>
            <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 12 }}>
              {totalAllocationsAssigned} of {totalAllocationsRequired} section-subject allocations complete ({checklistData.length} subjects across {activeGradeLevels.map((g) => `G${g}`).join(", ")}).
            </p>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 99,
              whiteSpace: "nowrap",
              background: hasChecklistAttention ? "#fee2e2" : "#dcfce7",
              border: hasChecklistAttention ? "1px solid #fca5a5" : "1px solid #86efac",
              color: hasChecklistAttention ? "#991b1b" : "#166534",
            }}
          >
            {hasChecklistAttention ? `${incompleteSubjectsCount} Need Attention` : "100% Complete"}
          </span>
        </div>

        {/* Overall Progress Bar */}
        <div style={{ height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${overallPercentage}%`,
              background: overallPercentage >= 100 && !hasChecklistAttention ? "#16a34a" : overallPercentage === 0 ? "#dc2626" : "#f59e0b",
              transition: "width 0.25s ease",
            }}
          />
        </div>

        {/* Clean Action Toolbar */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            padding: "8px 10px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
          }}
        >
          <button
            type="button"
            disabled={isAutoDistributing}
            onClick={handleAutoDistributeRemaining}
            style={{
              padding: "6px 12px",
              borderRadius: 7,
              border: "none",
              background: isAutoDistributing ? "#94a3b8" : "linear-gradient(135deg, #3B4197 0%, #2563eb 100%)",
              color: "#ffffff",
              boxShadow: isAutoDistributing ? "none" : "0 2px 6px rgba(59, 65, 151, 0.25)",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: isAutoDistributing ? "wait" : "pointer",
              opacity: isAutoDistributing ? 0.8 : 1,
            }}
            title="Generates the full schedule if empty, or auto-assigns all remaining unassigned periods while keeping existing manual assignments unchanged"
          >
            {isAutoDistributing ? "Distributing..." : "Auto-Distribute Unassigned"}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              padding: "6px 11px",
              borderRadius: 7,
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              color: "#1d4ed8",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              marginLeft: "auto",
            }}
            title="Export complete per-section Subject Distribution Checklist for DepEd Form 7 (SF7)"
          >
            Export CSV (SF7)
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPendingTeacherConflict(null);
          }}
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
            { id: "all", label: `All (${filterAllCount})` },
            { id: "incomplete", label: `Needs Attention (${filterNeedsAttentionCount})` },
            { id: "complete", label: `Complete (${filterCompleteCount})` },
          ].map((tab) => {
            const active = filterMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilterMode(tab.id);
                  setPendingTeacherConflict(null);
                }}
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
          onChange={(e) => {
            setGradeFilter(e.target.value);
            setPendingTeacherConflict(null);
          }}
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
            const hasAnyConflict = (item.conflictSectionCount || 0) > 0;
            const isComplete = !hasAnyConflict && item.assignedCount >= item.totalRequired;
            const isZero = item.assignedCount === 0;

            let badgeBg = "#eef2ff";
            let badgeColor = "#3B4197";
            let borderColor = "#c7d2fe";

            if (hasAnyConflict || isZero) {
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
                  borderColor: hasAnyConflict ? "#fca5a5" : isExpanded ? "#3B4197" : "#e2e8f0",
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
                        background: isComplete ? "#eef2ff" : (hasAnyConflict || isZero) ? "#fee2e2" : "#fef3c7",
                        color: isComplete ? "#3B4197" : (hasAnyConflict || isZero) ? "#991b1b" : "#92400e",
                        border: isComplete ? "1px solid #c7d2fe" : (hasAnyConflict || isZero) ? "1px solid #fca5a5" : "1px solid #fde68a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {isComplete ? "✓" : hasAnyConflict ? "!" : item.assignedCount}
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
                      {(() => {
                        const isHgpRow = item.key === "hgp-universal" || isHgpSubject(item.subjectObj);

                        const visibleSectionDetails = item.sectionDetails.filter((d) => {
                          if (filterMode === "incomplete") return !d.isComplete || d.hasConflict;
                          if (filterMode === "complete") return d.isComplete && !d.hasConflict;
                          return true;
                        });

                        const renderAlphabeticalTeacherOptions = (sec, sub, currentTeacher, detailSlotIds) => {
                          const slotList = Array.isArray(detailSlotIds) ? detailSlotIds : [];
                          const eligibleList = sortedActiveTeachers.filter(
                            (t) =>
                              (!currentTeacher || t.id !== currentTeacher.id) &&
                              (!isTeacherEligibleForSubject || isTeacherEligibleForSubject(t, sec, sub, config?.constraints))
                          );
                          if (eligibleList.length === 0) {
                            return (
                              <option value="" disabled>
                                No other eligible teachers
                              </option>
                            );
                          }
                          return eligibleList.map((t) => {
                            const hasClash = slotList.some((slotId) => {
                              const entries = teacherScheduleIndex.byTeacherSlot.get(t.id)?.get(slotId) || [];
                              return entries.some((e) => e.sectionId !== sec.id);
                            });
                            const restrictedLabels = getTeacherRestrictedSlotLabels(t, slotList, slotsById, config);
                            const tags = [];
                            if (hasClash) tags.push("Already Assigned");
                            if (restrictedLabels.length > 0) tags.push("Restricted");
                            const label = tags.length > 0 ? `${t.name} (${tags.join(", ")})` : t.name;
                            return (
                              <option key={t.id} value={t.id}>
                                {label}
                              </option>
                            );
                          });
                        };

                        return visibleSectionDetails.map((detail, dIdx) => {
                          const sec = detail.section;
                          const isAssigned = detail.isAssigned;
                          const teacher = detail.teacher;
                          const isMultiTeacherRow = detail.teacherDisplayList && detail.teacherDisplayList.length > 1;
                          const rowKey = `${item.key}::${sec.id}`;
                          const activePending = pendingTeacherConflict?.rowKey === rowKey ? pendingTeacherConflict : null;
                          const canSwapPending =
                            activePending &&
                            activePending.currentTeacher &&
                            new Set(activePending.clashes.map((c) => c.sectionId)).size === 1;

                          return (
                            <div
                              key={sec.id || dIdx}
                              style={{
                                padding: "10px 14px",
                                background: detail.hasConflict ? "#fff5f5" : "#ffffff",
                                borderRadius: 8,
                                border: detail.hasConflict ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                                fontSize: 12,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  flexWrap: "wrap",
                                  gap: 10,
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

                                  {!isHgpRow && (
                                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                                      Adviser:{" "}
                                      <strong style={{ color: detail.adviserName ? "#334155" : "#94a3b8", fontWeight: 600 }}>
                                        {detail.adviserName || "Not set (assign in HGP)"}
                                      </strong>
                                    </div>
                                  )}
                                </div>

                                {/* Assigned Teacher(s), Weekly Period Progress & Change/Assign Selector */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                  {detail.hasConflict && (
                                    <span
                                      style={{
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        padding: "2px 7px",
                                        borderRadius: 99,
                                        background: "#fee2e2",
                                        color: "#991b1b",
                                        border: "1px solid #fca5a5",
                                      }}
                                    >
                                      Conflict
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      fontSize: 10.5,
                                      fontWeight: 700,
                                      padding: "2px 7px",
                                      borderRadius: 99,
                                      background: detail.isComplete ? "#dcfce7" : detail.isPartial ? "#fef3c7" : "#fee2e2",
                                      color: detail.isComplete ? "#166534" : detail.isPartial ? "#92400e" : "#991b1b",
                                      border: detail.isComplete ? "1px solid #86efac" : detail.isPartial ? "1px solid #fde68a" : "1px solid #fca5a5",
                                    }}
                                  >
                                    {detail.slotCount}/{detail.requiredPeriods} {detail.requiredPeriods === 1 ? "period" : "periods"}
                                  </span>
                                  {isAssigned && (teacher || (detail.teacherDisplayList && detail.teacherDisplayList.length > 0)) ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                      <span style={{ fontSize: 11.5, fontWeight: 700, color: detail.hasConflict ? "#991b1b" : detail.isComplete ? "#3B4197" : "#92400e" }}>
                                        {detail.teacherDisplayList && detail.teacherDisplayList.length > 0
                                          ? detail.teacherDisplayList.join(", ")
                                          : teacher?.name}
                                      </span>
                                      {detail.isPartial && (
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                                          Incomplete periods
                                        </span>
                                      )}
                                      {teacher?.major && !isMultiTeacherRow && (
                                        <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#eef2ff", color: "#3B4197", border: "1px solid #c7d2fe" }}>
                                          {teacher.major}
                                        </span>
                                      )}
                                      {isMultiTeacherRow ? (
                                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#f1f5f9", color: "#475569", fontWeight: 600 }}>
                                          Edit streams in grid
                                        </span>
                                      ) : (
                                        <select
                                          value=""
                                          onChange={(e) => {
                                            if (e.target.value) {
                                              handleSelectTeacherFromDropdown(item.key, sec, item.subjectObj, e.target.value, detail, isHgpRow);
                                            }
                                          }}
                                          style={{
                                            fontSize: 10.5,
                                            padding: "2px 6px",
                                            borderRadius: 5,
                                            border: detail.hasConflict ? "1px solid #fca5a5" : "1px solid #cbd5e1",
                                            background: "#ffffff",
                                            color: "#334155",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                          }}
                                          title={isHgpRow ? "Change HGP Teacher & Class Adviser" : "Change assigned subject teacher"}
                                        >
                                          <option value="" disabled>Change...</option>
                                          {renderAlphabeticalTeacherOptions(sec, item.subjectObj, teacher, detail.slotIds)}
                                        </select>
                                      )}
                                    </div>
                                  ) : (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>
                                        Unassigned
                                      </span>
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            handleSelectTeacherFromDropdown(item.key, sec, item.subjectObj, e.target.value, detail, isHgpRow);
                                          }
                                        }}
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
                                        <option value="" disabled>
                                          {isHgpRow ? "Assign Adviser / HGP..." : "Assign Teacher..."}
                                        </option>
                                        {renderAlphabeticalTeacherOptions(sec, item.subjectObj, null, detail.slotIds)}
                                      </select>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {activePending && (
                                <div
                                  style={{
                                    padding: "9px 10px",
                                    borderRadius: 7,
                                    background: "#fffbeb",
                                    border: "1px solid #fcd34d",
                                    display: "grid",
                                    gap: 6,
                                  }}
                                >
                                  <div style={{ display: "grid", gap: 2 }}>
                                    {activePending.clashes.map((clash, cIdx) => (
                                      <div key={cIdx} style={{ fontSize: 11.5, color: "#92400e", fontWeight: 700 }}>
                                        {activePending.targetTeacher.name} is already assigned to {clash.sectionName} as {clash.subjectName} teacher for {clash.slotOrdinal}.
                                      </div>
                                    ))}
                                    {activePending.restrictedSlotLabels && activePending.restrictedSlotLabels.length > 0 && (
                                      <div style={{ fontSize: 11, color: "#b91c1c", fontWeight: 600 }}>
                                        Note: {activePending.targetTeacher.name} is also marked restricted for {activePending.restrictedSlotLabels.join(", ")}.
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                    {canSwapPending && (
                                      <button
                                        type="button"
                                        onClick={() => handleConfirmSwapAssignment(activePending)}
                                        style={{
                                          padding: "5px 10px",
                                          borderRadius: 6,
                                          border: "none",
                                          background: "#3B4197",
                                          color: "#ffffff",
                                          fontSize: 11,
                                          fontWeight: 700,
                                          cursor: "pointer",
                                        }}
                                      >
                                        Swap Assignment
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmAssignAndLeaveOtherEmpty(activePending)}
                                      style={{
                                        padding: "5px 10px",
                                        borderRadius: 6,
                                        border: "1px solid #d97706",
                                        background: "#ffffff",
                                        color: "#92400e",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Assign Here & Leave Other Empty
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPendingTeacherConflict(null)}
                                      style={{
                                        padding: "5px 10px",
                                        borderRadius: 6,
                                        border: "1px solid #cbd5e1",
                                        background: "#f8fafc",
                                        color: "#475569",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        marginLeft: "auto",
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}

                              {detail.hasConflict && detail.conflicts.length > 0 && (
                                <div style={{ display: "grid", gap: 2, paddingTop: 4, borderTop: "1px dashed #fecaca" }}>
                                  {detail.conflicts.map((msg, cIdx) => (
                                    <div key={cIdx} style={{ fontSize: 11, color: "#b91c1c", fontWeight: 600 }}>
                                      {msg}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
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
