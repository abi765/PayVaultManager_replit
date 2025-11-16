import { useState } from "react";
import { useQuery, useMutation, QueryFunctionContext } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Download, FileSpreadsheet, FileText } from "lucide-react";
import SalaryTable from "@/components/SalaryTable";
import { SalaryPayment, Employee } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type SalaryQueryKey = readonly [string, { month: string; status: string }];

async function fetchSalary(context: QueryFunctionContext<SalaryQueryKey>): Promise<{ payments: (SalaryPayment & { employee?: Employee })[]; total: number }> {
  const [, { month, status }] = context.queryKey;
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
  const currentMonth = format(new Date(), "yyyy-MM");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data, isLoading, isError } = useQuery<{ payments: (SalaryPayment & { employee?: Employee })[]; total: number }>({
    queryKey: ["/api/salary", { month: selectedMonth, status: statusFilter }],
    queryFn: fetchSalary,
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
    generateMutation.mutate(selectedMonth);
  };

  const handleMarkPaid = (payment: SalaryPayment) => {
    markPaidMutation.mutate(payment.id);
  };

  const handleDelete = (payment: SalaryPayment) => {
    if (confirm(`Are you sure you want to delete this salary payment for ${payment.employee?.fullName}?`)) {
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
    if (!data?.payments || data.payments.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no salary records to export",
        variant: "destructive",
      });
      return;
    }

    const csvData = data.payments.map(payment => {
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
      ...csvData.map(row => Object.values(row).map(escapeCSV).join(",")),
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
    if (!data?.payments || data.payments.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no salary records to export",
        variant: "destructive",
      });
      return;
    }

    const excelData = data.payments.map(payment => {
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
    if (!data?.payments || data.payments.length === 0) {
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

    const tableData = data.payments.map(payment => {
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

    const totalAmount = data.payments.reduce((sum, p) => sum + p.amount, 0);
    const finalY = (doc as any).lastAutoTable.finalY || 45;
    doc.setFontSize(10);
    doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 14, finalY + 10);
    doc.text(`Total Records: ${data.payments.length}`, 14, finalY + 16);

    const filename = `salary-report-${selectedMonth}${statusFilter !== "all" ? `-${statusFilter}` : ""}.pdf`;
    doc.save(filename);

    toast({
      title: "Export successful",
      description: "PDF file downloaded successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Salary Management</h1>
          <p className="text-muted-foreground">Manage employee salary payments and records</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-export-dropdown">
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
        <SalaryTable salaryPayments={data?.payments || []} onMarkPaid={handleMarkPaid} onDelete={handleDelete} />
      )}
    </div>
  );
}
