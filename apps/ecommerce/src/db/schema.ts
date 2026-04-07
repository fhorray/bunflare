import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: real('price').notNull(),
  category: text('category').notNull(),
  image: text('image').notNull(),
  stock: integer('stock').notNull().default(0),
  status: text('status').notNull().default('active'), // active, archived
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  userName: text('user_name').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  sentiment: text('sentiment'), // To be filled by AI
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  total: real('total').notNull(),
  status: text('status').notNull().default('pending'), // pending, paid, shipped, delivered, cancelled
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
});

export const configurations = sqliteTable('configurations', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const edgeLogs = sqliteTable('edge_logs', {
  id: text('id').primaryKey(),
  event: text('event').notNull(), // 'order_created', 'stock_locked', 'payment_auth'
  details: text('details').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'), // admin, user
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const orderRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));


// Infer select to get types
export type SelectProduct = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export type SelectReview = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

export type SelectOrder = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export type SelectOrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type SelectSession = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export type SelectConfiguration = typeof configurations.$inferSelect;
export type InsertConfiguration = typeof configurations.$inferInsert;

export type SelectEdgeLog = typeof edgeLogs.$inferSelect;
export type InsertEdgeLog = typeof edgeLogs.$inferInsert;