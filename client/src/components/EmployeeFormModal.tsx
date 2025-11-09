import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PAKISTANI_BANKS } from "@/lib/constants";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Employee, insertEmployeeSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee;
}

export default function EmployeeFormModal({ open, onOpenChange, employee }: EmployeeFormModalProps) {
  const { toast } = useToast();
  const [showCustomBank, setShowCustomBank] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    fullName: "",
    address: "",
    bankAccountNumber: "",
    iban: "",
    bankName: "",
    bankBranch: "",
    salary: "",
    status: "active" as "active" | "on_leave" | "inactive",
  });

  useEffect(() => {
    if (open && employee) {
      setFormData({
        employeeId: employee.employeeId || "",
        fullName: employee.fullName || "",
        address: employee.address || "",
        bankAccountNumber: employee.bankAccountNumber || "",
        iban: employee.iban || "",
        bankName: employee.bankName || "",
        bankBranch: employee.bankBranch || "",
        salary: employee.salary?.toString() || "",
        status: (employee.status as "active" | "on_leave" | "inactive") || "active",
      });
    } else if (open && !employee) {
      setFormData({
        employeeId: "",
        fullName: "",
        address: "",
        bankAccountNumber: "",
        iban: "",
        bankName: "",
        bankBranch: "",
        salary: "",
        status: "active",
      });
    }
  }, [open, employee]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/employees", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Employee created",
        description: "The employee has been successfully added.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/employees/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Employee updated",
        description: "The employee has been successfully updated.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBankChange = (value: string) => {
    if (value === "Custom (Enter manually)") {
      setShowCustomBank(true);
      setFormData({ ...formData, bankName: "" });
    } else {
      setShowCustomBank(false);
      setFormData({ ...formData, bankName: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = insertEmployeeSchema.parse({
        ...formData,
        salary: Number(formData.salary),
        address: formData.address || null,
        iban: formData.iban || null,
        bankBranch: formData.bankBranch || null,
      });

      if (employee) {
        updateMutation.mutate({ id: employee.id, data: validatedData });
      } else {
        createMutation.mutate(validatedData);
      }
    } catch (error: any) {
      toast({
        title: "Validation error",
        description: error.errors?.[0]?.message || "Please check your input",
        variant: "destructive",
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
          <DialogDescription>
            {employee ? "Update employee information below" : "Enter employee details to add them to the system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="EMP001"
                data-testid="input-employee-id"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Ahmed Khan"
                data-testid="input-full-name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address (Optional)</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street, Karachi"
              data-testid="input-address"
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Bank Account Number *</Label>
              <Input
                id="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value.replace(/\D/g, "") })}
                placeholder="12345678"
                data-testid="input-bank-account"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN (Optional)</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                placeholder="PK36SCBL0000001123456702"
                maxLength={34}
                className="font-mono"
                data-testid="input-iban"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Select value={showCustomBank ? "Custom (Enter manually)" : formData.bankName} onValueChange={handleBankChange}>
                <SelectTrigger id="bankName" data-testid="select-bank-name">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {PAKISTANI_BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showCustomBank && (
                <Input
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Enter bank name"
                  className="mt-2"
                  data-testid="input-custom-bank"
                  required
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankBranch">Bank Branch (Optional)</Label>
              <Input
                id="bankBranch"
                value={formData.bankBranch}
                onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                placeholder="Karachi Main Branch"
                data-testid="input-bank-branch"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="salary">Monthly Salary (PKR) *</Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="85000"
                min="0"
                step="0.01"
                data-testid="input-salary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (employee ? "Update Employee" : "Add Employee")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
