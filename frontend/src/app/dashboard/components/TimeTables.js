// Helper to format time as 12-hour with leading zero and AM/PM
function formatTime12hr(time) {
  if (!time) return '';
  let [h, m] = time.split(":");
  h = parseInt(h, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
}
import React, { useState } from "react";

// --- Demo data and helpers (replace with real data integration as needed) ---
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_INITIALS = { Monday: "M", Tuesday: "T", Wednesday: "W", Thursday: "Th", Friday: "F", Saturday: "S", Sunday: "Su" };
const REGULAR_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday"];
const SHORTENED_DAYS = ["Friday"];
const REGULAR_PERIODS = [
  { period: 1, start: "7:30", end: "8:20" },
  { period: 2, start: "8:20", end: "9:10" },
  { period: 3, start: "9:20", end: "10:10" },
  { period: 4, start: "10:10", end: "11:00" },
  { period: 5, start: "11:10", end: "12:00" },
];
const SHORTENED_PERIODS = [
  { period: 1, start: "7:30", end: "8:00" },
  { period: 2, start: "8:00", end: "8:30" },
  { period: 3, start: "8:40", end: "9:10" },
  { period: 4, start: "9:10", end: "9:40" },
  { period: 5, start: "9:50", end: "10:20" },
];
const DEMO_SECTIONS = [
  { id: 1, name: "Grade 7 - A", track: "STEM", grade: 7 },
  { id: 2, name: "Grade 7 - B", track: "ABM", grade: 7 },
  { id: 3, name: "Grade 8 - A", track: "HUMSS", grade: 8 },
];
const DEMO_ASSIGNMENTS = {
  // cellKey: { subject, teacher }
  "1-Monday-1": { subject: "Math", teacher: "Mr. Cruz" },
  "1-Monday-2": { subject: "English", teacher: "Ms. Santos" },
  "2-Tuesday-3": { subject: "Science", teacher: "Mr. Lee" },
  "3-Wednesday-4": { subject: "Filipino", teacher: "Ms. Reyes" },
};

function getCellKey(sectionId, day, period) {
  return `${sectionId}-${day}-${period}`;
}

export default function TimeTables() {
  // In a real app, fetch published schedule data here
  const [viewMode, setViewMode] = useState("section"); // 'section' or 'teacher'
  const days = FULL_DAYS;
  const regularDays = REGULAR_DAYS;
  const shortenedDays = SHORTENED_DAYS;
  const regularPeriods = REGULAR_PERIODS;
  const shortenedPeriods = SHORTENED_PERIODS;
  const sections = DEMO_SECTIONS;
  const assignments = DEMO_ASSIGNMENTS;

  return (
    <div>
      <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>Time Tables</h1>
      <p style={{ margin: "8px 0 24px", color: "#5b6787", fontSize: 14, maxWidth: 920 }}>
        View published class schedules in a familiar grid format. This page is read-only and matches the design of other dashboard pages.
      </p>
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 0 }}>
        <div style={{ display: 'flex', border: '1px solid #3B4197', borderRadius: 8, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setViewMode('section')}
            style={{
              background: viewMode === 'section' ? '#3B4197' : '#fff',
              color: viewMode === 'section' ? '#fff' : '#3B4197',
              border: 'none',
              outline: 'none',
              padding: '10px 32px',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderRight: '1px solid #3B4197',
            }}
          >
            Section
          </button>
          <button
            type="button"
            onClick={() => setViewMode('teacher')}
            style={{
              background: viewMode === 'teacher' ? '#3B4197' : '#fff',
              color: viewMode === 'teacher' ? '#fff' : '#3B4197',
              border: 'none',
              outline: 'none',
              padding: '10px 32px',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Teacher
          </button>
        </div>
        <span style={{ color: '#5b6787', fontSize: 13, marginLeft: 18 }}>
          {viewMode === 'section' ? 'Viewing by Section' : 'Viewing by Teacher'}
        </span>
      </div>
      {/* Section schedules */}
      {viewMode === 'section' && [
        {
          section: '11 – Cuaderno (TVL-ICT)',
          school: 'Diadi National High School',
          district: 'Diadi',
          adviser: 'Antonio, Erlinda S.',
          specialization: 'Mathematics',
          cells: {
            'Monday-0': { subject: 'Statistics and Probability', teacher: 'Antonio, Erlinda S.' },
            'Monday-1': { subject: 'Practical Research 1', teacher: 'Molina, Jonathan R.' },
            'Monday-2': { subject: 'Reading and Writing', teacher: 'Acosta, Charlotte N.' },
            'Monday-3': { subject: 'Pagbasa at Pagsusuri ng Iba’t-Ibang Teksto Tungo sa Pananaliksik', teacher: 'Mora, Charlie B.' },
            'Monday-4': { subject: 'EAPP-English for Academic and Professional Purposes', teacher: 'Dumelod, Alexis B.' },
            'Tuesday-0': { subject: 'Statistics and Probability', teacher: 'Antonio, Erlinda S.' },
            'Tuesday-1': { subject: 'Practical Research 1', teacher: 'Molina, Jonathan R.' },
            'Tuesday-2': { subject: 'Reading and Writing', teacher: 'Acosta, Charlotte N.' },
            'Tuesday-3': { subject: 'Pagbasa at Pagsusuri ng Iba’t-Ibang Teksto Tungo sa Pananaliksik', teacher: 'Mora, Charlie B.' },
            'Tuesday-4': { subject: 'Specialized TVL ICT 11', teacher: 'Chingkoy, Ruby M.' },
            'Wednesday-0': { subject: 'Preliminaries', teacher: 'Antonio, Erlinda S.' },
            'Wednesday-1': { subject: 'Preliminaries', teacher: 'Antonio, Erlinda S.' },
            'Wednesday-2': { subject: 'EAPP-English for Academic and Professional Purposes', teacher: 'Dumelod, Alexis B.' },
            'Wednesday-3': { subject: '21st Century Lit.', teacher: 'Acosta, Charlotte N.' },
            'Wednesday-4': { subject: 'Specialized TVL ICT 11', teacher: 'Chingkoy, Ruby M.' },
            'Thursday-0': { subject: 'Statistics and Probability', teacher: 'Antonio, Erlinda S.' },
            'Thursday-1': { subject: 'Practical Research 1', teacher: 'Molina, Jonathan R.' },
            'Thursday-2': { subject: 'Reading and Writing', teacher: 'Acosta, Charlotte N.' },
            'Thursday-3': { subject: 'Pagbasa at Pagsusuri ng Iba’t-Ibang Teksto Tungo sa Pananaliksik', teacher: 'Mora, Charlie B.' },
            'Thursday-4': { subject: 'Specialized TVL ICT 11', teacher: 'Chingkoy, Ruby M.' },
            'Friday-0': { subject: 'HGP', teacher: 'Antonio, Erlinda S.' },
            'Friday-1': { subject: 'Practical Research 1', teacher: 'Molina, Jonathan R.' },
            'Friday-2': { subject: 'Reading and Writing', teacher: 'Acosta, Charlotte N.' },
            'Friday-3': { subject: 'Pagbasa at Pagsusuri ng Iba’t-Ibang Teksto Tungo sa Pananaliksik', teacher: 'Mora, Charlie B.' },
            'Friday-4': { subject: 'EAPP-English for Academic and Professional Purposes', teacher: 'Dumelod, Alexis B.' },
          },
        },
        {
          section: '11 – Zaide (HUMSS)',
          school: 'Diadi National High School',
          district: 'Diadi',
          adviser: 'Rivera, Aileen D.',
          specialization: 'Mathematics',
          cells: {
            'Monday-0': { subject: 'Statistics and Probability', teacher: 'Rivera, Aileen D.' },
            'Monday-1': { subject: 'Pagbasa at Pagsusuri ng Iba’t-Ibang Teksto Tungo sa Pananaliksik', teacher: 'Mora, Charlie B.' },
            'Monday-2': { subject: '21st Century Lit.', teacher: 'Antonino, Kevin Dale' },
            'Monday-3': { subject: 'EAPP-English for Academic and Professional Purposes', teacher: 'Esguerra, Dudzje P.' },
            'Monday-4': { subject: 'Practical Research 1', teacher: 'Guanzon, James J.' },
            'Tuesday-0': { subject: 'Statistics and Probability', teacher: 'Rivera, Aileen D.' },
            'Tuesday-1': { subject: 'Pagbasa at Pagsusuri ng Iba’t-Ibang Teksto Tungo sa Pananaliksik', teacher: 'Mora, Charlie B.' },
            'Tuesday-2': { subject: '21st Century Lit.', teacher: 'Antonino, Kevin Dale' },
            'Tuesday-3': { subject: 'EAPP-English for Academic and Professional Purposes', teacher: 'Esguerra, Dudzje P.' },
            'Tuesday-4': { subject: 'Practical Research 1', teacher: 'Guanzon, James J.' },
            'Wednesday-0': { subject: 'Preliminaries', teacher: 'Rivera, Aileen D.' },
            'Wednesday-1': { subject: 'DIASS-Disciplines and Ideas in the', teacher: 'Dulawan, Angelito B.' },
            'Wednesday-2': { subject: '21st Century Lit.', teacher: 'Antonino, Kevin Dale' },
            'Wednesday-3': { subject: 'EAPP-English for Academic and Professional Purposes', teacher: 'Esguerra, Dudzje P.' },
            'Wednesday-4': { subject: 'Practical Research 1', teacher: 'Guanzon, James J.' },
            'Thursday-0': { subject: 'Statistics and Probability', teacher: 'Rivera, Aileen D.' },
            'Thursday-1': { subject: 'Pagbasa at Pagsusuri ng Iba’t-Ibang Teksto Tungo sa Pananaliksik', teacher: 'Mora, Charlie B.' },
            'Thursday-2': { subject: '21st Century Lit.', teacher: 'Antonino, Kevin Dale' },
            'Thursday-3': { subject: 'EAPP-English for Academic and Professional Purposes', teacher: 'Esguerra, Dudzje P.' },
            'Thursday-4': { subject: 'Practical Research 1', teacher: 'Guanzon, James J.' },
            'Friday-0': { subject: 'HGP', teacher: 'Rivera, Aileen D.' },
            'Friday-1': { subject: 'EAPP-English for Academic and Professional Purposes', teacher: 'Esguerra, Dudzje P.' },
            'Friday-2': { subject: '21st Century Lit.', teacher: 'Antonino, Kevin Dale' },
            'Friday-3': { subject: 'Reading and Writing', teacher: 'Acosta, Charlotte N.' },
            'Friday-4': { subject: 'Introduction to World Religions and Belief Systems', teacher: 'Dulawan, Angelito B.' },
          },
        },
        {
          section: '11 – Alcala (STEM)',
          school: 'Diadi National High School',
          district: 'Diadi',
          adviser: 'Binayan, Julie G.',
          specialization: 'Science',
          cells: {
            'Monday-0': { subject: 'General Biology 2', teacher: 'Binayan, Julie G.' },
            'Monday-1': { subject: 'Basic Calculus', teacher: 'Binayan, Julie G.' },
            'Monday-2': { subject: 'Practical Research 1', teacher: 'Mora, Charlie B.' },
            'Monday-3': { subject: 'Reading and Writing', teacher: 'Acosta, Charlotte N.' },
            'Monday-4': { subject: 'Pagbasa at Pagsusuri ng Iba’t-Ibang Teksto Tungo sa Pananaliksik', teacher: 'Mora, Charlie B.' },
            'Tuesday-0': { subject: 'General Biology 2', teacher: 'Binayan, Julie G.' },
            'Tuesday-1': { subject: 'Basic Calculus', teacher: 'Binayan, Julie G.' },
            'Tuesday-2': { subject: 'Statistics and Probability', teacher: 'Rivera, Aileen D.' },
            'Tuesday-3': { subject: '21st Century Lit.', teacher: 'Antonino, Kevin Dale' },
            'Tuesday-4': { subject: 'General Chemistry 1', teacher: 'Esguerra, Dudzje P.' },
            'Wednesday-0': { subject: 'Preliminaries', teacher: 'Binayan, Julie G.' },
            'Wednesday-1': { subject: 'General Biology 2', teacher: 'Binayan, Julie G.' },
            'Wednesday-2': { subject: 'Basic Calculus', teacher: 'Binayan, Julie G.' },
            'Wednesday-3': { subject: 'Reading and Writing', teacher: 'Acosta, Charlotte N.' },
            'Wednesday-4': { subject: 'EAPP-English for Academic and Professional Purposes', teacher: 'Esguerra, Dudzje P.' },
            'Thursday-0': { subject: 'General Biology 2', teacher: 'Binayan, Julie G.' },
            'Thursday-1': { subject: 'Practical Research 1', teacher: 'Mora, Charlie B.' },
            'Thursday-2': { subject: 'Basic Calculus', teacher: 'Binayan, Julie G.' },
            'Thursday-3': { subject: 'Reading and Writing', teacher: 'Acosta, Charlotte N.' },
            'Thursday-4': { subject: 'General Chemistry 1', teacher: 'Esguerra, Dudzje P.' },
            'Friday-0': { subject: 'HGP', teacher: 'Binayan, Julie G.' },
            'Friday-1': { subject: 'General Chemistry 1', teacher: 'Esguerra, Dudzje P.' },
            'Friday-2': { subject: 'General Chemistry 1', teacher: 'Esguerra, Dudzje P.' },
            'Friday-3': { subject: 'EAPP-English for Academic and Professional Purposes', teacher: 'Esguerra, Dudzje P.' },
            'Friday-4': { subject: 'Introduction to World Religions and Belief Systems', teacher: 'Dulawan, Angelito B.' },
          },
        },
      ].map((sched, idx) => (
        <div key={idx} style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 12, minWidth: 0, marginBottom: 28 }}>
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ fontSize: 13, color: '#25326f', fontWeight: 700 }}>Section: <span style={{ fontWeight: 500, color: '#3B4197' }}>{sched.section}</span></div>
            <div style={{ fontSize: 13, color: '#25326f', fontWeight: 700 }}>School: <span style={{ fontWeight: 500, color: '#3B4197' }}>{sched.school}</span></div>
            <div style={{ fontSize: 13, color: '#25326f', fontWeight: 700 }}>District: <span style={{ fontWeight: 500, color: '#3B4197' }}>{sched.district}</span></div>
            <div style={{ fontSize: 13, color: '#25326f', fontWeight: 700 }}>Name of Adviser: <span style={{ fontWeight: 500, color: '#3B4197' }}>{sched.adviser}</span></div>
            <div style={{ fontSize: 13, color: '#25326f', fontWeight: 700 }}>Specialization: <span style={{ fontWeight: 500, color: '#3B4197' }}>{sched.specialization}</span></div>
          </div>
          <div style={{ overflowX: "auto", border: "1px solid #e5eaf4", borderRadius: 10 }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ ...stickyHeaderCellStyle(), textAlign: 'center' }} colSpan={2}>Time</th>
                  {days.map((day) => (
                    <th key={day} rowSpan={2} style={headerCellStyle()}>{day}</th>
                  ))}
                </tr>
                <tr>
                  <th style={headerCellStyle()}>{regularDays.map((d) => DAY_INITIALS[d]).join(", ")}</th>
                  <th style={headerCellStyle()}>{shortenedDays.map((d) => DAY_INITIALS[d]).join(", ")}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.max(regularPeriods.length, shortenedPeriods.length) }).map((_, i) => (
                  <tr key={i}>
                    <td style={{ ...stickyRowHeaderCellStyle(), textAlign: 'center' }}>
                      {regularPeriods[i] ? (
                        <span style={{ fontWeight: 700, color: "#25326f", fontSize: 13 }}>{`${formatTime12hr(regularPeriods[i].start)} - ${formatTime12hr(regularPeriods[i].end)}`}</span>
                      ) : null}
                    </td>
                    <td style={{ ...stickyRowHeaderCellStyle(), textAlign: 'center' }}>
                      {shortenedPeriods[i] ? (
                        <span style={{ fontWeight: 700, color: "#25326f", fontSize: 13 }}>{`${formatTime12hr(shortenedPeriods[i].start)} - ${formatTime12hr(shortenedPeriods[i].end)}`}</span>
                      ) : null}
                    </td>
                    {days.map((day) => {
                      const cellKey = `${day}-${i}`;
                      const cell = sched.cells[cellKey];
                      return (
                        <td key={day + "-" + i} style={gridCellStyle(true, false, false, false)}>
                          {cell ? (
                            <>
                              <div style={{ fontWeight: 600, color: '#25326f', fontSize: 13 }}>{cell.subject}</div>
                              {cell.teacher && <div style={{ color: '#5b6787', fontSize: 12 }}>{cell.teacher}</div>}
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
      ))}

      {/* Teacher schedules */}
      {viewMode === 'teacher' && [
        {
          teacher: 'Acosta, Noreilyn S.',
          cells: {
            'Monday-0': { subject: 'Specialized TVL EPAS 11', section: '11 – ANGARA (TVL-EPAS)' },
            'Monday-1': { subject: 'Specialized TVL EPAS 11', section: '11 – ANGARA (TVL-EPAS)' },
            'Monday-2': { subject: '21st Century Lit.', section: '11 – MANABAT (TVL-HE)' },
            'Monday-3': { subject: '21st Century Lit.', section: '11 – MANABAT (TVL-HE)' },
            'Monday-4': { subject: 'Intro to the Philosophy of the Human', section: '11 – OCAMPO (HUMSS)' },
            'Tuesday-0': { subject: 'Specialized TVL EPAS 11', section: '11 – ANGARA (TVL-EPAS)' },
            'Tuesday-1': { subject: 'Specialized TVL EPAS 11', section: '11 – ANGARA (TVL-EPAS)' },
            'Tuesday-2': { subject: '21st Century Lit.', section: '11 – MANABAT (TVL-HE)' },
            'Tuesday-3': { subject: '21st Century Lit.', section: '11 – MANABAT (TVL-HE)' },
            'Tuesday-4': { subject: 'Intro to the Philosophy of the Human', section: '11 – OCAMPO (HUMSS)' },
            'Wednesday-0': { subject: 'Specialized TVL EPAS 11', section: '11 – ANGARA (TVL-EPAS)' },
            'Wednesday-1': { subject: 'Specialized TVL EPAS 11', section: '11 – ANGARA (TVL-EPAS)' },
            'Wednesday-2': { subject: '21st Century Lit.', section: '11 – MANABAT (TVL-HE)' },
            'Wednesday-3': { subject: '21st Century Lit.', section: '11 – MANABAT (TVL-HE)' },
            'Wednesday-4': { subject: 'Intro to the Philosophy of the Human', section: '11 – OCAMPO (HUMSS)' },
            'Thursday-0': { subject: 'Specialized TVL EPAS 11', section: '11 – ANGARA (TVL-EPAS)' },
            'Thursday-1': { subject: 'Specialized TVL EPAS 11', section: '11 – ANGARA (TVL-EPAS)' },
            'Thursday-2': { subject: '21st Century Lit.', section: '11 – MANABAT (TVL-HE)' },
            'Thursday-3': { subject: '21st Century Lit.', section: '11 – MANABAT (TVL-HE)' },
            'Thursday-4': { subject: 'Intro to the Philosophy of the Human', section: '11 – OCAMPO (HUMSS)' },
            'Friday-0': { subject: 'HGP', section: '11 – ANGARA (TVL-EPAS)' },
            'Friday-1': { subject: 'HGP', section: '11 – ANGARA (TVL-EPAS)' },
            'Friday-2': { subject: '21st Century Lit.', section: '11 – MANABAT (TVL-HE)' },
            'Friday-3': { subject: '21st Century Lit.', section: '11 – MANABAT (TVL-HE)' },
            'Friday-4': { subject: 'Intro to the Philosophy of the Human', section: '11 – OCAMPO (HUMSS)' },
          },
        },
        {
          teacher: 'Antonino, Kevin Dale',
          cells: {
            'Monday-0': { subject: 'DIASS-Disciplines and Ideas in the', section: '11 – OCAMPO (HUMSS)' },
            'Monday-1': { subject: '21st Century Lit.', section: '11 – AGONCILLO (HUMSS)' },
            'Monday-2': { subject: '21st Century Lit.', section: '11 – ZAIDE (HUMSS)' },
            'Monday-3': { subject: '21st Century Lit.', section: '11 – OCAMPO (HUMSS)' },
            'Monday-4': { subject: '21st Century Lit.', section: '11 – AGONCILLO (HUMSS)' },
            'Tuesday-0': { subject: 'DIASS-Disciplines and Ideas in the', section: '11 – OCAMPO (HUMSS)' },
            'Tuesday-1': { subject: '21st Century Lit.', section: '11 – AGONCILLO (HUMSS)' },
            'Tuesday-2': { subject: '21st Century Lit.', section: '11 – ZAIDE (HUMSS)' },
            'Tuesday-3': { subject: '21st Century Lit.', section: '11 – OCAMPO (HUMSS)' },
            'Tuesday-4': { subject: '21st Century Lit.', section: '11 – AGONCILLO (HUMSS)' },
            'Wednesday-0': { subject: 'DIASS-Disciplines and Ideas in the', section: '11 – OCAMPO (HUMSS)' },
            'Wednesday-1': { subject: '21st Century Lit.', section: '11 – AGONCILLO (HUMSS)' },
            'Wednesday-2': { subject: '21st Century Lit.', section: '11 – ZAIDE (HUMSS)' },
            'Wednesday-3': { subject: '21st Century Lit.', section: '11 – OCAMPO (HUMSS)' },
            'Wednesday-4': { subject: '21st Century Lit.', section: '11 – AGONCILLO (HUMSS)' },
            'Thursday-0': { subject: 'DIASS-Disciplines and Ideas in the', section: '11 – OCAMPO (HUMSS)' },
            'Thursday-1': { subject: '21st Century Lit.', section: '11 – AGONCILLO (HUMSS)' },
            'Thursday-2': { subject: '21st Century Lit.', section: '11 – ZAIDE (HUMSS)' },
            'Thursday-3': { subject: '21st Century Lit.', section: '11 – OCAMPO (HUMSS)' },
            'Thursday-4': { subject: '21st Century Lit.', section: '11 – AGONCILLO (HUMSS)' },
            'Friday-0': { subject: 'HGP', section: '11 – OCAMPO (HUMSS)' },
            'Friday-1': { subject: '21st Century Lit.', section: '11 – AGONCILLO (HUMSS)' },
            'Friday-2': { subject: '21st Century Lit.', section: '11 – ZAIDE (HUMSS)' },
            'Friday-3': { subject: '21st Century Lit.', section: '11 – OCAMPO (HUMSS)' },
            'Friday-4': { subject: '21st Century Lit.', section: '11 – AGONCILLO (HUMSS)' },
          },
        },
        {
          teacher: 'Antonio, Erlinda S.',
          cells: {
            'Monday-0': { subject: 'Statistics and Probability', section: '11 – CUADERNO (ABM & ICT)' },
            'Monday-1': { subject: 'Statistics and Probability', section: '11 – MANABAT (TVL-HE)' },
            'Monday-2': { subject: 'Statistics and Probability', section: '11 – ANGARA (TVL-EPAS)' },
            'Monday-3': { subject: 'Statistics and Probability', section: '11 – AGONCILLO (HUMSS)' },
            'Monday-4': { subject: 'Statistics and Probability', section: '11 – OCAMPO (HUMSS)' },
            'Tuesday-0': { subject: 'Statistics and Probability', section: '11 – CUADERNO (ABM & ICT)' },
            'Tuesday-1': { subject: 'Statistics and Probability', section: '11 – MANABAT (TVL-HE)' },
            'Tuesday-2': { subject: 'Statistics and Probability', section: '11 – ANGARA (TVL-EPAS)' },
            'Tuesday-3': { subject: 'Statistics and Probability', section: '11 – AGONCILLO (HUMSS)' },
            'Tuesday-4': { subject: 'Statistics and Probability', section: '11 – OCAMPO (HUMSS)' },
            'Wednesday-0': { subject: 'Statistics and Probability', section: '11 – CUADERNO (ABM & ICT)' },
            'Wednesday-1': { subject: 'Statistics and Probability', section: '11 – MANABAT (TVL-HE)' },
            'Wednesday-2': { subject: 'Statistics and Probability', section: '11 – ANGARA (TVL-EPAS)' },
            'Wednesday-3': { subject: 'Statistics and Probability', section: '11 – AGONCILLO (HUMSS)' },
            'Wednesday-4': { subject: 'Statistics and Probability', section: '11 – OCAMPO (HUMSS)' },
            'Thursday-0': { subject: 'Statistics and Probability', section: '11 – CUADERNO (ABM & ICT)' },
            'Thursday-1': { subject: 'Statistics and Probability', section: '11 – MANABAT (TVL-HE)' },
            'Thursday-2': { subject: 'Statistics and Probability', section: '11 – ANGARA (TVL-EPAS)' },
            'Thursday-3': { subject: 'Statistics and Probability', section: '11 – AGONCILLO (HUMSS)' },
            'Thursday-4': { subject: 'Statistics and Probability', section: '11 – OCAMPO (HUMSS)' },
            'Friday-0': { subject: 'HGP', section: '11 – CUADERNO (ABM & ICT)' },
            'Friday-1': { subject: 'Statistics and Probability', section: '11 – MANABAT (TVL-HE)' },
            'Friday-2': { subject: 'Statistics and Probability', section: '11 – ANGARA (TVL-EPAS)' },
            'Friday-3': { subject: 'Statistics and Probability', section: '11 – AGONCILLO (HUMSS)' },
            'Friday-4': { subject: 'Statistics and Probability', section: '11 – OCAMPO (HUMSS)' },
          },
        },
      ].map((sched, idx) => (
        <div key={idx} style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 12, minWidth: 0, marginBottom: 28 }}>
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ fontSize: 13, color: '#25326f', fontWeight: 700 }}>Teacher: <span style={{ fontWeight: 500, color: '#3B4197' }}>{sched.teacher}</span></div>
          </div>
          <div style={{ overflowX: "auto", border: "1px solid #e5eaf4", borderRadius: 10 }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ ...stickyHeaderCellStyle(), textAlign: 'center' }} colSpan={2}>Time</th>
                  {days.map((day) => (
                    <th key={day} rowSpan={2} style={headerCellStyle()}>{day}</th>
                  ))}
                </tr>
                <tr>
                  <th style={headerCellStyle()}>{regularDays.map((d) => DAY_INITIALS[d]).join(", ")}</th>
                  <th style={headerCellStyle()}>{shortenedDays.map((d) => DAY_INITIALS[d]).join(", ")}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.max(regularPeriods.length, shortenedPeriods.length) }).map((_, i) => (
                  <tr key={i}>
                    <td style={{ ...stickyRowHeaderCellStyle(), textAlign: 'center' }}>
                      {regularPeriods[i] ? (
                        <span style={{ fontWeight: 700, color: "#25326f", fontSize: 13 }}>{`${formatTime12hr(regularPeriods[i].start)} - ${formatTime12hr(regularPeriods[i].end)}`}</span>
                      ) : null}
                    </td>
                    <td style={{ ...stickyRowHeaderCellStyle(), textAlign: 'center' }}>
                      {shortenedPeriods[i] ? (
                        <span style={{ fontWeight: 700, color: "#25326f", fontSize: 13 }}>{`${formatTime12hr(shortenedPeriods[i].start)} - ${formatTime12hr(shortenedPeriods[i].end)}`}</span>
                      ) : null}
                    </td>
                    {days.map((day) => {
                      const cellKey = `${day}-${i}`;
                      const cell = sched.cells[cellKey];
                      return (
                        <td key={day + "-" + i} style={gridCellStyle(true, false, false, false)}>
                          {cell ? (
                            <>
                              <div style={{ fontWeight: 600, color: '#25326f', fontSize: 13 }}>{cell.subject}</div>
                              {cell.section && <div style={{ color: '#5b6787', fontSize: 12 }}>{cell.section}</div>}
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
      ))}
    </div>
  );
}

// --- Styling helpers (copied from ScheduleMaker for consistency) ---
function stickyHeaderCellStyle() {
  return {
    position: "sticky",
    left: 0,
    background: "#f5f7ff",
    zIndex: 2,
    top: 0,
    fontWeight: 800,
    color: "#1f2c6f",
    fontSize: 13,
    borderBottom: "1px solid #e5eaf4",
    borderRight: "1px solid #e5eaf4",
    padding: "8px 10px",
    textAlign: "left",
    minWidth: 120,
  };
}
function headerCellStyle() {
  return {
    background: "#f5f7ff",
    fontWeight: 800,
    color: "#1f2c6f",
    fontSize: 13,
    borderBottom: "1px solid #e5eaf4",
    borderRight: "1px solid #e5eaf4",
    padding: "8px 10px",
    textAlign: "center",
    minWidth: 90,
  };
}
function stickyRowHeaderCellStyle() {
  return {
    position: "sticky",
    left: 0,
    background: "#f5f7ff",
    zIndex: 1,
    fontWeight: 700,
    color: "#25326f",
    fontSize: 12,
    borderBottom: "1px solid #e5eaf4",
    borderRight: "1px solid #e5eaf4",
    padding: "8px 10px",
    minWidth: 120,
    textAlign: "left",
  };
}
function gridCellStyle(allowed, hasAssignment, hasConflict, hasValidAssignment) {
  return {
    background: hasAssignment ? (hasValidAssignment ? "#eaf2ff" : "#fff6f7") : "#fff",
    border: "1px solid #e5eaf4",
    borderRadius: 0,
    padding: "6px 8px",
    fontSize: 11,
    minWidth: 80,
    textAlign: "center",
    color: hasValidAssignment ? "#263475" : hasConflict ? "#b53f4e" : "#a0abc7",
    fontWeight: hasAssignment ? 700 : 500,
  };
}
