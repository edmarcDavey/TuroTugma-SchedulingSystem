import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { getDashboardAnalyticsPayload, toDashboardViewModel } from "../analyticsData";
import { getRecentActivityLog, formatActivityEntry } from "../analyticsData";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Filler, Tooltip, Legend);

export default function DashboardOverview() {
  const [analytics, setAnalytics] = useState(() => toDashboardViewModel(getDashboardAnalyticsPayload()));
  const [recentActivity, setRecentActivity] = useState(() =>
    typeof window !== "undefined" ? getRecentActivityLog(10) : []
  );

  useEffect(() => {
    function refreshData() {
      setAnalytics(toDashboardViewModel(getDashboardAnalyticsPayload()));
      setRecentActivity(typeof window !== "undefined" ? getRecentActivityLog(10) : []);
    }

    window.addEventListener("turotugma:schedule-updated", refreshData);
    window.addEventListener("turotugma:faculty-updated", refreshData);
    window.addEventListener("turotugma:subjects-updated", refreshData);
    window.addEventListener("turotugma:sections-updated", refreshData);
    window.addEventListener("turotugma:config-updated", refreshData);
    window.addEventListener("storage", refreshData);

    return () => {
      window.removeEventListener("turotugma:schedule-updated", refreshData);
      window.removeEventListener("turotugma:faculty-updated", refreshData);
      window.removeEventListener("turotugma:subjects-updated", refreshData);
      window.removeEventListener("turotugma:sections-updated", refreshData);
      window.removeEventListener("turotugma:config-updated", refreshData);
      window.removeEventListener("storage", refreshData);
    };
  }, []);

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, color: "#1f2c6f", fontSize: 30 }}>Admin Dashboard</h1>
        <p style={{ margin: "8px 0 0", color: "#5b6787", fontSize: 14 }}>
          Monitor schedule health and manage core school data from one place.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
        {analytics.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            assignmentBreakdown={metric.assignmentBreakdown}
            sectionBreakdown={metric.sectionBreakdown}
            subjectBreakdown={metric.subjectBreakdown}
          />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 14, marginBottom: 18 }}>
        <div style={panelStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, color: "#1f2c6f" }}>Teacher Load Distribution</h2>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>Underload • Balanced • Overload • Unassigned</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{ color: "#3B4197", fontSize: 12, cursor: "pointer", fontWeight: 700, background: "#e0e7ff", padding: "3px 8px", borderRadius: 6 }}
                onClick={() => window.location.href = "/dashboard?tab=faculty"}
                tabIndex={0}
                role="button"
                aria-label="View Faculty Directory"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = "/dashboard?tab=faculty"; }}
              >
                Faculty Directory →
              </span>
              <span
                style={{ color: "#7a8bb7", fontSize: 12, cursor: "pointer", fontWeight: 500 }}
                onClick={() => window.location.href = "/dashboard?tab=faculty"}
                tabIndex={0}
                role="button"
                aria-label="Manage Faculty"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = "/dashboard?tab=faculty"; }}
              >
                Faculty
              </span>
            </div>
          </div>
          <div style={{ marginTop: 12, height: 220 }}>
            {analytics?.charts?.teacherLoad ? (
              <Doughnut
                data={analytics.charts.teacherLoad}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom", labels: { boxWidth: 12, color: "#334170" } } },
                }}
              />
            ) : null}
          </div>
        </div>
        <div style={{ ...panelStyle(), marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 16, color: "#1f2c6f" }}>Schedule Completion by Target</h2>
            <span
              style={{ color: "#7a8bb7", fontSize: 12, cursor: "pointer", fontWeight: 500, marginLeft: 8 }}
              onClick={() => window.location.href = "/dashboard?tab=schedule-generator"}
              tabIndex={0}
              role="button"
              aria-label="View Schedule Grid"
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = "/dashboard?tab=schedule-generator"; }}
            >
              View Schedule Grid
            </span>
          </div>
          <div style={{ marginTop: 12, height: 230 }}>
            {analytics?.charts?.scheduleCompletion ? (
              <Bar
                data={analytics.charts.scheduleCompletion}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: { callback: (value) => `${value}%` },
                      grid: { color: "rgba(31,44,111,0.08)" },
                    },
                    x: { grid: { display: false } },
                  },
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Quick Actions removed */}

      {/* Faculty Employment Status & Workload Fusion Analytics */}
      <div style={{ ...panelStyle(), marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, color: "#1f2c6f" }}>Faculty Workload Distribution by Employment Tier</h2>
          </div>
          <span
            style={{ color: "#7a8bb7", fontSize: 12, cursor: "pointer", fontWeight: 500, marginLeft: 8 }}
            onClick={() => window.location.href = "/dashboard?tab=school-profile"}
            tabIndex={0}
            role="button"
            aria-label="Configure Priority Policy"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = "/dashboard?tab=school-profile"; }}
          >
            Configure Priority Policy
          </span>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <div style={{ padding: "12px 14px", background: "#f0f4ff", border: "1px solid #c2cefd", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#3B4197", textTransform: "uppercase", letterSpacing: "0.05em" }}>Regular / Permanent</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#5663bd", background: "#e0e7ff", padding: "1px 7px", borderRadius: 99 }}>
                {analytics.employmentBreakdown?.regular?.totalPeriods || 0} Periods
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#1f2c6f" }}>{analytics.employmentBreakdown?.regular?.count || 0}</span>
              <span style={{ fontSize: 12, color: "#51608d", fontWeight: 600 }}>Teachers</span>
            </div>
            <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", fontSize: 11, fontWeight: 600 }}>
              <span style={{ color: "#3B4197" }}>✓ {analytics.employmentBreakdown?.regular?.balanced || 0} Balanced</span>
              <span style={{ color: "#5663bd" }}>↓ {analytics.employmentBreakdown?.regular?.underload || 0} Underload</span>
              <span style={{ color: "#b91c1c" }}>↑ {analytics.employmentBreakdown?.regular?.overload || 0} Overload</span>
              <span style={{ color: "#64748b" }}>○ {analytics.employmentBreakdown?.regular?.unassigned || 0} Unassigned</span>
            </div>
          </div>

          <div style={{ padding: "12px 14px", background: "#f8faff", border: "1px solid #d0dcfd", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2c327e", textTransform: "uppercase", letterSpacing: "0.05em" }}>Probationary</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6f7dd4", background: "#edf2ff", padding: "1px 7px", borderRadius: 99 }}>
                {analytics.employmentBreakdown?.probationary?.totalPeriods || 0} Periods
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#1f2c6f" }}>{analytics.employmentBreakdown?.probationary?.count || 0}</span>
              <span style={{ fontSize: 12, color: "#51608d", fontWeight: 600 }}>Teachers</span>
            </div>
            <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", fontSize: 11, fontWeight: 600 }}>
              <span style={{ color: "#3B4197" }}>✓ {analytics.employmentBreakdown?.probationary?.balanced || 0} Balanced</span>
              <span style={{ color: "#5663bd" }}>↓ {analytics.employmentBreakdown?.probationary?.underload || 0} Underload</span>
              <span style={{ color: "#b91c1c" }}>↑ {analytics.employmentBreakdown?.probationary?.overload || 0} Overload</span>
              <span style={{ color: "#64748b" }}>○ {analytics.employmentBreakdown?.probationary?.unassigned || 0} Unassigned</span>
            </div>
          </div>

          <div style={{ padding: "12px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1f2c6f", textTransform: "uppercase", letterSpacing: "0.05em" }}>Part-Time</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", background: "#f1f5f9", padding: "1px 7px", borderRadius: 99 }}>
                {analytics.employmentBreakdown?.partTime?.totalPeriods || 0} Periods
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#1f2c6f" }}>{analytics.employmentBreakdown?.partTime?.count || 0}</span>
              <span style={{ fontSize: 12, color: "#51608d", fontWeight: 600 }}>Teachers</span>
            </div>
            <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", fontSize: 11, fontWeight: 600 }}>
              <span style={{ color: "#3B4197" }}>✓ {analytics.employmentBreakdown?.partTime?.balanced || 0} Balanced</span>
              <span style={{ color: "#5663bd" }}>↓ {analytics.employmentBreakdown?.partTime?.underload || 0} Underload</span>
              <span style={{ color: "#b91c1c" }}>↑ {analytics.employmentBreakdown?.partTime?.overload || 0} Overload</span>
              <span style={{ color: "#64748b" }}>○ {analytics.employmentBreakdown?.partTime?.unassigned || 0} Unassigned</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, height: 210 }}>
          {analytics?.charts?.fusionAnalytics ? (
            <Bar
              data={analytics.charts.fusionAnalytics}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { position: "top", labels: { boxWidth: 12, color: "#334170" } } },
                scales: {
                  x: { stacked: true, grid: { display: false } },
                  y: { stacked: true, beginAtZero: true, grid: { color: "rgba(31,44,111,0.08)" } },
                },
              }}
            />
          ) : null}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Schedule Status Card */}
        <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 16, color: "#1f2c6f" }}>Schedule Status</h2>
            <span
              style={{ color: "#7a8bb7", fontSize: 12, cursor: "pointer", fontWeight: 500, marginLeft: 8 }}
              onClick={() => window.location.href = "/dashboard?tab=schedule-generator"}
              tabIndex={0}
              role="button"
              aria-label="View Schedule Grid"
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = "/dashboard?tab=schedule-generator"; }}
            >
              View Schedule Grid
            </span>
          </div>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {analytics.scheduleStatusRows.map((item) => (
              <StatusRow key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </div>

        {/* Unresolved Conflicts Card */}
        <UnresolvedConflictsCard conflicts={analytics.conflicts || []} />
      </div>
    </>
  );
}

function panelStyle() {
  return {
    background: "#ffffff",
    border: "1px solid #e3e7ef",
    borderRadius: 14,
    padding: 16,
  };
}

function MetricCard({ label, value, assignmentBreakdown: breakdown, sectionBreakdown, subjectBreakdown }) {
  const barTotal = breakdown ? Math.max(Number(breakdown.total) || 0, 1) : 1;
  const sectionTotal = sectionBreakdown ? Math.max(Number(sectionBreakdown.total) || 0, 1) : 1;
  const subjectTotal = subjectBreakdown ? Math.max(Number(value) || 0, 1) : 1;

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 12, padding: 14 }}>
      <p style={{ margin: 0, color: "#66739a", fontSize: 12 }}>{label}</p>
      <p style={{ margin: "6px 0 0", color: "#1f2c6f", fontSize: 24, fontWeight: 700 }}>{value}</p>
      {breakdown ? (
        <div style={{ marginTop: 8, display: "grid", gap: 5 }}>
          <MiniBarRow label="JHS" value={breakdown.jhs} total={barTotal} color="#5663bd" />
          <MiniBarRow label="SHS" value={breakdown.shs} total={barTotal} color="#8fa0f1" />
          <MiniBarRow label="Both" value={breakdown.both} total={barTotal} color="#3B4197" />
        </div>
      ) : null}
      {sectionBreakdown ? (
        <div style={{ marginTop: 8, display: "grid", gap: 5 }}>
          <MiniBarRow label="G7" value={sectionBreakdown.g7} total={sectionTotal} color="#3B4197" />
          <MiniBarRow label="G8" value={sectionBreakdown.g8} total={sectionTotal} color="#4a56ad" />
          <MiniBarRow label="G9" value={sectionBreakdown.g9} total={sectionTotal} color="#5968c2" />
          <MiniBarRow label="G10" value={sectionBreakdown.g10} total={sectionTotal} color="#6f7dd4" />
          <MiniBarRow label="G11" value={sectionBreakdown.g11} total={sectionTotal} color="#8591e3" />
          <MiniBarRow label="G12" value={sectionBreakdown.g12} total={sectionTotal} color="#9ca6ee" />
        </div>
      ) : null}
      {subjectBreakdown ? (
        <div style={{ marginTop: 8, display: "grid", gap: 5 }}>
          <MiniBarRow label="JHS Core" value={subjectBreakdown.jhsCore} total={subjectTotal} color="#3B4197" />
          <MiniBarRow label="JHS Spec" value={subjectBreakdown.jhsSpecialized} total={subjectTotal} color="#5968c2" />
          <MiniBarRow label="SHS Core" value={subjectBreakdown.shsCore} total={subjectTotal} color="#6f7dd4" />
          <MiniBarRow label="STEM" value={subjectBreakdown.shsTracks.STEM} total={subjectTotal} color="#8fa0f1" />
          <MiniBarRow label="HUMSS" value={subjectBreakdown.shsTracks.HUMSS} total={subjectTotal} color="#9ca6ee" />
          <MiniBarRow label="ABM" value={subjectBreakdown.shsTracks.ABM} total={subjectTotal} color="#b0b9f4" />
          <MiniBarRow label="TVL" value={subjectBreakdown.shsTracks.TVL} total={subjectTotal} color="#c3c9de" />
          <MiniBarRow label="GAS" value={subjectBreakdown.shsTracks.GAS} total={subjectTotal} color="#d0d8ff" />
        </div>
      ) : null}
    </div>
  );
}

