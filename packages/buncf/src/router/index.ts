import React from "react";
declare const window: any;
import { BuncfFileSystemRouter } from "./fs-router";
import type { RouteHandler, RouterConfig, ServerAction } from "./types";
import type { ZodSchema } from "zod";

/**
 * Creates a new filesystem router instance.
 */
export function createRouter(config?: RouterConfig) {
  return new BuncfFileSystemRouter(config);
}

/**
 * Type-safe helper to define an API route handler.
 */
export function defineHandler<TParams = any, TResponse = any>(
  handler: RouteHandler<TParams, TResponse>
): RouteHandler<TParams, TResponse> {
  return handler;
}

/**
 * Type-safe helper to define a Server Action with Zod validation.
 */
export function defineAction<TInput, TOutput>(
  schema: ZodSchema<TInput>,
  handler: (input: TInput, ctx: { request: Request }) => Promise<TOutput>
): ServerAction<TInput, TOutput> {
  const action = (async (input: TInput) => {
    return handler(input, { request: {} as any });
  }) as unknown as ServerAction<TInput, TOutput>;
  action.schema = schema;
  action.handler = handler;
  return action;
}

/**
 * Routing Hooks & Components
 */

export function useParams() {
  return {};
}

export function useSearchParams() {
  return [new URLSearchParams(), (params: any) => {}] as const;
}

export function usePathname() {
  return typeof window !== 'undefined' ? window.location.pathname : '';
}

export function useRouter() {
  return {
    push: (url: string) => { if (typeof window !== 'undefined') window.location.href = url; },
    replace: (url: string) => { if (typeof window !== 'undefined') window.location.replace(url); },
    back: () => { if (typeof window !== 'undefined') window.history.back(); },
  };
}

export const Link: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = (props) => {
  return React.createElement("a", {
    ...props,
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (props.onClick) props.onClick(e);
      if (!e.defaultPrevented && props.href && props.href.startsWith('/')) {
        e.preventDefault();
        window.location.href = props.href;
      }
    }
  });
};

export { BuncfFileSystemRouter };
export * from "./types";
