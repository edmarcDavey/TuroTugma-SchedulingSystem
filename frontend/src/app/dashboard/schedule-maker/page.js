import DashboardShell from "../components/DashboardShell";
import ScheduleMaker from "../components/ScheduleMaker";

export default function DashboardScheduleMakerPage() {
  return (
    <DashboardShell activeTab="schedule-maker">
      <ScheduleMaker />
    </DashboardShell>
  );
}
