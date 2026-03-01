import DashboardShell from "../components/DashboardShell";
import SubjectsManagement from "../components/SubjectsManagement";

export default function DashboardSubjectsPage() {
  return (
    <DashboardShell activeTab="subjects">
      <SubjectsManagement />
    </DashboardShell>
  );
}
