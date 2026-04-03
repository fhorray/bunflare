import { defineHandler } from "buncf/router";

export const GET = defineHandler(async (req) => {
  const name = req.params.name;
  return Response.json({ message: `Hello, ${name}!` });
});
