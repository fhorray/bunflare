/**
 * Simple shim for Bun's Cookie utilities.
 */
export const Cookie = {
    parse(cookieString: string): Record<string, string> {
        const cookies: Record<string, string> = {};
        const pairs = cookieString.split(';');
        for (const pair of pairs) {
            const [key, value] = pair.trim().split('=');
            if (key && value) {
                cookies[key] = decodeURIComponent(value);
            }
        }
        return cookies;
    },
    serialize(name: string, value: string, options?: { maxAge?: number, domain?: string, path?: string, secure?: boolean, httpOnly?: boolean }): string {
        let str = `${name}=${encodeURIComponent(value)}`;
        if (options?.maxAge) str += `; Max-Age=${options.maxAge}`;
        if (options?.domain) str += `; Domain=${options.domain}`;
        if (options?.path) str += `; Path=${options.path}`;
        if (options?.secure) str += `; Secure`;
        if (options?.httpOnly) str += `; HttpOnly`;
        return str;
    }
};
