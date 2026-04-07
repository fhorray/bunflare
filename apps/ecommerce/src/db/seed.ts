import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import { getCloudflareContext } from "bunflare";

export async function seed() {
  const { env } = getCloudflareContext();
  if (!env.DB) throw new Error("DB binding missing");
  
  const db = drizzle(env.DB, { schema });
  
  console.log("🌱 Seeding database...");
  
  // 1. Seed Users
  const users = [
    {
      id: 'user_admin_01',
      username: 'admin',
      password: 'admin123',
      name: 'Super Admin',
      role: 'admin'
    },
    {
      id: 'user_customer_01',
      username: 'customer',
      password: 'user123',
      name: 'John Doe',
      role: 'user'
    }
  ];
  
  for (const user of users) {
    await db.insert(schema.users).values(user).onConflictDoUpdate({
      target: schema.users.username,
      set: user
    });
  }

  // 2. Seed Products
  const products = [
    {
      id: 'headphones-01',
      name: 'Ultra-Light Headphones',
      description: 'Experience the next generation of sound with high-fidelity drivers and active noise cancellation. Perfect for audiophiles and professional mixers.',
      price: 199.99,
      category: 'Audio',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60',
      stock: 50
    },
    {
      id: 'phone-01',
      name: 'Minimalist Smartphone',
      description: 'A distraction-free device with an e-ink display and physical keyboard. Designed for those who value focus and simplicity over surveillance.',
      price: 699.00,
      category: 'Tech',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=60',
      stock: 25
    }
  ];

  for (const product of products) {
    await db.insert(schema.products).values(product).onConflictDoUpdate({
      target: schema.products.id,
      set: product
    });
  }

  console.log("✅ Seeding complete.");
}
