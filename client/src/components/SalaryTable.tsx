import { SalaryPayment, Employee } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2 } from "lucide-react";
import { PAYMENT_STATUS } from "@/lib/constants";
import { format } from "date-fns";

interface SalaryTableProps {
  salaryPayments: (SalaryPayment & { employee?: Employee })[];
  onMarkPaid?: (payment: SalaryPayment) => void;
}

export default function SalaryTable({ salaryPayments, onMarkPaid }: SalaryTableProps) {
  return (
    <div className="rounded-md border">
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
          {salaryPayments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                No salary records found
              </TableCell>
            </TableRow>
          ) : (
            salaryPayments.map((payment) => (
              <TableRow key={payment.id} data-testid={`row-salary-${payment.id}`}>
                <TableCell className="font-medium" data-testid={`text-salary-employee-${payment.id}`}>
                  {payment.employee?.fullName || `Employee #${payment.employeeId}`}
                </TableCell>
                <TableCell data-testid={`text-salary-month-${payment.id}`}>
                  {payment.month}
                </TableCell>
                <TableCell data-testid={`text-salary-amount-${payment.id}`}>
                  {payment.amount.toLocaleString()}
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
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
