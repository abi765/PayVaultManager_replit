import { type User, type InsertUser, type Employee, type InsertEmployee, type SalaryPayment, type InsertSalaryPayment } from "@shared/schema";
import { db } from "./db";
import { users, employees, salaryPayments } from "@shared/schema";
import { eq, desc, and, like, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getEmployees(options?: { limit?: number; offset?: number; search?: string }): Promise<{ employees: Employee[]; total: number }>;
  getEmployeeById(id: number): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  getEmployeeByBankAccount(bankAccountNumber: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  
  getSalaryPayments(options?: { limit?: number; offset?: number; status?: string; month?: string; employeeId?: number }): Promise<{ payments: (SalaryPayment & { employee?: Employee })[]; total: number }>;
  getSalaryPaymentById(id: number): Promise<(SalaryPayment & { employee?: Employee }) | undefined>;
  getSalaryPaymentsByEmployee(employeeId: number): Promise<SalaryPayment[]>;
  createSalaryPayment(payment: InsertSalaryPayment): Promise<SalaryPayment>;
  updateSalaryPayment(id: number, payment: Partial<InsertSalaryPayment>): Promise<SalaryPayment | undefined>;
  
  getDashboardStats(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    monthlyPayroll: number;
    pendingPayments: number;
    processedPayments: number;
  }>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getEmployees(options?: { limit?: number; offset?: number; search?: string }): Promise<{ employees: Employee[]; total: number }> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    const search = options?.search;

    if (search) {
      const searchCondition = sql`${employees.fullName} ILIKE ${`%${search}%`} OR ${employees.employeeId} ILIKE ${`%${search}%`}`;
      const [employeeList, countResult] = await Promise.all([
        db.select().from(employees).where(searchCondition).orderBy(desc(employees.createdAt)).limit(limit).offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(employees).where(searchCondition),
      ]);
      return {
        employees: employeeList,
        total: Number(countResult[0]?.count || 0),
      };
    }

    const [employeeList, countResult] = await Promise.all([
      db.select().from(employees).orderBy(desc(employees.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(employees),
    ]);

    return {
      employees: employeeList,
      total: Number(countResult[0]?.count || 0),
    };
  }

  async getEmployeeById(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
    return employee;
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.employeeId, employeeId)).limit(1);
    return employee;
  }

  async getEmployeeByBankAccount(bankAccountNumber: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.bankAccountNumber, bankAccountNumber)).limit(1);
    return employee;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(insertEmployee).returning();
    return employee;
  }

  async updateEmployee(id: number, updateData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [employee] = await db
      .update(employees)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getSalaryPayments(options?: { limit?: number; offset?: number; status?: string; month?: string; employeeId?: number }): Promise<{ payments: (SalaryPayment & { employee?: Employee })[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const conditions = [];
    if (options?.status) {
      conditions.push(eq(salaryPayments.status, options.status));
    }
    if (options?.month) {
      conditions.push(eq(salaryPayments.month, options.month));
    }
    if (options?.employeeId) {
      conditions.push(eq(salaryPayments.employeeId, options.employeeId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [paymentList, countResult] = await Promise.all([
      db
        .select({
          payment: salaryPayments,
          employee: employees,
        })
        .from(salaryPayments)
        .leftJoin(employees, eq(salaryPayments.employeeId, employees.id))
        .where(whereClause)
        .orderBy(desc(salaryPayments.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(salaryPayments)
        .where(whereClause),
    ]);

    const payments = paymentList.map((row) => ({
      ...row.payment,
      employee: row.employee || undefined,
    }));

    return {
      payments,
      total: Number(countResult[0]?.count || 0),
    };
  }

  async getSalaryPaymentById(id: number): Promise<(SalaryPayment & { employee?: Employee }) | undefined> {
    const [row] = await db
      .select({
        payment: salaryPayments,
        employee: employees,
      })
      .from(salaryPayments)
      .leftJoin(employees, eq(salaryPayments.employeeId, employees.id))
      .where(eq(salaryPayments.id, id))
      .limit(1);

    if (!row) return undefined;

    return {
      ...row.payment,
      employee: row.employee || undefined,
    };
  }

  async getSalaryPaymentsByEmployee(employeeId: number): Promise<SalaryPayment[]> {
    return db.select().from(salaryPayments).where(eq(salaryPayments.employeeId, employeeId)).orderBy(desc(salaryPayments.createdAt));
  }

  async createSalaryPayment(insertPayment: InsertSalaryPayment): Promise<SalaryPayment> {
    const [payment] = await db.insert(salaryPayments).values(insertPayment).returning();
    return payment;
  }

  async updateSalaryPayment(id: number, updateData: Partial<InsertSalaryPayment>): Promise<SalaryPayment | undefined> {
    const [payment] = await db
      .update(salaryPayments)
      .set(updateData)
      .where(eq(salaryPayments.id, id))
      .returning();
    return payment;
  }

  async getDashboardStats(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    monthlyPayroll: number;
    pendingPayments: number;
    processedPayments: number;
  }> {
    const [employeeStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where status = 'active')`,
        inactive: sql<number>`count(*) filter (where status = 'inactive' or status = 'on_leave')`,
        payroll: sql<number>`coalesce(sum(salary) filter (where status = 'active'), 0)`,
      })
      .from(employees);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const [paymentStats] = await db
      .select({
        pending: sql<number>`count(*) filter (where status = 'pending' and month = ${currentMonth})`,
        processed: sql<number>`coalesce(sum(amount) filter (where status = 'paid' and month = ${currentMonth}), 0)`,
      })
      .from(salaryPayments);

    return {
      totalEmployees: Number(employeeStats?.total || 0),
      activeEmployees: Number(employeeStats?.active || 0),
      inactiveEmployees: Number(employeeStats?.inactive || 0),
      monthlyPayroll: Number(employeeStats?.payroll || 0),
      pendingPayments: Number(paymentStats?.pending || 0),
      processedPayments: Number(paymentStats?.processed || 0),
    };
  }
}

export const storage = new DbStorage();
