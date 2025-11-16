import { db } from "../server/db";
import { users } from "../shared/schema";
import dotenv from "dotenv";

dotenv.config();

async function listUsers() {
  try {
    const allUsers = await db.select({
      username: users.username,
      email: users.email,
      role: users.role,
    }).from(users);

    console.log("\n📋 All Users in Database:\n");
    console.log("| Username | Email | Role |");
    console.log("|----------|-------|------|");

    allUsers.forEach(user => {
      console.log(`| ${user.username} | ${user.email || 'N/A'} | ${user.role} |`);
    });

    console.log(`\n✅ Total users: ${allUsers.length}\n`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

listUsers();
