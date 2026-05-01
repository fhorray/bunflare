const server = Bun.serve({ fetch: () => new Response("OK") });
export default server;
