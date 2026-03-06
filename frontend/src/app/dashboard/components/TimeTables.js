// Normalize sections to flat array with correct IDs and names (copied from ScheduleMaker.js)
function normalizeSections(sectionsRaw, scheduleType = "jhs") {
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
          name: section?.name || `Grade ${grade} Section ${index + 1}`,
          classification: section?.classification || "Regular",
          track: section?.track || "",
        }));
      })
      .sort((left, right) => {
        if (left.grade !== right.grade) {
          return left.grade - right.grade;
        }
        return left.name.localeCompare(right.name);
      });
  }
  // Add SHS logic if needed
  return [];
}


import React, { useEffect, useState, useRef } from "react";
// Add html2pdf.js for PDF export
// You need to install html2pdf.js: npm install html2pdf.js
import html2pdf from "html2pdf.js";

function getFromStorage(key, fallback) {
  try {
    const val = window.localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

const DRAFTS_STORAGE_KEY = "turotugma_schedule_drafts";
const SECTIONS_STORAGE_KEY = "turotugma_sections_created";
const SUBJECTS_STORAGE_KEY = "turotugma_subjects";
const FACULTY_STORAGE_KEY = "turotugma_faculty";

export default function TimeTables() {
  const [draft, setDraft] = useState(null);
  // Ref for exportable schedules only (not the whole component)
  const exportSchedulesRef = useRef();
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [gradeFilter, setGradeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('sections'); // 'sections' or 'teachers'
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [teacherType, setTeacherType] = useState('all'); // 'all', 'adviser', 'non-adviser'

  useEffect(() => {
    // Load the most recent draft, supporting both array and single object formats
    const draftsRaw = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
    let latestDraft = null;
    if (draftsRaw) {
      try {
        const parsed = JSON.parse(draftsRaw);
        if (Array.isArray(parsed)) {
          if (parsed.length > 0) {
            // Sort by updatedAt descending
            parsed.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            latestDraft = parsed[0];
          }
        } else if (parsed && typeof parsed === "object") {
          latestDraft = parsed;
        }
      } catch {
        latestDraft = null;
      }
    }
    setDraft(latestDraft);
    // Use normalization for sections
    const sectionsRaw = getFromStorage(SECTIONS_STORAGE_KEY, {});
    setSections(normalizeSections(sectionsRaw, latestDraft?.scheduleType || "jhs"));
    setSubjects(getFromStorage(SUBJECTS_STORAGE_KEY, []));
    setTeachers(getFromStorage(FACULTY_STORAGE_KEY, []));
  }, []);

  function getSectionName(sectionId) {
    // Try to find the section name robustly for IDs like 'jhs-7-0'
    let allSections = [];
    if (Array.isArray(sections)) {
      allSections = sections;
    } else if (sections && (sections.jhs || sections.shs)) {
      allSections = [
        ...(sections.jhs ? Object.values(sections.jhs).flat() : []),
        ...(sections.shs ? Object.values(sections.shs).flat() : []),
      ];
    }
    // Try direct match
    let found = allSections.find((s) => s.id === sectionId);
    if (found) return found.name || found.sectionName || sectionId;
    // Try partial match (e.g., sectionId starts with s.id or vice versa)
    found = allSections.find(
      (s) =>
        typeof s.id === 'string' &&
        (sectionId.startsWith(s.id) || s.id.startsWith(sectionId))
    );
    if (found) return found.name || found.sectionName || sectionId;
    // Try to parse sectionId for fallback label and map by index if possible
    const match = sectionId.match(/jhs-(\d+)-(\d+)/i);
    if (match) {
      const grade = match[1];
      const idx = parseInt(match[2], 10);
      // Try to find all sections for this grade
      let gradeSections = allSections.filter(
        (s) =>
          (s.grade && (s.grade === grade || s.grade == parseInt(grade, 10))) ||
          (s.name && s.name.includes(grade)) ||
          (s.sectionName && s.sectionName.includes(grade))
      );
      // If not found, fallback to allSections
      if (gradeSections.length === 0) gradeSections = allSections;
      if (gradeSections[idx]) {
        return gradeSections[idx].name || gradeSections[idx].sectionName || sectionId;
      }
      return `Grade ${grade} - Section ${idx + 1}`;
    }
    return sectionId;
  }
  function getSubjectName(subjectId) {
    const found = Array.isArray(subjects) ? subjects.find((s) => s.id === subjectId) : null;
    return found ? found.subjectName || found.name : subjectId;
  }
  function getTeacherName(teacherId) {
    const found = Array.isArray(teachers) ? teachers.find((t) => t.id === teacherId) : null;
    return found ? found.teacherName || found.name : teacherId;
  }

  // Render nothing if no draft
  if (!draft || !draft.schedule || !draft.config) {
    return (
      <div>
        <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>Time Tables</h1>
        <p style={{ margin: "8px 0 24px", color: "#5b6787", fontSize: 14, maxWidth: 920 }}>
          No saved schedule draft found.
        </p>
      </div>
    );
  }

  // Use config from draft
  const config = draft.config;
  const scheduleType = draft.scheduleType;
  const assignments = draft.schedule.assignments || {};

  // For demo, use JHS config
  const levelConfig = config["jhs"];
  const weekdayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  let days = [
    ...(levelConfig.regularDays || []),
    ...(levelConfig.shortenedDays || []),
  ];
  // Remove duplicates and sort by weekday order
  days = Array.from(new Set(days)).sort((a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b));
  const periods = Array.from({ length: levelConfig.periods.regular || 8 }, (_, i) => i + 1);

  // Section and teacher view logic
  let sectionIds = Array.from(
    new Set(Object.keys(assignments).map((k) => k.split("|")[0]))
  );
  // Map sectionId to grade using normalized sections
  const sectionIdToGrade = {};
  sections.forEach(s => { sectionIdToGrade[s.id] = s.grade; });
  // Get all grades present
  const allGrades = Array.from(new Set(sections.map(s => s.grade))).sort((a, b) => a - b);

  // For teacher view: build teacher list and mapping
  let teacherIds = Array.from(
    new Set(Object.values(assignments).map(a => a.teacherId).filter(Boolean))
  );
  // Filter teachers by search term
  let filteredTeacherIds = teacherIds;
  if (viewMode === 'teachers' && searchTerm.trim()) {
    const lower = searchTerm.trim().toLowerCase();
    filteredTeacherIds = teacherIds.filter(id => {
      const teacher = teachers.find(t => t.id === id);
      return teacher && (teacher.teacherName || teacher.name || '').toLowerCase().includes(lower);
    });
  }


  // Filter sectionIds by grade if filter is set (sections view only)
  if (viewMode === 'sections' && gradeFilter !== 'all') {
    sectionIds = sectionIds.filter(id => String(sectionIdToGrade[id]) === String(gradeFilter));
  }
  // Filter sectionIds by selectedSection (sections view only)
  if (viewMode === 'sections' && selectedSection !== 'all') {
    sectionIds = sectionIds.filter(id => id === selectedSection);
  }
  // Filter sectionIds by search term (section name, sections view only)
  if (viewMode === 'sections' && searchTerm.trim()) {
    const lower = searchTerm.trim().toLowerCase();
    sectionIds = sectionIds.filter(id => {
      const section = sections.find(s => s.id === id);
      return section && (section.name || '').toLowerCase().includes(lower);
    });
  }

  // Filter teacherIds by selectedTeacher (teachers view only)
  if (viewMode === 'teachers' && selectedTeacher !== 'all') {
    filteredTeacherIds = filteredTeacherIds.filter(id => id === selectedTeacher);
  }
  // Filter teacherIds by teacherType (teachers view only)
  if (viewMode === 'teachers' && teacherType !== 'all') {
    // Find all adviser teacherIds (assigned as adviser in any section)
    const adviserIds = new Set();
    sectionIds.forEach(sectionId => {
      const firstPeriodKey = `${sectionId}|JHS-P1`;
      const adviserId = assignments[firstPeriodKey]?.teacherId;
      if (adviserId) adviserIds.add(adviserId);
    });
    if (teacherType === 'adviser') {
      filteredTeacherIds = filteredTeacherIds.filter(id => adviserIds.has(id));
    } else if (teacherType === 'non-adviser') {
      filteredTeacherIds = filteredTeacherIds.filter(id => !adviserIds.has(id));
    }
  }

  function handleExport() {
    if (exportSchedulesRef.current) {
      // Clone only the schedules container
      const exportClone = exportSchedulesRef.current.cloneNode(true);
      // Add CSS for page-breaks
      const style = document.createElement('style');
      style.innerHTML = `
        .export-section-page-break { page-break-after: always; break-after: page; }
        @media print { .export-section-page-break { page-break-after: always; break-after: page; } }
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      `;
      exportClone.prepend(style);
      // Add class to each schedule block (section or teacher)
      Array.from(exportClone.querySelectorAll('div')).forEach(div => {
        if (div.classList.contains('schedule-block')) {
          div.classList.add('export-section-page-break');
        }
      });
      html2pdf()
        .set({
          margin: 0.2,
          filename: `ScheduleDraft-${draft.name || 'export'}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
          pagebreak: { mode: ['css', 'legacy'] }
        })
        .from(exportClone)
        .save();
    }
  }

  return (
    <div>
      <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>Time Tables</h1>
      <div style={{ margin: "8px 0 8px", color: "#5b6787", fontSize: 14, maxWidth: 920 }}>
        Viewing saved schedule draft: <b>{draft.name}</b>
      </div>
      {/* Filters and dropdowns (visible on page, not in export) + Export button */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: 18,
        marginBottom: 8,
        marginLeft: 0,
        marginRight: 0,
        gap: 18,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <label style={{
            color: '#5b6787',
            fontWeight: 700,
            fontSize: 13.5,
            marginBottom: 5,
            marginLeft: 2,
          }}>
            View
          </label>
          <select
            value={viewMode}
            onChange={e => {
              setViewMode(e.target.value);
              setSelectedSection('all');
              setSelectedTeacher('all');
            }}
            style={{
              width: 220,
              fontSize: 15.5,
              padding: '7px 12px',
              borderRadius: 8,
              border: '1.2px solid #e5eaf4',
              color: '#25326f',
              background: '#f8faff',
              fontWeight: 500,
              outline: 'none',
              boxShadow: '0 1px 4px 0 rgba(30,40,90,0.04)',
              transition: 'border 0.2s',
            }}
          >
            <option value="sections">Timetables of Sections</option>
            <option value="teachers">Timetables of Teachers</option>
          </select>
        </div>
        {/* Section dropdown (sections view) */}
        {viewMode === 'sections' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{
              color: '#5b6787',
              fontWeight: 700,
              fontSize: 13.5,
              marginBottom: 5,
              marginLeft: 2,
            }}>
              Section
            </label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              style={{
                width: 180,
                fontSize: 15.5,
                padding: '7px 12px',
                borderRadius: 8,
                border: '1.2px solid #e5eaf4',
                color: '#25326f',
                background: '#f8faff',
                fontWeight: 500,
                outline: 'none',
                boxShadow: '0 1px 4px 0 rgba(30,40,90,0.04)',
                transition: 'border 0.2s',
              }}
            >
              <option value="all">All Sections</option>
              {Array.from(new Set(sections.map(s => s.id))).map(id => (
                <option key={id} value={id}>{getSectionName(id)}</option>
              ))}
            </select>
          </div>
        )}
        {/* Grade dropdown (sections view) */}
        {viewMode === 'sections' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{
              color: '#5b6787',
              fontWeight: 700,
              fontSize: 13.5,
              marginBottom: 5,
              marginLeft: 2,
            }}>
              Grade
            </label>
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              style={{
                width: 120,
                fontSize: 15.5,
                padding: '7px 12px',
                borderRadius: 8,
                border: '1.2px solid #e5eaf4',
                color: '#25326f',
                background: '#f8faff',
                fontWeight: 500,
                outline: 'none',
                boxShadow: '0 1px 4px 0 rgba(30,40,90,0.04)',
                transition: 'border 0.2s',
              }}
            >
              <option value="all">All Grades</option>
              {allGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        )}
        {/* Teacher dropdown and type filter (teachers view) */}
        {viewMode === 'teachers' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <label style={{
                color: '#5b6787',
                fontWeight: 700,
                fontSize: 13.5,
                marginBottom: 5,
                marginLeft: 2,
              }}>
                Teacher
              </label>
              <select
                value={selectedTeacher}
                onChange={e => setSelectedTeacher(e.target.value)}
                style={{
                  width: 220,
                  fontSize: 15.5,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1.2px solid #e5eaf4',
                  color: '#25326f',
                  background: '#f8faff',
                  fontWeight: 500,
                  outline: 'none',
                  boxShadow: '0 1px 4px 0 rgba(30,40,90,0.04)',
                  transition: 'border 0.2s',
                }}
              >
                <option value="all">All Teachers</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.teacherName || t.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <label style={{
                color: '#5b6787',
                fontWeight: 700,
                fontSize: 13.5,
                marginBottom: 5,
                marginLeft: 2,
              }}>
                Type
              </label>
              <select
                value={teacherType}
                onChange={e => setTeacherType(e.target.value)}
                style={{
                  width: 140,
                  fontSize: 15.5,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1.2px solid #e5eaf4',
                  color: '#25326f',
                  background: '#f8faff',
                  fontWeight: 500,
                  outline: 'none',
                  boxShadow: '0 1px 4px 0 rgba(30,40,90,0.04)',
                  transition: 'border 0.2s',
                }}
              >
                <option value="all">All</option>
                <option value="adviser">Adviser</option>
                <option value="non-adviser">Non-Adviser</option>
              </select>
            </div>
          </>
        )}
        </div>
        <button onClick={handleExport} style={{ padding: '10px 22px', background: '#1a3a8c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginLeft: 'auto', marginTop: 0, marginBottom: 0 }}>
          Export as PDF
        </button>
      </div>
      {/* Schedules to export: only these are included in PDF */}
      <div ref={exportSchedulesRef}>
        {viewMode === 'sections' && sectionIds.map((sectionId) => {
        // Adviser: teacher assigned to first period (P1) for this section
        const firstPeriodKey = `${sectionId}|JHS-P1`;
        const adviserId = assignments[firstPeriodKey]?.teacherId;
        const adviserName = adviserId ? getTeacherName(adviserId) : "-";

        // Find section classification (Regular or Special)
        const section = sections.find(s => s.id === sectionId);
        const isSpecial = section && (section.classification === 'Special' || section.classification === 'special');
        // Use correct period count for this section
        const periodCount = isSpecial ? (levelConfig.periods.special || 9) : (levelConfig.periods.regular || 8);

        // Calculate timings for each period
        function getPeriodTimes(periodType, periodCount, periodMinutes, breaks) {
          let times = [];
          let startHour = 7, startMinute = 30; // Default start time: 7:30 AM
          let currentMinutes = startHour * 60 + startMinute;
          for (let i = 1; i <= periodCount; i++) {
            // Insert breaks if needed
            let breakDuration = 0;
            if (breaks?.morning?.enabled && i - 1 === breaks.morning.afterPeriod) breakDuration += breaks.morning.duration;
            if (breaks?.lunch?.enabled && i - 1 === breaks.lunch.afterPeriod) breakDuration += breaks.lunch.duration;
            if (breaks?.afternoon?.enabled && i - 1 === breaks.afternoon.afterPeriod) breakDuration += breaks.afternoon.duration;
            currentMinutes += breakDuration;
            let endMinutes = currentMinutes + periodMinutes;
            let start = minutesToTime(currentMinutes);
            let end = minutesToTime(endMinutes);
            times.push(`${start} - ${end}`);
            currentMinutes = endMinutes;
          }
          return times;
        }

        function minutesToTime(mins) {
          let h = Math.floor(mins / 60);
          let m = mins % 60;
          let ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          if (h === 0) h = 12;
          // Always pad hour to 2 digits
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
        }

        // Helper to get day initials (e.g., 'Monday' -> 'M', 'Thursday' -> 'Th')
        function getDayInitials(day) {
          if (!day) return '';
          if (day === 'Thursday') return 'Th';
          if (day === 'Saturday') return 'Sat';
          if (day === 'Sunday') return 'Sun';
          return day[0];
        }
        const regularSessionDays = (levelConfig.regularDays || []);
        const shortenedSessionDays = (levelConfig.shortenedDays || []);
        const regularSessionInitials = regularSessionDays.map(getDayInitials).join(', ');
        const shortenedSessionInitials = shortenedSessionDays.map(getDayInitials).join(', ');

        const regularTimes = getPeriodTimes(
          'regular',
          periodCount,
          levelConfig.periodMinutes.regular || 50,
          levelConfig.breaks
        );
        const shortenedTimes = getPeriodTimes(
          'shortened',
          periodCount,
          levelConfig.periodMinutes.shortened || 45,
          levelConfig.breaks
        );

        // Build periods array for this section (1..periodCount)
        const periods = Array.from({ length: periodCount }, (_, i) => i + 1);

        return (
          <div
            key={sectionId}
            className="schedule-block"
            style={{
              marginBottom: 32,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 12px 0 rgba(30,40,90,0.07)',
              padding: 24,
              border: '1px solid #e5eaf4',
              maxWidth: 1400,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              minHeight: 32,
              padding: '0 32px',
            }}>
              <span style={{
                color: '#25326f',
                fontSize: 17,
                fontWeight: 700,
                margin: 0,
                letterSpacing: 0.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
              }}>
                <span style={{ color: '#7a86a7', fontWeight: 500, fontSize: 14, marginRight: 8 }}>Section:</span>
                {getSectionName(sectionId)}
              </span>
              <span style={{
                color: '#5b6787',
                fontSize: 15,
                fontWeight: 500,
                marginLeft: 24,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                <span style={{ color: '#7a86a7', fontWeight: 500, fontSize: 14, marginRight: 6 }}>Name of Adviser:</span>
                <b style={{ fontWeight: 700, color: '#25326f' }}>{adviserName}</b>
              </span>
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid #e5eaf4', borderRadius: 10 }}>
              <table style={{ borderCollapse: 'collapse', minWidth: 170 + days.length * 165, width: '100%' }}>
                <thead>
                  <tr>
                    <th colSpan={2} style={{
                      background: '#f6f8fc',
                      border: '1px solid #e5eaf4',
                      padding: '10px 8px 6px 8px',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      color: '#25326f',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2
                    }}>Time</th>
                    {days.map((day) => (
                      <th key={day} rowSpan={2} style={{
                        background: '#f6f8fc',
                        border: '1px solid #e5eaf4',
                        padding: '10px 8px 6px 8px',
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#25326f',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2
                      }}>{day}</th>
                    ))}
                  </tr>
                  <tr>
                    <th style={{
                      background: '#f6f8fc',
                      border: '1px solid #e5eaf4',
                      padding: '4px 8px',
                      width: 80,
                      fontWeight: 600,
                      fontSize: 12,
                      color: '#5b6787',
                      position: 'sticky',
                      top: 32,
                      zIndex: 2
                    }}>{regularSessionInitials || 'Regular'}</th>
                    <th style={{
                      background: '#f6f8fc',
                      border: '1px solid #e5eaf4',
                      padding: '4px 8px',
                      width: 80,
                      fontWeight: 600,
                      fontSize: 12,
                      color: '#5b6787',
                      position: 'sticky',
                      top: 32,
                      zIndex: 2
                    }}>{shortenedSessionInitials || 'Shortened'}</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((periodNum, idx) => (
                    <tr key={periodNum}>
                      <td style={{
                        background: '#f6f8fc',
                        border: '1px solid #e5eaf4',
                        padding: '10px 8px',
                        fontWeight: 500,
                        fontSize: 13,
                        color: '#5b6787',
                        minWidth: 110,
                        whiteSpace: 'nowrap',
                      }}>{regularTimes[idx]}</td>
                      <td style={{
                        background: '#f6f8fc',
                        border: '1px solid #e5eaf4',
                        padding: '10px 8px',
                        fontWeight: 500,
                        fontSize: 13,
                        color: '#5b6787',
                        minWidth: 110,
                        whiteSpace: 'nowrap',
                      }}>{shortenedTimes[idx]}</td>
                      {days.map((day) => {
                        // Compose slot key (e.g., jhs-7-0|JHS-P1)
                        const slotKey = `${sectionId}|JHS-P${periodNum}`;
                        const assignment = assignments[slotKey];
                        return (
                          <td key={day} style={{
                            border: '1px solid #e5eaf4',
                            padding: '10px 8px',
                            background: assignment ? '#f7faf7' : '#fff',
                            fontSize: 13,
                            color: assignment ? '#25326f' : '#7a86a7',
                            fontWeight: assignment ? 700 : 400,
                            minWidth: 120,
                            verticalAlign: 'top'
                          }}>
                            {assignment ? (
                              <>
                                <div style={{ fontWeight: 700, fontSize: 13, color: '#25326f', marginBottom: 2 }}>{getSubjectName(assignment.subjectId)}</div>
                                <div style={{ color: '#6b7898', fontSize: 12, fontWeight: 500 }}>{getTeacherName(assignment.teacherId)}</div>
                              </>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {viewMode === 'teachers' && filteredTeacherIds.map((teacherId) => {
        const teacher = teachers.find(t => t.id === teacherId);
        const teacherName = teacher ? (teacher.teacherName || teacher.name) : teacherId;
        // Find all assignments for this teacher, grouped by section and period
        // Build a map: { [sectionId]: { [periodNum]: { day, subjectId } } }
        // But for display, we want a grid: periods x days, showing subject and section
        // We'll use the same periods/days as the main timetable

        // Helper: for each cell, find the assignment for this teacher
        function findAssignment(day, periodNum) {
          // For each section, check if this teacher is assigned at this slot
          for (const sectionId of sectionIds) {
            const slotKey = `${sectionId}|JHS-P${periodNum}`;
            const assignment = assignments[slotKey];
            if (assignment && assignment.teacherId === teacherId) {
              return { assignment, sectionId };
            }
          }
          return null;
        }

        // Calculate timings for each period (reuse from above)
        function getPeriodTimes(periodType, periodCount, periodMinutes, breaks) {
          let times = [];
          let startHour = 7, startMinute = 30; // Default start time: 7:30 AM
          let currentMinutes = startHour * 60 + startMinute;
          for (let i = 1; i <= periodCount; i++) {
            // Insert breaks if needed
            let breakDuration = 0;
            if (levelConfig.breaks?.morning?.enabled && i - 1 === levelConfig.breaks.morning.afterPeriod) breakDuration += levelConfig.breaks.morning.duration;
            if (levelConfig.breaks?.lunch?.enabled && i - 1 === levelConfig.breaks.lunch.afterPeriod) breakDuration += levelConfig.breaks.lunch.duration;
            if (levelConfig.breaks?.afternoon?.enabled && i - 1 === levelConfig.breaks.afternoon.afterPeriod) breakDuration += levelConfig.breaks.afternoon.duration;
            currentMinutes += breakDuration;
            let endMinutes = currentMinutes + levelConfig.periodMinutes.regular;
            let start = minutesToTime(currentMinutes);
            let end = minutesToTime(endMinutes);
            times.push(`${start} - ${end}`);
            currentMinutes = endMinutes;
          }
          return times;
        }

        function minutesToTime(mins) {
          let h = Math.floor(mins / 60);
          let m = mins % 60;
          let ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          if (h === 0) h = 12;
          // Always pad hour to 2 digits
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
        }

        // Helper to get day initials (e.g., 'Monday' -> 'M', 'Thursday' -> 'Th')
        function getDayInitials(day) {
          if (!day) return '';
          if (day === 'Thursday') return 'Th';
          if (day === 'Saturday') return 'Sat';
          if (day === 'Sunday') return 'Sun';
          return day[0];
        }
        const regularSessionDays = (levelConfig.regularDays || []);
        const shortenedSessionDays = (levelConfig.shortenedDays || []);
        const regularSessionInitials = regularSessionDays.map(getDayInitials).join(', ');
        const shortenedSessionInitials = shortenedSessionDays.map(getDayInitials).join(', ');

        const regularTimes = getPeriodTimes(
          'regular',
          levelConfig.periods.regular || 8,
          levelConfig.periodMinutes.regular || 50,
          levelConfig.breaks
        );
        const shortenedTimes = getPeriodTimes(
          'shortened',
          levelConfig.periods.regular || 8,
          levelConfig.periodMinutes.shortened || 45,
          levelConfig.breaks
        );

        return (
          <div
            key={teacherId}
            className="schedule-block"
            style={{
              marginBottom: 32,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 12px 0 rgba(30,40,90,0.07)',
              padding: 24,
              border: '1px solid #e5eaf4',
              maxWidth: 1400,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              minHeight: 32,
              padding: '0 32px',
            }}>
              <span style={{
                color: '#25326f',
                fontSize: 17,
                fontWeight: 700,
                margin: 0,
                letterSpacing: 0.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
              }}>
                <span style={{ color: '#7a86a7', fontWeight: 500, fontSize: 14, marginRight: 8 }}>Teacher:</span>
                {teacherName}
              </span>
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid #e5eaf4', borderRadius: 10 }}>
              <table style={{ borderCollapse: 'collapse', minWidth: 170 + days.length * 165, width: '100%' }}>
                <thead>
                  <tr>
                    <th colSpan={2} style={{
                      background: '#f6f8fc',
                      border: '1px solid #e5eaf4',
                      padding: '10px 8px 6px 8px',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      color: '#25326f',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2
                    }}>Time</th>
                    {days.map((day) => (
                      <th key={day} rowSpan={2} style={{
                        background: '#f6f8fc',
                        border: '1px solid #e5eaf4',
                        padding: '10px 8px 6px 8px',
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#25326f',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2
                      }}>{day}</th>
                    ))}
                  </tr>
                  <tr>
                    <th style={{
                      background: '#f6f8fc',
                      border: '1px solid #e5eaf4',
                      padding: '4px 8px',
                      width: 80,
                      fontWeight: 600,
                      fontSize: 12,
                      color: '#5b6787',
                      position: 'sticky',
                      top: 32,
                      zIndex: 2
                    }}>{regularSessionInitials || 'Regular'}</th>
                    <th style={{
                      background: '#f6f8fc',
                      border: '1px solid #e5eaf4',
                      padding: '4px 8px',
                      width: 80,
                      fontWeight: 600,
                      fontSize: 12,
                      color: '#5b6787',
                      position: 'sticky',
                      top: 32,
                      zIndex: 2
                    }}>{shortenedSessionInitials || 'Shortened'}</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((periodNum, idx) => (
                    <tr key={periodNum}>
                      <td style={{
                        background: '#f6f8fc',
                        border: '1px solid #e5eaf4',
                        padding: '10px 8px',
                        fontWeight: 500,
                        fontSize: 13,
                        color: '#5b6787',
                        minWidth: 110,
                        whiteSpace: 'nowrap',
                      }}>{regularTimes[idx]}</td>
                      <td style={{
                        background: '#f6f8fc',
                        border: '1px solid #e5eaf4',
                        padding: '10px 8px',
                        fontWeight: 500,
                        fontSize: 13,
                        color: '#5b6787',
                        minWidth: 110,
                        whiteSpace: 'nowrap',
                      }}>{shortenedTimes[idx]}</td>
                      {days.map((day) => {
                        // For each section, check if this teacher is assigned at this slot
                        let found = null;
                        for (const sectionId of sectionIds) {
                          const slotKey = `${sectionId}|JHS-P${periodNum}`;
                          const assignment = assignments[slotKey];
                          if (assignment && assignment.teacherId === teacherId) {
                            found = { assignment, sectionId };
                            break;
                          }
                        }
                        return (
                          <td key={day} style={{
                            border: '1px solid #e5eaf4',
                            padding: '10px 8px',
                            background: found ? '#f7faf7' : '#fff',
                            fontSize: 13,
                            color: found ? '#25326f' : '#7a86a7',
                            fontWeight: found ? 700 : 400,
                            minWidth: 120,
                            verticalAlign: 'top'
                          }}>
                            {found ? (
                              <>
                                <div style={{ fontWeight: 700, fontSize: 13, color: '#25326f', marginBottom: 2 }}>{getSubjectName(found.assignment.subjectId)}</div>
                                <div style={{ color: '#6b7898', fontSize: 12, fontWeight: 500 }}>{getSectionName(found.sectionId)}</div>
                              </>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
