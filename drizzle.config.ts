import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Append sslmode to DATABASE_URL if not present
const dbUrl = process.env.DATABASE_URL.includes('sslmode=')
  ? process.env.DATABASE_URL
  : `${process.env.DATABASE_URL}?sslmode=require`;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
