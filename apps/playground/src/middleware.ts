import type { MiddlewareConfig } from "buncf/router";

export default [
  {
    name: 'logger',
    matcher: '/*',
    handler: async (req, next) => {
      const start = Date.now();
      const response = await next();
      const duration = Date.now() - start;
      console.log(`[buncf] ${req.method} ${new URL(req.url).pathname} - ${response.status} (${duration}ms)`);
      return response;
    },
  },
] satisfies MiddlewareConfig;
