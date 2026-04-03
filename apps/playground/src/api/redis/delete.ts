import { defineHandler } from "buncf/router";
import { getCloudflareContext } from "buncf/runtime";

export const POST = defineHandler(async (req) => {
  const { env } = getCloudflareContext();
  await env.REDIS.delete("playground_count");
  return Response.json({ count: 0 });
});
