import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Gift, Clock, MinusCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

// Types
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

type Deduction = {
  id: number;
  name: string;
  type: string;
  amount?: number;
  percentage?: number;
  description?: string;
};

type OvertimeRecord = {
  id: number;
  employeeId: number;
  month: string;
  hours: number;
  rate: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  employeeName?: string;
};

// Schemas
const overtimeSchema = z.object({
  employeeId: z.coerce.number().positive("Please select an employee"),
  month: z.string().min(1, "Month is required"),
  hours: z.coerce.number().positive("Hours must be positive"),
  rate: z.coerce.number().positive("Rate must be positive"),
  notes: z.string().optional(),
});

const employeeAllowanceSchema = z.object({
  employeeId: z.coerce.number().positive("Please select an employee"),
  allowanceId: z.coerce.number().positive("Please select an allowance"),
  customAmount: z.coerce.number().positive("Amount must be positive").nullable().optional(),
});

const employeeDeductionSchema = z.object({
  employeeId: z.coerce.number().positive("Please select an employee"),
  deductionId: z.coerce.number().positive("Please select a deduction"),
  customAmount: z.coerce.number().positive("Amount must be positive").nullable().optional(),
});

export default function SalaryAdjustments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";
  const [activeTab, setActiveTab] = useState("allowances");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Salary Adjustments</h1>
        <p className="text-sm text-muted-foreground">
          Manage allowances, deductions, and overtime for employees
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="allowances" className="gap-2">
            <Gift className="h-4 w-4 hidden sm:block" />
            Allowances
          </TabsTrigger>
          <TabsTrigger value="deductions" className="gap-2">
            <MinusCircle className="h-4 w-4 hidden sm:block" />
            Deductions
          </TabsTrigger>
          <TabsTrigger value="overtime" className="gap-2">
            <Clock className="h-4 w-4 hidden sm:block" />
            Overtime
          </TabsTrigger>
        </TabsList>

        <TabsContent value="allowances">
          <AllowancesTab canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="deductions">
          <DeductionsTab canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="overtime">
          <OvertimeTab canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Allowances Tab Component
