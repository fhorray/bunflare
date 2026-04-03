import { defineHandler } from "buncf/router";
import { getCloudflareContext } from "buncf/runtime";

export const POST = defineHandler(async (req) => {
  try {
    const { env } = getCloudflareContext();
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return Response.json({ error: "No file uploaded" }, { status: 400 });

    await env.BUCKET.put(file.name, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type }
    });

    return Response.json({ message: "Upload successful", key: file.name });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});
