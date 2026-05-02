import { drizzle } from "bunflare/drizzle";
import * as schema from "./schema";

// Universal Bunflare Drizzle Adapter
// - Local: Uses Bun.sql (native SQLite)
// - Production: Uses Bun.sql (mapped to Hyperdrive/D1 binding)
export const db = drizzle({ 
  schema 
});
