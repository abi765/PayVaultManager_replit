import StatCard from "../StatCard";
import { Users, DollarSign, Clock, TrendingUp } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Employees"
        value="124"
        subtitle="118 active, 6 inactive"
        icon={Users}
      />
      <StatCard
        title="Monthly Payroll"
        value="PKR 8.5M"
        subtitle="Total for active employees"
        icon={DollarSign}
      />
      <StatCard
        title="Pending Payments"
        value="23"
        subtitle="For current month"
        icon={Clock}
      />
      <StatCard
        title="This Month"
        value="PKR 2.1M"
        subtitle="Processed payments"
        icon={TrendingUp}
      />
    </div>
  );
}
