import DashboardShell from "../components/DashboardShell";
import FacultyManagement from "../components/FacultyManagement";

export default function DashboardFacultyPage() {
  return (
    <DashboardShell activeTab="faculty">
      <FacultyManagement />
    </DashboardShell>
  );
}
