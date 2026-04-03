import { defineHandler } from "buncf/router";
import { getCloudflareContext } from "buncf/runtime";

export const POST = defineHandler(async (req) => {
  const { env } = getCloudflareContext();
  const body = (await req.json()) as { id?: number };
  const id = body.id;
  if (!id) return Response.json({ error: "Missing ID" }, { status: 400 });
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)").run();
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  return Response.json({ message: "User deleted successfully" });
});
