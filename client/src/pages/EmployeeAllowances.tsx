import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

const employeeAllowanceSchema = z.object({
  employeeId: z.coerce.number().positive("Please select an employee"),
  allowanceId: z.coerce.number().positive("Please select an allowance"),
  customAmount: z.coerce.number().positive("Amount must be positive").nullable().optional(),
});

type EmployeeAllowanceRecord = {
  id: number;
  employeeId: number;
  allowanceId: number;
  customAmount?: number | null;
  createdAt: string;
  employeeName?: string;
  allowance?: {
    id: number;
    name: string;
    type: string;
    amount?: number;
    percentage?: number;
    description?: string;
  };
};

type Employee = {
  id: number;
  fullName: string;
  employeeId: string;
  salary: number;
};

type Allowance = {
  id: number;
  name: string;
  type: string;
  amount?: number;
  percentage?: number;
  description?: string;
};

export default function EmployeeAllowances() {
  const { toast } = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

  // Fetch all employee allowance assignments
  const { data: allEmployeeAllowances, isLoading: isLoadingAllowances } = useQuery({
    queryKey: ["/api/employee-allowances"],
    queryFn: async () => {
      const employeesRes = await fetch("/api/employees", {
        headers: { "x-user-id": localStorage.getItem("userId") || "" },
      });
      const employeesData = await employeesRes.json();
      const employees = employeesData.employees || [];

      // Fetch allowances for each employee
      const allAllowances = [];
      for (const emp of employees) {
        const res = await fetch(`/api/employees/${emp.id}/allowances`, {
          headers: { "x-user-id": localStorage.getItem("userId") || "" },
        });
        const empAllowances = await res.json();
        for (const allowance of empAllowances) {
          allAllowances.push({
            ...allowance,
            employeeName: emp.fullName,
            employeeCode: emp.employeeId,
          });
        }
      }
      return allAllowances;
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: allowancesData } = useQuery({
    queryKey: ["/api/allowances"],
  });

  const employeeAllowanceRecords = (allEmployeeAllowances as any) || [];
  const employees = ((employeesData as any)?.employees || []) as Employee[];
  const allowances = Array.isArray(allowancesData) ? allowancesData : ((allowancesData as any)?.allowances || []);

  // Filter by selected employee if any
  const filteredRecords = selectedEmployee
    ? employeeAllowanceRecords.filter((r: any) => r.employeeId === selectedEmployee)
    : employeeAllowanceRecords;

  const deleteAllowanceMutation = useMutation({
    mutationFn: async ({ employeeId, id }: { employeeId: number; id: number }) => {
      const response = await fetch(`/api/employees/${employeeId}/allowances/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": localStorage.getItem("userId") || "" },
      });
      if (!response.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-allowances"] });
      toast({ title: "Success", description: "Employee allowance removed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove employee allowance", variant: "destructive" });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      bonus: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      shift_premium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      travel: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      housing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      meal: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return colors[type] || colors.other;
  };

  const calculateAmount = (record: any, employee?: Employee) => {
    if (record.customAmount) {
      return record.customAmount;
    }
    if (record.allowance?.amount) {
      return record.allowance.amount;
    }
    if (record.allowance?.percentage && employee) {
      return employee.salary * (record.allowance.percentage / 100);
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="text-allowances-title">
            Employee Allowances
          </h1>
          <p className="text-sm text-muted-foreground">
            Assign allowances to employees for accurate salary calculation
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)} data-testid="button-add-allowance" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1" />
            Assign Allowance
          </Button>
        )}
      </div>

      <div className="flex gap-4 items-center">
        <Select value={selectedEmployee?.toString() || "all"} onValueChange={(value) => setSelectedEmployee(value === "all" ? null : parseInt(value))}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Filter by employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id.toString()}>
                {emp.fullName} ({emp.employeeId})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoadingAllowances ? (
        <div className="text-center py-8">Loading employee allowances...</div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">No employee allowances found</p>
            <p className="text-sm">Assign allowances to employees to include them in salary calculations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map((record: any) => {
            const employee = employees.find(e => e.id === record.employeeId);
            const amount = calculateAmount(record, employee);

            return (
              <Card key={record.id} data-testid={`card-allowance-${record.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {record.employeeName || `Employee #${record.employeeId}`}
                      </CardTitle>
                      <CardDescription>
                        {record.employeeCode && <span className="font-mono">{record.employeeCode}</span>}
                      </CardDescription>
                    </div>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAllowanceMutation.mutate({ employeeId: record.employeeId, id: record.id })}
                        data-testid={`button-delete-allowance-${record.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{record.allowance?.name}</span>
                        <Badge className={getTypeColor(record.allowance?.type || "other")}>
                          {record.allowance?.type?.replace("_", " ") || "other"}
                        </Badge>
                      </div>
                      {record.allowance?.description && (
                        <p className="text-sm text-muted-foreground">{record.allowance.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      {record.customAmount ? (
                        <span>Custom Amount</span>
                      ) : record.allowance?.percentage ? (
                        <span>{record.allowance.percentage}% of base salary</span>
                      ) : (
                        <span>Fixed Amount</span>
                      )}
                    </div>
                    <span className="text-lg font-semibold text-primary">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Assigned {new Date(record.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AllowanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employees={employees}
        allowances={allowances}
      />
    </div>
  );
}

function AllowanceDialog({
  open,
  onOpenChange,
  employees,
  allowances,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  allowances: Allowance[];
}) {
  const { toast } = useToast();
  const [selectedAllowance, setSelectedAllowance] = useState<Allowance | null>(null);

  const form = useForm<z.infer<typeof employeeAllowanceSchema>>({
    resolver: zodResolver(employeeAllowanceSchema),
    defaultValues: {
      employeeId: 0,
      allowanceId: 0,
      customAmount: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof employeeAllowanceSchema>) => {
      const payload = {
        allowanceId: data.allowanceId,
        customAmount: data.customAmount || null,
      };
      return await apiRequest("POST", `/api/employees/${data.employeeId}/allowances`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-allowances"] });
      toast({
        title: "Success",
        description: "Allowance assigned to employee successfully",
      });
      onOpenChange(false);
      form.reset();
      setSelectedAllowance(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign allowance",
        variant: "destructive",
      });
    },
  });

  const handleAllowanceChange = (allowanceId: string) => {
    const allowance = allowances.find((a: Allowance) => a.id === parseInt(allowanceId));
    setSelectedAllowance(allowance || null);
    form.setValue("allowanceId", parseInt(allowanceId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-allowance">
        <DialogHeader>
          <DialogTitle>Assign Allowance to Employee</DialogTitle>
          <DialogDescription>
            Assign an allowance to an employee. The allowance will be included in their salary calculation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-employee">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.fullName} ({emp.employeeId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowanceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allowance</FormLabel>
                  <Select
                    onValueChange={handleAllowanceChange}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-allowance-type">
                        <SelectValue placeholder="Select allowance" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allowances.map((allowance: Allowance) => (
                        <SelectItem key={allowance.id} value={allowance.id.toString()}>
                          {allowance.name} {allowance.amount && `(${new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0 }).format(allowance.amount)})`}
                          {allowance.percentage && `(${allowance.percentage}%)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedAllowance?.description && (
                    <FormDescription>{selectedAllowance.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Amount (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g., 5000.00"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      data-testid="input-custom-amount"
                    />
                  </FormControl>
                  <FormDescription>
                    {selectedAllowance?.amount && `Default: ${new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 2 }).format(selectedAllowance.amount)}`}
                    {selectedAllowance?.percentage && `Default: ${selectedAllowance.percentage}% of base salary`}
                    {!selectedAllowance && "Select an allowance to see default amount"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-allowance">
                {mutation.isPending ? "Assigning..." : "Assign Allowance"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
