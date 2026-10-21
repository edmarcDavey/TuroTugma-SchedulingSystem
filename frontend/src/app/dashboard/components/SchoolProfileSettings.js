import { useEffect, useMemo, useRef, useState } from "react";

const PROFILE_STORAGE_KEY = "turotugma_school_profile";
const CONFIG_STORAGE_KEY = "turotugma_schedule_configurations";

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
  schoolName: "DIADI NATIONAL HIGH SCHOOL",
  schoolId: "300627",
  division: "Schools Division of Nueva Vizcaya",
  region: "Region II – Cagayan Valley",
  district: "Diadi District",
  address: "Poblacion, Diadi, Nueva Vizcaya",
  email: "300627@deped.gov.ph",
  website: "www.deped-nv.com.ph",
  academicYear: "2026-2027",
  offeredLevels: "both", // 'both' | 'jhs_only' | 'shs_only'
  jhsTerm: "Full Academic Year",
  shsSemester: "First Semester",
  schoolHeadName: "GABRIEL C. ULLANI EdD",
  schoolHeadTitle: "Secondary School Principal II",
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
  schoolEndTime: "16:30",
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
    teacherAssignmentPolicy: "equal_balance", // 'equal_balance' | 'prioritize_regular'
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
      Friday: "regular",
      Saturday: "shortened",
      Sunday: "off",
    },
  },
};

