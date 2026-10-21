import DashboardOverview from "./components/DashboardOverview";
import DashboardShell from "./components/DashboardShell";
import SchoolProfileSettings from "./components/SchoolProfileSettings";
import SectionsManagement from "./components/SectionsManagement";
import SubjectsManagement from "./components/SubjectsManagement";
import FacultyManagement from "./components/FacultyManagement";
import ScheduleGenerator from "./components/ScheduleGenerator";
import TimeTables from "./components/TimeTables";

export default function DashboardPage() {
  const tab = new URLSearchParams(window.location.search).get("tab") || "dashboard";

  const tabContent = {
    dashboard: <DashboardOverview />, 
    "school-profile": <SchoolProfileSettings />,
    sections: <SectionsManagement />, 
    subjects: <SubjectsManagement />, 
    faculty: <FacultyManagement />, 
    "schedule-maker": <ScheduleGenerator />, 
    "schedule-generator": <ScheduleGenerator />, 
    "time-tables": <TimeTables />,
  };

  const activeTab = tabContent[tab] ? tab : "dashboard";

  return (
    <DashboardShell activeTab={activeTab}>
      {tabContent[activeTab]}
    </DashboardShell>
  );
}
