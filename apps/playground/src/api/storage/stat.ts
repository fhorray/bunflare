import { defineHandler } from "buncf/router";
import { getCloudflareContext } from "buncf/runtime";

export const GET = defineHandler(async (req) => {
  const { env } = getCloudflareContext();
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) return Response.json({ error: "Missing key" }, { status: 400 });

  try {
    const stat = await env.BUCKET.head(key);
    if (!stat) throw new Error("File not found");
    return Response.json(stat);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 404 });
  }
});
