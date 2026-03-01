import DashboardOverview from "./components/DashboardOverview";
import DashboardShell from "./components/DashboardShell";

export default function DashboardPage() {
  return (
    <DashboardShell activeTab="dashboard">
      <DashboardOverview />
    </DashboardShell>
  );
}
