import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import SalaryTable from "@/components/SalaryTable";
import { SalaryPayment, Employee } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Salary() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const queryParams = new URLSearchParams({
    limit: "50",
    offset: "0",
    ...(selectedMonth && { month: selectedMonth }),
    ...(statusFilter !== "all" && { status: statusFilter }),
  });

  const queryKey = ["/api/salary", `?${queryParams.toString()}`];

  const { data: payments = [], isLoading } = useQuery<(SalaryPayment & { employee?: Employee })[]>({
    queryKey,
  });

  const generateSalaryMutation = useMutation({
    mutationFn: async (month: string) => {
      const res = await apiRequest("POST", "/api/salary/generate", { month });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary"] });
      toast({
        title: "Salary generated",
        description: "Salary has been successfully generated for all active employees.",
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
    mutationFn: async (payment: SalaryPayment) => {
      const res = await apiRequest("PUT", `/api/salary/${payment.id}`, {
        status: "paid",
        paymentDate: new Date().toISOString(),
        paymentMethod: "Bank Transfer",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary"] });
      toast({
        title: "Payment marked as paid",
        description: "The salary payment has been successfully marked as paid.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark as paid",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateSalary = () => {
    generateSalaryMutation.mutate(selectedMonth);
  };

  const handleMarkPaid = (payment: SalaryPayment) => {
    markPaidMutation.mutate(payment);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Salary Management</h1>
            <p className="text-muted-foreground">Manage employee salary payments and records</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading salary records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Salary Management</h1>
          <p className="text-muted-foreground">Manage employee salary payments and records</p>
        </div>
        <Button 
          onClick={handleGenerateSalary} 
          data-testid="button-generate-salary" 
          className="gap-2"
          disabled={generateSalaryMutation.isPending}
        >
          <Plus className="h-4 w-4" />
          {generateSalaryMutation.isPending ? "Generating..." : "Generate Salary"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger data-testid="select-month">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-01">January 2024</SelectItem>
              <SelectItem value="2023-12">December 2023</SelectItem>
              <SelectItem value="2023-11">November 2023</SelectItem>
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

      <SalaryTable salaryPayments={payments} onMarkPaid={handleMarkPaid} />
    </div>
  );
}
