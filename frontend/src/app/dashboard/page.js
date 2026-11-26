import { useState, useEffect, useCallback } from "react";
import DashboardOverview from "./components/DashboardOverview";
import DashboardShell from "./components/DashboardShell";
import SchoolProfileSettings from "./components/SchoolProfileSettings";
import SectionsManagement from "./components/SectionsManagement";
import SubjectsManagement from "./components/SubjectsManagement";
import FacultyManagement from "./components/FacultyManagement";
import ScheduleGenerator from "./components/ScheduleGenerator";
import TimeTables from "./components/TimeTables";
import { isAdminAuthenticated } from "../../auth";

const VALID_TABS = new Set([
  "dashboard",
  "school-profile",
  "sections",
  "subjects",
  "faculty",
  "schedule-maker",
  "schedule-generator",
  "time-tables",
  "substitute-finder",
]);

function getTabFromUrl() {
  if (typeof window === "undefined") return "dashboard";
  const raw = new URLSearchParams(window.location.search).get("tab") || "dashboard";
  if (raw === "schedule-maker") return "schedule-generator";
  return VALID_TABS.has(raw) ? raw : "dashboard";
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState(getTabFromUrl);
  const [authorized, setAuthorized] = useState(() => isAdminAuthenticated());

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      setAuthorized(false);
      window.location.replace("/login");
      return;
    }
    setAuthorized(true);
    const syncTabFromUrl = () => {
      setActiveTab(getTabFromUrl());
    };
    window.addEventListener("popstate", syncTabFromUrl);
    return () => window.removeEventListener("popstate", syncTabFromUrl);
  }, []);

  if (!authorized) {
    return null;
  }

  const handleTabChange = useCallback((nextTab, href) => {
    const normalized = nextTab === "schedule-maker" ? "schedule-generator" : nextTab;
    const validTab = VALID_TABS.has(normalized) ? normalized : "dashboard";
    const targetUrl =
      href || (validTab === "dashboard" ? "/dashboard" : `/dashboard?tab=${validTab}`);
    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.pushState({ tab: validTab }, "", targetUrl);
    }
    setActiveTab(validTab);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "school-profile":
        return <SchoolProfileSettings />;
      case "sections":
        return <SectionsManagement />;
      case "subjects":
        return <SubjectsManagement />;
      case "faculty":
        return <FacultyManagement />;
      case "schedule-maker":
      case "schedule-generator":
        return <ScheduleGenerator />;
      case "time-tables":
        return <TimeTables key="time-tables" initialViewMode="sections" />;
      case "substitute-finder":
        return <TimeTables key="substitute-finder" initialViewMode="substitute" />;
      case "dashboard":
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <DashboardShell activeTab={activeTab} onSelectTab={handleTabChange}>
      {renderTabContent()}
    </DashboardShell>
  );
}
