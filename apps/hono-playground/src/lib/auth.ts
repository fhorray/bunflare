import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../database/client";
import * as schema from "../database/schema/auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: "http://localhost:3000/",
  emailAndPassword: { enabled: true },
});
