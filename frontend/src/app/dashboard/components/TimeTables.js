import React, { useEffect, useState, useRef, useMemo } from "react";
import html2pdf from "html2pdf.js";
import SubstituteFinder from "./SubstituteFinder";
import {
  DepEdOfficialSeal,
  SchoolOfficialSeal,
  BagongPilipinasLogo,
  DepEdWordmarkLogo,
} from "./depedSeals";

function getFromStorage(key, fallback) {
  try {
    const val = window.localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

const PUBLISHED_STORAGE_KEY = "turotugma_published_schedules";
const DRAFTS_STORAGE_KEY = "turotugma_schedule_drafts";
const SECTIONS_STORAGE_KEY = "turotugma_sections_created";
const SUBJECTS_STORAGE_KEY = "turotugma_subjects";
const FACULTY_STORAGE_KEY = "turotugma_faculty";

function normalizeSections(sectionsRaw, scheduleType = "jhs") {
  let list = [];
  if (sectionsRaw && typeof sectionsRaw === "object") {
    if (scheduleType === "jhs") {
      list = [7, 8, 9, 10].flatMap((grade) => {
        const gradeConfig = sectionsRaw?.jhs?.[grade];
        const entries = Array.isArray(gradeConfig?.sections) ? gradeConfig.sections : [];
        return entries.map((section, index) => ({
          id: `jhs-${grade}-${index}`,
          originalId: section?.id,
          level: "jhs",
          grade: Number(grade),
          name: section?.name || `Grade ${grade} Section ${index + 1}`,
          classification: section?.classification || "Regular",
          track: section?.track || "",
        }));
      });
    } else {
      list = [11, 12].flatMap((grade) => {
        const gradeConfig = sectionsRaw?.shs?.[grade];
        const entries = Array.isArray(gradeConfig?.sections) ? gradeConfig.sections : [];
        return entries.map((section, index) => ({
          id: `shs-${grade}-${index}`,
          originalId: section?.id,
          level: "shs",
          grade: Number(grade),
          name: section?.name || `Grade ${grade} Section ${index + 1}`,
          classification: "",
          track: section?.track || "",
        }));
      });
    }
  }

  if (list.length === 0 && scheduleType === "jhs") {
    list = [7, 8, 9, 10].map((grade) => ({
      id: `jhs-${grade}-0`,
      level: "jhs",
      grade,
      name: `Grade ${grade} - Section 1`,
      classification: "Regular",
      track: "",
    }));
  }

  return list.sort((left, right) => {
    if (left.grade !== right.grade) {
      return left.grade - right.grade;
    }
    return String(left.name).localeCompare(String(right.name));
  });
}

function buildSlotsForTimetable(config, scheduleType = "jhs") {
  const levelConfig = config?.[scheduleType] || config?.jhs || {};
  const regularDays = Array.isArray(levelConfig.regularDays) && levelConfig.regularDays.length > 0
    ? levelConfig.regularDays
    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const shortenedDays = Array.isArray(levelConfig.shortenedDays) ? levelConfig.shortenedDays : [];
  const maxPeriods = levelConfig.periods?.regular || 8;

  const slots = [];
  const activeDays = Array.from(new Set([...regularDays, ...shortenedDays]));

  activeDays.forEach((day) => {
    const isShortened = shortenedDays.includes(day);
    for (let period = 1; period <= maxPeriods; period++) {
      const slotId = `${day}-P${period}`;
      slots.push({
        id: slotId,
        day,
        period,
        sessionType: isShortened ? "shortened" : "regular",
        label: `${period}${period === 1 ? "st" : period === 2 ? "nd" : period === 3 ? "rd" : "th"} Period`,
      });
    }
  });
  return slots;
}

import { DEFAULT_SIGNATORIES_BY_LEVEL, getLevelBranding } from "./SchoolProfileSettings";

export const DEFAULT_PROFILE_FALLBACK = {
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
      showSchoolSealInHeader: false,
      headerMastheadFormat: "fraktur_traditional",
      footerLogoFormat: "tri_logo",
      depedLogoUrl: "",
      depedSealUrl: "",
      depedWordmarkUrl: "",
      schoolLogoUrl: "/diadi-nhs-logo.png?v=1980",
      bagongPilipinasLogoUrl: "",
    },
    shs: {
      showDepEdSeal: true,
      showDepEdWordmark: true,
      showSchoolSealInHeader: false,
      headerMastheadFormat: "fraktur_clean",
      footerLogoFormat: "tri_logo",
      depedLogoUrl: "",
      depedSealUrl: "",
      depedWordmarkUrl: "",
      schoolLogoUrl: "/diadi-nhs-logo.png?v=1980",
      bagongPilipinasLogoUrl: "",
    },
  },
  signatoryMode: "level_specific",
  signatoriesByLevel: DEFAULT_SIGNATORIES_BY_LEVEL,
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

export function getEffectiveSchoolProfile() {
  const stored = getFromStorage("turotugma_school_profile", null);
  if (!stored || typeof stored !== "object") return DEFAULT_PROFILE_FALLBACK;

  const defaultJhs = DEFAULT_PROFILE_FALLBACK.signatoriesByLevel?.jhs || DEFAULT_SIGNATORIES_BY_LEVEL.jhs;
  const defaultShs = DEFAULT_PROFILE_FALLBACK.signatoriesByLevel?.shs || DEFAULT_SIGNATORIES_BY_LEVEL.shs;
  const storedJhs = stored.signatoriesByLevel?.jhs || {};
  const storedShs = stored.signatoriesByLevel?.shs || {};

  return {
    ...DEFAULT_PROFILE_FALLBACK,
    ...stored,
    address: stored.address || DEFAULT_PROFILE_FALLBACK.address,
    email: stored.email || DEFAULT_PROFILE_FALLBACK.email,
    website: stored.website || DEFAULT_PROFILE_FALLBACK.website,
    signatoriesByLevel: {
      jhs: {
        ...defaultJhs,
        ...storedJhs,
        preparedBy: (Array.isArray(storedJhs.preparedBy) && storedJhs.preparedBy.length > 0)
          ? storedJhs.preparedBy
          : (Array.isArray(stored.signatories?.preparedBy) && stored.signatories.preparedBy.length > 0)
            ? stored.signatories.preparedBy
            : defaultJhs.preparedBy,
        conformed: storedJhs.conformed?.name
          ? storedJhs.conformed
          : stored.signatories?.conformed?.name
            ? stored.signatories.conformed
            : defaultJhs.conformed,
        recommendingApproval: storedJhs.recommendingApproval?.name
          ? storedJhs.recommendingApproval
          : stored.signatories?.recommendingApproval?.name
            ? stored.signatories.recommendingApproval
            : defaultJhs.recommendingApproval,
        approved: storedJhs.approved?.name
          ? storedJhs.approved
          : stored.signatories?.approved?.name
            ? stored.signatories.approved
            : defaultJhs.approved,
      },
      shs: {
        ...defaultShs,
        ...storedShs,
        preparedBy: (Array.isArray(storedShs.preparedBy) && storedShs.preparedBy.length > 0)
          ? storedShs.preparedBy
          : defaultShs.preparedBy,
        conformed: storedShs.conformed?.name
          ? storedShs.conformed
          : defaultShs.conformed,
        recommendingApproval: storedShs.recommendingApproval?.name
          ? storedShs.recommendingApproval
          : defaultShs.recommendingApproval,
        approved: storedShs.approved?.name
          ? storedShs.approved
          : defaultShs.approved,
      },
    },
    signatories: {
      preparedBy: (Array.isArray(stored.signatories?.preparedBy) && stored.signatories.preparedBy.length > 0)
        ? stored.signatories.preparedBy
        : DEFAULT_PROFILE_FALLBACK.signatories.preparedBy,
      conformed: (stored.signatories?.conformed?.name)
        ? stored.signatories.conformed
        : DEFAULT_PROFILE_FALLBACK.signatories.conformed,
      recommendingApproval: (stored.signatories?.recommendingApproval?.name)
        ? stored.signatories.recommendingApproval
        : DEFAULT_PROFILE_FALLBACK.signatories.recommendingApproval,
      approved: (stored.signatories?.approved?.name)
        ? stored.signatories.approved
        : DEFAULT_PROFILE_FALLBACK.signatories.approved,
    },
  };
}

export function SignatoryBlock({ schoolProfile, sectionId, level }) {
  const profile = schoolProfile || DEFAULT_PROFILE_FALLBACK;

  let targetLevel = level;
  if (!targetLevel && sectionId) {
    const sId = String(sectionId).toLowerCase();
    if (sId.includes("shs") || sId.includes("11") || sId.includes("12") || sId.includes("senior")) {
      targetLevel = "shs";
    } else {
      targetLevel = "jhs";
    }
  }
  if (!targetLevel) {
    targetLevel = "jhs";
  }

  const isShs = targetLevel === "shs";
  const defaultLevelData = isShs
    ? (DEFAULT_PROFILE_FALLBACK.signatoriesByLevel?.shs || DEFAULT_SIGNATORIES_BY_LEVEL.shs)
    : (DEFAULT_PROFILE_FALLBACK.signatoriesByLevel?.jhs || DEFAULT_SIGNATORIES_BY_LEVEL.jhs);

  const levelData = (profile?.signatoriesByLevel && profile?.signatoriesByLevel[targetLevel])
    ? profile.signatoriesByLevel[targetLevel]
    : defaultLevelData;

  const preparedByList = (Array.isArray(levelData?.preparedBy) && levelData.preparedBy.length > 0)
    ? levelData.preparedBy
    : (Array.isArray(profile?.signatories?.preparedBy) && profile.signatories.preparedBy.length > 0 && !isShs)
      ? profile.signatories.preparedBy
      : defaultLevelData.preparedBy;

  const conformed = levelData?.conformed?.name
    ? levelData.conformed
    : (!isShs && profile?.signatories?.conformed?.name)
      ? profile.signatories.conformed
      : defaultLevelData.conformed;

  const recommending = levelData?.recommendingApproval?.name
    ? levelData.recommendingApproval
    : (!isShs && profile?.signatories?.recommendingApproval?.name)
      ? profile.signatories.recommendingApproval
      : defaultLevelData.recommendingApproval;

  const approved = levelData?.approved?.name
    ? levelData.approved
    : (!isShs && profile?.signatories?.approved?.name)
      ? profile.signatories.approved
      : defaultLevelData.approved;

  const preparedHeading = levelData?.preparedByHeading || (isShs ? "Prepared by:" : "Prepared by (Timetable Committee / Subject Coordinators):");
  const conformedHeading = levelData?.conformedHeading || (isShs ? "Reviewed:" : "Conformed:");
  const recommendingHeading = levelData?.recommendingApprovalHeading || "Recommending Approval:";
  const approvedHeading = levelData?.approvedHeading || "Approved:";

  const showConformed = levelData?.showConformed !== false && Boolean(conformed?.name?.trim());

  const address = profile.address || DEFAULT_PROFILE_FALLBACK.address;
  const email = profile.email || DEFAULT_PROFILE_FALLBACK.email;
  const website = profile.website || DEFAULT_PROFILE_FALLBACK.website;

  return (
    <div className="signatory-container" style={{ marginTop: 12, paddingTop: 4, fontFamily: "Arial, sans-serif", width: "100%", pageBreakInside: "avoid", breakInside: "avoid" }}>
      {isShs ? (
        /* Senior High School Official DO 017 SDO Approval Format (2x2 Balanced Grid or Streamlined) */
        <div className="signatory-shs-grid" style={{ marginBottom: 8 }}>
          {/* Row 1: Prepared by (Left) & Reviewed (Right if enabled) */}
          <div className="signatory-row" style={{ display: "flex", justifyContent: showConformed ? "space-between" : "center", alignItems: "flex-start", gap: 32, marginBottom: 12 }}>
            <div className="signatory-box" style={{ flex: showConformed ? 1 : undefined, maxWidth: showConformed ? 360 : 640, width: showConformed ? undefined : "100%", margin: showConformed ? 0 : "0 auto" }}>
              <div className="signatory-heading" style={{ fontSize: 10.5, fontWeight: 700, color: "#000", marginBottom: 6, textAlign: showConformed ? "left" : "center" }}>{preparedHeading}</div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, preparedByList.length)}, 1fr)`, gap: 12, textAlign: "center", marginTop: 4 }}>
                {preparedByList.map((sig, idx) => (
                  <div key={idx} style={{ padding: "0 4px" }}>
                    <div className="signatory-name" style={{ fontSize: 10, fontWeight: 800, color: "#000", textTransform: "uppercase", textDecoration: "underline", lineHeight: 1.15 }}>
                      {sig.name || "ROBERTO D. CUTILLON"}
                    </div>
                    <div className="signatory-title" style={{ fontSize: 9, fontWeight: 700, color: "#222", marginTop: 2, lineHeight: 1.1 }}>
                      {sig.title || "School Principal IV"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showConformed && (
              <div className="signatory-box" style={{ flex: 1, maxWidth: 360 }}>
                <div className="signatory-heading" style={{ fontSize: 10.5, fontWeight: 700, color: "#000", marginBottom: 6 }}>{conformedHeading}</div>
                <div style={{ textAlign: "center", marginTop: 4 }}>
                  <div className="signatory-name" style={{ fontSize: 10, fontWeight: 800, color: "#000", textTransform: "uppercase", textDecoration: "underline", lineHeight: 1.15 }}>
                    {conformed?.name || "MARICEL S. FRANCO PhD, CESE"}
                  </div>
                  <div className="signatory-title" style={{ fontSize: 9, fontWeight: 700, color: "#222", marginTop: 2, lineHeight: 1.1 }}>
                    {conformed?.title || "Chief Education Supervisor, CID"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Recommending Approval (Left) & Approved (Right) */}
          <div className="signatory-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 32, marginBottom: 8 }}>
            <div className="signatory-box" style={{ flex: 1, maxWidth: 360 }}>
              <div className="signatory-heading" style={{ fontSize: 10.5, fontWeight: 700, color: "#000", marginBottom: 6 }}>{recommendingHeading}</div>
              <div style={{ textAlign: "center", marginTop: 4 }}>
                <div className="signatory-name" style={{ fontSize: 10, fontWeight: 800, color: "#000", textTransform: "uppercase", textDecoration: "underline", lineHeight: 1.15 }}>
                  {recommending?.name || "ADONIS C. CEPEREZ EdD, CESE"}
                </div>
                <div className="signatory-title" style={{ fontSize: 9, fontWeight: 700, color: "#222", marginTop: 2, lineHeight: 1.1 }}>
                  {recommending?.title || "Assistant Schools Division Superintendent"}
                </div>
              </div>
            </div>

            <div className="signatory-box" style={{ flex: 1, maxWidth: 360 }}>
              <div className="signatory-heading" style={{ fontSize: 10.5, fontWeight: 700, color: "#000", marginBottom: 6 }}>{approvedHeading}</div>
              <div style={{ textAlign: "center", marginTop: 4 }}>
                <div className="signatory-name" style={{ fontSize: 10, fontWeight: 800, color: "#000", textTransform: "uppercase", textDecoration: "underline", lineHeight: 1.15 }}>
                  {approved?.name || "ORLANDO E. MANUEL PhD, CESO V"}
                </div>
                <div className="signatory-title" style={{ fontSize: 9, fontWeight: 700, color: "#222", marginTop: 2, lineHeight: 1.1 }}>
                  {approved?.title || "Schools Division Superintendent"}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Junior High School Official District Level Format */
        <>
          {/* Upper row: Prepared by (left or full-width) and Conformed (right if enabled) */}
          <div className="signatory-row" style={{ display: "flex", justifyContent: showConformed ? "space-between" : "center", alignItems: "flex-start", gap: 16, marginBottom: 8 }}>
            <div style={{ flex: 1, width: showConformed ? undefined : "100%" }}>
              <div className="signatory-heading" style={{ fontSize: 10.5, fontWeight: 700, color: "#000", marginBottom: 6, textAlign: showConformed ? "left" : "center" }}>{preparedHeading}</div>
              <div className="signatory-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, preparedByList.length)}, 1fr)`, gap: 8, textAlign: "center" }}>
                {preparedByList.map((sig, idx) => (
                  <div key={idx} style={{ padding: "0 2px" }}>
                    <div className="signatory-name" style={{ fontSize: 9.5, fontWeight: 800, color: "#000", textTransform: "uppercase", textDecoration: "underline", lineHeight: 1.15 }}>
                      {sig.name || "COORDINATOR NAME"}
                    </div>
                    <div className="signatory-title" style={{ fontSize: 8.5, fontWeight: 700, color: "#222", marginTop: 2, lineHeight: 1.1 }}>
                      {sig.title || "Subject Coordinator"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showConformed && (
              <div className="signatory-col-right" style={{ width: 220, textAlign: "center", flexShrink: 0 }}>
                <div className="signatory-heading" style={{ fontSize: 10.5, fontWeight: 700, color: "#000", textAlign: "left", marginBottom: 6 }}>{conformedHeading}</div>
                <div className="signatory-name" style={{ fontSize: 9.5, fontWeight: 800, color: "#000", textTransform: "uppercase", textDecoration: "underline", lineHeight: 1.15 }}>
                  {conformed?.name || "CONFORMED NAME"}
                </div>
                <div className="signatory-title" style={{ fontSize: 8.5, fontWeight: 700, color: "#222", marginTop: 2, lineHeight: 1.1 }}>
                  {conformed?.title || "Asst. Principal Designate"}
                </div>
              </div>
            )}
          </div>

          {/* Middle row: Recommending Approval (left) and Approved (right) */}
          <div className="signatory-row signatory-row-mid" style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-start", gap: 24, marginTop: 6, marginBottom: 6 }}>
            <div className="signatory-box" style={{ textAlign: "center", minWidth: 200 }}>
              <div className="signatory-heading" style={{ fontSize: 10.5, fontWeight: 700, color: "#000", marginBottom: 6 }}>{recommendingHeading}</div>
              <div className="signatory-name" style={{ fontSize: 9.5, fontWeight: 800, color: "#000", textTransform: "uppercase", textDecoration: "underline", lineHeight: 1.15 }}>
                {recommending?.name || "PRINCIPAL NAME"}
              </div>
              <div className="signatory-title" style={{ fontSize: 8.5, fontWeight: 700, color: "#222", marginTop: 2, lineHeight: 1.1 }}>
                {recommending?.title || "Secondary School Principal II"}
              </div>
            </div>

            <div className="signatory-box" style={{ textAlign: "center", minWidth: 200 }}>
              <div className="signatory-heading" style={{ fontSize: 10.5, fontWeight: 700, color: "#000", marginBottom: 6 }}>{approvedHeading}</div>
              <div className="signatory-name" style={{ fontSize: 9.5, fontWeight: 800, color: "#000", textTransform: "uppercase", textDecoration: "underline", lineHeight: 1.15 }}>
                {approved?.name || "SUPERVISOR NAME"}
              </div>
              <div className="signatory-title" style={{ fontSize: 8.5, fontWeight: 700, color: "#222", marginTop: 2, lineHeight: 1.1 }}>
                {approved?.title || "District_In-Charge"}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Official DepEd Footer Contact Bar with Logos (Photos 2 & 3) */}
      <div
        className="signatory-contact-bar"
        style={{
          borderTop: "1.5px solid #000",
          marginTop: 8,
          paddingTop: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 16,
          width: "100%",
        }}
      >
        {/* Footer Logos (Photo 2: Tri-Logo or Photo 3: School Logo Only - Level Specific) */}
        {(() => {
          const branding = typeof getLevelBranding === "function"
            ? getLevelBranding(profile, targetLevel)
            : (profile?.brandingByLevel?.[targetLevel] || profile);
          const footerMode = branding?.footerLogoFormat || profile?.footerLogoFormat || (isShs ? "tri_logo" : "school_only");
          if (footerMode === "text_only") return null;

          const showTriLogo = footerMode === "tri_logo" || (footerMode === "auto" && isShs);
          const showDepEdWordmark = branding?.showDepEdWordmark !== false && footerMode !== "school_only";
          const showBagongPilipinas = (Boolean(branding?.showBagongPilipinas) || isShs) && footerMode === "tri_logo";
          const showSchoolSeal = branding?.showSchoolSeal !== false;

          const schoolLogo = (branding?.schoolLogoUrl && branding.schoolLogoUrl.startsWith("data:"))
            ? branding.schoolLogoUrl
            : (profile?.schoolLogoUrl && profile.schoolLogoUrl.startsWith("data:"))
            ? profile.schoolLogoUrl
            : "/diadi-nhs-logo.png?v=1980";
          const bagongPilipinasLogo = branding?.bagongPilipinasLogoUrl || profile?.bagongPilipinasLogoUrl;
          const depedWordmark = branding?.depedWordmarkUrl;

          return (
            <div className="signatory-footer-logos" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {showDepEdWordmark && (
                depedWordmark ? (
                  <img src={depedWordmark} alt="DepEd Wordmark" style={{ height: 36, width: "auto", objectFit: "contain" }} />
                ) : (
                  <DepEdWordmarkLogo size={36} />
                )
              )}
              {showBagongPilipinas && (
                bagongPilipinasLogo ? (
                  <img src={bagongPilipinasLogo} alt="Bagong Pilipinas" style={{ width: 36, height: 36, objectFit: "contain" }} />
                ) : (
                  <BagongPilipinasLogo size={36} />
                )
              )}
              {showSchoolSeal && (
                schoolLogo ? (
                  <img
                    src={schoolLogo}
                    alt={`${profile?.schoolName || "Diadi National High School"} Seal`}
                    style={{ width: 36, height: 36, objectFit: "contain", borderRadius: "50%" }}
                  />
                ) : (
                  <SchoolOfficialSeal size={36} schoolName={profile?.schoolName} />
                )
              )}
            </div>
          );
        })()}

        {/* School Coordinates (Photo 2 & 3) */}
        <div style={{ fontSize: 9.5, lineHeight: 1.35, color: "#000", fontFamily: "Arial, sans-serif" }}>
          <div><strong>Address:</strong> {address}</div>
          <div><strong>E-mail:</strong> <span style={{ color: "#002b7f", textDecoration: "underline" }}>{email}</span></div>
          {website && <div><strong>Website:</strong> {website}</div>}
        </div>
      </div>
    </div>
  );
}

