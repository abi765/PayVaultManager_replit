import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import SalaryTable from "@/components/SalaryTable";
import { SalaryPayment, Employee } from "@shared/schema";
import { format } from "date-fns";

const mockPayments: (SalaryPayment & { employee?: Employee })[] = [
  {
    id: 1,
    employeeId: 1,
    amount: 85000,
    paymentDate: new Date("2024-01-15"),
    month: "2024-01",
    status: "paid",
    paymentMethod: "Bank Transfer",
    notes: null,
    createdAt: new Date(),
    employee: {
      id: 1,
      employeeId: "EMP001",
      fullName: "Ahmed Khan",
      address: null,
      bankAccountNumber: "12345678901234",
      iban: null,
      bankName: "HBL",
      bankBranch: null,
      salary: 85000,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: 2,
    employeeId: 2,
    amount: 95000,
    paymentDate: null,
    month: "2024-01",
    status: "pending",
    paymentMethod: null,
    notes: null,
    createdAt: new Date(),
    employee: {
      id: 2,
      employeeId: "EMP002",
      fullName: "Fatima Ali",
      address: null,
      bankAccountNumber: "98765432109876",
      iban: null,
      bankName: "Meezan Bank",
      bankBranch: null,
      salary: 95000,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: 3,
    employeeId: 3,
    amount: 72000,
    paymentDate: new Date("2024-01-16"),
    month: "2024-01",
    status: "paid",
    paymentMethod: "Bank Transfer",
    notes: null,
    createdAt: new Date(),
    employee: {
      id: 3,
      employeeId: "EMP003",
      fullName: "Hassan Malik",
      address: null,
      bankAccountNumber: "11223344556677",
      iban: null,
      bankName: "UBL",
      bankBranch: null,
      salary: 72000,
      status: "on_leave",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: 4,
    employeeId: 4,
    amount: 105000,
    paymentDate: null,
    month: "2024-01",
    status: "pending",
    paymentMethod: null,
    notes: null,
    createdAt: new Date(),
    employee: {
      id: 4,
      employeeId: "EMP004",
      fullName: "Sara Ahmed",
      address: null,
      bankAccountNumber: "55667788990011",
      iban: null,
      bankName: "Bank Alfalah",
      bankBranch: null,
      salary: 105000,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
];

export default function Salary() {
  const [selectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [payments] = useState(mockPayments);

  const filteredPayments = payments.filter((payment) => {
    if (statusFilter !== "all" && payment.status !== statusFilter) return false;
    return true;
  });

  const handleGenerateSalary = () => {
    console.log("Generating salary for month:", selectedMonth);
  };

  const handleMarkPaid = (payment: SalaryPayment) => {
    console.log("Marking as paid:", payment);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Salary Management</h1>
          <p className="text-muted-foreground">Manage employee salary payments and records</p>
        </div>
        <Button onClick={handleGenerateSalary} data-testid="button-generate-salary" className="gap-2">
          <Plus className="h-4 w-4" />
          Generate Salary
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Select value={selectedMonth} onValueChange={() => {}}>
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

      <SalaryTable salaryPayments={filteredPayments} onMarkPaid={handleMarkPaid} />
    </div>
  );
}
