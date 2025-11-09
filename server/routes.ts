import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./auth";
import { insertEmployeeSchema, insertSalaryPaymentSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ userId: user.id, username: user.username, role: user.role });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    res.json({ user: req.user });
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

  app.post("/api/employees", requireAuth, async (req, res) => {
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

  app.put("/api/employees/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/employees/:id", requireAuth, async (req, res) => {
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

  app.post("/api/salary/generate", requireAuth, async (req, res) => {
    try {
      const { month } = req.body;
      if (!month) {
        return res.status(400).json({ message: "Month is required (format: YYYY-MM)" });
      }

      const { employees: activeEmployees } = await storage.getEmployees({ limit: 1000 });
      const activeOnly = activeEmployees.filter(emp => emp.status === "active");

      const created = [];
      for (const employee of activeOnly) {
        const payment = await storage.createSalaryPayment({
          employeeId: employee.id,
          amount: employee.salary,
          month,
          status: "pending",
          paymentDate: null,
          paymentMethod: null,
          notes: null,
        });
        created.push(payment);
      }

      res.status(201).json({ 
        message: `Generated ${created.length} salary records for ${month}`,
        count: created.length,
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

  app.put("/api/salary/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertSalaryPaymentSchema.partial().safeParse(req.body);
      
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

  app.get("/api/salary/employee/:id", requireAuth, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const payments = await storage.getSalaryPaymentsByEmployee(employeeId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