function AllowancesTab({ canEdit }: { canEdit: boolean }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

  const { data: allEmployeeAllowances, isLoading } = useQuery({
    queryKey: ["/api/employee-allowances"],
    queryFn: async () => {
      const employeesRes = await fetch("/api/employees", {
        headers: { "x-user-id": localStorage.getItem("userId") || "" },
      });
      const employeesData = await employeesRes.json();
      const employees = employeesData.employees || [];

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

  const { data: employeesData } = useQuery({ queryKey: ["/api/employees"] });
  const { data: allowancesData } = useQuery({ queryKey: ["/api/allowances"] });

  const records = (allEmployeeAllowances as any) || [];
  const employees = ((employeesData as any)?.employees || []) as Employee[];
  const allowances = Array.isArray(allowancesData) ? allowancesData : ((allowancesData as any)?.allowances || []);

  const filteredRecords = selectedEmployee
    ? records.filter((r: any) => r.employeeId === selectedEmployee)
    : records;

  const deleteMutation = useMutation({
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
    if (record.customAmount) return record.customAmount;
    if (record.allowance?.amount) return record.allowance.amount;
    if (record.allowance?.percentage && employee) {
      return employee.salary * (record.allowance.percentage / 100);
    }
    return 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1" />
            Assign Allowance
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading allowances...</div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">No allowances assigned</p>
            <p className="text-sm">Assign allowances to employees to include them in salary calculations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map((record: any) => {
            const employee = employees.find(e => e.id === record.employeeId);
            const amount = calculateAmount(record, employee);

            return (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{record.employeeName || `Employee #${record.employeeId}`}</CardTitle>
                      <CardDescription>
                        {record.employeeCode && <span className="font-mono">{record.employeeCode}</span>}
                      </CardDescription>
                    </div>
                    {canEdit && (
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ employeeId: record.employeeId, id: record.id })}>
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
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      {record.customAmount ? "Custom Amount" : record.allowance?.percentage ? `${record.allowance.percentage}% of base salary` : "Fixed Amount"}
                    </div>
                    <span className="text-lg font-semibold text-primary">{formatCurrency(amount)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AllowanceDialog open={dialogOpen} onOpenChange={setDialogOpen} employees={employees} allowances={allowances} />
    </div>
  );
}

// Deductions Tab Component
function DeductionsTab({ canEdit }: { canEdit: boolean }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

  const { data: allEmployeeDeductions, isLoading } = useQuery({
    queryKey: ["/api/employee-deductions"],
    queryFn: async () => {
      const employeesRes = await fetch("/api/employees", {
        headers: { "x-user-id": localStorage.getItem("userId") || "" },
      });
      const employeesData = await employeesRes.json();
      const employees = employeesData.employees || [];

      const allDeductions = [];
      for (const emp of employees) {
        const res = await fetch(`/api/employees/${emp.id}/deductions`, {
          headers: { "x-user-id": localStorage.getItem("userId") || "" },
        });
        const empDeductions = await res.json();
        for (const deduction of empDeductions) {
          allDeductions.push({
            ...deduction,
            employeeName: emp.fullName,
            employeeCode: emp.employeeId,
          });
        }
      }
      return allDeductions;
    },
  });

  const { data: employeesData } = useQuery({ queryKey: ["/api/employees"] });
  const { data: deductionsData } = useQuery({ queryKey: ["/api/deductions"] });

  const records = (allEmployeeDeductions as any) || [];
  const employees = ((employeesData as any)?.employees || []) as Employee[];
  const deductions = Array.isArray(deductionsData) ? deductionsData : ((deductionsData as any)?.deductions || []);

  const filteredRecords = selectedEmployee
    ? records.filter((r: any) => r.employeeId === selectedEmployee)
    : records;

  const deleteMutation = useMutation({
    mutationFn: async ({ employeeId, id }: { employeeId: number; id: number }) => {
      const response = await fetch(`/api/employees/${employeeId}/deductions/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": localStorage.getItem("userId") || "" },
      });
      if (!response.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-deductions"] });
      toast({ title: "Success", description: "Employee deduction removed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove employee deduction", variant: "destructive" });
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
      tax: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      insurance: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      loan: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      advance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return colors[type] || colors.other;
  };

  const calculateAmount = (record: any, employee?: Employee) => {
    if (record.customAmount) return record.customAmount;
    if (record.deduction?.amount) return record.deduction.amount;
    if (record.deduction?.percentage && employee) {
      return employee.salary * (record.deduction.percentage / 100);
    }
    return 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1" />
            Assign Deduction
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading deductions...</div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MinusCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">No deductions assigned</p>
            <p className="text-sm">Assign deductions to employees to include them in salary calculations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map((record: any) => {
            const employee = employees.find(e => e.id === record.employeeId);
            const amount = calculateAmount(record, employee);

            return (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{record.employeeName || `Employee #${record.employeeId}`}</CardTitle>
                      <CardDescription>
                        {record.employeeCode && <span className="font-mono">{record.employeeCode}</span>}
                      </CardDescription>
                    </div>
                    {canEdit && (
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ employeeId: record.employeeId, id: record.id })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{record.deduction?.name}</span>
                        <Badge className={getTypeColor(record.deduction?.type || "other")}>
                          {record.deduction?.type?.replace("_", " ") || "other"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      {record.customAmount ? "Custom Amount" : record.deduction?.percentage ? `${record.deduction.percentage}% of base salary` : "Fixed Amount"}
                    </div>
                    <span className="text-lg font-semibold text-destructive">-{formatCurrency(amount)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DeductionDialog open={dialogOpen} onOpenChange={setDialogOpen} employees={employees} deductions={deductions} />
    </div>
  );
}

// Overtime Tab Component
function OvertimeTab({ canEdit }: { canEdit: boolean }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: overtimeData, isLoading } = useQuery({ queryKey: ["/api/overtime"] });
  const { data: employeesData } = useQuery({ queryKey: ["/api/employees"] });

  const overtimeRecords = (overtimeData as any)?.records || [];
  const employees = ((employeesData as any)?.employees || []) as Employee[];

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/overtime/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": localStorage.getItem("userId") || "" },
      });
      if (!response.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime"] });
      toast({ title: "Success", description: "Overtime record deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete overtime record", variant: "destructive" });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1" />
            Add Overtime
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading overtime records...</div>
      ) : overtimeRecords.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">No overtime records found</p>
            <p className="text-sm">Add overtime records to include them in salary calculations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {overtimeRecords.map((record: OvertimeRecord) => {
            const employee = employees.find(e => e.id === record.employeeId);
            const employeeName = record.employeeName || employee?.fullName || `Employee #${record.employeeId}`;
            const employeeCode = employee?.employeeId;

            return (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{employeeName}</CardTitle>
                      <CardDescription>
                        {employeeCode && <span className="font-mono">{employeeCode} • </span>}
                        {record.month} • {record.hours} hours @ {formatCurrency(record.rate)}/hour
                      </CardDescription>
                    </div>
                    {canEdit && (
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(record.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Amount</span>
                    <span className="text-lg font-semibold text-primary">{formatCurrency(record.totalAmount)}</span>
                  </div>
                  {record.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Notes: {record.notes}</p>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Added {new Date(record.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <OvertimeDialog open={dialogOpen} onOpenChange={setDialogOpen} employees={employees} />
    </div>
  );
}

// Dialog Components
function AllowanceDialog({ open, onOpenChange, employees, allowances }: { open: boolean; onOpenChange: (open: boolean) => void; employees: Employee[]; allowances: Allowance[] }) {
  const { toast } = useToast();
  const [selectedAllowance, setSelectedAllowance] = useState<Allowance | null>(null);

  const form = useForm<z.infer<typeof employeeAllowanceSchema>>({
    resolver: zodResolver(employeeAllowanceSchema),
    defaultValues: { employeeId: 0, allowanceId: 0, customAmount: undefined },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof employeeAllowanceSchema>) => {
      return await apiRequest("POST", `/api/employees/${data.employeeId}/allowances`, {
        allowanceId: data.allowanceId,
        customAmount: data.customAmount || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-allowances"] });
      toast({ title: "Success", description: "Allowance assigned successfully" });
      onOpenChange(false);
      form.reset();
      setSelectedAllowance(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to assign allowance", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Allowance to Employee</DialogTitle>
          <DialogDescription>Assign an allowance to an employee for salary calculation.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField control={form.control} name="employeeId" render={({ field }) => (
              <FormItem>
                <FormLabel>Employee</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>{emp.fullName} ({emp.employeeId})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="allowanceId" render={({ field }) => (
              <FormItem>
                <FormLabel>Allowance</FormLabel>
                <Select onValueChange={(value) => { field.onChange(parseInt(value)); setSelectedAllowance(allowances.find((a: Allowance) => a.id === parseInt(value)) || null); }} defaultValue={field.value?.toString()}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select allowance" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {allowances.map((allowance: Allowance) => (
                      <SelectItem key={allowance.id} value={allowance.id.toString()}>{allowance.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="customAmount" render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Amount (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="e.g., 5000.00" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                </FormControl>
                <FormDescription>
                  {selectedAllowance?.amount && `Default: PKR ${selectedAllowance.amount}`}
                  {selectedAllowance?.percentage && `Default: ${selectedAllowance.percentage}% of base salary`}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Assigning..." : "Assign Allowance"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeductionDialog({ open, onOpenChange, employees, deductions }: { open: boolean; onOpenChange: (open: boolean) => void; employees: Employee[]; deductions: Deduction[] }) {
  const { toast } = useToast();
  const [selectedDeduction, setSelectedDeduction] = useState<Deduction | null>(null);

  const form = useForm<z.infer<typeof employeeDeductionSchema>>({
    resolver: zodResolver(employeeDeductionSchema),
    defaultValues: { employeeId: 0, deductionId: 0, customAmount: undefined },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof employeeDeductionSchema>) => {
      return await apiRequest("POST", `/api/employees/${data.employeeId}/deductions`, {
        deductionId: data.deductionId,
        customAmount: data.customAmount || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-deductions"] });
      toast({ title: "Success", description: "Deduction assigned successfully" });
      onOpenChange(false);
      form.reset();
      setSelectedDeduction(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to assign deduction", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Deduction to Employee</DialogTitle>
          <DialogDescription>Assign a deduction to an employee for salary calculation.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField control={form.control} name="employeeId" render={({ field }) => (
              <FormItem>
                <FormLabel>Employee</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>{emp.fullName} ({emp.employeeId})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="deductionId" render={({ field }) => (
              <FormItem>
                <FormLabel>Deduction</FormLabel>
                <Select onValueChange={(value) => { field.onChange(parseInt(value)); setSelectedDeduction(deductions.find((d: Deduction) => d.id === parseInt(value)) || null); }} defaultValue={field.value?.toString()}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select deduction" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {deductions.map((deduction: Deduction) => (
                      <SelectItem key={deduction.id} value={deduction.id.toString()}>{deduction.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="customAmount" render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Amount (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="e.g., 5000.00" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                </FormControl>
                <FormDescription>
                  {selectedDeduction?.amount && `Default: PKR ${selectedDeduction.amount}`}
                  {selectedDeduction?.percentage && `Default: ${selectedDeduction.percentage}% of base salary`}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Assigning..." : "Assign Deduction"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function OvertimeDialog({ open, onOpenChange, employees }: { open: boolean; onOpenChange: (open: boolean) => void; employees: Employee[] }) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof overtimeSchema>>({
    resolver: zodResolver(overtimeSchema),
    defaultValues: { employeeId: 0, month: new Date().toISOString().slice(0, 7), hours: 0, rate: 0, notes: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof overtimeSchema>) => {
      return await apiRequest("POST", "/api/overtime", { ...data, totalAmount: data.hours * data.rate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime"] });
      toast({ title: "Success", description: "Overtime record added successfully" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add overtime record", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Overtime Record</DialogTitle>
          <DialogDescription>Record overtime hours worked by an employee.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField control={form.control} name="employeeId" render={({ field }) => (
              <FormItem>
                <FormLabel>Employee</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>{emp.fullName} ({emp.employeeId})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="month" render={({ field }) => (
              <FormItem>
                <FormLabel>Month</FormLabel>
                <FormControl><Input type="month" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="hours" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours</FormLabel>
                  <FormControl><Input type="number" step="0.5" placeholder="e.g., 10" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="rate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate (PKR/hour)</FormLabel>
                  <FormControl><Input type="number" step="1" placeholder="e.g., 500" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl><Textarea placeholder="Any additional notes..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Adding..." : "Add Overtime"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
