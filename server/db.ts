import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Use PostgreSQL (Supabase) for production
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Please create a .env file with your Supabase connection string.\n" +
    "Example: DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres"
  );
}

console.log("�️  Connecting to PostgreSQL (Supabase)...");

const client = postgres(connectionString, { 
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(client, { schema });

// Export pool for compatibility
export const pool = client;
