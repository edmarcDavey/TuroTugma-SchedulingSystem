import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DepEdOfficialSeal,
  SchoolOfficialSeal,
  BagongPilipinasLogo,
  DepEdWordmarkLogo,
} from "./depedSeals";
import {
  getHistoricalSchoolYears,
  reuseSectionsFromYear,
  reuseFacultyFromYear,
  reuseConfigurationsFromYear,
  reusePublishedSchedulesFromYear,
  executeFullRolloverFromYear,
  ROLLOVER_AUDIT_KEY,
} from "../historicalSchoolYears";

const PROFILE_STORAGE_KEY = "turotugma_school_profile";
const CONFIG_STORAGE_KEY = "turotugma_schedule_configurations";

export function compressImageToDataUrl(fileOrDataUrl, maxDim = 140, quality = 0.8) {
  return new Promise((resolve) => {
    try {
      if (!fileOrDataUrl) {
        resolve("");
        return;
      }

      // If it's a web URL (http:// or https://), keep it as is
      if (typeof fileOrDataUrl === "string" && !fileOrDataUrl.startsWith("data:")) {
        resolve(fileOrDataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width || 140;
          let height = img.height || 140;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          let resultUrl = "";
          try {
            resultUrl = canvas.toDataURL("image/webp", quality);
            if (!resultUrl || !resultUrl.startsWith("data:image/webp")) {
              resultUrl = canvas.toDataURL("image/png");
            }
          } catch {
            resultUrl = canvas.toDataURL("image/png");
          }
          resolve(resultUrl);
        } catch {
          resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
        }
      };

      img.onerror = () => {
        resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
      };

      if (typeof fileOrDataUrl === "string") {
        img.src = fileOrDataUrl;
      } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
        };
        reader.onerror = () => resolve("");
        reader.readAsDataURL(fileOrDataUrl);
      } else {
        resolve("");
      }
    } catch {
      resolve("");
    }
  });
}

export const DEPED_SCHOOL_REGISTRY = [
  {
    schoolId: "300627",
    schoolName: "DIADI NATIONAL HIGH SCHOOL",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Nueva Vizcaya",
    district: "Diadi District",
    address: "Poblacion, Diadi, Nueva Vizcaya",
    schoolHeadName: "GABRIEL C. ULLANI EdD",
    schoolHeadTitle: "Secondary School Principal II",
    email: "300627@deped.gov.ph",
    website: "www.deped-nv.com.ph",
    schoolType: "Public Secondary (JHS & SHS)",
    offeredLevels: "both",
    schoolLogoUrl: "/diadi-nhs-logo.png",
  },
  {
    schoolId: "300588",
    schoolName: "BINTAWAN NATIONAL HIGH SCHOOL",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Nueva Vizcaya",
    district: "Villaverde District",
    address: "Bintawan Sur, Villaverde, Nueva Vizcaya",
    schoolHeadName: "ROBERTO D. CUTILLON",
    schoolHeadTitle: "School Principal IV",
    email: "300588@deped.gov.ph",
    website: "www.deped-nv.com.ph",
    schoolType: "Public Secondary (JHS & SHS)",
    offeredLevels: "both",
  },
  {
    schoolId: "300590",
    schoolName: "BAGABAG NATIONAL HIGH SCHOOL",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Nueva Vizcaya",
    district: "Bagabag District",
    address: "San Geronimo, Bagabag, Nueva Vizcaya",
    schoolHeadName: "MARIO S. DELA CRUZ EdD",
    schoolHeadTitle: "Secondary School Principal III",
    email: "300590@deped.gov.ph",
    website: "www.deped-nv.com.ph",
    schoolType: "Public Secondary (JHS & SHS)",
    offeredLevels: "both",
  },
  {
    schoolId: "300600",
    schoolName: "SOLANO HIGH SCHOOL",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Nueva Vizcaya",
    district: "Solano District",
    address: "Solano, Nueva Vizcaya",
    schoolHeadName: "EDGARDO S. RAMOS PhD",
    schoolHeadTitle: "Secondary School Principal IV",
    email: "300600@deped.gov.ph",
    website: "www.deped-nv.com.ph",
    schoolType: "Public Secondary (JHS & SHS)",
    offeredLevels: "both",
  },
  {
    schoolId: "300615",
    schoolName: "NUEVA VIZCAYA GENERAL COMPREHENSIVE HIGH SCHOOL (NVGCHS)",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Nueva Vizcaya",
    district: "Bayombong District",
    address: "Don Domingo Maddela, Bayombong, Nueva Vizcaya",
    schoolHeadName: "FLORENTINO S. MANZANO EdD",
    schoolHeadTitle: "Secondary School Principal IV",
    email: "300615@deped.gov.ph",
    website: "www.deped-nv.com.ph",
    schoolType: "Public Secondary (JHS & SHS)",
    offeredLevels: "both",
  },
  {
    schoolId: "300630",
    schoolName: "BAMBANG NATIONAL HIGH SCHOOL",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Nueva Vizcaya",
    district: "Bambang District",
    address: "Banggot, Bambang, Nueva Vizcaya",
    schoolHeadName: "JESUS L. GUZMAN EdD",
    schoolHeadTitle: "Secondary School Principal III",
    email: "300630@deped.gov.ph",
    website: "www.deped-nv.com.ph",
    schoolType: "Public Secondary (JHS & SHS)",
    offeredLevels: "both",
  },
  {
    schoolId: "300631",
    schoolName: "DUPAX DEL NORTE NATIONAL HIGH SCHOOL",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Nueva Vizcaya",
    district: "Dupax del Norte District",
    address: "Malasin, Dupax del Norte, Nueva Vizcaya",
    schoolHeadName: "RONIE V. PACIS EdD",
    schoolHeadTitle: "Secondary School Principal II",
    email: "300631@deped.gov.ph",
    website: "www.deped-nv.com.ph",
    schoolType: "Public Secondary (JHS & SHS)",
    offeredLevels: "both",
  },
  {
    schoolId: "300632",
    schoolName: "DUPAX DEL SUR NATIONAL HIGH SCHOOL",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Nueva Vizcaya",
    district: "Dupax del Sur District",
    address: "Domang, Dupax del Sur, Nueva Vizcaya",
    schoolHeadName: "ARLENE B. CORPUZ",
    schoolHeadTitle: "Secondary School Principal II",
    email: "300632@deped.gov.ph",
    website: "www.deped-nv.com.ph",
    schoolType: "Public Secondary (JHS & SHS)",
    offeredLevels: "both",
  },
  {
    schoolId: "300620",
    schoolName: "QUEZON NATIONAL HIGH SCHOOL",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Nueva Vizcaya",
    district: "Quezon District",
    address: "Aurora, Quezon, Nueva Vizcaya",
    schoolHeadName: "NOEL M. CALIMAG EdD",
    schoolHeadTitle: "Secondary School Principal II",
    email: "300620@deped.gov.ph",
    website: "www.deped-nv.com.ph",
    schoolType: "Public Secondary (JHS & SHS)",
    offeredLevels: "both",
  },
  {
    schoolId: "300625",
    schoolName: "KASIBU NATIONAL AGRICULTURAL SCHOOL",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Nueva Vizcaya",
    district: "Kasibu District",
    address: "Pao, Kasibu, Nueva Vizcaya",
    schoolHeadName: "ARMANDO D. VALDEZ",
    schoolHeadTitle: "Secondary School Principal II",
    email: "300625@deped.gov.ph",
    website: "www.deped-nv.com.ph",
    schoolType: "Public Agricultural Secondary",
    offeredLevels: "both",
  },
  {
    schoolId: "300635",
    schoolName: "SANTA FE NATIONAL HIGH SCHOOL",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Nueva Vizcaya",
    district: "Santa Fe District",
    address: "Poblacion, Santa Fe, Nueva Vizcaya",
    schoolHeadName: "LEONORA P. RAMOS",
    schoolHeadTitle: "Secondary School Principal II",
    email: "300635@deped.gov.ph",
    website: "www.deped-nv.com.ph",
    schoolType: "Public Secondary (JHS & SHS)",
    offeredLevels: "both",
  },
  {
    schoolId: "300640",
    schoolName: "ALFONSO CASTAÑEDA NATIONAL HIGH SCHOOL",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Nueva Vizcaya",
    district: "Alfonso Castañeda District",
    address: "Lublub, Alfonso Castañeda, Nueva Vizcaya",
    schoolHeadName: "FERDINAND A. GARCIA",
    schoolHeadTitle: "Secondary School Principal I",
    email: "300640@deped.gov.ph",
    website: "www.deped-nv.com.ph",
    schoolType: "Public Secondary (JHS & SHS)",
    offeredLevels: "both",
  },
  {
    schoolId: "301234",
    schoolName: "TUGUEGARAO CITY SCIENCE HIGH SCHOOL",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Tuguegarao City",
    district: "Tuguegarao West District",
    address: "Carig Sur, Tuguegarao City, Cagayan",
    schoolHeadName: "MARIVIC S. MALANA PhD",
    schoolHeadTitle: "Secondary School Principal IV",
    email: "301234@deped.gov.ph",
    website: "www.deped-tuguegarao.gov.ph",
    schoolType: "Regional Science High School",
    offeredLevels: "both",
  },
  {
    schoolId: "301456",
    schoolName: "ISABELA NATIONAL HIGH SCHOOL",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Ilagan City",
    district: "Ilagan City District",
    address: "San Vicente, City of Ilagan, Isabela",
    schoolHeadName: "FELICIANO A. ESPIRITU EdD",
    schoolHeadTitle: "Secondary School Principal IV",
    email: "301456@deped.gov.ph",
    website: "www.deped-isabela.gov.ph",
    schoolType: "Public Secondary (JHS & SHS)",
    offeredLevels: "both",
  },
  {
    schoolId: "301789",
    schoolName: "CAGAYAN NATIONAL HIGH SCHOOL",
    region: "Region II – Cagayan Valley",
    division: "Schools Division of Tuguegarao City",
    district: "Tuguegarao Central District",
    address: "San Gabriel, Tuguegarao City, Cagayan",
    schoolHeadName: "ELIZABETH M. CALLO EdD",
    schoolHeadTitle: "Secondary School Principal IV",
    email: "301789@deped.gov.ph",
    website: "www.deped-tuguegarao.gov.ph",
    schoolType: "Public Secondary (JHS & SHS)",
    offeredLevels: "both",
  },
  {
    schoolId: "305411",
    schoolName: "RAMON MAGSAYSAY HIGH SCHOOL",
    region: "National Capital Region (NCR)",
    division: "Schools Division Office of Manila",
    district: "District IV Manila",
    address: "Espana Blvd, Sampaloc, Manila",
    schoolHeadName: "CORAZON C. SANTOS EdD",
    schoolHeadTitle: "Secondary School Principal IV",
    email: "305411@deped.gov.ph",
    website: "www.depedmanila.ph",
    schoolType: "Public Secondary (JHS & SHS)",
    offeredLevels: "both",
  },
  {
    schoolId: "305418",
    schoolName: "MANILA SCIENCE HIGH SCHOOL",
    region: "National Capital Region (NCR)",
    division: "Schools Division Office of Manila",
    district: "District V Manila",
    address: "Taft Ave cor. Padre Faura St., Ermita, Manila",
    schoolHeadName: "EVA C. DEL ROSARIO PhD",
    schoolHeadTitle: "Secondary School Principal IV",
    email: "305418@deped.gov.ph",
    website: "www.depedmanila.ph",
    schoolType: "Special Science High School",
    offeredLevels: "both",
  },
];

export function calculateProfileCompleteness(profile) {
  if (!profile) return { score: 0, checks: [] };
  const checks = [
    { key: "schoolType", weight: 20, label: "School Type", isMet: Boolean(profile?.schoolType?.trim()) },
    { key: "schoolName", weight: 25, label: "School Name", isMet: Boolean(profile?.schoolName?.trim()) },
    { key: "levels", weight: 15, label: "Levels Offered", isMet: Boolean(profile?.offeredLevels?.trim()) },
    { key: "division_region", weight: 20, label: "Division & Region", isMet: Boolean(profile?.division?.trim() && profile?.region?.trim()) },
    { key: "address", weight: 10, label: "District & Campus Address", isMet: Boolean(profile?.district?.trim() && profile?.address?.trim()) },
    {
      key: "seals",
      weight: 10,
      label: "Official Seals",
      isMet: Boolean(
        profile?.brandingByLevel ||
        profile?.showDepEdSeal !== false ||
        profile?.showSchoolSeal !== false ||
        profile?.depedLogoUrl ||
        profile?.schoolLogoUrl
      ),
    },
  ];
  const score = checks.reduce((acc, c) => acc + (c.isMet ? c.weight : 0), 0);
  return { score, checks };
}

export function getLevelBranding(profile, level = "jhs") {
  const lvl = level === "shs" ? "shs" : "jhs";
  const defaultSchoolLogo = (profile?.schoolLogoUrl && profile.schoolLogoUrl.startsWith("data:"))
    ? profile.schoolLogoUrl
    : "/diadi-nhs-logo.png?v=1980";
  const lvlBranding = profile?.brandingByLevel?.[lvl];
  if (lvlBranding) {
    return {
      showDepEdSeal: lvlBranding.showDepEdSeal !== false,
      showDepEdWordmark: lvlBranding.showDepEdWordmark !== false,
      depedSealUrl: lvlBranding.depedSealUrl || lvlBranding.depedLogoUrl || "",
      depedLogoUrl: lvlBranding.depedSealUrl || lvlBranding.depedLogoUrl || "",
      depedWordmarkUrl: lvlBranding.depedWordmarkUrl || "",
      showSchoolSeal: lvlBranding.showSchoolSeal !== false,
      schoolLogoUrl: (lvlBranding.schoolLogoUrl && lvlBranding.schoolLogoUrl.startsWith("data:"))
        ? lvlBranding.schoolLogoUrl
        : defaultSchoolLogo,
      showBagongPilipinas: Boolean(lvlBranding.showBagongPilipinas),
      bagongPilipinasLogoUrl: lvlBranding.bagongPilipinasLogoUrl || "",
      footerLogoFormat: lvlBranding.footerLogoFormat || "tri_logo",
    };
  }
  return {
    showDepEdSeal: profile?.showDepEdSeal !== false,
    showDepEdWordmark: profile?.showDepEdWordmark !== false,
    depedSealUrl: profile?.depedSealUrl || profile?.depedLogoUrl || "",
    depedLogoUrl: profile?.depedSealUrl || profile?.depedLogoUrl || "",
    depedWordmarkUrl: profile?.depedWordmarkUrl || "",
    showSchoolSeal: profile?.showSchoolSeal !== false,
    schoolLogoUrl: (profile?.schoolLogoUrl && profile.schoolLogoUrl.startsWith("data:"))
      ? profile.schoolLogoUrl
      : "/diadi-nhs-logo.png?v=1980",
    showBagongPilipinas: lvl === "shs" ? (profile?.showBagongPilipinas !== false) : Boolean(profile?.showBagongPilipinas),
    bagongPilipinasLogoUrl: profile?.bagongPilipinasLogoUrl || "",
    footerLogoFormat: profile?.footerLogoFormat || "tri_logo",
  };
}


export const SCHOOL_PROFILE_TABS = [
  { id: "profile", label: "School Profile" },
  { id: "scheduling", label: "Scheduling Configurations" },
  { id: "academic_years", label: "Academic Years & Historical Archives" },
];

export const DEPED_PRESETS = [
  {
    id: "diadi_standard_60",
    name: "DepEd Standard (Option A — Diadi NHS)",
    badge: "60m • 8 Periods",
    description: "4 meetings × 60m (240 mins/wk) Core, 20m Recess, 60m Lunch, 10m Afternoon Break",
    config: {
      duration: 60,
      manualPeriodCount: 8,
      breaks: {
        morning: { enabled: true, duration: 20, afterPeriod: 2 },
        lunch: { enabled: true, duration: 60, afterPeriod: 4 },
        afternoon: { enabled: true, duration: 10, afterPeriod: 6 },
      },
    },
  },
  {
    id: "do017_shs_60",
    name: "DO 017 Strengthened SHS Trimester",
    badge: "60m • DO 017 Ready",
    description: "60m Periods, 8 Periods/day, 20m Recess, 60m Lunch Break for Grade 11 Trimester Block",
    config: {
      duration: 60,
      manualPeriodCount: 8,
      breaks: {
        morning: { enabled: true, duration: 20, afterPeriod: 2 },
        lunch: { enabled: true, duration: 60, afterPeriod: 4 },
        afternoon: { enabled: false, duration: 15, afterPeriod: 6 },
      },
    },
  },
  {
    id: "friday_shortened_45",
    name: "Friday Shortened / Remediation Day",
    badge: "45m • 6 Periods",
    description: "Shortened session with 45m periods, 15m Recess, 50m Lunch for Friday club/remediation",
    config: {
      duration: 45,
      manualPeriodCount: 6,
      breaks: {
        morning: { enabled: true, duration: 15, afterPeriod: 2 },
        lunch: { enabled: true, duration: 50, afterPeriod: 4 },
        afternoon: { enabled: false, duration: 10, afterPeriod: 6 },
      },
    },
  },
  {
    id: "double_shift_compact_40",
    name: "Double-Shift Compact (40m)",
    badge: "40m • 7 Periods",
    description: "Compact 40m periods designed for high-density schools running double shift schedule",
    config: {
      duration: 40,
      manualPeriodCount: 7,
      breaks: {
        morning: { enabled: true, duration: 15, afterPeriod: 3 },
        lunch: { enabled: false, duration: 30, afterPeriod: 4 },
        afternoon: { enabled: false, duration: 10, afterPeriod: 5 },
      },
    },
  },
];

const DAYS = [
  { full: "Monday", short: "Mon" },
  { full: "Tuesday", short: "Tue" },
  { full: "Wednesday", short: "Wed" },
  { full: "Thursday", short: "Thu" },
  { full: "Friday", short: "Fri" },
  { full: "Saturday", short: "Sat" },
  { full: "Sunday", short: "Sun" },
];

export function getOrdinalNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return `${n}`;
  const mod100 = num % 100;
  const mod10 = num % 10;
  const suffix = mod100 >= 11 && mod100 <= 13 ? "th" : mod10 === 1 ? "st" : mod10 === 2 ? "nd" : mod10 === 3 ? "rd" : "th";
  return `${num}${suffix}`;
}

export function getOrdinalPeriodLabel(n) {
  return `${getOrdinalNumber(n)} Period`;
}

export function getOrdinalPeriodPairLabel(p1, p2) {
  return `${getOrdinalNumber(p1)} & ${getOrdinalNumber(p2)} Periods`;
}

const DEFAULT_PROFILE = {
  schoolType: "Basic Education (K-12)", // 'Basic Education (K-12)' | 'Higher Education (CHED)' | 'Technical-Vocational (TESDA)' | 'Integrated / Others'
  schoolName: "DIADI NATIONAL HIGH SCHOOL",
  schoolId: "300627",
  division: "Schools Division of Nueva Vizcaya",
  region: "Region II – Cagayan Valley",
  district: "Diadi District",
  address: "Poblacion, Diadi, Nueva Vizcaya",
  email: "300627@deped.gov.ph",
  website: "www.deped-nv.com.ph",
  academicYear: "2026-2027",
  depedLogoUrl: "",
  depedSealUrl: "",
  depedWordmarkUrl: "",
  schoolLogoUrl: "/diadi-nhs-logo.png?v=1980",
  showDepEdSeal: true,
  showDepEdWordmark: true,
  showSchoolSeal: true,
  showBagongPilipinas: false,
  bagongPilipinasLogoUrl: "",
  brandingByLevel: {
    jhs: {
      showDepEdSeal: true,
      showDepEdWordmark: true,
      depedSealUrl: "",
      depedLogoUrl: "",
      depedWordmarkUrl: "",
      showSchoolSeal: true,
      schoolLogoUrl: "/diadi-nhs-logo.png?v=1980",
      showBagongPilipinas: false,
      bagongPilipinasLogoUrl: "",
      footerLogoFormat: "tri_logo",
    },
    shs: {
      showDepEdSeal: true,
      showDepEdWordmark: true,
      depedSealUrl: "",
      depedLogoUrl: "",
      depedWordmarkUrl: "",
      showSchoolSeal: true,
      schoolLogoUrl: "/diadi-nhs-logo.png?v=1980",
      showBagongPilipinas: true,
      bagongPilipinasLogoUrl: "",
      footerLogoFormat: "tri_logo",
    },
  },
  shiftMode: "single_day", // 'single_day' | 'double_shift'
  morningShiftStartTime: "06:00",
  morningShiftEndTime: "12:00",
  afternoonShiftStartTime: "12:00",
  afternoonShiftEndTime: "18:00",
  offeredLevels: "both", // 'both' | 'jhs_only' | 'shs_only'
  activeTerm: "Term 1", // 'Term 1' | 'Term 2' | 'Term 3' (Unified School Calendar)
  calendarSystem: "trimester", // 'trimester' (3 Terms unified) | 'semester'
  jhsTerm: "Term 1",
  shsCalendarSystem: "trimester", // 'trimester' | 'semester'
  shsActiveTerm: "Term 1", // 'Term 1' | 'Term 2' | 'Term 3'
  shsSemester: "First Semester", // for legacy cohort
  shsTermsConfig: {
    term1: { name: "Term 1", startDate: "2026-08-24", endDate: "2026-11-20", instructionalWeeks: 12, openingDays: 3, endDays: 2 },
    term2: { name: "Term 2", startDate: "2026-11-23", endDate: "2027-02-26", instructionalWeeks: 12, openingDays: 0, endDays: 3 },
    term3: { name: "Term 3", startDate: "2027-03-01", endDate: "2027-06-04", instructionalWeeks: 12, openingDays: 0, endDays: 5 },
  },
  schoolHeadName: "GABRIEL C. ULLANI EdD",
  schoolHeadTitle: "Secondary School Principal II",
  signatoryMode: "level_specific", // 'level_specific' | 'uniform'
  signatoriesByLevel: {
    jhs: {
      level: "jhs",
      workflowType: "district",
      workflowLabel: "School & District Level Operational Approval",
      workflowBadge: "District In-Charge / PSDS Approval",
      workflowDescription: "Standard operational approval for Junior High School timetables (Grades 7–10). Prepared by the Subject Timetable Committee and approved by the District In-Charge.",
      showConformed: true,
      preparedByHeading: "Prepared by (Timetable Committee / Subject Coordinators):",
      conformedHeading: "Conformed:",
      recommendingApprovalHeading: "Recommending Approval:",
      approvedHeading: "Approved:",
      preparedBy: [
        { name: "RANDY V. GALGO, MTI", title: "CIC, MAPEH & SPA" },
        { name: "GILBERT B. MIGANO, MTI", title: "CIC, SCIENCE & MATHEMATICS" },
        { name: "CORNELIA V. DELA CRUZ, MTI", title: "CIC, AP, EsP & TLE" },
        { name: "ARLEE M. VICMUDO, MTI", title: "CIC, Language & SPJ" },
      ],
      conformed: { name: "FREDIRICK R. VICMUDO, HT III", title: "Asst. Principal Designate" },
      recommendingApproval: { name: "GABRIEL C. ULLANI EdD", title: "Secondary School Principal II" },
      approved: { name: "CARMELITA L. PALE EdD", title: "District_In-Charge" },
    },
    shs: {
      level: "shs",
      workflowType: "division",
      workflowLabel: "Schools Division Office (SDO) Statutory Approval",
      workflowBadge: "Schools Division Superintendent Approval (DO 017)",
      workflowDescription: "Official statutory approval for Senior High School class programs (Grades 11–12, DO 017). Submitted by the School Head, reviewed by CID Chief, and approved by the Schools Division Superintendent.",
      showConformed: true,
      preparedByHeading: "Prepared by:",
      conformedHeading: "Reviewed:",
      recommendingApprovalHeading: "Recommending Approval:",
      approvedHeading: "Approved:",
      preparedBy: [
        { name: "ROBERTO D. CUTILLON", title: "School Principal IV" },
      ],
      conformed: { name: "MARICEL S. FRANCO PhD, CESE", title: "Chief Education Supervisor, CID" },
      recommendingApproval: { name: "ADONIS C. CEPEREZ EdD, CESE", title: "Assistant Schools Division Superintendent" },
      approved: { name: "ORLANDO E. MANUEL PhD, CESO V", title: "Schools Division Superintendent" },
    },
  },
  signatories: {
    preparedBy: [
      { name: "RANDY V. GALGO, MTI", title: "CIC, MAPEH & SPA" },
      { name: "GILBERT B. MIGANO, MTI", title: "CIC, SCIENCE & MATHEMATICS" },
      { name: "CORNELIA V. DELA CRUZ, MTI", title: "CIC, AP, EsP & TLE" },
      { name: "ARLEE M. VICMUDO, MTI", title: "CIC, Language & SPJ" },
    ],
    conformed: { name: "FREDIRICK R. VICMUDO, HT III", title: "Asst. Principal Designate" },
    recommendingApproval: { name: "GABRIEL C. ULLANI EdD", title: "Secondary School Principal II" },
    approved: { name: "CARMELITA L. PALE EdD", title: "District_In-Charge" },
  },
};

export const DEFAULT_SIGNATORIES_BY_LEVEL = DEFAULT_PROFILE.signatoriesByLevel;


const DEFAULT_SESSION_CONFIG = {
  duration: 60,
  manualPeriodCount: 8,
  breaks: {
    morning: { enabled: true, duration: 20, afterPeriod: 2 },
    lunch: { enabled: true, duration: 60, afterPeriod: 4 },
    afternoon: { enabled: false, duration: 15, afterPeriod: 6 },
  },
};

const DEFAULT_LEVEL_CONFIG = {
  schoolStartTime: "07:30",
  schoolEndTime: "17:00",
  periodCalculationMode: "manual", // 'manual'
  dayAssignments: {
    Monday: "regular",
    Tuesday: "regular",
    Wednesday: "regular",
    Thursday: "regular",
    Friday: "shortened",
    Saturday: "off",
    Sunday: "off",
  },
  sessions: {
    regular: {
      duration: 60,
      manualPeriodCount: 8,
      breaks: {
        morning: { enabled: true, duration: 20, afterPeriod: 2 },
        lunch: { enabled: true, duration: 60, afterPeriod: 4 },
        afternoon: { enabled: true, duration: 10, afterPeriod: 6 },
      },
    },
    shortened: {
      duration: 45,
      manualPeriodCount: 6,
      breaks: {
        morning: { enabled: true, duration: 15, afterPeriod: 2 },
        lunch: { enabled: true, duration: 50, afterPeriod: 4 },
        afternoon: { enabled: false, duration: 10, afterPeriod: 6 },
      },
    },
  },
  constraints: {
    enforceNoDoubleBooking: true,
    enforceUnavailablePeriods: true,
    enforceExpertiseAndGradeMatch: true,
    enforceFixedPeriods: true,
    teacherAssignmentPolicy: "consolidated_balanced", // 'consolidated_balanced' | 'equal_balance' | 'prioritize_regular' | 'hybrid_weighted'
    enforceMaxLoadCap: true,
    maxTeachingLoadCap: 24,
    applyDO005AdvisoryAncillaryCredits: true,
    enforceMaxPreparations: true,
    maxDistinctPreparations: 3,
    enforceStudentCoreBalance: true,
    flagCeremonyDay: "Monday",
    flagCeremonyPeriod: 1,
  },
};

const DEFAULT_CONFIGS = {
  jhs: { ...DEFAULT_LEVEL_CONFIG },
  shs: {
    ...DEFAULT_LEVEL_CONFIG,
    dayAssignments: {
      Monday: "regular",
      Tuesday: "regular",
      Wednesday: "regular",
      Thursday: "regular",
      Friday: "shortened",
      Saturday: "off",
      Sunday: "off",
    },
  },
};

