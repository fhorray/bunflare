import type { ReactNode, ComponentType } from "react";
import type { ZodSchema, z } from "zod";

/**
 * Metadata configuration for a page or layout.
 */
export type MetaDescriptor =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { [key: string]: any };

export type MetaFunction = () => MetaDescriptor[];

/**
 * Page component module.
 */
export interface PageModule {
  default: ComponentType<any>;
  meta?: MetaFunction;
}

/**
 * Layout component module.
 */
export interface LayoutModule {
  default: ComponentType<{ children: ReactNode }>;
  meta?: MetaFunction;
}

/**
 * API Handler configuration.
 */
export type RouteHandler<TParams = any, TResponse = any> = (
  req: Request & { params: TParams }
) => Promise<Response> | Response;

/**
 * API route module.
 */
export interface ApiModule {
  GET?: RouteHandler;
  POST?: RouteHandler;
  PUT?: RouteHandler;
  DELETE?: RouteHandler;
  PATCH?: RouteHandler;
  HEAD?: RouteHandler;
  OPTIONS?: RouteHandler;
}

/**
 * Middleware configuration.
 */
export interface Middleware {
  name: string;
  matcher: string | string[] | RegExp;
  handler: (
    req: Request,
    next: () => Promise<Response> | Response
  ) => Promise<Response> | Response;
}

export type MiddlewareConfig = Middleware[];

/**
 * Server Action configuration.
 */
export interface ServerAction<TInput = any, TOutput = any> {
  (input: TInput): Promise<TOutput>;
  schema: ZodSchema<TInput>;
  handler: (input: TInput, ctx: { request: Request }) => Promise<TOutput>;
}

/**
 * Router configuration.
 */
export interface RouterConfig {
  /**
   * Root directory of the source code.
   * @default "src"
   */
  srcDir?: string;
  /**
   * Directory for page routes relative to srcDir.
   * @default "pages"
   */
  pagesDir?: string;
  /**
   * Directory for API routes relative to srcDir.
   * @default "api"
   */
  apiDir?: string;
  /**
   * Path to the middleware file relative to srcDir.
   * @default "middleware.ts"
   */
  middlewarePath?: string;
}
