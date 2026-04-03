import { defineHandler } from "buncf/router";

export const GET = defineHandler(async (req) => {
  return Response.json({ message: "Hello, world!", method: "GET" });
});

export const PUT = defineHandler(async (req) => {
  return Response.json({ message: "Hello, world!", method: "PUT" });
});