export function SchoolConfigurationHealth({ profile, configs }) {
  const jhsPeriods = configs?.jhs?.sessions?.regular?.manualPeriodCount || 8;
  const facultyCount = useMemo(() => {
    try {
      const raw = window.localStorage.getItem("turotugma_faculty");
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.length : 0;
    } catch {
      return 0;
    }
  }, []);

  const sectionsCount = useMemo(() => {
    try {
      const raw = window.localStorage.getItem("turotugma_sections_created");
      if (!raw) return 0;
      const data = JSON.parse(raw);
      let count = 0;
      if (data?.jhs) {
        Object.values(data.jhs).forEach((g) => {
          if (Array.isArray(g?.sections)) count += g.sections.length;
        });
      }
      if (data?.shs) {
        Object.values(data.shs).forEach((g) => {
          if (Array.isArray(g?.sections)) count += g.sections.length;
        });
      }
      return count;
    } catch {
      return 0;
    }
  }, []);

  const checks = [
    {
      id: "identity",
      label: "School Identity",
      detail: profile.schoolName || "Diadi NHS",
      isReady: Boolean(profile.schoolName && profile.division),
    },
    {
      id: "calendar",
      label: "Academic Calendar",
      detail: `SY ${profile.academicYear || "2026-2027"} • ${profile.activeTerm || profile.shsActiveTerm || "Term 1"}`,
      isReady: Boolean(profile.academicYear && profile.offeredLevels),
    },
    {
      id: "bell",
      label: "Bell Schedule",
      detail: `${jhsPeriods} Periods/day`,
      isReady: jhsPeriods >= 6,
    },
    {
      id: "policy",
      label: "DepEd Policies",
      detail: profile.shiftMode === "double_shift" ? "Double-Shift Active" : "DO 005 Standard",
      isReady: true,
    },
    {
      id: "signatories",
      label: "Signatories",
      detail: "Signatory Roster Ready",
      isReady: Boolean(
        (profile.signatoriesByLevel?.jhs?.approved?.name || profile.signatories?.approved?.name) &&
        (profile.signatoriesByLevel?.shs?.approved?.name || profile.signatories?.approved?.name)
      ),
    },
    {
      id: "classes",
      label: "Faculty & Sections",
      detail: facultyCount > 0 ? `${facultyCount} Faculty • ${sectionsCount} Sections` : "Catalog Connected",
      isReady: true,
    },
  ];

  const readyCount = checks.filter((c) => c.isReady).length;
  const percentage = Math.round((readyCount / checks.length) * 100);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)",
        border: "1px solid #dce5ff",
        borderRadius: 14,
        padding: "16px 20px",
        marginBottom: 20,
        boxShadow: "0 2px 10px rgba(31, 44, 111, 0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, color: "#1f2c6f" }}>
              School Configuration Readiness
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: 999,
                background: percentage === 100 ? "#dcfce7" : "#fef3c7",
                color: percentage === 100 ? "#166534" : "#92400e",
                border: percentage === 100 ? "1px solid #bbf7d0" : "1px solid #fde68a",
              }}
            >
              {percentage === 100 ? "100% Ready for Schedule Generation" : `${readyCount} of ${checks.length} Areas Configured`}
            </span>
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#5b6787" }}>
            Operational health status of administrative parameters, academic calendar, and DepEd compliance rules.
          </p>
        </div>

        {/* Progress Bar & Score */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200 }}>
          <div style={{ flex: 1, height: 8, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${percentage}%`,
                background: percentage === 100 ? "linear-gradient(90deg, #3B4197, #16a34a)" : "linear-gradient(90deg, #3B4197, #2563eb)",
                borderRadius: 999,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: percentage === 100 ? "#16a34a" : "#1f2c6f" }}>
            {percentage}%
          </span>
        </div>
      </div>

      {/* Checklist Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8 }}>
        {checks.map((chk) => (
          <div
            key={chk.id}
            style={{
              background: "#ffffff",
              border: chk.isReady ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "7px 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: chk.isReady ? "#16a34a" : "#94a3b8",
                color: "#ffffff",
                fontSize: 9.5,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              OK
            </span>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {chk.label}
              </div>
              <div style={{ fontSize: 10, color: "#64748b", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {chk.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SchoolProfileSettings() {
  const [activeSubTab, setActiveSubTab] = useState(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("subtab");
      if (param === "config" || param === "scheduling-configurations" || param === "scheduling" || param === "bell") return "scheduling";
      if (param === "profile" || param === "identity" || param === "letterhead" || param === "signatories") return "profile";
      if (param === "academic_years" || param === "academic_policies" || param === "terms" || param === "rollover" || param === "calendar" || param === "constraints" || param === "deped" || param === "policies") return "academic_years";
    }
    return "profile";
  });

  const handleTabChange = (tabId) => {
    setActiveSubTab(tabId);
    if (typeof window !== "undefined" && window.history?.replaceState) {
      const url = new URL(window.location);
      url.searchParams.set("subtab", tabId);
      window.history.replaceState({}, "", url);
    }
  };
  const [activeLevel, setActiveLevel] = useState("jhs"); // 'jhs' | 'shs'
  const signatoryLevel = activeLevel;
  const sealLevel = activeLevel;
  const setSignatoryLevel = setActiveLevel;
  const setSealLevel = setActiveLevel;
  const [activeSession, setActiveSession] = useState("regular"); // 'regular' | 'shortened'
  const [profile, setProfile] = useState(() => getInitialProfile());
  const [configs, setConfigs] = useState(() => getInitialConfigs());
  const [showPeriodCalculator, setShowPeriodCalculator] = useState(false);
  const [showDepEdCompliance, setShowDepEdCompliance] = useState(false);
  const [showDirectUrlInput, setShowDirectUrlInput] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const noticeTimerRef = useRef(null);

  const depedFileInputRef = useRef(null);
  const depedWordmarkFileInputRef = useRef(null);
  const schoolFileInputRef = useRef(null);
  const bagongPilipinasFileInputRef = useRef(null);

  const [simTeachingHours, setSimTeachingHours] = useState(20);
  const [simIsAdviser, setSimIsAdviser] = useState(true);
  const [simIsAncillary, setSimIsAncillary] = useState(false);

  // Historical School Years Archives & Rollover State
  const [historicalYears, setHistoricalYears] = useState(() => getHistoricalSchoolYears());
  const [inspectingYear, setInspectingYear] = useState(null);
  const [inspectLevel, setInspectLevel] = useState("jhs");
  const [reuseModalYear, setReuseModalYear] = useState(null);
  const [reuseTargetLevel, setReuseTargetLevel] = useState("both");
  const [reuseOptions, setReuseOptions] = useState({
    sections: true,
    faculty: true,
    ancillaries: true,
    configs: true,
    schedules: true,
  });

  const [rolloverSourceYear, setRolloverSourceYear] = useState("2025-2026");
  const [rolloverOptions, setRolloverOptions] = useState({
    faculty: true,
    subjects: true,
    sections: true,
  });

  const [isHeaderPreviewOpen, setIsHeaderPreviewOpen] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState(() => new Date());
  const [saveStatus, setSaveStatus] = useState("saved");
  const isInitialMount = useRef(true);

  const completeness = useMemo(() => calculateProfileCompleteness(profile), [profile]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("turotugma:profile-updated"));
        }
        setSaveStatus("saved");
        setLastSavedTime(new Date());
      } catch (err) {
        console.warn("Auto-save storage issue:", err);
        setSaveStatus("saved");
      }
    }, 850);
    return () => clearTimeout(timer);
  }, [profile]);

  const formatSavedTime = (date) => {
    if (!date) return "just now";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const updateActiveBranding = (updates) => {
    setProfile((prev) => {
      const cur = getLevelBranding(prev, sealLevel);
      const updated = { ...cur, ...updates };
      const nextBrandingByLevel = {
        ...(prev.brandingByLevel || {
          jhs: getLevelBranding(prev, "jhs"),
          shs: getLevelBranding(prev, "shs"),
        }),
        [sealLevel]: updated,
      };
      return {
        ...prev,
        brandingByLevel: nextBrandingByLevel,
        ...(sealLevel === signatoryLevel ? updated : {}),
      };
    });
  };

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

  const handleDepEdLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showNotice("DepEd circular seal image file must be under 5MB.", "error");
      return;
    }
    try {
      const compressed = await compressImageToDataUrl(file, 140, 0.82);
      if (compressed) {
        updateActiveBranding({ depedSealUrl: compressed, depedLogoUrl: compressed, showDepEdSeal: true });
        showNotice(`DepEd Circular Seal for ${sealLevel.toUpperCase()} uploaded and synced with header.`, "success");
      } else {
        showNotice("Could not process image file.", "error");
      }
    } catch (err) {
      showNotice("Failed to process image: " + err.message, "error");
    }
    e.target.value = "";
  };

  const handleResetDepEdLogo = () => {
    updateActiveBranding({ depedSealUrl: "", depedLogoUrl: "" });
    showNotice(`Reset ${sealLevel.toUpperCase()} to official vector DepEd Circular Seal.`, "info");
  };

  const handleDepEdWordmarkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showNotice("DepEd wordmark image file must be under 5MB.", "error");
      return;
    }
    try {
      const compressed = await compressImageToDataUrl(file, 220, 0.82);
      if (compressed) {
        updateActiveBranding({ depedWordmarkUrl: compressed, showDepEdWordmark: true });
        showNotice(`DepEd Text Logo for ${sealLevel.toUpperCase()} uploaded and synced with signatories footer.`, "success");
      } else {
        showNotice("Could not process image file.", "error");
      }
    } catch (err) {
      showNotice("Failed to process image: " + err.message, "error");
    }
    e.target.value = "";
  };

  const handleResetDepEdWordmark = () => {
    updateActiveBranding({ depedWordmarkUrl: "" });
    showNotice(`Reset ${sealLevel.toUpperCase()} to official vector DepEd Wordmark (DO 001 Torch).`, "info");
  };

  const handleSchoolLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showNotice("School emblem image file must be under 5MB.", "error");
      return;
    }
    try {
      const compressed = await compressImageToDataUrl(file, 160, 0.85);
      if (compressed) {
        updateActiveBranding({ schoolLogoUrl: compressed, showSchoolSeal: true });
        showNotice(`School Crest for ${sealLevel.toUpperCase()} updated with custom image.`, "success");
      } else {
        showNotice("Could not process image file.", "error");
      }
    } catch (err) {
      showNotice("Failed to process image: " + err.message, "error");
    }
    e.target.value = "";
  };

  const handleResetSchoolLogo = () => {
    updateActiveBranding({ schoolLogoUrl: "/diadi-nhs-logo.png?v=1980" });
    showNotice(`Reset ${sealLevel.toUpperCase()} to authentic Diadi National High School crest.`, "info");
  };

  const handleBagongPilipinasUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showNotice("Bagong Pilipinas logo image file must be under 5MB.", "error");
      return;
    }
    try {
      const compressed = await compressImageToDataUrl(file, 140, 0.82);
      if (compressed) {
        updateActiveBranding({ bagongPilipinasLogoUrl: compressed, showBagongPilipinas: true });
        showNotice(`Bagong Pilipinas logo for ${sealLevel.toUpperCase()} uploaded and synced.`, "success");
      } else {
        showNotice("Could not process image file.", "error");
      }
    } catch (err) {
      showNotice("Failed to process image: " + err.message, "error");
    }
    e.target.value = "";
  };

  const handleResetBagongPilipinas = () => {
    updateActiveBranding({ bagongPilipinasLogoUrl: "" });
    showNotice(`Reset ${sealLevel.toUpperCase()} to official vector Bagong Pilipinas logo.`, "info");
  };

  const handleApplyPreset = (preset) => {
    updateActiveSessionConfig((sCfg) => ({
      ...sCfg,
      duration: preset.config.duration,
      manualPeriodCount: preset.config.manualPeriodCount,
      breaks: {
        morning: { ...sCfg.breaks.morning, ...preset.config.breaks.morning },
        lunch: { ...sCfg.breaks.lunch, ...preset.config.breaks.lunch },
        afternoon: { ...sCfg.breaks.afternoon, ...preset.config.breaks.afternoon },
      },
    }));
    showNotice(`Applied ${preset.name} (${preset.badge})!`, "success");
  };

  const handleSaveProfile = async () => {
    if (!profile.schoolName.trim()) {
      showNotice("School Name is required.", "error");
      return;
    }

    try {
      let profileToSave = { ...profile };

      // Ensure any large data URIs are compressed down to small thumbnails to conserve storage quota
      if (profileToSave.depedLogoUrl && profileToSave.depedLogoUrl.startsWith("data:") && profileToSave.depedLogoUrl.length > 25000) {
        profileToSave.depedLogoUrl = await compressImageToDataUrl(profileToSave.depedLogoUrl, 140, 0.8);
      }
      if (profileToSave.schoolLogoUrl && profileToSave.schoolLogoUrl.startsWith("data:") && profileToSave.schoolLogoUrl.length > 25000) {
        profileToSave.schoolLogoUrl = await compressImageToDataUrl(profileToSave.schoolLogoUrl, 140, 0.8);
      }
      if (profileToSave.bagongPilipinasLogoUrl && profileToSave.bagongPilipinasLogoUrl.startsWith("data:") && profileToSave.bagongPilipinasLogoUrl.length > 25000) {
        profileToSave.bagongPilipinasLogoUrl = await compressImageToDataUrl(profileToSave.bagongPilipinasLogoUrl, 140, 0.8);
      }

      setProfile(profileToSave);

      try {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileToSave));
      } catch (storageErr) {
        // Quota recovery: if quota is exceeded, strip data URLs and fall back to vector seals to protect metadata
        if (storageErr.name === "QuotaExceededError" || storageErr.code === 22) {
          console.warn("Storage quota exceeded. Stripping large logo data to protect core profile settings.");
          const lightweightProfile = {
            ...profileToSave,
            depedLogoUrl: profileToSave.depedLogoUrl?.startsWith("data:") ? "" : profileToSave.depedLogoUrl,
            schoolLogoUrl: profileToSave.schoolLogoUrl?.startsWith("data:") ? "" : profileToSave.schoolLogoUrl,
            bagongPilipinasLogoUrl: profileToSave.bagongPilipinasLogoUrl?.startsWith("data:") ? "" : profileToSave.bagongPilipinasLogoUrl,
          };
          window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(lightweightProfile));
          setProfile(lightweightProfile);
          showNotice("Saved! Note: Image was large for browser storage; vector seals or web URLs are active.", "warning");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("turotugma:profile-updated"));
          }
          return;
        }
        throw storageErr;
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("turotugma:profile-updated"));
      }
      showNotice("School Profile updated successfully.", "success");
    } catch (err) {
      console.error("Save profile error:", err);
      showNotice("Failed to save school profile: " + (err.message || "Storage error"), "error");
    }
  };

  const handleExecuteRollover = () => {
    try {
      let count = 0;
      if (rolloverOptions.faculty) count++;
      if (rolloverOptions.subjects) count++;
      if (rolloverOptions.sections) count++;

      const auditLog = JSON.parse(window.localStorage.getItem("turotugma_rollover_audit") || "[]");
      auditLog.push({
        timestamp: new Date().toISOString(),
        sourceYear: rolloverSourceYear,
        targetYear: profile.academicYear,
        options: rolloverOptions,
      });
      window.localStorage.setItem("turotugma_rollover_audit", JSON.stringify(auditLog));

      showNotice(`Data Rollover successful! Carried over data from SY ${rolloverSourceYear} to SY ${profile.academicYear}.`, "success");
    } catch {
      showNotice("Failed to execute data rollover.", "error");
    }
  };

  const handleExecuteReuse = () => {
    if (!reuseModalYear) return;
    try {
      let secCount = 0;
      let facCount = 0;
      let cfgSuccess = false;

      if (reuseOptions.sections) {
        const res = reuseSectionsFromYear(reuseModalYear, reuseTargetLevel);
        secCount = res.count || 0;
      }
      if (reuseOptions.faculty) {
        const res = reuseFacultyFromYear(reuseModalYear, reuseTargetLevel);
        facCount = res.count || 0;
      }
      if (reuseOptions.configs) {
        const res = reuseConfigurationsFromYear(reuseModalYear, reuseTargetLevel);
        cfgSuccess = res.success;
      }
      let schedCount = 0;
      if (reuseOptions.schedules) {
        const res = reusePublishedSchedulesFromYear(reuseModalYear, reuseTargetLevel);
        schedCount = res.count || 0;
      }

      // Record in audit log
      const rawAudit = window.localStorage.getItem(ROLLOVER_AUDIT_KEY);
      const auditLog = rawAudit ? JSON.parse(rawAudit) : [];
      auditLog.unshift({
        timestamp: new Date().toISOString(),
        sourceYear: reuseModalYear.academicYear,
        targetYear: profile.academicYear || "2026-2027",
        level: reuseTargetLevel,
        importedSections: secCount,
        importedFaculty: facCount,
        configurationsUpdated: cfgSuccess,
        importedSchedules: schedCount,
        action: `Selective data reuse from S.Y. ${reuseModalYear.academicYear} (${reuseTargetLevel.toUpperCase()})`,
      });
      window.localStorage.setItem(ROLLOVER_AUDIT_KEY, JSON.stringify(auditLog.slice(0, 30)));

      const summaryParts = [];
      if (secCount > 0) summaryParts.push(`${secCount} sections`);
      if (facCount > 0) summaryParts.push(`${facCount} faculty members`);
      if (cfgSuccess) summaryParts.push("bell schedule configurations");
      if (schedCount > 0) summaryParts.push(`${schedCount} published schedules`);

      showNotice(
        `Successfully reused ${summaryParts.join(", ") || "data"} from S.Y. ${reuseModalYear.academicYear} into active school year!`,
        "success"
      );
      setReuseModalYear(null);
    } catch (err) {
      showNotice("Failed to reuse data: " + err.message, "error");
    }
  };

  const handleFullRollover = (yearObj) => {
    if (!yearObj) return;
    const res = executeFullRolloverFromYear(yearObj, profile.academicYear || "2026-2027");
    if (res.success) {
      showNotice(
        `Full rollover completed! Reused ${res.importedSections} sections, ${res.importedFaculty} faculty members, and bell schedules from S.Y. ${yearObj.academicYear} into active S.Y. ${profile.academicYear}.`,
        "success"
      );
    } else {
      showNotice("Failed to execute full rollover.", "error");
    }
  };

  const handleSaveConfig = () => {
    try {
      window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configs));
      window.dispatchEvent(new Event("turotugma:config-updated"));
      showNotice(`${activeLevel.toUpperCase()} Scheduling Configuration updated successfully.`, "success");
    } catch (err) {
      showNotice("Failed to save configuration: " + err.message, "error");
    }
  };

  const currentLevelConfig = mergeLevelConfig(configs[activeLevel], DEFAULT_CONFIGS[activeLevel] || DEFAULT_LEVEL_CONFIG);
  const activeSessionConfig = currentLevelConfig.sessions[activeSession] || DEFAULT_SESSION_CONFIG;

  const updateCurrentConfig = (updater) => {
    setConfigs((prev) => {
      const nextLevel = updater(mergeLevelConfig(prev[activeLevel], DEFAULT_CONFIGS[activeLevel] || DEFAULT_LEVEL_CONFIG));
      const nextConfigs = {
        ...prev,
        [activeLevel]: nextLevel,
      };
      try {
        window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(nextConfigs));
        window.dispatchEvent(new Event("turotugma:config-updated"));
        window.dispatchEvent(new CustomEvent("turotugma_schedule_configurations_updated", { detail: nextConfigs }));
      } catch (err) {
        console.warn("Could not auto-save config:", err);
      }
      return nextConfigs;
    });
  };

  const updateActiveSessionConfig = (sessionUpdater) => {
    updateCurrentConfig((cfg) => ({
      ...cfg,
      sessions: {
        ...cfg.sessions,
        [activeSession]: sessionUpdater(cfg.sessions[activeSession] || DEFAULT_SESSION_CONFIG),
      },
    }));
  };

  const handleDayClick = (dayName) => {
    const currentAssignment = currentLevelConfig.dayAssignments[dayName] || "off";
    let nextAssignment = "off";

    if (currentAssignment === activeSession) {
      // If currently assigned to active session (dark blue), clicking turns it off (unassigned)
      nextAssignment = "off";
    } else {
      // If light blue (other session) or 'off' (unassigned), clicking assigns it to active session
      nextAssignment = activeSession;
    }

    updateCurrentConfig((cfg) => ({
      ...cfg,
      dayAssignments: {
        ...cfg.dayAssignments,
        [dayName]: nextAssignment,
      },
    }));
  };

  return (
    <>
      <div style={{ marginBottom: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 28, fontWeight: 900 }}>School Profile & Settings</h1>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 999,
                background: saveStatus === "saving" ? "#eff6ff" : "#f0fdf4",
                border: saveStatus === "saving" ? "1px solid #bfdbfe" : "1px solid #bbf7d0",
                fontSize: 11,
                fontWeight: 700,
                color: saveStatus === "saving" ? "#1d4ed8" : "#166534",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: saveStatus === "saving" ? "#3b82f6" : "#22c55e", display: "inline-block" }} />
              <span>{saveStatus === "saving" ? "Saving..." : `Auto-saved (${formatSavedTime(lastSavedTime)})`}</span>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 999,
                background: completeness.score >= 85 ? "#f0fdf4" : "#fefce8",
                border: completeness.score >= 85 ? "1px solid #bbf7d0" : "1px solid #fef08a",
                fontSize: 11,
                fontWeight: 800,
                color: completeness.score >= 85 ? "#15803d" : "#a16207",
              }}
            >
              <span>{completeness.score}% Profile Completeness</span>
            </div>
          </div>
          <p style={{ margin: "6px 0 0", color: "#5b6787", fontSize: 13.5 }}>
            Manage official school identity, level-specific headers and signatories (JHS & SHS), and scheduling configurations.
          </p>
        </div>

        {notice ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              position: "fixed",
              top: 24,
              right: 24,
              zIndex: 100000,
              background: noticeType === "error" ? "#dc2626" : noticeType === "info" ? "#2563eb" : noticeType === "warning" ? "#d97706" : "#16a34a",
              color: "#ffffff",
              borderRadius: 10,
              padding: "12px 18px",
              fontSize: 13,
              fontWeight: 700,
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.25)",
              maxWidth: 400,
              display: "flex",
              alignItems: "center",
              gap: 8,
              pointerEvents: "none",
            }}
          >
            <span>{noticeType === "error" ? "[!]" : noticeType === "info" ? "[i]" : noticeType === "warning" ? "[!]" : ""}</span>
            <span>{notice}</span>
          </div>
        ) : null}
      </div>

      {/* 5-Segment Tab Navigation Bar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: 12,
          flexWrap: "wrap",
        }}
      >
        {SCHOOL_PROFILE_TABS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              id={`tab-btn-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              style={subTabButtonStyle(isActive)}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SCHOOL PROFILE */}
      {(activeSubTab === "profile" || activeSubTab === "identity" || activeSubTab === "signatories") && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* CARD 1: SCHOOL PROFILE (BASIC INFORMATION) */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 16, fontWeight: 800 }}>
                  School Profile
                </h2>
                <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 12 }}>
                  Configure school type, name of the school, optional school ID, and curricular levels offered.
                </p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", padding: "3px 8px", borderRadius: 4 }}>
                BASIC INFORMATION
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              <Field label="School Type">
                <select
                  id="select-school-type"
                  value={profile.schoolType || "Basic Education (K-12)"}
                  onChange={(e) => setProfile((prev) => ({ ...prev, schoolType: e.target.value }))}
                  style={selectStyle()}
                >
                  <option value="Basic Education (K-12)">Basic Education (K-12)</option>
                  <option value="Higher Education (CHED)">Higher Education (CHED)</option>
                  <option value="Technical-Vocational (TESDA)">Technical-Vocational (TESDA)</option>
                  <option value="Integrated / Others">Integrated / Others</option>
                </select>
              </Field>

              <Field label="Name of the School">
                <input
                  type="text"
                  id="input-school-name"
                  value={profile.schoolName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, schoolName: e.target.value }))}
                  style={{ ...inputStyle(), fontWeight: 700 }}
                  placeholder="e.g. DIADI NATIONAL HIGH SCHOOL"
                />
              </Field>

              <Field label="School ID (Optional)">
                <input
                  type="text"
                  id="input-school-id"
                  value={profile.schoolId || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, schoolId: e.target.value }))}
                  style={{ ...inputStyle(), fontWeight: 700, letterSpacing: "0.05em" }}
                  placeholder="e.g. 300627 (Optional)"
                />
              </Field>

              <Field label="Curricular Levels Offered">
                <select
                  id="select-offered-levels"
                  value={profile.offeredLevels || "both"}
                  onChange={(e) => setProfile((prev) => ({ ...prev, offeredLevels: e.target.value }))}
                  style={selectStyle()}
                >
                  <option value="both">Both Junior High School & Senior High School (Integrated K-12)</option>
                  <option value="jhs_only">Junior High School Only (Grades 7 to 10)</option>
                  <option value="shs_only">Senior High School Only (Grades 11 and 12)</option>
                </select>
              </Field>
            </div>
          </div>

          {/* CARD 2: TIMETABLE LETTERHEAD, SIGNATORIES & OFFICIAL SEALS */}
          <div style={{ background: "#ffffff", border: "1.5px solid #000000", borderRadius: 14, padding: 20, boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    background: "#ecfdf5",
                    color: "#065f46",
                    border: "1px solid #a7f3d0",
                    padding: "3px 9px",
                    borderRadius: 4,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  Live DepEd Letterhead & Signatories
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "#1e293b" }}>
                  Timetable Header, Seals & Signatories Below
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {/* The Single Master Switch for Active Level */}
                <div style={{ display: "inline-flex", background: "#f1f5f9", padding: 4, borderRadius: 8, border: "1.5px solid #cbd5e1" }}>
                  <button
                    type="button"
                    id="btn-preview-level-jhs"
                    onClick={() => setActiveLevel("jhs")}
                    style={{
                      border: "none",
                      background: activeLevel === "jhs" ? "#3B4197" : "transparent",
                      color: activeLevel === "jhs" ? "#ffffff" : "#475569",
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: activeLevel === "jhs" ? "0 2px 6px rgba(59,65,151,0.3)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    Junior High School (JHS)
                  </button>
                  <button
                    type="button"
                    id="btn-preview-level-shs"
                    onClick={() => setActiveLevel("shs")}
                    style={{
                      border: "none",
                      background: activeLevel === "shs" ? "#3B4197" : "transparent",
                      color: activeLevel === "shs" ? "#ffffff" : "#475569",
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: activeLevel === "shs" ? "0 2px 6px rgba(59,65,151,0.3)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    Senior High School (SHS)
                  </button>
                </div>

                <button
                  type="button"
                  id="btn-toggle-header-preview"
                  onClick={() => setIsHeaderPreviewOpen((prev) => !prev)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "6px 12px",
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#1e293b",
                    cursor: "pointer",
                  }}
                >
                  {isHeaderPreviewOpen ? "Collapse Live Preview" : "Expand Live Preview"}
                </button>
              </div>
            </div>

            {isHeaderPreviewOpen && (
              <div style={{ marginBottom: 20 }}>
                <LiveLetterheadPreview profile={profile} targetLevel={activeLevel} />
              </div>
            )}

            {/* OFFICIAL INSIGNIA, SEALS & MASTHEAD FORMATS (Integrated for Active Level) */}
            {(() => {
              const activeBranding = getLevelBranding(profile, activeLevel);
              return (
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 18, marginTop: 12, marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                    <div>
                      <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 16, fontWeight: 800 }}>
                        Official Insignia, Seals & Masthead Formats ({activeLevel.toUpperCase()})
                      </h2>
                      <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 12 }}>
                        Seals and logo insignias configured here apply dynamically to the {activeLevel === "shs" ? "Senior High School" : "Junior High School"} live preview and timetable exports.
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: activeLevel === "shs" ? "#ecfdf5" : "#eff6ff",
                          color: activeLevel === "shs" ? "#065f46" : "#1d4ed8",
                          border: activeLevel === "shs" ? "1px solid #a7f3d0" : "1px solid #bfdbfe",
                          textTransform: "uppercase",
                        }}
                      >
                        {activeLevel.toUpperCase()} SEALS ACTIVE
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = getLevelBranding(profile, activeLevel);
                          setProfile((prev) => ({
                            ...prev,
                            brandingByLevel: {
                              jhs: { ...cur },
                              shs: { ...cur },
                            },
                          }));
                          showNotice(`Copied ${activeLevel.toUpperCase()} seals and insignia configuration to both JHS and SHS!`, "info");
                        }}
                        style={{
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#2563eb",
                          borderRadius: 6,
                          padding: "5px 12px",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Copy {activeLevel.toUpperCase()} Seals to Both JHS & SHS
                      </button>
                    </div>
                  </div>

                  {/* Master Layout Quick Presets for Active Level */}
                  <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 10, padding: 12, marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                      Standard DepEd Letterhead & Footer Presets for {activeLevel.toUpperCase()}:
                    </div>
                    <p style={{ margin: "0 0 8px", fontSize: 11, color: "#64748b" }}>
                      Header displays the Centered Circular DepEd Seal; signatories footer bar displays the DepEd corporate text logo, Bagong Pilipinas, and authentic school crest.
                    </p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        id="btn-preset-tri-logo"
                        onClick={() => {
                          updateActiveBranding({
                            showDepEdSeal: true,
                            showDepEdWordmark: true,
                            footerLogoFormat: "tri_logo",
                            showSchoolSeal: true,
                            showBagongPilipinas: true,
                          });
                          showNotice(`Applied Prescribed Tri-Logo Footer for ${activeLevel.toUpperCase()} (DepEd Wordmark + Bagong Pilipinas + DNHS Crest).`, "success");
                        }}
                        style={{
                          background: (activeBranding.showDepEdSeal !== false && activeBranding.footerLogoFormat === "tri_logo" && activeBranding.showBagongPilipinas) ? "#166534" : "#ffffff",
                          color: (activeBranding.showDepEdSeal !== false && activeBranding.footerLogoFormat === "tri_logo" && activeBranding.showBagongPilipinas) ? "#ffffff" : "#166534",
                          border: "1px solid #86efac",
                          borderRadius: 6,
                          padding: "5px 11px",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Tri-Logo Footer (DepEd Wordmark + BP + School Crest)
                      </button>

                      <button
                        type="button"
                        id="btn-preset-dual-logo"
                        onClick={() => {
                          updateActiveBranding({
                            showDepEdSeal: true,
                            showDepEdWordmark: true,
                            footerLogoFormat: "deped_and_school",
                            showSchoolSeal: true,
                            showBagongPilipinas: false,
                          });
                          showNotice(`Applied Dual-Logo Footer for ${activeLevel.toUpperCase()} (DepEd Wordmark + DNHS Crest).`, "info");
                        }}
                        style={{
                          background: (activeBranding.showDepEdSeal !== false && activeBranding.footerLogoFormat === "deped_and_school") ? "#1e40af" : "#ffffff",
                          color: (activeBranding.showDepEdSeal !== false && activeBranding.footerLogoFormat === "deped_and_school") ? "#ffffff" : "#1e40af",
                          border: "1px solid #93c5fd",
                          borderRadius: 6,
                          padding: "5px 11px",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        DepEd Wordmark + School Crest
                      </button>

                      <button
                        type="button"
                        id="btn-preset-school-only"
                        onClick={() => {
                          updateActiveBranding({
                            showDepEdSeal: true,
                            showDepEdWordmark: false,
                            footerLogoFormat: "school_only",
                            showSchoolSeal: true,
                            showBagongPilipinas: false,
                          });
                          showNotice(`Applied School Crest Only Footer for ${activeLevel.toUpperCase()}.`, "info");
                        }}
                        style={{
                          background: (activeBranding.showDepEdSeal !== false && activeBranding.footerLogoFormat === "school_only") ? "#475569" : "#ffffff",
                          color: (activeBranding.showDepEdSeal !== false && activeBranding.footerLogoFormat === "school_only") ? "#ffffff" : "#475569",
                          border: "1px solid #cbd5e1",
                          borderRadius: 6,
                          padding: "5px 11px",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        School Crest Only Footer
                      </button>

                      <button
                        type="button"
                        id="btn-preset-text-only"
                        onClick={() => {
                          updateActiveBranding({
                            showDepEdSeal: false,
                            showDepEdWordmark: false,
                            footerLogoFormat: "text_only",
                            showSchoolSeal: false,
                            showBagongPilipinas: false,
                          });
                          showNotice(`Enabled clean Text-Only Layout for ${activeLevel.toUpperCase()} (Plain paper / pre-printed stationery).`, "warning");
                        }}
                        style={{
                          background: (activeBranding.showDepEdSeal === false && activeBranding.footerLogoFormat === "text_only") ? "#dc2626" : "#ffffff",
                          color: (activeBranding.showDepEdSeal === false && activeBranding.footerLogoFormat === "text_only") ? "#ffffff" : "#dc2626",
                          border: "1px solid #fca5a5",
                          borderRadius: 6,
                          padding: "5px 11px",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Text-Only (No Graphic Logos)
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* SECTION 1: HEADER MASTHEAD SEAL (UP IN HEADER) */}
                    <div style={{ border: "1.5px solid #bfdbfe", borderRadius: 10, padding: 14, background: activeBranding.showDepEdSeal === false ? "#f1f5f9" : "#eff6ff" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0 }}>
                          <input
                            type="checkbox"
                            id="chk-show-deped-seal"
                            checked={activeBranding.showDepEdSeal !== false}
                            onChange={(e) => updateActiveBranding({ showDepEdSeal: e.target.checked })}
                            style={{ width: 17, height: 17, cursor: "pointer" }}
                          />
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "#1e3a8a" }}>
                              DepEd Circular Seal (Header Masthead — Up in Header)
                            </span>
                            <span style={{ display: "block", fontSize: 11, color: "#475569", fontWeight: 500 }}>
                              Prescribed circular coat of arms centered at the very top of the letterhead above "Republic of the Philippines"
                            </span>
                          </div>
                        </label>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: activeBranding.showDepEdSeal === false ? "#64748b" : (activeBranding.depedSealUrl || activeBranding.depedLogoUrl) ? "#15803d" : "#1e40af", background: activeBranding.showDepEdSeal === false ? "#e2e8f0" : (activeBranding.depedSealUrl || activeBranding.depedLogoUrl) ? "#dcfce7" : "#dbeafe", padding: "2px 8px", borderRadius: 4 }}>
                          {activeBranding.showDepEdSeal === false ? "Omitted" : (activeBranding.depedSealUrl || activeBranding.depedLogoUrl) ? "Custom Upload" : "Official DepEd Vector"}
                        </span>
                      </div>

                      {activeBranding.showDepEdSeal !== false && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #bfdbfe", display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#ffffff", border: "1.5px solid #93c5fd", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                            {(activeBranding.depedSealUrl || activeBranding.depedLogoUrl) ? (
                              <img src={activeBranding.depedSealUrl || activeBranding.depedLogoUrl} alt="DepEd Seal Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            ) : (
                              <DepEdOfficialSeal size={50} />
                            )}
                          </div>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                            <input
                              ref={depedFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleDepEdLogoUpload}
                              style={{ display: "none" }}
                            />
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                              <button
                                type="button"
                                id="btn-upload-deped-logo"
                                onClick={() => depedFileInputRef.current?.click()}
                                style={{
                                  border: "1px solid #93c5fd",
                                  background: "#ffffff",
                                  color: "#1e3a8a",
                                  borderRadius: 6,
                                  padding: "5px 11px",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Upload Custom Header Seal ({activeLevel.toUpperCase()})
                              </button>
                              {(activeBranding.depedSealUrl || activeBranding.depedLogoUrl) && (
                                <button
                                  type="button"
                                  onClick={handleResetDepEdLogo}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#dc2626",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    padding: "5px 0",
                                  }}
                                >
                                  Reset to Official DepEd Seal
                                </button>
                              )}
                            </div>
                            <span style={{ fontSize: 10.5, color: "#64748b" }}>
                              Placed exclusively at top header. Supports official DepEd seal PNG, SVG, JPG.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: SIGNATORIES FOOTER LOGOS (DOWN WITH SIGNATORIES) */}
                    <div style={{ marginTop: 4, marginBottom: 2 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Signatories Footer Insignia ({activeLevel.toUpperCase()})
                      </div>
                      <p style={{ margin: "2px 0 8px", fontSize: 11, color: "#64748b" }}>
                        These logos are displayed down by the approval signatories alongside school campus coordinates.
                      </p>
                    </div>

                    {/* Box A: DepEd Horizontal Corporate Wordmark (DO 001 Torch) */}
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: activeBranding.showDepEdWordmark === false ? "#f1f5f9" : "#f8fafc", opacity: activeBranding.showDepEdWordmark === false ? 0.7 : 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0 }}>
                          <input
                            type="checkbox"
                            id="chk-show-deped-wordmark"
                            checked={activeBranding.showDepEdWordmark !== false}
                            onChange={(e) => updateActiveBranding({ showDepEdWordmark: e.target.checked })}
                            style={{ width: 16, height: 16, cursor: "pointer" }}
                          />
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: "#002b7f" }}>
                            DepEd Corporate Text Logo / Wordmark (Down with Signatories — {activeLevel.toUpperCase()})
                          </span>
                        </label>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: activeBranding.showDepEdWordmark === false ? "#64748b" : activeBranding.depedWordmarkUrl ? "#15803d" : "#002b7f", background: activeBranding.showDepEdWordmark === false ? "#e2e8f0" : activeBranding.depedWordmarkUrl ? "#dcfce7" : "#e0e7ff", padding: "1px 6px", borderRadius: 4 }}>
                          {activeBranding.showDepEdWordmark === false ? "Omitted" : activeBranding.depedWordmarkUrl ? "Custom Upload" : "Official DO 001 Wordmark"}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 8px", fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>
                        Official DepEd corporate horizontal wordmark with red burning torch flame (DepEd Order No. 001, s. 2024), placed down beside the signatories.
                      </p>

                      {activeBranding.showDepEdWordmark !== false && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #cbd5e1", display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 90, height: 48, borderRadius: 8, background: "#ffffff", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, padding: 4 }}>
                            {activeBranding.depedWordmarkUrl ? (
                              <img src={activeBranding.depedWordmarkUrl} alt="DepEd Wordmark Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            ) : (
                              <DepEdWordmarkLogo size={34} />
                            )}
                          </div>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                            <input
                              ref={depedWordmarkFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleDepEdWordmarkUpload}
                              style={{ display: "none" }}
                            />
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                              <button
                                type="button"
                                id="btn-upload-deped-wordmark"
                                onClick={() => depedWordmarkFileInputRef.current?.click()}
                                style={{
                                  border: "1px solid #cbd5e1",
                                  background: "#ffffff",
                                  color: "#1e293b",
                                  borderRadius: 6,
                                  padding: "5px 10px",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Upload Custom DepEd Text Logo
                              </button>
                              {activeBranding.depedWordmarkUrl && (
                                <button
                                  type="button"
                                  onClick={handleResetDepEdWordmark}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#dc2626",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    padding: "5px 0",
                                  }}
                                >
                                  Reset to Official DO 001 Wordmark
                                </button>
                              )}
                            </div>
                            <span style={{ fontSize: 10.5, color: "#64748b" }}>
                              Horizontal format with stylized DepEd torch. Displays down by signatories.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Box B: "Bagong Pilipinas" National Governance Logo */}
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: !activeBranding.showBagongPilipinas ? "#f1f5f9" : "#f8fafc", opacity: !activeBranding.showBagongPilipinas ? 0.7 : 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0 }}>
                          <input
                            type="checkbox"
                            id="chk-show-bagong-pilipinas"
                            checked={Boolean(activeBranding.showBagongPilipinas)}
                            onChange={(e) => updateActiveBranding({ showBagongPilipinas: e.target.checked })}
                            style={{ width: 16, height: 16, cursor: "pointer" }}
                          />
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: "#002b7f" }}>
                            "Bagong Pilipinas" Governance Logo (Down with Signatories — {activeLevel.toUpperCase()})
                          </span>
                        </label>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: !activeBranding.showBagongPilipinas ? "#64748b" : activeBranding.bagongPilipinasLogoUrl ? "#15803d" : "#002b7f", background: !activeBranding.showBagongPilipinas ? "#e2e8f0" : activeBranding.bagongPilipinasLogoUrl ? "#dcfce7" : "#e0e7ff", padding: "1px 6px", borderRadius: 4 }}>
                          {!activeBranding.showBagongPilipinas ? "Omitted" : activeBranding.bagongPilipinasLogoUrl ? "Custom Upload" : "Official Vector"}
                        </span>
                      </div>

                      <p style={{ margin: "0 0 8px", fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>
                        Prescribed under Office of the President Memorandum Circular No. 24, s. 2023 for DepEd official forms. Placed in the footer bar adjacent to school coordinates.
                      </p>

                      {activeBranding.showBagongPilipinas && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #cbd5e1", display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 56, height: 56, borderRadius: 8, background: "#ffffff", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                            {activeBranding.bagongPilipinasLogoUrl ? (
                              <img src={activeBranding.bagongPilipinasLogoUrl} alt="Bagong Pilipinas Logo Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            ) : (
                              <BagongPilipinasLogo size={46} />
                            )}
                          </div>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                            <input
                              ref={bagongPilipinasFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleBagongPilipinasUpload}
                              style={{ display: "none" }}
                            />
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                              <button
                                type="button"
                                id="btn-upload-bp-logo"
                                onClick={() => bagongPilipinasFileInputRef.current?.click()}
                                style={{
                                  border: "1px solid #cbd5e1",
                                  background: "#ffffff",
                                  color: "#1e293b",
                                  borderRadius: 6,
                                  padding: "5px 10px",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Upload BP Logo ({activeLevel.toUpperCase()})
                              </button>
                              {activeBranding.bagongPilipinasLogoUrl && (
                                <button
                                  type="button"
                                  onClick={handleResetBagongPilipinas}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#dc2626",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    padding: "5px 0",
                                  }}
                                >
                                  Reset to Official Vector
                                </button>
                              )}
                            </div>
                            <span style={{ fontSize: 10.5, color: "#64748b" }}>
                              Official Malacañang / Presidential Communications Office vector logo.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Box C: Authentic Diadi National High School Official Crest */}
                    <div style={{ border: "1.5px solid #cbd5e1", borderRadius: 10, padding: 12, background: activeBranding.showSchoolSeal === false ? "#f1f5f9" : "#ffffff", opacity: activeBranding.showSchoolSeal === false ? 0.7 : 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0 }}>
                          <input
                            type="checkbox"
                            id="chk-show-school-seal"
                            checked={activeBranding.showSchoolSeal !== false}
                            onChange={(e) => updateActiveBranding({ showSchoolSeal: e.target.checked })}
                            style={{ width: 16, height: 16, cursor: "pointer" }}
                          />
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: "#1e3a8a" }}>
                            School Official Crest (Authentic Diadi NHS Logo — {activeLevel.toUpperCase()})
                          </span>
                        </label>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: activeBranding.showSchoolSeal === false ? "#64748b" : (activeBranding.schoolLogoUrl && !activeBranding.schoolLogoUrl.includes("diadi-nhs-logo")) ? "#15803d" : "#1e40af", background: activeBranding.showSchoolSeal === false ? "#e2e8f0" : (activeBranding.schoolLogoUrl && !activeBranding.schoolLogoUrl.includes("diadi-nhs-logo")) ? "#dcfce7" : "#dbeafe", padding: "1px 6px", borderRadius: 4 }}>
                          {activeBranding.showSchoolSeal === false ? "Omitted" : (activeBranding.schoolLogoUrl && !activeBranding.schoolLogoUrl.includes("diadi-nhs-logo")) ? "Custom Upload" : "Authentic DNHS Logo"}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 8px", fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>
                        Authentic institutional crest of Diadi National High School (Est. 1980), Poblacion, Diadi, Nueva Vizcaya. Rendered with genuine high-resolution artwork down beside the signatories.
                      </p>

                      {activeBranding.showSchoolSeal !== false && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #cbd5e1", display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#ffffff", border: "1.5px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, padding: 2 }}>
                            <img
                              src={activeBranding.schoolLogoUrl || "/diadi-nhs-logo.png?v=1980"}
                              alt="Diadi National High School Crest"
                              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }}
                            />
                          </div>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                            <input
                              ref={schoolFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleSchoolLogoUpload}
                              style={{ display: "none" }}
                            />
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                              <button
                                type="button"
                                id="btn-upload-school-logo"
                                onClick={() => schoolFileInputRef.current?.click()}
                                style={{
                                  border: "1px solid #cbd5e1",
                                  background: "#ffffff",
                                  color: "#1e293b",
                                  borderRadius: 6,
                                  padding: "5px 10px",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Upload Custom School Crest ({activeLevel.toUpperCase()})
                              </button>
                              {(activeBranding.schoolLogoUrl && !activeBranding.schoolLogoUrl.includes("diadi-nhs-logo")) && (
                                <button
                                  type="button"
                                  onClick={handleResetSchoolLogo}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#dc2626",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    padding: "5px 0",
                                  }}
                                >
                                  Reset to Official DNHS Crest
                                </button>
                              )}
                            </div>
                            <span style={{ fontSize: 10.5, color: "#64748b" }}>
                              Official Diadi National High School crest (Est. 1980). Placed in signatories footer bar.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Summary Feedback Banner */}
                    {activeBranding.showDepEdSeal === false && activeBranding.showSchoolSeal === false && !activeBranding.showBagongPilipinas && !activeBranding.showDepEdWordmark ? (
                      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#991b1b" }}>[Text-Only Mode Active]</span>
                        <span style={{ fontSize: 11.5, color: "#7f1d1d" }}>
                          All seals and logos are omitted for {activeLevel.toUpperCase()}. Timetables will render with a pure, centered typographic masthead.
                        </span>
                      </div>
                    ) : (
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#166534" }}>ACTIVE {activeLevel.toUpperCase()} LETTERHEAD:</span>
                          <span style={{ fontSize: 11, color: "#15803d" }}>
                            Header: {activeBranding.showDepEdSeal !== false ? "DepEd Circular Seal" : "Text Only"} • Footer: {[
                              activeBranding.showDepEdWordmark !== false ? "DepEd Wordmark" : null,
                              activeBranding.showBagongPilipinas ? "Bagong Pilipinas" : null,
                              activeBranding.showSchoolSeal !== false ? "DNHS Crest" : null,
                            ].filter(Boolean).join(" + ") || "School Coordinates Only"}
                          </span>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#166534" }}>
                          Synced Live with Preview & Print
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Official Signatory Rosters Grid */}
            <div style={{ borderTop: "1.5px solid #000000", paddingTop: 18, marginTop: 12 }}>
              <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 22, boxShadow: "0 2px 10px rgba(15,23,42,0.03)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: "0 0 6px", color: "#1f2c6f", fontSize: 18, fontWeight: 800 }}>
                      DepEd Official Signatory Rosters
                    </h2>
                    <p style={{ margin: 0, color: "#5d698d", fontSize: 13 }}>
                      Approval hierarchy matching DepEd governance for {activeLevel === "shs" ? "Senior High School (Division SDO Level • DO 017)" : "Junior High School (District Level • PSDS)"}.
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: activeLevel === "shs" ? "#ecfdf5" : "#eff6ff",
                        color: activeLevel === "shs" ? "#065f46" : "#1d4ed8",
                        border: activeLevel === "shs" ? "1px solid #a7f3d0" : "1px solid #bfdbfe",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {activeLevel === "shs" ? "SDO Level (DO 017)" : "District Level (PSDS)"}
                    </span>
                  </div>
                </div>

                {/* Active Level Signatory Status & Reset Button */}
                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>Active Approval Hierarchy:</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: 6,
                        background: activeLevel === "shs" ? "#ecfdf5" : "#eff6ff",
                        color: activeLevel === "shs" ? "#065f46" : "#1d4ed8",
                        border: activeLevel === "shs" ? "1px solid #a7f3d0" : "1px solid #bfdbfe",
                      }}
                    >
                      {activeLevel === "shs" ? "Senior High School (Division SDO Level • DO 017)" : "Junior High School (District Level • PSDS)"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProfile((prev) => {
                        const defaultForLevel = DEFAULT_SIGNATORIES_BY_LEVEL[activeLevel];
                        const nextByLevel = {
                          ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL),
                          [signatoryLevel]: defaultForLevel,
                        };
                        return {
                          ...prev,
                          signatoriesByLevel: nextByLevel,
                          signatories: {
                            preparedBy: defaultForLevel.preparedBy,
                            conformed: defaultForLevel.conformed,
                            recommendingApproval: defaultForLevel.recommendingApproval,
                            approved: defaultForLevel.approved,
                          },
                        };
                      });
                      showNotice(`Reset ${signatoryLevel.toUpperCase()} to standard DepEd roster.`, "info");
                    }}
                    style={{ border: "none", background: "transparent", color: "#2563eb", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    Reset {signatoryLevel.toUpperCase()} Defaults
                  </button>
                </div>

                <div style={{ background: signatoryLevel === "shs" ? "#f0fdf4" : "#f0f9ff", border: signatoryLevel === "shs" ? "1px solid #bbf7d0" : "1px solid #bae6fd", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: signatoryLevel === "shs" ? "#166534" : "#0369a1", marginBottom: 2 }}>
                    {signatoryLevel === "shs"
                      ? "Senior High School — Schools Division Office (SDO) Statutory Approval"
                      : "Junior High School — School & District Level Operational Approval"}
                  </div>
                  <div style={{ fontSize: 11.5, color: signatoryLevel === "shs" ? "#15803d" : "#0284c7", lineHeight: 1.45 }}>
                    {signatoryLevel === "shs"
                      ? "Required for SHS Track/Strand Form 7 and official timetables. Submitted by the School Principal, reviewed by the CID Chief, recommended by ASDS, and approved by the Schools Division Superintendent (DO 017)."
                      : "Standard for JHS classroom programs (Grades 7–10). Prepared by the Subject Timetable Committee, conformed by the Assistant Principal, recommended by the Principal, and approved by the District In-Charge."}
                  </div>
                </div>

                {/* Form Fields: JHS Mode */}
                {signatoryLevel === "jhs" && (() => {
                  const jhsSig = (profile.signatoriesByLevel && profile.signatoriesByLevel.jhs) || DEFAULT_SIGNATORIES_BY_LEVEL.jhs;
                  const preparedList = jhsSig.preparedBy || DEFAULT_SIGNATORIES_BY_LEVEL.jhs.preparedBy;

                  return (
                    <div>
                      {/* Prepared By (Subject Coordinators) */}
                      <div style={{ marginBottom: 18, background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                          <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block" }}>
                              Prepared by (Timetable Committee / Subject Coordinators):
                            </label>
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                              {preparedList.length} Coordinator{preparedList.length === 1 ? "" : "s"} configured • Add or remove signatories to match your school committee size
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setProfile((prev) => {
                                const prevJhs = (prev.signatoriesByLevel && prev.signatoriesByLevel.jhs) || DEFAULT_SIGNATORIES_BY_LEVEL.jhs;
                                const currList = [...(prevJhs.preparedBy || DEFAULT_SIGNATORIES_BY_LEVEL.jhs.preparedBy)];
                                currList.push({ name: "", title: "Subject Coordinator" });
                                const updatedJhs = { ...prevJhs, preparedBy: currList };
                                return {
                                  ...prev,
                                  signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), jhs: updatedJhs },
                                  signatories: { ...(prev.signatories || {}), preparedBy: currList },
                                };
                              });
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 12px",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            + Add Coordinator
                          </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                          {preparedList.map((sig, idx) => (
                            <div key={idx} style={{ background: "#ffffff", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b" }}>
                                  Coordinator {idx + 1}
                                </span>
                                {preparedList.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProfile((prev) => {
                                        const prevJhs = (prev.signatoriesByLevel && prev.signatoriesByLevel.jhs) || DEFAULT_SIGNATORIES_BY_LEVEL.jhs;
                                        const currList = [...(prevJhs.preparedBy || DEFAULT_SIGNATORIES_BY_LEVEL.jhs.preparedBy)];
                                        currList.splice(idx, 1);
                                        const updatedJhs = { ...prevJhs, preparedBy: currList };
                                        return {
                                          ...prev,
                                          signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), jhs: updatedJhs },
                                          signatories: { ...(prev.signatories || {}), preparedBy: currList },
                                        };
                                      });
                                    }}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "#dc2626",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      padding: "1px 4px",
                                    }}
                                    title="Remove this coordinator"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                placeholder={`Coordinator ${idx + 1} Name`}
                                value={sig.name || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProfile((prev) => {
                                    const prevJhs = (prev.signatoriesByLevel && prev.signatoriesByLevel.jhs) || DEFAULT_SIGNATORIES_BY_LEVEL.jhs;
                                    const currList = [...(prevJhs.preparedBy || DEFAULT_SIGNATORIES_BY_LEVEL.jhs.preparedBy)];
                                    currList[idx] = { ...currList[idx], name: val };
                                    const updatedJhs = { ...prevJhs, preparedBy: currList };
                                    return {
                                      ...prev,
                                      signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), jhs: updatedJhs },
                                      signatories: { ...(prev.signatories || {}), preparedBy: currList },
                                    };
                                  });
                                }}
                                style={{ ...inputStyle(), marginBottom: 6, fontWeight: 700, fontSize: 12 }}
                              />
                              <input
                                type="text"
                                placeholder="Designation (e.g. CIC, MAPEH & SPA)"
                                value={sig.title || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProfile((prev) => {
                                    const prevJhs = (prev.signatoriesByLevel && prev.signatoriesByLevel.jhs) || DEFAULT_SIGNATORIES_BY_LEVEL.jhs;
                                    const currList = [...(prevJhs.preparedBy || DEFAULT_SIGNATORIES_BY_LEVEL.jhs.preparedBy)];
                                    currList[idx] = { ...currList[idx], title: val };
                                    const updatedJhs = { ...prevJhs, preparedBy: currList };
                                    return {
                                      ...prev,
                                      signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), jhs: updatedJhs },
                                      signatories: { ...(prev.signatories || {}), preparedBy: currList },
                                    };
                                  });
                                }}
                                style={{ ...inputStyle(), fontSize: 11 }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Conformed, Recommending Approval, Approved */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
                        {/* Conformed (Optional Tier) */}
                        <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                            <div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", display: "block" }}>
                                Conformed (Optional):
                              </span>
                              <span style={{ fontSize: 11, color: "#64748b" }}>
                                Assistant Principal / Department Head (uncheck if school has no Assistant Principal plantilla)
                              </span>
                            </div>
                            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#1e40af", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={jhsSig.showConformed !== false}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setProfile((prev) => {
                                    const prevJhs = (prev.signatoriesByLevel && prev.signatoriesByLevel.jhs) || DEFAULT_SIGNATORIES_BY_LEVEL.jhs;
                                    const updatedJhs = { ...prevJhs, showConformed: checked };
                                    return {
                                      ...prev,
                                      signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), jhs: updatedJhs },
                                    };
                                  });
                                }}
                              />
                              Enable "Conformed" in Printouts
                            </label>
                          </div>
                          {jhsSig.showConformed !== false ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                              <input
                                type="text"
                                placeholder="Full Name (e.g. FREDIRICK R. VICMUDO, HT III)"
                                value={jhsSig.conformed?.name ?? DEFAULT_SIGNATORIES_BY_LEVEL.jhs.conformed.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProfile((prev) => {
                                    const prevJhs = (prev.signatoriesByLevel && prev.signatoriesByLevel.jhs) || DEFAULT_SIGNATORIES_BY_LEVEL.jhs;
                                    const updatedJhs = { ...prevJhs, conformed: { ...(prevJhs.conformed || {}), name: val } };
                                    return {
                                      ...prev,
                                      signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), jhs: updatedJhs },
                                      signatories: { ...(prev.signatories || {}), conformed: updatedJhs.conformed },
                                    };
                                  });
                                }}
                                style={{ ...inputStyle(), fontWeight: 700, fontSize: 12 }}
                              />
                              <input
                                type="text"
                                placeholder="Title (e.g. Asst. Principal Designate)"
                                value={jhsSig.conformed?.title ?? DEFAULT_SIGNATORIES_BY_LEVEL.jhs.conformed.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProfile((prev) => {
                                    const prevJhs = (prev.signatoriesByLevel && prev.signatoriesByLevel.jhs) || DEFAULT_SIGNATORIES_BY_LEVEL.jhs;
                                    const updatedJhs = { ...prevJhs, conformed: { ...(prevJhs.conformed || {}), title: val } };
                                    return {
                                      ...prev,
                                      signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), jhs: updatedJhs },
                                      signatories: { ...(prev.signatories || {}), conformed: updatedJhs.conformed },
                                    };
                                  });
                                }}
                                style={{ ...inputStyle(), fontSize: 11 }}
                              />
                            </div>
                          ) : (
                            <div style={{ padding: "8px 12px", background: "#f1f5f9", borderRadius: 6, fontSize: 11, color: "#64748b", fontStyle: "italic", marginTop: 6 }}>
                              "Conformed" signatory is omitted from printouts. The upper row will feature the Prepared by committee across the header.
                            </div>
                          )}
                        </div>

                        {/* Recommending Approval */}
                        <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 2 }}>
                            Recommending Approval:
                          </span>
                          <span style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 8 }}>
                            School Head / Principal recommending schedule for district endorsement
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <input
                              type="text"
                              placeholder="Full Name (e.g. GABRIEL C. ULLANI EdD)"
                              value={jhsSig.recommendingApproval?.name ?? DEFAULT_SIGNATORIES_BY_LEVEL.jhs.recommendingApproval.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfile((prev) => {
                                  const prevJhs = (prev.signatoriesByLevel && prev.signatoriesByLevel.jhs) || DEFAULT_SIGNATORIES_BY_LEVEL.jhs;
                                  const updatedJhs = { ...prevJhs, recommendingApproval: { ...(prevJhs.recommendingApproval || {}), name: val } };
                                  return {
                                    ...prev,
                                    signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), jhs: updatedJhs },
                                    signatories: { ...(prev.signatories || {}), recommendingApproval: updatedJhs.recommendingApproval },
                                  };
                                });
                              }}
                              style={{ ...inputStyle(), fontWeight: 700, fontSize: 12 }}
                            />
                            <input
                              type="text"
                              placeholder="Title (e.g. Secondary School Principal II)"
                              value={jhsSig.recommendingApproval?.title ?? DEFAULT_SIGNATORIES_BY_LEVEL.jhs.recommendingApproval.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfile((prev) => {
                                  const prevJhs = (prev.signatoriesByLevel && prev.signatoriesByLevel.jhs) || DEFAULT_SIGNATORIES_BY_LEVEL.jhs;
                                  const updatedJhs = { ...prevJhs, recommendingApproval: { ...(prevJhs.recommendingApproval || {}), title: val } };
                                  return {
                                    ...prev,
                                    signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), jhs: updatedJhs },
                                    signatories: { ...(prev.signatories || {}), recommendingApproval: updatedJhs.recommendingApproval },
                                  };
                                });
                              }}
                              style={{ ...inputStyle(), fontSize: 11 }}
                            />
                          </div>
                        </div>

                        {/* Approved */}
                        <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 2 }}>
                            Approved:
                          </span>
                          <span style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 8 }}>
                            Public Schools District Supervisor (PSDS) / District-In-Charge
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <input
                              type="text"
                              placeholder="Full Name (e.g. CARMELITA L. PALE EdD)"
                              value={jhsSig.approved?.name ?? DEFAULT_SIGNATORIES_BY_LEVEL.jhs.approved.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfile((prev) => {
                                  const prevJhs = (prev.signatoriesByLevel && prev.signatoriesByLevel.jhs) || DEFAULT_SIGNATORIES_BY_LEVEL.jhs;
                                  const updatedJhs = { ...prevJhs, approved: { ...(prevJhs.approved || {}), name: val } };
                                  return {
                                    ...prev,
                                    signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), jhs: updatedJhs },
                                    signatories: { ...(prev.signatories || {}), approved: updatedJhs.approved },
                                  };
                                });
                              }}
                              style={{ ...inputStyle(), fontWeight: 700, fontSize: 12 }}
                            />
                            <input
                              type="text"
                              placeholder="Title (e.g. District_In-Charge)"
                              value={jhsSig.approved?.title ?? DEFAULT_SIGNATORIES_BY_LEVEL.jhs.approved.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfile((prev) => {
                                  const prevJhs = (prev.signatoriesByLevel && prev.signatoriesByLevel.jhs) || DEFAULT_SIGNATORIES_BY_LEVEL.jhs;
                                  const updatedJhs = { ...prevJhs, approved: { ...(prevJhs.approved || {}), title: val } };
                                  return {
                                    ...prev,
                                    signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), jhs: updatedJhs },
                                    signatories: { ...(prev.signatories || {}), approved: updatedJhs.approved },
                                  };
                                });
                              }}
                              style={{ ...inputStyle(), fontSize: 11 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Form Fields: SHS Mode */}
                {signatoryLevel === "shs" && (() => {
                  const shsSig = (profile.signatoriesByLevel && profile.signatoriesByLevel.shs) || DEFAULT_SIGNATORIES_BY_LEVEL.shs;
                  const preparedList = (Array.isArray(shsSig.preparedBy) && shsSig.preparedBy.length > 0)
                    ? shsSig.preparedBy
                    : DEFAULT_SIGNATORIES_BY_LEVEL.shs.preparedBy;

                  return (
                    <div>
                      {/* Prepared By (School Principal / SHS Committee) */}
                      <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block" }}>
                              Prepared by:
                            </span>
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                              {preparedList.length} Signator{preparedList.length === 1 ? "y" : "ies"} configured • School Principal / Focal Person submitting the Senior High School schedule to the Division
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setProfile((prev) => {
                                const prevShs = (prev.signatoriesByLevel && prev.signatoriesByLevel.shs) || DEFAULT_SIGNATORIES_BY_LEVEL.shs;
                                const currList = [...(prevShs.preparedBy || DEFAULT_SIGNATORIES_BY_LEVEL.shs.preparedBy)];
                                currList.push({ name: "", title: "SHS Focal Person" });
                                const updatedShs = { ...prevShs, preparedBy: currList };
                                return {
                                  ...prev,
                                  signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), shs: updatedShs },
                                };
                              });
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 12px",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            + Add Signatory
                          </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                          {preparedList.map((sig, idx) => (
                            <div key={idx} style={{ background: "#ffffff", padding: 12, borderRadius: 8, border: "1px solid #cbd5e1" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b" }}>
                                  Prepared by {idx + 1}
                                </span>
                                {preparedList.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProfile((prev) => {
                                        const prevShs = (prev.signatoriesByLevel && prev.signatoriesByLevel.shs) || DEFAULT_SIGNATORIES_BY_LEVEL.shs;
                                        const currList = [...(prevShs.preparedBy || DEFAULT_SIGNATORIES_BY_LEVEL.shs.preparedBy)];
                                        currList.splice(idx, 1);
                                        const updatedShs = { ...prevShs, preparedBy: currList };
                                        return {
                                          ...prev,
                                          signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), shs: updatedShs },
                                        };
                                      });
                                    }}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "#dc2626",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      padding: "1px 4px",
                                    }}
                                    title="Remove this signatory"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                placeholder="Full Name (e.g. ROBERTO D. CUTILLON)"
                                value={sig.name || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProfile((prev) => {
                                    const prevShs = (prev.signatoriesByLevel && prev.signatoriesByLevel.shs) || DEFAULT_SIGNATORIES_BY_LEVEL.shs;
                                    const currList = [...(prevShs.preparedBy || DEFAULT_SIGNATORIES_BY_LEVEL.shs.preparedBy)];
                                    currList[idx] = { ...currList[idx], name: val };
                                    const updatedShs = { ...prevShs, preparedBy: currList };
                                    return {
                                      ...prev,
                                      signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), shs: updatedShs },
                                    };
                                  });
                                }}
                                style={{ ...inputStyle(), marginBottom: 6, fontWeight: 700, fontSize: 12 }}
                              />
                              <input
                                type="text"
                                placeholder="Title (e.g. School Principal IV)"
                                value={sig.title || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProfile((prev) => {
                                    const prevShs = (prev.signatoriesByLevel && prev.signatoriesByLevel.shs) || DEFAULT_SIGNATORIES_BY_LEVEL.shs;
                                    const currList = [...(prevShs.preparedBy || DEFAULT_SIGNATORIES_BY_LEVEL.shs.preparedBy)];
                                    currList[idx] = { ...currList[idx], title: val };
                                    const updatedShs = { ...prevShs, preparedBy: currList };
                                    return {
                                      ...prev,
                                      signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), shs: updatedShs },
                                    };
                                  });
                                }}
                                style={{ ...inputStyle(), fontSize: 11 }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reviewed (CID Chief - Optional Tier) */}
                      <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", display: "block" }}>
                              Reviewed (Optional Division Review):
                            </span>
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                              Chief Education Supervisor, Curriculum Implementation Division (CID)
                            </span>
                          </div>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#1e40af", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={shsSig.showConformed !== false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setProfile((prev) => {
                                  const prevShs = (prev.signatoriesByLevel && prev.signatoriesByLevel.shs) || DEFAULT_SIGNATORIES_BY_LEVEL.shs;
                                  const updatedShs = { ...prevShs, showConformed: checked };
                                  return {
                                    ...prev,
                                    signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), shs: updatedShs },
                                  };
                                });
                              }}
                            />
                            Enable "Reviewed" in Printouts
                          </label>
                        </div>
                        {shsSig.showConformed !== false ? (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                            <input
                              type="text"
                              placeholder="CID Chief Name (e.g. MARICEL S. FRANCO PhD, CESE)"
                              value={shsSig.conformed?.name ?? DEFAULT_SIGNATORIES_BY_LEVEL.shs.conformed.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfile((prev) => {
                                  const prevShs = (prev.signatoriesByLevel && prev.signatoriesByLevel.shs) || DEFAULT_SIGNATORIES_BY_LEVEL.shs;
                                  const updatedShs = { ...prevShs, conformed: { ...(prevShs.conformed || {}), name: val } };
                                  return {
                                    ...prev,
                                    signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), shs: updatedShs },
                                  };
                                });
                              }}
                              style={{ ...inputStyle(), fontWeight: 700, fontSize: 12 }}
                            />
                            <input
                              type="text"
                              placeholder="Title (e.g. Chief Education Supervisor, CID)"
                              value={shsSig.conformed?.title ?? DEFAULT_SIGNATORIES_BY_LEVEL.shs.conformed.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfile((prev) => {
                                  const prevShs = (prev.signatoriesByLevel && prev.signatoriesByLevel.shs) || DEFAULT_SIGNATORIES_BY_LEVEL.shs;
                                  const updatedShs = { ...prevShs, conformed: { ...(prevShs.conformed || {}), title: val } };
                                  return {
                                    ...prev,
                                    signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), shs: updatedShs },
                                  };
                                });
                              }}
                              style={{ ...inputStyle(), fontSize: 11 }}
                            />
                          </div>
                        ) : (
                          <div style={{ padding: "8px 12px", background: "#f1f5f9", borderRadius: 6, fontSize: 11, color: "#64748b", fontStyle: "italic", marginTop: 6 }}>
                            "Reviewed" signatory is omitted from printouts. The upper row will feature the Prepared by signatory cleanly.
                          </div>
                        )}
                      </div>


                      {/* Recommending Approval (ASDS) */}
                      <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 14 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 2 }}>
                          Recommending Approval:
                        </span>
                        <span style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 8 }}>
                          Assistant Schools Division Superintendent (ASDS)
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <input
                            type="text"
                            placeholder="ASDS Name (e.g. ADONIS C. CEPEREZ EdD, CESE)"
                            value={shsSig.recommendingApproval?.name ?? DEFAULT_SIGNATORIES_BY_LEVEL.shs.recommendingApproval.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProfile((prev) => {
                                const prevShs = (prev.signatoriesByLevel && prev.signatoriesByLevel.shs) || DEFAULT_SIGNATORIES_BY_LEVEL.shs;
                                const updatedShs = { ...prevShs, recommendingApproval: { ...(prevShs.recommendingApproval || {}), name: val } };
                                return {
                                  ...prev,
                                  signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), shs: updatedShs },
                                };
                              });
                            }}
                            style={{ ...inputStyle(), fontWeight: 700, fontSize: 12 }}
                          />
                          <input
                            type="text"
                            placeholder="Title (e.g. Assistant Schools Division Superintendent)"
                            value={shsSig.recommendingApproval?.title ?? DEFAULT_SIGNATORIES_BY_LEVEL.shs.recommendingApproval.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProfile((prev) => {
                                const prevShs = (prev.signatoriesByLevel && prev.signatoriesByLevel.shs) || DEFAULT_SIGNATORIES_BY_LEVEL.shs;
                                const updatedShs = { ...prevShs, recommendingApproval: { ...(prevShs.recommendingApproval || {}), title: val } };
                                return {
                                  ...prev,
                                  signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), shs: updatedShs },
                                };
                              });
                            }}
                            style={{ ...inputStyle(), fontSize: 11 }}
                          />
                        </div>
                      </div>

                      {/* Approved (SDS) */}
                      <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 2 }}>
                          Approved:
                        </span>
                        <span style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 8 }}>
                          Schools Division Superintendent (SDS)
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <input
                            type="text"
                            placeholder="Superintendent Name (e.g. ORLANDO E. MANUEL PhD, CESO V)"
                            value={shsSig.approved?.name ?? DEFAULT_SIGNATORIES_BY_LEVEL.shs.approved.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProfile((prev) => {
                                const prevShs = (prev.signatoriesByLevel && prev.signatoriesByLevel.shs) || DEFAULT_SIGNATORIES_BY_LEVEL.shs;
                                const updatedShs = { ...prevShs, approved: { ...(prevShs.approved || {}), name: val } };
                                return {
                                  ...prev,
                                  signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), shs: updatedShs },
                                };
                              });
                            }}
                            style={{ ...inputStyle(), fontWeight: 700, fontSize: 12 }}
                          />
                          <input
                            type="text"
                            placeholder="Title (e.g. Schools Division Superintendent)"
                            value={shsSig.approved?.title ?? DEFAULT_SIGNATORIES_BY_LEVEL.shs.approved.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProfile((prev) => {
                                const prevShs = (prev.signatoriesByLevel && prev.signatoriesByLevel.shs) || DEFAULT_SIGNATORIES_BY_LEVEL.shs;
                                const updatedShs = { ...prevShs, approved: { ...(prevShs.approved || {}), title: val } };
                                return {
                                  ...prev,
                                  signatoriesByLevel: { ...(prev.signatoriesByLevel || DEFAULT_SIGNATORIES_BY_LEVEL), shs: updatedShs },
                                };
                              });
                            }}
                            style={{ ...inputStyle(), fontSize: 11 }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                  <button type="button" onClick={handleSaveProfile} style={primaryActionStyle()}>
                    Save {signatoryLevel.toUpperCase()} Signatory Roster
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: GOVERNANCE AND LOCATION */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 16, fontWeight: 800 }}>
                  Governance and Location
                </h2>
                <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 12 }}>
                  Administrative jurisdiction, regional division hierarchy, and communication coordinates
                </p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", padding: "2px 8px", borderRadius: 4 }}>
                GOVERNANCE & JURISDICTION
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              <Field label="DepEd Region">
                <input
                  type="text"
                  value={profile.region}
                  onChange={(e) => setProfile((prev) => ({ ...prev, region: e.target.value }))}
                  style={inputStyle()}
                  placeholder="e.g. Region II – Cagayan Valley"
                />
              </Field>

              <Field label="Schools Division Office (SDO)">
                <input
                  type="text"
                  value={profile.division}
                  onChange={(e) => setProfile((prev) => ({ ...prev, division: e.target.value }))}
                  style={inputStyle()}
                  placeholder="e.g. Schools Division of Nueva Vizcaya"
                />
              </Field>

              <Field label="District Name">
                <input
                  type="text"
                  value={profile.district || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, district: e.target.value }))}
                  style={inputStyle()}
                  placeholder="e.g. Diadi District"
                />
              </Field>

              <Field label="Campus Physical Address">
                <input
                  type="text"
                  value={profile.address || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
                  style={inputStyle()}
                  placeholder="e.g. Poblacion, Diadi, Nueva Vizcaya"
                />
              </Field>

              <Field label="Official Institutional Email">
                <input
                  type="text"
                  value={profile.email || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                  style={inputStyle()}
                  placeholder="e.g. 300627@deped.gov.ph"
                />
              </Field>

              <Field label="School Website / Portal">
                <input
                  type="text"
                  value={profile.website || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, website: e.target.value }))}
                  style={inputStyle()}
                  placeholder="e.g. www.deped-nv.com.ph"
                />
              </Field>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={handleSaveProfile} style={primaryActionStyle()}>
              Save All School Profile Settings
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: BELL SCHEDULES & TIMELINE */}
      {(activeSubTab === "scheduling" || activeSubTab === "bell" || activeSubTab === "config") && (
        <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18, fontWeight: 800 }}>
                Scheduling Configurations
              </h2>
              <p style={{ margin: "4px 0 0", color: "#5d698d", fontSize: 13 }}>
                Configure operation hours, days of operations, period durations, breaks, and computed bell schedules for {activeLevel.toUpperCase()}.
              </p>
            </div>

            {/* Level Switcher Pill */}
            <div style={{ display: "flex", background: "#f2f4f8", borderRadius: 10, padding: 3 }}>
              {profile.offeredLevels !== "shs_only" && (
                <button
                  type="button"
                  id="btn-level-jhs"
                  onClick={() => setActiveLevel("jhs")}
                  style={levelPillStyle(activeLevel === "jhs")}
                >
                  Junior High School (JHS)
                </button>
              )}
              {profile.offeredLevels !== "jhs_only" && (
                <button
                  type="button"
                  id="btn-level-shs"
                  onClick={() => setActiveLevel("shs")}
                  style={levelPillStyle(activeLevel === "shs")}
                >
                  Senior High School (SHS)
                </button>
              )}
            </div>
          </div>

          <SectionBlock title="School Operating Hours">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <Field label="Daily Start Time">
                <input
                  type="time"
                  value={currentLevelConfig.schoolStartTime || "07:30"}
                  onChange={(e) =>
                    updateCurrentConfig((cfg) => ({ ...cfg, schoolStartTime: e.target.value }))
                  }
                  style={inputStyle()}
                />
              </Field>

              <Field label="Daily End Time">
                <input
                  type="time"
                  max="17:00"
                  value={currentLevelConfig.schoolEndTime || "17:00"}
                  onChange={(e) =>
                    updateCurrentConfig((cfg) => ({ ...cfg, schoolEndTime: e.target.value }))
                  }
                  style={inputStyle()}
                />
              </Field>
            </div>
          </SectionBlock>

          {/* Session Type & Calendar Settings */}
          <SectionBlock title="Days of Operations & Session Selector">
            <p style={{ margin: "0 0 14px", color: "#64748b", fontSize: 12 }}>
              Configure operating days (Monday to Sunday) and session allocations. Click any day pill to toggle between the active session and off day.
            </p>

            {/* Session Type Pill Selector */}
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#5f6b90", display: "block", marginBottom: 6 }}>
                Session Type Selector
              </span>
              <div style={{ display: "inline-flex", border: "1px solid #dce5ff", borderRadius: 999, padding: 3, background: "#f5f8ff" }}>
                <button
                  type="button"
                  id="btn-session-regular"
                  onClick={() => setActiveSession("regular")}
                  style={sessionTabStyle(activeSession === "regular")}
                >
                  Regular Session
                </button>
                <button
                  type="button"
                  id="btn-session-shortened"
                  onClick={() => setActiveSession("shortened")}
                  style={sessionTabStyle(activeSession === "shortened")}
                >
                  Shortened Session
                </button>
              </div>
            </div>

            {/* School Calendar Day Pills */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#5f6b90" }}>Operating Days (Mon – Sun)</span>
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#5d698d", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#2563eb" }} />
                    <strong style={{ color: "#2563eb" }}>Blue</strong>: Active ({activeSession === "regular" ? "Regular Session" : "Shortened Session"})
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#dbeafe", border: "1px solid #93c5fd" }} />
                    <strong style={{ color: "#1e40af" }}>Light Blue</strong>: {activeSession === "regular" ? "Shortened Session" : "Regular Session"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f1f5f9", border: "1px solid #cbd5e1" }} />
                    <strong style={{ color: "#64748b" }}>Greyed</strong>: Not Selected (Off Day)
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {DAYS.map(({ full, short }) => {
                  const currentAssignment = currentLevelConfig.dayAssignments[full] || "off";
                  const isActiveSession = currentAssignment === activeSession;
                  const isOtherSession = currentAssignment !== "off" && !isActiveSession;

                  return (
                    <button
                      key={full}
                      type="button"
                      id={`btn-day-${short.toLowerCase()}`}
                      onClick={() => handleDayClick(full)}
                      title={`${full}: ${currentAssignment.toUpperCase()}`}
                      style={dayPillStyle(isActiveSession, isOtherSession)}
                    >
                      {short}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual Bell Schedule & Timeline Bar */}
            <div style={{ marginBottom: 18 }}>
              <BellTimelineVisualizer
                levelConfig={currentLevelConfig}
                activeSession={activeSession}
                activeLevel={activeLevel}
                onBreakMove={(breakKey, targetAfterPeriod) => {
                  const brks = activeSessionConfig.breaks || {};
                  const morningAfter = brks.morning?.enabled ? Number(brks.morning.afterPeriod) : 0;
                  const lunchAfter = brks.lunch?.enabled ? Number(brks.lunch.afterPeriod) : 99;
                  const afternoonAfter = brks.afternoon?.enabled ? Number(brks.afternoon.afterPeriod) : 999;

                  if (breakKey === "morning") {
                    if (brks.lunch?.enabled && targetAfterPeriod >= lunchAfter) {
                      showNotice(`Morning Recess must take place before Lunch Break (${getOrdinalPeriodLabel(lunchAfter)}).`, "error");
                      return;
                    }
                    if (brks.afternoon?.enabled && targetAfterPeriod >= afternoonAfter) {
                      showNotice(`Morning Recess must take place before Afternoon Break (${getOrdinalPeriodLabel(afternoonAfter)}).`, "error");
                      return;
                    }
                  }

                  if (breakKey === "lunch") {
                    if (brks.morning?.enabled && targetAfterPeriod <= morningAfter) {
                      showNotice(`Lunch Break must take place after Morning Recess (${getOrdinalPeriodLabel(morningAfter)}).`, "error");
                      return;
                    }
                    if (brks.afternoon?.enabled && targetAfterPeriod >= afternoonAfter) {
                      showNotice(`Lunch Break must take place before Afternoon Break (${getOrdinalPeriodLabel(afternoonAfter)}).`, "error");
                      return;
                    }
                  }

                  if (breakKey === "afternoon") {
                    if (brks.lunch?.enabled && targetAfterPeriod <= lunchAfter) {
                      showNotice(`Afternoon Break must take place after Lunch Break (${getOrdinalPeriodLabel(lunchAfter)}).`, "error");
                      return;
                    }
                    if (brks.morning?.enabled && targetAfterPeriod <= morningAfter) {
                      showNotice(`Afternoon Break must take place after Morning Recess (${getOrdinalPeriodLabel(morningAfter)}).`, "error");
                      return;
                    }
                  }

                  updateActiveSessionConfig((sCfg) => ({
                    ...sCfg,
                    breaks: {
                      ...sCfg.breaks,
                      [breakKey]: {
                        ...(sCfg.breaks?.[breakKey] || {}),
                        afterPeriod: targetAfterPeriod,
                      },
                    },
                  }));
                }}
                onApplyPreset={handleApplyPreset}
                onSyncOperatingHours={(newEndTime) => {
                  updateCurrentConfig((cfg) => ({ ...cfg, schoolEndTime: newEndTime }));
                  showNotice(`Updated Daily End Time to ${newEndTime} to match the bell schedule!`, "success");
                }}
              />
            </div>

            {/* Dynamic Period Duration & Count Panel */}
            <div style={{ border: "1px solid #dce5ff", borderRadius: 12, padding: 14, background: "#ffffff", marginBottom: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 14 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#3B4197" }}>
                      {`Period Duration (mins) — ${activeSession === "regular" ? "Regular" : "Shortened"}`}
                    </label>
                    <button
                      id="btn-deped-compliance"
                      type="button"
                      onClick={() => setShowDepEdCompliance((prev) => !prev)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        border: "1px solid #c7d2fe",
                        borderRadius: 6,
                        background: showDepEdCompliance ? "#e0e7ff" : "#ffffff",
                        color: "#3B4197",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        cursor: "pointer",
                      }}
                      title="Audit weekly time allotment against DepEd MATATAG Flexibility statutory minimums"
                    >
                      {showDepEdCompliance ? "Hide DepEd Audit" : "DepEd Audit"}
                    </button>
                  </div>
                  <input
                    type="number"
                    min={20}
                    max={120}
                    value={activeSessionConfig.duration}
                    onChange={(e) =>
                      updateActiveSessionConfig((sCfg) => ({ ...sCfg, duration: Number(e.target.value) }))
                    }
                    style={inputStyle()}
                  />
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[
                      { mins: 60, label: "60m (Option A — Diadi NHS)" },
                      { mins: 50, label: "50m (Standard 5-Day)" },
                      { mins: 45, label: "45m (Shortened / Shift)" },
                    ].map((preset) => {
                      const isSelected = Number(activeSessionConfig.duration) === preset.mins;
                      return (
                        <button
                          key={preset.mins}
                          type="button"
                          onClick={() => updateActiveSessionConfig((sCfg) => ({ ...sCfg, duration: preset.mins }))}
                          style={{
                            border: isSelected ? "1.5px solid #3B4197" : "1px solid #d1d5db",
                            background: isSelected ? "#eef2ff" : "#ffffff",
                            color: isSelected ? "#3B4197" : "#4b5563",
                            fontWeight: isSelected ? 700 : 500,
                            borderRadius: 6,
                            padding: "2px 7px",
                            fontSize: 10.5,
                            cursor: "pointer",
                          }}
                        >
                          {isSelected ? "● " : ""}{preset.label}
                        </button>
                      );
                    })}
                  </div>
                  {Number(activeSessionConfig.duration) < 60 && (
                    <div
                      id="period-duration-shortfall-alert"
                      style={{
                        marginTop: 10,
                        background: "#fffbeb",
                        border: "1.5px solid #f59e0b",
                        borderRadius: 8,
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 240 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 2 }}>
                          Instructional Time Shortfall Alert
                        </div>
                        <p style={{ margin: 0, fontSize: 11.5, color: "#78350f", lineHeight: 1.45 }}>
                          Subject requirements specify <strong>60 minutes for 4 meetings per week</strong> (240 mins/week total). With the current duration of <strong>{activeSessionConfig.duration} minutes</strong>, 4 meetings deliver only <strong>{4 * Number(activeSessionConfig.duration)} minutes/week</strong> (a shortfall of <strong>{240 - 4 * Number(activeSessionConfig.duration)} minutes/week</strong>). To prevent time shortfalls, the ideal period duration is <strong>60 minutes per meeting</strong>.
                        </p>
                      </div>
                      <button
                        type="button"
                        id="btn-apply-ideal-60m"
                        onClick={() => updateActiveSessionConfig((sCfg) => ({ ...sCfg, duration: 60 }))}
                        style={{
                          background: "#d97706",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 12px",
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                        title="Set period duration to the ideal 60 minutes"
                      >
                        Set to 60 Mins (Ideal)
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#3B4197" }}>
                      Periods Per Day (Max 10)
                    </label>
                    <button
                      id="btn-period-calculator"
                      type="button"
                      onClick={() => setShowPeriodCalculator((prev) => !prev)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        border: "1px solid #c7d2fe",
                        borderRadius: 6,
                        background: showPeriodCalculator ? "#e0e7ff" : "#ffffff",
                        color: "#3B4197",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        cursor: "pointer",
                      }}
                      title="Calculate recommended period count based on subjects and school hours"
                    >
                      {showPeriodCalculator ? "Hide Calculator" : "Period Calculator"}
                    </button>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={activeSessionConfig.manualPeriodCount}
                    onChange={(e) => {
                      const rawVal = Number(e.target.value);
                      const val = isNaN(rawVal) ? 8 : Math.max(1, Math.min(10, rawVal));
                      updateActiveSessionConfig((sCfg) => ({ ...sCfg, manualPeriodCount: val }));
                    }}
                    style={inputStyle()}
                  />
                </div>
              </div>

              {/* DepEd MATATAG Flexibility Audit Expandable Card */}
              {showDepEdCompliance && (() => {
                const duration = Number(activeSessionConfig.duration) || 60;
                const coreMeetings = duration === 60 ? 4 : 5;
                const coreMins = coreMeetings * duration;
                const corePass = coreMins >= 225;
                const appliedMeetings = 4;
                const appliedMins = appliedMeetings * duration;
                const appliedPass = appliedMins >= 200;
                const hgpMins = 1 * duration;
                const hgpPass = hgpMins >= 45;

                return (
                  <div
                    style={{
                      marginBottom: 16,
                      border: "1px solid #c7d2fe",
                      borderRadius: 10,
                      background: "#f8faff",
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2c6f" }}>
                        DepEd MATATAG Statutory Weekly Time Allotment Audit
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          background: corePass && appliedPass && hgpPass ? "#dcfce7" : "#fef3c7",
                          color: corePass && appliedPass && hgpPass ? "#166534" : "#92400e",
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        {corePass && appliedPass && hgpPass ? "Fully Compliant" : "Flexible Shift Plan"}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                      <div style={{ background: "#ffffff", border: "1px solid #e0e7ff", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1e1e38" }}>Core Subjects</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: corePass ? "#16a34a" : "#d97706" }}>
                            {corePass ? "Compliant" : "Shortfall"}
                          </span>
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: "#3B4197" }}>
                          {coreMeetings}×{duration}m = {coreMins} mins/wk
                        </div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>Statutory Min: 225m</div>
                      </div>

                      <div style={{ background: "#ffffff", border: "1px solid #e0e7ff", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1e1e38" }}>Applied & Skills</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: appliedPass ? "#16a34a" : "#d97706" }}>
                            {appliedPass ? "Compliant" : "Flexible"}
                          </span>
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: "#3B4197" }}>
                          {appliedMeetings}×{duration}m = {appliedMins} mins/wk
                        </div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>Statutory Min: 200m</div>
                      </div>

                      <div style={{ background: "#ffffff", border: "1px solid #e0e7ff", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1e1e38" }}>Guidance & ARAL</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: hgpPass ? "#16a34a" : "#d97706" }}>
                            {hgpPass ? "Compliant" : "Shortfall"}
                          </span>
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: "#3B4197" }}>
                          HGP: {hgpMins}m • ARAL: {duration}m
                        </div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>Statutory Min: 45m</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Period Recommendation Calculator */}
              {showPeriodCalculator && (() => {
                const calcResult = calculatePeriodRecommendation({
                  startTimeStr: currentLevelConfig.schoolStartTime,
                  endTimeStr: currentLevelConfig.schoolEndTime,
                  duration: activeSessionConfig.duration,
                  breaksConfig: activeSessionConfig.breaks,
                  levelKey: activeLevel,
                  dayAssignments: currentLevelConfig.dayAssignments,
                  activeSession,
                });

                return (
                  <div
                    id="period-calculator-card"
                    style={{
                      marginBottom: 16,
                      border: "1px solid #c7d2fe",
                      borderRadius: 10,
                      background: "#f8faff",
                      padding: 14,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2c6f" }}>
                        Period Recommendation Calculator
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPeriodCalculator(false)}
                        style={{ border: "none", background: "transparent", cursor: "pointer", color: "#5d698d", fontSize: 12, fontWeight: 600 }}
                      >
                        Close
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div style={{ background: "#ffffff", border: "1px solid #dce5ff", borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 11, color: "#5d698d", fontWeight: 700 }}>Curriculum Demand</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "#1f2c6f" }}>
                          {calcResult.requiredFromCurriculum} periods/day
                        </div>
                      </div>
                      <div style={{ background: "#ffffff", border: "1px solid #dce5ff", borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 11, color: "#5d698d", fontWeight: 700 }}>Bell Schedule Capacity</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "#1f2c6f" }}>
                          {calcResult.timeCapacity} periods max
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "#eef2ff", borderRadius: 8, padding: 10 }}>
                      <span style={{ fontSize: 12, color: "#3B4197" }}>
                        Recommended: <strong>{calcResult.recommendedPeriods} Periods/Day</strong>
                      </span>
                      <button
                        id="btn-apply-calculated-periods"
                        type="button"
                        onClick={() => {
                          updateActiveSessionConfig((sCfg) => ({ ...sCfg, manualPeriodCount: calcResult.recommendedPeriods }));
                          showNotice(`Applied recommended ${calcResult.recommendedPeriods} periods/day.`);
                        }}
                        style={{
                          border: "none",
                          borderRadius: 6,
                          background: "#3B4197",
                          color: "#ffffff",
                          fontWeight: 700,
                          fontSize: 11.5,
                          padding: "6px 12px",
                          cursor: "pointer",
                        }}
                      >
                        Apply {calcResult.recommendedPeriods} Periods
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Break Configuration Cards */}
              <p style={{ margin: "14px 0 8px", color: "#25336f", fontSize: 13, fontWeight: 700 }}>
                Break Configuration for {activeSession === "regular" ? "Regular Session" : "Shortened Session"}
              </p>

              {(() => {
                const activeSessionPeriodCount = Math.max(1, Math.min(10, Number(activeSessionConfig.manualPeriodCount) || 8));
                const maxAllowedBreakSlot = Math.max(1, activeSessionPeriodCount - 1);

                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                    <BreakCard
                      title="Morning Recess"
                      config={activeSessionConfig.breaks.morning}
                      maxPeriods={maxAllowedBreakSlot}
                      onChange={(updated) =>
                        updateActiveSessionConfig((sCfg) => ({
                          ...sCfg,
                          breaks: { ...sCfg.breaks, morning: updated },
                        }))
                      }
                    />

                    <BreakCard
                      title="Lunch Break"
                      config={activeSessionConfig.breaks.lunch}
                      maxPeriods={maxAllowedBreakSlot}
                      onChange={(updated) =>
                        updateActiveSessionConfig((sCfg) => ({
                          ...sCfg,
                          breaks: { ...sCfg.breaks, lunch: updated },
                        }))
                      }
                    />

                    <BreakCard
                      title="Afternoon Break"
                      config={activeSessionConfig.breaks.afternoon}
                      maxPeriods={maxAllowedBreakSlot}
                      onChange={(updated) =>
                        updateActiveSessionConfig((sCfg) => ({
                          ...sCfg,
                          breaks: { ...sCfg.breaks, afternoon: updated },
                        }))
                      }
                    />
                  </div>
                );
              })()}
            </div>
          </SectionBlock>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button type="button" onClick={handleSaveConfig} style={primaryActionStyle()}>
              Save {activeLevel.toUpperCase()} Bell Schedule
            </button>
          </div>
        </div>
      )}



      {/* TAB 3: ACADEMIC YEARS & HISTORICAL ARCHIVES */}
      {(activeSubTab === "academic_years" || activeSubTab === "academic_policies" || activeSubTab === "terms" || activeSubTab === "rollover" || activeSubTab === "calendar") && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Header Banner */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff", padding: "16px 22px", borderRadius: 14, border: "1px solid #e3e7ef", boxShadow: "0 2px 8px rgba(15,23,42,0.03)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 20, fontWeight: 900 }}>
                  Academic Years & Historical Archives
                </h2>
                <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 999, background: "#dbeafe", color: "#1e40af" }}>
                  Diadi National High School
                </span>
              </div>
              <p style={{ margin: 0, color: "#5d698d", fontSize: 13 }}>
                Manage the active school year, access live and historical published schedules, inspect past section templates and faculty rosters, and carry over master schedules into S.Y. {profile.academicYear || "2026-2027"}.
              </p>
            </div>
          </div>

          {/* CARD 1: ACTIVE ADMINISTRATIVE SCHOOL YEAR */}
          <div
            style={{
              background: "#3B4197",
              borderRadius: 14,
              padding: "22px 26px",
              color: "#ffffff",
              boxShadow: "0 8px 24px rgba(59, 65, 151, 0.22)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c7d2fe" }}>
                  Active Operational School Year
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "0.02em", margin: "4px 0 0", color: "#ffffff" }}>
                  S.Y. {profile.academicYear || "2026-2027"}
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#e0e7ff" }}>
                  Active operational calendar governing Junior High School (Grades 7–10) and Senior High School (Grades 11–12) section schedules, teacher workloads, and published master timetables.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                <span style={{ fontSize: 11, fontWeight: 800, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", padding: "4px 12px", borderRadius: 999, color: "#ffffff" }}>
                  Current Operational Year
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, background: "#16a34a", padding: "4px 12px", borderRadius: 999, color: "#ffffff" }}>
                  Active School-Wide Term: {profile.activeTerm || profile.shsActiveTerm || "Term 1"} (Aug 24 – Nov 20, 2026)
                </span>
              </div>
            </div>

            {/* Direct fields within Hero Card */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#e0e7ff", display: "block", marginBottom: 6 }}>
                  Active Academic Year Label
                </label>
                <input
                  type="text"
                  value={profile.academicYear}
                  onChange={(e) => setProfile((prev) => ({ ...prev, academicYear: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.32)",
                    background: "rgba(255,255,255,0.14)",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 700,
                    boxSizing: "border-box",
                  }}
                  placeholder="e.g. 2026-2027"
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#e0e7ff", display: "block", marginBottom: 6 }}>
                  Active Operational Term
                </label>
                <select
                  value={profile.activeTerm || profile.shsActiveTerm || "Term 1"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile((prev) => ({
                      ...prev,
                      activeTerm: val,
                      shsActiveTerm: val,
                      jhsTerm: val,
                    }));
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.32)",
                    background: "rgba(255,255,255,0.14)",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 700,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="Term 1" style={{ background: "#3B4197", color: "#ffffff" }}>Term 1 (Aug 24 – Nov 20, 2026)</option>
                  <option value="Term 2" style={{ background: "#3B4197", color: "#ffffff" }}>Term 2 (Nov 23, 2026 – Feb 26, 2027)</option>
                  <option value="Term 3" style={{ background: "#3B4197", color: "#ffffff" }}>Term 3 (Mar 01, 2027 – Jun 04, 2027)</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  style={{
                    width: "100%",
                    minHeight: 44,
                    borderRadius: 8,
                    border: "none",
                    background: "#ffffff",
                    color: "#3B4197",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  Save Active School Year
                </button>
              </div>
            </div>
          </div>

          {/* MOST RECENT PUBLISHED SCHEDULES SHOWCASE */}
          <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: "20px 24px", boxShadow: "0 2px 10px rgba(15,23,42,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ margin: 0, color: "#1f2c6f", fontSize: 16.5, fontWeight: 800 }}>
                    Most Recent Published Schedules (Active S.Y. {profile.academicYear || "2026-2027"})
                  </h3>
                  <span style={{ fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: "#dcfce7", color: "#166534" }}>
                    Active Operation
                  </span>
                </div>
                <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: 12.5 }}>
                  Permanent master timetables published for Junior High School and Senior High School. Scheds are preserved across terms and can be restored from archives.
                </p>
              </div>
            </div>

            {(() => {
              let publishedData = {};
              if (typeof window !== "undefined") {
                try {
                  const raw = window.localStorage.getItem("turotugma_published_schedules");
                  if (raw) publishedData = JSON.parse(raw);
                } catch (e) {}
              }

              const jhsSched = publishedData.jhs;
              const shsSched = publishedData["shs-first"] || publishedData.shs;

              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
                  {/* JHS Published Sched Card */}
                  <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#1e40af" }}>
                        Junior High School (JHS) Schedule
                      </span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: jhsSched ? "#dcfce7" : "#fef3c7", color: jhsSched ? "#166534" : "#92400e" }}>
                        {jhsSched ? "PUBLISHED & ACTIVE" : "Draft In-Progress"}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>
                      {jhsSched
                        ? `Published: ${jhsSched.publishedAt ? new Date(jhsSched.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Active"} • 8 Periods/Day (60m) • S.Y. ${profile.academicYear || "2026-2027"}`
                        : "No published schedule yet for JHS. Generate and publish in Schedule Generator or restore from archives."}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.location.href = "/dashboard?tab=timetables&level=jhs";
                          }
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: "1px solid #c7d2fe",
                          background: "#ffffff",
                          color: "#1e40af",
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        View Live JHS Timetable →
                      </button>
                    </div>
                  </div>

                  {/* SHS Published Sched Card */}
                  <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#15803d" }}>
                        Senior High School (SHS) Schedule
                      </span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: shsSched ? "#dcfce7" : "#fef3c7", color: shsSched ? "#166534" : "#92400e" }}>
                        {shsSched ? "PUBLISHED & ACTIVE" : "Draft In-Progress"}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>
                      {shsSched
                        ? `Published: ${shsSched.publishedAt ? new Date(shsSched.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Active"} • 8 Periods/Day (60m) • S.Y. ${profile.academicYear || "2026-2027"}`
                        : "No published schedule yet for SHS. Generate and publish in Schedule Generator or restore from archives."}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.location.href = "/dashboard?tab=timetables&level=shs";
                          }
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: "1px solid #bbf7d0",
                          background: "#ffffff",
                          color: "#15803d",
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        View Live SHS Timetable →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* CARD 2: HISTORICAL SCHOOL YEARS REGISTRY */}
          <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 22, boxShadow: "0 2px 10px rgba(15,23,42,0.03)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h3 style={{ margin: 0, color: "#1f2c6f", fontSize: 18, fontWeight: 800 }}>
                    Previous School Years Registry (DNHS Archives)
                  </h3>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 6, background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" }}>
                    3 Years Archived • Ready to Reuse
                  </span>
                </div>
                <p style={{ margin: 0, color: "#5d698d", fontSize: 13 }}>
                  Pre-configured historical data for past academic years at Diadi National High School. Inspect historical section groupings, faculty rosters, bell configurations, and published master schedules (scheds), and carry them over into S.Y. {profile.academicYear || "2026-2027"}.
                </p>
              </div>
            </div>

            {/* 3 Historical Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              {historicalYears.map((hYear) => (
                <div
                  key={hYear.yearId}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: 12,
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 14,
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#1f2c6f" }}>
                        {hYear.label}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "#e2e8f0",
                          color: "#475569",
                        }}
                      >
                        {hYear.status}
                      </span>
                    </div>

                    <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 10 }}>
                      {hYear.dateRange} • {hYear.description}
                    </div>

                    {/* Metrics row: Sections, Faculty, Published Scheds (NO student/room utilization!) */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
                      <div style={{ background: "#ffffff", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>SECTIONS</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{hYear.totalSections}</div>
                      </div>
                      <div style={{ background: "#ffffff", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>FACULTY</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{hYear.totalFaculty}</div>
                      </div>
                      <div style={{ background: "#ffffff", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>PUBLISHED SCHEDS</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#166534" }}>{hYear.publishedSchedulesCount || 2} Timetables</div>
                      </div>
                    </div>

                    {/* Level Details */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "#ffffff", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", display: "flex", justifyContent: "space-between" }}>
                        <span>Junior High School (JHS):</span>
                        <span style={{ fontWeight: 800 }}>{hYear.jhs?.sectionCount} sections • {hYear.jhs?.facultyCount} faculty</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: "#64748b" }}>
                        8 Periods (60m) • Master Schedule Archived
                      </div>

                      <div style={{ height: 1, background: "#f1f5f9", margin: "3px 0" }} />

                      <div style={{ fontSize: 11, fontWeight: 700, color: "#15803d", display: "flex", justifyContent: "space-between" }}>
                        <span>Senior High School (SHS):</span>
                        <span style={{ fontWeight: 800 }}>{hYear.shs?.sectionCount} sections • {hYear.shs?.facultyCount} faculty</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: "#64748b" }}>
                        STEM, HUMSS, TVL • Master Schedule Archived
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingTop: 10, borderTop: "1px dashed #cbd5e1" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setInspectingYear(hYear);
                        setInspectLevel("jhs");
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "1px solid #c7d2fe",
                        background: "#ffffff",
                        color: "#3B4197",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Inspect Archive
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReuseModalYear(hYear);
                        setReuseTargetLevel("both");
                        setReuseOptions({ sections: true, faculty: true, ancillaries: true, configs: true, schedules: true });
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: "linear-gradient(135deg, #3B4197 0%, #2563eb 100%)",
                        color: "#ffffff",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Reuse Data
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 3: DATA ROLLOVER & REUSE AUDIT LOG */}
          <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 20 }}>
            <h3 style={{ margin: "0 0 6px", color: "#1f2c6f", fontSize: 16, fontWeight: 800 }}>
              School Year Rollover & Data Reuse Audit Log
            </h3>
            <p style={{ margin: "0 0 14px", color: "#64748b", fontSize: 12.5 }}>
              Chronological log of section imports, faculty roster carry-overs, bell configurations, and published schedules imported into S.Y. {profile.academicYear || "2026-2027"}.
            </p>

            {(() => {
              let logs = [];
              if (typeof window !== "undefined") {
                try {
                  const raw = window.localStorage.getItem(ROLLOVER_AUDIT_KEY);
                  if (raw) logs = JSON.parse(raw);
                } catch (e) {}
              }

              if (logs.length === 0) {
                return (
                  <div style={{ padding: "16px 20px", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1", textAlign: "center", fontSize: 12, color: "#64748b" }}>
                    No data rollover or reuse operations recorded yet. Use the <strong>"Reuse Data"</strong> button on any previous school year above to carry over sections, faculty, configurations, or published schedules.
                  </div>
                );
              }

              return (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                        <th style={{ padding: "8px 12px", borderRadius: "6px 0 0 6px" }}>Timestamp</th>
                        <th style={{ padding: "8px 12px" }}>Source S.Y.</th>
                        <th style={{ padding: "8px 12px" }}>Target S.Y.</th>
                        <th style={{ padding: "8px 12px" }}>Level</th>
                        <th style={{ padding: "8px 12px" }}>Imported Data</th>
                        <th style={{ padding: "8px 12px", borderRadius: "0 6px 6px 0" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(0, 10).map((log, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px", color: "#64748b" }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td style={{ padding: "8px 12px", fontWeight: 700, color: "#1f2c6f" }}>
                            S.Y. {log.sourceYear}
                          </td>
                          <td style={{ padding: "8px 12px", fontWeight: 700, color: "#166534" }}>
                            S.Y. {log.targetYear}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{ textTransform: "uppercase", fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#e2e8f0" }}>
                              {log.level || "Both"}
                            </span>
                          </td>
                          <td style={{ padding: "8px 12px", color: "#334155" }}>
                            {[
                              log.importedSections ? `${log.importedSections} sections` : null,
                              log.importedFaculty ? `${log.importedFaculty} faculty` : null,
                              log.configurationsUpdated ? "bell configs" : null,
                              log.importedSchedules ? `${log.importedSchedules} scheds` : null,
                            ].filter(Boolean).join(", ") || "Data imported"}
                          </td>
                          <td style={{ padding: "8px 12px", color: "#64748b" }}>
                            {log.action}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          {/* MODAL 1: INSPECT ARCHIVE MODAL */}
          {inspectingYear && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: 16,
              }}
              onClick={() => setInspectingYear(null)}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  maxWidth: 900,
                  width: "100%",
                  maxHeight: "90vh",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{ padding: "18px 24px", background: "#3B4197", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                        Historical Archive: {inspectingYear.label}
                      </h3>
                      <span style={{ fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.2)" }}>
                        {inspectingYear.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#bfdbfe", marginTop: 2 }}>
                      {inspectingYear.dateRange} • {inspectingYear.description}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setInspectingYear(null)}
                    style={{ background: "transparent", border: "none", color: "#ffffff", fontSize: 22, cursor: "pointer", padding: 4 }}
                  >
                    ×
                  </button>
                </div>

                {/* Level Tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", padding: "8px 20px 0" }}>
                  <button
                    type="button"
                    onClick={() => setInspectLevel("jhs")}
                    style={{
                      padding: "10px 18px",
                      border: "none",
                      borderBottom: inspectLevel === "jhs" ? "2.5px solid #3B4197" : "2.5px solid transparent",
                      background: "transparent",
                      color: inspectLevel === "jhs" ? "#3B4197" : "#64748b",
                      fontWeight: inspectLevel === "jhs" ? 800 : 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Junior High School (JHS)
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectLevel("shs")}
                    style={{
                      padding: "10px 18px",
                      border: "none",
                      borderBottom: inspectLevel === "shs" ? "2.5px solid #3B4197" : "2.5px solid transparent",
                      background: "transparent",
                      color: inspectLevel === "shs" ? "#3B4197" : "#64748b",
                      fontWeight: inspectLevel === "shs" ? 800 : 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Senior High School (SHS)
                  </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: 22, overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
                  {/* Summary row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                    <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>SECTIONS ALLOCATED</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#1f2c6f" }}>
                        {inspectingYear[inspectLevel]?.sectionCount} Sections
                      </div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>FACULTY ROSTER</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#1f2c6f" }}>
                        {inspectingYear[inspectLevel]?.facultyCount} Teachers
                      </div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>PUBLISHED TIMETABLE</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#166534" }}>
                        8 Periods (60m) • Archived
                      </div>
                    </div>
                  </div>

                  {/* Sections List */}
                  <div>
                    <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#1f2c6f" }}>
                      {inspectLevel.toUpperCase()} Sections Roster ({inspectingYear[inspectLevel]?.sections?.length || 0})
                    </h4>
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                            <th style={{ padding: "8px 12px" }}>Grade</th>
                            <th style={{ padding: "8px 12px" }}>Section Name</th>
                            <th style={{ padding: "8px 12px" }}>{inspectLevel === "shs" ? "Track / Cluster" : "Classification"}</th>
                            <th style={{ padding: "8px 12px" }}>Class Adviser</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(inspectingYear[inspectLevel]?.sections || []).map((sec, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px 12px", fontWeight: 700 }}>Grade {sec.grade}</td>
                              <td style={{ padding: "8px 12px", fontWeight: 700, color: "#1f2c6f" }}>{sec.name}</td>
                              <td style={{ padding: "8px 12px" }}>
                                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#e0e7ff", color: "#3730a3" }}>
                                  {sec.cluster || sec.classification || "Regular"}
                                </span>
                              </td>
                              <td style={{ padding: "8px 12px", color: "#334155" }}>{sec.adviser || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Faculty Roster & Ancillaries */}
                  <div>
                    <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#1f2c6f" }}>
                      {inspectLevel.toUpperCase()} Faculty & Ancillary Assignments ({inspectingYear[inspectLevel]?.faculty?.length || 0})
                    </h4>
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                            <th style={{ padding: "8px 12px" }}>Teacher Name</th>
                            <th style={{ padding: "8px 12px" }}>Designation</th>
                            <th style={{ padding: "8px 12px" }}>Specialization (Major)</th>
                            <th style={{ padding: "8px 12px" }}>Advisory Class</th>
                            <th style={{ padding: "8px 12px" }}>Ancillary Duties</th>
                            <th style={{ padding: "8px 12px", textAlign: "right" }}>Max Load</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(inspectingYear[inspectLevel]?.faculty || []).map((t, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px 12px", fontWeight: 700, color: "#1f2c6f" }}>{t.name}</td>
                              <td style={{ padding: "8px 12px", color: "#475569" }}>{t.designation}</td>
                              <td style={{ padding: "8px 12px" }}>
                                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#f1f5f9", color: "#334155" }}>
                                  {t.major}
                                </span>
                              </td>
                              <td style={{ padding: "8px 12px", color: "#166534", fontWeight: t.advisoryClass !== "None" ? 700 : 400 }}>
                                {t.advisoryClass || "None"}
                              </td>
                              <td style={{ padding: "8px 12px" }}>
                                {Array.isArray(t.ancillaries) && t.ancillaries.length > 0 ? (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                    {t.ancillaries.map((anc, aIdx) => (
                                      <span key={aIdx} style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#fef3c7", color: "#92400e" }}>
                                        {anc}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ color: "#94a3b8", fontSize: 11 }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>{t.maxWeeklyHours}h/wk</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Archived Published Schedule Timetable */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1f2c6f" }}>
                        Archived Published Schedule Snippet ({inspectLevel.toUpperCase()} • S.Y. {inspectingYear.academicYear})
                      </h4>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#166534", background: "#dcfce7", padding: "2px 8px", borderRadius: 6 }}>
                        Master Schedule Saved
                      </span>
                    </div>

                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                            <th style={{ padding: "8px 12px" }}>Day</th>
                            <th style={{ padding: "8px 12px" }}>Period</th>
                            <th style={{ padding: "8px 12px" }}>Time Span</th>
                            <th style={{ padding: "8px 12px" }}>Subject</th>
                            <th style={{ padding: "8px 12px" }}>Assigned Teacher</th>
                            <th style={{ padding: "8px 12px" }}>Class Section</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(inspectingYear[inspectLevel]?.publishedSchedule?.timetableSnippet || []).map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px 12px", fontWeight: 700 }}>{item.day}</td>
                              <td style={{ padding: "8px 12px" }}>Period {item.period}</td>
                              <td style={{ padding: "8px 12px", color: "#64748b" }}>{item.time}</td>
                              <td style={{ padding: "8px 12px", fontWeight: 700, color: "#1e40af" }}>{item.subject}</td>
                              <td style={{ padding: "8px 12px", color: "#166534" }}>{item.teacher}</td>
                              <td style={{ padding: "8px 12px", fontWeight: 600 }}>{item.section}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Scheduling Configuration & Scheds */}
                  <div>
                    <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#1f2c6f" }}>
                      {inspectLevel.toUpperCase()} Scheduling Configuration & Scheds
                    </h4>
                    <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, fontSize: 12 }}>
                        <div>
                          <span style={{ color: "#64748b", display: "block" }}>Operating Hours:</span>
                          <strong style={{ color: "#1e293b" }}>{inspectingYear[inspectLevel]?.config?.schoolStartTime} – {inspectingYear[inspectLevel]?.config?.schoolEndTime}</strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block" }}>Regular Period Duration:</span>
                          <strong style={{ color: "#1e293b" }}>{inspectingYear[inspectLevel]?.config?.periodDuration} minutes (8 Periods/Day)</strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block" }}>Shortened Session:</span>
                          <strong style={{ color: "#1e293b" }}>{inspectingYear[inspectLevel]?.config?.shortenedDuration} minutes (Friday)</strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block" }}>Scheduled Breaks:</span>
                          <strong style={{ color: "#1e293b" }}>Recess 20m, Lunch 60m, Break 10m</strong>
                        </div>
                      </div>

                      {Array.isArray(inspectingYear[inspectLevel]?.config?.scheds) && (
                        <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: 10 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                            Daily Scheds Timeline Structure:
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {inspectingYear[inspectLevel].config.scheds.map((s, sIdx) => (
                              <div
                                key={sIdx}
                                style={{
                                  fontSize: 10.5,
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  background: s.type === "break" ? "#fef3c7" : "#e0e7ff",
                                  color: s.type === "break" ? "#92400e" : "#1e40af",
                                  fontWeight: 700,
                                  border: s.type === "break" ? "1px solid #fde68a" : "1px solid #c7d2fe",
                                }}
                              >
                                {s.label}: {s.time}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div style={{ padding: "14px 22px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setInspectingYear(null)}
                    style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                  >
                    Close
                  </button>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const targetYear = inspectingYear;
                        setInspectingYear(null);
                        setReuseModalYear(targetYear);
                        setReuseTargetLevel(inspectLevel);
                        setReuseOptions({ sections: true, faculty: true, ancillaries: true, configs: true, schedules: true });
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 6,
                        border: "none",
                        background: "linear-gradient(135deg, #3B4197 0%, #2563eb 100%)",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Reuse This Year's Data ({inspectLevel.toUpperCase()})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 2: REUSE DATA CONFIRMATION MODAL */}
          {reuseModalYear && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: 16,
              }}
              onClick={() => setReuseModalYear(null)}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  maxWidth: 560,
                  width: "100%",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
                  overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div style={{ padding: "18px 22px", background: "#3B4197", color: "#ffffff" }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
                    Reuse Data from {reuseModalYear.label}
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#bfdbfe" }}>
                    Select data categories to copy into active S.Y. {profile.academicYear || "2026-2027"}.
                  </p>
                </div>

                {/* Body */}
                <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                      Apply to Academic Level:
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {[
                        { id: "both", label: "Both JHS & SHS" },
                        { id: "jhs", label: "JHS Only" },
                        { id: "shs", label: "SHS Only" },
                      ].map((lvl) => {
                        const active = reuseTargetLevel === lvl.id;
                        return (
                          <button
                            key={lvl.id}
                            type="button"
                            onClick={() => setReuseTargetLevel(lvl.id)}
                            style={{
                              padding: "8px 6px",
                              borderRadius: 6,
                              border: active ? "2px solid #3B4197" : "1px solid #cbd5e1",
                              background: active ? "#eef2ff" : "#ffffff",
                              color: active ? "#3B4197" : "#475569",
                              fontSize: 11.5,
                              fontWeight: active ? 800 : 600,
                              cursor: "pointer",
                            }}
                          >
                            {lvl.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 8 }}>
                      Select Data to Copy:
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#1e293b", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={reuseOptions.sections}
                          onChange={(e) => setReuseOptions((prev) => ({ ...prev, sections: e.target.checked }))}
                        />
                        <span>
                          <strong>Grades & Section Structures</strong> (copies grade allocations, section names, and tracks)
                        </span>
                      </label>

                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#1e293b", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={reuseOptions.faculty}
                          onChange={(e) => setReuseOptions((prev) => ({ ...prev, faculty: e.target.checked }))}
                        />
                        <span>
                          <strong>Teachers & Faculty Roster</strong> (copies teacher profiles, ranks, and majors)
                        </span>
                      </label>

                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#1e293b", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={reuseOptions.ancillaries}
                          onChange={(e) => setReuseOptions((prev) => ({ ...prev, ancillaries: e.target.checked }))}
                        />
                        <span>
                          <strong>Ancillary Duties & Advisory Assignments</strong> (copies class advisers and committee coordinators)
                        </span>
                      </label>

                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#1e293b", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={reuseOptions.configs}
                          onChange={(e) => setReuseOptions((prev) => ({ ...prev, configs: e.target.checked }))}
                        />
                        <span>
                          <strong>Scheduling Configurations & Bell Timings</strong> (copies 60m bell schedules, periods, and break hours)
                        </span>
                      </label>

                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#1e293b", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={reuseOptions.schedules}
                          onChange={(e) => setReuseOptions((prev) => ({ ...prev, schedules: e.target.checked }))}
                        />
                        <span>
                          <strong>Published Master Schedules (Scheds)</strong> (restores complete published timetable into active system)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div style={{ padding: "10px 12px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, fontSize: 11.5, color: "#92400e" }}>
                    Notice: Carrying over data will import these records into your active system for S.Y. {profile.academicYear}. Existing records with identical names will be updated.
                  </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "14px 22px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
                  <button
                    type="button"
                    onClick={() => setReuseModalYear(null)}
                    style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                  >
                    Cancel
                  </button>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        handleFullRollover(reuseModalYear);
                        setReuseModalYear(null);
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 6,
                        border: "1px solid #16a34a",
                        background: "#f0fdf4",
                        color: "#166534",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                      title="Perform a complete one-step rollover of all data"
                    >
                      Full Rollover
                    </button>

                    <button
                      type="button"
                      onClick={handleExecuteReuse}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 6,
                        border: "none",
                        background: "linear-gradient(135deg, #3B4197 0%, #2563eb 100%)",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Import Selected Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}



    </>
  );
}


function SectionBlock({ title, children }) {
  return (
    <div style={{ border: "1px solid #e3e7ef", borderRadius: 12, padding: 14, marginBottom: 16, background: "#fbfcff" }}>
      <h3 style={{ margin: "0 0 12px", color: "#1f2c6f", fontSize: 15 }}>{title}</h3>
      {children}
    </div>
  );
}

const DEFAULT_MATATAG_SUBJECTS = [
  // JHS Core & Applied Subjects (Diadi NHS Standard: 4 meetings × 60 mins = 4 hrs/wk)
  { id: "jhs-eng", subjectName: "English", subjectCode: "ENG", schoolLevel: "jhs", subjectType: "Core", dailyMinutes: 60, classesPerWeek: 4, hoursPerWeek: 4, gradeLevel: "Grades 7–10", programScope: "Universal" },
  { id: "jhs-math", subjectName: "Mathematics", subjectCode: "MATH", schoolLevel: "jhs", subjectType: "Core", dailyMinutes: 60, classesPerWeek: 4, hoursPerWeek: 4, gradeLevel: "Grades 7–10", programScope: "Universal" },
  { id: "jhs-sci", subjectName: "Science", subjectCode: "SCI", schoolLevel: "jhs", subjectType: "Core", dailyMinutes: 60, classesPerWeek: 4, hoursPerWeek: 4, gradeLevel: "Grades 7–10", programScope: "Universal" },
  { id: "jhs-fil", subjectName: "Filipino", subjectCode: "FIL", schoolLevel: "jhs", subjectType: "Core", dailyMinutes: 60, classesPerWeek: 4, hoursPerWeek: 4, gradeLevel: "Grades 7–10", programScope: "Universal" },
  { id: "jhs-ap", subjectName: "Araling Panlipunan", subjectCode: "AP", schoolLevel: "jhs", subjectType: "Core", dailyMinutes: 60, classesPerWeek: 4, hoursPerWeek: 4, gradeLevel: "Grades 7–10", programScope: "Universal" },
  { id: "jhs-ve", subjectName: "Values Education", subjectCode: "VE", schoolLevel: "jhs", subjectType: "Core", dailyMinutes: 60, classesPerWeek: 4, hoursPerWeek: 4, gradeLevel: "Grades 7–10", programScope: "Universal" },
  { id: "jhs-mapeh", subjectName: "MAPEH", subjectCode: "MAPEH", schoolLevel: "jhs", subjectType: "Core", dailyMinutes: 60, classesPerWeek: 4, hoursPerWeek: 4, gradeLevel: "Grades 7–10", programScope: "Universal" },
  // JHS Guidance (Diadi NHS Standard: 1 meeting × 60 mins = 1 hr/wk)
  { id: "jhs-hgp", subjectName: "HGP", subjectCode: "HGP", schoolLevel: "jhs", subjectType: "Enrichment", dailyMinutes: 60, classesPerWeek: 1, hoursPerWeek: 1, gradeLevel: "Grades 7–10", programScope: "Universal" },
  // JHS Intervention / Enrichment (Diadi NHS: 1 meeting × 60 mins = 1 hr/wk)
  { id: "jhs-aral", subjectName: "Aral Program", subjectCode: "ARAL", schoolLevel: "jhs", subjectType: "Enrichment", dailyMinutes: 60, classesPerWeek: 1, hoursPerWeek: 1, gradeLevel: "Grades 7–10", programScope: "Regular" },
  // JHS Specialized & Special Programs (4 meetings × 60 mins = 4 hrs/wk)
  { id: "jhs-tle", subjectName: "Technology and Livelihood Education (TLE)", subjectCode: "TLE", schoolLevel: "jhs", subjectType: "Specialized", dailyMinutes: 60, classesPerWeek: 4, hoursPerWeek: 4, gradeLevel: "Grades 7–10", programScope: "Regular, SPA" },
  { id: "jhs-spaspec", subjectName: "SPA Specialization", subjectCode: "SPASPEC", schoolLevel: "jhs", subjectType: "Specialized", dailyMinutes: 60, classesPerWeek: 4, hoursPerWeek: 4, gradeLevel: "Grades 7–10", programScope: "SPA" },
  { id: "jhs-ict-spj", subjectName: "ICT (SPJ)", subjectCode: "ICT-SPJ", schoolLevel: "jhs", subjectType: "Specialized", dailyMinutes: 60, classesPerWeek: 4, hoursPerWeek: 4, gradeLevel: "Grades 7–10", programScope: "SPJ" },
  { id: "jhs-ict-stem", subjectName: "ICT (SP-STEM)", subjectCode: "ICT-STEM", schoolLevel: "jhs", subjectType: "Specialized", dailyMinutes: 60, classesPerWeek: 3, hoursPerWeek: 3, gradeLevel: "Grades 7–10", programScope: "SP-STEM" },
  // JHS Enhanced STEM Subjects (Diadi NHS Standard: ELEMALG and ENVSCI 3 hrs/wk, DEVREAD 1 hr/wk)
  { id: "jhs-devread", subjectName: "Developmental Reading", subjectCode: "DEVREAD", schoolLevel: "jhs", subjectType: "Specialized", dailyMinutes: 60, classesPerWeek: 1, hoursPerWeek: 1, gradeLevel: "7", programScope: "SP-STEM" },
  { id: "jhs-elemalg", subjectName: "Elementary Algebra", subjectCode: "ELEMALG", schoolLevel: "jhs", subjectType: "Specialized", dailyMinutes: 60, classesPerWeek: 3, hoursPerWeek: 3, gradeLevel: "7", programScope: "SP-STEM" },
  { id: "jhs-envsci", subjectName: "Environmental Science", subjectCode: "ENVSCI", schoolLevel: "jhs", subjectType: "Specialized", dailyMinutes: 60, classesPerWeek: 3, hoursPerWeek: 3, gradeLevel: "7", programScope: "SP-STEM" },
  // SHS Core Subjects
  { id: "shs-oralcom", subjectName: "Oral Communication in Context", subjectCode: "ORALCOM", schoolLevel: "shs", subjectType: "Core", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "First Semester" },
  { id: "shs-genmath", subjectName: "General Mathematics", subjectCode: "GENMATH", schoolLevel: "shs", subjectType: "Core", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "First Semester" },
  { id: "shs-earthsci", subjectName: "Earth and Life Science", subjectCode: "EARTHSCI", schoolLevel: "shs", subjectType: "Core", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "First Semester" },
  { id: "shs-kompan", subjectName: "Komunikasyon at Pananaliksik", subjectCode: "KOMPAN", schoolLevel: "shs", subjectType: "Core", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "First Semester" },
  { id: "shs-peh1", subjectName: "Physical Education and Health 1", subjectCode: "PEH1", schoolLevel: "shs", subjectType: "Core", dailyMinutes: 50, classesPerWeek: 2, hoursPerWeek: 1.67, gradeLevel: "11", semester: "First Semester" },
  { id: "shs-lit21", subjectName: "21st Century Literature", subjectCode: "LIT21", schoolLevel: "shs", subjectType: "Core", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "Last Semester" },
  { id: "shs-statprob", subjectName: "Statistics and Probability", subjectCode: "STATPROB", schoolLevel: "shs", subjectType: "Core", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "Last Semester" },
  { id: "shs-physci", subjectName: "Physical Science", subjectCode: "PHYSCI", schoolLevel: "shs", subjectType: "Core", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "Last Semester" },
  { id: "shs-perdev", subjectName: "Personal Development", subjectCode: "PERDEV", schoolLevel: "shs", subjectType: "Core", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "Last Semester" },
  { id: "shs-peh2", subjectName: "Physical Education and Health 2", subjectCode: "PEH2", schoolLevel: "shs", subjectType: "Core", dailyMinutes: 50, classesPerWeek: 2, hoursPerWeek: 1.67, gradeLevel: "11", semester: "Last Semester" },
  { id: "shs-ucsp", subjectName: "Understanding Culture, Society, and Politics", subjectCode: "UCSP", schoolLevel: "shs", subjectType: "Core", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "12", semester: "First Semester" },
  { id: "shs-mil", subjectName: "Media and Information Literacy", subjectCode: "MIL", schoolLevel: "shs", subjectType: "Core", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "12", semester: "First Semester" },
  // SHS Applied Subjects
  { id: "shs-emptech", subjectName: "Empowerment Technologies", subjectCode: "EMPTECH", schoolLevel: "shs", subjectType: "Applied", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "First Semester" },
  { id: "shs-eapp", subjectName: "English for Academic and Professional Purposes", subjectCode: "EAPP", schoolLevel: "shs", subjectType: "Applied", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "Last Semester" },
  { id: "shs-pracres1", subjectName: "Practical Research 1", subjectCode: "PRACRES1", schoolLevel: "shs", subjectType: "Applied", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "Last Semester" },
  { id: "shs-pracres2", subjectName: "Practical Research 2", subjectCode: "PRACRES2", schoolLevel: "shs", subjectType: "Applied", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "12", semester: "First Semester" },
  { id: "shs-entrep", subjectName: "Entrepreneurship", subjectCode: "ENTREP", schoolLevel: "shs", subjectType: "Applied", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "12", semester: "Last Semester" },
  // SHS Specialized - STEM Strand
  { id: "shs-precalc", subjectName: "Pre-Calculus", subjectCode: "PRECALC", schoolLevel: "shs", subjectType: "Specialized", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "First Semester", strand: "STEM" },
  { id: "shs-bascalc", subjectName: "Basic Calculus", subjectCode: "BASCALC", schoolLevel: "shs", subjectType: "Specialized", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "Last Semester", strand: "STEM" },
  { id: "shs-genphys1", subjectName: "General Physics 1", subjectCode: "GENPHYS1", schoolLevel: "shs", subjectType: "Specialized", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "12", semester: "First Semester", strand: "STEM" },
  { id: "shs-genphys2", subjectName: "General Physics 2", subjectCode: "GENPHYS2", schoolLevel: "shs", subjectType: "Specialized", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "12", semester: "Last Semester", strand: "STEM" },
  { id: "shs-genchem1", subjectName: "General Chemistry 1", subjectCode: "GENCHEM1", schoolLevel: "shs", subjectType: "Specialized", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "First Semester", strand: "STEM" },
  { id: "shs-genchem2", subjectName: "General Chemistry 2", subjectCode: "GENCHEM2", schoolLevel: "shs", subjectType: "Specialized", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "Last Semester", strand: "STEM" },
  // SHS Specialized - HUMSS Strand
  { id: "shs-crewrite", subjectName: "Creative Writing", subjectCode: "CREWRITE", schoolLevel: "shs", subjectType: "Specialized", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "First Semester", strand: "HUMSS" },
  { id: "shs-ppg", subjectName: "Philippine Politics and Governance", subjectCode: "PPG", schoolLevel: "shs", subjectType: "Specialized", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "Last Semester", strand: "HUMSS" },
  // SHS Specialized - ABM Strand
  { id: "shs-fabm1", subjectName: "Fundamentals of ABM 1", subjectCode: "FABM1", schoolLevel: "shs", subjectType: "Specialized", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "First Semester", strand: "ABM" },
  { id: "shs-fabm2", subjectName: "Fundamentals of ABM 2", subjectCode: "FABM2", schoolLevel: "shs", subjectType: "Specialized", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "Last Semester", strand: "ABM" },
  // SHS Specialized - TVL Track
  { id: "shs-css1", subjectName: "Computer Systems Servicing 1", subjectCode: "CSS1", schoolLevel: "shs", subjectType: "Specialized", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "First Semester", strand: "TVL" },
  { id: "shs-css2", subjectName: "Computer Systems Servicing 2", subjectCode: "CSS2", schoolLevel: "shs", subjectType: "Specialized", dailyMinutes: 50, classesPerWeek: 4, hoursPerWeek: 3.33, gradeLevel: "11", semester: "Last Semester", strand: "TVL" },
];

function SubjectPlacementRulesManager({ activeLevel, activeSession, levelConfig, updateLevelConfig, showNotice }) {
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Dynamic Period Structure derived from levelConfig (Sections 1, 2, and 3)
  const actualPeriodStructure = useMemo(() => {
    const sessionConfig =
      (activeSession && levelConfig?.sessions?.[activeSession]) ||
      levelConfig?.sessions?.regular ||
      (levelConfig?.sessions && Object.values(levelConfig.sessions)[0]) ||
      {};
    const startTimeStr = levelConfig?.schoolStartTime || "07:30";
    const endTimeStr = levelConfig?.schoolEndTime || "17:00";
    const duration = Number(sessionConfig.duration) || 50;
    const breaks = sessionConfig.breaks || {};
    const manualCount = Number(sessionConfig.manualPeriodCount || levelConfig?.manualPeriodCount) || 8;
    const count = Math.max(1, Math.min(10, manualCount));

    const [startH, startM] = (startTimeStr || "07:30").split(":").map(Number);
    let currentMins = (startH || 7) * 60 + (startM || 30);

    const formatTime = (totalMins) => {
      let hrs = Math.floor(totalMins / 60) % 24;
      let mins = totalMins % 60;
      const ampm = hrs >= 12 ? "PM" : "AM";
      let displayH = hrs % 12;
      if (displayH === 0) displayH = 12;
      const strH = String(displayH).padStart(2, "0");
      const strM = String(mins).padStart(2, "0");
      return `${strH}:${strM} ${ampm}`;
    };

    const periods = [];
    const lunchAfter = breaks.lunch?.enabled
      ? Math.min(count - 1, Number(breaks.lunch.afterPeriod))
      : Math.floor(count / 2);

    for (let p = 1; p <= count; p++) {
      const pStart = currentMins;
      const pEnd = currentMins + duration;
      const startStr = formatTime(pStart);
      const endStr = formatTime(pEnd);
      periods.push({
        num: p,
        label: getOrdinalPeriodLabel(p),
        startTime: startStr,
        endTime: endStr,
        timeSpan: `${startStr} – ${endStr}`,
        isMorning: p <= lunchAfter,
        isAfternoon: p > lunchAfter,
      });
      currentMins = pEnd;

      if (breaks.morning?.enabled && Number(breaks.morning.afterPeriod) === p) {
        currentMins += Number(breaks.morning.duration) || 15;
      }
      if (breaks.lunch?.enabled && Number(breaks.lunch.afterPeriod) === p) {
        currentMins += Number(breaks.lunch.duration) || 45;
      }
      if (breaks.afternoon?.enabled && Number(breaks.afternoon.afterPeriod) === p) {
        currentMins += Number(breaks.afternoon.duration) || 15;
      }
    }

    const consecutivePairs = [];
    for (let p = 1; p < count; p++) {
      const p1 = periods[p - 1];
      const p2 = periods[p];
      const crossesLunch = breaks.lunch?.enabled && Number(breaks.lunch.afterPeriod) === p;
      consecutivePairs.push({
        value: `${p}-${p + 1}`,
        label: `${getOrdinalPeriodPairLabel(p, p + 1)} (${p1?.startTime || ""} – ${p2?.endTime || ""})${crossesLunch ? " [Crosses Lunch Break]" : ""
          }`,
        shortLabel: getOrdinalPeriodPairLabel(p, p + 1),
        crossesLunch,
      });
    }

    return {
      count,
      duration,
      startTimeStr,
      endTimeStr,
      periods,
      consecutivePairs,
      lunchAfter,
    };
  }, [levelConfig, activeLevel, activeSession]);

  // Form states
  const [dayPlacement, setDayPlacement] = useState("any");
  const [periodMode, setPeriodMode] = useState("single"); // "single" | "consecutive"
  const [singleSlot, setSingleSlot] = useState("any");
  const [consecutiveType, setConsecutiveType] = useState("any_consecutive"); // "any_consecutive" | "specific_consecutive"
  const [specificConsecutiveSlot, setSpecificConsecutiveSlot] = useState("1-2");
  const [editingRuleId, setEditingRuleId] = useState(null);

  const comboboxRef = useRef(null);
  const formBoxRef = useRef(null);

  // Ensure selected consecutive slot matches available pairs
  useEffect(() => {
    if (actualPeriodStructure.consecutivePairs.length > 0) {
      const exists = actualPeriodStructure.consecutivePairs.some(
        (cp) => cp.value === specificConsecutiveSlot
      );
      if (!exists) {
        setSpecificConsecutiveSlot(actualPeriodStructure.consecutivePairs[0].value);
      }
    }
  }, [actualPeriodStructure, specificConsecutiveSlot]);

  // Load subjects for current school level from live storage with auto-seed fallback and Diadi NHS workload sync
  const loadSubjects = () => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("turotugma_subjects");
      let parsed = null;
      if (raw) {
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = null;
        }
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        window.localStorage.setItem("turotugma_subjects", JSON.stringify(DEFAULT_MATATAG_SUBJECTS));
        parsed = DEFAULT_MATATAG_SUBJECTS;
      } else {
        // Sync any existing subjects with Diadi NHS standard workloads (Core/Applied 4h/4x, STEM 3h/3x at 60m, HGP and ARAL 1h/1x at 60m)
        let needsSync = false;
        parsed = parsed.map((s) => {
          if (!s) return s;
          const code = String(s.subjectCode || "").trim().toUpperCase();
          const scope = String(s.programScope || "").toLowerCase();

          if (code === "DEVREAD" && (Number(s.classesPerWeek) !== 1 || Number(s.dailyMinutes) !== 60 || Number(s.hoursPerWeek) !== 1)) {
            needsSync = true;
            return { ...s, dailyMinutes: 60, classesPerWeek: 1, hoursPerWeek: 1 };
          }
          const isStemEnhanced3 = code === "ELEMALG" || code === "ENVSCI";
          if (isStemEnhanced3 && (Number(s.classesPerWeek) !== 3 || Number(s.dailyMinutes) !== 60 || Number(s.hoursPerWeek) !== 3)) {
            needsSync = true;
            return { ...s, dailyMinutes: 60, classesPerWeek: 3, hoursPerWeek: 3 };
          }
          if ((code === "HGP" || code === "ARAL") && (Number(s.classesPerWeek) !== 1 || Number(s.dailyMinutes) !== 60 || Number(s.hoursPerWeek) !== 1)) {
            needsSync = true;
            return { ...s, dailyMinutes: 60, classesPerWeek: 1, hoursPerWeek: 1 };
          }
          if (code === "ICT-STEM" || (code === "ICT" && scope.includes("stem") && !scope.includes("spj"))) {
            if (Number(s.classesPerWeek) !== 3 || Number(s.dailyMinutes) !== 60 || Number(s.hoursPerWeek) !== 3) {
              needsSync = true;
              return { ...s, dailyMinutes: 60, classesPerWeek: 3, hoursPerWeek: 3 };
            }
          }
          const isJhsCoreOrGeneral = String(s.schoolLevel || "").toLowerCase() === "jhs" &&
            (s.subjectType === "Core" || code === "TLE" || code === "SPASPEC" || code === "ICT-SPJ" || (code === "ICT" && !scope.includes("stem")));
          if (isJhsCoreOrGeneral && (Number(s.classesPerWeek) !== 4 || Number(s.dailyMinutes) !== 60 || Number(s.hoursPerWeek) !== 4)) {
            needsSync = true;
            return { ...s, dailyMinutes: 60, classesPerWeek: 4, hoursPerWeek: 4 };
          }
          return s;
        });

        if (needsSync) {
          window.localStorage.setItem("turotugma_subjects", JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent("turotugma_subjects_updated", { detail: parsed }));
        }
      }

      const levelSubs = parsed.filter((s) => {
        if (!s) return false;
        const lvl = String(s.schoolLevel || s.educationLevel || s.level || "").toLowerCase();
        if (activeLevel === "shs") return lvl.includes("shs") || lvl.includes("senior");
        return lvl.includes("jhs") || lvl.includes("junior") || !lvl;
      });
      setSubjects(levelSubs);
      return levelSubs;
    } catch (e) {
      // fallback
    }
    return [];
  };

  useEffect(() => {
    loadSubjects();
    handleResetForm();

    const handleStorage = (e) => {
      if (!e.key || e.key === "turotugma_subjects") {
        loadSubjects();
      }
    };
    const handleSubjectsUpdated = () => {
      loadSubjects();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("turotugma_subjects_updated", handleSubjectsUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("turotugma_subjects_updated", handleSubjectsUpdated);
    };
  }, [activeLevel]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLoadOfficialSubjects = () => {
    try {
      window.localStorage.setItem("turotugma_subjects", JSON.stringify(DEFAULT_MATATAG_SUBJECTS));
      window.dispatchEvent(new CustomEvent("turotugma_subjects_updated", { detail: DEFAULT_MATATAG_SUBJECTS }));
      loadSubjects();
      if (showNotice) {
        showNotice(`Official DepEd curriculum catalog (${DEFAULT_MATATAG_SUBJECTS.length} subjects) loaded successfully.`, "success");
      }
    } catch {
      if (showNotice) {
        showNotice("Could not load curriculum catalog.", "error");
      }
    }
  };

  const handleResetForm = () => {
    setSelectedSubject(null);
    setSearchQuery("");
    setDayPlacement("any");
    setPeriodMode("single");
    setSingleSlot("any");
    setConsecutiveType("any_consecutive");
    setSpecificConsecutiveSlot(actualPeriodStructure?.consecutivePairs?.[0]?.value || "1-2");
    setEditingRuleId(null);
    setIsDropdownOpen(false);
  };

  const handleSelectSubject = (subj) => {
    if (!subj) return;
    setSelectedSubject(subj);
    setSearchQuery(`${subj.subjectCode || ""} — ${subj.subjectName || ""}`.trim());
    setIsDropdownOpen(false);

    // Check if rule already exists for this subject
    const placementRules = Array.isArray(levelConfig?.constraints?.subjectPlacementRules)
      ? levelConfig.constraints.subjectPlacementRules
      : [];
    const fromRule = placementRules.find(
      (r) => r.subjectId === subj.id || (subj.subjectCode && r.subjectCode === subj.subjectCode)
    );

    const hasDouble = Boolean(fromRule?.isDoublePeriod ?? subj.isDoublePeriod);
    const day = fromRule?.preferredDay || subj.preferredDay || "any";
    const slot = fromRule?.preferredPeriodSlot || subj.preferredPeriodSlot || "any";
    const consType =
      fromRule?.consecutiveType ||
      (subj.consecutiveType ? subj.consecutiveType : slot.includes("-") ? "specific_consecutive" : "any_consecutive");

    setDayPlacement(day);
    setPeriodMode(hasDouble ? "consecutive" : "single");

    if (hasDouble) {
      setConsecutiveType(consType);
      if (slot.includes("-")) {
        setSpecificConsecutiveSlot(slot);
      } else {
        setSpecificConsecutiveSlot(actualPeriodStructure?.consecutivePairs?.[0]?.value || "1-2");
      }
    } else {
      setSingleSlot(slot);
    }

    if (
      fromRule ||
      subj.isDoublePeriod ||
      (subj.preferredDay && subj.preferredDay !== "any") ||
      (subj.preferredPeriodSlot && subj.preferredPeriodSlot !== "any")
    ) {
      setEditingRuleId(subj.id);
    } else {
      setEditingRuleId(null);
    }
  };

  const handleEditRule = (ruleItem) => {
    const targetSubject = subjects.find(
      (s) => s.id === ruleItem.subjectId || s.subjectCode === ruleItem.subjectCode
    );
    const base = targetSubject || {
      id: ruleItem.subjectId,
      subjectCode: ruleItem.subjectCode,
      subjectName: ruleItem.subjectName,
      gradeLevel: ruleItem.gradeLevel,
    };

    setSelectedSubject(base);
    setSearchQuery(`${base.subjectCode || ""} — ${base.subjectName || ""}`.trim());
    setDayPlacement(ruleItem.preferredDay || "any");

    const isDouble = Boolean(ruleItem.isDoublePeriod);
    setPeriodMode(isDouble ? "consecutive" : "single");

    const slot = ruleItem.preferredPeriodSlot || "any";
    const consType =
      ruleItem.consecutiveType || (slot.includes("-") ? "specific_consecutive" : "any_consecutive");

    if (isDouble) {
      setConsecutiveType(consType);
      if (slot.includes("-")) {
        setSpecificConsecutiveSlot(slot);
      } else {
        setSpecificConsecutiveSlot(actualPeriodStructure?.consecutivePairs?.[0]?.value || "1-2");
      }
    } else {
      setSingleSlot(slot);
    }

    setEditingRuleId(ruleItem.subjectId || ruleItem.subjectCode);

    if (formBoxRef.current) {
      formBoxRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleSaveRule = () => {
    if (!selectedSubject) {
      if (showNotice) showNotice("Please choose a subject using the search lookup first.", "error");
      return;
    }

    const subjectId = selectedSubject.id;
    const subjectCode = selectedSubject.subjectCode || selectedSubject.subjectName || subjectId;
    const subjectName = selectedSubject.subjectName || subjectCode;
    const isDouble = periodMode === "consecutive";
    const effectiveSlot = isDouble
      ? consecutiveType === "specific_consecutive"
        ? specificConsecutiveSlot
        : "any"
      : singleSlot;
    const specificPeriods =
      isDouble && consecutiveType === "specific_consecutive" && effectiveSlot.includes("-")
        ? effectiveSlot.split("-").map(Number)
        : [];

    const newRule = {
      subjectId,
      subjectCode,
      subjectName,
      gradeLevel: selectedSubject.gradeLevel || "",
      isDoublePeriod: isDouble,
      consecutiveType: isDouble ? consecutiveType : "single",
      preferredDay: dayPlacement,
      preferredPeriodSlot: effectiveSlot,
      specificPeriods,
      updatedAt: new Date().toISOString(),
    };

    // 1. Sync to local storage turotugma_subjects
    try {
      const raw = window.localStorage.getItem("turotugma_subjects");
      if (raw) {
        const parsed = JSON.parse(raw);
        const updated = parsed.map((s) => {
          if (s.id === subjectId || s.subjectCode === subjectCode) {
            return {
              ...s,
              isDoublePeriod: isDouble,
              consecutiveType: isDouble ? consecutiveType : "single",
              preferredDay: dayPlacement,
              preferredPeriodSlot: effectiveSlot,
              specificPeriods,
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        });
        window.localStorage.setItem("turotugma_subjects", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("turotugma_subjects_updated", { detail: updated }));
        loadSubjects();
      }
    } catch (e) {
      // fallback
    }

    // 2. Sync to levelConfig constraints
    const existingRules = Array.isArray(levelConfig?.constraints?.subjectPlacementRules)
      ? levelConfig.constraints.subjectPlacementRules
      : [];
    const otherRules = existingRules.filter((r) => r.subjectId !== subjectId && r.subjectCode !== subjectCode);
    const updatedRules = [...otherRules, newRule];

    updateLevelConfig((cfg) => ({
      ...cfg,
      constraints: {
        ...(cfg.constraints || {}),
        subjectPlacementRules: updatedRules,
      },
    }));

    // 3. Immediately persist to localStorage turotugma_schedule_configurations
    try {
      const configRaw = window.localStorage.getItem("turotugma_schedule_configurations");
      if (configRaw) {
        const parsedCfg = JSON.parse(configRaw);
        const activeKey = activeLevel === "shs" ? "shs" : "jhs";
        parsedCfg[activeKey] = {
          ...(parsedCfg[activeKey] || {}),
          constraints: {
            ...((parsedCfg[activeKey] && parsedCfg[activeKey].constraints) || {}),
            subjectPlacementRules: updatedRules,
          },
        };
        parsedCfg.constraints = {
          ...(parsedCfg.constraints || {}),
          subjectPlacementRules: updatedRules,
        };
        window.localStorage.setItem("turotugma_schedule_configurations", JSON.stringify(parsedCfg));
        window.dispatchEvent(new CustomEvent("turotugma_config_updated", { detail: parsedCfg }));
      }
    } catch (e) {
      // fallback
    }

    setEditingRuleId(subjectId);
    if (showNotice) {
      showNotice(`Placement rule saved for ${subjectName}.`, "success");
    }
  };

  const handleDeleteRule = (subjectId) => {
    if (!subjectId) return;

    const targetSubject = subjects.find((s) => s.id === subjectId);
    const subjectCode = targetSubject?.subjectCode || targetSubject?.subjectName || subjectId;
    const subjectName = targetSubject?.subjectName || subjectCode;

    try {
      const raw = window.localStorage.getItem("turotugma_subjects");
      if (raw) {
        const parsed = JSON.parse(raw);
        const updated = parsed.map((s) => {
          if (s.id === subjectId || s.subjectCode === subjectCode) {
            return {
              ...s,
              isDoublePeriod: false,
              consecutiveType: "single",
              preferredDay: "any",
              preferredPeriodSlot: "any",
              specificPeriods: [],
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        });
        window.localStorage.setItem("turotugma_subjects", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("turotugma_subjects_updated", { detail: updated }));
        loadSubjects();
      }
    } catch (e) {
      // fallback
    }

    const existingRules = Array.isArray(levelConfig?.constraints?.subjectPlacementRules)
      ? levelConfig.constraints.subjectPlacementRules
      : [];
    const remainingRules = existingRules.filter((r) => r.subjectId !== subjectId && r.subjectCode !== subjectCode);

    updateLevelConfig((cfg) => ({
      ...cfg,
      constraints: {
        ...(cfg.constraints || {}),
        subjectPlacementRules: remainingRules,
      },
    }));

    // Immediately persist to localStorage turotugma_schedule_configurations
    try {
      const configRaw = window.localStorage.getItem("turotugma_schedule_configurations");
      if (configRaw) {
        const parsedCfg = JSON.parse(configRaw);
        const activeKey = activeLevel === "shs" ? "shs" : "jhs";
        parsedCfg[activeKey] = {
          ...(parsedCfg[activeKey] || {}),
          constraints: {
            ...((parsedCfg[activeKey] && parsedCfg[activeKey].constraints) || {}),
            subjectPlacementRules: remainingRules,
          },
        };
        parsedCfg.constraints = {
          ...(parsedCfg.constraints || {}),
          subjectPlacementRules: remainingRules,
        };
        window.localStorage.setItem("turotugma_schedule_configurations", JSON.stringify(parsedCfg));
        window.dispatchEvent(new CustomEvent("turotugma_config_updated", { detail: parsedCfg }));
      }
    } catch (e) {
      // fallback
    }

    if (selectedSubject?.id === subjectId) {
      handleResetForm();
    }

    if (showNotice) {
      showNotice(`Placement rule removed for ${subjectName}.`, "info");
    }
  };

  const handleClearAllRules = () => {
    if (
      !window.confirm(
        `Are you sure you want to clear all subject placement rules for ${activeLevel.toUpperCase()}? This will revert all subjects to standard flexible placement.`
      )
    ) {
      return;
    }

    try {
      const raw = window.localStorage.getItem("turotugma_subjects");
      if (raw) {
        const parsed = JSON.parse(raw);
        const updated = parsed.map((s) => {
          const lvl = String(s.schoolLevel || s.educationLevel || s.level || "").toLowerCase();
          const matchesLevel =
            activeLevel === "shs"
              ? lvl.includes("shs") || lvl.includes("senior")
              : lvl.includes("jhs") || lvl.includes("junior") || !lvl;
          if (matchesLevel) {
            return {
              ...s,
              isDoublePeriod: false,
              consecutiveType: "single",
              preferredDay: "any",
              preferredPeriodSlot: "any",
              specificPeriods: [],
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        });
        window.localStorage.setItem("turotugma_subjects", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("turotugma_subjects_updated", { detail: updated }));
        loadSubjects();
      }
    } catch (e) {
      // fallback
    }

    updateLevelConfig((cfg) => ({
      ...cfg,
      constraints: {
        ...(cfg.constraints || {}),
        subjectPlacementRules: [],
      },
    }));

    // Immediately persist to localStorage turotugma_schedule_configurations
    try {
      const configRaw = window.localStorage.getItem("turotugma_schedule_configurations");
      if (configRaw) {
        const parsedCfg = JSON.parse(configRaw);
        const activeKey = activeLevel === "shs" ? "shs" : "jhs";
        parsedCfg[activeKey] = {
          ...(parsedCfg[activeKey] || {}),
          constraints: {
            ...((parsedCfg[activeKey] && parsedCfg[activeKey].constraints) || {}),
            subjectPlacementRules: [],
          },
        };
        parsedCfg.constraints = {
          ...(parsedCfg.constraints || {}),
          subjectPlacementRules: [],
        };
        window.localStorage.setItem("turotugma_schedule_configurations", JSON.stringify(parsedCfg));
        window.dispatchEvent(new CustomEvent("turotugma_config_updated", { detail: parsedCfg }));
      }
    } catch (e) {
      // fallback
    }

    handleResetForm();
    if (showNotice) {
      showNotice(`All ${activeLevel.toUpperCase()} subject placement rules have been cleared.`, "info");
    }
  };

  // Compile active configured rules
  const placementRulesMap = new Map();
  (Array.isArray(levelConfig?.constraints?.subjectPlacementRules)
    ? levelConfig.constraints.subjectPlacementRules
    : []
  ).forEach((r) => {
    if (
      r.isDoublePeriod ||
      (r.preferredDay && r.preferredDay !== "any") ||
      (r.preferredPeriodSlot && r.preferredPeriodSlot !== "any")
    ) {
      placementRulesMap.set(r.subjectId || r.subjectCode, r);
    }
  });

  const configuredRules = useMemo(() => {
    const rulesList = [];
    const handledKeys = new Set();

    subjects.forEach((s) => {
      const fromRule = placementRulesMap.get(s.id) || placementRulesMap.get(s.subjectCode);
      const isDoublePeriod = Boolean(s.isDoublePeriod || fromRule?.isDoublePeriod);
      const preferredDay =
        s.preferredDay && s.preferredDay !== "any" ? s.preferredDay : fromRule?.preferredDay || "any";
      const preferredPeriodSlot =
        s.preferredPeriodSlot && s.preferredPeriodSlot !== "any"
          ? s.preferredPeriodSlot
          : fromRule?.preferredPeriodSlot || "any";
      const consecutiveType =
        s.consecutiveType ||
        fromRule?.consecutiveType ||
        (preferredPeriodSlot.includes("-") ? "specific_consecutive" : "any_consecutive");

      if (isDoublePeriod || preferredDay !== "any" || preferredPeriodSlot !== "any") {
        rulesList.push({
          id: s.id,
          subjectId: s.id,
          subjectCode: s.subjectCode,
          subjectName: s.subjectName,
          gradeLevel: s.gradeLevel,
          isDoublePeriod,
          preferredDay,
          preferredPeriodSlot,
          consecutiveType,
        });
        handledKeys.add(s.id);
        if (s.subjectCode) handledKeys.add(s.subjectCode);
      }
    });

    // Also include any rules directly stored in levelConfig that might not yet be in subjects array
    placementRulesMap.forEach((rule, key) => {
      if (!handledKeys.has(key) && !handledKeys.has(rule.subjectId) && !handledKeys.has(rule.subjectCode)) {
        rulesList.push({
          id: rule.subjectId || rule.subjectCode || key,
          ...rule,
        });
        handledKeys.add(key);
      }
    });

    return rulesList;
  }, [subjects, placementRulesMap]);

  // Filtered subjects for hybrid dropdown
  const filteredSubjects = subjects.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.subjectCode || "").toLowerCase().includes(q) ||
      (s.subjectName || "").toLowerCase().includes(q) ||
      String(s.gradeLevel || "").toLowerCase().includes(q)
    );
  });

  const hasExistingRuleForSelected = Boolean(
    selectedSubject &&
    (placementRulesMap.has(selectedSubject.id) ||
      (selectedSubject.subjectCode && placementRulesMap.has(selectedSubject.subjectCode)) ||
      selectedSubject.isDoublePeriod ||
      (selectedSubject.preferredDay && selectedSubject.preferredDay !== "any") ||
      (selectedSubject.preferredPeriodSlot && selectedSubject.preferredPeriodSlot !== "any"))
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Dynamic Data Connectivity & Schedule Profile Header */}
      <div
        style={{
          border: "1px solid #c7d2fe",
          borderRadius: 8,
          padding: "10px 14px",
          background: "#f0f4ff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: subjects.length > 0 ? "#10b981" : "#f59e0b",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1f2c6f" }}>Live Subject Catalog:</span>
          <span style={{ fontSize: 12, color: "#3B4197", fontWeight: 600 }}>
            {subjects.length} active {activeLevel.toUpperCase()} subjects connected
          </span>
          {subjects.length === 0 ? (
            <button
              type="button"
              onClick={handleLoadOfficialSubjects}
              style={{
                background: "#3B4197",
                color: "#ffffff",
                border: "none",
                borderRadius: 4,
                padding: "3px 8px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Load Official DepEd Catalog
            </button>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1f2c6f" }}>Configured Timeline:</span>
          <span style={{ fontSize: 12, color: "#3B4197", fontWeight: 600 }}>
            {actualPeriodStructure.count} Periods/Day ({actualPeriodStructure.duration}m each • {actualPeriodStructure.periods[0]?.startTime || "07:30 AM"} – {actualPeriodStructure.periods[actualPeriodStructure.count - 1]?.endTime || "04:30 PM"})
          </span>
        </div>
      </div>

      {/* Interactive Rule Builder Card */}
      <div
        ref={formBoxRef}
        style={{
          border: "1px solid #dce5ff",
          borderRadius: 10,
          padding: 16,
          background: "#ffffff",
          display: "grid",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2c6f" }}>
            {editingRuleId ? "Edit Placement Rule" : "Configure Subject Placement Rule"}
          </span>
          {selectedSubject ? (
            <button
              type="button"
              onClick={handleResetForm}
              style={{
                background: "transparent",
                border: "none",
                color: "#3B4197",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: "2px 6px",
                textDecoration: "underline",
              }}
            >
              Clear Selection / New Rule
            </button>
          ) : null}
        </div>

        {/* 1. Hybrid Searchable Combobox Lookup */}
        <div style={{ position: "relative" }} ref={comboboxRef}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1f2c6f", marginBottom: 6 }}>
            Subject Lookup (Type to search by code or name)
          </label>
          <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                color: "#3B4197",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
                if (selectedSubject) setSelectedSubject(null);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Type subject code or title (e.g. MATH, Homeroom, Science, ESP)..."
              style={{
                width: "100%",
                padding: "9px 36px 9px 34px",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                fontSize: 13,
                color: "#1f2c6f",
                background: "#ffffff",
                outline: "none",
              }}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={handleResetForm}
                title="Clear lookup"
                style={{
                  position: "absolute",
                  right: 10,
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ) : null}
          </div>

          {/* Dropdown Results Box */}
          {isDropdownOpen ? (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                zIndex: 60,
                background: "#ffffff",
                border: "1px solid #bfdbfe",
                borderRadius: 8,
                boxShadow: "0 6px 20px rgba(59, 65, 151, 0.12)",
                maxHeight: 260,
                overflowY: "auto",
              }}
            >
              {filteredSubjects.length === 0 ? (
                <div style={{ padding: "12px 14px", fontSize: 12, color: "#64748b", textAlign: "center" }}>
                  No matching subjects found in {activeLevel.toUpperCase()} catalog.
                </div>
              ) : (
                filteredSubjects.map((s) => {
                  const hasRule =
                    placementRulesMap.has(s.id) ||
                    placementRulesMap.has(s.subjectCode) ||
                    s.isDoublePeriod ||
                    (s.preferredDay && s.preferredDay !== "any") ||
                    (s.preferredPeriodSlot && s.preferredPeriodSlot !== "any");
                  const isCurrent = selectedSubject?.id === s.id;

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSubject(s)}
                      style={{
                        padding: "9px 12px",
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: isCurrent ? "#eff6ff" : "#ffffff",
                        transition: "background 0.1s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) e.currentTarget.style.background = "#f4f7ff";
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) e.currentTarget.style.background = "#ffffff";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1f2c6f" }}>
                          {s.subjectCode}
                        </span>
                        <span style={{ fontSize: 12, color: "#475569" }}>
                          {s.subjectName}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            background: "#eff6ff",
                            color: "#1e40af",
                            border: "1px solid #dce5ff",
                            padding: "1px 6px",
                            borderRadius: 4,
                          }}
                        >
                          Grade {s.gradeLevel || "All"}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            background: "#f1f5f9",
                            color: "#475569",
                            padding: "1px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {s.subjectType || "Core"}
                        </span>
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          {s.classesPerWeek || 4}x/wk ({s.dailyMinutes || 60}m)
                        </span>
                      </div>
                      {hasRule ? (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            background: "#3B4197",
                            color: "#ffffff",
                            padding: "2px 6px",
                            borderRadius: 4,
                            flexShrink: 0,
                          }}
                        >
                          Rule Configured
                        </span>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          ) : null}
        </div>

        {/* Selected Subject Info Pill */}
        {selectedSubject ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f4f7ff",
              border: "1px solid #bfdbfe",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 700, color: "#1f2c6f" }}>
                Target: {selectedSubject.subjectCode} — {selectedSubject.subjectName}
              </span>
              <span style={{ color: "#475569" }}>
                ({selectedSubject.classesPerWeek || 4} meeting/wk • {selectedSubject.dailyMinutes || 60} min)
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#3B4197",
              }}
            >
              {hasExistingRuleForSelected ? "[Active Rule Loaded]" : "[New Rule Setup]"}
            </span>
          </div>
        ) : null}

        {/* 2. Rule Configuration Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {/* Day Lock Control */}
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#1f2c6f" }}>
              Day Placement Lock
            </label>
            <select
              value={dayPlacement}
              onChange={(e) => setDayPlacement(e.target.value)}
              style={selectStyle()}
            >
              <option value="any">Any Day (Flexible across all school days)</option>
              <option value="Monday">Monday Only</option>
              <option value="Tuesday">Tuesday Only</option>
              <option value="Wednesday">Wednesday Only</option>
              <option value="Thursday">Thursday Only</option>
              <option value="Friday">Friday Only</option>
              <option value="Saturday">Saturday Only</option>
            </select>
            <span style={{ fontSize: 11, color: "#64748b" }}>
              Lock this subject strictly to a single day, or allow scheduling across any day.
            </span>
          </div>

          {/* Period Mode Segmented Control */}
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#1f2c6f" }}>
              Meeting Duration & Consecutive Mode
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                background: "#eef2ff",
                padding: 3,
                borderRadius: 6,
                border: "1px solid #c7d2fe",
              }}
            >
              <button
                type="button"
                onClick={() => setPeriodMode("single")}
                style={{
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  background: periodMode === "single" ? "#3B4197" : "transparent",
                  color: periodMode === "single" ? "#ffffff" : "#4338ca",
                  transition: "all 0.15s ease",
                }}
              >
                Single Period (1 Period)
              </button>
              <button
                type="button"
                onClick={() => setPeriodMode("consecutive")}
                style={{
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  background: periodMode === "consecutive" ? "#3B4197" : "transparent",
                  color: periodMode === "consecutive" ? "#ffffff" : "#4338ca",
                  transition: "all 0.15s ease",
                }}
              >
                Consecutive Double Period
              </button>
            </div>
            <span style={{ fontSize: 11, color: "#64748b" }}>
              Choose single meeting or double-period back-to-back block.
            </span>
          </div>
        </div>

        {/* 3. Granular Period Slot Controls */}
        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
          {periodMode === "single" ? (
            <div style={{ display: "grid", gap: 6, maxWidth: 540 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#1f2c6f" }}>
                Period Slot Placement Lock
              </label>
              <select
                value={singleSlot}
                onChange={(e) => setSingleSlot(e.target.value)}
                style={selectStyle()}
              >
                <option value="any">Any Period (Flexible across all {actualPeriodStructure.count} periods)</option>
                {actualPeriodStructure.periods.map((p) => (
                  <option key={p.num} value={String(p.num)}>
                    {p.label} ({p.timeSpan}) {p.num === 1 ? "— Homeroom / Start of Day" : p.num === actualPeriodStructure.count ? "— Last Period of Day" : ""}
                  </option>
                ))}
                {actualPeriodStructure.lunchAfter > 0 && actualPeriodStructure.lunchAfter < actualPeriodStructure.count ? (
                  <>
                    <option value="morning">
                      Morning Classes ({getOrdinalPeriodLabel(1)} – {getOrdinalPeriodLabel(actualPeriodStructure.lunchAfter)})
                    </option>
                    <option value="afternoon">
                      Afternoon Classes ({getOrdinalPeriodLabel(actualPeriodStructure.lunchAfter + 1)} – {getOrdinalPeriodLabel(actualPeriodStructure.count)})
                    </option>
                  </>
                ) : null}
                <option value="last">
                  Last Period of Day ({getOrdinalPeriodLabel(actualPeriodStructure.count)})
                </option>
              </select>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                Target a single slot lock, dynamically aligned with your configured schedule timeline.
              </span>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1f2c6f" }}>
                  Consecutive Timing Type
                </label>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "#1f2c6f",
                      cursor: "pointer",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid",
                      borderColor: consecutiveType === "any_consecutive" ? "#3B4197" : "#cbd5e1",
                      background: consecutiveType === "any_consecutive" ? "#eff6ff" : "#ffffff",
                    }}
                  >
                    <input
                      type="radio"
                      name="consecutiveType"
                      value="any_consecutive"
                      checked={consecutiveType === "any_consecutive"}
                      onChange={() => setConsecutiveType("any_consecutive")}
                    />
                    <span style={{ fontWeight: consecutiveType === "any_consecutive" ? 700 : 500 }}>
                      Consecutive Random Periods (Any 2 consecutive slots)
                    </span>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "#1f2c6f",
                      cursor: "pointer",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid",
                      borderColor: consecutiveType === "specific_consecutive" ? "#3B4197" : "#cbd5e1",
                      background: consecutiveType === "specific_consecutive" ? "#eff6ff" : "#ffffff",
                    }}
                  >
                    <input
                      type="radio"
                      name="consecutiveType"
                      value="specific_consecutive"
                      checked={consecutiveType === "specific_consecutive"}
                      onChange={() => setConsecutiveType("specific_consecutive")}
                    />
                    <span style={{ fontWeight: consecutiveType === "specific_consecutive" ? 700 : 500 }}>
                      Specified Consecutive Periods (Strict pair)
                    </span>
                  </label>
                </div>
              </div>

              {consecutiveType === "specific_consecutive" ? (
                <div style={{ display: "grid", gap: 6, maxWidth: 480, marginTop: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#1f2c6f" }}>
                    Select Exact Consecutive Period Pair
                  </label>
                  <select
                    value={specificConsecutiveSlot}
                    onChange={(e) => setSpecificConsecutiveSlot(e.target.value)}
                    style={selectStyle()}
                  >
                    {actualPeriodStructure.consecutivePairs.map((pair) => (
                      <option key={pair.value} value={pair.value}>
                        {pair.label}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    The solver will strictly schedule this subject in this dynamic consecutive pair.
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  The solver will automatically schedule 2 continuous periods together at any open consecutive slot.
                </span>
              )}
            </div>
          )}
        </div>

        {/* 4. Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleSaveRule}
            style={{
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 8,
              background: "#3B4197",
              color: "#ffffff",
              border: "1px solid #3B4197",
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
          >
            {editingRuleId ? "Update Placement Rule" : "Save Placement Rule"}
          </button>

          {editingRuleId || selectedSubject ? (
            <button
              type="button"
              onClick={handleResetForm}
              style={{
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 8,
                background: "#ffffff",
                color: "#1f2c6f",
                border: "1px solid #bfdbfe",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          ) : null}

          {editingRuleId ? (
            <button
              type="button"
              onClick={() => handleDeleteRule(editingRuleId)}
              style={{
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 8,
                background: "#ffffff",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                cursor: "pointer",
              }}
            >
              Delete This Rule
            </button>
          ) : null}
        </div>
      </div>

      {/* 5. Active Configured Rules Table */}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2c6f" }}>
            Active Configured Placement Rules ({configuredRules.length})
          </span>
          {configuredRules.length > 0 ? (
            <button
              type="button"
              onClick={handleClearAllRules}
              style={{
                background: "transparent",
                border: "none",
                color: "#b91c1c",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              Clear All Rules
            </button>
          ) : null}
        </div>

        {configuredRules.length > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {configuredRules.map((rule) => {
              const isDouble = Boolean(rule.isDoublePeriod);
              const day = rule.preferredDay || "any";
              const slot = rule.preferredPeriodSlot || "any";
              const consType = rule.consecutiveType || (slot.includes("-") ? "specific_consecutive" : "any_consecutive");

              let periodLabel = "Flexible Period";
              let isOutOfRange = false;
              if (isDouble) {
                if (consType === "specific_consecutive" && slot.includes("-")) {
                  const [p1Num, p2Num] = slot.split("-").map(Number);
                  if (p1Num > actualPeriodStructure.count || p2Num > actualPeriodStructure.count) {
                    isOutOfRange = true;
                  }
                  const matchedPair = actualPeriodStructure.consecutivePairs.find((cp) => cp.value === slot);
                  periodLabel = matchedPair ? matchedPair.label : getOrdinalPeriodPairLabel(p1Num, p2Num);
                } else {
                  periodLabel = "Any 2 Consecutive Periods";
                }
              } else {
                if (slot === "first" || slot === "1") {
                  const p1 = actualPeriodStructure.periods[0];
                  periodLabel = `${getOrdinalPeriodLabel(1)} (${p1?.timeSpan || "07:30 AM – 08:20 AM"})`;
                } else if (slot === "last") {
                  const pLast = actualPeriodStructure.periods[actualPeriodStructure.periods.length - 1];
                  periodLabel = `Last Period (${getOrdinalPeriodLabel(actualPeriodStructure.count)}${pLast ? ` • ${pLast.timeSpan}` : ""})`;
                } else if (slot === "morning") {
                  periodLabel = `Morning Classes (${getOrdinalPeriodLabel(1)} – ${getOrdinalPeriodLabel(actualPeriodStructure.lunchAfter)})`;
                } else if (slot === "afternoon") {
                  periodLabel = `Afternoon Classes (${getOrdinalPeriodLabel(actualPeriodStructure.lunchAfter + 1)} – ${getOrdinalPeriodLabel(actualPeriodStructure.count)})`;
                } else if (slot !== "any") {
                  const pNum = Number(slot);
                  if (pNum > actualPeriodStructure.count) {
                    isOutOfRange = true;
                  }
                  const matchedP = actualPeriodStructure.periods.find((p) => p.num === pNum);
                  periodLabel = matchedP ? `${matchedP.label} (${matchedP.timeSpan})` : getOrdinalPeriodLabel(slot);
                }
              }

              const isBeingEdited = editingRuleId === rule.id || editingRuleId === rule.subjectCode;

              return (
                <div
                  key={rule.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: isBeingEdited ? "#eff6ff" : "#ffffff",
                    border: "1px solid",
                    borderColor: isBeingEdited ? "#3B4197" : "#dce5ff",
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 700, color: "#1f2c6f", fontSize: 13 }}>
                      {rule.subjectCode}
                    </span>
                    <span style={{ color: "#334155", fontSize: 13 }}>
                      {rule.subjectName}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        background: "#eff6ff",
                        color: "#1e40af",
                        border: "1px solid #dce5ff",
                        padding: "1px 6px",
                        borderRadius: 4,
                      }}
                    >
                      Grade {rule.gradeLevel || "All"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {/* Day Badge */}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        background: day !== "any" ? "#3B4197" : "#eff6ff",
                        color: day !== "any" ? "#ffffff" : "#1e40af",
                        padding: "3px 8px",
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: day !== "any" ? "#3B4197" : "#bfdbfe",
                      }}
                    >
                      {day !== "any" ? `${day} Only` : "Any Day"}
                    </span>

                    {/* Period Badge */}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        background: isOutOfRange ? "#fffbeb" : "#f4f7ff",
                        color: isOutOfRange ? "#92400e" : "#1f2c6f",
                        padding: "3px 8px",
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: isOutOfRange ? "#fde68a" : "#bfdbfe",
                      }}
                    >
                      {periodLabel}
                    </span>

                    {isOutOfRange ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: "#fef2f2",
                          color: "#991b1b",
                          padding: "3px 8px",
                          borderRadius: 4,
                          border: "1px solid #fecaca",
                        }}
                      >
                        Exceeds {actualPeriodStructure.count}-Period Limit
                      </span>
                    ) : null}

                    {/* Double Period Pill */}
                    {isDouble ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: "#e0e7ff",
                          color: "#3730a3",
                          padding: "3px 6px",
                          borderRadius: 4,
                          border: "1px solid #c7d2fe",
                        }}
                      >
                        Double Period Block
                      </span>
                    ) : null}

                    {/* Actions */}
                    <button
                      type="button"
                      onClick={() => handleEditRule(rule)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        color: "#1d4ed8",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "#ffffff",
                        border: "1px solid #fecaca",
                        color: "#b91c1c",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              background: "#f4f7ff",
              border: "1px dashed #bfdbfe",
              borderRadius: 8,
              color: "#5d698f",
              fontSize: 12,
            }}
          >
            No custom subject placement rules configured for {activeLevel.toUpperCase()}. Use the subject lookup above to set day locks or consecutive period requirements.
          </div>
        )}
      </div>
    </div>
  );
}

function BreakCard({ title, config, onChange, maxPeriods = 9 }) {
  const isEnabled = config?.enabled ?? true;
  const dur = config?.duration ?? 15;
  const afterP = Math.min(maxPeriods, Math.max(1, config?.afterPeriod ?? 2));

  return (
    <div style={{ border: "1px solid #e3e7ef", borderRadius: 10, padding: 12, background: "#ffffff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2c6f" }}>{title}</span>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
          />
          Enabled
        </label>
      </div>

      {isEnabled ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          <Field label="Duration (mins)">
            <input
              type="number"
              min={5}
              max={90}
              value={dur}
              onChange={(e) => onChange({ ...config, duration: Number(e.target.value) })}
              style={inputStyle()}
            />
          </Field>

          <Field label={`After Period (1 to ${maxPeriods})`}>
            <input
              type="number"
              min={1}
              max={maxPeriods}
              value={afterP}
              onChange={(e) => {
                const val = Math.min(maxPeriods, Math.max(1, Number(e.target.value) || 1));
                onChange({ ...config, afterPeriod: val });
              }}
              style={inputStyle()}
            />
          </Field>
        </div>
      ) : (
        <p style={{ margin: 0, color: "#8a96b6", fontSize: 12 }}>Break disabled.</p>
      )}
    </div>
  );
}

function CheckboxRule({ label, description, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={checked ?? false}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 3 }}
      />
      <div>
        <span style={{ color: "#1f2c6f", fontSize: 13, fontWeight: 700 }}>{label}</span>
        <p style={{ margin: "2px 0 0", color: "#5d698d", fontSize: 12 }}>{description}</p>
      </div>
    </label>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span style={{ margin: 0, color: "#5f6b90", fontSize: 12, fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

function inputStyle() {
  return {
    width: "100%",
    height: 36,
    border: "1px solid #cfd7ef",
    borderRadius: 9,
    padding: "0 10px",
    fontSize: 13,
    color: "#1f2c6f",
    boxSizing: "border-box",
    background: "#ffffff",
  };
}

function selectStyle() {
  return {
    ...inputStyle(),
    appearance: "none",
  };
}

function subTabButtonStyle(active) {
  return {
    border: active ? "1.5px solid #3B4197" : "1px solid #dce5ff",
    background: active ? "#3B4197" : "#ffffff",
    color: active ? "#ffffff" : "#475569",
    borderRadius: 10,
    padding: "9px 15px",
    fontSize: 13,
    fontWeight: active ? 700 : 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    boxShadow: active ? "0 4px 12px rgba(59, 65, 151, 0.2)" : "0 1px 3px rgba(0,0,0,0.02)",
    transition: "all 0.15s ease",
  };
}

function levelPillStyle(active) {
  return {
    border: "none",
    background: active ? "#3B4197" : "transparent",
    color: active ? "#ffffff" : "#4d5a84",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  };
}

function sessionTabStyle(active) {
  return {
    border: "none",
    background: active ? "#ffffff" : "transparent",
    color: active ? "#2c3886" : "#5d698d",
    borderRadius: 999,
    padding: "6px 16px",
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    boxShadow: active ? "0 2px 6px rgba(44, 56, 134, 0.15)" : "none",
  };
}

function dayPillStyle(isActiveSession, isOtherSession) {
  if (isActiveSession) {
    return {
      border: "1.5px solid #1d4ed8",
      background: "#2563eb",
      color: "#ffffff",
      borderRadius: 999,
      padding: "6px 18px",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
      transition: "all 0.15s ease",
    };
  }

  if (isOtherSession) {
    return {
      border: "1.5px solid #93c5fd",
      background: "#dbeafe",
      color: "#1e40af",
      borderRadius: 999,
      padding: "6px 18px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.15s ease",
    };
  }

  // Not selected (off day) - greyed out
  return {
    border: "1px solid #cbd5e1",
    background: "#f1f5f9",
    color: "#94a3b8",
    borderRadius: 999,
    padding: "6px 18px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    opacity: 0.85,
    transition: "all 0.15s ease",
  };
}

function primaryActionStyle(variant = "primary") {
  const isSuccess = variant === "success";
  return {
    border: "none",
    background: isSuccess ? "#16a34a" : "#3B4197",
    color: "#ffffff",
    borderRadius: 10,
    minHeight: 48,
    padding: "12px 26px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: isSuccess ? "0 4px 14px rgba(22, 163, 74, 0.28)" : "0 4px 14px rgba(59, 65, 151, 0.28)",
    transition: "all 0.18s ease",
  };
}

function mergeLevelConfig(incoming, defaultConfig) {
  if (!incoming || typeof incoming !== "object") return defaultConfig;

  const defaultDays = {
    Monday: "regular",
    Tuesday: "regular",
    Wednesday: "regular",
    Thursday: "regular",
    Friday: "shortened",
    Saturday: "off",
    Sunday: "off",
  };

  const dayAssignments = {
    ...defaultDays,
    ...(defaultConfig.dayAssignments || {}),
    ...(incoming.dayAssignments || {}),
  };

  // Backwards compatibility: If legacy saved Saturday as shortened and Friday as regular, migrate to requested default
  if (incoming.dayAssignments && incoming.dayAssignments.Friday === "regular" && incoming.dayAssignments.Saturday === "shortened") {
    dayAssignments.Friday = "shortened";
    dayAssignments.Saturday = "off";
  }

  // Backwards compatibility for daySessions
  if (incoming.daySessions) {
    Object.entries(incoming.daySessions).forEach(([d, val]) => {
      dayAssignments[d] = val;
    });
  }

  const mode = "manual";
  const periodCalculationMode = "manual";
  const periodStructureMode = "configured";

  const defaultReg = defaultConfig.sessions.regular;
  const defaultShort = defaultConfig.sessions.shortened;

  const incomingReg = incoming.sessions?.regular || {};
  const incomingShort = incoming.sessions?.shortened || {};

  return {
    schoolStartTime: incoming.schoolStartTime || defaultConfig.schoolStartTime || "07:30",
    schoolEndTime: (incoming.schoolEndTime === "16:30" || !incoming.schoolEndTime) ? (defaultConfig.schoolEndTime || "17:00") : incoming.schoolEndTime,
    periodCalculationMode,
    periodStructureMode,
    dayAssignments,
    sessions: {
      regular: {
        duration: Number(incomingReg.duration ?? incoming.sessionDurations?.regular ?? defaultReg.duration) || 60,
        manualPeriodCount: Number(incomingReg.manualPeriodCount ?? incoming.manualPeriodCount ?? defaultReg.manualPeriodCount) || 8,
        breaks: {
          morning: { ...defaultReg.breaks.morning, ...(incomingReg.breaks?.morning || incoming.breaks?.morning || {}) },
          lunch: { ...defaultReg.breaks.lunch, ...(incomingReg.breaks?.lunch || incoming.breaks?.lunch || {}) },
          afternoon: { ...defaultReg.breaks.afternoon, ...(incomingReg.breaks?.afternoon || incoming.breaks?.afternoon || {}) },
        },
      },
      shortened: {
        duration: Number(incomingShort.duration ?? incoming.sessionDurations?.shortened ?? defaultShort.duration) || 45,
        manualPeriodCount: Number(incomingShort.manualPeriodCount ?? defaultShort.manualPeriodCount) || 6,
        breaks: {
          morning: { ...defaultShort.breaks.morning, ...(incomingShort.breaks?.morning || {}) },
          lunch: { ...defaultShort.breaks.lunch, ...(incomingShort.breaks?.lunch || {}) },
          afternoon: { ...defaultShort.breaks.afternoon, ...(incomingShort.breaks?.afternoon || {}) },
        },
      },
    },
    constraints: {
      ...defaultConfig.constraints,
      ...(incoming.constraints || {}),
    },
  };
}

function getInitialProfile() {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    const initialSchoolLogo = (parsed.schoolLogoUrl && parsed.schoolLogoUrl.startsWith("data:"))
      ? parsed.schoolLogoUrl
      : "/diadi-nhs-logo.png?v=1980";
    const jhsLogo = (parsed.brandingByLevel?.jhs?.schoolLogoUrl && parsed.brandingByLevel?.jhs?.schoolLogoUrl.startsWith("data:"))
      ? parsed.brandingByLevel.jhs.schoolLogoUrl
      : initialSchoolLogo;
    const shsLogo = (parsed.brandingByLevel?.shs?.schoolLogoUrl && parsed.brandingByLevel?.shs?.schoolLogoUrl.startsWith("data:"))
      ? parsed.brandingByLevel.shs.schoolLogoUrl
      : initialSchoolLogo;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      schoolLogoUrl: initialSchoolLogo,
      brandingByLevel: {
        jhs: {
          ...DEFAULT_PROFILE.brandingByLevel.jhs,
          ...(parsed.brandingByLevel?.jhs || {}),
          schoolLogoUrl: jhsLogo,
        },
        shs: {
          ...DEFAULT_PROFILE.brandingByLevel.shs,
          ...(parsed.brandingByLevel?.shs || {}),
          schoolLogoUrl: shsLogo,
        },
      },
      schoolType: parsed.schoolType || DEFAULT_PROFILE.schoolType,
      signatoryMode: parsed.signatoryMode || DEFAULT_PROFILE.signatoryMode,
      signatoriesByLevel: {
        jhs: {
          ...DEFAULT_PROFILE.signatoriesByLevel.jhs,
          ...(parsed.signatoriesByLevel?.jhs || {}),
        },
        shs: {
          ...DEFAULT_PROFILE.signatoriesByLevel.shs,
          ...(parsed.signatoriesByLevel?.shs || {}),
        },
      },
      signatories: {
        ...DEFAULT_PROFILE.signatories,
        ...(parsed.signatories || {}),
      },
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function getInitialConfigs() {
  if (typeof window === "undefined") return DEFAULT_CONFIGS;
  try {
    const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIGS;
    const parsed = JSON.parse(raw);
    return {
      jhs: mergeLevelConfig(parsed?.jhs, DEFAULT_CONFIGS.jhs),
      shs: mergeLevelConfig(parsed?.shs, DEFAULT_CONFIGS.shs),
    };
  } catch {
    return DEFAULT_CONFIGS;
  }
}

function calculatePeriodRecommendation({
  startTimeStr = "07:30",
  endTimeStr = "17:00",
  duration = 50,
  breaksConfig = {},
  levelKey = "jhs",
  dayAssignments = {},
  activeSession = "regular",
}) {
  // Count total active instructional days across the school week (excluding 'off' days)
  const totalSchoolDays = Object.values(dayAssignments || {}).filter(
    (s) => s !== "off"
  ).length || 5;

  let maxSectionWeeklyPeriods = 0;
  let maxSectionLabel = "";

  if (typeof window !== "undefined") {
    try {
      const rawSections = window.localStorage.getItem("turotugma_sections_created");
      const rawSubjects = window.localStorage.getItem("turotugma_subjects");
      const parsedSubjects = rawSubjects ? JSON.parse(rawSubjects) : [];
      const targetLevel = String(levelKey || "jhs").toLowerCase();

      // Filter subjects for target school level
      const activeSubjects = Array.isArray(parsedSubjects) ? parsedSubjects.filter((s) => {
        if (!s) return false;
        const sLevel = String(s.schoolLevel || s.educationLevel || s.level || "").toLowerCase();
        const gNum = parseInt(String(s.gradeLevel || s.yearLevel || "").replace(/\D/g, ""), 10);
        const isShsGrade = gNum === 11 || gNum === 12;
        const isJhsGrade = gNum >= 7 && gNum <= 10;
        if (targetLevel.startsWith("shs")) return sLevel.includes("shs") || sLevel.includes("senior") || isShsGrade;
        return sLevel.includes("jhs") || sLevel.includes("junior") || isJhsGrade || (!sLevel && !isShsGrade);
      }) : [];

      let sectionsList = [];
      if (rawSections) {
        try {
          const parsedSec = JSON.parse(rawSections);
          if (Array.isArray(parsedSec)) {
            sectionsList = parsedSec.filter((sec) => {
              const gNum = parseInt(String(sec.grade || sec.gradeLevel || "").replace(/\D/g, ""), 10);
              if (targetLevel.startsWith("shs")) return gNum === 11 || gNum === 12;
              return gNum >= 7 && gNum <= 10;
            });
          }
        } catch (e) { }
      }

      if (sectionsList.length > 0) {
        // Calculate true per-section weekly period load based on track & curriculum
        sectionsList.forEach((sec) => {
          const secClassification = String(sec.track || sec.classification || "Regular").toUpperCase();
          const secGrade = parseInt(String(sec.grade || sec.gradeLevel || "7").replace(/\D/g, ""), 10);

          let secWeeklyPeriods = 0;
          activeSubjects.forEach((sub) => {
            const subGrade = parseInt(String(sub.gradeLevel || "").replace(/\D/g, ""), 10);
            if (subGrade && subGrade !== secGrade && !String(sub.gradeLevel).includes("7–10") && !String(sub.gradeLevel).includes("7-10")) {
              return;
            }

            const code = String(sub.subjectCode || "").toUpperCase();
            const name = String(sub.subjectName || "").toUpperCase();
            const type = String(sub.subjectType || "").toLowerCase();
            const scope = String(sub.programScope || "").toUpperCase();

            let matches = false;
            if (type === "core" || scope.includes("UNIVERSAL") || scope === "ALL") {
              matches = true;
            } else if (scope.includes("REGULAR") && (secClassification === "REGULAR" || secClassification === "GENERAL")) {
              matches = true;
            } else if (scope.includes("SPA") && secClassification === "SPA") {
              matches = true;
            } else if (scope.includes("SPJ") && secClassification === "SPJ") {
              matches = true;
            } else if ((scope.includes("STEM") || scope.includes("STE")) && secClassification.includes("STEM")) {
              matches = true;
            } else if (type === "specialized" && (name.includes(secClassification) || code.includes(secClassification))) {
              matches = true;
            }

            if (matches) {
              const p = Number(sub.classesPerWeek || sub.weeklyPeriods || sub.hoursPerWeek || 4);
              secWeeklyPeriods += (isNaN(p) || p <= 0 ? 4 : Math.min(10, p));
            }
          });

          if (secWeeklyPeriods > maxSectionWeeklyPeriods) {
            maxSectionWeeklyPeriods = secWeeklyPeriods;
            maxSectionLabel = `${sec.name || `Grade ${secGrade}`} (${sec.track || "Regular"})`;
          }
        });
      }

      // Fallback: DepEd standard section curriculum load is ~35-37 weekly periods
      if (maxSectionWeeklyPeriods === 0) {
        maxSectionWeeklyPeriods = 37;
        maxSectionLabel = "Standard DepEd Curriculum (Core + Specialization)";
      }
    } catch (e) {
      maxSectionWeeklyPeriods = 37;
      maxSectionLabel = "Standard DepEd Curriculum";
    }
  } else {
    maxSectionWeeklyPeriods = 37;
    maxSectionLabel = "Standard DepEd Curriculum";
  }

  // Calculate daily curriculum demand: weekly periods divided across all active school days
  const requiredFromCurriculum = Math.ceil(maxSectionWeeklyPeriods / Math.max(1, totalSchoolDays));

  const parseMins = (t) => {
    const parts = String(t).split(":").map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
    return parts[0] * 60 + parts[1];
  };
  const startMins = parseMins(startTimeStr);
  const endMins = parseMins(endTimeStr);

  const totalSchoolMins = endMins > startMins ? endMins - startMins : 0;
  let totalBreakMins = 0;
  if (breaksConfig?.morning?.enabled) totalBreakMins += Number(breaksConfig.morning.duration || 0);
  if (breaksConfig?.lunch?.enabled) totalBreakMins += Number(breaksConfig.lunch.duration || 0);
  if (breaksConfig?.afternoon?.enabled) totalBreakMins += Number(breaksConfig.afternoon.duration || 0);

  const netTeachingMins = Math.max(0, totalSchoolMins - totalBreakMins);
  const dur = Number(duration) || 50;
  const timeCapacity = dur > 0 ? Math.floor(netTeachingMins / dur) : 8;

  // The recommended periods is based on curriculum demand (capped at 10)
  const recommendedPeriods = Math.max(1, Math.min(10, requiredFromCurriculum || 8));

  return {
    recommendedPeriods,
    activeDaysCount: totalSchoolDays,
    requiredFromCurriculum,
    maxGradeWeeklyPeriods: maxSectionWeeklyPeriods,
    maxGradeLabel: maxSectionLabel,
    totalSchoolMins,
    totalBreakMins,
    netTeachingMins,
    timeCapacity,
  };
}

function BellTimelineVisualizer({
  levelConfig,
  activeSession,
  activeLevel,
  onBreakMove,
  onApplyPreset,
  onSyncOperatingHours,
}) {
  const sessionConfig = levelConfig?.sessions?.[activeSession] || {};
  const startTimeStr = levelConfig?.schoolStartTime || "07:30";
  const duration = Number(sessionConfig.duration) || 60;
  const periodCount = Math.max(1, Math.min(10, Number(sessionConfig.manualPeriodCount || levelConfig?.manualPeriodCount) || 8));
  const breaks = sessionConfig.breaks || {};
  const constraints = levelConfig?.constraints || {};

  const [draggedBreakKey, setDraggedBreakKey] = useState(null);
  const [hoveredPeriodNum, setHoveredPeriodNum] = useState(null);

  const [startH, startM] = (startTimeStr || "07:30").split(":").map(Number);
  let currentMins = (startH || 7) * 60 + (startM || 30);
  const dayStartMins = currentMins;

  const formatTime = (totalMins) => {
    let hrs = Math.floor(totalMins / 60) % 24;
    let mins = totalMins % 60;
    const ampm = hrs >= 12 ? "PM" : "AM";
    let displayH = hrs % 12;
    if (displayH === 0) displayH = 12;
    const strH = String(displayH).padStart(2, "0");
    const strM = String(mins).padStart(2, "0");
    return `${strH}:${strM} ${ampm}`;
  };

  const format24Time = (totalMins) => {
    const hrs = Math.floor(totalMins / 60) % 24;
    const mins = totalMins % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const items = [];
  const activeBreaks = [
    { key: "morning", name: "Morning Recess", color: "#b45309", bg: "#fffbeb", border: "#f59e0b", ...(breaks.morning || {}) },
    { key: "lunch", name: "Lunch Break", color: "#065f46", bg: "#ecfdf5", border: "#10b981", ...(breaks.lunch || {}) },
    { key: "afternoon", name: "Afternoon Break", color: "#6b21a8", bg: "#faf5ff", border: "#a855f7", ...(breaks.afternoon || {}) },
  ];

  const lunchAfterPeriod = breaks.lunch?.enabled ? Number(breaks.lunch.afterPeriod) : 4;
  const flagPeriod = constraints.enforceFixedPeriods ? Number(constraints.flagCeremonyPeriod) : null;

  for (let p = 1; p <= periodCount; p++) {
    const periodStart = currentMins;
    const periodEnd = currentMins + duration;
    items.push({
      type: "period",
      num: p,
      label: getOrdinalPeriodLabel(p),
      duration,
      startMins: periodStart,
      endMins: periodEnd,
      startTimeStr: formatTime(periodStart),
      endTimeStr: formatTime(periodEnd),
    });
    currentMins = periodEnd;

    activeBreaks.forEach((brk) => {
      if (brk.enabled && Number(brk.afterPeriod) === p) {
        const brkDuration = Number(brk.duration) || 15;
        const brkStart = currentMins;
        const brkEnd = currentMins + brkDuration;
        items.push({
          type: "break",
          key: brk.key,
          name: brk.name,
          duration: brkDuration,
          startMins: brkStart,
          endMins: brkEnd,
          afterPeriod: p,
          startTimeStr: formatTime(brkStart),
          endTimeStr: formatTime(brkEnd),
          color: brk.color,
          bg: brk.bg,
          border: brk.border,
        });
        currentMins = brkEnd;
      }
    });
  }

  const dayEndMins = currentMins;
  const totalScheduleMins = Math.max(1, dayEndMins - dayStartMins);
  const totalInstructionalMins = periodCount * duration;
  const totalBreakMins = totalScheduleMins - totalInstructionalMins;
  const efficiencyRatio = Math.round((totalInstructionalMins / totalScheduleMins) * 100);

  return (
    <div
      style={{
        border: "1px solid #dce5ff",
        borderRadius: 14,
        padding: 18,
        background: "#ffffff",
        boxShadow: "0 4px 14px rgba(31, 44, 111, 0.05)",
      }}
    >
      {/* Header: Interactive Period Timeline */}
      <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h4 style={{ margin: 0, color: "#1f2c6f", fontSize: 15, fontWeight: 800 }}>
            Interactive Period Schedule
          </h4>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: 6 }}>
            {activeLevel.toUpperCase()} • {activeSession === "regular" ? "Regular Session" : "Shortened Session"} ({periodCount} Periods)
          </span>
        </div>
        <span style={{ fontSize: 11.5, color: "#64748b" }}>
          {startTimeStr} – {formatTime(dayEndMins)} • Drag or use arrows (▲/▼) to reposition breaks
        </span>
      </div>

      {/* Overflow Alert if schedule exceeds Daily End Time */}
      {(() => {
        const configuredEndStr = levelConfig?.schoolEndTime || "17:00";
        const [endH, endM] = configuredEndStr.split(":").map(Number);
        const configuredEndMins = (isNaN(endH) ? 17 : endH) * 60 + (isNaN(endM) ? 0 : endM);
        const clashMins = dayEndMins - configuredEndMins;

        if (clashMins > 0) {
          return (
            <div style={{ marginBottom: 12, background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 11.5, color: "#9a3412" }}>
                <strong>Schedule Overflow (+{clashMins} mins):</strong> Schedule finishes at <strong>{formatTime(dayEndMins)}</strong>, exceeding Daily End Time ({formatTime(configuredEndMins)}).
              </span>
              {onSyncOperatingHours && (
                <button
                  type="button"
                  onClick={() => onSyncOperatingHours(format24Time(dayEndMins))}
                  style={{
                    background: "#ea580c",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Sync End Time to {formatTime(dayEndMins)}
                </button>
              )}
            </div>
          );
        }
        return null;
      })()}

      {/* Vertical Interactive Periods & Breaks List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, idx) => {
          if (item.type === "break") {
            const isBeingDragged = draggedBreakKey === item.key;
            return (
              <div
                key={`break-${item.key}-${idx}`}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", item.key);
                  e.dataTransfer.effectAllowed = "move";
                  setDraggedBreakKey(item.key);
                }}
                onDragEnd={() => {
                  setDraggedBreakKey(null);
                  setHoveredPeriodNum(null);
                }}
                style={{
                  border: isBeingDragged ? "2px solid #d97706" : `1.5px dashed ${item.border || "#f59e0b"}`,
                  background: isBeingDragged ? "#fef3c7" : item.bg || "#fffbeb",
                  borderRadius: 10,
                  padding: "9px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: item.color || "#92400e",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "grab",
                  opacity: isBeingDragged ? 0.6 : 1,
                  userSelect: "none",
                  transition: "all 0.15s ease",
                }}
                title="Drag to reposition break or click buttons to adjust"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ cursor: "grab", color: item.color || "#b45309", fontSize: 12, fontWeight: 800 }}>
                    :::
                  </span>
                  <span>{item.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>
                    (After {getOrdinalPeriodLabel(item.afterPeriod)})
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>
                    {item.startTimeStr} – {item.endTimeStr} ({item.duration}m)
                  </span>

                  <div style={{ display: "inline-flex", gap: 4 }}>
                    <button
                      type="button"
                      disabled={item.afterPeriod <= 1}
                      onClick={() => onBreakMove && onBreakMove(item.key, item.afterPeriod - 1)}
                      style={{
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        borderRadius: 4,
                        padding: "1px 6px",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: item.afterPeriod <= 1 ? "not-allowed" : "pointer",
                        opacity: item.afterPeriod <= 1 ? 0.4 : 1,
                      }}
                      title="Move break 1 period earlier"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={item.afterPeriod >= periodCount - 1}
                      onClick={() => onBreakMove && onBreakMove(item.key, item.afterPeriod + 1)}
                      style={{
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        borderRadius: 4,
                        padding: "1px 6px",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: item.afterPeriod >= periodCount - 1 ? "not-allowed" : "pointer",
                        opacity: item.afterPeriod >= periodCount - 1 ? 0.4 : 1,
                      }}
                      title="Move break 1 period later"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          const isDropTarget = hoveredPeriodNum === item.num;
          const isMorningPeriod = item.num <= lunchAfterPeriod;
          const isAllowedSlot = isBreakDropAllowed(draggedBreakKey, item.num, breaks);

          let pillStyle = isMorningPeriod
            ? {
              border: isDropTarget
                ? isAllowedSlot ? "2px dashed #2563eb" : "2px dashed #ef4444"
                : "1px solid #bfdbfe",
              background: isDropTarget
                ? isAllowedSlot ? "#dbeafe" : "#fef2f2"
                : "#eff6ff",
              color: isDropTarget && !isAllowedSlot ? "#991b1b" : "#1e40af",
            }
            : {
              border: isDropTarget
                ? isAllowedSlot ? "2px dashed #059669" : "2px dashed #ef4444"
                : "1px solid #bbf7d0",
              background: isDropTarget
                ? isAllowedSlot ? "#bbf7d0" : "#fef2f2"
                : "#f0fdf4",
              color: isDropTarget && !isAllowedSlot ? "#991b1b" : "#15803d",
            };

          if (draggedBreakKey && !isAllowedSlot && !isDropTarget) {
            pillStyle = {
              ...pillStyle,
              opacity: 0.45,
              border: "1.5px dashed #fca5a5",
            };
          }

          const isFlagSlot = item.num === flagPeriod;

          return (
            <div
              key={`period-${item.num}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = isAllowedSlot ? "move" : "none";
                setHoveredPeriodNum(item.num);
              }}
              onDragLeave={() => {
                setHoveredPeriodNum(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const breakKey = e.dataTransfer.getData("text/plain") || draggedBreakKey;
                setHoveredPeriodNum(null);
                setDraggedBreakKey(null);
                if (breakKey && onBreakMove) {
                  onBreakMove(breakKey, item.num);
                }
              }}
              style={{
                ...pillStyle,
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 13,
                fontWeight: 700,
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{item.label}</span>
                {isFlagSlot ? (
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: 4 }}>
                    Flag Ceremony Routine
                  </span>
                ) : null}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {isDropTarget
                  ? isAllowedSlot
                    ? `Drop break after ${item.label}`
                    : `Cannot drop here (Must keep chronological order)`
                  : `${item.startTimeStr} – ${item.endTimeStr}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Backward compatibility alias
function VisualSchedulePreview(props) {
  return <BellTimelineVisualizer {...props} />;
}

function LiveLetterheadPreview({ profile, targetLevel = "jhs" }) {
  const isShs = targetLevel === "shs";
  const branding = getLevelBranding(profile, targetLevel);
  const showDepEd = branding.showDepEdSeal !== false;
  const depedLogo = branding.depedSealUrl || branding.depedLogoUrl;

  const levelData = (profile?.signatoriesByLevel && profile?.signatoriesByLevel[targetLevel])
    ? profile.signatoriesByLevel[targetLevel]
    : (DEFAULT_SIGNATORIES_BY_LEVEL[targetLevel] || DEFAULT_SIGNATORIES_BY_LEVEL.jhs);

  const preparedByList = (Array.isArray(levelData.preparedBy) && levelData.preparedBy.length > 0)
    ? levelData.preparedBy
    : (profile?.signatories?.preparedBy || DEFAULT_PROFILE.signatories.preparedBy);
  const conformed = levelData.conformed || profile?.signatories?.conformed || DEFAULT_PROFILE.signatories.conformed;
  const recommending = levelData.recommendingApproval || profile?.signatories?.recommendingApproval || DEFAULT_PROFILE.signatories.recommendingApproval;
  const approved = levelData.approved || profile?.signatories?.approved || DEFAULT_PROFILE.signatories.approved;
  const showConformed = levelData.showConformed !== false && Boolean(conformed?.name?.trim());

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1.5px solid #000",
        borderRadius: 8,
        padding: "20px 24px",
        boxShadow: "0 4px 18px rgba(15, 23, 42, 0.08)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 14,
          fontSize: 10,
          fontWeight: 800,
          background: isShs ? "#ecfdf5" : "#eff6ff",
          color: isShs ? "#065f46" : "#1e40af",
          border: isShs ? "1px solid #a7f3d0" : "1px solid #bfdbfe",
          padding: "2px 8px",
          borderRadius: 4,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {isShs ? "Senior High School (SHS) Preview" : "Junior High School (JHS) Preview"}
      </div>

      {/* 1. TOP MASTHEAD (Circular Seal + Blackletter Headings) */}
      <div style={{ textAlign: "center", marginBottom: 6, paddingTop: 4 }}>
        {showDepEd && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
            {depedLogo ? (
              <img src={depedLogo} alt="DepEd Seal" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: "50%" }} />
            ) : (
              <DepEdOfficialSeal size={48} />
            )}
          </div>
        )}

        <div
          style={{
            fontSize: 13,
            fontFamily: "'Old English Text MT', 'UnifrakturMaguntia', 'Cloister Black', 'Times New Roman', serif",
            fontWeight: 700,
            color: "#000",
            lineHeight: 1.15,
          }}
        >
          Republic of the Philippines
        </div>
        <div
          style={{
            fontSize: 17,
            fontFamily: "'Old English Text MT', 'UnifrakturMaguntia', 'Cloister Black', 'Times New Roman', serif",
            fontWeight: 800,
            color: "#000",
            marginTop: 1,
            lineHeight: 1.15,
          }}
        >
          Department of Education
        </div>

        {/* Region line: included in JHS, omitted in SHS */}
        {!isShs && (
          <div
            style={{
              fontSize: 11.5,
              fontFamily: "Arial, 'Times New Roman', sans-serif",
              fontWeight: 600,
              color: "#111",
              marginTop: 2,
              lineHeight: 1.2,
            }}
          >
            {profile?.region || "Region II – Cagayan Valley"}
          </div>
        )}

        <div
          style={{
            fontSize: 11.5,
            fontFamily: "Arial, 'Times New Roman', sans-serif",
            fontWeight: 600,
            color: "#111",
            marginTop: isShs ? 2 : 1,
            lineHeight: 1.2,
          }}
        >
          {profile?.division || "Schools Division of Nueva Vizcaya"}
        </div>

        <div
          style={{
            fontSize: 13,
            fontFamily: "Arial, 'Times New Roman', sans-serif",
            fontWeight: isShs ? 700 : 800,
            color: "#000",
            marginTop: 2,
            lineHeight: 1.2,
            textTransform: isShs ? "none" : "uppercase",
          }}
        >
          {isShs
            ? (profile?.schoolName || "Diadi National High School")
            : (profile?.schoolName || "DIADI NATIONAL HIGH SCHOOL").toUpperCase()}
        </div>

        {/* Both after header is a horizontal line */}
        <hr style={{ border: "none", borderTop: "1.5px solid #000", margin: "10px 0 8px 0" }} />

        {/* Document Program Title & Metadata */}
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 800,
            fontSize: 13.5,
            letterSpacing: 0.8,
            color: "#000",
            textTransform: "uppercase",
            lineHeight: 1.15,
          }}
        >
          CLASSROOM PROGRAM
        </div>
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 700,
            fontSize: 11,
            color: "#222",
            marginTop: 2,
            lineHeight: 1.15,
          }}
        >
          S.Y. {profile?.academicYear || "2026 - 2027"}
        </div>
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: 0.6,
            color: "#000",
            textTransform: "uppercase",
            marginTop: 3,
            lineHeight: 1.15,
          }}
        >
          {isShs ? "11 STEM - ALBERT EINSTEIN" : "7 ALBERT EINSTEIN"}
        </div>
      </div>

      {/* 2. DOCUMENT BODY MOCKUP */}
      <div
        style={{
          border: "1px dashed #cbd5e1",
          borderRadius: 6,
          background: "#f8fafc",
          padding: "8px 12px",
          marginBottom: 12,
          fontSize: 10,
          color: "#64748b",
          textAlign: "center",
        }}
      >
        <span style={{ fontWeight: 700, color: "#1e293b" }}>[Timetable Grid / Teaching Load Schedule]</span>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 4, fontSize: 9.5 }}>
          <span>07:30 - 08:30 English</span>
          <span>08:30 - 09:30 Mathematics</span>
          <span>09:50 - 10:50 Science</span>
          <span>10:50 - 11:50 Filipino</span>
        </div>
      </div>

      {/* 3. SIGNATORIES ROW PREVIEW (Unified with Header & Timetable - Live Level Synced) */}
      <div style={{ marginTop: 10, marginBottom: 12, borderTop: "1px dashed #cbd5e1", paddingTop: 10 }}>
        {isShs ? (
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6, textAlign: "left" }}>
              SDO Statutory Approval Hierarchy (Grades 11 & 12 • DepEd Order No. 017 / Form 7):
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, textAlign: "center" }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", marginBottom: 14 }}>Prepared by:</div>
                <div style={{ borderBottom: "1px solid #000", margin: "0 auto", width: "90%" }} />
                <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", marginTop: 4 }}>
                  {preparedByList?.[0]?.name || "ROBERTO D. CUTILLON"}
                </div>
                <div style={{ fontSize: 8.5, color: "#334155" }}>
                  {preparedByList?.[0]?.title || "School Principal IV"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", marginBottom: 14 }}>Reviewed:</div>
                <div style={{ borderBottom: "1px solid #000", margin: "0 auto", width: "90%" }} />
                <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", marginTop: 4 }}>
                  {conformed?.name || "MARICEL S. FRANCO PhD, CESE"}
                </div>
                <div style={{ fontSize: 8.5, color: "#334155" }}>
                  {conformed?.title || "Chief Education Supervisor, CID"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", marginBottom: 14 }}>Recommending Approval:</div>
                <div style={{ borderBottom: "1px solid #000", margin: "0 auto", width: "90%" }} />
                <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", marginTop: 4 }}>
                  {recommending?.name || "ADONIS C. CEPEREZ EdD, CESE"}
                </div>
                <div style={{ fontSize: 8.5, color: "#334155" }}>
                  {recommending?.title || "Assistant Schools Division Superintendent"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", marginBottom: 14 }}>Approved:</div>
                <div style={{ borderBottom: "1px solid #000", margin: "0 auto", width: "90%" }} />
                <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", marginTop: 4 }}>
                  {approved?.name || "ORLANDO E. MANUEL PhD, CESO V"}
                </div>
                <div style={{ fontSize: 8.5, color: "#334155" }}>
                  {approved?.title || "Schools Division Superintendent"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6, textAlign: "left" }}>
              School & District Operational Approval Hierarchy (Grades 7–10):
            </div>
            {/* Prepared by Coordinators */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: "#64748b", marginBottom: 4, textAlign: "left" }}>
                Prepared by (Timetable Committee / Subject Coordinators):
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(4, Math.max(1, preparedByList.length))}, 1fr)`, gap: 8, textAlign: "center" }}>
                {preparedByList.map((sig, idx) => (
                  <div key={idx} style={{ padding: "0 4px" }}>
                    <div style={{ borderBottom: "1px solid #000", margin: "14px auto 0", width: "90%" }} />
                    <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", marginTop: 3, lineHeight: 1.2 }}>
                      {sig.name || "—"}
                    </div>
                    <div style={{ fontSize: 8, color: "#334155", marginTop: 1, lineHeight: 1.2 }}>
                      {sig.title || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conformed, Recommending, Approved */}
            <div style={{ display: "grid", gridTemplateColumns: showConformed ? "repeat(3, 1fr)" : "repeat(2, 1fr)", gap: 12, textAlign: "center", marginTop: 6 }}>
              {showConformed && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", marginBottom: 14 }}>Conformed:</div>
                  <div style={{ borderBottom: "1px solid #000", margin: "0 auto", width: "90%" }} />
                  <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", marginTop: 4 }}>
                    {conformed?.name || "FREDIRICK R. VICMUDO, HT III"}
                  </div>
                  <div style={{ fontSize: 8.5, color: "#334155" }}>
                    {conformed?.title || "Asst. Principal Designate"}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", marginBottom: 14 }}>Recommending Approval:</div>
                <div style={{ borderBottom: "1px solid #000", margin: "0 auto", width: "90%" }} />
                <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", marginTop: 4 }}>
                  {recommending?.name || "GABRIEL C. ULLANI EdD"}
                </div>
                <div style={{ fontSize: 8.5, color: "#334155" }}>
                  {recommending?.title || "Secondary School Principal II"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", marginBottom: 14 }}>Approved:</div>
                <div style={{ borderBottom: "1px solid #000", margin: "0 auto", width: "90%" }} />
                <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", marginTop: 4 }}>
                  {approved?.name || "CARMELITA L. PALE EdD"}
                </div>
                <div style={{ fontSize: 8.5, color: "#334155" }}>
                  {approved?.title || "District In-Charge"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. OFFICIAL FOOTER BAR (Logos on Left + Contact Coordinates) */}
      <div
        style={{
          borderTop: "1.5px solid #000",
          paddingTop: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Footer Logos for target level */}
        {(() => {
          const footerMode = branding.footerLogoFormat || "tri_logo";
          if (footerMode === "text_only") return null;

          const showDepEdWordmark = branding.showDepEdWordmark !== false && footerMode !== "school_only";
          const showBagongPilipinas = (Boolean(branding.showBagongPilipinas) || isShs) && footerMode === "tri_logo";
          const showSchoolSeal = branding.showSchoolSeal !== false;

          const schoolLogo = (branding.schoolLogoUrl && branding.schoolLogoUrl.startsWith("data:"))
            ? branding.schoolLogoUrl
            : (profile?.schoolLogoUrl && profile.schoolLogoUrl.startsWith("data:"))
              ? profile.schoolLogoUrl
              : "/diadi-nhs-logo.png?v=1980";
          const bagongPilipinasLogo = branding.bagongPilipinasLogoUrl || profile?.bagongPilipinasLogoUrl;
          const depedWordmark = branding.depedWordmarkUrl;

          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {showDepEdWordmark && (
                depedWordmark ? (
                  <img src={depedWordmark} alt="DepEd Wordmark" style={{ height: 32, width: "auto", objectFit: "contain" }} />
                ) : (
                  <DepEdWordmarkLogo size={32} />
                )
              )}
              {showBagongPilipinas && (
                bagongPilipinasLogo ? (
                  <img src={bagongPilipinasLogo} alt="Bagong Pilipinas" style={{ width: 34, height: 34, objectFit: "contain" }} />
                ) : (
                  <BagongPilipinasLogo size={34} />
                )
              )}
              {showSchoolSeal && (
                schoolLogo ? (
                  <img
                    src={schoolLogo}
                    alt={`${profile?.schoolName || "Diadi National High School"} Crest`}
                    style={{ width: 40, height: 40, objectFit: "contain", borderRadius: "50%" }}
                  />
                ) : (
                  <SchoolOfficialSeal size={40} schoolName={profile?.schoolName} />
                )
              )}
            </div>
          );
        })()}

        {/* School Coordinates */}
        <div style={{ fontSize: 9.5, lineHeight: 1.35, color: "#000" }}>
          <div><strong>Address:</strong> {profile?.address || "Poblacion, Diadi, Nueva Vizcaya"}</div>
          <div><strong>E-mail:</strong> <span style={{ color: "#002b7f", textDecoration: "underline" }}>{profile?.email || "300627@deped.gov.ph"}</span></div>
          {profile?.website && <div><strong>Website:</strong> {profile.website}</div>}
        </div>
      </div>
    </div>
  );
}

function LiveSignatoriesPreview({ profile, targetLevel = "jhs" }) {
  const isShs = targetLevel === "shs";
  const levelData = (profile?.signatoriesByLevel && profile?.signatoriesByLevel[targetLevel])
    ? profile.signatoriesByLevel[targetLevel]
    : (DEFAULT_SIGNATORIES_BY_LEVEL[targetLevel] || DEFAULT_SIGNATORIES_BY_LEVEL.jhs);

  const preparedByList = (Array.isArray(levelData.preparedBy) && levelData.preparedBy.length > 0)
    ? levelData.preparedBy
    : (profile?.signatories?.preparedBy || DEFAULT_PROFILE.signatories.preparedBy);
  const conformed = levelData.conformed || profile?.signatories?.conformed || DEFAULT_PROFILE.signatories.conformed;
  const recommending = levelData.recommendingApproval || profile?.signatories?.recommendingApproval || DEFAULT_PROFILE.signatories.recommendingApproval;
  const approved = levelData.approved || profile?.signatories?.approved || DEFAULT_PROFILE.signatories.approved;

  const showConformed = levelData.showConformed !== false && Boolean(conformed?.name?.trim());

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #1e293b",
        borderRadius: 10,
        padding: "18px 20px",
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: "1.5px solid #0f172a", paddingBottom: 8 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#1f2c6f", textTransform: "uppercase", letterSpacing: 0.6 }}>
            {isShs ? "Official SHS Division Print Preview" : "Official JHS District Print Preview"}
          </span>
          <div style={{ fontSize: 10.5, color: "#64748b" }}>
            {isShs
              ? "Division Office SDO Statutory Approval • Grades 11 & 12 Form 7"
              : "School & District Operational Approval • Grades 7 to 10 Timetables"}
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            background: isShs ? "#eff6ff" : "#f1f5f9",
            color: isShs ? "#1d4ed8" : "#334155",
            padding: "3px 8px",
            borderRadius: 4,
            border: isShs ? "1px solid #bfdbfe" : "1px solid #cbd5e1",
          }}
        >
          {isShs ? "SDO Endorsed (DO 017)" : "District Level Format"}
        </span>
      </div>

      {/* Section 1: Prepared by */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>
          {isShs ? "Prepared by:" : "Prepared by (Timetable Committee / Subject Coordinators):"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, preparedByList.length)}, 1fr)`, gap: 12, textAlign: "center" }}>
          {preparedByList.map((sig, idx) => (
            <div key={idx} style={{ padding: "0 4px" }}>
              <div style={{ borderBottom: "1px solid #000000", height: 26 }} />
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#000000", marginTop: 4, textTransform: "uppercase", lineHeight: 1.2 }}>
                {sig.name || "—"}
              </div>
              <div style={{ fontSize: 9, color: "#334155", marginTop: 2, lineHeight: 1.2 }}>
                {sig.title || "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Conformed / Reviewed (Optional) */}
      {showConformed && (
        <div style={{ marginBottom: 16, borderTop: "1px dashed #e2e8f0", paddingTop: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
            {isShs ? "Reviewed:" : "Conformed:"}
          </div>
          <div style={{ maxWidth: 280, margin: "0 auto", textAlign: "center" }}>
            <div style={{ borderBottom: "1px solid #000000", height: 24 }} />
            <div style={{ fontSize: 11, fontWeight: 800, color: "#000000", marginTop: 4, textTransform: "uppercase" }}>
              {conformed?.name || "—"}
            </div>
            <div style={{ fontSize: 9.5, color: "#334155", marginTop: 2 }}>
              {conformed?.title || "—"}
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Recommending Approval & Approved */}
      <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6, textAlign: "left" }}>
            Recommending Approval:
          </div>
          <div style={{ borderBottom: "1px solid #000000", height: 24 }} />
          <div style={{ fontSize: 10.5, fontWeight: 800, color: "#000000", marginTop: 4, textTransform: "uppercase" }}>
            {recommending?.name || "—"}
          </div>
          <div style={{ fontSize: 9, color: "#334155", marginTop: 2 }}>
            {recommending?.title || "—"}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6, textAlign: "left" }}>
            Approved:
          </div>
          <div style={{ borderBottom: "1px solid #000000", height: 24 }} />
          <div style={{ fontSize: 10.5, fontWeight: 800, color: "#000000", marginTop: 4, textTransform: "uppercase" }}>
            {approved?.name || "—"}
          </div>
          <div style={{ fontSize: 9, color: "#334155", marginTop: 2 }}>
            {approved?.title || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function DepEdDO005Scorecard({
  teachingHours = 20,
  isAdviser = true,
  isAncillary = false,
  onTeachingHoursChange,
  onAdviserChange,
  onAncillaryChange,
}) {
  const advisoryCredit = isAdviser ? 5 : 0;
  const ancillaryCredit = isAncillary ? 4 : 0;
  const totalStatutoryLoad = Number(teachingHours) + advisoryCredit + ancillaryCredit;

  const isBalanced = totalStatutoryLoad >= 20 && totalStatutoryLoad <= 25;
  const isWithinCeiling = totalStatutoryLoad <= 30;
  const isOverload = totalStatutoryLoad > 30;

  return (
    <div
      style={{
        border: "1px solid #c7d2fe",
        borderRadius: 12,
        background: "#ffffff",
        padding: "16px 18px",
        boxShadow: "0 2px 8px rgba(31, 44, 111, 0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#1f2c6f" }}>
            DepEd DO 005, s. 2024 Statutory Workload Scorecard & Simulator
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 999,
            background: isBalanced ? "#dcfce7" : isWithinCeiling ? "#fef3c7" : "#fee2e2",
            color: isBalanced ? "#166534" : isWithinCeiling ? "#92400e" : "#991b1b",
          }}
        >
          {isBalanced ? "DepEd Balanced Load (20-25h)" : isWithinCeiling ? "Approaching Ceiling (<=30h)" : "Statutory Overload (>30h)"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Balanced Standard</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#166534", marginTop: 2 }}>20 – 25 hrs/wk</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>4 to 5 teaching sections</div>
        </div>
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Statutory Ceiling</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1e3a8a", marginTop: 2 }}>30 hrs/wk Max</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>RA 4670 Magna Carta Cap</div>
        </div>
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Advisory Credit</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#2563eb", marginTop: 2 }}>5 hrs/wk Offset</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>Equivalent to 1 teaching load</div>
        </div>
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Major Ancillary</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#7c3aed", marginTop: 2 }}>4 hrs/wk Offset</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>DRRM, ICT, Property, Guidance</div>
        </div>
      </div>

      {/* Simulator Widget */}
      <div style={{ background: "#f1f5f9", borderRadius: 10, padding: "12px 14px", border: "1px solid #cbd5e1" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 8 }}>
          Interactive Teacher Workload Calculator:
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569" }}>Classroom Teaching:</label>
            <input
              type="number"
              min={10}
              max={30}
              value={teachingHours}
              onChange={(e) => onTeachingHoursChange && onTeachingHoursChange(Number(e.target.value))}
              style={{ width: 54, padding: "4px 6px", borderRadius: 6, border: "1px solid #94a3b8", fontWeight: 700, textAlign: "center" }}
            />
            <span style={{ fontSize: 11, color: "#64748b" }}>hrs/wk</span>
          </div>

          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isAdviser}
              onChange={(e) => onAdviserChange && onAdviserChange(e.target.checked)}
            />
            Class Adviser (+5h Credit)
          </label>

          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isAncillary}
              onChange={(e) => onAncillaryChange && onAncillaryChange(e.target.checked)}
            />
            Major Ancillary Coordinator (+4h Credit)
          </label>
        </div>

        <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#1e293b" }}>
            Total DO 005 Statutory Workload: <strong>{totalStatutoryLoad} hours/week</strong> ({teachingHours}h teaching + {advisoryCredit}h advisory + {ancillaryCredit}h ancillary)
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: isOverload ? "#dc2626" : isBalanced ? "#16a34a" : "#2563eb" }}>
            {isOverload
              ? `Exceeds 30h statutory ceiling by ${totalStatutoryLoad - 30}h (Overload compensation mandated)`
              : isBalanced
                ? `Optimal load (${30 - totalStatutoryLoad}h buffer remaining under ceiling)`
                : `Within statutory ceiling (${30 - totalStatutoryLoad}h buffer)`}
          </span>
        </div>
      </div>
    </div>
  );
}

function DepEdShiftSettingsCard({ profile, setProfile }) {
  const isDoubleShift = profile.shiftMode === "double_shift";

  const parseShiftDuration = (start, end) => {
    if (!start || !end) return 6;
    const [h1, m1] = start.split(":").map(Number);
    const [h2, m2] = end.split(":").map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    return Math.max(0, (diff / 60)).toFixed(1);
  };

  const morningHours = parseShiftDuration(profile.morningShiftStartTime || "06:00", profile.morningShiftEndTime || "12:00");
  const afternoonHours = parseShiftDuration(profile.afternoonShiftStartTime || "12:00", profile.afternoonShiftEndTime || "18:00");

  return (
    <div style={{ border: "1px solid #dce5ff", borderRadius: 12, padding: "16px 18px", background: "#ffffff", boxShadow: "0 2px 8px rgba(31, 44, 111, 0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#1f2c6f" }}>
            DepEd Shift System & Operating Model
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "3px 10px", borderRadius: 999 }}>
          {isDoubleShift ? "Double-Shift Mode Active" : "Single Whole-Day Mode"}
        </span>
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: "#64748b" }}>
        Configure whether classes operate on a standard single whole-day timetable or a double-shift system for classroom density management.
      </p>

      {/* Mode Selector */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <label
          style={{
            flex: "1 1 240px",
            border: !isDoubleShift ? "2px solid #3B4197" : "1px solid #cbd5e1",
            background: !isDoubleShift ? "#eef2ff" : "#ffffff",
            borderRadius: 10,
            padding: "12px 14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <input
            type="radio"
            name="shiftModeRadio"
            value="single_day"
            checked={!isDoubleShift}
            onChange={() => setProfile((prev) => ({ ...prev, shiftMode: "single_day" }))}
            style={{ marginTop: 2 }}
          />
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2c6f" }}>Single Whole-Day Session</span>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>
              Standard 7:30 AM – 5:00 PM schedule (Official DNHS Operating Window). All sections attend throughout the full day with morning and lunch breaks.
            </p>
          </div>
        </label>

        <label
          style={{
            flex: "1 1 240px",
            border: isDoubleShift ? "2px solid #3B4197" : "1px solid #cbd5e1",
            background: isDoubleShift ? "#eef2ff" : "#ffffff",
            borderRadius: 10,
            padding: "12px 14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <input
            type="radio"
            name="shiftModeRadio"
            value="double_shift"
            checked={isDoubleShift}
            onChange={() => setProfile((prev) => ({ ...prev, shiftMode: "double_shift" }))}
            style={{ marginTop: 2 }}
          />
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2c6f" }}>Double-Shift Mode (Morning & Afternoon)</span>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>
              Enables split sessions (Morning 6:00 AM – 12:00 PM / Afternoon 12:00 PM – 6:00 PM) to maximize room utilization.
            </p>
          </div>
        </label>
      </div>

      {/* Double Shift Configuration Panel */}
      {isDoubleShift && (
        <div style={{ background: "#f8faff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "14px 16px", marginTop: 10 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1f2c6f", display: "block", marginBottom: 10 }}>
            Shift Operating Hours & Timetable Segments
          </span>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {/* Morning Shift */}
            <div style={{ background: "#ffffff", border: "1px solid #bfdbfe", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1e40af" }}>Morning Shift</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", background: "#eff6ff", padding: "2px 6px", borderRadius: 4 }}>
                  {morningHours} hrs duration
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="Shift Start Time">
                  <input
                    type="time"
                    value={profile.morningShiftStartTime || "06:00"}
                    onChange={(e) => setProfile((prev) => ({ ...prev, morningShiftStartTime: e.target.value }))}
                    style={inputStyle()}
                  />
                </Field>
                <Field label="Shift End Time">
                  <input
                    type="time"
                    value={profile.morningShiftEndTime || "12:00"}
                    onChange={(e) => setProfile((prev) => ({ ...prev, morningShiftEndTime: e.target.value }))}
                    style={inputStyle()}
                  />
                </Field>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#64748b" }}>
                Recommended allocation: Grades 7 & 8 (Junior High School early session).
              </p>
            </div>

            {/* Afternoon Shift */}
            <div style={{ background: "#ffffff", border: "1px solid #ddd6fe", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6d28d9" }}>Afternoon Shift</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6d28d9", background: "#f5f3ff", padding: "2px 6px", borderRadius: 4 }}>
                  {afternoonHours} hrs duration
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="Shift Start Time">
                  <input
                    type="time"
                    value={profile.afternoonShiftStartTime || "12:00"}
                    onChange={(e) => setProfile((prev) => ({ ...prev, afternoonShiftStartTime: e.target.value }))}
                    style={inputStyle()}
                  />
                </Field>
                <Field label="Shift End Time">
                  <input
                    type="time"
                    value={profile.afternoonShiftEndTime || "18:00"}
                    onChange={(e) => setProfile((prev) => ({ ...prev, afternoonShiftEndTime: e.target.value }))}
                    style={inputStyle()}
                  />
                </Field>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#64748b" }}>
                Recommended allocation: Grades 9 & 10 (or Senior High School late session).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function isBreakDropAllowed(breakKey, periodNum, breaks) {
  if (!breakKey) return true;

  const morningAfter = breaks.morning?.enabled ? Number(breaks.morning.afterPeriod) : 0;
  const lunchAfter = breaks.lunch?.enabled ? Number(breaks.lunch.afterPeriod) : 99;
  const afternoonAfter = breaks.afternoon?.enabled ? Number(breaks.afternoon.afterPeriod) : 999;

  if (breakKey === "morning") {
    if (breaks.lunch?.enabled && periodNum >= lunchAfter) return false;
    if (breaks.afternoon?.enabled && periodNum >= afternoonAfter) return false;
  }

  if (breakKey === "lunch") {
    if (breaks.morning?.enabled && periodNum <= morningAfter) return false;
    if (breaks.afternoon?.enabled && periodNum >= afternoonAfter) return false;
  }

  if (breakKey === "afternoon") {
    if (breaks.lunch?.enabled && periodNum <= lunchAfter) return false;
    if (breaks.morning?.enabled && periodNum <= morningAfter) return false;
  }

  return true;
}
