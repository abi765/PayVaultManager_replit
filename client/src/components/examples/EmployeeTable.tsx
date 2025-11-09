import EmployeeTable from "../EmployeeTable";
import { Employee } from "@shared/schema";

const mockEmployees: Employee[] = [
  {
    id: 1,
    employeeId: "EMP001",
    fullName: "Ahmed Khan",
    address: "123 Main St, Karachi",
    bankAccountNumber: "12345678901234",
    iban: "PK36SCBL0000001123456702",
    bankName: "Habib Bank Limited (HBL)",
    bankBranch: "Karachi Branch",
    salary: 85000,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    employeeId: "EMP002",
    fullName: "Fatima Ali",
    address: "456 Park Ave, Lahore",
    bankAccountNumber: "98765432109876",
    iban: "PK89MEZN0003190123456789",
    bankName: "Meezan Bank",
    bankBranch: "Lahore Branch",
    salary: 95000,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    employeeId: "EMP003",
    fullName: "Hassan Malik",
    address: null,
    bankAccountNumber: "11223344556677",
    iban: null,
    bankName: "United Bank Limited (UBL)",
    bankBranch: null,
    salary: 72000,
    status: "on_leave",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function EmployeeTableExample() {
  return (
    <div className="p-6">
      <EmployeeTable
        employees={mockEmployees}
        onView={(emp) => console.log("View employee:", emp)}
        onEdit={(emp) => console.log("Edit employee:", emp)}
        onDelete={(emp) => console.log("Delete employee:", emp)}
      />
    </div>
  );
}
