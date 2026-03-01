import DashboardShell from "../components/DashboardShell";
import SectionsManagement from "../components/SectionsManagement";

export default function DashboardSectionsPage() {
  return (
    <DashboardShell activeTab="sections">
      <SectionsManagement />
    </DashboardShell>
  );
}
