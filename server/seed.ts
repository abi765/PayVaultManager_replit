import { db } from "./db";
import { users } from "@shared/schema";
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
