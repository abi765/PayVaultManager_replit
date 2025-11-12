import { 
  type User, type InsertUser, 
  type Employee, type InsertEmployee, 
  type SalaryPayment, type InsertSalaryPayment,
  type Deduction, type InsertDeduction,
  type Allowance, type InsertAllowance,
  type EmployeeDeduction, type InsertEmployeeDeduction,
  type EmployeeAllowance, type InsertEmployeeAllowance,
  type OvertimeRecord, type InsertOvertimeRecord,
  type SalaryBreakdown, type InsertSalaryBreakdown,
  type LocationLog, type InsertLocationLog
} from "@shared/schema";
import { db } from "./db";
import { 
  users, employees, salaryPayments, 
  deductions, allowances, employeeDeductions, employeeAllowances,
  overtimeRecords, salaryBreakdown, locationLogs
} from "@shared/schema";
import { eq, desc, and, like, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<boolean>;
  getUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;
  
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
  
  getDeductions(options?: { limit?: number; offset?: number }): Promise<{ deductions: Deduction[]; total: number }>;
  getDeductionById(id: number): Promise<Deduction | undefined>;
  createDeduction(deduction: InsertDeduction): Promise<Deduction>;
  updateDeduction(id: number, deduction: Partial<InsertDeduction>): Promise<Deduction | undefined>;
  deleteDeduction(id: number): Promise<boolean>;
  
  getAllowances(options?: { limit?: number; offset?: number }): Promise<{ allowances: Allowance[]; total: number }>;
  getAllowanceById(id: number): Promise<Allowance | undefined>;
  createAllowance(allowance: InsertAllowance): Promise<Allowance>;
  updateAllowance(id: number, allowance: Partial<InsertAllowance>): Promise<Allowance | undefined>;
  deleteAllowance(id: number): Promise<boolean>;
  
  getEmployeeDeductions(employeeId: number): Promise<(EmployeeDeduction & { deduction?: Deduction })[]>;
  createEmployeeDeduction(employeeDeduction: InsertEmployeeDeduction): Promise<EmployeeDeduction>;
  updateEmployeeDeduction(id: number, employeeDeduction: Partial<InsertEmployeeDeduction>): Promise<EmployeeDeduction | undefined>;
  deleteEmployeeDeduction(id: number): Promise<boolean>;
  
  getEmployeeAllowances(employeeId: number): Promise<(EmployeeAllowance & { allowance?: Allowance })[]>;
  createEmployeeAllowance(employeeAllowance: InsertEmployeeAllowance): Promise<EmployeeAllowance>;
  updateEmployeeAllowance(id: number, employeeAllowance: Partial<InsertEmployeeAllowance>): Promise<EmployeeAllowance | undefined>;
  deleteEmployeeAllowance(id: number): Promise<boolean>;
  
  getOvertimeRecords(options?: { employeeId?: number; month?: string }): Promise<OvertimeRecord[]>;
  getOvertimeRecordById(id: number): Promise<OvertimeRecord | undefined>;
  createOvertimeRecord(overtimeRecord: InsertOvertimeRecord): Promise<OvertimeRecord>;
  updateOvertimeRecord(id: number, overtimeRecord: Partial<InsertOvertimeRecord>): Promise<OvertimeRecord | undefined>;
  deleteOvertimeRecord(id: number): Promise<boolean>;
  
  getSalaryBreakdown(salaryPaymentId: number): Promise<SalaryBreakdown[]>;
  createSalaryBreakdown(breakdown: InsertSalaryBreakdown): Promise<SalaryBreakdown>;
  
  createLocationLog(locationLog: Omit<InsertLocationLog, 'timestamp'> & { timestamp?: Date }): Promise<LocationLog>;
  getLocationLogs(options?: { employeeId?: number; limit?: number }): Promise<LocationLog[]>;
  
  calculateSalary(employeeId: number, month: string): Promise<{
    baseSalary: number;
    allowances: { name: string; amount: number; details: string }[];
    overtime: { hours: number; rate: number; amount: number } | null;
    deductions: { name: string; amount: number; details: string }[];
    totalAllowances: number;
    totalDeductions: number;
    netSalary: number;
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

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
    return result.rowCount !== null && result.rowCount > 0;
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

  async getDeductions(options?: { limit?: number; offset?: number }): Promise<{ deductions: Deduction[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [deductionList, countResult] = await Promise.all([
      db.select().from(deductions).orderBy(desc(deductions.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(deductions),
    ]);

    return {
      deductions: deductionList,
      total: Number(countResult[0]?.count || 0),
    };
  }

  async getDeductionById(id: number): Promise<Deduction | undefined> {
    const [deduction] = await db.select().from(deductions).where(eq(deductions.id, id)).limit(1);
    return deduction;
  }

  async createDeduction(insertDeduction: InsertDeduction): Promise<Deduction> {
    const [deduction] = await db.insert(deductions).values(insertDeduction).returning();
    return deduction;
  }

  async updateDeduction(id: number, updateData: Partial<InsertDeduction>): Promise<Deduction | undefined> {
    const [deduction] = await db.update(deductions).set(updateData).where(eq(deductions.id, id)).returning();
    return deduction;
  }

  async deleteDeduction(id: number): Promise<boolean> {
    const result = await db.delete(deductions).where(eq(deductions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getAllowances(options?: { limit?: number; offset?: number }): Promise<{ allowances: Allowance[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [allowanceList, countResult] = await Promise.all([
      db.select().from(allowances).orderBy(desc(allowances.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(allowances),
    ]);

    return {
      allowances: allowanceList,
      total: Number(countResult[0]?.count || 0),
    };
  }

  async getAllowanceById(id: number): Promise<Allowance | undefined> {
    const [allowance] = await db.select().from(allowances).where(eq(allowances.id, id)).limit(1);
    return allowance;
  }

  async createAllowance(insertAllowance: InsertAllowance): Promise<Allowance> {
    const [allowance] = await db.insert(allowances).values(insertAllowance).returning();
    return allowance;
  }

  async updateAllowance(id: number, updateData: Partial<InsertAllowance>): Promise<Allowance | undefined> {
    const [allowance] = await db.update(allowances).set(updateData).where(eq(allowances.id, id)).returning();
    return allowance;
  }

  async deleteAllowance(id: number): Promise<boolean> {
    const result = await db.delete(allowances).where(eq(allowances.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getEmployeeDeductions(employeeId: number): Promise<(EmployeeDeduction & { deduction?: Deduction })[]> {
    const rows = await db
      .select({
        employeeDeduction: employeeDeductions,
        deduction: deductions,
      })
      .from(employeeDeductions)
      .leftJoin(deductions, eq(employeeDeductions.deductionId, deductions.id))
      .where(and(eq(employeeDeductions.employeeId, employeeId), eq(employeeDeductions.isActive, 1)));

    return rows.map((row) => ({
      ...row.employeeDeduction,
      deduction: row.deduction || undefined,
    }));
  }

  async createEmployeeDeduction(insertEmployeeDeduction: InsertEmployeeDeduction): Promise<EmployeeDeduction> {
    const [employeeDeduction] = await db.insert(employeeDeductions).values(insertEmployeeDeduction).returning();
    return employeeDeduction;
  }

  async updateEmployeeDeduction(id: number, updateData: Partial<InsertEmployeeDeduction>): Promise<EmployeeDeduction | undefined> {
    const [employeeDeduction] = await db.update(employeeDeductions).set(updateData).where(eq(employeeDeductions.id, id)).returning();
    return employeeDeduction;
  }

  async deleteEmployeeDeduction(id: number): Promise<boolean> {
    const result = await db.delete(employeeDeductions).where(eq(employeeDeductions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getEmployeeAllowances(employeeId: number): Promise<(EmployeeAllowance & { allowance?: Allowance })[]> {
    const rows = await db
      .select({
        employeeAllowance: employeeAllowances,
        allowance: allowances,
      })
      .from(employeeAllowances)
      .leftJoin(allowances, eq(employeeAllowances.allowanceId, allowances.id))
      .where(and(eq(employeeAllowances.employeeId, employeeId), eq(employeeAllowances.isActive, 1)));

    return rows.map((row) => ({
      ...row.employeeAllowance,
      allowance: row.allowance || undefined,
    }));
  }

  async createEmployeeAllowance(insertEmployeeAllowance: InsertEmployeeAllowance): Promise<EmployeeAllowance> {
    const [employeeAllowance] = await db.insert(employeeAllowances).values(insertEmployeeAllowance).returning();
    return employeeAllowance;
  }

  async updateEmployeeAllowance(id: number, updateData: Partial<InsertEmployeeAllowance>): Promise<EmployeeAllowance | undefined> {
    const [employeeAllowance] = await db.update(employeeAllowances).set(updateData).where(eq(employeeAllowances.id, id)).returning();
    return employeeAllowance;
  }

  async deleteEmployeeAllowance(id: number): Promise<boolean> {
    const result = await db.delete(employeeAllowances).where(eq(employeeAllowances.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getOvertimeRecords(options?: { employeeId?: number; month?: string }): Promise<OvertimeRecord[]> {
    const conditions = [];
    if (options?.employeeId) {
      conditions.push(eq(overtimeRecords.employeeId, options.employeeId));
    }
    if (options?.month) {
      conditions.push(eq(overtimeRecords.month, options.month));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db.select().from(overtimeRecords).where(whereClause).orderBy(desc(overtimeRecords.createdAt));
  }

  async getOvertimeRecordById(id: number): Promise<OvertimeRecord | undefined> {
    const [record] = await db.select().from(overtimeRecords).where(eq(overtimeRecords.id, id)).limit(1);
    return record;
  }

  async createOvertimeRecord(insertRecord: InsertOvertimeRecord): Promise<OvertimeRecord> {
    const [record] = await db.insert(overtimeRecords).values(insertRecord).returning();
    return record;
  }

  async updateOvertimeRecord(id: number, updateData: Partial<InsertOvertimeRecord>): Promise<OvertimeRecord | undefined> {
    const [record] = await db.update(overtimeRecords).set(updateData).where(eq(overtimeRecords.id, id)).returning();
    return record;
  }

  async deleteOvertimeRecord(id: number): Promise<boolean> {
    const result = await db.delete(overtimeRecords).where(eq(overtimeRecords.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getSalaryBreakdown(salaryPaymentId: number): Promise<SalaryBreakdown[]> {
    return db.select().from(salaryBreakdown).where(eq(salaryBreakdown.salaryPaymentId, salaryPaymentId)).orderBy(salaryBreakdown.componentType);
  }

  async createSalaryBreakdown(insertBreakdown: InsertSalaryBreakdown): Promise<SalaryBreakdown> {
    const [breakdown] = await db.insert(salaryBreakdown).values(insertBreakdown).returning();
    return breakdown;
  }

  async createLocationLog(locationLog: Omit<InsertLocationLog, 'timestamp'> & { timestamp?: Date }): Promise<LocationLog> {
    const [log] = await db.insert(locationLogs).values({
      ...locationLog,
      timestamp: locationLog.timestamp || new Date(),
    }).returning();
    return log;
  }

  async getLocationLogs(options?: { employeeId?: number; limit?: number }): Promise<LocationLog[]> {
    const limit = options?.limit || 50;
    const conditions = [];
    if (options?.employeeId) {
      conditions.push(eq(locationLogs.employeeId, options.employeeId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db.select().from(locationLogs).where(whereClause).orderBy(desc(locationLogs.timestamp)).limit(limit);
  }

  async calculateSalary(employeeId: number, month: string): Promise<{
    baseSalary: number;
    allowances: { name: string; amount: number; details: string }[];
    overtime: { hours: number; rate: number; amount: number } | null;
    deductions: { name: string; amount: number; details: string }[];
    totalAllowances: number;
    totalDeductions: number;
    netSalary: number;
  }> {
    const employee = await this.getEmployeeById(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const baseSalary = employee.salary;

    const employeeAllowancesList = await this.getEmployeeAllowances(employeeId);
    const allowances: { name: string; amount: number; details: string }[] = [];
    
    for (const empAllowance of employeeAllowancesList) {
      if (empAllowance.allowance) {
        let amount = 0;
        let details = "";
        
        if (empAllowance.customAmount) {
          amount = empAllowance.customAmount;
          details = `Custom amount: ${amount}`;
        } else if (empAllowance.allowance.amount) {
          amount = empAllowance.allowance.amount;
          details = `Fixed amount: ${amount}`;
        } else if (empAllowance.allowance.percentage) {
          amount = baseSalary * (empAllowance.allowance.percentage / 100);
          details = `${empAllowance.allowance.percentage}% of base salary (${baseSalary})`;
        }
        
        allowances.push({
          name: empAllowance.allowance.name,
          amount,
          details,
        });
      }
    }

    const overtimeList = await this.getOvertimeRecords({ employeeId, month });
    let overtime: { hours: number; rate: number; amount: number } | null = null;
    
    if (overtimeList.length > 0) {
      const totalHours = overtimeList.reduce((sum, ot) => sum + ot.hours, 0);
      const totalAmount = overtimeList.reduce((sum, ot) => sum + ot.totalAmount, 0);
      const avgRate = totalAmount / totalHours;
      overtime = { hours: totalHours, rate: avgRate, amount: totalAmount };
    }

    const employeeDeductionsList = await this.getEmployeeDeductions(employeeId);
    const deductions: { name: string; amount: number; details: string }[] = [];
    
    for (const empDeduction of employeeDeductionsList) {
      if (empDeduction.deduction) {
        let amount = 0;
        let details = "";
        
        if (empDeduction.customAmount) {
          amount = empDeduction.customAmount;
          details = `Custom amount: ${amount}`;
        } else if (empDeduction.deduction.amount) {
          amount = empDeduction.deduction.amount;
          details = `Fixed amount: ${amount}`;
        } else if (empDeduction.deduction.percentage) {
          amount = baseSalary * (empDeduction.deduction.percentage / 100);
          details = `${empDeduction.deduction.percentage}% of base salary (${baseSalary})`;
        }
        
        deductions.push({
          name: empDeduction.deduction.name,
          amount,
          details,
        });
      }
    }

    const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0) + (overtime?.amount || 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netSalary = baseSalary + totalAllowances - totalDeductions;

    return {
      baseSalary,
      allowances,
      overtime,
      deductions,
      totalAllowances,
      totalDeductions,
      netSalary,
    };
  }
}

export const storage = new DbStorage();
