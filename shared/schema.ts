import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp } from "drizzle-orm/pg-core";
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
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

const baseEmployeeSchema = createInsertSchema(employees);

export const insertEmployeeSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  bankAccountNumber: z.string().min(8, "Account number must be at least 8 digits").regex(/^\d+$/, "Only digits allowed"),
  bankName: z.string().min(1, "Bank name is required"),
  salary: z.coerce.number().positive("Salary must be greater than 0"),
  iban: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  bankBranch: z.string().nullable().optional(),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type SalaryPayment = typeof salaryPayments.$inferSelect;
export type InsertSalaryPayment = z.infer<typeof insertSalaryPaymentSchema>;
