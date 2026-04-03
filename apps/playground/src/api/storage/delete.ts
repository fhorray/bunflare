import { defineHandler } from "buncf/router";
import { getCloudflareContext } from "buncf/runtime";

export const POST = defineHandler(async (req) => {
  const { env } = getCloudflareContext();
  const { key } = (await req.json()) as { key: string };
  if (!key) return Response.json({ error: "Missing key" }, { status: 400 });

  await env.BUCKET.delete(key);
  return Response.json({ message: "Deleted successfully" });
});
