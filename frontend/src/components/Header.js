import React from "react";

export default function Header() {
  return (
    <header
      style={{
        width: "100%",
        padding: "18px 0 10px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginLeft: "48px", height: 56 }}>
        <img
          src="/turotugma-logo.png"
          alt="TuroTugma Logo"
          style={{ width: 44, height: 44, objectFit: "contain", display: "block" }}
        />
        <div>
          <span
            style={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#1a3a8c",
              lineHeight: 1.1,
              display: "block",
            }}
          >
            TuroTugma
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", display: "block" }}>
            Automated Scheduling System
          </span>
        </div>
      </div>
    </header>
  );
}
