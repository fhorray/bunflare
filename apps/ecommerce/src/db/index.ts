import { drizzle } from 'drizzle-orm/d1';
import { d1 } from 'bunflare';
import * as schema from './schema';

export function getDb(env: any) {
  // Use the new d1() helper for automatic identification
  return drizzle(d1("DB"), { schema });
}
