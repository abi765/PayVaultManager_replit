import StatCard from "@/components/StatCard";
import { Users, DollarSign, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const recentActivities = [
    { id: 1, action: "Salary generated for January 2024", time: "2 hours ago" },
    { id: 2, action: "New employee added: Ahmed Khan (EMP001)", time: "5 hours ago" },
    { id: 3, action: "Payment marked as paid: Fatima Ali", time: "1 day ago" },
    { id: 4, action: "Employee status updated: Hassan Malik to On Leave", time: "2 days ago" },
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
