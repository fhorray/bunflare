/**
 * TESTING THE NEW OFFICIAL BUNFLARE DRIZZLE ADAPTER
 */
import { drizzle } from "bunflare/drizzle";
import * as schema from "./schema";

// No more boilerplate! The adapter handles everything.
export const db = drizzle({ schema });
