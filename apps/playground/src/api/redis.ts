import { defineHandler } from "buncf/router";
import { getCloudflareContext } from "buncf/runtime";

export const GET = defineHandler(async (req) => {
  const { env } = getCloudflareContext();
  const count = await env.REDIS.get("playground_count");
  return Response.json({ count: parseInt(count ?? "0") });
});

export const POST = defineHandler(async (req) => {
  const { env } = getCloudflareContext();
  const current = await env.REDIS.get("playground_count");
  const next = (parseInt(current ?? "0") + 1).toString();
  await env.REDIS.put("playground_count", next);
  return Response.json({ count: parseInt(next) });
});
