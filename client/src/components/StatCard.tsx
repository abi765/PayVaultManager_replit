import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export default function StatCard({ title, value, subtitle, icon: Icon, iconColor = "text-primary" }: StatCardProps) {
  return (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`rounded-full bg-primary/10 p-2 ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold" data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          {value}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1" data-testid={`text-stat-subtitle-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
