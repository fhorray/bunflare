import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use HYPERDRIVE binding if available (Cloudflare/Bunflare), otherwise fallback to DATABASE_URL (.env/Local)
const connectionString = process.env.HYPERDRIVE || process.env.DATABASE_URL!;

// For Workers/Hyperdrive, we use a single connection or a small pool
const client = postgres(connectionString, { 
  max: 1,
  onnotice: () => {} 
});

export const db = drizzle(client, { schema });
