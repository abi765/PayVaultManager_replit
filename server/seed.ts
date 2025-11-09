import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedTestUser() {
  try {
    const existingUser = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
    
    if (existingUser.length === 0) {
      await db.insert(users).values({
        username: "admin",
        password: "admin123",
        email: "admin@payvault.com",
        role: "admin",
      });
      console.log("✅ Test user created: admin / admin123");
    } else {
      console.log("✅ Test user already exists");
    }
  } catch (error) {
    console.error("Error seeding test user:", error);
  }
}
