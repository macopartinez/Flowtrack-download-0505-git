import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Use PostgreSQL (Supabase) for production
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString, { 
  ssl: 'require',
  max: 10
});

export const db = drizzle(client, { schema });

// Export pool for compatibility
export const pool = client;
