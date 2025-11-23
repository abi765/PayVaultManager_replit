import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").notNull().default("viewer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  description: text("description"),
  managerId: integer("manager_id"),
  parentId: integer("parent_id"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: text("employee_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  address: text("address"),
  bankAccountNumber: text("bank_account_number"),
  iban: text("iban"),
  bankName: text("bank_name"),
  bankBranch: text("bank_branch"),
  salary: real("salary").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("employees_status_idx").on(table.status),
  bankAccountIdx: index("employees_bank_account_idx").on(table.bankAccountNumber),
  fullNameIdx: index("employees_full_name_idx").on(table.fullName),
  departmentIdx: index("employees_department_idx").on(table.departmentId),
}));

export const salaryPayments = pgTable("salary_payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  amount: real("amount").notNull(),
  paymentDate: timestamp("payment_date"),
  month: text("month").notNull(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  employeeIdIdx: index("salary_payments_employee_id_idx").on(table.employeeId),
  monthIdx: index("salary_payments_month_idx").on(table.month),
  statusIdx: index("salary_payments_status_idx").on(table.status),
  employeeMonthIdx: index("salary_payments_employee_month_idx").on(table.employeeId, table.month),
}));

export const deductions = pgTable("deductions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  amount: real("amount"),
  percentage: real("percentage"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const allowances = pgTable("allowances", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  amount: real("amount"),
  percentage: real("percentage"),
  isLocationBased: integer("is_location_based").notNull().default(0),
  minDistanceKm: real("min_distance_km"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employeeDeductions = pgTable("employee_deductions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  deductionId: integer("deduction_id").notNull().references(() => deductions.id),
  customAmount: real("custom_amount"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  employeeIdIdx: index("employee_deductions_employee_id_idx").on(table.employeeId),
  deductionIdIdx: index("employee_deductions_deduction_id_idx").on(table.deductionId),
}));

export const employeeAllowances = pgTable("employee_allowances", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  allowanceId: integer("allowance_id").notNull().references(() => allowances.id),
  customAmount: real("custom_amount"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  employeeIdIdx: index("employee_allowances_employee_id_idx").on(table.employeeId),
  allowanceIdIdx: index("employee_allowances_allowance_id_idx").on(table.allowanceId),
}));

export const overtimeRecords = pgTable("overtime_records", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  month: text("month").notNull(),
  hours: real("hours").notNull(),
  rate: real("rate").notNull(),
  totalAmount: real("total_amount").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  employeeIdIdx: index("overtime_records_employee_id_idx").on(table.employeeId),
  monthIdx: index("overtime_records_month_idx").on(table.month),
  employeeMonthIdx: index("overtime_records_employee_month_idx").on(table.employeeId, table.month),
}));

export const salaryBreakdown = pgTable("salary_breakdown", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  salaryPaymentId: integer("salary_payment_id").notNull().references(() => salaryPayments.id),
  componentType: text("component_type").notNull(),
  componentName: text("component_name").notNull(),
  amount: real("amount").notNull(),
  calculationDetails: text("calculation_details"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  salaryPaymentIdIdx: index("salary_breakdown_salary_payment_id_idx").on(table.salaryPaymentId),
}));

export const locationLogs = pgTable("location_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  accuracy: real("accuracy"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  purpose: text("purpose"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  employeeIdIdx: index("location_logs_employee_id_idx").on(table.employeeId),
  timestampIdx: index("location_logs_timestamp_idx").on(table.timestamp),
}));

export const activityLogs = pgTable("activity_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  role: text("role").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("activity_logs_user_id_idx").on(table.userId),
  actionIdx: index("activity_logs_action_idx").on(table.action),
  entityIdx: index("activity_logs_entity_idx").on(table.entity),
  timestampIdx: index("activity_logs_timestamp_idx").on(table.timestamp),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

export const insertDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  description: z.string().nullable().optional(),
  managerId: z.number().nullable().optional(),
  parentId: z.number().nullable().optional(),
  isActive: z.number().default(1),
});

const baseEmployeeSchema = createInsertSchema(employees);

export const insertEmployeeSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  bankAccountNumber: z.string().min(8, "Account number must be at least 8 digits").regex(/^\d+$/, "Only digits allowed"),
  bankName: z.string().min(1, "Bank name is required"),
  salary: z.coerce.number().positive("Salary must be greater than 0"),
  iban: z.string().regex(/^PK\d{2}[A-Z0-9]{20}$/i, "IBAN must be in Pakistani format: PK + 2 digits + 20 alphanumeric characters (total 24 characters)").nullable().optional().or(z.literal("")),
  address: z.string().nullable().optional(),
  bankBranch: z.string().nullable().optional(),
  departmentId: z.number().nullable().optional(),
  status: z.enum(["active", "on_leave", "inactive"]).default("active"),
});

