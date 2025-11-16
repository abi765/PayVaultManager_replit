import "dotenv/config";
import { db, pool } from "../server/db";
import { salaryPayments, salaryBreakdown } from "@shared/schema";

async function clearSalaryPayments() {
  try {
    console.log("🗑️  Clearing all salary payments and breakdowns...\n");

    // Delete all salary breakdown records first (foreign key constraint)
    const breakdownResult = await db.delete(salaryBreakdown);
    console.log(`✅ Deleted all salary breakdown records`);

    // Delete all salary payments
    const paymentsResult = await db.delete(salaryPayments);
    console.log(`✅ Deleted all salary payment records`);

    console.log("\n✨ All salary payments and breakdowns have been cleared!");
    console.log("📝 You can now regenerate salary payments with the updated breakdown feature.\n");

  } catch (error: any) {
    console.error("❌ Error clearing salary payments:", error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

clearSalaryPayments();