export function DepEdTopHeader({ schoolProfile, title, subtitle, adviserName, isDraft, level }) {
  const profile = schoolProfile || DEFAULT_PROFILE_FALLBACK;
  const isShs = level === "shs" || (subtitle && /(?:Grade\s*1[12]|1[12]\s*[-–]|Senior\s*High)/i.test(subtitle));
  const targetLevel = isShs ? "shs" : "jhs";
  const branding = typeof getLevelBranding === "function"
    ? getLevelBranding(profile, targetLevel)
    : (profile?.brandingByLevel?.[targetLevel] || profile);

  const showDepEdSeal = branding?.showDepEdSeal !== false;
  const depedLogo = branding?.depedSealUrl || branding?.depedLogoUrl || profile?.depedSealUrl || profile?.depedLogoUrl;

  return (
    <div className="deped-top-header" style={{ position: "relative", marginBottom: 12, textAlign: "center" }}>
      {isDraft && (
        <div className="deped-draft-badge" style={{ position: "absolute", top: 0, right: 0, padding: "2px 8px", background: "#fef3c7", color: "#b45309", border: "1px solid #f59e0b", borderRadius: 4, fontWeight: 800, fontSize: 11, zIndex: 2 }}>
          DRAFT - FOR APPROVAL
        </div>
      )}

      {/* Official Centered Circular DepEd Seal (Photo 1) */}
      {showDepEdSeal && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 3 }}>
          {depedLogo ? (
            <img src={depedLogo} alt="DepEd Seal" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: "50%" }} />
          ) : (
            <DepEdOfficialSeal size={48} />
          )}
        </div>
      )}

      {/* Official DepEd Blackletter / Fraktur Masthead Typography (Photo 1) */}
      <div style={{ textAlign: "center" }}>
        <div
          className="deped-header-republic"
          style={{
            fontSize: 12.5,
            fontFamily: "'Old English Text MT', 'UnifrakturMaguntia', 'Cloister Black', 'Times New Roman', serif",
            fontWeight: 700,
            color: "#000",
            lineHeight: 1.15,
          }}
        >
          Republic of the Philippines
        </div>
        <div
          className="deped-header-department"
          style={{
            fontSize: 16.5,
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
            className="deped-header-region"
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
          className="deped-header-division"
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
          className="deped-header-school"
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

        {/* Schedule Document Title & Metadata */}
        <div
          className="deped-header-title"
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
          {title || "CLASSROOM PROGRAM"}
        </div>
        <div
          className="deped-header-sy"
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
        {subtitle && (
          <div
            className="deped-header-subtitle"
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
            {subtitle}
          </div>
        )}
        {adviserName && adviserName !== "-" && (
          <div
            className="deped-header-adviser"
            style={{ fontSize: 11, fontWeight: 700, color: "#333", marginTop: 2, lineHeight: 1.15 }}
          >
            Adviser: <span style={{ textTransform: "uppercase" }}>{adviserName}</span>
          </div>
        )}
      </div>
    </div>
  );
}


