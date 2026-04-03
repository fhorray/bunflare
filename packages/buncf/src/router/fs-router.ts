import { join, dirname, relative } from "node:path";
import fs from "node:fs";
import type { RouterConfig, Middleware, MetaDescriptor, PageModule, LayoutModule, ApiModule } from "./types";

export class BuncfFileSystemRouter {
  private config: Required<RouterConfig>;
  private pagesRouter: any;
  private apiRouter: any;
  private middleware: Middleware[] = [];

  constructor(config: RouterConfig = {}) {
    this.config = {
      srcDir: config.srcDir || "src",
      pagesDir: config.pagesDir || "pages",
      apiDir: config.apiDir || "api",
      middlewarePath: config.middlewarePath || "middleware.ts",
    };

    const root = process.cwd();
    const pagesPath = join(root, this.config.srcDir, this.config.pagesDir);
    const apiPath = join(root, this.config.srcDir, this.config.apiDir);

    // Initialize Bun FileSystemRouter for pages if directory exists
    if (fs.existsSync(pagesPath)) {
      this.pagesRouter = new Bun.FileSystemRouter({
        style: "nextjs",
        dir: pagesPath,
      });
    }

    // Initialize Bun FileSystemRouter for API if directory exists
    if (fs.existsSync(apiPath)) {
      this.apiRouter = new Bun.FileSystemRouter({
        style: "nextjs",
        dir: apiPath,
      });
    }

    // Load middleware if exists
    const middlewareFile = join(root, this.config.srcDir, this.config.middlewarePath);
    if (fs.existsSync(middlewareFile)) {
      this.loadMiddleware(middlewareFile);
    }
  }

  private async loadMiddleware(path: string) {
    try {
      const mod = await import(path);
      this.middleware = mod.default || [];
    } catch (err) {
      console.error(`[buncf/router] Failed to load middleware from ${path}:`, err);
    }
  }

  /**
   * Matches a request against API and Page routes.
   */
  public async match(req: Request) {
    const url = new URL(req.url);

    // 1. Check API Routes first
    if (this.apiRouter) {
      // Create a modified request if we need to strip prefix
      let apiReq = req;
      if (url.pathname.startsWith('/api')) {
        const newUrl = new URL(req.url);
        newUrl.pathname = url.pathname.replace(/^\/api/, '');
        if (newUrl.pathname === '') newUrl.pathname = '/';
        apiReq = new Request(newUrl.toString(), req);
      }

      const match = this.apiRouter.match(apiReq);
      if (match) {
        return { type: 'api' as const, match };
      }
    }

    // 2. Check Page Routes
    if (this.pagesRouter) {
      const match = this.pagesRouter.match(req);
      if (match) {
        return { type: 'page' as const, match };
      }
    }

    return null;
  }

  /**
   * Executes middleware for the matched route.
   */
  public async handleMiddleware(req: Request) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    let index = 0;
    const next = async (request: Request): Promise<Response> => {
      if (index >= this.middleware.length) {
        return new Response(null, { status: 200 }); // All middleware passed
      }

      const mw = this.middleware[index++];
      if (mw && this.matchesMatcher(pathname, mw.matcher)) {
        return await mw.handler(request, () => next(request));
      } else {
        return await next(request);
      }
    };

    return await next(req);
  }

  private matchesMatcher(pathname: string, matcher: string | string[] | RegExp): boolean {
    if (typeof matcher === 'string') {
      if (matcher.endsWith('/*')) {
        return pathname.startsWith(matcher.slice(0, -2));
      }
      return pathname === matcher;
    }
    if (Array.isArray(matcher)) {
      return matcher.some(m => this.matchesMatcher(pathname, m));
    }
    if (matcher instanceof RegExp) {
      return matcher.test(pathname);
    }
    return false;
  }

  /**
   * Resolves layouts for a specific file path within the pages directory.
   */
  public async resolveLayouts(filePath: string) {
    const layouts: string[] = [];
    const root = process.cwd();
    const pagesRoot = join(root, this.config.srcDir, this.config.pagesDir);

    let currentDir = dirname(filePath);

    while (currentDir.startsWith(pagesRoot)) {
      const layoutFile = join(currentDir, "_layout.tsx");
      if (fs.existsSync(layoutFile)) {
        layouts.unshift(layoutFile); // Add at the beginning to keep outer-to-inner order
      }

      if (currentDir === pagesRoot) break;
      currentDir = dirname(currentDir);
    }

    return layouts;
  }

  /**
   * Extracts metadata from a list of components (page + layouts).
   */
  public async getMetadata(filePaths: string[]): Promise<MetaDescriptor[]> {
    const metaDescriptors: MetaDescriptor[] = [];

    for (const path of filePaths) {
      try {
        const mod = await import(path);
        if (mod.meta && typeof mod.meta === 'function') {
          const results = mod.meta();
          if (Array.isArray(results)) {
            metaDescriptors.push(...results);
          }
        }
      } catch (err) {
        console.warn(`[buncf/router] Failed to extract metadata from ${path}:`, err);
      }
    }

    return metaDescriptors;
  }
}
