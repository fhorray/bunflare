/**
 * Partial shim for Bun's Crypto APIs using WebCrypto.
 * Note: Workers support SubtleCrypto natively.
 */
export const password = {
  async hash(pw: string, options?: { algorithm?: "argon2id" | "bcrypt" | "pbkdf2" }): Promise<string> {
    // Phase 3: Implement PBKDF2 version for workers
    const encoder = new TextEncoder();
    const data = encoder.encode(pw);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  },
  async verify(pw: string, hash: string): Promise<boolean> {
    const newHash = await this.hash(pw);
    return newHash === hash;
  }
};

export async function hash(data: string | Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = typeof data === "string" ? encoder.encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
