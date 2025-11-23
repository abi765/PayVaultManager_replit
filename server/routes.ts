import type { Express, Request } from "express";
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

// Helper function to log user activities
async function logActivity(
  req: Request,
  action: "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE" | "PROCESS" | "GENERATE" | "EXPORT" | "VIEW",
  entity: string,
  entityId?: string,
  details?: object
) {
  try {
    const user = req.user;
    if (!user) return;

    await storage.createActivityLog({
      userId: user.id,
      username: user.username,
      role: user.role,
      action,
      entity,
      entityId: entityId || null,
      details: details ? JSON.stringify(details) : null,
      ipAddress: req.ip || req.socket.remoteAddress || null,
      userAgent: req.headers["user-agent"] || null,
    });
  } catch (error) {
    console.error("[AUDIT] Failed to log activity:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Log login activity
      await storage.createActivityLog({
        userId: user.id,
        username: user.username,
        role: user.role,
        action: "LOGIN",
        entity: "user",
        entityId: user.id,
        details: null,
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.headers["user-agent"] || null,
      });

      res.json({ userId: user.id, username: user.username, role: user.role });
    } catch (error: any) {
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

      await logActivity(req, "CREATE", "user", user.id, { username: user.username, role: user.role });

      res.status(201).json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const id = req.params.id;
      const user = await storage.getUser(id);
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      await logActivity(req, "DELETE", "user", id, { username: user?.username });

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

      await logActivity(req, "CREATE", "employee", employee.id.toString(), {
        employeeId: employee.employeeId,
        name: employee.fullName
      });

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

      await logActivity(req, "UPDATE", "employee", id.toString(), {
        employeeId: employee?.employeeId,
        name: employee?.fullName,
        changes: Object.keys(validation.data)
      });

      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/employees/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployeeById(id);

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Delete related records first (cascade delete)
      // Get and delete employee deductions
      const empDeductions = await storage.getEmployeeDeductions(id);
      for (const ded of empDeductions) {
        await storage.deleteEmployeeDeduction(ded.id);
      }

      // Get and delete employee allowances
      const empAllowances = await storage.getEmployeeAllowances(id);
      for (const allow of empAllowances) {
        await storage.deleteEmployeeAllowance(allow.id);
      }

      // Get and delete overtime records
      const overtimeRecords = await storage.getOvertimeRecords({ employeeId: id });
      for (const ot of overtimeRecords) {
        await storage.deleteOvertimeRecord(ot.id);
      }

      // Get and delete salary payments (this also deletes breakdown)
      const { payments } = await storage.getSalaryPayments({ employeeId: id });
      for (const payment of payments) {
        await storage.deleteSalaryPayment(payment.id);
      }

      // Now delete the employee
      const deleted = await storage.deleteEmployee(id);

      if (!deleted) {
        return res.status(404).json({ message: "Failed to delete employee" });
      }

      await logActivity(req, "DELETE", "employee", id.toString(), {
        employeeId: employee.employeeId,
        name: employee.fullName
      });

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

      await logActivity(req, "GENERATE", "salary", null, {
        month,
        count: created.length,
        skipped: skipped.length
      });

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

      // Log as PROCESS if marking as paid, otherwise UPDATE
      const action = validation.data.status === "paid" ? "PROCESS" : "UPDATE";
      await logActivity(req, action, "salary", id.toString(), {
        status: payment.status,
        amount: payment.amount,
        month: payment.month
      });

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

      await logActivity(req, "DELETE", "salary", id.toString());

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

      await logActivity(req, "DELETE", "deduction", id.toString());

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

      await logActivity(req, "DELETE", "allowance", id.toString());

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

      await logActivity(req, "DELETE", "department", id.toString());

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

      await logActivity(req, "DELETE", "overtime", id.toString());

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

  // Activity Logs routes (Admin only)
  app.get("/api/activity-logs", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const userId = req.query.userId as string | undefined;
      const action = req.query.action as string | undefined;
      const entity = req.query.entity as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const search = req.query.search as string | undefined;

      const result = await storage.getActivityLogs({
        limit,
        offset,
        userId,
        action,
        entity,
        startDate,
        endDate,
        search,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/activity-logs/export", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const action = req.query.action as string | undefined;
      const entity = req.query.entity as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const result = await storage.getActivityLogs({
        limit: 10000,
        offset: 0,
        userId,
        action,
        entity,
        startDate,
        endDate,
      });

      // Generate CSV
      const headers = ["Timestamp", "User", "Role", "Action", "Entity", "Entity ID", "Details", "IP Address"];
      const csvRows = [headers.join(",")];

      for (const log of result.logs) {
        const row = [
          log.timestamp ? new Date(log.timestamp).toISOString() : "",
          log.username,
          log.role,
          log.action,
          log.entity,
          log.entityId || "",
          `"${(log.details || "").replace(/"/g, '""')}"`,
          log.ipAddress || "",
        ];
        csvRows.push(row.join(","));
      }

      const csv = csvRows.join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=activity-logs-${new Date().toISOString().split("T")[0]}.csv`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
