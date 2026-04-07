import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  image: text("image"),
  stock: integer("stock").notNull().default(0),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(), // We'll use UUIDs or short IDs for orders
  userId: text("user_id").notNull(),
  totalAmount: real("total_amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, shipped, delivered, cancelled
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceAtTime: real("price_at_time").notNull(), // Snapshot of price when ordered
});

// A simple tracking table for our background tasks / worker interactions
export const analytics = sqliteTable("analytics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  event: text("event").notNull(),
  data: text("data"), // JSON string
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});