function MiniBarRow({ label, value, total, color }) {
  const safeTotal = Math.max(Number(total) || 0, 1);
  const widthPercent = Math.max(0, Math.min(100, (Number(value) / safeTotal) * 100));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "34px 1fr 24px", alignItems: "center", gap: 6 }}>
      <span style={{ color: "#65739a", fontSize: 11, fontWeight: 600 }}>{label}</span>
      <div style={{ height: 6, borderRadius: 999, overflow: "hidden", background: "#eef2fb" }}>
        <div style={{ width: `${widthPercent}%`, height: "100%", background: color }} />
      </div>
      <span style={{ color: "#65739a", fontSize: 11, textAlign: "right" }}>{value}</span>
    </div>
  );
}

// Quick Actions components removed

function StatusRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
      <span style={{ color: "#60709a", fontSize: 13 }}>{label}</span>
      <span style={{ color: "#22306b", fontSize: 13, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function UnresolvedConflictsCard({ conflicts = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const totalItems = conflicts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Reset page if conflicts change and current page is out of range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = conflicts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e3e7ef",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 240,
      }}
    >
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16, color: "#1f2c6f" }}>Unresolved Conflicts</h2>
            {totalItems > 0 ? (
              <span
                style={{
                  background: "#fee2e2",
                  color: "#b91c1c",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                {totalItems} {totalItems === 1 ? "Issue" : "Issues"}
              </span>
            ) : (
              <span
                style={{
                  background: "#e0e7ff",
                  color: "#3B4197",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                All Clear
              </span>
            )}
          </div>

          <span
            style={{
              color: "#3B4197",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
            onClick={() => (window.location.href = "/dashboard?tab=schedule-generator#conflicts-card")}
            tabIndex={0}
            role="button"
            aria-label="Resolve Conflicts in Generator"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                window.location.href = "/dashboard?tab=schedule-generator#conflicts-card";
              }
            }}
          >
            Resolve in Generator →
          </span>
        </div>

        <p style={{ margin: "6px 0 0", color: "#5f6b8f", fontSize: 13 }}>
          Conflict detection checks teacher overlaps, unavailable periods, and subject duplications.
        </p>

        {totalItems === 0 ? (
          <div
            style={{
              marginTop: 14,
              padding: 16,
              background: "#f0f4ff",
              border: "1px solid #c2cefd",
              borderRadius: 10,
              color: "#1f2c6f",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 500,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B4197" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            No unresolved conflicts detected across active schedule drafts.
          </div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {currentItems.map((item, idx) => (
              <div
                key={item + idx}
                style={{
                  border: "1px solid #fecaca",
                  borderLeft: "4px solid #ef4444",
                  borderRadius: 8,
                  background: "#fff7f8",
                  padding: "9px 12px",
                  color: "#991b1b",
                  fontSize: 12.5,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: 2 }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={{ flex: 1 }}>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalItems > itemsPerPage && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 10,
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
            Showing <strong>{startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)}</strong> of <strong>{totalItems}</strong>
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                border: "1px solid #cbd5e1",
                background: currentPage <= 1 ? "#f8fafc" : "#ffffff",
                color: currentPage <= 1 ? "#94a3b8" : "#3B4197",
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 11,
                fontWeight: 700,
                cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
              title="Previous Page"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Prev
            </button>

            <span style={{ fontSize: 11, color: "#475569", fontWeight: 600, padding: "0 4px" }}>
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                border: "1px solid #cbd5e1",
                background: currentPage >= totalPages ? "#f8fafc" : "#ffffff",
                color: currentPage >= totalPages ? "#94a3b8" : "#3B4197",
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 11,
                fontWeight: 700,
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
              title="Next Page"
            >
              Next
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
