import React, { useEffect, useState } from "react";
import "./App.css";
import ReactDOM from "react-dom/client";
import HomepagePage from "./app/homepage/page";
import LoginPage from "./app/login/page";
import DashboardPage from "./app/dashboard/page";
import PublicDashboard from "./app/homepage/components/PublicDashboard";
import { initXamppSync, subscribeXamppSyncStatus } from "./xamppSync";

function XamppSyncRoot({ children }) {
  const [remoteRevision, setRemoteRevision] = useState(0);
  const [syncStatus, setSyncStatus] = useState({ connected: false, engine: "offline" });
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const unsub = subscribeXamppSyncStatus((st) => setSyncStatus({ ...st }));
    const handleRemoteUpdate = () => {
      // Soft re-mount / refresh active view when another browser or device pushes new data
      setRemoteRevision((prev) => prev + 1);
    };
    window.addEventListener("turotugma:xampp-remote-update", handleRemoteUpdate);
    return () => {
      unsub();
      window.removeEventListener("turotugma:xampp-remote-update", handleRemoteUpdate);
    };
  }, []);

  const isMysql = syncStatus.connected && syncStatus.engine === "mysql";
  const isApacheOnly = syncStatus.connected && syncStatus.engine !== "mysql";

  return (
    <>
      <div key={remoteRevision} style={{ display: "contents" }}>
        {children}
      </div>

      {/* Subtle XAMPP Multi-Device Sync Indicator Pill (Hidden during Print) */}
      <div
        className="no-print"
        onClick={() => setMinimized((m) => !m)}
        title={
          isMysql
            ? "Connected to XAMPP MySQL (turotugma_db). All browsers & devices on this Wi-Fi share live data. Click to minimize."
            : isApacheOnly
              ? "Connected to XAMPP Apache (File Sync). Start MySQL in XAMPP Control Panel for phpMyAdmin tables."
              : "XAMPP Apache is offline. Open XAMPP Control Panel and start Apache & MySQL to sync across browsers and devices."
        }
        style={{
          position: "fixed",
          bottom: 12,
          right: 14,
          zIndex: 99990,
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: minimized ? "6px 9px" : "6px 12px",
          borderRadius: 999,
          background: isMysql ? "#0f172a" : isApacheOnly ? "#1e3a8a" : "#334155",
          color: "#ffffff",
          border: isMysql
            ? "1px solid rgba(34, 197, 94, 0.45)"
            : isApacheOnly
              ? "1px solid rgba(96, 165, 250, 0.45)"
              : "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.22)",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          userSelect: "none",
          opacity: 0.92,
          transition: "all 0.2s ease",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isMysql ? "#22c55e" : isApacheOnly ? "#38bdf8" : "#f59e0b",
            boxShadow: isMysql
              ? "0 0 8px #22c55e"
              : isApacheOnly
                ? "0 0 8px #38bdf8"
                : "none",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        {!minimized && (
          <span>
            {isMysql
              ? "XAMPP MySQL Connected • Live LAN Sync"
              : isApacheOnly
                ? "XAMPP Apache Sync Active (Start MySQL for DB)"
                : "Local Browser Only (Start XAMPP to Sync)"}
          </span>
        )}
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));

const pathname = window.location.pathname;
const isLoginPage = pathname === "/login";
const isDashboardPage = pathname === "/dashboard";
const isPublicDashboardPage = pathname === "/public-dashboard";

initXamppSync().finally(() => {
  root.render(
    <React.StrictMode>
      <XamppSyncRoot>
        {isLoginPage ? (
          <LoginPage />
        ) : isDashboardPage ? (
          <DashboardPage view="dashboard" />
        ) : isPublicDashboardPage ? (
          <PublicDashboard />
        ) : (
          <HomepagePage />
        )}
      </XamppSyncRoot>
    </React.StrictMode>
  );
});
