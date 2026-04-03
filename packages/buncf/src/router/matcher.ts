/**
 * A lightweight, zero-dependency router matcher.
 * Translates Next.js-style file paths into regular expressions.
 */

export interface MatchResult {
  params: Record<string, string>;
}

export function matchPath(pattern: string, pathname: string): MatchResult | null {
  // 1. Static match
  if (pattern === pathname) {
    return { params: {} };
  }

  // 2. Dynamic match
  // Convert [id] to ([^/]+)
  // Convert [...slug] to (.+)
  // Convert [[...slug]] to (.*)
  
  const segments = pattern.split("/").filter(Boolean);
  const pathSegments = pathname.split("/").filter(Boolean);

  // Simple heuristic for now: length check (static segments)
  // For catch-all, we'll need a regex.

  const regexSource = pattern
    .replace(/\//g, "\\/")
    .replace(/\[\[\.\.\.(.+?)\]\]/g, "($1.*)") // Optional catch-all [[...slug]]
    .replace(/\[\.\.\.(.+?)\]/g, "($1.+)")     // Catch-all [...slug]
    .replace(/\[(.+?)\]/g, "([^/]+)");        // Dynamic segment [id]

  const regex = new RegExp(`^${regexSource}$`);
  const match = pathname.match(regex);

  if (!match) return null;

  // Extract params
  const params: Record<string, string> = {};
  const paramNames = (pattern.match(/\[\[?\.\.\.(.+?)\]\]?|\[(.+?)\]/g) || []).map(p => 
    p.replace(/[\[\]]/g, "").replace(/\.\.\./g, "")
  );

  for (let i = 0; i < paramNames.length; i++) {
    params[paramNames[i]] = match[i + 1];
  }

  return { params };
}

/**
 * Basic path-to-regexp style parser for simpler matching.
 */
export function getRouteMatcher(pattern: string) {
  // Root path special case
  if (pattern === "/" || pattern === "") {
    return (path: string) => (path === "/" || path === "" ? { params: {} } : null);
  }

  // Normalize pattern: transform [id] into named group (?<id>[^/]+) etc.
  let regexStr = pattern
    .replace(/\//g, "\\/")
    .replace(/\[\[\.\.\.(.+?)\]\]/g, "(?:\\/(?<$1>.*))?") // Optional catch-all [[...slug]]
    .replace(/\[\.\.\.(.+?)\]/g, "\\/(?<$1>.+)")         // Catch-all [...slug]
    .replace(/\[(.+?)\]/g, "\\/(?<$<$1>[^/]+)");         // Dynamic [id] - wait, naming nested capture groups... 

  // Better approach for Next.js style:
  const parts = pattern.split("/").filter(Boolean);
  const regexParts: string[] = [];
  const paramKeys: string[] = [];

  for (const part of parts) {
    if (part.startsWith("[[...") && part.endsWith("]]")) {
      const key = part.slice(5, -2);
      regexParts.push("(?:\\/(.*))?");
      paramKeys.push(key);
    } else if (part.startsWith("[...") && part.endsWith("]")) {
      const key = part.slice(4, -1);
      regexParts.push("\\/(.+)");
      paramKeys.push(key);
    } else if (part.startsWith("[") && part.endsWith("]")) {
      const key = part.slice(1, -1);
      regexParts.push("\\/([^/]+)");
      paramKeys.push(key);
    } else {
      regexParts.push("\\/" + part);
    }
  }

  const regex = new RegExp(`^${regexParts.join("")}\\/?$`);

  return (pathname: string) => {
    const match = pathname.match(regex);
    if (!match) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < paramKeys.length; i++) {
      params[paramKeys[i]] = match[i + 1] || "";
    }
    return { params };
  };
}
