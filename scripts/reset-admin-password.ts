import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

async function resetAdminPassword() {
  try {
    const newPassword = "admin123";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, "admin"))
      .returning();

    if (result.length > 0) {
      console.log("\n✅ Admin password has been reset!");
      console.log("\nLogin credentials:");
      console.log("  Username: admin");
      console.log("  Password: admin123");
      console.log("\n⚠️  IMPORTANT: Change this password after logging in!\n");
    } else {
      console.log("\n❌ Admin user not found in database\n");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error resetting password:", error);
    process.exit(1);
  }
}

resetAdminPassword();
