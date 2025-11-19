import { Employee } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Eye } from "lucide-react";
import { EMPLOYEE_STATUS } from "@/lib/constants";
import { formatPKR } from "@/lib/utils";

interface EmployeeTableProps {
  employees: Employee[];
  onView?: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  canEdit?: boolean;
}

export default function EmployeeTable({ employees, onView, onEdit, onDelete, canEdit = true }: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No employees found
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
        {employees.map((employee) => (
          <Card key={employee.id} data-testid={`card-employee-${employee.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base" data-testid={`text-employee-name-${employee.id}`}>
                    {employee.fullName}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono" data-testid={`text-employee-id-${employee.id}`}>
                    {employee.employeeId}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="gap-1.5"
                  data-testid={`badge-employee-status-${employee.id}`}
                >
                  <div className={`h-2 w-2 rounded-full ${EMPLOYEE_STATUS[employee.status as keyof typeof EMPLOYEE_STATUS]?.color || "bg-gray-500"}`} />
                  {EMPLOYEE_STATUS[employee.status as keyof typeof EMPLOYEE_STATUS]?.label || employee.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium truncate ml-2 max-w-[180px]" data-testid={`text-employee-bank-${employee.id}`}>
                    {employee.bankName || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salary</span>
                  <span className="font-semibold text-primary" data-testid={`text-employee-salary-${employee.id}`}>
                    {formatPKR(employee.salary)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onView?.(employee)}
                  data-testid={`button-view-employee-${employee.id}`}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                {canEdit && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onEdit?.(employee)}
                      data-testid={`button-edit-employee-${employee.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => onDelete?.(employee)}
                      data-testid={`button-delete-employee-${employee.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
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
            {employees.map((employee) => (
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
                    {canEdit && (
                      <>
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
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
