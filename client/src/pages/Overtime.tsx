import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";

const overtimeSchema = z.object({
  employeeId: z.coerce.number().positive("Please select an employee"),
  month: z.string().min(1, "Month is required"),
  hours: z.coerce.number().positive("Hours must be positive"),
  rate: z.coerce.number().positive("Rate must be positive"),
  notes: z.string().optional(),
});

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

type Employee = {
  id: number;
  fullName: string;
  employeeId: string;
};

export default function Overtime() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: overtimeData, isLoading } = useQuery({
    queryKey: ["/api/overtime"],
  });

  const { data: employeesData } = useQuery({
    queryKey: ["/api/employees"],
  });

  const overtimeRecords = (overtimeData as any)?.records || [];
  const employees = ((employeesData as any)?.employees || []) as Employee[];

  const deleteOvertimeMutation = useMutation({
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-overtime-title">
            Overtime Management
          </h1>
          <p className="text-muted-foreground">
            Track employee overtime hours and rates for accurate salary calculation
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-overtime">
          <Plus className="h-4 w-4" />
          Add Overtime
        </Button>
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
          {overtimeRecords.map((record: OvertimeRecord) => (
            <Card key={record.id} data-testid={`card-overtime-${record.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {record.employeeName || `Employee #${record.employeeId}`}
                    </CardTitle>
                    <CardDescription>
                      {record.month} • {record.hours} hours @ {formatCurrency(record.rate)}/hour
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteOvertimeMutation.mutate(record.id)}
                    data-testid={`button-delete-overtime-${record.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-lg font-semibold text-primary">
                    {formatCurrency(record.totalAmount)}
                  </span>
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
          ))}
        </div>
      )}

      <OvertimeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employees={employees}
      />
    </div>
  );
}

function OvertimeDialog({
  open,
  onOpenChange,
  employees,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
}) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof overtimeSchema>>({
    resolver: zodResolver(overtimeSchema),
    defaultValues: {
      employeeId: 0,
      month: new Date().toISOString().slice(0, 7),
      hours: 0,
      rate: 0,
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof overtimeSchema>) => {
      return await apiRequest("POST", "/api/overtime", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime"] });
      toast({
        title: "Success",
        description: "Overtime record added successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add overtime record",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-overtime">
        <DialogHeader>
          <DialogTitle>Add Overtime Record</DialogTitle>
          <DialogDescription>
            Record overtime hours worked by an employee for accurate salary calculation
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
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Month</FormLabel>
                  <FormControl>
                    <Input type="month" {...field} data-testid="input-month" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="e.g., 10"
                        {...field}
                        data-testid="input-hours"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate (PKR/hour)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder="e.g., 500"
                        {...field}
                        data-testid="input-rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      {...field}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-overtime">
                {mutation.isPending ? "Adding..." : "Add Overtime"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
