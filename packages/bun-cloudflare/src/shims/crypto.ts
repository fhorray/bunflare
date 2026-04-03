/**
 * Partial shim for Bun's Crypto APIs using WebCrypto.
 * Note: Workers support SubtleCrypto natively.
 */

const ITERATIONS = 100_000;
const SALT_LENGTH = 16;

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

export const password = {
  async hash(pw: string, options?: { algorithm?: "argon2id" | "bcrypt" | "pbkdf2" }): Promise<string> {
    const encoder = new TextEncoder();
    const pwData = encoder.encode(pw);

    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const baseKey = await crypto.subtle.importKey(
      "raw",
      pwData,
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: ITERATIONS,
        hash: "SHA-256",
      },
      baseKey,
      256
    );

    const saltHex = arrayBufferToHex(salt.buffer);
    const hashHex = arrayBufferToHex(derivedKey);

    return `$pbkdf2$${ITERATIONS}$${saltHex}$${hashHex}`;
  },

  async verify(pw: string, hash: string): Promise<boolean> {
    if (hash.startsWith("$pbkdf2$")) {
      const parts = hash.split("$");
      if (parts.length !== 5) return false;

      const iterations = parseInt(parts[2] as string, 10);
      const saltHex = parts[3] as string;
      const hashHex = parts[4] as string;

      const encoder = new TextEncoder();
      const pwData = encoder.encode(pw);
      const salt = hexToArrayBuffer(saltHex);

      const baseKey = await crypto.subtle.importKey(
        "raw",
        pwData,
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
      );

      const derivedKey = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: iterations,
          hash: "SHA-256",
        },
        baseKey,
        256
      );

      const newHashHex = arrayBufferToHex(derivedKey);
      return newHashHex === hashHex;
    }

    // Backward compatibility for SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(pw);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const oldHash = arrayBufferToHex(digest);
    return oldHash === hash;
  }
};

export async function hash(data: string | Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = typeof data === "string" ? encoder.encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return arrayBufferToHex(digest);
}
