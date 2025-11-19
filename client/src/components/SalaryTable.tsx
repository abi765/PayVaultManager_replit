import { useState } from "react";
import { SalaryPayment, Employee, SalaryBreakdown } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, FileText, Trash2 } from "lucide-react";
import { PAYMENT_STATUS } from "@/lib/constants";
import { format } from "date-fns";
import { formatPKR } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface SalaryTableProps {
  salaryPayments: (SalaryPayment & { employee?: Employee })[];
  onMarkPaid?: (payment: SalaryPayment) => void;
  onDelete?: (payment: SalaryPayment) => void;
  canEdit?: boolean;
}

function BreakdownDialog({ payment }: { payment: SalaryPayment & { employee?: Employee } }) {
  const [open, setOpen] = useState(false);

  const { data: breakdown, isLoading, isError } = useQuery<SalaryBreakdown[]>({
    queryKey: [`/api/salary/${payment.id}/breakdown`],
    enabled: open,
  });

  const baseItems = breakdown?.filter(b => b.componentType === "base") || [];
  const allowanceItems = breakdown?.filter(b => b.componentType === "allowance") || [];
  const overtimeItems = breakdown?.filter(b => b.componentType === "overtime") || [];
  const deductionItems = breakdown?.filter(b => b.componentType === "deduction") || [];

  const baseTotal = baseItems.reduce((sum, b) => sum + b.amount, 0);
  const allowanceTotal = allowanceItems.reduce((sum, b) => sum + b.amount, 0);
  const overtimeTotal = overtimeItems.reduce((sum, b) => sum + b.amount, 0);
  const deductionTotal = deductionItems.reduce((sum, b) => sum + b.amount, 0);
  const grandTotal = baseTotal + allowanceTotal + overtimeTotal - deductionTotal;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5" data-testid={`button-view-breakdown-${payment.id}`}>
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">View Breakdown</span>
          <span className="sm:hidden">Details</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Salary Breakdown - {payment.employee?.fullName || `Employee #${payment.employeeId}`}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Month: {payment.month}
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading breakdown...</div>
        ) : isError ? (
          <div className="text-center py-8 text-destructive">Failed to load salary breakdown. Please try again.</div>
        ) : !breakdown || breakdown.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No breakdown data available for this payment.</div>
        ) : (
          <div className="space-y-4">
            {/* Base Salary */}
            <div className="rounded-md border p-4">
              <h3 className="font-semibold mb-2 flex items-center justify-between">
                <span>Base Salary</span>
                <span className="text-primary">{formatPKR(baseTotal)}</span>
              </h3>
              {baseItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1">
                  <span className="text-muted-foreground">{item.componentName}</span>
                  <span>{formatPKR(item.amount)}</span>
                </div>
              ))}
            </div>

            {/* Allowances */}
            {allowanceItems.length > 0 && (
              <div className="rounded-md border p-4">
                <h3 className="font-semibold mb-2 flex items-center justify-between text-green-600 dark:text-green-400">
                  <span>Allowances</span>
                  <span>+{formatPKR(allowanceTotal)}</span>
                </h3>
                {allowanceItems.map((item, idx) => (
                  <div key={idx} className="space-y-1 py-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.componentName}</span>
                      <span>{formatPKR(item.amount)}</span>
                    </div>
                    {item.calculationDetails && (
                      <div className="text-xs text-muted-foreground pl-4">
                        {item.calculationDetails}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Overtime */}
            {overtimeItems.length > 0 && (
              <div className="rounded-md border p-4">
                <h3 className="font-semibold mb-2 flex items-center justify-between text-blue-600 dark:text-blue-400">
                  <span>Overtime</span>
                  <span>+{formatPKR(overtimeTotal)}</span>
                </h3>
                {overtimeItems.map((item, idx) => (
                  <div key={idx} className="space-y-1 py-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.componentName}</span>
                      <span>{formatPKR(item.amount)}</span>
                    </div>
                    {item.calculationDetails && (
                      <div className="text-xs text-muted-foreground pl-4">
                        {item.calculationDetails}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Deductions */}
            {deductionItems.length > 0 && (
              <div className="rounded-md border p-4">
                <h3 className="font-semibold mb-2 flex items-center justify-between text-red-600 dark:text-red-400">
                  <span>Deductions</span>
                  <span>-{formatPKR(deductionTotal)}</span>
                </h3>
                {deductionItems.map((item, idx) => (
                  <div key={idx} className="space-y-1 py-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.componentName}</span>
                      <span>{formatPKR(item.amount)}</span>
                    </div>
                    {item.calculationDetails && (
                      <div className="text-xs text-muted-foreground pl-4">
                        {item.calculationDetails}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="rounded-md border border-primary p-4 bg-primary/5">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Net Salary</h3>
                <span className="font-bold text-xl text-primary">{formatPKR(grandTotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Base ({formatPKR(baseTotal)}) + Allowances ({formatPKR(allowanceTotal)}) + Overtime ({formatPKR(overtimeTotal)}) - Deductions ({formatPKR(deductionTotal)})
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SalaryTable({ salaryPayments, onMarkPaid, onDelete, canEdit = true }: SalaryTableProps) {
  if (salaryPayments.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No salary records found
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
        {salaryPayments.map((payment) => (
          <Card key={payment.id} data-testid={`card-salary-${payment.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base" data-testid={`text-salary-employee-${payment.id}`}>
                    {payment.employee?.fullName || `Employee #${payment.employeeId}`}
                  </h3>
                  <p className="text-sm text-muted-foreground" data-testid={`text-salary-month-${payment.id}`}>
                    {payment.month}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="gap-1.5"
                  data-testid={`badge-salary-status-${payment.id}`}
                >
                  <div className={`h-2 w-2 rounded-full ${PAYMENT_STATUS[payment.status as keyof typeof PAYMENT_STATUS]?.color || "bg-gray-500"}`} />
                  {PAYMENT_STATUS[payment.status as keyof typeof PAYMENT_STATUS]?.label || payment.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold text-primary text-base" data-testid={`text-salary-amount-${payment.id}`}>
                    {formatPKR(payment.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Date</span>
                  <span className="font-medium" data-testid={`text-salary-date-${payment.id}`}>
                    {payment.paymentDate ? format(new Date(payment.paymentDate), "MMM dd, yyyy") : "-"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t">
                <BreakdownDialog payment={payment} />
                {canEdit && (
                  <div className="flex gap-2">
                    {payment.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onMarkPaid?.(payment)}
                        data-testid={`button-mark-paid-${payment.id}`}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Mark Paid
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className={`${payment.status === "pending" ? "flex-1" : "w-full"} text-destructive hover:text-destructive`}
                      onClick={() => onDelete?.(payment)}
                      data-testid={`button-delete-${payment.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
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
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold">Month</TableHead>
              <TableHead className="font-semibold">Amount (PKR)</TableHead>
              <TableHead className="font-semibold">Payment Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salaryPayments.map((payment) => (
              <TableRow key={payment.id} data-testid={`row-salary-${payment.id}`}>
                <TableCell className="font-medium" data-testid={`text-salary-employee-${payment.id}`}>
                  {payment.employee?.fullName || `Employee #${payment.employeeId}`}
                </TableCell>
                <TableCell data-testid={`text-salary-month-${payment.id}`}>
                  {payment.month}
                </TableCell>
                <TableCell data-testid={`text-salary-amount-${payment.id}`}>
                  {formatPKR(payment.amount)}
                </TableCell>
                <TableCell data-testid={`text-salary-date-${payment.id}`}>
                  {payment.paymentDate ? format(new Date(payment.paymentDate), "MMM dd, yyyy") : "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="gap-1.5"
                    data-testid={`badge-salary-status-${payment.id}`}
                  >
                    <div className={`h-2 w-2 rounded-full ${PAYMENT_STATUS[payment.status as keyof typeof PAYMENT_STATUS]?.color || "bg-gray-500"}`} />
                    {PAYMENT_STATUS[payment.status as keyof typeof PAYMENT_STATUS]?.label || payment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <BreakdownDialog payment={payment} />
                  {canEdit && (
                    <>
                      {payment.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMarkPaid?.(payment)}
                          data-testid={`button-mark-paid-${payment.id}`}
                          className="gap-1.5"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark as Paid
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete?.(payment)}
                        data-testid={`button-delete-${payment.id}`}
                        className="gap-1.5 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
