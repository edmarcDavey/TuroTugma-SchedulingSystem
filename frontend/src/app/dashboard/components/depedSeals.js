import React from "react";

/**
 * Official Seal of the Department of Education of the Philippines (Circular Seal)
 * Prescribed under official DepEd orders.
 * Sourced directly from official DepEd vector assets (Wikimedia Commons / DepEd Repository).
 */
export function DepEdOfficialSeal({ size = 70, style = {}, className = "" }) {
  return (
    <img
      src="/deped-seal.svg"
      onError={(e) => {
        // Fallback to high-resolution official PNG if SVG rendering is restricted
        if (e.currentTarget.src.endsWith(".svg")) {
          e.currentTarget.src = "/deped-seal.png";
        }
      }}
      alt="Official Circular Seal of the Department of Education"
      width={size}
      height={size}
      className={className}
      style={{
        display: "block",
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/**
 * Official Department of Education Corporate Wordmark Logo (Horizontal Torch & Wordmark)
 * Prescribed under DepEd Order No. 001, s. 2024.
 * Sourced directly from official DepEd vector assets.
 */
export function DepEdWordmarkLogo({ size = 70, style = {}, className = "" }) {
  const height = size;
  return (
    <img
      src="/deped-logo-wordmark.svg"
      alt="Department of Education Official Wordmark Logo"
      height={height}
      className={className}
      style={{
        display: "block",
        height: height,
        width: "auto",
        maxWidth: Math.round(height * 2.4),
        objectFit: "contain",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/**
 * Official "Bagong Pilipinas" National Governance Logo
 * Prescribed under Office of the President Memorandum Circular No. 24, s. 2023
 * and DepEd Order No. 001, s. 2024 for Senior High School & Division Form 7.
 * Sourced directly from the official Malacañang / Presidential Communications Office vector.
 */
export function BagongPilipinasLogo({ size = 70, style = {}, className = "" }) {
  return (
    <img
      src="/bagong-pilipinas-logo.svg"
      onError={(e) => {
        // Fallback to high-resolution official PNG if SVG rendering is restricted
        if (e.currentTarget.src.endsWith(".svg")) {
          e.currentTarget.src = "/bagong-pilipinas-logo.png";
        }
      }}
      alt="Bagong Pilipinas Official Governance Logo"
      width={size}
      height={size}
      className={className}
      style={{
        display: "block",
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/**
 * School Official Emblem (Diadi National High School Official Crest)
 * Prescribed authentic institutional crest of Diadi National High School (Est. 1980),
 * Diadi, Nueva Vizcaya. Sourced directly from official school administration assets.
 */
export function SchoolOfficialSeal({
  size = 70,
  schoolName = "DIADI NATIONAL HIGH SCHOOL",
  style = {},
  className = "",
}) {
  return (
    <img
      src="/diadi-nhs-logo.png?v=1980"
      onError={(e) => {
        if (!e.currentTarget.dataset.fallback) {
          e.currentTarget.dataset.fallback = "true";
          e.currentTarget.src = "/diadi-nhs-logo.jpg";
        }
      }}
      alt={`${schoolName || "Diadi National High School"} Official Crest`}
      width={size}
      height={size}
      className={className}
      style={{
        display: "block",
        width: size,
        height: size,
        objectFit: "contain",
        borderRadius: "50%",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/**
 * Standard Dual-Logo Masthead Component
 * Displays Circular DepEd Seal on left and Authentic School Crest on right.
 */
export function DualLogoHeader({
  profile,
  logoSize = 64,
  showBorders = false,
  className = "",
  style = {},
}) {
  const depedLogo = profile?.depedSealUrl || profile?.depedLogoUrl;
  const schoolLogo = profile?.schoolLogoUrl;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        width: "100%",
        ...style,
      }}
    >
      {/* DepEd Circular Seal (Left) */}
      <div style={{ flexShrink: 0 }}>
        {depedLogo ? (
          <img
            src={depedLogo}
            alt="DepEd Circular Seal"
            style={{
              width: logoSize,
              height: logoSize,
              objectFit: "contain",
              borderRadius: "50%",
              border: showBorders ? "2px solid #ca8a04" : "none",
            }}
          />
        ) : (
          <DepEdOfficialSeal size={logoSize} />
        )}
      </div>

      {/* Authentic School Seal (Right) */}
      <div style={{ flexShrink: 0 }}>
        {schoolLogo ? (
          <img
            src={schoolLogo}
            alt={`${profile?.schoolName || "Diadi National High School"} Seal`}
            style={{
              width: logoSize,
              height: logoSize,
              objectFit: "contain",
              borderRadius: "50%",
              border: showBorders ? "2px solid #ca8a04" : "none",
            }}
          />
        ) : (
          <SchoolOfficialSeal size={logoSize} schoolName={profile?.schoolName} />
        )}
      </div>
    </div>
  );
}
