import { useState } from "react";
import { useQuery, useMutation, QueryFunctionContext } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Download, FileSpreadsheet, FileText, AlertCircle, Users, Calendar } from "lucide-react";
import SalaryTable from "@/components/SalaryTable";
import { SalaryPayment, Employee } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

async function fetchSalary({ queryKey }: any): Promise<{ payments: (SalaryPayment & { employee?: Employee })[]; total: number }> {
  const [, { month, status }] = queryKey;
  const params = new URLSearchParams();
  params.append("month", month);
  if (status !== "all") params.append("status", status);
  const response = await apiRequest("GET", `/api/salary?${params}`);
  return response.json();
}

function sanitizePaymentForExport(payment: SalaryPayment & { employee?: Employee }) {
  return {
    employeeId: payment.employee?.employeeId ?? "",
    employeeName: payment.employee?.fullName ?? "",
    month: payment.month,
    amount: payment.amount,
    status: payment.status,
    paymentDate: payment.paymentDate ? format(new Date(payment.paymentDate), "yyyy-MM-dd") : "",
    paymentMethod: payment.paymentMethod ?? "",
    bankName: payment.employee?.bankName ?? "",
    accountNumber: payment.employee?.bankAccountNumber ?? "",
    iban: payment.employee?.iban ?? "",
    notes: payment.notes ?? "",
  };
}

