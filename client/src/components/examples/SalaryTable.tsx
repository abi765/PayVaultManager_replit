import SalaryTable from "../SalaryTable";
import { SalaryPayment, Employee } from "@shared/schema";

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
];

export default function SalaryTableExample() {
  return (
    <div className="p-6">
      <SalaryTable
        salaryPayments={mockPayments}
        onMarkPaid={(payment) => console.log("Mark as paid:", payment)}
      />
    </div>
  );
}
