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
  const analytics = toDashboardViewModel(getDashboardAnalyticsPayload());
  // Fetch recent activity log (dynamic)
  const recentActivity = (typeof window !== "undefined") ? getRecentActivityLog(10) : [];

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
          <h2 style={{ margin: 0, fontSize: 16, color: "#1f2c6f" }}>Teacher Load Distribution</h2>
          <div style={{ marginTop: 12, height: 220 }}>
            <Doughnut
              data={analytics.charts.teacherLoad}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom", labels: { boxWidth: 12, color: "#334170" } } },
              }}
            />
          </div>
        </div>
        <div style={{ ...panelStyle(), marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: "#1f2c6f" }}>Schedule Completion by Target</h2>
          <div style={{ marginTop: 12, height: 230 }}>
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
          </div>
        </div>
      </div>

      {/* Quick Actions removed */}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Schedule Status Card */}
        <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: "#1f2c6f" }}>Schedule Status</h2>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {analytics.scheduleStatusRows.map((item) => (
              <StatusRow key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </div>

        {/* Unresolved Conflicts Card */}
        <div style={{ background: "#ffffff", border: "1px solid #e3e7ef", borderRadius: 14, padding: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: "#1f2c6f" }}>Unresolved Conflicts</h2>
          {analytics.conflicts.length === 0 ? (
            <p style={{ margin: "6px 0 0", color: "#5f6b8f", fontSize: 13 }}>No unresolved conflicts at the moment.</p>
          ) : (
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#5f6b8f", fontSize: 13, display: "grid", gap: 6 }}>
              {analytics.conflicts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: 12, border: "1px dashed #cfd8ef", borderRadius: 10, background: "#f8faff", padding: 12, color: "#5a6687", fontSize: 12 }}>
            Conflict detection checks teacher overlap, unavailable periods, and subject duplication.
          </div>
        </div>
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