export default function Salary() {
  const { toast } = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";
  const currentMonth = format(new Date(), "yyyy-MM");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  
  const { data, isLoading, isError } = useQuery<{ payments: (SalaryPayment & { employee?: Employee })[]; total: number }>({
    queryKey: ["/api/salary", { month: selectedMonth, status: statusFilter }],
    queryFn: fetchSalary,
  });

  // Fetch active employees count
  const { data: employeesData } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/employees");
      return response.json();
    },
  });

  const activeEmployeesCount = (employeesData as any)?.employees?.filter((emp: Employee) => emp.status === "active").length || 0;
  const existingSalariesForMonth = (data as any)?.payments?.filter((p: SalaryPayment) => p.month === selectedMonth).length || 0;

  const generateMutation = useMutation({
    mutationFn: async ({ month, replaceExisting }: { month: string; replaceExisting: boolean }) => {
      // If replacing, delete existing salaries first
      if (replaceExisting && existingSalariesForMonth > 0) {
        const salariesToDelete = (data as any)?.payments?.filter((p: SalaryPayment) => p.month === month) || [];
        for (const salary of salariesToDelete) {
          await apiRequest("DELETE", `/api/salary/${salary.id}`);
        }
      }

      const res = await apiRequest("POST", "/api/salary/generate", { month });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setShowGenerateDialog(false);
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/salary/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary"] });
      toast({
        title: "Salary payment deleted",
        description: "The salary payment has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateSalary = () => {
    setShowGenerateDialog(true);
  };

  const confirmGenerate = (replaceExisting: boolean) => {
    generateMutation.mutate({ month: selectedMonth, replaceExisting });
  };

  const handleMarkPaid = (payment: SalaryPayment) => {
    markPaidMutation.mutate(payment.id);
  };

  const handleDelete = (payment: any) => {
    if (confirm(`Are you sure you want to delete this salary payment for ${payment.employee?.fullName || 'this employee'}?`)) {
      deleteMutation.mutate(payment.id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportToCSV = () => {
    const payments = (data as any)?.payments || [];
    if (payments.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no salary records to export",
        variant: "destructive",
      });
      return;
    }

    const csvData = payments.map((payment: any) => {
      const sanitized = sanitizePaymentForExport(payment);
      return {
        "Employee ID": sanitized.employeeId,
        "Employee Name": sanitized.employeeName,
        "Month": sanitized.month,
        "Amount (PKR)": sanitized.amount,
        "Status": sanitized.status,
        "Payment Date": sanitized.paymentDate,
        "Payment Method": sanitized.paymentMethod,
        "Bank Name": sanitized.bankName,
        "Account Number": sanitized.accountNumber,
        "Notes": sanitized.notes,
      };
    });

    const escapeCSV = (value: any): string => {
      const str = String(value);
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row: any) => Object.values(row).map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = `salary-report-${selectedMonth}${statusFilter !== "all" ? `-${statusFilter}` : ""}.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "CSV file downloaded successfully",
    });
  };

  const exportToExcel = () => {
    const payments = (data as any)?.payments || [];
    if (payments.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no salary records to export",
        variant: "destructive",
      });
      return;
    }

    const excelData = payments.map((payment: any) => {
      const sanitized = sanitizePaymentForExport(payment);
      return {
        "Employee ID": sanitized.employeeId,
        "Employee Name": sanitized.employeeName,
        "Month": sanitized.month,
        "Amount (PKR)": sanitized.amount,
        "Status": sanitized.status,
        "Payment Date": sanitized.paymentDate,
        "Payment Method": sanitized.paymentMethod,
        "Bank Name": sanitized.bankName,
        "Account Number": sanitized.accountNumber,
        "IBAN": sanitized.iban,
        "Notes": sanitized.notes,
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Salary Report");
    
    ws["!cols"] = [
      { wch: 12 },
      { wch: 25 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 30 },
    ];

    const filename = `salary-report-${selectedMonth}${statusFilter !== "all" ? `-${statusFilter}` : ""}.xlsx`;
    XLSX.writeFile(wb, filename);

    toast({
      title: "Export successful",
      description: "Excel file downloaded successfully",
    });
  };

  const exportToPDF = () => {
    const payments = (data as any)?.payments || [];
    if (payments.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no salary records to export",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Salary Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Period: ${format(new Date(selectedMonth + "-01"), "MMMM yyyy")}`, 14, 32);
    doc.text(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 14, 38);

    const tableData = payments.map((payment: any) => {
      const sanitized = sanitizePaymentForExport(payment);
      return [
        sanitized.employeeId,
        sanitized.employeeName,
        formatCurrency(sanitized.amount),
        sanitized.status,
        sanitized.paymentDate,
        sanitized.bankName,
        sanitized.accountNumber,
      ];
    });

    autoTable(doc, {
      head: [["ID", "Name", "Amount", "Status", "Paid On", "Bank", "Account"]],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    const totalAmount = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const finalY = (doc as any).lastAutoTable.finalY || 45;
    doc.setFontSize(10);
    doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 14, finalY + 10);
    doc.text(`Total Records: ${payments.length}`, 14, finalY + 16);

    const filename = `salary-report-${selectedMonth}${statusFilter !== "all" ? `-${statusFilter}` : ""}.pdf`;
    doc.save(filename);

    toast({
      title: "Export successful",
      description: "PDF file downloaded successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Salary Management</h1>
          <p className="text-sm text-muted-foreground">Manage employee salary payments and records</p>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 flex-1 sm:flex-none" data-testid="button-export-dropdown">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportToCSV} data-testid="button-export-csv">
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel} data-testid="button-export-excel">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF} data-testid="button-export-pdf">
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canEdit && (
              <Button
                onClick={handleGenerateSalary}
                disabled={generateMutation.isPending}
                data-testid="button-generate-salary"
                className="gap-2 flex-1 sm:flex-none"
              >
                <Plus className="h-4 w-4" />
                {generateMutation.isPending ? "Generating..." : "Generate Salary"}
              </Button>
            )}
          </div>
          {canEdit && (
            <p className="text-xs text-muted-foreground text-center sm:text-right">Select a month below, then click Generate to create salary records</p>
          )}
        </div>
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
      ) : isError ? (
        <div className="text-center py-12 text-destructive">Failed to load salary records. Please try again.</div>
      ) : (
        <SalaryTable salaryPayments={(data as any)?.payments || []} onMarkPaid={handleMarkPaid} onDelete={handleDelete} canEdit={canEdit} />
      )}

      {/* Generate Salary Confirmation Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Generate Salary Payments
            </DialogTitle>
            <DialogDescription>
              Confirm salary generation for all active employees
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Selected Month</p>
                  <p className="text-lg font-bold">{format(new Date(selectedMonth + "-01"), "MMMM yyyy")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Active Employees</p>
                  <p className="text-lg font-bold">{activeEmployeesCount} {activeEmployeesCount === 1 ? 'employee' : 'employees'}</p>
                </div>
              </div>
            </div>

            {existingSalariesForMonth > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> {existingSalariesForMonth} salary {existingSalariesForMonth === 1 ? 'record' : 'records'} already exist for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}.
                  <br />
                  Generating again will <strong>replace all existing records</strong> for this month.
                </AlertDescription>
              </Alert>
            )}

            {activeEmployeesCount === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No active employees found. Please add active employees before generating salaries.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
              disabled={generateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => confirmGenerate(existingSalariesForMonth > 0)}
              disabled={generateMutation.isPending || activeEmployeesCount === 0}
            >
              {generateMutation.isPending ? "Generating..." : existingSalariesForMonth > 0 ? "Replace & Generate" : "Generate Salary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
