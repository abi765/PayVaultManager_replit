import { Employee } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Eye } from "lucide-react";
import { EMPLOYEE_STATUS } from "@/lib/constants";
import { formatPKR } from "@/lib/utils";

interface EmployeeTableProps {
  employees: Employee[];
  onView?: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
}

export default function EmployeeTable({ employees, onView, onEdit, onDelete }: EmployeeTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Employee ID</TableHead>
            <TableHead className="font-semibold">Full Name</TableHead>
            <TableHead className="font-semibold">Bank</TableHead>
            <TableHead className="font-semibold">Salary (PKR)</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                No employees found
              </TableCell>
            </TableRow>
          ) : (
            employees.map((employee) => (
              <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
                <TableCell className="font-medium" data-testid={`text-employee-id-${employee.id}`}>
                  {employee.employeeId}
                </TableCell>
                <TableCell data-testid={`text-employee-name-${employee.id}`}>
                  {employee.fullName}
                </TableCell>
                <TableCell data-testid={`text-employee-bank-${employee.id}`}>
                  {employee.bankName || "-"}
                </TableCell>
                <TableCell data-testid={`text-employee-salary-${employee.id}`}>
                  {formatPKR(employee.salary)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="gap-1.5"
                    data-testid={`badge-employee-status-${employee.id}`}
                  >
                    <div className={`h-2 w-2 rounded-full ${EMPLOYEE_STATUS[employee.status as keyof typeof EMPLOYEE_STATUS]?.color || "bg-gray-500"}`} />
                    {EMPLOYEE_STATUS[employee.status as keyof typeof EMPLOYEE_STATUS]?.label || employee.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView?.(employee)}
                      data-testid={`button-view-employee-${employee.id}`}
                      aria-label="View employee"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit?.(employee)}
                      data-testid={`button-edit-employee-${employee.id}`}
                      aria-label="Edit employee"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete?.(employee)}
                      data-testid={`button-delete-employee-${employee.id}`}
                      aria-label="Delete employee"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
