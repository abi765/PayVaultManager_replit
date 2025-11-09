import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/StatCard";
import { Users, DollarSign, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPKRCompact } from "@/lib/utils";

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  monthlyPayroll: number;
  pendingPayments: number;
  processedPayments: number;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const recentActivities = [
    { id: 1, action: "Salary generated for current month", time: "2 hours ago" },
    { id: 2, action: `New employee added to system`, time: "5 hours ago" },
    { id: 3, action: "Payment marked as paid", time: "1 day ago" },
    { id: 4, action: "Employee status updated", time: "2 days ago" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your employee salary management</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees || 0}
          subtitle={`${stats?.activeEmployees || 0} active, ${stats?.inactiveEmployees || 0} inactive`}
          icon={Users}
        />
        <StatCard
          title="Monthly Payroll"
          value={formatPKRCompact(stats?.monthlyPayroll || 0)}
          subtitle="Total for active employees"
          icon={DollarSign}
        />
        <StatCard
          title="Pending Payments"
          value={stats?.pendingPayments || 0}
          subtitle="For current month"
          icon={Clock}
        />
        <StatCard
          title="This Month"
          value={formatPKRCompact(stats?.processedPayments || 0)}
          subtitle="Processed payments"
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                data-testid={`activity-${activity.id}`}
              >
                <p className="text-sm">{activity.action}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
