import { defineHandler } from "buncf/router";
import { getCloudflareContext } from "buncf/runtime";

export const GET = defineHandler(async (req) => {
  const { env } = getCloudflareContext();
  const key = req.params.path;
  if (!key) return new Response("Not Found", { status: 404 });

  const obj = await env.BUCKET.get(key);
  if (!obj) return new Response("File not found", { status: 404 });

  return new Response(await obj.arrayBuffer(), {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${key}"`
    }
  });
});
