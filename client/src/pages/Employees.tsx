import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import EmployeeTable from "@/components/EmployeeTable";
import EmployeeFormModal from "@/components/EmployeeFormModal";
import { Employee } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  {
    id: 4,
    employeeId: "EMP004",
    fullName: "Sara Ahmed",
    address: "789 Garden Rd, Islamabad",
    bankAccountNumber: "55667788990011",
    iban: "PK12ALFH0000098765432109",
    bankName: "Bank Alfalah",
    bankBranch: "Islamabad Branch",
    salary: 105000,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 5,
    employeeId: "EMP005",
    fullName: "Ali Raza",
    address: null,
    bankAccountNumber: "22334455667788",
    iban: null,
    bankName: "MCB Bank Limited",
    bankBranch: null,
    salary: 68000,
    status: "inactive",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [employees] = useState<Employee[]>(mockEmployees);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | undefined>();

  const filteredEmployees = employees.filter((emp) =>
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedEmployee(undefined);
    setFormOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    console.log("Deleting employee:", employeeToDelete);
    setDeleteDialogOpen(false);
    setEmployeeToDelete(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage employee records and information</p>
        </div>
        <Button onClick={handleAdd} data-testid="button-add-employee" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search employees by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-search-employees"
        />
      </div>

      <EmployeeTable
        employees={filteredEmployees}
        onView={(emp) => console.log("View:", emp)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <EmployeeFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={selectedEmployee}
        onSave={(data) => {
          console.log("Saved:", data);
          setFormOpen(false);
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {employeeToDelete?.fullName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
