import React, { useEffect, useState, useRef, useMemo } from "react";
import html2pdf from "html2pdf.js";

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
  if (sectionsRaw && typeof sectionsRaw === "object" && scheduleType === "jhs") {
    list = [7, 8, 9, 10]
      .flatMap((grade) => {
        const gradeConfig = sectionsRaw?.jhs?.[grade];
        const entries = Array.isArray(gradeConfig?.sections) ? gradeConfig.sections : [];
        return entries.map((section, index) => ({
          id: section?.id || `jhs-${grade}-${index}`,
          level: "jhs",
          grade,
          name: section?.name || `Grade ${grade} Section ${index + 1}`,
          classification: section?.classification || "Regular",
          track: section?.track || "",
        }));
      });
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
    return left.name.localeCompare(right.name);
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

const DEFAULT_PROFILE_FALLBACK = {
  schoolName: "DIADI NATIONAL HIGH SCHOOL",
  schoolId: "300627",
  division: "Schools Division of Nueva Vizcaya",
  region: "Region II – Cagayan Valley",
  district: "Diadi District",
  address: "Poblacion, Diadi, Nueva Vizcaya",
  email: "300627@deped.gov.ph",
  website: "www.deped-nv.com.ph",
  academicYear: "2026-2027",
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

function SignatoryBlock({ schoolProfile }) {
  const preparedByList = (schoolProfile?.signatories?.preparedBy) || DEFAULT_PROFILE_FALLBACK.signatories.preparedBy;
  const conformed = schoolProfile?.signatories?.conformed || DEFAULT_PROFILE_FALLBACK.signatories.conformed;
  const recommending = schoolProfile?.signatories?.recommendingApproval || DEFAULT_PROFILE_FALLBACK.signatories.recommendingApproval;
  const approved = schoolProfile?.signatories?.approved || DEFAULT_PROFILE_FALLBACK.signatories.approved;

  return (
    <div style={{ marginTop: 24, paddingTop: 12, fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#000", marginBottom: 12 }}>Prepared by:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, textAlign: "center" }}>
            {preparedByList.map((sig, idx) => (
              <div key={idx}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#000", textTransform: "uppercase", textDecoration: "underline" }}>
                  {sig.name || "COORDINATOR NAME"}
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#222" }}>
                  {sig.title || "Subject Coordinator"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: 220, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#000", textAlign: "left", marginBottom: 12 }}>Conformed:</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#000", textTransform: "uppercase", textDecoration: "underline" }}>
            {conformed.name || "CONFORMED NAME"}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#222" }}>
            {conformed.title || "Asst. Principal Designate"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-start", gap: 30, marginTop: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#000", marginBottom: 12 }}>Recommending Approval</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#000", textTransform: "uppercase", textDecoration: "underline" }}>
            {recommending.name || "PRINCIPAL NAME"}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#222" }}>
            {recommending.title || "Secondary School Principal II"}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#000", marginBottom: 12 }}>Approved</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#000", textTransform: "uppercase", textDecoration: "underline" }}>
            {approved.name || "SUPERVISOR NAME"}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#222" }}>
            {approved.title || "District_In-Charge"}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "2.5px solid #000", marginTop: 18, paddingTop: 6, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#000" }}>
          <div><strong>Address:</strong> {schoolProfile?.address || "Poblacion, Diadi, Nueva Vizcaya"}</div>
          <div><strong>Email Address:</strong> {schoolProfile?.email || "300627@deped.gov.ph"}</div>
          <div><strong>Website:</strong> {schoolProfile?.website || "www.deped-nv.com.ph"}</div>
        </div>
      </div>
    </div>
  );
}

function DepEdTopHeader({ schoolProfile, title, subtitle, adviserName, isDraft }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 20, position: "relative" }}>
      {isDraft && (
        <div style={{ position: "absolute", top: 0, right: 0, padding: "2px 8px", background: "#fef3c7", color: "#b45309", border: "1px solid #f59e0b", borderRadius: 4, fontWeight: 800, fontSize: 11 }}>
          DRAFT - FOR APPROVAL
        </div>
      )}
      <div style={{ fontSize: 12, fontFamily: "'Times New Roman', serif", fontWeight: 700, textTransform: "uppercase", color: "#000", letterSpacing: 0.5 }}>
        Republic of the Philippines
      </div>
      <div style={{ fontSize: 14, fontFamily: "'Times New Roman', serif", fontWeight: 800, textTransform: "uppercase", color: "#000", letterSpacing: 0.5 }}>
        Department of Education
      </div>
      <div style={{ fontSize: 12, fontFamily: "'Times New Roman', serif", fontWeight: 700, color: "#111" }}>
        {schoolProfile?.region || "Region II – Cagayan Valley"}
      </div>
      <div style={{ fontSize: 12, fontFamily: "'Times New Roman', serif", fontWeight: 700, color: "#111" }}>
        {schoolProfile?.division || "Schools Division of Nueva Vizcaya"}
      </div>
      <div style={{ fontSize: 18, fontFamily: "Georgia, serif", fontWeight: 900, textTransform: "uppercase", color: "#000", letterSpacing: 1, marginTop: 4 }}>
        {schoolProfile?.schoolName || "DIADI NATIONAL HIGH SCHOOL"}
      </div>

      <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 800, fontSize: 16, letterSpacing: 1.2, color: "#000", textTransform: "uppercase", marginTop: 8 }}>
        {title}
      </div>
      <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: 12, color: "#222", marginTop: 2 }}>
        S.Y. {schoolProfile?.academicYear || "2026-2027"}
      </div>
      <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: 1, color: "#000", textTransform: "uppercase", marginTop: 6 }}>
        {subtitle}
      </div>
      {adviserName && adviserName !== "-" && (
        <div style={{ fontSize: 12, fontWeight: 700, color: "#333", marginTop: 2 }}>
          Adviser: <span style={{ textTransform: "uppercase" }}>{adviserName}</span>
        </div>
      )}
    </div>
  );
}

