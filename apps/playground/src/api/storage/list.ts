import { defineHandler } from "buncf/router";
import { getCloudflareContext } from "buncf/runtime";

export const GET = defineHandler(async (req) => {
  try {
    const { env } = getCloudflareContext();
    const url = new URL(req.url);
    const prefix = url.searchParams.get("prefix") || "";
    const delimiter = url.searchParams.get("delimiter") || "/";

    const list = await env.BUCKET.list({ prefix, delimiter });

    return Response.json({
      objects: (list.objects || []).map((o: any) => ({
        key: o.key,
        size: o.size,
        uploaded: o.uploaded,
        etag: o.etag,
        contentType: "application/octet-stream"
      })),
      prefixes: list.delimitedPrefixes || []
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});
