import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, requireRole } from "./auth";
import bcrypt from "bcrypt";
import {
  insertUserSchema,
  insertEmployeeSchema,
  insertSalaryPaymentSchema,
  insertDeductionSchema,
  insertAllowanceSchema,
  insertEmployeeDeductionSchema,
  insertEmployeeAllowanceSchema,
  insertOvertimeRecordSchema,
  insertLocationLogSchema,
  insertDepartmentSchema,
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      console.log(`[LOGIN] Attempt for username: "${username}"`);

      if (!username || !password) {
        console.log(`[LOGIN] Missing credentials - username: ${!!username}, password: ${!!password}`);
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user) {
        console.log(`[LOGIN] User not found: "${username}"`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log(`[LOGIN] User found: "${username}" (${user.id}), role: ${user.role}`);

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        console.log(`[LOGIN] Password mismatch for user: "${username}"`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log(`[LOGIN] Success for user: "${username}"`);
      res.json({ userId: user.id, username: user.username, role: user.role });
    } catch (error: any) {
      console.log(`[LOGIN] Error:`, error.message);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    res.json({ user: req.user });
  });

  app.get("/api/users", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      const existingUser = await storage.getUserByUsername(validation.data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(validation.data.password, 10);
      const user = await storage.createUser({
        ...validation.data,
        password: hashedPassword,
      });
      res.status(201).json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const success = await storage.updateUserPassword(user.id, hashedPassword);

      if (!success) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const search = req.query.search as string | undefined;

      const result = await storage.getEmployees({ limit, offset, search });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/check-duplicate", requireAuth, async (req, res) => {
    try {
      const bankAccountNumber = req.query.bankAccountNumber as string;
      if (!bankAccountNumber) {
        return res.status(400).json({ message: "Bank account number is required" });
      }

      const existing = await storage.getEmployeeByBankAccount(bankAccountNumber);
      res.json({ exists: !!existing, employee: existing });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployeeById(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/employees", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const validation = insertEmployeeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      const existingByEmployeeId = await storage.getEmployeeByEmployeeId(validation.data.employeeId);
      if (existingByEmployeeId) {
        return res.status(400).json({ message: "Employee ID already exists" });
      }

      const existingByBankAccount = await storage.getEmployeeByBankAccount(validation.data.bankAccountNumber);
      if (existingByBankAccount) {
        return res.status(400).json({ message: "Bank account number already exists" });
      }

      const employee = await storage.createEmployee(validation.data);
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/employees/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertEmployeeSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      const existing = await storage.getEmployeeById(id);
      if (!existing) {
        return res.status(404).json({ message: "Employee not found" });
      }

      if (validation.data.employeeId && validation.data.employeeId !== existing.employeeId) {
        const existingByEmployeeId = await storage.getEmployeeByEmployeeId(validation.data.employeeId);
        if (existingByEmployeeId) {
          return res.status(400).json({ message: "Employee ID already exists" });
        }
      }

      if (validation.data.bankAccountNumber && validation.data.bankAccountNumber !== existing.bankAccountNumber) {
        const existingByBankAccount = await storage.getEmployeeByBankAccount(validation.data.bankAccountNumber);
        if (existingByBankAccount) {
          return res.status(400).json({ message: "Bank account number already exists" });
        }
      }

      const employee = await storage.updateEmployee(id, validation.data);
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/employees/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEmployee(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json({ message: "Employee deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/salary/generate", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const { month } = req.body;
      if (!month) {
        return res.status(400).json({ message: "Month is required (format: YYYY-MM)" });
      }

      const { employees: activeEmployees } = await storage.getEmployees({ limit: 1000 });
      const activeOnly = activeEmployees.filter(emp => emp.status === "active");

      const { payments: existingPayments } = await storage.getSalaryPayments({ month });
      const existingEmployeeIds = new Set(existingPayments.map(p => p.employeeId));

      const created = [];
      const skipped = [];
      
      for (const employee of activeOnly) {
        if (existingEmployeeIds.has(employee.id)) {
          skipped.push({ employeeId: employee.id, name: employee.fullName });
          continue;
        }

        const calculation = await storage.calculateSalary(employee.id, month);

        const payment = await storage.createSalaryPayment({
          employeeId: employee.id,
          amount: calculation.netSalary,
          month,
          status: "pending",
          paymentDate: null,
          paymentMethod: null,
          notes: null,
        });

        // Create breakdown records for this payment
        await storage.createSalaryBreakdown({
          salaryPaymentId: payment.id,
          componentType: "base",
          componentName: "Base Salary",
          amount: calculation.baseSalary,
          calculationDetails: null,
        });

        for (const allowance of calculation.allowances) {
          await storage.createSalaryBreakdown({
            salaryPaymentId: payment.id,
            componentType: "allowance",
            componentName: allowance.name,
            amount: allowance.amount,
            calculationDetails: allowance.details,
          });
        }

        if (calculation.overtime) {
          await storage.createSalaryBreakdown({
            salaryPaymentId: payment.id,
            componentType: "overtime",
            componentName: "Overtime Pay",
            amount: calculation.overtime.amount,
            calculationDetails: `${calculation.overtime.hours} hours @ ${calculation.overtime.rate} PKR/hour`,
          });
        }

        for (const deduction of calculation.deductions) {
          await storage.createSalaryBreakdown({
            salaryPaymentId: payment.id,
            componentType: "deduction",
            componentName: deduction.name,
            amount: deduction.amount,
            calculationDetails: deduction.details,
          });
        }

        created.push(payment);
      }

      res.status(201).json({ 
        message: `Generated ${created.length} salary records for ${month}${skipped.length > 0 ? `, skipped ${skipped.length} duplicates` : ''}`,
        count: created.length,
        skipped: skipped.length,
        payments: created,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/salary", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const status = req.query.status as string | undefined;
      const month = req.query.month as string | undefined;
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;

      const result = await storage.getSalaryPayments({ limit, offset, status, month, employeeId });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/salary/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.getSalaryPaymentById(id);
      
      if (!payment) {
        return res.status(404).json({ message: "Salary payment not found" });
      }

      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/salary/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      
      // Convert paymentDate string to Date object if present
      if (data.paymentDate && typeof data.paymentDate === 'string') {
        data.paymentDate = new Date(data.paymentDate);
      }
      
      const validation = insertSalaryPaymentSchema.partial().safeParse(data);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      if (validation.data.status === "paid" && !validation.data.paymentDate) {
        validation.data.paymentDate = new Date();
      }

      const payment = await storage.updateSalaryPayment(id, validation.data);
      
      if (!payment) {
        return res.status(404).json({ message: "Salary payment not found" });
      }

      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/salary/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSalaryPayment(id);

      if (!deleted) {
        return res.status(404).json({ message: "Salary payment not found" });
      }

      res.json({ message: "Salary payment deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/salary/employee/:id", requireAuth, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const payments = await storage.getSalaryPaymentsByEmployee(employeeId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deductions", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const result = await storage.getDeductions({ limit, offset });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/deductions", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const validation = insertDeductionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: fromZodError(validation.error).message });
      }
      const deduction = await storage.createDeduction(validation.data);
      res.status(201).json(deduction);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/deductions/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertDeductionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: fromZodError(validation.error).message });
      }
      const deduction = await storage.updateDeduction(id, validation.data);
      if (!deduction) {
        return res.status(404).json({ message: "Deduction not found" });
      }
      res.json(deduction);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/deductions/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDeduction(id);
      if (!success) {
        return res.status(404).json({ message: "Deduction not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/allowances", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const result = await storage.getAllowances({ limit, offset });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/allowances", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const validation = insertAllowanceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: fromZodError(validation.error).message });
      }
      const allowance = await storage.createAllowance(validation.data);
      res.status(201).json(allowance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/allowances/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertAllowanceSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: fromZodError(validation.error).message });
      }
      const allowance = await storage.updateAllowance(id, validation.data);
      if (!allowance) {
        return res.status(404).json({ message: "Allowance not found" });
      }
      res.json(allowance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/allowances/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAllowance(id);
      if (!success) {
        return res.status(404).json({ message: "Allowance not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Department routes
  app.get("/api/departments", requireAuth, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/departments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const department = await storage.getDepartmentById(id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/departments", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const validation = insertDepartmentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: fromZodError(validation.error).message });
      }
      const department = await storage.createDepartment(validation.data);
      res.status(201).json(department);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/departments/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertDepartmentSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: fromZodError(validation.error).message });
      }
      const department = await storage.updateDepartment(id, validation.data);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/departments/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDepartment(id);
      if (!success) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/:id/deductions", requireAuth, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const deductions = await storage.getEmployeeDeductions(employeeId);
      res.json(deductions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/employees/:id/deductions", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const validation = insertEmployeeDeductionSchema.safeParse({ ...req.body, employeeId });
      if (!validation.success) {
        return res.status(400).json({ message: fromZodError(validation.error).message });
      }
      const employeeDeduction = await storage.createEmployeeDeduction(validation.data);
      res.status(201).json(employeeDeduction);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/employees/:employeeId/deductions/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployeeDeduction(id);
      if (!success) {
        return res.status(404).json({ message: "Employee deduction not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/:id/allowances", requireAuth, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const allowances = await storage.getEmployeeAllowances(employeeId);
      res.json(allowances);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/employees/:id/allowances", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const validation = insertEmployeeAllowanceSchema.safeParse({ ...req.body, employeeId });
      if (!validation.success) {
        return res.status(400).json({ message: fromZodError(validation.error).message });
      }
      const employeeAllowance = await storage.createEmployeeAllowance(validation.data);
      res.status(201).json(employeeAllowance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/employees/:employeeId/allowances/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployeeAllowance(id);
      if (!success) {
        return res.status(404).json({ message: "Employee allowance not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/overtime", requireAuth, async (req, res) => {
    try {
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
      const month = req.query.month as string | undefined;
      const records = await storage.getOvertimeRecords({ employeeId, month });
      res.json({ records });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/overtime", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const validation = insertOvertimeRecordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: fromZodError(validation.error).message });
      }
      const record = await storage.createOvertimeRecord(validation.data);
      res.status(201).json(record);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/overtime/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertOvertimeRecordSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: fromZodError(validation.error).message });
      }
      const record = await storage.updateOvertimeRecord(id, validation.data);
      if (!record) {
        return res.status(404).json({ message: "Overtime record not found" });
      }
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/overtime/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOvertimeRecord(id);
      if (!success) {
        return res.status(404).json({ message: "Overtime record not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/salary/:id/breakdown", requireAuth, async (req, res) => {
    try {
      const salaryPaymentId = parseInt(req.params.id);
      const breakdown = await storage.getSalaryBreakdown(salaryPaymentId);
      res.json(breakdown);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/salary/calculate", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const { employeeId, month } = req.body;
      if (!employeeId || !month) {
        return res.status(400).json({ message: "employeeId and month are required" });
      }
      const calculation = await storage.calculateSalary(employeeId, month);
      res.json(calculation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/location", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const validation = insertLocationLogSchema.safeParse({
        ...req.body,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      });
      if (!validation.success) {
        return res.status(400).json({ message: fromZodError(validation.error).message });
      }
      const log = await storage.createLocationLog(validation.data);
      res.status(201).json(log);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/location", requireAuth, async (req, res) => {
    try {
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getLocationLogs({ employeeId, limit });
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
