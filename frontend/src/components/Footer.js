import React from "react";

export default function Footer() {
  return (
    <footer
      style={{
        width: "100%",
        background: "#ffffff",
        borderTop: "1px solid #e5eaf4",
        padding: "22px 0",
        fontFamily: "Plus Jakarta Sans, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        {/* Left: Brand & Copyright */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <img
            src="/turotugma-logo.png"
            alt="TuroTugma Logo"
            style={{ width: 32, height: 32, objectFit: "contain" }}
          />
          <span style={{ fontWeight: 800, fontSize: 18, color: "#1a3a8c" }}>TuroTugma</span>
          <span style={{ color: "#64748b", fontSize: 13.5 }}>
            © {new Date().getFullYear()} Diadi National High School • Automated Scheduling System
          </span>
        </div>

        {/* Right: Valid Working Navigation Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          <a href="/" style={{ color: "#475569", textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>
            Home
          </a>
          <a href="#features" style={{ color: "#475569", textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>
            Features
          </a>
          <a href="#process" style={{ color: "#475569", textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>
            How It Works
          </a>
          <a href="/public-dashboard" style={{ color: "#1a3a8c", textDecoration: "none", fontSize: 13.5, fontWeight: 700 }}>
            Public Dashboard
          </a>
          <a href="/login" style={{ color: "#475569", textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>
            Staff Login
          </a>
        </nav>
      </div>
    </footer>
  );
}
