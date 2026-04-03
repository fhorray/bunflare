import { defineHandler } from "buncf/router";
import { getCloudflareContext } from "buncf/runtime";

export const GET = defineHandler(async (req) => {
  const { env } = getCloudflareContext();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)").run();
  const users = (await env.DB.prepare("SELECT * FROM users").all()).results;
  return Response.json({ message: "Data from D1", users });
});

export const POST = defineHandler(async (req) => {
  const { env } = getCloudflareContext();
  const body = (await req.json()) as { name?: string };
  const name = body.name || `User ${new Date().toISOString()}`;
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)").run();
  await env.DB.prepare("INSERT INTO users (name) VALUES (?)").bind(name).run();
  return Response.json({ message: "User inserted successfully" });
});
