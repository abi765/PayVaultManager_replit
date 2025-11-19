import { db } from "./db";
import { users, allowances, deductions } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function seedTestUser() {
  try {
    const existingUser = await db.select().from(users).where(eq(users.username, "admin")).limit(1);

    if (existingUser.length === 0) {
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash("admin123", 10);

      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        email: "admin@payvault.com",
        role: "admin",
      });
      console.log("✅ Test user created: admin / admin123");
      console.log("⚠️  IMPORTANT: Change the default password after first login!");
    } else {
      console.log("✅ Test user already exists");
    }
  } catch (error) {
    console.error("Error seeding test user:", error);
  }
}

export async function seedDefaultAllowances() {
  try {
    const existingAllowances = await db.select().from(allowances);

    if (existingAllowances.length === 0) {
      const defaultAllowances = [
        {
          name: "Medical Allowance",
          type: "bonus",
          amount: 5000,
          percentage: null,
          description: "Monthly medical and health insurance allowance",
          isActive: 1,
        },
        {
          name: "Transport Allowance",
          type: "travel",
          amount: 3000,
          percentage: null,
          description: "Daily commute and travel expenses",
          isActive: 1,
        },
        {
          name: "Housing Allowance",
          type: "housing",
          amount: null,
          percentage: 20,
          description: "Housing benefit - 20% of base salary",
          isActive: 1,
        },
        {
          name: "Meal Allowance",
          type: "meal",
          amount: 2000,
          percentage: null,
          description: "Daily meal and refreshment allowance",
          isActive: 1,
        },
        {
          name: "Performance Bonus",
          type: "bonus",
          amount: null,
          percentage: 10,
          description: "Monthly performance incentive - 10% of base salary",
          isActive: 1,
        },
        {
          name: "Internet Allowance",
          type: "other",
          amount: 1500,
          percentage: null,
          description: "Home internet and connectivity allowance",
          isActive: 1,
        },
        {
          name: "Education Allowance",
          type: "other",
          amount: 4000,
          percentage: null,
          description: "Professional development and training allowance",
          isActive: 1,
        },
      ];

      await db.insert(allowances).values(defaultAllowances);
      console.log("✅ Default allowances created");
    } else {
      console.log("✅ Allowances already exist");
    }
  } catch (error) {
    console.error("Error seeding default allowances:", error);
  }
}

export async function seedDefaultDeductions() {
  try {
    const existingDeductions = await db.select().from(deductions);

    if (existingDeductions.length === 0) {
      const defaultDeductions = [
        {
          name: "Income Tax",
          type: "tax",
          amount: null,
          percentage: 5,
          isActive: 1,
        },
        {
          name: "Provident Fund",
          type: "insurance",
          amount: null,
          percentage: 8,
          isActive: 1,
        },
        {
          name: "Health Insurance",
          type: "insurance",
          amount: 2500,
          percentage: null,
          isActive: 1,
        },
        {
          name: "Social Security",
          type: "tax",
          amount: null,
          percentage: 2,
          isActive: 1,
        },
        {
          name: "Loan Repayment",
          type: "loan",
          amount: 5000,
          percentage: null,
          isActive: 1,
        },
        {
          name: "Advance Recovery",
          type: "advance",
          amount: 3000,
          percentage: null,
          isActive: 1,
        },
        {
          name: "Late Arrival Penalty",
          type: "other",
          amount: 500,
          percentage: null,
          isActive: 1,
        },
      ];

      await db.insert(deductions).values(defaultDeductions);
      console.log("✅ Default deductions created");
    } else {
      console.log("✅ Deductions already exist");
    }
  } catch (error) {
    console.error("Error seeding default deductions:", error);
  }
}
