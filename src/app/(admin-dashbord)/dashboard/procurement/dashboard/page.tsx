import ProcurementDashboard from "@/components/procurement/ProcurementDashboard";

export const metadata = {
  title: "Procurement Dashboard | Realbiz Pro",
  description: "Procurement KPIs, overflow materials, and pending purchase bills overview",
};

export default function ProcurementDashboardPage() {
  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="flex-1 min-w-0">
        <ProcurementDashboard />
      </div>
    </div>
  );
}
