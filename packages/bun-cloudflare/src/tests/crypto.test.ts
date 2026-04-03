import { describe, expect, it } from "bun:test";
import { password } from "../shims/crypto";

describe("Crypto Security", () => {
  it("should produce different hashes for the same password (salted)", async () => {
    const pw = "password123";
    const h1 = await password.hash(pw);
    const h2 = await password.hash(pw);

    expect(h1).not.toBe(h2);
    expect(h1).toStartWith("$pbkdf2$100000$");
    expect(h2).toStartWith("$pbkdf2$100000$");
  });

  it("should verify salted hashes correctly", async () => {
    const pw = "password123";
    const h = await password.hash(pw);

    const isValid = await password.verify(pw, h);
    const isInvalid = await password.verify("wrongpassword", h);

    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);
  });

  it("should maintain backward compatibility with old SHA-256 hashes", async () => {
    const pw = "password123";
    // Old SHA-256 hash of "password123"
    const encoder = new TextEncoder();
    const data = encoder.encode(pw);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const oldHash = Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    const isValid = await password.verify(pw, oldHash);
    const isInvalid = await password.verify("wrongpassword", oldHash);

    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);
  });

  it("should handle different iteration counts if provided in the hash string", async () => {
    const pw = "password123";
    // Manually create a hash with fewer iterations for testing parsing
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const pwData = new TextEncoder().encode(pw);
    const baseKey = await crypto.subtle.importKey("raw", pwData, "PBKDF2", false, ["deriveBits"]);
    const iterations = 1000;
    const derivedKey = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      baseKey,
      256
    );

    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
    const hashHex = Array.from(new Uint8Array(derivedKey)).map(b => b.toString(16).padStart(2, "0")).join("");
    const customHash = `$pbkdf2$${iterations}$${saltHex}$${hashHex}`;

    const isValid = await password.verify(pw, customHash);
    expect(isValid).toBe(true);
  });
});
