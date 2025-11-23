import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Filter, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

type ActivityLog = {
  id: number;
  userId: string;
  username: string;
  role: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
};

const actionColors: Record<string, string> = {
  LOGIN: "bg-blue-500",
  LOGOUT: "bg-gray-500",
  CREATE: "bg-green-500",
  UPDATE: "bg-yellow-500",
  DELETE: "bg-red-500",
  PROCESS: "bg-purple-500",
  GENERATE: "bg-indigo-500",
  EXPORT: "bg-cyan-500",
  VIEW: "bg-slate-500",
};

const entityLabels: Record<string, string> = {
  user: "User",
  employee: "Employee",
  salary: "Salary",
  deduction: "Deduction",
  allowance: "Allowance",
  overtime: "Overtime",
  department: "Department",
};

export default function ActivityLogs() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const limit = 20;

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set("limit", limit.toString());
    params.set("offset", ((page - 1) * limit).toString());
    if (search) params.set("search", search);
    if (actionFilter && actionFilter !== "all") params.set("action", actionFilter);
    if (entityFilter && entityFilter !== "all") params.set("entity", entityFilter);
    if (startDate) params.set("startDate", new Date(startDate).toISOString());
    if (endDate) params.set("endDate", new Date(endDate + "T23:59:59").toISOString());
    return params.toString();
  };

  const { data, isLoading } = useQuery<{ logs: ActivityLog[]; total: number }>({
    queryKey: ["/api/activity-logs", page, search, actionFilter, entityFilter, startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/activity-logs?${buildQueryParams()}`, {
        headers: { "x-user-id": localStorage.getItem("userId") || "" },
      });
      if (!response.ok) throw new Error("Failed to fetch activity logs");
      return response.json();
    },
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (actionFilter && actionFilter !== "all") params.set("action", actionFilter);
    if (entityFilter && entityFilter !== "all") params.set("entity", entityFilter);
    if (startDate) params.set("startDate", new Date(startDate).toISOString());
    if (endDate) params.set("endDate", new Date(endDate + "T23:59:59").toISOString());

    setIsExporting(true);
    try {
      const response = await fetch(`/api/activity-logs/export?${params.toString()}`, {
        headers: { "x-user-id": localStorage.getItem("userId") || "" },
      });

      if (!response.ok) {
        throw new Error("Failed to export activity logs");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Activity logs exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export activity logs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setActionFilter("all");
    setEntityFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const formatDetails = (details: string | null) => {
    if (!details) return "-";
    try {
      const parsed = JSON.parse(details);
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
        .join("; ");
    } catch {
      return details;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Activity Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Track and audit all user activities in the system
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto" disabled={isExporting}>
          <Download className="h-4 w-4 mr-1" />
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users or details..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            <Select
              value={actionFilter}
              onValueChange={(value) => {
                setActionFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="PROCESS">Process</SelectItem>
                <SelectItem value="GENERATE">Generate</SelectItem>
                <SelectItem value="EXPORT">Export</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={entityFilter}
              onValueChange={(value) => {
                setEntityFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="deduction">Deduction</SelectItem>
                <SelectItem value="allowance">Allowance</SelectItem>
                <SelectItem value="overtime">Overtime</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />

            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="flex-1"
              />
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
          <CardDescription>
            {total} {total === 1 ? "entry" : "entries"} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading activity logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activity logs found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell className="font-medium">{log.username}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {log.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${actionColors[log.action] || "bg-gray-500"} text-white`}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {entityLabels[log.entity] || log.entity}
                          {log.entityId && (
                            <span className="text-muted-foreground ml-1">
                              #{log.entityId}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={formatDetails(log.details)}>
                          {formatDetails(log.details)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.ipAddress || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
