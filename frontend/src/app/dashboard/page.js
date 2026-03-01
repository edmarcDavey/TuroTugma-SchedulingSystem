import DashboardOverview from "./components/DashboardOverview";
import DashboardShell from "./components/DashboardShell";
import SectionsManagement from "./components/SectionsManagement";
import SubjectsManagement from "./components/SubjectsManagement";
import FacultyManagement from "./components/FacultyManagement";
import ScheduleMaker from "./components/ScheduleMaker";

export default function DashboardPage() {
  const tab = new URLSearchParams(window.location.search).get("tab") || "dashboard";

  const tabContent = {
    dashboard: <DashboardOverview />,
    sections: <SectionsManagement />,
    subjects: <SubjectsManagement />,
    faculty: <FacultyManagement />,
    "schedule-maker": <ScheduleMaker />,
  };

  const activeTab = tabContent[tab] ? tab : "dashboard";

  return (
    <DashboardShell activeTab={activeTab}>
      {tabContent[activeTab]}
    </DashboardShell>
  );
}