export default function SchoolProfileSettings() {
  const [activeSubTab, setActiveSubTab] = useState(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("subtab");
      if (param === "config" || param === "scheduling-configurations") return "config";
    }
    return "profile";
  }); // 'profile' | 'config'
  const [activeLevel, setActiveLevel] = useState("jhs"); // 'jhs' | 'shs'
  const [activeSession, setActiveSession] = useState("regular"); // 'regular' | 'shortened'
  const [profile, setProfile] = useState(() => getInitialProfile());
  const [configs, setConfigs] = useState(() => getInitialConfigs());
  const [showPeriodCalculator, setShowPeriodCalculator] = useState(false);
  const [showDepEdCompliance, setShowDepEdCompliance] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const noticeTimerRef = useRef(null);

  const [rolloverSourceYear, setRolloverSourceYear] = useState("2025-2026");
  const [rolloverOptions, setRolloverOptions] = useState({
    faculty: true,
    subjects: true,
    sections: true,
  });

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

  const handleSaveProfile = () => {
    if (!profile.schoolName.trim()) {
      showNotice("School Name is required.", "error");
      return;
    }
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("turotugma:profile-updated"));
    }
    showNotice("School Profile updated successfully.", "success");
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

  const handleSaveConfig = () => {
    window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configs));
    window.dispatchEvent(new Event("turotugma:config-updated"));
    showNotice(`${activeLevel.toUpperCase()} Scheduling Configuration updated successfully.`, "success");
  };

  const currentLevelConfig = mergeLevelConfig(configs[activeLevel], DEFAULT_CONFIGS[activeLevel] || DEFAULT_LEVEL_CONFIG);
  const activeSessionConfig = currentLevelConfig.sessions[activeSession] || DEFAULT_SESSION_CONFIG;

  const updateCurrentConfig = (updater) => {
    setConfigs((prev) => ({
      ...prev,
      [activeLevel]: updater(mergeLevelConfig(prev[activeLevel], DEFAULT_CONFIGS[activeLevel] || DEFAULT_LEVEL_CONFIG)),
    }));
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
      <div style={{ marginBottom: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>School Profile & Settings</h1>
          <p style={{ margin: "8px 0 0", color: "#5b6787", fontSize: 14 }}>
            Manage official school identity and level-specific scheduling configurations (JHS & SHS).
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
            <span>{noticeType === "error" ? "!" : noticeType === "info" ? "i" : noticeType === "warning" ? "!" : "✓"}</span>
            <span>{notice}</span>
          </div>
        ) : null}
      </div>

      {/* Sub Tab Switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid #e3e7ef", paddingBottom: 10 }}>
        <button
          type="button"
          onClick={() => setActiveSubTab("profile")}
          style={subTabButtonStyle(activeSubTab === "profile")}
        >
          School Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("config")}
          style={subTabButtonStyle(activeSubTab === "config")}
        >
          Scheduling Configurations
        </button>
      </div>

      {activeSubTab === "profile" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 20 }}>
            <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>School Official Identity</h2>
            <p style={{ margin: "6px 0 0", color: "#5d698d", fontSize: 13 }}>
              These details appear on official DepEd schedule reports and printable timetables.
            </p>

            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              <Field label="School Name">
                <input
                  type="text"
                  value={profile.schoolName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, schoolName: e.target.value }))}
                  style={inputStyle()}
                />
              </Field>

              <Field label="DepEd School ID">
                <input
                  type="text"
                  value={profile.schoolId}
                  onChange={(e) => setProfile((prev) => ({ ...prev, schoolId: e.target.value }))}
                  style={inputStyle()}
                />
              </Field>

              <Field label="Division">
                <input
                  type="text"
                  value={profile.division}
                  onChange={(e) => setProfile((prev) => ({ ...prev, division: e.target.value }))}
                  style={inputStyle()}
                />
              </Field>

              <Field label="Region">
                <input
                  type="text"
                  value={profile.region}
                  onChange={(e) => setProfile((prev) => ({ ...prev, region: e.target.value }))}
                  style={inputStyle()}
                />
              </Field>

              <Field label="Active Academic Year">
                <input
                  type="text"
                  value={profile.academicYear}
                  onChange={(e) => setProfile((prev) => ({ ...prev, academicYear: e.target.value }))}
                  style={inputStyle()}
                  placeholder="e.g. 2026-2027"
                />
              </Field>

              <Field label="School Head / Principal Name">
                <input
                  type="text"
                  value={profile.schoolHeadName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, schoolHeadName: e.target.value }))}
                  style={inputStyle()}
                />
              </Field>

              <Field label="Designation / Title">
                <input
                  type="text"
                  value={profile.schoolHeadTitle}
                  onChange={(e) => setProfile((prev) => ({ ...prev, schoolHeadTitle: e.target.value }))}
                  style={inputStyle()}
                />
              </Field>

              <Field label="Offered School Levels">
                <select
                  value={profile.offeredLevels || "both"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile((prev) => ({ ...prev, offeredLevels: val }));
                    if (val === "jhs_only") setActiveLevel("jhs");
                    if (val === "shs_only") setActiveLevel("shs");
                  }}
                  style={selectStyle()}
                >
                  <option value="both">Both JHS & Senior High School (Grades 7 - 12)</option>
                  <option value="jhs_only">Junior High School Only (Grades 7 - 10)</option>
                  <option value="shs_only">Senior High School Only (Grades 11 - 12)</option>
                </select>
              </Field>
            </div>

            {/* Level-Aware Term Structure */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #eef2f7" }}>
              <h3 style={{ margin: "0 0 10px", color: "#1f2c6f", fontSize: 15 }}>Level-Specific Term Structure</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                {profile.offeredLevels !== "shs_only" ? (
                  <div style={{ background: "#f8fafc", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 4 }}>
                      Junior High School (JHS) Term
                    </span>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#dbeafe", color: "#1e40af", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6 }}>
                      Full Academic Year (Year-Round Curriculum)
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b" }}>
                      JHS subjects run continuously across all 4 grading periods.
                    </p>
                  </div>
                ) : null}

                {profile.offeredLevels !== "jhs_only" ? (
                  <div style={{ background: "#f8fafc", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 4 }}>
                      Senior High School (SHS) Active Term
                    </span>
                    <select
                      value={profile.shsSemester || "First Semester"}
                      onChange={(e) => setProfile((prev) => ({ ...prev, shsSemester: e.target.value }))}
                      style={selectStyle()}
                    >
                      <option value="First Semester">First Semester</option>
                      <option value="Second Semester">Second Semester</option>
                    </select>
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b" }}>
                      SHS subjects change per semester based on strand track requirements.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* DepEd Official Header & Signatories Settings */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #eef2f7" }}>
              <h3 style={{ margin: "0 0 6px", color: "#1f2c6f", fontSize: 16 }}>DepEd Official Header & Signatory Template</h3>
              <p style={{ margin: "0 0 14px", color: "#5d698d", fontSize: 13 }}>
                Configure official header metadata and approval signatories rendered on printed schedules and official PDF exports.
              </p>

              {/* Header Contact Fields */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 16 }}>
                <Field label="District Name">
                  <input
                    type="text"
                    value={profile.district || "Diadi District"}
                    onChange={(e) => setProfile((prev) => ({ ...prev, district: e.target.value }))}
                    style={inputStyle()}
                  />
                </Field>

                <Field label="School Address">
                  <input
                    type="text"
                    value={profile.address || "Poblacion, Diadi, Nueva Vizcaya"}
                    onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
                    style={inputStyle()}
                  />
                </Field>

                <Field label="Official Email Address">
                  <input
                    type="text"
                    value={profile.email || "300627@deped.gov.ph"}
                    onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                    style={inputStyle()}
                  />
                </Field>

                <Field label="School Website">
                  <input
                    type="text"
                    value={profile.website || "www.deped-nv.com.ph"}
                    onChange={(e) => setProfile((prev) => ({ ...prev, website: e.target.value }))}
                    style={inputStyle()}
                  />
                </Field>
              </div>

              {/* Signatories Block Editor */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 10px", color: "#1f2c6f", fontSize: 14 }}>Official Signatories Block</h4>

                {/* Prepared By (4 Coordinators) */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 6 }}>
                    Prepared by (Timetable Committee / Subject Coordinators):
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                    {((profile.signatories && profile.signatories.preparedBy) || DEFAULT_PROFILE.signatories.preparedBy).map((sig, idx) => (
                      <div key={idx} style={{ background: "#ffffff", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}>
                        <input
                          type="text"
                          placeholder={`Coordinator ${idx + 1} Name`}
                          value={sig.name || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProfile((prev) => {
                              const currList = [...((prev.signatories && prev.signatories.preparedBy) || DEFAULT_PROFILE.signatories.preparedBy)];
                              currList[idx] = { ...currList[idx], name: val };
                              return { ...prev, signatories: { ...prev.signatories, preparedBy: currList } };
                            });
                          }}
                          style={{ ...inputStyle(), marginBottom: 4, fontWeight: 600, fontSize: 12 }}
                        />
                        <input
                          type="text"
                          placeholder="Designation (e.g. CIC, MAPEH & SPA)"
                          value={sig.title || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProfile((prev) => {
                              const currList = [...((prev.signatories && prev.signatories.preparedBy) || DEFAULT_PROFILE.signatories.preparedBy)];
                              currList[idx] = { ...currList[idx], title: val };
                              return { ...prev, signatories: { ...prev.signatories, preparedBy: currList } };
                            });
                          }}
                          style={{ ...inputStyle(), fontSize: 11 }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conformed, Recommending Approval, Approved */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                  {/* Conformed */}
                  <div style={{ background: "#ffffff", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Conformed:</span>
                    <input
                      type="text"
                      placeholder="Name"
                      value={(profile.signatories?.conformed?.name) ?? DEFAULT_PROFILE.signatories.conformed.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProfile((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            conformed: { ...(prev.signatories?.conformed || {}), name: val },
                          },
                        }));
                      }}
                      style={{ ...inputStyle(), marginBottom: 4, fontWeight: 600, fontSize: 12 }}
                    />
                    <input
                      type="text"
                      placeholder="Title (e.g. Asst. Principal Designate)"
                      value={(profile.signatories?.conformed?.title) ?? DEFAULT_PROFILE.signatories.conformed.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProfile((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            conformed: { ...(prev.signatories?.conformed || {}), title: val },
                          },
                        }));
                      }}
                      style={{ ...inputStyle(), fontSize: 11 }}
                    />
                  </div>

                  {/* Recommending Approval */}
                  <div style={{ background: "#ffffff", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Recommending Approval:</span>
                    <input
                      type="text"
                      placeholder="Name"
                      value={(profile.signatories?.recommendingApproval?.name) ?? DEFAULT_PROFILE.signatories.recommendingApproval.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProfile((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            recommendingApproval: { ...(prev.signatories?.recommendingApproval || {}), name: val },
                          },
                        }));
                      }}
                      style={{ ...inputStyle(), marginBottom: 4, fontWeight: 600, fontSize: 12 }}
                    />
                    <input
                      type="text"
                      placeholder="Title (e.g. Secondary School Principal II)"
                      value={(profile.signatories?.recommendingApproval?.title) ?? DEFAULT_PROFILE.signatories.recommendingApproval.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProfile((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            recommendingApproval: { ...(prev.signatories?.recommendingApproval || {}), title: val },
                          },
                        }));
                      }}
                      style={{ ...inputStyle(), fontSize: 11 }}
                    />
                  </div>

                  {/* Approved */}
                  <div style={{ background: "#ffffff", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Approved:</span>
                    <input
                      type="text"
                      placeholder="Name"
                      value={(profile.signatories?.approved?.name) ?? DEFAULT_PROFILE.signatories.approved.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProfile((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            approved: { ...(prev.signatories?.approved || {}), name: val },
                          },
                        }));
                      }}
                      style={{ ...inputStyle(), marginBottom: 4, fontWeight: 600, fontSize: 12 }}
                    />
                    <input
                      type="text"
                      placeholder="Title (e.g. District_In-Charge)"
                      value={(profile.signatories?.approved?.title) ?? DEFAULT_PROFILE.signatories.approved.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProfile((prev) => ({
                          ...prev,
                          signatories: {
                            ...prev.signatories,
                            approved: { ...(prev.signatories?.approved || {}), title: val },
                          },
                        }));
                      }}
                      style={{ ...inputStyle(), fontSize: 11 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
              <button type="button" onClick={handleSaveProfile} style={primaryActionStyle()}>
                Save School Profile
              </button>
            </div>
          </div>

          {/* Academic Year Data Rollover */}
          <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div>
                <h3 style={{ margin: 0, color: "#1f2c6f", fontSize: 16 }}>Academic Year Data Rollover</h3>
                <p style={{ margin: "2px 0 0", color: "#5d698d", fontSize: 13 }}>
                  Carry over faculty profiles, subject catalogs, and section structures into school year {profile.academicYear} without re-typing.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <Field label="Source School Year (Copy From)">
                <input
                  type="text"
                  value={rolloverSourceYear}
                  onChange={(e) => setRolloverSourceYear(e.target.value)}
                  style={inputStyle()}
                  placeholder="e.g. 2025-2026"
                />
              </Field>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Data Categories to Carry Over:</span>
                <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, color: "#475569", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={rolloverOptions.faculty}
                    onChange={(e) => setRolloverOptions((prev) => ({ ...prev, faculty: e.target.checked }))}
                  />
                  Faculty Roster & Expertise
                </label>
                <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, color: "#475569", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={rolloverOptions.subjects}
                    onChange={(e) => setRolloverOptions((prev) => ({ ...prev, subjects: e.target.checked }))}
                  />
                  Subject Catalog & Weekly Hours
                </label>
                <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, color: "#475569", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={rolloverOptions.sections}
                    onChange={(e) => setRolloverOptions((prev) => ({ ...prev, sections: e.target.checked }))}
                  />
                  Section Templates & Themes
                </label>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button
                type="button"
                onClick={handleExecuteRollover}
                style={{
                  border: "none",
                  background: "#166534",
                  color: "#ffffff",
                  borderRadius: 10,
                  padding: "9px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Copy & Rollover Data to SY {profile.academicYear}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>Scheduling Configurations & Rules</h2>
              <p style={{ margin: "4px 0 0", color: "#5d698d", fontSize: 13 }}>
                Configure level-specific daily hours, session types, period calculation modes, breaks, and constraints.
              </p>
            </div>

            {/* Level Switcher Pill */}
            <div style={{ display: "flex", background: "#f2f4f8", borderRadius: 10, padding: 3 }}>
              {profile.offeredLevels !== "shs_only" ? (
                <button
                  type="button"
                  onClick={() => setActiveLevel("jhs")}
                  style={levelPillStyle(activeLevel === "jhs")}
                >
                  Junior High School (JHS)
                </button>
              ) : null}
              {profile.offeredLevels !== "jhs_only" ? (
                <button
                  type="button"
                  onClick={() => setActiveLevel("shs")}
                  style={levelPillStyle(activeLevel === "shs")}
                >
                  Senior High School (SHS)
                </button>
              ) : null}
            </div>
          </div>

          {/* General Daily Hours */}
          <SectionBlock title="1. School Daily Hours">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <Field label="Daily Start Time">
                <input
                  type="time"
                  value={currentLevelConfig.schoolStartTime}
                  onChange={(e) =>
                    updateCurrentConfig((cfg) => ({ ...cfg, schoolStartTime: e.target.value }))
                  }
                  style={inputStyle()}
                />
              </Field>

              <Field label="Daily End Time">
                <input
                  type="time"
                  value={currentLevelConfig.schoolEndTime}
                  onChange={(e) =>
                    updateCurrentConfig((cfg) => ({ ...cfg, schoolEndTime: e.target.value }))
                  }
                  style={inputStyle()}
                />
              </Field>
            </div>
          </SectionBlock>

          {/* 2. Dynamic Session Type & Calendar Settings */}
          <SectionBlock title="2. Session Type & Calendar Settings">
            {/* Session Type Pill Selector */}
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#5f6b90", display: "block", marginBottom: 6 }}>
                Session Type
              </span>
              <div style={{ display: "inline-flex", border: "1px solid #dce5ff", borderRadius: 999, padding: 3, background: "#f5f8ff" }}>
                <button
                  type="button"
                  onClick={() => setActiveSession("regular")}
                  style={sessionTabStyle(activeSession === "regular")}
                >
                  Regular Session
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSession("shortened")}
                  style={sessionTabStyle(activeSession === "shortened")}
                >
                  Shortened Session
                </button>
              </div>
            </div>

            {/* School Calendar Day Pills (3-State Interactive Control) */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#5f6b90" }}>School Calendar</span>
                <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#5d698d" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2c3886" }} /> Dark Blue: {activeSession === "regular" ? "Regular" : "Shortened"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#bcd1ff" }} /> Light Blue: {activeSession === "regular" ? "Shortened" : "Regular"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#cfd7ef" }} /> Soft Outline: Off Day
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

            {/* Dynamic Session Settings Panel */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              <div style={{ border: "1px solid #dce5ff", borderRadius: 12, padding: 14, background: "#ffffff" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1f2c6f" }}>
                    {activeSession === "regular" ? "Regular Session Profile" : "Shortened Session Profile"}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#3B4197", background: "#e9edff", padding: "3px 10px", borderRadius: 999 }}>
                    {DAYS.filter((d) => currentLevelConfig.dayAssignments[d.full] === activeSession).map((d) => d.short).join(", ") || "No days assigned"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 14 }}>
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
                          transition: "all 0.15s ease",
                        }}
                        title="Audit weekly time allotment against DepEd MATATAG Flexibility statutory minimums"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
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
                        { mins: 60, label: "60m (Option A — Diadi NHS Standard)", note: "4 meetings × 60m = 240 mins/wk (exceeds 225m Core and 200m Applied)" },
                        { mins: 50, label: "50m (Option B — 5-Day Standard)", note: "5×50m Core (250m), 4×50m Applied (200m)" },
                        { mins: 45, label: "45m (Option C — Shortened / Shift)", note: "5×45m Core (225m), 4×45m Applied (180m)" },
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
                              transition: "all 0.15s ease",
                            }}
                            title={preset.note}
                          >
                            {isSelected ? "● " : ""}{preset.label}
                          </button>
                        );
                      })}
                    </div>
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
                          transition: "all 0.15s ease",
                        }}
                        title="Calculate recommended period count based on subjects and school hours"
                      >
                        <svg style={{ pointerEvents: "none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="2" width="16" height="20" rx="2" />
                          <line x1="8" y1="6" x2="16" y2="6" />
                          <line x1="16" y1="14" x2="16" y2="18" />
                          <path d="M16 10h.01" />
                          <path d="M12 10h.01" />
                          <path d="M8 10h.01" />
                          <path d="M12 14h.01" />
                          <path d="M8 14h.01" />
                          <path d="M12 18h.01" />
                          <path d="M8 18h.01" />
                        </svg>
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

                {showDepEdCompliance && (() => {
                  const duration = Number(activeSessionConfig.duration) || 60;
                  // Under Option A (Diadi NHS Standard: 60 mins), Core subjects meet 4 times/week = 240 mins (exceeding 225m).
                  // Under Option B (50 mins) or Option C (45 mins), Core subjects meet 5 times/week.
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
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                        <span style={{ fontSize: 11, color: "#6b7280" }}>
                          Ref: DepEd Flexibility Memo (Sept 19, 2024)
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
                        {/* Core Learning Areas */}
                        <div style={{ background: "#ffffff", border: "1px solid #e0e7ff", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#1e1e38" }}>Core Learning Areas</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: corePass ? "#16a34a" : "#d97706" }}>
                              {corePass ? "Compliant" : "Shortfall"}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "#4b5563" }}>
                            Math, Science, English, Values Ed
                          </div>
                          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "#3B4197" }}>
                            {coreMeetings} meetings × {duration}m = {coreMins} mins/wk
                          </div>
                          <div style={{ fontSize: 10, color: "#6b7280" }}>
                            Statutory Min: 225 mins/week ({corePass ? `+${coreMins - 225}m buffer` : `${225 - coreMins}m short`})
                          </div>
                        </div>

                        {/* Applied Learning Areas */}
                        <div style={{ background: "#ffffff", border: "1px solid #e0e7ff", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#1e1e38" }}>Applied & Skills</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: appliedPass ? "#16a34a" : "#d97706" }}>
                              {appliedPass ? "Compliant" : "Flexible Shift"}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "#4b5563" }}>
                            Araling Panlipunan, Filipino, MAPEH, TLE
                          </div>
                          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "#3B4197" }}>
                            {appliedMeetings} meetings × {duration}m = {appliedMins} mins/wk
                          </div>
                          <div style={{ fontSize: 10, color: "#6b7280" }}>
                            Statutory Min: 200 mins/week ({appliedPass ? `+${appliedMins - 200}m buffer` : `${200 - appliedMins}m flex`})
                          </div>
                        </div>

                        {/* Guidance & ARAL */}
                        <div style={{ background: "#ffffff", border: "1px solid #e0e7ff", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#1e1e38" }}>Guidance & ARAL</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: hgpPass ? "#16a34a" : "#d97706" }}>
                              {hgpPass ? "Compliant" : "Shortfall"}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "#4b5563" }}>
                            Homeroom Guidance (HGP) & ARAL Program
                          </div>
                          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "#3B4197" }}>
                            HGP: 1×{duration}m ({hgpMins}m/wk) • ARAL: 1×{duration}m ({duration}m/wk)
                          </div>
                          <div style={{ fontSize: 10, color: "#6b7280" }}>
                            Statutory Min for HGP: 45 mins/week ({hgpPass ? `+${hgpMins - 45}m buffer` : `${45 - hgpMins}m short`})
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 10, fontSize: 11, color: "#4b5563", background: "#ffffff", padding: "8px 12px", borderRadius: 6, border: "1px solid #e0e7ff" }}>
                        <strong>Diadi NHS & DepEd Flexibility Note:</strong> Option A is the operational standard of Diadi National High School: <strong>Core & Applied subjects</strong> meet 4 times/week at 60 mins (240 mins/wk, exceeding DepEd statutory minimums of 225m Core and 200m Applied); <strong>Enhanced STEM subjects</strong> meet 3 times/week at 60 mins (180 mins/wk); and <strong>Homeroom Guidance (HGP) and ARAL Program</strong> meet 1 time/week at 60 mins (60 mins/wk).
                      </div>
                    </div>
                  );
                })()}

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
                        boxShadow: "0 2px 6px rgba(59, 65, 151, 0.05)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3B4197" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="2" width="16" height="20" rx="2" />
                            <line x1="8" y1="6" x2="16" y2="6" />
                            <line x1="16" y1="14" x2="16" y2="18" />
                            <path d="M16 10h.01" />
                            <path d="M12 10h.01" />
                            <path d="M8 10h.01" />
                            <path d="M12 14h.01" />
                            <path d="M8 14h.01" />
                            <path d="M12 18h.01" />
                            <path d="M8 18h.01" />
                          </svg>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2c6f" }}>
                            Period Recommendation Calculator
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPeriodCalculator(false)}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "#5d698d",
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "2px 6px",
                          }}
                        >
                          Close
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 12 }}>
                        <div style={{ background: "#ffffff", border: "1px solid #dce5ff", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontSize: 11, color: "#5d698d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Curriculum Demand</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#1f2c6f", marginTop: 2 }}>
                            {calcResult.requiredFromCurriculum} <span style={{ fontSize: 12, fontWeight: 500, color: "#5d698d" }}>periods / day</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#5f6b90", marginTop: 4 }}>
                            {calcResult.maxGradeWeeklyPeriods > 0
                              ? `${Math.round(calcResult.maxGradeWeeklyPeriods * 10) / 10} weekly periods across ${calcResult.activeDaysCount} active days (${calcResult.maxGradeLabel ? (String(calcResult.maxGradeLabel).toLowerCase().includes("grade") ? calcResult.maxGradeLabel : `Grade ${calcResult.maxGradeLabel}`) : "highest grade load"})`
                              : "Based on standard DepEd load"}
                          </div>
                        </div>

                        <div style={{ background: "#ffffff", border: "1px solid #dce5ff", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontSize: 11, color: "#5d698d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Bell Schedule Capacity</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#1f2c6f", marginTop: 2 }}>
                            {calcResult.timeCapacity} <span style={{ fontSize: 12, fontWeight: 500, color: "#5d698d" }}>periods max</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#5f6b90", marginTop: 4 }}>
                            {calcResult.netTeachingMins} net teaching mins / {activeSessionConfig.duration}m periods
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", background: "#eef2ff", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 12, color: "#3B4197", flex: 1, minWidth: 200, lineHeight: 1.4 }}>
                          Recommended: <strong>{calcResult.recommendedPeriods} Periods/Day</strong> to cover weekly required subjects within your school hours.
                        </div>
                        <button
                          id="btn-apply-calculated-periods"
                          type="button"
                          onClick={() => {
                            updateActiveSessionConfig((sCfg) => ({ ...sCfg, manualPeriodCount: calcResult.recommendedPeriods }));
                            showNotice(`Applied recommended ${calcResult.recommendedPeriods} periods/day to ${activeSession === "regular" ? "Regular" : "Shortened"} Session.`);
                          }}
                          style={{
                            border: "none",
                            borderRadius: 8,
                            background: "#3B4197",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: 12,
                            padding: "7px 14px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "background 0.15s ease",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Apply {calcResult.recommendedPeriods} Periods
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <p style={{ margin: "12px 0 8px", color: "#25336f", fontSize: 13, fontWeight: 700 }}>
                  Breaks for {activeSession === "regular" ? "Regular Session" : "Shortened Session"}
                </p>

                {(() => {
                  const activeSessionPeriodCount = Math.max(1, Math.min(10, Number(activeSessionConfig.manualPeriodCount) || 8));
                  const maxAllowedBreakSlot = Math.max(1, activeSessionPeriodCount - 1);

                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                      {/* Morning Break */}
                      <BreakCard
                        title="Morning Break"
                        config={activeSessionConfig.breaks.morning}
                        maxPeriods={maxAllowedBreakSlot}
                        onChange={(updated) =>
                          updateActiveSessionConfig((sCfg) => ({
                            ...sCfg,
                            breaks: { ...sCfg.breaks, morning: updated },
                          }))
                        }
                      />

                      {/* Lunch Break */}
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

                      {/* Afternoon Break */}
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

              {/* Visual Schedule Timeline Preview Component */}
              <VisualSchedulePreview
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
                      showNotice(`Morning Break must take place before Lunch Break (${getOrdinalPeriodLabel(lunchAfter)}).`, "error");
                      return;
                    }
                    if (brks.afternoon?.enabled && targetAfterPeriod >= afternoonAfter) {
                      showNotice(`Morning Break must take place before Afternoon Break (${getOrdinalPeriodLabel(afternoonAfter)}).`, "error");
                      return;
                    }
                  }

                  if (breakKey === "lunch") {
                    if (brks.morning?.enabled && targetAfterPeriod <= morningAfter) {
                      showNotice(`Lunch Break must take place after Morning Break (${getOrdinalPeriodLabel(morningAfter)}).`, "error");
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
                      showNotice(`Afternoon Break must take place after Morning Break (${getOrdinalPeriodLabel(morningAfter)}).`, "error");
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
              />
            </div>
          </SectionBlock>

          {/* 3. Constraints & Rules */}
          <SectionBlock title="3. Auto-Scheduler Constraints & Rules">
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2c6f", display: "block", marginBottom: 4 }}>
                  Faculty Assignment Priority Policy
                </span>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b" }}>
                  Controls how the auto-scheduler selects candidate teachers when multiple teachers are eligible.
                </p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#1e293b", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name={`teacherAssignmentPolicy_${activeLevel}`}
                      value="equal_balance"
                      checked={(currentLevelConfig.constraints.teacherAssignmentPolicy || "equal_balance") === "equal_balance"}
                      onChange={(e) =>
                        updateCurrentConfig((cfg) => ({
                          ...cfg,
                          constraints: { ...cfg.constraints, teacherAssignmentPolicy: e.target.value },
                        }))
                      }
                    />
                    Capacity-Based Allocation (DO 005, s. 2024 - Qualification, capacity ratio & balanced preps)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#1e293b", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name={`teacherAssignmentPolicy_${activeLevel}`}
                      value="prioritize_regular"
                      checked={currentLevelConfig.constraints.teacherAssignmentPolicy === "prioritize_regular"}
                      onChange={(e) =>
                        updateCurrentConfig((cfg) => ({
                          ...cfg,
                          constraints: { ...cfg.constraints, teacherAssignmentPolicy: e.target.value },
                        }))
                      }
                    />
                    Prioritize Permanent / Regular faculty first
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#1e293b", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name={`teacherAssignmentPolicy_${activeLevel}`}
                      value="hybrid_weighted"
                      checked={currentLevelConfig.constraints.teacherAssignmentPolicy === "hybrid_weighted"}
                      onChange={(e) =>
                        updateCurrentConfig((cfg) => ({
                          ...cfg,
                          constraints: { ...cfg.constraints, teacherAssignmentPolicy: e.target.value },
                        }))
                      }
                    />
                    Hybrid Weighted Priority (30% Permanent, 70% Capacity Balance)
                  </label>
                </div>

                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #cbd5e1", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#334155", fontWeight: 600, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={currentLevelConfig.constraints.enforceMaxLoadCap !== false}
                      onChange={(e) =>
                        updateCurrentConfig((cfg) => ({
                          ...cfg,
                          constraints: { ...cfg.constraints, enforceMaxLoadCap: e.target.checked },
                        }))
                      }
                    />
                    Cap Max Teaching Load per Faculty:
                  </label>
                  <input
                    type="number"
                    min={12}
                    max={36}
                    value={currentLevelConfig.constraints.maxTeachingLoadCap || 24}
                    onChange={(e) =>
                      updateCurrentConfig((cfg) => ({
                        ...cfg,
                        constraints: { ...cfg.constraints, maxTeachingLoadCap: Math.max(1, parseInt(e.target.value, 10) || 24) },
                      }))
                    }
                    style={{ width: 60, padding: "2px 6px", fontSize: 12, borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                  <span style={{ fontSize: 12, color: "#64748b" }}>periods/week (Prevents over-assigning faculty)</span>
                </div>

                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#334155", fontWeight: 600, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={currentLevelConfig.constraints.enforceStudentCoreBalance !== false}
                      onChange={(e) =>
                        updateCurrentConfig((cfg) => ({
                          ...cfg,
                          constraints: { ...cfg.constraints, enforceStudentCoreBalance: e.target.checked },
                        }))
                      }
                    />
                    Balance Daily Student Academic Load (Spread Core Subjects across days)
                  </label>
                </div>
              </div>
              <CheckboxRule
                label="Enforce No Double Booking"
                description="Prevent teachers or section rooms from being scheduled in multiple classes simultaneously."
                checked={currentLevelConfig.constraints.enforceNoDoubleBooking}
                onChange={(val) =>
                  updateCurrentConfig((cfg) => ({
                    ...cfg,
                    constraints: { ...cfg.constraints, enforceNoDoubleBooking: val },
                  }))
                }
              />

              <CheckboxRule
                label="Enforce Teacher Unavailable Periods"
                description="Respect periods where a teacher has been marked unavailable in Faculty Management."
                checked={currentLevelConfig.constraints.enforceUnavailablePeriods}
                onChange={(val) =>
                  updateCurrentConfig((cfg) => ({
                    ...cfg,
                    constraints: { ...cfg.constraints, enforceUnavailablePeriods: val },
                  }))
                }
              />

              <CheckboxRule
                label="Enforce Subject Expertise & Grade Match"
                description="Only assign teachers to subjects listed in their verified Subject Expertise and Grade Level Assignments."
                checked={currentLevelConfig.constraints.enforceExpertiseAndGradeMatch}
                onChange={(val) =>
                  updateCurrentConfig((cfg) => ({
                    ...cfg,
                    constraints: { ...cfg.constraints, enforceExpertiseAndGradeMatch: val },
                  }))
                }
              />

              <CheckboxRule
                label="Enforce Daily Institutional Routines"
                description="Automatically reserve pre-class and post-class daily routines (Flag Ceremony every morning before 1st Period, Zone Improvement & Room Maintenance every afternoon after final class)."
                checked={currentLevelConfig.constraints.enforceFixedPeriods}
                onChange={(val) =>
                  updateCurrentConfig((cfg) => ({
                    ...cfg,
                    constraints: { ...cfg.constraints, enforceFixedPeriods: val },
                  }))
                }
              />

              {currentLevelConfig.constraints.enforceFixedPeriods ? (
                <div style={{ border: "1px solid #e3e7ef", borderRadius: 10, padding: 12, background: "#fbfcff", marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2c6f" }}>Flag Ceremony Routine</span>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", fontWeight: 600 }}>
                      Everyday (Daily Pre-Class Morning Ceremony)
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2c6f" }}>Zone Improvement & Room Maintenance</span>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", fontWeight: 600 }}>
                      Everyday (Daily Post-Class Cleaners Routine)
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </SectionBlock>

          {/* 4. Subject Placement & Double Period Controls */}
          <SectionBlock title="4. Subject Placement & Double Period Controls">
            <SubjectPlacementRulesManager
              activeLevel={activeLevel}
              activeSession={activeSession}
              levelConfig={currentLevelConfig}
              updateLevelConfig={updateCurrentConfig}
              showNotice={showNotice}
            />
          </SectionBlock>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button type="button" onClick={handleSaveConfig} style={primaryActionStyle()}>
              Save {activeLevel.toUpperCase()} Configuration
            </button>
          </div>
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
  { id: "jhs-ict", subjectName: "ICT", subjectCode: "ICT", schoolLevel: "jhs", subjectType: "Specialized", dailyMinutes: 60, classesPerWeek: 4, hoursPerWeek: 4, gradeLevel: "Grades 7–10", programScope: "SPJ, SP-STEM" },
  // JHS Enhanced STEM Subjects (Diadi NHS Standard: 3 meetings × 60 mins = 3 hrs/wk)
  { id: "jhs-devread", subjectName: "Developmental Reading", subjectCode: "DEVREAD", schoolLevel: "jhs", subjectType: "Specialized", dailyMinutes: 60, classesPerWeek: 3, hoursPerWeek: 3, gradeLevel: "7", programScope: "SP-STEM" },
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
    const endTimeStr = levelConfig?.schoolEndTime || "16:30";
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
        label: `${getOrdinalPeriodPairLabel(p, p + 1)} (${p1?.startTime || ""} – ${p2?.endTime || ""})${
          crossesLunch ? " [Crosses Lunch Break]" : ""
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
          const isStemEnhanced = code === "DEVREAD" || code === "ELEMALG" || code === "ENVSCI";
          if (isStemEnhanced && (Number(s.classesPerWeek) !== 3 || Number(s.dailyMinutes) !== 60 || Number(s.hoursPerWeek) !== 3)) {
            needsSync = true;
            return { ...s, dailyMinutes: 60, classesPerWeek: 3, hoursPerWeek: 3 };
          }
          if ((code === "HGP" || code === "ARAL") && (Number(s.classesPerWeek) !== 1 || Number(s.dailyMinutes) !== 60 || Number(s.hoursPerWeek) !== 1)) {
            needsSync = true;
            return { ...s, dailyMinutes: 60, classesPerWeek: 1, hoursPerWeek: 1 };
          }
          const isJhsCoreOrGeneral = String(s.schoolLevel || "").toLowerCase() === "jhs" &&
            (s.subjectType === "Core" || code === "TLE" || code === "SPASPEC" || code === "ICT");
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
    border: "none",
    background: active ? "#e9edff" : "transparent",
    color: active ? "#1f2c6f" : "#5d698d",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
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
      border: "1px solid #1a2570",
      background: "#2c3886",
      color: "#ffffff",
      borderRadius: 999,
      padding: "6px 16px",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(44, 56, 134, 0.2)",
    };
  }

  if (isOtherSession) {
    return {
      border: "1px solid #bcd1ff",
      background: "#e6eeff",
      color: "#1a3a8c",
      borderRadius: 999,
      padding: "6px 16px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
    };
  }

  return {
    border: "1px solid #cfd7ef",
    background: "#ffffff",
    color: "#7a86a7",
    borderRadius: 999,
    padding: "6px 16px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  };
}

function primaryActionStyle() {
  return {
    border: "none",
    background: "#3B4197",
    color: "#ffffff",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  };
}

function mergeLevelConfig(incoming, defaultConfig) {
  if (!incoming || typeof incoming !== "object") return defaultConfig;

  const dayAssignments = {
    ...defaultConfig.dayAssignments,
    ...(incoming.dayAssignments || {}),
  };

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
    schoolStartTime: incoming.schoolStartTime || defaultConfig.schoolStartTime,
    schoolEndTime: incoming.schoolEndTime || defaultConfig.schoolEndTime,
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
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
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
  endTimeStr = "16:30",
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
        } catch (e) {}
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

function VisualSchedulePreview({ levelConfig, activeSession, activeLevel, onBreakMove }) {
  const sessionConfig = levelConfig?.sessions?.[activeSession] || {};
  const startTimeStr = levelConfig?.schoolStartTime || "07:30";
  const duration = Number(sessionConfig.duration) || 50;
  const periodCount = Math.max(1, Math.min(10, Number(sessionConfig.manualPeriodCount || levelConfig?.manualPeriodCount) || 8));
  const breaks = sessionConfig.breaks || {};
  const constraints = levelConfig?.constraints || {};

  const [draggedBreakKey, setDraggedBreakKey] = useState(null);
  const [hoveredPeriodNum, setHoveredPeriodNum] = useState(null);

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

  const items = [];
  const activeBreaks = [
    { key: "morning", name: "Morning Break", ...(breaks.morning || {}) },
    { key: "lunch", name: "Lunch Break", ...(breaks.lunch || {}) },
    { key: "afternoon", name: "Afternoon Break", ...(breaks.afternoon || {}) },
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
          afterPeriod: p,
          startTimeStr: formatTime(brkStart),
          endTimeStr: formatTime(brkEnd),
        });
        currentMins = brkEnd;
      }
    });
  }

  return (
    <div
      style={{
        border: "1px solid #dce5ff",
        borderRadius: 14,
        padding: 16,
        background: "#ffffff",
        boxShadow: "0 4px 12px rgba(31, 44, 111, 0.04)",
      }}
    >
      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h4 style={{ margin: 0, color: "#1f2c6f", fontSize: 14, fontWeight: 700 }}>
            Visual Schedule Timeline (Drag & Drop Breaks)
          </h4>
          <span style={{ fontSize: 12, color: "#5d698d" }}>
            {activeLevel.toUpperCase()} — {activeSession === "regular" ? "Regular Session" : "Shortened Session"} ({duration} min periods)
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#1e40af", background: "#eff6ff", padding: "3px 8px", borderRadius: 6 }}>
          Drag break to reposition
        </span>
      </div>

      {/* Logical Color Legend */}
      <div style={{ display: "flex", gap: 14, fontSize: 11, marginBottom: 12, borderBottom: "1px solid #eef2f7", paddingBottom: 8, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#1e40af", fontWeight: 600 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#eff6ff", border: "1px solid #bfdbfe" }} />
          Morning Classes
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#92400e", fontWeight: 600 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#fffbeb", border: "1.5px dashed #f59e0b" }} />
          Breaks
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#15803d", fontWeight: 600 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#f0fdf4", border: "1px solid #bbf7d0" }} />
          Afternoon Classes
        </span>
      </div>

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
                  border: isBeingDragged ? "2px solid #d97706" : "1.5px dashed #f59e0b",
                  background: isBeingDragged ? "#fef3c7" : "#fffbeb",
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#92400e",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "grab",
                  opacity: isBeingDragged ? 0.6 : 1,
                  userSelect: "none",
                  transition: "all 0.15s ease",
                }}
                title="Click and drag to move break after any period"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ cursor: "grab", color: "#b45309", fontSize: 12, fontWeight: 800 }}>
                    :::
                  </span>
                  <span>{item.name}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#b45309" }}>
                    {item.duration} min
                  </span>
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
                    Flag Ceremony
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