export default function TimeTables({
  initialData = null,
  isModal = false,
  modalTitle = "",
  onClose = null,
  onLoadDraft = null,
}) {
  const [scheduleData, setScheduleData] = useState(null);
  const [scheduleSourceType, setScheduleSourceType] = useState("none");
  const [availableSources, setAvailableSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [schoolProfile, setSchoolProfile] = useState(() => getFromStorage("turotugma_school_profile", DEFAULT_PROFILE_FALLBACK));

  const exportSchedulesRef = useRef();
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("sections"); // 'sections' or 'teachers'
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState("all");

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
    loadAllSchedules(initialSource);

    const handleSync = () => {
      if (!initialData) loadAllSchedules();
    };
    const handleProfileSync = () => {
      setSchoolProfile(getFromStorage("turotugma_school_profile", DEFAULT_PROFILE_FALLBACK));
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("focus", handleSync);
    window.addEventListener("turotugma:schedule-updated", handleSync);
    window.addEventListener("turotugma:profile-updated", handleProfileSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("turotugma:schedule-updated", handleSync);
      window.removeEventListener("turotugma:profile-updated", handleProfileSync);
    };
  }, [initialData]);

  const loadAllSchedules = (forcedActive = null) => {
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
              scheduleType: type,
              name: `Published Schedule — ${type.toUpperCase()}`,
              updatedAt: item.publishedAt || item.updatedAt || new Date().toISOString(),
              schedule: item,
              config: item.config || item.scheduleConfig,
            });
          }
        }
      });
    }

    if (Array.isArray(draftsRaw)) {
      draftsRaw.forEach((draft) => {
        if (draft && draft.schedule) {
          if (!forcedActive || draft.id !== forcedActive.id) {
            sources.push({
              id: draft.id || `draft-${Date.now()}`,
              type: "draft",
              scheduleType: draft.scheduleType || "jhs",
              name: draft.name || "Saved Draft",
              updatedAt: draft.updatedAt || new Date().toISOString(),
              schedule: draft.schedule,
              config: draft.config,
            });
          }
        }
      });
    }

    sources.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    setAvailableSources(sources);

    if (forcedActive) {
      setSelectedSourceId(forcedActive.id);
      setScheduleData(forcedActive);
      setScheduleSourceType(forcedActive.type);
    } else if (sources.length > 0) {
      setSelectedSourceId((prevId) => {
        const found = prevId ? sources.find((s) => s.id === prevId) : null;
        const active = found || sources[0];
        setScheduleData(active);
        setScheduleSourceType(active.type);
        return active.id;
      });
    } else {
      setScheduleData(null);
      setScheduleSourceType("none");
    }

    const sectionsRaw = getFromStorage(SECTIONS_STORAGE_KEY, {});
    setSections(normalizeSections(sectionsRaw, "jhs"));
    setSubjects(getFromStorage(SUBJECTS_STORAGE_KEY, []));
    setTeachers(getFromStorage(FACULTY_STORAGE_KEY, []));
  };

  const handleSourceChange = (e) => {
    const id = e.target.value;
    setSelectedSourceId(id);
    const found = availableSources.find((s) => s.id === id);
    if (found) {
      setScheduleData(found);
      setScheduleSourceType(found.type);
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

    const secList = Array.isArray(sched.sections) && sched.sections.length > 0 ? sched.sections : sections;
    const secMap = new Map();
    secList.forEach((s) => {
      if (s.id) secMap.set(s.id, s);
      if (s.name) secMap.set(s.name, s);
      if (s.code) secMap.set(s.code, s);
    });

    const allSubjects = Array.isArray(sched.subjects) && sched.subjects.length > 0
      ? [...sched.subjects, ...(subjects || [])]
      : subjects || [];
    const subMap = new Map();
    allSubjects.forEach((s) => {
      if (s.id) subMap.set(s.id, s);
      if (s.subjectCode) subMap.set(s.subjectCode, s);
      if (s.code) subMap.set(s.code, s);
    });

    const allTeachers = Array.isArray(sched.teachers) && sched.teachers.length > 0
      ? [...sched.teachers, ...(teachers || [])]
      : Array.isArray(sched.faculty) && sched.faculty.length > 0
      ? [...sched.faculty, ...(teachers || [])]
      : teachers || [];
    const tMap = new Map();
    allTeachers.forEach((t) => {
      if (t.id) tMap.set(t.id, t);
      if (t.name) tMap.set(t.name, t);
      if (t.teacherName) tMap.set(t.teacherName, t);
    });

    let slotList = Array.isArray(sched.slots) && sched.slots.length > 0 ? sched.slots : [];
    if (slotList.length === 0) {
      slotList = buildSlotsForTimetable(cfg, stType);
    }

    const sById = new Map(slotList.map((s) => [s.id, s]));

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

    const isAutomatedMode = (levelCfg?.periodCalculationMode || levelCfg?.periodStructureMode || "automated") === "automated";
    const maxP = isAutomatedMode
      ? Math.max(maxPFromAssignments, maxPFromSlots, 1)
      : Math.max(maxPFromSlots, levelCfg.periods?.regular || 8, levelCfg.periods?.special || 8);

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

      sectionAliases.forEach((alias) => {
        if (day && period) {
          cellIdx.set(`${alias}|${day}|${period}`, item);
        }
        cellIdx.set(`${alias}|${slotId}`, item);
      });

      if (item.teacherId && day && period) {
        teacherIdx.set(`${item.teacherId}|${day}|${period}`, { assignment: item, sectionId: secId });
      }
    });

    const secIds = Array.from(
      new Set([...Object.keys(assign).map((k) => k.split("|")[0]), ...secList.map((s) => s.id)])
    ).filter(Boolean);

    let tIds = Array.from(new Set(Object.values(assign).map((a) => a?.teacherId).filter(Boolean)));
    if (tIds.length === 0 && teachers.length > 0) {
      tIds = teachers.map((t) => t.id);
    }

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
    const secObj = sectionsById.get(sectionId);
    const secName = secObj?.name || getSectionName(sectionId);
    return (
      cellAssignmentIndex.get(`${sectionId}|${day}|${periodNum}`) ||
      cellAssignmentIndex.get(`${secName}|${day}|${periodNum}`) ||
      null
    );
  }

  function getTeacherCellAssignment(teacherId, day, periodNum) {
    return teacherAssignmentIndex.get(`${teacherId}|${day}|${periodNum}`) || null;
  }

  function getAdviserName(sectionId) {
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
      const style = document.createElement("style");
      style.innerHTML = `
        .export-section-page-break { page-break-after: always; break-after: page; }
        @media print { .export-section-page-break { page-break-after: always; break-after: page; } }
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      `;
      exportClone.prepend(style);
      Array.from(exportClone.querySelectorAll("div")).forEach((div) => {
        if (div.classList.contains("schedule-block")) {
          div.classList.add("export-section-page-break");
        }
      });
      html2pdf()
        .set({
          margin: 0.2,
          filename: `Classroom-Program-${scheduleData.name || "export"}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(exportClone)
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>Time Tables</h1>
          <div style={{ margin: "6px 0 0", color: "#5b6787", fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <span>Schedule Source:</span>
            <select
              value={selectedSourceId}
              onChange={handleSourceChange}
              style={{
                fontSize: 14,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#1e293b",
                cursor: "pointer",
              }}
            >
              {availableSources.map((src) => (
                <option key={src.id} value={src.id}>
                  {src.type === "published" ? "[Published Active] " : "[Saved Draft] "}
                  {src.name}
                </option>
              ))}
            </select>
            {scheduleSourceType === "published" ? (
              <span style={{ padding: "2px 8px", borderRadius: 12, background: "#dcfce7", color: "#15803d", fontWeight: 700, fontSize: 12 }}>
                Published Active
              </span>
            ) : (
              <span style={{ padding: "2px 8px", borderRadius: 12, background: "#fef3c7", color: "#b45309", fontWeight: 700, fontSize: 12 }}>
                Draft Version
              </span>
            )}
          </div>
        </div>
        {!isModal && (
          <button
            onClick={handleExport}
            style={{
              padding: "10px 22px",
              background: "#1a3a8c",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Export as PDF
          </button>
        )}
      </div>

      {/* Controls Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          marginTop: 18,
          marginBottom: 16,
          gap: 18,
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
            }}
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
          </>
        )}

        {viewMode === "teachers" && (
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
        )}
      </div>

      {/* Classroom Program Layout Container */}
      <div ref={exportSchedulesRef}>
        {viewMode === "sections" &&
          filteredSectionIds.map((sectionId) => {
            const adviserName = getAdviserName(sectionId);
            const sectionName = getSectionName(sectionId);

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
                />

                {/* DepEd Form Grid Table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", border: "2px solid #000" }}>
                    <thead>
                      <tr style={{ background: "#8fb6e5" }}>
                        <th
                          colSpan={shortenedSessionDays.length > 0 ? 2 : 1}
                          style={{
                            border: "1px solid #000",
                            padding: "10px 8px",
                            textAlign: "center",
                            fontWeight: 800,
                            fontSize: 13,
                            color: "#000",
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
                              padding: "10px 8px",
                              fontWeight: 800,
                              fontSize: 14,
                              color: "#000",
                              textAlign: "center",
                              textTransform: "uppercase",
                              width: `${80 / days.length}%`,
                            }}
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                      <tr style={{ background: "#8fb6e5" }}>
                        <th style={{ border: "1px solid #000", padding: "4px 8px", width: 100, fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center" }}>
                          {regularSessionInitials || "REGULAR"}
                        </th>
                        {shortenedSessionDays.length > 0 && (
                          <th style={{ border: "1px solid #000", padding: "4px 8px", width: 100, fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center" }}>
                            {shortenedSessionInitials || "SHORTENED"}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Flag Raising Row on Monday */}
                      <tr style={{ background: "#fff" }}>
                        <td style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 700, fontSize: 12, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                          7:00 – 7:30
                        </td>
                        {shortenedSessionDays.length > 0 && (
                          <td style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 700, fontSize: 12, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                            7:00 – 7:30
                          </td>
                        )}
                        <td
                          colSpan={days.length}
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

                        return (
                          <React.Fragment key={periodNum}>
                            {/* Insert Morning Recess Banner if configured */}
                            {isMorningBreak && (
                              <tr>
                                <td style={{ border: "1px solid #000", padding: "4px 8px", fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                                  9:30 – 9:50
                                </td>
                                {shortenedSessionDays.length > 0 && (
                                  <td style={{ border: "1px solid #000", padding: "4px 8px", fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                                    9:15 – 9:35
                                  </td>
                                )}
                                <td
                                  colSpan={days.length}
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
                                <td style={{ border: "1px solid #000", padding: "4px 8px", fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                                  11:50 – 1:00
                                </td>
                                {shortenedSessionDays.length > 0 && (
                                  <td style={{ border: "1px solid #000", padding: "4px 8px", fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                                    11:30 – 12:30
                                  </td>
                                )}
                                <td
                                  colSpan={days.length}
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
                              <td style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 700, fontSize: 12, color: "#000", textAlign: "center", background: "#f8fafc", whiteSpace: "nowrap" }}>
                                {regularTimes[idx]}
                              </td>
                              {shortenedSessionDays.length > 0 && (
                                <td style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 700, fontSize: 12, color: "#000", textAlign: "center", background: "#f8fafc", whiteSpace: "nowrap" }}>
                                  {shortenedTimes[idx]}
                                </td>
                              )}
                              {days.map((day) => {
                                const assignment = getCellAssignment(sectionId, day, periodNum);
                                return (
                                  <td
                                    key={day}
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
                                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
                                        <div style={{ fontWeight: 800, fontSize: 13, color: "#000", textTransform: "uppercase", lineHeight: 1.2 }}>
                                          {getSubjectName(assignment.subjectId)}
                                        </div>
                                        <div style={{ color: "#222", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.2 }}>
                                          {getTeacherName(assignment.teacherId)}
                                        </div>
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
                        <td style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                          END
                        </td>
                        {shortenedSessionDays.length > 0 && (
                          <td style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center", background: "#f8fafc" }}>
                            END
                          </td>
                        )}
                        <td
                          colSpan={days.length}
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
                <SignatoryBlock schoolProfile={schoolProfile} />
              </div>
            );
          })}

        {/* Teacher Schedules View */}
        {viewMode === "teachers" &&
          filteredTeacherIds.map((teacherId) => {
            const teacherName = getTeacherName(teacherId);

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
                {/* DepEd Official Header */}
                <DepEdTopHeader
                  schoolProfile={schoolProfile}
                  title="TEACHER CLASS PROGRAM"
                  subtitle={`TEACHER: ${teacherName}`}
                  isDraft={scheduleSourceType !== "published"}
                />

                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", border: "2px solid #000" }}>
                    <thead>
                      <tr style={{ background: "#8fb6e5" }}>
                        <th
                          colSpan={shortenedSessionDays.length > 0 ? 2 : 1}
                          style={{
                            border: "1px solid #000",
                            padding: "10px 8px",
                            textAlign: "center",
                            fontWeight: 800,
                            fontSize: 13,
                            color: "#000",
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
                              padding: "10px 8px",
                              fontWeight: 800,
                              fontSize: 14,
                              color: "#000",
                              textAlign: "center",
                              textTransform: "uppercase",
                              width: `${80 / days.length}%`,
                            }}
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                      <tr style={{ background: "#8fb6e5" }}>
                        <th style={{ border: "1px solid #000", padding: "4px 8px", width: 100, fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center" }}>
                          {regularSessionInitials || "REGULAR"}
                        </th>
                        {shortenedSessionDays.length > 0 && (
                          <th style={{ border: "1px solid #000", padding: "4px 8px", width: 100, fontWeight: 700, fontSize: 11, color: "#000", textAlign: "center" }}>
                            {shortenedSessionInitials || "SHORTENED"}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((periodNum, idx) => (
                        <tr key={periodNum}>
                          <td style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 700, fontSize: 12, color: "#000", textAlign: "center", background: "#f8fafc", whiteSpace: "nowrap" }}>
                            {regularTimes[idx]}
                          </td>
                          {shortenedSessionDays.length > 0 && (
                            <td style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 700, fontSize: 12, color: "#000", textAlign: "center", background: "#f8fafc", whiteSpace: "nowrap" }}>
                              {shortenedTimes[idx]}
                            </td>
                          )}
                          {days.map((day) => {
                            const found = getTeacherCellAssignment(teacherId, day, periodNum);
                            return (
                              <td
                                key={day}
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
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
                                    <div style={{ fontWeight: 800, fontSize: 13, color: "#000", textTransform: "uppercase", lineHeight: 1.2 }}>
                                      {getSubjectName(found.assignment.subjectId)}
                                    </div>
                                    <div style={{ color: "#222", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.2 }}>
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
                <SignatoryBlock schoolProfile={schoolProfile} />
              </div>
            );
          })}
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
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .turotugma-preview-modal, .turotugma-preview-modal * { visibility: visible; }
            .turotugma-preview-backdrop { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; background: #ffffff !important; backdrop-filter: none !important; padding: 0 !important; }
            .turotugma-preview-modal { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 100% !important; max-height: none !important; border: none !important; box-shadow: none !important; overflow: visible !important; }
            .turotugma-no-print { display: none !important; }
            .schedule-block { page-break-after: always; break-after: page; }
          }
        `}</style>
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
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "#f8fafc" }}>
            {mainContent}
          </div>
        </div>
      </div>
    );
  }

  return mainContent;
}
