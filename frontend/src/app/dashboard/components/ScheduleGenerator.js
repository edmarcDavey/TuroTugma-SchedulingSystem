import { Fragment, memo, useEffect, useMemo, useRef, useState } from "react";
import TimeTables from "./TimeTables";
import SubjectDistributionChecklist, { computeSubjectDistributionMetrics } from "./SubjectDistributionChecklist";

function ConfirmationModal({ open, message, onConfirm, onCancel, title = "Confirmation", confirmLabel = "Confirm", confirmColor = "#2563eb" }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 10050,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 20px 40px rgba(15,23,42,0.2), 0 0 0 1px rgba(226,232,240,0.8)',
        padding: '28px 28px',
        minWidth: 400,
        maxWidth: 490,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, color: '#1f2c6f', letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ fontSize: 14.5, lineHeight: 1.55, marginBottom: 24, color: '#334155' }}>{message}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              background: '#f1f5f9',
              color: '#334155',
              fontWeight: 700,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              background: confirmColor,
              color: '#fff',
              fontWeight: 700,
              border: 'none',
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
              transition: 'opacity 0.15s ease',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function GenerationSummaryOverlay({ summary, onClose, onPublish, canPublish }) {
  const [timeLeft, setTimeLeft] = useState(6);
  const [isPaused, setIsPaused] = useState(false);
  const totalDuration = 6;

  useEffect(() => {
    if (!summary) return;
    setTimeLeft(totalDuration);
    setIsPaused(false);
  }, [summary]);

  useEffect(() => {
    if (!summary || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [summary, isPaused, onClose]);

  if (!summary) return null;

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100));
  const hasConflicts = summary.conflictsCount > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Schedule Generation Summary"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 100001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          background: '#ffffff',
          borderRadius: 18,
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          width: '100%',
          maxWidth: 540,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top Accent Gradient Bar */}
        <div
          style={{
            height: 5,
            background: hasConflicts
              ? 'linear-gradient(90deg, #ea580c 0%, #3B4197 100%)'
              : 'linear-gradient(90deg, #1e247a 0%, #3B4197 50%, #2563eb 100%)',
            width: '100%',
          }}
        />

        <div style={{ padding: '22px 26px 18px' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: 'transparent',
                }}
              >
                <img
                  src="/turotugma-logo.png"
                  alt="TuroTugma"
                  style={{ width: 44, height: 44, objectFit: 'contain', display: 'block' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1f2c6f', letterSpacing: '-0.01em' }}>
                    Schedule Generation Complete
                  </h3>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 99,
                      background: hasConflicts ? '#fef3c7' : '#e0e7ff',
                      color: hasConflicts ? '#b45309' : '#1e3a8a',
                      border: hasConflicts ? '1px solid #fde68a' : '1px solid #c7d2fe',
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: hasConflicts ? '#f59e0b' : '#3B4197',
                      }}
                    />
                    {hasConflicts ? 'Review Conflicts' : 'Ready to Publish'}
                  </span>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
                  {summary.scheduleTypeLabel} • {summary.sectionsCount} Sections • Solved in <strong>{summary.elapsedMs ?? '—'} ms</strong> ({summary.elapsedSeconds ?? '—'}s)
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="Close summary"
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: 8,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: 14,
                fontWeight: 700,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#1f2c6f'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
            >
              ✕
            </button>
          </div>

          {/* Quick Metrics 4-Box Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginTop: 18,
              marginBottom: 16,
            }}
          >
            {/* Box 1: Classroom Periods */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Periods Scheduled
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#1f2c6f', lineHeight: 1 }}>
                  {summary.totalPeriodsAssigned}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: 6 }}>
                  100% placed
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Across {summary.sectionsCount} section templates
              </div>
            </div>

            {/* Box 2: Workload Balancing */}
            <div
              style={{
                background: '#f0f4ff',
                border: '1px solid #c7d2fe',
                borderRadius: 12,
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3B4197', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Balanced Load (DO 005)
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#1f2c6f', lineHeight: 1 }}>
                  {summary.balancedTeachers}
                </span>
                <span style={{ fontSize: 12, color: '#3B4197', fontWeight: 600 }}>
                  teachers
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#3B4197', marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ color: (summary.underloadTeachers || 0) === 0 ? '#3B4197' : '#b45309', fontWeight: (summary.underloadTeachers || 0) === 0 ? 500 : 700 }}>
                  {summary.underloadTeachers ?? 0} Underload
                </span>
                <span>•</span>
                <span style={{ color: (summary.overloadTeachers || 0) === 0 ? '#3B4197' : '#dc2626', fontWeight: (summary.overloadTeachers || 0) === 0 ? 500 : 700 }}>
                  {summary.overloadTeachers ?? 0} Overload
                </span>
              </div>
            </div>

            {/* Box 3: Anti-Conflict Check */}
            <div
              style={{
                background: hasConflicts ? '#fff7ed' : '#f8fafc',
                border: hasConflicts ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: hasConflicts ? '#c2410c' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Conflict Engine
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: hasConflicts ? '#ea580c' : '#1f2c6f',
                    lineHeight: 1,
                  }}
                >
                  {summary.conflictsCount}
                </span>
                <span style={{ fontSize: 12, color: hasConflicts ? '#c2410c' : '#2563eb', fontWeight: 600 }}>
                  {hasConflicts ? 'Unresolved' : 'Conflicts'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: hasConflicts ? '#c2410c' : '#2563eb', marginTop: 4, fontWeight: 500 }}>
                {hasConflicts ? 'Review conflict drawer' : '✓ Zero double-bookings'}
              </div>
            </div>

            {/* Box 4: Faculty Deployment */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Faculty Deployed
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#1f2c6f', lineHeight: 1 }}>
                  {summary.activeTeachersCount}
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  of {summary.totalTeachers} active
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                {summary.unassignedTeachers} reserved for ancillary/admin
              </div>
            </div>
          </div>

          {/* Solver Telemetry & Usability Safeguards Strip */}
          <div
            style={{
              background: '#f8faff',
              border: '1px solid #dbe4ff',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 14,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Execution Speed
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1f2c6f', marginTop: 2 }}>
                {summary.elapsedMs ?? '—'} ms <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>({summary.elapsedSeconds ?? '—'}s)</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Same-Period Continuity
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#3B4197', marginTop: 2 }}>
                {summary.horizontalContinuityPercent ?? 100}% <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>row-aligned</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Teacher Break Guard
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#166534', marginTop: 2 }}>
                Max 3 Continuous
              </div>
            </div>
          </div>

          {/* Bottom Actions Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}>
              <span>Auto-dismissing in {timeLeft}s</span>
              {isPaused && <span style={{ color: '#3B4197', fontWeight: 600 }}>(paused)</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#f8fafc',
                  color: '#1f2c6f',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
              >
                View Schedule Grid
              </button>

              {onPublish && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPublish();
                  }}
                  disabled={!canPublish}
                  style={{
                    background: 'linear-gradient(135deg, #3B4197 0%, #1e247a 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '7px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: canPublish ? 'pointer' : 'not-allowed',
                    boxShadow: '0 3px 10px rgba(59, 65, 151, 0.35)',
                    opacity: canPublish ? 1 : 0.6,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { if (canPublish) e.currentTarget.style.boxShadow = '0 5px 14px rgba(59, 65, 151, 0.45)'; }}
                  onMouseLeave={(e) => { if (canPublish) e.currentTarget.style.boxShadow = '0 3px 10px rgba(59, 65, 151, 0.35)'; }}
                >
                  Publish Schedule
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Animated Countdown Progress Bar at Bottom */}
        <div style={{ height: 4, background: '#f1f5f9', width: '100%', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: isPaused ? '#94a3b8' : 'linear-gradient(90deg, #1e247a 0%, #3B4197 50%, #2563eb 100%)',
              transition: isPaused ? 'none' : 'width 1s linear',
            }}
          />
        </div>
      </div>
    </div>
  );
}

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
const MAX_TEACHER_LOAD_BASE = 24;

const SCHEDULE_OPTIONS = [
  { value: "jhs", label: "Junior High School (Full Year)" },
  { value: "shs-term1", label: "Senior High School — Term 1 (DO 017 Trimester)" },
  { value: "shs-term2", label: "Senior High School — Term 2 (DO 017 Trimester)" },
  { value: "shs-term3", label: "Senior High School — Term 3 (DO 017 Trimester)" },
  { value: "shs-first", label: "Senior High School — First Semester (Legacy)" },
  { value: "shs-last", label: "Senior High School — Second Semester (Legacy)" },
];

const DEFAULT_CONFIG = {
  jhs: {
    schoolStartTime: "07:30",
    schoolEndTime: "17:00",
    flagCeremonyMinutes: 0,
    zoneImprovementMinutes: 0,
    periodStructureMode: "configured",
    periodCalculationMode: "manual",
    regularDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    shortenedDays: ["Friday"],
    periodMinutes: { regular: 60, shortened: 45 },
    periods: { regular: 8, shortened: 6, special: 9 },
    breaks: {
      morning: { enabled: true, duration: 20, afterPeriod: 2 },
      lunch: { enabled: true, duration: 60, afterPeriod: 4 },
      afternoon: { enabled: false, duration: 15, afterPeriod: 6 },
    },
  },
  shs: {
    schoolStartTime: "07:30",
    schoolEndTime: "17:00",
    periodStructureMode: "configured",
    periodCalculationMode: "manual",
    regularDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    shortenedDays: ["Friday"],
    periodMinutes: { regular: 60, shortened: 45 },
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
  spaSettings: {
    requiredCount: 3,
    specializations: [
      { name: "Media Arts", defaultTeacherId: "EMP-2026-051" },
      { name: "Dance Arts", defaultTeacherId: "EMP-2026-052" },
      { name: "Instrumental Music", defaultTeacherId: "EMP-2026-053" },
    ],
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

function formatDayGroupLabel(days) {
  if (!days || days.length === 0) return "";
  const shortMap = {
    Monday: "M",
    Tuesday: "T",
    Wednesday: "W",
    Thursday: "Th",
    Friday: "F",
    Saturday: "Sa",
    Sunday: "Su",
  };

  const sortedDays = [...days].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
  const dayIndices = sortedDays.map((d) => DAYS.indexOf(d));

  let isContiguous = dayIndices.length >= 3;
  for (let i = 0; i < dayIndices.length - 1; i++) {
    if (dayIndices[i + 1] !== dayIndices[i] + 1) {
      isContiguous = false;
      break;
    }
  }

  if (isContiguous) {
    const startDay = sortedDays[0];
    const endDay = sortedDays[sortedDays.length - 1];
    return `${DAY_SHORT_LABELS[startDay] || startDay} – ${DAY_SHORT_LABELS[endDay] || endDay}`;
  }

  if (sortedDays.length === 1) {
    return DAY_SHORT_LABELS[sortedDays[0]] || sortedDays[0];
  }

  return sortedDays.map((d) => shortMap[d] || d).join(", ");
}

function renderScheduleSectionBadge(section) {
  if (!section) return null;
  const level = section.level || (Number(section.grade) <= 10 ? "jhs" : "shs");

  if (level === "jhs") {
    let cls = section.classification || "Regular";
    if (cls === "Special" || cls === "STE") cls = "SP-STEM";

    let badgeStyle = { bg: "#f1f5f9", border: "#cbd5e1", color: "#475569" };

    if (cls === "SP-STEM") {
      badgeStyle = { bg: "#e0f2fe", border: "#38bdf8", color: "#0369a1" };
    } else if (cls === "SPA") {
      badgeStyle = { bg: "#f3e8ff", border: "#c084fc", color: "#7e22ce" };
    } else if (cls === "SPJ") {
      badgeStyle = { bg: "#fff7ed", border: "#fb923c", color: "#c2410c" };
    }

    return (
      <span
        style={{
          color: badgeStyle.color,
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap",
          background: badgeStyle.bg,
          borderRadius: 999,
          border: `1px solid ${badgeStyle.border}`,
          padding: "2px 8px",
          display: "inline-block",
        }}
      >
        {cls === "SP-STEM" ? "SP-STEM" : cls === "SPA" ? "SPA" : cls === "SPJ" ? "SPJ" : "Regular"}
      </span>
    );
  }

  const track = section.track || "Academic";
  const cluster = section.cluster || section.strand || "";
  let clusterStyle = { bg: "#f1f5f9", border: "#cbd5e1", color: "#475569" };
  const lowerCluster = (cluster || "").toLowerCase();
  if (lowerCluster.includes("stem")) {
    clusterStyle = { bg: "#ecfeff", border: "#67e8f9", color: "#0e7490" };
  } else if (lowerCluster.includes("abm") || lowerCluster.includes("business")) {
    clusterStyle = { bg: "#ecfdf5", border: "#6ee7b7", color: "#047857" };
  } else if (lowerCluster.includes("humss") || lowerCluster.includes("social")) {
    clusterStyle = { bg: "#fff1f2", border: "#fda4af", color: "#be123c" };
  } else if (lowerCluster.includes("ict") || lowerCluster.includes("industrial") || lowerCluster.includes("tech") || track === "TechPro") {
    clusterStyle = { bg: "#f5f3ff", border: "#c4b5fd", color: "#6d28d9" };
  }

  return (
    <div style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      <span
        style={{
          color: track === "TechPro" ? "#7c2d12" : "#1e40af",
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap",
          background: track === "TechPro" ? "#ffedd5" : "#dbeafe",
          borderRadius: 999,
          border: track === "TechPro" ? "1px solid #fed7aa" : "1px solid #bfdbfe",
          padding: "2px 8px",
        }}
      >
        {track}
      </span>
      {cluster ? (
        <span
          style={{
            color: clusterStyle.color,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
            background: clusterStyle.bg,
            borderRadius: 999,
            border: `1px solid ${clusterStyle.border}`,
            padding: "2px 8px",
          }}
        >
          {cluster.split(" (")[0]}
        </span>
      ) : null}
      {section.grade ? (
        <span
          style={{
            color: "#475569",
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
            background: "#f1f5f9",
            borderRadius: 999,
            border: "1px solid #cbd5e1",
            padding: "2px 8px",
          }}
        >
          Grade {section.grade}
        </span>
      ) : null}
    </div>
  );
}

export default function ScheduleGenerator({ readOnly = false, hideControls = false, generatorMode = true }) {
  const isGeneratorMode = generatorMode;
  // Track which suggestion to show for each conflict (default or alternative)
  const [conflictSuggestionMode, setConflictSuggestionMode] = useState({});
  // State declarations
  const [scheduleType, setScheduleType] = useState("jhs");
  const [configPanel, setConfigPanel] = useState("jhs");
  const [jhsSessionType, setJhsSessionType] = useState("regular");
  const [shsSessionType, setShsSessionType] = useState("regular");
  const [drafts, setDrafts] = useState(() => loadJson(DRAFTS_STORAGE_KEY, []));
  const [publishedSchedules, setPublishedSchedules] = useState(() => loadJson(PUBLISHED_STORAGE_KEY, {}));
  const [schedule, setSchedule] = useState(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState(null); // null | "drafts" | "conflicts" | "restrictions"
  const showDraftsPanel = activeDrawerTab === "drafts";
  const showConflictsPanel = activeDrawerTab === "conflicts";
  const showRestrictionsModal = activeDrawerTab === "restrictions";
  const setShowDraftsPanel = (val) => setActiveDrawerTab((prev) => ((typeof val === "function" ? val(prev === "drafts") : val) ? "drafts" : null));
  const setShowConflictsPanel = (val) => setActiveDrawerTab((prev) => ((typeof val === "function" ? val(prev === "conflicts") : val) ? "conflicts" : null));
  const setShowRestrictionsModal = (val) => setActiveDrawerTab((prev) => ((typeof val === "function" ? val(prev === "restrictions") : val) ? "restrictions" : null));
  const [previewDraftModal, setPreviewDraftModal] = useState(null);
  const [gridSessionFilter, setGridSessionFilter] = useState("all");
  const [gridGradeFilter, setGridGradeFilter] = useState("all");
  const [gridSectionTypeFilter, setGridSectionTypeFilter] = useState("all");
  const [gridTrackFilter, setGridTrackFilter] = useState("all");
  const [cellEditorDrafts, setCellEditorDrafts] = useState({});
  const [hoveredCellKey, setHoveredCellKey] = useState("");
  const [activeCellKey, setActiveCellKey] = useState("");
  const [cellConflictTooltip, setCellConflictTooltip] = useState({ visible: false, messages: [], x: 0, y: 0 });

  useEffect(() => {
    if (!activeCellKey) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveCellKey("");
      }
    };
    const handlePointerDown = (event) => {
      if (!event.target?.closest?.(".sg-grid-cell")) {
        setActiveCellKey("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [activeCellKey]);
  const [teacherRestrictionForm, setTeacherRestrictionForm] = useState(EMPTY_TEACHER_RESTRICTION_FORM);
  const [showTeacherRestrictionEditor, setShowTeacherRestrictionEditor] = useState(false);
  const [subjectRestrictionForm, setSubjectRestrictionForm] = useState(EMPTY_SUBJECT_RESTRICTION_FORM);
  const [showSubjectRestrictionEditor, setShowSubjectRestrictionEditor] = useState(false);
  const [notice, setNotice] = useState({ text: "", type: "success" });
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [clearGridModal, setClearGridModal] = useState({ open: false, message: '', onConfirm: null, onCancel: null });
  const [generationSummary, setGenerationSummary] = useState(null);

  function handleClearGrid() {
    if (!schedule) return;
    const activeConfigSnapshot = JSON.parse(JSON.stringify(activeConfig));
    setSchedule((current) =>
      current
        ? {
          ...current,
          config: activeConfigSnapshot,
          assignments: {},
          conflicts: [],
          conflictDetails: [],
          teacherLoadPercent: {},
          updatedAt: new Date().toISOString(),
          status: "unsaved",
        }
        : current
    );
    setCellEditorDrafts({});
    setHoveredCellKey("");
    showNotice("Grid cleared and updated to latest scheduling configurations.", "success");
  }

  const [dataRefreshToken, setDataRefreshToken] = useState(0);
  const [configSaveStatus, setConfigSaveStatus] = useState("saved");
  const configSaveTimerRef = useRef(null);
  const lastAutoLoadedTypeRef = useRef(null);
  const pendingLoadDraftIdRef = useRef(null);

  useEffect(() => {
    const handleSync = () => {
      setDataRefreshToken((prev) => prev + 1);
    };
    window.addEventListener("storage", handleSync);
    window.addEventListener("turotugma:config-updated", handleSync);
    window.addEventListener("turotugma_config_updated", handleSync);
    window.addEventListener("turotugma_subjects_updated", handleSync);
    window.addEventListener("turotugma:faculty-updated", handleSync);
    window.addEventListener("turotugma_faculty_updated", handleSync);
    window.addEventListener("turotugma_sections_updated", handleSync);
    window.addEventListener("turotugma_schedule_configurations_updated", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("turotugma:config-updated", handleSync);
      window.removeEventListener("turotugma_config_updated", handleSync);
      window.removeEventListener("turotugma_subjects_updated", handleSync);
      window.removeEventListener("turotugma:faculty-updated", handleSync);
      window.removeEventListener("turotugma_faculty_updated", handleSync);
      window.removeEventListener("turotugma_sections_updated", handleSync);
      window.removeEventListener("turotugma_schedule_configurations_updated", handleSync);
    };
  }, []);

  const activeConfig = useMemo(() => loadScheduleConfig(), [dataRefreshToken]);
  const config = useMemo(() => {
    if (schedule && schedule.config) {
      return {
        ...schedule.config,
        constraints: {
          ...(schedule.config.constraints || {}),
          ...(activeConfig.constraints || {}),
        },
      };
    }
    return activeConfig;
  }, [schedule, activeConfig]);

  const setConfig = (updater) => {
    const currentConfig = loadScheduleConfig();
    const nextConfig = typeof updater === "function" ? updater(currentConfig) : updater;
    saveJson(CONFIG_STORAGE_KEY, nextConfig);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("turotugma_schedule_configurations_updated"));
    }
    setSchedule((prev) =>
      prev
        ? {
            ...prev,
            config: {
              ...(prev.config || {}),
              constraints: nextConfig?.constraints || {},
            },
          }
        : prev
    );
    setDataRefreshToken((prev) => prev + 1);
  };
  const sectionsRaw = useMemo(() => loadJson(SECTIONS_STORAGE_KEY, null), [dataRefreshToken]);
  const subjectsRaw = useMemo(() => loadJson(SUBJECTS_STORAGE_KEY, []), [dataRefreshToken]);
  const facultyRaw = useMemo(() => loadJson(FACULTY_STORAGE_KEY, []), [dataRefreshToken]);
  const schoolProfileRaw = useMemo(() => loadJson("turotugma_school_profile", {}), [dataRefreshToken]);

  const offeredLevels = schoolProfileRaw?.offeredLevels || "both";

  const filteredScheduleOptions = useMemo(() => {
    if (offeredLevels === "jhs_only") {
      return SCHEDULE_OPTIONS.filter((opt) => opt.value === "jhs");
    }
    if (offeredLevels === "shs_only") {
      return SCHEDULE_OPTIONS.filter((opt) => opt.value.startsWith("shs"));
    }
    return SCHEDULE_OPTIONS;
  }, [offeredLevels]);

  useEffect(() => {
    if (offeredLevels === "shs_only" && scheduleType === "jhs") {
      setScheduleType("shs-first");
    } else if (offeredLevels === "jhs_only" && scheduleType !== "jhs") {
      setScheduleType("jhs");
    }
  }, [offeredLevels, scheduleType]);

  const sections = useMemo(() => getSectionsForSchedule(scheduleType, sectionsRaw), [scheduleType, sectionsRaw]);
  const subjects = useMemo(() => normalizeSubjectsList(subjectsRaw), [subjectsRaw]);
  const faculty = useMemo(() => normalizeFacultyList(facultyRaw), [facultyRaw]);
  const slots = useMemo(
    () => buildSlots(scheduleType, config, { deriveJhsPeriods: isGeneratorMode, subjects }),
    [config, isGeneratorMode, scheduleType, subjects]
  );
  const breakSummary = useMemo(() => buildBreakSummary(scheduleType, config), [scheduleType, config]);
  const isJhsSchedule = scheduleType === "jhs";
  const levelConfig = isJhsSchedule ? config.jhs : config.shs;

  const { regularDays, shortenedDays, daySequence } = useMemo(() => {
    return extractDaysFromLevelConfig(levelConfig);
  }, [levelConfig]);

  const baseDaysSequence = useMemo(() => (daySequence.length ? daySequence : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]), [daySequence]);

  const generatorDays = useMemo(() => {
    if (gridSessionFilter === "regular") {
      return regularDays.filter((d) => baseDaysSequence.includes(d));
    }
    if (gridSessionFilter === "shortened") {
      return shortenedDays.filter((d) => baseDaysSequence.includes(d));
    }
    return baseDaysSequence;
  }, [baseDaysSequence, gridSessionFilter, regularDays, shortenedDays]);

  const activeRegularDays = useMemo(
    () => regularDays.filter((d) => baseDaysSequence.includes(d)),
    [regularDays, baseDaysSequence]
  );
  const activeShortenedDays = useMemo(
    () => shortenedDays.filter((d) => baseDaysSequence.includes(d)),
    [shortenedDays, baseDaysSequence]
  );

  const hasDualSessions = useMemo(() => {
    if (gridSessionFilter !== "all") return false;
    return activeRegularDays.length > 0 && activeShortenedDays.length > 0;
  }, [gridSessionFilter, activeRegularDays, activeShortenedDays]);
  const regularDaysLabel = useMemo(() => formatDayGroupLabel(activeRegularDays), [activeRegularDays]);
  const shortenedDaysLabel = useMemo(() => formatDayGroupLabel(activeShortenedDays), [activeShortenedDays]);

  const regularPeriodMinutes = useMemo(() => {
    if (!isGeneratorMode || scheduleType !== "jhs") return levelConfig?.periodMinutes?.regular || 50;
    const isAutoMode = config.jhs.periodStructureMode === "automated" || config.jhs.periodCalculationMode === "automated";
    if (isAutoMode) {
      return getGeneratorPeriodMinutes(subjects, scheduleType, levelConfig?.periodMinutes?.regular || 50);
    }
    return levelConfig?.periodMinutes?.regular || 50;
  }, [config.jhs, isGeneratorMode, levelConfig, scheduleType, subjects]);

  const shortenedPeriodMinutes = useMemo(() => {
    if (!isGeneratorMode || scheduleType !== "jhs") return levelConfig?.periodMinutes?.shortened || 45;
    const isAutoMode = config.jhs.periodStructureMode === "automated" || config.jhs.periodCalculationMode === "automated";
    if (isAutoMode) {
      return getGeneratorPeriodMinutes(subjects, scheduleType, levelConfig?.periodMinutes?.shortened || 45);
    }
    return levelConfig?.periodMinutes?.shortened || 45;
  }, [config.jhs, isGeneratorMode, levelConfig, scheduleType, subjects]);

  const regularTimingMap = useMemo(() => {
    const totalMaxRequiredPeriods = calculateMaxGeneratorPeriodsForSections(sections, subjects, scheduleType);
    const activeDaysCount = daySequence.length || 5;
    const sectionMaxPeriods = (isGeneratorMode && activeDaysCount > 0 && totalMaxRequiredPeriods > 0)
      ? Math.ceil(totalMaxRequiredPeriods / activeDaysCount)
      : 0;

    return buildJhsPeriodTimingMap(levelConfig, "regular", {
      deriveJhsPeriods: isGeneratorMode,
      periodMinutes: regularPeriodMinutes,
      sectionMaxPeriods,
      subjects,
      scheduleType,
    });
  }, [levelConfig, isGeneratorMode, daySequence.length, sections, subjects, scheduleType, regularPeriodMinutes]);

  const shortenedTimingMap = useMemo(() => {
    const totalMaxRequiredPeriods = calculateMaxGeneratorPeriodsForSections(sections, subjects, scheduleType);
    const activeDaysCount = daySequence.length || 5;
    const sectionMaxPeriods = (isGeneratorMode && activeDaysCount > 0 && totalMaxRequiredPeriods > 0)
      ? Math.ceil(totalMaxRequiredPeriods / activeDaysCount)
      : 0;

    return buildJhsPeriodTimingMap(levelConfig, "shortened", {
      deriveJhsPeriods: isGeneratorMode,
      periodMinutes: shortenedPeriodMinutes,
      sectionMaxPeriods,
      subjects,
      scheduleType,
    });
  }, [levelConfig, isGeneratorMode, daySequence.length, sections, subjects, scheduleType, shortenedPeriodMinutes]);

  const generatorPeriods = useMemo(() => {
    let maxPeriods = Math.max(regularTimingMap.size || 0, shortenedTimingMap.size || 0, 1);
    if (gridSessionFilter === "regular" && regularTimingMap.size > 0) {
      maxPeriods = regularTimingMap.size;
    } else if (gridSessionFilter === "shortened" && shortenedTimingMap.size > 0) {
      maxPeriods = shortenedTimingMap.size;
    }
    maxPeriods = Math.min(maxPeriods, 10);

    const periodsList = [];
    for (let p = 1; p <= maxPeriods; p++) {
      const reg = regularTimingMap.get(p);
      const short = shortenedTimingMap.get(p);

      let start = reg?.start || short?.start || "";
      let end = reg?.end || short?.end || "";

      if (gridSessionFilter === "shortened") {
        start = short?.start || reg?.start || "";
        end = short?.end || reg?.end || "";
      } else if (gridSessionFilter === "regular") {
        start = reg?.start || short?.start || "";
        end = reg?.end || short?.end || "";
      }

      periodsList.push({
        period: p,
        regularStart: reg?.start || "",
        regularEnd: reg?.end || "",
        shortenedStart: short?.start || "",
        shortenedEnd: short?.end || "",
        start,
        end,
      });
    }
    return periodsList;
  }, [regularTimingMap, shortenedTimingMap, gridSessionFilter]);

  const sessionDaysLookup = useMemo(() => {
    const levelConfig = isJhsSchedule ? config.jhs : config.shs;
    const { regularDays, shortenedDays, daySequence } = extractDaysFromLevelConfig(levelConfig);
    const active = daySequence.length ? daySequence : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    if (gridSessionFilter === "regular") return new Set(regularDays.filter((d) => active.includes(d)));
    if (gridSessionFilter === "shortened") return new Set(shortenedDays.filter((d) => active.includes(d)));
    return new Set(active);
  }, [config.jhs, config.shs, gridSessionFilter, isJhsSchedule]);

  const visibleSlots = useMemo(() => {
    if (!sessionDaysLookup || sessionDaysLookup.size === 0) {
      return slots;
    }

    return slots.filter((slot) => sessionDaysLookup.has(slot.day));
  }, [slots, sessionDaysLookup]);
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
      const sectionGrade = Number(section.grade);
      const isShsSection = section.level === "shs" || sectionGrade >= 11;
      const isJhsSection = section.level === "jhs" || (sectionGrade >= 7 && sectionGrade <= 10) || (!section.level && !sectionGrade);

      if (isJhsSchedule && isShsSection) {
        return false;
      }
      if (!isJhsSchedule && isJhsSection && !isShsSection) {
        return false;
      }

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
      ...buildSlots("jhs", config, { deriveJhsPeriods: isGeneratorMode, subjects }),
      ...buildSlots("shs-term1", config, { deriveJhsPeriods: isGeneratorMode }),
      ...buildSlots("shs-first", config, { deriveJhsPeriods: isGeneratorMode }),
    ];

    const deduped = new Map();
    labels.forEach((slot) => {
      if (!deduped.has(slot.label)) {
        deduped.set(slot.label, slot);
      }
    });

    return Array.from(deduped.values());
  }, [config, isGeneratorMode, subjects]);
  const allPeriodLabels = useMemo(() => allSlotOptions.map((slot) => slot.label), [allSlotOptions]);
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

  const teacherRestrictionOptions = useMemo(
    () =>
      faculty
        .filter((teacher) => teacher.active !== false)
        .map((teacher) => ({
          id: teacher.id,
          name: teacher.name,
          label: teacher.name,
          ancillaryAssignments: extractTeacherAncillaryTasks(teacher),
        })),
    [faculty]
  );
  const effectiveTeacherRestrictions = useMemo(
    () => buildEffectiveTeacherRestrictions(config.constraints.teacherRestrictions, faculty),
    [config.constraints.teacherRestrictions, faculty]
  );
  const subjectRestrictionsForDisplay = useMemo(
    () =>
      [...(config.constraints.subjectRestrictions || [])]
        .filter((entry) => {
          const id = sanitizeText(entry?.subjectId);
          return id && subjectsById.has(id);
        })
        .map((entry) => {
          const liveSub = subjectsById.get(sanitizeText(entry.subjectId));
          return {
            ...entry,
            subjectName: liveSub?.subjectName || entry.subjectName || entry.subjectId,
            subjectCode: liveSub?.subjectCode || entry.subjectCode || "",
            gradeLevel: liveSub?.gradeLevel || entry.gradeLevel || "",
          };
        })
        .sort((left, right) => compareRecentFirst(left?.updatedAt, right?.updatedAt)),
    [config.constraints.subjectRestrictions, subjectsById]
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

    const isAutomated = (config?.jhs?.periodStructureMode || config?.jhs?.periodCalculationMode || "automated") === "automated";
    const manualDefault = Number(config?.jhs?.sessions?.regular?.manualPeriodCount || config?.jhs?.periods?.regular || 8);
    const totalPeriods = highestPeriod > 0 ? highestPeriod : (isAutomated ? 8 : Math.max(1, Math.min(10, manualDefault)));

    return Array.from({ length: totalPeriods }, (_, index) => formatPeriodOrdinalLabel({ period: index + 1 }));
  }, [allSlotOptions, config]);
  const subjectRestrictionOptions = useMemo(
    () =>
      sortSubjectsByTypeAndName(subjects).map((subject) => ({
        id: subject.id,
        name: subject.subjectName,
        subjectName: subject.subjectName,
        code: subject.subjectCode,
        subjectCode: subject.subjectCode,
        gradeLevel: subject.gradeLevel,
        label: subject.subjectName,
      })),
    [subjects]
  );

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
    if (schedule) {
      if (schedule.status === "published") return "Published";
      if (schedule.status === "draft") return "Draft Saved";
      if (schedule.status === "unsaved") return "Draft (Unsaved)";
      // fallback for legacy or missing status
      if (publishedSchedules?.[scheduleType] && publishedSchedules[scheduleType].id === schedule.id) return "Published";
      if (draftsForCurrentSchedule.some((d) => d.id === schedule.id)) return "Draft Saved";
      return "Draft (Unsaved)";
    }
    return "Not Generated";
  }, [schedule, publishedSchedules, scheduleType, draftsForCurrentSchedule]);

  const hasAssignments = useMemo(() => {
    return Boolean(schedule?.assignments && Object.keys(schedule.assignments).length > 0);
  }, [schedule?.assignments]);

  const effectiveAssignmentsForDisplay = useMemo(() => {
    if (!schedule) return {};
    const merged = { ...(schedule.assignments || {}) };
    Object.entries(cellEditorDrafts || {}).forEach(([cellKey, draft]) => {
      if (!draft || (!draft.subjectId && !draft.teacherId)) {
        delete merged[cellKey];
      } else if (draft.subjectId && draft.teacherId) {
        const prevCell = merged[cellKey] || {};
        merged[cellKey] = {
          ...prevCell,
          subjectId: draft.subjectId,
          teacherId: draft.teacherId,
          coTeacherIds: draft.coTeacherIds !== undefined ? draft.coTeacherIds : prevCell.coTeacherIds,
          breakoutAssignments:
            draft.breakoutAssignments !== undefined ? draft.breakoutAssignments : prevCell.breakoutAssignments,
          breakoutNote: draft.breakoutNote !== undefined ? draft.breakoutNote : prevCell.breakoutNote,
          source: "draft",
          updatedAt: new Date().toISOString(),
        };
      }
    });
    return merged;
  }, [schedule, cellEditorDrafts]);

  const evaluationForDisplay = useMemo(() => {
    if (!schedule || !hasAssignments) {
      return { conflicts: [], conflictDetails: [], teacherLoadPercent: {} };
    }

    return evaluateSchedule({
      assignments: effectiveAssignmentsForDisplay,
      sections,
      slots,
      subjects,
      teachers: activeTeachers,
      scheduleType,
      config,
    });
  }, [schedule, hasAssignments, effectiveAssignmentsForDisplay, sections, slots, subjects, activeTeachers, scheduleType, config]);

  const conflictDetailsForDisplay = useMemo(() => {
    if (!schedule || !hasAssignments) {
      return [];
    }
    return evaluationForDisplay.conflictDetails || [];
  }, [schedule, hasAssignments, evaluationForDisplay]);

  const conflictsForDisplay = useMemo(() => {
    if (!schedule || !hasAssignments) {
      return [];
    }
    return evaluationForDisplay.conflicts || [];
  }, [schedule, hasAssignments, evaluationForDisplay]);

  const conflictCount = conflictsForDisplay.length;
  const hasPublishBlockingConflicts = conflictCount > 0;

  const conflictMessagesByCell = useMemo(() => {
    const map = new Map();

    conflictDetailsForDisplay.forEach((entry) => {
      const message = sanitizeText(entry?.message);
      const cellKeys = Array.isArray(entry?.cellKeys) ? entry.cellKeys : [];

      if (!message || cellKeys.length === 0) {
        return;
      }

      cellKeys.forEach((cellKey) => {
        const normalizedCellKey = sanitizeText(cellKey);
        if (!normalizedCellKey) {
          return;
        }

        const existing = map.get(normalizedCellKey) || [];
        if (!existing.includes(message)) {
          map.set(normalizedCellKey, [...existing, message]);
        }
      });
    });

    return map;
  }, [conflictDetailsForDisplay]);

  const subjectChecklistMetrics = useMemo(() => {
    if (!schedule) {
      return { totalRequired: 0, totalAssigned: 0, percentage: 100, incompleteCount: 0, isComplete: true };
    }
    return computeSubjectDistributionMetrics({
      sections,
      subjects,
      scheduleType,
      assignments: effectiveAssignmentsForDisplay,
      subjectsById,
      slots,
      facultyById,
      conflictMessagesByCell,
    });
  }, [schedule, sections, subjects, scheduleType, effectiveAssignmentsForDisplay, subjectsById, slots, facultyById, conflictMessagesByCell]);

  const assignmentValidationSummary = useMemo(() => {
    const assignedKeys = Object.keys(schedule?.assignments || {});
    const invalidAssignedSaved = assignedKeys.filter((cellKey) => (conflictMessagesByCell.get(cellKey) || []).length > 0).length;
    const pendingInvalidCellKeys = Object.entries(cellEditorDrafts || {}).reduce((accumulator, [cellKey, draft]) => {
      const assignment = schedule?.assignments?.[cellKey];
      if (assignment) {
        return accumulator;
      }

      const draftSubjId = sanitizeText(draft?.subjectId);
      if (!draftSubjId) {
        return accumulator;
      }

      const draftSubj = subjectsById.get(draftSubjId);
      if (draftSubj && isSubjectMultiTeacher(draftSubj)) {
        const reqCount = getSubjectBreakoutStreams(draftSubj, config).length;
        const assignedValid = Array.isArray(draft?.breakoutAssignments)
          ? new Set(draft.breakoutAssignments.map((b) => sanitizeText(b?.teacherId)).filter(Boolean)).size
          : sanitizeText(draft?.teacherId)
          ? 1
          : 0;
        if (assignedValid < reqCount) {
          accumulator.add(cellKey);
        }
      } else if (!sanitizeText(draft?.teacherId)) {
        accumulator.add(cellKey);
      }

      return accumulator;
    }, new Set());

    const unassignedConflictCellKeys = Array.from(conflictMessagesByCell.keys()).filter((cellKey) => {
      const assignment = schedule?.assignments?.[cellKey];
      return !assignment && !pendingInvalidCellKeys.has(cellKey);
    });

    const pendingInvalid = pendingInvalidCellKeys.size;
    const invalidAssigned = invalidAssignedSaved + pendingInvalid + unassignedConflictCellKeys.length;
    const totalAssigned = assignedKeys.length + pendingInvalid + unassignedConflictCellKeys.length;
    const validAssigned = Math.max(0, totalAssigned - invalidAssigned);
    const totalRequired = sections.reduce(
      (sectionCount, section) =>
        sectionCount +
        slots.reduce(
          (slotCount, slot) => slotCount + (isSlotValidForSection(section, slot, scheduleType, config) ? 1 : 0),
          0
        ),
      0
    );

    return {
      totalAssigned,
      validAssigned,
      invalidAssigned,
      totalRequired,
    };
  }, [schedule?.assignments, conflictMessagesByCell, cellEditorDrafts, subjectsById, sections, slots, scheduleType, config]);

  const teacherBusyBySlot = useMemo(
    () => buildTeacherBusyMap(schedule?.assignments || {}, sectionsById, slotsById),
    [schedule?.assignments, sectionsById, slotsById]
  );

  const capacityIssues = useMemo(() => {
    if (!sections || !slots || !subjects) return [];
    const issues = [];
    for (const sec of sections) {
      const secSlots = slots.filter((s) => isSlotValidForSection(sec, s, scheduleType, config));
      const secSubjs = getSubjectsForSection(sec, subjects, scheduleType);
      const totalReq = secSubjs.reduce(
        (sum, sub) => sum + parseBoundedNumber(sub?.classesPerWeek, 1, 12, 4),
        0
      );
      if (totalReq > secSlots.length) {
        issues.push({
          section: sec,
          sectionName: formatConflictSectionName(sec),
          totalRequired: totalReq,
          availableSlots: secSlots.length,
          deficit: totalReq - secSlots.length,
        });
      }
    }
    return issues;
  }, [sections, slots, subjects, scheduleType, config]);

  const handleQuickIncreasePeriods = () => {
    const currentConfig = loadScheduleConfig();
    const nextConfig = JSON.parse(JSON.stringify(currentConfig || DEFAULT_CONFIG));
    const targetLevel = scheduleType === "jhs" ? "jhs" : "shs";
    if (!nextConfig[targetLevel]) nextConfig[targetLevel] = {};
    if (!nextConfig[targetLevel].sessions) nextConfig[targetLevel].sessions = {};
    if (!nextConfig[targetLevel].sessions.regular) nextConfig[targetLevel].sessions.regular = {};
    if (!nextConfig[targetLevel].sessions.shortened) nextConfig[targetLevel].sessions.shortened = {};

    const maxDemanded = (capacityIssues || []).reduce((max, i) => Math.max(max, i.totalRequired), 45);
    const regularDaysCount = (nextConfig[targetLevel]?.regularDays || ["Monday", "Tuesday", "Wednesday", "Thursday"]).length || 4;
    const shortenedDaysCount = (nextConfig[targetLevel]?.shortenedDays || ["Friday"]).length || 1;
    const totalDaysCount = regularDaysCount + shortenedDaysCount || 5;
    const targetPeriodPerDay = Math.max(9, Math.ceil(maxDemanded / totalDaysCount));

    nextConfig[targetLevel].sessions.regular.manualPeriodCount = targetPeriodPerDay;
    nextConfig[targetLevel].sessions.shortened.manualPeriodCount = targetPeriodPerDay;
    nextConfig[targetLevel].periods = {
      regular: targetPeriodPerDay,
      special: targetPeriodPerDay,
      shortened: targetPeriodPerDay,
      default: targetPeriodPerDay,
    };
    nextConfig[targetLevel].manualPeriodCount = targetPeriodPerDay;
    nextConfig[targetLevel].periodStructureMode = "configured";
    nextConfig[targetLevel].periodCalculationMode = "manual";

    saveJson(CONFIG_STORAGE_KEY, nextConfig);
    saveJson("turotugma_schedule_configurations", nextConfig);
    window.dispatchEvent(new Event("turotugma_schedule_configurations_updated"));
    setDataRefreshToken((prev) => prev + 1);

    const updatedSlots = buildSlots(scheduleType, nextConfig, { deriveJhsPeriods: isGeneratorMode, subjects });

    const autoSchedule = generateSchedule({
      scheduleType,
      sections,
      slots: updatedSlots,
      subjects,
      activeTeachers,
      config: nextConfig,
    });

    autoSchedule.config = nextConfig;
    autoSchedule.status = "unsaved";
    setSchedule(autoSchedule);
    setCellEditorDrafts({});
    setHoveredCellKey("");

    const remainingConflicts = autoSchedule.conflicts.length;
    if (remainingConflicts > 0) {
      showNotice(`Expanded to ${targetPeriodPerDay} periods/day (${targetPeriodPerDay * totalDaysCount} slots). Remaining conflicts: ${remainingConflicts}.`, "info");
    } else {
      showNotice(`Timetable capacity successfully expanded to ${targetPeriodPerDay} periods/day (${targetPeriodPerDay * totalDaysCount} slots)! All subjects scheduled with 0 conflicts.`, "success");
    }
  };

  const handleSaveSpaSettings = (newSpaSettings) => {
    const currentConfig = loadScheduleConfig();
    const nextConfig = {
      ...currentConfig,
      spaSettings: newSpaSettings,
    };
    saveJson(CONFIG_STORAGE_KEY, nextConfig);
    saveJson("turotugma_schedule_configurations", nextConfig);
    window.dispatchEvent(new Event("turotugma_schedule_configurations_updated"));
    setDataRefreshToken((prev) => prev + 1);
    showNotice(`SPA configuration saved: ${newSpaSettings.specializations?.length || 3} specializations active.`, "success");
  };

  useEffect(() => {
    if (pendingLoadDraftIdRef.current) {
      pendingLoadDraftIdRef.current = null;
      lastAutoLoadedTypeRef.current = scheduleType;
      return;
    }

    if (lastAutoLoadedTypeRef.current === scheduleType) {
      return;
    }
    lastAutoLoadedTypeRef.current = scheduleType;

    // Auto-select the most recent schedule (draft or published) only on mount / explicit scheduleType switch
    const draftsForType = getDraftsForScheduleType(drafts, scheduleType);
    const publishedForType = publishedSchedules?.[scheduleType] || null;
    let mostRecent = null;
    if (draftsForType.length > 0 && publishedForType) {
      const draftDate = new Date(draftsForType[0].schedule?.updatedAt || draftsForType[0].updatedAt || 0).getTime();
      const publishedDate = new Date(publishedForType.updatedAt || publishedForType.publishedAt || 0).getTime();
      if (draftDate >= publishedDate) {
        const draftObj = draftsForType[0];
        const isPub = draftObj.status === "published" || draftObj.schedule?.status === "published" || publishedForType.id === draftObj.id;
        mostRecent = {
          ...draftObj.schedule,
          id: draftObj.id,
          status: isPub ? "published" : "draft",
          config: draftObj.schedule?.config || draftObj.config || JSON.parse(JSON.stringify(activeConfig)),
        };
      } else {
        mostRecent = {
          ...publishedForType,
          status: "published",
          config: publishedForType.config || JSON.parse(JSON.stringify(activeConfig)),
        };
      }
    } else if (draftsForType.length > 0) {
      const draftObj = draftsForType[0];
      const isPub = draftObj.status === "published" || draftObj.schedule?.status === "published";
      mostRecent = {
        ...draftObj.schedule,
        id: draftObj.id,
        status: isPub ? "published" : "draft",
        config: draftObj.schedule?.config || draftObj.config || JSON.parse(JSON.stringify(activeConfig)),
      };
    } else if (publishedForType) {
      mostRecent = {
        ...publishedForType,
        status: "published",
        config: publishedForType.config || JSON.parse(JSON.stringify(activeConfig)),
      };
    }
    setSchedule(mostRecent);
    setCellEditorDrafts({});
    setHoveredCellKey("");
    setShowDraftsPanel(false);
    setGridSessionFilter("all");
    setGridGradeFilter("all");
    setGridSectionTypeFilter("all");
    setGridTrackFilter("all");
  }, [scheduleType]);

  useEffect(() => {
    setConfigSaveStatus("saved");
    // Master configuration is managed centrally via School Profile & Settings

    const allLabels = [
      ...buildSlots("jhs", config, { deriveJhsPeriods: isGeneratorMode }),
      ...buildSlots("shs-term1", config, { deriveJhsPeriods: isGeneratorMode }),
      ...buildSlots("shs-first", config, { deriveJhsPeriods: isGeneratorMode }),
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

  const clearNotice = () => {
    window.clearTimeout(window.__turotugmaScheduleNoticeTimer);
    setNotice({ text: "", type: "success" });
  };

  const showNotice = (text, type = "success") => {
    setNotice({ text, type });
    window.clearTimeout(window.__turotugmaScheduleNoticeTimer);
    const durationMs = type === "error" || type === "info" ? 6000 : 4500;
    window.__turotugmaScheduleNoticeTimer = window.setTimeout(() => {
      setNotice({ text: "", type: "success" });
    }, durationMs);
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
        (item.ancillaryAssignments || []).some((task) => {
          const cleanTask = sanitizeText(task).toLowerCase();
          return cleanTask === selectedTask || cleanTask.includes(selectedTask) || selectedTask.includes(cleanTask);
        })
      );

      if (targetTeachers.length === 0) {
        showNotice(`No active teachers found with ancillary task "${teacherRestrictionForm.ancillaryTask}".`, "error");
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

  const handleGenerateSchedule = ({ showSummaryModal = true } = {}) => {
    if (sections.length === 0) {
      showNotice("No sections found for this schedule type.", "error");
      return;
    }

    const activeConfigSnapshot = JSON.parse(JSON.stringify(activeConfig));
    const builtSlots = buildSlots(scheduleType, activeConfig, { deriveJhsPeriods: isGeneratorMode, subjects });
    const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    const autoSchedule = generateSchedule({
      scheduleType,
      sections,
      slots: builtSlots,
      subjects,
      activeTeachers,
      config: activeConfig,
    });
    const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    const elapsedMs = Math.max(0.1, Math.round((endTime - startTime) * 10) / 10);
    const elapsedSeconds = (elapsedMs / 1000).toFixed(3);

    // Mark as draft and embed current active configuration snapshot + benchmark telemetry
    autoSchedule.config = activeConfigSnapshot;
    autoSchedule.status = "draft";
    autoSchedule.generationTimeMs = elapsedMs;
    autoSchedule.generationTimeSec = elapsedSeconds;
    setSchedule(autoSchedule);
    setCellEditorDrafts({});
    setHoveredCellKey("");

    // Automatically persist to drafts so Faculty Management & other tabs immediately reflect balanced loads
    try {
      const now = new Date().toISOString();
      const draftObj = {
        id: `draft-${scheduleType}-latest`,
        scheduleType,
        name: `${getScheduleTypeLabel(scheduleType)} Draft — ${formatDateTime(now)}`,
        updatedAt: now,
        schedule: {
          ...autoSchedule,
          sections,
          slots: builtSlots,
          subjects,
          teachers: activeTeachers,
          config: activeConfigSnapshot,
          status: "draft",
          updatedAt: now,
        },
        config: activeConfigSnapshot,
      };
      const currentDrafts = loadJson(DRAFTS_STORAGE_KEY, []);
      const filteredDrafts = Array.isArray(currentDrafts)
        ? currentDrafts.filter((d) => d.id !== `draft-${scheduleType}-latest` && d.id !== autoSchedule.id)
        : [];
      const nextDrafts = [draftObj, ...filteredDrafts].slice(0, 10);
      setDrafts(nextDrafts);
      saveJson(DRAFTS_STORAGE_KEY, nextDrafts);

      // Keep generated schedule as a working draft (only explicit user publishing updates the published store)
      persistFacultyLoadPercent(autoSchedule?.teacherLoadPercent || {});
      window.dispatchEvent(new CustomEvent("turotugma:schedule-updated", { detail: { type: "draft", scheduleType, id: draftObj.id } }));
    } catch (e) {
      console.warn("Could not auto-save generated draft:", e);
    }

    const unresolved = autoSchedule.conflicts.length;
    if (unresolved > 0) {
      showNotice(`Generated in ${elapsedMs} ms (${elapsedSeconds}s) with ${unresolved} unresolved conflict(s).`, "error");
    } else {
      showNotice(`Schedule generated in ${elapsedMs} ms (${elapsedSeconds}s) with 0 conflicts.`, "success");
    }

    if (!showSummaryModal) {
      return;
    }

    // Build Generation Quick Summary Overlay Data
    const assignedEntries = Object.entries(autoSchedule.assignments || {});
    const totalAssignedPeriods = assignedEntries.length;
    const teacherPeriodCounts = {};

    // Calculate Same-Period Horizontal Continuity percentage across multi-day section-subject pairs
    const slotPeriodMap = new Map(builtSlots.map((s) => [s.id, Number(s.period || 0)]));
    const sectionSubjPeriods = new Map();
    assignedEntries.forEach(([cellKey, asgn]) => {
      if (!asgn?.subjectId) return;
      const [secId, slotId] = splitCellKey(cellKey);
      const pNum = slotPeriodMap.get(slotId) || extractPeriodNumberFromSlotOrLabel(slotId);
      if (!secId || !pNum) return;
      const key = `${secId}::${asgn.subjectId}`;
      const list = sectionSubjPeriods.get(key) || [];
      list.push(pNum);
      sectionSubjPeriods.set(key, list);
    });
    let totalMultiDayInstances = 0;
    let horizontallyAlignedInstances = 0;
    sectionSubjPeriods.forEach((pList) => {
      if (pList.length <= 1) return;
      const freq = new Map();
      let maxFreq = 0;
      pList.forEach((p) => {
        const c = (freq.get(p) || 0) + 1;
        freq.set(p, c);
        if (c > maxFreq) maxFreq = c;
      });
      totalMultiDayInstances += pList.length;
      horizontallyAlignedInstances += maxFreq;
    });
    const horizontalContinuityPercent =
      totalMultiDayInstances > 0 ? Math.round((horizontallyAlignedInstances / totalMultiDayInstances) * 100) : 100;

    assignedEntries.forEach(([cellKey, asgn]) => {
      if (asgn?.teacherId) {
        teacherPeriodCounts[asgn.teacherId] = (teacherPeriodCounts[asgn.teacherId] || 0) + 1;
      }
      if (Array.isArray(asgn?.coTeacherIds)) {
        asgn.coTeacherIds.forEach((coTid) => {
          if (coTid) {
            teacherPeriodCounts[coTid] = (teacherPeriodCounts[coTid] || 0) + 1;
          }
        });
      }
    });

    const levelKey = scheduleType === "jhs" ? "jhs" : "shs";
    const levelConfig = activeConfig?.[levelKey] || (scheduleType === "jhs" ? activeConfig?.jhs : activeConfig?.shs) || {};
    const effectiveConstraints = {
      ...(activeConfig?.constraints || {}),
      ...(levelConfig?.constraints || {}),
    };
    const maxCap = Number(effectiveConstraints.maxTeachingLoadCap) || 24;
    let balancedCount = 0;
    let underloadCount = 0;
    let overloadCount = 0;
    let unassignedCount = 0;

    activeTeachers.forEach((t) => {
      const p = teacherPeriodCounts[t.id] || 0;
      const isAdviser = Boolean(
        t.isClassAdviser ||
        (Array.isArray(t.ancillaryAssignments) && t.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
      );
      const isPartTime = Boolean(
        (t?.workingArrangement && String(t.workingArrangement).toLowerCase().includes("part")) ||
        (t?.employmentStatus && String(t.employmentStatus).toLowerCase().includes("part"))
      );
      const isMajorAncillary = Boolean(
        Array.isArray(t?.ancillaryAssignments) && t.ancillaryAssignments.some((a) => {
          const l = String(a).toLowerCase();
          return l.includes("drrm") || l.includes("ict") || l.includes("custodian") || l.includes("guidance") || l.includes("registrar") || l.includes("canteen") || l.includes("testing");
        })
      );
      const targetMin = isPartTime ? 10 : (isAdviser ? 14 : (isMajorAncillary ? 10 : 14));
      const targetMax = isPartTime ? 20 : (isAdviser ? 25 : (isMajorAncillary ? 26 : 30));

      if (p === 0) {
        unassignedCount += 1;
      } else if (p > targetMax) {
        overloadCount += 1;
      } else if (p >= targetMin) {
        balancedCount += 1;
      } else {
        underloadCount += 1;
      }
    });

    setGenerationSummary({
      scheduleType,
      scheduleTypeLabel: getScheduleTypeLabel(scheduleType),
      sectionsCount: sections.length,
      totalPeriodsAssigned: totalAssignedPeriods,
      conflictsCount: unresolved,
      balancedTeachers: balancedCount,
      underloadTeachers: underloadCount,
      overloadTeachers: overloadCount,
      unassignedTeachers: unassignedCount,
      totalTeachers: activeTeachers.length,
      activeTeachersCount: activeTeachers.length - unassignedCount,
      elapsedMs,
      elapsedSeconds,
      horizontalContinuityPercent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  };

  const handleAutoFixAllConflicts = () => {
    if (isAutoFixing) return;
    if (!schedule) {
      showNotice("Generate or load a schedule first.", "error");
      return;
    }

    setIsAutoFixing(true);
    window.setTimeout(() => {
      try {
        const normalizeSectionString = (value) => String(value || "").replace(/\s+/g, "").replace(/[-–—]/g, "").toLowerCase();

        const findSectionByLabel = (label) => {
          let sectionObj = sections.find((sec) => normalizeSectionString(formatConflictSectionName(sec)) === normalizeSectionString(label));
          if (!sectionObj) {
            sectionObj = sections.find((sec) => {
              const code = sec.code || "";
              const name = sec.name || "";
              const grade = sec.grade ? String(sec.grade) : "";
              return (
                normalizeSectionString(code) === normalizeSectionString(label) ||
                normalizeSectionString(name) === normalizeSectionString(label) ||
                normalizeSectionString(`${grade}${name}`) === normalizeSectionString(label) ||
                normalizeSectionString(`${grade}-${name}`) === normalizeSectionString(label)
              );
            });
          }
          return sectionObj;
        };

        let workingAssignments = { ...(effectiveAssignmentsForDisplay || schedule.assignments || {}) };
        let workingDrafts = { ...(cellEditorDrafts || {}) };
        let fixedCount = 0;
        let pass = 0;
        const maxPasses = 60;

        const getEvaluation = (assignments) =>
          evaluateSchedule({
            assignments,
            sections,
            slots,
            subjects,
            teachers: activeTeachers,
            scheduleType,
            config,
          });

        const beforeCount = (getEvaluation(workingAssignments).conflicts || []).length;

        while (pass < maxPasses) {
          pass += 1;

          const evaluation = getEvaluation(workingAssignments);
          const conflictDetails = Array.isArray(evaluation.conflictDetails) ? evaluation.conflictDetails : [];
          if (conflictDetails.length === 0) {
            break;
          }

          let appliedThisPass = false;

      for (const detail of conflictDetails) {
        const message = detail?.message || "";
        const cellKeys = Array.isArray(detail?.cellKeys) ? detail.cellKeys : [];

        // -------------------------------------------------------------
        // Strategy 0.1: Invalid assignment reference in cell
        // -------------------------------------------------------------
        if (message.includes("Invalid assignment reference in")) {
          const keysToClean = cellKeys.length > 0 ? cellKeys : Object.keys(workingAssignments).filter((ck) => message.includes(ck));
          keysToClean.forEach((ck) => {
            delete workingDrafts[ck];
            delete workingAssignments[ck];
          });
          fixedCount += 1;
          appliedThisPass = true;
          break;
        }

        // -------------------------------------------------------------
        // Strategy 0.2: Period not valid for section settings
        // -------------------------------------------------------------
        if (message.includes("period not valid for section settings")) {
          let resolved = false;
          for (const cellKey of cellKeys) {
            const [sectionId, slotId] = splitCellKey(cellKey);
            const sectionObj = sectionsById.get(sectionId);
            const currentAssignment = workingDrafts[cellKey] || workingAssignments[cellKey];
            const subjectObj = currentAssignment?.subjectId ? subjectsById.get(currentAssignment.subjectId) : null;
            const currentTeacher = currentAssignment?.teacherId ? facultyById.get(currentAssignment.teacherId) : null;

            if (sectionObj && subjectObj) {
              const validSlots = slots.filter((s) => isSlotValidForSection(sectionObj, s, scheduleType, config));
              const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);
              const openValidSlots = validSlots.filter((s) => !workingAssignments[createCellKey(sectionObj.id, s.id)]);

              let targetSlot = null;
              let targetTeacher = null;

              for (const openSlot of openValidSlots) {
                if (
                  isSubjectRestrictedForSlot(subjectObj, openSlot, config?.constraints, config, scheduleType, {
                    section: sectionObj,
                    assignments: workingAssignments,
                    slotsById,
                    subjectsById,
                    excludeCellKey: cellKey,
                  })
                ) {
                  continue;
                }
                if (currentTeacher && isTeacherEligible({ teacher: currentTeacher, subject: subjectObj, section: sectionObj, slot: openSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId })) {
                  targetSlot = openSlot;
                  targetTeacher = currentTeacher;
                  break;
                }
              }

              if (!targetSlot) {
                for (const openSlot of openValidSlots) {
                  if (
                    isSubjectRestrictedForSlot(subjectObj, openSlot, config?.constraints, config, scheduleType, {
                      section: sectionObj,
                      assignments: workingAssignments,
                      slotsById,
                      subjectsById,
                      excludeCellKey: cellKey,
                    })
                  ) {
                    continue;
                  }
                  const candTeacher = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: subjectObj, section: sectionObj, slot: openSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId }));
                  if (candTeacher) {
                    targetSlot = openSlot;
                    targetTeacher = candTeacher;
                    break;
                  }
                }
              }

              if (targetSlot && targetTeacher) {
                const targetKey = createCellKey(sectionObj.id, targetSlot.id);
                delete workingDrafts[cellKey];
                delete workingAssignments[cellKey];
                workingDrafts[targetKey] = { subjectId: subjectObj.id, teacherId: targetTeacher.id };
                workingAssignments[targetKey] = { subjectId: subjectObj.id, teacherId: targetTeacher.id, source: "auto-fix", updatedAt: new Date().toISOString() };
                resolved = true;
              } else {
                delete workingDrafts[cellKey];
                delete workingAssignments[cellKey];
                resolved = true;
              }
            } else {
              delete workingDrafts[cellKey];
              delete workingAssignments[cellKey];
              resolved = true;
            }
            if (resolved) break;
          }
          if (resolved) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        // -------------------------------------------------------------
        // Strategy 0: Under-scheduled subject (Missing recurring daily periods)
        // -------------------------------------------------------------
        if (message.includes("required recurring daily period")) {
          const match = message.match(/^(.*?):\s*(.*?)\s+has\s+(\d+)\s+of\s+(\d+)\s+required recurring daily period/i);
          let targetSection = null;
          let targetSubject = null;
          let assignedCount = 0;
          let requiredCount = 0;

          if (match) {
            const secLabel = match[1].trim();
            const subLabel = match[2].trim();
            assignedCount = parseInt(match[3], 10) || 0;
            requiredCount = parseInt(match[4], 10) || 0;

            targetSection = findSectionByLabel(secLabel);
            if (targetSection) {
              const eligibleSubjs = getSubjectsForSection(targetSection, subjects, scheduleType);
              targetSubject = eligibleSubjs.find(
                (s) =>
                  (s.subjectName || "").trim().toLowerCase() === subLabel.toLowerCase() ||
                  (s.subjectCode || "").trim().toLowerCase() === subLabel.toLowerCase() ||
                  (s.name || "").trim().toLowerCase() === subLabel.toLowerCase() ||
                  (s.code || "").trim().toLowerCase() === subLabel.toLowerCase() ||
                  s.id === subLabel
              );
            }
          }

          if (targetSection && targetSubject && assignedCount < requiredCount) {
            const sectionObj = targetSection;
            const subjectObj = targetSubject;
            const sectionId = sectionObj.id;

            // Get all cell keys for this section
            const sectionCellKeys = Object.keys(workingAssignments).filter(
              (ck) => splitCellKey(ck)[0] === sectionId
            );

            // Find which teacher is already assigned to this subject in this section if any
            let sectionSubjectTeacherId = null;
            sectionCellKeys.forEach((ck) => {
              const assign = workingDrafts[ck] || workingAssignments[ck];
              if (assign && assign.subjectId === subjectObj.id) {
                if (assign.teacherId) sectionSubjectTeacherId = assign.teacherId;
              }
            });

            const levelConfig = scheduleType === "jhs" ? config?.jhs : config?.shs;
            const activeDaysList = extractDaysFromLevelConfig(levelConfig)?.daySequence || [];
            const totalDaysCount = activeDaysList.length || 5;
            const isDouble = Boolean(subjectObj.isDoublePeriod);
            const maxPerDay = isDouble ? 2 : (requiredCount > totalDaysCount ? Math.ceil(requiredCount / totalDaysCount) : 1);

            // Get valid slots for this section
            const validSlots = slots.filter((slot) => isSlotValidForSection(sectionObj, slot, scheduleType, config));

            // Find empty slots for this section
            const emptySlots = validSlots.filter((slot) => {
              const ck = createCellKey(sectionId, slot.id);
              return !workingAssignments[ck];
            });

            // Filter for empty slots on days that haven't reached maxPerDay for this subject
            const candidateSlots = emptySlots.filter((slot) => {
              const day = slot.day || "Monday";
              const currentDayCount = sectionCellKeys.filter((ck) => {
                const [, sId] = splitCellKey(ck);
                const s = slotsById.get(sId);
                if (s?.day !== day) return false;
                const a = workingDrafts[ck] || workingAssignments[ck];
                return a?.subjectId === subjectObj.id;
              }).length;
              if (currentDayCount >= maxPerDay) return false;
              if (
                isSubjectRestrictedForSlot(subjectObj, slot, config?.constraints, config, scheduleType, {
                  section: sectionObj,
                  assignments: workingAssignments,
                  slotsById,
                  subjectsById,
                })
              ) {
                return false;
              }
              return true;
            });

            let placed = false;
            const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);

            // 1. Direct Placement into an empty slot
            for (const slot of candidateSlots) {
              if (isSubjectMultiTeacher(subjectObj)) {
                const breakoutTeam = selectBreakoutTeachersForSlot({
                  subject: subjectObj,
                  section: sectionObj,
                  slot,
                  config,
                  activeTeachers,
                  teacherBusyBySlot: busyMap,
                  constraints: config?.constraints,
                  enforceMaxLoadCap: false,
                });
                if (breakoutTeam && breakoutTeam.allAssigned) {
                  const newCellKey = createCellKey(sectionId, slot.id);
                  const newPayload = {
                    subjectId: subjectObj.id,
                    teacherId: breakoutTeam.primaryTeacher.id,
                    coTeacherIds: breakoutTeam.coTeacherIds,
                    breakoutAssignments: breakoutTeam.breakoutAssignments,
                    breakoutNote: breakoutTeam.breakoutNote,
                    source: "auto-fix",
                    updatedAt: new Date().toISOString(),
                  };
                  workingDrafts[newCellKey] = {
                    subjectId: subjectObj.id,
                    teacherId: breakoutTeam.primaryTeacher.id,
                    coTeacherIds: breakoutTeam.coTeacherIds,
                    breakoutAssignments: breakoutTeam.breakoutAssignments,
                    breakoutNote: breakoutTeam.breakoutNote,
                  };
                  workingAssignments[newCellKey] = newPayload;
                  fixedCount += 1;
                  appliedThisPass = true;
                  placed = true;
                  break;
                }
                continue;
              }

              let candidateTeacher = null;
              if (sectionSubjectTeacherId) {
                const t = facultyById.get(sectionSubjectTeacherId);
                if (t && isTeacherEligible({ teacher: t, subject: subjectObj, section: sectionObj, slot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId })) {
                  candidateTeacher = t;
                }
              }

              if (!candidateTeacher) {
                candidateTeacher = activeTeachers.find((t) =>
                  isTeacherEligible({ teacher: t, subject: subjectObj, section: sectionObj, slot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId })
                );
              }

              if (candidateTeacher) {
                const newCellKey = createCellKey(sectionId, slot.id);
                workingDrafts[newCellKey] = { subjectId: subjectObj.id, teacherId: candidateTeacher.id };
                workingAssignments[newCellKey] = {
                  subjectId: subjectObj.id,
                  teacherId: candidateTeacher.id,
                  source: "auto-fix",
                  updatedAt: new Date().toISOString(),
                };
                fixedCount += 1;
                appliedThisPass = true;
                placed = true;
                break;
              }
            }

            // 2. Intra-Section Relocation: Dynamic "last" placement or moving another flexible subject to an empty slot
            const allPlacementRulesForAutoFix = getAllPlacementRules(config, scheduleType);
            if (!placed && isDynamicLastPeriodSubject(subjectObj, allPlacementRulesForAutoFix)) {
              const effectiveAutoSubj = (() => {
                const pR = findPlacementRuleForSubject(subjectObj, allPlacementRulesForAutoFix);
                return pR ? { ...subjectObj, ...pR } : subjectObj;
              })();
              const baseDaysList = activeDaysList.length > 0 ? activeDaysList : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
              const prefDay = effectiveAutoSubj.preferredDay && effectiveAutoSubj.preferredDay !== "any" ? effectiveAutoSubj.preferredDay : null;
              const candDays = (prefDay ? baseDaysList.filter((d) => d === prefDay) : baseDaysList.slice()).filter((d) => {
                const dayCount = sectionCellKeys.filter((ck) => {
                  const [, sId] = splitCellKey(ck);
                  return slotsById.get(sId)?.day === d && (workingDrafts[ck] || workingAssignments[ck])?.subjectId === subjectObj.id;
                }).length;
                return dayCount < maxPerDay;
              });
              const lastPlan = computeDynamicLastPlacementPlan({
                section: sectionObj,
                targetSubject: effectiveAutoSubj,
                candidateDays: candDays,
                assignments: workingAssignments,
                drafts: workingDrafts,
                validSectionSlots: validSlots,
                slotsById,
                subjectsById,
                sectionsById,
                facultyById,
                activeTeachers,
                config,
                scheduleType,
                preferTeacherId: sectionSubjectTeacherId,
              });
              if (lastPlan?.nextAssignments) {
                workingAssignments = lastPlan.nextAssignments;
                workingDrafts = lastPlan.nextDrafts;
                fixedCount += 1;
                appliedThisPass = true;
                placed = true;
              }
            }

            if (!placed && emptySlots.length > 0) {
              for (const occupiedKey of sectionCellKeys) {
                const [, occSlotId] = splitCellKey(occupiedKey);
                const occSlot = slotsById.get(occSlotId);
                if (!occSlot) continue;
                const occAssign = workingDrafts[occupiedKey] || workingAssignments[occupiedKey];
                if (!occAssign || occAssign.subjectId === subjectObj.id) continue;

                const occSubject = subjectsById.get(occAssign.subjectId);
                if (!occSubject) continue;

                if (isPlacementLockedSubject(occSubject, allPlacementRulesForAutoFix)) {
                  continue;
                }

                if (
                  isSubjectRestrictedForSlot(subjectObj, occSlot, config?.constraints, config, scheduleType, {
                    section: sectionObj,
                    assignments: workingAssignments,
                    slotsById,
                    subjectsById,
                    excludeCellKey: occupiedKey,
                  })
                ) {
                  continue;
                }

                const occDay = occSlot.day || "Monday";
                const currentDayCount = sectionCellKeys.filter((ck) => {
                  if (ck === occupiedKey) return false;
                  const [, sId] = splitCellKey(ck);
                  const s = slotsById.get(sId);
                  if (s?.day !== occDay) return false;
                  const a = workingDrafts[ck] || workingAssignments[ck];
                  return a?.subjectId === subjectObj.id;
                }).length;
                if (currentDayCount >= maxPerDay) continue;

                for (const emptySlot of emptySlots) {
                  if (emptySlot.id === occSlot.id) continue;
                  if (
                    isSubjectRestrictedForSlot(occSubject, emptySlot, config?.constraints, config, scheduleType, {
                      section: sectionObj,
                      assignments: workingAssignments,
                      slotsById,
                      subjectsById,
                      excludeCellKey: occupiedKey,
                    })
                  ) {
                    continue;
                  }

                  const emptyDay = emptySlot.day || "Monday";
                  const emptyDayMax = getSectionDayMaxPeriod(sectionObj, emptyDay, scheduleType, config, emptySlot);
                  const emptyDayInfo = getDynamicLastPeriodInfo({
                    sectionId,
                    day: emptyDay,
                    assignments: workingAssignments,
                    slotsById,
                    subjectsById,
                    placementRules: allPlacementRulesForAutoFix,
                    excludeCellKey: occupiedKey,
                    dayMaxPeriod: emptyDayMax,
                  });
                  if (emptyDayInfo.otherLastPeriods.length > 0 && Number(emptySlot.period || 0) >= Math.min(...emptyDayInfo.otherLastPeriods)) {
                    continue;
                  }

                  const occClassesPerWeek = parseBoundedNumber(occSubject?.classesPerWeek, 1, 12, 4);
                  const occMaxPerDay = occSubject.isDoublePeriod ? 2 : (occClassesPerWeek > totalDaysCount ? Math.ceil(occClassesPerWeek / totalDaysCount) : 1);
                  const occCountOnEmptyDay = sectionCellKeys.filter((ck) => {
                    if (ck === occupiedKey) return false;
                    const [, sId] = splitCellKey(ck);
                    const s = slotsById.get(sId);
                    if (s?.day !== emptyDay) return false;
                    const a = workingDrafts[ck] || workingAssignments[ck];
                    return a?.subjectId === occSubject.id;
                  }).length;
                  if (occCountOnEmptyDay >= occMaxPerDay) continue;

                  let occTeacher = facultyById.get(occAssign.teacherId);
                  if (!occTeacher || !isTeacherEligible({ teacher: occTeacher, subject: occSubject, section: sectionObj, slot: emptySlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId })) {
                    occTeacher = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: occSubject, section: sectionObj, slot: emptySlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId }));
                  }
                  if (!occTeacher) continue;

                  const tempAssignments = { ...workingAssignments };
                  delete tempAssignments[occupiedKey];
                  const tempBusyMap = buildTeacherBusyMap(tempAssignments, sectionsById, slotsById);

                  let targetTeacher = null;
                  if (sectionSubjectTeacherId) {
                    const t = facultyById.get(sectionSubjectTeacherId);
                    if (t && isTeacherEligible({ teacher: t, subject: subjectObj, section: sectionObj, slot: occSlot, constraints: config?.constraints, teacherBusyBySlot: tempBusyMap, excludedSectionId: sectionId })) {
                      targetTeacher = t;
                    }
                  }
                  if (!targetTeacher) {
                    targetTeacher = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: subjectObj, section: sectionObj, slot: occSlot, constraints: config?.constraints, teacherBusyBySlot: tempBusyMap, excludedSectionId: sectionId }));
                  }
                  if (!targetTeacher) continue;

                  const emptyCellKey = createCellKey(sectionId, emptySlot.id);
                  workingDrafts[emptyCellKey] = { subjectId: occSubject.id, teacherId: occTeacher.id };
                  workingAssignments[emptyCellKey] = { subjectId: occSubject.id, teacherId: occTeacher.id, source: "auto-fix", updatedAt: new Date().toISOString() };

                  workingDrafts[occupiedKey] = { subjectId: subjectObj.id, teacherId: targetTeacher.id };
                  workingAssignments[occupiedKey] = { subjectId: subjectObj.id, teacherId: targetTeacher.id, source: "auto-fix", updatedAt: new Date().toISOString() };

                  fixedCount += 1;
                  appliedThisPass = true;
                  placed = true;
                  break;
                }

                if (placed) break;
              }
            }

            // 3. Excess-quota subject replacement
            if (!placed) {
              const subjectCounts = new Map();
              sectionCellKeys.forEach((ck) => {
                const a = workingDrafts[ck] || workingAssignments[ck];
                if (a?.subjectId) {
                  subjectCounts.set(a.subjectId, (subjectCounts.get(a.subjectId) || 0) + 1);
                }
              });

              for (const [sId, count] of subjectCounts.entries()) {
                const otherSub = subjectsById.get(sId);
                const otherRequired = parseBoundedNumber(otherSub?.classesPerWeek, 1, 12, 4);
                if (count > otherRequired) {
                  const replaceableKeys = sectionCellKeys.filter((ck) => {
                    const a = workingDrafts[ck] || workingAssignments[ck];
                    return a?.subjectId === sId;
                  });

                  for (const repKey of replaceableKeys) {
                    const [, rSlotId] = splitCellKey(repKey);
                    const rSlot = slotsById.get(rSlotId);
                    if (!rSlot) continue;
                    if (
                      isSubjectRestrictedForSlot(subjectObj, rSlot, config?.constraints, config, scheduleType, {
                        section: sectionObj,
                        assignments: workingAssignments,
                        slotsById,
                        subjectsById,
                        excludeCellKey: repKey,
                      })
                    ) {
                      continue;
                    }

                    const rDay = rSlot.day || "Monday";
                    const dayCount = sectionCellKeys.filter((ck) => {
                      if (ck === repKey) return false;
                      const [, s] = splitCellKey(ck);
                      const sl = slotsById.get(s);
                      if (sl?.day !== rDay) return false;
                      const a = workingDrafts[ck] || workingAssignments[ck];
                      return a?.subjectId === subjectObj.id;
                    }).length;
                    if (dayCount >= maxPerDay) continue;

                    const tempBusyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);
                    let repTeacher = null;
                    if (sectionSubjectTeacherId) {
                      const t = facultyById.get(sectionSubjectTeacherId);
                      if (t && isTeacherEligible({ teacher: t, subject: subjectObj, section: sectionObj, slot: rSlot, constraints: config?.constraints, teacherBusyBySlot: tempBusyMap, excludedSectionId: sectionId })) {
                        repTeacher = t;
                      }
                    }
                    if (!repTeacher) {
                      repTeacher = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: subjectObj, section: sectionObj, slot: rSlot, constraints: config?.constraints, teacherBusyBySlot: tempBusyMap, excludedSectionId: sectionId }));
                    }

                    if (repTeacher) {
                      workingDrafts[repKey] = { subjectId: subjectObj.id, teacherId: repTeacher.id };
                      workingAssignments[repKey] = { subjectId: subjectObj.id, teacherId: repTeacher.id, source: "auto-fix", updatedAt: new Date().toISOString() };
                      fixedCount += 1;
                      appliedThisPass = true;
                      placed = true;
                      break;
                    }
                  }
                  if (placed) break;
                }
              }
            }

            if (appliedThisPass) {
              break;
            }
          }
        }

        if (cellKeys.length === 0) continue;

        // -------------------------------------------------------------
        // Strategy 0.3: Multi-Teacher / Joined Subject Incomplete Assignment
        // -------------------------------------------------------------
        if (message.includes("requires") && message.includes("teachers")) {
          let resolvedMulti = false;
          for (const cellKey of cellKeys) {
            const [sectionId, slotId] = splitCellKey(cellKey);
            const sectionObj = sectionsById.get(sectionId);
            const slot = slotsById.get(slotId);
            const currentAsgn = workingDrafts[cellKey] || workingAssignments[cellKey];
            const subjectObj = currentAsgn?.subjectId ? subjectsById.get(currentAsgn.subjectId) : null;
            if (!sectionObj || !slot || !subjectObj || !isSubjectMultiTeacher(subjectObj)) continue;

            const tempAssignments = { ...workingAssignments };
            delete tempAssignments[cellKey];
            const busyMap = buildTeacherBusyMap(tempAssignments, sectionsById, slotsById);

            const breakoutTeam = selectBreakoutTeachersForSlot({
              subject: subjectObj,
              section: sectionObj,
              slot,
              config,
              activeTeachers,
              teacherBusyBySlot: busyMap,
              constraints: config?.constraints,
              preferredBreakouts: currentAsgn?.breakoutAssignments || null,
              enforceMaxLoadCap: false,
            });

            if (breakoutTeam && breakoutTeam.allAssigned) {
              workingDrafts[cellKey] = {
                subjectId: subjectObj.id,
                teacherId: breakoutTeam.primaryTeacher.id,
                coTeacherIds: breakoutTeam.coTeacherIds,
                breakoutAssignments: breakoutTeam.breakoutAssignments,
                breakoutNote: breakoutTeam.breakoutNote,
              };
              workingAssignments[cellKey] = {
                subjectId: subjectObj.id,
                teacherId: breakoutTeam.primaryTeacher.id,
                coTeacherIds: breakoutTeam.coTeacherIds,
                breakoutAssignments: breakoutTeam.breakoutAssignments,
                breakoutNote: breakoutTeam.breakoutNote,
                source: "auto-fix",
                updatedAt: new Date().toISOString(),
              };
              resolvedMulti = true;
              break;
            }
          }

          if (resolvedMulti) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        // -------------------------------------------------------------
        // Strategy 0.5: Subject Not Eligible for Section
        // -------------------------------------------------------------
        if (message.includes("is not eligible for this section")) {
          let resolved = false;
          for (const cellKey of cellKeys) {
            const [sectionId, slotId] = splitCellKey(cellKey);
            const sectionObj = sectionsById.get(sectionId);
            const slot = slotsById.get(slotId);
            if (!sectionObj || !slot) continue;

            const sectionCellKeys = Object.keys(workingAssignments).filter(
              (ck) => splitCellKey(ck)[0] === sectionObj.id && ck !== cellKey
            );
            const eligibleSubjs = getSubjectsForSection(sectionObj, subjects, scheduleType);
            const subjectCounts = new Map();
            sectionCellKeys.forEach((ck) => {
              const a = workingDrafts[ck] || workingAssignments[ck];
              if (a?.subjectId) subjectCounts.set(a.subjectId, (subjectCounts.get(a.subjectId) || 0) + 1);
            });

            // 1. Try replacing with an under-scheduled eligible subject
            const underQuotaSubjs = eligibleSubjs.filter((s) => {
              const count = subjectCounts.get(s.id) || 0;
              const req = parseBoundedNumber(s.classesPerWeek, 1, 12, 4);
              return count < req;
            });

            const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);

            for (const repSubj of underQuotaSubjs) {
              const teacher = activeTeachers.find((t) =>
                isTeacherEligible({
                  teacher: t,
                  subject: repSubj,
                  section: sectionObj,
                  slot,
                  constraints: config?.constraints,
                  teacherBusyBySlot: busyMap,
                  excludedSectionId: sectionObj.id,
                })
              );

              if (teacher) {
                const testAssignments = {
                  ...workingAssignments,
                  [cellKey]: { subjectId: repSubj.id, teacherId: teacher.id, source: "auto-fix", updatedAt: new Date().toISOString() },
                };
                const testEval = getEvaluation(testAssignments);
                if (testEval.conflicts.length < evaluation.conflicts.length) {
                  workingDrafts[cellKey] = { subjectId: repSubj.id, teacherId: teacher.id };
                  workingAssignments[cellKey] = testAssignments[cellKey];
                  resolved = true;
                  break;
                }
              }
            }

            // 2. Fallback: If no replacement works without conflict, unassign/clear the ineligible cell
            if (!resolved) {
              const testAssignments = { ...workingAssignments };
              delete testAssignments[cellKey];
              const testEval = getEvaluation(testAssignments);
              if (testEval.conflicts.length < evaluation.conflicts.length) {
                delete workingDrafts[cellKey];
                delete workingAssignments[cellKey];
                resolved = true;
                break;
              }
            }

            if (resolved) break;
          }

          if (resolved) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        // -------------------------------------------------------------
        // Strategy 1: Same-Day Duplicate Subject or Weekly Quota Exceeded
        // -------------------------------------------------------------
        if (
          (message.includes("scheduled") && message.includes("times on")) ||
          message.includes("exceeding required") ||
          message.includes("duplicated in multiple")
        ) {
          let resolvedConflict = false;
          const [firstSectionId] = splitCellKey(cellKeys[0]);
          const sectionObj = sectionsById.get(firstSectionId);

          if (sectionObj && cellKeys.length > 0) {
            const firstAsgn = workingDrafts[cellKeys[0]] || workingAssignments[cellKeys[0]];
            const problemSubjectId = firstAsgn?.subjectId;
            const problemSubject = problemSubjectId ? subjectsById.get(problemSubjectId) : null;

            // Target the last assigned cell of this subject
            const targetKey = cellKeys[cellKeys.length - 1];
            const [, targetSlotId] = splitCellKey(targetKey);
            const targetSlot = slotsById.get(targetSlotId);

            const sectionCellKeys = Object.keys(workingAssignments).filter(
              (ck) => splitCellKey(ck)[0] === sectionObj.id && ck !== targetKey
            );

            // Step 1: If an eligible subject is missing/under-scheduled, replace the excess/duplicate cell with it
            const offeredSubjects = getSubjectsForSection(sectionObj, subjects, scheduleType);
            const subjectCounts = new Map();
            sectionCellKeys.forEach((ck) => {
              const sId = (workingDrafts[ck] || workingAssignments[ck])?.subjectId;
              if (sId) subjectCounts.set(sId, (subjectCounts.get(sId) || 0) + 1);
            });

            const underQuotaSubjects = offeredSubjects.filter((sb) => {
              const count = subjectCounts.get(sb.id) || 0;
              const req = parseBoundedNumber(sb.classesPerWeek, 1, 12, 4);
              return count < req;
            });

            const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);

            for (const repSubject of underQuotaSubjects) {
              if (
                targetSlot &&
                isSubjectRestrictedForSlot(repSubject, targetSlot, config?.constraints, config, scheduleType, {
                  section: sectionObj,
                  assignments: workingAssignments,
                  slotsById,
                  subjectsById,
                  excludeCellKey: targetKey,
                })
              ) {
                continue;
              }

              const repTeacher = activeTeachers.find((t) =>
                isTeacherEligible({
                  teacher: t,
                  subject: repSubject,
                  section: sectionObj,
                  slot: targetSlot,
                  constraints: config?.constraints,
                  teacherBusyBySlot: busyMap,
                  excludedSectionId: sectionObj.id,
                })
              );

              if (repTeacher) {
                const testAssignments = {
                  ...workingAssignments,
                  [targetKey]: { subjectId: repSubject.id, teacherId: repTeacher.id, source: "auto-fix", updatedAt: new Date().toISOString() },
                };
                const testEval = getEvaluation(testAssignments);
                if (testEval.conflicts.length < evaluation.conflicts.length) {
                  workingDrafts[targetKey] = { subjectId: repSubject.id, teacherId: repTeacher.id };
                  workingAssignments[targetKey] = testAssignments[targetKey];
                  resolvedConflict = true;
                  break;
                }
              }
            }

            // Step 2: Unassign the excess cell if weekly quota is exceeded or duplicate
            if (!resolvedConflict) {
              const testAssignments = { ...workingAssignments };
              delete testAssignments[targetKey];
              const testEval = getEvaluation(testAssignments);
              if (testEval.conflicts.length < evaluation.conflicts.length) {
                delete workingDrafts[targetKey];
                delete workingAssignments[targetKey];
                resolvedConflict = true;
              }
            }

            // Step 3: If it's a daily duplicate session and total weekly count is within quota, move to an open slot on another day
            if (!resolvedConflict && message.includes("times on") && targetSlot && problemSubject) {
              const validSlots = slots.filter((s) => isSlotValidForSection(sectionObj, s, scheduleType, config));
              const otherDayEmptySlots = validSlots.filter((s) => {
                if (s.day === targetSlot.day) return false;
                const ck = createCellKey(sectionObj.id, s.id);
                if (workingAssignments[ck]) return false;
                const hasSubOnDay = sectionCellKeys.some((k) => {
                  const [, sId] = splitCellKey(k);
                  return slotsById.get(sId)?.day === s.day && (workingDrafts[k] || workingAssignments[k])?.subjectId === problemSubjectId;
                });
                return !hasSubOnDay;
              });

              for (const emptySlot of otherDayEmptySlots) {
                const teacher = activeTeachers.find((t) =>
                  isTeacherEligible({
                    teacher: t,
                    subject: problemSubject,
                    section: sectionObj,
                    slot: emptySlot,
                    constraints: config?.constraints,
                    teacherBusyBySlot: busyMap,
                    excludedSectionId: sectionObj.id,
                  })
                );

                if (teacher) {
                  const newKey = createCellKey(sectionObj.id, emptySlot.id);
                  const testAssignments = { ...workingAssignments };
                  delete testAssignments[targetKey];
                  testAssignments[newKey] = { subjectId: problemSubject.id, teacherId: teacher.id, source: "auto-fix", updatedAt: new Date().toISOString() };
                  const testEval = getEvaluation(testAssignments);
                  if (testEval.conflicts.length < evaluation.conflicts.length) {
                    delete workingDrafts[targetKey];
                    delete workingAssignments[targetKey];
                    workingDrafts[newKey] = { subjectId: problemSubject.id, teacherId: teacher.id };
                    workingAssignments[newKey] = testAssignments[newKey];
                    resolvedConflict = true;
                    break;
                  }
                }
              }
            }
          }

          if (resolvedConflict) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        // -------------------------------------------------------------
        // Strategy 2: Teacher Double-Booking / Multiple-Booking
        // -------------------------------------------------------------
        if (message.includes("booked at") || message.includes("double-booked") || message.includes("multiple-booked")) {
          let changed = false;

          // Check all conflicting cells (from last to first) to give each section a chance to resolve
          for (let i = cellKeys.length - 1; i >= 0; i--) {
            const cellKey = cellKeys[i];
            const [sectionId, slotId] = splitCellKey(cellKey);
            const sectionObj = sectionsById.get(sectionId);
            const slot = slotsById.get(slotId);
            const currentAssignment = workingDrafts[cellKey] || workingAssignments[cellKey];
            const subjectObj = currentAssignment?.subjectId ? subjectsById.get(currentAssignment.subjectId) : null;

            if (sectionObj && slot && subjectObj) {
              const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);

              // Step 1: Try finding an available certified substitute teacher
              const replacementTeacher = activeTeachers.find(
                (teacher) =>
                  teacher.id !== currentAssignment?.teacherId &&
                  isTeacherEligible({
                    teacher,
                    subject: subjectObj,
                    section: sectionObj,
                    slot,
                    constraints: config?.constraints,
                    teacherBusyBySlot: busyMap,
                    excludedSectionId: sectionObj.id,
                  })
              );

              if (replacementTeacher) {
                workingDrafts[cellKey] = { subjectId: subjectObj.id, teacherId: replacementTeacher.id };
                workingAssignments[cellKey] = {
                  subjectId: subjectObj.id,
                  teacherId: replacementTeacher.id,
                  source: "auto-fix",
                  updatedAt: new Date().toISOString(),
                };
                changed = true;
                break;
              }

              // Step 2: Fallback: Move to an open slot in the section where current teacher is free
              if (!changed && currentAssignment?.teacherId) {
                const currentTeacher = facultyById.get(currentAssignment.teacherId);
                const sectionSlots = slots.filter((s) => isSlotValidForSection(sectionObj, s, scheduleType, config));
                const openSlots = sectionSlots.filter((s) => {
                  const ck = createCellKey(sectionObj.id, s.id);
                  return !workingAssignments[ck] && !busyMap.get(currentAssignment.teacherId)?.has(s.id);
                });

                for (const targetSlot of openSlots) {
                  if (
                    isSubjectRestrictedForSlot(subjectObj, targetSlot, config?.constraints, config, scheduleType, {
                      section: sectionObj,
                      assignments: workingAssignments,
                      slotsById,
                      subjectsById,
                      excludeCellKey: cellKey,
                    })
                  ) {
                    continue;
                  }
                  if (!currentTeacher || !isTeacherEligible({ teacher: currentTeacher, subject: subjectObj, section: sectionObj, slot: targetSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id })) continue;

                  const targetCellKey = createCellKey(sectionObj.id, targetSlot.id);
                  const testAssignments = { ...workingAssignments };
                  delete testAssignments[cellKey];
                  testAssignments[targetCellKey] = { subjectId: subjectObj.id, teacherId: currentTeacher.id, source: "auto-fix", updatedAt: new Date().toISOString() };

                  const testEval = getEvaluation(testAssignments);
                  if (testEval.conflicts.length < evaluation.conflicts.length) {
                    delete workingDrafts[cellKey];
                    delete workingAssignments[cellKey];
                    workingDrafts[targetCellKey] = { subjectId: subjectObj.id, teacherId: currentTeacher.id };
                    workingAssignments[targetCellKey] = testAssignments[targetCellKey];
                    changed = true;
                    break;
                  }
                }
              }

              // Step 3: Fallback: Intra-section swap with another class in section where both teachers are free
              if (!changed && currentAssignment?.teacherId) {
                const currentTeacher = facultyById.get(currentAssignment.teacherId);
                const sectionCells = Object.keys(workingAssignments).filter(
                  (ck) => splitCellKey(ck)[0] === sectionObj.id && ck !== cellKey
                );

                for (const otherCk of sectionCells) {
                  const [, otherSlotId] = splitCellKey(otherCk);
                  const otherSlot = slotsById.get(otherSlotId);
                  const otherAsgn = workingDrafts[otherCk] || workingAssignments[otherCk];
                  if (!otherSlot || !otherAsgn || !otherAsgn.teacherId || !otherAsgn.subjectId) continue;
                  if (otherAsgn.subjectId === subjectObj.id) continue;

                  const otherSubj = subjectsById.get(otherAsgn.subjectId);
                  const otherTeacher = facultyById.get(otherAsgn.teacherId);
                  if (!otherSubj || !otherTeacher || !currentTeacher) continue;

                  const curTeacherFreeAtOther = isTeacherEligible({ teacher: currentTeacher, subject: subjectObj, section: sectionObj, slot: otherSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id });
                  const otherTeacherFreeAtCur = isTeacherEligible({ teacher: otherTeacher, subject: otherSubj, section: sectionObj, slot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id });

                  if (curTeacherFreeAtOther && otherTeacherFreeAtCur) {
                    const testAssignments = {
                      ...workingAssignments,
                      [cellKey]: { subjectId: otherSubj.id, teacherId: otherTeacher.id, source: "auto-fix", updatedAt: new Date().toISOString() },
                      [otherCk]: { subjectId: subjectObj.id, teacherId: currentTeacher.id, source: "auto-fix", updatedAt: new Date().toISOString() },
                    };

                    const testEval = getEvaluation(testAssignments);
                    if (testEval.conflicts.length < evaluation.conflicts.length) {
                      workingDrafts[cellKey] = { subjectId: otherSubj.id, teacherId: otherTeacher.id };
                      workingAssignments[cellKey] = testAssignments[cellKey];
                      workingDrafts[otherCk] = { subjectId: subjectObj.id, teacherId: currentTeacher.id };
                      workingAssignments[otherCk] = testAssignments[otherCk];
                      changed = true;
                      break;
                    }
                  }
                }
              }

              if (changed) break;
            }
          }

          // Step 4: Fallback deadlock resolution: unassign the clash if all moves/swaps failed
          if (!changed && cellKeys.length > 0) {
            const fallbackKey = cellKeys[cellKeys.length - 1];
            delete workingDrafts[fallbackKey];
            delete workingAssignments[fallbackKey];
            changed = true;
          }

          if (changed) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        // -------------------------------------------------------------
        // Strategy 3: Subject & Teacher Restrictions, Unavailable, Expertise, Grade Mismatch
        // -------------------------------------------------------------
        if (
          message.includes("restricted") ||
          message.includes("unavailable") ||
          message.includes("expertise") ||
          message.includes("match Grade")
        ) {
          let changed = false;

          for (const cellKey of cellKeys) {
            const [sectionId, slotId] = splitCellKey(cellKey);
            const sectionObj = sectionsById.get(sectionId);
            const slot = slotsById.get(slotId);
            const currentAssignment = workingDrafts[cellKey] || workingAssignments[cellKey];
            const subjectObj = currentAssignment?.subjectId ? subjectsById.get(currentAssignment.subjectId) : null;
            const currentTeacher = currentAssignment?.teacherId ? facultyById.get(currentAssignment.teacherId) : null;

            if (sectionObj && slot && subjectObj) {
              const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);
              const allPlacementRules3 = getAllPlacementRules(config, scheduleType);

              // 3A. If SUBJECT itself is restricted at this period:
              const isSubjectRestricted = isSubjectRestrictedForSlot(subjectObj, slot, config?.constraints, config, scheduleType, {
                section: sectionObj,
                assignments: workingAssignments,
                slotsById,
                subjectsById,
                excludeCellKey: cellKey,
              });
              if (isSubjectRestricted) {
                // Move subject to open slot where it is not restricted
                const validSlots = slots.filter((s) => isSlotValidForSection(sectionObj, s, scheduleType, config));
                const openSlots = validSlots.filter((s) => {
                  const ck = createCellKey(sectionObj.id, s.id);
                  if (workingAssignments[ck]) return false;
                  if (isSubjectRestrictedForSlot(subjectObj, s, config?.constraints, config, scheduleType, {
                    section: sectionObj,
                    assignments: workingAssignments,
                    slotsById,
                    subjectsById,
                    excludeCellKey: cellKey,
                  })) return false;
                  if (!isDynamicLastPeriodSubject(subjectObj, allPlacementRules3)) {
                    const targetLastInfo = getDynamicLastPeriodInfo({
                      sectionId: sectionObj.id,
                      day: s.day,
                      assignments: workingAssignments,
                      slotsById,
                      subjectsById,
                      placementRules: allPlacementRules3,
                      excludeCellKey: cellKey,
                      dayMaxPeriod: getSectionDayMaxPeriod(sectionObj, s.day, scheduleType, config, s),
                    });
                    if (targetLastInfo.otherLastPeriods.length > 0 && Number(s.period || 0) >= Math.min(...targetLastInfo.otherLastPeriods)) {
                      return false;
                    }
                  }
                  return currentTeacher ? !busyMap.get(currentTeacher.id)?.has(s.id) : true;
                });

                for (const openSlot of openSlots) {
                  let t = currentTeacher && isTeacherEligible({ teacher: currentTeacher, subject: subjectObj, section: sectionObj, slot: openSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId }) ? currentTeacher : null;
                  if (!t) {
                    t = activeTeachers.find((tch) => isTeacherEligible({ teacher: tch, subject: subjectObj, section: sectionObj, slot: openSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId }));
                  }
                  if (t) {
                    const newKey = createCellKey(sectionObj.id, openSlot.id);
                    delete workingDrafts[cellKey];
                    delete workingAssignments[cellKey];
                    workingDrafts[newKey] = { subjectId: subjectObj.id, teacherId: t.id };
                    workingAssignments[newKey] = { subjectId: subjectObj.id, teacherId: t.id, source: "auto-fix", updatedAt: new Date().toISOString() };
                    changed = true;
                    break;
                  }
                }

                if (!changed && isDynamicLastPeriodSubject(subjectObj, allPlacementRules3)) {
                  const pRule3 = findPlacementRuleForSubject(subjectObj, allPlacementRules3);
                  const effSubj3 = pRule3 ? { ...subjectObj, ...pRule3 } : subjectObj;
                  const candidateDays =
                    effSubj3.preferredDay && effSubj3.preferredDay !== "any"
                      ? [effSubj3.preferredDay]
                      : Array.from(new Set(validSlots.map((s) => s.day).filter(Boolean)));
                  const dynamicPlan = computeDynamicLastPlacementPlan({
                    section: sectionObj,
                    targetSubject: subjectObj,
                    candidateDays,
                    assignments: workingAssignments,
                    drafts: workingDrafts,
                    validSectionSlots: validSlots,
                    slotsById,
                    subjectsById,
                    sectionsById,
                    facultyById,
                    activeTeachers,
                    config,
                    scheduleType,
                    preferTeacherId: currentTeacher?.id || null,
                    excludeCellKey: cellKey,
                  });
                  if (dynamicPlan) {
                    Object.keys(workingAssignments).forEach((k) => delete workingAssignments[k]);
                    Object.assign(workingAssignments, dynamicPlan.nextAssignments);
                    Object.keys(workingDrafts).forEach((k) => delete workingDrafts[k]);
                    Object.assign(workingDrafts, dynamicPlan.nextDrafts);
                    changed = true;
                  }
                }

                // If no open slot, try intra-section swap
                if (!changed && !isDynamicLastPeriodSubject(subjectObj, allPlacementRules3)) {
                  const sectionCells = Object.keys(workingAssignments).filter((ck) => splitCellKey(ck)[0] === sectionObj.id && ck !== cellKey);
                  for (const otherCk of sectionCells) {
                    const [, oSlotId] = splitCellKey(otherCk);
                    const otherSlot = slotsById.get(oSlotId);
                    const otherAsgn = workingDrafts[otherCk] || workingAssignments[otherCk];
                    const otherSubj = otherAsgn?.subjectId ? subjectsById.get(otherAsgn.subjectId) : null;
                    const otherTeacher = otherAsgn?.teacherId ? facultyById.get(otherAsgn.teacherId) : null;
                    if (!otherSlot || !otherSubj || !otherTeacher) continue;
                    if (isPlacementLockedSubject(otherSubj, allPlacementRules3)) continue;
                    if (isSubjectRestrictedForSlot(subjectObj, otherSlot, config?.constraints, config, scheduleType, {
                      section: sectionObj,
                      assignments: workingAssignments,
                      slotsById,
                      subjectsById,
                      excludeCellKey: otherCk,
                    })) continue;
                    if (isSubjectRestrictedForSlot(otherSubj, slot, config?.constraints, config, scheduleType, {
                      section: sectionObj,
                      assignments: workingAssignments,
                      slotsById,
                      subjectsById,
                      excludeCellKey: cellKey,
                    })) continue;
                    if (otherSlot.day !== slot.day) {
                      const slotLastInfo = getDynamicLastPeriodInfo({
                        sectionId: sectionObj.id,
                        day: slot.day,
                        assignments: workingAssignments,
                        slotsById,
                        subjectsById,
                        placementRules: allPlacementRules3,
                        excludeCellKey: cellKey,
                        dayMaxPeriod: getSectionDayMaxPeriod(sectionObj, slot.day, scheduleType, config, slot),
                      });
                      const otherLastInfo = getDynamicLastPeriodInfo({
                        sectionId: sectionObj.id,
                        day: otherSlot.day,
                        assignments: workingAssignments,
                        slotsById,
                        subjectsById,
                        placementRules: allPlacementRules3,
                        excludeCellKey: otherCk,
                        dayMaxPeriod: getSectionDayMaxPeriod(sectionObj, otherSlot.day, scheduleType, config, otherSlot),
                      });
                      if (slotLastInfo.otherLastPeriods.length > 0 && Number(slot.period || 0) >= Math.min(...slotLastInfo.otherLastPeriods)) continue;
                      if (otherLastInfo.otherLastPeriods.length > 0 && Number(otherSlot.period || 0) >= Math.min(...otherLastInfo.otherLastPeriods)) continue;
                    }

                    let curOk = currentTeacher && isTeacherEligible({ teacher: currentTeacher, subject: subjectObj, section: sectionObj, slot: otherSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId });
                    let othOk = isTeacherEligible({ teacher: otherTeacher, subject: otherSubj, section: sectionObj, slot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId });

                    if (curOk && othOk) {
                      workingDrafts[cellKey] = { subjectId: otherSubj.id, teacherId: otherTeacher.id };
                      workingAssignments[cellKey] = { subjectId: otherSubj.id, teacherId: otherTeacher.id, source: "auto-fix", updatedAt: new Date().toISOString() };
                      workingDrafts[otherCk] = { subjectId: subjectObj.id, teacherId: currentTeacher.id };
                      workingAssignments[otherCk] = { subjectId: subjectObj.id, teacherId: currentTeacher.id, source: "auto-fix", updatedAt: new Date().toISOString() };
                      changed = true;
                      break;
                    }
                  }
                }

                if (!changed) {
                  delete workingDrafts[cellKey];
                  delete workingAssignments[cellKey];
                  changed = true;
                }
              } else {
                // 3B. TEACHER is restricted/unavailable/mismatch:
                // Step 1: Find certified substitute teacher at this slot
                const replacementTeacher = activeTeachers.find(
                  (teacher) =>
                    teacher.id !== currentAssignment?.teacherId &&
                    isTeacherEligible({
                      teacher,
                      subject: subjectObj,
                      section: sectionObj,
                      slot,
                      constraints: config?.constraints,
                      teacherBusyBySlot: busyMap,
                      excludedSectionId: sectionObj.id,
                    })
                );

                if (replacementTeacher) {
                  workingDrafts[cellKey] = { subjectId: subjectObj.id, teacherId: replacementTeacher.id };
                  workingAssignments[cellKey] = {
                    subjectId: subjectObj.id,
                    teacherId: replacementTeacher.id,
                    source: "auto-fix",
                    updatedAt: new Date().toISOString(),
                  };
                  changed = true;
                }

                // Step 2: Move class to open slot where current teacher is free and unrestricted
                if (!changed && currentTeacher) {
                  const validSlots = slots.filter((s) => isSlotValidForSection(sectionObj, s, scheduleType, config));
                  const openSlots = validSlots.filter((s) => {
                    const ck = createCellKey(sectionObj.id, s.id);
                    if (workingAssignments[ck]) return false;
                    if (isSubjectRestrictedForSlot(subjectObj, s, config?.constraints, config, scheduleType, {
                      section: sectionObj,
                      assignments: workingAssignments,
                      slotsById,
                      subjectsById,
                      excludeCellKey: cellKey,
                    })) return false;
                    if (!isDynamicLastPeriodSubject(subjectObj, allPlacementRules3)) {
                      const targetLastInfo = getDynamicLastPeriodInfo({
                        sectionId: sectionObj.id,
                        day: s.day,
                        assignments: workingAssignments,
                        slotsById,
                        subjectsById,
                        placementRules: allPlacementRules3,
                        excludeCellKey: cellKey,
                        dayMaxPeriod: getSectionDayMaxPeriod(sectionObj, s.day, scheduleType, config, s),
                      });
                      if (targetLastInfo.otherLastPeriods.length > 0 && Number(s.period || 0) >= Math.min(...targetLastInfo.otherLastPeriods)) {
                        return false;
                      }
                    }
                    if (matchesRestrictedPeriod(s, getTeacherRestrictedPeriods(currentTeacher.id, config?.constraints))) return false;
                    if (matchesUnavailablePeriod(s, currentTeacher.unavailablePeriods)) return false;
                    return !busyMap.get(currentTeacher.id)?.has(s.id);
                  });

                  if (openSlots.length > 0) {
                    const openSlot = openSlots[0];
                    const targetKey = createCellKey(sectionObj.id, openSlot.id);
                    delete workingDrafts[cellKey];
                    delete workingAssignments[cellKey];
                    workingDrafts[targetKey] = { subjectId: subjectObj.id, teacherId: currentTeacher.id };
                    workingAssignments[targetKey] = { subjectId: subjectObj.id, teacherId: currentTeacher.id, source: "auto-fix", updatedAt: new Date().toISOString() };
                    changed = true;
                  }
                }

                // Step 3: Fallback deadlock resolution
                if (!changed) {
                  delete workingDrafts[cellKey];
                  delete workingAssignments[cellKey];
                  changed = true;
                }
              }
            }
            if (changed) break;
          }

          if (changed) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        // -------------------------------------------------------------
        // Strategy 3B: Reserved Locked-Slot Ownership Conflict
        // -------------------------------------------------------------
        if (message.includes("which is reserved for")) {
          let changed = false;
          const allRules3B = getAllPlacementRules(config, scheduleType);
          for (const cellKey of cellKeys) {
            const [sectionId, slotId] = splitCellKey(cellKey);
            const sectionObj = sectionsById.get(sectionId);
            const slotObj = slotsById.get(slotId);
            const occAsgn = workingDrafts[cellKey] || workingAssignments[cellKey];
            const occSubj = occAsgn?.subjectId ? subjectsById.get(occAsgn.subjectId) : null;
            const occTeacher = occAsgn?.teacherId ? facultyById.get(occAsgn.teacherId) : null;
            if (!sectionObj || !slotObj || !occSubj) continue;

            const validSlots = slots.filter((s) => isSlotValidForSection(sectionObj, s, scheduleType, config));
            const secEligible = getSubjectsForSection(sectionObj, subjects, scheduleType);
            const lockedSubj =
              secEligible.find((es) =>
                getExactLockedSlotsForSubject(es, validSlots, allRules3B).some((ls) => ls.id === slotObj.id)
              ) || null;
            const reservedSlotIds = new Set();
            secEligible.forEach((es) => {
              getExactLockedSlotsForSubject(es, validSlots, allRules3B).forEach((ls) => {
                if (ls?.id) reservedSlotIds.add(ls.id);
              });
            });
            const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);

            // Try swapping with misplaced locked subject first
            if (lockedSubj) {
              const otherEntry = Object.entries(workingAssignments).find(
                ([ck, a]) => ck.startsWith(`${sectionObj.id}|`) && ck !== cellKey && a?.subjectId === lockedSubj.id
              );
              if (otherEntry) {
                const [otherKey, otherAsgn] = otherEntry;
                const [, otherSlotId] = splitCellKey(otherKey);
                const otherSlot = slotsById.get(otherSlotId);
                const otherTeacher = otherAsgn?.teacherId ? facultyById.get(otherAsgn.teacherId) : null;
                if (otherSlot) {
                  const occFits =
                    !isSubjectRestrictedForSlot(occSubj, otherSlot, config?.constraints, config, scheduleType, {
                      section: sectionObj,
                      assignments: workingAssignments,
                      slotsById,
                      subjectsById,
                      excludeCellKey: cellKey,
                    }) &&
                    (!occTeacher ||
                      isTeacherEligible({
                        teacher: occTeacher,
                        subject: occSubj,
                        section: sectionObj,
                        slot: otherSlot,
                        constraints: config?.constraints,
                        teacherBusyBySlot: busyMap,
                        excludedSectionId: sectionObj.id,
                      }));
                  const lockFits =
                    !otherTeacher ||
                    isTeacherEligible({
                      teacher: otherTeacher,
                      subject: lockedSubj,
                      section: sectionObj,
                      slot: slotObj,
                      constraints: config?.constraints,
                      teacherBusyBySlot: busyMap,
                      excludedSectionId: sectionObj.id,
                    });
                  if (occFits && lockFits) {
                    workingAssignments[cellKey] = { ...otherAsgn, source: "auto-fix", updatedAt: new Date().toISOString() };
                    workingAssignments[otherKey] = { ...occAsgn, source: "auto-fix", updatedAt: new Date().toISOString() };
                    workingDrafts[cellKey] = { subjectId: otherAsgn.subjectId, teacherId: otherAsgn.teacherId };
                    workingDrafts[otherKey] = { subjectId: occAsgn.subjectId, teacherId: occAsgn.teacherId };
                    changed = true;
                  }
                }
              }
            }

            // Try relocating Subject B to an open non-reserved slot
            if (!changed) {
              const openReloc = validSlots.find((openSlot) => {
                const openKey = createCellKey(sectionObj.id, openSlot.id);
                if (workingAssignments[openKey] || reservedSlotIds.has(openSlot.id)) return false;
                if (isSubjectRestrictedForSlot(occSubj, openSlot, config?.constraints, config, scheduleType, {
                  section: sectionObj,
                  assignments: workingAssignments,
                  slotsById,
                  subjectsById,
                  excludeCellKey: cellKey,
                })) return false;
                return (
                  !occTeacher ||
                  isTeacherEligible({
                    teacher: occTeacher,
                    subject: occSubj,
                    section: sectionObj,
                    slot: openSlot,
                    constraints: config?.constraints,
                    teacherBusyBySlot: busyMap,
                    excludedSectionId: sectionObj.id,
                  })
                );
              });
              if (openReloc) {
                const openKey = createCellKey(sectionObj.id, openReloc.id);
                delete workingDrafts[cellKey];
                delete workingAssignments[cellKey];
                workingAssignments[openKey] = { ...occAsgn, source: "auto-fix", updatedAt: new Date().toISOString() };
                workingDrafts[openKey] = { subjectId: occAsgn.subjectId, teacherId: occAsgn.teacherId };
                changed = true;
              }
            }

            if (!changed) {
              delete workingDrafts[cellKey];
              delete workingAssignments[cellKey];
              changed = true;
            }
            if (changed) break;
          }
          if (changed) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        // -------------------------------------------------------------
        // Strategy 3C: Preferred Placement Lock (locked to day or period)
        // -------------------------------------------------------------
        if (message.includes("locked to")) {
          let changed = false;
          for (const cellKey of cellKeys) {
            const [sectionId, slotId] = splitCellKey(cellKey);
            const sectionObj = sectionsById.get(sectionId);
            const currentAssignment = workingDrafts[cellKey] || workingAssignments[cellKey];
            const subjectObj = currentAssignment?.subjectId ? subjectsById.get(currentAssignment.subjectId) : null;
            const currentTeacher = currentAssignment?.teacherId ? facultyById.get(currentAssignment.teacherId) : null;

            if (sectionObj && subjectObj) {
              const allPlacementRules = getAllPlacementRules(config, scheduleType);
              const pRule = findPlacementRuleForSubject(subjectObj, allPlacementRules);
              const effectiveSubj = pRule ? { ...subjectObj, ...pRule } : (subjectObj || {});
              const validSlots = slots.filter((s) => isSlotValidForSection(sectionObj, s, scheduleType, config));
              const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);

              const candidateSlots = validSlots.filter((s) => {
                if (effectiveSubj.preferredDay && effectiveSubj.preferredDay !== "any" && s.day !== effectiveSubj.preferredDay) return false;
                if (isSubjectRestrictedForSlot(subjectObj, s, config?.constraints, config, scheduleType, {
                  section: sectionObj,
                  assignments: workingAssignments,
                  slotsById,
                  subjectsById,
                  excludeCellKey: cellKey,
                })) return false;
                if (!isDynamicLastPeriodSubject(subjectObj, allPlacementRules)) {
                  const targetLastInfo = getDynamicLastPeriodInfo({
                    sectionId: sectionObj.id,
                    day: s.day,
                    assignments: workingAssignments,
                    slotsById,
                    subjectsById,
                    placementRules: allPlacementRules,
                    excludeCellKey: cellKey,
                    dayMaxPeriod: getSectionDayMaxPeriod(sectionObj, s.day, scheduleType, config, s),
                  });
                  if (targetLastInfo.otherLastPeriods.length > 0 && Number(s.period || 0) >= Math.min(...targetLastInfo.otherLastPeriods)) {
                    return false;
                  }
                }
                return true;
              });

              const openMatching = candidateSlots.filter((s) => !workingAssignments[createCellKey(sectionObj.id, s.id)]);
              for (const openSlot of openMatching) {
                let t = currentTeacher && isTeacherEligible({ teacher: currentTeacher, subject: subjectObj, section: sectionObj, slot: openSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId }) ? currentTeacher : null;
                if (!t) {
                  t = activeTeachers.find((tch) => isTeacherEligible({ teacher: tch, subject: subjectObj, section: sectionObj, slot: openSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId }));
                }
                if (t) {
                  const targetKey = createCellKey(sectionObj.id, openSlot.id);
                  delete workingDrafts[cellKey];
                  delete workingAssignments[cellKey];
                  workingDrafts[targetKey] = { subjectId: subjectObj.id, teacherId: t.id };
                  workingAssignments[targetKey] = { subjectId: subjectObj.id, teacherId: t.id, source: "auto-fix", updatedAt: new Date().toISOString() };
                  changed = true;
                  break;
                }
              }

              if (!changed) {
                const secEligible3C = getSubjectsForSection(sectionObj, subjects, scheduleType);
                const reserved3C = new Set();
                secEligible3C.forEach((es) => {
                  getExactLockedSlotsForSubject(es, validSlots, allPlacementRules).forEach((ls) => {
                    if (ls?.id) reserved3C.add(ls.id);
                  });
                });
                const curSlot3C = slotsById.get(slotId);
                const occMatching3C = candidateSlots.filter((s) => Boolean(workingAssignments[createCellKey(sectionObj.id, s.id)]));

                for (const occSlot of occMatching3C) {
                  const occKey = createCellKey(sectionObj.id, occSlot.id);
                  const occAsgn = workingAssignments[occKey];
                  const occSubj = occAsgn?.subjectId ? subjectsById.get(occAsgn.subjectId) : null;
                  if (!occAsgn || !occSubj || occSubj.id === subjectObj.id || isPlacementLockedSubject(occSubj, allPlacementRules)) continue;
                  const occTeacher = occAsgn.teacherId ? facultyById.get(occAsgn.teacherId) : null;

                  const targetTeacher3C =
                    currentTeacher && isTeacherEligible({ teacher: currentTeacher, subject: subjectObj, section: sectionObj, slot: occSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId })
                      ? currentTeacher
                      : activeTeachers.find((tch) => isTeacherEligible({ teacher: tch, subject: subjectObj, section: sectionObj, slot: occSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId }));
                  if (!targetTeacher3C) continue;

                  // 1. Swap if occupant fits in current cell
                  const occFitsCur =
                    curSlot3C &&
                    !isSubjectRestrictedForSlot(occSubj, curSlot3C, config?.constraints, config, scheduleType, {
                      section: sectionObj,
                      assignments: workingAssignments,
                      slotsById,
                      subjectsById,
                      excludeCellKey: occKey,
                    }) &&
                    (!occTeacher ||
                      isTeacherEligible({
                        teacher: occTeacher,
                        subject: occSubj,
                        section: sectionObj,
                        slot: curSlot3C,
                        constraints: config?.constraints,
                        teacherBusyBySlot: busyMap,
                        excludedSectionId: sectionId,
                      }));
                  if (occFitsCur) {
                    workingAssignments[occKey] = { subjectId: subjectObj.id, teacherId: targetTeacher3C.id, source: "auto-fix", updatedAt: new Date().toISOString() };
                    workingAssignments[cellKey] = { ...occAsgn, source: "auto-fix", updatedAt: new Date().toISOString() };
                    workingDrafts[occKey] = { subjectId: subjectObj.id, teacherId: targetTeacher3C.id };
                    workingDrafts[cellKey] = { subjectId: occAsgn.subjectId, teacherId: occAsgn.teacherId };
                    changed = true;
                    break;
                  }

                  // 2. Relocate occupant to an open non-reserved slot and place Subject A in occSlot
                  const relocSlot3C = validSlots.find((rs) => {
                    const rKey = createCellKey(sectionObj.id, rs.id);
                    if (workingAssignments[rKey] || reserved3C.has(rs.id)) return false;
                    if (isSubjectRestrictedForSlot(occSubj, rs, config?.constraints, config, scheduleType, {
                      section: sectionObj,
                      assignments: workingAssignments,
                      slotsById,
                      subjectsById,
                      excludeCellKey: occKey,
                    })) return false;
                    return !occTeacher || isTeacherEligible({ teacher: occTeacher, subject: occSubj, section: sectionObj, slot: rs, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionId });
                  });
                  if (relocSlot3C) {
                    const rKey = createCellKey(sectionObj.id, relocSlot3C.id);
                    delete workingDrafts[cellKey];
                    delete workingAssignments[cellKey];
                    workingAssignments[rKey] = { ...occAsgn, source: "auto-fix", updatedAt: new Date().toISOString() };
                    workingDrafts[rKey] = { subjectId: occAsgn.subjectId, teacherId: occAsgn.teacherId };
                    workingAssignments[occKey] = { subjectId: subjectObj.id, teacherId: targetTeacher3C.id, source: "auto-fix", updatedAt: new Date().toISOString() };
                    workingDrafts[occKey] = { subjectId: subjectObj.id, teacherId: targetTeacher3C.id };
                    changed = true;
                    break;
                  }
                }
              }

              if (!changed && isDynamicLastPeriodSubject(subjectObj, allPlacementRules)) {
                const candidateDays =
                  effectiveSubj.preferredDay && effectiveSubj.preferredDay !== "any"
                    ? [effectiveSubj.preferredDay]
                    : Array.from(new Set(validSlots.map((s) => s.day).filter(Boolean)));
                const dynamicPlan = computeDynamicLastPlacementPlan({
                  section: sectionObj,
                  targetSubject: subjectObj,
                  candidateDays,
                  assignments: workingAssignments,
                  drafts: workingDrafts,
                  validSectionSlots: validSlots,
                  slotsById,
                  subjectsById,
                  sectionsById,
                  facultyById,
                  activeTeachers,
                  config,
                  scheduleType,
                  preferTeacherId: currentTeacher?.id || null,
                  excludeCellKey: cellKey,
                });
                if (dynamicPlan) {
                  Object.keys(workingAssignments).forEach((k) => delete workingAssignments[k]);
                  Object.assign(workingAssignments, dynamicPlan.nextAssignments);
                  Object.keys(workingDrafts).forEach((k) => delete workingDrafts[k]);
                  Object.assign(workingDrafts, dynamicPlan.nextDrafts);
                  changed = true;
                }
              }

              if (!changed) {
                delete workingDrafts[cellKey];
                delete workingAssignments[cellKey];
                changed = true;
              }
            }
            if (changed) break;
          }

          if (changed) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        // -------------------------------------------------------------
        // Strategy 3D: Double Period Block
        // -------------------------------------------------------------
        if (message.includes("requires a Double Period block")) {
          if (cellKeys.length > 0) {
            const targetKey = cellKeys[cellKeys.length - 1];
            delete workingDrafts[targetKey];
            delete workingAssignments[targetKey];
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        // -------------------------------------------------------------
        // Strategy 4: Specialized Subject Limit Exceeded
        // -------------------------------------------------------------
        if (message.includes("specialized subject assigned")) {
          let changed = false;
          const [firstSectionId] = splitCellKey(cellKeys[0]);
          const sectionObj = sectionsById.get(firstSectionId);

          if (sectionObj && cellKeys.length > 1) {
            const offeredSubjects = getSubjectsForSection(sectionObj, subjects, scheduleType);
            const offeredIds = new Set(offeredSubjects.map((s) => s.id));
            const sectionCellKeys = Object.keys(workingAssignments).filter(
              (ck) => splitCellKey(ck)[0] === sectionObj.id
            );

            // Prefer replacing cells whose subject is NOT in offeredSubjects, or the last specialized subject
            const targetCells = cellKeys.filter((ck) => {
              const a = workingDrafts[ck] || workingAssignments[ck];
              return a?.subjectId && !offeredIds.has(a.subjectId);
            });
            const cellsToFix = targetCells.length > 0 ? targetCells : cellKeys.slice(1);

            for (const cellKey of cellsToFix) {
              const [, slotId] = splitCellKey(cellKey);
              const slot = slotsById.get(slotId);
              if (!slot) continue;

              const subjectCounts = new Map();
              sectionCellKeys.forEach((ck) => {
                if (ck === cellKey) return;
                const a = workingDrafts[ck] || workingAssignments[ck];
                if (a?.subjectId) {
                  subjectCounts.set(a.subjectId, (subjectCounts.get(a.subjectId) || 0) + 1);
                }
              });

              // Only replace with an UNDER-QUOTA eligible subject that is not already on this day
              const underQuotaSubjects = offeredSubjects.filter((s) => {
                const count = subjectCounts.get(s.id) || 0;
                const req = parseBoundedNumber(s.classesPerWeek, 1, 12, 4);
                if (count >= req) return false;
                const hasSameDay = sectionCellKeys.some((ck) => {
                  if (ck === cellKey) return false;
                  const [, sId] = splitCellKey(ck);
                  const sl = slotsById.get(sId);
                  const a = workingDrafts[ck] || workingAssignments[ck];
                  return sl?.day === slot.day && a?.subjectId === s.id;
                });
                return !hasSameDay;
              });

              const allPlacementRules4 = getAllPlacementRules(config, scheduleType);
              const slotLastInfo4 = getDynamicLastPeriodInfo({
                sectionId: sectionObj.id,
                day: slot.day,
                assignments: workingAssignments,
                slotsById,
                subjectsById,
                placementRules: allPlacementRules4,
                excludeCellKey: cellKey,
                dayMaxPeriod: getSectionDayMaxPeriod(sectionObj, slot.day, scheduleType, config, slot),
              });
              const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);
              for (const replacementSubject of underQuotaSubjects) {
                if (isSubjectRestrictedForSlot(replacementSubject, slot, config?.constraints, config, scheduleType, {
                  section: sectionObj,
                  assignments: workingAssignments,
                  slotsById,
                  subjectsById,
                  excludeCellKey: cellKey,
                })) continue;
                if (
                  !isDynamicLastPeriodSubject(replacementSubject, allPlacementRules4) &&
                  slotLastInfo4.otherLastPeriods.length > 0 &&
                  Number(slot.period || 0) >= Math.min(...slotLastInfo4.otherLastPeriods)
                ) {
                  continue;
                }
                const replacementTeacher = activeTeachers.find((teacher) =>
                  isTeacherEligible({
                    teacher,
                    subject: replacementSubject,
                    section: sectionObj,
                    slot,
                    constraints: config?.constraints,
                    teacherBusyBySlot: busyMap,
                    excludedSectionId: sectionObj.id,
                  })
                );

                if (replacementTeacher) {
                  workingDrafts[cellKey] = { subjectId: replacementSubject.id, teacherId: replacementTeacher.id };
                  workingAssignments[cellKey] = {
                    subjectId: replacementSubject.id,
                    teacherId: replacementTeacher.id,
                    source: "auto-fix",
                    updatedAt: new Date().toISOString(),
                  };
                  changed = true;
                  break;
                }
              }

              // If no under-quota replacement subject is needed, unassign the excess/ineligible specialized cell
              if (!changed && !offeredIds.has((workingDrafts[cellKey] || workingAssignments[cellKey])?.subjectId)) {
                delete workingDrafts[cellKey];
                delete workingAssignments[cellKey];
                changed = true;
              }
              if (changed) break;
            }
          }
          if (changed) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        // -------------------------------------------------------------
        // Strategy 5: Generic Intra-Section Conflict-Minimizing Swap
        // -------------------------------------------------------------
        for (const cellKey of cellKeys) {
          const [sectionId, slotId] = splitCellKey(cellKey);
          const sectionObj = sectionsById.get(sectionId);
          const slot = slotsById.get(slotId);
          const currentAssignment = workingDrafts[cellKey] || workingAssignments[cellKey];

          if (sectionObj && slot && currentAssignment) {
            const otherCellKeys = Object.keys(workingAssignments).filter(
              (ck) => splitCellKey(ck)[0] === sectionObj.id && ck !== cellKey
            );

            let swapDone = false;
            for (const otherKey of otherCellKeys) {
              const [, otherSlotId] = splitCellKey(otherKey);
              const otherSlot = slotsById.get(otherSlotId);
              const otherAssignment = workingDrafts[otherKey] || workingAssignments[otherKey];

              if (!otherSlot || !otherAssignment) continue;

              const subjectA = subjectsById.get(currentAssignment.subjectId);
              const subjectB = subjectsById.get(otherAssignment.subjectId);
              if (!subjectA || !subjectB) continue;

              const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);
              let teacherA = facultyById.get(currentAssignment.teacherId);
              if (!teacherA || !isTeacherEligible({ teacher: teacherA, subject: subjectA, section: sectionObj, slot: otherSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id })) {
                teacherA = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: subjectA, section: sectionObj, slot: otherSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id }));
              }

              let teacherB = facultyById.get(otherAssignment.teacherId);
              if (!teacherB || !isTeacherEligible({ teacher: teacherB, subject: subjectB, section: sectionObj, slot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id })) {
                teacherB = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: subjectB, section: sectionObj, slot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id }));
              }

              if (teacherA && teacherB) {
                const testAssignments = {
                  ...workingAssignments,
                  [cellKey]: { subjectId: subjectB.id, teacherId: teacherB.id, source: "auto-fix", updatedAt: new Date().toISOString() },
                  [otherKey]: { subjectId: subjectA.id, teacherId: teacherA.id, source: "auto-fix", updatedAt: new Date().toISOString() },
                };

                const testEval = getEvaluation(testAssignments);
                if (testEval.conflicts.length < evaluation.conflicts.length) {
                  workingDrafts[cellKey] = { subjectId: subjectB.id, teacherId: teacherB.id };
                  workingAssignments[cellKey] = testAssignments[cellKey];
                  workingDrafts[otherKey] = { subjectId: subjectA.id, teacherId: teacherA.id };
                  workingAssignments[otherKey] = testAssignments[otherKey];
                  swapDone = true;
                  break;
                }
              }
            }

            if (swapDone) {
              fixedCount += 1;
              appliedThisPass = true;
              break;
            }
          }
        }

        if (appliedThisPass) break;

        // -------------------------------------------------------------
        // Strategy 6: Duplicate Subject Daily Session Resolution (max 1 per day)
        // -------------------------------------------------------------
        for (const cellKey of cellKeys) {
          const [sectionId, slotId] = splitCellKey(cellKey);
          const sectionObj = sectionsById.get(sectionId);
          const slot = slotsById.get(slotId);
          const currentAssignment = workingDrafts[cellKey] || workingAssignments[cellKey];
          if (!sectionObj || !slot || !currentAssignment) continue;

          const subject = subjectsById.get(currentAssignment.subjectId);
          if (!subject) continue;

          const sectionSlots = slots.filter((s) => isSlotValidForSection(sectionObj, s, scheduleType, config));
          const sameDayCells = sectionSlots
            .filter((s) => s.day === slot.day)
            .map((s) => createCellKey(sectionObj.id, s.id));

          const sameDaySubjectCount = sameDayCells.filter((ck) => {
            const asgn = workingAssignments[ck];
            return asgn && asgn.subjectId === subject.id;
          }).length;

          if (sameDaySubjectCount <= 1) continue; // Not a duplicate session on this day

          const otherDaySlots = sectionSlots.filter((s) => s.day !== slot.day);
          let fixApplied = false;

          for (const targetSlot of otherDaySlots) {
            const targetCellKey = createCellKey(sectionObj.id, targetSlot.id);
            const targetAssignment = workingAssignments[targetCellKey];

            const targetDayCells = sectionSlots.filter((s) => s.day === targetSlot.day).map((s) => createCellKey(sectionObj.id, s.id));
            const subjectOnTargetDay = targetDayCells.some((ck) => workingAssignments[ck]?.subjectId === subject.id);
            if (subjectOnTargetDay) continue;

            const busyMap = buildTeacherBusyMap(workingAssignments, sectionsById, slotsById);

            if (!targetAssignment) {
              let teacher = facultyById.get(currentAssignment.teacherId);
              if (!teacher || !isTeacherEligible({ teacher, subject, section: sectionObj, slot: targetSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id })) {
                teacher = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject, section: sectionObj, slot: targetSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id }));
              }

              if (teacher) {
                const testAssignments = { ...workingAssignments };
                delete testAssignments[cellKey];
                testAssignments[targetCellKey] = { subjectId: subject.id, teacherId: teacher.id, source: "auto-fix", updatedAt: new Date().toISOString() };

                const testEval = getEvaluation(testAssignments);
                if (testEval.conflicts.length < evaluation.conflicts.length) {
                  delete workingDrafts[cellKey];
                  delete workingAssignments[cellKey];
                  workingDrafts[targetCellKey] = { subjectId: subject.id, teacherId: teacher.id };
                  workingAssignments[targetCellKey] = testAssignments[targetCellKey];
                  fixApplied = true;
                  break;
                }
              }
            } else {
              const targetSubject = subjectsById.get(targetAssignment.subjectId);
              if (!targetSubject) continue;

              const subjectBOnCurrentDay = sameDayCells.some((ck) => ck !== cellKey && workingAssignments[ck]?.subjectId === targetSubject.id);
              if (subjectBOnCurrentDay) continue;

              let teacherA = facultyById.get(currentAssignment.teacherId);
              if (!teacherA || !isTeacherEligible({ teacher: teacherA, subject, section: sectionObj, slot: targetSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id })) {
                teacherA = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject, section: sectionObj, slot: targetSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id }));
              }

              let teacherB = facultyById.get(targetAssignment.teacherId);
              if (!teacherB || !isTeacherEligible({ teacher: teacherB, subject: targetSubject, section: sectionObj, slot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id })) {
                teacherB = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: targetSubject, section: sectionObj, slot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: sectionObj.id }));
              }

              if (teacherA && teacherB) {
                const testAssignments = {
                  ...workingAssignments,
                  [cellKey]: { subjectId: targetSubject.id, teacherId: teacherB.id, source: "auto-fix", updatedAt: new Date().toISOString() },
                  [targetCellKey]: { subjectId: subject.id, teacherId: teacherA.id, source: "auto-fix", updatedAt: new Date().toISOString() },
                };

                const testEval = getEvaluation(testAssignments);
                if (testEval.conflicts.length < evaluation.conflicts.length) {
                  workingDrafts[cellKey] = { subjectId: targetSubject.id, teacherId: teacherB.id };
                  workingAssignments[cellKey] = testAssignments[cellKey];
                  workingDrafts[targetCellKey] = { subjectId: subject.id, teacherId: teacherA.id };
                  workingAssignments[targetCellKey] = testAssignments[targetCellKey];
                  fixApplied = true;
                  break;
                }
              }
            }
          }

          if (fixApplied) {
            fixedCount += 1;
            appliedThisPass = true;
            break;
          }
        }

        if (appliedThisPass) break;
      }
    }

    const finalEvaluation = evaluateSchedule({
      assignments: workingAssignments,
      sections,
      slots,
      subjects,
      teachers: activeTeachers,
      scheduleType,
      config,
    });

    setCellEditorDrafts(workingDrafts);
    const nowIso = new Date().toISOString();
    const updatedScheduleObj = {
      ...schedule,
      assignments: workingAssignments,
      conflicts: finalEvaluation.conflicts,
      conflictDetails: finalEvaluation.conflictDetails,
      teacherLoadPercent: finalEvaluation.teacherLoadPercent,
      updatedAt: nowIso,
    };
    setSchedule(updatedScheduleObj);
    persistFacultyLoadPercent(finalEvaluation.teacherLoadPercent);

    // Persist auto-fixed schedule ONLY if currently loaded schedule matches an existing saved draft by exact ID
    try {
      const currentDrafts = loadJson(DRAFTS_STORAGE_KEY, []);
      if (schedule.id && Array.isArray(currentDrafts) && currentDrafts.length > 0) {
        let matched = false;
        const nextDrafts = currentDrafts.map((d) => {
          if (d.id === schedule.id) {
            matched = true;
            return {
              ...d,
              updatedAt: nowIso,
              schedule: {
                ...(d.schedule || {}),
                ...updatedScheduleObj,
              },
            };
          }
          return d;
        });
        if (matched) {
          setDrafts(nextDrafts);
          saveJson(DRAFTS_STORAGE_KEY, nextDrafts);
        }
      }
    } catch (e) {
      console.warn("Could not persist auto-fixed schedule to drafts:", e);
    }

    if (finalEvaluation.conflicts.length > 0) {
      const underScheduledConflicts = finalEvaluation.conflicts.filter((c) =>
        c.includes("required recurring daily period")
      );

      let capacityIssue = null;
      for (const sec of sections) {
        const secSlots = slots.filter((s) => isSlotValidForSection(sec, s, scheduleType, config));
        const secSubjs = getSubjectsForSection(sec, subjects, scheduleType);
        const totalReq = secSubjs.reduce(
          (sum, sub) => sum + parseBoundedNumber(sub?.classesPerWeek, 1, 12, 4),
          0
        );
        if (totalReq > secSlots.length) {
          const deficit = totalReq - secSlots.length;
          const secName = formatConflictSectionName(sec);
          capacityIssue = { secName, totalReq, slotCount: secSlots.length, deficit };
          break;
        }
      }

      if (underScheduledConflicts.length > 0 && capacityIssue) {
        if (fixedCount > 0) {
          showNotice(`Auto-fix resolved ${fixedCount} conflict(s) (${beforeCount} -> ${finalEvaluation.conflicts.length}). Note: ${capacityIssue.secName} requires ${capacityIssue.totalReq} weekly periods, but timetable physically only has ${capacityIssue.slotCount} slots (${capacityIssue.deficit} slot shortage).`, "info");
        } else {
          showNotice(`Timetable capacity shortage: ${capacityIssue.secName} requires ${capacityIssue.totalReq} weekly periods, but timetable physically only has ${capacityIssue.slotCount} slots (${capacityIssue.deficit} slot shortage). Please adjust periods in School Profile.`, "info");
        }
        setActiveDrawerTab("conflicts");
        return;
      }

      if (fixedCount > 0) {
        showNotice(`Auto-fix applied ${fixedCount} fix(es) (${beforeCount} -> ${finalEvaluation.conflicts.length} conflicts remaining).`, "success");
        return;
      }

      showNotice(
        `No automatic fixes available for the remaining ${finalEvaluation.conflicts.length} conflict(s). Review individual suggestions or adjust period restrictions.`,
        "info"
      );
      return;
    }

    if (fixedCount > 0) {
      showNotice(`All conflicts resolved (${beforeCount} -> 0 conflicts; ${fixedCount} fix${fixedCount > 1 ? "es" : ""} applied).`, "success");
    } else {
      showNotice("No conflicts detected. All section and teacher assignments are valid.", "success");
    }
      } finally {
        setIsAutoFixing(false);
      }
    }, 20);
  };

  const handleAutoDistributeFromChecklist = () => {
    if (isAutoFixing) return;
    if (sections.length === 0) {
      showNotice("No sections found for this schedule type.", "error");
      return;
    }

    const existingAssignments = {};
    Object.entries(effectiveAssignmentsForDisplay || {}).forEach(([cellKey, asgn]) => {
      if (!asgn || !asgn.subjectId) return;
      const hasTeacher =
        Boolean(asgn.teacherId) ||
        (Array.isArray(asgn.coTeacherIds) && asgn.coTeacherIds.some(Boolean)) ||
        (Array.isArray(asgn.breakoutAssignments) && asgn.breakoutAssignments.some((b) => b?.teacherId));
      if (hasTeacher) {
        existingAssignments[cellKey] = { ...asgn };
      }
    });

    const lockedCount = Object.keys(existingAssignments).length;
    if (lockedCount === 0) {
      handleGenerateSchedule({ showSummaryModal: false });
      return;
    }

    setIsAutoFixing(true);
    window.setTimeout(() => {
      try {
        const activeConfigSnapshot = JSON.parse(JSON.stringify(activeConfig));
        const builtSlots = buildSlots(scheduleType, activeConfig, { deriveJhsPeriods: isGeneratorMode, subjects });
        const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
        const autoSchedule = generateSchedule({
          scheduleType,
          sections,
          slots: builtSlots,
          subjects,
          activeTeachers,
          config: activeConfig,
          lockedAssignments: existingAssignments,
        });
        const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
        const elapsedMs = Math.max(0.1, Math.round((endTime - startTime) * 10) / 10);
        const elapsedSeconds = (elapsedMs / 1000).toFixed(3);

        const existingDraft = drafts.find((d) => d.id === schedule?.id);
        const isEditingPublished =
          Boolean(existingDraft && (existingDraft.status === "published" || publishedSchedules?.[scheduleType]?.id === existingDraft.id)) ||
          Boolean(schedule?.status === "published");
        const targetDraftId = !isEditingPublished && schedule?.id ? schedule.id : `draft-${scheduleType}-latest`;

        const updatedSchedule = {
          ...autoSchedule,
          id: targetDraftId,
          config: activeConfigSnapshot,
          status: "draft",
          generationTimeMs: elapsedMs,
          generationTimeSec: elapsedSeconds,
        };

        setSchedule(updatedSchedule);
        setCellEditorDrafts({});
        setHoveredCellKey("");

        try {
          const now = new Date().toISOString();
          const draftObj = {
            id: targetDraftId,
            scheduleType,
            name:
              existingDraft && !isEditingPublished && existingDraft.name
                ? existingDraft.name
                : `${getScheduleTypeLabel(scheduleType)} Draft — ${formatDateTime(now)}`,
            status: "draft",
            updatedAt: now,
            schedule: {
              ...updatedSchedule,
              sections,
              slots: builtSlots,
              subjects,
              teachers: activeTeachers,
              config: activeConfigSnapshot,
              status: "draft",
              updatedAt: now,
            },
            config: activeConfigSnapshot,
          };
          const currentDrafts = loadJson(DRAFTS_STORAGE_KEY, []);
          const nextDrafts = upsertDraft(Array.isArray(currentDrafts) ? currentDrafts : [], draftObj);
          setDrafts(nextDrafts);
          saveJson(DRAFTS_STORAGE_KEY, nextDrafts);
          persistFacultyLoadPercent(updatedSchedule?.teacherLoadPercent || {});
          window.dispatchEvent(
            new CustomEvent("turotugma:schedule-updated", { detail: { type: "draft", scheduleType, id: draftObj.id } })
          );
        } catch (e) {
          console.warn("Could not auto-save auto-distributed draft:", e);
        }

        const totalNow = Object.keys(updatedSchedule.assignments || {}).length;
        const newlyAddedCount = Math.max(0, totalNow - lockedCount);
        const unresolved = (updatedSchedule.conflicts || []).length;

        if (newlyAddedCount === 0 && unresolved === 0) {
          showNotice(
            "All section-subject periods are already assigned with 0 conflicts. Existing assignments were preserved.",
            "success"
          );
        } else if (unresolved > 0) {
          showNotice(
            `Auto-distributed ${newlyAddedCount} unassigned period(s) in ${elapsedMs} ms while preserving ${lockedCount} existing assignment(s) (${unresolved} unresolved conflict(s)).`,
            "error"
          );
        } else {
          showNotice(
            `Auto-distributed ${newlyAddedCount} unassigned period(s) in ${elapsedMs} ms while preserving ${lockedCount} existing assignment(s) with 0 conflicts.`,
            "success"
          );
        }
      } finally {
        setIsAutoFixing(false);
      }
    }, 10);
  };

  const handleSaveDraft = () => {
    try {
      const now = new Date().toISOString();
      const existing = drafts.find((draft) => draft.id === schedule?.id);
      const isEditingPublished =
        Boolean(existing && (existing.status === "published" || publishedSchedules?.[scheduleType]?.id === existing.id)) ||
        Boolean(schedule?.status === "published");
      const configSnapshot = JSON.parse(JSON.stringify(schedule?.config || config || activeConfig));

      // Merge any manual cell draft edits into assignments (accurately deleting cleared cells)
      const mergedAssignments = { ...(schedule?.assignments || {}) };
      Object.entries(cellEditorDrafts || {}).forEach(([cellKey, draft]) => {
        if (!draft || !draft.subjectId || !draft.teacherId) {
          delete mergedAssignments[cellKey];
        } else {
          const prevCell = mergedAssignments[cellKey] || {};
          mergedAssignments[cellKey] = {
            ...prevCell,
            subjectId: draft.subjectId,
            teacherId: draft.teacherId,
            coTeacherIds: draft.coTeacherIds !== undefined ? draft.coTeacherIds : prevCell.coTeacherIds,
            breakoutAssignments: draft.breakoutAssignments !== undefined ? draft.breakoutAssignments : prevCell.breakoutAssignments,
            breakoutNote: draft.breakoutNote !== undefined ? draft.breakoutNote : prevCell.breakoutNote,
            source: "manual",
            updatedAt: now,
          };
        }
      });

      const draftEvaluation = evaluateSchedule({
        assignments: mergedAssignments,
        sections,
        slots,
        subjects,
        teachers: activeTeachers,
        scheduleType,
        config,
      });

      const targetDraftId = isEditingPublished
        ? `draft-${Date.now()}`
        : (existing?.id || schedule?.id || `draft-${Date.now()}`);

      const draftSchedule = {
        ...(schedule || {}),
        id: targetDraftId,
        scheduleType,
        assignments: mergedAssignments,
        sections: sections,
        slots: slots,
        subjects: subjects,
        teachers: activeTeachers,
        config: configSnapshot,
        status: "draft",
        conflicts: draftEvaluation.conflicts || [],
        conflictDetails: draftEvaluation.conflictDetails || [],
        teacherLoadPercent: draftEvaluation.teacherLoadPercent || {},
        updatedAt: now,
      };

      const nextDraft = {
        id: draftSchedule.id,
        scheduleType,
        name: `${getScheduleTypeLabel(scheduleType)} — ${formatDateTime(now)}`,
        status: "draft",
        updatedAt: now,
        schedule: draftSchedule,
        config: configSnapshot,
      };

      const nextDrafts = upsertDraft(drafts, nextDraft);
      setDrafts(nextDrafts);
      saveJson(DRAFTS_STORAGE_KEY, nextDrafts);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("turotugma:schedule-updated", { detail: { type: "draft", id: nextDraft.id } }));
      }

      setSchedule(draftSchedule);
      setCellEditorDrafts({});
      const freshCount = (draftEvaluation.conflicts || []).length;
      showNotice(`Draft saved successfully (${freshCount} conflict${freshCount === 1 ? "" : "s"}).`, "success");
    } catch (err) {
      console.error("Error saving draft:", err);
      showNotice("Could not save draft. Storage quota might be full.", "error");
    }
  };

  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null, title: '', confirmLabel: '', confirmColor: '#2563eb' });
  const [compactGrid, setCompactGrid] = useState(false);

  const handlePublish = () => {
    if (readOnly) return;

    const mergedAssignments = { ...(schedule?.assignments || {}) };
    Object.entries(cellEditorDrafts || {}).forEach(([cellKey, draft]) => {
      if (!draft || !draft.subjectId || !draft.teacherId) {
        delete mergedAssignments[cellKey];
      } else {
        const prevCell = mergedAssignments[cellKey] || {};
        mergedAssignments[cellKey] = {
          ...prevCell,
          subjectId: draft.subjectId,
          teacherId: draft.teacherId,
          coTeacherIds: draft.coTeacherIds !== undefined ? draft.coTeacherIds : prevCell.coTeacherIds,
          breakoutAssignments: draft.breakoutAssignments !== undefined ? draft.breakoutAssignments : prevCell.breakoutAssignments,
          breakoutNote: draft.breakoutNote !== undefined ? draft.breakoutNote : prevCell.breakoutNote,
          source: "manual",
          updatedAt: new Date().toISOString(),
        };
      }
    });

    const totalAssignedCells = Object.keys(mergedAssignments).length;
    if (!schedule && totalAssignedCells === 0) {
      showNotice("Cannot publish an empty schedule. Please assign at least one subject/teacher.", "error");
      return;
    }

    const publishEvaluation = evaluateSchedule({
      assignments: mergedAssignments,
      sections,
      slots,
      subjects,
      teachers: activeTeachers,
      scheduleType,
      config,
    });

    const totalConflicts = (publishEvaluation.conflicts?.length || 0);
    const invalidCells = assignmentValidationSummary?.invalidAssigned || 0;

    // Evaluate Subject Distribution coverage across all sections (including cell conflicts)
    const publishConflictMap = new Map();
    (publishEvaluation.conflictDetails || []).forEach((entry) => {
      const msg = sanitizeText(entry?.message);
      const cellKeys = Array.isArray(entry?.cellKeys) ? entry.cellKeys : [];
      if (!msg || cellKeys.length === 0) return;
      cellKeys.forEach((ck) => {
        const existing = publishConflictMap.get(ck) || [];
        if (!existing.includes(msg)) publishConflictMap.set(ck, [...existing, msg]);
      });
    });

    const distMetrics = computeSubjectDistributionMetrics({
      sections,
      subjects,
      scheduleType,
      assignments: mergedAssignments,
      subjectsById,
      slots,
      facultyById,
      conflictMessagesByCell: publishConflictMap,
    });

    const isDist100 = distMetrics.isComplete || distMetrics.percentage >= 100;
    const isNoConflict = totalConflicts === 0 && invalidCells === 0;
    const scheduleLabel = scheduleType === "shs" ? "Senior High School" : "Junior High School";

    if (isNoConflict && isDist100) {
      // 0 conflicts and 100% distribution: prompt explicit confirmation before proceeding
      setConfirmModal({
        open: true,
        title: "Confirm Official Schedule Publication",
        confirmLabel: "Publish Official Schedule",
        confirmColor: "#2563eb",
        message: `All curriculum subjects are 100% distributed across all sections with 0 scheduling conflicts. Proceed to publish the official ${scheduleLabel} timetable for school-wide viewing?`,
        onConfirm: () => {
          setConfirmModal({ open: false, message: '', onConfirm: null });
          setSchedule((current) =>
            current
              ? {
                ...current,
                assignments: mergedAssignments,
                conflicts: publishEvaluation.conflicts,
                conflictDetails: publishEvaluation.conflictDetails,
                teacherLoadPercent: publishEvaluation.teacherLoadPercent,
                updatedAt: new Date().toISOString(),
              }
              : current
          );
          doPublish();
        },
        onCancel: () => setConfirmModal({ open: false, message: '', onConfirm: null }),
      });
      return;
    }

    // Warnings exist (conflicts > 0 or distribution < 100%)
    let warningMsg = '';
    if (totalConflicts > 0 && !isDist100) {
      warningMsg = `There are ${totalConflicts} conflict(s) detected and subject distribution is at ${distMetrics.percentage}% (${distMetrics.incompleteCount} subject(s) not fully distributed). Do you want to publish anyway?`;
    } else if (totalConflicts > 0) {
      warningMsg = `There are ${totalConflicts} conflict(s) detected. Do you want to publish anyway?`;
    } else if (invalidCells > 0) {
      warningMsg = `There are ${invalidCells} invalid cell assignment(s). Do you want to publish anyway?`;
    } else if (!isDist100) {
      warningMsg = `Subject distribution is currently at ${distMetrics.percentage}% (${distMetrics.incompleteCount} subject(s) not fully distributed across all sections). Do you want to publish anyway?`;
    }

    setConfirmModal({
      open: true,
      title: "Publish Warning",
      confirmLabel: "Publish Anyway",
      confirmColor: "#b53f4e",
      message: warningMsg,
      onConfirm: () => {
        setConfirmModal({ open: false, message: '', onConfirm: null });
        setSchedule((current) =>
          current
            ? {
              ...current,
              assignments: mergedAssignments,
              conflicts: publishEvaluation.conflicts,
              conflictDetails: publishEvaluation.conflictDetails,
              teacherLoadPercent: publishEvaluation.teacherLoadPercent,
              updatedAt: new Date().toISOString(),
            }
            : current
        );
        doPublish();
      },
      onCancel: () => setConfirmModal({ open: false, message: '', onConfirm: null }),
    });
  };

  function doPublish() {
    const now = new Date().toISOString();
    // Merge any manual cell draft edits into assignments (accurately deleting cleared cells)
    const mergedAssignments = { ...(schedule?.assignments || {}) };
    Object.entries(cellEditorDrafts || {}).forEach(([cellKey, draft]) => {
      if (!draft || !draft.subjectId || !draft.teacherId) {
        delete mergedAssignments[cellKey];
      } else {
        const prevCell = mergedAssignments[cellKey] || {};
        mergedAssignments[cellKey] = {
          ...prevCell,
          subjectId: draft.subjectId,
          teacherId: draft.teacherId,
          coTeacherIds: draft.coTeacherIds !== undefined ? draft.coTeacherIds : prevCell.coTeacherIds,
          breakoutAssignments: draft.breakoutAssignments !== undefined ? draft.breakoutAssignments : prevCell.breakoutAssignments,
          breakoutNote: draft.breakoutNote !== undefined ? draft.breakoutNote : prevCell.breakoutNote,
          source: "manual",
          updatedAt: now,
        };
      }
    });

    const publishEvaluation = schedule
      ? evaluateSchedule({
        assignments: mergedAssignments,
        sections,
        slots,
        subjects,
        teachers: activeTeachers,
        scheduleType,
        config,
      })
      : { conflicts: [], conflictDetails: [], teacherLoadPercent: {} };

    const configSnapshot = JSON.parse(JSON.stringify(schedule?.config || config || activeConfig));
    const publishedSchedule = {
      ...(schedule || {}),
      id: schedule?.id || `published-${scheduleType}-${Date.now()}`,
      scheduleType,
      assignments: mergedAssignments,
      sections: sections,
      slots: slots,
      subjects: subjects,
      teachers: activeTeachers,
      config: configSnapshot,
      status: "published",
      publishedAt: now,
      conflicts: publishEvaluation.conflicts,
      conflictDetails: publishEvaluation.conflictDetails,
      teacherLoadPercent: publishEvaluation.teacherLoadPercent,
      updatedAt: now,
    };

    const nextPublished = {
      ...publishedSchedules,
      [scheduleType]: publishedSchedule,
    };

    setPublishedSchedules(nextPublished);
    saveJson(PUBLISHED_STORAGE_KEY, nextPublished);

    // Also save published schedule in Drafts marked "published", demoting any prior published entry of this level
    try {
      const currentDrafts = loadJson(DRAFTS_STORAGE_KEY, []);
      const demotedDrafts = (Array.isArray(currentDrafts) ? currentDrafts : []).map((d) => {
        if ((d.scheduleType || d.schedule?.scheduleType) === scheduleType && (d.status === "published" || d.schedule?.status === "published")) {
          return {
            ...d,
            status: "draft",
            schedule: d.schedule ? { ...d.schedule, status: "draft" } : d.schedule,
          };
        }
        return d;
      });
      const existingMatchingDraft = demotedDrafts.find((d) => d.id === publishedSchedule.id);
      const publishedDraftEntry = {
        id: publishedSchedule.id,
        scheduleType,
        name: existingMatchingDraft?.name || `${getScheduleTypeLabel(scheduleType)} — ${formatDateTime(now)}`,
        status: "published",
        publishedAt: now,
        updatedAt: now,
        schedule: publishedSchedule,
        config: configSnapshot,
      };
      const nextDrafts = upsertDraft(demotedDrafts, publishedDraftEntry);
      setDrafts(nextDrafts);
      saveJson(DRAFTS_STORAGE_KEY, nextDrafts);
    } catch (e) {
      console.warn("Could not save published schedule into drafts list:", e);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("turotugma:schedule-updated", { detail: { type: "published", scheduleType, id: publishedSchedule.id } }));
    }

    setSchedule(publishedSchedule);
    setCellEditorDrafts({});
    persistFacultyLoadPercent(publishEvaluation?.teacherLoadPercent || schedule?.teacherLoadPercent || {});
    setDataRefreshToken((current) => current + 1);

    showNotice("Schedule published and saved in Drafts as Published.", "success");
  }

  const handleLoadDraft = (draftId) => {
    const selectedDraft = drafts.find((draft) => draft.id === draftId) || draftsForCurrentSchedule.find((draft) => draft.id === draftId);
    if (!selectedDraft) {
      showNotice("Draft not found.", "error");
      return;
    }

    const targetType = selectedDraft.scheduleType || selectedDraft.schedule?.scheduleType || scheduleType;
    if (targetType !== scheduleType) {
      pendingLoadDraftIdRef.current = selectedDraft.id;
      setScheduleType(targetType);
    }

    const isPublishedDraft =
      selectedDraft.status === "published" ||
      selectedDraft.schedule?.status === "published" ||
      publishedSchedules?.[targetType]?.id === selectedDraft.id;

    const loadedConfig = selectedDraft.config || selectedDraft.schedule?.config || activeConfig;
    setSchedule({
      ...selectedDraft.schedule,
      id: selectedDraft.id,
      config: loadedConfig,
      status: isPublishedDraft ? "published" : "draft",
    });
    setShowDraftsPanel(false);
    setPreviewDraftModal(null);
    setCellEditorDrafts({});
    setHoveredCellKey("");
    showNotice(`Loaded "${selectedDraft.name}".`, "success");
  };

  const handleDeleteDraft = (draftId, skipModal = false) => {
    const targetDraft = drafts.find((d) => d.id === draftId);
    const targetType = targetDraft?.scheduleType || targetDraft?.schedule?.scheduleType || scheduleType;
    const isPublishedDraft = Boolean(
      targetDraft?.status === "published" ||
      targetDraft?.schedule?.status === "published" ||
      publishedSchedules?.[targetType]?.id === draftId
    );
    if (isPublishedDraft) {
      showNotice("The currently published schedule cannot be deleted. Publish another schedule first.", "error");
      return;
    }

    const draftName = targetDraft?.name || "this draft";
    const executeDelete = () => {
      const nextDrafts = drafts.filter((draft) => draft.id !== draftId);
      setDrafts(nextDrafts);
      saveJson(DRAFTS_STORAGE_KEY, nextDrafts);

      if (schedule?.id === draftId) {
        setSchedule(null);
        setCellEditorDrafts({});
        setHoveredCellKey("");
      }

      showNotice(`Deleted draft "${draftName}".`, "success");
    };

    if (skipModal) {
      executeDelete();
      return;
    }

    setConfirmModal({
      open: true,
      title: "Delete Draft",
      message: `Are you sure you want to delete "${draftName}"? This action cannot be undone.`,
      confirmLabel: "Delete Draft",
      confirmColor: "#dc2626",
      onConfirm: () => {
        setConfirmModal({ open: false, message: '', onConfirm: null });
        executeDelete();
      },
      onCancel: () => setConfirmModal({ open: false, message: '', onConfirm: null }),
    });
  };

  const handleExportCurrentSchedule = () => {
    if (!schedule) {
      showNotice("Please generate or load a schedule first before exporting.", "warning");
      return;
    }

    const now = new Date().toISOString();
    const configSnapshot = JSON.parse(JSON.stringify(schedule?.config || config || activeConfig));
    const mergedAssignments = { ...(schedule?.assignments || {}) };
    Object.entries(cellEditorDrafts || {}).forEach(([cellKey, draft]) => {
      if (!draft || !draft.subjectId || !draft.teacherId) {
        delete mergedAssignments[cellKey];
      } else {
        const existingCell = schedule?.assignments?.[cellKey] || {};
        mergedAssignments[cellKey] = {
          ...existingCell,
          subjectId: draft.subjectId,
          teacherId: draft.teacherId,
          coTeacherIds: draft.coTeacherIds ?? existingCell.coTeacherIds,
          breakoutAssignments: draft.breakoutAssignments ?? existingCell.breakoutAssignments,
          breakoutNote: draft.breakoutNote ?? existingCell.breakoutNote,
          source: "manual",
          updatedAt: now,
        };
      }
    });

    const exportDraftData = {
      id: schedule.id || `working-${scheduleType || "jhs"}`,
      scheduleType,
      name: schedule.name || `Working Schedule — ${(scheduleType || "jhs").toUpperCase()}`,
      updatedAt: now,
      schedule: {
        ...schedule,
        assignments: mergedAssignments,
        sections: sections,
        slots: slots,
        subjects: subjects,
        teachers: activeTeachers,
        config: configSnapshot,
        updatedAt: now,
        status: schedule.status || "draft",
      },
      config: configSnapshot,
    };

    setPreviewDraftModal(exportDraftData);
  };

  const getCellDraft = (sectionId, slotId) => {
    const cellKey = createCellKey(sectionId, slotId);
    const draft = cellEditorDrafts[cellKey];
    const assignment = schedule?.assignments?.[cellKey];

    return {
      cellKey,
      subjectId: draft?.subjectId ?? assignment?.subjectId ?? "",
      teacherId: draft?.teacherId ?? assignment?.teacherId ?? "",
      breakoutAssignments: draft?.breakoutAssignments ?? assignment?.breakoutAssignments ?? null,
      coTeacherIds: draft?.coTeacherIds ?? assignment?.coTeacherIds ?? null,
    };
  };

  const applyCellAssignment = ({
    section,
    slot,
    subjectId,
    teacherId,
    coTeacherIds,
    breakoutAssignments,
    breakoutNote,
  }) => {
    const now = new Date().toISOString();
    const baseSchedule = schedule || {
      id: `draft-${Date.now()}`,
      scheduleType,
      createdAt: now,
      updatedAt: now,
      assignments: {},
      conflicts: [],
      conflictDetails: [],
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

    const resolvedTeacherId =
      teacherId ||
      (Array.isArray(breakoutAssignments)
        ? breakoutAssignments.find((b) => b.teacherId)?.teacherId
        : null);
    const teacher = facultyById.get(resolvedTeacherId);
    if (!teacher) {
      showNotice("Selected teacher not found.", "error");
      return;
    }

    const derivedCoTeacherIds = Array.isArray(coTeacherIds) && coTeacherIds.length > 0
      ? coTeacherIds
      : Array.isArray(breakoutAssignments) && breakoutAssignments.length > 0
        ? breakoutAssignments.map((b) => b.teacherId).filter((id) => id && id !== teacher.id)
        : undefined;

    const derivedBreakoutNote = breakoutNote || (
      Array.isArray(breakoutAssignments) && breakoutAssignments.length > 0
        ? breakoutAssignments
            .map((b) => `${String(b.stream || "Stream").toUpperCase()} – ${b.teacherName || facultyById.get(b.teacherId)?.name || "Unassigned"}`)
            .join("; ")
        : undefined
    );

    const cellKey = createCellKey(section.id, slot.id);
    const nextAssignments = {
      ...(baseSchedule.assignments || {}),
      [cellKey]: {
        subjectId: selectedSubject.id,
        teacherId: teacher.id,
        coTeacherIds: derivedCoTeacherIds && derivedCoTeacherIds.length > 0 ? derivedCoTeacherIds : undefined,
        breakoutAssignments: Array.isArray(breakoutAssignments) && breakoutAssignments.length > 0 ? breakoutAssignments : undefined,
        breakoutNote: derivedBreakoutNote || undefined,
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
      conflictDetails: evaluation.conflictDetails,
      teacherLoadPercent: evaluation.teacherLoadPercent,
      updatedAt: now,
    });

    persistFacultyLoadPercent(evaluation.teacherLoadPercent);

    setCellEditorDrafts((prev) => ({
      ...prev,
      [cellKey]: {
        subjectId: selectedSubject.id,
        teacherId: teacher.id,
        coTeacherIds: derivedCoTeacherIds && derivedCoTeacherIds.length > 0 ? derivedCoTeacherIds : undefined,
        breakoutAssignments: Array.isArray(breakoutAssignments) && breakoutAssignments.length > 0 ? breakoutAssignments : undefined,
        breakoutNote: derivedBreakoutNote || undefined,
      },
    }));

    showNotice("Assignment saved.", "success");
  };

  const removeAssignmentFromCell = (section, slot, showMessage = true, nextDraft = null) => {
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
      conflictDetails: evaluation.conflictDetails,
      teacherLoadPercent: evaluation.teacherLoadPercent,
      updatedAt: new Date().toISOString(),
    }));

    setCellEditorDrafts((prev) => ({
      ...prev,
      [cellKey]: nextDraft || { subjectId: "", teacherId: "" },
    }));

    if (showMessage) {
      showNotice("Assignment removed.", "success");
    }
  };

  const handleCellSubjectChange = (section, slot, subjectId) => {
    if (subjectId) {
      const sectionSubjects = getSubjectsForSection(section, subjects, scheduleType);
      const selectedSubject = sectionSubjects.find((item) => item.id === subjectId);

      if (
        !selectedSubject ||
        isSubjectRestrictedForSlot(selectedSubject, slot, config.constraints, config, scheduleType, {
          section,
          assignments: schedule?.assignments || {},
          slotsById,
          subjectsById,
          excludeCellKey: createCellKey(section.id, slot.id),
          mode: "manual-allow-after",
        })
      ) {
        showNotice("Selected subject is restricted for this period.", "error");
        return;
      }
    }

    const { cellKey, teacherId: currentTeacherId } = getCellDraft(section.id, slot.id);
    setActiveCellKey(cellKey);

    const hasExistingAssignment = !!schedule?.assignments?.[cellKey];
    const existingAssignment = schedule?.assignments?.[cellKey];

    const subjObj = subjectsById.get(subjectId);

    // If subject is multi-teacher breakout, initialize streams directly without any modal
    if (subjectId && subjObj && isSubjectMultiTeacher(subjObj)) {
      const streams = getSubjectBreakoutStreams(subjObj, config);
      const prevBreakouts = existingAssignment?.breakoutAssignments || [];
      const assignedIds = new Set();

      const initialBreakouts = streams.map((s, idx) => {
        let tId = "";
        const prevTId = prevBreakouts[idx]?.teacherId;
        if (prevTId && !assignedIds.has(prevTId)) {
          tId = prevTId;
          assignedIds.add(tId);
        } else if (s.defaultTeacherId && !assignedIds.has(s.defaultTeacherId)) {
          tId = s.defaultTeacherId;
          assignedIds.add(tId);
        }
        const tObj = activeTeachers.find((t) => t.id === tId);
        return {
          stream: s.name,
          teacherId: tId,
          teacherName: tObj?.name || "",
        };
      });

      const primaryTeacherId = initialBreakouts.find((b) => b.teacherId)?.teacherId || "";

      setCellEditorDrafts((prev) => ({
        ...prev,
        [cellKey]: {
          subjectId,
          teacherId: primaryTeacherId,
          breakoutAssignments: initialBreakouts,
        },
      }));

      if (primaryTeacherId) {
        applyCellAssignment({
          section,
          slot,
          subjectId,
          teacherId: primaryTeacherId,
          breakoutAssignments: initialBreakouts,
        });
      } else if (hasExistingAssignment) {
        removeAssignmentFromCell(section, slot, false, {
          subjectId,
          teacherId: "",
          breakoutAssignments: initialBreakouts,
        });
      }
      return;
    }

    // Try to auto-retain teacher if candidate teacher is eligible for the new subject
    let nextTeacherId = "";
    if (subjectId && (existingAssignment?.teacherId || currentTeacherId)) {
      const candidateTeacherId = existingAssignment?.teacherId || currentTeacherId;
      const candidateTeacher = activeTeachers.find((t) => t.id === candidateTeacherId);
      const newSubjectObj = subjectsById.get(subjectId);
      if (candidateTeacher && newSubjectObj) {
        const eligible = isTeacherEligible({
          teacher: candidateTeacher,
          subject: newSubjectObj,
          section,
          slot,
          constraints: config.constraints,
          teacherBusyBySlot,
          excludedSectionId: section.id,
          ignoreDoubleBooking: true,
        });
        if (eligible) {
          nextTeacherId = candidateTeacherId;
        }
      }
    }

    // If no candidate retained, check if subject has a designated teacher from Subject Settings
    if (subjectId && subjObj?.defaultTeacherId && !nextTeacherId) {
      const designated = activeTeachers.find((t) => t.id === subjObj.defaultTeacherId);
      if (designated) {
        const eligible = isTeacherEligible({
          teacher: designated,
          subject: subjObj,
          section,
          slot,
          constraints: config.constraints,
          teacherBusyBySlot,
          excludedSectionId: section.id,
          ignoreDoubleBooking: true,
        });
        if (eligible) {
          nextTeacherId = designated.id;
        }
      }
    }

    if (subjectId && nextTeacherId) {
      setCellEditorDrafts((prev) => ({
        ...prev,
        [cellKey]: { subjectId, teacherId: nextTeacherId },
      }));
      applyCellAssignment({ section, slot, subjectId, teacherId: nextTeacherId });
      return;
    }

    setCellEditorDrafts((prev) => ({
      ...prev,
      [cellKey]: { subjectId, teacherId: "" },
    }));

    if (hasExistingAssignment) {
      removeAssignmentFromCell(section, slot, false, { subjectId, teacherId: "" });
      return;
    }

    if (!subjectId) {
      removeAssignmentFromCell(section, slot, false);
    }
  };

  const handleCellStreamTeacherChange = (section, slot, streamIndex, streamName, newTeacherId) => {
    const { cellKey, subjectId } = getCellDraft(section.id, slot.id);
    setActiveCellKey(cellKey);

    const currentSubject = subjectsById.get(subjectId);
    if (!currentSubject) {
      showNotice("Select subject first.", "error");
      return;
    }

    const streams = getSubjectBreakoutStreams(currentSubject, config);
    const currentAssignment = schedule?.assignments?.[cellKey];
    const draftBreakouts = cellEditorDrafts[cellKey]?.breakoutAssignments;
    const existingBreakouts = draftBreakouts || currentAssignment?.breakoutAssignments || [];

    const updatedBreakouts = streams.map((s, idx) => {
      const prevEntry = existingBreakouts[idx];
      if (idx === streamIndex) {
        const tObj = activeTeachers.find((t) => t.id === newTeacherId);
        return {
          stream: streamName || s.name,
          teacherId: newTeacherId,
          teacherName: tObj?.name || "",
        };
      }
      return {
        stream: s.name,
        teacherId: prevEntry?.teacherId || s.defaultTeacherId || "",
        teacherName: prevEntry?.teacherName || activeTeachers.find((t) => t.id === (prevEntry?.teacherId || s.defaultTeacherId))?.name || "",
      };
    });

    const primaryTeacherId = updatedBreakouts.find((b) => b.teacherId)?.teacherId || "";

    setCellEditorDrafts((prev) => ({
      ...prev,
      [cellKey]: {
        subjectId,
        teacherId: primaryTeacherId,
        breakoutAssignments: updatedBreakouts,
      },
    }));

    if (primaryTeacherId) {
      applyCellAssignment({
        section,
        slot,
        subjectId,
        teacherId: primaryTeacherId,
        breakoutAssignments: updatedBreakouts,
      });
    } else {
      removeAssignmentFromCell(section, slot, false, {
        subjectId,
        teacherId: "",
        breakoutAssignments: updatedBreakouts,
      });
    }
  };

  const handleCellTeacherChange = (section, slot, teacherId) => {
    const { cellKey, subjectId } = getCellDraft(section.id, slot.id);
    setActiveCellKey(cellKey);

    if (!subjectId) {
      showNotice("Select subject first.", "error");
      return;
    }

    if (!teacherId) {
      removeAssignmentFromCell(section, slot, false, { subjectId, teacherId: "" });
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
      ignoreDoubleBooking: true,
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

  // Memoize the full grid table and compute dropdown options lazily ONLY for the active edited cell
  const scheduleGridTable = useMemo(() => {
    if (visibleSections.length === 0 || generatorPeriods.length === 0 || generatorDays.length === 0) {
      return null;
    }

    return (
      <table style={{ borderCollapse: "collapse", tableLayout: "auto", width: "100%", zoom: compactGrid ? 0.85 : 1, minWidth: (hasDualSessions ? 320 : 190) + generatorDays.length * 160 }}>
        <thead>
          <tr>
            <th
              colSpan={hasDualSessions ? 2 : 1}
              rowSpan={hasDualSessions ? 1 : 2}
              style={{
                ...stickyHeaderCellStyle(),
                left: 0,
                width: hasDualSessions ? 320 : 190,
                minWidth: hasDualSessions ? 320 : 190,
                textAlign: "center",
                verticalAlign: "middle",
                background: "#eff3ff",
              }}
            >
              Time
            </th>
            {generatorDays.map((day) => (
              <th key={day} rowSpan={2} style={{ ...headerCellStyle(), verticalAlign: "middle" }}>
                {day}
              </th>
            ))}
          </tr>
          {hasDualSessions ? (
            <tr>
              <th
                style={{
                  ...stickyHeaderCellStyle(),
                  left: 0,
                  width: 160,
                  minWidth: 160,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#2c3a74",
                  textAlign: "center",
                  background: "#eff3ff",
                  borderTop: "1px solid #d9e0f0",
                }}
              >
                {regularDaysLabel}
              </th>
              <th
                style={{
                  ...stickyHeaderCellStyle(),
                  left: 160,
                  width: 160,
                  minWidth: 160,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#2c3a74",
                  textAlign: "center",
                  background: "#eff3ff",
                  borderTop: "1px solid #d9e0f0",
                }}
              >
                {shortenedDaysLabel}
              </th>
            </tr>
          ) : null}
        </thead>
        <tbody>
          {visibleSections.map((section) => (
            <Fragment key={section.id}>
              <tr>
                <th
                  colSpan={(hasDualSessions ? 2 : 1) + generatorDays.length}
                  style={{
                    background: "#eef3ff",
                    color: "#24326d",
                    borderBottom: "1px solid #d9e0f0",
                    borderRight: "1px solid #d9e0f0",
                    textAlign: "left",
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span>{formatSectionDisplayName(section)}</span>
                    {renderScheduleSectionBadge(section)}
                  </div>
                </th>
              </tr>
              {generatorPeriods.map((periodEntry, index) => (
                <tr key={`${section.id}-P${periodEntry.period}`}>
                  {hasDualSessions ? (
                    <>
                      <td
                        style={{
                          ...stickyHeaderCellStyle(),
                          left: 0,
                          width: 160,
                          minWidth: 160,
                          background: index % 2 === 0 ? "#ffffff" : "#fbfcff",
                          padding: "8px 6px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ display: "grid", gap: 2 }}>
                          <span style={{ color: "#25326f", fontSize: 11, fontWeight: 700 }}>{`P${periodEntry.period}`}</span>
                          <span style={{ color: "#51608d", fontSize: 10, fontWeight: 600 }}>
                            {periodEntry.regularStart && periodEntry.regularEnd
                              ? `${periodEntry.regularStart} - ${periodEntry.regularEnd}`
                              : "—"}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          ...stickyHeaderCellStyle(),
                          left: 160,
                          width: 160,
                          minWidth: 160,
                          background: index % 2 === 0 ? "#ffffff" : "#fbfcff",
                          padding: "8px 6px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ display: "grid", gap: 2 }}>
                          <span style={{ color: "#25326f", fontSize: 11, fontWeight: 700 }}>{`P${periodEntry.period}`}</span>
                          <span style={{ color: "#51608d", fontSize: 10, fontWeight: 600 }}>
                            {periodEntry.shortenedStart && periodEntry.shortenedEnd
                              ? `${periodEntry.shortenedStart} - ${periodEntry.shortenedEnd}`
                              : "—"}
                          </span>
                        </div>
                      </td>
                    </>
                  ) : (
                    <td
                      style={{
                        ...stickyHeaderCellStyle(),
                        left: 0,
                        width: 190,
                        minWidth: 190,
                        background: index % 2 === 0 ? "#ffffff" : "#fbfcff",
                        padding: "8px 10px",
                      }}
                    >
                      <div style={{ display: "grid", gap: 2 }}>
                        <span style={{ color: "#25326f", fontSize: 11, fontWeight: 700 }}>{`P${periodEntry.period}`}</span>
                        <span style={{ color: "#6b7898", fontSize: 10 }}>{`${periodEntry.start} - ${periodEntry.end}`}</span>
                      </div>
                    </td>
                  )}

                  {generatorDays.map((day) => {
                    const slotId = `${day}-P${periodEntry.period}`;
                    const slot = slotsById.get(slotId) || {
                      id: slotId,
                      label: `${day} P${periodEntry.period}`,
                      day,
                      period: periodEntry.period,
                      start: periodEntry.start,
                      end: periodEntry.end,
                    };
                    const allowed = isSlotValidForSection(section, slot, scheduleType, config);
                    const cellKey = createCellKey(section.id, slot.id);
                    const assignment = schedule?.assignments?.[cellKey] || null;
                    const cellDraft = getCellDraft(section.id, slot.id);
                    const cellConflictMessages = conflictMessagesByCell.get(cellKey) || [];
                    const subject = assignment ? subjectsById.get(assignment.subjectId) : null;
                    const teacher = assignment ? facultyById.get(assignment.teacherId) : null;
                    const showEditor = allowed && !readOnly && activeCellKey === cellKey;
                    const draftSubject = !assignment && cellDraft.subjectId ? subjectsById.get(cellDraft.subjectId) : null;
                    const draftTeacher = !assignment && cellDraft.teacherId ? facultyById.get(cellDraft.teacherId) : null;
                    const activeCellSubject = subject || draftSubject || (cellDraft.subjectId ? subjectsById.get(cellDraft.subjectId) : null);
                    const isMultiTeacherCell = isSubjectMultiTeacher(activeCellSubject);
                    const configuredStreams = isMultiTeacherCell ? getSubjectBreakoutStreams(activeCellSubject, config) : [];
                    const requiredTeacherCount = isMultiTeacherCell ? Math.max(2, configuredStreams.length) : 1;

                    const resolvedStreamRows = isMultiTeacherCell
                      ? configuredStreams.map((stream, sIdx) => {
                          const draftEntry = Array.isArray(cellDraft.breakoutAssignments) ? cellDraft.breakoutAssignments[sIdx] : null;
                          const savedEntry = Array.isArray(assignment?.breakoutAssignments) ? assignment.breakoutAssignments[sIdx] : null;
                          const fallbackTeacherIds = [assignment?.teacherId, ...(Array.isArray(assignment?.coTeacherIds) ? assignment.coTeacherIds : [])].filter(Boolean);
                          const resolvedTId =
                            draftEntry?.teacherId ??
                            savedEntry?.teacherId ??
                            fallbackTeacherIds[sIdx] ??
                            "";
                          const resolvedTObj = resolvedTId ? facultyById.get(resolvedTId) : null;
                          const resolvedTName =
                            resolvedTObj?.name ||
                            draftEntry?.teacherName ||
                            savedEntry?.teacherName ||
                            "";
                          return {
                            streamName: draftEntry?.stream || savedEntry?.stream || stream.name || `Stream ${sIdx + 1}`,
                            teacherId: resolvedTId,
                            teacherName: resolvedTName,
                          };
                        })
                      : [];

                    const assignedDistinctIds = isMultiTeacherCell
                      ? new Set(resolvedStreamRows.map((r) => r.teacherId).filter((id) => id && facultyById.has(id)))
                      : new Set(
                          [cellDraft.teacherId || assignment?.teacherId].filter((id) => id && facultyById.has(id))
                        );

                    const isCellIncomplete = activeCellSubject
                      ? isMultiTeacherCell
                        ? assignedDistinctIds.size < requiredTeacherCount || resolvedStreamRows.some((r) => !r.teacherId)
                        : !(cellDraft.teacherId || assignment?.teacherId)
                      : false;

                    const incompleteMessage = isCellIncomplete
                      ? isMultiTeacherCell
                        ? `${activeCellSubject?.subjectName || "Subject"} requires ${requiredTeacherCount} distinct teachers (${assignedDistinctIds.size}/${requiredTeacherCount} assigned).`
                        : "Teacher is required for the selected subject."
                      : "";

                    const cellDisplayConflictMessages =
                      isCellIncomplete && !cellConflictMessages.some((msg) => msg.includes("requires") && msg.includes("teachers"))
                        ? [...cellConflictMessages, incompleteMessage]
                        : cellConflictMessages;
                    const hasCellConflict = isCellIncomplete || cellDisplayConflictMessages.length > 0;
                    const hasValidAssignment = Boolean(activeCellSubject) && !isCellIncomplete && !hasCellConflict;
                    const hasAnyCellContent = Boolean(assignment || draftSubject);

                    let subjectOptionsWithState = [];
                    let teacherOptions = [];
                    if (showEditor) {
                      const subjectOptions = getSubjectsForSection(section, subjects, scheduleType);
                      subjectOptionsWithState = subjectOptions.map((item) => ({
                        ...item,
                        restricted: isSubjectRestrictedForSlot(item, slot, config.constraints, config, scheduleType, {
                          section,
                          assignments: schedule?.assignments || {},
                          slotsById,
                          subjectsById,
                          excludeCellKey: cellKey,
                          mode: "manual-allow-after",
                        }),
                      }));
                      const selectedSubject = subjectOptions.find((item) => item.id === cellDraft.subjectId) || null;
                      teacherOptions = selectedSubject
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
                              restrictedReason: item.state.restrictedReason,
                              statusNote: item.state.statusNote,
                            }))
                        : [];
                    }

                    return (
                      <td
                        key={`${section.id}-${slot.id}`}
                        className={allowed && !readOnly ? "sg-grid-cell" : undefined}
                        style={{
                          ...gridCellStyle(allowed, hasAnyCellContent, hasCellConflict, hasValidAssignment),
                          minHeight: 62,
                          verticalAlign: "middle",
                          padding: "8px 8px",
                          cursor: allowed && !readOnly ? "pointer" : "default",
                        }}
                        onClick={() => {
                          if (allowed && !readOnly) {
                            setActiveCellKey(cellKey);
                          }
                        }}
                        onMouseEnter={(event) => {
                          if (allowed && hasCellConflict) {
                            const rect = event.currentTarget.getBoundingClientRect();
                            setCellConflictTooltip({
                              visible: true,
                              messages: cellDisplayConflictMessages,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 8,
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          if (hasCellConflict) {
                            setCellConflictTooltip((current) => ({ ...current, visible: false }));
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
                              disabled={readOnly}
                            >
                              <option value="">Select subject</option>
                              {subjectOptionsWithState.map((option) => (
                                <option key={option.id} value={option.id} disabled={option.restricted}>
                                  {option.restricted ? `${option.subjectName} (Restricted)` : option.subjectName}
                                </option>
                              ))}
                            </select>

                            {isSubjectMultiTeacher(subject || draftSubject || subjectsById.get(cellDraft.subjectId)) ? (
                              <div style={{ display: "grid", gap: 3, marginTop: 2 }}>
                                {getSubjectBreakoutStreams(subject || draftSubject || subjectsById.get(cellDraft.subjectId), config).map((stream, idx) => {
                                  const assignedTeacherId =
                                    (cellDraft.breakoutAssignments && cellDraft.breakoutAssignments[idx]?.teacherId) ??
                                    (assignment?.breakoutAssignments && assignment.breakoutAssignments[idx]?.teacherId) ??
                                    stream.defaultTeacherId ??
                                    "";

                                  const otherStreamAssignedMap = new Map();
                                  const currentCellBreakouts = cellDraft.breakoutAssignments || assignment?.breakoutAssignments || [];
                                  currentCellBreakouts.forEach((b, bIdx) => {
                                    if (bIdx !== idx && b?.teacherId) {
                                      otherStreamAssignedMap.set(b.teacherId, b.stream || `Stream ${bIdx + 1}`);
                                    }
                                  });

                                  const streamSpecialists = [];
                                  const eligibleDepartmentFaculty = [];
                                  const otherFaculty = [];

                                  activeTeachers.forEach((t) => {
                                    const tier = getTeacherStreamQualificationTier(t, stream.name, stream.requiredMajor);
                                    const matchesSubj = doesTeacherMatchSubject(t, subject || draftSubject || subjectsById.get(cellDraft.subjectId));
                                    const busySec = teacherBusyBySlot.get(t.id)?.get(slot.id);
                                    const isBusyElsewhere = busySec && busySec !== section.id;
                                    const isRestricted = matchesUnavailablePeriod(slot, t.unavailablePeriods);
                                    const assignedOtherStream = otherStreamAssignedMap.get(t.id);

                                    let note = "";
                                    let isDisabled = false;

                                    if (assignedOtherStream) {
                                      note = `Assigned to ${assignedOtherStream}`;
                                      isDisabled = true;
                                    } else if (isBusyElsewhere) {
                                      note = "Busy";
                                      isDisabled = true;
                                    } else if (isRestricted) {
                                      note = "Restricted";
                                      isDisabled = true;
                                    }

                                    const candidateItem = {
                                      teacher: t,
                                      tier,
                                      note,
                                      isDisabled,
                                    };

                                    if (tier >= 2) {
                                      streamSpecialists.push(candidateItem);
                                    } else if (tier === 1 || matchesSubj) {
                                      eligibleDepartmentFaculty.push(candidateItem);
                                    } else {
                                      otherFaculty.push(candidateItem);
                                    }
                                  });

                                  return (
                                    <div key={idx} style={{ display: "grid", gap: 1 }}>
                                      <div
                                        style={{
                                          fontSize: 9,
                                          fontWeight: 700,
                                          color: "#4338ca",
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          lineHeight: 1.1,
                                        }}
                                      >
                                        <span
                                          style={{
                                            maxWidth: 130,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                          }}
                                          title={stream.name}
                                        >
                                          {stream.name || `Stream ${idx + 1}`}:
                                        </span>
                                        {stream.defaultTeacherId ? (
                                          <span style={{ fontSize: 8, color: "#6b7280", fontWeight: 500 }}>
                                            (Default)
                                          </span>
                                        ) : null}
                                      </div>
                                      <select
                                        value={assignedTeacherId}
                                        onChange={(event) =>
                                          handleCellStreamTeacherChange(section, slot, idx, stream.name, event.target.value)
                                        }
                                        style={{
                                          ...cellEditorSelectStyle(),
                                          fontSize: 10,
                                          padding: "2px 4px",
                                          height: 24,
                                        }}
                                        disabled={readOnly}
                                      >
                                        <option value="">Select teacher...</option>
                                        {streamSpecialists.length > 0 && (
                                          <optgroup label={`${stream.name} Specialists`}>
                                            {streamSpecialists.map(({ teacher: t, note, isDisabled }) => (
                                              <option key={t.id} value={t.id} disabled={isDisabled}>
                                                {t.name} {t.major ? `(${t.major})` : t.specialization ? `(${t.specialization})` : ""} {note ? `— ${note}` : ""}
                                              </option>
                                            ))}
                                          </optgroup>
                                        )}
                                        {eligibleDepartmentFaculty.length > 0 && (
                                          <optgroup label="Department / Program Faculty">
                                            {eligibleDepartmentFaculty.map(({ teacher: t, note, isDisabled }) => (
                                              <option key={t.id} value={t.id} disabled={isDisabled}>
                                                {t.name} ({t.department || "Faculty"}) {note ? `— ${note}` : ""}
                                              </option>
                                            ))}
                                          </optgroup>
                                        )}
                                        {otherFaculty.length > 0 && (
                                          <optgroup label="Other Available Faculty">
                                            {otherFaculty.map(({ teacher: t, note, isDisabled }) => (
                                              <option key={t.id} value={t.id} disabled={isDisabled}>
                                                {t.name} ({t.department || "General"}) {note ? `— ${note}` : ""}
                                              </option>
                                            ))}
                                          </optgroup>
                                        )}
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <select
                                value={cellDraft.teacherId}
                                onChange={(event) => handleCellTeacherChange(section, slot, event.target.value)}
                                style={cellEditorSelectStyle()}
                                disabled={!cellDraft.subjectId || readOnly}
                              >
                                <option value="">Select teacher</option>
                                {teacherOptions.map((option) => (
                                  <option key={option.id} value={option.id} disabled={option.restricted}>
                                    {option.restricted
                                      ? `${option.name} (${option.restrictedReason || "Restricted"})`
                                      : option.statusNote
                                        ? `${option.name} (${option.statusNote})`
                                        : option.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        ) : (assignment || draftSubject) ? (
                          <div style={{ display: "grid", gap: 3 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                              <span style={{ color: "#263475", fontSize: 11, fontWeight: 700 }}>
                                {activeCellSubject?.subjectName || "Subject"}
                              </span>
                              {isMultiTeacherCell ? (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                    background: isCellIncomplete ? "#fee2e2" : "#dcfce7",
                                    color: isCellIncomplete ? "#991b1b" : "#166534",
                                    border: isCellIncomplete ? "1px solid #fca5a5" : "1px solid #86efac",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {assignedDistinctIds.size}/{requiredTeacherCount} Teachers
                                </span>
                              ) : Array.isArray(assignment?.coTeacherIds) && assignment.coTeacherIds.length > 0 ? (
                                <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 4, background: "#fef3c7", color: "#92400e", whiteSpace: "nowrap" }}>
                                  {assignment.coTeacherIds.length + 1} Teachers
                                </span>
                              ) : null}
                            </div>
                            {isMultiTeacherCell ? (
                              <div style={{ display: "grid", gap: 2 }}>
                                {resolvedStreamRows.map((row, bIdx) => {
                                  const hasStreamTeacher = Boolean(row.teacherId && row.teacherName);
                                  return (
                                    <span
                                      key={bIdx}
                                      style={{
                                        color: hasStreamTeacher ? "#3b4a74" : "#b91c1c",
                                        fontSize: 10,
                                        lineHeight: 1.25,
                                        fontWeight: hasStreamTeacher ? 500 : 700,
                                      }}
                                    >
                                      <b style={{ color: hasStreamTeacher ? "#1e293b" : "#991b1b" }}>{row.streamName}:</b>{" "}
                                      {hasStreamTeacher ? row.teacherName : "Unassigned"}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : Array.isArray(assignment?.coTeacherIds) && assignment.coTeacherIds.length > 0 ? (
                              <span style={{ color: "#51608d", fontSize: 10, lineHeight: 1.2 }}>
                                {[teacher?.name || "Teacher", ...assignment.coTeacherIds.map((id) => facultyById.get(id)?.name || id)].join(", ")}
                              </span>
                            ) : (
                              <span
                                style={{
                                  color: (teacher?.name || draftTeacher?.name) ? "#51608d" : "#b91c1c",
                                  fontSize: 11,
                                  fontWeight: (teacher?.name || draftTeacher?.name) ? 500 : 700,
                                }}
                              >
                                {teacher?.name || draftTeacher?.name || "Unassigned"}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#a0abc7", fontSize: 11 }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    );
  }, [
    sections,
    visibleSections,
    generatorPeriods,
    generatorDays,
    hasDualSessions,
    regularDaysLabel,
    shortenedDaysLabel,
    compactGrid,
    slots,
    slotsById,
    schedule,
    cellEditorDrafts,
    conflictMessagesByCell,
    subjects,
    subjectsById,
    facultyById,
    activeTeachers,
    teacherBusyBySlot,
    activeCellKey,
    readOnly,
    scheduleType,
    config,
  ]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <style>{`.sg-grid-cell { transition: box-shadow 120ms ease; } .sg-grid-cell:hover { box-shadow: inset 0 0 0 1.5px #6366f1; }`}</style>
      {!hideControls && (
        <div className={previewDraftModal ? "turotugma-no-print" : ""} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>{isGeneratorMode ? "Schedule Generator" : "Schedule Maker"}</h1>
            <p style={{ margin: "8px 0 0", color: "#5b6787", fontSize: 14, maxWidth: 920 }}>
              {isGeneratorMode
                ? "Generate conflict-aware timetables for JHS and SHS from subject workload, school time frame, and breaks."
                : "Generate conflict-aware timetables for JHS and SHS, configure period structures and breaks, assign directly in the grid, and manage draft or published schedules."}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              width: "100%",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "16px 18px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
            }}
          >
            {/* Row 1: Schedule Scope & Summary (Left) + Primary Lifecycle Actions (Right) — Single Line */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                flexWrap: "nowrap",
                overflowX: "auto",
              }}
            >
              {/* Left: Schedule Scope Dropdown + Status & Roster Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: "#475569", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  Scope:
                </span>
                <select
                  value={scheduleType}
                  onChange={(event) => setScheduleType(event.target.value)}
                  style={{
                    ...selectStyle(false),
                    width: 215,
                    minWidth: 195,
                    fontWeight: 700,
                    fontSize: 12.5,
                    color: "#1e293b",
                    borderColor: "#cbd5e1",
                    padding: "0 10px",
                    height: 34,
                  }}
                  disabled={readOnly}
                >
                  {filteredScheduleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* Live Status Pill */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 9px",
                    borderRadius: 99,
                    whiteSpace: "nowrap",
                    background:
                      scheduleStatusLabel === "Published"
                        ? "#ecfdf5"
                        : scheduleStatusLabel === "Draft Saved"
                        ? "#eef2ff"
                        : scheduleStatusLabel === "Draft (Unsaved)"
                        ? "#fffbeb"
                        : "#f1f5f9",
                    color:
                      scheduleStatusLabel === "Published"
                        ? "#047857"
                        : scheduleStatusLabel === "Draft Saved"
                        ? "#3B4197"
                        : scheduleStatusLabel === "Draft (Unsaved)"
                        ? "#b45309"
                        : "#64748b",
                    border:
                      scheduleStatusLabel === "Published"
                        ? "1px solid #a7f3d0"
                        : scheduleStatusLabel === "Draft Saved"
                        ? "1px solid #c7d2fe"
                        : scheduleStatusLabel === "Draft (Unsaved)"
                        ? "1px solid #fde68a"
                        : "1px solid #e2e8f0",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background:
                        scheduleStatusLabel === "Published"
                          ? "#10b981"
                          : scheduleStatusLabel === "Draft Saved"
                          ? "#3B4197"
                          : scheduleStatusLabel === "Draft (Unsaved)"
                          ? "#f59e0b"
                          : "#94a3b8",
                    }}
                  />
                  {scheduleStatusLabel}
                </span>

                {/* Active Teachers & Sections Compact Pills */}
                <span
                  title={`${activeTeachersForSchedule.length} active teachers eligible for ${isJhsSchedule ? "JHS" : "SHS"} workloads`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "4px 8px",
                    borderRadius: 99,
                    background: "#f8fafc",
                    color: "#475569",
                    border: "1px solid #e2e8f0",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ color: "#3B4197", display: "inline-flex", alignItems: "center" }}>
                    <TeachersCardIcon />
                  </span>
                  <span>
                    <strong style={{ color: "#1e293b", fontWeight: 800 }}>{activeTeachersForSchedule.length}</strong> Teachers
                  </span>
                </span>

                <span
                  title={`${sections.length} total sections (${isJhsSchedule ? "Grades 7–10" : "SHS Tracks"})`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "4px 8px",
                    borderRadius: 99,
                    background: "#f8fafc",
                    color: "#475569",
                    border: "1px solid #e2e8f0",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ color: "#3B4197", display: "inline-flex", alignItems: "center" }}>
                    <SectionsCardIcon />
                  </span>
                  <span>
                    <strong style={{ color: "#1e293b", fontWeight: 800 }}>{sections.length}</strong> Sections
                  </span>
                </span>
              </div>

              {/* Right: Primary Lifecycle Actions — Always on the same single line */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleGenerateSchedule()}
                  style={{
                    ...primaryActionStyle(),
                    height: 34,
                    padding: "0 13px",
                    background: "linear-gradient(135deg, #3B4197 0%, #2563eb 100%)",
                    boxShadow: "0 2px 6px rgba(59, 65, 151, 0.25)",
                    fontWeight: 800,
                    fontSize: 12,
                    whiteSpace: "nowrap",
                  }}
                  disabled={readOnly}
                >
                  <ActionButtonLabel icon={<GenerateIcon />}>
                    {schedule ? "Re-Generate" : "Generate"}
                  </ActionButtonLabel>
                </button>

                <button
                  type="button"
                  id="save-draft-btn"
                  onClick={handleSaveDraft}
                  style={{
                    ...secondaryActionStyle(),
                    height: 34,
                    padding: "0 11px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#1e293b",
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                  disabled={readOnly}
                  title="Save timetable state as a draft"
                >
                  <ActionButtonLabel icon={<SaveIcon />}>Save Draft</ActionButtonLabel>
                </button>

                <button
                  type="button"
                  id="publish-schedule-btn"
                  onClick={handlePublish}
                  disabled={readOnly}
                  title={readOnly ? "Read-only mode" : "Publish schedule for school viewing"}
                  style={{
                    ...secondaryActionStyle(),
                    height: 34,
                    padding: "0 12px",
                    border: "1px solid #16a34a",
                    background: "#16a34a",
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 700,
                    opacity: readOnly ? 0.55 : 1,
                    cursor: readOnly ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <ActionButtonLabel icon={<PublishIcon />}>Publish</ActionButtonLabel>
                </button>

                <button
                  type="button"
                  onClick={handleExportCurrentSchedule}
                  disabled={!schedule}
                  title={schedule ? "Preview timetable and export as landscape A4 PDF" : "Generate a schedule first to export as PDF"}
                  style={{
                    ...secondaryActionStyle(),
                    height: 34,
                    padding: "0 11px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#1e293b",
                    fontSize: 12,
                    fontWeight: 700,
                    opacity: !schedule ? 0.55 : 1,
                    cursor: !schedule ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <ActionButtonLabel icon={<ExportPdfIcon />}>Export PDF</ActionButtonLabel>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDataRefreshToken((current) => current + 1);
                    showNotice("Data refreshed from storage.", "success");
                  }}
                  style={{
                    ...secondaryActionStyle(),
                    height: 34,
                    padding: "0 10px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                  disabled={readOnly}
                  title="Reload teachers, sections and subjects from storage"
                >
                  <ActionButtonLabel icon={<RefreshIcon />}>Refresh</ActionButtonLabel>
                </button>
              </div>
            </div>

            {/* Row 2: Unified Segmented Inspector & Diagnostics Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "6px 10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 6px" }}>
                  Inspectors:
                </span>

                {/* Drafts Drawer Trigger */}
                <button
                  type="button"
                  onClick={() => setActiveDrawerTab((prev) => (prev === "drafts" ? null : "drafts"))}
                  disabled={readOnly}
                  style={{
                    ...secondaryActionStyle(),
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 7,
                    background: activeDrawerTab === "drafts" ? "#3B4197" : "#ffffff",
                    border: activeDrawerTab === "drafts" ? "1px solid #3B4197" : "1px solid #cbd5e1",
                    color: activeDrawerTab === "drafts" ? "#ffffff" : "#334155",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <ActionButtonLabel icon={<DraftsIcon />}>
                    <span>Drafts</span>
                    <span
                      style={{
                        marginLeft: 4,
                        padding: "1px 6px",
                        borderRadius: 99,
                        fontSize: 10.5,
                        background: activeDrawerTab === "drafts" ? "rgba(255,255,255,0.22)" : "#f1f5f9",
                        color: activeDrawerTab === "drafts" ? "#ffffff" : "#334155",
                        fontWeight: 800,
                      }}
                    >
                      {draftsForCurrentSchedule.length}
                    </span>
                  </ActionButtonLabel>
                </button>

                {/* Conflicts Drawer Trigger */}
                <button
                  type="button"
                  onClick={() => setActiveDrawerTab((prev) => (prev === "conflicts" ? null : "conflicts"))}
                  disabled={readOnly}
                  style={{
                    ...secondaryActionStyle(),
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 7,
                    background:
                      activeDrawerTab === "conflicts"
                        ? (conflictCount > 0 ? "#dc2626" : "#3B4197")
                        : "#ffffff",
                    border:
                      activeDrawerTab === "conflicts"
                        ? (conflictCount > 0 ? "1px solid #dc2626" : "1px solid #3B4197")
                        : (conflictCount > 0 ? "1px solid #fca5a5" : "1px solid #cbd5e1"),
                    color:
                      activeDrawerTab === "conflicts"
                        ? "#ffffff"
                        : (conflictCount > 0 ? "#dc2626" : "#334155"),
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                  title={conflictCount > 0 ? `${conflictCount} conflicts detected` : "No conflicts detected"}
                >
                  <ActionButtonLabel icon={conflictCount > 0 ? <WarningIcon /> : <CheckCircleIcon />}>
                    <span>Conflicts</span>
                    <span
                      style={{
                        marginLeft: 4,
                        padding: "1px 6px",
                        borderRadius: 99,
                        fontSize: 10.5,
                        background:
                          activeDrawerTab === "conflicts"
                            ? "rgba(255,255,255,0.22)"
                            : (conflictCount > 0 ? "#fee2e2" : "#dcfce7"),
                        color:
                          activeDrawerTab === "conflicts"
                            ? "#ffffff"
                            : (conflictCount > 0 ? "#991b1b" : "#166534"),
                        fontWeight: 800,
                      }}
                    >
                      {conflictCount}
                    </span>
                  </ActionButtonLabel>
                </button>

                {/* Period Restrictions Drawer Trigger */}
                <button
                  type="button"
                  onClick={() => setActiveDrawerTab((prev) => (prev === "restrictions" ? null : "restrictions"))}
                  disabled={readOnly}
                  style={{
                    ...secondaryActionStyle(),
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 7,
                    background: activeDrawerTab === "restrictions" ? "#3B4197" : "#ffffff",
                    border: activeDrawerTab === "restrictions" ? "1px solid #3B4197" : "1px solid #cbd5e1",
                    color: activeDrawerTab === "restrictions" ? "#ffffff" : "#334155",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <ActionButtonLabel icon={<RestrictionIcon />}>
                    <span>Restrictions</span>
                    <span
                      style={{
                        marginLeft: 4,
                        padding: "1px 6px",
                        borderRadius: 99,
                        fontSize: 10.5,
                        background: activeDrawerTab === "restrictions" ? "rgba(255,255,255,0.22)" : "#f1f5f9",
                        color: activeDrawerTab === "restrictions" ? "#ffffff" : "#334155",
                        fontWeight: 800,
                      }}
                    >
                      {effectiveTeacherRestrictions.length + subjectRestrictionsForDisplay.length}
                    </span>
                  </ActionButtonLabel>
                </button>

                {/* Subject Distribution Checklist Drawer Trigger */}
                {(() => {
                  const checklistIncompleteCount = subjectChecklistMetrics?.incompleteCount || 0;
                  const checklistNeedsAttention = Boolean(schedule) && checklistIncompleteCount > 0;
                  return (
                    <button
                      type="button"
                      onClick={() => setActiveDrawerTab((prev) => (prev === "checklist" ? null : "checklist"))}
                      disabled={readOnly}
                      style={{
                        ...secondaryActionStyle(),
                        height: 32,
                        padding: "0 12px",
                        borderRadius: 7,
                        background:
                          activeDrawerTab === "checklist"
                            ? (checklistNeedsAttention ? "#dc2626" : "#3B4197")
                            : "#ffffff",
                        border:
                          activeDrawerTab === "checklist"
                            ? (checklistNeedsAttention ? "1px solid #dc2626" : "1px solid #3B4197")
                            : (checklistNeedsAttention ? "1px solid #fca5a5" : "1px solid #cbd5e1"),
                        color:
                          activeDrawerTab === "checklist"
                            ? "#ffffff"
                            : (checklistNeedsAttention ? "#dc2626" : "#334155"),
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                      title={
                        schedule
                          ? checklistNeedsAttention
                            ? `${checklistIncompleteCount} subject(s) incomplete (${subjectChecklistMetrics?.percentage ?? 0}% complete)`
                            : "All curriculum subjects are 100% distributed"
                          : "Open Subject Distribution & Teacher Coverage Checklist"
                      }
                    >
                      <ActionButtonLabel icon={checklistNeedsAttention ? <WarningIcon /> : <CheckCircleIcon />}>
                        <span>Subject Checklist</span>
                        <span
                          style={{
                            marginLeft: 4,
                            padding: "1px 6px",
                            borderRadius: 99,
                            fontSize: 10.5,
                            background:
                              activeDrawerTab === "checklist"
                                ? "rgba(255,255,255,0.22)"
                                : checklistNeedsAttention
                                ? "#fee2e2"
                                : schedule
                                ? "#dcfce7"
                                : "#f1f5f9",
                            color:
                              activeDrawerTab === "checklist"
                                ? "#ffffff"
                                : checklistNeedsAttention
                                ? "#991b1b"
                                : schedule
                                ? "#166534"
                                : "#475569",
                            fontWeight: 800,
                          }}
                        >
                          {checklistIncompleteCount}
                        </span>
                      </ActionButtonLabel>
                    </button>
                  );
                })()}
              </div>

              {/* Right side of Inspector Bar: Compact Live Assignment Validation Counter */}
              {schedule ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, padding: "0 6px", whiteSpace: "nowrap" }}>
                  {schedule.generationTimeMs ? (
                    <>
                      <span
                        style={{
                          background: "#eef2ff",
                          color: "#3B4197",
                          border: "1px solid #c7d2fe",
                          borderRadius: 999,
                          padding: "2px 8px",
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                        title="Exact solver execution time"
                      >
                        Solved in {schedule.generationTimeMs} ms ({schedule.generationTimeSec}s)
                      </span>
                      <span style={{ color: "#cbd5e1" }}>•</span>
                    </>
                  ) : null}
                  <span style={{ color: "#166534", fontWeight: 700 }}>
                    Valid: {assignmentValidationSummary.validAssigned}
                  </span>
                  <span style={{ color: "#cbd5e1" }}>•</span>
                  <span style={{ color: assignmentValidationSummary.invalidAssigned > 0 ? "#dc2626" : "#64748b", fontWeight: 700 }}>
                    Invalid: {assignmentValidationSummary.invalidAssigned}
                  </span>
                  <span style={{ color: "#cbd5e1" }}>•</span>
                  <span style={{ color: "#475569", fontWeight: 600 }}>
                    Slots: <strong>{assignmentValidationSummary.totalAssigned}</strong> / {assignmentValidationSummary.totalRequired}
                  </span>
                </div>
              ) : null}
            </div>

            <ConfirmationModal
              open={confirmModal.open}
              message={confirmModal.message}
              onConfirm={confirmModal.onConfirm}
              onCancel={confirmModal.onCancel}
              title={confirmModal.title || "Publish Confirmation"}
              confirmLabel={confirmModal.confirmLabel || "Publish Anyway"}
              confirmColor={confirmModal.confirmColor || "#2563eb"}
            />
          </div>
        </div>
      )}

      {/* Clear Grid Confirmation Modal (separate from publish) */}
      {clearGridModal && clearGridModal.open && (
        <ConfirmationModal
          open={clearGridModal.open}
          message={clearGridModal.message}
          onConfirm={clearGridModal.onConfirm}
          onCancel={clearGridModal.onCancel}
          title="Clear Grid Confirmation"
          confirmLabel="Yes, Clear Grid"
        />
      )}

      {/* Draft Timetable Preview Modal */}
      {previewDraftModal ? (
        <DraftTimetablePreviewModal
          open={!!previewDraftModal}
          draft={previewDraftModal}
          onClose={() => setPreviewDraftModal(null)}
          onLoad={(draftId) => {
            handleLoadDraft(draftId);
            setPreviewDraftModal(null);
          }}
        />
      ) : null}

      {/* Schedule Generation Summary Quick Feedback Overlay */}
      {generationSummary && (
        <GenerationSummaryOverlay
          summary={generationSummary}
          onClose={() => setGenerationSummary(null)}
          onPublish={handlePublish}
          canPublish={!readOnly}
        />
      )}

      {notice.text && !activeDrawerTab ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 100000,
            background: notice.type === "error" ? "#dc2626" : notice.type === "info" ? "#2563eb" : notice.type === "warning" ? "#d97706" : "#16a34a",
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
          <span>{notice.type === "error" ? "!" : notice.type === "info" ? "i" : notice.type === "warning" ? "!" : "✓"}</span>
          <span>{notice.text}</span>
        </div>
      ) : null}

      <div className={previewDraftModal ? "turotugma-no-print" : ""} style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 12, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, color: "#1f2c6f", fontSize: 18 }}>Schedule Grid</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => setCompactGrid((prev) => !prev)}
                style={{
                  ...secondaryActionStyle(),
                  padding: "6px 12px",
                  background: compactGrid ? "#eef2ff" : "#ffffff",
                  color: compactGrid ? "#3B4197" : "#475569",
                  border: compactGrid ? "1.5px solid #3B4197" : "1px solid #cbd5e1",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
                title="Toggle compact zoom for 1366x768 projector screens"
              >
                {compactGrid ? "Standard Grid Size" : "Compact Projector View"}
              </button>

              {/* Functional Clear Grid button */}
              <button
                id="btn-clear-grid"
                type="button"
                style={{
                  ...secondaryActionStyle(),
                  width: 120,
                  textAlign: "center",
                  background: "#f5f6fa",
                  color: "#b53f4e",
                  border: "1px solid #e3e7ef",
                  fontWeight: 700,
                  cursor: readOnly || !schedule ? "not-allowed" : "pointer",
                  opacity: readOnly || !schedule ? 0.7 : 1,
                }}
                disabled={readOnly || !schedule}
                title="Clear all assignments in the grid"
                onClick={() => {
                  if (!schedule) return;
                  const isDraftSaved = schedule.status === "draft" || draftsForCurrentSchedule.some((d) => d.id === schedule.id);
                  if (isDraftSaved) {
                    handleClearGrid();
                  } else {
                    setClearGridModal({
                      open: true,
                      message: "This schedule is not saved as a draft. Clearing the grid will remove all assignments and cannot be undone. Do you want to continue?",
                      onConfirm: () => {
                        setClearGridModal({ open: false, message: '', onConfirm: null, onCancel: null });
                        handleClearGrid();
                      },
                      onCancel: () => setClearGridModal({ open: false, message: '', onConfirm: null, onCancel: null }),
                    });
                  }
                }}
              >
                Clear Grid
              </button>
            </div>
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
              <select value={gridSessionFilter} onChange={(event) => setGridSessionFilter(event.target.value)} style={selectStyle(false)} disabled={readOnly}>
                <option value="all">All Sessions</option>
                <option value="regular">Regular Session</option>
                <option value="shortened">Shortened Session</option>
              </select>
            </Field>

            <Field label="Grade Level">
              <select value={gridGradeFilter} onChange={(event) => setGridGradeFilter(event.target.value)} style={selectStyle(false)} disabled={readOnly}>
                <option value="all">All Grades</option>
                {gridGradeOptions.map((grade) => (
                  <option key={grade} value={grade}>{`Grade ${grade}`}</option>
                ))}
              </select>
            </Field>

            {isJhsSchedule ? (
              <Field label="Section Type">
                <select value={gridSectionTypeFilter} onChange={(event) => setGridSectionTypeFilter(event.target.value)} style={selectStyle(false)} disabled={readOnly}>
                  <option value="all">All Section Types</option>
                  {jhsSectionTypeOptions.map((sectionType) => (
                    <option key={sectionType} value={sectionType}>{sectionType}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Strand/Track">
                <select value={gridTrackFilter} onChange={(event) => setGridTrackFilter(event.target.value)} style={selectStyle(false)} disabled={readOnly}>
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
          ) : visibleSections.length === 0 ? (
            <p style={{ margin: "10px 0 0", color: "#7a86a7", fontSize: 13 }}>
              No sections match the selected filters.
            </p>
          ) : generatorPeriods.length === 0 ? (
            <p style={{ margin: "10px 0 0", color: "#7a86a7", fontSize: 13 }}>
              No periods available. Review scheduling configurations.
            </p>
          ) : generatorDays.length === 0 ? (
            <p style={{ margin: "10px 0 0", color: "#7a86a7", fontSize: 13 }}>
              No days configured for the selected session type. Review scheduling configurations.
            </p>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #e5eaf4", borderRadius: 10 }}>
              {scheduleGridTable}
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
      </div>

      {/* Conflicts and recommendations are managed in ScheduleDrawerPanel */}

      <ScheduleDrawerPanel
        activeDrawerTab={activeDrawerTab}
        setActiveDrawerTab={setActiveDrawerTab}
        draftsForCurrentSchedule={draftsForCurrentSchedule}
        publishedSchedules={publishedSchedules}
        setDrafts={setDrafts}
        handleLoadDraft={handleLoadDraft}
        handleDeleteDraft={handleDeleteDraft}
        setPreviewDraftModal={setPreviewDraftModal}
        formatDateTime={formatDateTime}
        smallActionStyle={smallActionStyle}
        smallDangerStyle={smallDangerStyle}
        schedule={schedule}
        conflictsForDisplay={conflictsForDisplay}
        conflictDetailsForDisplay={conflictDetailsForDisplay}
        conflictMessagesByCell={conflictMessagesByCell}
        subjectChecklistMetrics={subjectChecklistMetrics}
        isAutoFixing={isAutoFixing}
        sections={sections}
        slots={slots}
        subjects={subjects}
        activeTeachers={activeTeachers}
        facultyById={facultyById}
        subjectsById={subjectsById}
        slotsById={slotsById}
        sectionsById={sectionsById}
        config={config}
        scheduleType={scheduleType}
        cellEditorDrafts={cellEditorDrafts}
        setCellEditorDrafts={setCellEditorDrafts}
        setSchedule={setSchedule}
        showNotice={showNotice}
        clearNotice={clearNotice}
        handleAutoFixAllConflicts={handleAutoFixAllConflicts}
        handleAutoDistributeFromChecklist={handleAutoDistributeFromChecklist}
        secondaryActionStyle={secondaryActionStyle}
        effectiveTeacherRestrictions={effectiveTeacherRestrictions}
        showTeacherRestrictionEditor={showTeacherRestrictionEditor}
        setShowTeacherRestrictionEditor={setShowTeacherRestrictionEditor}
        teacherRestrictionForm={teacherRestrictionForm}
        setTeacherRestrictionForm={setTeacherRestrictionForm}
        ancillaryTaskOptions={ancillaryTaskOptions}
        teacherRestrictionOptions={teacherRestrictionOptions}
        restrictionPeriodOptions={restrictionPeriodOptions}
        addTeacherRestriction={addTeacherRestriction}
        removeTeacherRestriction={removeTeacherRestriction}
        subjectRestrictionsForDisplay={subjectRestrictionsForDisplay}
        showSubjectRestrictionEditor={showSubjectRestrictionEditor}
        setShowSubjectRestrictionEditor={setShowSubjectRestrictionEditor}
        subjectRestrictionForm={subjectRestrictionForm}
        setSubjectRestrictionForm={setSubjectRestrictionForm}
        subjectRestrictionOptions={subjectRestrictionOptions}
        addSubjectRestriction={addSubjectRestriction}
        removeSubjectRestriction={removeSubjectRestriction}
        EMPTY_TEACHER_RESTRICTION_FORM={EMPTY_TEACHER_RESTRICTION_FORM}
        EMPTY_SUBJECT_RESTRICTION_FORM={EMPTY_SUBJECT_RESTRICTION_FORM}
        notice={notice}
        capacityIssues={capacityIssues}
        handleQuickIncreasePeriods={handleQuickIncreasePeriods}
        handleSaveSpaSettings={handleSaveSpaSettings}
      />
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
          adviser: sanitizeText(section?.adviser) || sanitizeText(section?.classAdviser) || "",
          classAdviser: sanitizeText(section?.classAdviser) || sanitizeText(section?.adviser) || "",
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
        cluster: sanitizeText(section?.cluster) || "",
        adviser: sanitizeText(section?.adviser) || sanitizeText(section?.classAdviser) || "",
        classAdviser: sanitizeText(section?.classAdviser) || sanitizeText(section?.adviser) || "",
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
      const rawGradeLevel = sanitizeText(subject?.gradeLevel);
      const gradeLevel = schoolLevel === "jhs" ? rawGradeLevel || "7-10" : rawGradeLevel;
      const strand = sanitizeText(subject?.strand).toUpperCase();
      const semester = sanitizeText(subject?.semester);
      const dailyMinutes = parseBoundedNumber(subject?.dailyMinutes, 1, 480, 0);
      const classesPerWeek = parseBoundedNumber(subject?.classesPerWeek, 1, 12, 0);
      const hoursPerWeek = parseBoundedDecimal(subject?.hoursPerWeek, 1, 12, 1);
      const id = sanitizeText(subject?.id) || `${schoolLevel}-${code || name || "subject"}-${gradeLevel}-${semester}-${strand}-${index}`;
      const isDefaultBreakout =
        code === "SPASPEC" ||
        subject?.teachingMode === "breakout" ||
        Number(subject?.requiredTeachers) >= 2 ||
        (Array.isArray(subject?.breakoutStreams) && subject.breakoutStreams.length >= 2);
      const requiredTeachers = isDefaultBreakout
        ? Math.max(
            2,
            Number(subject?.requiredTeachers) ||
              (Array.isArray(subject?.breakoutStreams) ? subject.breakoutStreams.length : 0) ||
              (code === "SPASPEC" ? 3 : 2)
          )
        : 1;

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
        dailyMinutes,
        classesPerWeek,
        hoursPerWeek,
        teachingMode: isDefaultBreakout ? "breakout" : (subject?.teachingMode || "single"),
        requiredTeachers,
      };
    })
    .filter((subject) => !!subject.subjectName);
}

function extractTeacherAncillaryTasks(teacher) {
  if (!teacher) return [];
  const tasks = new Set();

  const handleEntry = (val) => {
    const clean = sanitizeText(val);
    if (clean) tasks.add(clean);
  };

  if (Array.isArray(teacher.ancillaryAssignments)) {
    teacher.ancillaryAssignments.forEach(handleEntry);
  } else if (typeof teacher.ancillaryAssignments === "string") {
    try {
      const parsed = JSON.parse(teacher.ancillaryAssignments);
      if (Array.isArray(parsed)) parsed.forEach(handleEntry);
      else if (typeof parsed === "string") parsed.split(",").forEach(handleEntry);
    } catch {
      teacher.ancillaryAssignments.split(",").forEach(handleEntry);
    }
  }

  if (teacher.ancillaryTask) handleEntry(teacher.ancillaryTask);
  if (teacher.ancillary) handleEntry(teacher.ancillary);

  return Array.from(tasks);
}

function isPermanentTeacher(teacher) {
  if (!teacher) return false;
  const status = String(teacher.employmentStatus || "").trim().toLowerCase();

  if (status) {
    if (status.includes("regular") || status.includes("permanent")) {
      return true;
    }
    if (status.includes("probationary") || status.includes("part-time") || status.includes("contract") || status.includes("substitute")) {
      return false;
    }
  }

  const pos = String(teacher.position || "").trim().toLowerCase();
  if (pos.includes("regular") || pos.includes("permanent") || pos.includes("master teacher")) {
    return true;
  }

  return false;
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
      isClassAdviser: Boolean(
        teacher?.isClassAdviser ||
        (Array.isArray(teacher?.ancillaryAssignments) && teacher.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
      ),
      advisorySection: sanitizeText(teacher?.advisorySection),
      ancillaryAssignments: extractTeacherAncillaryTasks(teacher),
      unavailablePeriods: normalizeStringArray(teacher?.unavailablePeriods),
      subjectExpertise: normalizeStringArray(teacher?.subjectExpertise),
      gradeLevelAssignments: normalizeStringArray(teacher?.gradeLevelAssignments),
      assignedLoadPercent: Number.isFinite(teacher?.assignedLoadPercent) ? teacher.assignedLoadPercent : 0,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function generateSchedule({ scheduleType, sections, slots, subjects, activeTeachers, config, lockedAssignments = null }) {
  const levelKey = scheduleType === "jhs" ? "jhs" : "shs";
  const levelConfig = config?.[levelKey] || (scheduleType === "jhs" ? config?.jhs : config?.shs) || {};
  const effectiveConstraints = {
    ...(config?.constraints || {}),
    ...(levelConfig?.constraints || {}),
  };
  const policy = effectiveConstraints.teacherAssignmentPolicy || "consolidated_balanced";
  const maxCap = Number(effectiveConstraints.maxTeachingLoadCap) || 24;
  const enforceCap = effectiveConstraints.enforceMaxLoadCap !== false;

  const assignments = {};
  const conflicts = [];
  const conflictDetailByKey = new Map();

  const pushConflict = (message, cellKeys = []) => {
    const normalizedMessage = sanitizeText(message);
    if (!normalizedMessage) {
      return;
    }

    const normalizedCellKeys = normalizeStringArray(cellKeys);
    const detailKey = `${normalizedMessage}::${[...normalizedCellKeys].sort().join("|")}`;

    if (!conflictDetailByKey.has(detailKey)) {
      conflictDetailByKey.set(detailKey, {
        message: normalizedMessage,
        cellKeys: normalizedCellKeys,
      });
    }

    conflicts.push(normalizedMessage);
  };

  const teacherBusyBySlot = new Map();
  const teacherLoad = new Map(activeTeachers.map((teacher) => [teacher.id, 0]));
  const teacherAssignedPreps = new Map(activeTeachers.map((teacher) => [teacher.id, new Set()]));
  const slotsByIdForSolver = new Map(slots.map((s) => [s.id, s]));
  const subjectsByIdForSolver = new Map(subjects.map((s) => [s.id, s]));
  const sectionsByIdForSolver = new Map(sections.map((s) => [s.id, s]));
  const facultyByIdForSolver = new Map(activeTeachers.map((t) => [t.id, t]));
  const lockedCellKeys = new Set();
  const lockedEntriesBySection = new Map();
  const hgpSubjectObjForLocked = subjects.find(isHomeroomOrAdvisorySubject) || null;

  if (lockedAssignments && typeof lockedAssignments === "object") {
    Object.entries(lockedAssignments).forEach(([cellKey, rawAsgn]) => {
      if (!rawAsgn || !rawAsgn.subjectId) return;
      const [secId, slotId] = splitCellKey(cellKey);
      const secObj = sectionsByIdForSolver.get(secId);
      const slotObj = slotsByIdForSolver.get(slotId);
      if (!secObj || !slotObj || slotObj.isBreak) return;

      const tIds = collectAssignmentTeacherIds(rawAsgn);
      if (tIds.length === 0) return;

      let subjObj = subjectsByIdForSolver.get(rawAsgn.subjectId) || null;
      if (
        !subjObj &&
        (String(rawAsgn.subjectId) === "universal-hgp" || String(rawAsgn.subjectCode || "").trim().toUpperCase() === "HGP")
      ) {
        subjObj = hgpSubjectObjForLocked;
      }

      const clonedAsgn = { ...rawAsgn };
      assignments[cellKey] = clonedAsgn;
      lockedCellKeys.add(cellKey);

      const secList = lockedEntriesBySection.get(secId) || [];
      secList.push({ cellKey, slotId, slotObj, subjObj, asgn: clonedAsgn });
      lockedEntriesBySection.set(secId, secList);

      tIds.forEach((tId) => {
        const busyForT = teacherBusyBySlot.get(tId) || new Map();
        busyForT.set(slotId, secId);
        teacherBusyBySlot.set(tId, busyForT);
        teacherLoad.set(tId, (teacherLoad.get(tId) || 0) + 1);
        if (subjObj && !isHomeroomOrAdvisorySubject(subjObj)) {
          const prepKey = getSubjectPreparationKey(subjObj, secObj);
          const prepsSet = teacherAssignedPreps.get(tId) || new Set();
          prepsSet.add(prepKey);
          teacherAssignedPreps.set(tId, prepsSet);
        }
      });
    });
  }

  // Teacher Non-Continuous Teaching Hours / Break Guard:
  // Checks if assigning teacherId to targetSlot would exceed maxConsecutive (default 3) back-to-back periods
  // without a vacant rest/preparation period, or exceed 5 total teaching periods on that single day.
  function wouldExceedContinuousTeachingLimit(teacherId, targetSlot, maxConsecutive = 3) {
    if (!teacherId || !targetSlot) return false;
    const busyMap = teacherBusyBySlot.get(teacherId);
    if (!busyMap || busyMap.size === 0) return false;

    const targetDay = targetSlot.day || "Monday";
    const targetPeriod = Number(targetSlot.period || 0);
    if (!targetPeriod) return false;

    const occupiedPeriodsOnDay = new Set();
    for (const [busySlotId] of busyMap.entries()) {
      const sObj = slotsByIdForSolver.get(busySlotId);
      if (sObj && sObj.day === targetDay) {
        const p = Number(sObj.period || 0);
        if (p > 0) occupiedPeriodsOnDay.add(p);
      }
    }

    if (occupiedPeriodsOnDay.has(targetPeriod)) return false;

    // 1. Daily load balance guard: avoid piling > 5 periods on a single day when weekly cap is 24 (avg 4.8/day)
    if (occupiedPeriodsOnDay.size >= 5) {
      return true;
    }

    // 2. Contiguous back-to-back teaching streak guard (max 3 consecutive periods without a vacant period)
    let streak = 1;
    let cursor = targetPeriod - 1;
    while (cursor >= 1 && occupiedPeriodsOnDay.has(cursor)) {
      streak += 1;
      cursor -= 1;
    }
    cursor = targetPeriod + 1;
    while (cursor <= 12 && occupiedPeriodsOnDay.has(cursor)) {
      streak += 1;
      cursor += 1;
    }

    return streak > maxConsecutive;
  }

  // Helper to shuffle an array in-place (Fisher-Yates)
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function getSubjectPreparationKey(subj, sec) {
    if (!subj) return "General";
    const name = String(subj.subjectName || subj.name || subj.subjectCode || "Subject").trim();
    if (/\b(?:7|8|9|10|11|12)\b/.test(name)) {
      return name;
    }
    const grade = sec?.grade || subj.gradeLevel;
    if (grade && String(grade) !== "7-10") {
      return `${name} ${grade}`;
    }
    return name;
  }

  // Capacity-based teacher sorting aligned with DepEd DO 005, s. 2024
  // Logic order: Qualification -> Authorized Capacity Ratio -> Minimizing Distinct Preps -> Raw Load
  function sortTeacherCandidates(candidates, subjectItem) {
    const prepKey = getSubjectPreparationKey(subjectItem);

    return candidates.slice().sort((left, right) => {
      const leftLoad = teacherLoad.get(left.id) || 0;
      const rightLoad = teacherLoad.get(right.id) || 0;

      // DepEd DO 005, s. 2024: Class Advisers receive 1 teaching load credit (5 hours ancillary credit)
      // and Major Ancillary roles receive 4 hours credit
      const applyCredits = config?.constraints?.applyDO005AdvisoryAncillaryCredits !== false;
      const isLeftAdviser = Boolean(
        left.isClassAdviser ||
        (Array.isArray(left.ancillaryAssignments) && left.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
      );
      const isRightAdviser = Boolean(
        right.isClassAdviser ||
        (Array.isArray(right.ancillaryAssignments) && right.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
      );

      const isLeftMajorAncillary = Boolean(
        Array.isArray(left.ancillaryAssignments) && left.ancillaryAssignments.some((a) => {
          const l = String(a).toLowerCase();
          return l.includes("drrm") || l.includes("ict") || l.includes("custodian") || l.includes("guidance") || l.includes("registrar") || l.includes("canteen");
        })
      );
      const isRightMajorAncillary = Boolean(
        Array.isArray(right.ancillaryAssignments) && right.ancillaryAssignments.some((a) => {
          const l = String(a).toLowerCase();
          return l.includes("drrm") || l.includes("ict") || l.includes("custodian") || l.includes("guidance") || l.includes("registrar") || l.includes("canteen");
        })
      );

      // Part-time working arrangement pro-rating
      const isLeftPartTime = Boolean(
        (left.workingArrangement && String(left.workingArrangement).toLowerCase().includes("part")) ||
        (left.employmentStatus && String(left.employmentStatus).toLowerCase().includes("part"))
      );
      const isRightPartTime = Boolean(
        (right.workingArrangement && String(right.workingArrangement).toLowerCase().includes("part")) ||
        (right.employmentStatus && String(right.employmentStatus).toLowerCase().includes("part"))
      );

      const baseLeftCap = isLeftPartTime ? Math.max(8, Math.round(maxCap * 0.5)) : maxCap;
      const baseRightCap = isRightPartTime ? Math.max(8, Math.round(maxCap * 0.5)) : maxCap;

      let leftRelief = 0;
      let rightRelief = 0;
      if (applyCredits) {
        if (isLeftAdviser) leftRelief = Math.max(leftRelief, 4);
        if (isLeftMajorAncillary) leftRelief = Math.max(leftRelief, 4);
        if (isRightAdviser) rightRelief = Math.max(rightRelief, 4);
        if (isRightMajorAncillary) rightRelief = Math.max(rightRelief, 4);
      }

      const leftCap = Math.max(12, baseLeftCap - leftRelief);
      const rightCap = Math.max(12, baseRightCap - rightRelief);

      // Feature 1: Max Teaching Load Cap constraint
      if (enforceCap) {
        const leftOver = leftLoad >= leftCap;
        const rightOver = rightLoad >= rightCap;
        if (!leftOver && rightOver) return -1;
        if (leftOver && !rightOver) return 1;
      }

      // Feature 1B: Consolidate active teachers (DepEd DO 005 Zero-Underload Engine)
      // If one candidate already has assigned teaching load and the other is idle (0 load),
      // prioritize the already-assigned candidate to reach the 20-24h balanced load before deploying new teachers.
      if (policy === "consolidated_balanced" || policy === "consolidated_plantilla") {
        const leftHasLoad = leftLoad > 0 ? 1 : 0;
        const rightHasLoad = rightLoad > 0 ? 1 : 0;
        if (leftHasLoad !== rightHasLoad) {
          return rightHasLoad - leftHasLoad;
        }
      }

      // Feature 2: Teacher qualification and specialization (DepEd DO 005, s. 2024 Priority 2)
      const leftTier = getTeacherExpertiseTier(left, subjectItem);
      const rightTier = getTeacherExpertiseTier(right, subjectItem);
      if (leftTier !== rightTier) return rightTier - leftTier;

      // Feature 3: Minimize Preparation Sprawl & Enforce Preparation Limit
      const enforcePreps = config?.constraints?.enforceMaxPreparations !== false;
      const maxPreps = Number(config?.constraints?.maxDistinctPreparations) || 3;
      const leftPreps = teacherAssignedPreps.get(left.id) || new Set();
      const rightPreps = teacherAssignedPreps.get(right.id) || new Set();
      const leftHasPrep = leftPreps.has(prepKey) ? 1 : 0;
      const rightHasPrep = rightPreps.has(prepKey) ? 1 : 0;

      // If one candidate already teaches this prep, prioritize them (0 new prep)
      if (leftHasPrep !== rightHasPrep) {
        return rightHasPrep - leftHasPrep;
      }

      // If neither candidate already teaches this prep, check if either has reached the max distinct preparations cap
      if (enforcePreps && !leftHasPrep && !rightHasPrep) {
        const leftExceeds = leftPreps.size >= maxPreps;
        const rightExceeds = rightPreps.size >= maxPreps;
        if (!leftExceeds && rightExceeds) return -1;
        if (leftExceeds && !rightExceeds) return 1;
      }

      // Feature 4: Capacity-Based Allocation Ratio (assigned load / authorized capacity)
      const leftRatio = leftLoad / Math.max(1, leftCap);
      const rightRatio = rightLoad / Math.max(1, rightCap);

      if (policy === "consolidated_balanced" || policy === "consolidated_plantilla") {
        // Feature 4A (Consolidated Plantilla / Balanced Load Engine):
        // 1. Prioritize permanent/regular plantilla faculty first
        const leftPerm = isPermanentTeacher(left);
        const rightPerm = isPermanentTeacher(right);
        if (leftPerm && !rightPerm) return -1;
        if (!leftPerm && rightPerm) return 1;

        // 1B. Prioritize pure classroom teachers over major ancillary staff
        if (!isLeftMajorAncillary && isRightMajorAncillary) return -1;
        if (isLeftMajorAncillary && !isRightMajorAncillary) return 1;

        // 2. Target DepEd Balanced Quota:
        // Regular teachers: min 20 periods (up to 24)
        // Class advisers: min 16 periods (since they receive 5h ancillary credit)
        const leftTarget = isLeftAdviser ? Math.max(12, leftCap - 4) : Math.min(leftCap, 20);
        const rightTarget = isRightAdviser ? Math.max(12, rightCap - 4) : Math.min(rightCap, 20);

        const leftIsBalanced = leftLoad >= leftTarget;
        const rightIsBalanced = rightLoad >= rightTarget;

        // Prioritize candidates who have NOT yet achieved the balanced target
        if (!leftIsBalanced && rightIsBalanced) return -1;
        if (leftIsBalanced && !rightIsBalanced) return 1;

        // When both candidates are below the balanced target:
        // Consolidate onto the teacher who already has periods so they reach the 20h balanced quota!
        if (!leftIsBalanced && !rightIsBalanced) {
          const leftHasLoad = leftLoad > 0;
          const rightHasLoad = rightLoad > 0;
          if (leftHasLoad && !rightHasLoad) return -1;
          if (!leftHasLoad && rightHasLoad) return 1;
          if (leftLoad !== rightLoad) {
            return rightLoad - leftLoad; // Higher load gets next class until full
          }
        }

        // When both are already balanced, share remaining loads evenly up to cap
        if (leftIsBalanced && rightIsBalanced) {
          if (Math.abs(leftRatio - rightRatio) > 0.04) {
            return leftRatio - rightRatio;
          }
        }
      } else if (policy === "prioritize_regular") {
        const leftPerm = isPermanentTeacher(left);
        const rightPerm = isPermanentTeacher(right);
        if (leftPerm && !rightPerm) return -1;
        if (!leftPerm && rightPerm) return 1;
        if (leftPerm && rightPerm && leftLoad !== rightLoad) {
          return rightLoad - leftLoad; // Pack higher load first up to max cap
        }
      } else if (policy === "hybrid_weighted") {
        const leftPerm = isPermanentTeacher(left) ? 30 : 0;
        const rightPerm = isPermanentTeacher(right) ? 30 : 0;
        const leftScore = leftPerm + Math.max(0, 100 - leftRatio * 100) * 0.7;
        const rightScore = rightPerm + Math.max(0, 100 - rightRatio * 100) * 0.7;
        if (leftScore !== rightScore) return rightScore - leftScore;
      }

      // If utilization differs by more than 2-4%, assign to teacher with lower utilization ratio
      if (policy !== "consolidated_balanced" && policy !== "consolidated_plantilla") {
        const threshold = policy === "equal_balance" ? 0.01 : 0.04;
        if (Math.abs(leftRatio - rightRatio) > threshold) {
          return leftRatio - rightRatio;
        }
      }

      // Tie-breaker 1: Fewer total distinct preparations
      if (leftPreps.size !== rightPreps.size) {
        return leftPreps.size - rightPreps.size;
      }

      // Tie-breaker 2: Raw load
      return leftLoad - rightLoad;
    });
  }

  const CORE_KEYWORDS = ["math", "science", "english", "araling panlipunan", "filipino"];
  const isCore = (subj) => {
    const name = String(subj?.subjectName || "").toLowerCase();
    const code = String(subj?.subjectCode || "").toLowerCase();
    return CORE_KEYWORDS.some((k) => name.includes(k) || code.includes(k));
  };

  const allPlacementRules = getAllPlacementRules(config, scheduleType);

  // ==========================================
  // PASS 0: CONSOLIDATED PLANTILLA PRE-ALLOCATION (DEPED DO 005, S. 2024 BALANCED LOAD)
  // ==========================================
  // To prevent widespread teacher underload (< 20 periods), consolidate teaching loads onto
  // Permanent/Regular plantilla faculty first (4-5 sections per teacher = 16-25 contact periods/week),
  // ensuring active faculty achieve the statutory Balanced Target Load while zero double-bookings occur.
  const plantillaTeacherMap = new Map(); // key: `${section.id}::${subject.id}` -> teacher
  const plannedTeacherLoad = new Map(activeTeachers.map((t) => [t.id, 0]));
  const sectionAdviserMap = new Map(); // section.id -> unique class adviser
  const usedAdviserIds = new Set();

  lockedEntriesBySection.forEach((entries, secId) => {
    entries.forEach((entry) => {
      collectAssignmentTeacherIds(entry.asgn).forEach((tId) => {
        plannedTeacherLoad.set(tId, (plannedTeacherLoad.get(tId) || 0) + 1);
      });
      if (entry.subjObj && !isSubjectMultiTeacher(entry.subjObj) && entry.asgn?.teacherId) {
        const lockedTeacher = facultyByIdForSolver.get(entry.asgn.teacherId);
        if (lockedTeacher) {
          const mapKey = `${secId}::${entry.subjObj.id}`;
          if (!plantillaTeacherMap.has(mapKey)) {
            plantillaTeacherMap.set(mapKey, lockedTeacher);
          }
          if (isHomeroomOrAdvisorySubject(entry.subjObj) && !sectionAdviserMap.has(secId)) {
            sectionAdviserMap.set(secId, lockedTeacher);
            usedAdviserIds.add(lockedTeacher.id);
          }
        }
      }
    });
  });

  // 1. Separate eligible teachers for current schedule level (JHS vs SHS)
  const eligibleLevelTeachers = activeTeachers.filter((t) => {
    if (t.active === false) return false;
    if (scheduleType === "jhs") {
      const gList = t.gradeLevelAssignments || [];
      return gList.some((g) => {
        const parsed = parseGrade(g);
        return parsed !== null && [7, 8, 9, 10].includes(parsed);
      });
    }
    const gList = t.gradeLevelAssignments || [];
    return gList.some((g) => {
      const parsed = parseGrade(g);
      return parsed !== null && [11, 12].includes(parsed);
    });
  });

  const isMajorAncillaryTeacher = (t) => {
    return Boolean(
      Array.isArray(t?.ancillaryAssignments) && t.ancillaryAssignments.some((a) => {
        const l = String(a).toLowerCase();
        return l.includes("drrm") || l.includes("ict") || l.includes("custodian") || (l.includes("guidance") && !l.includes("homeroom")) || l.includes("registrar") || l.includes("canteen") || l.includes("testing");
      })
    );
  };

  const levelPool = eligibleLevelTeachers.length > 0 ? eligibleLevelTeachers : activeTeachers;
  const regularClassroomTeachers = levelPool.filter((t) => isPermanentTeacher(t) && !isMajorAncillaryTeacher(t));
  const otherClassroomTeachers = levelPool.filter((t) => !isPermanentTeacher(t) && !isMajorAncillaryTeacher(t));
  const ancillaryStaffPool = levelPool.filter(isMajorAncillaryTeacher);
  const prioritizedPool = [...regularClassroomTeachers, ...otherClassroomTeachers, ...ancillaryStaffPool];

  // 2. Gather all actual section-subject offerings that exist for this scheduleType
  const sectionOfferings = [];
  sections.forEach((sec) => {
    const secSubjs = getSubjectsForSection(sec, subjects, scheduleType);
    secSubjs.forEach((subj) => {
      sectionOfferings.push({ section: sec, subject: subj });
    });
  });

  const getOfferingDiscipline = (subj) => {
    const name = String(subj?.subjectName || subj?.name || "").toLowerCase();
    const code = String(subj?.subjectCode || subj?.code || "").toLowerCase();
    const combined = `${name} ${code}`;

    if (combined.includes("math") || combined.includes("algebra") || combined.includes("elemalg") || combined.includes("geom") || combined.includes("stat")) return "Mathematics";
    if (combined.includes("sci") || combined.includes("envsci") || combined.includes("bio") || combined.includes("chem") || combined.includes("phys") || combined.includes("research")) return "Science";
    if (combined.includes("eng") || combined.includes("devread") || combined.includes("read") || combined.includes("journalism") || combined.includes("literacy")) return "English";
    if (combined.includes("fil") || combined.includes("panitikan") || combined.includes("komunikasyon")) return "Filipino";
    if (combined.includes("aral") && !combined.includes("aral program") && !combined.includes("aral-reading") && !combined.includes("aral-math")) return "Araling Panlipunan";
    if (combined.includes("ap ") || combined.startsWith("ap") || combined.includes("kasaysayan") || combined.includes("ekonomiks") || combined.includes("kontemporaryo")) return "Araling Panlipunan";
    if (combined.includes("mapeh") || combined.includes("music") || combined.includes("art") || combined.includes("pe") || combined.includes("phys") || combined.includes("health") || combined.includes("spa")) return "MAPEH";
    if (combined.includes("tle") || combined.includes("tvl") || combined.includes("tech") || combined.includes("livelihood") || combined.includes("draft") || combined.includes("ict") || combined.includes("agri") || combined.includes("cook")) return "TLE";
    if (combined.includes("esp") || combined.includes("values") || combined.includes("pagpapakatao") || combined.includes("edukasyon sa pagpapakatao")) return "Values Education";
    return "Other";
  };

  const DISCIPLINES = [
    "Mathematics",
    "Science",
    "English",
    "Filipino",
    "Araling Panlipunan",
    "MAPEH",
    "TLE",
    "Values Education",
  ];

  // 0. Honor explicit single-teacher subject designations from Subject Settings:
  sectionOfferings.forEach(({ section: sec, subject: subj }) => {
    const key = `${sec.id}::${subj.id}`;
    if (plantillaTeacherMap.has(key)) return;
    if (subj.defaultTeacherId && !isSubjectMultiTeacher(subj)) {
      const designated = activeTeachers.find((t) => t.id === subj.defaultTeacherId);
      if (designated) {
        plantillaTeacherMap.set(key, designated);
        const weeklyPeriods = parseBoundedNumber(subj.classesPerWeek, 1, 12, 4);
        plannedTeacherLoad.set(designated.id, (plannedTeacherLoad.get(designated.id) || 0) + weeklyPeriods);
      }
    }
  });

  // Allocate Core Disciplines across Sections:
  // Consolidates teaching loads onto regular plantilla faculty first (4-5 sections per teacher = 16-24 periods),
  // ensuring active faculty achieve the statutory Balanced Target Load (DepEd DO 005) while zero double-bookings occur.
  DISCIPLINES.forEach((discipline) => {
    const disciplineOfferings = sectionOfferings.filter(
      (item) =>
        getOfferingDiscipline(item.subject) === discipline &&
        !isHomeroomOrAdvisorySubject(item.subject) &&
        !isSubjectMultiTeacher(item.subject) &&
        !item.subject.defaultTeacherId &&
        !plantillaTeacherMap.has(`${item.section.id}::${item.subject.id}`) &&
        !String(item.subject.subjectCode || item.subject.subjectName || "").toLowerCase().includes("aral")
    );

    if (disciplineOfferings.length === 0) return;

    const sampleSubj = disciplineOfferings[0].subject;
    const candidates = prioritizedPool.filter(
      (t) => doesTeacherMatchSubject(t, sampleSubj) || getOfferingDiscipline({ subjectName: t.major || t.department || "" }) === discipline
    );

    candidates.sort((a, b) => {
      const aAnc = isMajorAncillaryTeacher(a) ? 1 : 0;
      const bAnc = isMajorAncillaryTeacher(b) ? 1 : 0;
      if (aAnc !== bAnc) return aAnc - bAnc; // Pure classroom teachers first!

      const aPerm = isPermanentTeacher(a) ? 1 : 0;
      const bPerm = isPermanentTeacher(b) ? 1 : 0;
      if (aPerm !== bPerm) return bPerm - aPerm;
      const aTier = getTeacherExpertiseTier(a, sampleSubj);
      const bTier = getTeacherExpertiseTier(b, sampleSubj);
      if (aTier !== bTier) return bTier - aTier;
      const aLoad = plannedTeacherLoad.get(a.id) || 0;
      const bLoad = plannedTeacherLoad.get(b.id) || 0;
      return aLoad - bLoad;
    });

    if (candidates.length === 0) return;

    // Calculate total periods for this discipline and optimal teacher pool
    const totalDisciplinePeriods = disciplineOfferings.reduce(
      (sum, item) => sum + parseBoundedNumber(item.subject.classesPerWeek, 1, 12, 4),
      0
    );

    if (policy === "equal_balance") {
      // 1. Equal balance (Capacity-Based Allocation):
      // Deploy ALL qualified candidates so teaching load is distributed evenly across the entire department
      const assignedPool = candidates.slice();
      disciplineOfferings.forEach(({ section: sec, subject: subj }) => {
        // Pick candidate with lowest planned load
        assignedPool.sort((a, b) => (plannedTeacherLoad.get(a.id) || 0) - (plannedTeacherLoad.get(b.id) || 0));
        const t = assignedPool[0];
        const weeklyPeriods = parseBoundedNumber(subj.classesPerWeek, 1, 12, 4);

        plantillaTeacherMap.set(`${sec.id}::${subj.id}`, t);
        plannedTeacherLoad.set(t.id, (plannedTeacherLoad.get(t.id) || 0) + weeklyPeriods);
      });
    } else if (policy === "prioritize_regular") {
      // 2. Prioritize Permanent / Regular Faculty First:
      // Fill permanent classroom teachers up to maxCap (24 periods) first before non-permanent teachers get classes
      const permCandidates = candidates.filter((t) => isPermanentTeacher(t) && !isMajorAncillaryTeacher(t));
      const otherPermCandidates = candidates.filter((t) => isPermanentTeacher(t) && isMajorAncillaryTeacher(t));
      const nonPermCandidates = candidates.filter((t) => !isPermanentTeacher(t));
      const orderedCandidates = [...permCandidates, ...otherPermCandidates, ...nonPermCandidates];

      disciplineOfferings.forEach(({ section: sec, subject: subj }) => {
        const weeklyPeriods = parseBoundedNumber(subj.classesPerWeek, 1, 12, 4);
        let t = orderedCandidates.find((c) => (plannedTeacherLoad.get(c.id) || 0) + weeklyPeriods <= maxCap);
        if (!t) {
          t = orderedCandidates[0];
        }
        plantillaTeacherMap.set(`${sec.id}::${subj.id}`, t);
        plannedTeacherLoad.set(t.id, (plannedTeacherLoad.get(t.id) || 0) + weeklyPeriods);
      });
    } else if (policy === "hybrid_weighted") {
      // 3. Hybrid Weighted Priority:
      // Intermediate target load (~16 contact periods / 4 sections) blending permanent rank (30%) + capacity load (70%)
      const neededTeachersCount = Math.min(
        candidates.length,
        Math.max(1, Math.round(totalDisciplinePeriods / 16))
      );
      const sortedCandidates = candidates.slice().sort((a, b) => {
        const aScore = (isPermanentTeacher(a) ? 30 : 0) - (plannedTeacherLoad.get(a.id) || 0);
        const bScore = (isPermanentTeacher(b) ? 30 : 0) - (plannedTeacherLoad.get(b.id) || 0);
        return bScore - aScore;
      });
      const assignedPool = sortedCandidates.slice(0, neededTeachersCount);

      disciplineOfferings.forEach(({ section: sec, subject: subj }) => {
        assignedPool.sort((a, b) => (plannedTeacherLoad.get(a.id) || 0) - (plannedTeacherLoad.get(b.id) || 0));
        const t = assignedPool[0];
        const weeklyPeriods = parseBoundedNumber(subj.classesPerWeek, 1, 12, 4);

        plantillaTeacherMap.set(`${sec.id}::${subj.id}`, t);
        plannedTeacherLoad.set(t.id, (plannedTeacherLoad.get(t.id) || 0) + weeklyPeriods);
      });
    } else {
      // 4. Consolidated Plantilla Loading (Default: DepEd DO 005 Zero-Underload Engine):
      // Consolidates onto regular classroom teachers at ~20 contact periods (4-5 sections)
      const neededTeachersCount = Math.min(
        candidates.length,
        Math.max(1, Math.round(totalDisciplinePeriods / 20))
      );
      const assignedPool = candidates.slice(0, neededTeachersCount);

      disciplineOfferings.forEach(({ section: sec, subject: subj }, offIdx) => {
        const t = assignedPool[offIdx % assignedPool.length];
        const weeklyPeriods = parseBoundedNumber(subj.classesPerWeek, 1, 12, 4);

        plantillaTeacherMap.set(`${sec.id}::${subj.id}`, t);
        plannedTeacherLoad.set(t.id, (plannedTeacherLoad.get(t.id) || 0) + weeklyPeriods);
      });
    }
  });

  // 3. Specialized / Program Enhancement Subjects (SP-STEM, SPA, SPJ):
  // Map specialized extensions onto the section's regular department teachers so their workload reaches 20-24 periods (Balanced),
  // rather than scattering 1-3 period fragments onto idle faculty (which causes underload).
  sectionOfferings.forEach(({ section: sec, subject: subj }) => {
    const key = `${sec.id}::${subj.id}`;
    if (plantillaTeacherMap.has(key)) return;
    if (isSubjectMultiTeacher(subj)) return;
    if (isHomeroomOrAdvisorySubject(subj) || String(subj.subjectCode || subj.subjectName || "").toLowerCase().includes("aral")) return;

    const discipline = getOfferingDiscipline(subj);
    let chosenTeacher = null;

    // First priority: Consolidate onto this section's core teacher for this discipline
    if (policy !== "equal_balance") {
      for (const [secSubjKey, t] of plantillaTeacherMap.entries()) {
        if (secSubjKey.startsWith(`${sec.id}::`)) {
          const otherSubjId = secSubjKey.split("::")[1];
          const otherSubj = subjects.find((s) => s.id === otherSubjId);
          if (otherSubj && getOfferingDiscipline(otherSubj) === discipline) {
            const curLoad = plannedTeacherLoad.get(t.id) || 0;
            if (curLoad < maxCap) {
              chosenTeacher = t;
              break;
            }
          }
        }
      }
    }

    // Second priority:
    if (!chosenTeacher) {
      if (policy === "equal_balance") {
        const candidates = prioritizedPool.filter((t) => doesTeacherMatchSubject(t, subj));
        if (candidates.length > 0) {
          candidates.sort((a, b) => (plannedTeacherLoad.get(a.id) || 0) - (plannedTeacherLoad.get(b.id) || 0));
          chosenTeacher = candidates[0];
        }
      } else {
        const candidates = prioritizedPool.filter(
          (t) => (plannedTeacherLoad.get(t.id) || 0) > 0 && (plannedTeacherLoad.get(t.id) || 0) < maxCap && doesTeacherMatchSubject(t, subj)
        );
        if (candidates.length > 0) {
          candidates.sort((a, b) => (plannedTeacherLoad.get(b.id) || 0) - (plannedTeacherLoad.get(a.id) || 0));
          chosenTeacher = candidates[0];
        }
      }
    }

    if (chosenTeacher) {
      const weeklyPeriods = parseBoundedNumber(subj.classesPerWeek, 1, 12, 3);
      plantillaTeacherMap.set(key, chosenTeacher);
      plannedTeacherLoad.set(chosenTeacher.id, (plannedTeacherLoad.get(chosenTeacher.id) || 0) + weeklyPeriods);
    }
  });

  // 4. Allocate Section Advisers (HGP & ARAL):
  // The Class Adviser for each section is chosen EXCLUSIVELY from the regular subject teachers
  // ALREADY ASSIGNED TO TEACH THAT SECTION!
  // This ensures advisers teach their classes + homeroom (18-22 periods = 100% Balanced load under DO 005)
  // and NO outside/idle faculty are ever assigned isolated 1 or 2 period fragments (which causes underload).
  sections.forEach((sec) => {
    let adviser = sectionAdviserMap.get(sec.id) || null;
    if (adviser) {
      usedAdviserIds.add(adviser.id);
      const hgpSubj = subjects.find(isHomeroomOrAdvisorySubject);
      if (hgpSubj && !plantillaTeacherMap.has(`${sec.id}::${hgpSubj.id}`)) {
        plantillaTeacherMap.set(`${sec.id}::${hgpSubj.id}`, adviser);
        plannedTeacherLoad.set(adviser.id, (plannedTeacherLoad.get(adviser.id) || 0) + 1);
      }
      const aralSubj = subjects.find((s) => {
        const code = String(s.subjectCode || "").trim().toUpperCase();
        const name = String(s.subjectName || "").trim().toLowerCase();
        return code === "ARAL" || name.includes("aral program");
      });
      if (aralSubj && !plantillaTeacherMap.has(`${sec.id}::${aralSubj.id}`)) {
        const secEligible = getSubjectsForSection(sec, subjects, scheduleType);
        const isAralEligible = secEligible.some((s) => s.id === aralSubj.id);
        if (isAralEligible && doesTeacherMatchSubject(adviser, aralSubj)) {
          plantillaTeacherMap.set(`${sec.id}::${aralSubj.id}`, adviser);
          plannedTeacherLoad.set(adviser.id, (plannedTeacherLoad.get(adviser.id) || 0) + 1);
        }
      }
      return;
    }
    if (policy === "equal_balance") {
      const pool = prioritizedPool.filter((t) => !usedAdviserIds.has(t.id));
      if (pool.length > 0) {
        pool.sort((a, b) => (plannedTeacherLoad.get(a.id) || 0) - (plannedTeacherLoad.get(b.id) || 0));
        adviser = pool[0];
      }
    }

    if (!adviser) {
      // Collect all teachers who actually teach classes in this section
      const sectionTeachers = [];
      const seenTeacherIds = new Set();

      for (const [secSubjKey, t] of plantillaTeacherMap.entries()) {
        if (secSubjKey.startsWith(`${sec.id}::`) && t && !seenTeacherIds.has(t.id)) {
          seenTeacherIds.add(t.id);
          sectionTeachers.push(t);
        }
      }

      // Sort section teachers to find the ideal adviser:
      // 1. Not yet an adviser of another section
      // 2. Permanent/regular teacher first
      // 3. Lowest current load
      sectionTeachers.sort((a, b) => {
        const aUsed = usedAdviserIds.has(a.id) ? 1 : 0;
        const bUsed = usedAdviserIds.has(b.id) ? 1 : 0;
        if (aUsed !== bUsed) return aUsed - bUsed; // Prefer not used as adviser yet

        const aPerm = isPermanentTeacher(a) ? 1 : 0;
        const bPerm = isPermanentTeacher(b) ? 1 : 0;
        if (aPerm !== bPerm) return bPerm - aPerm;

        const aLoad = plannedTeacherLoad.get(a.id) || 0;
        const bLoad = plannedTeacherLoad.get(b.id) || 0;
        return aLoad - bLoad;
      });

      adviser = sectionTeachers.length > 0 ? sectionTeachers[0] : null;
    }

    if (!adviser) {
      // Emergency fallback: pick any already-deployed teacher with load > 0 (NEVER an idle teacher with 0 load)
      const deployed = prioritizedPool.filter((t) => (plannedTeacherLoad.get(t.id) || 0) > 0);
      deployed.sort((a, b) => {
        const aUsed = usedAdviserIds.has(a.id) ? 1 : 0;
        const bUsed = usedAdviserIds.has(b.id) ? 1 : 0;
        if (aUsed !== bUsed) return aUsed - bUsed;
        return (plannedTeacherLoad.get(a.id) || 0) - (plannedTeacherLoad.get(b.id) || 0);
      });
      adviser = deployed[0];
    }

    if (!adviser) {
      adviser = prioritizedPool[0];
    }

    usedAdviserIds.add(adviser.id);
    sectionAdviserMap.set(sec.id, adviser);

    const hgpSubj = subjects.find(isHomeroomOrAdvisorySubject);
    if (hgpSubj) {
      plantillaTeacherMap.set(`${sec.id}::${hgpSubj.id}`, adviser);
      plannedTeacherLoad.set(adviser.id, (plannedTeacherLoad.get(adviser.id) || 0) + 1);
    }
    const aralSubj = subjects.find((s) => {
      const code = String(s.subjectCode || "").trim().toUpperCase();
      const name = String(s.subjectName || "").trim().toLowerCase();
      return code === "ARAL" || name.includes("aral program");
    });
    if (aralSubj) {
      const secEligible = getSubjectsForSection(sec, subjects, scheduleType);
      const isAralEligible = secEligible.some((s) => s.id === aralSubj.id);
      if (isAralEligible && doesTeacherMatchSubject(adviser, aralSubj)) {
        plantillaTeacherMap.set(`${sec.id}::${aralSubj.id}`, adviser);
        plannedTeacherLoad.set(adviser.id, (plannedTeacherLoad.get(adviser.id) || 0) + 1);
      }
    }
  });

  // 1. Prepare per-section scheduling contexts
  const sectionContexts = sections.map((section) => {
    const eligibleSubjects = shuffleArray(getSubjectsForSection(section, subjects, scheduleType).slice());
    const sectionLabel = formatConflictSectionName(section);

    if (eligibleSubjects.length === 0) {
      pushConflict(`No eligible subjects were found for ${sectionLabel}.`);
    }

    const enhancedEligibleSubjects = eligibleSubjects.map((subj) => {
      const rule = findPlacementRuleForSubject(subj, allPlacementRules);
      if (rule) {
        return {
          ...subj,
          preferredDay: rule.preferredDay || subj.preferredDay,
          preferredPeriodSlot: rule.preferredPeriodSlot || subj.preferredPeriodSlot,
          isDoublePeriod: Boolean(rule.isDoublePeriod ?? subj.isDoublePeriod),
          consecutiveType: rule.consecutiveType || subj.consecutiveType,
          specificPeriods: Array.isArray(rule.specificPeriods) && rule.specificPeriods.length > 0 ? rule.specificPeriods : subj.specificPeriods,
        };
      }
      return subj;
    });

    const remainingHours = enhancedEligibleSubjects.map((subject) => ({
      ...subject,
      required: getSubjectDailySlotRequirement(subject, scheduleType, config),
      remaining: getSubjectDailySlotRequirement(subject, scheduleType, config),
    }));

    const rawSlots = slots.filter((slot) => isSlotValidForSection(section, slot, scheduleType, config));
    const validSlots = rawSlots.slice().sort((left, right) => {
      const pLeft = Number(left.period || 0);
      const pRight = Number(right.period || 0);
      if (pLeft !== pRight) return pLeft - pRight;

      const dLeft = DAYS.indexOf(left.day);
      const dRight = DAYS.indexOf(right.day);
      return (dLeft !== -1 ? dLeft : 99) - (dRight !== -1 ? dRight : 99);
    });

    remainingHours.forEach((subject) => {
      if (subject.required > validSlots.length) {
        pushConflict(
          `${sectionLabel}: ${subject.subjectName} requires ${subject.required} recurring daily period(s), but only ${validSlots.length} period(s) are available in this section template.`
        );
      }
    });

    // Dedicated teacher map per subject for this section (pre-populated with balanced plantilla assignments)
    const sectionTeacherMap = new Map();
    const sectionBreakoutMap = new Map();
    subjects.forEach((subj) => {
      const preassigned = plantillaTeacherMap.get(`${section.id}::${subj.id}`);
      if (preassigned && !isSubjectMultiTeacher(subj)) {
        sectionTeacherMap.set(subj.id, preassigned);
      }
    });

    const subjectDayUsage = new Map();
    const sectionDailyCoreCounts = new Map();
    const dailyPeriodSubjectMap = new Map();
    const assignedSlotIds = new Set();
    const periodAnchorSubjectMap = new Map(); // periodNumber -> subjectId (horizontal row anchor)
    const subjectAnchoredPeriodMap = new Map(); // subjectId -> periodNumber

    const secLockedEntries = lockedEntriesBySection.get(section.id) || [];
    secLockedEntries.forEach((entry) => {
      assignedSlotIds.add(entry.slotId);
      const targetSubjId = entry.subjObj?.id || entry.asgn?.subjectId;
      const remSubj = remainingHours.find(
        (s) =>
          s.id === targetSubjId ||
          (entry.subjObj && isHomeroomOrAdvisorySubject(entry.subjObj) && isHomeroomOrAdvisorySubject(s))
      );
      if (!remSubj) return;

      remSubj.remaining = Math.max(0, remSubj.remaining - 1);
      const day = entry.slotObj?.day || "Monday";
      const dayKey = `${day}::${remSubj.id}`;
      subjectDayUsage.set(dayKey, (subjectDayUsage.get(dayKey) || 0) + 1);

      const slotPeriodNum = Number(entry.slotObj?.period || 0);
      if (slotPeriodNum > 0) {
        dailyPeriodSubjectMap.set(`${day}::${slotPeriodNum}`, remSubj.id);
        const totalReq = Number(remSubj.required || remSubj.classesPerWeek || 1);
        if (totalReq >= 2) {
          if (!periodAnchorSubjectMap.has(slotPeriodNum)) {
            periodAnchorSubjectMap.set(slotPeriodNum, remSubj.id);
          }
          if (!subjectAnchoredPeriodMap.has(remSubj.id)) {
            subjectAnchoredPeriodMap.set(remSubj.id, slotPeriodNum);
          }
        }
      }

      if (isCore(remSubj)) {
        sectionDailyCoreCounts.set(day, (sectionDailyCoreCounts.get(day) || 0) + 1);
      }

      if (!isSubjectMultiTeacher(remSubj) && entry.asgn?.teacherId && !sectionTeacherMap.has(remSubj.id)) {
        const lockedT = facultyByIdForSolver.get(entry.asgn.teacherId);
        if (lockedT) {
          sectionTeacherMap.set(remSubj.id, lockedT);
        }
      }

      if (
        isSubjectMultiTeacher(remSubj) &&
        Array.isArray(entry.asgn?.breakoutAssignments) &&
        entry.asgn.breakoutAssignments.length > 0 &&
        !sectionBreakoutMap.has(remSubj.id)
      ) {
        sectionBreakoutMap.set(remSubj.id, entry.asgn.breakoutAssignments);
      }
    });

    const reservedLastSlotsByDay = new Map();
    remainingHours
      .filter((s) => isDynamicLastPeriodSubject(s, allPlacementRules))
      .forEach((s) => {
        const reserveCount =
          lockedCellKeys.size > 0
            ? Math.max(0, Number(s.remaining || 0))
            : Math.max(1, Number(s.required || 1));
        if (s.preferredDay && s.preferredDay !== "any" && reserveCount > 0) {
          reservedLastSlotsByDay.set(
            s.preferredDay,
            (reservedLastSlotsByDay.get(s.preferredDay) || 0) + reserveCount
          );
        }
      });

    function canPlaceNonLastOnDay(day, { checkWeeklyReserve = true } = {}) {
      const daySlots = validSlots.filter((s) => s.day === day);
      const currentDayAssigned = daySlots.filter((s) => Boolean(assignments[createCellKey(section.id, s.id)])).length;
      const dayMax = getSectionDayMaxPeriod(section, day, scheduleType, config);
      const reservedForDay = reservedLastSlotsByDay.get(day) || 0;
      if (currentDayAssigned + 1 > Math.max(0, dayMax - reservedForDay)) {
        return false;
      }

      if (checkWeeklyReserve) {
        const remainingLastTotal = remainingHours
          .filter((s) => isDynamicLastPeriodSubject(s, allPlacementRules))
          .reduce((sum, s) => sum + Math.max(0, Number(s.remaining || 0)), 0);
        if (remainingLastTotal > 0) {
          const openValidSlots = validSlots.filter((s) => !assignments[createCellKey(section.id, s.id)]).length;
          if (openValidSlots - 1 < remainingLastTotal) {
            return false;
          }
        }
      }

      return true;
    }

    function findBestTeacherForSlot(subj, targetSlot, allowFallback = false, relaxBreakGuard = false) {
      if (isSubjectMultiTeacher(subj)) {
        const breakoutResult = selectBreakoutTeachersForSlot({
          subject: subj,
          section,
          slot: targetSlot,
          activeTeachers,
          teacherBusyBySlot,
          teacherLoad,
          config,
          preferredBreakouts: sectionBreakoutMap.get(subj.id) || null,
          allowLoadCapOverflow: allowFallback,
        });
        if (!breakoutResult.isComplete || breakoutResult.chosenStreams.length === 0) {
          return null;
        }
        return breakoutResult.chosenStreams[0].teacherObj || null;
      }

      const isAdviserSlot = isHomeroomOrAdvisorySubject(subj);

      const enforceCap = config?.constraints?.enforceMaxLoadCap !== false;
      const maxCap = config?.constraints?.maxTeachingLoadCap || 24;
      const isTeacherAdviser = (t) => Boolean(
        t?.isClassAdviser ||
        (Array.isArray(t?.ancillaryAssignments) && t.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
      );
      const isTeacherPartTime = (t) => Boolean(
        (t?.workingArrangement && String(t.workingArrangement).toLowerCase().includes("part")) ||
        (t?.employmentStatus && String(t.employmentStatus).toLowerCase().includes("part"))
      );
      const getTeacherLoadCap = (t) => {
        if (isTeacherPartTime(t)) return 16;
        return isTeacherAdviser(t) ? Math.min(25, Math.max(maxCap, 24)) : Math.max(maxCap, 24);
      };

      // Check if this section already has an assigned teacher for this subject (for section continuity)
      // Note: The section's Class Adviser is bound strictly to HGP / Homeroom subjects (wherever HGP is plotted in the week),
      // so regular academic subjects placed on Monday 1st Period use their own subject specialist!
      let boundTeacher = isHomeroomOrAdvisorySubject(subj)
        ? (sectionAdviserMap.get(section.id) || sectionTeacherMap.get(subj.id) || null)
        : (sectionTeacherMap.get(subj.id) || (subj.defaultTeacherId ? activeTeachers.find((t) => t.id === subj.defaultTeacherId) : null));

      // If the bound teacher has already reached their maximum teaching load cap, release the binding
      if (boundTeacher && enforceCap) {
        const currentLoad = teacherLoad.get(boundTeacher.id) || 0;
        if (currentLoad >= getTeacherLoadCap(boundTeacher)) {
          boundTeacher = null;
        }
      }

      let teacherCandidates = [];

      if (
        boundTeacher &&
        isTeacherEligible({
          teacher: boundTeacher,
          subject: subj,
          section,
          slot: targetSlot,
          constraints: config.constraints,
          teacherBusyBySlot,
          excludedSectionId: section.id,
        })
      ) {
        // Teacher Non-Continuous Break Guard:
        // During normal slot allocation (!allowFallback && !relaxBreakGuard), if assigning boundTeacher
        // to targetSlot would force > 3 consecutive periods without a vacant break period (or > 5 periods on this day),
        // return null so another subject whose teacher is rested can take this slot!
        if (!allowFallback && !relaxBreakGuard && !subj.isDoublePeriod && wouldExceedContinuousTeachingLimit(boundTeacher.id, targetSlot, 3)) {
          return null;
        }
        teacherCandidates = [boundTeacher];
      } else if (boundTeacher && !allowFallback) {
        // Bound teacher is assigned to this course, but is currently busy or restricted at targetSlot.
        // During general allocation, DO NOT replace boundTeacher with another teacher!
        // Return null so another subject whose teacher IS free can take this slot,
        // preserving section-teacher continuity and achieving balanced loads across sections!
        return null;
      } else {
        // Find all eligible teachers who are free at this slot AND within their authorized teaching load cap
        let rawEligible = activeTeachers.filter((teacher) => {
          if (!isTeacherEligible({
            teacher,
            subject: subj,
            section,
            slot: targetSlot,
            constraints: config.constraints,
            teacherBusyBySlot,
            excludedSectionId: section.id,
          })) {
            return false;
          }
          if (enforceCap) {
            const curLoad = teacherLoad.get(teacher.id) || 0;
            if (curLoad >= getTeacherLoadCap(teacher)) {
              return false; // Prevent exceeding max teaching load cap
            }
          }
          if (!allowFallback && !relaxBreakGuard && !subj.isDoublePeriod && wouldExceedContinuousTeachingLimit(teacher.id, targetSlot, 3)) {
            return false;
          }
          return true;
        });

        // Emergency fallback: if strict cap filtering eliminated all candidates, allow available teachers
        // to prevent dropping curriculum classes or creating unmet subject quota conflicts
        if (rawEligible.length === 0) {
          rawEligible = activeTeachers.filter((teacher) =>
            isTeacherEligible({
              teacher,
              subject: subj,
              section,
              slot: targetSlot,
              constraints: config.constraints,
              teacherBusyBySlot,
              excludedSectionId: section.id,
            })
          );
        }

        // STRICT CONSOLIDATION POLICY (Zero Underload Guarantee):
        // Prioritize candidates who already have assigned teaching loads (> 0) to consolidate towards full balanced load.
        // Never assign single periods to idle teachers (load === 0) unless strictly necessary.
        const deployedCandidates = rawEligible.filter((t) => {
          const l = teacherLoad.get(t.id) || 0;
          return l > 0 && l < getTeacherLoadCap(t);
        });

        // Strictly prioritize deployed teachers, and never deploy idle ancillary staff for single periods
        const nonAncillaryRaw = rawEligible.filter((t) => !isMajorAncillaryTeacher(t));
        const poolToUse = deployedCandidates.length > 0
          ? deployedCandidates
          : (nonAncillaryRaw.length > 0 ? nonAncillaryRaw : rawEligible);
        teacherCandidates = sortTeacherCandidates(poolToUse, subj);

        // Bind the selected teacher for this subject in this section for remaining periods of the week
        if (teacherCandidates.length > 0 && !sectionTeacherMap.has(subj.id)) {
          sectionTeacherMap.set(subj.id, teacherCandidates[0]);
        }
      }

      return teacherCandidates.length > 0 ? teacherCandidates[0] : null;
    }

    function commitSlotAssignment(subj, teacher, targetSlot) {
      const cellKey = createCellKey(section.id, targetSlot.id);
      const tier = getTeacherExpertiseTier(teacher, subj);
      const isMondayP1 = targetSlot.day === "Monday" && Number(targetSlot.period || 0) === 1;
      const isAdviserRole = isHomeroomOrAdvisorySubject(subj) || isMondayP1;
      const tierLabel = isAdviserRole
        ? "Class Adviser"
        : tier === 2
        ? "Primary Expertise"
        : tier === 1
        ? "Secondary Expertise"
        : "General Match";
      const permLabel = isPermanentTeacher(teacher) ? "Permanent / Regular" : "Non-Permanent";

      // Check if this subject requires multi-teacher breakout (e.g. SPA, SPS, TVL workshop, or custom multi-teacher)
      const isMultiTeacher = isSubjectMultiTeacher(subj);

      let coTeacherIds = [];
      let breakoutNote = "";
      let breakoutAssignments = [];

      if (isMultiTeacher) {
        let breakoutResult = selectBreakoutTeachersForSlot({
          subject: subj,
          section,
          slot: targetSlot,
          activeTeachers,
          teacherBusyBySlot,
          teacherLoad,
          config,
          preferredBreakouts: sectionBreakoutMap.get(subj.id) || null,
          allowLoadCapOverflow: false,
        });

        if (!breakoutResult.isComplete) {
          breakoutResult = selectBreakoutTeachersForSlot({
            subject: subj,
            section,
            slot: targetSlot,
            activeTeachers,
            teacherBusyBySlot,
            teacherLoad,
            config,
            preferredBreakouts: sectionBreakoutMap.get(subj.id) || null,
            allowLoadCapOverflow: true,
          });
        }

        const chosenStreams = breakoutResult.chosenStreams;
        const validChosen = chosenStreams.filter((cs) => Boolean(cs.teacherObj));

        if (validChosen.length > 0) {
          teacher = validChosen[0].teacherObj;
        }

        breakoutAssignments = chosenStreams.map((cs) => ({
          stream: cs.stream,
          teacherId: cs.teacherId || "",
          teacherName: cs.teacherName || "",
        }));

        if (breakoutResult.isComplete && !sectionBreakoutMap.has(subj.id)) {
          sectionBreakoutMap.set(subj.id, breakoutAssignments);
        }

        coTeacherIds = validChosen
          .map((cs) => cs.teacherId)
          .filter((tId) => tId && tId !== teacher?.id);

        breakoutNote = breakoutAssignments
          .map((b) => `${b.stream.toUpperCase()} – ${b.teacherName || "Unassigned"}`)
          .join("; ");

        // Mark all co-teachers busy and credit their teaching loads
        validChosen.forEach((cs) => {
          const coT = cs.teacherObj;
          if (!coT || coT.id === teacher?.id) return;
          const coBusy = teacherBusyBySlot.get(coT.id) || new Map();
          coBusy.set(targetSlot.id, section.id);
          teacherBusyBySlot.set(coT.id, coBusy);

          const coLoad = (teacherLoad.get(coT.id) || 0) + 1;
          teacherLoad.set(coT.id, coLoad);

          const prepKey = getSubjectPreparationKey(subj, section);
          const prepsSet = teacherAssignedPreps.get(coT.id) || new Set();
          prepsSet.add(prepKey);
          teacherAssignedPreps.set(coT.id, prepsSet);
        });
      }

      const loadVal = (teacherLoad.get(teacher.id) || 0) + 1;

      assignments[cellKey] = {
        subjectId: subj.id,
        teacherId: teacher.id,
        coTeacherIds: coTeacherIds.length ? coTeacherIds : undefined,
        breakoutAssignments: breakoutAssignments.length ? breakoutAssignments : undefined,
        breakoutNote: breakoutNote || undefined,
        source: "auto",
        auditInfo: `${tierLabel} • ${permLabel} • ${loadVal} periods load`,
        updatedAt: new Date().toISOString(),
      };

      subj.remaining -= 1;
      const dayKey = `${targetSlot.day}::${subj.id}`;
      subjectDayUsage.set(dayKey, (subjectDayUsage.get(dayKey) || 0) + 1);
      const slotPeriodNum = Number(targetSlot.period || 0);
      dailyPeriodSubjectMap.set(`${targetSlot.day}::${slotPeriodNum}`, subj.id);

      // Anchor multi-day subjects to their horizontal period row across the week
      const totalReq = Number(subj.required || subj.classesPerWeek || 1);
      if (slotPeriodNum > 0 && totalReq >= 2) {
        if (!periodAnchorSubjectMap.has(slotPeriodNum)) {
          periodAnchorSubjectMap.set(slotPeriodNum, subj.id);
        }
        if (!subjectAnchoredPeriodMap.has(subj.id)) {
          subjectAnchoredPeriodMap.set(subj.id, slotPeriodNum);
        }
      }

      const busyForTeacher = teacherBusyBySlot.get(teacher.id) || new Map();
      busyForTeacher.set(targetSlot.id, section.id);
      teacherBusyBySlot.set(teacher.id, busyForTeacher);

      teacherLoad.set(teacher.id, loadVal);
      if (!isHomeroomOrAdvisorySubject(subj)) {
        const prepKey = getSubjectPreparationKey(subj, section);
        const prepsSet = teacherAssignedPreps.get(teacher.id) || new Set();
        prepsSet.add(prepKey);
        teacherAssignedPreps.set(teacher.id, prepsSet);
      }
      assignedSlotIds.add(targetSlot.id);
    }

    return {
      section,
      sectionLabel,
      enhancedEligibleSubjects,
      remainingHours,
      validSlots,
      sectionTeacherMap,
      subjectDayUsage,
      sectionDailyCoreCounts,
      dailyPeriodSubjectMap,
      periodAnchorSubjectMap,
      subjectAnchoredPeriodMap,
      assignedSlotIds,
      reservedLastSlotsByDay,
      canPlaceNonLastOnDay,
      findBestTeacherForSlot,
      commitSlotAssignment,
    };
  });

  // MRV (Minimum Remaining Values) Section Scheduling Ordering:
  // Prioritize special program curriculum sections (SP-STEM, SPA, SPJ) that require specialized faculty
  // and multiple specialized subjects before standard regular sections take flexible slot assignments.
  const getSectionMRVRank = (sec) => {
    const c = String(sec.classification || "").toLowerCase();
    if (c.includes("stem") || c.includes("ste")) return 1; // Highest constraint: 45 periods, scarce STEM enhancement faculty
    if (c.includes("spa")) return 2; // High constraint: scarce arts specialization faculty
    if (c.includes("spj")) return 3; // High constraint: scarce journalism faculty
    return 4; // Regular sections: broad pool of general core/applied faculty
  };

  sectionContexts.sort((a, b) => getSectionMRVRank(a.section) - getSectionMRVRank(b.section));

  // ==========================================
  // PASS 1: GLOBAL PRIORITY SLOT ALLOCATION (FIXED-PERIOD LOCKED SUBJECTS ACROSS ALL SECTIONS)
  // ==========================================
  // Fixed placement rules (e.g. HGP on Monday Period 1) are allocated FIRST across all sections
  // before flexible slots. Subjects locked dynamically to Last Available Period are deferred to Pass 5
  // after compaction so they always sit cleanly after the section's final non-last class of that day.
  sectionContexts.forEach((ctx) => {
    const placementLockedSubjects = ctx.remainingHours.filter((s) => {
      if (isDynamicLastPeriodSubject(s, allPlacementRules)) return false;
      const hasDay = s.preferredDay && s.preferredDay !== "any";
      const hasSlot = s.preferredPeriodSlot && s.preferredPeriodSlot !== "any";
      const hasSpecific = Array.isArray(s.specificPeriods) && s.specificPeriods.length > 0;
      return hasDay || hasSlot || hasSpecific;
    }).sort((left, right) => {
      const leftStrict = (left.preferredDay && left.preferredDay !== "any") && (left.preferredPeriodSlot && left.preferredPeriodSlot !== "any");
      const rightStrict = (right.preferredDay && right.preferredDay !== "any") && (right.preferredPeriodSlot && right.preferredPeriodSlot !== "any");
      if (leftStrict && !rightStrict) return -1;
      if (!leftStrict && rightStrict) return 1;
      return right.required - left.required;
    });

    placementLockedSubjects.forEach((lockedSubj) => {
      while (lockedSubj.remaining > 0) {
        const candidateSlots = ctx.validSlots.filter((slot) => {
          if (assignments[createCellKey(ctx.section.id, slot.id)] || ctx.assignedSlotIds.has(slot.id)) return false;
          return !isSubjectRestrictedForSlot(lockedSubj, slot, config.constraints, config, scheduleType, {
            section: ctx.section,
            assignments,
            slotsById: slotsByIdForSolver,
            subjectsById: subjectsByIdForSolver,
          });
        });

        if (candidateSlots.length === 0) {
          break;
        }

        let placed = false;
        for (const slot of candidateSlots) {
          const teacher =
            ctx.findBestTeacherForSlot(lockedSubj, slot, false, false) ||
            ctx.findBestTeacherForSlot(lockedSubj, slot, false, true) ||
            ctx.findBestTeacherForSlot(lockedSubj, slot, true, true);
          if (teacher) {
            ctx.commitSlotAssignment(lockedSubj, teacher, slot);
            placed = true;
            break;
          }
        }

        if (!placed) {
          break;
        }
      }
    });
  });

  // ==========================================
  // PASS 2: GENERAL SLOT ALLOCATION (FLEXIBLE SUBJECTS WITH HORIZONTAL CONTINUITY PRIORITY)
  // ==========================================
  sectionContexts.forEach((ctx) => {
    const {
      section,
      sectionLabel,
      enhancedEligibleSubjects,
      remainingHours,
      validSlots,
      assignedSlotIds,
      subjectDayUsage,
      sectionDailyCoreCounts,
      dailyPeriodSubjectMap,
      periodAnchorSubjectMap,
      subjectAnchoredPeriodMap,
      canPlaceNonLastOnDay,
      findBestTeacherForSlot,
      commitSlotAssignment,
    } = ctx;

    validSlots.forEach((slot) => {
      if (assignments[createCellKey(section.id, slot.id)] || assignedSlotIds.has(slot.id)) {
        return;
      }

      const day = slot.day || "Monday";
      if (!canPlaceNonLastOnDay(day)) {
        return;
      }
      const levelConfig = scheduleType === "jhs" ? config?.jhs : config?.shs;
      const activeDaysList = extractDaysFromLevelConfig(levelConfig)?.daySequence || [];
      const totalDaysCount = activeDaysList.length ? activeDaysList.length : 5;
      const currentPeriodNum = Number(slot.period || 0);
      const prevPeriodSubjectId = dailyPeriodSubjectMap.get(`${day}::${currentPeriodNum - 1}`);
      const rowAnchorSubjId = periodAnchorSubjectMap.get(currentPeriodNum);

      // Filter candidates that have remaining > 0 AND haven't exceeded daily limit for this day AND not restricted for slot
      let subjectCandidates = shuffleArray(
        remainingHours.filter((subject) => {
          if (subject.remaining <= 0) return false;
          if (isDynamicLastPeriodSubject(subject, allPlacementRules)) return false;
          if (
            isSubjectRestrictedForSlot(subject, slot, config.constraints, config, scheduleType, {
              section,
              assignments,
              slotsById: slotsByIdForSolver,
              subjectsById: subjectsByIdForSolver,
            })
          ) {
            return false;
          }

          const classesPerWeek = parseBoundedNumber(subject?.classesPerWeek, 1, 12, 0);
          const maxPerDay = subject.isDoublePeriod
            ? Math.max(2, classesPerWeek > totalDaysCount ? Math.ceil(classesPerWeek / totalDaysCount) : 1)
            : (classesPerWeek > totalDaysCount ? Math.ceil(classesPerWeek / totalDaysCount) : 1);
          const currentDayCount = subjectDayUsage.get(`${day}::${subject.id}`) || 0;

          return currentDayCount < maxPerDay;
        })
      ).sort((left, right) => {
        // Priority 1: Double Period Continuation - if previous period was this subject and it requires double period, place it immediately
        const leftIsPrev = left.id === prevPeriodSubjectId && left.isDoublePeriod;
        const rightIsPrev = right.id === prevPeriodSubjectId && right.isDoublePeriod;
        if (leftIsPrev && !rightIsPrev) return -1;
        if (!leftIsPrev && rightIsPrev) return 1;

        // Priority 2: Placement Lock Priority - Subjects locked to specific day or period should be placed before generic flexible subjects
        const leftLocked = (left.preferredDay && left.preferredDay !== "any") || (left.preferredPeriodSlot && left.preferredPeriodSlot !== "any");
        const rightLocked = (right.preferredDay && right.preferredDay !== "any") || (right.preferredPeriodSlot && right.preferredPeriodSlot !== "any");
        if (leftLocked && !rightLocked) return -1;
        if (!leftLocked && rightLocked) return 1;

        // Priority 3A: Same-Period Horizontal Continuity Anchor
        // If a subject was already placed in this exact period row (currentPeriodNum) on an earlier day of the week,
        // keep it in this period row across the week!
        const leftIsRowAnchor = left.id === rowAnchorSubjId || subjectAnchoredPeriodMap.get(left.id) === currentPeriodNum;
        const rightIsRowAnchor = right.id === rowAnchorSubjId || subjectAnchoredPeriodMap.get(right.id) === currentPeriodNum;
        if (leftIsRowAnchor && !rightIsRowAnchor) return -1;
        if (!leftIsRowAnchor && rightIsRowAnchor) return 1;

        // Priority 3B: Protect Other Period Rows' Anchors (Avoid Broken Schedules Unless Necessary)
        // If this period row has no active anchor yet, prefer an unanchored subject over a subject that is already
        // anchored to a DIFFERENT period row so each subject claims its own dedicated horizontal row first!
        const leftAnchoredElsewhere = subjectAnchoredPeriodMap.has(left.id) && subjectAnchoredPeriodMap.get(left.id) !== currentPeriodNum;
        const rightAnchoredElsewhere = subjectAnchoredPeriodMap.has(right.id) && subjectAnchoredPeriodMap.get(right.id) !== currentPeriodNum;
        if (!leftAnchoredElsewhere && rightAnchoredElsewhere) return -1;
        if (leftAnchoredElsewhere && !rightAnchoredElsewhere) return 1;

        // Priority 4: MRV Scarce Program / Specialization Priority (SPA, SPJ, SP-STEM enhancements)
        const leftIsSpecialized = String(left.subjectType || "").toLowerCase() === "specialized";
        const rightIsSpecialized = String(right.subjectType || "").toLowerCase() === "specialized";
        if (leftIsSpecialized && !rightIsSpecialized) return -1;
        if (!leftIsSpecialized && rightIsSpecialized) return 1;

        // Feature 5: Student Core Subject Balancing across the day
        if (config?.constraints?.enforceStudentCoreBalance !== false) {
          const currentDayCore = sectionDailyCoreCounts.get(day) || 0;
          if (currentDayCore >= 2) {
            const leftIsCore = isCore(left);
            const rightIsCore = isCore(right);
            if (!leftIsCore && rightIsCore) return -1;
            if (leftIsCore && !rightIsCore) return 1;
          }
        }
        return right.remaining - left.remaining;
      });

      // Fallback: If strict daily limit filtering leaves 0 candidates, do NOT assign a second period on the same day
      // unless the subject is explicitly configured as a double period. This prevents illegal same-day duplicate conflicts!
      if (subjectCandidates.length === 0) {
        subjectCandidates = shuffleArray(
          remainingHours.filter((subject) => {
            if (subject.remaining <= 0) return false;
            if (isDynamicLastPeriodSubject(subject, allPlacementRules)) return false;
            if (!subject.isDoublePeriod) return false;
            if (
              isSubjectRestrictedForSlot(subject, slot, config.constraints, config, scheduleType, {
                section,
                assignments,
                slotsById: slotsByIdForSolver,
                subjectsById: subjectsByIdForSolver,
              })
            ) {
              return false;
            }
            const currentDayCount = subjectDayUsage.get(`${day}::${subject.id}`) || 0;
            return currentDayCount < 2;
          })
        ).sort((left, right) => right.remaining - left.remaining);
      }

      if (subjectCandidates.length === 0) {
        return;
      }

      let selectedPair = null;

      // Pass 2A: Try with strict Teacher Non-Continuous Break Guard (max 3 consecutive periods)
      for (const subject of subjectCandidates) {
        const teacher = findBestTeacherForSlot(subject, slot, false, false);
        if (teacher) {
          selectedPair = { subject, teacher };
          break;
        }
      }

      // Pass 2B: If all eligible teachers hit the 3-consecutive-period soft break guard at this slot,
      // allow the bound teacher with break-guard relaxation so the period is not left empty
      if (!selectedPair) {
        for (const subject of subjectCandidates) {
          const teacher = findBestTeacherForSlot(subject, slot, false, true);
          if (teacher) {
            selectedPair = { subject, teacher };
            break;
          }
        }
      }

      if (!selectedPair) {
        // Do not push conflict during normal slot pass; allow Unmet Recovery Pass to resolve
        return;
      }

      commitSlotAssignment(selectedPair.subject, selectedPair.teacher, slot);
    });

    // Unmet Subject Recovery Pass: Attempt to fulfill required weekly quota for non-dynamic-last subjects that still have remaining hours
    const unmetList = remainingHours.filter(
      (subject) => subject.remaining > 0 && !isDynamicLastPeriodSubject(subject, allPlacementRules)
    );
    if (unmetList.length > 0) {
      const levelConfig = scheduleType === "jhs" ? config?.jhs : config?.shs;
      const activeDaysList = extractDaysFromLevelConfig(levelConfig)?.daySequence || [];
      const totalDaysCount = activeDaysList.length || 5;

      unmetList.forEach((subject) => {
        while (subject.remaining > 0) {
          const isDouble = Boolean(subject.isDoublePeriod);
          const classesPerWeek = parseBoundedNumber(subject?.classesPerWeek, 1, 12, 4);
          const maxPerDay = isDouble ? 2 : (classesPerWeek > totalDaysCount ? Math.ceil(classesPerWeek / totalDaysCount) : 1);

          // 1. Direct placement into an empty slot on an open day
          const emptySlots = validSlots.filter((slot) => {
            if (assignments[createCellKey(section.id, slot.id)] || assignedSlotIds.has(slot.id)) return false;
            if (!canPlaceNonLastOnDay(slot.day)) return false;
            if (
              isSubjectRestrictedForSlot(subject, slot, config.constraints, config, scheduleType, {
                section,
                assignments,
                slotsById: slotsByIdForSolver,
                subjectsById: subjectsByIdForSolver,
              })
            ) {
              return false;
            }
            const currentDayCount = subjectDayUsage.get(`${slot.day}::${subject.id}`) || 0;
            return currentDayCount < maxPerDay;
          });

          let placed = false;

          // Step 1: Direct placement preserving bound section teacher continuity
          for (const emptySlot of emptySlots) {
            const teacher = findBestTeacherForSlot(subject, emptySlot, false);
            if (teacher) {
              commitSlotAssignment(subject, teacher, emptySlot);
              placed = true;
              break;
            }
          }

          if (placed) continue;

          // Step 2: Intra-section relocation: shift another flexible subject to an empty slot
          const allEmpty = validSlots.filter((s) => !assignedSlotIds.has(s.id));
          for (const emptySlot of allEmpty) {
            const emptyDay = emptySlot.day || "Monday";
            let swapped = false;

            for (const occSlot of validSlots) {
              if (!assignments[createCellKey(section.id, occSlot.id)] && !assignedSlotIds.has(occSlot.id)) continue;
              const occDay = occSlot.day || "Monday";
              if (occDay !== emptyDay && !canPlaceNonLastOnDay(emptyDay, { checkWeeklyReserve: false })) continue;
              const currentDayCount = subjectDayUsage.get(`${occDay}::${subject.id}`) || 0;
              if (currentDayCount >= maxPerDay) continue;
              const occKey = createCellKey(section.id, occSlot.id);
              if (lockedCellKeys.has(occKey)) continue;
              if (
                isSubjectRestrictedForSlot(subject, occSlot, config.constraints, config, scheduleType, {
                  section,
                  assignments,
                  slotsById: slotsByIdForSolver,
                  subjectsById: subjectsByIdForSolver,
                  excludeCellKey: occKey,
                })
              ) {
                continue;
              }

              const occAssign = assignments[occKey];
              if (!occAssign) continue;
              const occSubject = enhancedEligibleSubjects.find((s) => s.id === occAssign.subjectId);
              if (!occSubject || occSubject.id === subject.id) continue;

              // Do not move placement locked subjects
              if (isPlacementLockedSubject(occSubject, allPlacementRules)) continue;

              // Check if occSubject can move to emptySlot
              if (
                isSubjectRestrictedForSlot(occSubject, emptySlot, config.constraints, config, scheduleType, {
                  section,
                  assignments,
                  slotsById: slotsByIdForSolver,
                  subjectsById: subjectsByIdForSolver,
                  excludeCellKey: occKey,
                })
              ) {
                continue;
              }
              const occDayCountOnEmpty = subjectDayUsage.get(`${emptyDay}::${occSubject.id}`) || 0;
              const occClassesPerWeek = parseBoundedNumber(occSubject?.classesPerWeek, 1, 12, 4);
              const occMaxPerDay = occSubject.isDoublePeriod ? 2 : (occClassesPerWeek > totalDaysCount ? Math.ceil(occClassesPerWeek / totalDaysCount) : 1);
              if (occDayCountOnEmpty >= occMaxPerDay) continue;

              // Check if all assigned teachers in occAssign are eligible at emptySlot
              const occTeacher = activeTeachers.find((t) => t.id === occAssign.teacherId);
              if (!occTeacher) continue;

              const occAllTeacherIds = Array.from(
                new Set([
                  occAssign.teacherId,
                  ...(Array.isArray(occAssign.coTeacherIds) ? occAssign.coTeacherIds : []),
                  ...(Array.isArray(occAssign.breakoutAssignments)
                    ? occAssign.breakoutAssignments.map((b) => b?.teacherId)
                    : []),
                ].filter(Boolean))
              );

              // Temporarily unassign occSlot
              delete assignments[occKey];
              assignedSlotIds.delete(occSlot.id);
              subjectDayUsage.set(`${occDay}::${occSubject.id}`, (subjectDayUsage.get(`${occDay}::${occSubject.id}`) || 1) - 1);
              occAllTeacherIds.forEach((tId) => {
                const bMap = teacherBusyBySlot.get(tId);
                if (bMap) bMap.delete(occSlot.id);
              });

              const occTeacherEligible = isSubjectMultiTeacher(occSubject)
                ? Boolean(findBestTeacherForSlot(occSubject, emptySlot, false) || findBestTeacherForSlot(occSubject, emptySlot, true))
                : isTeacherEligible({
                    teacher: occTeacher,
                    subject: occSubject,
                    section,
                    slot: emptySlot,
                    constraints: config.constraints,
                    teacherBusyBySlot,
                    excludedSectionId: section.id,
                  });

              let targetTeacher = null;
              if (occTeacherEligible) {
                targetTeacher = findBestTeacherForSlot(subject, occSlot, false) || findBestTeacherForSlot(subject, occSlot, true);
              }

              if (occTeacherEligible && targetTeacher) {
                commitSlotAssignment(occSubject, occTeacher, emptySlot);
                commitSlotAssignment(subject, targetTeacher, occSlot);
                placed = true;
                swapped = true;
                break;
              } else {
                // Revert
                assignments[occKey] = occAssign;
                assignedSlotIds.add(occSlot.id);
                subjectDayUsage.set(`${occDay}::${occSubject.id}`, (subjectDayUsage.get(`${occDay}::${occSubject.id}`) || 0) + 1);
                occAllTeacherIds.forEach((tId) => {
                  const bMap = teacherBusyBySlot.get(tId) || new Map();
                  bMap.set(occSlot.id, section.id);
                  teacherBusyBySlot.set(tId, bMap);
                });
              }
            }

            if (swapped) break;
          }

          if (placed) continue;

          // Step 3: Emergency fallback: allow already-deployed qualified teachers to absorb the class
          for (const emptySlot of emptySlots) {
            const teacher = findBestTeacherForSlot(subject, emptySlot, true);
            if (teacher) {
              commitSlotAssignment(subject, teacher, emptySlot);
              placed = true;
              break;
            }
          }

          if (!placed) {
            // Step 3B: Relaxation: try any remaining open slot in section to prevent dropped period quota
            const anyOpenSlot = validSlots.filter((slot) => {
              if (assignments[createCellKey(section.id, slot.id)] || assignedSlotIds.has(slot.id)) return false;
              if (!canPlaceNonLastOnDay(slot.day)) return false;
              if (
                isSubjectRestrictedForSlot(subject, slot, config.constraints, config, scheduleType, {
                  section,
                  assignments,
                  slotsById: slotsByIdForSolver,
                  subjectsById: subjectsByIdForSolver,
                })
              ) {
                return false;
              }
              const currentDayCount = subjectDayUsage.get(`${slot.day}::${subject.id}`) || 0;
              return currentDayCount < 2;
            });

            for (const openSlot of anyOpenSlot) {
              const teacher = findBestTeacherForSlot(subject, openSlot, true);
              if (teacher) {
                commitSlotAssignment(subject, teacher, openSlot);
                placed = true;
                break;
              }
            }
          }

          if (!placed) {
            break;
          }
        }
      });
    }
  });

  // Pass to compact schedule: Fill early days (Mon-Thu) up to the end of the day, leaving lesser scheduled classes on the end day of the week (Fri)
  const getSlotSortKey = (slot) => {
    const dIndex = DAYS.indexOf(slot?.day);
    const pNum = Number(slot?.period || 0);
    return (dIndex !== -1 ? dIndex : 99) * 100 + pNum;
  };

  const canAllAssignmentTeachersMoveToSlot = (assignment, subject, section, targetSlot) => {
    const allTeacherIds = Array.from(
      new Set([
        assignment.teacherId,
        ...(Array.isArray(assignment.coTeacherIds) ? assignment.coTeacherIds : []),
        ...(Array.isArray(assignment.breakoutAssignments)
          ? assignment.breakoutAssignments.map((b) => b?.teacherId)
          : []),
      ].filter(Boolean))
    );
    if (allTeacherIds.length === 0) return false;
    return allTeacherIds.every((tId) => {
      const tObj = activeTeachers.find((t) => t.id === tId);
      if (!tObj) return false;
      const busyMap = teacherBusyBySlot.get(tId);
      if (busyMap && busyMap.has(targetSlot.id) && busyMap.get(targetSlot.id) !== section.id) return false;
      if (matchesUnavailablePeriod(targetSlot, tObj.unavailablePeriods)) return false;
      const restrictedPeriods = getTeacherRestrictedPeriods(tId, config.constraints, tObj);
      if (matchesRestrictedPeriod(targetSlot, restrictedPeriods)) return false;
      return true;
    });
  };

  for (let pass = 0; pass < 5; pass++) {
    let movedAny = false;

    sections.forEach((section) => {
      const rawSlots = slots.filter((slot) => isSlotValidForSection(section, slot, scheduleType, config));
      const sortedSlots = rawSlots.slice().sort((left, right) => getSlotSortKey(left) - getSlotSortKey(right));

      const getSubjectsOnDay = (dayName) => {
        const set = new Set();
        sortedSlots.forEach((s) => {
          if (s.day === dayName) {
            const key = createCellKey(section.id, s.id);
            if (assignments[key]) set.add(assignments[key].subjectId);
          }
        });
        return set;
      };

      for (let i = 0; i < sortedSlots.length; i++) {
        const emptySlot = sortedSlots[i];
        const emptyCellKey = createCellKey(section.id, emptySlot.id);
        if (assignments[emptyCellKey]) continue;

        const daySubjects = getSubjectsOnDay(emptySlot.day);
        let candidateMove = null;

        // 1. Try moving a class from a later day/period whose subject is NOT yet assigned on emptySlot's day (Intra-day only)
        for (let j = sortedSlots.length - 1; j > i; j--) {
          const laterSlot = sortedSlots[j];
          if (getSlotSortKey(laterSlot) <= getSlotSortKey(emptySlot)) break;
          if (laterSlot.day !== emptySlot.day) continue;

          const laterCellKey = createCellKey(section.id, laterSlot.id);
          if (lockedCellKeys.has(laterCellKey)) continue;
          const assignment = assignments[laterCellKey];
          if (!assignment) continue;

          if (daySubjects.has(assignment.subjectId)) continue;

          const subject = subjects.find((s) => s.id === assignment.subjectId);
          const teacher = activeTeachers.find((t) => t.id === assignment.teacherId);
          if (isPlacementLockedSubject(subject, allPlacementRules)) continue;

          if (
            teacher &&
            subject &&
            !isSubjectRestrictedForSlot(subject, emptySlot, config.constraints, config, scheduleType, {
              section,
              assignments,
              slotsById: slotsByIdForSolver,
              subjectsById: subjectsByIdForSolver,
              excludeCellKey: laterCellKey,
            }) &&
            isTeacherEligible({
              teacher,
              subject,
              section,
              slot: emptySlot,
              constraints: config.constraints,
              teacherBusyBySlot,
              excludedSectionId: section.id,
            }) &&
            canAllAssignmentTeachersMoveToSlot(assignment, subject, section, emptySlot)
          ) {
            candidateMove = { emptySlot, emptyCellKey, laterSlot, laterCellKey, assignment, teacher };
            break;
          }
        }

        // 2. Fallback: Try moving any eligible class from a later day/period (Intra-day only)
        if (!candidateMove) {
          for (let j = sortedSlots.length - 1; j > i; j--) {
            const laterSlot = sortedSlots[j];
            if (getSlotSortKey(laterSlot) <= getSlotSortKey(emptySlot)) break;
            if (laterSlot.day !== emptySlot.day) continue;

            const laterCellKey = createCellKey(section.id, laterSlot.id);
            if (lockedCellKeys.has(laterCellKey)) continue;
            const assignment = assignments[laterCellKey];
            if (!assignment) continue;

            const subject = subjects.find((s) => s.id === assignment.subjectId);
            const teacher = activeTeachers.find((t) => t.id === assignment.teacherId);
            if (isPlacementLockedSubject(subject, allPlacementRules)) continue;

            if (
              teacher &&
              subject &&
              !isSubjectRestrictedForSlot(subject, emptySlot, config.constraints, config, scheduleType, {
                section,
                assignments,
                slotsById: slotsByIdForSolver,
                subjectsById: subjectsByIdForSolver,
                excludeCellKey: laterCellKey,
              }) &&
              isTeacherEligible({
                teacher,
                subject,
                section,
                slot: emptySlot,
                constraints: config.constraints,
                teacherBusyBySlot,
                excludedSectionId: section.id,
              }) &&
              canAllAssignmentTeachersMoveToSlot(assignment, subject, section, emptySlot)
            ) {
              candidateMove = { emptySlot, emptyCellKey, laterSlot, laterCellKey, assignment, teacher };
              break;
            }
          }
        }

        if (candidateMove) {
          const { emptyCellKey: targetKey, laterSlot, laterCellKey: sourceKey, assignment, emptySlot: targetSlot } = candidateMove;

          assignments[targetKey] = {
            ...assignment,
            updatedAt: new Date().toISOString(),
          };
          delete assignments[sourceKey];

          const allMovedTeacherIds = Array.from(
            new Set([
              assignment.teacherId,
              ...(Array.isArray(assignment.coTeacherIds) ? assignment.coTeacherIds : []),
              ...(Array.isArray(assignment.breakoutAssignments)
                ? assignment.breakoutAssignments.map((b) => b?.teacherId)
                : []),
            ].filter(Boolean))
          );

          allMovedTeacherIds.forEach((tId) => {
            const busyForT = teacherBusyBySlot.get(tId) || new Map();
            busyForT.delete(laterSlot.id);
            busyForT.set(targetSlot.id, section.id);
            teacherBusyBySlot.set(tId, busyForT);
          });

          movedAny = true;
        }
      }
    });

    if (!movedAny) break;
  }

  // ==========================================
  // PASS 4: INTRA-DAY HORIZONTAL CONTINUITY ALIGNMENT SWAP PASS
  // ==========================================
  // If a multi-day subject was forced into a different period on one day (broken schedule),
  // check if swapping it with the subject occupying its dominant period row on that same day
  // improves horizontal period continuity while remaining 100% conflict-free and respecting teacher breaks.
  for (let hPass = 0; hPass < 3; hPass++) {
    let swappedAny = false;

    sections.forEach((section) => {
      const secSlots = slots.filter((slot) => isSlotValidForSection(section, slot, scheduleType, config));
      const subjPeriodCounts = new Map(); // subjectId -> Map<periodNum, count>

      secSlots.forEach((s) => {
        const ck = createCellKey(section.id, s.id);
        const asgn = assignments[ck];
        if (!asgn?.subjectId) return;
        const pNum = Number(s.period || 0);
        if (!pNum) return;
        const pMap = subjPeriodCounts.get(asgn.subjectId) || new Map();
        pMap.set(pNum, (pMap.get(pNum) || 0) + 1);
        subjPeriodCounts.set(asgn.subjectId, pMap);
      });

      const slotsByDay = new Map();
      secSlots.forEach((s) => {
        const list = slotsByDay.get(s.day) || [];
        list.push(s);
        slotsByDay.set(s.day, list);
      });

      slotsByDay.forEach((daySlots) => {
        for (let i = 0; i < daySlots.length; i++) {
          for (let j = i + 1; j < daySlots.length; j++) {
            const slotA = daySlots[i];
            const slotB = daySlots[j];
            const pA = Number(slotA.period || 0);
            const pB = Number(slotB.period || 0);
            if (!pA || !pB || pA === pB) continue;

            const keyA = createCellKey(section.id, slotA.id);
            const keyB = createCellKey(section.id, slotB.id);
            if (lockedCellKeys.has(keyA) || lockedCellKeys.has(keyB)) continue;
            const asgnA = assignments[keyA];
            const asgnB = assignments[keyB];
            if (!asgnA || !asgnB || asgnA.subjectId === asgnB.subjectId) continue;

            const subjA = subjects.find((s) => s.id === asgnA.subjectId);
            const subjB = subjects.find((s) => s.id === asgnB.subjectId);
            if (!subjA || !subjB || subjA.isDoublePeriod || subjB.isDoublePeriod) continue;

            if (isPlacementLockedSubject(subjA, allPlacementRules) || isPlacementLockedSubject(subjB, allPlacementRules)) continue;
            if (
              isSubjectRestrictedForSlot(subjA, slotB, config.constraints, config, scheduleType, {
                section,
                assignments,
                slotsById: slotsByIdForSolver,
                subjectsById: subjectsByIdForSolver,
                excludeCellKey: keyA,
              })
            ) {
              continue;
            }
            if (
              isSubjectRestrictedForSlot(subjB, slotA, config.constraints, config, scheduleType, {
                section,
                assignments,
                slotsById: slotsByIdForSolver,
                subjectsById: subjectsByIdForSolver,
                excludeCellKey: keyB,
              })
            ) {
              continue;
            }

            const countsA = subjPeriodCounts.get(subjA.id) || new Map();
            const countsB = subjPeriodCounts.get(subjB.id) || new Map();
            // Current horizontal matches vs post-swap horizontal matches
            const currentScore = ((countsA.get(pA) || 1) - 1) + ((countsB.get(pB) || 1) - 1);
            const swappedScore = (countsA.get(pB) || 0) + (countsB.get(pA) || 0);
            if (swappedScore <= currentScore) continue;

            const teachersA = Array.from(
              new Set([
                asgnA.teacherId,
                ...(Array.isArray(asgnA.coTeacherIds) ? asgnA.coTeacherIds : []),
                ...(Array.isArray(asgnA.breakoutAssignments) ? asgnA.breakoutAssignments.map((b) => b?.teacherId) : []),
              ].filter(Boolean))
            );
            const teachersB = Array.from(
              new Set([
                asgnB.teacherId,
                ...(Array.isArray(asgnB.coTeacherIds) ? asgnB.coTeacherIds : []),
                ...(Array.isArray(asgnB.breakoutAssignments) ? asgnB.breakoutAssignments.map((b) => b?.teacherId) : []),
              ].filter(Boolean))
            );

            // Temporarily release both slots for teacher busy check
            teachersA.forEach((tId) => teacherBusyBySlot.get(tId)?.delete(slotA.id));
            teachersB.forEach((tId) => teacherBusyBySlot.get(tId)?.delete(slotB.id));

            const canMoveAToB =
              canAllAssignmentTeachersMoveToSlot(asgnA, subjA, section, slotB) &&
              teachersA.every((tId) => !wouldExceedContinuousTeachingLimit(tId, slotB, 3));
            const canMoveBToA =
              canAllAssignmentTeachersMoveToSlot(asgnB, subjB, section, slotA) &&
              teachersB.every((tId) => !wouldExceedContinuousTeachingLimit(tId, slotA, 3));

            if (canMoveAToB && canMoveBToA) {
              assignments[keyA] = { ...asgnB, updatedAt: new Date().toISOString() };
              assignments[keyB] = { ...asgnA, updatedAt: new Date().toISOString() };

              teachersA.forEach((tId) => {
                const bMap = teacherBusyBySlot.get(tId) || new Map();
                bMap.set(slotB.id, section.id);
                teacherBusyBySlot.set(tId, bMap);
              });
              teachersB.forEach((tId) => {
                const bMap = teacherBusyBySlot.get(tId) || new Map();
                bMap.set(slotA.id, section.id);
                teacherBusyBySlot.set(tId, bMap);
              });

              countsA.set(pA, Math.max(0, (countsA.get(pA) || 1) - 1));
              countsA.set(pB, (countsA.get(pB) || 0) + 1);
              countsB.set(pB, Math.max(0, (countsB.get(pB) || 1) - 1));
              countsB.set(pA, (countsB.get(pA) || 0) + 1);
              swappedAny = true;
            } else {
              // Restore busy slots
              teachersA.forEach((tId) => {
                const bMap = teacherBusyBySlot.get(tId) || new Map();
                bMap.set(slotA.id, section.id);
                teacherBusyBySlot.set(tId, bMap);
              });
              teachersB.forEach((tId) => {
                const bMap = teacherBusyBySlot.get(tId) || new Map();
                bMap.set(slotB.id, section.id);
                teacherBusyBySlot.set(tId, bMap);
              });
            }
          }
        }
      });
    });

    if (!swappedAny) break;
  }

  // ==========================================
  // PASS 5: DYNAMIC LAST AVAILABLE PERIOD PLACEMENT
  // ==========================================
  // Runs after compaction & horizontal alignment so subjects locked to "last"
  // land strictly in each section-day's first open period immediately after its
  // final non-last class (zero empty gaps before it, zero non-last classes after it).
  const levelConfigForLast = scheduleType === "jhs" ? config?.jhs : config?.shs;
  const activeDaysForLast = extractDaysFromLevelConfig(levelConfigForLast)?.daySequence || [];
  const baseDaysForLast = activeDaysForLast.length > 0 ? activeDaysForLast : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  sectionContexts.forEach((ctx) => {
    const lastSubjects = ctx.remainingHours
      .filter((s) => s.remaining > 0 && isDynamicLastPeriodSubject(s, allPlacementRules))
      .sort((a, b) => {
        const aDayLocked = a.preferredDay && a.preferredDay !== "any" ? 1 : 0;
        const bDayLocked = b.preferredDay && b.preferredDay !== "any" ? 1 : 0;
        if (aDayLocked !== bDayLocked) return bDayLocked - aDayLocked;
        return b.required - a.required;
      });

    if (lastSubjects.length === 0) return;

    const getCountOnDayInAssignments = (subjId, day) =>
      Object.entries(assignments).reduce((count, [ck, asgn]) => {
        const [secId, sId] = splitCellKey(ck);
        if (secId !== ctx.section.id || asgn?.subjectId !== subjId) return count;
        return slotsByIdForSolver.get(sId)?.day === day ? count + 1 : count;
      }, 0);

    lastSubjects.forEach((lastSubj) => {
      const maxPerDay = getSubjectMaxPerDay(lastSubj, baseDaysForLast.length, lastSubj.required);

      while (lastSubj.remaining > 0) {
        const prefDay = lastSubj.preferredDay && lastSubj.preferredDay !== "any" ? lastSubj.preferredDay : null;
        const candidateDays = (prefDay
          ? baseDaysForLast.filter((d) => d === prefDay)
          : baseDaysForLast.slice()
        ).filter((d) => getCountOnDayInAssignments(lastSubj.id, d) < maxPerDay);

        if (candidateDays.length === 0) break;

        if (!prefDay && candidateDays.length > 1) {
          candidateDays.sort((dayA, dayB) => {
            const maxA = getSectionDayMaxPeriod(ctx.section, dayA, scheduleType, config);
            const maxB = getSectionDayMaxPeriod(ctx.section, dayB, scheduleType, config);
            const infoA = getDynamicLastPeriodInfo({
              sectionId: ctx.section.id,
              day: dayA,
              assignments,
              slotsById: slotsByIdForSolver,
              subjectsById: subjectsByIdForSolver,
              placementRules: allPlacementRules,
              dayMaxPeriod: maxA,
            });
            const infoB = getDynamicLastPeriodInfo({
              sectionId: ctx.section.id,
              day: dayB,
              assignments,
              slotsById: slotsByIdForSolver,
              subjectsById: subjectsByIdForSolver,
              placementRules: allPlacementRules,
              dayMaxPeriod: maxB,
            });
            if (infoA.isDayFull !== infoB.isDayFull) return infoA.isDayFull ? 1 : -1;
            if (infoA.otherLastPeriods.length !== infoB.otherLastPeriods.length) {
              return infoA.otherLastPeriods.length - infoB.otherLastPeriods.length;
            }
            return infoA.expectedPeriod - infoB.expectedPeriod;
          });
        }

        let placed = false;

        // 5A. Direct placement at each candidate day's Last Available Period
        for (const day of candidateDays) {
          const dayMax = getSectionDayMaxPeriod(ctx.section, day, scheduleType, config);
          const info = getDynamicLastPeriodInfo({
            sectionId: ctx.section.id,
            day,
            assignments,
            slotsById: slotsByIdForSolver,
            subjectsById: subjectsByIdForSolver,
            placementRules: allPlacementRules,
            dayMaxPeriod: dayMax,
          });
          if (info.isDayFull) continue;

          const targetSlot = ctx.validSlots.find((s) => s.day === day && Number(s.period) === info.expectedPeriod);
          if (!targetSlot) continue;
          if (assignments[createCellKey(ctx.section.id, targetSlot.id)]) continue;
          if (matchesRestrictedPeriod(targetSlot, getSubjectRestrictedPeriods(lastSubj.id, effectiveConstraints))) {
            continue;
          }

          const teacher =
            ctx.findBestTeacherForSlot(lastSubj, targetSlot, false, false) ||
            ctx.findBestTeacherForSlot(lastSubj, targetSlot, false, true) ||
            ctx.findBestTeacherForSlot(lastSubj, targetSlot, true, true);
          if (teacher) {
            ctx.commitSlotAssignment(lastSubj, teacher, targetSlot);
            placed = true;
            break;
          }
        }

        if (placed) continue;

        // 5B. Full-day relocation / shift fallback to free Last Available Period or find an open teacher slot
        const pickTeacherInPass5 = (targetSlot, simAssignments) => {
          const simBusyMap = buildTeacherBusyMap(simAssignments, sectionsByIdForSolver, slotsByIdForSolver);
          if (isSubjectMultiTeacher(lastSubj)) {
            const br = selectBreakoutTeachersForSlot({
              subject: lastSubj,
              section: ctx.section,
              slot: targetSlot,
              activeTeachers,
              teacherBusyBySlot: simBusyMap,
              teacherLoad,
              config,
              allowLoadCapOverflow: true,
            });
            if (br?.isComplete && Array.isArray(br.chosenStreams) && br.chosenStreams.length > 0) {
              const validChosen = br.chosenStreams.filter((cs) => Boolean(cs.teacherObj));
              const primary = validChosen[0]?.teacherObj || null;
              if (primary) {
                return {
                  teacher: primary,
                  coTeacherIds: validChosen.map((cs) => cs.teacherId).filter((id) => id && id !== primary.id),
                  breakoutAssignments: br.chosenStreams.map((cs) => ({
                    stream: cs.stream,
                    teacherId: cs.teacherId || "",
                    teacherName: cs.teacherName || "",
                  })),
                  breakoutNote: br.chosenStreams
                    .map((b) => `${String(b.stream || "Stream").toUpperCase()} – ${b.teacherName || "Unassigned"}`)
                    .join("; "),
                };
              }
            }
            return null;
          }

          const boundTeacher = ctx.sectionTeacherMap.get(lastSubj.id) || null;
          if (
            boundTeacher &&
            isTeacherEligible({
              teacher: boundTeacher,
              subject: lastSubj,
              section: ctx.section,
              slot: targetSlot,
              constraints: effectiveConstraints,
              teacherBusyBySlot: simBusyMap,
              excludedSectionId: ctx.section.id,
            })
          ) {
            return { teacher: boundTeacher };
          }

          const rawEligible = activeTeachers.filter((t) =>
            isTeacherEligible({
              teacher: t,
              subject: lastSubj,
              section: ctx.section,
              slot: targetSlot,
              constraints: effectiveConstraints,
              teacherBusyBySlot: simBusyMap,
              excludedSectionId: ctx.section.id,
            })
          );
          const sorted = sortTeacherCandidates(rawEligible, lastSubj);
          return sorted[0] ? { teacher: sorted[0] } : null;
        };

        const plan = computeDynamicLastPlacementPlan({
          section: ctx.section,
          targetSubject: lastSubj,
          candidateDays,
          assignments,
          validSectionSlots: ctx.validSlots,
          slotsById: slotsByIdForSolver,
          subjectsById: subjectsByIdForSolver,
          sectionsById: sectionsByIdForSolver,
          facultyById: facultyByIdForSolver,
          activeTeachers,
          config,
          scheduleType,
          reservedLastSlotsByDay: ctx.reservedLastSlotsByDay,
          customTeacherPicker: pickTeacherInPass5,
        });

        const sectionLockedEntries = lockedEntriesBySection.get(ctx.section.id) || [];
        const preservesLockedCells = sectionLockedEntries.every((entry) => {
          const nextAsgn = plan?.nextAssignments?.[entry.cellKey];
          return (
            Boolean(nextAsgn) &&
            nextAsgn.subjectId === entry.asgn.subjectId &&
            nextAsgn.teacherId === entry.asgn.teacherId
          );
        });

        if (plan?.nextAssignments && preservesLockedCells) {
          Object.keys(assignments).forEach((ck) => {
            const [secId, sId] = splitCellKey(ck);
            if (secId === ctx.section.id) {
              collectAssignmentTeacherIds(assignments[ck]).forEach((tId) => {
                teacherBusyBySlot.get(tId)?.delete(sId);
              });
              delete assignments[ck];
            }
          });
          Object.entries(plan.nextAssignments).forEach(([ck, asgn]) => {
            const [secId, sId] = splitCellKey(ck);
            if (secId === ctx.section.id) {
              const lockedMatch = lockedCellKeys.has(ck) ? lockedAssignments?.[ck] : null;
              assignments[ck] = lockedMatch ? { ...lockedMatch } : asgn;
              collectAssignmentTeacherIds(asgn).forEach((tId) => {
                const bMap = teacherBusyBySlot.get(tId) || new Map();
                bMap.set(sId, ctx.section.id);
                teacherBusyBySlot.set(tId, bMap);
              });
            }
          });
          collectAssignmentTeacherIds({
            teacherId: plan.teacher?.id,
            coTeacherIds: plan.pickedInfo?.coTeacherIds,
          }).forEach((tId) => {
            teacherLoad.set(tId, (teacherLoad.get(tId) || 0) + 1);
          });
          if (!ctx.sectionTeacherMap.has(lastSubj.id) && plan.teacher && !isSubjectMultiTeacher(lastSubj)) {
            ctx.sectionTeacherMap.set(lastSubj.id, plan.teacher);
          }
          lastSubj.remaining -= 1;
          placed = true;
        }

        if (!placed) break;
      }
    });
  });

  // Final unmet subject quota check after Pass 1-5 have completed
  sectionContexts.forEach((ctx) => {
    const unmetSubjects = ctx.remainingHours.filter((subject) => subject.remaining > 0);
    unmetSubjects.forEach((subject) => {
      const assignedCount = subject.required - subject.remaining;
      pushConflict(
        `${ctx.sectionLabel}: ${subject.subjectName} has ${assignedCount} of ${subject.required} required recurring daily period(s) assigned.`
      );
    });
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
    conflictDetails: mergeConflictDetails(Array.from(conflictDetailByKey.values()), evaluation.conflictDetails),
    teacherLoadPercent: evaluation.teacherLoadPercent,
    status: "draft",
  };
}

function evaluateSchedule({ assignments, sections, slots, subjects, teachers, scheduleType, config }) {
  if (!assignments || Object.keys(assignments).length === 0) {
    return {
      conflicts: [],
      conflictDetails: [],
      teacherLoadPercent: {},
    };
  }

  const sectionsById = new Map(sections.map((section) => [section.id, section]));
  const slotsById = new Map(slots.map((slot) => [slot.id, slot]));
  const subjectsById = new Map(subjects.map((subject) => [subject.id, subject]));
  const teachersById = new Map(teachers.map((teacher) => [teacher.id, teacher]));

  const teacherSlotMap = new Map();
  const conflicts = [];
  const conflictDetails = [];
  const conflictDetailKeys = new Set();
  const teacherLoadCount = new Map();
  const sectionSubjectUsage = new Map();
  const sectionSpecializedSubjectUsage = new Map();

  const pushConflict = (message, cellKeys = []) => {
    const normalizedMessage = sanitizeText(message);
    if (!normalizedMessage) {
      return;
    }

    const normalizedCellKeys = normalizeStringArray(cellKeys);
    const detailKey = `${normalizedMessage}::${[...normalizedCellKeys].sort().join("|")}`;

    if (conflictDetailKeys.has(detailKey)) {
      return;
    }

    conflictDetailKeys.add(detailKey);
    conflicts.push(normalizedMessage);
    conflictDetails.push({
      message: normalizedMessage,
      cellKeys: normalizedCellKeys,
    });
  };

  // First pass: gather all teacher-slot assignments
  const teacherSlotAssignments = new Map(); // teacherId -> slotId -> [{ sectionId, cellKey }]

  Object.entries(assignments || {}).forEach(([cellKey, assignment]) => {
    const [sectionId, slotId] = splitCellKey(cellKey);
    if (!assignment) return;

    const assignedTeacherIds = [];
    if (assignment.teacherId) assignedTeacherIds.push(assignment.teacherId);
    if (Array.isArray(assignment.coTeacherIds)) {
      assignment.coTeacherIds.forEach((id) => {
        if (id && !assignedTeacherIds.includes(id)) assignedTeacherIds.push(id);
      });
    }
    if (Array.isArray(assignment.breakoutAssignments)) {
      assignment.breakoutAssignments.forEach((b) => {
        if (b?.teacherId && !assignedTeacherIds.includes(b.teacherId)) assignedTeacherIds.push(b.teacherId);
      });
    }

    assignedTeacherIds.forEach((teacherId) => {
      if (!teacherSlotAssignments.has(teacherId)) teacherSlotAssignments.set(teacherId, new Map());
      const slotMap = teacherSlotAssignments.get(teacherId);
      if (!slotMap.has(slotId)) slotMap.set(slotId, []);
      slotMap.get(slotId).push({ sectionId, cellKey });
    });
  });

  // Second pass: process assignments and detect conflicts
  Object.entries(assignments || {}).forEach(([cellKey, assignment]) => {
    const [sectionId, slotId] = splitCellKey(cellKey);
    const section = sectionsById.get(sectionId);
    const slot = slotsById.get(slotId);
    const subject = subjectsById.get(assignment.subjectId);
    const teacher = teachersById.get(assignment.teacherId);
    const currentCellKey = createCellKey(sectionId, slotId);

    if (!section || !slot || !subject || !teacher) {
      pushConflict(`Invalid assignment reference in ${cellKey}.`, [cellKey]);
      return;
    }

    if (!isSlotValidForSection(section, slot, scheduleType, config)) {
      pushConflict(`${section.name} ${formatDayPeriodOrdinalLabel(slot)}: period not valid for section settings.`, [currentCellKey]);
    }

    const allAssignedTeacherIdsInCell = [assignment.teacherId];
    if (Array.isArray(assignment.coTeacherIds)) {
      assignment.coTeacherIds.forEach((id) => {
        if (id && !allAssignedTeacherIdsInCell.includes(id)) allAssignedTeacherIdsInCell.push(id);
      });
    }
    if (Array.isArray(assignment.breakoutAssignments)) {
      assignment.breakoutAssignments.forEach((b) => {
        if (b?.teacherId && !allAssignedTeacherIdsInCell.includes(b.teacherId)) {
          allAssignedTeacherIdsInCell.push(b.teacherId);
        }
      });
    }

    // Multi-teacher / joined subject completeness validation
    if (isSubjectMultiTeacher(subject)) {
      const configuredStreams = getSubjectBreakoutStreams(subject, config);
      const requiredCount = configuredStreams.length;
      const validDistinctCount = allAssignedTeacherIdsInCell.filter((tId) => teachersById.has(tId)).length;
      const missingStreamNames = [];

      for (let sIdx = 0; sIdx < requiredCount; sIdx++) {
        const streamEntry = Array.isArray(assignment.breakoutAssignments)
          ? assignment.breakoutAssignments[sIdx]
          : null;
        const fallbackId =
          sIdx === 0
            ? assignment.teacherId
            : Array.isArray(assignment.coTeacherIds)
            ? assignment.coTeacherIds[sIdx - 1]
            : "";
        const resolvedId = streamEntry?.teacherId || fallbackId || "";
        if (!resolvedId || !teachersById.has(resolvedId)) {
          missingStreamNames.push(configuredStreams[sIdx]?.name || `Stream ${sIdx + 1}`);
        }
      }

      if (validDistinctCount < requiredCount || missingStreamNames.length > 0) {
        const missingDetail =
          missingStreamNames.length > 0 ? ` (missing: ${missingStreamNames.join(", ")})` : "";
        pushConflict(
          `${section.name} ${formatDayPeriodOrdinalLabel(slot)}: ${formatSubjectDisplayName(subject)} requires ${requiredCount} teachers, but only ${validDistinctCount} of ${requiredCount} assigned${missingDetail}.`,
          [currentCellKey]
        );
      }
    }

    const slotOrdinalLabel = formatDayPeriodOrdinalLabel(slot);

    allAssignedTeacherIdsInCell.forEach((tId) => {
      const tObj = teachersById.get(tId);
      if (!tObj) return;
      const tRestricted = getTeacherRestrictedPeriods(tObj.id, config.constraints, tObj);
      const isTeacherRestricted = matchesRestrictedPeriod(slot, tRestricted);
      if (isTeacherRestricted) {
        pushConflict(`${section.name} ${slotOrdinalLabel}: ${tObj.name} is restricted for this period.`, [currentCellKey]);
      } else if (config.constraints.enforceUnavailablePeriods) {
        const unavailable = matchesUnavailablePeriod(slot, tObj.unavailablePeriods);
        if (unavailable) {
          pushConflict(`${section.name} ${slotOrdinalLabel}: ${tObj.name} is unavailable.`, [currentCellKey]);
        }
      }
    });

    const subjectRestrictedPeriods = getSubjectRestrictedPeriods(subject.id, config.constraints);
    if (matchesRestrictedPeriod(slot, subjectRestrictedPeriods)) {
      pushConflict(`${section.name} ${slotOrdinalLabel}: ${formatSubjectDisplayName(subject)} is restricted for this period.`, [currentCellKey]);
    }

    if (config.constraints.enforceExpertiseAndGradeMatch) {
      if (!doesTeacherMatchGrade(teacher, section.grade)) {
        pushConflict(`${section.name} ${slotOrdinalLabel}: ${teacher.name} does not match Grade ${section.grade}.`, [currentCellKey]);
      }

      if (!doesTeacherMatchSubject(teacher, subject) && !isSubjectMultiTeacher(subject)) {
        pushConflict(`${section.name} ${slotOrdinalLabel}: ${teacher.name} lacks subject expertise for ${formatSubjectDisplayName(subject)}.`, [currentCellKey]);
      }
    }

    // Subject eligibility check for section (strict grade exclusivity & program exclusivity like SP-STEM, SPA, SPJ)
    const eligibleSubjectsForSection = getSubjectsForSection(section, subjects, scheduleType);
    const isSubjectEligible = eligibleSubjectsForSection.some(
      (s) => s.id === subject.id || (s.subjectCode && subject.subjectCode && s.subjectCode.toUpperCase() === subject.subjectCode.toUpperCase())
    );
    if (!isSubjectEligible) {
      const subjectDesc = formatSubjectDisplayName(subject);
      const sectionDesc = `${section.name} (Grade ${section.grade} ${section.classification || "Regular"})`;
      pushConflict(
        `${sectionDesc} at ${slotOrdinalLabel}: ${subjectDesc} is not eligible for this section.`,
        [currentCellKey]
      );
    }

    // Multiple-booking detection across all assigned teachers (primary and co-teachers)
    if (config.constraints.enforceNoDoubleBooking) {
      allAssignedTeacherIdsInCell.forEach((tId) => {
        const slotMap = teacherSlotAssignments.get(tId);
        const assignmentsInSlot = slotMap ? slotMap.get(slot.id) : [];
        if (assignmentsInSlot && assignmentsInSlot.length > 1) {
          if (assignmentsInSlot[0].cellKey === cellKey) {
            const tObj = teachersById.get(tId);
            const tName = tObj?.name || tId;
            const sectionLabels = assignmentsInSlot.map(({ sectionId }) => {
              const sec = sectionsById.get(sectionId);
              return sec ? formatConflictSectionName(sec) : sectionId;
            });
            const involvedCellKeys = assignmentsInSlot.map(({ cellKey }) => cellKey);
            let conflictType = '';
            if (assignmentsInSlot.length === 2) {
              conflictType = 'double-booked';
            } else if (assignmentsInSlot.length === 3) {
              conflictType = 'triple-booked';
            } else {
              conflictType = 'multiple-booked';
            }
            pushConflict(
              `${tName} is ${conflictType} at ${formatDayPeriodOrdinalLabel(slot)} across sections: ${sectionLabels.join(", ")}.`,
              involvedCellKeys
            );
          }
        }
      });
    }

    // Intra-cell duplicate teacher detection for breakout streams (e.g. same teacher assigned to multiple SPA streams in 1 period)
    if (Array.isArray(assignment.breakoutAssignments) && assignment.breakoutAssignments.length > 1) {
      const seenStreamsByTeacher = new Map();
      assignment.breakoutAssignments.forEach((b) => {
        if (b?.teacherId) {
          if (seenStreamsByTeacher.has(b.teacherId)) {
            const firstStream = seenStreamsByTeacher.get(b.teacherId);
            const tObj = teachersById.get(b.teacherId);
            pushConflict(
              `${section.name} at ${formatDayPeriodOrdinalLabel(slot)}: ${tObj?.name || b.teacherId} is assigned to multiple streams (${firstStream} & ${b.stream}) during the same period.`,
              [currentCellKey]
            );
          } else {
            seenStreamsByTeacher.set(b.teacherId, b.stream);
          }
        }
      });
    }

    // DepEd DO 005, s. 2024: Class adviser's HGP period (1 period/wk) is absorbed in their 5.0h advising credit
    const isTeacherAdviser = Boolean(
      teacher.isClassAdviser ||
      (Array.isArray(teacher.ancillaryAssignments) && teacher.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
    );
    const isAdvisoryHGP = isTeacherAdviser && isHomeroomOrAdvisorySubject(subject);
    if (!isAdvisoryHGP) {
      allAssignedTeacherIdsInCell.forEach((tId) => {
        if (tId) {
          teacherLoadCount.set(tId, (teacherLoadCount.get(tId) || 0) + 1);
        }
      });
    }

    const sectionSubjects = sectionSubjectUsage.get(section.id) || new Map();
    const subjectCells = sectionSubjects.get(subject.id) || [];
    sectionSubjects.set(subject.id, [...subjectCells, currentCellKey]);
    sectionSubjectUsage.set(section.id, sectionSubjects);

    const sectionClassification = sanitizeText(section.classification).toLowerCase();
    const subjectType = sanitizeText(subject.subjectType).toLowerCase();
    const isSpecialSection =
      sectionClassification.includes("special") ||
      sectionClassification.includes("stem") ||
      sectionClassification.includes("spa") ||
      sectionClassification.includes("spj") ||
      sectionClassification.includes("ste");
    const isSpecializedSubject = subjectType === "specialized";

    if (isSpecialSection && isSpecializedSubject) {
      const specializedSubjects = sectionSpecializedSubjectUsage.get(section.id) || new Map();
      const specializedCells = specializedSubjects.get(subject.id) || [];
      specializedSubjects.set(subject.id, [...specializedCells, currentCellKey]);
      sectionSpecializedSubjectUsage.set(section.id, specializedSubjects);
    }
  });

  sectionSubjectUsage.forEach((subjectMap, sectionId) => {
    const section = sectionsById.get(sectionId);
    if (!section) {
      return;
    }

    const sectionLabel = formatConflictSectionName(section);
    const levelConfig = scheduleType === "jhs" ? config?.jhs : config?.shs;
    const activeDays = extractDaysFromLevelConfig(levelConfig)?.daySequence || [];
    const totalDaysCount = activeDays.length || 5;

    subjectMap.forEach((cellKeys, subjectId) => {
      if (!Array.isArray(cellKeys) || cellKeys.length === 0) {
        return;
      }

      const subject = subjectsById.get(subjectId);
      const classesPerWeek = parseBoundedNumber(subject?.classesPerWeek, 1, 12, 4);
      const subjectLabel = subject?.subjectName || subject?.subjectCode || subjectId;

      // Group assigned cell keys by day
      const cellsByDay = new Map();
      cellKeys.forEach((cellKey) => {
        const [, slotId] = splitCellKey(cellKey);
        const slot = slotsById.get(slotId);
        const day = slot?.day || "Monday";
        const existing = cellsByDay.get(day) || [];
        cellsByDay.set(day, [...existing, cellKey]);
      });

      const isDouble = Boolean(subject?.isDoublePeriod);
      const maxAllowedPerDay = isDouble ? 2 : (classesPerWeek > totalDaysCount ? Math.ceil(classesPerWeek / totalDaysCount) : 1);

      // 1. Same-day duplicate check: flag cells if assigned more times than maxAllowedPerDay on the same day
      cellsByDay.forEach((dayCellKeys, day) => {
        if (dayCellKeys.length > maxAllowedPerDay) {
          pushConflict(
            `${subjectLabel} is scheduled ${dayCellKeys.length} times on ${day} for ${sectionLabel} (max ${maxAllowedPerDay} per day).`,
            dayCellKeys
          );
        }
      });

      // 2. Weekly quota check: flag cells if total weekly assignments exceed subject's required classes per week
      if (cellKeys.length > classesPerWeek) {
        pushConflict(
          `${subjectLabel} has ${cellKeys.length} weekly periods assigned for ${sectionLabel}, exceeding required ${classesPerWeek} classes per week.`,
          cellKeys
        );
      }

      const allPlacementRules = getAllPlacementRules(config, scheduleType);
      const pRule = findPlacementRuleForSubject(subject, allPlacementRules);
      const effectiveSubj = pRule ? { ...subject, ...pRule } : (subject || {});

      // 3. Preferred Day Lock check
      if (effectiveSubj?.preferredDay && effectiveSubj.preferredDay !== "any") {
        cellKeys.forEach((cellKey) => {
          const [, slotId] = splitCellKey(cellKey);
          const slot = slotsById.get(slotId);
          if (slot && slot.day !== effectiveSubj.preferredDay) {
            pushConflict(
              `${subjectLabel} is scheduled on ${slot.day} for ${sectionLabel}, but is locked to ${effectiveSubj.preferredDay}.`,
              [cellKey]
            );
          }
        });
      }

      // 4. Preferred Period Slot Lock check
      if (effectiveSubj?.preferredPeriodSlot && effectiveSubj.preferredPeriodSlot !== "any") {
        const prefSlot = String(effectiveSubj.preferredPeriodSlot);
        cellKeys.forEach((cellKey) => {
          const [, slotId] = splitCellKey(cellKey);
          const slot = slotsById.get(slotId);
          if (slot) {
            const pNum = slot.period || extractPeriodNumberFromSlotOrLabel(slot);
            let isMismatch = false;
            let slotDesc = "";

            if (prefSlot.includes("-")) {
              const parts = prefSlot.split("-").map(Number);
              if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                if (pNum < parts[0] || pNum > parts[1]) {
                  isMismatch = true;
                  slotDesc = `${formatPeriodOrdinalLabel({ period: parts[0] })} & ${formatPeriodOrdinalLabel({ period: parts[1] })}`;
                }
              }
            } else if (prefSlot === "first" || prefSlot === "1") {
              if (pNum !== 1) { isMismatch = true; slotDesc = "1st Period"; }
            } else if (prefSlot === "last") {
              const dayMax = getSectionDayMaxPeriod(section, slot.day, scheduleType, config, slot);
              const lastInfo = getDynamicLastPeriodInfo({
                sectionId: section.id,
                day: slot.day,
                assignments,
                slotsById,
                subjectsById,
                placementRules: allPlacementRules,
                excludeCellKey: cellKey,
                dayMaxPeriod: dayMax,
              });
              const combinedLastPeriods = Array.from(new Set([...lastInfo.otherLastPeriods, pNum])).sort((a, b) => a - b);
              const isContiguousAfterNonLast = combinedLastPeriods.every(
                (periodVal, idx) => periodVal === lastInfo.highestNonLast + 1 + idx
              );
              if (pNum > dayMax || pNum <= lastInfo.highestNonLast || !isContiguousAfterNonLast) {
                isMismatch = true;
                if (lastInfo.highestNonLast >= dayMax) {
                  slotDesc = `Last Available Period on ${slot.day} (${slot.day} is full at ${dayMax}/${dayMax} periods)`;
                } else {
                  const targetP = Math.min(dayMax, Math.max(1, lastInfo.expectedPeriod));
                  slotDesc = `Last Available Period (${formatPeriodOrdinalLabel({ period: targetP })} on ${slot.day})`;
                }
              }
            } else if (prefSlot === "morning") {
              const lunchP = config?.constraints?.lunchAfterPeriod || 4;
              if (pNum > lunchP) { isMismatch = true; slotDesc = `Morning Classes (1st Period – ${formatPeriodOrdinalLabel({ period: lunchP })})`; }
            } else if (prefSlot === "afternoon") {
              const lunchP = config?.constraints?.lunchAfterPeriod || 4;
              const maxP = getSectionDayMaxPeriod(section, slot.day, scheduleType, config, slot);
              if (pNum <= lunchP) { isMismatch = true; slotDesc = `Afternoon Classes (${formatPeriodOrdinalLabel({ period: lunchP + 1 })} – ${formatPeriodOrdinalLabel({ period: maxP })})`; }
            } else if (!isNaN(Number(prefSlot))) {
              if (pNum !== Number(prefSlot)) { isMismatch = true; slotDesc = formatPeriodOrdinalLabel({ period: Number(prefSlot) }); }
            }

            if (isMismatch) {
              pushConflict(
                `${subjectLabel} is scheduled on ${formatDayPeriodOrdinalLabel(slot)} for ${sectionLabel}, but is locked to ${slotDesc}.`,
                [cellKey]
              );
            }
          }
        });
      }

      // 5. Double Period Block check
      if (subject?.isDoublePeriod) {
        cellsByDay.forEach((dayCellKeys, day) => {
          if (dayCellKeys.length > 1) {
            const periodNums = dayCellKeys.map((cellKey) => {
              const [, slotId] = splitCellKey(cellKey);
              const slot = slotsById.get(slotId);
              return slot?.period || extractPeriodNumberFromSlotOrLabel(slot);
            }).sort((a, b) => a - b);

            let isConsecutive = false;
            for (let i = 0; i < periodNums.length - 1; i++) {
              if (periodNums[i + 1] - periodNums[i] === 1) {
                isConsecutive = true;
                break;
              }
            }

            if (!isConsecutive) {
              pushConflict(
                `${subjectLabel} requires a Double Period block for ${sectionLabel}, but is scheduled in non-consecutive periods on ${day}.`,
                dayCellKeys
              );
            }
          }
        });
      }
    });
  });

  // 5B. Reserved Locked-Slot Ownership Check:
  // If Subject B is occupying an exact locked slot reserved for Subject A (e.g. Monday 1st Period for HGP),
  // flag Subject B's cell immediately even if Subject B itself has no other restriction.
  const allPlacementRulesForReserved = getAllPlacementRules(config, scheduleType);
  sections.forEach((section) => {
    const sectionLabel = formatConflictSectionName(section);
    const validSlotsForSec = slots.filter((s) => isSlotValidForSection(section, s, scheduleType, config));
    const eligibleSubjectsForSection = getSubjectsForSection(section, subjects, scheduleType);

    eligibleSubjectsForSection.forEach((eligibleSubj) => {
      const exactLockedSlots = getExactLockedSlotsForSubject(eligibleSubj, validSlotsForSec, allPlacementRulesForReserved);
      if (exactLockedSlots.length === 0) return;
      const lockedLabel = eligibleSubj?.subjectName || eligibleSubj?.subjectCode || eligibleSubj.id;

      exactLockedSlots.forEach((lockedSlot) => {
        const ck = createCellKey(section.id, lockedSlot.id);
        const occ = assignments[ck];
        if (!occ || !occ.subjectId || occ.subjectId === eligibleSubj.id) return;

        const occSubj = subjectsById.get(occ.subjectId);
        const bothHgp =
          isHomeroomOrAdvisorySubject(eligibleSubj) &&
          (isHomeroomOrAdvisorySubject(occSubj) ||
            String(occ.subjectId || "") === "universal-hgp" ||
            String(occ.subjectCode || "").trim().toUpperCase() === "HGP");
        if (bothHgp) return;

        const occLabel = occSubj?.subjectName || occSubj?.subjectCode || occ.subjectId;
        const slotText = `${lockedSlot.day} ${formatPeriodOrdinalLabel(lockedSlot)}`;
        pushConflict(
          `${sectionLabel} ${slotText}: ${occLabel} is occupying ${slotText}, which is reserved for ${lockedLabel}.`,
          [ck]
        );
      });
    });
  });

  // 6. Weekly quota under-scheduled check: check ALL sections to ensure all required subjects have their required weekly periods
  sections.forEach((section) => {
    const sectionLabel = formatConflictSectionName(section);
    const subjectMap = sectionSubjectUsage.get(section.id) || new Map();
    const eligibleSubjectsForSection = getSubjectsForSection(section, subjects, scheduleType);
    eligibleSubjectsForSection.forEach((eligibleSubj) => {
      const required = parseBoundedNumber(eligibleSubj?.classesPerWeek, 1, 12, 4);
      const assignedCellKeys = subjectMap.get(eligibleSubj.id) || [];
      const assignedCount = assignedCellKeys.length;
      if (assignedCount < required) {
        const subjectLabel = eligibleSubj?.subjectName || eligibleSubj?.subjectCode || eligibleSubj.id;
        pushConflict(
          `${sectionLabel}: ${subjectLabel} has ${assignedCount} of ${required} required recurring daily period(s) assigned.`
        );
      }
    });
  });

  sectionSpecializedSubjectUsage.forEach((specializedMap, sectionId) => {
    if (specializedMap.size <= 1) {
      return;
    }

    const section = sectionsById.get(sectionId);
    if (!section) {
      return;
    }

    const sectionClassification = sanitizeText(section.classification).toLowerCase();
    // In DepEd curriculum:
    // - SP-STEM sections take multiple STEM specializations (ICT, Dev Reading, Env Science, Elem Algebra)
    // - SPA sections take both TLE and SPA Specialization
    // - SPJ sections take both ICT (SPJ) and Journalism
    // More generally, if all assigned specialized subjects are eligible curriculum subjects for this section, it is valid.
    const isStem = sectionClassification.includes("stem") || sectionClassification.includes("ste");
    if (isStem) {
      return;
    }
    const isSpa = sectionClassification.includes("spa");
    if (isSpa && specializedMap.size <= 2) {
      return;
    }
    const isSpj = sectionClassification.includes("spj");
    if (isSpj && specializedMap.size <= 2) {
      return;
    }

    const eligibleForSec = getSubjectsForSection(section, subjects, scheduleType);
    const eligibleIds = new Set(eligibleForSec.map((s) => s.id));
    const allAreEligibleCurriculum = Array.from(specializedMap.keys()).every((id) => eligibleIds.has(id));
    if (allAreEligibleCurriculum) {
      return;
    }

    const sectionLabel = formatConflictSectionName(section);

    const specializedSubjectLabels = Array.from(specializedMap.keys()).map((subjectId) => {
      const subject = subjectsById.get(subjectId);
      return subject?.subjectName || subject?.subjectCode || subjectId;
    });

    const allSpecializedCellKeys = Array.from(specializedMap.values()).flat();
    pushConflict(
      `${sectionLabel} has more than one specialized subject assigned (${specializedSubjectLabels.join(", ")}).`,
      allSpecializedCellKeys
    );
  });

  const teacherLoadPercent = {};
  teachers.forEach((teacher) => {
    const loadCount = teacherLoadCount.get(teacher.id) || 0;
    const isAdviser = Boolean(
      teacher.isClassAdviser ||
      (Array.isArray(teacher.ancillaryAssignments) && teacher.ancillaryAssignments.some((a) => String(a).toLowerCase().includes("adviser")))
    );
    const isPartTime = Boolean(
      (teacher.workingArrangement && String(teacher.workingArrangement).toLowerCase().includes("part")) ||
      (teacher.employmentStatus && String(teacher.employmentStatus).toLowerCase().includes("part"))
    );
    // DepEd DO 005, s. 2024: Statutory max contact teaching is ~20-25 periods/week (4-5 classes/day)
    const maxCap = Number(config?.constraints?.maxTeachingLoadCap) || MAX_TEACHER_LOAD_BASE;
    let baseCap = isAdviser ? Math.max(16, maxCap - 4) : maxCap;
    if (isPartTime) {
      baseCap = Math.max(8, Math.round(baseCap * 0.5));
    }
    teacherLoadPercent[teacher.id] = Math.round((loadCount / (baseCap || 1)) * 100);
  });

  return {
    conflicts,
    conflictDetails,
    teacherLoadPercent,
  };
}

function mergeConflictDetails(baseDetails, evaluationDetails) {
  const merged = new Map();

  [...(Array.isArray(baseDetails) ? baseDetails : []), ...(Array.isArray(evaluationDetails) ? evaluationDetails : [])].forEach((entry) => {
    const message = sanitizeText(entry?.message);
    if (!message) {
      return;
    }

    const cellKeys = normalizeStringArray(entry?.cellKeys);
    const key = `${message}::${[...cellKeys].sort().join("|")}`;
    if (!merged.has(key)) {
      merged.set(key, { message, cellKeys });
    }
  });

  return Array.from(merged.values());
}

function getSubjectsForSection(section, subjects, scheduleType) {
  if (!section || !Array.isArray(subjects)) {
    return [];
  }

  if (scheduleType === "jhs") {
    const sectionGrade = parseGrade(section.grade);
    const rawClassification = String(section.classification || "").trim();

    let classification = "Regular";
    const lowerClass = rawClassification.toLowerCase();
    if (lowerClass.includes("spa")) {
      classification = "SPA";
    } else if (lowerClass.includes("spj")) {
      classification = "SPJ";
    } else if (lowerClass.includes("stem") || lowerClass.includes("ste") || lowerClass.includes("special science")) {
      classification = "SP-STEM";
    } else if (lowerClass.includes("regular")) {
      classification = "Regular";
    }

    const jhsSubjects = subjects.filter((s) => s.schoolLevel === "jhs");

    const matched = jhsSubjects.filter((subject) => {
      const name = String(subject.subjectName || "").trim();
      const code = String(subject.subjectCode || "").trim().toUpperCase();
      const scope = String(subject.programScope || "").trim();
      const lowerScope = scope.toLowerCase();
      const type = String(subject.subjectType || "").trim().toLowerCase();
      const subjectGradeStr = String(subject.gradeLevel || "").trim();

      // STRICT GRADE EXCLUSIVITY:
      // If a subject is strictly exclusive to a grade level (e.g., Grade 7 exclusive subjects like DEVREAD, ELEMALG, ENVSCI, or subjects with explicit grade), it MUST match sectionGrade!
      if (!doesJhsSubjectMatchGrade(subject, sectionGrade)) {
        return false;
      }

      // Check for SP-STEM enhanced / specialized subjects
      const isEnhancedStem =
        code === "DEVREAD" || name.toLowerCase().includes("developmental reading") ||
        code === "ELEMALG" || name.toLowerCase().includes("elementary algebra") ||
        code === "ENVSCI" || name.toLowerCase().includes("environmental science") ||
        code.includes("RESEARCH") || name.toLowerCase().includes("research") ||
        code.includes("BIOTECH") || name.toLowerCase().includes("biotechnology") ||
        lowerScope.includes("stem") || lowerScope.includes("ste");

      if (isEnhancedStem) {
        // EXCLUSIVELY for SP-STEM sections ONLY
        if (classification !== "SP-STEM") {
          return false;
        }
        if (!doesJhsSubjectMatchGrade(subject, sectionGrade)) {
          return false;
        }
        return true;
      }

      // 1. HGP (Homeroom Guidance Program): ALL sections
      if (code === "HGP" || name.toUpperCase() === "HGP" || name.toLowerCase().includes("homeroom guidance")) {
        return true;
      }

      // 2. Aral Program: Regular sections (or targeted intervention sections if configured as Intervention scope)
      if (code === "ARAL" || name.toLowerCase().includes("aral program")) {
        if (lowerScope.includes("intervention")) {
          return Boolean(section.isInterventionSection || section.needsRemediation);
        }
        return classification === "Regular";
      }

      // 3. TLE: Regular and SPA sections ONLY (No TLE subject for SPJ and SP-STEM)
      if (code === "TLE" || name.toUpperCase().includes("TLE") || name.toLowerCase().includes("technology and livelihood")) {
        return classification === "Regular" || classification === "SPA";
      }

      // 4. SPA Specialization: SPA sections ONLY
      if (code === "SPASPEC" || name.toLowerCase().includes("spa specialization") || lowerScope.includes("spa")) {
        return classification === "SPA";
      }

      // 5. ICT: SPJ and SP-STEM sections ONLY (differentiated: 4x for SPJ, 3x for SP-STEM)
      if (code.startsWith("ICT") || name.toUpperCase().includes("ICT")) {
        const isSpjOnly = lowerScope.includes("spj") && !lowerScope.includes("stem");
        const isStemOnly = (lowerScope.includes("stem") || lowerScope.includes("ste")) && !lowerScope.includes("spj");
        if (isSpjOnly) return classification === "SPJ";
        if (isStemOnly) return classification === "SP-STEM";
        return classification === "SPJ" || classification === "SP-STEM";
      }

      // 6. Core Subjects (Mathematics, Science, Filipino, English, Values Education, Araling Panlipunan, MAPEH)
      const isCoreSubjectName = [
        "MATHEMATICS", "SCIENCE", "FILIPINO", "ENGLISH",
        "VALUES EDUCATION", "ARALING PANLIPUNAN", "MAPEH", "ESP", "EDUKASYON SA PAGPAPAKAKATAO"
      ].some((cName) => name.toUpperCase().includes(cName) || code.includes(cName));

      if (isCoreSubjectName) {
        return true;
      }

      // Direct Section-Specific Match:
      // If a subject is explicitly assigned to this section by ID, section name, or program scope:
      const sectionNameLower = String(section.name || "").trim().toLowerCase();
      const isExplicitForThisSection =
        (subject.sectionId && String(subject.sectionId) === String(section.id)) ||
        (subject.sectionName && String(subject.sectionName).trim().toLowerCase() === sectionNameLower) ||
        (subject.exclusiveToSection && String(subject.exclusiveToSection).trim().toLowerCase() === sectionNameLower) ||
        (lowerScope && (lowerScope === sectionNameLower || lowerScope === String(section.id).toLowerCase())) ||
        (Array.isArray(subject.applicableSections) && (
          subject.applicableSections.includes(section.id) ||
          subject.applicableSections.map((s) => String(s).toLowerCase()).includes(sectionNameLower)
        ));

      if (isExplicitForThisSection) {
        return true;
      }

      // Fallback matching based on programScope / subjectType for custom subjects
      if (type === "core" || lowerScope === "universal" || lowerScope === "all") {
        return true;
      }
      if (lowerScope.includes("regular") && classification === "Regular") {
        return true;
      }
      if (lowerScope.includes("spa") && classification === "SPA") {
        return true;
      }
      if (lowerScope.includes("spj") && classification === "SPJ") {
        return true;
      }
      if ((lowerScope.includes("stem") || lowerScope.includes("ste")) && classification === "SP-STEM") {
        return true;
      }

      return false;
    });

    return sortSubjectsByTypeAndName(matched);
  }

  const isTrimester = scheduleType.startsWith("shs-term");
  let targetTerm = "";
  if (scheduleType === "shs-term1") targetTerm = "term 1";
  else if (scheduleType === "shs-term2") targetTerm = "term 2";
  else if (scheduleType === "shs-term3") targetTerm = "term 3";
  else if (scheduleType === "shs-first") targetTerm = "first semester";
  else targetTerm = "last semester";

  const filtered = subjects.filter((subject) => {
    if (subject.schoolLevel !== "shs") {
      return false;
    }

    const subjectSemester = String(subject.semester || "").toLowerCase();
    const isYearRound = subjectSemester.includes("all") || subjectSemester.includes("3 term") || subjectSemester.includes("year");

    let isTermMatch = false;
    if (isYearRound) {
      isTermMatch = true;
    } else if (isTrimester) {
      isTermMatch = subjectSemester.includes(targetTerm);
    } else {
      isTermMatch = subjectSemester.includes(targetTerm) || (targetTerm === "last semester" && (subjectSemester.includes("second") || subjectSemester.includes("2")));
    }

    if (!isTermMatch) {
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

    const strand = String(subject.strand || "").toUpperCase().trim();
    const secTrack = String(section.track || "").toUpperCase().trim();
    const secCluster = String(section.cluster || "").toUpperCase().trim();
    const isStrandMatch = !strand || (
      strand === secTrack ||
      secCluster.includes(strand) ||
      strand.includes(secCluster.split(" ")[0]) ||
      secTrack.includes(strand) ||
      (secTrack === "TECHPRO" && (strand.includes("TECHPRO") || strand.includes("TVL"))) ||
      (secTrack === "ACADEMIC" && !strand.includes("TECHPRO") && !strand.includes("TVL"))
    );

    const sectionNameLower = String(section.name || "").trim().toLowerCase();
    const isExplicitForThisSection =
      (subject.sectionId && String(subject.sectionId) === String(section.id)) ||
      (subject.sectionName && String(subject.sectionName).trim().toLowerCase() === sectionNameLower) ||
      (subject.exclusiveToSection && String(subject.exclusiveToSection).trim().toLowerCase() === sectionNameLower);

    return isStrandMatch || isExplicitForThisSection;
  });

  return sortSubjectsByTypeAndName(filtered);
}

function calculateGeneratorPeriodsForSection(section, subjects, scheduleType) {
  // Calculate total periods needed for a section based on subject requirements
  if (!section) {
    return 0;
  }

  const eligibleSubjects = getSubjectsForSection(section, subjects, scheduleType);
  const totalPeriods = eligibleSubjects.reduce((sum, subject) => {
    const classesPerWeek = parseBoundedNumber(subject?.classesPerWeek, 1, 12, 0);
    if (classesPerWeek > 0) {
      return sum + classesPerWeek;
    }

    const hoursPerWeek = parseBoundedDecimal(subject?.hoursPerWeek, 1, 12, 1);
    return sum + Math.max(1, Math.round(hoursPerWeek));
  }, 0);

  return Math.max(1, totalPeriods);
}

function calculateMaxGeneratorPeriodsForSections(sections, subjects, scheduleType) {
  // Calculate maximum periods needed across all visible sections
  if (!Array.isArray(sections) || sections.length === 0) {
    return 0;
  }

  return Math.max(...sections.map((section) => calculateGeneratorPeriodsForSection(section, subjects, scheduleType)));
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

function getGeneratorPeriodMinutes(subjects, scheduleType, fallbackMinutes) {
  if (scheduleType !== "jhs") {
    return parseBoundedNumber(fallbackMinutes, 30, 120, 50);
  }

  const counts = new Map();
  (Array.isArray(subjects) ? subjects : [])
    .filter((subject) => subject?.schoolLevel === "jhs")
    .forEach((subject) => {
      const dailyMinutes = parseBoundedNumber(subject?.dailyMinutes, 1, 480, 0);
      if (dailyMinutes > 0) {
        counts.set(dailyMinutes, (counts.get(dailyMinutes) || 0) + 1);
      }
    });

  if (counts.size === 0) {
    return parseBoundedNumber(fallbackMinutes, 30, 120, 50);
  }

  let selectedMinutes = parseBoundedNumber(fallbackMinutes, 30, 120, 50);
  let selectedCount = -1;

  counts.forEach((count, minutes) => {
    if (count > selectedCount || (count === selectedCount && minutes > selectedMinutes)) {
      selectedMinutes = minutes;
      selectedCount = count;
    }
  });

  return parseBoundedNumber(selectedMinutes, 30, 120, 50);
}

function extractDaysFromLevelConfig(levelConfig) {
  if (!levelConfig) {
    return {
      regularDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      shortenedDays: [],
      daySequence: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    };
  }

  if (levelConfig.dayAssignments && typeof levelConfig.dayAssignments === "object") {
    const regularDays = [];
    const shortenedDays = [];
    DAYS.forEach((day) => {
      const assignment = levelConfig.dayAssignments[day];
      if (assignment === "regular") regularDays.push(day);
      else if (assignment === "shortened") shortenedDays.push(day);
    });
    const daySequence = DAYS.filter((day) => regularDays.includes(day) || shortenedDays.includes(day));
    if (daySequence.length > 0) {
      return { regularDays, shortenedDays, daySequence };
    }
  }

  const regularDays = normalizeDays(levelConfig.regularDays);
  const shortenedDays = normalizeDays(levelConfig.shortenedDays);
  const daySequence = DAYS.filter((day) => regularDays.includes(day) || shortenedDays.includes(day));
  return {
    regularDays: regularDays.length ? regularDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    shortenedDays,
    daySequence: daySequence.length ? daySequence : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  };
}

function buildSlots(scheduleType, config, options = {}) {
  const levelConfig = scheduleType === "jhs" ? config.jhs : config.shs;
  const { regularDays, shortenedDays, daySequence } = extractDaysFromLevelConfig(levelConfig);

  if (scheduleType === "jhs") {
    const regularPeriodMinutes = options.deriveJhsPeriods
      ? getGeneratorPeriodMinutes(options.subjects, scheduleType, levelConfig?.periodMinutes?.regular || 50)
      : (levelConfig?.periodMinutes?.regular || 50);
    const shortenedPeriodMinutes = options.deriveJhsPeriods
      ? getGeneratorPeriodMinutes(options.subjects, scheduleType, levelConfig?.periodMinutes?.shortened || 45)
      : (levelConfig?.periodMinutes?.shortened || 45);

    const isAutomated = (levelConfig?.periodStructureMode || levelConfig?.periodCalculationMode || "automated") === "automated";
    const maxPeriods = !isAutomated
      ? Math.max(
          Number(levelConfig?.sessions?.regular?.manualPeriodCount || levelConfig?.periods?.regular || levelConfig?.manualPeriodCount || 8),
          Number(levelConfig?.sessions?.shortened?.manualPeriodCount || levelConfig?.periods?.shortened || levelConfig?.periods?.special || levelConfig?.manualPeriodCount || 6),
          1
        )
      : Math.max(
          getDerivedJhsPeriodCount(levelConfig, "regular", regularPeriodMinutes, options.subjects),
          getDerivedJhsPeriodCount(levelConfig, "shortened", shortenedPeriodMinutes, options.subjects),
          1
        );
    const result = [];
    const baseCursor = parseTimeToMinutes(levelConfig.schoolStartTime || "07:30");

    if (options.deriveJhsPeriods) {
      const days = daySequence.length ? daySequence : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

      days.forEach((day) => {
        const isShortenedDay = shortenedDays.includes(day);
        const periodMinutes = isShortenedDay ? shortenedPeriodMinutes : regularPeriodMinutes;
        let dayCursor = baseCursor;

        for (let period = 1; period <= maxPeriods; period += 1) {
          const start = minutesToTime(dayCursor);
          const endMinutes = dayCursor + periodMinutes;
          const end = minutesToTime(endMinutes);

          result.push({
            id: `${day}-P${period}`,
            label: `${day} P${period}`,
            day,
            period,
            start,
            end,
            sessionType: isShortenedDay ? "shortened" : "regular",
          });

          dayCursor = endMinutes;

          getEnabledBreaks(levelConfig.breaks).forEach((entry) => {
            if (entry.afterPeriod === period) {
              dayCursor += entry.duration;
            }
          });
        }
      });

      return result;
    }

    for (let period = 1; period <= maxPeriods; period += 1) {
      const start = minutesToTime(baseCursor);
      const endMinutes = baseCursor + levelConfig.periodMinutes.regular;
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

      baseCursor = endMinutes;

      getEnabledBreaks(levelConfig.breaks).forEach((entry) => {
        if (entry.afterPeriod === period) {
          baseCursor += entry.duration;
        }
      });
    }

    return result;
  }

  const isShsAutomated = (levelConfig?.periodStructureMode || levelConfig?.periodCalculationMode || "automated") === "automated";
  const shsMaxPeriods = !isShsAutomated
    ? Math.max(Number(levelConfig?.sessions?.regular?.manualPeriodCount || levelConfig?.periods?.regular || levelConfig?.periods?.default || 8), 1)
    : (scheduleType === "jhs"
      ? Math.max(levelConfig.periods.regular, levelConfig.periods.special)
      : Math.max(levelConfig.periods.default, ...Object.values(levelConfig.periods.track || {})));

  const result = [];

  daySequence.forEach((day) => {
    const sessionType = shortenedDays.includes(day) ? "shortened" : "regular";
    const periodMinutes = sessionType === "shortened" ? levelConfig.periodMinutes.shortened : levelConfig.periodMinutes.regular;
    let cursor = parseTimeToMinutes("07:30");

    for (let period = 1; period <= shsMaxPeriods; period += 1) {
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

function getSectionDayMaxPeriod(section, day, scheduleType, config, slot = null) {
  if (scheduleType === "jhs") {
    const isSpecial = String(section?.classification || "").toLowerCase() === "special";
    const levelCfg = config?.jhs;
    const targetDay = day || slot?.day;
    const isShortenedSlot =
      slot?.sessionType === "shortened" ||
      (Array.isArray(levelCfg?.shortenedDays) && targetDay && levelCfg.shortenedDays.includes(targetDay)) ||
      (targetDay && levelCfg?.dayAssignments?.[targetDay] === "shortened");

    const regularMax = Number(
      levelCfg?.sessions?.regular?.manualPeriodCount ??
      levelCfg?.sessions?.regular?.periodCount ??
      (typeof levelCfg?.periods === "number" ? levelCfg.periods : levelCfg?.periods?.regular) ??
      levelCfg?.manualPeriodCount ??
      8
    );

    const shortenedMax = Number(
      levelCfg?.sessions?.shortened?.manualPeriodCount ??
      levelCfg?.sessions?.shortened?.periodCount ??
      (typeof levelCfg?.periods === "object" ? (levelCfg?.periods?.shortened ?? levelCfg?.periods?.special) : undefined) ??
      (typeof levelCfg?.periods === "number" ? levelCfg.periods : undefined) ??
      levelCfg?.manualPeriodCount ??
      6
    );

    const configuredMax = isShortenedSlot
      ? shortenedMax
      : isSpecial
        ? Number(levelCfg?.periods?.special || regularMax)
        : regularMax;

    return Math.min(Math.max(1, configuredMax || 8), 10);
  }

  const trackPeriods = config?.shs?.periods?.track?.[String(section?.track || "").toUpperCase()];
  const configuredMax = Number.isFinite(trackPeriods)
    ? trackPeriods
    : Number(
        config?.shs?.sessions?.regular?.manualPeriodCount ??
        config?.shs?.periods?.default ??
        (typeof config?.shs?.periods === "number" ? config.shs.periods : config.shs?.periods?.regular) ??
        8
      );
  return Math.min(Math.max(1, configuredMax || 8), 10);
}

function isSlotValidForSection(section, slot, scheduleType, config) {
  if (!section || !slot) {
    return false;
  }

  const maxPeriod = getSectionDayMaxPeriod(section, slot.day, scheduleType, config, slot);
  return slot.period <= maxPeriod;
}

function hasWholeWordToken(haystack, needle) {
  const text = sanitizeText(haystack).toLowerCase();
  const token = sanitizeText(needle).toLowerCase();
  if (!text || !token) return false;
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

function isDynamicLastPeriodSubject(subject, placementRules = []) {
  if (!subject) return false;
  const rule = Array.isArray(placementRules) && placementRules.length > 0
    ? findPlacementRuleForSubject(subject, placementRules)
    : null;
  const effective = rule ? { ...subject, ...rule } : subject;
  return String(effective?.preferredPeriodSlot || "").trim().toLowerCase() === "last";
}

function isPlacementLockedSubject(subject, placementRules = []) {
  if (!subject) return false;
  const rule = Array.isArray(placementRules) && placementRules.length > 0
    ? findPlacementRuleForSubject(subject, placementRules)
    : null;
  const effective = rule ? { ...subject, ...rule } : subject;
  const hasDay = Boolean(effective?.preferredDay && effective.preferredDay !== "any");
  const hasSlot = Boolean(effective?.preferredPeriodSlot && effective.preferredPeriodSlot !== "any");
  const hasSpecific = Array.isArray(effective?.specificPeriods) && effective.specificPeriods.length > 0;
  return Boolean(rule || hasDay || hasSlot || hasSpecific);
}

function getDynamicLastPeriodInfo({
  sectionId,
  day,
  assignments,
  slotsById,
  subjectsById,
  placementRules = [],
  excludeCellKey = null,
  excludeSubjectId = null,
  dayMaxPeriod = 8,
}) {
  const nonLastPeriods = [];
  const otherLastPeriods = [];

  Object.entries(assignments || {}).forEach(([cellKey, asgn]) => {
    if (excludeCellKey && cellKey === excludeCellKey) return;
    if (!asgn || !asgn.subjectId) return;
    const [secId, slotId] = splitCellKey(cellKey);
    if (secId !== sectionId) return;
    const slotObj = slotsById?.get ? slotsById.get(slotId) : null;
    if (!slotObj || slotObj.day !== day) return;
    const pNum = Number(slotObj.period || extractPeriodNumberFromSlotOrLabel(slotObj) || 0);
    if (!pNum) return;

    const subj = subjectsById?.get ? subjectsById.get(asgn.subjectId) : null;
    if (isDynamicLastPeriodSubject(subj, placementRules)) {
      if (!excludeSubjectId || asgn.subjectId !== excludeSubjectId) {
        otherLastPeriods.push(pNum);
      }
    } else {
      nonLastPeriods.push(pNum);
    }
  });

  const highestNonLast = nonLastPeriods.length > 0 ? Math.max(...nonLastPeriods) : 0;
  const highestLast = otherLastPeriods.length > 0 ? Math.max(...otherLastPeriods) : 0;
  const highestOccupied = Math.max(highestNonLast, highestLast);
  const otherLastSet = new Set(otherLastPeriods);
  let expectedPeriod = highestNonLast + 1;
  while (otherLastSet.has(expectedPeriod) && expectedPeriod <= dayMaxPeriod) {
    expectedPeriod += 1;
  }

  return {
    highestNonLast,
    highestOccupied,
    expectedPeriod,
    dayMaxPeriod,
    isDayFull: expectedPeriod > dayMaxPeriod,
    nonLastPeriods,
    otherLastPeriods,
  };
}

function isTeacherEligible({
  teacher,
  subject,
  section,
  slot,
  constraints,
  teacherBusyBySlot,
  excludedSectionId,
  ignoreDoubleBooking = false,
}) {
  if (!teacher || !subject || !section || !slot) {
    return false;
  }

  if (teacher.active === false) {
    return false;
  }

  const effectiveConstraints = constraints || {};

  if (effectiveConstraints.enforceExpertiseAndGradeMatch) {
    if (!doesTeacherMatchGrade(teacher, section.grade)) {
      return false;
    }

    if (!doesTeacherMatchSubject(teacher, subject)) {
      return false;
    }
  }

  if (effectiveConstraints.enforceUnavailablePeriods) {
    const unavailable = matchesUnavailablePeriod(slot, teacher.unavailablePeriods);
    if (unavailable) {
      return false;
    }
  }

  const teacherRestrictedPeriods = getTeacherRestrictedPeriods(teacher.id, effectiveConstraints, teacher);
  if (matchesRestrictedPeriod(slot, teacherRestrictedPeriods)) {
    return false;
  }

  const subjectRestrictedPeriods = getSubjectRestrictedPeriods(subject.id, effectiveConstraints);
  if (matchesRestrictedPeriod(slot, subjectRestrictedPeriods)) {
    return false;
  }

  if (effectiveConstraints.enforceNoDoubleBooking && !ignoreDoubleBooking) {
    const teacherBusySlots = teacherBusyBySlot?.get(teacher.id);
    if (teacherBusySlots && teacherBusySlots.has(slot.id)) {
      const existingSectionId = teacherBusySlots.get(slot.id);
      if (existingSectionId && existingSectionId !== excludedSectionId) {
        return false;
      }
    }
  }

  return true;
}

function extractPeriodNumberFromSlotOrLabel(slotOrValue) {
  if (typeof slotOrValue === "number" && Number.isFinite(slotOrValue)) {
    return slotOrValue;
  }
  if (!slotOrValue) return 0;
  const raw = typeof slotOrValue === "object"
    ? String(slotOrValue?.period ?? slotOrValue?.label ?? slotOrValue?.id ?? "")
    : String(slotOrValue);
  const digits = raw.replace(/\D/g, "");
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTeacherRestrictedPeriods(teacherId, constraints, teacher = null) {
  const restrictions = Array.isArray(constraints?.teacherRestrictions) ? constraints.teacherRestrictions : [];
  const matched = restrictions.find((entry) => entry.teacherId === teacherId);
  const configPeriods = matched ? normalizeStringArray(matched.periodLabels) : [];
  const teacherUnavailable = teacher ? normalizeStringArray(teacher.unavailablePeriods) : [];
  return Array.from(new Set([...configPeriods, ...teacherUnavailable]));
}

function matchesRestrictedPeriod(slot, restrictedPeriods) {
  const restrictions = normalizeStringArray(restrictedPeriods).map((entry) => sanitizeText(entry).toLowerCase());
  if (!restrictions.length) {
    return false;
  }

  const slotPeriodNum = extractPeriodNumberFromSlotOrLabel(slot);
  const slotLabel = sanitizeText(slot?.label).toLowerCase();
  const slotId = sanitizeText(slot?.id).toLowerCase();

  return restrictions.some((entry) => {
    if (entry === slotLabel || entry === slotId) {
      return true;
    }
    const entryNum = extractPeriodNumberFromSlotOrLabel(entry);
    if (entryNum > 0 && slotPeriodNum > 0 && entryNum === slotPeriodNum) {
      return true;
    }
    return false;
  });
}

function matchesUnavailablePeriod(slot, unavailablePeriods) {
  return matchesRestrictedPeriod(slot, unavailablePeriods);
}

function buildJhsPeriodTimingMap(jhsConfig, sessionType, options = {}) {
  const isShortened = sessionType === "shortened";
  const configuredPeriodCount = isShortened
    ? (jhsConfig?.sessions?.shortened?.manualPeriodCount || jhsConfig?.periods?.shortened || jhsConfig?.periods?.special || 6)
    : (jhsConfig?.sessions?.regular?.manualPeriodCount || jhsConfig?.periods?.regular || 8);

  const derivedFromTime = getDerivedJhsPeriodCount(
    jhsConfig,
    sessionType,
    options.periodMinutes,
    options.subjects,
    options.scheduleType
  );
  const isAutomated = jhsConfig?.periodStructureMode === "automated" || jhsConfig?.periodCalculationMode === "automated";
  const maxPeriods = isAutomated
    ? Math.max(derivedFromTime, options.sectionMaxPeriods || 0, 1)
    : configuredPeriodCount;
  const periodMinutes = parseBoundedNumber(
    options.periodMinutes ?? (isShortened ? (jhsConfig?.periodMinutes?.shortened || jhsConfig?.sessions?.shortened?.duration) : (jhsConfig?.periodMinutes?.regular || jhsConfig?.sessions?.regular?.duration)),
    30,
    120,
    50
  );
  const timingMap = new Map();
  let cursor = parseTimeToMinutes(jhsConfig?.schoolStartTime || "07:30");

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

function buildGeneratorPeriodTimingMap(jhsConfig, totalPeriods, sessionType) {
  // Build period timing map for schedule generator (subject-driven periods)
  // totalPeriods: total number of periods needed, calculated from subject requirements
  // JHS config controls: start time, end time, period duration, breaks, flag ceremony timing
  if (!Number.isFinite(totalPeriods) || totalPeriods <= 0) {
    return new Map();
  }

  const periodMinutes = sessionType === "shortened" ? jhsConfig?.periodMinutes?.shortened : jhsConfig?.periodMinutes?.regular;
  const timingMap = new Map();
  let cursor = parseTimeToMinutes(jhsConfig?.schoolStartTime || "07:30");

  for (let period = 1; period <= totalPeriods; period += 1) {
    const start = minutesToTime(cursor);
    const endMinutes = cursor + parseBoundedNumber(periodMinutes, 30, 90, 50);
    const end = minutesToTime(endMinutes);

    timingMap.set(period, { start, end });
    cursor = endMinutes;

    // Insert breaks after periods as configured
    getEnabledBreaks(jhsConfig?.breaks).forEach((entry) => {
      if (entry.afterPeriod === period) {
        cursor += entry.duration;
      }
    });
  }

  return timingMap;
}

function getDerivedJhsPeriodCount(jhsConfig, sessionType, periodMinutesOverride, subjects = [], scheduleType = "jhs") {
  const isManual =
    jhsConfig?.periodCalculationMode === "manual" ||
    jhsConfig?.periodStructureMode === "configured" ||
    jhsConfig?.periodStructureMode === "manual";
  if (isManual) {
    const sessionConfig = sessionType === "shortened"
      ? (jhsConfig?.sessions?.shortened || {})
      : (jhsConfig?.sessions?.regular || {});
    const manualCount = Number(
      sessionConfig.manualPeriodCount ??
      (sessionType === "shortened" ? (jhsConfig?.periods?.shortened ?? jhsConfig?.periods?.special) : jhsConfig?.periods?.regular) ??
      jhsConfig?.manualPeriodCount ??
      8
    );
    return Math.max(1, Math.min(10, manualCount));
  }

  // If curriculum subjects are provided, calculate automated period count dynamically based on required weekly periods
  if (Array.isArray(subjects) && subjects.length > 0) {
    const matchedSubjects = subjects.filter((s) => !s.schoolLevel || s.schoolLevel === scheduleType);
    const targetSubjects = matchedSubjects.length > 0 ? matchedSubjects : subjects;
    const totalWeeklySlots = targetSubjects.reduce(
      (sum, sub) => sum + parseBoundedNumber(sub?.classesPerWeek || sub?.weeklyPeriods || 1, 1, 12, 1),
      0
    );
    const dayAssignments = jhsConfig?.dayAssignments || {};
    const activeDaysFromAssignments = Object.values(dayAssignments).filter((v) => v !== "off").length;
    const activeDaysFromLists = (normalizeDays(jhsConfig?.regularDays).length + normalizeDays(jhsConfig?.shortenedDays).length);
    const activeDaysCount = Math.max(1, activeDaysFromAssignments || activeDaysFromLists || 5);
    const curriculumPeriodsPerDay = Math.max(1, Math.ceil(totalWeeklySlots / activeDaysCount));
    return Math.min(curriculumPeriodsPerDay, 10);
  }

  const startMinutes = parseTimeToMinutes(jhsConfig?.schoolStartTime || "07:30");
  const endMinutes = parseTimeToMinutes(jhsConfig?.schoolEndTime || "17:00");
  const schoolMinutes = Math.max(0, endMinutes - startMinutes);
  const periodMinutes = parseBoundedNumber(
    periodMinutesOverride ?? (sessionType === "shortened" ? jhsConfig?.periodMinutes?.shortened : jhsConfig?.periodMinutes?.regular),
    30,
    120,
    50
  );
  const breakMinutes = getEnabledBreaks(jhsConfig?.breaks).reduce((total, entry) => total + parseBoundedNumber(entry?.duration, 5, 120, 0), 0);
  const flagMinutes = parseBoundedNumber(jhsConfig?.flagCeremonyMinutes, 0, 120, 0);
  const zoneImprovementMinutes = parseBoundedNumber(jhsConfig?.zoneImprovementMinutes, 0, 240, 0);
  const usableMinutes = Math.max(0, schoolMinutes - breakMinutes - flagMinutes - zoneImprovementMinutes);

  if (!Number.isFinite(periodMinutes) || periodMinutes <= 0) {
    return 8;
  }

  return Math.max(1, Math.min(12, Math.floor(usableMinutes / periodMinutes) || 7));
}

function getSubjectRestrictedPeriods(subjectId, constraints) {
  const restrictions = Array.isArray(constraints?.subjectRestrictions) ? constraints.subjectRestrictions : [];
  const matched = restrictions.find((entry) => entry.subjectId === subjectId);
  return matched ? normalizeStringArray(matched.periodLabels) : [];
}

export function getAllPlacementRules(config = null, scheduleType = "jhs") {
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
      const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
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
  } catch (e) {
    // fallback
  }

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

export function findPlacementRuleForSubject(subject, placementRules) {
  if (!subject || !Array.isArray(placementRules) || placementRules.length === 0) {
    return null;
  }

  const subjIdStr = subject.id != null ? String(subject.id).trim().toLowerCase() : "";
  const subjCodeLower = subject.subjectCode ? sanitizeText(subject.subjectCode).trim().toLowerCase() : "";
  const subjNameLower = subject.subjectName ? sanitizeText(subject.subjectName).trim().toLowerCase() : "";

  return (
    placementRules.find((r) => {
      if (!r) return false;

      // 1. Direct ID match
      const rIdStr = r.subjectId != null ? String(r.subjectId).trim().toLowerCase() : "";
      if (subjIdStr && rIdStr && subjIdStr === rIdStr) return true;

      // 2. Subject Code match (exact only to prevent prefix collisions like AP vs AP1 or ARAL vs AP)
      const rCode = sanitizeText(r.subjectCode).trim().toLowerCase();
      if (subjCodeLower && rCode) {
        if (subjCodeLower === rCode) return true;
      }

      // 3. Subject Name match (exact or whole-word token match)
      const rName = sanitizeText(r.subjectName).trim().toLowerCase();
      if (subjNameLower && rName) {
        if (subjNameLower === rName) return true;
        if (rName.length >= 4 && hasWholeWordToken(subjNameLower, rName)) return true;
        if (subjNameLower.length >= 4 && hasWholeWordToken(rName, subjNameLower)) return true;
      }

      // 4. Cross match using word boundaries (e.g. ARAL must never match Araling Panlipunan)
      if (rCode && rCode.length >= 3 && subjNameLower && (subjNameLower === rCode || hasWholeWordToken(subjNameLower, rCode))) return true;
      if (subjCodeLower && subjCodeLower.length >= 3 && rName && (rName === subjCodeLower || hasWholeWordToken(rName, subjCodeLower))) return true;

      return false;
    }) || null
  );
}

export function getExactLockedSlotsForSubject(subject, validSlots = [], allPlacementRules = []) {
  if (!subject || !Array.isArray(validSlots) || validSlots.length === 0) {
    return [];
  }

  const pRule = findPlacementRuleForSubject(subject, allPlacementRules);
  const effectiveSubject = pRule ? { ...subject, ...pRule } : subject;
  const prefDay = sanitizeText(effectiveSubject.preferredDay);
  if (!prefDay || prefDay.toLowerCase() === "any") {
    return [];
  }

  const targetPeriods = new Set();
  const prefSlot = sanitizeText(effectiveSubject.preferredPeriodSlot);
  if (prefSlot && prefSlot.toLowerCase() !== "any") {
    if (prefSlot === "first" || prefSlot === "1") {
      targetPeriods.add(1);
    } else if (!prefSlot.includes("-") && !Number.isNaN(Number(prefSlot))) {
      targetPeriods.add(Number(prefSlot));
    }
  }

  if (Array.isArray(effectiveSubject.specificPeriods) && effectiveSubject.specificPeriods.length > 0) {
    effectiveSubject.specificPeriods.forEach((p) => {
      const parsed = Number(p);
      if (Number.isFinite(parsed) && parsed > 0) {
        targetPeriods.add(parsed);
      }
    });
  }

  if (targetPeriods.size === 0) {
    return [];
  }

  return validSlots.filter((slot) => {
    if (!slot || sanitizeText(slot.day) !== prefDay) return false;
    const pNum = Number(slot.period || extractPeriodNumberFromSlotOrLabel(slot) || 0);
    return targetPeriods.has(pNum);
  });
}

function isSubjectRestrictedForSlot(subject, slot, constraints, extraConfig = null, scheduleType = "jhs", slotContext = null) {
  if (!subject || !slot) {
    return false;
  }

  const placementRules = getAllPlacementRules(extraConfig || { constraints }, scheduleType);
  const rule = findPlacementRuleForSubject(subject, placementRules);
  const effectiveSubject = rule ? { ...subject, ...rule } : subject;

  // Check Preferred Day restriction
  if (effectiveSubject.preferredDay && effectiveSubject.preferredDay !== "any") {
    if (slot.day && slot.day !== effectiveSubject.preferredDay) {
      return true;
    }
  }

  // Check Preferred Period Slot restriction
  if (effectiveSubject.preferredPeriodSlot && effectiveSubject.preferredPeriodSlot !== "any") {
    const prefSlot = String(effectiveSubject.preferredPeriodSlot);
    const pNum = slot.period || extractPeriodNumberFromSlotOrLabel(slot);

    if (prefSlot.includes("-")) {
      const parts = prefSlot.split("-").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        if (pNum < parts[0] || pNum > parts[1]) {
          return true;
        }
      }
    } else if (prefSlot === "first" || prefSlot === "1") {
      if (pNum !== 1) return true;
    } else if (prefSlot === "last") {
      const levelCfg = scheduleType === "jhs" ? extraConfig?.jhs : extraConfig?.shs;
      const isShortenedSlot =
        slot.sessionType === "shortened" ||
        (Array.isArray(levelCfg?.shortenedDays) && levelCfg.shortenedDays.includes(slot.day)) ||
        levelCfg?.dayAssignments?.[slot.day] === "shortened";
      const dayMax = slotContext?.section
        ? getSectionDayMaxPeriod(slotContext.section, slot.day, scheduleType, extraConfig || { constraints }, slot)
        : Math.min(
            Math.max(
              1,
              Number(
                (isShortenedSlot
                  ? (levelCfg?.sessions?.shortened?.manualPeriodCount ?? levelCfg?.periods?.shortened ?? levelCfg?.periods?.special)
                  : (levelCfg?.sessions?.regular?.manualPeriodCount ?? levelCfg?.periods?.regular)) ||
                  constraints?.manualPeriodCount ||
                  constraints?.periodCount ||
                  (isShortenedSlot ? 6 : 8)
              ) || 8
            ),
            10
          );

      if (pNum > dayMax) return true;

      if (slotContext?.section && slotContext?.assignments) {
        const info = getDynamicLastPeriodInfo({
          sectionId: slotContext.section.id,
          day: slot.day,
          assignments: slotContext.assignments,
          slotsById: slotContext.slotsById,
          subjectsById: slotContext.subjectsById,
          placementRules,
          excludeCellKey: slotContext.excludeCellKey || null,
          excludeSubjectId: slotContext.excludeSubjectId || null,
          dayMaxPeriod: dayMax,
        });

        if (slotContext.mode === "manual-allow-after") {
          if (pNum <= info.highestNonLast) return true;
        } else {
          if (pNum !== info.expectedPeriod) return true;
        }
      }
    } else if (prefSlot === "morning") {
      const lunchP = constraints?.lunchAfterPeriod || 4;
      if (pNum > lunchP) return true;
    } else if (prefSlot === "afternoon") {
      const lunchP = constraints?.lunchAfterPeriod || 4;
      if (pNum <= lunchP) return true;
    } else if (!isNaN(Number(prefSlot))) {
      if (pNum !== Number(prefSlot)) return true;
    }
  }

  // Check specificPeriods if provided
  if (Array.isArray(effectiveSubject.specificPeriods) && effectiveSubject.specificPeriods.length > 0) {
    const pNum = slot.period || extractPeriodNumberFromSlotOrLabel(slot);
    if (!effectiveSubject.specificPeriods.includes(pNum)) {
      return true;
    }
  }

  const restrictedPeriods = getSubjectRestrictedPeriods(effectiveSubject.id, constraints);
  return matchesRestrictedPeriod(slot, restrictedPeriods);
}

function collectAssignmentTeacherIds(assignment) {
  if (!assignment) return [];
  return Array.from(
    new Set(
      [
        assignment.teacherId,
        ...(Array.isArray(assignment.coTeacherIds) ? assignment.coTeacherIds : []),
        ...(Array.isArray(assignment.breakoutAssignments)
          ? assignment.breakoutAssignments.map((b) => b?.teacherId)
          : []),
      ].filter(Boolean)
    )
  );
}

function getSubjectMaxPerDay(subject, totalDaysCount = 5, requiredOverride = null) {
  const classesPerWeek = parseBoundedNumber(
    requiredOverride != null ? requiredOverride : subject?.classesPerWeek,
    1,
    12,
    4
  );
  return Boolean(subject?.isDoublePeriod)
    ? 2
    : classesPerWeek > totalDaysCount
    ? Math.ceil(classesPerWeek / totalDaysCount)
    : 1;
}

function compactSectionDayUpward({
  section,
  day,
  assignments,
  drafts = null,
  teacherBusyBySlot = null,
  validSectionSlots,
  slotsById,
  subjectsById,
  sectionsById,
  facultyById,
  placementRules = [],
  constraints,
  config,
  scheduleType,
}) {
  const daySlots = validSectionSlots
    .filter((s) => s.day === day)
    .slice()
    .sort((a, b) => Number(a.period || 0) - Number(b.period || 0));

  if (daySlots.length === 0) return false;

  const busyMap = teacherBusyBySlot || buildTeacherBusyMap(assignments, sectionsById, slotsById);
  let movedAny = false;

  for (let pass = 0; pass < daySlots.length; pass++) {
    let movedThisPass = false;

    for (let i = 0; i < daySlots.length; i++) {
      const emptySlot = daySlots[i];
      const emptyKey = createCellKey(section.id, emptySlot.id);
      if (assignments[emptyKey]) continue;

      for (let j = i + 1; j < daySlots.length; j++) {
        const laterSlot = daySlots[j];
        const laterKey = createCellKey(section.id, laterSlot.id);
        const laterAssign = assignments[laterKey];
        if (!laterAssign || !laterAssign.subjectId) continue;

        const laterSubj = subjectsById?.get ? subjectsById.get(laterAssign.subjectId) : null;
        if (!laterSubj || laterSubj.isDoublePeriod || isPlacementLockedSubject(laterSubj, placementRules)) {
          continue;
        }

        if (
          isSubjectRestrictedForSlot(laterSubj, emptySlot, constraints, config, scheduleType, {
            section,
            assignments,
            slotsById,
            subjectsById,
            excludeCellKey: laterKey,
          })
        ) {
          continue;
        }

        const primaryTeacher = facultyById?.get ? facultyById.get(laterAssign.teacherId) : null;
        const allTeacherIds = collectAssignmentTeacherIds(laterAssign);
        if (!primaryTeacher || allTeacherIds.length === 0) continue;

        const allTeachersValid = isSubjectMultiTeacher(laterSubj)
          ? allTeacherIds.every((tId) => {
              const tObj = facultyById?.get ? facultyById.get(tId) : null;
              if (!tObj || tObj.active === false) return false;
              const tBusy = busyMap.get(tId);
              if (tBusy && tBusy.has(emptySlot.id) && tBusy.get(emptySlot.id) !== section.id) return false;
              if (matchesUnavailablePeriod(emptySlot, tObj.unavailablePeriods)) return false;
              return !matchesRestrictedPeriod(emptySlot, getTeacherRestrictedPeriods(tId, constraints, tObj));
            })
          : isTeacherEligible({
              teacher: primaryTeacher,
              subject: laterSubj,
              section,
              slot: emptySlot,
              constraints,
              teacherBusyBySlot: busyMap,
              excludedSectionId: section.id,
            });

        if (!allTeachersValid) continue;

        assignments[emptyKey] = {
          ...laterAssign,
          updatedAt: new Date().toISOString(),
        };
        delete assignments[laterKey];

        if (drafts) {
          drafts[emptyKey] = drafts[laterKey]
            ? { ...drafts[laterKey] }
            : { subjectId: laterAssign.subjectId, teacherId: laterAssign.teacherId };
          delete drafts[laterKey];
        }

        allTeacherIds.forEach((tId) => {
          const bMap = busyMap.get(tId) || new Map();
          bMap.delete(laterSlot.id);
          bMap.set(emptySlot.id, section.id);
          busyMap.set(tId, bMap);
        });

        movedAny = true;
        movedThisPass = true;
        break;
      }

      if (movedThisPass) break;
    }

    if (!movedThisPass) break;
  }

  return movedAny;
}

function tryRelocateUnlockedClassOffDay({
  section,
  fromDay,
  assignments,
  drafts = null,
  validSectionSlots,
  slotsById,
  subjectsById,
  sectionsById,
  facultyById,
  activeTeachers = [],
  placementRules = [],
  totalDaysCount = 5,
  constraints,
  config,
  scheduleType,
  reservedLastSlotsByDay = null,
  allowSubstituteTeacher = true,
  mustKeepTeacherId = null,
}) {
  const fromDaySlots = validSectionSlots
    .filter((s) => s.day === fromDay)
    .slice()
    .sort((a, b) => Number(b.period || 0) - Number(a.period || 0));

  const sectionKeys = Object.keys(assignments || {}).filter((ck) => splitCellKey(ck)[0] === section.id);
  const busyMap = buildTeacherBusyMap(assignments, sectionsById, slotsById);

  for (const occSlot of fromDaySlots) {
    const occKey = createCellKey(section.id, occSlot.id);
    const occAssign = assignments[occKey];
    if (!occAssign || !occAssign.subjectId) continue;

    const occSubj = subjectsById?.get ? subjectsById.get(occAssign.subjectId) : null;
    if (!occSubj || occSubj.isDoublePeriod || isSubjectMultiTeacher(occSubj)) continue;
    if (isPlacementLockedSubject(occSubj, placementRules)) continue;

    const occMaxPerDay = getSubjectMaxPerDay(occSubj, totalDaysCount);
    const otherDayEmptySlots = validSectionSlots.filter((s) => {
      if (s.day === fromDay) return false;
      const ck = createCellKey(section.id, s.id);
      return !assignments[ck];
    });

    for (const emptySlot of otherDayEmptySlots) {
      const emptyDay = emptySlot.day || "Monday";
      const occCountOnEmptyDay = sectionKeys.filter((ck) => {
        if (ck === occKey) return false;
        const [, sId] = splitCellKey(ck);
        const sObj = slotsById?.get ? slotsById.get(sId) : null;
        if (!sObj || sObj.day !== emptyDay) return false;
        const a = assignments[ck];
        return a?.subjectId === occSubj.id;
      }).length;
      if (occCountOnEmptyDay >= occMaxPerDay) continue;

      const emptyDayMax = getSectionDayMaxPeriod(section, emptyDay, scheduleType, config, emptySlot);
      const emptyDayLastInfo = getDynamicLastPeriodInfo({
        sectionId: section.id,
        day: emptyDay,
        assignments,
        slotsById,
        subjectsById,
        placementRules,
        excludeCellKey: occKey,
        dayMaxPeriod: emptyDayMax,
      });

      if (emptyDayLastInfo.otherLastPeriods.length > 0) {
        const minLastP = Math.min(...emptyDayLastInfo.otherLastPeriods);
        if (Number(emptySlot.period || 0) >= minLastP) continue;
      }

      if (reservedLastSlotsByDay) {
        const reservedOnTarget = reservedLastSlotsByDay.get(emptyDay) || 0;
        if (reservedOnTarget > 0) {
          const occupiedOnTargetDay = validSectionSlots.filter(
            (s) => s.day === emptyDay && Boolean(assignments[createCellKey(section.id, s.id)])
          ).length;
          if (occupiedOnTargetDay + 1 > Math.max(0, emptyDayMax - reservedOnTarget)) {
            continue;
          }
        }
      }

      if (
        isSubjectRestrictedForSlot(occSubj, emptySlot, constraints, config, scheduleType, {
          section,
          assignments,
          slotsById,
          subjectsById,
          excludeCellKey: occKey,
        })
      ) {
        continue;
      }

      let occTeacher = occAssign.teacherId && facultyById?.get ? facultyById.get(occAssign.teacherId) : null;
      if (
        !occTeacher ||
        !isTeacherEligible({
          teacher: occTeacher,
          subject: occSubj,
          section,
          slot: emptySlot,
          constraints,
          teacherBusyBySlot: busyMap,
          excludedSectionId: section.id,
        })
      ) {
        if (!allowSubstituteTeacher || mustKeepTeacherId) {
          occTeacher = null;
        } else {
          occTeacher = activeTeachers.find((t) =>
            isTeacherEligible({
              teacher: t,
              subject: occSubj,
              section,
              slot: emptySlot,
              constraints,
              teacherBusyBySlot: busyMap,
              excludedSectionId: section.id,
            })
          );
        }
      }
      if (!occTeacher) continue;

      const toKey = createCellKey(section.id, emptySlot.id);
      delete assignments[occKey];
      assignments[toKey] = {
        ...occAssign,
        teacherId: occTeacher.id,
        updatedAt: new Date().toISOString(),
      };

      if (drafts) {
        delete drafts[occKey];
        drafts[toKey] = { subjectId: occSubj.id, teacherId: occTeacher.id };
      }

      compactSectionDayUpward({
        section,
        day: fromDay,
        assignments,
        drafts,
        validSectionSlots,
        slotsById,
        subjectsById,
        sectionsById,
        facultyById,
        placementRules,
        constraints,
        config,
        scheduleType,
      });

      return {
        occKey,
        fromSlot: occSlot,
        toKey,
        emptySlot,
        occSubj,
        occTeacher,
      };
    }
  }

  return null;
}

function computeDynamicLastPlacementPlan({
  section,
  targetSubject,
  candidateDays,
  assignments,
  drafts = null,
  validSectionSlots,
  slotsById,
  subjectsById,
  sectionsById,
  facultyById,
  activeTeachers = [],
  config,
  scheduleType,
  preferTeacherId = null,
  excludeCellKey = null,
  reservedLastSlotsByDay = null,
  customTeacherPicker = null,
}) {
  const constraints = config?.constraints || {};
  const placementRules = getAllPlacementRules(config, scheduleType);
  const levelConfig = scheduleType === "jhs" ? config?.jhs : config?.shs;
  const activeDaysList = extractDaysFromLevelConfig(levelConfig)?.daySequence || [];
  const totalDaysCount = activeDaysList.length || 5;

  const findTeacherAtSlot = (simAssignments, targetSlot) => {
    if (typeof customTeacherPicker === "function") {
      return customTeacherPicker(targetSlot, simAssignments);
    }

    const busyMap = buildTeacherBusyMap(simAssignments, sectionsById, slotsById);
    if (isSubjectMultiTeacher(targetSubject)) {
      const breakoutRes = selectBreakoutTeachersForSlot({
        subject: targetSubject,
        section,
        slot: targetSlot,
        activeTeachers,
        teacherBusyBySlot: busyMap,
        config,
        allowLoadCapOverflow: true,
      });
      if (breakoutRes?.isComplete && Array.isArray(breakoutRes.chosenStreams) && breakoutRes.chosenStreams.length > 0) {
        const validChosen = breakoutRes.chosenStreams.filter((cs) => Boolean(cs.teacherObj));
        const primary = validChosen[0]?.teacherObj || null;
        if (primary) {
          return {
            teacher: primary,
            coTeacherIds: validChosen.map((cs) => cs.teacherId).filter((id) => id && id !== primary.id),
            breakoutAssignments: breakoutRes.chosenStreams.map((cs) => ({
              stream: cs.stream,
              teacherId: cs.teacherId || "",
              teacherName: cs.teacherName || "",
            })),
            breakoutNote: breakoutRes.chosenStreams
              .map((b) => `${String(b.stream || "Stream").toUpperCase()} – ${b.teacherName || "Unassigned"}`)
              .join("; "),
          };
        }
      }
      return null;
    }

    let picked = null;
    if (preferTeacherId && facultyById?.get) {
      const prefT = facultyById.get(preferTeacherId);
      if (
        prefT &&
        isTeacherEligible({
          teacher: prefT,
          subject: targetSubject,
          section,
          slot: targetSlot,
          constraints,
          teacherBusyBySlot: busyMap,
          excludedSectionId: section.id,
        })
      ) {
        picked = prefT;
      }
    }
    if (!picked) {
      picked = activeTeachers.find((t) =>
        isTeacherEligible({
          teacher: t,
          subject: targetSubject,
          section,
          slot: targetSlot,
          constraints,
          teacherBusyBySlot: busyMap,
          excludedSectionId: section.id,
        })
      );
    }
    return picked ? { teacher: picked } : null;
  };

  for (const day of candidateDays) {
    const dayMax = getSectionDayMaxPeriod(section, day, scheduleType, config);
    const directAssignments = { ...(assignments || {}) };
    if (excludeCellKey) {
      delete directAssignments[excludeCellKey];
    }

    const directInfo = getDynamicLastPeriodInfo({
      sectionId: section.id,
      day,
      assignments: directAssignments,
      slotsById,
      subjectsById,
      placementRules,
      dayMaxPeriod: dayMax,
    });

    if (!directInfo.isDayFull) {
      const targetSlot = validSectionSlots.find(
        (s) => s.day === day && Number(s.period) === directInfo.expectedPeriod
      );
      if (
        targetSlot &&
        !directAssignments[createCellKey(section.id, targetSlot.id)] &&
        !matchesRestrictedPeriod(targetSlot, getSubjectRestrictedPeriods(targetSubject.id, constraints))
      ) {
        const picked = findTeacherAtSlot(directAssignments, targetSlot);
        if (picked?.teacher) {
          const targetKey = createCellKey(section.id, targetSlot.id);
          const nextAssignments = {
            ...directAssignments,
            [targetKey]: {
              subjectId: targetSubject.id,
              teacherId: picked.teacher.id,
              coTeacherIds: picked.coTeacherIds?.length ? picked.coTeacherIds : undefined,
              breakoutAssignments: picked.breakoutAssignments?.length ? picked.breakoutAssignments : undefined,
              breakoutNote: picked.breakoutNote || undefined,
              source: "conflict-fix",
              updatedAt: new Date().toISOString(),
            },
          };
          const nextDrafts = { ...(drafts || {}) };
          if (excludeCellKey) delete nextDrafts[excludeCellKey];
          nextDrafts[targetKey] = {
            subjectId: targetSubject.id,
            teacherId: picked.teacher.id,
            ...(picked.coTeacherIds?.length ? { coTeacherIds: picked.coTeacherIds } : {}),
            ...(picked.breakoutAssignments?.length ? { breakoutAssignments: picked.breakoutAssignments } : {}),
            ...(picked.breakoutNote ? { breakoutNote: picked.breakoutNote } : {}),
          };

          return {
            targetSlot,
            teacher: picked.teacher,
            pickedInfo: picked,
            relocatedMove: null,
            nextAssignments,
            nextDrafts,
            label: `Schedule in Last Available Period (${formatDayPeriodOrdinalLabel(targetSlot)})`,
            description: `Assign ${formatSubjectDisplayName(targetSubject)} with ${picked.teacher.name} at ${formatDayPeriodOrdinalLabel(targetSlot)}.`,
          };
        }
      }
    }

    // Fallback: Relocate one unlocked class off `day` to another day (either because `day` is full
    // or all eligible teachers were busy at `directInfo.expectedPeriod`) and compact `day` upward.
    const simAssignments = { ...(assignments || {}) };
    const simDrafts = drafts ? { ...drafts } : {};
    if (excludeCellKey) {
      delete simAssignments[excludeCellKey];
      delete simDrafts[excludeCellKey];
    }

    const compacted = compactSectionDayUpward({
      section,
      day,
      assignments: simAssignments,
      drafts: simDrafts,
      validSectionSlots,
      slotsById,
      subjectsById,
      sectionsById,
      facultyById,
      placementRules,
      constraints,
      config,
      scheduleType,
    });

    if (compacted) {
      const compactOnlyInfo = getDynamicLastPeriodInfo({
        sectionId: section.id,
        day,
        assignments: simAssignments,
        slotsById,
        subjectsById,
        placementRules,
        dayMaxPeriod: dayMax,
      });

      if (!compactOnlyInfo.isDayFull) {
        const compactSlot = validSectionSlots.find(
          (s) => s.day === day && Number(s.period) === compactOnlyInfo.expectedPeriod
        );
        if (
          compactSlot &&
          !simAssignments[createCellKey(section.id, compactSlot.id)] &&
          !matchesRestrictedPeriod(compactSlot, getSubjectRestrictedPeriods(targetSubject.id, constraints))
        ) {
          const pickedCompact = findTeacherAtSlot(simAssignments, compactSlot);
          if (pickedCompact?.teacher) {
            const compactKey = createCellKey(section.id, compactSlot.id);
            simAssignments[compactKey] = {
              subjectId: targetSubject.id,
              teacherId: pickedCompact.teacher.id,
              coTeacherIds: pickedCompact.coTeacherIds?.length ? pickedCompact.coTeacherIds : undefined,
              breakoutAssignments: pickedCompact.breakoutAssignments?.length ? pickedCompact.breakoutAssignments : undefined,
              breakoutNote: pickedCompact.breakoutNote || undefined,
              source: "conflict-fix",
              updatedAt: new Date().toISOString(),
            };
            simDrafts[compactKey] = {
              subjectId: targetSubject.id,
              teacherId: pickedCompact.teacher.id,
              ...(pickedCompact.coTeacherIds?.length ? { coTeacherIds: pickedCompact.coTeacherIds } : {}),
              ...(pickedCompact.breakoutAssignments?.length ? { breakoutAssignments: pickedCompact.breakoutAssignments } : {}),
              ...(pickedCompact.breakoutNote ? { breakoutNote: pickedCompact.breakoutNote } : {}),
            };

            return {
              targetSlot: compactSlot,
              teacher: pickedCompact.teacher,
              pickedInfo: pickedCompact,
              relocatedMove: null,
              nextAssignments: simAssignments,
              nextDrafts: simDrafts,
              label: `Compact ${day} & place at Last Available Period (${formatDayPeriodOrdinalLabel(compactSlot)})`,
              description: `Shift ${day} classes earlier to free ${formatDayPeriodOrdinalLabel(compactSlot)} for ${formatSubjectDisplayName(targetSubject)} with ${pickedCompact.teacher.name}.`,
            };
          }
        }
      }
    }

    const relocated = tryRelocateUnlockedClassOffDay({
      section,
      fromDay: day,
      assignments: simAssignments,
      drafts: simDrafts,
      validSectionSlots,
      slotsById,
      subjectsById,
      sectionsById,
      facultyById,
      activeTeachers,
      placementRules,
      totalDaysCount,
      constraints,
      config,
      scheduleType,
      reservedLastSlotsByDay,
    });

    if (relocated) {
      const postInfo = getDynamicLastPeriodInfo({
        sectionId: section.id,
        day,
        assignments: simAssignments,
        slotsById,
        subjectsById,
        placementRules,
        dayMaxPeriod: dayMax,
      });

      if (!postInfo.isDayFull) {
        const targetSlot = validSectionSlots.find(
          (s) => s.day === day && Number(s.period) === postInfo.expectedPeriod
        );
        if (
          targetSlot &&
          !simAssignments[createCellKey(section.id, targetSlot.id)] &&
          !matchesRestrictedPeriod(targetSlot, getSubjectRestrictedPeriods(targetSubject.id, constraints))
        ) {
          const picked = findTeacherAtSlot(simAssignments, targetSlot);
          if (picked?.teacher) {
            const targetKey = createCellKey(section.id, targetSlot.id);
            simAssignments[targetKey] = {
              subjectId: targetSubject.id,
              teacherId: picked.teacher.id,
              coTeacherIds: picked.coTeacherIds?.length ? picked.coTeacherIds : undefined,
              breakoutAssignments: picked.breakoutAssignments?.length ? picked.breakoutAssignments : undefined,
              breakoutNote: picked.breakoutNote || undefined,
              source: "conflict-fix",
              updatedAt: new Date().toISOString(),
            };
            simDrafts[targetKey] = {
              subjectId: targetSubject.id,
              teacherId: picked.teacher.id,
              ...(picked.coTeacherIds?.length ? { coTeacherIds: picked.coTeacherIds } : {}),
              ...(picked.breakoutAssignments?.length ? { breakoutAssignments: picked.breakoutAssignments } : {}),
              ...(picked.breakoutNote ? { breakoutNote: picked.breakoutNote } : {}),
            };

            return {
              targetSlot,
              teacher: picked.teacher,
              pickedInfo: picked,
              relocatedMove: relocated,
              nextAssignments: simAssignments,
              nextDrafts: simDrafts,
              label: `Shift ${formatSubjectDisplayName(relocated.occSubj)} to ${formatDayPeriodOrdinalLabel(relocated.emptySlot)} & place at ${formatDayPeriodOrdinalLabel(targetSlot)}`,
              description: `Move ${formatSubjectDisplayName(relocated.occSubj)} to ${formatDayPeriodOrdinalLabel(relocated.emptySlot)} so ${formatSubjectDisplayName(targetSubject)} with ${picked.teacher.name} fits at the Last Available Period (${formatDayPeriodOrdinalLabel(targetSlot)}).`,
            };
          }
        }
      }
    }

    // Second fallback: If `day` had room (expectedPeriod + 1 <= dayMax) and teachers were busy at `expectedPeriod`,
    // try pulling one unlocked class from another day into `expectedPeriod` on `day` to advance `expectedPeriod` by 1.
    if (!directInfo.isDayFull && directInfo.expectedPeriod + 1 <= dayMax) {
      const pullAssignments = { ...(assignments || {}) };
      const pullDrafts = drafts ? { ...drafts } : {};
      if (excludeCellKey) {
        delete pullAssignments[excludeCellKey];
        delete pullDrafts[excludeCellKey];
      }

      compactSectionDayUpward({
        section,
        day,
        assignments: pullAssignments,
        drafts: pullDrafts,
        validSectionSlots,
        slotsById,
        subjectsById,
        sectionsById,
        facultyById,
        placementRules,
        constraints,
        config,
        scheduleType,
      });

      const compactInfo = getDynamicLastPeriodInfo({
        sectionId: section.id,
        day,
        assignments: pullAssignments,
        slotsById,
        subjectsById,
        placementRules,
        dayMaxPeriod: dayMax,
      });

      if (!compactInfo.isDayFull && compactInfo.otherLastPeriods.length === 0 && compactInfo.expectedPeriod + 1 <= dayMax) {
        const pullSlot = validSectionSlots.find(
          (s) => s.day === day && Number(s.period) === compactInfo.expectedPeriod
        );
        const nextLastSlot = validSectionSlots.find(
          (s) => s.day === day && Number(s.period) === compactInfo.expectedPeriod + 1
        );

        if (pullSlot && nextLastSlot && !pullAssignments[createCellKey(section.id, pullSlot.id)] && !pullAssignments[createCellKey(section.id, nextLastSlot.id)]) {
          const otherSectionKeys = Object.keys(pullAssignments).filter((ck) => splitCellKey(ck)[0] === section.id);
          const pullBusyMap = buildTeacherBusyMap(pullAssignments, sectionsById, slotsById);

          for (const occKey of otherSectionKeys) {
            const [, occSlotId] = splitCellKey(occKey);
            const occSlot = slotsById?.get ? slotsById.get(occSlotId) : null;
            if (!occSlot || occSlot.day === day) continue;

            const occDayMax = getSectionDayMaxPeriod(section, occSlot.day, scheduleType, config, occSlot);
            const occDayLastInfo = getDynamicLastPeriodInfo({
              sectionId: section.id,
              day: occSlot.day,
              assignments: pullAssignments,
              slotsById,
              subjectsById,
              placementRules,
              dayMaxPeriod: occDayMax,
            });
            if (occDayLastInfo.otherLastPeriods.length > 0) continue;

            const occAssign = pullAssignments[occKey];
            const occSubj = occAssign?.subjectId && subjectsById?.get ? subjectsById.get(occAssign.subjectId) : null;
            if (!occSubj || occSubj.isDoublePeriod || isSubjectMultiTeacher(occSubj) || isPlacementLockedSubject(occSubj, placementRules)) continue;

            const occMaxPerDay = getSubjectMaxPerDay(occSubj, totalDaysCount);
            const occCountOnDay = otherSectionKeys.filter((ck) => {
              if (ck === occKey) return false;
              const [, sId] = splitCellKey(ck);
              const sObj = slotsById?.get ? slotsById.get(sId) : null;
              return sObj?.day === day && pullAssignments[ck]?.subjectId === occSubj.id;
            }).length;
            if (occCountOnDay >= occMaxPerDay) continue;

            if (isSubjectRestrictedForSlot(occSubj, pullSlot, constraints, config, scheduleType, { section, assignments: pullAssignments, slotsById, subjectsById, excludeCellKey: occKey })) {
              continue;
            }

            const occTeacher = occAssign.teacherId && facultyById?.get ? facultyById.get(occAssign.teacherId) : null;
            if (
              !occTeacher ||
              !isTeacherEligible({
                teacher: occTeacher,
                subject: occSubj,
                section,
                slot: pullSlot,
                constraints,
                teacherBusyBySlot: pullBusyMap,
                excludedSectionId: section.id,
              })
            ) {
              continue;
            }

            const tempPullAssignments = { ...pullAssignments };
            const pullKey = createCellKey(section.id, pullSlot.id);
            delete tempPullAssignments[occKey];
            tempPullAssignments[pullKey] = {
              ...occAssign,
              updatedAt: new Date().toISOString(),
            };

            if (!matchesRestrictedPeriod(nextLastSlot, getSubjectRestrictedPeriods(targetSubject.id, constraints))) {
              const picked = findTeacherAtSlot(tempPullAssignments, nextLastSlot);
              if (picked?.teacher) {
                const nextLastKey = createCellKey(section.id, nextLastSlot.id);
                tempPullAssignments[nextLastKey] = {
                  subjectId: targetSubject.id,
                  teacherId: picked.teacher.id,
                  coTeacherIds: picked.coTeacherIds?.length ? picked.coTeacherIds : undefined,
                  breakoutAssignments: picked.breakoutAssignments?.length ? picked.breakoutAssignments : undefined,
                  breakoutNote: picked.breakoutNote || undefined,
                  source: "conflict-fix",
                  updatedAt: new Date().toISOString(),
                };
                const nextDrafts = { ...pullDrafts };
                delete nextDrafts[occKey];
                nextDrafts[pullKey] = { subjectId: occSubj.id, teacherId: occTeacher.id };
                nextDrafts[nextLastKey] = {
                  subjectId: targetSubject.id,
                  teacherId: picked.teacher.id,
                  ...(picked.coTeacherIds?.length ? { coTeacherIds: picked.coTeacherIds } : {}),
                  ...(picked.breakoutAssignments?.length ? { breakoutAssignments: picked.breakoutAssignments } : {}),
                  ...(picked.breakoutNote ? { breakoutNote: picked.breakoutNote } : {}),
                };

                return {
                  targetSlot: nextLastSlot,
                  teacher: picked.teacher,
                  pickedInfo: picked,
                  relocatedMove: {
                    occKey,
                    fromSlot: occSlot,
                    toKey: pullKey,
                    emptySlot: pullSlot,
                    occSubj,
                    occTeacher,
                  },
                  nextAssignments: tempPullAssignments,
                  nextDrafts,
                  label: `Move ${formatSubjectDisplayName(occSubj)} to ${formatDayPeriodOrdinalLabel(pullSlot)} & place at ${formatDayPeriodOrdinalLabel(nextLastSlot)}`,
                  description: `Shift ${formatSubjectDisplayName(occSubj)} from ${formatDayPeriodOrdinalLabel(occSlot)} to ${formatDayPeriodOrdinalLabel(pullSlot)} so ${formatSubjectDisplayName(targetSubject)} with ${picked.teacher.name} fits at Last Available Period (${formatDayPeriodOrdinalLabel(nextLastSlot)}).`,
                };
              }
            }
          }
        }
      }
    }
  }

  return null;
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
    return { include: false, restricted: false, restrictedReason: "", statusNote: "" };
  }

  if (teacher.active === false) {
    return { include: false, restricted: false, restrictedReason: "", statusNote: "" };
  }

  if (constraints.enforceExpertiseAndGradeMatch) {
    if (!doesTeacherMatchGrade(teacher, section.grade) || !doesTeacherMatchSubject(teacher, subject)) {
      return { include: false, restricted: false, restrictedReason: "", statusNote: "" };
    }
  }

  let restricted = false;
  let restrictedReason = "";
  let statusNote = "";

  if (constraints.enforceNoDoubleBooking) {
    const teacherBusySlots = teacherBusyBySlot.get(teacher.id);
    if (teacherBusySlots && teacherBusySlots.has(slot.id)) {
      const existingSectionId = teacherBusySlots.get(slot.id);
      if (existingSectionId && existingSectionId !== excludedSectionId) {
        statusNote = "Already assigned";
      }
    }
  }

  if (constraints.enforceUnavailablePeriods && matchesUnavailablePeriod(slot, teacher.unavailablePeriods)) {
    restricted = true;
    restrictedReason = restrictedReason || "Unavailable";
  }

  const teacherRestrictedPeriods = getTeacherRestrictedPeriods(teacher.id, constraints);
  if (matchesRestrictedPeriod(slot, teacherRestrictedPeriods)) {
    restricted = true;
    restrictedReason = restrictedReason || "Restricted";
  }

  return { include: true, restricted, restrictedReason, statusNote };
}

function doesTeacherMatchGrade(teacher, grade) {
  if (!teacher || !Array.isArray(teacher.gradeLevelAssignments) || teacher.gradeLevelAssignments.length === 0) {
    return true;
  }
  const gradeNum = String(grade || "").replace(/[^0-9]/g, "");
  return teacher.gradeLevelAssignments.some((entry) => {
    const text = sanitizeText(entry).toLowerCase();
    if (!text) return false;
    const entryNum = text.replace(/[^0-9]/g, "");
    if (gradeNum && entryNum && entryNum.includes(gradeNum)) return true;
    return text.includes(`grade ${grade}`) || text === String(grade) || text.includes("jhs") || text.includes("shs");
  });
}

function checkExactExpertiseMatch(list, subject) {
  if (!Array.isArray(list) || list.length === 0) return false;
  const code = sanitizeText(subject?.subjectCode).toLowerCase();
  const name = sanitizeText(subject?.subjectName).toLowerCase();

  return list.some((raw) => {
    const entry = sanitizeText(raw).toLowerCase();
    if (!entry) return false;
    const parts = entry.split("—").map((p) => p.trim());
    if (code && parts.some((p) => p === code)) return true;
    if (name && parts.some((p) => p === name || p.startsWith(`${name} (`))) return true;
    if (code && (entry === code || entry.startsWith(`${code} —`))) return true;
    if (name && (entry === name || entry.endsWith(`— ${name}`))) return true;
    return false;
  });
}

function checkExpertiseMatch(list, subject) {
  if (!Array.isArray(list) || list.length === 0) return false;
  if (checkExactExpertiseMatch(list, subject)) return true;

  const code = sanitizeText(subject?.subjectCode).toLowerCase();
  const name = sanitizeText(subject?.subjectName).toLowerCase();

  return list.some((raw) => {
    const entry = sanitizeText(raw).toLowerCase();
    if (!entry) return false;
    if (code && (hasWholeWordToken(entry, code) || hasWholeWordToken(code, entry))) return true;
    if (name && (entry.includes(name) || name.includes(entry))) return true;

    const mainWord = name.split(/\s+/)[0];
    if (mainWord && mainWord.length >= 3 && hasWholeWordToken(entry, mainWord)) return true;

    // Standard DepEd curriculum bidirectional department / specialized program mappings
    // (Allows single-subject teachers to prioritize their exact subject while supporting their department's core/specialized classes):
    // 1. English <-> Developmental Reading, Remedial Reading, Journalism, Creative Writing, Aral Program
    const isSubjectEnglishDomain =
      name.includes("english") ||
      name.includes("reading") ||
      name.includes("journalism") ||
      name.includes("creative writing") ||
      name.includes("aral") ||
      code === "eng" ||
      code === "devread" ||
      code === "aral";
    const isEntryEnglishDomain =
      entry.includes("english") ||
      entry.includes("reading") ||
      entry.includes("literature") ||
      entry.includes("aral") ||
      entry.includes("devread");
    if (isSubjectEnglishDomain && isEntryEnglishDomain) {
      return true;
    }

    // 2. Mathematics <-> Elementary Algebra, Advanced Math, Geometry, Statistics, Trigonometry, Calculus
    const isSubjectMathDomain =
      name.includes("math") ||
      name.includes("algebra") ||
      name.includes("geometry") ||
      name.includes("statistics") ||
      name.includes("calculus") ||
      name.includes("trigonometry") ||
      code === "math" ||
      code === "elemalg";
    const isEntryMathDomain =
      entry.includes("math") ||
      entry.includes("mathematics") ||
      entry.includes("algebra") ||
      entry.includes("elemalg");
    if (isSubjectMathDomain && isEntryMathDomain) {
      return true;
    }

    // 3. Science <-> Environmental Science, Biotechnology, Research, Applied Science
    const isSubjectSciDomain =
      name.includes("science") ||
      name.includes("biotech") ||
      name.includes("research") ||
      code === "sci" ||
      code === "envsci" ||
      code.includes("biotech");
    const isEntrySciDomain =
      entry.includes("science") ||
      entry.includes("envsci") ||
      entry.includes("biology") ||
      entry.includes("chemistry") ||
      entry.includes("physics");
    if (isSubjectSciDomain && isEntrySciDomain) {
      return true;
    }

    // 4. TLE / TVL <-> ICT (SPJ), ICT (SP-STEM), Computer, Programming, CSS
    const isSubjectTleDomain =
      name.includes("tle") ||
      name.includes("livelihood") ||
      name.includes("ict") ||
      name.includes("computer") ||
      code === "tle" ||
      code.includes("ict");
    const isEntryTleDomain =
      entry.includes("tle") ||
      entry.includes("tvl") ||
      entry.includes("ict") ||
      entry.includes("technology") ||
      entry.includes("livelihood") ||
      entry.includes("computer");
    if (isSubjectTleDomain && isEntryTleDomain) {
      return true;
    }

    // 5. MAPEH <-> SPA Specialization (Visual Arts, Music, Dance, Theater, Media Arts, Creative Writing)
    const isSubjectMapehSpaDomain =
      name.includes("mapeh") ||
      name.includes("spa") ||
      name.includes("arts") ||
      name.includes("music") ||
      name.includes("dance") ||
      name.includes("media") ||
      code === "mapeh" ||
      code === "spaspec" ||
      code.includes("spa");
    const isEntryMapehSpaDomain =
      entry.includes("mapeh") ||
      entry.includes("spa") ||
      entry.includes("music") ||
      entry.includes("arts") ||
      entry.includes("pe") ||
      entry.includes("health") ||
      entry.includes("dance") ||
      entry.includes("theater") ||
      entry.includes("media");
    if (isSubjectMapehSpaDomain && isEntryMapehSpaDomain) {
      return true;
    }

    // 6. Aral Program / Academic Remediation -> Core Subject Teachers
    if (
      (name.includes("aral") || code === "aral") &&
      (entry.includes("english") || entry.includes("math") || entry.includes("science") || entry.includes("filipino") || entry.includes("reading"))
    ) {
      return true;
    }

    // 7. Values Education / Edukasyon sa Pagpapakatao -> ESP / Values / Araling Panlipunan
    if (
      (name.includes("values") || name.includes("esp") || name.includes("pagpapakatao") || code === "esp" || code === "ve" || code === "valed") &&
      (entry.includes("values") || entry.includes("esp") || entry.includes("pagpapakatao") || entry.includes("ve") || entry.includes("araling panlipunan") || entry.includes("social"))
    ) {
      return true;
    }

    return false;
  });
}

export function doesTeacherMatchStream(teacher, streamName, requiredMajor = "") {
  return getTeacherStreamQualificationTier(teacher, streamName, requiredMajor) > 0;
}

export function getTeacherStreamQualificationTier(teacher, streamName, requiredMajor = "") {
  if (!teacher) return 0;

  const targetMajor = sanitizeText(requiredMajor || "").toLowerCase();
  const cleanStream = sanitizeText(streamName || "").toLowerCase();

  const specificFields = [
    teacher.major,
    teacher.minor,
    teacher.specialization,
    ...(Array.isArray(teacher.subjectExpertise) ? teacher.subjectExpertise : []),
    ...(Array.isArray(teacher.primaryExpertise) ? teacher.primaryExpertise : []),
  ].map((f) => sanitizeText(f || "").toLowerCase()).filter(Boolean);

  const generalFields = [
    teacher.department,
    teacher.degree,
    ...(Array.isArray(teacher.secondaryExpertise) ? teacher.secondaryExpertise : []),
  ].map((f) => sanitizeText(f || "").toLowerCase()).filter(Boolean);

  // 1. Direct required major match if specified
  if (targetMajor && targetMajor !== "auto") {
    if (specificFields.some((f) => f.includes(targetMajor) || targetMajor.includes(f))) return 3;
    if (generalFields.some((f) => f.includes(targetMajor) || targetMajor.includes(f))) return 2;
  }

  if (!cleanStream || cleanStream === "stream" || cleanStream === "specialization") {
    return 1;
  }

  // 2. Specialized program domain mappings:
  // A. Special Program in the Arts (SPA):
  if (cleanStream.includes("dance") || cleanStream.includes("ballet") || cleanStream.includes("folk dance")) {
    if (specificFields.some((f) => f.includes("dance") || f.includes("folk") || f.includes("ballet") || f.includes("physical education") || f.includes("pe"))) return 3;
    if (generalFields.some((f) => f.includes("mapeh") || f.includes("pe") || f.includes("dance"))) return 2;
    return 0;
  }

  if (cleanStream.includes("music") || cleanStream.includes("vocal") || cleanStream.includes("instrument") || cleanStream.includes("choir") || cleanStream.includes("band")) {
    if (specificFields.some((f) => f.includes("music") || f.includes("vocal") || f.includes("instrument") || f.includes("band") || f.includes("choir") || f.includes("voice") || f.includes("guitar") || f.includes("piano"))) return 3;
    if (generalFields.some((f) => f.includes("mapeh") || f.includes("music"))) return 2;
    return 0;
  }

  if (cleanStream.includes("visual") || cleanStream.includes("fine art") || cleanStream.includes("painting") || cleanStream.includes("drawing") || cleanStream.includes("sculpture")) {
    if (specificFields.some((f) => f.includes("visual") || f.includes("fine art") || f.includes("painting") || f.includes("drawing") || (f.includes("art") && !f.includes("martial") && !f.includes("dance")))) return 3;
    if (generalFields.some((f) => f.includes("mapeh") || f.includes("arts"))) return 2;
    return 0;
  }

  if (cleanStream.includes("theater") || cleanStream.includes("theatre") || cleanStream.includes("drama") || cleanStream.includes("dula") || cleanStream.includes("acting")) {
    if (specificFields.some((f) => f.includes("theater") || f.includes("theatre") || f.includes("drama") || f.includes("dula") || f.includes("speech") || f.includes("acting"))) return 3;
    if (generalFields.some((f) => f.includes("mapeh") || f.includes("english") || f.includes("filipino"))) return 2;
    return 0;
  }

  if (cleanStream.includes("media") || cleanStream.includes("broadcast") || cleanStream.includes("photography") || cleanStream.includes("film") || cleanStream.includes("multimedia")) {
    if (specificFields.some((f) => f.includes("media") || f.includes("broadcast") || f.includes("journalism") || f.includes("film") || f.includes("photo") || f.includes("ict") || f.includes("multimedia"))) return 3;
    if (generalFields.some((f) => f.includes("mapeh") || f.includes("tle") || f.includes("tvl") || f.includes("english"))) return 2;
    return 0;
  }

  if (cleanStream.includes("creative writing") || cleanStream.includes("writing") || cleanStream.includes("literature")) {
    if (specificFields.some((f) => f.includes("creative writing") || f.includes("writing") || f.includes("literature") || f.includes("journalism") || f.includes("english") || f.includes("filipino"))) return 3;
    if (generalFields.some((f) => f.includes("english") || f.includes("filipino") || f.includes("language"))) return 2;
    return 0;
  }

  // B. TVL / TechPro streams:
  if (cleanStream.includes("cook") || cleanStream.includes("bread") || cleanStream.includes("pastry") || cleanStream.includes("culinary") || cleanStream.includes("food")) {
    if (specificFields.some((f) => f.includes("cook") || f.includes("home economics") || f.includes("he") || f.includes("culinary") || f.includes("pastry") || f.includes("baking") || f.includes("food"))) return 3;
    if (generalFields.some((f) => f.includes("tle") || f.includes("tvl") || f.includes("home economics"))) return 2;
    return 0;
  }

  if (cleanStream.includes("ict") || cleanStream.includes("computer") || cleanStream.includes("programming") || cleanStream.includes("css") || cleanStream.includes("animation")) {
    if (specificFields.some((f) => f.includes("ict") || f.includes("computer") || f.includes("program") || f.includes("css") || f.includes("it") || f.includes("cs") || f.includes("software"))) return 3;
    if (generalFields.some((f) => f.includes("tle") || f.includes("tvl") || f.includes("technology"))) return 2;
    return 0;
  }

  if (cleanStream.includes("weld") || cleanStream.includes("auto") || cleanStream.includes("electr") || cleanStream.includes("machin") || cleanStream.includes("smaw") || cleanStream.includes("draft")) {
    if (specificFields.some((f) => f.includes("industrial") || f.includes("ia") || f.includes("weld") || f.includes("auto") || f.includes("electr") || f.includes("smaw") || f.includes("draft"))) return 3;
    if (generalFields.some((f) => f.includes("tle") || f.includes("tvl") || f.includes("industrial arts"))) return 2;
    return 0;
  }

  if (cleanStream.includes("agri") || cleanStream.includes("crop") || cleanStream.includes("animal") || cleanStream.includes("fish")) {
    if (specificFields.some((f) => f.includes("agri") || f.includes("crop") || f.includes("animal") || f.includes("fish") || f.includes("horticulture"))) return 3;
    if (generalFields.some((f) => f.includes("tle") || f.includes("tvl") || f.includes("agri"))) return 2;
    return 0;
  }

  // C. Special Program in Sports (SPS):
  if (cleanStream.includes("sport") || cleanStream.includes("athletic") || cleanStream.includes("dual") || cleanStream.includes("ball") || cleanStream.includes("aquatic")) {
    if (specificFields.some((f) => f.includes("pe") || f.includes("physical education") || f.includes("sport") || f.includes("coach") || f.includes("athletic") || f.includes("kinesiology"))) return 3;
    if (generalFields.some((f) => f.includes("mapeh") || f.includes("pe"))) return 2;
    return 0;
  }

  // D. STEM Research Teams:
  if (cleanStream.includes("robot") || cleanStream.includes("physics")) {
    if (specificFields.some((f) => f.includes("physics") || f.includes("robot") || f.includes("engineering") || f.includes("electronics"))) return 3;
    if (generalFields.some((f) => f.includes("science") || f.includes("ict"))) return 2;
    return 0;
  }

  if (cleanStream.includes("bio") || cleanStream.includes("life science")) {
    if (specificFields.some((f) => f.includes("bio") || f.includes("life science"))) return 3;
    if (generalFields.some((f) => f.includes("science"))) return 2;
    return 0;
  }

  // Fallback keyword match against specificFields
  const streamWords = cleanStream.split(/[\s/&,-]+/).filter((w) => w.length >= 3 && w !== "and" && w !== "the" && w !== "for" && w !== "arts");
  if (streamWords.length > 0 && specificFields.some((f) => streamWords.some((w) => f.includes(w)))) return 2;

  // General field broad word match
  if (streamWords.length > 0 && generalFields.some((f) => streamWords.some((w) => f.includes(w)))) return 1;

  return 0;
}

export function isHomeroomOrAdvisorySubject(subject) {
  if (!subject) return false;
  const code = sanitizeText(subject?.subjectCode).toUpperCase();
  const name = sanitizeText(subject?.subjectName).toLowerCase();
  const type = sanitizeText(subject?.subjectType).toLowerCase();

  return (
    code === "HGP" ||
    code === "HRG" ||
    code === "ADV" ||
    name === "hgp" ||
    name.includes("hgp") ||
    name.includes("homeroom") ||
    name.includes("guidance program") ||
    name.includes("advisory")
  );
}

export function isSubjectMultiTeacher(subject) {
  if (!subject) return false;
  const mode = String(subject.teachingMode || "").toLowerCase();
  if (mode === "breakout" || mode === "multi" || mode === "joined") return true;
  if (Number(subject.requiredTeachers) > 1) return true;
  if (Array.isArray(subject.breakoutStreams) && subject.breakoutStreams.length > 1) return true;
  const code = sanitizeText(subject?.subjectCode).toUpperCase();
  const name = sanitizeText(subject?.subjectName).toLowerCase();
  return code === "SPASPEC" || name.includes("spa specialization");
}

export function getSubjectBreakoutStreams(subject, config) {
  if (!subject) return [];
  const code = sanitizeText(subject?.subjectCode).toUpperCase();
  const name = sanitizeText(subject?.subjectName).toLowerCase();
  const isSpaSpec = code === "SPASPEC" || name.includes("spa specialization");

  const spaConfigStreams =
    isSpaSpec && Array.isArray(config?.spaSettings?.specializations) && config.spaSettings.specializations.length > 0
      ? config.spaSettings.specializations
      : isSpaSpec
      ? [
          { name: "Media Arts", defaultTeacherId: "EMP-2026-051" },
          { name: "Dance Arts", defaultTeacherId: "EMP-2026-052" },
          { name: "Instrumental Music", defaultTeacherId: "EMP-2026-053" },
        ]
      : [];

  let rawStreams = [];
  if (Array.isArray(subject.breakoutStreams) && subject.breakoutStreams.length > 0) {
    rawStreams = subject.breakoutStreams.map((s, idx) => ({
      name: typeof s === "string" ? s.trim() : sanitizeText(s?.name) || spaConfigStreams[idx]?.name || `Stream ${idx + 1}`,
      requiredMajor: typeof s === "object" && s !== null ? sanitizeText(s.requiredMajor) : "",
      defaultTeacherId:
        (typeof s === "object" && s !== null && sanitizeText(s.defaultTeacherId)) ||
        spaConfigStreams[idx]?.defaultTeacherId ||
        "",
    }));
  } else if (typeof subject.breakoutStreams === "string" && subject.breakoutStreams.trim()) {
    rawStreams = subject.breakoutStreams
      .split(",")
      .map((s, idx) => ({
        name: s.trim() || spaConfigStreams[idx]?.name || `Stream ${idx + 1}`,
        requiredMajor: "",
        defaultTeacherId: spaConfigStreams[idx]?.defaultTeacherId || "",
      }))
      .filter((s) => s.name);
  } else if (spaConfigStreams.length > 0) {
    rawStreams = spaConfigStreams.map((s, idx) => ({
      name: sanitizeText(s?.name) || `Stream ${idx + 1}`,
      requiredMajor: sanitizeText(s?.requiredMajor) || "",
      defaultTeacherId: sanitizeText(s?.defaultTeacherId) || "",
    }));
  }

  const explicitCount = Number(subject.requiredTeachers);
  const targetCount =
    Number.isFinite(explicitCount) && explicitCount >= 2
      ? Math.min(10, Math.max(2, explicitCount))
      : rawStreams.length >= 2
      ? rawStreams.length
      : isSpaSpec
      ? Math.max(2, spaConfigStreams.length || 3)
      : 2;

  const result = [];
  for (let idx = 0; idx < targetCount; idx++) {
    const existing = rawStreams[idx];
    const spaFallback = spaConfigStreams[idx];
    result.push({
      name: existing?.name || spaFallback?.name || `Stream ${idx + 1}`,
      requiredMajor: existing?.requiredMajor || spaFallback?.requiredMajor || "",
      defaultTeacherId: existing?.defaultTeacherId || spaFallback?.defaultTeacherId || "",
    });
  }
  return result;
}

export function selectBreakoutTeachersForSlot({
  subject,
  section,
  slot,
  activeTeachers = [],
  teacherBusyBySlot = new Map(),
  teacherLoad = new Map(),
  config = {},
  preferredBreakouts = null,
  allowLoadCapOverflow = false,
}) {
  const configuredStreams = getSubjectBreakoutStreams(subject, config);
  const requiredCount = configuredStreams.length;
  if (requiredCount === 0) {
    return { isComplete: false, chosenStreams: [], requiredCount: 0 };
  }

  const usedTeacherIds = new Set();
  const chosenStreams = [];
  const maxCap = Number(config?.constraints?.maxTeachingLoadCap) || 24;
  const enforceCap = config?.constraints?.enforceMaxLoadCap !== false && !allowLoadCapOverflow;

  const isCandidateFreeAndUnrestricted = (t) => {
    if (!t || t.active === false) return false;
    if (usedTeacherIds.has(t.id)) return false;
    const busyMap = teacherBusyBySlot?.get(t.id);
    if (busyMap && busyMap.has(slot.id)) {
      const existingSecId = busyMap.get(slot.id);
      if (existingSecId && existingSecId !== section.id) return false;
    }
    if (matchesUnavailablePeriod(slot, t.unavailablePeriods)) return false;
    const restrictedPeriods = getTeacherRestrictedPeriods(t.id, config?.constraints, t);
    if (matchesRestrictedPeriod(slot, restrictedPeriods)) return false;
    return true;
  };

  const isWithinLoadCap = (t) => {
    if (!enforceCap) return true;
    return (teacherLoad?.get(t.id) || 0) < maxCap;
  };

  configuredStreams.forEach((stream, streamIdx) => {
    let pickedTeacher = null;
    const qualificationTarget =
      stream.requiredMajor && stream.requiredMajor !== "auto" ? stream.requiredMajor : stream.name;

    // Priority 0: Section Continuity (reuse the same teacher assigned to this stream in earlier periods of this section)
    const prefTeacherId = Array.isArray(preferredBreakouts) ? preferredBreakouts[streamIdx]?.teacherId : "";
    if (prefTeacherId) {
      const prefT = activeTeachers.find((t) => t.id === prefTeacherId);
      if (prefT && isCandidateFreeAndUnrestricted(prefT) && isWithinLoadCap(prefT)) {
        pickedTeacher = prefT;
      }
    }

    // Priority 1: Designated Stream Default Teacher
    if (!pickedTeacher && stream.defaultTeacherId) {
      const defT = activeTeachers.find((t) => t.id === stream.defaultTeacherId);
      if (defT && isCandidateFreeAndUnrestricted(defT)) {
        pickedTeacher = defT;
      }
    }

    // Priority 2: Stream-Level Specialization / Major Match within Load Cap
    if (!pickedTeacher && qualificationTarget) {
      const specializedCandidates = activeTeachers.filter(
        (t) =>
          isCandidateFreeAndUnrestricted(t) &&
          isWithinLoadCap(t) &&
          getTeacherStreamQualificationTier(t, qualificationTarget, stream.requiredMajor) >= 2
      );
      if (specializedCandidates.length > 0) {
        specializedCandidates.sort((a, b) => {
          const tierA = getTeacherStreamQualificationTier(a, qualificationTarget, stream.requiredMajor);
          const tierB = getTeacherStreamQualificationTier(b, qualificationTarget, stream.requiredMajor);
          if (tierA !== tierB) return tierB - tierA;
          const loadA = teacherLoad?.get(a.id) || 0;
          const loadB = teacherLoad?.get(b.id) || 0;
          const aHas = loadA > 0 ? 1 : 0;
          const bHas = loadB > 0 ? 1 : 0;
          if (aHas !== bHas) return bHas - aHas;
          return loadB - loadA;
        });
        pickedTeacher = specializedCandidates[0];
      }
    }

    // Priority 3: Subject / Department Match within Load Cap
    if (!pickedTeacher) {
      const subjectCandidates = activeTeachers.filter(
        (t) =>
          isCandidateFreeAndUnrestricted(t) &&
          isWithinLoadCap(t) &&
          (doesTeacherMatchSubject(t, subject) ||
            getTeacherStreamQualificationTier(t, stream.name, stream.requiredMajor) >= 1) &&
          doesTeacherMatchGrade(t, section.grade)
      );
      if (subjectCandidates.length > 0) {
        subjectCandidates.sort((a, b) => {
          const tierA = getTeacherStreamQualificationTier(a, stream.name, stream.requiredMajor);
          const tierB = getTeacherStreamQualificationTier(b, stream.name, stream.requiredMajor);
          if (tierA !== tierB) return tierB - tierA;
          const expA = getTeacherExpertiseTier(a, subject);
          const expB = getTeacherExpertiseTier(b, subject);
          if (expA !== expB) return expB - expA;
          const loadA = teacherLoad?.get(a.id) || 0;
          const loadB = teacherLoad?.get(b.id) || 0;
          const aHas = loadA > 0 ? 1 : 0;
          const bHas = loadB > 0 ? 1 : 0;
          if (aHas !== bHas) return bHas - aHas;
          return loadB - loadA;
        });
        pickedTeacher = subjectCandidates[0];
      }
    }

    // Priority 4: Load-Cap Relaxation for Qualified Stream / Subject Teachers
    if (!pickedTeacher) {
      const relaxedQualified = activeTeachers.filter(
        (t) =>
          isCandidateFreeAndUnrestricted(t) &&
          (getTeacherStreamQualificationTier(t, qualificationTarget, stream.requiredMajor) >= 1 ||
            doesTeacherMatchSubject(t, subject))
      );
      if (relaxedQualified.length > 0) {
        relaxedQualified.sort((a, b) => {
          const tierA = getTeacherStreamQualificationTier(a, qualificationTarget, stream.requiredMajor);
          const tierB = getTeacherStreamQualificationTier(b, qualificationTarget, stream.requiredMajor);
          if (tierA !== tierB) return tierB - tierA;
          return (teacherLoad?.get(a.id) || 0) - (teacherLoad?.get(b.id) || 0);
        });
        pickedTeacher = relaxedQualified[0];
      }
    }

    // Priority 5: Any Free & Unrestricted Active Teacher Matching Section Grade (when subject is generic/custom joined)
    if (!pickedTeacher) {
      const generalPool = activeTeachers.filter(
        (t) => isCandidateFreeAndUnrestricted(t) && doesTeacherMatchGrade(t, section.grade)
      );
      if (generalPool.length > 0) {
        generalPool.sort((a, b) => (teacherLoad?.get(a.id) || 0) - (teacherLoad?.get(b.id) || 0));
        pickedTeacher = generalPool[0];
      }
    }

    if (pickedTeacher) {
      usedTeacherIds.add(pickedTeacher.id);
      chosenStreams.push({
        stream: stream.name || `Stream ${streamIdx + 1}`,
        teacherId: pickedTeacher.id,
        teacherName: pickedTeacher.name,
        teacherObj: pickedTeacher,
      });
    } else {
      chosenStreams.push({
        stream: stream.name || `Stream ${streamIdx + 1}`,
        teacherId: "",
        teacherName: "",
        teacherObj: null,
      });
    }
  });

  const assignedValidCount = chosenStreams.filter((cs) => Boolean(cs.teacherId)).length;
  return {
    isComplete: assignedValidCount === requiredCount,
    assignedValidCount,
    requiredCount,
    chosenStreams,
  };
}

function getTeacherExpertiseTier(teacher, subject) {
  if (!teacher || !subject) return 0;
  const primary = teacher.primaryExpertise?.length ? teacher.primaryExpertise : teacher.subjectExpertise;
  if (checkExactExpertiseMatch(primary, subject)) return 3; // Exact single-subject expertise (Top Priority)
  if (checkExpertiseMatch(primary, subject)) return 2; // Primary department expertise (Preferred)
  if (checkExpertiseMatch(teacher.secondaryExpertise, subject)) return 1; // Secondary expertise (Fallback)
  const totalExp = [...(primary || []), ...(teacher.secondaryExpertise || [])];
  if (totalExp.length === 0) return 1; // Unspecified expertise matches all

  // Homeroom / Advisory / HGP:
  // In DepEd, Homeroom Guidance is conducted by the Class Adviser (who is an academic subject teacher).
  // Any active teacher is eligible to be the Class Adviser / Homeroom teacher!
  if (isHomeroomOrAdvisorySubject(subject)) {
    return 1;
  }

  return 0;
}

function doesTeacherMatchSubject(teacher, subject) {
  if (isHomeroomOrAdvisorySubject(subject)) {
    return true;
  }
  return getTeacherExpertiseTier(teacher, subject) > 0;
}

function isChecklistTeacherEligible(teacher, section, subject, constraints) {
  if (!teacher || teacher.active === false) return false;
  if (constraints?.enforceExpertiseAndGradeMatch === false) return true;
  if (section && !doesTeacherMatchGrade(teacher, section.grade)) return false;
  if (subject && !doesTeacherMatchSubject(teacher, subject)) return false;
  return true;
}

function buildTeacherBusyMap(assignments, sectionsById, slotsById) {
  const teacherBusyBySlot = new Map();

  Object.entries(assignments || {}).forEach(([cellKey, value]) => {
    const [sectionId, slotId] = splitCellKey(cellKey);
    if (!sectionsById.has(sectionId) || !slotsById.has(slotId) || !value) {
      return;
    }

    const assignedTeachers = [];
    if (value.teacherId) assignedTeachers.push(value.teacherId);
    if (Array.isArray(value.coTeacherIds)) {
      value.coTeacherIds.forEach((id) => {
        if (id && !assignedTeachers.includes(id)) assignedTeachers.push(id);
      });
    }
    if (Array.isArray(value.breakoutAssignments)) {
      value.breakoutAssignments.forEach((b) => {
        if (b?.teacherId && !assignedTeachers.includes(b.teacherId)) assignedTeachers.push(b.teacherId);
      });
    }

    assignedTeachers.forEach((tId) => {
      const teacherMap = teacherBusyBySlot.get(tId) || new Map();
      teacherMap.set(slotId, sectionId);
      teacherBusyBySlot.set(tId, teacherMap);
    });
  });

  return teacherBusyBySlot;
}

function persistFacultyLoadPercent(teacherLoadPercent) {
  const facultyList = loadJson(FACULTY_STORAGE_KEY, []);
  if (!Array.isArray(facultyList)) {
    return;
  }

  // Use the same thresholds as FacultyManagement.js
  // 80% of maxBalanced is the minimum for 'Balanced', >100% is 'Overload'
  // We'll use 100 as maxBalanced (percent), so:
  // Unassigned: 0
  // Underload: <80
  // Balanced: 80-100
  // Overload: >100

  const minBalancedPercent = 75; // 75% to 105% (e.g. 18-25 periods on a 24-period cap) represents statutory DepEd Balanced load
  const maxBalancedPercent = 105;

  const updated = facultyList.map((teacher) => {
    const nextPercent = Number.isFinite(teacherLoadPercent?.[teacher.id]) ? teacherLoadPercent[teacher.id] : Number(teacher.assignedLoadPercent) || 0;
    let assignedLoadStatus = "Unassigned";
    if (nextPercent === 0) {
      assignedLoadStatus = "Unassigned";
    } else if (nextPercent < minBalancedPercent) {
      assignedLoadStatus = "Underload";
    } else if (nextPercent <= maxBalancedPercent) {
      assignedLoadStatus = "Balanced";
    } else if (nextPercent > maxBalancedPercent) {
      assignedLoadStatus = "Overload";
    }
    return {
      ...teacher,
      assignedLoadPercent: nextPercent,
      assignedLoadStatus,
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
  window.dispatchEvent(new Event("turotugma_faculty_updated"));
}

function buildEffectiveTeacherRestrictions(configRestrictions, facultyList) {
  const map = new Map();
  const activeFacultyById = new Map();

  (Array.isArray(facultyList) ? facultyList : []).forEach((teacher) => {
    const teacherId = sanitizeText(teacher?.id);
    if (!teacherId || teacher.active === false) {
      return;
    }
    activeFacultyById.set(teacherId, teacher);
  });

  normalizeTeacherRestrictions(configRestrictions).forEach((entry) => {
    const liveTeacher = activeFacultyById.get(entry.teacherId);
    if (!liveTeacher) {
      return;
    }
    map.set(entry.teacherId, {
      teacherId: entry.teacherId,
      teacherName: sanitizeText(liveTeacher.name) || sanitizeText(entry.teacherName) || entry.teacherId,
      periodLabels: normalizeStringArray(entry.periodLabels),
      updatedAt: normalizeTimestamp(entry.updatedAt),
    });
  });

  activeFacultyById.forEach((teacher, teacherId) => {
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
  const otherDrafts = (drafts || []).filter((draft) => draft.id !== draftToSave.id);
  return [draftToSave, ...otherDrafts]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 10);
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

  const parseLevelConfig = (savedLevel, defaultLevel, levelKey = "jhs") => {
    if (!savedLevel || typeof savedLevel !== "object") return defaultLevel;

    let dayAssignments = savedLevel.dayAssignments || null;
    let regularDays = [];
    let shortenedDays = [];

    if (dayAssignments && typeof dayAssignments === "object") {
      DAYS.forEach((day) => {
        const assignment = dayAssignments[day];
        if (assignment === "regular") regularDays.push(day);
        else if (assignment === "shortened") shortenedDays.push(day);
      });
    } else {
      regularDays = normalizeDays(savedLevel.regularDays);
      shortenedDays = normalizeDays(savedLevel.shortenedDays);
      const defaultWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      defaultWeekdays.forEach((day) => {
        if (!regularDays.includes(day) && !shortenedDays.includes(day)) {
          regularDays.push(day);
        }
      });
      regularDays.sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
    }

    if (regularDays.length === 0 && shortenedDays.length === 0) {
      regularDays = defaultLevel.regularDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      shortenedDays = defaultLevel.shortenedDays || [];
    }

    const schoolStartTime = sanitizeText(savedLevel.schoolStartTime) || defaultLevel.schoolStartTime || "07:30";
    const schoolEndTime = sanitizeText(savedLevel.schoolEndTime) || defaultLevel.schoolEndTime || "17:00";

    const regDuration = savedLevel.sessions?.regular?.duration || savedLevel.periodMinutes?.regular || defaultLevel.periodMinutes?.regular || 60;
    const shortDuration = savedLevel.sessions?.shortened?.duration || savedLevel.periodMinutes?.shortened || defaultLevel.periodMinutes?.shortened || 45;

    const breaks = {
      morning: savedLevel.sessions?.regular?.breaks?.morning || savedLevel.breaks?.morning || defaultLevel.breaks?.morning || { enabled: true, duration: 20, afterPeriod: 2 },
      lunch: savedLevel.sessions?.regular?.breaks?.lunch || savedLevel.breaks?.lunch || defaultLevel.breaks?.lunch || { enabled: true, duration: 60, afterPeriod: 4 },
      afternoon: savedLevel.sessions?.regular?.breaks?.afternoon || savedLevel.breaks?.afternoon || defaultLevel.breaks?.afternoon || { enabled: false, duration: 15, afterPeriod: 6 },
    };

    const regPeriods = Math.max(1, Math.min(10, Number(savedLevel.sessions?.regular?.manualPeriodCount || savedLevel.periods?.regular || defaultLevel.periods?.regular || 8)));
    const shortPeriods = Math.max(1, Math.min(10, Number(savedLevel.sessions?.shortened?.manualPeriodCount || savedLevel.periods?.shortened || defaultLevel.periods?.shortened || 6)));
    const specialPeriods = Math.max(1, Math.min(10, Number(savedLevel.periods?.special || regPeriods)));

    return {
      ...defaultLevel,
      ...savedLevel,
      periodStructureMode: "configured",
      periodCalculationMode: "manual",
      schoolStartTime,
      schoolEndTime,
      dayAssignments,
      regularDays,
      shortenedDays,
      periodMinutes: { regular: regDuration, shortened: shortDuration },
      periods: { regular: regPeriods, shortened: shortPeriods, special: specialPeriods, default: regPeriods, track: savedLevel.periods?.track || defaultLevel.periods?.track || { HUMSS: regPeriods, STEM: regPeriods, ABM: regPeriods, TVL: regPeriods, GAS: regPeriods } },
      breaks,
      constraints: {
        ...(defaultLevel.constraints || {}),
        ...(savedLevel.constraints || {}),
      },
    };
  };

  const parsedJhs = parseLevelConfig(saved.jhs, DEFAULT_CONFIG.jhs, "jhs");
  const parsedShs = parseLevelConfig(saved.shs, DEFAULT_CONFIG.shs, "shs");

  parsedJhs.constraints = {
    ...DEFAULT_CONFIG.constraints,
    ...(saved.constraints || {}),
    ...(saved.jhs?.constraints || {}),
  };
  parsedShs.constraints = {
    ...DEFAULT_CONFIG.constraints,
    ...(saved.constraints || {}),
    ...(saved.shs?.constraints || {}),
  };

  const rootConstraints = {
    ...DEFAULT_CONFIG.constraints,
    ...(saved.constraints || {}),
    ...(saved.jhs?.constraints || {}),
    subjectPlacementRules: [
      ...(Array.isArray(saved.constraints?.subjectPlacementRules) ? saved.constraints.subjectPlacementRules : []),
      ...(Array.isArray(saved.jhs?.constraints?.subjectPlacementRules) ? saved.jhs.constraints.subjectPlacementRules : []),
      ...(Array.isArray(saved.shs?.constraints?.subjectPlacementRules) ? saved.shs.constraints.subjectPlacementRules : []),
    ],
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
  };

  const parsedSpaSettings = saved.spaSettings && typeof saved.spaSettings === "object"
    ? {
        requiredCount: parseBoundedNumber(saved.spaSettings.requiredCount, 1, 6, 3),
        specializations: Array.isArray(saved.spaSettings.specializations) && saved.spaSettings.specializations.length > 0
          ? saved.spaSettings.specializations.map((s) => ({
              name: sanitizeText(s?.name) || "Specialization",
              defaultTeacherId: sanitizeText(s?.defaultTeacherId) || "",
            }))
          : DEFAULT_CONFIG.spaSettings.specializations,
      }
    : DEFAULT_CONFIG.spaSettings;

  return {
    jhs: parsedJhs,
    shs: parsedShs,
    constraints: rootConstraints,
    spaSettings: parsedSpaSettings,
  };
}

function parseBoundedNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
}

function parseBoundedDecimal(value, min, max, fallback) {
  const parsed = Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
}

function getSubjectDailySlotRequirement(subject, scheduleType, config) {
  const classesPerWeek = parseBoundedNumber(subject?.classesPerWeek, 1, 12, 0);
  const weeklyHours = parseBoundedDecimal(subject?.hoursPerWeek, 1, 12, 1);

  if (classesPerWeek > 0) {
    return classesPerWeek;
  }

  if (scheduleType !== "jhs") {
    return Math.max(1, Math.round(weeklyHours));
  }

  const weeklyMinutesPerDailySlot = getJhsWeeklyMinutesPerDailySlot(config?.jhs);
  if (!Number.isFinite(weeklyMinutesPerDailySlot) || weeklyMinutesPerDailySlot <= 0) {
    return Math.max(1, Math.round(weeklyHours));
  }

  const required = Math.ceil((weeklyHours * 60) / weeklyMinutesPerDailySlot);
  return Math.max(1, required);
}

function getJhsWeeklyMinutesPerDailySlot(jhsConfig) {
  const regularDays = normalizeDays(jhsConfig?.regularDays).length;
  const shortenedDays = normalizeDays(jhsConfig?.shortenedDays).length;
  const regularMinutes = parseBoundedNumber(jhsConfig?.periodMinutes?.regular, 30, 90, 50);
  const shortenedMinutes = parseBoundedNumber(jhsConfig?.periodMinutes?.shortened, 30, 90, 45);

  return regularDays * regularMinutes + shortenedDays * shortenedMinutes;
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

function doesJhsSubjectMatchGrade(subject, grade) {
  const targetGrade = Number.parseInt(grade, 10);
  if (!Number.isFinite(targetGrade)) {
    return true;
  }

  // 1. Check explicit gradeLevel field first
  const gradeText = sanitizeText(subject?.gradeLevel).toLowerCase();
  
  // Range check in gradeLevel (e.g. "7-10", "Grades 7–10", "7 - 10")
  const rangeMatch = gradeText.match(/(\d{1,2})\s*[-–—]\s*(\d{1,2})/u);
  if (rangeMatch) {
    const rangeStart = Number.parseInt(rangeMatch[1], 10);
    const rangeEnd = Number.parseInt(rangeMatch[2], 10);
    if (Number.isFinite(rangeStart) && Number.isFinite(rangeEnd)) {
      return targetGrade >= Math.min(rangeStart, rangeEnd) && targetGrade <= Math.max(rangeStart, rangeEnd);
    }
  }

  if (gradeText === "7-10" || gradeText === "7–10" || gradeText === "jhs" || gradeText.includes("universal") || gradeText.includes("shared")) {
    return true;
  }

  // Exact single grade in gradeLevel field (e.g. "7", "Grade 7")
  const exactGradeMatch = gradeText.match(/^(?:grade\s*)?(\d{1,2})$/u);
  if (exactGradeMatch) {
    return Number.parseInt(exactGradeMatch[1], 10) === targetGrade;
  }

  // 2. Check title / code for explicit grade specification (e.g. "Grade 7", "G7", "Science 7")
  const nameOrCode = `${subject?.subjectName || ""} ${subject?.subjectCode || ""}`.toLowerCase();
  
  // Check if name has a range like "7-10"
  const nameRangeMatch = nameOrCode.match(/(\d{1,2})\s*[-–—]\s*(\d{1,2})/u);
  if (nameRangeMatch) {
    const rStart = Number.parseInt(nameRangeMatch[1], 10);
    const rEnd = Number.parseInt(nameRangeMatch[2], 10);
    if (Number.isFinite(rStart) && Number.isFinite(rEnd)) {
      return targetGrade >= Math.min(rStart, rEnd) && targetGrade <= Math.max(rStart, rEnd);
    }
  }

  const explicitGradeMatch =
    nameOrCode.match(/\b(?:grade|gr|g)\s*[-.]?\s*(7|8|9|10)\b/u) ||
    nameOrCode.match(/\b(?:math|science|english|filipino|ap|ve|mapeh|tle|ict)\s*(7|8|9|10)\b/u);
  if (explicitGradeMatch) {
    const subjectGradeNum = Number.parseInt(explicitGradeMatch[1], 10);
    return subjectGradeNum === targetGrade;
  }

  return true;
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

function formatConflictSectionName(section) {
  const label = formatSectionDisplayName(section);
  if (section?.level !== "jhs") {
    return label;
  }

  const compactFormat = label.match(/^(\d+)\s*-\s*(.+)$/u);
  if (compactFormat) {
    return `${compactFormat[1]} - ${compactFormat[2]}`;
  }

  const noSpaceFormat = label.match(/^(\d+)-(.+)$/u);
  if (noSpaceFormat) {
    return `${noSpaceFormat[1]} - ${noSpaceFormat[2]}`;
  }

  return label;
}

function formatPeriodOrdinalLabel(slot) {
  const rawNum = typeof slot === "number" ? slot : (slot?.period ?? slot);
  let periodNumber = Number.parseInt(rawNum, 10);
  if (!Number.isFinite(periodNumber) || periodNumber <= 0) {
    const digits = String(slot?.label || slot?.id || slot || "").replace(/\D/g, "");
    periodNumber = Number.parseInt(digits, 10);
  }
  if (!Number.isFinite(periodNumber) || periodNumber <= 0) {
    return sanitizeText(slot?.label) || "this period";
  }

  const mod100 = periodNumber % 100;
  const mod10 = periodNumber % 10;
  const suffix = mod100 >= 11 && mod100 <= 13 ? "th" : mod10 === 1 ? "st" : mod10 === 2 ? "nd" : mod10 === 3 ? "rd" : "th";
  return `${periodNumber}${suffix} Period`;
}

function formatDayPeriodOrdinalLabel(slot) {
  if (!slot) return "this period";
  const periodLabel = formatPeriodOrdinalLabel(slot);
  const day = sanitizeText(slot?.day);
  if (day && periodLabel !== "this period") {
    return `${day} ${periodLabel}`;
  }
  return periodLabel;
}

function formatSubjectDisplayName(subject, fallback = "Subject") {
  return sanitizeText(subject?.subjectName || subject?.name || subject?.subjectCode || subject?.code) || fallback;
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

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[saveJson] Failed to write to localStorage for key "${key}":`, err);
    try {
      if (key === DRAFTS_STORAGE_KEY && Array.isArray(value)) {
        // Fallback: prune drafts to 5
        window.localStorage.setItem(key, JSON.stringify(value.slice(0, 5)));
        return;
      }
      const existingDrafts = JSON.parse(window.localStorage.getItem(DRAFTS_STORAGE_KEY) || '[]');
      if (Array.isArray(existingDrafts) && existingDrafts.length > 3) {
        window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(existingDrafts.slice(0, 3)));
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (innerErr) {
      console.error(`[saveJson] Fallback failed for key "${key}":`, innerErr);
    }
  }
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

function gridCellStyle(allowed, hasAssignment, hasConflict = false, hasValidAssignment = false) {
  return {
    borderBottom: "1px solid #e7ecf6",
    borderRight: hasConflict ? "1px solid #f0c9cf" : hasValidAssignment ? "1px solid #cde8d4" : "1px solid #edf1f9",
    background: !allowed ? "#f7f8fc" : hasConflict ? "#fff1f3" : hasValidAssignment ? "#edf8f0" : hasAssignment ? "#eef2ff" : "#ffffff",
    textAlign: "center",
    verticalAlign: "middle",
    padding: 6,
    minHeight: 56,
    boxShadow: hasConflict
      ? "inset 0 0 0 2px #e7a7b0"
      : hasValidAssignment
        ? "inset 0 0 0 1px #cde8d4"
        : "none",
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

function WarningIcon() {
  return (
    <ActionIcon>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
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

function ExportPdfIcon() {
  return (
    <ActionIcon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="12" y2="18" />
      <line x1="15" y1="15" x2="12" y2="18" />
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

function RestrictionIcon() {
  return (
    <ActionIcon>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </ActionIcon>
  );
}

function CheckCircleIcon() {
  return (
    <ActionIcon>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </ActionIcon>
  );
}

function TeachersCardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SectionsCardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ShieldCheckCardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function ShieldAlertCardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function StatusCardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M9 16l2 2 4-4" />
    </svg>
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

function getConflictResolutions({
  conflict,
  conflictDetail,
  index,
  optionIndex = 0,
  sections,
  slots,
  subjects,
  activeTeachers,
  facultyById,
  subjectsById,
  slotsById,
  sectionsById,
  config,
  scheduleType,
  schedule,
  cellEditorDrafts,
}) {
  const currentAssignments = { ...(schedule?.assignments || {}) };
  const currentDrafts = { ...(cellEditorDrafts || {}) };
  const cellKeys = Array.isArray(conflictDetail?.cellKeys) ? conflictDetail.cellKeys : [];
  const message = String(conflict || conflictDetail?.message || "");

  const options = [];
  let category = "Schedule Conflict";
  let severity = "critical";

  const busyMap = buildTeacherBusyMap(currentAssignments, sectionsById, slotsById);
  const normalizeSectionString = (value) => String(value || "").replace(/\s+/g, "").replace(/[-–—]/g, "").toLowerCase();

  const findSectionByLabel = (label) => {
    let sectionObj = sections.find((sec) => normalizeSectionString(formatConflictSectionName(sec)) === normalizeSectionString(label));
    if (!sectionObj) {
      sectionObj = sections.find((sec) => {
        const code = sec.code || "";
        const name = sec.name || "";
        const grade = sec.grade ? String(sec.grade) : "";
        return (
          normalizeSectionString(code) === normalizeSectionString(label) ||
          normalizeSectionString(name) === normalizeSectionString(label) ||
          normalizeSectionString(`${grade}${name}`) === normalizeSectionString(label) ||
          normalizeSectionString(`${grade}-${name}`) === normalizeSectionString(label)
        );
      });
    }
    return sectionObj;
  };

  // 1. TEACHER MULTIPLE-BOOKING / DOUBLE-BOOKING
  const isMultipleBooking =
    message.includes("double-booked") ||
    message.includes("triple-booked") ||
    message.includes("multiple-booked") ||
    message.includes("booked at");

  if (isMultipleBooking) {
    category = "Teacher Double-Booking";
    severity = "critical";

    cellKeys.forEach((cellKey) => {
      const [secId, slotId] = splitCellKey(cellKey);
      const section = sectionsById.get(secId);
      const slot = slotsById.get(slotId);
      const asgn = currentDrafts[cellKey] || currentAssignments[cellKey];
      const subject = asgn?.subjectId ? subjectsById.get(asgn.subjectId) : null;
      const currentTeacher = asgn?.teacherId ? facultyById.get(asgn.teacherId) : null;

      if (!section || !slot || !subject || !currentTeacher) return;

      // Option A: Substitute with another qualified teacher for this section
      const candidates = activeTeachers.filter(
        (t) =>
          t.id !== currentTeacher.id &&
          isTeacherEligible({
            teacher: t,
            subject,
            section,
            slot,
            constraints: config?.constraints,
            teacherBusyBySlot: busyMap,
            excludedSectionId: section.id,
          })
      );

      candidates.slice(0, 2).forEach((cand) => {
        options.push({
          label: `Substitute with ${cand.name}`,
          description: `Assign ${cand.name} to teach ${formatSubjectDisplayName(subject)} for ${section.name} at ${formatDayPeriodOrdinalLabel(slot)}.`,
          apply: () => {
            const nextAssignments = {
              ...currentAssignments,
              [cellKey]: { subjectId: subject.id, teacherId: cand.id, source: "conflict-fix", updatedAt: new Date().toISOString() },
            };
            const nextDrafts = { ...currentDrafts, [cellKey]: { subjectId: subject.id, teacherId: cand.id } };
            return { nextAssignments, nextDrafts };
          },
        });
      });

      // Option B: Move this section's subject to an open slot where currentTeacher is free
      const placementRules1 = getAllPlacementRules(config, scheduleType);
      const isSubjDynLast = isDynamicLastPeriodSubject(subject, placementRules1);
      const validSlots = slots.filter((s) => isSlotValidForSection(section, s, scheduleType, config));
      const openSlots = validSlots.filter((s) => {
        const ck = createCellKey(section.id, s.id);
        if (currentAssignments[ck] || busyMap.get(currentTeacher.id)?.has(s.id)) return false;
        if (
          isSubjectRestrictedForSlot(subject, s, config?.constraints, config, scheduleType, {
            section,
            assignments: currentAssignments,
            slotsById,
            subjectsById,
            excludeCellKey: cellKey,
          })
        ) {
          return false;
        }
        if (!isSubjDynLast) {
          const targetLastInfo = getDynamicLastPeriodInfo({
            sectionId: section.id,
            day: s.day,
            assignments: currentAssignments,
            slotsById,
            subjectsById,
            placementRules: placementRules1,
            excludeCellKey: cellKey,
            dayMaxPeriod: getSectionDayMaxPeriod(section, s.day, scheduleType, config, s),
          });
          if (targetLastInfo.otherLastPeriods.length > 0 && Number(s.period || 0) >= Math.min(...targetLastInfo.otherLastPeriods)) {
            return false;
          }
        }
        return true;
      });

      openSlots.slice(0, 2).forEach((openSlot) => {
        options.push({
          label: `Move class to ${formatDayPeriodOrdinalLabel(openSlot)}`,
          description: `Relocate ${formatSubjectDisplayName(subject)} for ${section.name} to ${formatDayPeriodOrdinalLabel(openSlot)} where ${currentTeacher.name} is free.`,
          apply: () => {
            const targetKey = createCellKey(section.id, openSlot.id);
            const nextAssignments = { ...currentAssignments };
            delete nextAssignments[cellKey];
            nextAssignments[targetKey] = { subjectId: subject.id, teacherId: currentTeacher.id, source: "conflict-fix", updatedAt: new Date().toISOString() };
            const nextDrafts = { ...currentDrafts };
            delete nextDrafts[cellKey];
            nextDrafts[targetKey] = { subjectId: subject.id, teacherId: currentTeacher.id };
            return { nextAssignments, nextDrafts };
          },
        });
      });

      // Option C: Intra-section swap with another period in this section
      const otherSectionCells = Object.keys(currentAssignments).filter(
        (ck) => splitCellKey(ck)[0] === section.id && ck !== cellKey
      );

      for (const otherCk of otherSectionCells.slice(0, 6)) {
        if (isSubjDynLast) break;
        const [, otherSlotId] = splitCellKey(otherCk);
        const otherSlot = slotsById.get(otherSlotId);
        const otherAsgn = currentDrafts[otherCk] || currentAssignments[otherCk];
        const otherSubj = otherAsgn?.subjectId ? subjectsById.get(otherAsgn.subjectId) : null;
        const otherTeacher = otherAsgn?.teacherId ? facultyById.get(otherAsgn.teacherId) : null;

        if (!otherSlot || !otherSubj || !otherTeacher) continue;
        if (otherSubj.id === subject.id) continue;
        if (isPlacementLockedSubject(otherSubj, placementRules1)) continue;
        if (
          isSubjectRestrictedForSlot(subject, otherSlot, config?.constraints, config, scheduleType, {
            section,
            assignments: currentAssignments,
            slotsById,
            subjectsById,
            excludeCellKey: otherCk,
          })
        ) continue;
        if (
          isSubjectRestrictedForSlot(otherSubj, slot, config?.constraints, config, scheduleType, {
            section,
            assignments: currentAssignments,
            slotsById,
            subjectsById,
            excludeCellKey: cellKey,
          })
        ) continue;

        if (otherSlot.day !== slot.day) {
          const slotLastInfo = getDynamicLastPeriodInfo({
            sectionId: section.id,
            day: slot.day,
            assignments: currentAssignments,
            slotsById,
            subjectsById,
            placementRules: placementRules1,
            excludeCellKey: cellKey,
            dayMaxPeriod: getSectionDayMaxPeriod(section, slot.day, scheduleType, config, slot),
          });
          const otherLastInfo = getDynamicLastPeriodInfo({
            sectionId: section.id,
            day: otherSlot.day,
            assignments: currentAssignments,
            slotsById,
            subjectsById,
            placementRules: placementRules1,
            excludeCellKey: otherCk,
            dayMaxPeriod: getSectionDayMaxPeriod(section, otherSlot.day, scheduleType, config, otherSlot),
          });
          if (slotLastInfo.otherLastPeriods.length > 0 && Number(slot.period || 0) >= Math.min(...slotLastInfo.otherLastPeriods)) continue;
          if (otherLastInfo.otherLastPeriods.length > 0 && Number(otherSlot.period || 0) >= Math.min(...otherLastInfo.otherLastPeriods)) continue;
        }

        const curTeacherFreeAtOther = isTeacherEligible({ teacher: currentTeacher, subject, section, slot: otherSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: section.id });
        const otherTeacherFreeAtCur = isTeacherEligible({ teacher: otherTeacher, subject: otherSubj, section, slot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: section.id });

        if (curTeacherFreeAtOther && otherTeacherFreeAtCur) {
          options.push({
            label: `Swap with ${formatSubjectDisplayName(otherSubj)} (${formatDayPeriodOrdinalLabel(otherSlot)})`,
            description: `Swap periods within ${section.name}: move ${formatSubjectDisplayName(subject)} to ${formatDayPeriodOrdinalLabel(otherSlot)} and ${formatSubjectDisplayName(otherSubj)} to ${formatDayPeriodOrdinalLabel(slot)}.`,
            apply: () => {
              const nextAssignments = {
                ...currentAssignments,
                [cellKey]: { subjectId: otherSubj.id, teacherId: otherTeacher.id, source: "conflict-fix", updatedAt: new Date().toISOString() },
                [otherCk]: { subjectId: subject.id, teacherId: currentTeacher.id, source: "conflict-fix", updatedAt: new Date().toISOString() },
              };
              const nextDrafts = {
                ...currentDrafts,
                [cellKey]: { subjectId: otherSubj.id, teacherId: otherTeacher.id },
                [otherCk]: { subjectId: subject.id, teacherId: currentTeacher.id },
              };
              return { nextAssignments, nextDrafts };
            },
          });
          break;
        }
      }
    });

    if (cellKeys.length > 0) {
      const fallbackKey = cellKeys[cellKeys.length - 1];
      const [fSecId, fSlotId] = splitCellKey(fallbackKey);
      const fSec = sectionsById.get(fSecId);
      const fSlot = slotsById.get(fSlotId);
      options.push({
        label: `Unassign ${fSec?.name || 'Section'} at ${fSlot ? formatDayPeriodOrdinalLabel(fSlot) : 'this slot'}`,
        description: `Clear this cell to immediately eliminate the clash and reschedule cleanly.`,
        apply: () => {
          const nextAssignments = { ...currentAssignments };
          delete nextAssignments[fallbackKey];
          const nextDrafts = { ...currentDrafts };
          delete nextDrafts[fallbackKey];
          return { nextAssignments, nextDrafts };
        },
      });
    }
  }

  // 2. UNDER-SCHEDULED SUBJECT (Missing required recurring daily periods)
  else if (message.includes("required recurring daily period")) {
    category = "Missing Weekly Period";
    severity = "critical";

    const match = message.match(/^(.*?):\s*(.*?)\s+has\s+(\d+)\s+of\s+(\d+)\s+required recurring daily period/i);
    let targetSection = null;
    let targetSubject = null;
    let requiredCount = 0;

    if (match) {
      const secLabel = match[1].trim();
      const subLabel = match[2].trim();
      requiredCount = parseInt(match[4], 10) || 0;

      targetSection = findSectionByLabel(secLabel);

      if (targetSection) {
        const eligibleSubjs = getSubjectsForSection(targetSection, subjects, scheduleType);
        targetSubject = eligibleSubjs.find(
          (s) =>
            (s.subjectName || "").trim().toLowerCase() === subLabel.toLowerCase() ||
            (s.subjectCode || "").trim().toLowerCase() === subLabel.toLowerCase() ||
            (s.name || "").trim().toLowerCase() === subLabel.toLowerCase() ||
            (s.code || "").trim().toLowerCase() === subLabel.toLowerCase() ||
            s.id === subLabel
        );
      }
    }

    if (targetSection && targetSubject) {
      const sectionCellKeys = Object.keys(currentAssignments).filter((ck) => splitCellKey(ck)[0] === targetSection.id);
      const levelConfig = scheduleType === "jhs" ? config?.jhs : config?.shs;
      const activeDaysList = extractDaysFromLevelConfig(levelConfig)?.daySequence || [];
      const totalDaysCount = activeDaysList.length || 5;
      const isDouble = Boolean(targetSubject.isDoublePeriod);
      const maxPerDay = isDouble ? 2 : (requiredCount > totalDaysCount ? Math.ceil(requiredCount / totalDaysCount) : 1);

      const validSlots = slots.filter((s) => isSlotValidForSection(targetSection, s, scheduleType, config));
      const emptySlots = validSlots.filter((s) => !currentAssignments[createCellKey(targetSection.id, s.id)]);

      let assignedTeacher = null;
      sectionCellKeys.forEach((ck) => {
        const a = currentAssignments[ck];
        if (a?.subjectId === targetSubject.id && a?.teacherId) {
          assignedTeacher = facultyById.get(a.teacherId);
        }
      });

      const candidateSlots = emptySlots.filter((slot) => {
        const day = slot.day || "Monday";
        const currentDayCount = sectionCellKeys.filter((ck) => {
          const [, sId] = splitCellKey(ck);
          const s = slotsById.get(sId);
          if (s?.day !== day) return false;
          const a = currentDrafts[ck] || currentAssignments[ck];
          return a?.subjectId === targetSubject.id;
        }).length;
        if (currentDayCount >= maxPerDay) return false;
        if (isSubjectRestrictedForSlot(targetSubject, slot, config?.constraints, config, scheduleType)) return false;
        return true;
      });

      for (const emptySlot of candidateSlots) {
        let teacher = assignedTeacher && isTeacherEligible({ teacher: assignedTeacher, subject: targetSubject, section: targetSection, slot: emptySlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: targetSection.id }) ? assignedTeacher : null;
        if (!teacher) {
          teacher = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: targetSubject, section: targetSection, slot: emptySlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: targetSection.id }));
        }

        if (teacher) {
          options.push({
            label: `Schedule in open slot (${formatDayPeriodOrdinalLabel(emptySlot)})`,
            description: `Assign ${formatSubjectDisplayName(targetSubject)} with ${teacher.name} into ${formatDayPeriodOrdinalLabel(emptySlot)}.`,
            apply: () => {
              const newKey = createCellKey(targetSection.id, emptySlot.id);
              const nextAssignments = { ...currentAssignments, [newKey]: { subjectId: targetSubject.id, teacherId: teacher.id, source: "conflict-fix", updatedAt: new Date().toISOString() } };
              const nextDrafts = { ...currentDrafts, [newKey]: { subjectId: targetSubject.id, teacherId: teacher.id } };
              return { nextAssignments, nextDrafts };
            },
          });
          if (options.length >= 2) break;
        }
      }

      // If no direct open slot is allowed (e.g. targetSubject is locked to Last Period which is currently occupied by another flexible subject),
      // offer an Intra-Section Relocation fix that shifts the occupying flexible subject to an open slot and places targetSubject in its locked slot!
      if (options.length === 0 && emptySlots.length > 0) {
        const allPlacementRules = getAllPlacementRules(config, scheduleType);
        for (const occupiedKey of sectionCellKeys) {
          const [, occSlotId] = splitCellKey(occupiedKey);
          const occSlot = slotsById.get(occSlotId);
          if (!occSlot) continue;
          const occAssign = currentDrafts[occupiedKey] || currentAssignments[occupiedKey];
          if (!occAssign || occAssign.subjectId === targetSubject.id) continue;

          const occSubject = subjectsById.get(occAssign.subjectId);
          if (!occSubject) continue;

          const rule = findPlacementRuleForSubject(occSubject, allPlacementRules);
          if (rule || (occSubject.preferredDay && occSubject.preferredDay !== "any") || (occSubject.preferredPeriodSlot && occSubject.preferredPeriodSlot !== "any")) {
            continue;
          }

          if (isSubjectRestrictedForSlot(targetSubject, occSlot, config?.constraints, config, scheduleType)) continue;

          const occDay = occSlot.day || "Monday";
          const currentDayCount = sectionCellKeys.filter((ck) => {
            if (ck === occupiedKey) return false;
            const [, sId] = splitCellKey(ck);
            const s = slotsById.get(sId);
            if (s?.day !== occDay) return false;
            const a = currentDrafts[ck] || currentAssignments[ck];
            return a?.subjectId === targetSubject.id;
          }).length;
          if (currentDayCount >= maxPerDay) continue;

          for (const emptySlot of emptySlots) {
            if (emptySlot.id === occSlot.id) continue;
            if (isSubjectRestrictedForSlot(occSubject, emptySlot, config?.constraints, config, scheduleType)) continue;

            const emptyDay = emptySlot.day || "Monday";
            const occClassesPerWeek = parseBoundedNumber(occSubject?.classesPerWeek, 1, 12, 4);
            const occMaxPerDay = occSubject.isDoublePeriod ? 2 : (occClassesPerWeek > totalDaysCount ? Math.ceil(occClassesPerWeek / totalDaysCount) : 1);
            const occCountOnEmptyDay = sectionCellKeys.filter((ck) => {
              if (ck === occupiedKey) return false;
              const [, sId] = splitCellKey(ck);
              const s = slotsById.get(sId);
              if (s?.day !== emptyDay) return false;
              const a = currentDrafts[ck] || currentAssignments[ck];
              return a?.subjectId === occSubject.id;
            }).length;
            if (occCountOnEmptyDay >= occMaxPerDay) continue;

            let occTeacher = facultyById.get(occAssign.teacherId);
            if (!occTeacher || !isTeacherEligible({ teacher: occTeacher, subject: occSubject, section: targetSection, slot: emptySlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: targetSection.id })) {
              occTeacher = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: occSubject, section: targetSection, slot: emptySlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: targetSection.id }));
            }
            if (!occTeacher) continue;

            const tempAssignments = { ...currentAssignments };
            delete tempAssignments[occupiedKey];
            const tempBusyMap = buildTeacherBusyMap(tempAssignments, sectionsById, slotsById);

            let targetTeacher = assignedTeacher && isTeacherEligible({ teacher: assignedTeacher, subject: targetSubject, section: targetSection, slot: occSlot, constraints: config?.constraints, teacherBusyBySlot: tempBusyMap, excludedSectionId: targetSection.id }) ? assignedTeacher : null;
            if (!targetTeacher) {
              targetTeacher = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: targetSubject, section: targetSection, slot: occSlot, constraints: config?.constraints, teacherBusyBySlot: tempBusyMap, excludedSectionId: targetSection.id }));
            }
            if (!targetTeacher) continue;

            const emptyCellKey = createCellKey(targetSection.id, emptySlot.id);
            options.push({
              label: `Relocate ${formatSubjectDisplayName(occSubject)} (${formatDayPeriodOrdinalLabel(occSlot)} → ${formatDayPeriodOrdinalLabel(emptySlot)})`,
              description: `Move ${formatSubjectDisplayName(occSubject)} to open ${formatDayPeriodOrdinalLabel(emptySlot)} and schedule ${formatSubjectDisplayName(targetSubject)} (${targetTeacher.name}) at ${formatDayPeriodOrdinalLabel(occSlot)}.`,
              apply: () => {
                const nextAssignments = {
                  ...currentAssignments,
                  [emptyCellKey]: { subjectId: occSubject.id, teacherId: occTeacher.id, source: "conflict-fix", updatedAt: new Date().toISOString() },
                  [occupiedKey]: { subjectId: targetSubject.id, teacherId: targetTeacher.id, source: "conflict-fix", updatedAt: new Date().toISOString() },
                };
                const nextDrafts = {
                  ...currentDrafts,
                  [emptyCellKey]: { subjectId: occSubject.id, teacherId: occTeacher.id },
                  [occupiedKey]: { subjectId: targetSubject.id, teacherId: targetTeacher.id },
                };
                return { nextAssignments, nextDrafts };
              },
            });
            break;
          }
          if (options.length > 0) break;
        }
      }

      // Check if another subject has excess periods that can be replaced
      const subjectUsage = new Map();
      sectionCellKeys.forEach((ck) => {
        const a = currentAssignments[ck];
        if (a?.subjectId) subjectUsage.set(a.subjectId, (subjectUsage.get(a.subjectId) || 0) + 1);
      });

      for (const [sId, count] of subjectUsage.entries()) {
        const otherSubj = subjectsById.get(sId);
        const req = parseBoundedNumber(otherSubj?.classesPerWeek, 1, 12, 4);
        if (count > req) {
          const repKey = sectionCellKeys.find((ck) => currentAssignments[ck]?.subjectId === sId);
          if (repKey) {
            const [, rSlotId] = splitCellKey(repKey);
            const rSlot = slotsById.get(rSlotId);
            let teacher = assignedTeacher && isTeacherEligible({ teacher: assignedTeacher, subject: targetSubject, section: targetSection, slot: rSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: targetSection.id }) ? assignedTeacher : null;
            if (!teacher) {
              teacher = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: targetSubject, section: targetSection, slot: rSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: targetSection.id }));
            }
            if (teacher && rSlot) {
              options.push({
                label: `Replace excess ${formatSubjectDisplayName(otherSubj)} at ${formatDayPeriodOrdinalLabel(rSlot)}`,
                description: `Replace surplus session of ${formatSubjectDisplayName(otherSubj)} with missing ${formatSubjectDisplayName(targetSubject)} (assigned to ${teacher.name}).`,
                apply: () => {
                  const nextAssignments = { ...currentAssignments, [repKey]: { subjectId: targetSubject.id, teacherId: teacher.id, source: "conflict-fix", updatedAt: new Date().toISOString() } };
                  const nextDrafts = { ...currentDrafts, [repKey]: { subjectId: targetSubject.id, teacherId: teacher.id } };
                  return { nextAssignments, nextDrafts };
                },
              });
              break;
            }
          }
        }
      }
    }
  }

  // 3. WEEKLY QUOTA EXCEEDED (Over-scheduled subject)
  else if (message.includes("exceeding required") || message.includes("classes per week")) {
    category = "Subject Over-Scheduled";
    severity = "warning";

    if (cellKeys.length > 0) {
      const lastKey = cellKeys[cellKeys.length - 1];
      const [secId, slotId] = splitCellKey(lastKey);
      const section = sectionsById.get(secId);
      const slot = slotsById.get(slotId);
      const asgn = currentAssignments[lastKey];
      const subject = asgn?.subjectId ? subjectsById.get(asgn.subjectId) : null;

      if (section && slot && subject) {
        const sectionCells = Object.keys(currentAssignments).filter((ck) => splitCellKey(ck)[0] === section.id);
        const offered = getSubjectsForSection(section, subjects, scheduleType);
        const subCounts = new Map();
        sectionCells.forEach((ck) => {
          const a = currentAssignments[ck];
          if (a?.subjectId) subCounts.set(a.subjectId, (subCounts.get(a.subjectId) || 0) + 1);
        });
        const allPlacementRules3 = getAllPlacementRules(config, scheduleType);
        const slotLastInfo3 = getDynamicLastPeriodInfo({
          sectionId: section.id,
          day: slot.day,
          assignments: currentAssignments,
          slotsById,
          subjectsById,
          placementRules: allPlacementRules3,
          excludeCellKey: lastKey,
          dayMaxPeriod: getSectionDayMaxPeriod(section, slot.day, scheduleType, config, slot),
        });
        const missingSubjects = offered.filter((s) => (subCounts.get(s.id) || 0) < parseBoundedNumber(s.classesPerWeek, 1, 12, 4));

        for (const missingSubj of missingSubjects) {
          if (isSubjectRestrictedForSlot(missingSubj, slot, config?.constraints, config, scheduleType, {
            section,
            assignments: currentAssignments,
            slotsById,
            subjectsById,
            excludeCellKey: lastKey,
          })) continue;
          if (
            !isDynamicLastPeriodSubject(missingSubj, allPlacementRules3) &&
            slotLastInfo3.otherLastPeriods.length > 0 &&
            Number(slot.period || 0) >= Math.min(...slotLastInfo3.otherLastPeriods)
          ) {
            continue;
          }
          const teacher = activeTeachers.find((t) => isTeacherEligible({ teacher: t, subject: missingSubj, section, slot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: section.id }));
          if (teacher) {
            options.push({
              label: `Replace with missing ${formatSubjectDisplayName(missingSubj)}`,
              description: `Change ${formatDayPeriodOrdinalLabel(slot)} from surplus ${formatSubjectDisplayName(subject)} to required ${formatSubjectDisplayName(missingSubj)} with ${teacher.name}.`,
              apply: () => {
                const nextAssignments = { ...currentAssignments, [lastKey]: { subjectId: missingSubj.id, teacherId: teacher.id, source: "conflict-fix", updatedAt: new Date().toISOString() } };
                const nextDrafts = { ...currentDrafts, [lastKey]: { subjectId: missingSubj.id, teacherId: teacher.id } };
                return { nextAssignments, nextDrafts };
              },
            });
            break;
          }
        }

        options.push({
          label: `Unassign excess period at ${formatDayPeriodOrdinalLabel(slot)}`,
          description: `Remove this surplus assignment to adhere strictly to the subject's weekly period quota.`,
          apply: () => {
            const nextAssignments = { ...currentAssignments };
            delete nextAssignments[lastKey];
            const nextDrafts = { ...currentDrafts };
            delete nextDrafts[lastKey];
            return { nextAssignments, nextDrafts };
          },
        });
      }
    }
  }

  // 4. SAME-DAY DUPLICATE SUBJECT
  else if (message.includes("times on") && message.includes("scheduled")) {
    category = "Daily Duplicate Session";
    severity = "warning";

    if (cellKeys.length > 0) {
      const duplicateKey = cellKeys[cellKeys.length - 1];
      const [secId, slotId] = splitCellKey(duplicateKey);
      const section = sectionsById.get(secId);
      const currentSlot = slotsById.get(slotId);
      const asgn = currentAssignments[duplicateKey];
      const subject = asgn?.subjectId ? subjectsById.get(asgn.subjectId) : null;
      const teacher = asgn?.teacherId ? facultyById.get(asgn.teacherId) : null;

      if (section && currentSlot && subject) {
        const placementRules4 = getAllPlacementRules(config, scheduleType);
        const isSubjDynLast4 = isDynamicLastPeriodSubject(subject, placementRules4);
        const validSlots = slots.filter((s) => isSlotValidForSection(section, s, scheduleType, config));
        const otherDayEmptySlots = validSlots.filter((s) => {
          if (s.day === currentSlot.day) return false;
          const ck = createCellKey(section.id, s.id);
          if (currentAssignments[ck]) return false;
          const sectionCells = Object.keys(currentAssignments).filter((k) => splitCellKey(k)[0] === section.id);
          const hasSubOnDay = sectionCells.some((k) => {
            const [, sId] = splitCellKey(k);
            return slotsById.get(sId)?.day === s.day && currentAssignments[k]?.subjectId === subject.id;
          });
          if (hasSubOnDay) return false;
          if (isSubjectRestrictedForSlot(subject, s, config?.constraints, config, scheduleType, {
            section,
            assignments: currentAssignments,
            slotsById,
            subjectsById,
            excludeCellKey: duplicateKey,
          })) return false;
          if (!isSubjDynLast4) {
            const targetLastInfo = getDynamicLastPeriodInfo({
              sectionId: section.id,
              day: s.day,
              assignments: currentAssignments,
              slotsById,
              subjectsById,
              placementRules: placementRules4,
              excludeCellKey: duplicateKey,
              dayMaxPeriod: getSectionDayMaxPeriod(section, s.day, scheduleType, config, s),
            });
            if (targetLastInfo.otherLastPeriods.length > 0 && Number(s.period || 0) >= Math.min(...targetLastInfo.otherLastPeriods)) {
              return false;
            }
          }
          return true;
        });

        for (const targetSlot of otherDayEmptySlots) {
          let t = teacher && isTeacherEligible({ teacher, subject, section, slot: targetSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: section.id }) ? teacher : null;
          if (!t) {
            t = activeTeachers.find((tch) => isTeacherEligible({ teacher: tch, subject, section, slot: targetSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: section.id }));
          }
          if (t) {
            options.push({
              label: `Move to ${formatDayPeriodOrdinalLabel(targetSlot)}`,
              description: `Move the duplicate session to ${formatDayPeriodOrdinalLabel(targetSlot)} where the section has no session of this subject yet.`,
              apply: () => {
                const targetKey = createCellKey(section.id, targetSlot.id);
                const nextAssignments = { ...currentAssignments };
                delete nextAssignments[duplicateKey];
                nextAssignments[targetKey] = { subjectId: subject.id, teacherId: t.id, source: "conflict-fix", updatedAt: new Date().toISOString() };
                const nextDrafts = { ...currentDrafts };
                delete nextDrafts[duplicateKey];
                nextDrafts[targetKey] = { subjectId: subject.id, teacherId: t.id };
                return { nextAssignments, nextDrafts };
              },
            });
            if (options.length >= 2) break;
          }
        }

        options.push({
          label: `Clear duplicate session at ${formatDayPeriodOrdinalLabel(currentSlot)}`,
          description: `Unassign this duplicate session to prevent exceeding max daily sessions.`,
          apply: () => {
            const nextAssignments = { ...currentAssignments };
            delete nextAssignments[duplicateKey];
            const nextDrafts = { ...currentDrafts };
            delete nextDrafts[duplicateKey];
            return { nextAssignments, nextDrafts };
          },
        });
      }
    }
  }

  // 5. PERIOD NOT VALID FOR SECTION SETTINGS
  else if (message.includes("period not valid for section settings")) {
    category = "Invalid Section Slot";
    severity = "critical";

    if (cellKeys.length > 0) {
      const cellKey = cellKeys[0];
      const [secId, slotId] = splitCellKey(cellKey);
      const section = sectionsById.get(secId);
      const slot = slotsById.get(slotId);
      const asgn = currentDrafts[cellKey] || currentAssignments[cellKey];
      const subject = asgn?.subjectId ? subjectsById.get(asgn.subjectId) : null;
      const teacher = asgn?.teacherId ? facultyById.get(asgn.teacherId) : null;

      if (section && subject) {
        const placementRules5 = getAllPlacementRules(config, scheduleType);
        const isSubjDynLast5 = isDynamicLastPeriodSubject(subject, placementRules5);
        const validSlots = slots.filter((s) => isSlotValidForSection(section, s, scheduleType, config));
        const openValidSlots = validSlots.filter((s) => !currentAssignments[createCellKey(section.id, s.id)]);

        for (const openSlot of openValidSlots) {
          if (isSubjectRestrictedForSlot(subject, openSlot, config?.constraints, config, scheduleType, {
            section,
            assignments: currentAssignments,
            slotsById,
            subjectsById,
            excludeCellKey: cellKey,
          })) continue;
          if (!isSubjDynLast5) {
            const targetLastInfo = getDynamicLastPeriodInfo({
              sectionId: section.id,
              day: openSlot.day,
              assignments: currentAssignments,
              slotsById,
              subjectsById,
              placementRules: placementRules5,
              excludeCellKey: cellKey,
              dayMaxPeriod: getSectionDayMaxPeriod(section, openSlot.day, scheduleType, config, openSlot),
            });
            if (targetLastInfo.otherLastPeriods.length > 0 && Number(openSlot.period || 0) >= Math.min(...targetLastInfo.otherLastPeriods)) {
              continue;
            }
          }
          let t = teacher && isTeacherEligible({ teacher, subject, section, slot: openSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: section.id }) ? teacher : null;
          if (!t) {
            t = activeTeachers.find((tch) => isTeacherEligible({ teacher: tch, subject, section, slot: openSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: section.id }));
          }
          if (t) {
            options.push({
              label: `Move to open valid slot (${formatDayPeriodOrdinalLabel(openSlot)})`,
              description: `Shift ${formatSubjectDisplayName(subject)} to a valid active timetable slot for ${section.name}.`,
              apply: () => {
                const targetKey = createCellKey(section.id, openSlot.id);
                const nextAssignments = { ...currentAssignments };
                delete nextAssignments[cellKey];
                nextAssignments[targetKey] = { subjectId: subject.id, teacherId: t.id, source: "conflict-fix", updatedAt: new Date().toISOString() };
                const nextDrafts = { ...currentDrafts };
                delete nextDrafts[cellKey];
                nextDrafts[targetKey] = { subjectId: subject.id, teacherId: t.id };
                return { nextAssignments, nextDrafts };
              },
            });
            break;
          }
        }
      }

      options.push({
        label: `Clear invalid cell assignment`,
        description: `Unassign this slot since it lies outside the section's active periods or configuration.`,
        apply: () => {
          const nextAssignments = { ...currentAssignments };
          delete nextAssignments[cellKey];
          const nextDrafts = { ...currentDrafts };
          delete nextDrafts[cellKey];
          return { nextAssignments, nextDrafts };
        },
      });
    }
  }

  // 6. SUBJECT PERIOD RESTRICTION (Subject restricted for this period)
  else if (
    message.includes("is restricted for this period") &&
    subjects.some((s) => (s.subjectName && message.includes(s.subjectName)) || (s.subjectCode && message.includes(s.subjectCode)) || (s.name && message.includes(s.name)) || (s.code && message.includes(s.code))) &&
    !activeTeachers.some((t) => message.includes(t.name))
  ) {
    category = "Subject Period Restriction";
    severity = "critical";

    if (cellKeys.length > 0) {
      const cellKey = cellKeys[0];
      const [secId, slotId] = splitCellKey(cellKey);
      const section = sectionsById.get(secId);
      const slot = slotsById.get(slotId);
      const asgn = currentDrafts[cellKey] || currentAssignments[cellKey];
      const subject = asgn?.subjectId ? subjectsById.get(asgn.subjectId) : null;
      const teacher = asgn?.teacherId ? facultyById.get(asgn.teacherId) : null;

      if (section && slot && subject) {
        const placementRules6 = getAllPlacementRules(config, scheduleType);
        const isSubjDynLast6 = isDynamicLastPeriodSubject(subject, placementRules6);
        const validSlots = slots.filter((s) => isSlotValidForSection(section, s, scheduleType, config));
        const openSlots = validSlots.filter((s) => {
          const ck = createCellKey(section.id, s.id);
          if (currentAssignments[ck]) return false;
          if (isSubjectRestrictedForSlot(subject, s, config?.constraints, config, scheduleType, {
            section,
            assignments: currentAssignments,
            slotsById,
            subjectsById,
            excludeCellKey: cellKey,
          })) return false;
          if (!isSubjDynLast6) {
            const targetLastInfo = getDynamicLastPeriodInfo({
              sectionId: section.id,
              day: s.day,
              assignments: currentAssignments,
              slotsById,
              subjectsById,
              placementRules: placementRules6,
              excludeCellKey: cellKey,
              dayMaxPeriod: getSectionDayMaxPeriod(section, s.day, scheduleType, config, s),
            });
            if (targetLastInfo.otherLastPeriods.length > 0 && Number(s.period || 0) >= Math.min(...targetLastInfo.otherLastPeriods)) {
              return false;
            }
          }
          return teacher ? !busyMap.get(teacher.id)?.has(s.id) : true;
        });

        if (openSlots.length > 0) {
          const openSlot = openSlots[0];
          let t = teacher && isTeacherEligible({ teacher, subject, section, slot: openSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: section.id }) ? teacher : null;
          if (!t) {
            t = activeTeachers.find((tch) => isTeacherEligible({ teacher: tch, subject, section, slot: openSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: section.id }));
          }
          if (t) {
            options.push({
              label: `Move subject to unrestricted slot (${formatDayPeriodOrdinalLabel(openSlot)})`,
              description: `Shift ${formatSubjectDisplayName(subject)} to ${formatDayPeriodOrdinalLabel(openSlot)} where the subject has no restriction.`,
              apply: () => {
                const newKey = createCellKey(section.id, openSlot.id);
                const nextAssignments = { ...currentAssignments };
                delete nextAssignments[cellKey];
                nextAssignments[newKey] = { subjectId: subject.id, teacherId: t.id, source: "conflict-fix", updatedAt: new Date().toISOString() };
                const nextDrafts = { ...currentDrafts };
                delete nextDrafts[cellKey];
                nextDrafts[newKey] = { subjectId: subject.id, teacherId: t.id };
                return { nextAssignments, nextDrafts };
              },
            });
          }
        }

        if (options.length === 0 && isSubjDynLast6) {
          const pRule6 = findPlacementRuleForSubject(subject, placementRules6);
          const effectiveSubj6 = pRule6 ? { ...subject, ...pRule6 } : subject;
          const levelConfig6 = scheduleType === "jhs" ? config?.jhs : config?.shs;
          const activeDays6 = extractDaysFromLevelConfig(levelConfig6)?.daySequence || [];
          const baseDays6 = activeDays6.length > 0 ? activeDays6 : Array.from(new Set(validSlots.map((s) => s.day).filter(Boolean)));
          const candidateDays =
            effectiveSubj6.preferredDay && effectiveSubj6.preferredDay !== "any"
              ? baseDays6.filter((d) => d === effectiveSubj6.preferredDay)
              : baseDays6;
          const dynamicPlan = computeDynamicLastPlacementPlan({
            section,
            targetSubject: subject,
            candidateDays,
            assignments: currentAssignments,
            drafts: currentDrafts,
            validSectionSlots: validSlots,
            slotsById,
            subjectsById,
            sectionsById,
            facultyById,
            activeTeachers,
            config,
            scheduleType,
            preferTeacherId: teacher?.id || null,
            excludeCellKey: cellKey,
          });
          if (dynamicPlan) {
            options.push({
              label: dynamicPlan.label,
              description: dynamicPlan.description,
              apply: () => ({
                nextAssignments: dynamicPlan.nextAssignments,
                nextDrafts: dynamicPlan.nextDrafts,
              }),
            });
          }
        }

        // Intra-section swap with another unrestricted subject
        if (!isSubjDynLast6) {
          const sectionCells = Object.keys(currentAssignments).filter(
            (ck) => splitCellKey(ck)[0] === section.id && ck !== cellKey
          );
          for (const otherCk of sectionCells) {
            const [, otherSlotId] = splitCellKey(otherCk);
            const otherSlot = slotsById.get(otherSlotId);
            const otherAsgn = currentDrafts[otherCk] || currentAssignments[otherCk];
            const otherSubj = otherAsgn?.subjectId ? subjectsById.get(otherAsgn.subjectId) : null;
            const otherTeacher = otherAsgn?.teacherId ? facultyById.get(otherAsgn.teacherId) : null;

            if (!otherSlot || !otherSubj || !otherTeacher) continue;
            if (otherSubj.id === subject.id) continue;
            if (isPlacementLockedSubject(otherSubj, placementRules6)) continue;
            if (isSubjectRestrictedForSlot(subject, otherSlot, config?.constraints, config, scheduleType, {
              section,
              assignments: currentAssignments,
              slotsById,
              subjectsById,
              excludeCellKey: otherCk,
            })) continue;
            if (isSubjectRestrictedForSlot(otherSubj, slot, config?.constraints, config, scheduleType, {
              section,
              assignments: currentAssignments,
              slotsById,
              subjectsById,
              excludeCellKey: cellKey,
            })) continue;
            if (otherSlot.day !== slot.day) {
              const slotLastInfo = getDynamicLastPeriodInfo({
                sectionId: section.id,
                day: slot.day,
                assignments: currentAssignments,
                slotsById,
                subjectsById,
                placementRules: placementRules6,
                excludeCellKey: cellKey,
                dayMaxPeriod: getSectionDayMaxPeriod(section, slot.day, scheduleType, config, slot),
              });
              const otherLastInfo = getDynamicLastPeriodInfo({
                sectionId: section.id,
                day: otherSlot.day,
                assignments: currentAssignments,
                slotsById,
                subjectsById,
                placementRules: placementRules6,
                excludeCellKey: otherCk,
                dayMaxPeriod: getSectionDayMaxPeriod(section, otherSlot.day, scheduleType, config, otherSlot),
              });
              if (slotLastInfo.otherLastPeriods.length > 0 && Number(slot.period || 0) >= Math.min(...slotLastInfo.otherLastPeriods)) continue;
              if (otherLastInfo.otherLastPeriods.length > 0 && Number(otherSlot.period || 0) >= Math.min(...otherLastInfo.otherLastPeriods)) continue;
            }

            let curTeacherEligible = teacher && isTeacherEligible({ teacher, subject, section, slot: otherSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: section.id });
            let othTeacherEligible = isTeacherEligible({ teacher: otherTeacher, subject: otherSubj, section, slot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: section.id });

            if (curTeacherEligible && othTeacherEligible) {
              options.push({
                label: `Swap with ${formatSubjectDisplayName(otherSubj)} (${formatDayPeriodOrdinalLabel(otherSlot)})`,
                description: `Swap periods in ${section.name}: move ${formatSubjectDisplayName(subject)} to ${formatDayPeriodOrdinalLabel(otherSlot)} and ${formatSubjectDisplayName(otherSubj)} to ${formatDayPeriodOrdinalLabel(slot)}.`,
                apply: () => {
                  const nextAssignments = {
                    ...currentAssignments,
                    [cellKey]: { subjectId: otherSubj.id, teacherId: otherTeacher.id, source: "conflict-fix", updatedAt: new Date().toISOString() },
                    [otherCk]: { subjectId: subject.id, teacherId: teacher.id, source: "conflict-fix", updatedAt: new Date().toISOString() },
                  };
                  const nextDrafts = {
                    ...currentDrafts,
                    [cellKey]: { subjectId: otherSubj.id, teacherId: otherTeacher.id },
                    [otherCk]: { subjectId: subject.id, teacherId: teacher.id },
                  };
                  return { nextAssignments, nextDrafts };
                },
              });
              break;
            }
          }
        }

        options.push({
          label: `Clear restricted cell assignment`,
          description: `Unassign this slot so it can be scheduled in an allowed period.`,
          apply: () => {
            const nextAssignments = { ...currentAssignments };
            delete nextAssignments[cellKey];
            const nextDrafts = { ...currentDrafts };
            delete nextDrafts[cellKey];
            return { nextAssignments, nextDrafts };
          },
        });
      }
    }
  }

  // 7. TEACHER RESTRICTION / UNAVAILABLE PERIOD / EXPERTISE / GRADE MISMATCH
  else if (
    message.includes("restricted for this period") ||
    message.includes("is unavailable") ||
    message.includes("lacks subject expertise") ||
    message.includes("does not match Grade")
  ) {
    category = message.includes("restricted")
      ? "Teacher Restricted Period"
      : message.includes("unavailable")
      ? "Teacher Unavailable"
      : message.includes("expertise")
      ? "Teacher Expertise Mismatch"
      : "Teacher Grade Mismatch";
    severity = "critical";

    if (cellKeys.length > 0) {
      const cellKey = cellKeys[0];
      const [secId, slotId] = splitCellKey(cellKey);
      const section = sectionsById.get(secId);
      const slot = slotsById.get(slotId);
      const asgn = currentDrafts[cellKey] || currentAssignments[cellKey];
      const subject = asgn?.subjectId ? subjectsById.get(asgn.subjectId) : null;
      const currentTeacher = asgn?.teacherId ? facultyById.get(asgn.teacherId) : null;

      if (section && slot && subject) {
        const candidates = activeTeachers.filter(
          (t) =>
            (!currentTeacher || t.id !== currentTeacher.id) &&
            isTeacherEligible({
              teacher: t,
              subject,
              section,
              slot,
              constraints: config?.constraints,
              teacherBusyBySlot: busyMap,
              excludedSectionId: section.id,
            })
        );

        candidates.slice(0, 2).forEach((cand) => {
          options.push({
            label: `Assign qualified teacher (${cand.name})`,
            description: `Replace teacher with ${cand.name} who is certified and available at ${formatDayPeriodOrdinalLabel(slot)}.`,
            apply: () => {
              const nextAssignments = { ...currentAssignments, [cellKey]: { subjectId: subject.id, teacherId: cand.id, source: "conflict-fix", updatedAt: new Date().toISOString() } };
              const nextDrafts = { ...currentDrafts, [cellKey]: { subjectId: subject.id, teacherId: cand.id } };
              return { nextAssignments, nextDrafts };
            },
          });
        });

        if (currentTeacher) {
          const placementRules7 = getAllPlacementRules(config, scheduleType);
          const isSubjDynLast7 = isDynamicLastPeriodSubject(subject, placementRules7);
          const validSlots = slots.filter((s) => isSlotValidForSection(section, s, scheduleType, config));
          const openSlots = validSlots.filter((s) => {
            const ck = createCellKey(section.id, s.id);
            if (currentAssignments[ck]) return false;
            if (isSubjectRestrictedForSlot(subject, s, config?.constraints, config, scheduleType, {
              section,
              assignments: currentAssignments,
              slotsById,
              subjectsById,
              excludeCellKey: cellKey,
            })) return false;
            if (!isSubjDynLast7) {
              const targetLastInfo = getDynamicLastPeriodInfo({
                sectionId: section.id,
                day: s.day,
                assignments: currentAssignments,
                slotsById,
                subjectsById,
                placementRules: placementRules7,
                excludeCellKey: cellKey,
                dayMaxPeriod: getSectionDayMaxPeriod(section, s.day, scheduleType, config, s),
              });
              if (targetLastInfo.otherLastPeriods.length > 0 && Number(s.period || 0) >= Math.min(...targetLastInfo.otherLastPeriods)) {
                return false;
              }
            }
            if (matchesRestrictedPeriod(s, getTeacherRestrictedPeriods(currentTeacher.id, config?.constraints))) return false;
            if (matchesUnavailablePeriod(s, currentTeacher.unavailablePeriods)) return false;
            return !busyMap.get(currentTeacher.id)?.has(s.id);
          });

          if (openSlots.length > 0) {
            const openSlot = openSlots[0];
            options.push({
              label: `Move class to ${formatDayPeriodOrdinalLabel(openSlot)}`,
              description: `Shift ${formatSubjectDisplayName(subject)} to ${formatDayPeriodOrdinalLabel(openSlot)} where ${currentTeacher.name} has no restriction and is available.`,
              apply: () => {
                const newKey = createCellKey(section.id, openSlot.id);
                const nextAssignments = { ...currentAssignments };
                delete nextAssignments[cellKey];
                nextAssignments[newKey] = { subjectId: subject.id, teacherId: currentTeacher.id, source: "conflict-fix", updatedAt: new Date().toISOString() };
                const nextDrafts = { ...currentDrafts };
                delete nextDrafts[cellKey];
                nextDrafts[newKey] = { subjectId: subject.id, teacherId: currentTeacher.id };
                return { nextAssignments, nextDrafts };
              },
            });
          }
        }

        options.push({
          label: `Clear conflicting teacher assignment`,
          description: `Unassign this period to eliminate the constraint violation and re-assign cleanly.`,
          apply: () => {
            const nextAssignments = { ...currentAssignments };
            delete nextAssignments[cellKey];
            const nextDrafts = { ...currentDrafts };
            delete nextDrafts[cellKey];
            return { nextAssignments, nextDrafts };
          },
        });
      }
    }
  }

  // 8A. RESERVED LOCKED-SLOT OWNERSHIP CONFLICT (Subject B occupying slot locked to Subject A)
  else if (message.includes("which is reserved for")) {
    category = "Reserved Slot Conflict";
    severity = "critical";

    if (cellKeys.length > 0) {
      const cellKey = cellKeys[0];
      const [secId, slotId] = splitCellKey(cellKey);
      const section = sectionsById.get(secId);
      const slot = slotsById.get(slotId);
      const asgn = currentDrafts[cellKey] || currentAssignments[cellKey];
      const subject = asgn?.subjectId ? subjectsById.get(asgn.subjectId) : null;
      const teacher = asgn?.teacherId ? facultyById.get(asgn.teacherId) : null;

      if (section && slot && subject) {
        const allPlacementRules = getAllPlacementRules(config, scheduleType);
        const validSlots = slots.filter((s) => isSlotValidForSection(section, s, scheduleType, config));
        const secEligible = getSubjectsForSection(section, subjects, scheduleType);
        const lockedSubj =
          secEligible.find((es) =>
            getExactLockedSlotsForSubject(es, validSlots, allPlacementRules).some((ls) => ls.id === slot.id)
          ) || null;
        const reservedSlotIds = new Set();
        secEligible.forEach((es) => {
          getExactLockedSlotsForSubject(es, validSlots, allPlacementRules).forEach((ls) => {
            if (ls?.id) reservedSlotIds.add(ls.id);
          });
        });

        const occLabel = formatSubjectDisplayName(subject, "Current Subject");
        const lockedLabel = formatSubjectDisplayName(lockedSubj, "locked subject");
        const curSlotText = `${slot.day} ${formatPeriodOrdinalLabel(slot)}`;
        const levelCfg8 = scheduleType === "jhs" ? config?.jhs : config?.shs;
        const totalDays8 = (extractDaysFromLevelConfig(levelCfg8)?.daySequence || []).length || 5;
        const occClassesPerWeek = parseBoundedNumber(subject?.classesPerWeek, 1, 12, 4);
        const occMaxPerDay = subject?.isDoublePeriod
          ? 2
          : (occClassesPerWeek > totalDays8 ? Math.ceil(occClassesPerWeek / totalDays8) : 1);

        const cloneBusyWithout = (releasedTeacherIds, releasedSlotId) => {
          const nextMap = new Map();
          busyMap.forEach((tMap, tId) => {
            const copy = new Map(tMap);
            if (releasedTeacherIds.includes(tId)) copy.delete(releasedSlotId);
            nextMap.set(tId, copy);
          });
          return nextMap;
        };

        // Option 1: If the locked subject is misplaced in another slot, offer a 1-click swap
        if (lockedSubj) {
          const otherEntry = Object.entries(currentAssignments).find(([ck, a]) => {
            if (!ck.startsWith(`${section.id}|`) || ck === cellKey) return false;
            return a?.subjectId === lockedSubj.id;
          });
          if (otherEntry) {
            const [otherKey, otherAsgn] = otherEntry;
            const [, otherSlotId] = splitCellKey(otherKey);
            const otherSlot = slotsById.get(otherSlotId);
            const otherTeacher = otherAsgn?.teacherId ? facultyById.get(otherAsgn.teacherId) : null;
            if (otherSlot) {
              const occTeacherIds = collectAssignmentTeacherIds(asgn);
              const lockTeacherIds = collectAssignmentTeacherIds(otherAsgn);
              const simBusyForOcc = cloneBusyWithout(occTeacherIds, slot.id);
              const simBusyForLock = cloneBusyWithout(lockTeacherIds, otherSlot.id);
              const occAllowedAtOther =
                !isSubjectRestrictedForSlot(subject, otherSlot, config?.constraints, config, scheduleType, {
                  section,
                  assignments: currentAssignments,
                  slotsById,
                  subjectsById,
                  excludeCellKey: cellKey,
                }) &&
                (!teacher ||
                  isTeacherEligible({
                    teacher,
                    subject,
                    section,
                    slot: otherSlot,
                    constraints: config?.constraints,
                    teacherBusyBySlot: simBusyForOcc,
                    excludedSectionId: section.id,
                  }));
              const lockAllowedAtCur =
                !otherTeacher ||
                isTeacherEligible({
                  teacher: otherTeacher,
                  subject: lockedSubj,
                  section,
                  slot,
                  constraints: config?.constraints,
                  teacherBusyBySlot: simBusyForLock,
                  excludedSectionId: section.id,
                });

              if (occAllowedAtOther && lockAllowedAtCur) {
                const otherSlotText = `${otherSlot.day} ${formatPeriodOrdinalLabel(otherSlot)}`;
                options.push({
                  label: `Swap ${occLabel} and ${lockedLabel} (${curSlotText} <-> ${otherSlotText})`,
                  description: `Return ${lockedLabel} to its reserved slot at ${curSlotText} and move ${occLabel} to ${otherSlotText}.`,
                  apply: () => {
                    const nextAssignments = {
                      ...currentAssignments,
                      [cellKey]: { ...otherAsgn, source: "conflict-fix", updatedAt: new Date().toISOString() },
                      [otherKey]: { ...asgn, source: "conflict-fix", updatedAt: new Date().toISOString() },
                    };
                    const nextDrafts = {
                      ...currentDrafts,
                      [cellKey]: { subjectId: otherAsgn.subjectId, teacherId: otherAsgn.teacherId, coTeacherIds: otherAsgn.coTeacherIds, breakoutAssignments: otherAsgn.breakoutAssignments, breakoutNote: otherAsgn.breakoutNote },
                      [otherKey]: { subjectId: asgn.subjectId, teacherId: asgn.teacherId, coTeacherIds: asgn.coTeacherIds, breakoutAssignments: asgn.breakoutAssignments, breakoutNote: asgn.breakoutNote },
                    };
                    return { nextAssignments, nextDrafts };
                  },
                });
              }
            }
          }
        }

        // Option 2: Relocate Subject B to a valid open non-reserved slot
        for (const openSlot of validSlots) {
          const openKey = createCellKey(section.id, openSlot.id);
          if (currentAssignments[openKey] || reservedSlotIds.has(openSlot.id)) continue;
          if (isSubjectRestrictedForSlot(subject, openSlot, config?.constraints, config, scheduleType, {
            section,
            assignments: currentAssignments,
            slotsById,
            subjectsById,
            excludeCellKey: cellKey,
          })) continue;

          const dayCount = Object.entries(currentAssignments).reduce((acc, [ck, a]) => {
            if (!ck.startsWith(`${section.id}|`) || ck === cellKey || a?.subjectId !== subject.id) return acc;
            const sObj = slotsById.get(splitCellKey(ck)[1]);
            return sObj?.day === openSlot.day ? acc + 1 : acc;
          }, 0);
          if (dayCount >= occMaxPerDay) continue;

          const occTeacherIds = collectAssignmentTeacherIds(asgn);
          const simBusy = cloneBusyWithout(occTeacherIds, slot.id);
          const teacherOk = !teacher || isTeacherEligible({
            teacher,
            subject,
            section,
            slot: openSlot,
            constraints: config?.constraints,
            teacherBusyBySlot: simBusy,
            excludedSectionId: section.id,
          });
          if (!teacherOk) continue;

          const openSlotText = `${openSlot.day} ${formatPeriodOrdinalLabel(openSlot)}`;
          options.push({
            label: `Move ${occLabel} to ${openSlotText}`,
            description: `Relocate ${occLabel} out of ${curSlotText} so ${lockedLabel} can occupy its locked slot.`,
            apply: () => {
              const nextAssignments = { ...currentAssignments };
              delete nextAssignments[cellKey];
              nextAssignments[openKey] = { ...asgn, source: "conflict-fix", updatedAt: new Date().toISOString() };
              const nextDrafts = { ...currentDrafts };
              delete nextDrafts[cellKey];
              nextDrafts[openKey] = {
                subjectId: asgn.subjectId,
                teacherId: asgn.teacherId,
                coTeacherIds: asgn.coTeacherIds,
                breakoutAssignments: asgn.breakoutAssignments,
                breakoutNote: asgn.breakoutNote,
              };
              return { nextAssignments, nextDrafts };
            },
          });
          break;
        }

        // Option 3: Fallback only if no swap/relocate fits
        options.push({
          label: `Clear ${occLabel} from ${curSlotText}`,
          description: `Unassign ${occLabel} from ${curSlotText} to free the reserved slot for ${lockedLabel}.`,
          apply: () => {
            const nextAssignments = { ...currentAssignments };
            delete nextAssignments[cellKey];
            const nextDrafts = { ...currentDrafts };
            delete nextDrafts[cellKey];
            return { nextAssignments, nextDrafts };
          },
        });
      }
    }
  }

  // 8. PREFERRED PLACEMENT LOCK (Locked to day or period slot)
  else if (message.includes("locked to")) {
    category = "Preferred Placement Lock";
    severity = "warning";

    if (cellKeys.length > 0) {
      const cellKey = cellKeys[0];
      const [secId, slotId] = splitCellKey(cellKey);
      const section = sectionsById.get(secId);
      const slot = slotsById.get(slotId);
      const asgn = currentDrafts[cellKey] || currentAssignments[cellKey];
      const subject = asgn?.subjectId ? subjectsById.get(asgn.subjectId) : null;
      const teacher = asgn?.teacherId ? facultyById.get(asgn.teacherId) : null;

      if (section && slot && subject) {
        const allPlacementRules = getAllPlacementRules(config, scheduleType);
        const pRule = findPlacementRuleForSubject(subject, allPlacementRules);
        const effectiveSubj = pRule ? { ...subject, ...pRule } : (subject || {});
        const isSubjDynLast8 = isDynamicLastPeriodSubject(subject, allPlacementRules);

        const validSlots = slots.filter((s) => isSlotValidForSection(section, s, scheduleType, config));
        const candidateSlots = validSlots.filter((s) => {
          if (effectiveSubj.preferredDay && effectiveSubj.preferredDay !== "any" && s.day !== effectiveSubj.preferredDay) return false;
          if (isSubjectRestrictedForSlot(subject, s, config?.constraints, config, scheduleType, {
            section,
            assignments: currentAssignments,
            slotsById,
            subjectsById,
            excludeCellKey: cellKey,
          })) return false;
          if (!isSubjDynLast8) {
            const targetLastInfo = getDynamicLastPeriodInfo({
              sectionId: section.id,
              day: s.day,
              assignments: currentAssignments,
              slotsById,
              subjectsById,
              placementRules: allPlacementRules,
              excludeCellKey: cellKey,
              dayMaxPeriod: getSectionDayMaxPeriod(section, s.day, scheduleType, config, s),
            });
            if (targetLastInfo.otherLastPeriods.length > 0 && Number(s.period || 0) >= Math.min(...targetLastInfo.otherLastPeriods)) {
              return false;
            }
          }
          return true;
        });

        const openMatchingSlots = candidateSlots.filter((s) => !currentAssignments[createCellKey(section.id, s.id)]);
        for (const openSlot of openMatchingSlots) {
          let t = teacher && isTeacherEligible({ teacher, subject, section, slot: openSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: section.id }) ? teacher : null;
          if (!t) {
            t = activeTeachers.find((tch) => isTeacherEligible({ teacher: tch, subject, section, slot: openSlot, constraints: config?.constraints, teacherBusyBySlot: busyMap, excludedSectionId: section.id }));
          }
          if (t) {
            options.push({
              label: `Move to preferred slot (${formatDayPeriodOrdinalLabel(openSlot)})`,
              description: `Shift ${formatSubjectDisplayName(subject)} to its designated preferred time at ${formatDayPeriodOrdinalLabel(openSlot)}.`,
              apply: () => {
                const newKey = createCellKey(section.id, openSlot.id);
                const nextAssignments = { ...currentAssignments };
                delete nextAssignments[cellKey];
                nextAssignments[newKey] = { subjectId: subject.id, teacherId: t.id, source: "conflict-fix", updatedAt: new Date().toISOString() };
                const nextDrafts = { ...currentDrafts };
                delete nextDrafts[cellKey];
                nextDrafts[newKey] = { subjectId: subject.id, teacherId: t.id };
                return { nextAssignments, nextDrafts };
              },
            });
            break;
          }
        }

        if (options.length === 0) {
          const secEligible = getSubjectsForSection(section, subjects, scheduleType);
          const reservedSlotIds = new Set();
          secEligible.forEach((es) => {
            getExactLockedSlotsForSubject(es, validSlots, allPlacementRules).forEach((ls) => {
              if (ls?.id) reservedSlotIds.add(ls.id);
            });
          });
          const cloneBusyWithout = (releasedTeacherIds, releasedSlotId) => {
            const nextMap = new Map();
            busyMap.forEach((tMap, tId) => {
              const copy = new Map(tMap);
              if (releasedTeacherIds.includes(tId)) copy.delete(releasedSlotId);
              nextMap.set(tId, copy);
            });
            return nextMap;
          };

          const subjLabel = formatSubjectDisplayName(subject, "Subject");
          const curSlotText = `${slot.day} ${formatPeriodOrdinalLabel(slot)}`;
          const occupiedMatchingSlots = candidateSlots.filter((s) => Boolean(currentAssignments[createCellKey(section.id, s.id)]));

          // 1. Try swapping Subject A into its locked slot occupied by Subject B
          for (const occSlot of occupiedMatchingSlots) {
            const occKey = createCellKey(section.id, occSlot.id);
            const occAsgn = currentAssignments[occKey];
            const occSubj = occAsgn?.subjectId ? subjectsById.get(occAsgn.subjectId) : null;
            if (!occAsgn || !occSubj || occSubj.id === subject.id) continue;
            if (isPlacementLockedSubject(occSubj, allPlacementRules)) continue;

            const occTeacher = occAsgn.teacherId ? facultyById.get(occAsgn.teacherId) : null;
            const simBusyOcc = cloneBusyWithout(collectAssignmentTeacherIds(occAsgn), occSlot.id);
            const simBusySubj = cloneBusyWithout(collectAssignmentTeacherIds(asgn), slot.id);

            const occFitsCurrentSlot =
              !isSubjectRestrictedForSlot(occSubj, slot, config?.constraints, config, scheduleType, {
                section,
                assignments: currentAssignments,
                slotsById,
                subjectsById,
                excludeCellKey: occKey,
              }) &&
              (!occTeacher ||
                isTeacherEligible({
                  teacher: occTeacher,
                  subject: occSubj,
                  section,
                  slot,
                  constraints: config?.constraints,
                  teacherBusyBySlot: simBusyOcc,
                  excludedSectionId: section.id,
                }));

            let swapTeacher =
              teacher &&
              isTeacherEligible({
                teacher,
                subject,
                section,
                slot: occSlot,
                constraints: config?.constraints,
                teacherBusyBySlot: simBusySubj,
                excludedSectionId: section.id,
              })
                ? teacher
                : activeTeachers.find((tch) =>
                    isTeacherEligible({
                      teacher: tch,
                      subject,
                      section,
                      slot: occSlot,
                      constraints: config?.constraints,
                      teacherBusyBySlot: simBusySubj,
                      excludedSectionId: section.id,
                    })
                  );

            if (occFitsCurrentSlot && swapTeacher) {
              const occLabel = formatSubjectDisplayName(occSubj, "Occupying Subject");
              const occSlotText = `${occSlot.day} ${formatPeriodOrdinalLabel(occSlot)}`;
              options.push({
                label: `Swap ${subjLabel} with ${occLabel} (${occSlotText} <-> ${curSlotText})`,
                description: `Place ${subjLabel} in its locked slot at ${occSlotText} and move ${occLabel} to ${curSlotText}.`,
                apply: () => {
                  const nextAssignments = {
                    ...currentAssignments,
                    [occKey]: { ...asgn, subjectId: subject.id, teacherId: swapTeacher.id, source: "conflict-fix", updatedAt: new Date().toISOString() },
                    [cellKey]: { ...occAsgn, source: "conflict-fix", updatedAt: new Date().toISOString() },
                  };
                  const nextDrafts = {
                    ...currentDrafts,
                    [occKey]: { subjectId: subject.id, teacherId: swapTeacher.id },
                    [cellKey]: {
                      subjectId: occAsgn.subjectId,
                      teacherId: occAsgn.teacherId,
                      coTeacherIds: occAsgn.coTeacherIds,
                      breakoutAssignments: occAsgn.breakoutAssignments,
                      breakoutNote: occAsgn.breakoutNote,
                    },
                  };
                  return { nextAssignments, nextDrafts };
                },
              });
              break;
            }
          }

          // 2. Try relocating Subject B to a free non-reserved slot and moving Subject A into occSlot
          if (options.length === 0) {
            const levelCfgReloc = scheduleType === "jhs" ? config?.jhs : config?.shs;
            const totalDaysReloc = (extractDaysFromLevelConfig(levelCfgReloc)?.daySequence || []).length || 5;
            for (const occSlot of occupiedMatchingSlots) {
              const occKey = createCellKey(section.id, occSlot.id);
              const occAsgn = currentAssignments[occKey];
              const occSubj = occAsgn?.subjectId ? subjectsById.get(occAsgn.subjectId) : null;
              if (!occAsgn || !occSubj || occSubj.id === subject.id) continue;
              if (isPlacementLockedSubject(occSubj, allPlacementRules)) continue;

              const occTeacher = occAsgn.teacherId ? facultyById.get(occAsgn.teacherId) : null;
              const simBusySubj = cloneBusyWithout(collectAssignmentTeacherIds(asgn), slot.id);
              const targetTeacher =
                teacher &&
                isTeacherEligible({
                  teacher,
                  subject,
                  section,
                  slot: occSlot,
                  constraints: config?.constraints,
                  teacherBusyBySlot: simBusySubj,
                  excludedSectionId: section.id,
                })
                  ? teacher
                  : activeTeachers.find((tch) =>
                      isTeacherEligible({
                        teacher: tch,
                        subject,
                        section,
                        slot: occSlot,
                        constraints: config?.constraints,
                        teacherBusyBySlot: simBusySubj,
                        excludedSectionId: section.id,
                      })
                    );
              if (!targetTeacher) continue;

              const occMaxDay = occSubj.isDoublePeriod
                ? 2
                : (parseBoundedNumber(occSubj.classesPerWeek, 1, 12, 4) > totalDaysReloc ? Math.ceil(parseBoundedNumber(occSubj.classesPerWeek, 1, 12, 4) / totalDaysReloc) : 1);
              const simBusyOcc = cloneBusyWithout(collectAssignmentTeacherIds(occAsgn), occSlot.id);
              const relocSlot = validSlots.find((rs) => {
                const rKey = createCellKey(section.id, rs.id);
                if (currentAssignments[rKey] || reservedSlotIds.has(rs.id)) return false;
                if (isSubjectRestrictedForSlot(occSubj, rs, config?.constraints, config, scheduleType, {
                  section,
                  assignments: currentAssignments,
                  slotsById,
                  subjectsById,
                  excludeCellKey: occKey,
                })) return false;
                const dCount = Object.entries(currentAssignments).reduce((acc, [ck, a]) => {
                  if (!ck.startsWith(`${section.id}|`) || ck === occKey || a?.subjectId !== occSubj.id) return acc;
                  return slotsById.get(splitCellKey(ck)[1])?.day === rs.day ? acc + 1 : acc;
                }, 0);
                if (dCount >= occMaxDay) return false;
                return (
                  !occTeacher ||
                  isTeacherEligible({
                    teacher: occTeacher,
                    subject: occSubj,
                    section,
                    slot: rs,
                    constraints: config?.constraints,
                    teacherBusyBySlot: simBusyOcc,
                    excludedSectionId: section.id,
                  })
                );
              });

              if (relocSlot) {
                const relocKey = createCellKey(section.id, relocSlot.id);
                const occLabel = formatSubjectDisplayName(occSubj, "Occupying Subject");
                const occSlotText = `${occSlot.day} ${formatPeriodOrdinalLabel(occSlot)}`;
                const relocSlotText = `${relocSlot.day} ${formatPeriodOrdinalLabel(relocSlot)}`;
                options.push({
                  label: `Move ${occLabel} to ${relocSlotText} and place ${subjLabel} in ${occSlotText}`,
                  description: `Relocate ${occLabel} to open slot ${relocSlotText} and place ${subjLabel} in its locked slot.`,
                  apply: () => {
                    const nextAssignments = { ...currentAssignments };
                    delete nextAssignments[cellKey];
                    nextAssignments[relocKey] = { ...occAsgn, source: "conflict-fix", updatedAt: new Date().toISOString() };
                    nextAssignments[occKey] = { ...asgn, subjectId: subject.id, teacherId: targetTeacher.id, source: "conflict-fix", updatedAt: new Date().toISOString() };
                    const nextDrafts = { ...currentDrafts };
                    delete nextDrafts[cellKey];
                    nextDrafts[relocKey] = {
                      subjectId: occAsgn.subjectId,
                      teacherId: occAsgn.teacherId,
                      coTeacherIds: occAsgn.coTeacherIds,
                      breakoutAssignments: occAsgn.breakoutAssignments,
                      breakoutNote: occAsgn.breakoutNote,
                    };
                    nextDrafts[occKey] = { subjectId: subject.id, teacherId: targetTeacher.id };
                    return { nextAssignments, nextDrafts };
                  },
                });
                break;
              }
            }
          }
        }

        if (options.length === 0 && isSubjDynLast8) {
          const levelConfig8 = scheduleType === "jhs" ? config?.jhs : config?.shs;
          const activeDays8 = extractDaysFromLevelConfig(levelConfig8)?.daySequence || [];
          const baseDays8 = activeDays8.length > 0 ? activeDays8 : Array.from(new Set(validSlots.map((s) => s.day).filter(Boolean)));
          const candidateDays =
            effectiveSubj.preferredDay && effectiveSubj.preferredDay !== "any"
              ? baseDays8.filter((d) => d === effectiveSubj.preferredDay)
              : baseDays8;
          const dynamicPlan = computeDynamicLastPlacementPlan({
            section,
            targetSubject: subject,
            candidateDays,
            assignments: currentAssignments,
            drafts: currentDrafts,
            validSectionSlots: validSlots,
            slotsById,
            subjectsById,
            sectionsById,
            facultyById,
            activeTeachers,
            config,
            scheduleType,
            preferTeacherId: teacher?.id || null,
            excludeCellKey: cellKey,
          });
          if (dynamicPlan) {
            options.push({
              label: dynamicPlan.label,
              description: dynamicPlan.description,
              apply: () => ({
                nextAssignments: dynamicPlan.nextAssignments,
                nextDrafts: dynamicPlan.nextDrafts,
              }),
            });
          }
        }

        options.push({
          label: `Clear out-of-preference assignment`,
          description: `Unassign this period so it can be re-assigned into the designated slot.`,
          apply: () => {
            const nextAssignments = { ...currentAssignments };
            delete nextAssignments[cellKey];
            const nextDrafts = { ...currentDrafts };
            delete nextDrafts[cellKey];
            return { nextAssignments, nextDrafts };
          },
        });
      }
    }
  }

  // 9. DOUBLE PERIOD BLOCK (Consecutive periods required)
  else if (message.includes("requires a Double Period block")) {
    category = "Double Period Block";
    severity = "warning";

    if (cellKeys.length > 0) {
      options.push({
        label: `Clear non-consecutive block`,
        description: `Unassign one of the non-adjacent periods so it can be placed in a consecutive slot.`,
        apply: () => {
          const targetKey = cellKeys[cellKeys.length - 1];
          const nextAssignments = { ...currentAssignments };
          delete nextAssignments[targetKey];
          const nextDrafts = { ...currentDrafts };
          delete nextDrafts[targetKey];
          return { nextAssignments, nextDrafts };
        },
      });
    }
  }

  // 10. SUBJECT NOT ELIGIBLE FOR SECTION
  else if (message.includes("is not eligible for this section")) {
    category = "Section Eligibility Mismatch";
    severity = "critical";

    if (cellKeys.length > 0) {
      const cellKey = cellKeys[0];
      const [secId, slotId] = splitCellKey(cellKey);
      const section = sectionsById.get(secId);
      const slot = slotsById.get(slotId);

      if (section && slot) {
        const sectionCellKeys = Object.keys(currentAssignments).filter(
          (ck) => splitCellKey(ck)[0] === section.id && ck !== cellKey
        );
        const eligibleSubjs = getSubjectsForSection(section, subjects, scheduleType);
        const subjectCounts = new Map();
        sectionCellKeys.forEach((ck) => {
          const a = currentDrafts[ck] || currentAssignments[ck];
          if (a?.subjectId) {
            subjectCounts.set(a.subjectId, (subjectCounts.get(a.subjectId) || 0) + 1);
          }
        });

        // Find eligible subjects that are actually under-scheduled for this section
        const underScheduledEligible = eligibleSubjs.filter((s) => {
          const count = subjectCounts.get(s.id) || 0;
          const req = parseBoundedNumber(s.classesPerWeek, 1, 12, 4);
          return count < req;
        });

        const placementRules10 = getAllPlacementRules(config, scheduleType);
        const slotLastInfo10 = getDynamicLastPeriodInfo({
          sectionId: section.id,
          day: slot.day,
          assignments: currentAssignments,
          slotsById,
          subjectsById,
          placementRules: placementRules10,
          excludeCellKey: cellKey,
          dayMaxPeriod: getSectionDayMaxPeriod(section, slot.day, scheduleType, config, slot),
        });

        for (const repSubj of underScheduledEligible) {
          if (isSubjectRestrictedForSlot(repSubj, slot, config?.constraints, config, scheduleType, {
            section,
            assignments: currentAssignments,
            slotsById,
            subjectsById,
            excludeCellKey: cellKey,
          })) continue;
          if (
            !isDynamicLastPeriodSubject(repSubj, placementRules10) &&
            slotLastInfo10.otherLastPeriods.length > 0 &&
            Number(slot.period || 0) >= Math.min(...slotLastInfo10.otherLastPeriods)
          ) {
            continue;
          }
          const repTeacher = activeTeachers.find((t) =>
            isTeacherEligible({
              teacher: t,
              subject: repSubj,
              section,
              slot,
              constraints: config?.constraints,
              teacherBusyBySlot: busyMap,
              excludedSectionId: section.id,
            })
          );
          if (repTeacher) {
            options.push({
              label: `Replace with missing ${formatSubjectDisplayName(repSubj)}`,
              description: `Assign required curriculum subject ${formatSubjectDisplayName(repSubj)} with ${repTeacher.name}.`,
              apply: () => {
                const nextAssignments = { ...currentAssignments, [cellKey]: { subjectId: repSubj.id, teacherId: repTeacher.id, source: "conflict-fix", updatedAt: new Date().toISOString() } };
                const nextDrafts = { ...currentDrafts, [cellKey]: { subjectId: repSubj.id, teacherId: repTeacher.id } };
                return { nextAssignments, nextDrafts };
              },
            });
            break;
          }
        }

        options.push({
          label: `Clear ineligible assignment at ${formatDayPeriodOrdinalLabel(slot)}`,
          description: `Unassign this slot to completely eliminate the curriculum violation.`,
          apply: () => {
            const nextAssignments = { ...currentAssignments };
            delete nextAssignments[cellKey];
            const nextDrafts = { ...currentDrafts };
            delete nextDrafts[cellKey];
            return { nextAssignments, nextDrafts };
          },
        });
      }
    }
  }

  // Fallback if no specific options were produced
  if (options.length === 0) {
    if (cellKeys.length > 0) {
      options.push({
        label: `Clear cell assignment`,
        description: `Unassign this conflicting period so it can be rescheduled without violations.`,
        apply: () => {
          const nextAssignments = { ...currentAssignments };
          cellKeys.forEach((ck) => delete nextAssignments[ck]);
          const nextDrafts = { ...currentDrafts };
          cellKeys.forEach((ck) => delete nextDrafts[ck]);
          return { nextAssignments, nextDrafts };
        },
      });
    } else {
      options.push({
        label: `Re-evaluate Schedule`,
        description: `Verify current constraint status.`,
        apply: () => ({ nextAssignments: currentAssignments, nextDrafts: currentDrafts }),
      });
    }
  }

  const safeOptionIndex = options.length > 0 ? ((optionIndex % options.length) + options.length) % options.length : 0;
  const activeOption = options[safeOptionIndex] || options[0];

  return {
    category,
    severity,
    options,
    optionCount: options.length,
    activeOptionIndex: safeOptionIndex,
    activeOption,
  };
}

const ScheduleDrawerPanel = memo(function ScheduleDrawerPanel({
  activeDrawerTab,
  setActiveDrawerTab,
  draftsForCurrentSchedule,
  publishedSchedules = {},
  setDrafts,
  handleLoadDraft,
  handleDeleteDraft,
  setPreviewDraftModal,
  formatDateTime,
  smallActionStyle,
  smallDangerStyle,
  schedule,
  conflictsForDisplay,
  conflictDetailsForDisplay = [],
  conflictMessagesByCell = new Map(),
  subjectChecklistMetrics = { totalRequired: 0, totalAssigned: 0, percentage: 100, incompleteCount: 0, isComplete: true },
  isAutoFixing = false,
  sections = [],
  slots = [],
  subjects = [],
  activeTeachers = [],
  facultyById = new Map(),
  subjectsById = new Map(),
  slotsById = new Map(),
  sectionsById = new Map(),
  config = {},
  scheduleType = "jhs",
  cellEditorDrafts = {},
  setCellEditorDrafts,
  setSchedule,
  showNotice = () => {},
  clearNotice = () => {},
  handleAutoFixAllConflicts,
  handleAutoDistributeFromChecklist,
  secondaryActionStyle,
  effectiveTeacherRestrictions,
  showTeacherRestrictionEditor,
  setShowTeacherRestrictionEditor,
  teacherRestrictionForm,
  setTeacherRestrictionForm,
  ancillaryTaskOptions,
  teacherRestrictionOptions,
  restrictionPeriodOptions,
  addTeacherRestriction,
  removeTeacherRestriction,
  subjectRestrictionsForDisplay,
  showSubjectRestrictionEditor,
  setShowSubjectRestrictionEditor,
  subjectRestrictionForm,
  setSubjectRestrictionForm,
  subjectRestrictionOptions,
  addSubjectRestriction,
  removeSubjectRestriction,
  EMPTY_TEACHER_RESTRICTION_FORM,
  EMPTY_SUBJECT_RESTRICTION_FORM,
  notice,
  capacityIssues = [],
  handleQuickIncreasePeriods,
  handleSaveSpaSettings,
}) {
  const [conflictOptionIndex, setConflictOptionIndex] = useState({});
  const [applyingConflictIndex, setApplyingConflictIndex] = useState(null);
  const [confirmDeleteDraftId, setConfirmDeleteDraftId] = useState(null);
  const [renderedTab, setRenderedTab] = useState(activeDrawerTab);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  useEffect(() => {
    let raf1 = null;
    let raf2 = null;
    let closeTimer = null;

    if (activeDrawerTab) {
      setRenderedTab(activeDrawerTab);
      raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => {
          setIsDrawerVisible(true);
        });
      });
    } else {
      setIsDrawerVisible(false);
      closeTimer = window.setTimeout(() => {
        setRenderedTab(null);
      }, 240);
    }

    return () => {
      if (raf1 !== null) window.cancelAnimationFrame(raf1);
      if (raf2 !== null) window.cancelAnimationFrame(raf2);
      if (closeTimer !== null) window.clearTimeout(closeTimer);
    };
  }, [activeDrawerTab]);

  useEffect(() => {
    if (!activeDrawerTab) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveDrawerTab(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeDrawerTab, setActiveDrawerTab]);

  useEffect(() => {
    if (activeDrawerTab !== "drafts") {
      setConfirmDeleteDraftId(null);
    }
  }, [activeDrawerTab]);

  const currentTab = activeDrawerTab || renderedTab;
  if (!currentTab) return null;

  const conflictCount = conflictsForDisplay ? conflictsForDisplay.length : (schedule?.conflicts?.length || 0);
  const restrictionCount = (effectiveTeacherRestrictions?.length || 0) + (subjectRestrictionsForDisplay?.length || 0);
  const checklistIncompleteCount = subjectChecklistMetrics?.incompleteCount || 0;
  const checklistNeedsAttention = Boolean(schedule) && checklistIncompleteCount > 0;
  const hasAssignments = Boolean(schedule?.assignments && Object.keys(schedule.assignments).length > 0);

  return (
    <>
      {/* Animated backdrop overlay (no full-table backdrop blur for smooth 60fps transitions) */}
      <div
        onClick={() => setActiveDrawerTab(null)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.32)",
          opacity: isDrawerVisible ? 1 : 0,
          transition: "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)",
          pointerEvents: isDrawerVisible ? "auto" : "none",
          zIndex: 9998,
        }}
      />

      {/* Right sliding drawer container */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 600,
          maxWidth: "100vw",
          height: "100vh",
          background: "#ffffff",
          boxShadow: "-8px 0 32px rgba(15, 23, 42, 0.18)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          transform: isDrawerVisible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
        }}
      >
        {/* Uniform Header Bar */}
        <div
          style={{
            padding: "16px 20px 0 20px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: 0, color: "#1f2c6f", fontSize: 16, fontWeight: 700 }}>
                Schedule Side Panel
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveDrawerTab(null)}
              style={{
                border: "none",
                background: "#cbd5e1",
                color: "#1e293b",
                width: 28,
                height: 28,
                borderRadius: "50%",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>

          {/* Uniform 4 Tabs Bar */}
          <div style={{ display: "flex", gap: 4 }}>
            <button
              type="button"
              onClick={() => setActiveDrawerTab("drafts")}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "8px 8px 0 0",
                border: "1px solid",
                borderColor: currentTab === "drafts" ? "#cbd5e1" : "transparent",
                borderBottom: currentTab === "drafts" ? "2px solid #3B4197" : "none",
                background: currentTab === "drafts" ? "#ffffff" : "transparent",
                color: currentTab === "drafts" ? "#1f2c6f" : "#64748b",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <span>Drafts</span>
              <span style={{ background: "#e0e7ff", color: "#3730a3", fontSize: 11, padding: "1px 6px", borderRadius: 99 }}>{draftsForCurrentSchedule.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDrawerTab("conflicts")}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "8px 8px 0 0",
                border: "1px solid",
                borderColor: currentTab === "conflicts" ? (conflictCount > 0 ? "#fecdd3" : "#bfdbfe") : "transparent",
                borderBottom: currentTab === "conflicts" ? (conflictCount > 0 ? "2px solid #e11d48" : "2px solid #2563eb") : "none",
                background: currentTab === "conflicts" ? "#ffffff" : "transparent",
                color: currentTab === "conflicts" ? (conflictCount > 0 ? "#be123c" : "#1f2c6f") : (conflictCount > 0 ? "#dc2626" : "#64748b"),
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <span>Conflicts</span>
              <span style={{ background: conflictCount > 0 ? "#ffe4e6" : "#f1f5f9", color: conflictCount > 0 ? "#9f1239" : "#475569", fontSize: 11, padding: "1px 6px", borderRadius: 99 }}>{conflictCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDrawerTab("restrictions")}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "8px 8px 0 0",
                border: "1px solid",
                borderColor: currentTab === "restrictions" ? "#bfdbfe" : "transparent",
                borderBottom: currentTab === "restrictions" ? "2px solid #2563eb" : "none",
                background: currentTab === "restrictions" ? "#ffffff" : "transparent",
                color: currentTab === "restrictions" ? "#1d4ed8" : "#64748b",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <span>Restrictions</span>
              <span style={{ background: "#dbeafe", color: "#1e40af", fontSize: 11, padding: "1px 6px", borderRadius: 99 }}>{restrictionCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDrawerTab("checklist")}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "8px 8px 0 0",
                border: "1px solid",
                borderColor: currentTab === "checklist" ? (checklistNeedsAttention ? "#fecdd3" : "#c7d2fe") : "transparent",
                borderBottom: currentTab === "checklist" ? (checklistNeedsAttention ? "2px solid #e11d48" : "2px solid #3B4197") : "none",
                background: currentTab === "checklist" ? "#ffffff" : "transparent",
                color: currentTab === "checklist" ? (checklistNeedsAttention ? "#be123c" : "#3B4197") : (checklistNeedsAttention ? "#dc2626" : "#64748b"),
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <span>Checklist</span>
              <span
                style={{
                  background: checklistNeedsAttention ? "#ffe4e6" : schedule ? "#dcfce7" : "#f1f5f9",
                  color: checklistNeedsAttention ? "#9f1239" : schedule ? "#166534" : "#475569",
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 99,
                }}
              >
                {checklistIncompleteCount}
              </span>
            </button>
          </div>
        </div>

        {/* Sticky Drawer Feedback Banner (visible across all tabs regardless of scroll position) */}
        {notice?.text ? (
          <div
            style={{
              padding: "10px 16px",
              background: notice.type === "error" ? "#fef2f2" : notice.type === "info" ? "#fffbeb" : "#f0fdf4",
              borderBottom: notice.type === "error" ? "1px solid #fecdd3" : notice.type === "info" ? "1px solid #fcd34d" : "1px solid #bbf7d0",
              color: notice.type === "error" ? "#991b1b" : notice.type === "info" ? "#92400e" : "#166534",
              fontSize: 12.5,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              onClick={clearNotice}
              aria-label="Dismiss notification"
              style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                lineHeight: 1,
                padding: "0 4px",
              }}
            >
              ×
            </button>
          </div>
        ) : null}

        {/* Tab Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
          {currentTab === "drafts" && (
            <div>
              <h3 style={{ margin: "0 0 4px", color: "#1f2c6f", fontSize: 16, fontWeight: 700 }}>Saved Schedule Drafts</h3>
              <p style={{ margin: "0 0 14px", color: "#64748b", fontSize: 12 }}>
                Load, preview, or delete saved drafts and published timetables for this grade level.
              </p>

              {draftsForCurrentSchedule.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 10px", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
                  <p style={{ margin: 0, color: "#64748b", fontSize: 13, fontWeight: 600 }}>No saved drafts found.</p>
                  <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 12 }}>Click "Save Draft" on the main toolbar to store current draft.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {draftsForCurrentSchedule.map((draft) => {
                    const draftConflictCount = Array.isArray(draft.schedule?.conflicts) ? draft.schedule.conflicts.length : 0;
                    const isPublishedDraft =
                      draft.status === "published" ||
                      draft.schedule?.status === "published" ||
                      publishedSchedules?.[scheduleType]?.id === draft.id;
                    const isCurrentlyLoaded = Boolean(schedule?.id && schedule.id === draft.id);
                    const assignedSlotsCount = Object.keys(draft.schedule?.assignments || {}).length;

                    return (
                      <div
                        key={draft.id}
                        style={{
                          border: isCurrentlyLoaded ? "1.5px solid #3B4197" : "1px solid #e2e8f0",
                          borderRadius: 12,
                          padding: 12,
                          background: isCurrentlyLoaded ? "#f8faff" : "#f8fafc",
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div>
                            <p style={{ margin: 0, color: "#1e293b", fontSize: 14, fontWeight: 700 }}>{draft.name}</p>
                            <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 11 }}>
                              Updated: {formatDateTime(draft.updatedAt)} • {assignedSlotsCount} assigned slots
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 99,
                                background: draftConflictCount > 0 ? "#fee2e2" : "#dcfce7",
                                border: draftConflictCount > 0 ? "1px solid #fca5a5" : "1px solid #86efac",
                                color: draftConflictCount > 0 ? "#991b1b" : "#166534",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {draftConflictCount} {draftConflictCount === 1 ? "Conflict" : "Conflicts"}
                            </span>
                            {isPublishedDraft ? (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 99,
                                  background: "#dcfce7",
                                  border: "1px solid #86efac",
                                  color: "#166534",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Published
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 99,
                                  background: "#e0e7ff",
                                  color: "#3730a3",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Draft
                              </span>
                            )}
                            {isCurrentlyLoaded ? (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 99,
                                  background: "#dbeafe",
                                  color: "#1e40af",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Loaded
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                          <button type="button" onClick={() => handleLoadDraft(draft.id)} style={{ ...smallActionStyle(), flex: 1, padding: "6px" }}>
                            {isCurrentlyLoaded ? "Reload Schedule" : "Load Schedule"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewDraftModal(draft)}
                            style={{
                              ...smallActionStyle(),
                              flex: 1.2,
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                              padding: "6px",
                              fontWeight: 700,
                            }}
                            title="Preview timetable and export as landscape A4 PDF"
                          >
                            Preview & Export PDF
                          </button>
                          <button
                            type="button"
                            disabled={isPublishedDraft}
                            onClick={() =>
                              setConfirmDeleteDraftId((prev) => (prev === draft.id ? null : draft.id))
                            }
                            style={{
                              ...smallDangerStyle(),
                              padding: "6px 12px",
                              opacity: isPublishedDraft ? 0.5 : 1,
                              cursor: isPublishedDraft ? "not-allowed" : "pointer",
                              background: confirmDeleteDraftId === draft.id ? "#fee2e2" : undefined,
                            }}
                            title={
                              isPublishedDraft
                                ? "Live published schedule cannot be deleted until replaced by a newer published schedule"
                                : "Delete this draft"
                            }
                          >
                            Delete
                          </button>
                        </div>

                        {confirmDeleteDraftId === draft.id && !isPublishedDraft ? (
                          <div
                            style={{
                              marginTop: 4,
                              padding: "8px 10px",
                              borderRadius: 8,
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#991b1b" }}>
                              {isCurrentlyLoaded
                                ? "Delete this currently loaded draft permanently?"
                                : "Delete this draft permanently?"}
                            </span>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteDraftId(null)}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  border: "1px solid #cbd5e1",
                                  background: "#ffffff",
                                  color: "#334155",
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmDeleteDraftId(null);
                                  handleDeleteDraft(draft.id, true);
                                }}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  border: "1px solid #dc2626",
                                  background: "#dc2626",
                                  color: "#ffffff",
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Confirm Delete
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentTab === "conflicts" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, color: conflictCount > 0 ? "#991b1b" : "#166534", fontSize: 16, fontWeight: 700 }}>
                    Schedule Conflicts ({conflictCount})
                  </h3>
                  <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 12 }}>
                    Conflicting cells are highlighted in red on grid.
                  </p>
                </div>
                {conflictCount > 0 ? (
                  <button
                    type="button"
                    disabled={isAutoFixing || applyingConflictIndex !== null}
                    onClick={handleAutoFixAllConflicts}
                    style={{
                      ...secondaryActionStyle(),
                      background: isAutoFixing ? "#f1f5f9" : "#fee2e2",
                      borderColor: isAutoFixing ? "#cbd5e1" : "#fca5a5",
                      color: isAutoFixing ? "#64748b" : "#991b1b",
                      fontSize: 12,
                      padding: "6px 12px",
                      cursor: isAutoFixing || applyingConflictIndex !== null ? "wait" : "pointer",
                      opacity: isAutoFixing || applyingConflictIndex !== null ? 0.75 : 1,
                    }}
                  >
                    {isAutoFixing ? "Fixing..." : "Auto-Fix All"}
                  </button>
                ) : null}
              </div>

              {/* Timetable Capacity Deficit Diagnostic Card */}
              {hasAssignments && capacityIssues.length > 0 && conflictsForDisplay.some((c) => c.includes("required recurring daily period")) && (
                <div
                  style={{
                    background: "#f0f4ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: 14,
                    boxShadow: "0 2px 8px rgba(59, 65, 151, 0.08)",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#1f2c6f" }}>
                        Timetable Capacity Shortfall Detected
                      </h4>
                      {capacityIssues.map((issue) => (
                        <p
                          key={issue.section.id}
                          style={{ margin: "0 0 8px", fontSize: 12, color: "#334155", lineHeight: 1.45 }}
                        >
                          <strong>{issue.sectionName}</strong> requires <strong>{issue.totalRequired} weekly periods</strong> across its subjects, but the timetable physically only has <strong>{issue.availableSlots} available slots</strong> (<span style={{ color: "#1e40af", fontWeight: 700, background: "#dbeafe", padding: "1px 6px", borderRadius: 4 }}>{issue.deficit} slot shortage</span>). Auto-Fix cannot place subjects beyond available timetable capacity.
                        </p>
                      ))}

                      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                        <button
                          type="button"
                          onClick={handleQuickIncreasePeriods}
                          style={{
                            padding: "9px 14px",
                            background: "linear-gradient(135deg, #3B4197 0%, #2563eb 100%)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            boxShadow: "0 2px 6px rgba(59, 65, 151, 0.28)",
                          }}
                        >
                          Expand to 9 Periods & Populate (45 Slots Quick Fix)
                        </button>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = "/dashboard?tab=school-profile&subtab=config";
                            }}
                            style={{
                              flex: 1,
                              padding: "7px 10px",
                              background: "#ffffff",
                              color: "#3B4197",
                              border: "1px solid #bfdbfe",
                              borderRadius: 6,
                              fontWeight: 600,
                              fontSize: 11,
                              cursor: "pointer",
                              textAlign: "center",
                            }}
                          >
                            Adjust Daily Periods (Scheduling Configurations)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = "/dashboard?tab=subjects";
                            }}
                            style={{
                              flex: 1,
                              padding: "7px 10px",
                              background: "#ffffff",
                              color: "#3B4197",
                              border: "1px solid #bfdbfe",
                              borderRadius: 6,
                              fontWeight: 600,
                              fontSize: 11,
                              cursor: "pointer",
                              textAlign: "center",
                            }}
                          >
                            Adjust Subject Workload (Subjects)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {conflictCount === 0 ? (
                !hasAssignments ? (
                  <div style={{ textAlign: "center", padding: "32px 16px", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
                    <p style={{ margin: 0, color: "#1e293b", fontSize: 14, fontWeight: 700 }}>Grid Cleared (Empty Schedule)</p>
                    <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>
                      All assignments have been cleared. Click &quot;Re-Generate&quot; to populate conflict-free slots.
                    </p>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "32px 16px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
                    <span style={{ fontSize: 24, display: "block", marginBottom: 6 }}>✓</span>
                    <p style={{ margin: 0, color: "#166534", fontSize: 14, fontWeight: 700 }}>No conflicts detected!</p>
                    <p style={{ margin: "4px 0 0", color: "#15803d", fontSize: 12 }}>All section & teacher assignments are valid.</p>
                  </div>
                )
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {conflictsForDisplay.map((conflict, index) => {
                    const conflictDetail = (conflictDetailsForDisplay || []).find(
                      (entry) => sanitizeText(entry?.message) === sanitizeText(conflict)
                    );
                    const currentOptionIdx = conflictOptionIndex[index] || 0;
                    const resolution = getConflictResolutions({
                      conflict,
                      conflictDetail,
                      index,
                      optionIndex: currentOptionIdx,
                      sections,
                      slots,
                      subjects,
                      activeTeachers,
                      facultyById,
                      subjectsById,
                      slotsById,
                      sectionsById,
                      config,
                      scheduleType,
                      schedule,
                      cellEditorDrafts,
                    });

                    const handleApplyThisFix = () => {
                      if (!resolution.activeOption || !resolution.activeOption.apply) return;
                      if (applyingConflictIndex !== null || isAutoFixing) return;

                      const beforeCount = conflictsForDisplay.length;
                      setApplyingConflictIndex(index);

                      window.setTimeout(() => {
                        try {
                          const { nextAssignments, nextDrafts } = resolution.activeOption.apply();
                          const evaluation = evaluateSchedule({
                            assignments: nextAssignments,
                            sections,
                            slots,
                            subjects,
                            teachers: activeTeachers,
                            scheduleType,
                            config,
                          });
                          const afterCount = (evaluation.conflicts || []).length;
                          const nowIso = new Date().toISOString();
                          if (setCellEditorDrafts) setCellEditorDrafts(nextDrafts);
                          if (setSchedule) {
                            const nextSchedObj = {
                              ...(schedule || {}),
                              assignments: nextAssignments,
                              conflicts: evaluation.conflicts,
                              conflictDetails: evaluation.conflictDetails,
                              teacherLoadPercent: evaluation.teacherLoadPercent,
                              updatedAt: nowIso,
                            };
                            setSchedule(nextSchedObj);
                            try {
                              const currentDrafts = loadJson(DRAFTS_STORAGE_KEY, []);
                              if (nextSchedObj.id && Array.isArray(currentDrafts) && currentDrafts.length > 0) {
                                let matched = false;
                                const updatedDrafts = currentDrafts.map((d) => {
                                  if (d.id === nextSchedObj.id) {
                                    matched = true;
                                    return {
                                      ...d,
                                      updatedAt: nowIso,
                                      schedule: {
                                        ...(d.schedule || {}),
                                        ...nextSchedObj,
                                      },
                                    };
                                  }
                                  return d;
                                });
                                if (matched) {
                                  if (setDrafts) setDrafts(updatedDrafts);
                                  saveJson(DRAFTS_STORAGE_KEY, updatedDrafts);
                                }
                              }
                            } catch (e) {
                              console.warn("Could not persist individual conflict fix to drafts:", e);
                            }
                          }
                          if (showNotice) {
                            if (afterCount < beforeCount) {
                              showNotice(
                                `Applied "${resolution.activeOption.label}" — resolved ${beforeCount - afterCount} conflict(s) (${beforeCount} -> ${afterCount}).`,
                                "success"
                              );
                            } else if (afterCount === 0) {
                              showNotice(`Applied "${resolution.activeOption.label}" — 0 conflicts remaining.`, "success");
                            } else {
                              showNotice(
                                `Re-evaluated "${resolution.activeOption.label}", but ${afterCount} conflict(s) remain. Try "See Other Option" or edit the cell manually.`,
                                "info"
                              );
                            }
                          }
                        } finally {
                          setApplyingConflictIndex(null);
                        }
                      }, 20);
                    };

                    return (
                      <div
                        key={index}
                        style={{
                          border: "1px solid " + (resolution.severity === "critical" ? "#fca5a5" : "#fcd34d"),
                          borderRadius: 12,
                          padding: "14px 16px",
                          background: resolution.severity === "critical" ? "#fff5f5" : "#fffbeb",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {/* Header: Chip + Category */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 6,
                              background: resolution.severity === "critical" ? "#fee2e2" : "#fef3c7",
                              color: resolution.severity === "critical" ? "#991b1b" : "#92400e",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {resolution.category}
                          </span>
                          {resolution.optionCount > 1 ? (
                            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                              Option {resolution.activeOptionIndex + 1} of {resolution.optionCount}
                            </span>
                          ) : null}
                        </div>

                        {/* Conflict description */}
                        <p style={{ margin: 0, color: "#1e293b", fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>
                          {conflict}
                        </p>

                        {/* Recommended Solution Card */}
                        {resolution.activeOption ? (
                          <div
                            style={{
                              background: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: 8,
                              padding: "10px 12px",
                              fontSize: 12,
                              color: "#334155",
                              lineHeight: 1.4,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <span style={{ color: "#3B4197", fontWeight: 700 }}>Recommended Solution:</span>
                              <span style={{ fontWeight: 700, color: "#1e293b" }}>{resolution.activeOption.label}</span>
                            </div>
                            <p style={{ margin: 0, color: "#475569" }}>{resolution.activeOption.description}</p>
                          </div>
                        ) : null}

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 2 }}>
                          {resolution.optionCount > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setConflictOptionIndex((prev) => ({
                                  ...prev,
                                  [index]: (prev[index] || 0) + 1,
                                }))
                              }
                              style={{
                                padding: "6px 12px",
                                background: "#ffffff",
                                border: "1px solid #cbd5e1",
                                borderRadius: 6,
                                color: "#334155",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              See Other Option ({resolution.optionCount})
                            </button>
                          ) : null}

                          <button
                            type="button"
                            disabled={applyingConflictIndex !== null || isAutoFixing}
                            onClick={handleApplyThisFix}
                            style={{
                              padding: "6px 14px",
                              background:
                                applyingConflictIndex === index
                                  ? "#64748b"
                                  : "linear-gradient(135deg, #3B4197 0%, #2563eb 100%)",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: applyingConflictIndex !== null || isAutoFixing ? "wait" : "pointer",
                              opacity: applyingConflictIndex !== null || isAutoFixing ? 0.75 : 1,
                              boxShadow: "0 2px 4px rgba(59, 65, 151, 0.2)",
                            }}
                          >
                            {applyingConflictIndex === index ? "Applying..." : "Apply Fix"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {currentTab === "restrictions" && (
            <PeriodRestrictionsContent
              effectiveTeacherRestrictions={effectiveTeacherRestrictions}
              showTeacherRestrictionEditor={showTeacherRestrictionEditor}
              setShowTeacherRestrictionEditor={setShowTeacherRestrictionEditor}
              teacherRestrictionForm={teacherRestrictionForm}
              setTeacherRestrictionForm={setTeacherRestrictionForm}
              ancillaryTaskOptions={ancillaryTaskOptions}
              teacherRestrictionOptions={teacherRestrictionOptions}
              restrictionPeriodOptions={restrictionPeriodOptions}
              addTeacherRestriction={addTeacherRestriction}
              removeTeacherRestriction={removeTeacherRestriction}
              subjectRestrictionsForDisplay={subjectRestrictionsForDisplay}
              showSubjectRestrictionEditor={showSubjectRestrictionEditor}
              setShowSubjectRestrictionEditor={setShowSubjectRestrictionEditor}
              subjectRestrictionForm={subjectRestrictionForm}
              setSubjectRestrictionForm={setSubjectRestrictionForm}
              subjectRestrictionOptions={subjectRestrictionOptions}
              addSubjectRestriction={addSubjectRestriction}
              removeSubjectRestriction={removeSubjectRestriction}
              EMPTY_TEACHER_RESTRICTION_FORM={EMPTY_TEACHER_RESTRICTION_FORM}
              EMPTY_SUBJECT_RESTRICTION_FORM={EMPTY_SUBJECT_RESTRICTION_FORM}
              notice={notice}
            />
          )}

          {currentTab === "checklist" && (
            <SubjectDistributionChecklist
              scheduleType={scheduleType}
              sections={sections}
              subjects={subjects}
              activeTeachers={activeTeachers}
              facultyById={facultyById}
              subjectsById={subjectsById}
              sectionsById={sectionsById}
              conflictMessagesByCell={conflictMessagesByCell}
              schedule={schedule}
              setSchedule={setSchedule}
              cellEditorDrafts={cellEditorDrafts}
              setCellEditorDrafts={setCellEditorDrafts}
              showNotice={showNotice}
              slots={slots}
              config={config}
              isTeacherEligibleForSubject={isChecklistTeacherEligible}
              onAutoDistribute={handleAutoDistributeFromChecklist}
              isAutoDistributing={isAutoFixing}
            />
          )}
        </div>
      </div>
    </>
  );
});

function PeriodRestrictionsContent({
  effectiveTeacherRestrictions,
  showTeacherRestrictionEditor,
  setShowTeacherRestrictionEditor,
  teacherRestrictionForm,
  setTeacherRestrictionForm,
  ancillaryTaskOptions,
  teacherRestrictionOptions,
  restrictionPeriodOptions,
  addTeacherRestriction,
  removeTeacherRestriction,
  subjectRestrictionsForDisplay,
  showSubjectRestrictionEditor,
  setShowSubjectRestrictionEditor,
  subjectRestrictionForm,
  setSubjectRestrictionForm,
  subjectRestrictionOptions,
  addSubjectRestriction,
  removeSubjectRestriction,
  EMPTY_TEACHER_RESTRICTION_FORM,
  EMPTY_SUBJECT_RESTRICTION_FORM,
  notice,
}) {
  const [activeTab, setActiveTab] = useState("faculty");
  const [targetSearchQuery, setTargetSearchQuery] = useState("");
  const [showTargetDropdown, setShowTargetDropdown] = useState(false);
  const [hoveredTargetId, setHoveredTargetId] = useState(null);
  const comboboxRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setShowTargetDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allGroupRoles = useMemo(() => {
    const list = [
      { id: "all-with-ancillary", name: "All Teachers with Ancillary Tasks", type: "all-with-ancillary" },
    ];

    (ancillaryTaskOptions || []).forEach((task) => {
      list.push({ id: `ancillary:${task}`, name: task, type: "ancillary-task" });
    });

    return list;
  }, [ancillaryTaskOptions]);

  const filteredGroupRoles = useMemo(() => {
    const query = targetSearchQuery.toLowerCase().trim();
    if (!query) return allGroupRoles;
    return allGroupRoles.filter((item) => item.name.toLowerCase().includes(query));
  }, [targetSearchQuery, allGroupRoles]);

  const filteredTeachers = useMemo(() => {
    const query = targetSearchQuery.toLowerCase().trim();
    if (!query) return teacherRestrictionOptions;
    return teacherRestrictionOptions.filter((item) =>
      (item.label || item.name || "").toLowerCase().includes(query)
    );
  }, [targetSearchQuery, teacherRestrictionOptions]);



  return (
    <div>
      <div style={{ display: "flex", borderBottom: "1px solid #eef2f7", background: "#ffffff", marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setActiveTab("faculty")}
          style={{
            padding: "10px 14px",
            border: "none",
            background: "transparent",
            borderBottom: activeTab === "faculty" ? "2.5px solid #1e40af" : "2.5px solid transparent",
            color: activeTab === "faculty" ? "#1e40af" : "#64748b",
            fontWeight: activeTab === "faculty" ? 700 : 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Faculty Restrictions ({effectiveTeacherRestrictions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("subject")}
          style={{
            padding: "10px 14px",
            border: "none",
            background: "transparent",
            borderBottom: activeTab === "subject" ? "2.5px solid #1e40af" : "2.5px solid transparent",
            color: activeTab === "subject" ? "#1e40af" : "#64748b",
            fontWeight: activeTab === "subject" ? 700 : 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Subject Constraints ({subjectRestrictionsForDisplay.length})
        </button>
      </div>

      <div>
        {activeTab === "faculty" ? (
          <div style={{ display: "grid", gap: 14 }}>
            {!showTeacherRestrictionEditor ? (
              <button
                type="button"
                onClick={() => {
                  setShowTeacherRestrictionEditor(true);
                  setTeacherRestrictionForm(EMPTY_TEACHER_RESTRICTION_FORM);
                  setTargetSearchQuery("");
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  background: "#1e40af",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  alignSelf: "start",
                }}
              >
                + Add Faculty Restriction
              </button>
            ) : (
              <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 16, background: "#f8fafc", display: "grid", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>New Faculty Restriction</span>
                  <button
                    type="button"
                    onClick={() => setShowTeacherRestrictionEditor(false)}
                    style={{ border: "none", background: "transparent", color: "#64748b", fontSize: 18, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>

                <Field label="Who to restrict? (Type teacher name or ancillary role)">
                  <div ref={comboboxRef} style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Type teacher name (e.g. Ana Manalastas) or role (e.g. Head Teacher)..."
                      value={targetSearchQuery}
                      onChange={(e) => {
                        setTargetSearchQuery(e.target.value);
                        setShowTargetDropdown(true);
                      }}
                      onFocus={() => setShowTargetDropdown(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setShowTargetDropdown(false);
                      }}
                      style={inputStyle(false)}
                    />

                    {showTargetDropdown && (
                      <div
                        onMouseDown={(e) => e.preventDefault()}
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          maxHeight: 240,
                          overflowY: "auto",
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: 10,
                          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.18)",
                          zIndex: 9999,
                          marginTop: 4,
                        }}
                      >
                        {filteredGroupRoles.length > 0 && (
                          <div>
                            <div style={{ padding: "6px 12px", background: "#f1f5f9", fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                              Ancillary Roles & Group Targets
                            </div>
                            {filteredGroupRoles.map((role) => {
                              const isHovered = hoveredTargetId === role.id;
                              return (
                                <div
                                  key={role.id}
                                  onMouseEnter={() => setHoveredTargetId(role.id)}
                                  onMouseLeave={() => setHoveredTargetId(null)}
                                  onClick={() => {
                                    if (role.type === "all-with-ancillary") {
                                      setTeacherRestrictionForm((prev) => ({
                                        ...prev,
                                        targetType: "all-with-ancillary",
                                        ancillaryTask: "",
                                        teacherId: "",
                                      }));
                                      setTargetSearchQuery("All Teachers with Ancillary Tasks");
                                    } else {
                                      setTeacherRestrictionForm((prev) => ({
                                        ...prev,
                                        targetType: "ancillary-task",
                                        ancillaryTask: role.name,
                                        teacherId: "",
                                      }));
                                      setTargetSearchQuery(role.name);
                                    }
                                    setShowTargetDropdown(false);
                                  }}
                                  style={{
                                    padding: "9px 12px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#1e40af",
                                    background: isHovered ? "#eff6ff" : "#ffffff",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f1f5f9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    transition: "background 0.1s ease",
                                  }}
                                >
                                  <span>{role.name}</span>
                                  <span style={{ fontSize: 10, background: isHovered ? "#bfdbfe" : "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>Group Role</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {filteredTeachers.length > 0 && (
                          <div>
                            <div style={{ padding: "6px 12px", background: "#f1f5f9", fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                              Individual Faculty Members
                            </div>
                            {filteredTeachers.map((teacher) => {
                              const isHovered = hoveredTargetId === teacher.id;
                              return (
                                <div
                                  key={teacher.id}
                                  onMouseEnter={() => setHoveredTargetId(teacher.id)}
                                  onMouseLeave={() => setHoveredTargetId(null)}
                                  onClick={() => {
                                    setTeacherRestrictionForm((prev) => ({
                                      ...prev,
                                      targetType: "specific-teacher",
                                      teacherId: teacher.id,
                                      ancillaryTask: "",
                                    }));
                                    setTargetSearchQuery(teacher.name);
                                    setShowTargetDropdown(false);
                                  }}
                                  style={{
                                    padding: "9px 12px",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: isHovered ? "#0f172a" : "#334155",
                                    background: isHovered ? "#f1f5f9" : "#ffffff",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f1f5f9",
                                    transition: "background 0.1s ease",
                                  }}
                                >
                                  {teacher.name}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {filteredGroupRoles.length === 0 && filteredTeachers.length === 0 && (
                          <div style={{ padding: "14px", fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                            No matching teacher or ancillary role found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Field>

                <div>
                  <div style={{ marginBottom: 6 }}>
                    <label style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#334155" }}>
                      Cannot teach during these periods:
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6 }}>
                    {restrictionPeriodOptions.map((periodLabel) => {
                      const checked = teacherRestrictionForm.periodLabels.includes(periodLabel);
                      return (
                        <label
                          key={periodLabel}
                          style={{
                            border: checked ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                            background: checked ? "#eff6ff" : "#ffffff",
                            borderRadius: 6,
                            padding: "6px 8px",
                            fontSize: 12,
                            fontWeight: 600,
                            color: checked ? "#1e40af" : "#334155",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
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
                                return { ...prev, periodLabels: normalizeStringArray(next) };
                              });
                            }}
                          />
                          {periodLabel}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowTeacherRestrictionEditor(false)}
                    style={{ padding: "8px 16px", borderRadius: 6, background: "#f1f5f9", border: "none", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addTeacherRestriction}
                    style={{ padding: "8px 16px", borderRadius: 6, background: "#1e40af", border: "none", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                  >
                    Save Restriction
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              {effectiveTeacherRestrictions.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>No faculty restrictions configured yet.</p>
              ) : (
                effectiveTeacherRestrictions.map((entry) => (
                  <div
                    key={entry.teacherId}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      background: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block" }}>
                        {entry.teacherName || entry.teacherId}
                      </span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        Restricted: {(entry.periodLabels || []).join(", ") || "—"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTeacherRestriction(entry.teacherId)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                        color: "#991b1b",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {!showSubjectRestrictionEditor ? (
              <button
                type="button"
                onClick={() => {
                  setShowSubjectRestrictionEditor(true);
                  setSubjectRestrictionForm(EMPTY_SUBJECT_RESTRICTION_FORM);
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  background: "#1e40af",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  alignSelf: "start",
                }}
              >
                + Add Subject Constraint
              </button>
            ) : (
              <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 16, background: "#f8fafc", display: "grid", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>New Subject Constraint</span>
                  <button
                    type="button"
                    onClick={() => setShowSubjectRestrictionEditor(false)}
                    style={{ border: "none", background: "transparent", color: "#64748b", fontSize: 18, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>

                <Field label="Select Subject">
                  <select
                    value={subjectRestrictionForm.subjectId}
                    onChange={(event) => setSubjectRestrictionForm((prev) => ({ ...prev, subjectId: event.target.value }))}
                    style={selectStyle(false)}
                  >
                    <option value="">-- Select Subject --</option>
                    {subjectRestrictionOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.subjectName || item.label}
                        {item.subjectCode || item.gradeLevel
                          ? ` (${[item.subjectCode, item.gradeLevel ? `Grade ${item.gradeLevel}` : ""].filter(Boolean).join(" - ")})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Forbidden / Blocked Periods (Subject will NOT be scheduled here):
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6 }}>
                    {restrictionPeriodOptions.map((periodLabel) => {
                      const checked = subjectRestrictionForm.periodLabels.includes(periodLabel);
                      return (
                        <label
                          key={periodLabel}
                          style={{
                            border: checked ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                            background: checked ? "#eff6ff" : "#ffffff",
                            borderRadius: 6,
                            padding: "6px 8px",
                            fontSize: 12,
                            fontWeight: 600,
                            color: checked ? "#1e40af" : "#334155",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
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
                                return { ...prev, periodLabels: normalizeStringArray(next) };
                              });
                            }}
                          />
                          {periodLabel}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <Field label="Reason / Notes">
                  <input
                    type="text"
                    placeholder="e.g. Physical Education should not be scheduled at 1st Period or last period"
                    value={subjectRestrictionForm.reason}
                    onChange={(event) => setSubjectRestrictionForm((prev) => ({ ...prev, reason: event.target.value }))}
                    style={inputStyle(false)}
                  />
                </Field>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowSubjectRestrictionEditor(false)}
                    style={{ padding: "8px 16px", borderRadius: 6, background: "#f1f5f9", border: "none", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addSubjectRestriction}
                    style={{ padding: "8px 16px", borderRadius: 6, background: "#1e40af", border: "none", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                  >
                    Save Constraint
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              {subjectRestrictionsForDisplay.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>No subject constraints configured yet.</p>
              ) : (
                subjectRestrictionsForDisplay.map((entry) => (
                  <div
                    key={entry.subjectId}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      background: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block" }}>
                        {entry.subjectName || entry.subjectId}
                      </span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        Restricted: {(entry.periodLabels || []).join(", ") || "—"} {entry.reason ? `(${entry.reason})` : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSubjectRestriction(entry.subjectId)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                        color: "#991b1b",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        
      </div>
    </div>
  );
}

function DraftTimetablePreviewModal({ open, draft, onClose, onLoad }) {
  if (!open || !draft) return null;

  return (
    <TimeTables
      initialData={draft}
      isModal={true}
      modalTitle={`Draft Timetable Preview: ${draft.name || "Saved Draft"}`}
      onClose={onClose}
      onLoadDraft={onLoad}
    />
  );
}

function SpaSpecializationDrawerContent({ config, activeTeachers = [], facultyById = new Map(), onSave }) {
  const initialSpecializations = (config?.spaSettings?.specializations && Array.isArray(config.spaSettings.specializations) && config.spaSettings.specializations.length > 0)
    ? config.spaSettings.specializations
    : [
        { name: "Media Arts", defaultTeacherId: "EMP-2026-051" },
        { name: "Dance Arts", defaultTeacherId: "EMP-2026-052" },
        { name: "Instrumental Music", defaultTeacherId: "EMP-2026-053" },
      ];

  const [specializations, setSpecializations] = useState(initialSpecializations);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Group teachers: MAPEH/SPA specialists first, then others
  const mapehTeachers = activeTeachers.filter((t) => {
    const dept = String(t.department || "").toLowerCase();
    const spec = String(t.specialization || "").toLowerCase();
    return dept.includes("mapeh") || dept.includes("art") || dept.includes("music") ||
           spec.includes("mapeh") || spec.includes("art") || spec.includes("music") || spec.includes("dance");
  });
  const otherTeachers = activeTeachers.filter((t) => !mapehTeachers.some((m) => m.id === t.id));

  const handleNameChange = (index, newName) => {
    setSpecializations((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: newName };
      return next;
    });
    setSaveSuccess(false);
  };

  const handleTeacherChange = (index, newTeacherId) => {
    setSpecializations((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], defaultTeacherId: newTeacherId };
      return next;
    });
    setSaveSuccess(false);
  };

  const handleAddStream = () => {
    setSpecializations((prev) => [
      ...prev,
      { name: `Specialization ${prev.length + 1}`, defaultTeacherId: "" },
    ]);
    setSaveSuccess(false);
  };

  const handleRemoveStream = (index) => {
    if (specializations.length <= 1) return;
    setSpecializations((prev) => prev.filter((_, i) => i !== index));
    setSaveSuccess(false);
  };

  const handleResetDefaults = () => {
    setSpecializations([
      { name: "Media Arts", defaultTeacherId: "EMP-2026-051" },
      { name: "Dance Arts", defaultTeacherId: "EMP-2026-052" },
      { name: "Instrumental Music", defaultTeacherId: "EMP-2026-053" },
    ]);
    setSaveSuccess(false);
  };

  // Check duplicate teachers among configured defaults
  const teacherIds = specializations.map((s) => s.defaultTeacherId).filter(Boolean);
  const hasDuplicateDefaults = new Set(teacherIds).size !== teacherIds.length;
  const hasEmptyNames = specializations.some((s) => !s.name.trim());

  const handleSave = () => {
    if (hasEmptyNames || hasDuplicateDefaults) return;
    onSave({
      requiredCount: specializations.length,
      specializations: specializations.map((s) => ({
        name: s.name.trim(),
        defaultTeacherId: s.defaultTeacherId || "",
      })),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h3 style={{ margin: 0, color: "#1f2c6f", fontSize: 16, fontWeight: 700 }}>
            SPA Specialization Curriculum Setup
          </h3>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 99,
              background: "#ede9fe",
              color: "#6d28d9",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {specializations.length} Streams Active
          </span>
        </div>
        <p style={{ margin: 0, color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>
          Under DepEd Special Program in the Arts (SPA), multiple specialization arts streams run concurrently during the single scheduled SPA Specialization period. Configure your school's specialization streams and preferred default faculty below.
        </p>
      </div>

      <div
        style={{
          background: "#faf5ff",
          border: "1px solid #e9d5ff",
          borderRadius: 10,
          padding: "12px 14px",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <div style={{ fontSize: 12, color: "#581c87", lineHeight: 1.4 }}>
          <strong>Zero Double-Booking Guarantee:</strong> When auto-generating or manually plotting schedules, each stream is allocated a distinct teacher. The generator checks both slot busy-states across all sections and teacher restrictions so no teacher is double-booked.
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Specialization Streams & Faculty:</span>
          <button
            type="button"
            onClick={handleAddStream}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              background: "#7c3aed",
              border: "none",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            + Add Stream
          </button>
        </div>

        {specializations.map((stream, idx) => (
          <div
            key={idx}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              display: "grid",
              gap: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Stream #{idx + 1}
              </span>
              {specializations.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStream(idx)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="Remove this stream"
                >
                  ✕ Remove
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                  Stream Name
                </label>
                <input
                  type="text"
                  value={stream.name}
                  onChange={(e) => handleNameChange(idx, e.target.value)}
                  placeholder="e.g. Media Arts, Dance Arts"
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#1e293b",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                  Default Assigned Faculty
                </label>
                <select
                  value={stream.defaultTeacherId}
                  onChange={(e) => handleTeacherChange(idx, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 12,
                    color: "#1e293b",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">-- Auto-Assign Available Faculty --</option>
                  <optgroup label="MAPEH / Arts Specialists (Recommended)">
                    {mapehTeachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.specialization ? `(${t.specialization})` : `(${t.department || "MAPEH"})`}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Other Faculty">
                    {otherTeachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.department || "General"})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasDuplicateDefaults && (
        <div style={{ padding: "8px 12px", borderRadius: 6, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 12 }}>
          Notice: The same default teacher is selected for multiple streams. While auto-generation will automatically pick an alternative teacher to avoid double-booking, it is recommended to assign distinct default teachers.
        </div>
      )}

      {hasEmptyNames && (
        <div style={{ padding: "8px 12px", borderRadius: 6, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 12 }}>
          Error: All stream names must be filled out before saving.
        </div>
      )}

      {saveSuccess && (
        <div style={{ padding: "8px 12px", borderRadius: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: 12, fontWeight: 700 }}>
          ✓ SPA Specialization configuration saved successfully!
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 8 }}>
        <button
          type="button"
          onClick={handleResetDefaults}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            background: "#f1f5f9",
            border: "1px solid #cbd5e1",
            color: "#475569",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reset to 3 Streams Default
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={hasEmptyNames}
          style={{
            padding: "8px 20px",
            borderRadius: 6,
            background: hasEmptyNames ? "#cbd5e1" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
            border: "none",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 700,
            cursor: hasEmptyNames ? "not-allowed" : "pointer",
            boxShadow: hasEmptyNames ? "none" : "0 4px 12px rgba(124, 58, 237, 0.3)",
          }}
        >
          Save SPA Configuration
        </button>
      </div>
    </div>
  );
}

function SpaBreakoutModal({
  open,
  modalData,
  onClose,
  activeTeachers = [],
  teacherBusyBySlot = new Map(),
  sectionsById = new Map(),
  facultyById = new Map(),
  subjectsById = new Map(),
  config = {},
  onApply,
  onRemove,
}) {
  if (!open || !modalData) return null;

  const { section, slot, cellKey, subjectId, assignment } = modalData;
  const subject = subjectsById.get(subjectId);
  const subjectName = subject?.subjectName || subject?.subjectCode || "Specialization Breakout";

  // Initial streams from assignment, subject definition, or config
  const defaultStreams = getSubjectBreakoutStreams(subject, config);

  const getInitialStreams = () => {
    if (assignment?.breakoutAssignments && Array.isArray(assignment.breakoutAssignments) && assignment.breakoutAssignments.length > 0) {
      return assignment.breakoutAssignments.map((b, idx) => ({
        id: `stream-${idx}-${Date.now()}`,
        name: b.stream || `Specialization ${idx + 1}`,
        teacherId: b.teacherId || "",
      }));
    }

    const assignedIds = new Set();
    return defaultStreams.map((s, idx) => {
      let tId = "";
      if (s.defaultTeacherId && !assignedIds.has(s.defaultTeacherId)) {
        const busySec = teacherBusyBySlot.get(s.defaultTeacherId)?.get(slot.id);
        const isBusyElsewhere = busySec && busySec !== section.id;
        const tObj = facultyById.get(s.defaultTeacherId);
        const isRestricted = tObj ? matchesUnavailablePeriod(slot, tObj.unavailablePeriods) : false;
        if (!isBusyElsewhere && !isRestricted) {
          tId = s.defaultTeacherId;
          assignedIds.add(tId);
        }
      }
      return {
        id: `stream-${idx}-${Date.now()}`,
        name: s.name,
        teacherId: tId,
      };
    });
  };

  const [streams, setStreams] = useState(getInitialStreams);

  // Group teachers into qualified specialists and other faculty
  const qualifiedTeachers = activeTeachers.filter((t) => doesTeacherMatchSubject(t, subject));
  const otherTeachers = activeTeachers.filter((t) => !qualifiedTeachers.some((m) => m.id === t.id));

  const handleStreamNameChange = (index, newName) => {
    setStreams((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: newName };
      return next;
    });
  };

  const handleStreamTeacherChange = (index, newTeacherId) => {
    setStreams((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], teacherId: newTeacherId };
      return next;
    });
  };

  const handleAddStream = () => {
    setStreams((prev) => [
      ...prev,
      {
        id: `stream-${prev.length}-${Date.now()}`,
        name: `Specialization ${prev.length + 1}`,
        teacherId: "",
      },
    ]);
  };

  const handleRemoveStream = (index) => {
    if (streams.length <= 1) return;
    setStreams((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation
  const selectedTeacherIds = streams.map((s) => s.teacherId).filter(Boolean);
  const hasDuplicates = new Set(selectedTeacherIds).size !== selectedTeacherIds.length;
  const allStreamsHaveTeacher = streams.every((s) => !!s.teacherId);
  const allStreamNamesValid = streams.every((s) => s.name.trim().length > 0);

  // Check double-booking across sections for each stream
  const doubleBookedStreams = streams.map((s, idx) => {
    if (!s.teacherId) return null;
    const busySecId = teacherBusyBySlot.get(s.teacherId)?.get(slot.id);
    if (busySecId && busySecId !== section.id) {
      const busySec = sectionsById.get(busySecId);
      const tObj = facultyById.get(s.teacherId);
      return {
        streamName: s.name,
        teacherName: tObj?.name || s.teacherId,
        sectionName: busySec?.name || busySecId,
      };
    }
    return null;
  }).filter(Boolean);

  const canApply = allStreamsHaveTeacher && allStreamNamesValid && !hasDuplicates && doubleBookedStreams.length === 0;

  const handleApplyClick = () => {
    if (!canApply) return;

    const breakoutAssignments = streams.map((s) => {
      const t = facultyById.get(s.teacherId) || activeTeachers.find((item) => item.id === s.teacherId);
      return {
        stream: s.name.trim(),
        teacherId: s.teacherId,
        teacherName: t?.name || s.teacherId,
      };
    });

    const primaryTeacherId = breakoutAssignments[0].teacherId;
    const coTeacherIds = breakoutAssignments.slice(1).map((b) => b.teacherId);
    const breakoutNote = breakoutAssignments.map((b) => `${b.stream.toUpperCase()} – ${b.teacherName}`).join("; ");

    onApply({
      primaryTeacherId,
      coTeacherIds,
      breakoutAssignments,
      breakoutNote,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          width: "100%",
          maxWidth: 680,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#ffffff" }}>
                {subjectName} Breakout Assignment
              </h2>
            </div>
            <div style={{ display: "flex", gap: 8, fontSize: 12, color: "#c7d2fe" }}>
              <span style={{ fontWeight: 600 }}>{section.name} (Grade {section.grade})</span>
              <span>•</span>
              <span>{slot.label} ({slot.startTime} – {slot.endTime})</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "#ffffff",
              width: 32,
              height: 32,
              borderRadius: "50%",
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Info Banner */}
        <div style={{ padding: "12px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.45 }}>
            Under DepEd curriculum guidelines, this subject divides into concurrent streams running simultaneously in this period. Assign <strong>one distinct teacher per stream</strong>. Double-booking between streams or across sections is strictly blocked.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "grid", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
              Specialization Streams ({streams.length} Total):
            </span>
            <button
              type="button"
              onClick={handleAddStream}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                background: "#f3e8ff",
                border: "1px solid #d8b4fe",
                color: "#7e22ce",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Add Stream
            </button>
          </div>

          {streams.map((stream, idx) => (
            <div
              key={stream.id || idx}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "#fafafa",
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase" }}>
                  Stream #{idx + 1}
                </span>
                {streams.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStream(idx)}
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                    Stream Name
                  </label>
                  <input
                    type="text"
                    value={stream.name}
                    onChange={(e) => handleStreamNameChange(idx, e.target.value)}
                    placeholder="e.g. Media Arts, Dance Arts"
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#1e293b",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                    Assigned Teacher
                  </label>
                  <select
                    value={stream.teacherId}
                    onChange={(e) => handleStreamTeacherChange(idx, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: 12,
                      color: "#1e293b",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">-- Select Teacher --</option>
                    <optgroup label={`${subject?.subjectName || "Subject"} Specialists`}>
                      {qualifiedTeachers.map((t) => {
                        const isUsedInOtherStream = streams.some((s, si) => si !== idx && s.teacherId === t.id);
                        const busySecId = teacherBusyBySlot.get(t.id)?.get(slot.id);
                        const isDoubleBooked = busySecId && busySecId !== section.id;
                        const isRestricted = matchesUnavailablePeriod(slot, t.unavailablePeriods);
                        const isDisabled = isUsedInOtherStream || isDoubleBooked || isRestricted;

                        let note = "";
                        if (isUsedInOtherStream) {
                          const otherS = streams.find((s, si) => si !== idx && s.teacherId === t.id);
                          note = `Selected in ${otherS?.name || "another stream"}`;
                        } else if (isDoubleBooked) {
                          note = `Double-booked in ${sectionsById.get(busySecId)?.name || busySecId}`;
                        } else if (isRestricted) {
                          note = "Unavailable / Restricted";
                        }

                        return (
                          <option key={t.id} value={t.id} disabled={isDisabled}>
                            {t.name} {t.specialization ? `(${t.specialization})` : ""} {note ? `— [${note}]` : ""}
                          </option>
                        );
                      })}
                    </optgroup>
                    <optgroup label="Other Faculty">
                      {otherTeachers.map((t) => {
                        const isUsedInOtherStream = streams.some((s, si) => si !== idx && s.teacherId === t.id);
                        const busySecId = teacherBusyBySlot.get(t.id)?.get(slot.id);
                        const isDoubleBooked = busySecId && busySecId !== section.id;
                        const isRestricted = matchesUnavailablePeriod(slot, t.unavailablePeriods);
                        const isDisabled = isUsedInOtherStream || isDoubleBooked || isRestricted;

                        let note = "";
                        if (isUsedInOtherStream) {
                          const otherS = streams.find((s, si) => si !== idx && s.teacherId === t.id);
                          note = `Selected in ${otherS?.name || "another stream"}`;
                        } else if (isDoubleBooked) {
                          note = `Double-booked in ${sectionsById.get(busySecId)?.name || busySecId}`;
                        } else if (isRestricted) {
                          note = "Unavailable / Restricted";
                        }

                        return (
                          <option key={t.id} value={t.id} disabled={isDisabled}>
                            {t.name} ({t.department || "Faculty"}) {note ? `— [${note}]` : ""}
                          </option>
                        );
                      })}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          ))}

          {/* Real-time Status / Validation Messages */}
          {hasDuplicates && (
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 12, fontWeight: 600 }}>
              Duplicate Teacher Error: Each specialization stream must have a different teacher during this period.
            </div>
          )}

          {doubleBookedStreams.length > 0 && (
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 12, fontWeight: 600 }}>
              Double-Booking Detected: {doubleBookedStreams.map((d) => `${d.teacherName} (${d.streamName}) is already teaching ${d.sectionName} at this time.`).join(" ")}
            </div>
          )}

          {!allStreamsHaveTeacher && (
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "#fffbeb", border: "1px solid #fef3c7", color: "#b45309", fontSize: 12, fontWeight: 600 }}>
              Please assign a dedicated teacher to each of the {streams.length} specialization streams.
            </div>
          )}

          {canApply && (
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: 12, fontWeight: 700 }}>
              ✓ All {streams.length} streams assigned with distinct, conflict-free faculty. Ready to apply!
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {assignment ? (
            <button
              type="button"
              onClick={onRemove}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Clear Assignment
            </button>
          ) : <div />}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#475569",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyClick}
              disabled={!canApply}
              style={{
                padding: "8px 20px",
                borderRadius: 6,
                background: canApply ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "#cbd5e1",
                border: "none",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                cursor: canApply ? "pointer" : "not-allowed",
                boxShadow: canApply ? "0 4px 12px rgba(79, 70, 229, 0.3)" : "none",
              }}
            >
              Apply Breakout Assignment ({streams.length} Teachers)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ScheduleGenerator as ScheduleMaker };

