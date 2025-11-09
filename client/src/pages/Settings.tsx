import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { type Deduction, type Allowance } from "@shared/schema";
import { z } from "zod";

export default function Settings() {
  const { toast } = useToast();
  const [deductionDialogOpen, setDeductionDialogOpen] = useState(false);
  const [allowanceDialogOpen, setAllowanceDialogOpen] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<Deduction | null>(null);
  const [editingAllowance, setEditingAllowance] = useState<Allowance | null>(null);

  const { data: deductionsData, isLoading: deductionsLoading } = useQuery({
    queryKey: ["/api/deductions"],
  });

  const { data: allowancesData, isLoading: allowancesLoading } = useQuery({
    queryKey: ["/api/allowances"],
  });

  const deductions = (deductionsData as any)?.deductions || [];
  const allowances = (allowancesData as any)?.allowances || [];

  const deleteDeductionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/deductions/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": localStorage.getItem("userId") || "" },
      });
      if (!response.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deductions"] });
      toast({ title: "Success", description: "Deduction deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete deduction", variant: "destructive" });
    },
  });

  const deleteAllowanceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/allowances/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": localStorage.getItem("userId") || "" },
      });
      if (!response.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allowances"] });
      toast({ title: "Success", description: "Allowance deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete allowance", variant: "destructive" });
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground">
          Manage salary deductions and allowances
        </p>
      </div>

      <Tabs defaultValue="deductions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deductions" data-testid="tab-deductions">Deductions</TabsTrigger>
          <TabsTrigger value="allowances" data-testid="tab-allowances">Allowances</TabsTrigger>
        </TabsList>

        <TabsContent value="deductions" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Deductions</h2>
              <p className="text-sm text-muted-foreground">
                Manage tax, insurance, and other deductions
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingDeduction(null);
                setDeductionDialogOpen(true);
              }}
              data-testid="button-add-deduction"
            >
              <Plus className="h-4 w-4" />
              Add Deduction
            </Button>
          </div>

          {deductionsLoading ? (
            <div className="text-center py-8">Loading deductions...</div>
          ) : deductions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No deductions configured yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {deductions.map((deduction: Deduction) => (
                <Card key={deduction.id} data-testid={`card-deduction-${deduction.id}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{deduction.name}</CardTitle>
                    <CardDescription className="capitalize">{deduction.type.replace(/_/g, " ")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-bold">
                      {deduction.amount
                        ? formatCurrency(deduction.amount)
                        : deduction.percentage
                        ? `${deduction.percentage}%`
                        : "N/A"}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingDeduction(deduction);
                          setDeductionDialogOpen(true);
                        }}
                        data-testid={`button-edit-deduction-${deduction.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDeductionMutation.mutate(deduction.id)}
                        data-testid={`button-delete-deduction-${deduction.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="allowances" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Allowances</h2>
              <p className="text-sm text-muted-foreground">
                Manage bonuses, shift premiums, and travel allowances
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingAllowance(null);
                setAllowanceDialogOpen(true);
              }}
              data-testid="button-add-allowance"
            >
              <Plus className="h-4 w-4" />
              Add Allowance
            </Button>
          </div>

          {allowancesLoading ? (
            <div className="text-center py-8">Loading allowances...</div>
          ) : allowances.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No allowances configured yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allowances.map((allowance: Allowance) => (
                <Card key={allowance.id} data-testid={`card-allowance-${allowance.id}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{allowance.name}</CardTitle>
                    <CardDescription className="capitalize">{allowance.type.replace(/_/g, " ")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-bold">
                      {allowance.amount
                        ? formatCurrency(allowance.amount)
                        : allowance.percentage
                        ? `${allowance.percentage}%`
                        : "N/A"}
                    </div>
                    {allowance.isLocationBased === 1 && (
                      <div className="text-xs text-muted-foreground">
                        Location-based{" "}
                        {allowance.minDistanceKm && `(min ${allowance.minDistanceKm} km)`}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingAllowance(allowance);
                          setAllowanceDialogOpen(true);
                        }}
                        data-testid={`button-edit-allowance-${allowance.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAllowanceMutation.mutate(allowance.id)}
                        data-testid={`button-delete-allowance-${allowance.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DeductionDialog
        open={deductionDialogOpen}
        onOpenChange={setDeductionDialogOpen}
        deduction={editingDeduction}
      />

      <AllowanceDialog
        open={allowanceDialogOpen}
        onOpenChange={setAllowanceDialogOpen}
        allowance={editingAllowance}
      />
    </div>
  );
}

function DeductionDialog({
  open,
  onOpenChange,
  deduction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deduction: Deduction | null;
}) {
  const { toast } = useToast();
  const formSchema = z.object({
    name: z.string().min(1, "Deduction name is required"),
    type: z.enum(["tax", "insurance", "provident_fund", "loan", "other"]),
    amount: z.coerce.number().positive().optional().nullable(),
    percentage: z.coerce.number().min(0).max(100).optional().nullable(),
    isActive: z.number().default(1),
  }).refine(data => data.amount || data.percentage, {
    message: "Either amount or percentage must be provided",
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: deduction?.name || "",
      type: (deduction?.type || "other") as "tax" | "insurance" | "provident_fund" | "loan" | "other",
      amount: deduction?.amount || null,
      percentage: deduction?.percentage || null,
      isActive: deduction?.isActive || 1,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const url = deduction ? `/api/deductions/${deduction.id}` : "/api/deductions";
      const method = deduction ? "PUT" : "POST";
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deductions"] });
      toast({
        title: "Success",
        description: `Deduction ${deduction ? "updated" : "created"} successfully`,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${deduction ? "update" : "create"} deduction`,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-deduction-form">
        <DialogHeader>
          <DialogTitle>{deduction ? "Edit" : "Add"} Deduction</DialogTitle>
          <DialogDescription>
            Configure a salary deduction. Provide either a fixed amount or percentage.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Income Tax" {...field} data-testid="input-deduction-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-deduction-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="tax">Tax</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="provident_fund">Provident Fund</SelectItem>
                      <SelectItem value="loan">Loan</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fixed Amount (PKR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Leave empty if using percentage"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-deduction-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentage (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Leave empty if using fixed amount"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-deduction-percentage"
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
              <Button type="submit" disabled={mutation.isPending} data-testid="button-save-deduction">
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AllowanceDialog({
  open,
  onOpenChange,
  allowance,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allowance: Allowance | null;
}) {
  const { toast } = useToast();
  const formSchema = z.object({
    name: z.string().min(1, "Allowance name is required"),
    type: z.enum(["bonus", "shift_premium", "travel", "housing", "meal", "other"]),
    amount: z.coerce.number().positive().optional().nullable(),
    percentage: z.coerce.number().min(0).max(100).optional().nullable(),
    isLocationBased: z.number().default(0),
    minDistanceKm: z.coerce.number().positive().optional().nullable(),
    isActive: z.number().default(1),
  }).refine(data => data.amount || data.percentage, {
    message: "Either amount or percentage must be provided",
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: allowance?.name || "",
      type: (allowance?.type || "other") as "bonus" | "shift_premium" | "travel" | "housing" | "meal" | "other",
      amount: allowance?.amount || null,
      percentage: allowance?.percentage || null,
      isLocationBased: allowance?.isLocationBased || 0,
      minDistanceKm: allowance?.minDistanceKm || null,
      isActive: allowance?.isActive || 1,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const url = allowance ? `/api/allowances/${allowance.id}` : "/api/allowances";
      const method = allowance ? "PUT" : "POST";
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allowances"] });
      toast({
        title: "Success",
        description: `Allowance ${allowance ? "updated" : "created"} successfully`,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${allowance ? "update" : "create"} allowance`,
        variant: "destructive",
      });
    },
  });

  const isLocationBased = form.watch("isLocationBased");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-allowance-form">
        <DialogHeader>
          <DialogTitle>{allowance ? "Edit" : "Add"} Allowance</DialogTitle>
          <DialogDescription>
            Configure a salary allowance. Provide either a fixed amount or percentage.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Transport Allowance" {...field} data-testid="input-allowance-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-allowance-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="shift_premium">Shift Premium</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="housing">Housing</SelectItem>
                      <SelectItem value="meal">Meal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fixed Amount (PKR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Leave empty if using percentage"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-allowance-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentage (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Leave empty if using fixed amount"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-allowance-percentage"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isLocationBased"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value === 1}
                      onChange={(e) => field.onChange(e.target.checked ? 1 : 0)}
                      data-testid="checkbox-location-based"
                      className="h-4 w-4"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Location-based allowance</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isLocationBased === 1 && (
              <FormField
                control={form.control}
                name="minDistanceKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Distance (km)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 10"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-min-distance"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-save-allowance">
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
