import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import SalaryTable from "@/components/SalaryTable";
import { SalaryPayment, Employee } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Salary() {
  const { toast } = useToast();
  const currentMonth = format(new Date(), "yyyy-MM");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useQuery<{ payments: (SalaryPayment & { employee?: Employee })[]; total: number }>({
    queryKey: ["/api/salary", selectedMonth, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("month", selectedMonth);
      if (statusFilter !== "all") params.append("status", statusFilter);
      const response = await fetch(`/api/salary?${params}`, {
        headers: {
          "x-user-id": localStorage.getItem("userId") || "",
        },
      });
      return response.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (month: string) => {
      const res = await apiRequest("POST", "/api/salary/generate", { month });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary"] });
      toast({
        title: "Salary generated",
        description: "Salary records have been created for all active employees.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate salary",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/salary/${id}`, {
        status: "paid",
        paymentDate: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary"] });
      toast({
        title: "Payment marked as paid",
        description: "The salary payment has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateSalary = () => {
    generateMutation.mutate(selectedMonth);
  };

  const handleMarkPaid = (payment: SalaryPayment) => {
    markPaidMutation.mutate(payment.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Salary Management</h1>
          <p className="text-muted-foreground">Manage employee salary payments and records</p>
        </div>
        <Button
          onClick={handleGenerateSalary}
          disabled={generateMutation.isPending}
          data-testid="button-generate-salary"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {generateMutation.isPending ? "Generating..." : "Generate Salary"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger data-testid="select-month">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={currentMonth}>{format(new Date(), "MMMM yyyy")}</SelectItem>
              <SelectItem value={format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "yyyy-MM")}>
                {format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "MMMM yyyy")}
              </SelectItem>
              <SelectItem value={format(new Date(new Date().setMonth(new Date().getMonth() - 2)), "yyyy-MM")}>
                {format(new Date(new Date().setMonth(new Date().getMonth() - 2)), "MMMM yyyy")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading salary records...</div>
      ) : (
        <SalaryTable salaryPayments={data?.payments || []} onMarkPaid={handleMarkPaid} />
      )}
    </div>
  );
}
