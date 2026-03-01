import React, { useEffect, useState } from "react";

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setVisible(true);
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="hero-background" style={{ minHeight: "100vh", paddingTop: 64, paddingBottom: 64 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-block", background: "#eaf0fa", color: "#1a3a8c", borderRadius: 16, padding: "6px 18px", fontWeight: 700, fontSize: 14, marginBottom: 18 }}>
            School Year 2025–2026 · Semester 2
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 48, fontWeight: 600, color: "#1a2536", marginBottom: 8 }}>
            Smart Scheduling<br />
            <span style={{ fontFamily: "serif", fontStyle: "italic", color: "#1a3a8c", fontWeight: 500 }}>
              for Every Section.
            </span>
          </h1>
          <p style={{ maxWidth: 600, margin: "0 auto", color: "#3a3a3a", fontSize: 18 }}>
            TuroTugma auto-generates conflict-free timetables for Junior High and Senior High — respecting teacher loads, period restrictions, and campus travel.
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 40 }}>
          <button style={{ background: "#1a3a8c", color: "#fff", fontWeight: 700, fontSize: 16, border: "none", borderRadius: 8, padding: "16px 32px", cursor: "pointer" }}>
            ➔ Let's Get Started
          </button>
          <button
            onClick={() => {
              window.location.href = "/login";
            }}
            style={{ background: "#fff", color: "#1a3a8c", fontWeight: 700, fontSize: 16, border: "2px solid #1a3a8c", borderRadius: 8, padding: "16px 32px", cursor: "pointer" }}
          >
            Staff Login
          </button>
        </div>
        {/* ── BENTO GRID ── */}
        <div style={{ display: 'flex', gap: '32px', margin: '48px auto 0 auto', maxWidth: '1200px', width: '100%' }}>
          {/* LEFT: Mini Timetable — 7 cols */}
          <div style={{ flex: 7, background: '#fff', borderRadius: '20px', boxShadow: '0 4px 24px rgba(26,37,54,0.07)', border: '1px solid #e3e7ef', overflow: 'hidden' }}>
            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid #e3e7ef' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a3a8c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#eaf0fa', fontWeight: 700, fontSize: 16 }}>■</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1a2536', margin: 0 }}>Grade 9 – Narra</p>
                  <p style={{ fontSize: 10, color: 'rgba(26,37,54,0.4)', fontWeight: 500, margin: 0 }}>Room 201 · Main Campus</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#eaf0fa', color: '#1a3a8c', fontWeight: 700, fontSize: 12, borderRadius: 8, padding: '4px 12px' }}>Period 3 · Now</span>
                <span style={{ fontSize: 12, color: 'rgba(26,37,54,0.35)', fontWeight: 600 }}>04:52 PM</span>
              </div>
            </div>
            {/* Mini schedule rows */}
            <div style={{ padding: 24 }}>
              {[
                { period: '7:30–8:30', subject: 'English 9', teacher: 'R. Santos', section: 'Grade 9-Narra', color: '#eaf0fa' },
                { period: '8:30–9:30', subject: 'Mathematics 9', teacher: 'M. Cruz', section: 'Grade 9-Narra', color: '#e3eaf7' },
                { period: '9:30–10:30', subject: 'Science 9', teacher: 'L. Reyes', section: 'Grade 9-Narra', color: '#dbe3f7', now: true },
                { period: '10:30–11:30', subject: 'Filipino 9', teacher: 'A. Bautista', section: 'Grade 9-Narra', color: '#f0f4fa' },
                { period: '12:30–1:30', subject: 'AP 9', teacher: 'J. Flores', section: 'Grade 9-Narra', color: '#eaf0fa' },
                { period: '1:30–2:30', subject: 'TLE - Cookery', teacher: 'C. Garcia', section: 'Grade 9-Narra', color: '#e3eaf7' }
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: row.color, borderRadius: 12, padding: '12px 18px', marginBottom: 8, boxShadow: i === 2 ? '0 0 0 2px #1a3a8c33' : undefined }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(26,37,54,0.4)', width: 70 }}>{row.period}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1a2536', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.subject}</p>
                    <p style={{ fontSize: 10, color: 'rgba(26,37,54,0.45)', fontWeight: 500, margin: 0 }}>{row.teacher}</p>
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(26,37,54,0.35)', fontWeight: 500 }}>{row.section}</span>
                  {row.now && <span style={{ fontSize: 9, fontWeight: 700, background: '#1a3a8c', color: '#fff', padding: '2px 8px', borderRadius: 12 }}>NOW</span>}
                </div>
              ))}
            </div>
          </div>
          {/* RIGHT: Status Cards + Stats — 5 cols */}
          <div style={{ flex: 5, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Teacher Status Panel */}
            <div style={{ background: '#1a3a8c', borderRadius: '20px', boxShadow: '0 4px 24px rgba(26,37,54,0.12)', flex: 1, color: '#fff', overflow: 'hidden' }}>
              <div style={{ padding: '20px 32px 12px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', margin: 0 }}>Current Period · Teacher Status</p>
                <p style={{ fontSize: 10, color: '#eaf0fa', fontWeight: 500, margin: '4px 0 0 0' }}>Period 3 · 9:30 – 10:30 AM</p>
              </div>
              <div style={{ padding: 16 }}>
                {[
                  { name: 'Ms. R. Santos', subject: 'English 9', room: 'Rm 201 - Main', status: 'In Class', statusColor: '#2ecc71' },
                  { name: 'Mr. M. Cruz', subject: 'Math 9', room: 'Rm 105 - JICA', status: 'In Class', statusColor: '#2ecc71' },
                  { name: 'Ms. L. Reyes', subject: 'Science Lab', room: '', status: 'Vacant', statusColor: '#95a5a6' },
                  { name: 'Dr. A. Bautista', subject: 'Filipino 9', room: 'Rm 302 - Main', status: 'In Meeting', statusColor: '#eaf0fa' }
                ].map((card, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 18px', marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eaf0fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#1a3a8c', fontWeight: 700, fontSize: 13 }}>👤</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.name}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{card.subject}{card.room ? ` · ${card.room}` : ''}</p>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: card.statusColor, color: card.status === 'In Meeting' ? '#1a3a8c' : '#fff' }}>{card.status}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'TEACHERS PROFILED', value: 48 },
                { label: 'ACTIVE SECTIONS', value: 32 },
                { label: 'UNRESOLVED CONFLICTS', value: 0 },
                { label: 'SCHOOL YEARS SAVED', value: 3 }
              ].map((stat, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(26,37,54,0.07)', border: '1px solid #e3e7ef', padding: 18 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#1a3a8c', textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</span>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#1a2536', margin: '8px 0 0 0' }}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Marquee strip */}
        <div style={{ marginTop: 48, padding: '18px 0', borderTop: '1px solid #e3e7ef', borderBottom: '1px solid #e3e7ef', overflow: 'hidden', width: '100%' }}>
          <div style={{ display: 'flex', gap: '32px', animation: 'marquee 30s linear infinite' }}>
            {['STEM Track', 'ABM Track', 'HUMSS Track', 'TVL Track', 'GAS Track', 'Conflict Detection', 'Auto-Generation', 'Teacher Load Balancing', 'Period Restrictions', 'Campus Travel Logic'].map((item, i) => (
              <span key={i} style={{ fontSize: 13, fontWeight: 600, color: i % 2 === 1 ? '#1a3a8c66' : '#1a3a8c99', margin: '0 16px' }}>{item}</span>
            ))}
          </div>
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
        </div>
      </div>
    </section>
  );
}
