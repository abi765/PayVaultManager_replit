import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | undefined>();
  const { toast } = useToast();

  const queryKey = searchTerm 
    ? ["/api/employees", `?limit=100&offset=0&search=${encodeURIComponent(searchTerm)}`]
    : ["/api/employees", "?limit=100&offset=0"];

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Employee deleted",
        description: "The employee has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setEmployeeToDelete(undefined);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
    if (employeeToDelete) {
      deleteMutation.mutate(employeeToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Employees</h1>
            <p className="text-muted-foreground">Manage employee records and information</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    );
  }

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
        employees={employees}
        onView={(emp) => console.log("View:", emp)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <EmployeeFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={selectedEmployee}
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
            <AlertDialogAction 
              onClick={confirmDelete} 
              data-testid="button-confirm-delete"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
