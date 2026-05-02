import { Hono } from "hono";
import { db } from "./database";
import { users } from "./schema";
import { eq } from "drizzle-orm";

const app = new Hono();

app.get("/", async (c) => {
  return c.json({
    message: "Bunflare Universal SQL Test + Drizzle",
    endpoints: ["/init", "/add?name=Vitor", "/list", "/delete/:id"]
  });
});

app.get("/init", async (c) => {
  try {
    // Usando Bun.sql puro para o init (mais rápido)
    await Bun.sql`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`;
    return c.text("Table created!");
  } catch (err: any) {
    return c.text("Error: " + err.message, 500);
  }
});

app.get("/add", async (c) => {
  const name = c.req.query("name") || "Guest";
  try {
    // Usando DRIZZLE para inserir!
    await db.insert(users).values({ name });
    return c.text(`User ${name} added via Drizzle!`);
  } catch (err: any) {
    return c.text("Error: " + err.message, 500);
  }
});

app.get("/list", async (c) => {
  try {
    // Usando DRIZZLE para buscar!
    const allUsers = await db.select().from(users);
    return c.json(allUsers);
  } catch (err: any) {
    return c.text("Error: " + err.message, 500);
  }
});

app.get("/delete/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  try {
    await db.delete(users).where(eq(users.id, id));
    return c.text(`User ${id} deleted via Drizzle!`);
  } catch (err: any) {
    return c.text("Error: " + err.message, 500);
  }
});

export default Bun.serve({
  fetch: app.fetch,
  development: true
});