export default function TimeTables({
  initialData = null,
  initialViewMode = "sections",
  isModal = false,
  modalTitle = "",
  onClose = null,
  onLoadDraft = null,
}) {
  const [scheduleData, setScheduleData] = useState(null);
  const [scheduleSourceType, setScheduleSourceType] = useState("none");
  const [availableSources, setAvailableSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [schoolProfile, setSchoolProfile] = useState(() => getEffectiveSchoolProfile());

  const exportSchedulesRef = useRef();
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState(initialViewMode || "sections"); // 'sections' | 'teachers' | 'substitute'
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [pinchHitTeacherId, setPinchHitTeacherId] = useState(() => {
    if (typeof window === "undefined" || initialViewMode !== "substitute") return "";
    return new URLSearchParams(window.location.search).get("teacherId") || "";
  });

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
    if (initialViewMode === "substitute" && typeof window !== "undefined") {
      const tId = new URLSearchParams(window.location.search).get("teacherId") || "";
      setPinchHitTeacherId(tId);
    }
  }, [initialViewMode]);

  const formatDraftSource = (data) => {
    if (!data) return null;
    return {
      id: data.id || `draft-${Date.now()}`,
      type: data.type || "draft",
      scheduleType: data.scheduleType || "jhs",
      name: data.name || "Saved Draft",
      updatedAt: data.updatedAt || new Date().toISOString(),
      schedule: data.schedule || data,
      config: data.config || data.schedule?.config,
    };
  };

  useEffect(() => {
    const initialSource = formatDraftSource(initialData);
    loadAllSchedules(initialSource, true);

    const handleSync = () => {
      if (!initialData) loadAllSchedules(null, true);
    };
    const handleProfileSync = () => {
      setSchoolProfile(getEffectiveSchoolProfile());
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("focus", handleSync);
    window.addEventListener("turotugma:schedule-updated", handleSync);
    window.addEventListener("turotugma:profile-updated", handleProfileSync);
    window.addEventListener("storage", handleProfileSync);
    window.addEventListener("focus", handleProfileSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("turotugma:schedule-updated", handleSync);
      window.removeEventListener("turotugma:profile-updated", handleProfileSync);
      window.removeEventListener("storage", handleProfileSync);
      window.removeEventListener("focus", handleProfileSync);
    };
  }, [initialData]);

  const loadAllSchedules = (forcedActive = null, preferLatest = false) => {
    const publishedRaw = getFromStorage(PUBLISHED_STORAGE_KEY, null);
    const draftsRaw = getFromStorage(DRAFTS_STORAGE_KEY, []);

    const sources = [];

    if (forcedActive) {
      sources.push(forcedActive);
    }

    if (publishedRaw && typeof publishedRaw === "object") {
      Object.keys(publishedRaw).forEach((type) => {
        const item = publishedRaw[type];
        if (item && item.assignments && Object.keys(item.assignments).length > 0) {
          if (!forcedActive || `published-${type}` !== forcedActive.id) {
            sources.push({
              id: `published-${type}`,
              type: "published",
              scheduleType: item.scheduleType || type,
              name: `Published Schedule — ${(item.scheduleType || type).toUpperCase()}`,
              updatedAt: item.publishedAt || item.updatedAt || new Date(0).toISOString(),
              schedule: item,
              config: item.config || item.scheduleConfig,
            });
          }
        }
      });
    }

    if (Array.isArray(draftsRaw)) {
      draftsRaw.forEach((draft) => {
        if (draft && draft.schedule && draft.schedule.assignments && Object.keys(draft.schedule.assignments).length > 0) {
          if (!forcedActive || draft.id !== forcedActive.id) {
            sources.push({
              id: draft.id || `draft-${Date.now()}`,
              type: "draft",
              scheduleType: draft.scheduleType || draft.schedule?.scheduleType || "jhs",
              name: draft.name || "Saved Draft",
              updatedAt: draft.updatedAt || draft.schedule?.updatedAt || new Date(0).toISOString(),
              schedule: draft.schedule,
              config: draft.config || draft.schedule?.config,
            });
          }
        }
      });
    }

    sources.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    setAvailableSources(sources);

    let active = null;
    if (forcedActive) {
      active = forcedActive;
    } else if (sources.length > 0) {
      const urlSourceId =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("sourceId") || ""
          : "";
      const preferredId = (!preferLatest && selectedSourceId) ? selectedSourceId : urlSourceId;
      const found = preferredId ? sources.find((s) => s.id === preferredId) : null;
      active = found || sources[0];
    }

    if (active) {
      setSelectedSourceId(active.id);
      setScheduleData(active);
      setScheduleSourceType(active.type);
      const sectionsRaw = getFromStorage(SECTIONS_STORAGE_KEY, {});
      setSections(normalizeSections(sectionsRaw, active.scheduleType || "jhs"));
    } else {
      setScheduleData(null);
      setScheduleSourceType("none");
      const sectionsRaw = getFromStorage(SECTIONS_STORAGE_KEY, {});
      setSections(normalizeSections(sectionsRaw, "jhs"));
    }

    setSubjects(getFromStorage(SUBJECTS_STORAGE_KEY, []));
    setTeachers(getFromStorage(FACULTY_STORAGE_KEY, []));
  };

  const publishedSources = useMemo(
    () => availableSources.filter((s) => s.type === "published"),
    [availableSources]
  );
  const draftSources = useMemo(
    () => availableSources.filter((s) => s.type === "draft"),
    [availableSources]
  );

  const handleSourceChange = (e) => {
    const id = e.target.value;
    setSelectedSourceId(id);
    const found = availableSources.find((s) => s.id === id);
    if (found) {
      setScheduleData(found);
      setScheduleSourceType(found.type);
      const sectionsRaw = getFromStorage(SECTIONS_STORAGE_KEY, {});
      setSections(normalizeSections(sectionsRaw, found.scheduleType || "jhs"));
    }
  };

  const {
    activeSchedule,
    config,
    scheduleType,
    assignments,
    sectionsById,
    subjectsById,
    teachersById,
    slots,
    slotsById,
    days,
    regularSessionDays,
    shortenedSessionDays,
    periods,
    assignedSectionIds,
    assignedTeacherIds,
    cellAssignmentIndex,
    teacherAssignmentIndex,
  } = useMemo(() => {
    if (!scheduleData || !scheduleData.schedule) {
      return {
        activeSchedule: null,
        config: {},
        scheduleType: "jhs",
        assignments: {},
        sectionsById: new Map(),
        subjectsById: new Map(),
        teachersById: new Map(),
        slots: [],
        slotsById: new Map(),
        days: [],
        regularSessionDays: [],
        shortenedSessionDays: [],
        periods: [],
        assignedSectionIds: [],
        assignedTeacherIds: [],
        cellAssignmentIndex: new Map(),
        teacherAssignmentIndex: new Map(),
      };
    }

    const sched = scheduleData.schedule;
    const cfg = scheduleData.config || sched.config || {};
    const stType = scheduleData.scheduleType || sched.scheduleType || "jhs";
    const assign = sched.assignments || {};

    const rawSecList = Array.isArray(sched.sections) && sched.sections.length > 0 ? sched.sections : sections;
    const secList = [...rawSecList].sort((a, b) => {
      const gA = Number(a.grade) || 0;
      const gB = Number(b.grade) || 0;
      if (gA !== gB) return gA - gB;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });

    const secMap = new Map();
    secList.forEach((s) => {
      if (s.id) {
        secMap.set(s.id, s);
        secMap.set(String(s.id), s);
      }
      if (s.originalId) {
        secMap.set(s.originalId, s);
        secMap.set(String(s.originalId), s);
      }
      if (s.name) secMap.set(s.name, s);
      if (s.code) secMap.set(s.code, s);
      const simple = String(s.name || "").replace(/\s+/g, "").toLowerCase();
      if (simple) secMap.set(simple, s);
    });

    const allSubjects = Array.isArray(sched.subjects) && sched.subjects.length > 0
      ? [...sched.subjects, ...(subjects || [])]
      : subjects || [];
    const subMap = new Map();
    allSubjects.forEach((s) => {
      if (s.id) {
        subMap.set(s.id, s);
        subMap.set(String(s.id), s);
      }
      if (s.subjectCode) subMap.set(s.subjectCode, s);
      if (s.code) subMap.set(s.code, s);
      if (s.name) subMap.set(s.name, s);
      if (s.subjectName) subMap.set(s.subjectName, s);
    });

    const allTeachers = Array.isArray(sched.teachers) && sched.teachers.length > 0
      ? [...sched.teachers, ...(teachers || [])]
      : Array.isArray(sched.faculty) && sched.faculty.length > 0
      ? [...sched.faculty, ...(teachers || [])]
      : teachers || [];
    const tMap = new Map();
    allTeachers.forEach((t) => {
      if (t.id) {
        tMap.set(t.id, t);
        tMap.set(String(t.id), t);
      }
      if (t.name) tMap.set(t.name, t);
      if (t.teacherName) tMap.set(t.teacherName, t);
    });

    let slotList = Array.isArray(sched.slots) && sched.slots.length > 0 ? sched.slots : [];
    if (slotList.length === 0) {
      slotList = buildSlotsForTimetable(cfg, stType);
    }

    const sById = new Map();
    slotList.forEach((s) => {
      if (s.id) sById.set(s.id, s);
      if (s.label) sById.set(s.label, s);
    });

    const levelCfg = cfg[stType] || cfg["jhs"] || {};
    const weekdayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    let daysFromSlots = [];
    let regDaysFromSlots = [];
    let shortDaysFromSlots = [];

    if (slotList.length > 0) {
      const daySet = new Set();
      const regSet = new Set();
      const shortSet = new Set();

      slotList.forEach((s) => {
        if (s.day) {
          daySet.add(s.day);
          if (s.sessionType === "shortened") shortSet.add(s.day);
          else regSet.add(s.day);
        }
      });

      daysFromSlots = Array.from(daySet);
      regDaysFromSlots = Array.from(regSet);
      shortDaysFromSlots = Array.from(shortSet);
    }

    let regularSessionDays = regDaysFromSlots.length > 0
      ? regDaysFromSlots
      : (Array.isArray(levelCfg.regularDays) && levelCfg.regularDays.length > 0
        ? levelCfg.regularDays
        : ["Monday", "Tuesday", "Wednesday", "Thursday"]);

    let shortenedSessionDays = shortDaysFromSlots.length > 0
      ? shortDaysFromSlots
      : (Array.isArray(levelCfg.shortenedDays) && levelCfg.shortenedDays.length > 0
        ? levelCfg.shortenedDays
        : ["Friday"]);

    let dayList = daysFromSlots.length > 0
      ? daysFromSlots
      : Array.from(new Set([...regularSessionDays, ...shortenedSessionDays]));

    if (assign) {
      Object.keys(assign).forEach((k) => {
        const slotId = k.split("|")[1] || "";
        weekdayOrder.forEach((wDay) => {
          if (slotId.toLowerCase().includes(wDay.toLowerCase().substring(0, 3))) {
            if (!dayList.includes(wDay)) dayList.push(wDay);
          }
        });
      });
    }

    dayList.sort((a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b));
    if (dayList.length === 0) {
      dayList = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    }

    regularSessionDays = regularSessionDays.filter((d) => dayList.includes(d));
    shortenedSessionDays = shortenedSessionDays.filter((d) => dayList.includes(d));

    const maxPFromSlots = slotList.length > 0 ? Math.max(...slotList.map((s) => Number(s.period) || 1)) : 0;
    const maxPFromAssignments = Object.keys(assign).reduce((maxVal, cellKey) => {
      const parts = cellKey.split("|");
      if (parts.length >= 2) {
        const slotId = parts[1];
        const numMatch = slotId.match(/P(\d+)/i) || slotId.match(/(\d+)/);
        if (numMatch) return Math.max(maxVal, parseInt(numMatch[1], 10));
      }
      return maxVal;
    }, 0);

    const maxP = (maxPFromAssignments > 0 || maxPFromSlots > 0)
      ? Math.max(maxPFromAssignments, maxPFromSlots)
      : Math.max(levelCfg.periods?.regular || 8, 1);

    const periodList = Array.from({ length: maxP }, (_, i) => i + 1);

    const cellIdx = new Map();
    const teacherIdx = new Map();

    Object.entries(assign).forEach(([cellKey, item]) => {
      if (!item) return;
      const parts = cellKey.split("|");
      if (parts.length < 2) return;
      const secId = parts[0];
      const slotId = parts[1];

      let slot = sById.get(slotId);
      let day = slot?.day;
      let period = slot?.period ? Number(slot.period) : null;

      if (!day || !period) {
        const lowerSlot = slotId.toLowerCase();
        if (lowerSlot.includes("mon")) day = "Monday";
        else if (lowerSlot.includes("tue")) day = "Tuesday";
        else if (lowerSlot.includes("wed")) day = "Wednesday";
        else if (lowerSlot.includes("thu")) day = "Thursday";
        else if (lowerSlot.includes("fri")) day = "Friday";
        else if (lowerSlot.includes("sat")) day = "Saturday";
        else if (lowerSlot.includes("sun")) day = "Sunday";

        const numMatch = slotId.match(/(\d+)/);
        if (numMatch) period = parseInt(numMatch[1], 10);
      }

      const secObj = secMap.get(secId) || secList.find((s) => s.id === secId || s.name === secId);
      const sectionAliases = new Set([secId]);
      if (secObj) {
        if (secObj.id) sectionAliases.add(secObj.id);
        if (secObj.originalId) sectionAliases.add(secObj.originalId);
        if (secObj.name) sectionAliases.add(secObj.name);
        if (secObj.code) sectionAliases.add(secObj.code);
      }

      const jhsMatch = String(secId).match(/jhs-(\d+)-(\d+)/i);
      if (jhsMatch) {
        const g = parseInt(jhsMatch[1], 10);
        const idx = parseInt(jhsMatch[2], 10);
        const gradeSecs = secList.filter((s) => Number(s.grade) === g);
        if (gradeSecs[idx]) {
          sectionAliases.add(gradeSecs[idx].id);
          sectionAliases.add(gradeSecs[idx].name);
        }
      }

      const targetDays = (!day || day === "All Days") ? dayList : [day];

      sectionAliases.forEach((alias) => {
        targetDays.forEach((d) => {
          if (period) {
            cellIdx.set(`${alias}|${d}|${period}`, item);
          }
        });
        cellIdx.set(`${alias}|${slotId}`, item);
      });

      if (period) {
        targetDays.forEach((d) => {
          if (item.teacherId) {
            teacherIdx.set(`${item.teacherId}|${d}|${period}`, { assignment: item, sectionId: secId });
            teacherIdx.set(`${String(item.teacherId)}|${d}|${period}`, { assignment: item, sectionId: secId });
          }
          if (Array.isArray(item.coTeacherIds)) {
            item.coTeacherIds.forEach((coTid) => {
              if (coTid) {
                teacherIdx.set(`${coTid}|${d}|${period}`, { assignment: item, sectionId: secId, isCoTeacher: true });
                teacherIdx.set(`${String(coTid)}|${d}|${period}`, { assignment: item, sectionId: secId, isCoTeacher: true });
              }
            });
          }
          if (Array.isArray(item.breakoutAssignments)) {
            item.breakoutAssignments.forEach((b) => {
              if (b?.teacherId) {
                teacherIdx.set(`${b.teacherId}|${d}|${period}`, { assignment: item, sectionId: secId, streamName: b.stream, isBreakout: true });
                teacherIdx.set(`${String(b.teacherId)}|${d}|${period}`, { assignment: item, sectionId: secId, streamName: b.stream, isBreakout: true });
              }
            });
          }
        });
      }
    });

    const assignedSecKeySet = new Set(Object.keys(assign).map((k) => k.split("|")[0]));
    const secIds = [];
    const addedSec = new Set();
    secList.forEach((s) => {
      if (!addedSec.has(s.id) && (assignedSecKeySet.has(s.id) || assignedSecKeySet.has(s.name) || Object.keys(assign).length === 0)) {
        secIds.push(s.id);
        addedSec.add(s.id);
      }
    });
    assignedSecKeySet.forEach((sid) => {
      if (sid && !addedSec.has(sid)) {
        secIds.push(sid);
        addedSec.add(sid);
      }
    });

    let tIds = Array.from(new Set(Object.values(assign).map((a) => a?.teacherId).filter(Boolean)));
    Object.values(assign).forEach((a) => {
      if (Array.isArray(a?.coTeacherIds)) {
        a.coTeacherIds.forEach((coTid) => {
          if (coTid && !tIds.includes(coTid)) tIds.push(coTid);
        });
      }
      if (Array.isArray(a?.breakoutAssignments)) {
        a.breakoutAssignments.forEach((b) => {
          if (b?.teacherId && !tIds.includes(b.teacherId)) tIds.push(b.teacherId);
        });
      }
    });
    if (tIds.length === 0 && teachers.length > 0) {
      tIds = teachers.map((t) => t.id);
    }
    tIds.sort((a, b) => {
      const teacherA = tMap.get(a) || tMap.get(String(a));
      const teacherB = tMap.get(b) || tMap.get(String(b));
      const nameA = (teacherA?.teacherName || teacherA?.name || String(a)).toLowerCase();
      const nameB = (teacherB?.teacherName || teacherB?.name || String(b)).toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return {
      activeSchedule: sched,
      config: cfg,
      scheduleType: stType,
      assignments: assign,
      sectionsById: secMap,
      subjectsById: subMap,
      teachersById: tMap,
      slots: slotList,
      slotsById: sById,
      days: dayList,
      regularSessionDays,
      shortenedSessionDays,
      periods: periodList,
      assignedSectionIds: secIds,
      assignedTeacherIds: tIds,
      cellAssignmentIndex: cellIdx,
      teacherAssignmentIndex: teacherIdx,
    };
  }, [scheduleData, sections, subjects, teachers]);

  if (!scheduleData || !activeSchedule) {
    return (
      <div>
        <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>Time Tables</h1>
        <div style={{ margin: "16px 0 24px", padding: 24, background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1", maxWidth: 700 }}>
          <h3 style={{ margin: "0 0 8px", color: "#334155", fontSize: 16 }}>No Active Schedule Found</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
            Please generate and save or publish a schedule in the <b>Schedule Generator</b> tab first. Saved drafts and published timetables will automatically appear here.
          </p>
        </div>
      </div>
    );
  }

  function getSectionName(sectionId) {
    const sec = sectionsById.get(sectionId);
    if (sec) return sec.name || sec.sectionName || sec.code || sectionId;
    const foundNorm = sections.find((s) => s.id === sectionId);
    if (foundNorm) return foundNorm.name;
    const match = String(sectionId).match(/jhs-(\d+)-(\d+)/i);
    if (match) return `Grade ${match[1]} - Section ${parseInt(match[2], 10) + 1}`;
    return sectionId;
  }

  function formatCleanSubjectName(rawName) {
    if (!rawName || typeof rawName !== "string") return rawName || "";
    let name = rawName.trim();
    const jhsCorePattern = /^(Science|Mathematics|Math|English|Filipino|Araling Panlipunan|Edukasyon sa Pagpapakakatao|EsP|MAPEH|Technology and Livelihood Education|TLE)\s+\d+$/i;
    if (jhsCorePattern.test(name)) {
      return name.replace(/\s+\d+$/i, "").trim();
    }
    return name;
  }

  function getSubjectName(subjectId) {
    if (!subjectId) return "";
    const sub = subjectsById.get(subjectId);
    const raw = sub ? sub.subjectName || sub.subjectCode || sub.name : subjectId;
    return formatCleanSubjectName(raw);
  }

  function getTeacherName(teacherId) {
    if (!teacherId) return "";
    const teacher = teachersById.get(teacherId);
    return teacher ? teacher.teacherName || teacher.name : teacherId;
  }

  function getCellAssignment(sectionId, day, periodNum) {
    const secObj = sectionsById.get(sectionId) || sectionsById.get(String(sectionId));
    const secName = secObj?.name || getSectionName(sectionId);
    return (
      cellAssignmentIndex.get(`${sectionId}|${day}|${periodNum}`) ||
      cellAssignmentIndex.get(`${String(sectionId)}|${day}|${periodNum}`) ||
      cellAssignmentIndex.get(`${secName}|${day}|${periodNum}`) ||
      cellAssignmentIndex.get(`${sectionId}|${day}-P${periodNum}`) ||
      cellAssignmentIndex.get(`${secName}|${day}-P${periodNum}`) ||
      null
    );
  }

  function getTeacherCellAssignment(teacherId, day, periodNum) {
    return (
      teacherAssignmentIndex.get(`${teacherId}|${day}|${periodNum}`) ||
      teacherAssignmentIndex.get(`${String(teacherId)}|${day}|${periodNum}`) ||
      null
    );
  }

  function getAdviserName(sectionId) {
    const secObj = sectionsById.get(sectionId) || sectionsById.get(String(sectionId));
    if (secObj?.adviserName) return secObj.adviserName;
    if (secObj?.adviserId) return getTeacherName(secObj.adviserId);

    for (const day of days) {
      const assign = getCellAssignment(sectionId, day, 1);
      if (assign?.teacherId) {
        return getTeacherName(assign.teacherId);
      }
    }
    return "-";
  }

  // Filter sections
  let filteredSectionIds = assignedSectionIds;
  if (viewMode === "sections") {
    if (gradeFilter !== "all") {
      filteredSectionIds = filteredSectionIds.filter((id) => {
        const sec = sectionsById.get(id);
        return sec && String(sec.grade) === String(gradeFilter);
      });
    }
    if (selectedSection !== "all") {
      filteredSectionIds = filteredSectionIds.filter((id) => id === selectedSection);
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.trim().toLowerCase();
      filteredSectionIds = filteredSectionIds.filter((id) =>
        getSectionName(id).toLowerCase().includes(lower)
      );
    }
  }

  // Filter teachers
  let filteredTeacherIds = assignedTeacherIds;
  if (viewMode === "teachers") {
    if (selectedTeacher !== "all") {
      filteredTeacherIds = filteredTeacherIds.filter((id) => id === selectedTeacher);
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.trim().toLowerCase();
      filteredTeacherIds = filteredTeacherIds.filter((id) =>
        getTeacherName(id).toLowerCase().includes(lower)
      );
    }
  }

  function handleExport() {
    if (exportSchedulesRef.current) {
      const exportClone = exportSchedulesRef.current.cloneNode(true);
      exportClone.style.width = "100%";
      exportClone.style.maxWidth = "none";
      exportClone.style.margin = "0";
      exportClone.style.padding = "0";
      exportClone.style.background = "#ffffff";

      const style = document.createElement("style");
      style.innerHTML = `
        @page {
          size: A4 landscape;
          margin: 0;
        }
        .export-section-page-break {
          margin: 0 !important;
          padding: 3.5mm 4.5mm !important;
          box-shadow: none !important;
          border: 1.5px solid #000 !important;
          border-radius: 0 !important;
          box-sizing: border-box !important;
          width: 100% !important;
          max-width: 100% !important;
          background: #ffffff !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          min-height: 202mm !important;
          max-height: 204mm !important;
          overflow: hidden !important;
        }
        .export-section-page-break .deped-top-header {
          margin-bottom: 4px !important;
          line-height: 1.1 !important;
          flex-shrink: 0 !important;
        }
        .export-section-page-break .deped-draft-badge {
          font-size: 8.5px !important;
          padding: 2px 6px !important;
        }
        .export-section-page-break .deped-header-republic {
          font-size: 9px !important;
          margin: 0 !important;
          line-height: 1.1 !important;
        }
        .export-section-page-break .deped-header-department {
          font-size: 11px !important;
          margin: 0 !important;
          line-height: 1.1 !important;
        }
        .export-section-page-break .deped-header-region,
        .export-section-page-break .deped-header-division {
          font-size: 8.5px !important;
          margin: 0 !important;
          line-height: 1.1 !important;
        }
        .export-section-page-break .deped-header-school {
          font-size: 12px !important;
          margin: 1px 0 0 !important;
          line-height: 1.15 !important;
        }
        .export-section-page-break .deped-header-title {
          font-size: 10.5px !important;
          margin: 2px 0 0 !important;
          line-height: 1.1 !important;
        }
        .export-section-page-break .deped-header-sy {
          font-size: 8.5px !important;
          margin: 0 !important;
          line-height: 1.1 !important;
        }
        .export-section-page-break .deped-header-subtitle {
          font-size: 11.5px !important;
          margin: 1px 0 0 !important;
          line-height: 1.15 !important;
        }
        .export-section-page-break .deped-header-adviser {
          font-size: 8.5px !important;
          margin: 0 !important;
          line-height: 1.1 !important;
        }

        .export-section-page-break .timetable-table-wrap {
          flex: 1 1 auto !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: visible !important;
        }
        .export-section-page-break table {
          width: 100% !important;
          flex: 1 1 auto !important;
          border-collapse: collapse !important;
          margin: 0 !important;
        }
        .export-section-page-break th,
        .export-section-page-break td {
          padding: 2.5px 4px !important;
          font-size: 8.5px !important;
          line-height: 1.12 !important;
          min-height: 0 !important;
          height: auto !important;
        }
        .export-section-page-break thead tr {
          background: transparent !important;
        }
        .export-section-page-break thead th,
        .export-section-page-break th {
          font-size: 9.5px !important;
          font-weight: 800 !important;
          padding: 3.5px 4px !important;
          color: #000000 !important;
          background: #8fb6e5 !important;
          background-color: #8fb6e5 !important;
          opacity: 1 !important;
        }
        .export-section-page-break td.time-cell,
        .export-section-page-break td:first-child,
        .export-section-page-break td:nth-child(2) {
          white-space: nowrap !important;
          font-size: 8px !important;
          line-height: 1.1 !important;
          color: #000000 !important;
        }
        .export-section-page-break .schedule-cell {
          min-height: 0 !important;
          height: auto !important;
          padding: 2.5px 4px !important;
        }
        .export-section-page-break .schedule-cell-content {
          gap: 1.5px !important;
        }
        .export-section-page-break .schedule-cell-subject {
          font-size: 9px !important;
          line-height: 1.12 !important;
          font-weight: 800 !important;
          color: #000000 !important;
        }
        .export-section-page-break .schedule-cell-subtext {
          font-size: 7.5px !important;
          line-height: 1.05 !important;
          font-weight: 600 !important;
          letter-spacing: 0 !important;
          margin-top: 0.5px !important;
          color: #111111 !important;
        }
        .export-section-page-break .schedule-cell-breakout {
          font-size: 6.8px !important;
          line-height: 1.0 !important;
          gap: 0.5px !important;
        }
        .export-section-page-break .break-banner {
          font-size: 8.5px !important;
          padding: 2.5px 4px !important;
          letter-spacing: 0.8px !important;
          line-height: 1.1 !important;
          background: #f5b301 !important;
          background-color: #f5b301 !important;
          color: #000000 !important;
        }

        .export-section-page-break .signatory-container {
          margin-top: 5px !important;
          padding-top: 2px !important;
          flex-shrink: 0 !important;
        }
        .export-section-page-break .signatory-row {
          gap: 8px !important;
          margin-bottom: 3px !important;
        }
        .export-section-page-break .signatory-row-mid {
          margin-top: 3px !important;
          margin-bottom: 3px !important;
          gap: 14px !important;
        }
        .export-section-page-break .signatory-grid {
          gap: 6px !important;
        }
        .export-section-page-break .signatory-col-right {
          width: 190px !important;
        }
        .export-section-page-break .signatory-box {
          min-width: 190px !important;
        }
        .export-section-page-break .signatory-heading {
          font-size: 8.5px !important;
          margin-bottom: 3px !important;
          font-weight: 700 !important;
          color: #000000 !important;
        }
        .export-section-page-break .signatory-name {
          font-size: 8.5px !important;
          line-height: 1.1 !important;
          font-weight: 800 !important;
          color: #000000 !important;
        }
        .export-section-page-break .signatory-title {
          font-size: 7.5px !important;
          line-height: 1.05 !important;
          margin-top: 1px !important;
          font-weight: 600 !important;
          color: #222222 !important;
        }
        .export-section-page-break .signatory-contact-bar {
          margin-top: 4px !important;
          padding-top: 4px !important;
          border-top: 1.2px solid #000 !important;
          font-size: 8px !important;
          line-height: 1.15 !important;
          gap: 8px !important;
        }
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      `;
      exportClone.prepend(style);
      Array.from(exportClone.querySelectorAll(".turotugma-no-print")).forEach((el) => {
        el.remove();
      });
      Array.from(exportClone.querySelectorAll("div")).forEach((div) => {
        if (div.classList.contains("schedule-block")) {
          div.classList.add("export-section-page-break");
        }
      });
      const docTitle = `${viewMode === "teachers" ? "Teacher-Schedule" : "Classroom-Program"}-${(scheduleData?.name || "Export").replace(/[^a-zA-Z0-9_-]/g, "_")}`;

      let blockRects = [];
      let containerHeight = 0;

      const worker = html2pdf()
        .set({
          margin: [3, 4, 3, 4],
          filename: `${docTitle}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            scrollY: 0,
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "landscape",
          },
          pagebreak: {
            mode: [],
          },
        })
        .from(exportClone);

      worker
        .toContainer()
        .then(function () {
          const container = this.prop.container;
          if (container) {
            const blocks = Array.from(container.querySelectorAll(".export-section-page-break"));
            const cRect = container.getBoundingClientRect();
            blockRects = blocks.map((b) => {
              const r = b.getBoundingClientRect();
              return {
                top: Math.max(0, r.top - cRect.top),
                height: r.height,
              };
            });
            containerHeight = cRect.height || container.scrollHeight || 1;
          }
        })
        .toCanvas()
        .then(function () {
          const srcCanvas = this.prop.canvas;
          if (srcCanvas && blockRects.length > 0 && containerHeight > 0) {
            const pxPageHeight = Math.floor(srcCanvas.width * this.prop.pageSize.inner.ratio);
            const scaleY = srcCanvas.height / containerHeight;
            const normalizedCanvas = document.createElement("canvas");
            normalizedCanvas.width = srcCanvas.width;
            normalizedCanvas.height = pxPageHeight * blockRects.length;
            const ctx = normalizedCanvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, normalizedCanvas.width, normalizedCanvas.height);

            blockRects.forEach((rect, idx) => {
              const sy = Math.max(0, Math.round(rect.top * scaleY));
              const sh = Math.min(srcCanvas.height - sy, Math.round(rect.height * scaleY));
              if (sh <= 0) return;
              const destY = idx * pxPageHeight;
              const drawH = Math.min(sh, pxPageHeight);
              ctx.drawImage(
                srcCanvas,
                0,
                sy,
                srcCanvas.width,
                sh,
                0,
                destY,
                normalizedCanvas.width,
                drawH
              );
            });

            this.prop.canvas = normalizedCanvas;
          }
        })
        .toPdf()
        .save();
    }
  }

  const levelConfig = config[scheduleType] || config["jhs"] || {};

  function parseTimeToMinutes(timeText) {
    if (!timeText) return 450;
    const clean = String(timeText).trim();
    const isPm = clean.toUpperCase().includes("PM");
    const isAm = clean.toUpperCase().includes("AM");
    const [hStr, mStr] = clean.replace(/[^0-9:]/g, "").split(":");
    let h = parseInt(hStr, 10) || 7;
    let m = parseInt(mStr, 10) || 30;
    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;
    return h * 60 + m;
  }

  function getPeriodTimes(periodType, count, periodMinutes, breaks) {
    let times = [];
    const startTimeText = levelConfig.schoolStartTime || "07:30";
    let currentMinutes = parseTimeToMinutes(startTimeText);

    for (let i = 1; i <= count; i++) {
      const matchingSlot = slots.find((s) => Number(s.period) === i && (s.sessionType === periodType || !s.sessionType));
      if (matchingSlot && matchingSlot.start && matchingSlot.end) {
        times.push(`${matchingSlot.start} – ${matchingSlot.end}`);
        continue;
      }

      let breakDuration = 0;
      if (breaks?.morning?.enabled && i - 1 === breaks.morning.afterPeriod) breakDuration += breaks.morning.duration;
      if (breaks?.lunch?.enabled && i - 1 === breaks.lunch.afterPeriod) breakDuration += breaks.lunch.duration;
      if (breaks?.afternoon?.enabled && i - 1 === breaks.afternoon.afterPeriod) breakDuration += breaks.afternoon.duration;
      currentMinutes += breakDuration;
      let endMinutes = currentMinutes + periodMinutes;
      times.push(`${minutesToTime(currentMinutes)} – ${minutesToTime(endMinutes)}`);
      currentMinutes = endMinutes;
    }
    return times;
  }

  function minutesToTime(mins) {
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    let ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  function getDayInitials(day) {
    if (!day) return "";
    if (day === "Thursday") return "Th";
    if (day === "Saturday") return "Sat";
    if (day === "Sunday") return "Sun";
    return day[0];
  }

  const regularSessionInitials = (regularSessionDays || []).map(getDayInitials).join(", ");
  const shortenedSessionInitials = (shortenedSessionDays || []).map(getDayInitials).join(", ");
  const maxPeriods = periods.length;

  const regularTimes = getPeriodTimes(
    "regular",
    periods.length,
    levelConfig.periodMinutes?.regular || 50,
    levelConfig.breaks
  );
  const shortenedTimes = getPeriodTimes(
    "shortened",
    periods.length,
    levelConfig.periodMinutes?.shortened || 45,
    levelConfig.breaks
  );

  const mainContent = (
    <div>
      <style>{`
        @media print {
          @page {
            size: ${viewMode === "substitute" ? "A4 portrait" : "A4 landscape"} !important;
            margin: ${viewMode === "substitute" ? "10mm 12mm" : "3mm 4mm"} !important;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .turotugma-dashboard-main,
          .turotugma-dashboard-section {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          /* Hide UI elements marked with turotugma-no-print */
          .turotugma-no-print,
          .turotugma-no-print * {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            max-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          /* Modal container overrides for clean print */
          .turotugma-preview-backdrop {
            position: static !important;
            display: block !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          .turotugma-preview-modal {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            height: auto !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .turotugma-preview-body {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          #printable-timetables-container {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          /* Strictly ONE schedule block per printed A4 landscape page */
          .schedule-block {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 200mm !important;
            max-height: 202mm !important;
            box-sizing: border-box !important;
            page-break-before: auto !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
            padding: 3.5mm 4.5mm !important;
            box-shadow: none !important;
            border: 1.5px solid #000 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }
          .schedule-block:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .schedule-block .deped-top-header {
            margin-bottom: 4px !important;
            line-height: 1.1 !important;
            flex-shrink: 0 !important;
          }
          .schedule-block .deped-draft-badge {
            font-size: 8.5px !important;
            padding: 2px 6px !important;
          }
          .schedule-block .deped-header-republic {
            font-size: 9px !important;
            margin: 0 !important;
            line-height: 1.1 !important;
          }
          .schedule-block .deped-header-department {
            font-size: 11px !important;
            margin: 0 !important;
            line-height: 1.1 !important;
          }
          .schedule-block .deped-header-region,
          .schedule-block .deped-header-division {
            font-size: 8.5px !important;
            margin: 0 !important;
            line-height: 1.1 !important;
          }
          .schedule-block .deped-header-school {
            font-size: 12px !important;
            margin: 1px 0 0 !important;
            line-height: 1.15 !important;
          }
          .schedule-block .deped-header-title {
            font-size: 10.5px !important;
            margin: 2px 0 0 !important;
            line-height: 1.1 !important;
          }
          .schedule-block .deped-header-sy {
            font-size: 8.5px !important;
            margin: 0 !important;
            line-height: 1.1 !important;
          }
          .schedule-block .deped-header-subtitle {
            font-size: 11.5px !important;
            margin: 1px 0 0 !important;
            line-height: 1.15 !important;
          }
          .schedule-block .deped-header-adviser {
            font-size: 8.5px !important;
            margin: 0 !important;
            line-height: 1.1 !important;
          }

          .schedule-block .timetable-table-wrap {
            flex: 1 1 auto !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: visible !important;
          }
          .schedule-block table {
            width: 100% !important;
            flex: 1 1 auto !important;
            border-collapse: collapse !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
          }
          .schedule-block th,
          .schedule-block td {
            padding: 2.5px 4px !important;
            font-size: 8.5px !important;
            line-height: 1.12 !important;
            min-height: 0 !important;
            height: auto !important;
          }
          .schedule-block thead tr {
            background: transparent !important;
          }
          .schedule-block thead th,
          .schedule-block th {
            font-size: 9.5px !important;
            font-weight: 800 !important;
            padding: 3.5px 4px !important;
            color: #000000 !important;
            background: #8fb6e5 !important;
            background-color: #8fb6e5 !important;
            opacity: 1 !important;
          }
          .schedule-block td.time-cell,
          .schedule-block td:first-child,
          .schedule-block td:nth-child(2) {
            white-space: nowrap !important;
            font-size: 8px !important;
            line-height: 1.1 !important;
            color: #000000 !important;
          }
          .schedule-block .schedule-cell {
            min-height: 0 !important;
            height: auto !important;
            padding: 2.5px 4px !important;
          }
          .schedule-block .schedule-cell-content {
            gap: 1.5px !important;
          }
          .schedule-block .schedule-cell-subject {
            font-size: 9px !important;
            line-height: 1.12 !important;
            font-weight: 800 !important;
            color: #000000 !important;
          }
          .schedule-block .schedule-cell-subtext {
            font-size: 7.5px !important;
            line-height: 1.05 !important;
            font-weight: 600 !important;
            letter-spacing: 0 !important;
            margin-top: 0.5px !important;
            color: #111111 !important;
          }
          .schedule-block .schedule-cell-breakout {
            font-size: 6.8px !important;
            line-height: 1.0 !important;
            gap: 0.5px !important;
          }
          .schedule-block .break-banner {
            font-size: 8.5px !important;
            padding: 2.5px 4px !important;
            letter-spacing: 0.8px !important;
            line-height: 1.1 !important;
            background: #f5b301 !important;
            background-color: #f5b301 !important;
            color: #000000 !important;
          }

          .schedule-block .signatory-container {
            margin-top: 5px !important;
            padding-top: 2px !important;
            flex-shrink: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .schedule-block .signatory-row {
            gap: 8px !important;
            margin-bottom: 3px !important;
          }
          .schedule-block .signatory-row-mid {
            margin-top: 3px !important;
            margin-bottom: 3px !important;
            gap: 14px !important;
          }
          .schedule-block .signatory-grid {
            gap: 6px !important;
          }
          .schedule-block .signatory-col-right {
            width: 190px !important;
          }
          .schedule-block .signatory-box {
            min-width: 190px !important;
          }
          .schedule-block .signatory-heading {
            font-size: 8.5px !important;
            margin-bottom: 3px !important;
            font-weight: 700 !important;
            color: #000000 !important;
          }
          .schedule-block .signatory-name {
            font-size: 8.5px !important;
            line-height: 1.1 !important;
            font-weight: 800 !important;
            color: #000000 !important;
          }
          .schedule-block .signatory-title {
            font-size: 7.5px !important;
            line-height: 1.05 !important;
            margin-top: 1px !important;
            font-weight: 600 !important;
            color: #222222 !important;
          }
          .schedule-block .signatory-contact-bar {
            margin-top: 4px !important;
            padding-top: 4px !important;
            border-top: 1.2px solid #000 !important;
            font-size: 8px !important;
            line-height: 1.15 !important;
            gap: 8px !important;
          }
        }
      `}</style>
      <div className="turotugma-no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30, fontWeight: 800 }}>
            {viewMode === "substitute" ? "Pinch-Hit & Substitute Finder" : "Time Tables"}
          </h1>
          <div style={{ margin: "8px 0 0", color: "#5b6787", fontSize: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, color: "#1e293b" }}>Schedule Source:</span>
            <select
              value={selectedSourceId}
              onChange={handleSourceChange}
              style={{
                fontSize: 14,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                background: "#fff",
                color: "#1e293b",
                cursor: "pointer",
                maxWidth: 440,
              }}
            >
              {publishedSources.length > 0 && (
                <optgroup label="── Published Official Schedules ──">
                  {publishedSources.map((src) => (
                    <option key={src.id} value={src.id}>
                      [Published] {src.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {draftSources.length > 0 && (
                <optgroup label="── Recently Saved Drafts ──">
                  {draftSources.map((src) => (
                    <option key={src.id} value={src.id}>
                      [Draft] {src.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {scheduleSourceType === "published" ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "#dcfce7", color: "#15803d", fontWeight: 700, fontSize: 12, border: "1px solid #bbf7d0" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
                Published Active (Visible in Public Final Timetables)
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "#fef3c7", color: "#b45309", fontWeight: 700, fontSize: 12, border: "1px solid #fde68a" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                Saved Draft (Internal Admin View Only)
              </span>
            )}
          </div>
          {scheduleData && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#64748b", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span><b>Type:</b> {(scheduleData.scheduleType || "jhs").toUpperCase()}</span>
              <span>•</span>
              <span><b>Sections:</b> {assignedSectionIds.length}</span>
              <span>•</span>
              <span><b>Teachers Deployed:</b> {assignedTeacherIds.length}</span>
              <span>•</span>
              <span><b>Last Stored:</b> {new Date(scheduleData.updatedAt || Date.now()).toLocaleString()}</span>
            </div>
          )}
        </div>
        {!isModal && viewMode !== "substitute" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                padding: "10px 18px",
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Print Schedule
            </button>
            <button
              type="button"
              onClick={handleExport}
              style={{
                padding: "10px 22px",
                background: "#1a3a8c",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Export as PDF
            </button>
          </div>
        )}
      </div>

      {/* Controls Header (Only shown in Time Tables view, hidden in Substitute Finder) */}
      {viewMode !== "substitute" && (
      <div
        className="turotugma-no-print"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          marginTop: 18,
          marginBottom: 16,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <label style={{ color: "#5b6787", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>View</label>
          <select
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value);
              setSelectedSection("all");
              setSelectedTeacher("all");
              setSearchTerm("");
            }}
            style={{
              width: 240,
              fontSize: 15,
              padding: "7px 12px",
              borderRadius: 8,
              border: "1.2px solid #e5eaf4",
              color: "#25326f",
              background: "#f8faff",
              fontWeight: 600,
            }}
          >
            <option value="sections">Classroom Programs (Sections)</option>
            <option value="teachers">Teacher Schedules</option>
          </select>
        </div>

        {viewMode === "sections" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <label style={{ color: "#5b6787", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                style={{
                  width: 180,
                  fontSize: 15,
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1.2px solid #e5eaf4",
                  color: "#25326f",
                  background: "#f8faff",
                  fontWeight: 500,
                }}
              >
                <option value="all">All Sections</option>
                {assignedSectionIds.map((id) => (
                  <option key={id} value={id}>
                    {getSectionName(id)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <label style={{ color: "#5b6787", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>Grade</label>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                style={{
                  width: 120,
                  fontSize: 15,
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1.2px solid #e5eaf4",
                  color: "#25326f",
                  background: "#f8faff",
                  fontWeight: 500,
                }}
              >
                <option value="all">All Grades</option>
                {[7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <label style={{ color: "#5b6787", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>Search Section</label>
              <input
                type="text"
                placeholder="Search by section name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: 200,
                  fontSize: 14,
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1.2px solid #e5eaf4",
                  color: "#25326f",
                  background: "#f8faff",
                  outline: "none",
                }}
              />
            </div>
          </>
        )}

        {viewMode === "teachers" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <label style={{ color: "#5b6787", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>Teacher</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                style={{
                  width: 220,
                  fontSize: 15,
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1.2px solid #e5eaf4",
                  color: "#25326f",
                  background: "#f8faff",
                  fontWeight: 500,
                }}
              >
                <option value="all">All Teachers</option>
                {assignedTeacherIds.map((id) => (
                  <option key={id} value={id}>
                    {getTeacherName(id)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <label style={{ color: "#5b6787", fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>Search Teacher</label>
              <input
                type="text"
                placeholder="Search teacher name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: 200,
                  fontSize: 14,
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1.2px solid #e5eaf4",
                  color: "#25326f",
                  background: "#f8faff",
                  outline: "none",
                }}
              />
            </div>
          </>
        )}
      </div>
      )}

      {/* Classroom Program Layout Container */}
      <div ref={exportSchedulesRef} id="printable-timetables-container" className="printable-timetables-container">
        {viewMode === "sections" &&
          filteredSectionIds.map((sectionId) => {
            const adviserName = getAdviserName(sectionId);
            const sectionName = getSectionName(sectionId);
            const secObj = sectionsById.get(sectionId) || sectionsById.get(String(sectionId));
            const sectionLevel = (secObj?.level === "shs" || Number(secObj?.grade) >= 11 || String(sectionId).toLowerCase().includes("shs") || String(sectionName).toLowerCase().includes("grade 11") || String(sectionName).toLowerCase().includes("grade 12")) ? "shs" : "jhs";

            return (
              <div
                key={sectionId}
                className="schedule-block"
                style={{
                  marginBottom: 40,
                  background: "#fff",
                  borderRadius: 8,
                  boxShadow: "0 2px 12px 0 rgba(0,0,0,0.08)",
                  padding: "28px 24px",
                  border: "1.5px solid #000",
                  maxWidth: 1400,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                {/* DepEd Official Header */}
                <DepEdTopHeader
                  schoolProfile={schoolProfile}
                  title="CLASSROOM PROGRAM"
                  subtitle={sectionName}
                  adviserName={adviserName}
                  isDraft={scheduleSourceType !== "published"}
                  level={sectionLevel}
                />

                {/* DepEd Form Grid Table */}
                <div className="timetable-table-wrap" style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", border: "2px solid #000" }}>
                    <colgroup>
                      {shortenedSessionDays.length > 0 ? (
                        <>
                          <col style={{ width: "11%" }} />
                          <col style={{ width: "11%" }} />
                        </>
                      ) : (
                        <col style={{ width: "16%" }} />
                      )}
                      {days.map((day) => (
                        <col
                          key={day}
                          style={{
                            width: `${(shortenedSessionDays.length > 0 ? 78 : 84) / days.length}%`,
                          }}
                        />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        <th
                          colSpan={shortenedSessionDays.length > 0 ? 2 : 1}
                          style={{
                            border: "1px solid #000",
                            padding: "8px 6px",
                            textAlign: "center",
                            fontWeight: 800,
                            fontSize: 13,
                            color: "#000000",
                            background: "#8fb6e5",
                            backgroundColor: "#8fb6e5",
                            textTransform: "uppercase",
                          }}
                        >
                          TIME
                        </th>
                        {days.map((day) => (
                          <th
                            key={day}
                            rowSpan={2}
                            style={{
                              border: "1px solid #000",
                              padding: "8px 6px",
                              fontWeight: 800,
                              fontSize: 13,
                              color: "#000000",
                              background: "#8fb6e5",
                              backgroundColor: "#8fb6e5",
                              textAlign: "center",
                              verticalAlign: "middle",
                              textTransform: "uppercase",
                            }}
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                      <tr>
                        <th style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: 700, fontSize: 11, color: "#000000", background: "#8fb6e5", backgroundColor: "#8fb6e5", textAlign: "center" }}>
                          {regularSessionInitials || "REGULAR"}
                        </th>
                        {shortenedSessionDays.length > 0 && (
                          <th style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: 700, fontSize: 11, color: "#000000", background: "#8fb6e5", backgroundColor: "#8fb6e5", textAlign: "center" }}>
                            {shortenedSessionInitials || "SHORTENED"}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Flag Raising Row on Monday */}
                      <tr style={{ background: "#fff" }}>
                        <td className="time-cell" style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 700, fontSize: 12, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                          7:00 – 7:30
                        </td>
                        {shortenedSessionDays.length > 0 && (
                          <td className="time-cell" style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 700, fontSize: 12, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                            7:00 – 7:30
                          </td>
                        )}
                        <td
                          colSpan={days.length}
                          className="break-banner"
                          style={{
                            border: "1px solid #000",
                            padding: "8px",
                            background: "#f5b301",
                            color: "#000",
                            fontWeight: 800,
                            fontSize: 13,
                            textAlign: "center",
                            letterSpacing: 1,
                            textTransform: "uppercase",
                          }}
                        >
                          FLAG RAISING CEREMONY (MONDAY)
                        </td>
                      </tr>

                      {/* Main Periods */}
                      {periods.map((periodNum, idx) => {
                        const morningAfter = levelConfig?.breaks?.morning?.enabled !== false ? (levelConfig?.breaks?.morning?.afterPeriod || 2) : -1;
                        const lunchAfter = levelConfig?.breaks?.lunch?.enabled !== false ? (levelConfig?.breaks?.lunch?.afterPeriod || 4) : -1;
                        const isMorningBreak = idx === morningAfter;
                        const isLunchBreak = idx === lunchAfter;

                        const getBreakRange = (timesArr, fallback) => {
                          if (idx > 0 && timesArr[idx - 1] && timesArr[idx]) {
                            const prevParts = String(timesArr[idx - 1]).split(/[–-]/);
                            const currParts = String(timesArr[idx]).split(/[–-]/);
                            const prevEnd = prevParts[1]?.trim();
                            const currStart = currParts[0]?.trim();
                            if (prevEnd && currStart && prevEnd !== currStart) {
                              return `${prevEnd} – ${currStart}`;
                            }
                          }
                          return fallback;
                        };

                        return (
                          <React.Fragment key={periodNum}>
                            {/* Insert Morning Recess Banner if configured */}
                            {isMorningBreak && (
                              <tr>
                                <td className="time-cell" style={{ border: "1px solid #000", padding: "4px 8px", fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                                  {getBreakRange(regularTimes, "9:30 – 9:50")}
                                </td>
                                {shortenedSessionDays.length > 0 && (
                                  <td className="time-cell" style={{ border: "1px solid #000", padding: "4px 8px", fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                                    {getBreakRange(shortenedTimes, "9:15 – 9:35")}
                                  </td>
                                )}
                                <td
                                  colSpan={days.length}
                                  className="break-banner"
                                  style={{
                                    border: "1px solid #000",
                                    padding: "6px",
                                    background: "#f5b301",
                                    color: "#000",
                                    fontWeight: 800,
                                    fontSize: 12,
                                    textAlign: "center",
                                    letterSpacing: 1.5,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  RECESS / MORNING BREAK
                                </td>
                              </tr>
                            )}

                            {/* Insert Lunch Break Banner if configured */}
                            {isLunchBreak && (
                              <tr>
                                <td className="time-cell" style={{ border: "1px solid #000", padding: "4px 8px", fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                                  {getBreakRange(regularTimes, "11:50 – 1:00")}
                                </td>
                                {shortenedSessionDays.length > 0 && (
                                  <td className="time-cell" style={{ border: "1px solid #000", padding: "4px 8px", fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                                    {getBreakRange(shortenedTimes, "11:30 – 12:30")}
                                  </td>
                                )}
                                <td
                                  colSpan={days.length}
                                  className="break-banner"
                                  style={{
                                    border: "1px solid #000",
                                    padding: "6px",
                                    background: "#f5b301",
                                    color: "#000",
                                    fontWeight: 800,
                                    fontSize: 12,
                                    textAlign: "center",
                                    letterSpacing: 1.5,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  LUNCH BREAK
                                </td>
                              </tr>
                            )}

                            {/* Period Row */}
                            <tr>
                              <td className="time-cell" style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 700, fontSize: 12, color: "#000", textAlign: "center", background: "#f8fafc", whiteSpace: "nowrap" }}>
                                {regularTimes[idx]}
                              </td>
                              {shortenedSessionDays.length > 0 && (
                                <td className="time-cell" style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 700, fontSize: 12, color: "#000", textAlign: "center", background: "#f8fafc", whiteSpace: "nowrap" }}>
                                  {shortenedTimes[idx]}
                                </td>
                              )}
                              {days.map((day) => {
                                const assignment = getCellAssignment(sectionId, day, periodNum);
                                return (
                                  <td
                                    key={day}
                                    className="schedule-cell"
                                    style={{
                                      border: "1px solid #000",
                                      padding: "8px 6px",
                                      background: "#fff",
                                      textAlign: "center",
                                      verticalAlign: "middle",
                                      minHeight: 52,
                                    }}
                                  >
                                    {assignment ? (
                                      <div className="schedule-cell-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
                                        <div className="schedule-cell-subject" style={{ fontWeight: 800, fontSize: 13, color: "#000", textTransform: "uppercase", lineHeight: 1.2 }}>
                                          {getSubjectName(assignment.subjectId)}
                                        </div>
                                        {Array.isArray(assignment.breakoutAssignments) && assignment.breakoutAssignments.length > 0 ? (
                                          <div className="schedule-cell-subtext schedule-cell-breakout" style={{ color: "#222", fontSize: 9.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.1, lineHeight: 1.15, display: "flex", flexDirection: "column", gap: 1 }}>
                                            {assignment.breakoutAssignments.map((b, bIdx) => (
                                              <div key={bIdx} style={{ whiteSpace: "nowrap" }}>
                                                <span style={{ fontWeight: 800 }}>{b.stream}:</span> {b.teacherName || getTeacherName(b.teacherId)}
                                              </div>
                                            ))}
                                          </div>
                                        ) : Array.isArray(assignment.coTeacherIds) && assignment.coTeacherIds.length > 0 ? (
                                          <div className="schedule-cell-subtext" style={{ color: "#222", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.2 }}>
                                            {[getTeacherName(assignment.teacherId), ...assignment.coTeacherIds.map((id) => getTeacherName(id))].join(", ")}
                                          </div>
                                        ) : (
                                          <div className="schedule-cell-subtext" style={{ color: "#222", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.2 }}>
                                            {getTeacherName(assignment.teacherId)}
                                          </div>
                                        )}
                                      </div>
                                    ) : null}
                                  </td>
                                );
                              })}
                            </tr>
                          </React.Fragment>
                        );
                      })}

                      {/* Footer Maintenance Banner */}
                      <tr>
                        <td className="time-cell" style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                          END
                        </td>
                        {shortenedSessionDays.length > 0 && (
                          <td className="time-cell" style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                            END
                          </td>
                        )}
                        <td
                          colSpan={days.length}
                          className="break-banner"
                          style={{
                            border: "1px solid #000",
                            padding: "8px",
                            background: "#f5b301",
                            color: "#000",
                            fontWeight: 800,
                            fontSize: 13,
                            textAlign: "center",
                            letterSpacing: 1.5,
                            textTransform: "uppercase",
                          }}
                        >
                          ROOM MAINTENANCE & ZONE IMPROVEMENT
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* DepEd Official Signatories Block */}
                <SignatoryBlock schoolProfile={schoolProfile} sectionId={sectionId} level={sectionLevel} />
              </div>
            );
          })}

        {/* Teacher Schedules View */}
        {viewMode === "teachers" &&
          filteredTeacherIds.map((teacherId) => {
            const teacherName = getTeacherName(teacherId);

            let teacherLevel = "jhs";
            for (const d of days) {
              for (let p = 1; p <= maxPeriods; p++) {
                const cell = getTeacherCellAssignment(teacherId, d, p);
                if (cell && cell.sectionId) {
                  const sObj = sectionsById.get(cell.sectionId) || sectionsById.get(String(cell.sectionId));
                  if (sObj?.level === "shs" || Number(sObj?.grade) >= 11 || String(cell.sectionId).toLowerCase().includes("shs")) {
                    teacherLevel = "shs";
                    break;
                  }
                }
              }
              if (teacherLevel === "shs") break;
            }

            return (
              <div
                key={teacherId}
                className="schedule-block"
                style={{
                  marginBottom: 40,
                  background: "#fff",
                  borderRadius: 8,
                  boxShadow: "0 2px 12px 0 rgba(0,0,0,0.08)",
                  padding: "28px 24px",
                  border: "1.5px solid #000",
                  maxWidth: 1400,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <div
                  className="turotugma-no-print"
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (onClose) onClose();
                      const params = new URLSearchParams();
                      params.set("tab", "substitute-finder");
                      params.set("teacherId", String(teacherId));
                      if (selectedSourceId) {
                        params.set("sourceId", String(selectedSourceId));
                      }
                      const targetUrl = `/dashboard?${params.toString()}`;
                      window.history.pushState({ tab: "substitute-finder" }, "", targetUrl);
                      window.dispatchEvent(new PopStateEvent("popstate"));
                    }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: "1px solid #bfdbfe",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Find Pinch-Hit / Substitute for {teacherName} →
                  </button>
                </div>

                {/* DepEd Official Header */}
                <DepEdTopHeader
                  schoolProfile={schoolProfile}
                  title="TEACHER CLASS PROGRAM"
                  subtitle={`TEACHER: ${teacherName}`}
                  isDraft={scheduleSourceType !== "published"}
                  level={teacherLevel}
                />

                <div className="timetable-table-wrap" style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", border: "2px solid #000" }}>
                    <colgroup>
                      {shortenedSessionDays.length > 0 ? (
                        <>
                          <col style={{ width: "11%" }} />
                          <col style={{ width: "11%" }} />
                        </>
                      ) : (
                        <col style={{ width: "16%" }} />
                      )}
                      {days.map((day) => (
                        <col
                          key={day}
                          style={{
                            width: `${(shortenedSessionDays.length > 0 ? 78 : 84) / days.length}%`,
                          }}
                        />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        <th
                          colSpan={shortenedSessionDays.length > 0 ? 2 : 1}
                          style={{
                            border: "1px solid #000",
                            padding: "8px 6px",
                            textAlign: "center",
                            fontWeight: 800,
                            fontSize: 13,
                            color: "#000000",
                            background: "#8fb6e5",
                            backgroundColor: "#8fb6e5",
                            textTransform: "uppercase",
                          }}
                        >
                          TIME
                        </th>
                        {days.map((day) => (
                          <th
                            key={day}
                            rowSpan={2}
                            style={{
                              border: "1px solid #000",
                              padding: "8px 6px",
                              fontWeight: 800,
                              fontSize: 13,
                              color: "#000000",
                              background: "#8fb6e5",
                              backgroundColor: "#8fb6e5",
                              textAlign: "center",
                              verticalAlign: "middle",
                              textTransform: "uppercase",
                            }}
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                      <tr>
                        <th style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: 700, fontSize: 11, color: "#000000", background: "#8fb6e5", backgroundColor: "#8fb6e5", textAlign: "center" }}>
                          {regularSessionInitials || "REGULAR"}
                        </th>
                        {shortenedSessionDays.length > 0 && (
                          <th style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: 700, fontSize: 11, color: "#000000", background: "#8fb6e5", backgroundColor: "#8fb6e5", textAlign: "center" }}>
                            {shortenedSessionInitials || "SHORTENED"}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((periodNum, idx) => (
                        <tr key={periodNum}>
                          <td className="time-cell" style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 700, fontSize: 12, color: "#000", textAlign: "center", background: "#f8fafc", whiteSpace: "nowrap" }}>
                            {regularTimes[idx]}
                          </td>
                          {shortenedSessionDays.length > 0 && (
                            <td className="time-cell" style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 700, fontSize: 12, color: "#000", textAlign: "center", background: "#f8fafc", whiteSpace: "nowrap" }}>
                              {shortenedTimes[idx]}
                            </td>
                          )}
                          {days.map((day) => {
                            const found = getTeacherCellAssignment(teacherId, day, periodNum);
                            return (
                              <td
                                key={day}
                                className="schedule-cell"
                                style={{
                                  border: "1px solid #000",
                                  padding: "8px 6px",
                                  background: "#fff",
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                  minHeight: 52,
                                }}
                              >
                                {found ? (
                                  <div className="schedule-cell-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
                                    <div className="schedule-cell-subject" style={{ fontWeight: 800, fontSize: 13, color: "#000", textTransform: "uppercase", lineHeight: 1.2 }}>
                                      {getSubjectName(found.assignment.subjectId)}
                                      {found.streamName ? ` (${found.streamName})` : ""}
                                    </div>
                                    <div className="schedule-cell-subtext" style={{ color: "#222", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.2 }}>
                                      {getSectionName(found.sectionId)}
                                    </div>
                                  </div>
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* DepEd Official Signatories Block */}
                <SignatoryBlock schoolProfile={schoolProfile} level={teacherLevel} />
              </div>
            );
          })}

        {viewMode === "substitute" && (
          <SubstituteFinder
            days={days}
            periods={periods}
            regularTimes={regularTimes}
            shortenedTimes={shortenedTimes}
            shortenedSessionDays={shortenedSessionDays}
            teachers={teachers}
            teachersById={teachersById}
            sectionsById={sectionsById}
            subjectsById={subjectsById}
            assignedTeacherIds={assignedTeacherIds}
            getTeacherCellAssignment={getTeacherCellAssignment}
            getSectionName={getSectionName}
            getSubjectName={getSubjectName}
            getTeacherName={getTeacherName}
            initialTeacherId={pinchHitTeacherId}
            scheduleSourceLabel={scheduleData?.name || ""}
            schoolProfile={schoolProfile}
            scheduleType={scheduleType}
          />
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: 16,
        }}
        className="turotugma-preview-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <div
          className="turotugma-preview-modal"
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 16,
            width: 1380,
            maxWidth: "98vw",
            maxHeight: "95vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
            overflow: "hidden",
          }}
        >
          {/* Modal Header */}
          <div
            className="turotugma-no-print"
            style={{
              padding: "14px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f8fafc",
              gap: 16,
            }}
          >
            <div>
              <h2 style={{ margin: 0, color: "#1e293b", fontSize: 18, fontWeight: 700 }}>
                {modalTitle || `Draft Timetable Preview: ${scheduleData?.name || "Saved Draft"}`}
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>
                Official DepEd Layout • Saved: {scheduleData?.updatedAt ? new Date(scheduleData.updatedAt).toLocaleString() : "Recently"}
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  background: "#059669",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Print Schedule
              </button>

              <button
                type="button"
                onClick={handleExport}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  background: "#1a3a8c",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Export PDF
              </button>

              {onLoadDraft && scheduleData?.id && (
                <button
                  type="button"
                  onClick={() => onLoadDraft(scheduleData.id)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    background: "#1e40af",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Load Draft
                </button>
              )}

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              )}
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="turotugma-preview-body" style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "#f8fafc" }}>
            {mainContent}
          </div>
        </div>
      </div>
    );
  }

  return mainContent;
}