const baseSalaryPaymentSchema = createInsertSchema(salaryPayments);

export const insertSalaryPaymentSchema = z.object({
  employeeId: z.number(),
  amount: z.coerce.number().positive(),
  paymentDate: z.date().nullable().optional(),
  month: z.string(),
  status: z.enum(["pending", "paid", "failed"]).default("pending"),
  paymentMethod: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const insertDeductionSchema = z.object({
  name: z.string().min(1, "Deduction name is required"),
  type: z.enum(["tax", "insurance", "provident_fund", "loan", "other"]),
  amount: z.coerce.number().positive().nullable().optional(),
  percentage: z.coerce.number().min(0).max(100).nullable().optional(),
  isActive: z.number().default(1),
}).refine(data => data.amount || data.percentage, {
  message: "Either amount or percentage must be provided",
});

export const insertAllowanceSchema = z.object({
  name: z.string().min(1, "Allowance name is required"),
  type: z.enum(["bonus", "shift_premium", "travel", "housing", "meal", "other"]),
  amount: z.coerce.number().positive().nullable().optional(),
  percentage: z.coerce.number().min(0).max(100).nullable().optional(),
  isLocationBased: z.number().default(0),
  minDistanceKm: z.coerce.number().positive().nullable().optional(),
  isActive: z.number().default(1),
}).refine(data => data.amount || data.percentage, {
  message: "Either amount or percentage must be provided",
});

export const insertEmployeeDeductionSchema = z.object({
  employeeId: z.number(),
  deductionId: z.number(),
  customAmount: z.coerce.number().positive().nullable().optional(),
  isActive: z.number().default(1),
});

export const insertEmployeeAllowanceSchema = z.object({
  employeeId: z.number(),
  allowanceId: z.number(),
  customAmount: z.coerce.number().positive().nullable().optional(),
  isActive: z.number().default(1),
});

export const insertOvertimeRecordSchema = z.object({
  employeeId: z.number(),
  month: z.string(),
  hours: z.coerce.number().positive("Hours must be greater than 0"),
  rate: z.coerce.number().positive("Rate must be greater than 0"),
  totalAmount: z.coerce.number().positive(),
  notes: z.string().nullable().optional(),
});

export const insertSalaryBreakdownSchema = z.object({
  salaryPaymentId: z.number(),
  componentType: z.enum(["base", "allowance", "overtime", "deduction"]),
  componentName: z.string(),
  amount: z.coerce.number(),
  calculationDetails: z.string().nullable().optional(),
});

export const insertLocationLogSchema = z.object({
  employeeId: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().nullable().optional(),
  timestamp: z.date(),
  purpose: z.string().nullable().optional(),
});

export const insertActivityLogSchema = z.object({
  userId: z.string(),
  username: z.string(),
  role: z.string(),
  action: z.enum(["LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "PROCESS", "GENERATE", "EXPORT", "VIEW"]),
  entity: z.string(),
  entityId: z.string().nullable().optional(),
  details: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type SalaryPayment = typeof salaryPayments.$inferSelect;
export type InsertSalaryPayment = z.infer<typeof insertSalaryPaymentSchema>;
export type Deduction = typeof deductions.$inferSelect;
export type InsertDeduction = z.infer<typeof insertDeductionSchema>;
export type Allowance = typeof allowances.$inferSelect;
export type InsertAllowance = z.infer<typeof insertAllowanceSchema>;
export type EmployeeDeduction = typeof employeeDeductions.$inferSelect;
export type InsertEmployeeDeduction = z.infer<typeof insertEmployeeDeductionSchema>;
export type EmployeeAllowance = typeof employeeAllowances.$inferSelect;
export type InsertEmployeeAllowance = z.infer<typeof insertEmployeeAllowanceSchema>;
export type OvertimeRecord = typeof overtimeRecords.$inferSelect;
export type InsertOvertimeRecord = z.infer<typeof insertOvertimeRecordSchema>;
export type SalaryBreakdown = typeof salaryBreakdown.$inferSelect;
export type InsertSalaryBreakdown = z.infer<typeof insertSalaryBreakdownSchema>;
export type LocationLog = typeof locationLogs.$inferSelect;
export type InsertLocationLog = z.infer<typeof insertLocationLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
